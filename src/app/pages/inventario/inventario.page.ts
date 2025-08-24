import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

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

  // estado general
  loading = signal(false);
  pageIndex = signal(0);
  pageSize  = signal(10);
  filtroNombre = signal('');

  // datos
  data = signal<Page<MedicamentoResponse> | null>(null);

  // filas para *ngFor
  rows = computed<MedicamentoResponse[]>(() => this.data()?.content ?? []);
  trackRow = (_: number, m: MedicamentoResponse) => m?.id ?? _;

  // métricas
  totalMedicamentos = computed(() => this.data()?.totalElements ?? 0);
  stockTotal = computed(() =>
    (this.data()?.content ?? []).reduce((acc, m) => acc + (m.cantidadStock ?? 0), 0)
  );
  stockBajo = computed(() =>
    (this.data()?.content ?? []).filter(m => (m.cantidadStock ?? 0) < 10).length
  );

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
  ngOnInit(): void { this.load(); }

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

  onGuardar(req: MedicamentoRequest) {
    const obs = this.editando ? this.meds.actualizar(this.editando.id, req) : this.meds.crear(req);
    obs.subscribe({ next: () => { this.showForm.set(false); this.load(); } });
  }

  eliminar(m: MedicamentoResponse) {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return;
    this.meds.eliminar(m.id).subscribe({ next: () => this.load() });
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
      next: (res) => this.cotizacion = res
    });
  }

  confirmarVenta(cantidadFromChild?: number) {
    if (!this.seleccionado) return;
    const cantidad = cantidadFromChild ?? this.venderForm.value.cantidad ?? 1;
    this.vendiendo.set(true);
    this.ventas.crear({ medicamentoId: this.seleccionado.id, cantidad }).subscribe({
      next: () => { this.vendiendo.set(false); this.showVender.set(false); this.load(); },
      error: () => this.vendiendo.set(false)
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
