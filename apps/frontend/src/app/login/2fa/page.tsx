'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';

function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('tempToken') || '';
  const returnUrl = searchParams.get('returnUrl') || '/';

  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) {
      router.replace('/login');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await api.auth.login2Fa(tempToken, code.trim());
      if (res.success) {
        window.location.href = returnUrl;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t('invalid2FaCode'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight">{t('totpTitle')}</h1>
          <p className="mt-1 text-xs text-slate-400">{t('totpSubtitle')}</p>
        </div>

        <Card className="border-white/10 bg-[#0f131c]/90 p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold text-slate-300">
                {t('totpCode')}
              </Label>
              <div className="relative">
                <KeyRound className="absolute start-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="code"
                  name="code"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="ps-9 text-center font-mono tracking-widest text-base"
                  placeholder="000000"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !code.trim()}
            >
              {loading ? tc('loading') : t('totpSubmit')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <TwoFactorForm />
    </Suspense>
  );
}
