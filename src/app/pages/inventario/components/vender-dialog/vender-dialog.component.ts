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

  // ✅ setter para actualizar el validador "max" cada vez que cambia el seleccionado
  private _seleccionado: MedicamentoResponse | null = null;
  @Input() set seleccionado(value: MedicamentoResponse | null) {
    this._seleccionado = value;
    this.syncMaxValidator(); // aplica Validators.max(stock)
  }
  get seleccionado(): MedicamentoResponse | null { return this._seleccionado; }

  @Input() cotizacion: CotizacionResponse | null = null;
  @Input() loading = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() cotizar = new EventEmitter<number>();
  @Output() confirmar = new EventEmitter<number>();

  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  /** stock disponible en número */
  get maxVendible(): number {
    return Number(this.seleccionado?.cantidadStock ?? 0);
  }

  /** aplica/actualiza el validador MAX de acuerdo al stock */
  private syncMaxValidator(): void {
    const max = this.maxVendible;
    const ctrl = this.form.controls.cantidad;
    const validators = [Validators.required, Validators.min(1)];
    if (max > 0) validators.push(Validators.max(max));
    ctrl.setValidators(validators);
    ctrl.updateValueAndValidity({ emitEvent: false });
    // si el valor actual quedó fuera de rango, lo corrijo
    const curr = Number(ctrl.value ?? 1);
    if (max > 0 && curr > max) ctrl.setValue(max, { emitEvent: false });
  }

  setCantidad(n: number) {
    const max = this.maxVendible || Infinity;
    const val = Math.min(Math.max(1, n), max);
    this.form.patchValue({ cantidad: val }, { emitEvent: false });
    this.onCotizar();
  }
  dec() { this.setCantidad((this.form.value.cantidad ?? 1) - 1); }
  inc() { this.setCantidad((this.form.value.cantidad ?? 1) + 1); }

  get totalLocal(): number {
    const qty = Number(this.form.value.cantidad ?? 1);
    const unit = Number(this.seleccionado?.valorUnitario ?? 0);
    return qty * unit;
  }
  get totalMostrar(): number {
    return Number(this.cotizacion?.valorTotal ?? this.totalLocal);
  }

  onCotizar() {
    if (!this.seleccionado) return;
    const qty = Number(this.form.value.cantidad ?? 1);
    // si excede stock, no emito confirm; dejo el formulario en error 'max'
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.cotizar.emit(qty);
  }

  onConfirmar() {
    if (!this.seleccionado) return;
    if (this.loading || this.form.invalid || this.maxVendible === 0) return; // ✅ BLOQUEA compra
    const qty = Number(this.form.value.cantidad ?? 1);
    // defensa adicional
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.confirmar.emit(qty);
  }
}
