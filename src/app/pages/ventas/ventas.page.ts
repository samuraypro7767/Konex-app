import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { VentasService } from '../../core/services/ventas.service';
import { VentaResponse } from '../../core/model/venta.model';

// Reutilizables
import { CardMetricComponent } from '../../shared/components/card-metric/card-metric.component';
import { CurrencyColPipe } from '../../shared/pipes/currency-col.pipe';
import { VentasFiltrosComponent } from './components/ventas-filtros/ventas-filtros.component';

@Component({
  standalone: true,
  selector: 'app-ventas-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardMetricComponent,
    CurrencyColPipe,
    VentasFiltrosComponent
  ],
  templateUrl: './ventas.page.html'
})
export class VentasPage implements OnInit {
  /** Muestra/oculta el header propio de la página cuando se reusa embebida. */
  @Input() showHeader = true;

  /** Servicio de dominio para consultar ventas. */
  private service = inject(VentasService);

  /** Bandera de carga general de la vista. */
  cargando = signal(false);

  /** Lista de ventas renderizada en la tabla. */
  ventas = signal<VentaResponse[]>([]);

  // ====== MÉTRICAS GENERALES ======

  /** Cantidad total de ventas (sobre el arreglo visible). */
  totalVentas   = computed(() => this.ventas().length);

  /** Suma de `valorTotal` de todas las ventas cargadas. */
  ingresosTot   = computed(() =>
    this.ventas().reduce((a, v) => a + (v.valorTotal || 0), 0)
  );

  /**
   * Promedio por venta (redondeado).
   * Retorna `0` cuando no hay ventas.
   */
  promedioVenta = computed(() =>
    this.totalVentas() ? Math.round(this.ingresosTot() / this.totalVentas()) : 0
  );

  // ====== MÉTRICA: INGRESOS DEL MES ACTUAL ======

  /** Referencia al "ahora" (se usa para comparar mes/año). */
  private now = new Date();

  /** True si `d` pertenece al mismo mes/año que `now`. */
  private sameMonth(d: Date) {
    return d.getFullYear() === this.now.getFullYear() && d.getMonth() === this.now.getMonth();
  }

  /**
   * Intenta parsear `fechaHora` (ISO esperado) a `Date`.
   * Devuelve `null` si es inválida.
   */
  private parseFechaHora(fh: string) {
    // asume ISO; si viniera en otro formato, ajústalo aquí
    const d = new Date(fh);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Suma `valorTotal` solo de ventas cuya `fechaHora` cae en el mes actual. */
  ingresosMes = computed(() =>
    this.ventas().reduce((acc, v) => {
      const d = this.parseFechaHora(v.fechaHora);
      return d && this.sameMonth(d) ? acc + (v.valorTotal || 0) : acc;
    }, 0)
  );

  /** Texto amigable del mes actual (por ejemplo: "agosto de 2025"). */
  mesHint = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.now)
  );

  // ====== CICLO DE VIDA ======

  /** Carga inicial de todas las ventas. */
  ngOnInit(): void {
    this.cargarTodas();
  }

  // ====== CARGA DE DATOS ======

  /** Consulta al backend todas las ventas y actualiza `ventas`. */
  private cargarTodas() {
    this.cargando.set(true);
    this.service.listarTodas().subscribe({
      next: (res) => this.ventas.set(res || []),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false),
    });
  }

  // ====== HELPERS PARA TABLA (primera línea del detalle) ======

  /** Nombre del medicamento de la primera línea de detalle. */
  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }

  /**
   * Nombre del laboratorio de la primera línea (si tu backend no lo envía en `items`,
   * aquí se usa `any` como workaround).
   */
  laboratorioNombre(v: VentaResponse): string {
    const it: any = v?.items?.[0];
    return it?.laboratorioNombre ?? '—';
  }

  /** Cantidad vendida de la primera línea. */
  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }

  /** Precio unitario de la primera línea. */
  valorUnitario(v: VentaResponse): number {
    return v?.items?.[0]?.valorUnitario ?? 0;
  }

  /** `trackBy` para filas de la tabla de ventas. */
  trackVenta = (_: number, item: VentaResponse) => item?.id ?? _;

  // ====== FILTROS ======

  /**
   * Handler de búsqueda por rango. Si el rango no es válido, no dispara la llamada.
   * @param rango Fechas con formato `YYYY-MM-DD`.
   */
  onBuscar(rango: { desde: string; hasta: string }) {
    if (!rango?.desde || !rango?.hasta) return;
    this.cargando.set(true);
    this.service.listarPorRango(rango.desde, rango.hasta).subscribe({
      next: (res) => this.ventas.set(res || []),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false)
    });
  }

  /** Limpia filtros y recarga todas las ventas. */
  onLimpiar() {
    this.cargarTodas();
  }
}
