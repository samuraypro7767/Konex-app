// src/app/shared/components/badge-status/badge-status.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Posibles estados visuales del badge:
 * - `'agotado'`: sin stock disponible
 * - `'bajo'`: stock bajo (umbral lo define el padre)
 * - `'ok'`: stock disponible en condiciones normales
 */
type Estado = 'agotado' | 'bajo' | 'ok';

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
   * Estado actual del badge.
   *
   * @default 'ok'
   * @example
   * ```html
   * <app-badge-status [status]="'bajo'"></app-badge-status>
   * ```
   */
  @Input() status: Estado = 'ok';

  /**
   * Etiqueta legible según `status`.
   * @returns Texto a mostrar en el chip (e.g., "Agotado", "Stock bajo", "Disponible").
   */
  get etiqueta(): string {
    switch (this.status) {
      case 'agotado': return 'Agotado';
      case 'bajo':    return 'Stock bajo';
      default:        return 'Disponible';
    }
  }

  /**
   * Clases de Tailwind para el color de fondo y texto según `status`.
   * @returns Clase CSS aplicada al `<span>` (no incluye clases comunes de layout/tipografía).
   */
  get clase(): string {
    switch (this.status) {
      case 'agotado': return 'bg-red-100 text-red-800';
      case 'bajo':    return 'bg-yellow-100 text-yellow-800';
      default:        return 'bg-green-100 text-green-800';
    }
  }
}
