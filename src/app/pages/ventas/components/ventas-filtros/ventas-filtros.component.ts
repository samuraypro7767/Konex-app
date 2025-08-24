import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-ventas-filtros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas-filtros.component.html',
})
export class VentasFiltrosComponent {
  @Output() buscar = new EventEmitter<{ desde: string; hasta: string }>();
  @Output() limpiar = new EventEmitter<void>();

  // FormBuilder vía inject (disponible en Angular 14+)
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    desde: ['', Validators.required],
    hasta: ['', Validators.required],
  });

  onBuscar() {
    if (this.form.valid) {
      this.buscar.emit(this.form.getRawValue());
    }
  }

  onLimpiar() {
    this.form.reset({ desde: '', hasta: '' });
    this.limpiar.emit();
  }
}
