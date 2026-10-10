import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { locale, messages, t } from '@saf-shekan/i18n';
import { CommandPanel } from '../src/features/console/command-panel';

describe('armed disarm control', () => {
  it('keeps an emergency stop reachable while the engine is armed', () => {
    const onDisarm = vi.fn();
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <CommandPanel
          engineState="ARMED"
          antiDoubleSpend
          loading={false}
          onToggleAntiDoubleSpend={() => undefined}
          onArm={() => undefined}
          onDisarm={onDisarm}
          onTestShot={() => undefined}
        />
      </NextIntlClientProvider>
    );
    screen.getByRole('button', { name: t('console', 'disarm') }).click();
    expect(onDisarm).toHaveBeenCalledOnce();
  });
});
