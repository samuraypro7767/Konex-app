/**
 * Modelos del dominio "Medicamentos" usados en el front.
 * Estos tipos reflejan los DTO expuestos por el backend (Spring Boot).
 *
 * Notas:
 * - Las fechas viajan como string en formato `yyyy-MM-dd` (zona horaria indiferente).
 * - Los montos monetarios están en COP y se tratan como `number` con 2 decimales.
 */

/**
 * Cadena de fecha ISO corta usada por la API (p. ej. "2025-08-24").
 * No valida el calendario; solo ayuda a documentar intención de uso.
 *
 * @example
 * const d: ISODate = '2025-01-31';
 */
export type ISODate = `${number}-${number}-${number}`;

/**
 * Respuesta del backend al consultar un medicamento.
 * Incluye identificadores y datos listos para mostrar.
 */
export interface MedicamentoResponse {
  /** Identificador único del medicamento. */
  id: number;

  /** Nombre comercial del medicamento. */
  nombre: string;

  /** ID del laboratorio fabricante (FK). */
  laboratorioId: number;

  /** Nombre legible del laboratorio (para UI). */
  laboratorioNombre: string;

  /** Fecha de fabricación (formato `yyyy-MM-dd`). */
  fechaFabricacion: ISODate;   // yyyy-MM-dd

  /** Fecha de vencimiento (formato `yyyy-MM-dd`). */
  fechaVencimiento: ISODate;   // yyyy-MM-dd

  /** Unidades disponibles actualmente en inventario. */
  cantidadStock: number;

  /** Precio unitario de venta en COP (2 decimales). */
  valorUnitario: number;
}

/**
 * Payload para crear/actualizar un medicamento.
 * Mismos campos de negocio que el response, sin `id` ni `laboratorioNombre`.
 */
export interface MedicamentoRequest {
  /** Nombre comercial del medicamento. */
  nombre: string;

  /** ID del laboratorio fabricante (FK). */
  laboratorioId: number;

  /** Fecha de fabricación (formato `yyyy-MM-dd`). */
  fechaFabricacion: ISODate;   // yyyy-MM-dd

  /** Fecha de vencimiento (formato `yyyy-MM-dd`). */
  fechaVencimiento: ISODate;   // yyyy-MM-dd

  /** Unidades que se registran en inventario. */
  cantidadStock: number;

  /** Precio unitario de venta en COP (2 decimales). */
  valorUnitario: number;
}

/**
 * Respuesta de cotización al intentar vender un medicamento.
 * Indica si es posible vender la cantidad solicitada y el total calculado.
 */
export interface CotizacionResponse {
  /** ID del medicamento cotizado. */
  medicamentoId: number;

  /** Nombre del medicamento cotizado (para UI). */
  medicamentoNombre: string;

  /** Cantidad solicitada por el usuario. */
  cantidadSolicitada: number;

  /** Unidades disponibles al momento de la cotización. */
  stockDisponible: number;

  /** Precio unitario vigente en COP. */
  valorUnitario: number;

  /** Total = `cantidadSolicitada * valorUnitario` (COP). */
  valorTotal: number;

  /** `true` si hay stock suficiente para completar la venta. */
  puedeVender: boolean;
}

/* ------------------------------------
   Ejemplos de uso
---------------------------------------

const req: MedicamentoRequest = {
  nombre: 'Ibuprofeno 400mg',
  laboratorioId: 3,
  fechaFabricacion: '2025-02-10',
  fechaVencimiento: '2027-02-10',
  cantidadStock: 120,
  valorUnitario: 3200.00,
};

function toLabel(m: MedicamentoResponse) {
  return `${m.nombre} - ${m.laboratorioNombre} (${m.cantidadStock} uds)`;
}

*/
