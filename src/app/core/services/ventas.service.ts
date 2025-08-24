import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { VentaCreateRequest, VentaResponse } from '../model/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly base = environment.apiBase + environment.ventas;

  constructor(private http: HttpClient) {}

  crear(req: VentaCreateRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.base, req);
  }

  obtener(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.base}/${id}`);
  }

  listarPorRango(desde: string | Date, hasta: string | Date): Observable<VentaResponse[]> {
    const d = this.ymd(desde);
    const h = this.ymd(hasta);
    const params = new HttpParams().set('desde', d).set('hasta', h);
    return this.http.get<VentaResponse[]>(this.base, { params });
  }
  listarTodas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.base}/all`);
  }
  private ymd(v: string | Date): string {
    if (typeof v === 'string') return v;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
}
