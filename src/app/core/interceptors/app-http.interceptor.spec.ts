import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppHttpInterceptor } from './interceptor';
import { HttpClient } from '@angular/common/http';

describe('AppHttpInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega Content-Type: application/json', () => {
    http.get('/x').subscribe();
    const req = httpMock.expectOne('/x');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({});
  });

  it('muestra alert() en error', () => {
    const spy = spyOn(window, 'alert');
    http.get('/y').subscribe({
      next: () => fail('debería fallar'),
      error: () => {/* ok */}
    });
    const req = httpMock.expectOne('/y');
    req.flush('error', { status: 500, statusText: 'Server Error' });
    expect(spy).toHaveBeenCalled();
  });
});
