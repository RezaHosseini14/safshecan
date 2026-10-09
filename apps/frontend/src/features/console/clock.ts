export function clockToMs(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const fraction = (match[4] || '0').padEnd(3, '0').slice(0, 3);
  return Number(match[1]) * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1000 + Number(fraction);
}

export function formatDuration(ms: number): { clock: string; fraction: string } {
  const safe = Math.max(0, ms);
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const fraction = String(safe % 1000).padStart(3, '0');
  const clock = [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
  return { clock, fraction };
}
