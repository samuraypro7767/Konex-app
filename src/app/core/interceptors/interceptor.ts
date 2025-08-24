import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clonar request y asegurar JSON header
    const jsonReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });

    return next.handle(jsonReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[HTTP ERROR]', error);

        // Aquí puedes mostrar un toast global si quieres
        alert(`Error ${error.status}: ${error.message}`);

        return throwError(() => error);
      })
    );
  }
}
