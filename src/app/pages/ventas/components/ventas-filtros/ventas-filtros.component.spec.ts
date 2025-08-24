import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasFiltrosComponent } from './ventas-filtros.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('VentasFiltrosComponent', () => {
  let fixture: ComponentFixture<VentasFiltrosComponent>;
  let comp: VentasFiltrosComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, VentasFiltrosComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(VentasFiltrosComponent);
    comp = fixture.componentInstance;
  });

  it('emite buscar con rango válido', () => {
    const spy = spyOn(comp.buscar, 'emit');
    comp.form.setValue({ desde: '2025-01-01', hasta: '2025-01-31' });
    comp.onBuscar();
    expect(spy).toHaveBeenCalledWith({ desde: '2025-01-01', hasta: '2025-01-31' });
  });

  it('limpia y emite limpiar', () => {
    const spy = spyOn(comp.limpiar, 'emit');
    comp.form.setValue({ desde: '2025-01-01', hasta: '2025-01-31' });
    comp.onLimpiar();
    expect(comp.form.value).toEqual({ desde: '', hasta: '' });
    expect(spy).toHaveBeenCalled();
  });
});
