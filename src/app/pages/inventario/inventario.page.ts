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
  @Input() showHeader = true;

  // DI
  private fb = inject(FormBuilder);
  private meds = inject(MedicamentosService);
  private ventas = inject(VentasService);

  // Toast reutilizable
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

  // estado general
  loading = signal(false);
  pageIndex = signal(0);
  pageSize  = signal(10);
  filtroNombre = signal('');

  // datos inventario
  data = signal<Page<MedicamentoResponse> | null>(null);

  // filas para *ngFor
  rows = computed<MedicamentoResponse[]>(() => this.data()?.content ?? []);
  trackRow = (_: number, m: MedicamentoResponse) => m?.id ?? _;

  // métricas inventario
  totalMedicamentos = computed(() => this.data()?.totalElements ?? 0);
  stockTotal = computed(() =>
    (this.data()?.content ?? []).reduce((acc, m) => acc + (m.cantidadStock ?? 0), 0)
  );
  stockBajo = computed(() =>
    (this.data()?.content ?? []).filter(m => (m.cantidadStock ?? 0) < 10).length
  );

  // MÉTRICA: Ingresos del mes
  ingresosMes = signal<number | null>(null);
  mesActual = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date());

  // “hoy” normalizado
  today = new Date();

  // Modal Vender
  showVender = signal(false);
  vendiendo  = signal(false);
  seleccionado: MedicamentoResponse | null = null;
  cotizacion: CotizacionResponse | null = null;
  venderForm = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  // Modal Crear/Editar
  showForm = signal(false);
  editando: MedicamentoResponse | null = null;
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    laboratorioId: [0, [Validators.required, Validators.min(1)]],
    fechaFabricacion: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    cantidadStock: [0, [Validators.required, Validators.min(0)]],
    valorUnitario: [0, [Validators.required, Validators.min(1)]],
  });

  // ----------------- ciclo de vida -----------------
  ngOnInit(): void {
    this.load();
    this.loadIngresosMes(); // calcular ingresos del mes al iniciar
  }

  // ----------------- carga/paginación/filtros -----------------
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

  buscar() { this.pageIndex.set(0); this.load(); }

  paginar(next: boolean) {
    const page = this.pageIndex() + (next ? 1 : -1);
    if (page < 0) return;
    if (this.data() && page >= (this.data()!.totalPages || 1)) return;
    this.pageIndex.set(page);
    this.load();
  }

  // ----------------- CRUD -----------------
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

  // Crear / Editar con SweetAlert2
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

  // Eliminar con confirmación SweetAlert2
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
  abrirVender(m: MedicamentoResponse) {
    this.seleccionado = m;
    this.venderForm.setValue({ cantidad: 1 });
    this.cotizar();
    this.showVender.set(true);
  }

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

  // Compra con SweetAlert2 (loading + resumen)
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
  private fmtISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

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
  /** intenta convertir string (ISO o dd/MM/yyyy) a Date */
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

  /** Formato seguro (muestra '—' si no hay o es inválida) */
  fmt(d?: string | Date | null): string {
    const dt = this.toDate(d ?? null);
    return dt ? new Intl.DateTimeFormat('es-CO').format(dt) : '—';
  }

  /** true si la fecha de vencimiento ya pasó */
  isVencido(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const t = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    return f < t;
  }

  /** true si vence en los próximos 30 días */
  isPorVencer(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const hoy = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);
    return fecha >= hoy && fecha <= limite;
  }

  /** Devuelve fecha de creación desde el campo que exista (fechaCreacion|createdAt) */
  getCreacion(m: Partial<Record<'fechaCreacion' | 'createdAt', string | Date>>): string | Date | null {
    return m?.fechaCreacion ?? m?.createdAt ?? null;
  }
}
