import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioPage } from '../inventario/inventario.page';
import { VentasPage } from '../ventas/ventas.page';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, InventarioPage, VentasPage],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  tab = signal<'inventario' | 'ventas'>('inventario');

  // toma la instancia del hijo inventario cuando esa vista está activa
  @ViewChild('inv') inv?: InventarioPage;

  seleccionar(t: 'inventario' | 'ventas') {
    this.tab.set(t);
  }

  abrirDesdeHeader() {
    this.inv?.abrirCrear();
  }
}
