/**
 * Modelos del dominio "Ventas" usados en el front.
 * Reflejan los DTO de la API (Spring Boot).
 *
 * Notas:
 * - Los importes monetarios están en COP y se manejan como `number` con 2 decimales.
 * - `fechaHora` viaja como string ISO-8601 (ej: "2025-08-24T12:34:56").
 */

/**
 * Cadena de fecha/hora ISO-8601.
 * Ejemplos válidos:
 *  - "2025-08-24T10:00:00"
 *  - "2025-08-24T10:00:00Z"
 *  - "2025-08-24T10:00:00-05:00"
 */
export type ISODateTime = `${number}-${number}-${number}T${number}:${number}:${number}${string}`;

/** Payload para crear una venta de un medicamento. */
export interface VentaCreateRequest {
  /** ID del medicamento a vender. */
  medicamentoId: number;

  /** Cantidad de unidades a vender (entero >= 1). */
  cantidad: number;
}

/**
 * Ítem (línea) de una venta.
 * Invariante: `valorLinea = cantidad * valorUnitario`.
 */
export interface VentaItemResponse {
  /** ID del medicamento vendido. */
  medicamentoId: number;

  /** Nombre legible del medicamento (para UI). */
  medicamentoNombre: string;

  /** Unidades vendidas en esta línea. */
  cantidad: number;

  /** Precio unitario aplicado (COP). */
  valorUnitario: number;

  /** Total de la línea (COP). */
  valorLinea: number;
}

/**
 * Respuesta de la API al consultar/crear una venta.
 * Invariante: `valorTotal = sum(items.map(i => i.valorLinea))`.
 */
export interface VentaResponse {
  /** Identificador único de la venta. */
  id: number;

  /** Fecha/hora efectiva de la venta (ISO-8601). */
  fechaHora: ISODateTime;    // ISO

  /** Total de la venta (COP). */
  valorTotal: number;

  /** Detalle de líneas vendidas. */
  items: VentaItemResponse[];
}

/* ------------------------------------
   Ejemplos de uso
---------------------------------------

const req: VentaCreateRequest = { medicamentoId: 42, cantidad: 3 };

function calcularTotalLocal(items: VentaItemResponse[]): number {
  return items.reduce((acc, it) => acc + it.valorLinea, 0);
}

*/