import { Component, Input } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { VentaResponse } from '../../../../core/model/venta.model';

/**
 * Tabla simple y reutilizable para mostrar un arreglo de ventas.
 *
 * - Recibe por `@Input()` el arreglo `ventas`.
 * - Expone helpers para acceder al primer ítem del detalle sin casts en la plantilla.
 * - Incluye un `getter` `total` para mostrar el conteo de filas.
 *
 * ⚠️ Nota: si en el futuro cada venta puede tener múltiples ítems y
 * quieres mostrarlos, considera:
 *  - Renderizar una fila expandible por venta (accordion),
 *  - o una subtabla dentro de la fila principal.
 */
@Component({
  selector: 'app-ventas-table',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './ventas-table.component.html',
})
export class VentasTableComponent {
  /**
   * Lista de ventas a renderizar.
   * Debe venir ya filtrada/ordenada desde el contenedor.
   */
  @Input() ventas: VentaResponse[] = [];

  /**
   * Total de ventas (conveniente para encabezados/footers).
   */
  get total(): number {
    return this.ventas.length;
  }

  // ========== Helpers de plantilla ==========
  // Evitan `?.[0]` repetido y casts a `any` dentro del HTML.

  /**
   * Devuelve el nombre del medicamento del primer ítem del detalle.
   * @param v VentaResponse
   * @returns Nombre o '—' si no existe información.
   */
  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }

  /**
   * Devuelve el nombre del laboratorio del primer ítem.
   * Si el backend aún no lo provee en `items`, retorna '—'.
   * @param v VentaResponse
   */
  laboratorioNombre(v: VentaResponse): string {
    // Si más adelante agregas laboratorioNombre al item, esto lo mostrará;
    // si no existe, devolvemos '—'
    const item: any = v?.items?.[0];
    return item?.laboratorioNombre ?? '—';
  }

  /**
   * Cantidad vendida (primer ítem).
   * @param v VentaResponse
   */
  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }

  /**
   * Precio unitario (primer ítem).
   * @param v VentaResponse
   */
  valorUnitario(v: VentaResponse): number {
    return v?.items?.[0]?.valorUnitario ?? 0;
  }

  /**
   * (Opcional) Úsalo como `trackBy` en el `*ngFor` del template
   * para mejorar rendimiento cuando la lista es grande.
   */
  // trackVenta = (_: number, row: VentaResponse) => row?.id ?? _;
}
