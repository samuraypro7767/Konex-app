import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" (click)="close.emit()"></div>
    <div class="relative bg-white rounded-2xl w-full max-w-xl p-6 shadow-lg">
      <div class="flex items-start justify-between mb-4">
        <h3 class="text-xl font-bold">{{ title }}</h3>
        <button class="text-gray-400 hover:text-gray-600" (click)="close.emit()">✕</button>
      </div>

      <div class="space-y-3">
        <ng-content></ng-content>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button class="px-3 py-2 rounded-xl border" (click)="close.emit()">Cancelar</button>
        <button class="px-3 py-2 rounded-xl bg-sky-600 text-white disabled:opacity-60"
                [disabled]="confirmDisabled"
                (click)="confirm.emit()">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() confirmText = 'Aceptar';
  @Input() confirmDisabled = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
