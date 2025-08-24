import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [CommonModule],
  template: `
  <tr>
    <td [attr.colspan]="cols" class="p-6 text-center text-gray-500">
      {{ text }}
    </td>
  </tr>
  `
})
export class EmptyComponent {
  @Input() cols = 6;
  @Input() text = 'Sin resultados';
}
