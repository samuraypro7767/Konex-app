import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MedicamentoResponse, CotizacionResponse } from '../../../../core/model/medicamento.model';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-vender-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, InputNumberModule, ButtonModule, MessageModule],
  templateUrl: './vender-dialog.component.html',
})
export class VenderDialogComponent {
  @Input() open = false;

  private _seleccionado: MedicamentoResponse | null = null;
  @Input() set seleccionado(value: MedicamentoResponse | null) {
    this._seleccionado = value;
    this.syncMaxValidator();
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

  constructor() {
    // 🔒 Si el usuario llega a poner exactamente 0, lo convertimos a 1.
    this.form.controls.cantidad.valueChanges.subscribe(v => {
      // sólo actuamos ante 0; no forzamos cuando está vacío para no molestar la escritura
      if (v === 0) {
        this.form.controls.cantidad.setValue(1, { emitEvent: false });
        this.onCotizar();
      }
    });
  }

  get maxVendible(): number {
    return Number(this.seleccionado?.cantidadStock ?? 0);
  }

  private syncMaxValidator(): void {
    const max = this.maxVendible;
    const ctrl = this.form.controls.cantidad;
    const validators = [Validators.required, Validators.min(1)];
    if (max > 0) validators.push(Validators.max(max));
    ctrl.setValidators(validators);
    ctrl.updateValueAndValidity({ emitEvent: false });

    const curr = Number(ctrl.value ?? 1);
    if (max > 0 && curr > max) ctrl.setValue(max, { emitEvent: false });
  }

  setCantidad(n: number) {
    const max = this.maxVendible || Infinity;
    // 👇 clamp con mínimo 1
    const val = Math.min(Math.max(1, Number(n || 0)), max);
    this.form.patchValue({ cantidad: val }, { emitEvent: false });
    this.onCotizar();
  }

  // 👉 Llamado desde el template en onInput/onBlur del p-inputNumber
  onCantidadInput(raw: any) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      this.form.controls.cantidad.setValue(1, { emitEvent: false });
      this.onCotizar();
    } else {
      this.setCantidad(n);
    }
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
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.cotizar.emit(qty);
  }

  onConfirmar() {
    if (!this.seleccionado) return;
    if (this.loading || this.form.invalid || this.maxVendible === 0) return;
    const qty = Number(this.form.value.cantidad ?? 1);
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.confirmar.emit(qty);
  }
}
