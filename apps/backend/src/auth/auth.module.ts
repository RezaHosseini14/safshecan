import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { CryptoKeysService } from './crypto-keys.service.js';
import { TotpService } from './totp.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { CsrfGuard } from './csrf.guard.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    CryptoKeysService,
    TotpService,
    AuthGuard,
    PermissionsGuard,
    CsrfGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    CryptoKeysService,
    TotpService,
    AuthGuard,
    PermissionsGuard,
    CsrfGuard,
  ],
})
export class AuthModule {}
