import { CommonModule, NgIf, NgFor} from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MedicamentosService } from '../../core/services/medicamentos.service';
import { VentasService } from '../../core/services/ventas.service';
import { MedicamentoRequest, MedicamentoResponse, CotizacionResponse } from '../../core/model/medicamento.model';
import { Page } from '../../core/model/page.model';
import { Component, OnInit, signal, computed, inject } from '@angular/core'; // 1) import inject

@Component({
  standalone: true,
  selector: 'app-inventario-page',
  imports: [CommonModule, NgIf, NgFor,ReactiveFormsModule],
  templateUrl: './inventario.page.html'
})
export class InventarioPage implements OnInit {
  // 2) usar inject() ANTES de crear los formularios
  private fb = inject(FormBuilder);

  // tabla
  loading = signal(false);
  pageIndex = signal(0);
  pageSize = signal(10);
  filtroNombre = signal('');
  data = signal<Page<MedicamentoResponse> | null>(null);

  // métricas
  totalMedicamentos = computed(() => this.data()?.totalElements ?? 0);
  stockTotal = computed(() =>
    (this.data()?.content ?? []).reduce((acc, m) => acc + (m.cantidadStock ?? 0), 0)
  );
  stockBajo = computed(() =>
    (this.data()?.content ?? []).filter(m => (m.cantidadStock ?? 0) < 10).length
  );

  // Modal Vender
  showVender = signal(false);
  vendiendo = signal(false);
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

  constructor(
    // 3) QUITA fb del constructor
    private meds: MedicamentosService,
    private ventas: VentasService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.meds.listar(this.filtroNombre(), this.pageIndex(), this.pageSize()).subscribe({
      next: (res) => this.data.set(res),
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

  guardar() {
    if (this.form.invalid) return;
    const body: MedicamentoRequest = this.form.getRawValue();
    const obs = this.editando
      ? this.meds.actualizar(this.editando.id, body)
      : this.meds.crear(body);

    obs.subscribe({ next: () => { this.showForm.set(false); this.load(); } });
  }

  eliminar(m: MedicamentoResponse) {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return;
    this.meds.eliminar(m.id).subscribe({ next: () => this.load() });
  }

  abrirVender(m: MedicamentoResponse) {
    this.seleccionado = m;
    this.venderForm.setValue({ cantidad: 1 });
    this.cotizar();
    this.showVender.set(true);
  }

  cotizar() {
    if (!this.seleccionado) return;
    const cantidad = this.venderForm.value.cantidad || 1;
    this.meds.cotizar(this.seleccionado.id, cantidad).subscribe({
      next: (res) => this.cotizacion = res
    });
  }

  confirmarVenta() {
    if (!this.seleccionado || this.venderForm.invalid) return;
    this.vendiendo.set(true);
    const cantidad = this.venderForm.value.cantidad || 1;
    this.ventas.crear({ medicamentoId: this.seleccionado.id, cantidad }).subscribe({
      next: () => { this.vendiendo.set(false); this.showVender.set(false); this.load(); },
      error: () => this.vendiendo.set(false)
    });
  }
}
