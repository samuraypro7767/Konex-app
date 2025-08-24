import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { MedicamentosService } from '../../core/services/medicamentos.service';
import { VentasService } from '../../core/services/ventas.service';

import {
  MedicamentoRequest,
  MedicamentoResponse,
  CotizacionResponse
} from '../../core/model/medicamento.model';
import { Page } from '../../core/model/page.model';

// Reusables
import { BadgeStatusComponent } from '../../shared/components/badge-status/badge-status.component';
import { CardMetricComponent } from '../../shared/components/card-metric/card-metric.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { MedicamentoFormComponent } from './components/medicamento-form/medicamento-form.component';
import { VenderDialogComponent } from './components/vender-dialog/vender-dialog.component';
import { CurrencyColPipe } from '../../shared/pipes/currency-col.pipe';

/**
 * Página de **Inventario**.
 *
 * Responsabilidades:
 * - Listar, buscar y paginar medicamentos.
 * - CRUD de medicamentos con modales y feedback (SweetAlert2 + toasts).
 * - Flujo de venta (cotizar y confirmar).
 * - Métricas: total de ítems, stock total, stock bajo e **ingresos del mes**.
 * - Helpers de fechas para marcar vencidos / por vencer.
 *
 * Notas:
 * - Usa **signals** y **computed** de Angular para el estado reactivo.
 * - Las operaciones que mutan datos (crear/editar/eliminar/venta) refrescan la tabla y las métricas.
 */
@Component({
  standalone: true,
  selector: 'app-inventario-page',
  imports: [
    CommonModule, NgIf, NgFor, ReactiveFormsModule,
    // UI
    BadgeStatusComponent, CardMetricComponent, ModalComponent,
    MedicamentoFormComponent, VenderDialogComponent,
    CurrencyColPipe
  ],
  templateUrl: './inventario.page.html',
})
export class InventarioPage implements OnInit {
  /** Muestra/oculta el encabezado local de esta página. Cuando se renderiza dentro del dashboard suele ir en `false`. */
  @Input() showHeader = true;

  // ----------------- Inyección de dependencias -----------------
  private fb = inject(FormBuilder);
  private meds = inject(MedicamentosService);
  private ventas = inject(VentasService);

  /**
   * Config común para toasts de SweetAlert2.
   * @remarks No bloquea la UI (toast), se ubica en esquina superior, y pausa el timer al pasar el mouse.
   */
  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (t) => {
      t.addEventListener('mouseenter', Swal.stopTimer);
      t.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  // ----------------- Estado de tabla/filtros -----------------
  /** Bandera de carga para la tabla principal. */
  loading = signal(false);
  /** Índice de página **0-based**. */
  pageIndex = signal(0);
  /** Tamaño de página. */
  pageSize  = signal(10);
  /** Filtro por nombre (contiene). */
  filtroNombre = signal('');

  // ----------------- Datos de inventario -----------------
  /** Página de medicamentos devuelta por el backend. */
  data = signal<Page<MedicamentoResponse> | null>(null);

  // ----------------- Derivados para tabla -----------------
  /** Filas a renderizar en la tabla (contenido de la página actual). */
  rows = computed<MedicamentoResponse[]>(() => this.data()?.content ?? []);
  /** trackBy para *ngFor: evita rerenders innecesarios. */
  trackRow = (_: number, m: MedicamentoResponse) => m?.id ?? _;

  // ----------------- Métricas de inventario -----------------
  /** Total de medicamentos (en todo el dataset, no solo la página visible). */
  totalMedicamentos = computed(() => this.data()?.totalElements ?? 0);
  /** Suma de stock de la página visible. */
  stockTotal = computed(() =>
    (this.data()?.content ?? []).reduce((acc, m) => acc + (m.cantidadStock ?? 0), 0)
  );
  /** Cantidad de medicamentos con stock bajo (< 10) en la página visible. */
  stockBajo = computed(() =>
    (this.data()?.content ?? []).filter(m => (m.cantidadStock ?? 0) < 10).length
  );

  // ----------------- Métrica: Ingresos del mes -----------------
  /** Total de ingresos del mes actual (COP). */
  ingresosMes = signal<number | null>(null);
  /** Texto legible del mes en curso (ej: “agosto de 2025”). */
  mesActual = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date());

  // ----------------- Referencias de tiempo / helpers -----------------
  /** “Hoy” normalizado para comparaciones de fechas por día. */
  today = new Date();

  // ----------------- Modal Vender -----------------
  /** Visibilidad del diálogo de venta. */
  showVender = signal(false);
  /** Bandera de envío al confirmar la venta. */
  vendiendo  = signal(false);
  /** Medicamento seleccionado para vender. */
  seleccionado: MedicamentoResponse | null = null;
  /** Resultado de la cotización (si el backend responde). */
  cotizacion: CotizacionResponse | null = null;
  /** Form del modal de venta: cantidad >= 1. */
  venderForm = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  // ----------------- Modal Crear/Editar -----------------
  /** Visibilidad del formulario (modal). */
  showForm = signal(false);
  /** Si no es null: edición; si es null: creación. */
  editando: MedicamentoResponse | null = null;
  /** Formulario de crear/editar medicamento (validaciones mínimas). */
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    laboratorioId: [0, [Validators.required, Validators.min(1)]],
    fechaFabricacion: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    cantidadStock: [0, [Validators.required, Validators.min(0)]],
    valorUnitario: [0, [Validators.required, Validators.min(1)]],
  });

  // ----------------- ciclo de vida -----------------
  /** Carga la tabla inicial y calcula los ingresos del mes. */
  ngOnInit(): void {
    this.load();
    this.loadIngresosMes(); // calcular ingresos del mes al iniciar
  }

  // ----------------- carga/paginación/filtros -----------------
  /**
   * Carga la página de medicamentos según el filtro y la paginación actual.
   * @sideEffects Actualiza `data` y `loading`.
   */
  load() {
    this.loading.set(true);
    this.meds.listar(this.filtroNombre(), this.pageIndex(), this.pageSize()).subscribe({
      next: (res) => this.data.set(
        res ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: this.pageSize() }
      ),
      error: () => this.data.set({ content: [], totalElements: 0, totalPages: 0, number: 0, size: this.pageSize() }),
      complete: () => this.loading.set(false),
    });
  }

  /** Reinicia a la primera página y vuelve a cargar con el filtro aplicado. */
  buscar() { this.pageIndex.set(0); this.load(); }

  /**
   * Cambia de página (prev/next) si el índice resultante es válido.
   * @param next `true` avanza, `false` retrocede.
   */
  paginar(next: boolean) {
    const page = this.pageIndex() + (next ? 1 : -1);
    if (page < 0) return;
    if (this.data() && page >= (this.data()!.totalPages || 1)) return;
    this.pageIndex.set(page);
    this.load();
  }

  // ----------------- CRUD -----------------
  /** Abre el modal en modo **crear** y limpia el formulario. */
  abrirCrear() {
    this.editando = null;
    this.form.reset({
      nombre: '',
      laboratorioId: 1,
      fechaFabricacion: '',
      fechaVencimiento: '',
      cantidadStock: 0,
      valorUnitario: 0,
    });
    this.showForm.set(true);
  }

  /** Abre el modal en modo **editar** precargando los campos con el medicamento seleccionado. */
  abrirEditar(m: MedicamentoResponse) {
    this.editando = m;
    this.form.reset({
      nombre: m.nombre,
      laboratorioId: m.laboratorioId,
      fechaFabricacion: m.fechaFabricacion,
      fechaVencimiento: m.fechaVencimiento,
      cantidadStock: m.cantidadStock,
      valorUnitario: m.valorUnitario,
    });
    this.showForm.set(true);
  }

  /**
   * Guarda (crear/editar) un medicamento mostrando loading y feedback con SweetAlert2.
   * @param req DTO a enviar al backend.
   * @sideEffects Cierra modal, recarga la tabla y muestra toast de éxito / error.
   */
  onGuardar(req: MedicamentoRequest) {
    const esEdicion = !!this.editando;
    const obs = this.editando ? this.meds.actualizar(this.editando.id, req) : this.meds.crear(req);

    Swal.fire({
      title: esEdicion ? 'Actualizando...' : 'Creando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    obs.subscribe({
      next: () => {
        Swal.close();
        this.showForm.set(false);
        this.load();
        this.Toast.fire({
          icon: 'success',
          title: esEdicion ? 'Medicamento actualizado' : 'Medicamento creado'
        });
      },
      error: (err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: esEdicion ? 'Error al actualizar' : 'Error al crear',
          text: err?.error?.message ?? 'Intenta nuevamente.',
        });
      }
    });
  }

  /**
   * Elimina un medicamento con confirmación, mostrando loading y feedback.
   * @param m Medicamento a eliminar.
   * @sideEffects Refresca la tabla y dispara toast/alert según resultado.
   */
  eliminar(m: MedicamentoResponse) {
    Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
    }).then(result => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Eliminando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.meds.eliminar(m.id).subscribe({
        next: () => {
          Swal.close();
          this.Toast.fire({ icon: 'success', title: 'Medicamento eliminado' });
          this.load();
        },
        error: (err) => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            text: err?.error?.message ?? 'Intenta nuevamente.',
          });
        }
      });
    });
  }

  // ----------------- Vender -----------------
  /**
   * Abre el diálogo de venta para un medicamento dado.
   * @param m Medicamento a vender.
   * @sideEffects Prepara `venderForm`, solicita cotización inicial y muestra el modal.
   */
  abrirVender(m: MedicamentoResponse) {
    this.seleccionado = m;
    this.venderForm.setValue({ cantidad: 1 });
    this.cotizar();
    this.showVender.set(true);
  }

  /**
   * Solicita cotización al backend para la cantidad deseada.
   * @param cantidadFromChild Cantidad proveniente del componente hijo (si aplica).
   * @sideEffects Actualiza `cotizacion` y muestra toast si falla (usa precio local).
   */
  cotizar(cantidadFromChild?: number) {
    if (!this.seleccionado) return;
    const cantidad = cantidadFromChild ?? this.venderForm.value.cantidad ?? 1;
    this.meds.cotizar(this.seleccionado.id, cantidad).subscribe({
      next: (res) => this.cotizacion = res,
      error: () => {
        this.cotizacion = null;
        this.Toast.fire({ icon: 'warning', title: 'No se pudo cotizar, usando precio unitario' });
      }
    });
  }

  /**
   * Confirma la venta (POST al backend) mostrando loading y resumen.
   * - Si la venta es exitosa: cierra modal, recarga tabla y **recalcula ingresos del mes**.
   * @param cantidadFromChild Cantidad desde el hijo (si aplica).
   */
  confirmarVenta(cantidadFromChild?: number) {
    if (!this.seleccionado) return;
    const cantidad = cantidadFromChild ?? this.venderForm.value.cantidad ?? 1;

    Swal.fire({
      title: 'Procesando venta...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.vendiendo.set(true);
    this.ventas.crear({ medicamentoId: this.seleccionado.id, cantidad }).subscribe({
      next: () => {
        this.vendiendo.set(false);
        this.showVender.set(false);
        this.load();
        this.loadIngresosMes();

        Swal.close();
        const unit = Number(this.seleccionado?.valorUnitario ?? 0);
        const total = Number(this.cotizacion?.valorTotal ?? (unit * Number(cantidad)));
        const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total);

        Swal.fire({
          icon: 'success',
          title: '¡Compra exitosa!',
          html: `
            <div class="text-left">
              <div><b>Medicamento:</b> ${this.seleccionado?.nombre}</div>
              <div><b>Cantidad:</b> ${cantidad}</div>
              <div><b>Total:</b> ${money}</div>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        this.vendiendo.set(false);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'No se pudo completar la venta',
          text: err?.error?.message ?? 'Intenta nuevamente.',
        });
      }
    });
  }

  // ----------------- Ingresos del Mes -----------------
  /**
   * Formatea una fecha JS a `YYYY-MM-DD` (ISO corto) para parámetros de la API.
   * @param d Fecha a formatear.
   */
  private fmtISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Carga las ventas del mes en curso y suma sus `valorTotal`.
   * @sideEffects Actualiza `ingresosMes`. En error, setea 0.
   */
  loadIngresosMes() {
    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.ventas.listarPorRango(this.fmtISO(desde), this.fmtISO(hasta))
      .pipe(
        map((list: Array<{ valorTotal?: number | string }>) =>
          list?.reduce((acc, v) => acc + Number(v.valorTotal ?? 0), 0) ?? 0
        )
      )
      .subscribe({
        next: total => this.ingresosMes.set(total),
        error: () => this.ingresosMes.set(0),
      });
  }

  // ----------------- Helpers de fecha y estado -----------------
  /**
   * Intenta convertir `string` (ISO o dd/MM/yyyy) a `Date`. Si no puede, retorna `null`.
   * @param d Cadena/Date opcional.
   */
  private toDate(d: string | Date | null | undefined): Date | null {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const iso = new Date(d);
      return isNaN(iso.getTime()) ? null : iso;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('/').map(Number);
      const parsed = new Date(yyyy, mm - 1, dd);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const any = new Date(d);
    return isNaN(any.getTime()) ? null : any;
  }

  /** Formatea una fecha en locale `es-CO`; retorna '—' si es inválida o nula. */
  fmt(d?: string | Date | null): string {
    const dt = this.toDate(d ?? null);
    return dt ? new Intl.DateTimeFormat('es-CO').format(dt) : '—';
  }

  /**
   * `true` si la fecha de vencimiento **ya pasó** (comparación por día).
   * @param d Fecha a evaluar.
   */
  isVencido(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const t = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    return f < t;
  }

  /**
   * `true` si vence en los próximos **30 días** (incluye hoy).
   * @param d Fecha a evaluar.
   */
  isPorVencer(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const hoy = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);
    return fecha >= hoy && fecha <= limite;
  }

  /**
   * Devuelve fecha de creación desde el campo disponible (`fechaCreacion` o `createdAt`).
   * @param m Objeto parcial que puede contener alguno de los campos.
   */
  getCreacion(m: Partial<Record<'fechaCreacion' | 'createdAt', string | Date>>): string | Date | null {
    return m?.fechaCreacion ?? m?.createdAt ?? null;
  }
}
