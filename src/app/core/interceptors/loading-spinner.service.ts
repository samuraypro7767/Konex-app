import { Injectable, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({ providedIn: 'root' })
export class LoadingSpinnerService {
  private spinner = inject(NgxSpinnerService);

  private readonly name = 'httpSpinner'; // 👈 usa el mismo name que en el template
  private readonly minMs = 5000;         // 👈 al menos 5s visible

  private active = 0;
  private visibleSince: number | null = null;
  private hideTimer: any = null;

  show(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    this.active++;
    if (this.active === 1) {
      this.visibleSince = Date.now();
      this.spinner.show(this.name);
    }
  }

  hide(): void {
    if (this.active === 0) return;
    this.active--;
    if (this.active > 0) return;

    const since = this.visibleSince ?? Date.now();
    const elapsed = Date.now() - since;
    const remaining = Math.max(0, this.minMs - elapsed);

    this.hideTimer = setTimeout(() => {
      this.spinner.hide(this.name);
      this.visibleSince = null;
      this.hideTimer = null;
    }, remaining);
  }

  reset(): void {
    this.active = 0;
    this.visibleSince = null;
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    this.spinner.hide(this.name);
  }
}
