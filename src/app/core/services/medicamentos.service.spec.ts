import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MedicamentosService } from './medicamentos.service';
import { environment } from '../../../environment/environment';

// 👇 Ayuda de tipos para las fechas en formato YYYY-MM-DD
type ISODate = `${number}-${number}-${number}`;

describe('MedicamentosService', () => {
  let service: MedicamentosService;
  let httpMock: HttpTestingController;
  const base = environment.apiBase + environment.medicamentos;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MedicamentosService, provideHttpClient(), provideHttpClientTesting()]
    });
    service   = TestBed.inject(MedicamentosService);
    httpMock  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar() debe enviar page/size y nombre cuando aplica', () => {
    service.listar('ibu', 2, 20).subscribe();
    const req = httpMock.expectOne(r => r.url === base && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('nombre')).toBe('ibu');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 20 });
  });

  it('obtener() debe llamar /:id', () => {
    service.obtener(7).subscribe();
    const req = httpMock.expectOne(`${base}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 });
  });

  it('crear() debe POSTear body', () => {
    const body = {
      nombre: 'Ibu',
      laboratorioId: 1,
      fechaFabricacion: '2025-01-01' as ISODate,  // 👈 cast al template literal
      fechaVencimiento: '2026-01-01' as ISODate, // 👈 cast al template literal
      cantidadStock: 10,
      valorUnitario: 1000
    };
    service.crear(body).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 1, ...body });
  });

  it('actualizar() debe PUT a /:id', () => {
    const body = {
      nombre: 'IbuX',
      laboratorioId: 2,
      fechaFabricacion: '2025-01-01' as ISODate,  // 👈 cast al template literal
      fechaVencimiento: '2026-01-01' as ISODate, // 👈 cast al template literal
      cantidadStock: 5,
      valorUnitario: 2000
    };
    service.actualizar(9, body).subscribe();
    const req = httpMock.expectOne(`${base}/9`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 9, ...body });
  });

  it('eliminar() debe DELETE /:id', () => {
    service.eliminar(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('cotizar() arma query cantidad y endpoint correcto', () => {
    service.cotizar(11, 4).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/11/cotizar`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('cantidad')).toBe('4');
    req.flush({ valorTotal: 4000, puedeVender: true });
  });

  it('descontarStock() hace PATCH con cantidad', () => {
    service.descontarStock(11, 2).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/11/descontar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.get('cantidad')).toBe('2');
    req.flush(null);
  });
});
