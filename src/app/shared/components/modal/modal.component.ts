import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal ligero con **content projection**.
 *
 * Características:
 * - Renderiza un overlay oscurecido que cierra al hacer click fuera.
 * - Contenido libre mediante `<ng-content>`.
 * - Encabezado con `title` y botón de cerrar.
 * - Expone eventos `close` y `confirm` para que el contenedor decida acciones.
 *
 * Uso básico:
 * ```html
 * <app-modal
 *   [open]="showForm()"
 *   [title]="'Nuevo Medicamento'"
 *   (close)="showForm.set(false)"
 *   (confirm)="onGuardar()">
 *   <!-- Tu formulario / contenido aquí -->
 * </app-modal>
 * ```
 *
 * Nota: en esta plantilla el botón de **confirmar** no se dibuja; el contenedor
 * puede renderizar su propio botón dentro del contenido y disparar `(confirm)`.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <!-- Render condicional del modal -->
  <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Overlay: click cierra -->
    <div class="absolute inset-0 bg-black/40" (click)="close.emit()"></div>

    <!-- Caja del modal -->
    <div class="relative bg-white rounded-2xl w-full max-w-xl p-6 shadow-lg">
      <!-- Header: título + botón cerrar -->
      <div class="flex items-start justify-between mb-4">
        <h3 class="text-xl font-bold">{{ title }}</h3>
        <button class="text-gray-400 hover:text-gray-600" (click)="close.emit()">✕</button>
      </div>

      <!-- Cuerpo: contenido proyectado por el consumidor -->
      <div class="space-y-3">
        <ng-content></ng-content>
      </div>

      <!--
        Footer (opcional): no se renderiza aquí para mantener el componente genérico.
        Si lo deseas, puedes añadir un bloque con botones Confirmar/Cancelar y
        usar [confirmDisabled] para deshabilitar la acción primaria.
      -->
    </div>
  </div>
  `
})
export class ModalComponent {
  /** Controla la visibilidad del modal. */
  @Input() open = false;

  /** Título a mostrar en el encabezado del modal. */
  @Input() title = '';

  /**
   * Bandera para deshabilitar la acción de confirmar.
   * ⚠️ En esta plantilla no se dibuja un botón de Confirmar;
   * úsala si implementas un footer con ese botón.
   */
  @Input() confirmDisabled = false;

  /** Emite cuando el usuario intenta cerrar (overlay o botón ✕). */
  @Output() close = new EventEmitter<void>();

  /** Emite cuando el usuario confirma (si implementas un footer con botón). */
  @Output() confirm = new EventEmitter<void>();
}
