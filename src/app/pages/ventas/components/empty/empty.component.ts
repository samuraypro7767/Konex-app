import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Fila vacía reutilizable para tablas.
 *
 * Renderiza un `<tr>` con una única celda `<td>` que ocupa `cols` columnas
 * (mediante `colspan`) y muestra el texto indicado en `text`.
 *
 * ✅ Úsalo dentro de `<tbody>` de una tabla, típicamente con `*ngIf`
 * cuando el dataset esté vacío.
 *
 * Ejemplo:
 * ```html
 * <tbody>
 *   <tr *ngFor="let row of rows"> ... </tr>
 *   <app-empty *ngIf="rows.length === 0" [cols]="6" text="Sin datos"></app-empty>
 * </tbody>
 * ```
 */
@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [CommonModule],
  template: `
  <tr>
    <td [attr.colspan]="cols" class="p-6 text-center text-gray-500">
      {{ text }}
    </td>
  </tr>
  `
})
export class EmptyComponent {
  /**
   * Número de columnas que debe abarcar la celda vacía (colspan).
   * Debe coincidir con la cantidad de columnas visibles en el thead.
   * @default 6
   */
  @Input() cols = 6;

  /**
   * Mensaje a mostrar cuando no hay resultados.
   * @default 'Sin resultados'
   */
  @Input() text = 'Sin resultados';
}
