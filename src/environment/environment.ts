/**
 * Variables de entorno de la app (perfil local/desarrollo).
 *
 * Convenciones:
 * - `apiBase`: URL base del backend **sin** slash final.
 * - Rutas (`medicamentos`, `ventas`, `health`): comienzan **con** slash.
 *
 * Ejemplo de uso:
 * ```ts
 * // Construcción segura: `${apiBase}${ventas}` => http://localhost:8080/api/ventas
 * this.http.get(`${environment.apiBase}${environment.ventas}`);
 * ```
 *
 * Notas:
 * - Evita doble slash (`//`) o ausencia de slash. Sigue la convención arriba.
 * - Si habilitas CORS en backend, asegúrate de permitir `http://localhost:4200` (o el puerto del front).
 * - Para producción, crea un `environment.prod.ts` (o el esquema que uses)
 *   con el `apiBase` del servidor real.
 */
export const environment = {
  /** URL base del API (sin slash final). */
  apiBase: 'http://localhost:8080',

  /** Endpoint de recursos de medicamentos (comienza con slash). */
  medicamentos: '/api/medicamentos',

  /** Endpoint de recursos de ventas (comienza con slash). */
  ventas: '/api/ventas',

  /** Endpoint de health-check (comienza con slash). */
  health: '/health',
};
