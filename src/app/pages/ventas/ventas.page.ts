import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VentasService } from '../../core/services/ventas.service';
import { VentaResponse } from '../../core/model/venta.model';

// Reutilizables
import { CardMetricComponent } from '../../shared/components/card-metric/card-metric.component';
import { CurrencyColPipe } from '../../shared/pipes/currency-col.pipe';
import { VentasFiltrosComponent } from './components/ventas-filtros/ventas-filtros.component';
import { VentasTableComponent } from '../../shared/components/ventas-table/ventas-table.component';

@Component({
  standalone: true,
  selector: 'app-ventas-page',
  imports: [
    CommonModule,
    CardMetricComponent,
    CurrencyColPipe,
    VentasFiltrosComponent,
    VentasTableComponent
  ],
  templateUrl: './ventas.page.html'
})
export class VentasPage implements OnInit {
  @Input() showHeader = true;

  private service = inject(VentasService);

  cargando = signal(false);

  /** Siempre guardamos un **array** aquí (nunca Page ni objeto). */
  ventas = signal<VentaResponse[]>([]);

  // ================== KPIs ==================
  totalVentas = computed(() => this.ventas().length);

  ingresosTot = computed(() =>
    this.ventas().reduce((acc, v) => acc + this.toNumber(v?.valorTotal), 0)
  );

  promedioVenta = computed(() =>
    this.totalVentas() ? Math.round(this.ingresosTot() / this.totalVentas()) : 0
  );

  // ================== Ciclo de vida ==================
  ngOnInit(): void {
    this.cargarTodas();
  }

  // ================== Carga de datos ==================
  private cargarTodas() {
    this.cargando.set(true);
    this.service.listarTodas().subscribe({
      next: (res) => this.ventas.set(this.normalizeVentas(res)),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false),
    });
  }

  /** Buscar por rango y reemplazar filas de la misma tabla */
  onBuscar(rango: { desde: string; hasta: string }) {
    if (!rango?.desde || !rango?.hasta) return;
    this.cargando.set(true);
    this.service.listarPorRango(rango.desde, rango.hasta).subscribe({
      next: (res) => this.ventas.set(this.normalizeVentas(res)),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false),
    });
  }

  /** Limpiar filtros = volver a cargar todo */
  onLimpiar() {
    this.cargarTodas();
  }

  // ================== Helpers tabla ==================
  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }
  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }
  valorUnitario(v: VentaResponse): number {
    return this.toNumber(v?.items?.[0]?.valorUnitario);
  }
  trackVenta = (_: number, item: VentaResponse) => (item as any)?.id ?? _;

  // ================== Utilidades ==================
  /** Convierte valores monetarios que puedan venir como string/number a number seguro. */
  private toNumber(x: unknown): number {
    if (typeof x === 'number') return isFinite(x) ? x : 0;
    if (typeof x === 'string') {
      // limpia "$ 1.234,56" -> "1234.56"
      const s = x.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  /**
   * Acepta distintas formas de respuesta del backend y SIEMPRE devuelve un array.
   * - Array directo
   * - Page-like { content: [...] }
   * - Wrapper { data: [...] }
   * - { items: [...] } (por si acaso)
   * En cualquier otro caso: [].
   */
  private normalizeVentas(res: any): VentaResponse[] {
    if (Array.isArray(res)) return res as VentaResponse[];
    if (Array.isArray(res?.content)) return res.content as VentaResponse[];
    if (Array.isArray(res?.data)) return res.data as VentaResponse[];
    if (Array.isArray(res?.items)) return res.items as VentaResponse[];
    return [];
  }
}
