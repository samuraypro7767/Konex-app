import { Component, ViewChild, signal, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioPage } from '../inventario/inventario.page';
import { VentasPage } from '../ventas/ventas.page';

type NotiType = 'danger' | 'warning' | 'info';
interface Notificacion {
  id: string;
  title: string;
  detail?: string;
  type: NotiType;
  createdAt: Date;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, InventarioPage, VentasPage],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements AfterViewInit {
  tab = signal<'inventario' | 'ventas'>('inventario');

  // instancia del hijo inventario (cuando está activo)
  @ViewChild('inv') inv?: InventarioPage;

  // notificaciones
  showNotif = signal(false);
  notifs = signal<Notificacion[]>([]);
  unread = signal(0);

  seleccionar(t: 'inventario' | 'ventas') {
    this.tab.set(t);
    // cuando volvemos a inventario, actualizamos indicador
    if (t === 'inventario') {
      setTimeout(() => this.syncUnreadFromAlerts(), 0);
    } else {
      // si no estamos en inventario, solo cerramos el panel
      this.showNotif.set(false);
    }
  }

  abrirDesdeHeader() {
    this.inv?.abrirCrear();
  }

  ngAfterViewInit(): void {
    // pequeño delay para dar tiempo a que inventario cargue
    setTimeout(() => this.syncUnreadFromAlerts(), 500);
  }

  // click fuera -> cerrar panel
  @HostListener('document:click')
  onDocumentClick() {
    this.showNotif.set(false);
  }

  // ----- Notificaciones -----
  toggleNotifs(ev?: MouseEvent) {
    ev?.stopPropagation();
    if (!this.showNotif()) {
      // al abrir: refrescamos y marcamos como leídas
      this.refreshAlertsFromChild();
      this.showNotif.set(true);
      this.unread.set(0);
    } else {
      this.showNotif.set(false);
    }
  }

  trackNotif = (_: number, n: Notificacion) => n.id;

  private syncUnreadFromAlerts() {
    const arr = this.buildAlerts();
    this.notifs.set(arr);
    this.unread.set(arr.length);
  }

  private refreshAlertsFromChild() {
    const arr = this.buildAlerts();
    this.notifs.set(arr);
  }

  /** Construye las alertas a partir de las filas visibles del inventario */
  private buildAlerts(): Notificacion[] {
    const inv = this.inv;
    const rows = inv?.rows() ?? [];
    const out: Notificacion[] = [];

    for (const m of rows) {
      // stock
      if ((m.cantidadStock ?? 0) === 0) {
        out.push({
          id: `stock-0-${m.id}`,
          title: `Agotado: ${m.nombre}`,
          detail: `No hay unidades disponibles.`,
          type: 'danger',
          createdAt: new Date(),
        });
      } else if ((m.cantidadStock ?? 0) < 10) {
        out.push({
          id: `stock-bajo-${m.id}`,
          title: `Stock bajo: ${m.nombre}`,
          detail: `Quedan ${m.cantidadStock} unidades.`,
          type: 'warning',
          createdAt: new Date(),
        });
      }

      // vencimiento
      if (inv?.isVencido(m.fechaVencimiento)) {
        out.push({
          id: `vencido-${m.id}`,
          title: `Vencido: ${m.nombre}`,
          detail: `Venció el ${inv.fmt(m.fechaVencimiento)}.`,
          type: 'danger',
          createdAt: new Date(),
        });
      } else if (inv?.isPorVencer(m.fechaVencimiento)) {
        out.push({
          id: `por-vencer-${m.id}`,
          title: `Por vencer: ${m.nombre}`,
          detail: `Vence el ${inv.fmt(m.fechaVencimiento)} (≤ 30 días).`,
          type: 'warning',
          createdAt: new Date(),
        });
      }
    }

    // orden opcional: las críticas primero
    out.sort((a, b) => {
      const prio = (t: NotiType) => (t === 'danger' ? 0 : t === 'warning' ? 1 : 2);
      return prio(a.type) - prio(b.type);
    });

    return out;
  }
}
