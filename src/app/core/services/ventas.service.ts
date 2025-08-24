import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { VentaCreateRequest, VentaResponse } from '../model/venta.model';

/**
 * Servicio de acceso a los endpoints de **Ventas**.
 *
 * Responsabilidades:
 * - Crear y obtener ventas.
 * - Listar ventas por rango de fechas (día a día).
 * - Listar todas las ventas.
 *
 * Requiere en `environment`:
 * - `apiBase`: URL base de la API (p. ej. `http://localhost:8080/api`)
 * - `ventas`: path del recurso (p. ej. `/ventas`)
 */
@Injectable({ providedIn: 'root' })
export class VentasService {
  /** URL base del recurso ventas. */
  private readonly base = environment.apiBase + environment.ventas;

  constructor(private http: HttpClient) {}

  /**
   * Crea una venta.
   * @param req Datos de la venta (ID de medicamento y cantidad).
   * @returns `Observable<VentaResponse>` con la venta creada.
   */
  crear(req: VentaCreateRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.base, req);
  }

  /**
   * Obtiene una venta por su ID.
   * @param id Identificador de la venta.
   * @returns `Observable<VentaResponse>`
   */
  obtener(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.base}/${id}`);
  }

  /**
   * Lista ventas dentro de un rango de fechas (inclusive).
   *
   * @param desde Fecha inicial (string `yyyy-MM-dd` o `Date`).
   * @param hasta Fecha final (string `yyyy-MM-dd` o `Date`).
   * @returns `Observable<VentaResponse[]>`
   *
   * @remarks
   * - El backend espera formato **`yyyy-MM-dd`** en ambos parámetros.
   * - Si pasas `Date`, se formatea con {@link ymd}.
   * - Endpoint esperado: `GET /ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
   */
  listarPorRango(desde: string | Date, hasta: string | Date): Observable<VentaResponse[]> {
    const d = this.ymd(desde);
    const h = this.ymd(hasta);
    const params = new HttpParams().set('desde', d).set('hasta', h);
    return this.http.get<VentaResponse[]>(this.base, { params });
  }

  /**
   * Lista **todas** las ventas sin filtro de fechas.
   * @returns `Observable<VentaResponse[]>`
   *
   * @remarks
   * Endpoint esperado: `GET /ventas/all`
   */
  listarTodas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.base}/all`);
  }

  /**
   * Formatea una fecha a `yyyy-MM-dd`. Si ya es string, la retorna tal cual.
   * @param v Fecha como `string` o `Date`.
   * @returns Cadena en formato `yyyy-MM-dd`.
   *
   * @example
   * ymd(new Date(2025, 7, 24)) // "2025-08-24"
   */
  private ymd(v: string | Date): string {
    if (typeof v === 'string') return v;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
}
