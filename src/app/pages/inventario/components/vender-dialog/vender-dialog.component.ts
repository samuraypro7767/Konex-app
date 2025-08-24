import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MedicamentoResponse, CotizacionResponse } from '../../../../core/model/medicamento.model';

@Component({
  selector: 'app-vender-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vender-dialog.component.html',
})
export class VenderDialogComponent {
  @Input() open = false;
  @Input() seleccionado: MedicamentoResponse | null = null;
  @Input() cotizacion: CotizacionResponse | null = null;
  @Input() loading = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() cotizar = new EventEmitter<number>();
  @Output() confirmar = new EventEmitter<number>();

  // ✅ primero inyectamos FormBuilder
  private fb = inject(FormBuilder);

  // ✅ ahora sí podemos usarlo para crear el form sin el error 2729
  form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  onCotizar() {
    if (this.form.valid) {
      this.cotizar.emit(this.form.value.cantidad!);
    }
  }

  onConfirmar() {
    if (this.form.valid) {
      this.confirmar.emit(this.form.value.cantidad!);
    }
  }
}
