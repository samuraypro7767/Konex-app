import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasTableComponent } from './ventas-table.component';

describe('VentasTableComponent', () => {
  let component: VentasTableComponent;
  let fixture: ComponentFixture<VentasTableComponent>;

  // Factory robusto: devuelve un objeto con las claves que el componente usa
  // y además añade campos comunes (medicamentoId, valorLinea) para asemejar al modelo real.
  const mkVenta = (opts: any = {}) => ({
    id: opts.id ?? 1,
    fechaHora: opts.fechaHora ?? '2024-06-01T10:15:00Z',
    items: [
      {
        medicamentoId: opts.medicamentoId ?? 10,
        medicamentoNombre: opts.medicamentoNombre ?? 'Paracetamol',
        cantidad: opts.cantidad ?? 2,
        valorUnitario: opts.valorUnitario ?? 1500,
        valorLinea:
          opts.valorLinea ??
          ((opts.cantidad ?? 2) * (opts.valorUnitario ?? 1500)),
        laboratorioNombre: opts.laboratorioNombre, // opcional
      },
    ],
    valorTotal: opts.valorTotal ?? 3000,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasTableComponent], // componente standalone
    }).compileComponents();

    fixture = TestBed.createComponent(VentasTableComponent);
    component = fixture.componentInstance;
  });

  const el = () => fixture.nativeElement as HTMLElement;

  it('debe crearse', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('muestra "Sin ventas" cuando no hay datos y no está cargando', () => {
    component.ventas = [] as any;
    component.cargando = false;
    fixture.detectChanges();

    expect(el().textContent).toContain('Sin ventas');
  });

  it('no muestra "Sin ventas" cuando está cargando', () => {
    component.ventas = [] as any;
    component.cargando = true;
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Sin ventas');
  });

  it('renderiza filas y muestra el contador por defecto', () => {
    component.ventas = [
      mkVenta({ id: 1 }),
      mkVenta({ id: 2, medicamentoNombre: 'Ibuprofeno' }),
    ] as any;
    fixture.detectChanges();

    // 2 filas (sin contar posible fila de vacío)
    const rows = el().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    // contador
    expect(el().textContent).toContain('2 ventas');

    // nombres visibles
    expect(el().textContent).toContain('Paracetamol');
    expect(el().textContent).toContain('Ibuprofeno');
  });

  it('usa totalOverride cuando se proporciona', () => {
    component.ventas = [mkVenta()] as any;
    component.totalOverride = 999;
    fixture.detectChanges();

    expect(el().textContent).toContain('999 ventas');
  });

  it('helper medicamentoNombre: devuelve nombre del primer ítem o "—"', () => {
    const v1 = mkVenta({ medicamentoNombre: 'Amoxicilina' });
    expect(component.medicamentoNombre(v1 as any)).toBe('Amoxicilina');

    const v2 = { ...mkVenta(), items: [] };
    expect(component.medicamentoNombre(v2 as any)).toBe('—');

    const v3 = { ...mkVenta(), items: undefined };
    expect(component.medicamentoNombre(v3 as any)).toBe('—');
  });

  it('helper cantidad: devuelve cantidad del primer ítem o 0', () => {
    const v1 = mkVenta({ cantidad: 7 });
    expect(component.cantidad(v1 as any)).toBe(7);

    const v2 = { ...mkVenta(), items: [] };
    expect(component.cantidad(v2 as any)).toBe(0);
  });

  it('helper valorUnitario: limpia string con símbolos/separadores', () => {
    const v1 = mkVenta({ valorUnitario: '$ 1.234,50' });
    expect(component.valorUnitario(v1 as any)).toBeCloseTo(1234.5, 3);

    const v2 = mkVenta({ valorUnitario: 2500 });
    expect(component.valorUnitario(v2 as any)).toBe(2500);

    const v3 = mkVenta({ valorUnitario: 'abc' as any });
    expect(component.valorUnitario(v3 as any)).toBe(0);
  });

  it('trackVenta: retorna id si existe, o el índice como fallback', () => {
    const v1 = mkVenta({ id: 42 });
    expect(component.trackVenta(3, v1 as any)).toBe(42);

    const v2 = { ...mkVenta(), id: undefined };
    expect(component.trackVenta(5, v2 as any)).toBe(5);
  });

  it('render: muestra valores básicos (medicamento, cantidad y total aproximado)', () => {
    component.ventas = [
      mkVenta({
        medicamentoNombre: 'Diclofenaco',
        cantidad: 3,
        valorUnitario: 2000,
        valorTotal: 6000,
      }),
    ] as any;
    fixture.detectChanges();

    const text = el().textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('Diclofenaco');
    expect(text).toContain('3');
    // total formateado (no validamos símbolo exacto por locale)
    expect(text).toMatch(/6\s*000|6,000|6\.000/);
  });
});
