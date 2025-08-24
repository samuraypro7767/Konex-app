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

@Injectable({ providedIn: 'root' })
export class MedicamentosService {
  private readonly base = environment.apiBase + environment.medicamentos;

  constructor(private http: HttpClient) {}

  listar(nombre = '', page = 0, size = 10): Observable<Page<MedicamentoResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (nombre.trim()) params = params.set('nombre', nombre.trim());
    return this.http.get<Page<MedicamentoResponse>>(this.base, { params });
  }

  obtener(id: number): Observable<MedicamentoResponse> {
    return this.http.get<MedicamentoResponse>(`${this.base}/${id}`);
  }

  crear(body: MedicamentoRequest): Observable<MedicamentoResponse> {
    return this.http.post<MedicamentoResponse>(this.base, body);
  }

  actualizar(id: number, body: MedicamentoRequest): Observable<MedicamentoResponse> {
    return this.http.put<MedicamentoResponse>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  cotizar(medicamentoId: number, cantidad: number): Observable<CotizacionResponse> {
    const params = new HttpParams().set('cantidad', cantidad);
    return this.http.get<CotizacionResponse>(`${this.base}/${medicamentoId}/cotizar`, { params });
    // devuelve valorTotal y si puedeVender (stock)
  }

  descontarStock(medicamentoId: number, cantidad: number): Observable<void> {
    const params = new HttpParams().set('cantidad', cantidad);
    return this.http.patch<void>(`${this.base}/${medicamentoId}/descontar`, null, { params });
  }
}
