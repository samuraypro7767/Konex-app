import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validador de rango de fechas para un `FormGroup` con campos `desde` y `hasta`.
 *
 * Comportamiento:
 * - Si alguno de los dos campos está vacío, **no valida** el rango (retorna `null`);
 *   deja que el `Validators.required` se encargue de eso.
 * - Normaliza las fechas a medianoche **en hora local** para evitar corrimientos por UTC.
 * - Si `desde` > `hasta`, retorna un error con la clave `dateRange`.
 *
 * Uso:
 * ```ts
 * this.form = this.fb.group({
 *   desde: ['', Validators.required],
 *   hasta: ['', Validators.required],
 * }, { validators: dateRangeValidator });
 * ```
 */
export function dateRangeValidator(ctrl: AbstractControl): ValidationErrors | null {
  const desde = ctrl.get('desde')?.value;
  const hasta = ctrl.get('hasta')?.value;
  if (!desde || !hasta) return null; // que required se encargue

  const d1 = toLocalDateOnly(desde);
  const d2 = toLocalDateOnly(hasta);

  // Si alguna fecha es inválida, no bloqueamos aquí (otro validador puede manejarlo)
  if (!d1 || !d2) return null;

  return d1.getTime() <= d2.getTime()
    ? null
    : { dateRange: 'La fecha de inicio no puede ser mayor que la fecha de fin' };
}

/** 
 * Convierte un string `YYYY-MM-DD` o un `Date` a un `Date` en **medianoche local**.
 * Devuelve `null` si no se puede parsear.
 */
function toLocalDateOnly(value: unknown): Date | null {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string') {
    // Si viene en YYYY-MM-DD, parseo manual para evitar UTC.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) {
      const y = +m[1], mo = +m[2] - 1, d = +m[3];
      const dt = new Date(y, mo, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
    // Último recurso: Date nativo (puede depender de la zona/hora)
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return null;
}
