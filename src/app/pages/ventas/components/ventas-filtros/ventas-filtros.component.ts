import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/**
 * Componente de filtros para la vista de Ventas.
 *
 * - Expone un formulario con dos fechas (`desde`, `hasta`).
 * - Emite `buscar` con el rango seleccionado cuando el formulario es válido.
 * - Emite `limpiar` y resetea el formulario cuando se pulsa “Limpiar”.
 *
 * Uso:
 * ```html
 * <app-ventas-filtros
 *   (buscar)="onBuscar($event)"
 *   (limpiar)="onLimpiar()">
 * </app-ventas-filtros>
 * ```
 */
@Component({
  selector: 'app-ventas-filtros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas-filtros.component.html',
})
export class VentasFiltrosComponent {
  /**
   * Evento que emite el rango válido seleccionado por el usuario.
   * Formato esperado: `{ desde: 'YYYY-MM-DD', hasta: 'YYYY-MM-DD' }`.
   */
  @Output() buscar = new EventEmitter<{ desde: string; hasta: string }>();

  /** Evento que notifica al contenedor que se han limpiado los filtros. */
  @Output() limpiar = new EventEmitter<void>();

  /** Inyección de FormBuilder (API `inject`, Angular 14+). */
  private fb = inject(FormBuilder);

  /**
   * Formulario reactivo de filtros.
   * - `desde`: fecha inicial (requerida).
   * - `hasta`: fecha final (requerida).
   *
   * Nota: si necesitas validar que `desde <= hasta`, puedes agregar
   * un validador de grupo posteriormente.
   */
  form = this.fb.nonNullable.group({
    desde: ['', Validators.required],
    hasta: ['', Validators.required],
  });

  /**
   * Envía el rango si el formulario es válido.
   * No transforma el formato: se emite tal cual `YYYY-MM-DD` desde el input date.
   */
  onBuscar(): void {
    if (this.form.valid) {
      this.buscar.emit(this.form.getRawValue());
    }
  }

  /**
   * Limpia los campos y notifica al contenedor para recargar la lista completa.
   */
  onLimpiar(): void {
    this.form.reset({ desde: '', hasta: '' });
    this.limpiar.emit();
  }
}
