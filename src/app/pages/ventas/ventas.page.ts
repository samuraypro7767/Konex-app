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
  @Input() showHeader = true;

  private service = inject(VentasService);

  cargando = signal(false);
  ventas = signal<VentaResponse[]>([]);

  // métricas generales
  totalVentas   = computed(() => this.ventas().length);
  ingresosTot   = computed(() => this.ventas().reduce((a, v) => a + (v.valorTotal || 0), 0));
  promedioVenta = computed(() =>
    this.totalVentas() ? Math.round(this.ingresosTot() / this.totalVentas()) : 0
  );

  // >>> MÉTRICA: Ingresos del mes <<<
  private now = new Date();
  private sameMonth(d: Date) {
    return d.getFullYear() === this.now.getFullYear() && d.getMonth() === this.now.getMonth();
  }
  private parseFechaHora(fh: string) {
    // asume ISO; si viniera en otro formato, ajústalo aquí
    const d = new Date(fh);
    return isNaN(d.getTime()) ? null : d;
  }
  ingresosMes = computed(() =>
    this.ventas().reduce((acc, v) => {
      const d = this.parseFechaHora(v.fechaHora);
      return d && this.sameMonth(d) ? acc + (v.valorTotal || 0) : acc;
    }, 0)
  );
  mesHint = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.now)
  );

  ngOnInit(): void {
    this.cargarTodas();

  }

  private cargarTodas() {
    this.cargando.set(true);
    this.service.listarTodas().subscribe({
      next: (res) => this.ventas.set(res || []),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false),
    });
  }

  // helpers para tabla
  medicamentoNombre(v: VentaResponse): string {
    return v?.items?.[0]?.medicamentoNombre ?? '—';
  }
  laboratorioNombre(v: VentaResponse): string {
    const it: any = v?.items?.[0];
    return it?.laboratorioNombre ?? '—';
  }
  cantidad(v: VentaResponse): number {
    return v?.items?.[0]?.cantidad ?? 0;
  }
  valorUnitario(v: VentaResponse): number {
    return v?.items?.[0]?.valorUnitario ?? 0;
  }

  trackVenta = (_: number, item: VentaResponse) => item?.id ?? _;

  onBuscar(rango: { desde: string; hasta: string }) {
    if (!rango?.desde || !rango?.hasta) return;
    this.cargando.set(true);
    this.service.listarPorRango(rango.desde, rango.hasta).subscribe({
      next: (res) => this.ventas.set(res || []),
      error: () => this.ventas.set([]),
      complete: () => this.cargando.set(false)
    });
  }

  onLimpiar() {
    this.cargarTodas();
  }
}
