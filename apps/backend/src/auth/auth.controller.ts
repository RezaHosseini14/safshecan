import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public, RequirePermissions } from './decorators.js';
import type { AuthenticatedUser } from './auth.types.js';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { t } from '@saf-shekan/i18n';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  role?: 'admin' | 'trader' | 'viewer';
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class Login2FaDto {
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @IsString()
  @IsNotEmpty()
  code!: string; // 6-digit TOTP code or recovery code
}

export class Confirm2FaDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

@ApiTags('Authentication & Sessions')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(
      body.username,
      body.password,
      ip,
      userAgent
    );

    // If 2FA is required, do NOT set access cookies yet
    if (result.requires2Fa) {
      return {
        success: true,
        requires2Fa: true,
        tempToken: result.tempToken,
      };
    }

    if (result.response && result.refreshToken) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', result.response.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: result.response.expiresInSeconds * 1000,
        path: '/',
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      return {
        success: true,
        user: result.response.user,
      };
    }

    return { success: false };
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete two-factor authentication login' })
  async login2Fa(
    @Body() body: Login2FaDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { response, refreshToken } = await this.authService.complete2FaLogin(
      body.tempToken,
      body.code
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', response.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: response.expiresInSeconds * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return {
      success: true,
      user: response.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token cookie' })
  async refresh(
    @Body() body: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const token =
      req.cookies?.refresh_token ||
      body.refreshToken ||
      (req.headers['x-refresh-token'] as string);

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: t('auth', 'tokenNotFound'),
      });
    }

    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const { response, newRefreshToken } = await this.authService.refreshToken(
      token,
      ip,
      userAgent
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', response.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: response.expiresInSeconds * 1000,
      path: '/',
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return {
      success: true,
      user: response.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId?: string
  ) {
    const token = req.cookies?.refresh_token;
    if (token) {
      await this.authService.logout(token, userId);
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });

    return {
      success: true,
      message: t('auth', 'loggedOut'),
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      user,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions for current user' })
  async listSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.listActiveSessions(userId);
    return {
      success: true,
      sessions,
    };
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string
  ) {
    const revoked = await this.authService.revokeSession(userId, sessionId);
    return {
      success: revoked,
      message: revoked ? t('auth', 'sessionRevoked') : t('auth', 'sessionNotFound'),
    };
  }

  @Post('sessions/revoke-all')
  @ApiOperation({ summary: 'Revoke all sessions (Log out all devices)' })
  async revokeAllSessions(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.revokeAllSessions(userId);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return {
      success: true,
      message: t('auth', 'allSessionsRevoked'),
    };
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Initialize TOTP 2FA setup' })
  async setup2Fa(@CurrentUser('id') userId: string) {
    const setup = await this.authService.setup2Fa(userId);
    return {
      success: true,
      ...setup,
    };
  }

  @Post('2fa/confirm')
  @ApiOperation({ summary: 'Confirm TOTP 2FA setup with token' })
  async confirm2Fa(
    @CurrentUser('id') userId: string,
    @Body() body: Confirm2FaDto
  ) {
    const confirmed = await this.authService.confirm2Fa(userId, body.token);
    return {
      success: confirmed,
      message: t('auth', 'totpActivated'),
    };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for current user' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: ChangePasswordDto
  ) {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return {
      success: true,
      message: t('auth', 'passwordChanged'),
    };
  }

  @Get('users')
  @RequirePermissions('admin:manage_users')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async listUsers() {
    const users = await this.authService.listUsers();
    return {
      success: true,
      users,
    };
  }

  @Post('users')
  @RequirePermissions('admin:manage_users')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  async createUser(@Body() body: CreateUserDto) {
    const user = await this.authService.createUser(
      body.username,
      body.password,
      body.fullName,
      body.role || 'trader'
    );
    return {
      success: true,
      user,
    };
  }

  @Post('users/:id/toggle')
  @RequirePermissions('admin:manage_users')
  @ApiOperation({ summary: 'Toggle user active/inactive status (Admin only)' })
  async toggleUser(
    @Param('id') targetUserId: string,
    @Body('active') active: boolean
  ) {
    await this.authService.toggleUserStatus(targetUserId, active);
    return {
      success: true,
    };
  }
}
