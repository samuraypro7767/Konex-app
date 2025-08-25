import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VentasService, Page as PageResp, PageReq } from '../../core/services/ventas.service';
import { VentaResponse } from '../../core/model/venta.model';
import { NgxSpinnerModule } from 'ngx-spinner';

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
    VentasTableComponent,
    NgxSpinnerModule,
  ],
  templateUrl: './ventas.page.html'
})
export class VentasPage implements OnInit {
  @Input() showHeader = true;

  private service = inject(VentasService);

  // estado UI
  cargando = signal(false);

  // datos visibles (solo la página actual)
  ventas = signal<VentaResponse[]>([]);

  // paginación
  page = signal(0);   // 0-based
  size = signal(10);
  total = signal(0);

  // filtro actual (null = todas)
  filtro = signal<{ desde: string; hasta: string } | null>(null);

  // ================== KPIs (sobre la página actual) ==================
  totalVentas = computed(() => this.ventas().length);
  ingresosTot = computed(() =>
    this.ventas().reduce((acc, v) => acc + this.toNumber(v?.valorTotal), 0)
  );
  promedioVenta = computed(() =>
    this.totalVentas() ? Math.round(this.ingresosTot() / this.totalVentas()) : 0
  );

  // ================== Ciclo de vida ==================
  ngOnInit(): void {
    this.cargarPagina();
  }

  // ================== Carga de datos ==================
  private cargarPagina() {
    this.cargando.set(true);

    // request paginado (sin readonly en sort)
    const req: PageReq = { page: this.page(), size: this.size(), sort: ['fechaHora,desc'] };

    const obs = this.filtro()
      ? this.service.listarPorRangoPaged(this.filtro()!.desde, this.filtro()!.hasta, req)
      : this.service.listarTodasPaged(req);

    obs.subscribe({
      next: (p: PageResp<VentaResponse>) => {
        this.ventas.set(p.content ?? []);
        this.total.set(p.totalElements ?? 0);
      },
      error: () => {
        this.ventas.set([]);
        this.total.set(0);
      },
      complete: () => this.cargando.set(false),
    });
  }

  /** Buscar por rango y reemplazar filas de la misma tabla */
  onBuscar(rango: { desde: string; hasta: string }) {
    if (!rango?.desde || !rango?.hasta) return;
    this.filtro.set({ desde: rango.desde, hasta: rango.hasta });
    this.page.set(0); // reset a primera página
    this.cargarPagina();
  }

  /** Limpiar filtros = volver a cargar todo */
  onLimpiar() {
    this.filtro.set(null);
    this.page.set(0);
    this.cargarPagina();
  }

  /** Evento del paginador del componente de tabla */
  onPageChange(e: { page: number; size: number }) {
    this.page.set(e.page);
    this.size.set(e.size);
    this.cargarPagina();
  }

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
}
