import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateRangeValidator(ctrl: AbstractControl): ValidationErrors | null {
  const desde = ctrl.get('desde')?.value;
  const hasta = ctrl.get('hasta')?.value;
  if (!desde || !hasta) return null;

  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  return d1 <= d2 ? null : { dateRange: 'La fecha de inicio no puede ser mayor que la fecha de fin' };
}
