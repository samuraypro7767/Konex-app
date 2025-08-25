import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';

// Tu interceptor de app (si lo usas)
import { AppHttpInterceptor } from './core/interceptors/interceptor';
// Interceptor del spinner
import { SpinnerInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // HttpClient con fetch y habilitar interceptores por DI
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

    // Orden sugerido: spinner primero, luego el tuyo
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor,  multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },

    provideAnimations(),
    MessageService, ConfirmationService
  ]
};
