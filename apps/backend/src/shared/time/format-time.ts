export function formatExactTime(date: Date, includeMs = true): string {
  const pad = (value: number, width = 2) => value.toString().padStart(width, '0');
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  if (!includeMs) return clock;
  return `${clock}.${pad(date.getMilliseconds(), 3)}`;
}
