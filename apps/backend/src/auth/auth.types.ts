export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  user: AuthenticatedUser;
  accessToken: string;
  expiresInSeconds: number;
}
