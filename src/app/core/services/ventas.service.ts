import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { VentaCreateRequest, VentaResponse } from '../model/venta.model';

export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type SortParam = `${string},asc` | `${string},desc`;

export interface PageReq {
  page?: number;          // 0-based
  size?: number;          // por defecto 10/20
  sort?: SortParam[];     // ej: ['fechaHora,desc','id,asc']
}

/**
 * Servicio de acceso a los endpoints de **Ventas**.
 */
@Injectable({ providedIn: 'root' })
export class VentasService {
  /** URL base del recurso ventas. */
  private readonly base = environment.apiBase + environment.ventas;

  constructor(private http: HttpClient) {}

  /** Crea una venta. */
  crear(req: VentaCreateRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.base, req);
  }

  /** Obtiene una venta por su ID. */
  obtener(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.base}/${id}`);
  }

  /** ===== Helpers ===== */
  private ymd(v: string | Date): string {
    if (typeof v === 'string') return v;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }

  private buildParams(p?: PageReq, extra?: Record<string, string>): HttpParams {
    let params = new HttpParams();
    if (p?.page != null) params = params.set('page', String(p.page));
    if (p?.size != null) params = params.set('size', String(p.size));
    if (p?.sort?.length) p.sort.forEach(s => (params = params.append('sort', s)));
    if (extra) Object.entries(extra).forEach(([k, v]) => (params = params.set(k, v)));
    return params;
  }

  /** ===== Endpoints paginados ===== */

  /** GET /ventas/all -> Page<VentaResponse> (todas) */
  listarTodasPaged(
    req: PageReq = { page: 0, size: 10, sort: ['fechaHora,desc'] }
  ): Observable<Page<VentaResponse>> {
    const params = this.buildParams(req);
    return this.http.get<Page<VentaResponse>>(`${this.base}/all`, { params });
  }

  /** GET /ventas?desde&hasta&[page,size,sort...] -> Page<VentaResponse> */
  listarPorRangoPaged(
    desde: string | Date,
    hasta: string | Date,
    req: PageReq = { page: 0, size: 10, sort: ['fechaHora,desc'] }
  ): Observable<Page<VentaResponse>> {
    const params = this.buildParams(req, {
      desde: this.ymd(desde),
      hasta: this.ymd(hasta),
    });
    return this.http.get<Page<VentaResponse>>(this.base, { params });
  }

  /** ===== Wrappers compat (devuelven solo el arreglo) ===== */

  /** Mantiene la firma original: Observable<VentaResponse[]> */
  listarTodas(): Observable<VentaResponse[]> {
    return this.listarTodasPaged().pipe(map(p => p.content));
  }

  /** Mantiene la firma original: Observable<VentaResponse[]> */
  listarPorRango(desde: string | Date, hasta: string | Date): Observable<VentaResponse[]> {
    return this.listarPorRangoPaged(desde, hasta).pipe(map(p => p.content));
  }
}
