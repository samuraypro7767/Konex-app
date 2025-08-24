import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tarjeta/“badge” para mostrar una métrica (kpi) con:
 * - un **icono** opcional vía `<ng-content select="[metric-icon]">`,
 * - una **etiqueta** (`label`),
 * - un **valor** principal (`value`),
 * - y un **hint** opcional (`hint`), p.ej. “mes actual”.
 *
 * ### Uso
 * ```html
 * <app-card-metric [label]="'Ingresos del Mes'" [value]="(ingresosMes() | currencyCol)" [hint]="'mes actual'">
 *   <span metric-icon>
 *     <svg class="w-4 h-4" ...></svg>
 *   </span>
 * </app-card-metric>
 * ```
 */
@Component({
  selector: 'app-card-metric',
  standalone: true,
  imports: [CommonModule],
  template: `
  <!-- Contenedor visual de la métrica -->
  <div class="rounded-2xl border p-4 shadow-sm bg-white">
    <!-- Encabezado: icono proyectado + etiqueta -->
    <div class="text-sm text-gray-500 flex items-center gap-2">
      <ng-content select="[metric-icon]"></ng-content>
      {{ label }}
    </div>

    <!-- Valor principal (número/texto grande) -->
    <div class="text-3xl font-normal mt-1">{{ value }}</div>

    <!-- Nota/hint opcional bajo el valor -->
    <div *ngIf="hint" class="text-xs text-gray-400 mt-1">{{ hint }}</div>
  </div>
  `
})
export class CardMetricComponent {
  /** Etiqueta descriptiva de la métrica (p.ej. “Ingresos del Mes”). */
  @Input() label = '';

  /** Valor a mostrar; acepta `string` o `number`. Por defecto, “—”. */
  @Input() value: string | number = '—';

  /** Texto auxiliar opcional (p.ej. “mes actual”, “página actual”, etc.). */
  @Input() hint?: string;
}
