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

type LabOption = { id: number; nombre: string };

@Component({
  selector: 'app-medicamento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicamento-form.component.html',
})
export class MedicamentoFormComponent implements OnChanges {
  @Input() initial?: MedicamentoResponse | null;
  @Output() save = new EventEmitter<MedicamentoRequest>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  /** ✅ IDs permitidos como number[], no como literal union */
  readonly allowedLabs: number[] = [1, 2, 3];

  /** Opciones para el <select> (ajusta nombres si quieres) */
  readonly labs: LabOption[] = [
    { id: 1, nombre: 'Laboratorio 1' },
    { id: 2, nombre: 'Laboratorio 2' },
    { id: 3, nombre: 'Laboratorio 3' },
  ];

  /** Validador: solo acepta valores presentes en allowedLabs */
  private allowedLabValidator(allowed: readonly number[]): ValidatorFn {
    return (control: AbstractControl) => {
      const val = Number(control.value);
      return allowed.includes(val) ? null : { labNotAllowed: true };
    };
  }

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

  trackLab = (_: number, l: LabOption) => l.id;

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
