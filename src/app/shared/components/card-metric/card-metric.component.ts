// src/app/shared/components/card-metric/card-metric.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-card-metric',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <p-card [styleClass]="'rounded-3xl border  bg-white shadow-sm'">
      <!-- Encabezado (igual a tu diseño) -->
      <ng-template pTemplate="header">
        <div class="px-4 pt-4 text-sm text-gray-500  flex items-center gap-2">
          <ng-content select="[metric-icon]"></ng-content>
          {{ label }}
        </div>
      </ng-template>

      <!-- Contenido -->
      <div class="px-4 pb-4">
        <div class="text-3xl font-normal mt-1">{{ value }}</div>
        <div *ngIf="hint" class="text-xs text-gray-400 mt-1">{{ hint }}</div>
      </div>
    </p-card>
  `
})
export class CardMetricComponent {
  @Input() label = '';
  @Input() value: string | number = '—';
  @Input() hint?: string;
}
