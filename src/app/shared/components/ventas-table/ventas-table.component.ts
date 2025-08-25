// src/app/shared/components/ventas-table/ventas-table.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';

// ↩️ Ajusta rutas
import { VentaResponse } from '../../../core/model/venta.model';
import { CurrencyColPipe } from '../../pipes/currency-col.pipe';

@Component({
  selector: 'app-ventas-table',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, CurrencyColPipe],
  template: `
  <div class="rounded-2xl border overflow-hidden">
    <div class="flex justify-end p-2">
      <span class="text-xs rounded-full border px-2 py-1 text-gray-600">
        {{ totalToShow }} ventas
      </span>
    </div>

    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr class="text-left text-sm text-gray-500">
          <th class="p-3">Fecha y Hora</th>
          <th class="p-3 text-center">Medicamento</th>
          <th class="p-3">Cantidad</th>
          <th class="p-3">Precio Unitario</th>
          <th class="p-3">Total</th>
        </tr>
      </thead>

      <tbody class="divide-y">
        <tr *ngFor="let v of ventas; trackBy: trackVenta" class="text-sm">
          <td class="p-3 align-top w-40">
            <div>{{ v.fechaHora | date:'dd/MM/yyyy' }}</div>
            <div class="text-xs text-gray-500">{{ v.fechaHora | date:'HH:mm' }}</div>
          </td>

          <td class="p-3 text-center">{{ medicamentoNombre(v) }}</td>
          <td class="p-3">{{ cantidad(v) }}</td>
          <td class="p-3">{{ (valorUnitario(v) | currencyCol) }}</td>
          <td class="p-3 font-semibold text-green-600">{{ (v.valorTotal | currencyCol) }}</td>
        </tr>

        <tr *ngIf="!cargando && ventas.length === 0">
          <td [attr.colspan]="5" class="p-6 text-center text-gray-500">Sin ventas</td>
        </tr>
      </tbody>
    </table>
  </div>
  `
})
export class VentasTableComponent {
  @Input() ventas: VentaResponse[] = [];
  @Input() cargando = false;
  /** Si quieres mostrar un total externo (p.ej. paginado server), pásalo aquí */
  @Input() totalOverride?: number;

  get totalToShow(): number { return typeof this.totalOverride === 'number' ? this.totalOverride : this.ventas.length; }
  trackVenta = (_: number, item: VentaResponse) => (item as any)?.id ?? _;

  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }
  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }
  valorUnitario(v: VentaResponse): number {
    const raw = v?.items?.[0]?.valorUnitario as any;
    if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
    if (typeof raw === 'string') {
      const s = raw.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(s); return isNaN(n) ? 0 : n;
    }
    return 0;
  }
}
