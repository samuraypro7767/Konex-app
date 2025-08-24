import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-metric',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="rounded-2xl border p-4 shadow-sm bg-white">
    <div class="text-sm text-gray-500 flex items-center gap-2">
      <ng-content select="[metric-icon]"></ng-content>
      {{ label }}
    </div>
    <div class="text-3xl font-extrabold mt-1">{{ value }}</div>
    <div *ngIf="hint" class="text-xs text-gray-400 mt-1">{{ hint }}</div>
  </div>
  `
})
export class CardMetricComponent {
  @Input() label = '';
  @Input() value: string | number = '—';
  @Input() hint?: string;
}
