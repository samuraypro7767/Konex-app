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
  /** Controla la visibilidad del diálogo de venta. */
  @Input() open = false;

  // ✅ setter para actualizar el validador "max" cada vez que cambia el seleccionado
  private _seleccionado: MedicamentoResponse | null = null;

  /**
   * Medicamento seleccionado para vender.
   * - Al cambiar, se recalculan los validadores del control `cantidad`,
   *   aplicando `Validators.max(stockDisponible)`.
   */
  @Input() set seleccionado(value: MedicamentoResponse | null) {
    this._seleccionado = value;
    this.syncMaxValidator(); // aplica Validators.max(stock)
  }
  get seleccionado(): MedicamentoResponse | null { return this._seleccionado; }

  /**
   * Cotización devuelta por el backend para la cantidad actual.
   * Si no está disponible (error/red), se usa cálculo local `cantidad * valorUnitario`.
   */
  @Input() cotizacion: CotizacionResponse | null = null;

  /** Bandera de carga durante la confirmación de la venta. Deshabilita el botón Confirmar. */
  @Input() loading = false;

  /** Emite cuando el usuario cierra el diálogo (sin confirmar). */
  @Output() cerrar = new EventEmitter<void>();
  /** Emite cuando se debe recalcular la cotización para una cantidad dada. */
  @Output() cotizar = new EventEmitter<number>();
  /** Emite cuando el usuario confirma la venta con la cantidad actual. */
  @Output() confirmar = new EventEmitter<number>();

  /** Inyección de `FormBuilder` para construir los formularios reactivos. */
  private fb = inject(FormBuilder);

  /**
   * Formulario del diálogo:
   * - `cantidad`: requerida y >= 1; el límite superior (`max`) se aplica dinámicamente según stock.
   */
  form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  /** Stock disponible (conversión defensiva a number). */
  get maxVendible(): number {
    return Number(this.seleccionado?.cantidadStock ?? 0);
  }

  /**
   * Aplica/actualiza el validador `Validators.max` del control `cantidad` según `maxVendible`.
   * - Si el valor actual excede el máximo, lo corrige silenciosamente.
   */
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

  /**
   * Setter de cantidad con límites: mínimo 1 y máximo `maxVendible`.
   * Tras ajustar, dispara `onCotizar()` para refrescar totales.
   */
  setCantidad(n: number) {
    const max = this.maxVendible || Infinity;
    const val = Math.min(Math.max(1, n), max);
    this.form.patchValue({ cantidad: val }, { emitEvent: false });
    this.onCotizar();
  }

  /** Decrementa en 1 la cantidad (respetando el mínimo). */
  dec() { this.setCantidad((this.form.value.cantidad ?? 1) - 1); }

  /** Incrementa en 1 la cantidad (respetando el máximo). */
  inc() { this.setCantidad((this.form.value.cantidad ?? 1) + 1); }

  /**
   * Total calculado localmente (fallback): `cantidad * valorUnitario`.
   * Se usa cuando no hay `cotizacion` del backend.
   */
  get totalLocal(): number {
    const qty = Number(this.form.value.cantidad ?? 1);
    const unit = Number(this.seleccionado?.valorUnitario ?? 0);
    return qty * unit;
  }

  /**
   * Total a mostrar en la UI.
   * - Prioriza `cotizacion.valorTotal` si existe; si no, usa `totalLocal`.
   */
  get totalMostrar(): number {
    return Number(this.cotizacion?.valorTotal ?? this.totalLocal);
  }

  /**
   * Solicita recotización para la cantidad actual.
   * - No emite si no hay seleccionado o si la cantidad excede `maxVendible`
   *   (deja el control con error `max`).
   */
  onCotizar() {
    if (!this.seleccionado) return;
    const qty = Number(this.form.value.cantidad ?? 1);
    // si excede stock, no emito confirm; dejo el formulario en error 'max'
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.cotizar.emit(qty);
  }

  /**
   * Confirma la venta.
   * - Reglas de bloqueo: sin seleccionado, `loading` activo, formulario inválido
   *   o stock `maxVendible === 0`.
   * - Defensa extra: no emite si `qty > maxVendible`.
   */
  onConfirmar() {
    if (!this.seleccionado) return;
    if (this.loading || this.form.invalid || this.maxVendible === 0) return; // ✅ BLOQUEA compra
    const qty = Number(this.form.value.cantidad ?? 1);
    // defensa adicional
    if (this.maxVendible > 0 && qty > this.maxVendible) return;
    this.confirmar.emit(qty);
  }
}
