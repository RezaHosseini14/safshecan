import speech from '../messages/fa/speech.json' with { type: 'json' };

function at(table: Record<string, string>, index: number): string {
  return table[String(index)] ?? '';
}

function threeDigits(value: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  if (hundred > 0) parts.push(at(speech.hundreds, hundred));
  if (rest >= 10 && rest < 20) parts.push(at(speech.teens, rest - 10));
  else {
    const ten = Math.floor(rest / 10);
    const one = rest % 10;
    if (ten > 0) parts.push(at(speech.tens, ten));
    if (one > 0) parts.push(at(speech.ones, one));
  }
  return parts.join(speech.join);
}

/** Whole numbers as spoken Persian, so a voice does not spell digits. */
export function spokenCardinal(value: number): string {
  if (!Number.isFinite(value)) return '';
  const negative = value < 0;
  let rest = Math.trunc(Math.abs(value));
  if (rest === 0) return speech.zero;
  const parts: string[] = [];
  let scale = 0;
  while (rest > 0 && scale <= 4) {
    const chunk = rest % 1000;
    if (chunk > 0) {
      const words = threeDigits(chunk);
      const scaleWord = scale === 0 ? '' : at(speech.scales, scale);
      const piece = !scaleWord || (chunk === 1 && scale === 1) ? scaleWord || words : `${words} ${scaleWord}`;
      parts.unshift(piece);
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  const body = parts.join(speech.join);
  return negative ? `${speech.minus.trim()} ${body}` : body;
}

export function spokenDecimal(whole: string, fraction: string): string {
  const head = spokenCardinal(Number(whole || '0'));
  const trimmed = fraction.replace(/0+$/, '');
  if (!trimmed) return head;
  const tail = trimmed.startsWith('0')
    ? trimmed
        .split('')
        .map((digit) => (digit === '0' ? speech.zero : at(speech.ones, Number(digit))))
        .join(' ')
    : spokenCardinal(Number(trimmed));
  return `${head}${speech.point}${tail}`;
}
