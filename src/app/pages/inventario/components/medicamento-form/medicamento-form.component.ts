import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MedicamentoRequest, MedicamentoResponse } from '../../../../core/model/medicamento.model';

@Component({
  selector: 'app-medicamento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicamento-form.component.html',
})
export class MedicamentoFormComponent {
  @Input() initial?: MedicamentoResponse | null;
  @Output() save = new EventEmitter<MedicamentoRequest>();
  @Output() cancel = new EventEmitter<void>();

  // ⚠️ primero definimos fb con inject
  private fb = inject(FormBuilder);

  // ✅ ahora sí podemos usar fb para crear el form sin el error 2729
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    laboratorioId: [0, [Validators.required, Validators.min(1)]],
    fechaFabricacion: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    cantidadStock: [0, [Validators.required, Validators.min(0)]],
    valorUnitario: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnChanges() {
    if (this.initial) {
      this.form.reset(this.initial);
    }
  }

  onSave() {
    if (this.form.valid) {
      this.save.emit(this.form.getRawValue());
    }
  }
}
