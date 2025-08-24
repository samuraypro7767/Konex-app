import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VentasService } from './ventas.service';
import { environment } from '../../../environment/environment';

describe('VentasService', () => {
  let service: VentasService;
  let httpMock: HttpTestingController;
  const base = environment.apiBase + environment.ventas;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VentasService, provideHttpClient(), provideHttpClientTesting()]
    });
    service   = TestBed.inject(VentasService);
    httpMock  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('crear() POSTea la venta', () => {
    service.crear({ medicamentoId: 1, cantidad: 3 }).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 10 });
  });

  it('obtener() GET /:id', () => {
    service.obtener(5).subscribe();
    const req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5 });
  });

  it('listarPorRango() agrega desde/hasta', () => {
    service.listarPorRango('2025-08-01', '2025-08-31').subscribe();
    const req = httpMock.expectOne(r => r.url === base && r.method === 'GET');
    expect(req.request.params.get('desde')).toBe('2025-08-01');
    expect(req.request.params.get('hasta')).toBe('2025-08-31');
    req.flush([]);
  });

  it('listarTodas() GET /all', () => {
    service.listarTodas().subscribe();
    const req = httpMock.expectOne(`${base}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
