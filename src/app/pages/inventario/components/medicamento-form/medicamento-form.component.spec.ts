import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { MedicamentoFormComponent } from './medicamento-form.component';

describe('MedicamentoFormComponent', () => {
  let component: MedicamentoFormComponent;
  let fixture: ComponentFixture<MedicamentoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicamentoFormComponent], // standalone: importa el componente directo
    }).compileComponents();

    fixture = TestBed.createComponent(MedicamentoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('estado inicial: formulario inválido y laboratorioId=1 por defecto', () => {
    expect(component.form.valid).toBeFalse();
    expect(component.form.controls.laboratorioId.value).toBe(1);
  });

  it('onSave: emite payload cuando el formulario es válido y coacciona laboratorioId a number', () => {
    const spy = spyOn(component.save, 'emit');

    component.form.setValue({
      nombre: 'Paracetamol 500mg',
      laboratorioId: 1, // luego probamos coerción con string
      fechaFabricacion: '2024-01-10',
      fechaVencimiento: '2026-01-10',
      cantidadStock: 50,
      valorUnitario: 1200,
    });

    // fuerza un string para comprobar coerción interna a number
    component.form.controls.laboratorioId.setValue('2' as any);

    component.onSave();

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = (spy.calls.mostRecent().args[0]) as any;

    expect(payload).toEqual(
      jasmine.objectContaining({
        nombre: 'Paracetamol 500mg',
        laboratorioId: 2,                // ✅ coaccionado a number
        fechaFabricacion: '2024-01-10',
        fechaVencimiento: '2026-01-10',
        cantidadStock: 50,
        valorUnitario: 1200,
      })
    );
  });

  it('onSave: NO emite si el formulario es inválido', () => {
    const spy = spyOn(component.save, 'emit');

    // Solo un campo → inválido
    component.form.patchValue({ nombre: 'Ibuprofeno' });

    component.onSave();
    expect(component.form.valid).toBeFalse();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSave: marca labNotAllowed si laboratorioId no está permitido', () => {
    const spy = spyOn(component.save, 'emit');

    component.form.setValue({
      nombre: 'Amoxicilina',
      laboratorioId: 99, // no permitido (allowed: [1,2,3])
      fechaFabricacion: '2024-02-01',
      fechaVencimiento: '2026-02-01',
      cantidadStock: 10,
      valorUnitario: 3000,
    });

    component.onSave();

    // No emite
    expect(spy).not.toHaveBeenCalled();

    // El control tiene el error del validador personalizado
    const ctrl = component.form.controls.laboratorioId;
    expect(ctrl.hasError('labNotAllowed')).toBeTrue();
  });

  it('ngOnChanges: precarga datos y normaliza laboratorioId a un permitido cuando initial cambia', () => {
    const initial: any = {
      id: 123,
      nombre: 'Omeprazol',
      laboratorioId: 99,              // no permitido → debe caer a 1
      fechaFabricacion: '2023-06-01',
      fechaVencimiento: '2025-06-01',
      cantidadStock: 5,
      valorUnitario: 4500,
    };

    component.initial = initial;
    component.ngOnChanges({
      initial: new SimpleChange(null, initial, true),
    });

    const v = component.form.getRawValue();

    expect(v.nombre).toBe('Omeprazol');
    expect(v.laboratorioId).toBe(1);  // ✅ normalizado al primer permitido
    expect(v.fechaFabricacion).toBe('2023-06-01');
    expect(v.fechaVencimiento).toBe('2025-06-01');
    expect(v.cantidadStock).toBe(5);
    expect(v.valorUnitario).toBe(4500);
  });

  it('trackLab: devuelve el id de la opción', () => {
    const lab = { id: 3, nombre: 'Laboratorio 3' };
    expect(component.trackLab(0, lab)).toBe(3);
  });
});
