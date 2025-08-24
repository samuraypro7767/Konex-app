
KONEX – FRONTEND (Angular) – read.txt
=====================================

Introducción
------------
Prueba técnica para desarrolladores full stack en Java con Spring Boot y Angular, con el
fin de evaluar conocimientos y metodologías aplicadas para el desarrollo.

Este documento describe **exclusivamente el FRONT**: arquitectura, instalación, componentes,
servicios, validaciones, métricas y cómo cubrir los requisitos funcionales/no funcionales.

Resumen de Requisitos Funcionales (FRONT)
-----------------------------------------
1) **CRUD de Medicamentos** (crear, consultar, actualizar, eliminar):
   - Campos: nombre, laboratorio de fábrica, fecha de fabricación, fecha de vencimiento,
     cantidad en stock, valor unitario.
2) **Filtro + tabla paginada** de medicamentos.
3) Por cada fila: **Vender / Editar / Eliminar**.
4) **Modal de venta**:
   - Solicita cantidad, calcula y muestra **total a pagar**.
   - Valida stock: no permite vender más que lo disponible.
5) **Confirmar venta**: actualiza inventario (stock) y **registra venta** con:
   fecha/hora, medicamento, cantidad, valor unitario, valor total.
6) **Listado y filtro de ventas** por rango de fechas.

Requisitos No Funcionales (enfocados al FRONT)
----------------------------------------------
- Front construido en **Angular**.
-Este frontend está construido en Angular usando PrimeNG, la variante oficial de la familia PrimeFaces para Angular.
- El enunciado sugiere *PrimeFaces/PrimeNG*; este front está implementado con **Angular standalone**
  y estilos utilitarios (Tailwind-like) + componentes propios. En la sección “Opcional PrimeNG”
  se anexa una guía para sustituir componentes por PrimeNG si el evaluador lo requiere.
- Se incluyen **prácticas de testing** sugeridas y estructura limpia para favorecer cobertura.
- El backend se asume en **Spring Boot (Java 17)** con base de datos **Oracle** (ya manejado
  por el proyecto de backend).

Stack y Versiones
-----------------
- **Angular** moderno (standalone components).
- **HttpClient** con `withFetch()`.
- **RxJS** para flujos de datos.
- **SweetAlert2** (UX de confirmaciones/toasts).
- **TypeScript** estricto y modelos tipados.

Ejecución local
---------------
1) Backend arriba en: `http://localhost:8080` (ver `environment.ts`).
2) Instalar dependencias:
   ```bash
   npm install
   ```
3) Levantar dev server:
   ```bash
   npm start     # o: ng serve
   ```
4) App en: `http://localhost:4200`.

Configuración (app.config.ts / routes / environment.ts)
-------------------------------------------------------
- `app.config.ts`
  - `provideRouter(routes)` para ruteo.
  - `provideHttpClient(withFetch())` para usar fetch API.
  - `provideBrowserGlobalErrorListeners()` y `provideZoneChangeDetection(...)` para rendimiento.
- `routes.ts`
  - Ruta raíz: `DashboardPage` (tabs: Inventario / Ventas).
  - Fallback `**` redirige a raíz.
- `environment.ts`
  - `apiBase = http://localhost:8080`
  - Rutas: `/api/medicamentos`, `/api/ventas`, `/health`.

Arquitectura de Carpetas (resumen)
----------------------------------
- `core/`
  - `model/` → *interfaces*:
    - `medicamento.model.ts` (Request/Response y `CotizacionResponse`)
    - `venta.model.ts` (CreateRequest, ItemResponse, Response)
    - `page.model.ts` (paginación genérica)
  - `services/`
    - `medicamentos.service.ts` → CRUD + cotizar + descontar
    - `ventas.service.ts` → crear/obtener/listar por rango + listar todas
  - `interceptors/`
    - `app-http.interceptor.ts` → cabeceado JSON + captura de errores
  - `utils/`
    - `toIsoDate(...), toIsoDateSafe(...)`
    - `dateRangeValidator(...)`
- `shared/`
  - `components/`
    - `badge-status/` → etiqueta visual (“Disponible / Stock bajo / Agotado”)
    - `card-metric/` → tarjetas de métricas
    - `modal/` → modal reutilizable
    - `empty/` → fila vacía para tablas
  - `pipes/`
    - `currency-col.pipe.ts` → formateo COP (es-CO)
- `pages/`
  - `dashboard/` → header + tabs y panel de notificaciones
  - `inventario/` → listado, filtros, modal vender, modal CRUD
    - `components/medicamento-form/` → formulario crear/editar (valida laboratorio permitido)
    - `components/vender-dialog/` → diálogo de venta (valida stock + total en vivo)
  - `ventas/` → listado de ventas, filtros rango, métricas
    - `components/ventas-filtros/` → formulario rango fechas
    - `components/ventas-table/` → tabla ventas

Cobertura de Requisitos (detalle)
---------------------------------
**Inventario**
- **Listado + paginación + filtro por nombre**: `InventarioPage` usa `MedicamentosService.listar(...)` con
  `page/size` y `nombre` opcional. Muestra métricas: total de medicamentos, stock total, stock bajo.
- **Acciones por fila**:
  - **Vender** → `VenderDialogComponent`
    - Input de cantidad con botones +/−.
    - Valida `min=1` y `max=stock` (no permite exceder stock).
    - Llama a `meds.cotizar(...)` para obtener `valorTotal` y `puedeVender`.
    - Muestra `total` (de la cotización o calculado localmente).
    - Al confirmar: `ventas.crear(...)` y refresca inventario + métrica de ingresos del mes.
  - **Editar** → `MedicamentoFormComponent` con `initial` para precarga, validador de laboratorio permitido.
  - **Eliminar** → confirmación con SweetAlert2 + llamada a `meds.eliminar(...)`.
- **Modal CRUD**: `ModalComponent` genérico + `MedicamentoFormComponent`.
- **Validaciones UX**: mensajes cuando faltan campos, cantidades fuera de rango, y botón deshabilitado
  si el form es inválido.
- **Ingresos del mes (métrica)**: `InventarioPage.loadIngresosMes()` usa `ventas.listarPorRango()`
  del 1 al último día del mes y suma `valorTotal`.

**Ventas**
- **Listado completo**: `VentasPage` carga `ventas.listarTodas()` al iniciar.
- **Filtro por rango de fechas**: `VentasFiltrosComponent` emite `{ desde, hasta }` y
  `VentasPage.onBuscar()` llama `ventas.listarPorRango(...)`.
- **Métricas**: total de ventas, ingresos totales, promedio por venta y **ingresos del mes** (solo las ventas
  del mes corriente por `fechaHora`).

Servicios HTTP (contratos)
--------------------------
- `MedicamentosService`
  - `listar(nombre?, page?, size?)` → `Page<MedicamentoResponse>`
  - `obtener(id)` → `MedicamentoResponse`
  - `crear(...)` / `actualizar(id, ...)` → `MedicamentoResponse`
  - `eliminar(id)` → `void`
  - `cotizar(medicamentoId, cantidad)` → `CotizacionResponse { valorTotal, puedeVender, ... }`
  - `descontarStock(...)` → `void` (si el backend lo expone; en la solución, el descuento sucede al confirmar venta)
- `VentasService`
  - `crear({ medicamentoId, cantidad })` → `VentaResponse`
  - `obtener(id)` → `VentaResponse`
  - `listarPorRango(desde, hasta)` → `VentaResponse[]`
  - `listarTodas()` → `VentaResponse[]`

Manejo de errores
-----------------
- **Interceptor** (`AppHttpInterceptor`):
  - Fuerza `Content-Type: application/json` (puedes restringirlo a requests con body si lo prefieres).
  - `catchError` → `alert(...)` sencillo global (sustituible por un servicio de toasts).
- **SweetAlert2**:
  - Confirmaciones para eliminar y vender.
  - Loadings mientras se procesa la operación.
  - Toasts de éxito/fracaso.

Pipes y Utilidades
------------------
- `currencyCol` (COP, `es-CO`, sin decimales). Ej: `{{ 1250000 | currencyCol }}` → `$ 1.250.000`.
- `toIsoDate(...)` y `toIsoDateSafe(...)` para formato `YYYY-MM-DD` (nota de zonas horarias).
- `dateRangeValidator` para validar que `desde ≤ hasta` en formularios de rango.

Notificaciones (Dashboard)
--------------------------
- El `DashboardPage` genera **alertas** (agotado, stock bajo, vencido/por vencer) a partir de
  las filas visibles del inventario. Un indicador en la campana muestra cantidad de alertas
  pendientes; al abrir el panel, se marcan como leídas.

Accesibilidad y UX
------------------
- Botones deshabilitados cuando el formulario es inválido.
- Errores visibles bajo los campos de cantidad (requerido, mínimo, máximo).
- Indicadores de estado visuales (badges) y ayudas contextuales en métricas.

Testing (sugerencias)
---------------------
- **Componentes**: pruebas de:
  - Render correcto de métricas y tablas con datos simulados.
  - Validaciones del `VenderDialogComponent` (min/max).
  - Emisión de eventos `buscar/limpiar` en filtros.
- **Servicios**: usar `HttpTestingController` para mockear respuestas (200/4xx/5xx).
- **Pipes**: snapshot simple del output del `currencyCol`.
- **E2E**: flujo crítico “Vender” (abrir modal, cambiar cantidad, confirmar, ver actualización de stock/ventas).

Opcional PrimeNG (si el evaluador lo requiere)
----------------------------------------------
La app ya cumple los requisitos con componentes propios. Si se pide explícitamente usar PrimeNG:
1) Instalar:
   ```bash
   npm i primeng primeicons
   ```
2) Importar estilos en `styles.css`:
   ```css
   @import "primeicons/primeicons.css";
   @import "primeng/resources/themes/lara-light-blue/theme.css";
   @import "primeng/resources/primeng.min.css";
   ```
3) Reemplazar componentes clave:
   - Botones → `p-button`
   - Tabla inventario/ventas → `p-table` con `[paginator]="true"`
   - Modal vender/CRUD → `p-dialog`
   - Inputs y selects → `p-inputText`, `p-inputNumber`, `p-calendar`, `p-dropdown`
4) Validaciones y bindings se mantienen (Reactive Forms).

Buenas prácticas observadas
---------------------------
- **Standalone Components** y señales (`signal/computed`) para estado reactivo ligero.
- **Tipado fuerte** en modelos de dominio.
- **Separación de responsabilidades** (páginas, componentes UI, servicios, pipes).
- **UX responsivo** y feedback de acciones (toasts/diálogos).
- **Helpers** de fechas y moneda centralizados.

Notas finales
-------------
- Este FRONT está listo para conectarse al backend Spring Boot publicado en `http://localhost:8080`.
- Si el backend cambia de host/puerto, ajusta `environment.apiBase`.
- Para producción, crea `environment.production.ts` con el `apiBase` del entorno real.
