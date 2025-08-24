import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Configuración raíz de la aplicación (standalone).
 *
 * Providers:
 * - `provideBrowserGlobalErrorListeners()`:
 *    Registra listeners globales (window) para capturar errores no manejados
 *    y reportarlos al ErrorHandler de Angular. Útil para logging centralizado.
 *
 * - `provideZoneChangeDetection({ eventCoalescing: true })`:
 *    Activa *event coalescing* (agrupar múltiples eventos en una sola
 *    ejecución de change detection) → menos ciclos y mejores performances
 *    en interfaces con muchos eventos de UI.
 *
 * - `provideRouter(routes)`:
 *    Inyecta el router con las rutas definidas en `app.routes`.
 *
 * - `provideHttpClient(withFetch())`:
 *    Registra `HttpClient` usando la implementación basada en `fetch`
 *    (en lugar de `XMLHttpRequest`). Menor overhead y streaming soportado.
 *
 * Nota:
 * - No dupliques `provideHttpClient()`: si necesitas features, pásalos
 *   como argumentos en una sola llamada (p. ej., `withFetch()`).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ]
};
