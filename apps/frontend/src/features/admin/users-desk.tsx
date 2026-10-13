'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, RefreshCw, ShieldAlert, UserCheck, UserX, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, ApiError } from '@/lib/api';

interface ManagedUser {
  id: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  roles: string[];
  createdAt: string;
}

export function UsersDesk() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'trader' | 'viewer'>('trader');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.getUsers();
      if (res.users) setUsers(res.users);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await api.auth.createUser({
        username: newUsername.trim(),
        password: newPassword,
        fullName: newFullName.trim() || undefined,
        role: newRole,
      });

      if (res.success) {
        setDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setNewRole('trader');
        void fetchUsers();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) setSubmitError(err.message);
      else setSubmitError(t('invalidCredentials'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    try {
      await api.auth.toggleUser(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">{t('usersManagement')}</h1>
          <p className="text-xs text-slate-400">{t('usersSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchUsers()}
            disabled={loading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-3.5 w-3.5" />
                {t('createUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createUser')}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {submitError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="create-username" className="text-xs text-slate-300">
                    {t('username')}
                  </Label>
                  <Input
                    id="create-username"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-pwd" className="text-xs text-slate-300">
                    {t('password')}
                  </Label>
                  <Input
                    id="create-pwd"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-fullname" className="text-xs text-slate-300">
                    {t('fullName')}
                  </Label>
                  <Input
                    id="create-fullname"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">{t('role')}</Label>
                  <Select
                    value={newRole}
                    onValueChange={(val) => setNewRole(val as 'admin' | 'trader' | 'viewer')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                      <SelectItem value="trader">{t('roleTrader')}</SelectItem>
                      <SelectItem value="viewer">{t('roleViewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? tc('loading') : t('createUser')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('username')}</TableHead>
              <TableHead>{t('fullName')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('twoFactorAuth')}</TableHead>
              <TableHead className="text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs font-bold text-white">
                  {u.username}
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  {u.fullName || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {u.roles.map((r) => (
                      <Badge
                        key={r}
                        variant={r === 'admin' ? 'rose' : r === 'trader' ? 'emerald' : 'muted'}
                        className="uppercase font-mono text-[10px]"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'emerald' : 'rose'}>
                    {u.isActive ? t('statusActive') : t('statusInactive')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.totpEnabled ? 'cyan' : 'muted'}>
                    {u.totpEnabled ? t('statusActive') : t('statusInactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    type="button"
                    variant={u.isActive ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        {t('disable')}
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        {t('enable')}
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
