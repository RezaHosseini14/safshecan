export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
}

export function tomanFromRial(rial: number): number {
  return Math.round(rial / 10);
}

export function formatSignedMs(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}ms`;
}

export function latencyClass(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'text-slate-400';
  if (ms < 15) return 'text-emerald-400';
  if (ms < 50) return 'text-cyan-400';
  if (ms < 150) return 'text-amber-400';
  return 'text-rose-400';
}
