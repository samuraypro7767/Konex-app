import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-spinner',
  imports: [CommonModule],
  template: `
  <div class="flex items-center justify-center gap-3"
       [class.fixed]="fullscreen" [class.inset-0]="fullscreen"
       [class.z-50]="fullscreen" [class.bg-white/70]="backdrop"
       [class.backdrop-blur-sm]="backdrop">
    <svg class="animate-spin" [ngClass]="sizeClass" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
      <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
    <span *ngIf="label" class="text-sm text-gray-600">{{ label }}</span>
  </div>
  `,
})
export class SpinnerComponent {
  /** sm | md | lg */
  @Input() size: 'sm'|'md'|'lg' = 'md';
  @Input() label = '';
  /** Si true: pantalla completa con velo */
  @Input() fullscreen = false;
  @Input() backdrop = true;

  get sizeClass() {
    return this.size === 'sm' ? 'w-5 h-5' : this.size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  }
}
