'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle, Shield, Trash2 } from 'lucide-react';
import { validateCurlString } from '../lib/security';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CurlParserCardProps {
  onParseCurl: (curl: string) => Promise<void>;
  detectedBroker?: string;
  isAuthReady?: boolean;
}

const DEMO_TADBIR = `curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \\
  -H 'Content-Type: application/json;charset=UTF-8' \\
  --data-raw '{"Isin":"IRO1FAZR0001","Price":25000,"Quantity":500,"OrderSide":65}'`;

const DEMO_MOFID = `curl 'https://easytrader.emofid.com/core/api/order' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"symbolISIN":"IRO1FAZR0001","price":25000,"quantity":500,"side":"BUY"}'`;

export function CurlParserCard({
  onParseCurl,
  detectedBroker = 'CUSTOM',
  isAuthReady = false,
}: CurlParserCardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [curlText, setCurlText] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleParse = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateCurlString(curlText);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'دستور نامعتبر است');
      return;
    }

    setParsing(true);
    try {
      await onParseCurl(curlText);
      setSuccessMessage('دستور cURL با موفقیت پردازش و پارامترها استخراج شدند.');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در تحلیل دستور cURL');
    } finally {
      setParsing(false);
    }
  };

  const handleClear = () => {
    setCurlText('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header / Accordion Toggle */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-auto px-5 py-4 rounded-none bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] flex items-center justify-between text-xs text-foreground transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-500 dark:text-sky-400">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-foreground text-sm">ورود مشخصات از طریق cURL مرورگر</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="secondary">
            BROKER: {detectedBroker.toUpperCase()}
          </Badge>

          <Badge variant={isAuthReady ? 'default' : 'amber'}>
            <Shield className="w-3 h-3" />
            AUTH: {isAuthReady ? 'READY' : 'PENDING'}
          </Badge>

          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </Button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-5 border-t border-border space-y-4 bg-black/[0.02] dark:bg-black/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            از تب Network مرورگر روی درخواست ارسال سفارش کارگزاری، راست‌کلیک کرده و گزینه{' '}
            <strong className="text-foreground">
              Copy as cURL
            </strong>{' '}
            را بزنید و سپس در کادر زیر قرار دهید.
          </p>

          <textarea
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            rows={4}
            placeholder="curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' -H 'Authorization: Bearer ...' --data-raw '{...}'"
            className="w-full p-3.5 glass-input text-foreground font-mono text-xs rounded-xl focus:outline-none leading-relaxed resize-y"
          />

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">نمونه‌های پیش‌فرض:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurlText(DEMO_TADBIR)}
                className="font-mono text-[10px] h-7"
              >
                نمونه تدبیر
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurlText(DEMO_MOFID)}
                className="font-mono text-[10px] h-7"
              >
                نمونه مفید
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!curlText}
                className="text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک‌سازی</span>
              </Button>

              <Button
                type="button"
                variant="cyan"
                size="sm"
                onClick={handleParse}
                disabled={parsing || !curlText.trim()}
                className="text-xs font-bold"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{parsing ? 'در حال تحلیل...' : 'استخراج و تنظیم خودکار'}</span>
              </Button>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
