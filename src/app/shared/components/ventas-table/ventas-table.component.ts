// src/app/shared/components/ventas-table/ventas-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
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

    <!-- Paginador custom -->
    <div class="p-2 border-t bg-white flex items-center gap-2">
      <div class="text-sm text-gray-600">
        Página {{ displayPage }} de {{ totalPages }}
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="w-28 h-8 rounded-xl border border-gray-200 px-4 text-sm font-normal text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 inline-flex items-center justify-center"
          [disabled]="isFirstPage"
          (click)="goPrev()"
          aria-label="Anterior">
          Anterior
        </button>

        <button
          type="button"
          class="w-28 h-8 rounded-xl border border-gray-200 px-4 text-sm font-normal text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 inline-flex items-center justify-center"
          [disabled]="isLastPage"
          (click)="goNext()"
          aria-label="Siguiente">
          Siguiente
        </button>
      </div>
    </div>
  </div>
  `
})
export class VentasTableComponent {
  @Input() ventas: VentaResponse[] = [];
  @Input() cargando = false;

  /** Total proveniente del backend (si hay paginación en servidor) */
  @Input() total = 0;
  /** Página actual (0-based) */
  @Input() page = 0;
  /** Tamaño de página */
  @Input() size = 10;

  /** (Compat) para el badge superior si no hay total de backend */
  @Input() totalOverride?: number;

  @Output() pageChange = new EventEmitter<{ page: number; size: number }>();

  // ==== Derivados del paginador ====
  get totalToShow(): number {
    return typeof this.totalOverride === 'number' ? this.totalOverride : this.ventas.length;
  }
  private get totalRecords(): number {
    return this.total || this.totalToShow;
  }
  private get safeSize(): number {
    return this.size && this.size > 0 ? this.size : Math.max(1, this.totalRecords || 1);
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.safeSize));
  }
  get isFirstPage(): boolean {
    return this.page <= 0;
  }
  get isLastPage(): boolean {
    return this.page + 1 >= this.totalPages;
  }
  get displayPage(): number {
    return Math.min(this.page + 1, this.totalPages);
  }

  // ==== Navegación ====
  goPrev(): void {
    if (this.isFirstPage) return;
    this.pageChange.emit({ page: this.page - 1, size: this.safeSize });
  }

  goNext(): void {
    if (this.isLastPage) return;
    this.pageChange.emit({ page: this.page + 1, size: this.safeSize });
  }

  // ==== Tabla ====
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
