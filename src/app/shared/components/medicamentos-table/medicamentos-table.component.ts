// src/app/pages/inventario/components/medicamentos-table/medicamentos-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';

import { MedicamentoResponse } from '../../../core/model/medicamento.model';
import { BadgeStatusComponent } from '../badge-status/badge-status.component';
import { CurrencyColPipe } from '../../pipes/currency-col.pipe';

@Component({
  selector: 'app-medicamentos-table',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, BadgeStatusComponent, CurrencyColPipe],
  template: `
  <div class="rounded-2xl border overflow-hidden">
    <div class="flex justify-end p-2">
      <span class="text-xs rounded-full border px-2 py-1 text-gray-600">
        {{ totalToShow }} medicamentos
      </span>
    </div>

    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr class="text-left text-sm text-gray-500">
          <th class="p-3">Medicamento</th>
          <th class="p-3">Laboratorio</th>
          <th class="p-3">Fabricación</th>
          <th class="p-3">Vencimiento</th>
          <th class="p-3">Stock</th>
          <th class="p-3">Precio</th>
          <th class="p-3">Estado</th>
          <th class="p-3">Acciones</th>
        </tr>
      </thead>

      <tbody class="divide-y">
        <tr *ngFor="let m of medicamentos; trackBy: trackRow" class="text-sm">
          <td class="p-3 font-medium">{{ m.nombre }}</td>

          <!-- Si laboratorioNombre es string seguro, no uses ??; usa || para cubrir cadena vacía -->
          <td class="p-3">{{ m.laboratorioNombre || m.laboratorioId }}</td>

          <td class="p-3">{{ fmt(m.fechaFabricacion) }}</td>

          <td class="p-3">
            <div class="flex items-center gap-2">
              <svg *ngIf="isVencido(m.fechaVencimiento) || isPorVencer(m.fechaVencimiento)"
                   xmlns="http://www.w3.org/2000/svg"
                   class="w-4 h-4"
                   [ngClass]="{
                     'text-red-500': isVencido(m.fechaVencimiento),
                     'text-amber-500': !isVencido(m.fechaVencimiento)
                   }"
                   viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.6c.75 1.336-.213 3.001-1.742 3.001H3.48c-1.53 0-2.492-1.665-1.742-3l6.518-11.6zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                      clip-rule="evenodd"/>
              </svg>
              <span
                [class.text-red-600]="isVencido(m.fechaVencimiento)"
                [class.text-amber-600]="!isVencido(m.fechaVencimiento) && isPorVencer(m.fechaVencimiento)">
                {{ fmt(m.fechaVencimiento) }}
              </span>
            </div>
          </td>

          <td class="p-3">
            <span [class.text-red-600]="m.cantidadStock === 0 || m.cantidadStock < lowStockThreshold">
              {{ m.cantidadStock }}
            </span>
          </td>

          <td class="p-3 font-semibold">{{ m.valorUnitario | currencyCol }}</td>

          <td class="p-3">
            <app-badge-status
              [status]="m.cantidadStock === 0 ? 'agotado' : (m.cantidadStock < lowStockThreshold ? 'bajo' : 'ok')">
            </app-badge-status>
          </td>

          <td class="p-3">
            <div class="flex items-center gap-2 text-gray-600">
              <button class="p-2 rounded-lg hover:bg-gray-100" title="Vender" aria-label="Vender" (click)="vender.emit(m)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.084.835l.383 1.437M7.5 14.25h9.75m0 0l1.5-6.75H5.103m2.397 6.75L6.75 6.75m12 11.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                </svg>
              </button>

              <button class="p-2 rounded-lg hover:bg-gray-100" title="Editar" aria-label="Editar" (click)="editar.emit(m)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M16.862 4.487l1.651 1.651m-9.193 9.193l-3.32.369.37-3.32 9.192-9.193a1.75 1.75 0 112.476 2.476l-9.192 9.193z"/>
                </svg>
              </button>

              <button class="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Eliminar" aria-label="Eliminar" (click)="eliminar.emit(m)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M6 7h12m-9 0V5a1 1 0 011-1h2a1 1 0 011 1v2m6 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>

        <tr *ngIf="!loading && medicamentos.length === 0">
          <td [attr.colspan]="8" class="p-6 text-center text-gray-500">Sin resultados</td>
        </tr>
      </tbody>
    </table>
  </div>
  `
})
export class MedicamentosTableComponent {
  @Input() medicamentos: MedicamentoResponse[] = [];
  @Input() loading = false;
  @Input() lowStockThreshold = 10;
  @Input() totalOverride?: number;

  @Output() vender   = new EventEmitter<MedicamentoResponse>();
  @Output() editar   = new EventEmitter<MedicamentoResponse>();
  @Output() eliminar = new EventEmitter<MedicamentoResponse>();

  get totalToShow(): number {
    return typeof this.totalOverride === 'number' ? this.totalOverride : this.medicamentos.length;
  }

  trackRow = (_: number, m: MedicamentoResponse) => m?.id ?? _;

  // ======= helpers fecha/estado =======
  private today = new Date();

  fmt(d?: string | Date | null): string {
    const dt = this.toDate(d);
    return dt ? new Intl.DateTimeFormat('es-CO').format(dt) : '—';
  }

  isVencido(d?: string | Date | null): boolean {
    const fecha = this.toDate(d);
    if (!fecha) return false;
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const t = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    return f < t;
  }

  isPorVencer(d?: string | Date | null): boolean {
    const fecha = this.toDate(d);
    if (!fecha) return false;
    const hoy = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);
    return fecha >= hoy && fecha <= limite;
  }

  private toDate(d?: string | Date | null): Date | null {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const iso = new Date(d);
      return isNaN(iso.getTime()) ? null : iso;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('/').map(Number);
      const parsed = new Date(yyyy, mm - 1, dd);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const any = new Date(d);
    return isNaN(any.getTime()) ? null : any;
  }
}
