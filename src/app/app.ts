import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
   imports: [RouterOutlet,NgxSpinnerModule],
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('konex-app');
   spinnerHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      <i class="pi pi-cog pi-spin" style="font-size:24px;color:#0ea5e9"></i>
      <p style="color:#fff;margin:0">Cargando…</p>
    </div>
  `;
}
