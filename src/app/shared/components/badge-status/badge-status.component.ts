// shared/components/badge-status/badge-status.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() status: Estado = 'ok';

  get etiqueta(): string {
    switch (this.status) {
      case 'agotado': return 'Agotado';
      case 'bajo':    return 'Stock bajo';
      default:        return 'Disponible';
    }
  }
  get clase(): string {
    switch (this.status) {
      case 'agotado': return 'bg-red-100 text-red-800';
      case 'bajo':    return 'bg-yellow-100 text-yellow-800';
      default:        return 'bg-green-100 text-green-800';
    }
  }
}
