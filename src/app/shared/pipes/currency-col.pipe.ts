import { Pipe, PipeTransform } from '@angular/core';

/**
 * `currencyCol`
 * -------------
 * Formatea un número como moneda **COP** con locale **es-CO**.
 *
 * - Sin decimales (usa `maximumFractionDigits: 0`).
 * - Acepta `number | string | null | undefined`.
 * - `null`/`undefined` → se interpretan como `0`.
 *
 * ### Ejemplos
 * ```ts
 * // En plantilla:
 * {{ 1250000 | currencyCol }}        // → "$ 1.250.000"
 * {{ '34990'  | currencyCol }}       // → "$ 34.990"
 * {{ null     | currencyCol }}       // → "$ 0"
 * ```
 *
 * **Nota:** Si la entrada no es convertible a número (p. ej. `"abc"`), `Number('abc')`
 * produce `NaN` y el resultado será la cadena `"NaN"`. Si quieres evitarlo,
 * considera validar/limpiar el dato antes o aplicar una mejora (ver tips abajo).
 */
@Pipe({ name: 'currencyCol', standalone: true })
export class CurrencyColPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }
}
