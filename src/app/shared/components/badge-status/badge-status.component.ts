import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge-status',
  standalone: true,
  imports: [CommonModule],
  template: `
  <span
    [ngClass]="{
      'bg-blue-100 text-blue-700': type==='ok',
      'bg-amber-100 text-amber-700': type==='warn',
      'bg-rose-100 text-rose-700': type==='danger'
    }"
    class="text-xs px-3 py-1 rounded-full inline-block">
    <ng-content></ng-content>
  </span>
  `
})
export class BadgeStatusComponent {
  /** 'ok' | 'warn' | 'danger' */
  @Input() type: 'ok'|'warn'|'danger' = 'ok';
}
