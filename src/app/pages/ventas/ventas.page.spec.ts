import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { VentasPage } from './ventas.page';
import { VentasService } from '../../core/services/ventas.service';
import { VentaResponse } from '../../core/model/venta.model';

// ===================== Dummies/Stubs =====================
@Component({
  selector: 'app-card-metric',
  standalone: true,
  template: `<div class="dummy-card">{{label}}:{{value}}<ng-content></ng-content></div>`
})
class DummyCardMetricComponent {
  @Input() label = '';
  @Input() value: any;
  @Input() hint?: string;
}

@Component({
  selector: 'app-ventas-filtros',
  standalone: true,
  template: `
    <div class="dummy-filtros">
      <button id="emit-buscar" (click)="buscar.emit({desde:'2025-01-01', hasta:'2025-01-31'})">buscar</button>
      <button id="emit-limpiar" (click)="limpiar.emit()">limpiar</button>
    </div>
  `
})
class DummyVentasFiltrosComponent {
  @Output() buscar = new EventEmitter<{desde:string; hasta:string}>();
  @Output() limpiar = new EventEmitter<void>();
}

@Component({
  selector: 'app-ventas-table',
  standalone: true,
  template: `<div class="dummy-table">rows: {{ventas?.length || 0}}</div>`
})
class DummyVentasTableComponent {
  @Input() ventas: VentaResponse[] = [];
  @Input() cargando = false;
  @Input() totalOverride?: number;
}

@Pipe({ name: 'currencyCol', standalone: true })
class DummyCurrencyColPipe implements PipeTransform {
  transform(v: unknown): string {
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? '$ 0' : `$ ${Math.round(n)}`;
  }
}

// =============== Mock service ===============
class MockVentasService {
  listarTodas = jasmine.createSpy('listarTodas');
  listarPorRango = jasmine.createSpy('listarPorRango');
}

// =============== Helpers de datos para tests ===============
type VentaItem = {
  medicamentoId?: number;
  medicamentoNombre?: string;
  cantidad?: number;
  valorUnitario?: number | string;
  valorLinea?: number;
};

function venta(
  id: number,
  overrides: Partial<VentaResponse> = {},
  item: Partial<VentaItem> = {}
): VentaResponse {
  const it: any = {
    medicamentoId: 1,
    medicamentoNombre: 'Paracetamol 500mg',
    cantidad: 2,
    valorUnitario: 1000,
    valorLinea: 2000,
    ...item,
  };
  return {
    id,
    fechaHora: '2025-01-10T10:00:00Z',
    items: [it],
    valorTotal: it.valorLinea ?? 2000,
    ...overrides,
  } as any;
}

describe('VentasPage', () => {
  let fixture: ComponentFixture<VentasPage>;
  let component: VentasPage;
  let service: MockVentasService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasPage],
      providers: [{ provide: VentasService, useClass: MockVentasService }],
    })
      .overrideComponent(VentasPage, {
        set: {
          // Reemplazamos imports reales por dummies para mantener el test aislado
          imports: [CommonModule, DummyCardMetricComponent, DummyCurrencyColPipe, DummyVentasFiltrosComponent, DummyVentasTableComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VentasPage);
    component = fixture.componentInstance;
    service = TestBed.inject(VentasService) as unknown as MockVentasService;
  });

  it('debe crearse', () => {
    service.listarTodas.and.returnValue(of([]));
    fixture.detectChanges(); // ngOnInit -> cargarTodas
    expect(component).toBeTruthy();
  });

  it('carga inicial (ngOnInit) llama listarTodas y llena ventas', () => {
    const data = [venta(1), venta(2)];
    service.listarTodas.and.returnValue(of(data));

    fixture.detectChanges(); // dispara ngOnInit
    expect(service.listarTodas).toHaveBeenCalledTimes(1);
    expect(component.ventas().length).toBe(2);
    expect(component.totalVentas()).toBe(2);

    // child table recibe los datos
    const tableDe = fixture.debugElement.query(By.directive(DummyVentasTableComponent));
    const tableCmp = tableDe.componentInstance as DummyVentasTableComponent;
    expect(tableCmp.ventas.length).toBe(2);
  });

  it('KPIs: totalVentas, ingresosTot (parsea strings) y promedioVenta', () => {
    // mezcla número y string con separadores
    component.ventas.set([
      venta(1, { valorTotal: 1500 }),
      // "$ 1.234,56" -> 1234.56 -> redondeo en pipe de prueba no afecta aquí (usa toNumber real)
      { ...venta(2), valorTotal: '$ 1.234,50' } as any,
      venta(3, { valorTotal: '2.000' } as any),
    ]);
    // ingresosTot usa toNumber real del componente
    const expected = 1500 + 1234.5 + 2000;
    expect(Math.round(component.ingresosTot())).toBe(Math.round(expected));
    expect(component.totalVentas()).toBe(3);
    expect(component.promedioVenta()).toBe(Math.round(expected / 3));
  });

  it('onBuscar usa listarPorRango y reemplaza las filas', () => {
    const rango = { desde: '2025-01-01', hasta: '2025-01-31' };
    const filtered = [venta(10), venta(11)];
    service.listarPorRango.and.returnValue(of(filtered));

    component.onBuscar(rango);
    expect(service.listarPorRango).toHaveBeenCalledOnceWith(rango.desde, rango.hasta);
    expect(component.ventas().length).toBe(2);
    expect(component.cargando()).toBeFalse();
  });

  it('onBuscar ignora invocación si rango incompleto', () => {
    service.listarPorRango.calls.reset();
    component.onBuscar({ desde: '', hasta: '2025-01-31' });
    expect(service.listarPorRango).not.toHaveBeenCalled();
  });

  it('onLimpiar vuelve a cargar todas', () => {
    const all = [venta(1), venta(2), venta(3)];
    service.listarTodas.and.returnValue(of(all));
    component.onLimpiar();
    expect(service.listarTodas).toHaveBeenCalled();
    expect(component.ventas().length).toBe(3);
  });

  it('normalizeVentas: acepta array y wrappers (content/data/items)', () => {
    // 1) array directo (via listarPorRango)
    const arr = [venta(1)];
    service.listarPorRango.and.returnValue(of(arr));
    component.onBuscar({ desde: '2025-01-01', hasta: '2025-01-31' });
    expect(component.ventas().length).toBe(1);

    // 2) {content: [...]}
    service.listarPorRango.and.returnValue(of({ content: [venta(2), venta(3)] }));
    component.onBuscar({ desde: '2025-02-01', hasta: '2025-02-28' });
    expect(component.ventas().length).toBe(2);

    // 3) {data: [...]}
    service.listarPorRango.and.returnValue(of({ data: [venta(4)] }));
    component.onBuscar({ desde: '2025-03-01', hasta: '2025-03-31' });
    expect(component.ventas().length).toBe(1);

    // 4) {items: [...]}
    service.listarPorRango.and.returnValue(of({ items: [venta(5), venta(6), venta(7)] }));
    component.onBuscar({ desde: '2025-04-01', hasta: '2025-04-30' });
    expect(component.ventas().length).toBe(3);

    // 5) fallback -> []
    service.listarPorRango.and.returnValue(of({ whatever: 123 }));
    component.onBuscar({ desde: '2025-05-01', hasta: '2025-05-31' });
    expect(component.ventas().length).toBe(0);
  });

  it('helpers de tabla: medicamentoNombre, cantidad, valorUnitario, trackVenta', () => {
    const vEmpty = {} as unknown as VentaResponse;
    expect(component.medicamentoNombre(vEmpty)).toBe('—');
    expect(component.cantidad(vEmpty)).toBe(0);
    expect(component.valorUnitario(vEmpty)).toBe(0);

    const vOk = venta(42, {}, { medicamentoNombre: 'Ibuprofeno 400mg', cantidad: 7, valorUnitario: '1.234,56' });
    expect(component.medicamentoNombre(vOk)).toBe('Ibuprofeno 400mg');
    expect(component.cantidad(vOk)).toBe(7);
    // toNumber convierte "1.234,56" -> 1234.56
    expect(Math.round(component.valorUnitario(vOk))).toBe(1235);

    // track
    expect(component.trackVenta(0, vOk)).toBe(42);
    expect(component.trackVenta(5, {} as any)).toBe(5);
  });
});
