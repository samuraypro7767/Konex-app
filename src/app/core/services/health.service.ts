import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable } from 'rxjs';

/**
 * Servicio de health-check del backend.
 *
 * Se usa para comprobar conectividad con la API (ej. `/health` o `/ping`)
 * y poder reflejar el estado en la UI (online/offline).
 *
 * Requiere que en `environment` existan:
 * - `apiBase`: string base de la API (p. ej. `http://localhost:8080/api`)
 * - `health`: path del endpoint de health (p. ej. `/health`)
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private http: HttpClient) {}

  /**
   * Realiza un ping al backend y devuelve la respuesta como texto plano.
   *
   * @returns `Observable<string>` con el cuerpo de la respuesta.
   *
   * @example
   * this.health.ping().subscribe({
   *   next: txt => console.log('Health:', txt), // ej: "OK"
   *   error: err => console.error('API down?', err)
   * });
   *
   * @remarks
   * Si tu proyecto usa TypeScript estricto y te marca error de overload
   * con `responseType: 'text'`, revisa las alternativas comentadas abajo.
   */
  ping(): Observable<string> {
    const url = environment.apiBase + environment.health;

    // Opción habitual (Angular reciente suele inferir Observable<string>):
    return this.http.get(url, { responseType: 'text' });

    // --- Alternativas seguras de tipado (descomenta la que prefieras) ---

    // 1) Forzar el genérico y castear responseType:
    // return this.http.get<string>(url, { responseType: 'text' as 'json' });

    // 2) Castear el resultado:
    // return this.http.get(url, { responseType: 'text' }) as Observable<string>;

    // 3) Usar 'as const' (TS 4.5+):
    // return this.http.get(url, { responseType: 'text' as const });
  }
}
