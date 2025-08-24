/**
 * Contenedor genérico de paginación (compatible con Spring Data `Page<T>`).
 *
 * Representa una página de resultados y los metadatos necesarios
 * para paginar en el frontend.
 *
 * @typeParam T Tipo de cada elemento dentro de la página.
 */
export interface Page<T> {
  /** Elementos de la página actual. */
  content: T[];

  /** Cantidad total de páginas disponibles (en base a `totalElements` y `size`). */
  totalPages: number;

  /** Cantidad total de elementos en toda la colección (no solo en esta página). */
  totalElements: number;

  /** Tamaño de página solicitado (máximo de elementos por página). */
  size: number;

  /** Índice de la página actual **0-based** (0 = primera página). */
  number: number;
}

/* ---------------- Ejemplo de uso ----------------

function nextPage(p: Page<any>): number | null {
  const next = p.number + 1;
  return next < p.totalPages ? next : null;
}

function hasPrev(p: Page<any>): boolean {
  return p.number > 0;
}

*/
