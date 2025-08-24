import { Component, ViewChild, signal, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioPage } from '../inventario/inventario.page';
import { VentasPage } from '../ventas/ventas.page';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';

/** Tipos de severidad para notificaciones del dashboard. */
type NotiType = 'danger' | 'warning' | 'info';

/**
 * Modelo de notificación mostrada en el panel lateral del dashboard.
 * Se genera a partir del estado visible del Inventario (stock y vencimientos).
 */
interface Notificacion {
  /** Identificador único (estable por tipo de alerta + id de medicamento). */
  id: string;
  /** Título corto de la notificación. */
  title: string;
  /** Texto opcional con más detalle. */
  detail?: string;
  /** Severidad de la notificación. */
  type: NotiType;
  /** Marca temporal de creación. */
  createdAt: Date;
}

/**
 * Página principal de **Dashboard**:
 * - Contiene pestañas: **Inventario** y **Ventas**.
 * - Muestra un panel de **notificaciones** derivadas del Inventario:
 *   - Stock agotado / bajo.
 *   - Medicamentos vencidos / por vencer (≤ 30 días).
 * - Reenvía acciones al hijo de Inventario (abrir diálogo "Crear").
 *
 * Dependencias en el hijo `InventarioPage`:
 * - `rows()` (lista visible)
 * - `isVencido()`, `isPorVencer()`, `fmt()` (helpers de fecha/estado)
 * - `abrirCrear()` (acción desde el header)
 */
@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, InventarioPage, VentasPage,Toast,ConfirmDialog],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements AfterViewInit {
  /** Pestaña activa del dashboard. */
  tab = signal<'inventario' | 'ventas'>('inventario');

  /** Referencia al componente hijo de inventario (cuando está montado). */
  @ViewChild('inv') inv?: InventarioPage;

  // -------- Estado de notificaciones --------

  /** Visibilidad del panel de notificaciones. */
  showNotif = signal(false);

  /** Lista de notificaciones actuales. */
  notifs = signal<Notificacion[]>([]);

  /** Contador de no leídas (se resetea al abrir el panel). */
  unread = signal(0);

  /**
   * Selecciona pestaña y sincroniza notificaciones cuando se vuelve a inventario.
   * @param t Nombre de la pestaña.
   */
  seleccionar(t: 'inventario' | 'ventas') {
    this.tab.set(t);
    // al volver a inventario, refresca el indicador de no leídas
    if (t === 'inventario') {
      setTimeout(() => this.syncUnreadFromAlerts(), 0);
    } else {
      // si no estamos en inventario, cerramos el panel para evitar superposición
      this.showNotif.set(false);
    }
  }

  /**
   * Abre el modal "Crear medicamento" desde el header del dashboard,
   * reenviando la acción al hijo de inventario.
   */
  abrirDesdeHeader() {
    this.inv?.abrirCrear();
  }

  /**
   * Tras la inicialización de vistas, espera un breve tiempo
   * para que el hijo de inventario cargue y luego sincroniza alertas.
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.syncUnreadFromAlerts(), 500);
  }

  /**
   * Cierra el panel de notificaciones al hacer click en el documento.
   * (El botón campana llama `toggleNotifs` con `stopPropagation`).
   */
  @HostListener('document:click')
  onDocumentClick() {
    this.showNotif.set(false);
  }

  // ----- Notificaciones -----

  /**
   * Alterna la visibilidad del panel de notificaciones.
   * - Al abrir: refresca desde inventario y marca todas como leídas.
   * - Al cerrar: oculta panel.
   */
  toggleNotifs(ev?: MouseEvent) {
    ev?.stopPropagation();
    if (!this.showNotif()) {
      this.refreshAlertsFromChild();
      this.showNotif.set(true);
      this.unread.set(0);
    } else {
      this.showNotif.set(false);
    }
  }

  /** trackBy para *ngFor en la lista de notificaciones. */
  trackNotif = (_: number, n: Notificacion) => n.id;

  /**
   * Reconstruye las alertas a partir de las filas visibles del inventario
   * y actualiza el contador de no leídas.
   */
  private syncUnreadFromAlerts() {
    const arr = this.buildAlerts();
    this.notifs.set(arr);
    this.unread.set(arr.length);
  }

  /** Reconstruye las alertas sin tocar el contador `unread`. */
  private refreshAlertsFromChild() {
    const arr = this.buildAlerts();
    this.notifs.set(arr);
  }

  /**
   * Construye las notificaciones derivadas del estado visible del Inventario.
   * Reglas:
   * - **Stock**: `danger` si 0; `warning` si 1..9.
   * - **Vencimiento**: `danger` si vencido; `warning` si vence ≤ 30 días.
   * - Orden: críticas primero (danger > warning > info).
   */
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
