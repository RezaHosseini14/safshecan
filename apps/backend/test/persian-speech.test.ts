import { describe, expect, it } from 'vitest';
import { spokenCardinal, spokenDecimal, t } from '@saf-shekan/i18n';
import { buildPersianSsml, secMsGec, toPersianSpeech } from '../src/market/persian-speech.js';

describe('persian speech text', () => {
  it('reads numbers as Persian words', () => {
    const spoken = toPersianSpeech('شاخص RSI برابر +12,345.5 و تغییر -2.25 درصد است.');
    expect(spoken).toContain(t('speech', 'rsi'));
    expect(spoken).toContain(`${t('speech', 'plus')}${spokenCardinal(12345)}${t('speech', 'point')}${spokenCardinal(5)}`);
    expect(spoken).toContain(`${t('speech', 'minus')}${spokenCardinal(2)}${t('speech', 'point')}${spokenCardinal(25)}`);
    expect(spoken).not.toMatch(/[A-Za-z]/);
    expect(spoken).not.toMatch(/[0-9]/);
    expect(spokenCardinal(1000)).toBe(t('speech', 'scales.1'));
    expect(spokenCardinal(21)).toBe(`${t('speech', 'tens.2')}${t('speech', 'join')}${t('speech', 'ones.1')}`);
    expect(spokenCardinal(96880)).toBe(
      `${t('speech', 'tens.9')}${t('speech', 'join')}${t('speech', 'ones.6')} ${t('speech', 'scales.1')}${t('speech', 'join')}${t('speech', 'hundreds.8')}${t('speech', 'join')}${t('speech', 'tens.8')}`,
    );
    expect(spokenDecimal('1', '05')).toBe(
      `${t('speech', 'ones.1')}${t('speech', 'point')}${t('speech', 'zero')} ${t('speech', 'ones.5')}`,
    );
    expect(spokenDecimal('1', '50')).toBe(`${t('speech', 'ones.1')}${t('speech', 'point')}${t('speech', 'ones.5')}`);
  });

  it('puts only escaped Persian text inside the fixed Persian voice', () => {
    const ssml = buildPersianSsml('شاخص RSI <tag> & 12');
    expect(ssml).toContain(`<voice name='fa-IR-DilaraNeural'>`);
    expect(ssml).toContain("xml:lang='fa-IR'");
    expect(ssml).toContain("rate='-8%'");
    expect(ssml).toContain('&lt;tag&gt;');
    expect(ssml).toContain('&amp;');
    expect(ssml).not.toContain('<tag>');
    expect(ssml).not.toContain('RSI');
    const plain = buildPersianSsml('شاخص RSI برابر 10 است').replace(/<[^>]+>/g, '');
    expect(plain).toContain(t('speech', 'rsi'));
    expect(plain).toContain(spokenCardinal(10));
    expect(plain).not.toMatch(/[A-Za-z]/);
    expect(plain).not.toMatch(/[0-9]/);
  });

  it('builds a stable speech token from the clock', () => {
    expect(secMsGec(1_700_000_000)).toBe(secMsGec(1_700_000_050));
    expect(secMsGec(1_700_000_000)).toMatch(/^[A-F0-9]{64}$/);
    expect(secMsGec(1_700_000_000)).not.toBe(secMsGec(1_700_000_300));
  });
});
