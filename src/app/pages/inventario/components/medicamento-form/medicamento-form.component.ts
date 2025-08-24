import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MedicamentoRequest, MedicamentoResponse } from '../../../../core/model/medicamento.model';

/** Opción para el selector de laboratorios. */
type LabOption = { id: number; nombre: string };

/**
 * Formulario de creación/edición de medicamentos.
 *
 * - Modo **crear**: cuando `initial` es `null` o `undefined`.
 * - Modo **editar**: cuando `initial` trae un `MedicamentoResponse`; los campos se precargan.
 *
 * Validaciones:
 * - `nombre`: requerido
 * - `laboratorioId`: requerido y debe pertenecer a `allowedLabs`
 * - `fechaFabricacion`, `fechaVencimiento`: requeridas (formato de fecha lo maneja el padre/HTML)
 * - `cantidadStock`: número ≥ 0
 * - `valorUnitario`: número ≥ 1
 *
 * Seguridad:
 * - Se fuerza `laboratorioId` a number.
 * - Se valida contra `allowedLabs` incluso si el DOM es manipulado.
 */
@Component({
  selector: 'app-medicamento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicamento-form.component.html',
})
export class MedicamentoFormComponent implements OnChanges {
  /**
   * Datos iniciales para editar. Si viene `null/undefined`, el formulario queda en modo creación.
   * Al cambiar este input, se sincroniza el formulario (ciclo `ngOnChanges`).
   */
  @Input() initial?: MedicamentoResponse | null;

  /** Evento de guardado con el payload tipado para el backend. */
  @Output() save = new EventEmitter<MedicamentoRequest>();
  /** Evento para cancelar/cerrar el formulario (lo maneja el contenedor). */
  @Output() cancel = new EventEmitter<void>();

  /** Inyección de `FormBuilder` para construir el formulario reactivo. */
  private fb = inject(FormBuilder);

  /**
   * IDs de laboratorios permitidos (lista blanca).
   * Nota: se usa array de `number` (no unión literal) para poder venir de backends/config.
   */
  readonly allowedLabs: number[] = [1, 2, 3];

  /** Opciones visibles en el `<select>` de laboratorios. */
  readonly labs: LabOption[] = [
    { id: 1, nombre: 'Laboratorio 1' },
    { id: 2, nombre: 'Laboratorio 2' },
    { id: 3, nombre: 'Laboratorio 3' },
  ];

  /**
   * Validador que verifica que el control tenga un `laboratorioId` incluido en `allowedLabs`.
   * @param allowed Lista blanca de IDs permitidos
   * @returns `null` si válido; `{ labNotAllowed: true }` en caso contrario.
   */
  private allowedLabValidator(allowed: readonly number[]): ValidatorFn {
    return (control: AbstractControl) => {
      const val = Number(control.value);
      return allowed.includes(val) ? null : { labNotAllowed: true };
    };
  }

  /**
   * Form reactivo principal.
   * - `laboratorioId` parte en 1 y aplica validador personalizado contra `allowedLabs`.
   */
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    laboratorioId: [
      1,
      [Validators.required, this.allowedLabValidator(this.allowedLabs)]
    ],
    fechaFabricacion: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    cantidadStock: [0, [Validators.required, Validators.min(0)]],
    valorUnitario: [0, [Validators.required, Validators.min(1)]],
  });

  /**
   * Ciclo de vida: sincroniza el formulario cuando cambian los datos `initial`.
   * - Hace coerción defensiva de `laboratorioId` a number.
   * - Si el `laboratorioId` entrante no está permitido, cae al primer permitido.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initial'] && this.initial) {
      const incomingId = Number((this.initial as any).laboratorioId ?? 0);
      const safeId = this.allowedLabs.includes(incomingId) ? incomingId : this.allowedLabs[0];

      this.form.reset({
        nombre: this.initial.nombre,
        laboratorioId: safeId,
        fechaFabricacion: this.initial.fechaFabricacion,
        fechaVencimiento: this.initial.fechaVencimiento,
        cantidadStock: this.initial.cantidadStock,
        valorUnitario: this.initial.valorUnitario,
      });
    }
  }

  /** `trackBy` para el `<option>` del select de laboratorios (optimiza *ngFor). */
  trackLab = (_: number, l: LabOption) => l.id;

  /**
   * Handler del botón "Guardar".
   * - Marca como tocado todo el formulario si inválido y no emite.
   * - Coacciona `laboratorioId` a number antes de construir el payload.
   * - Revalida contra `allowedLabs` por seguridad (en caso de manipulación del DOM).
   * - Emite evento `save` con `MedicamentoRequest` válido.
   */
  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: MedicamentoRequest = {
      ...this.form.getRawValue(),
      laboratorioId: Number(this.form.value.laboratorioId),
    } as MedicamentoRequest;

    // Defensa extra por si manipulan el DOM
    if (!this.allowedLabs.includes(payload.laboratorioId)) {
      this.form.controls.laboratorioId.setErrors({ labNotAllowed: true });
      return;
    }

    this.save.emit(payload);
  }
}
