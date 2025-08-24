import { Routes } from '@angular/router';
import { InventarioPage } from './pages/inventario/inventario.page';
import { VentasPage } from './pages/ventas/ventas.page';

export const routes: Routes = [
     { path: '', redirectTo: 'inventario', pathMatch: 'full' },
  { path: 'inventario', component: InventarioPage },
  { path: 'ventas', component: VentasPage },
];
