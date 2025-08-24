import { Component, Input } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { VentaResponse } from '../../../../core/model/venta.model';

@Component({
  selector: 'app-ventas-table',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './ventas-table.component.html',
})
export class VentasTableComponent {
  @Input() ventas: VentaResponse[] = [];

  get total() {
    return this.ventas.length;
  }

  // Helpers para evitar casts en la plantilla
  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }

  laboratorioNombre(v: VentaResponse): string {
    // Si más adelante agregas laboratorioNombre al item, esto lo mostrará;
    // si no existe, devolvemos '—'
    const item: any = v?.items?.[0];
    return item?.laboratorioNombre ?? '—';
  }

  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }

  valorUnitario(v: VentaResponse): number {
    return v?.items?.[0]?.valorUnitario ?? 0;
  }
}
