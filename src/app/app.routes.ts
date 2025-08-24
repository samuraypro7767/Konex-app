import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard.page';

/**
 * Definición de rutas raíz de la aplicación.
 *
 * - `''` (ruta raíz): Renderiza el `DashboardPage`.
 * - `**` (comodín): Cualquier ruta no reconocida redirige a la raíz.
 *
 * Estas rutas se registran en `appConfig` a través de `provideRouter(routes)`.
 * Revisa `app.config.ts` para la configuración de `provideRouter`.
 */
export const routes: Routes = [
  // Ruta principal de la app
  { path: '', component: DashboardPage },

  // Fallback/wildcard: captura rutas desconocidas
  { path: '**', redirectTo: '' }
];
