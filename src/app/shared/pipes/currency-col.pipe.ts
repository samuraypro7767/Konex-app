import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCol', standalone: true })
export class CurrencyColPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
