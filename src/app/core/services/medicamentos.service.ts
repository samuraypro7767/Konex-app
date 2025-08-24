import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import {
  MedicamentoRequest,
  MedicamentoResponse,
  CotizacionResponse,
} from '../model/medicamento.model';
import { Page } from '../model/page.model';

/**
 * Servicio de acceso a los endpoints de **Medicamentos**.
 *
 * Responsabilidades:
 * - Listar con paginación y filtro por nombre.
 * - CRUD de medicamentos.
 * - Operaciones de negocio relacionadas (cotizar, descontar stock).
 *
 * Requiere en `environment`:
 * - `apiBase`: URL base de la API (p. ej. `http://localhost:8080/api`)
 * - `medicamentos`: path de este recurso (p. ej. `/medicamentos`)
 */
@Injectable({ providedIn: 'root' })
export class MedicamentosService {
  /** URL base del recurso medicamentos. */
  private readonly base = environment.apiBase + environment.medicamentos;

  constructor(private http: HttpClient) {}

  /**
   * Lista medicamentos paginados, opcionalmente filtrados por nombre.
   *
   * @param nombre Filtro por nombre (contiene). Si está vacío o espacios, no se envía.
   * @param page Índice de página **0-based** (0 = primera página).
   * @param size Tamaño de página (elementos por página).
   * @returns `Observable<Page<MedicamentoResponse>>`
   */
  listar(nombre = '', page = 0, size = 10): Observable<Page<MedicamentoResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const q = nombre.trim();
    if (q) params = params.set('nombre', q);

    return this.http.get<Page<MedicamentoResponse>>(this.base, { params });
  }

  /**
   * Obtiene un medicamento por su ID.
   * @param id Identificador del medicamento.
   * @returns `Observable<MedicamentoResponse>`
   */
  obtener(id: number): Observable<MedicamentoResponse> {
    return this.http.get<MedicamentoResponse>(`${this.base}/${id}`);
  }

  /**
   * Crea un nuevo medicamento.
   * @param body Datos del medicamento.
   * @returns `Observable<MedicamentoResponse>` con el recurso creado.
   */
  crear(body: MedicamentoRequest): Observable<MedicamentoResponse> {
    return this.http.post<MedicamentoResponse>(this.base, body);
  }

  /**
   * Actualiza un medicamento existente.
   * @param id ID del medicamento a actualizar.
   * @param body Datos a persistir.
   * @returns `Observable<MedicamentoResponse>` con el recurso actualizado.
   */
  actualizar(id: number, body: MedicamentoRequest): Observable<MedicamentoResponse> {
    return this.http.put<MedicamentoResponse>(`${this.base}/${id}`, body);
  }

  /**
   * Elimina un medicamento por ID.
   * @param id ID del medicamento.
   * @returns `Observable<void>`
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Cotiza una posible venta de un medicamento (NO realiza la venta).
   *
   * @param medicamentoId ID del medicamento.
   * @param cantidad Cantidad solicitada (entero >= 1).
   * @returns `Observable<CotizacionResponse>` con `valorTotal` y `puedeVender` según stock.
   *
   * @remarks
   * Endpoint esperado: `GET /medicamentos/{id}/cotizar?cantidad=n`.
   */
  cotizar(medicamentoId: number, cantidad: number): Observable<CotizacionResponse> {
    const params = new HttpParams().set('cantidad', cantidad.toString());
    return this.http.get<CotizacionResponse>(`${this.base}/${medicamentoId}/cotizar`, { params });
  }

  /**
   * Descuenta stock de un medicamento (operación de inventario).
   *
   * @param medicamentoId ID del medicamento.
   * @param cantidad Unidades a descontar (entero >= 1).
   * @returns `Observable<void>`
   *
   * @remarks
   * Endpoint esperado: `PATCH /medicamentos/{id}/descontar?cantidad=n`.
   * Usa `null` como body por ser operación idempotente sin payload adicional.
   */
  descontarStock(medicamentoId: number, cantidad: number): Observable<void> {
    const params = new HttpParams().set('cantidad', cantidad.toString());
    return this.http.patch<void>(`${this.base}/${medicamentoId}/descontar`, null, { params });
  }
}
