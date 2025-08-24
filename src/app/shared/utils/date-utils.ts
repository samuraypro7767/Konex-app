export function toIsoDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  // yyyy-mm-dd (sin zona)
  return date.toISOString().slice(0, 10);
}
