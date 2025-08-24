// shared/components/badge-status/badge-status.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Estados posibles del badge:
 * - 'agotado'  → rojo
 * - 'bajo'     → amarillo
 * - 'ok'       → verde (por defecto)
 */
type Estado = 'agotado' | 'bajo' | 'ok';

/**
 * Badge visual para indicar el estado de stock de un medicamento.
 *
 * - Cambia **etiqueta** y **colores** automáticamente según `status`.
 * - Usa utilidades de Tailwind para estilos.
 *
 * ### Uso
 * ```html
 * <app-badge-status [status]="'agotado'"></app-badge-status>
 * <app-badge-status [status]="'bajo'"></app-badge-status>
 * <app-badge-status></app-badge-status> <!-- 'ok' por defecto -->
 * ```
 */
@Component({
  selector: 'app-badge-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          [ngClass]="clase">
      {{ etiqueta }}
    </span>
  `
})
export class BadgeStatusComponent {
  /**
   * Estado a representar por el badge.
   * @default 'ok'
   */
  @Input() status: Estado = 'ok';

  /**
   * Etiqueta textual mostrada dentro del badge acorde al `status`.
   * - 'agotado' → "Agotado"
   * - 'bajo'    → "Stock bajo"
   * - 'ok'      → "Disponible"
   */
  get etiqueta(): string {
    switch (this.status) {
      case 'agotado': return 'Agotado';
      case 'bajo':    return 'Stock bajo';
      default:        return 'Disponible';
    }
  }

  /**
   * Clases CSS (Tailwind) para el color del badge según `status`.
   * - 'agotado' → rojo suave
   * - 'bajo'    → amarillo suave
   * - 'ok'      → verde suave
   */
  get clase(): string {
    switch (this.status) {
      case 'agotado': return 'bg-red-100 text-red-800';
      case 'bajo':    return 'bg-yellow-100 text-yellow-800';
      default:        return 'bg-green-100 text-green-800';
    }
  }
}
