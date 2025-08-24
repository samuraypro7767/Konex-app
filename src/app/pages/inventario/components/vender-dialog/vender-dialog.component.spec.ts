import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VenderDialogComponent } from './vender-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('VenderDialogComponent', () => {
  let fixture: ComponentFixture<VenderDialogComponent>;
  let comp: VenderDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, VenderDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VenderDialogComponent);
    comp = fixture.componentInstance;
  });

  it('clampa la cantidad al stock y el control queda válido (sin error max)', () => {
    // stock = 3
    comp.seleccionado = {
      id: 1,
      nombre: 'Ibu',
      laboratorioId: 1,
      laboratorioNombre: 'Lab',
      fechaFabricacion: '2025-01-01',
      fechaVencimiento: '2026-01-01',
      cantidadStock: 3,
      valorUnitario: 1000
    };
    fixture.detectChanges();

    // intento poner 5 -> se debe clamped a 3 y quedar válido
    comp.setCantidad(5);

    const ctrl = comp.form.controls.cantidad;
    expect(ctrl.value).toBe(3);
    expect(ctrl.hasError('max')).toBeFalse();
    expect(ctrl.valid).toBeTrue();
  });

  it('onConfirmar emite con la cantidad clamped si se intenta superar stock', () => {
    // stock = 2
    comp.seleccionado = {
      id: 1,
      nombre: 'Ibu',
      laboratorioId: 1,
      laboratorioNombre: 'Lab',
      fechaFabricacion: '2025-01-01',
      fechaVencimiento: '2026-01-01',
      cantidadStock: 2,
      valorUnitario: 1000
    };
    fixture.detectChanges();

    const spy = spyOn(comp.confirmar, 'emit');

    // intento poner 3 -> se clamp a 2 y debe emitir 2
    comp.setCantidad(3);
    comp.onConfirmar();

    expect(spy).toHaveBeenCalledWith(2);
  });

  it('onConfirmar SÍ emite cuando es válido', () => {
    // stock = 5
    comp.seleccionado = {
      id: 1,
      nombre: 'Ibu',
      laboratorioId: 1,
      laboratorioNombre: 'Lab',
      fechaFabricacion: '2025-01-01',
      fechaVencimiento: '2026-01-01',
      cantidadStock: 5,
      valorUnitario: 1000
    };
    fixture.detectChanges();

    const spy = spyOn(comp.confirmar, 'emit');

    comp.setCantidad(2); // válido
    comp.onConfirmar();

    expect(spy).toHaveBeenCalledWith(2);
  });
});
