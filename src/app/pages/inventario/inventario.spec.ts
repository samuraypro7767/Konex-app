import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

import { InventarioPage } from './inventario.page';
import { MedicamentoResponse, CotizacionResponse, MedicamentoRequest } from '../../core/model/medicamento.model';
import { Page } from '../../core/model/page.model';
import { MedicamentosService } from '../../core/services/medicamentos.service';
import { VentasService } from '../../core/services/ventas.service';

// Spies de servicios
const medsSpy = jasmine.createSpyObj('MedicamentosService', [
  'listar', 'crear', 'actualizar', 'eliminar', 'cotizar'
]);
const ventasSpy = jasmine.createSpyObj('VentasService', [
  'crear', 'listarPorRango'
]);

const emptyPage = (size = 10): Page<MedicamentoResponse> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size
});

describe('InventarioPage', () => {
  let fixture: ComponentFixture<InventarioPage>;
  let component: InventarioPage;

  beforeEach(async () => {
    // Valores por defecto
    medsSpy.listar.and.returnValue(of(emptyPage()));
    ventasSpy.listarPorRango.and.returnValue(of({ total: 0 }));
    ventasSpy.crear.and.returnValue(of({}));

    // Stubs de Swal
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
    spyOn(Swal, 'close').and.stub();
    spyOn(Swal, 'showLoading').and.stub();

    await TestBed.configureTestingModule({
      imports: [InventarioPage], // standalone
      providers: [
        { provide: MedicamentosService, useValue: medsSpy },
        { provide: VentasService, useValue: ventasSpy },
      ],
    })
      // Evitamos dependencias del template real
      .overrideComponent(InventarioPage, { set: { template: '<div>stub</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(InventarioPage);
    component = fixture.componentInstance;
  });

  it('debe crearse y disparar load + loadIngresosMes en ngOnInit', () => {
    const loadSpy = spyOn(component, 'load').and.callThrough();
    const loadIngSpy = spyOn(component, 'loadIngresosMes').and.callThrough();

    fixture.detectChanges(); // ngOnInit

    expect(component).toBeTruthy();
    expect(loadSpy).toHaveBeenCalled();
    expect(loadIngSpy).toHaveBeenCalled();
    expect(medsSpy.listar).toHaveBeenCalled();
    expect(ventasSpy.listarPorRango).toHaveBeenCalled();
  });

  it('load coloca los datos en data() y métricas derivadas', () => {
    const page: Page<MedicamentoResponse> = {
      content: [{ id: 1, nombre: 'Paracetamol', laboratorioId: 1, cantidadStock: 7, valorUnitario: 1200, fechaVencimiento: '2026-01-01' } as any],
      totalElements: 1, totalPages: 1, number: 0, size: 10
    };
    medsSpy.listar.and.returnValue(of(page));

    component.load();

    expect(component.data()).toEqual(page);
    expect(component.rows().length).toBe(1);
    expect(component.totalMedicamentos()).toBe(1);
    expect(component.stockTotal()).toBe(7);
    expect(component.stockBajo()).toBe(1);
  });

  it('onFiltroChange con string vacío resetea a primera página y recarga', () => {
    const spy = spyOn(component, 'load').and.stub();
    component.pageIndex.set(5);

    component.onFiltroChange('   ');

    expect(component.pageIndex()).toBe(0);
    expect(spy).toHaveBeenCalled();
  });

  it('onPage actualiza pageSize/pageIndex y recarga', () => {
    const spy = spyOn(component, 'load').and.stub();

    component.onPage({ first: 40, rows: 20 });

    expect(component.pageSize()).toBe(20);
    expect(component.pageIndex()).toBe(2);
    expect(spy).toHaveBeenCalled();
  });

  it('abrirCrear limpia el formulario y abre modal', () => {
    component.abrirCrear();
    expect(component.editando).toBeNull();
    expect(component.form.value.nombre).toBe('');
    expect(component.showForm()).toBeTrue();
  });

  it('abrirEditar precarga el formulario y abre modal', () => {
    const m: MedicamentoResponse = {
      id: 2, nombre: 'Ibuprofeno', laboratorioId: 2,
      fechaFabricacion: '2024-01-01', fechaVencimiento: '2026-12-31',
      cantidadStock: 50, valorUnitario: 3000
    } as any;

    component.abrirEditar(m);

    expect(component.editando).toEqual(m);
    expect(component.form.value.nombre).toBe('Ibuprofeno');
    expect(component.form.value.laboratorioId).toBe(2);
    expect(component.showForm()).toBeTrue();
  });

  it('onGuardar (crear) llama meds.crear, cierra modal y recarga', fakeAsync(() => {
    medsSpy.crear.and.returnValue(of({}));
    const req: MedicamentoRequest = {
      nombre: 'Nuevo',
      laboratorioId: 1,
      fechaFabricacion: '2024-01-01',
      fechaVencimiento: '2025-01-01',
      cantidadStock: 10,
      valorUnitario: 1234
    };
    const loadSpy = spyOn(component, 'load').and.stub();

    component.editando = null;
    component.onGuardar(req);
    tick();

    expect(medsSpy.crear).toHaveBeenCalledWith(req);
    expect(component.showForm()).toBeFalse();
    expect(loadSpy).toHaveBeenCalled();
  }));

  it('onGuardar (actualizar) llama meds.actualizar cuando editando != null', fakeAsync(() => {
    medsSpy.actualizar.and.returnValue(of({}));
    const req: MedicamentoRequest = {
      nombre: 'Editado',
      laboratorioId: 3,
      fechaFabricacion: '2023-01-01',
      fechaVencimiento: '2027-01-01',
      cantidadStock: 5,
      valorUnitario: 999
    };
    component.editando = { id: 99 } as any;

    component.onGuardar(req);
    tick();

    expect(medsSpy.actualizar).toHaveBeenCalledWith(99, req);
  }));

  it('eliminar confirma, llama meds.eliminar y recarga', fakeAsync(() => {
    (Swal.fire as jasmine.Spy).and.returnValues(
      Promise.resolve({ isConfirmed: true } as any),
      Promise.resolve({} as any),
      Promise.resolve({} as any),
    );

    medsSpy.eliminar.and.returnValue(of({}));
    const loadSpy = spyOn(component, 'load').and.stub();

    const m: MedicamentoResponse = { id: 7, nombre: 'X' } as any;
    component.eliminar(m);
    tick();

    expect(medsSpy.eliminar).toHaveBeenCalledWith(7);
    expect(loadSpy).toHaveBeenCalled();
  }));

  it('cotizar establece la cotización cuando el servicio responde', () => {
    component.seleccionado = { id: 1, valorUnitario: 1000 } as any;
    const cot: CotizacionResponse = { valorTotal: 3500 } as any;
    medsSpy.cotizar.and.returnValue(of(cot));

    component.cotizar(3);
    expect(medsSpy.cotizar).toHaveBeenCalledWith(1, 3);
    expect(component.cotizacion).toEqual(cot);
  });

  it('confirmarVenta incrementa ingresosMes y sincroniza con backend', () => {
    component.seleccionado = { id: 1, nombre: 'Paracetamol', valorUnitario: 1000 } as any;
    component.venderForm.setValue({ cantidad: 2 });
    ventasSpy.crear.and.returnValue(of({}));
    ventasSpy.listarPorRango.and.returnValue(of({ total: 2000 }));

    component.confirmarVenta();

    expect(ventasSpy.crear).toHaveBeenCalledWith({ medicamentoId: 1, cantidad: 2 });
    expect(component.showVender()).toBeFalse();
    expect(component.vendiendo()).toBeFalse();
    expect(component.ingresosMes()).toBe(2000);
  });

  it('loadIngresosMes suma distintas formas de respuesta', () => {
    ventasSpy.listarPorRango.and.returnValue(of({ total: 12345 }));
    component.loadIngresosMes();
    expect(component.ingresosMes()).toBe(12345);

    ventasSpy.listarPorRango.and.returnValue(of({
      content: [{ valorTotal: 1000 }, { valorTotal: ' $ 2.500,00 ' }]
    }));
    component.loadIngresosMes();
    expect(component.ingresosMes()).toBe(3500);

    ventasSpy.listarPorRango.and.returnValue(of([
      { total: 700 }, { monto: ' $ 1.300' }, { valorTotal: 500 }
    ] as any));
    component.loadIngresosMes();
    expect(component.ingresosMes()).toBe(2500);
  });

  it('helpers de fecha: isVencido / isPorVencer / fmt', () => {
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    const en10 = new Date(hoy); en10.setDate(hoy.getDate() + 10);
    const en40 = new Date(hoy); en40.setDate(hoy.getDate() + 40);

    expect(component.isVencido(ayer)).toBeTrue();
    expect(component.isVencido(en10)).toBeFalse();

    expect(component.isPorVencer(en10)).toBeTrue();
    expect(component.isPorVencer(en40)).toBeFalse();

    expect(component.fmt('2025-01-01')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
