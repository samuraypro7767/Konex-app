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

  /**
   * Interceptor HTTP global de la aplicación.
   *
   * Responsabilidades:
   * - Garantizar que las peticiones salgan con el encabezado `Content-Type: application/json`.
   * - Centralizar el manejo de errores HTTP (log y notificación simple).
   *
   * @param req Petición HTTP original inmutable.
   * @param next Encadenador que continúa el flujo de la petición.
   * @returns Flujo de eventos HTTP (`HttpEvent`) de la respuesta.
   *
   * @remarks
   * - Si en algún caso envías `FormData` (subida de archivos), es preferible **no** forzar el
   *   `Content-Type` aquí (el navegador lo establece automáticamente con el boundary).
   * - Este interceptor muestra un `alert()` de ejemplo; en producción es mejor un servicio de
   *   notificaciones (toast/snackbar) y mensajes más amigables por código de estado.
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clona la request para añadir/forzar el header JSON.
    const jsonReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });

    // Continúa el pipeline y captura errores para tratarlos de forma centralizada.
    return next.handle(jsonReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log técnico
        console.error('[HTTP ERROR]', error);

        // Notificación simple al usuario (placeholder)
        alert(`Error ${error.status}: ${error.message}`);

        // Repropaga el error para que el suscriptor decida qué hacer.
        return throwError(() => error);
      })
    );
  }
}
