import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingSpinnerService } from '../services/loading.service';// 👈 corrige la ruta

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
  constructor(private loader: LoadingSpinnerService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loader.show();
    return next.handle(req).pipe(finalize(() => this.loader.hide()));
  }
}
