'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  KeyRound,
  Laptop,
  LogOut,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, ApiError } from '@/lib/api';

interface UserInfo {
  id: string;
  username: string;
  fullName: string | null;
  roles: string[];
}

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export function ProfileDesk() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [user, setUser] = useState<UserInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // 2FA state
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);

  const fetchProfileAndSessions = async () => {
    try {
      const meRes = await api.auth.getMe();
      if (meRes.user) setUser(meRes.user);

      setLoadingSessions(true);
      const sessRes = await api.auth.getSessions();
      if (sessRes.sessions) setSessions(sessRes.sessions);
    } catch {
      // handled
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    void fetchProfileAndSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError(t('passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setPwdError(t('passwordTooShort'));
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdSuccess(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setPwdError(err.message);
      else setPwdError(t('oldPasswordIncorrect'));
    } finally {
      setPwdLoading(false);
    }
  };

  const handleStart2Fa = async () => {
    setTotpError(null);
    setTotpSuccess(null);
    setTotpLoading(true);
    try {
      const res = await api.auth.setup2Fa();
      if (res.success) {
        setTotpSetup({
          secret: res.secret,
          otpauthUrl: res.otpauthUrl,
          recoveryCodes: res.recoveryCodes,
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setTotpError(err.message);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleConfirm2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);
    setTotpSuccess(null);
    setTotpLoading(true);

    try {
      const res = await api.auth.confirm2Fa(totpCode.trim());
      if (res.success) {
        setTotpSuccess(res.message);
        setTotpSetup(null);
        setTotpCode('');
        void fetchProfileAndSessions();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setTotpError(err.message);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.auth.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // handled
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.auth.revokeAllSessions();
      window.location.href = '/login';
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">{t('profileTitle')}</h1>
          <p className="text-xs text-slate-400">{t('profileSubtitle')}</p>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">{user.fullName || user.username}</span>
            <div className="flex gap-1">
              {user.roles.map((r) => (
                <Badge key={r} variant="emerald" className="uppercase font-mono text-[10px]">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Password Change Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <KeyRound className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-200">{t('changePassword')}</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {pwdSuccess ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            ) : null}
            {pwdError ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor="current-pwd" className="text-xs text-slate-300">
                {t('currentPassword')}
              </Label>
              <Input
                id="current-pwd"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={pwdLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-pwd" className="text-xs text-slate-300">
                {t('newPassword')}
              </Label>
              <Input
                id="new-pwd"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pwdLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm-pwd" className="text-xs text-slate-300">
                {t('confirmNewPassword')}
              </Label>
              <Input
                id="confirm-pwd"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={pwdLoading}
              />
            </div>

            <Button type="submit" disabled={pwdLoading || !currentPassword || !newPassword}>
              {pwdLoading ? tc('loading') : t('updatePasswordButton')}
            </Button>
          </form>
        </Card>

        {/* 2FA Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200">{t('twoFactorAuth')}</h2>
            </div>
            <Badge variant="cyan">{t('twoFactorAuth')}</Badge>
          </div>

          {totpSuccess ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{totpSuccess}</span>
            </div>
          ) : null}
          {totpError ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{totpError}</span>
            </div>
          ) : null}

          {!totpSetup ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-400">
                {t('totpSubtitle')}
              </p>
              <Button type="button" variant="outline" onClick={handleStart2Fa} disabled={totpLoading}>
                {totpLoading ? tc('loading') : t('enable2Fa')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConfirm2Fa} className="space-y-4">
              <p className="text-xs text-slate-300">{t('manualSecretKey')}</p>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 text-center font-mono text-sm tracking-wider text-cyan-400" dir="ltr">
                {totpSetup.secret}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-amber-400">{t('recoveryCodesPrompt')}</p>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 font-mono text-xs text-amber-300" dir="ltr">
                  {totpSetup.recoveryCodes.map((code) => (
                    <div key={code} className="p-1 text-center bg-black/30 rounded border border-white/5">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="totp-confirm-code" className="text-xs text-slate-300">
                  {t('totpCode')}
                </Label>
                <Input
                  id="totp-confirm-code"
                  type="text"
                  required
                  autoFocus
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="text-center font-mono tracking-widest"
                  disabled={totpLoading}
                />
              </div>

              <Button type="submit" disabled={totpLoading || !totpCode.trim()}>
                {totpLoading ? tc('loading') : t('totpSubmit')}
              </Button>
            </form>
          )}
        </Card>
      </div>

      {/* Active Sessions Card */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-2 border-b border-white/5 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">{t('activeSessions')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchProfileAndSessions()}
              disabled={loadingSessions}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllSessions}
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('revokeAllSessions')}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('ip')}</TableHead>
                <TableHead>{t('device')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
                <TableHead>{t('expiresAt')}</TableHead>
                <TableHead className="text-end">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-cyan-400" dir="ltr">
                    {s.ipAddress || '—'}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-slate-400">
                    {s.userAgent || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400" dir="ltr">
                    {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400" dir="ltr">
                    {new Date(s.expiresAt).toLocaleDateString('fa-IR')}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      onClick={() => handleRevokeSession(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('revokeSession')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
