/** Formatea un Date a YYYY-MM-DD usando la hora local (sin UTC). */
function formatLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Similar a `toIsoDate`, pero más segura ante zonas horarias e inputs inválidos.
 * - Devuelve '' si la fecha no es válida.
 * - Si el string ya es `YYYY-MM-DD`, lo retorna sin tocar.
 * - Para otros casos, usa formato **local** (evita corrimientos por UTC).
 */
export function toIsoDateSafe(d: string | Date): string {
  if (typeof d === 'string') {
    // Si ya viene en formato fecha sin hora, no lo muevas.
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '';
    return formatLocal(parsed);
  }
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return formatLocal(d);
}
