import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DatabaseService } from '../infrastructure/database/database.service.js';
import * as schema from '../infrastructure/database/schema/index.js';
import { PasswordService } from './password.service.js';
import { CryptoKeysService } from './crypto-keys.service.js';
import { TotpService } from './totp.service.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { EnvelopeCipherService } from '../infrastructure/security/envelope-cipher.service.js';
import { t } from '@saf-shekan/i18n';
import type { AuthenticatedUser, JwtPayload, LoginResponse } from './auth.types.js';

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export interface LoginResult {
  requires2Fa?: boolean;
  tempToken?: string;
  response?: LoginResponse;
  refreshToken?: string;
}

export interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly cryptoKeysService: CryptoKeysService,
    private readonly totpService: TotpService,
    private readonly redisService: RedisService,
    private readonly cipher: EnvelopeCipherService
  ) {}

  public async login(
    username: string,
    passwordPlain: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    const db = this.dbService.db;
    const clientIp = ipAddress || 'unknown';

    // 1. IP and Account rate limit check in Redis
    const ipRateKey = `safshekan:ratelimit:login:ip:${clientIp}`;
    const userRateKey = `safshekan:ratelimit:login:user:${username.toLowerCase()}`;

    const ipAttempts = (await this.redisService.get<number>(ipRateKey)) || 0;
    if (ipAttempts >= 20) {
      throw new ForbiddenException(t('auth', 'rateLimitExceeded'));
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.username, username), sql`${schema.users.deletedAt} IS NULL`));

    // Generic error to prevent username enumeration
    if (!user || !user.isActive) {
      await this.recordFailedAttempt(clientIp, username);
      throw new UnauthorizedException(t('auth', 'invalidCredentials'));
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new ForbiddenException(t('auth', 'accountLocked'));
    }

    const isMatch = await this.passwordService.verify(user.passwordHash, passwordPlain);
    if (!isMatch) {
      const newFailed = user.failedLoginAttempts + 1;
      const lockedUntil =
        newFailed >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
          : null;

      await db
        .update(schema.users)
        .set({ failedLoginAttempts: newFailed, lockedUntil })
        .where(eq(schema.users.id, user.id));

      await this.recordFailedAttempt(clientIp, username);

      await db.insert(schema.auditLogs).values({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        ipAddress,
        userAgent,
        details: { attempts: newFailed },
      });

      throw new UnauthorizedException(t('auth', 'invalidCredentials'));
    }

    // Reset failed counter on successful password validation
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await db
        .update(schema.users)
        .set({ failedLoginAttempts: 0, lockedUntil: null })
        .where(eq(schema.users.id, user.id));
    }
    await this.redisService.del(userRateKey);

    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);

    // 2. 2FA Check: If TOTP is enabled or user is an admin
    if (user.totpEnabled) {
      const tempToken = crypto.randomBytes(32).toString('hex');
      await this.redisService.set(`safshekan:temp2fa:${tempToken}`, { userId: user.id, ipAddress, userAgent }, 300); // 5 minutes TTL
      return {
        requires2Fa: true,
        tempToken,
      };
    }

    // If admin has not set up 2FA yet, allow initial login but issue requirement notice
    const authUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roles,
      permissions,
    };

    const accessToken = this.cryptoKeysService.signAccessToken(
      {
        sub: user.id,
        username: user.username,
        roles,
        permissions,
      },
      ACCESS_TOKEN_TTL
    );

    const refreshToken = await this.createSession(user.id, ipAddress, userAgent);

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
    });

    return {
      response: {
        user: authUser,
        accessToken,
        expiresInSeconds: ACCESS_TOKEN_TTL,
      },
      refreshToken,
    };
  }

  public async complete2FaLogin(
    tempToken: string,
    totpOrRecoveryCode: string
  ): Promise<{ response: LoginResponse; refreshToken: string }> {
    const db = this.dbService.db;
    const sessionData = await this.redisService.get<{ userId: string; ipAddress?: string; userAgent?: string }>(
      `safshekan:temp2fa:${tempToken}`
    );

    if (!sessionData) {
      throw new UnauthorizedException(t('auth', 'invalid2FaSession'));
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, sessionData.userId), sql`${schema.users.deletedAt} IS NULL`));

    if (!user || !user.totpSecretEncrypted) {
      throw new UnauthorizedException(t('auth', 'totpNotConfigured'));
    }

    const decryptedSecret = this.cipher.decrypt(user.totpSecretEncrypted);
    const code = totpOrRecoveryCode.trim();

    let verified = this.totpService.verifyTotpToken(decryptedSecret, code);

    // If TOTP check fails, check recovery codes
    if (!verified && user.totpRecoveryCodesHash && Array.isArray(user.totpRecoveryCodesHash)) {
      const recoveryResult = this.totpService.verifyAndConsumeRecoveryCode(
        code,
        user.totpRecoveryCodesHash
      );
      if (recoveryResult.valid) {
        verified = true;
        // Update database with remaining recovery codes
        await db
          .update(schema.users)
          .set({ totpRecoveryCodesHash: recoveryResult.remainingHashedCodes })
          .where(eq(schema.users.id, user.id));

        await db.insert(schema.auditLogs).values({
          userId: user.id,
          action: 'AUTH_2FA_RECOVERY_CODE_USED',
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
        });
      }
    }

    if (!verified) {
      throw new UnauthorizedException(t('auth', 'invalid2FaCode'));
    }

    // Clean up temp token
    await this.redisService.del(`safshekan:temp2fa:${tempToken}`);

    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);
    const authUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roles,
      permissions,
    };

    const accessToken = this.cryptoKeysService.signAccessToken(
      {
        sub: user.id,
        username: user.username,
        roles,
        permissions,
      },
      ACCESS_TOKEN_TTL
    );

    const refreshToken = await this.createSession(user.id, sessionData.ipAddress, sessionData.userAgent);

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: 'AUTH_2FA_LOGIN_SUCCESS',
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
    });

    return {
      response: {
        user: authUser,
        accessToken,
        expiresInSeconds: ACCESS_TOKEN_TTL,
      },
      refreshToken,
    };
  }

  public async refreshToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ response: LoginResponse; newRefreshToken: string }> {
    const db = this.dbService.db;
    const tokenHash = this.hashToken(rawRefreshToken);

    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.refreshTokenHash, tokenHash));

    if (!session) {
      throw new UnauthorizedException(t('auth', 'invalidSession'));
    }

    // REUSE DETECTION: If an already-revoked token is used, revoke the ENTIRE user session family!
    if (session.isRevoked) {
      this.logger.error(`SECURITY ALERT: Refresh token reuse detected for user ${session.userId}. Revoking family.`);
      await db
        .update(schema.sessions)
        .set({ isRevoked: true })
        .where(eq(schema.sessions.userId, session.userId));

      await db.insert(schema.auditLogs).values({
        userId: session.userId,
        action: 'AUTH_TOKEN_REUSE_DETECTED',
        ipAddress,
        userAgent,
        details: { sessionId: session.id },
      });

      throw new UnauthorizedException(t('auth', 'sessionFamilyRevoked'));
    }

    if (new Date(session.expiresAt) <= new Date()) {
      throw new UnauthorizedException(t('auth', 'sessionExpired'));
    }

    // Revoke old session (Rotation)
    await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.id, session.id));

    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, session.userId), sql`${schema.users.deletedAt} IS NULL`));

    if (!user || !user.isActive) {
      throw new UnauthorizedException(t('auth', 'userDisabled'));
    }

    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);
    const authUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roles,
      permissions,
    };

    const newAccessToken = this.cryptoKeysService.signAccessToken(
      {
        sub: user.id,
        username: user.username,
        roles,
        permissions,
      },
      ACCESS_TOKEN_TTL
    );

    const newRefreshToken = await this.createSession(user.id, ipAddress, userAgent);

    return {
      response: {
        user: authUser,
        accessToken: newAccessToken,
        expiresInSeconds: ACCESS_TOKEN_TTL,
      },
      newRefreshToken,
    };
  }

  public async logout(rawRefreshToken: string, userId?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const db = this.dbService.db;
    const tokenHash = this.hashToken(rawRefreshToken);

    await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.refreshTokenHash, tokenHash));

    if (userId) {
      await db.insert(schema.auditLogs).values({
        userId,
        action: 'AUTH_LOGOUT',
      });
    }
  }

  public async listActiveSessions(userId: string): Promise<SessionInfo[]> {
    const db = this.dbService.db;
    const rows = await db
      .select({
        id: schema.sessions.id,
        ipAddress: schema.sessions.ipAddress,
        userAgent: schema.sessions.userAgent,
        createdAt: schema.sessions.createdAt,
        expiresAt: schema.sessions.expiresAt,
      })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          eq(schema.sessions.isRevoked, false),
          sql`${schema.sessions.expiresAt} > now()`
        )
      )
      .orderBy(desc(schema.sessions.createdAt));

    return rows.map((r) => ({
      id: r.id,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  public async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const db = this.dbService.db;
    const result = await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.userId, userId)))
      .returning();

    return result.length > 0;
  }

  public async revokeAllSessions(userId: string): Promise<void> {
    const db = this.dbService.db;
    await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.userId, userId));

    await db.insert(schema.auditLogs).values({
      userId,
      action: 'AUTH_ALL_SESSIONS_REVOKED',
    });
  }

  public async setup2Fa(userId: string): Promise<{ secret: string; otpauthUrl: string; recoveryCodes: string[] }> {
    const db = this.dbService.db;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!user) throw new BadRequestException(t('auth', 'userNotFound'));

    const { secret, otpauthUrl } = this.totpService.generateSecret(user.username);
    const { plainCodes, hashedCodes } = this.totpService.generateRecoveryCodes();

    // Temporarily save encrypted secret in Redis until confirmed
    const encryptedSecret = this.cipher.encrypt(secret);
    await this.redisService.set(`safshekan:2fa_pending:${userId}`, { encryptedSecret, hashedCodes }, 600);

    return { secret, otpauthUrl, recoveryCodes: plainCodes };
  }

  public async confirm2Fa(userId: string, token: string): Promise<boolean> {
    const db = this.dbService.db;
    const pending = await this.redisService.get<{ encryptedSecret: string; hashedCodes: string[] }>(
      `safshekan:2fa_pending:${userId}`
    );

    if (!pending) {
      throw new BadRequestException(t('auth', 'totpSetupExpired'));
    }

    const secret = this.cipher.decrypt(pending.encryptedSecret);
    const isValid = this.totpService.verifyTotpToken(secret, token);

    if (!isValid) {
      throw new BadRequestException(t('auth', 'invalid2FaCode'));
    }

    await db
      .update(schema.users)
      .set({
        totpSecretEncrypted: pending.encryptedSecret,
        totpEnabled: true,
        totpRecoveryCodesHash: pending.hashedCodes,
      })
      .where(eq(schema.users.id, userId));

    await this.redisService.del(`safshekan:2fa_pending:${userId}`);

    await db.insert(schema.auditLogs).values({
      userId,
      action: 'AUTH_2FA_ENABLED',
    });

    return true;
  }

  public verifyAccessToken(token: string): JwtPayload {
    return this.cryptoKeysService.verifyAccessToken(token);
  }

  public async createAdmin(
    username: string,
    passwordPlain: string,
    fullName = 'System Administrator'
  ): Promise<schema.User> {
    const db = this.dbService.db;

    if (!username || !passwordPlain || passwordPlain.length < 8) {
      throw new BadRequestException(t('auth', 'passwordValidation'));
    }

    const existing = await db.query.users?.findFirst({
      where: eq(schema.users.username, username),
    });

    if (existing) {
      throw new BadRequestException(t('auth', 'userExists', { username }));
    }

    const passwordHash = await this.passwordService.hash(passwordPlain);
    const [user] = await db
      .insert(schema.users)
      .values({
        username,
        passwordHash,
        fullName,
        isActive: true,
      })
      .returning();

    const adminRole = await db.query.roles?.findFirst({
      where: eq(schema.roles.name, 'admin'),
    });

    if (adminRole) {
      await db.insert(schema.userRoles).values({
        userId: user.id,
        roleId: adminRole.id,
      });
    }

    this.logger.log(`Created system administrator via CLI: ${username}`);
    return user;
  }

  public async changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<boolean> {
    const db = this.dbService.db;
    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), sql`${schema.users.deletedAt} IS NULL`));

    if (!user) {
      throw new BadRequestException(t('auth', 'userNotFound'));
    }

    const isMatch = await this.passwordService.verify(user.passwordHash, currentPasswordPlain);
    if (!isMatch) {
      throw new BadRequestException(t('auth', 'oldPasswordIncorrect'));
    }

    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw new BadRequestException(t('auth', 'passwordTooShort'));
    }

    const newHash = await this.passwordService.hash(newPasswordPlain);
    await db
      .update(schema.users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await db.insert(schema.auditLogs).values({
      userId,
      action: 'AUTH_PASSWORD_CHANGED',
    });

    return true;
  }

  public async listUsers() {
    const db = this.dbService.db;
    const usersList = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.users.fullName,
        isActive: schema.users.isActive,
        totpEnabled: schema.users.totpEnabled,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(sql`${schema.users.deletedAt} IS NULL`)
      .orderBy(desc(schema.users.createdAt));

    const result = [];
    for (const u of usersList) {
      const { roles } = await this.getUserRolesAndPermissions(u.id);
      result.push({
        ...u,
        roles,
        createdAt: u.createdAt.toISOString(),
      });
    }

    return result;
  }

  public async createUser(
    username: string,
    passwordPlain: string,
    fullName?: string,
    roleName: 'admin' | 'trader' | 'viewer' = 'trader'
  ) {
    const db = this.dbService.db;

    if (!username || !passwordPlain || passwordPlain.length < 8) {
      throw new BadRequestException(t('auth', 'passwordValidation'));
    }

    const existing = await db.query.users?.findFirst({
      where: eq(schema.users.username, username),
    });

    if (existing) {
      throw new BadRequestException(t('auth', 'userExists', { username }));
    }

    const passwordHash = await this.passwordService.hash(passwordPlain);
    const [user] = await db
      .insert(schema.users)
      .values({
        username,
        passwordHash,
        fullName: fullName || null,
        isActive: true,
      })
      .returning();

    const role = await db.query.roles?.findFirst({
      where: eq(schema.roles.name, roleName),
    });

    if (role) {
      await db.insert(schema.userRoles).values({
        userId: user.id,
        roleId: role.id,
      });
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      isActive: user.isActive,
      role: roleName,
    };
  }

  public async toggleUserStatus(userId: string, active: boolean) {
    const db = this.dbService.db;
    await db
      .update(schema.users)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    return true;
  }

  private async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const db = this.dbService.db;
    const rawRefreshToken = crypto.randomBytes(32).toString('hex'); // 256-bit random opaque token
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(schema.sessions).values({
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      isRevoked: false,
      expiresAt,
    });

    return rawRefreshToken;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async recordFailedAttempt(ip: string, username: string): Promise<void> {
    const ipKey = `safshekan:ratelimit:login:ip:${ip}`;
    const userKey = `safshekan:ratelimit:login:user:${username.toLowerCase()}`;

    const ipCount = (await this.redisService.get<number>(ipKey)) || 0;
    await this.redisService.set(ipKey, ipCount + 1, 900); // 15 min TTL

    const userCount = (await this.redisService.get<number>(userKey)) || 0;
    await this.redisService.set(userKey, userCount + 1, 900);
  }

  public async getUserRolesAndPermissions(
    userId: string
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const db = this.dbService.db;

    const userRolesRows = await db
      .select({
        roleName: schema.roles.name,
        roleId: schema.roles.id,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));

    const roles = userRolesRows.map((r) => r.roleName);
    const roleIds = userRolesRows.map((r) => r.roleId);

    if (roleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    const permissionRows = await db
      .select({
        permissionName: schema.permissions.name,
      })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(sql`${schema.rolePermissions.roleId} IN ${roleIds}`);

    const permissions = Array.from(new Set(permissionRows.map((p) => p.permissionName)));
    return { roles, permissions };
  }
}
