import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import type { LazyLoadEvent } from 'primeng/api';

// PrimeNG (opcionales; puedes quitarlos si no los usas)
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

// Servicios
import { MedicamentosService } from '../../core/services/medicamentos.service';
import { VentasService } from '../../core/services/ventas.service';

// Modelos
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
    // Reusables
    BadgeStatusComponent, CardMetricComponent, ModalComponent,
    MedicamentoFormComponent, VenderDialogComponent, CurrencyColPipe,
    // PrimeNG (opcionales)
    TableModule, ButtonModule, InputTextModule
  ],
  templateUrl: './inventario.page.html',
})
export class InventarioPage implements OnInit {
  @Input() showHeader = true;

  // Inyección
  private fb = inject(FormBuilder);
  private meds = inject(MedicamentosService);
  private ventas = inject(VentasService);

  // Toast SweetAlert2
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

  // Estado tabla/filtros
  loading = signal(false);
  pageIndex = signal(0);   // 0-based
  pageSize  = signal(10);
  filtroNombre = signal('');

  // Datos
  data = signal<Page<MedicamentoResponse> | null>(null);

  // Derivados
  rows = computed<MedicamentoResponse[]>(() => this.data()?.content ?? []);
  trackRow = (_: number, m: MedicamentoResponse) => m?.id ?? _;

  totalMedicamentos = computed(() => this.data()?.totalElements ?? 0);
  stockTotal = computed(() =>
    (this.data()?.content ?? []).reduce((acc, m) => acc + (m.cantidadStock ?? 0), 0)
  );
  stockBajo = computed(() =>
    (this.data()?.content ?? []).filter(m => (m.cantidadStock ?? 0) < 10).length
  );

  // KPI Ingresos del mes
  ingresosMes = signal(0);
  mesActual = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date());

  // Referencias de fecha
  today = new Date();

  // Vender
  showVender = signal(false);
  vendiendo  = signal(false);
  seleccionado: MedicamentoResponse | null = null;
  cotizacion: CotizacionResponse | null = null;
  venderForm = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  // Crear/Editar
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

  // Ciclo de vida
  ngOnInit(): void {
    this.load();
    this.loadIngresosMes();
  }

  // Handlers UI
  onFiltroChange(q: string): void {
    this.filtroNombre.set(q);
    // Si está vacío, mostrar todo automáticamente
    if (!q.trim()) {
      this.pageIndex.set(0);
      this.load();
    }
  }

  onPage(ev: LazyLoadEvent | { first?: number; rows?: number }): void {
    const rows  = Number(ev?.rows ?? this.pageSize());
    const first = Number(ev?.first ?? 0);
    const idx   = Math.floor(first / rows);
    this.pageSize.set(rows);
    this.pageIndex.set(idx);
    this.load();
  }

  // Carga / paginación
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

  buscar() {
    this.pageIndex.set(0);
    this.load();
  }

  paginar(next: boolean) {
    const page = this.pageIndex() + (next ? 1 : -1);
    if (page < 0) return;
    if (this.data() && page >= (this.data()!.totalPages || 1)) return;
    this.pageIndex.set(page);
    this.load();
  }

  // CRUD
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

  onGuardar(req: MedicamentoRequest) {
    const esEdicion = !!this.editando;
    const obs = this.editando ? this.meds.actualizar(this.editando.id, req) : this.meds.crear(req);

    Swal.fire({ title: esEdicion ? 'Actualizando...' : 'Creando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    obs.subscribe({
      next: () => {
        Swal.close();
        this.showForm.set(false);
        this.load();
        this.Toast.fire({ icon: 'success', title: esEdicion ? 'Medicamento actualizado' : 'Medicamento creado' });
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

      Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      this.meds.eliminar(m.id).subscribe({
        next: () => {
          Swal.close();
          this.Toast.fire({ icon: 'success', title: 'Medicamento eliminado' });
          this.load();
        },
        error: (err) => {
          Swal.close();
          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err?.error?.message ?? 'Intenta nuevamente.' });
        }
      });
    });
  }

  // Vender
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

  confirmarVenta(cantidadFromChild?: number) {
    if (!this.seleccionado) return;
    const cantidad = cantidadFromChild ?? this.venderForm.value.cantidad ?? 1;

    Swal.fire({ title: 'Procesando venta...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.vendiendo.set(true);
    this.ventas.crear({ medicamentoId: this.seleccionado.id, cantidad }).subscribe({
      next: () => {
        this.vendiendo.set(false);
        this.showVender.set(false);
        this.load(); // refresca tabla

        // total de esta venta (usa cotización si existe; si no, precio unitario)
        const unit  = Number(this.seleccionado?.valorUnitario ?? 0);
        const total = Number(this.cotizacion?.valorTotal ?? (unit * Number(cantidad)));

        // Incremento optimista del KPI
        this.ingresosMes.update(v => (v ?? 0) + (isNaN(total) ? 0 : total));

        // Sincroniza con backend (por si hay descuentos/impuestos/redondeos)
        this.loadIngresosMes();

        Swal.close();
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
        Swal.fire({ icon: 'error', title: 'No se pudo completar la venta', text: err?.error?.message ?? 'Intenta nuevamente.' });
      }
    });
  }

  // Ingresos del Mes
  private fmtISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseMoney(x: unknown): number {
    if (typeof x === 'number') return x;
    if (typeof x === 'string') {
      // " $ 2.600,50 " -> "2600.50"
      const s = x.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  loadIngresosMes() {
    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // fin de mes (inclusive)
    const from = this.fmtISO(desde);
    const to   = this.fmtISO(hasta);

    this.ventas.listarPorRango(from, to).subscribe({
      next: (res: any) => {
        // Posibles formas: array | {content:[]} | {data:[]} | {total/monto/valor:number}
        if (typeof res?.total === 'number') { this.ingresosMes.set(res.total); return; }
        if (typeof res?.monto === 'number') { this.ingresosMes.set(res.monto); return; }
        if (typeof res?.valor === 'number') { this.ingresosMes.set(res.valor); return; }

        const items: any[] =
          Array.isArray(res) ? res :
          Array.isArray(res?.content) ? res.content :
          Array.isArray(res?.data) ? res.data : [];

        const total = items.reduce((acc, it) => {
          const raw = it?.valorTotal ?? it?.total ?? it?.monto ?? 0;
          return acc + this.parseMoney(raw);
        }, 0);

        this.ingresosMes.set(total);
      },
      error: (err) => {
        console.error('loadIngresosMes error', err);
        this.ingresosMes.set(0);
      }
    });
  }

  // Helpers para el template
  private toDate(d: string | Date | null | undefined): Date | null {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
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

  fmt(d?: string | Date | null): string {
    const dt = this.toDate(d ?? null);
    return dt ? new Intl.DateTimeFormat('es-CO').format(dt) : '—';
  }

  isVencido(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const t = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    return f < t;
    }

  isPorVencer(d?: string | Date | null): boolean {
    const fecha = this.toDate(d ?? null);
    if (!fecha) return false;
    const hoy = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 30);
    return fecha >= hoy && fecha <= limite;
  }

  getCreacion(m: Partial<Record<'fechaCreacion' | 'createdAt', string | Date>>): string | Date | null {
    return m?.fechaCreacion ?? m?.createdAt ?? null;
  }
}
