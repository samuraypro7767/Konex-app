import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { VentasService } from '../../core/services/ventas.service';
import { VentaResponse } from '../../core/model/venta.model';

@Component({
  standalone: true,
  selector: 'app-ventas-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.page.html'
})
export class VentasPage {
  // ✅ inyecta primero
  private fb = inject(FormBuilder);

  // ✅ ahora sí puedes crear el form aquí
  filtro = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
  });

  ventas: VentaResponse[] = [];
  cargando = false;

  // métricas simples
  get totalVentas() { return this.ventas.length; }
  get ingresosTotales() { return this.ventas.reduce((a, v) => a + (v.valorTotal || 0), 0); }
  get promedioVenta() { return this.totalVentas ? Math.round(this.ingresosTotales / this.totalVentas) : 0; }

  // ✅ quita fb del constructor
  constructor(private service: VentasService) {}

  buscar() {
    const { desde, hasta } = this.filtro.getRawValue();
    if (!desde || !hasta) return;
    this.cargando = true;
    this.service.listarPorRango(desde, hasta).subscribe({
      next: (res) => this.ventas = res || [],
      complete: () => this.cargando = false
    });
  }

  limpiar() {
    this.filtro.reset({ desde: '', hasta: '' });
    this.ventas = [];
  }
}
