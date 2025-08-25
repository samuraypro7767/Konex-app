import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Component, Input, Pipe, PipeTransform } from '@angular/core';

import { MedicamentosTableComponent } from './medicamentos-table.component';
import { MedicamentoResponse } from '../../../core/model/medicamento.model';

// ===== Dummies para aislar dependencias =====
@Component({
  selector: 'app-badge-status',
  standalone: true,
  template: `<span class="dummy-badge">{{ status }}</span>`
})
class DummyBadgeStatusComponent {
  @Input() status: 'agotado' | 'bajo' | 'ok' = 'ok';
}

@Pipe({ name: 'currencyCol', standalone: true })
class DummyCurrencyColPipe implements PipeTransform {
  transform(v: unknown): string {
    const n = typeof v === 'number' ? v : Number(v);
    return isNaN(n) ? '$ 0' : `$ ${Math.round(n)}`;
  }
}

// ===== Helper para crear medicamentos rápidos =====
function med(
  id: number,
  overrides: Partial<MedicamentoResponse> = {}
): MedicamentoResponse {
  return {
    id,
    nombre: `Med ${id}`,
    laboratorioId: 1,
    laboratorioNombre: 'Lab 1',
    fechaFabricacion: '2025-01-01',
    fechaVencimiento: '2025-02-15',
    cantidadStock: 15,
    valorUnitario: 1200,
    ...overrides,
  } as any;
}

describe('MedicamentosTableComponent', () => {
  let component: MedicamentosTableComponent;
  let fixture: ComponentFixture<MedicamentosTableComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicamentosTableComponent],
    })
      // Sobrescribimos imports del standalone para usar nuestros stubs
      .overrideComponent(MedicamentosTableComponent, {
        set: {
          imports: [CommonModule, DummyBadgeStatusComponent, DummyCurrencyColPipe],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MedicamentosTableComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;

    // Fijamos un "hoy" determinista para los tests de fecha
    (component as any).today = new Date(2025, 0, 15); // 15/01/2025
  });

  it('debe renderizar filas y el total por defecto (sin override)', () => {
    component.medicamentos = [med(1), med(2)];
    fixture.detectChanges();

    const headerTag = el.querySelector('.flex .text-xs')!;
    expect(headerTag.textContent?.trim()).toContain('2 medicamentos');

    const rows = el.querySelectorAll('tbody tr');
    // 2 filas de datos, sin "Sin resultados"
    expect(rows.length).toBe(2);
  });

  it('debe mostrar el totalOverride cuando se provee', () => {
    component.totalOverride = 99;
    component.medicamentos = [med(1)];
    fixture.detectChanges();

    const headerTag = el.querySelector('.flex .text-xs')!;
    expect(headerTag.textContent?.trim()).toContain('99 medicamentos');
  });

  it('aplica clases de stock rojo cuando stock = 0 o < threshold', () => {
    component.lowStockThreshold = 10;
    component.medicamentos = [
      med(1, { cantidadStock: 0 }),   // rojo
      med(2, { cantidadStock: 5 }),   // rojo
      med(3, { cantidadStock: 12 }),  // normal
    ];
    fixture.detectChanges();

    const bodyRows = Array.from(el.querySelectorAll('tbody tr'));
    expect(bodyRows.length).toBe(3);

    const stockCellSpanRow1 = bodyRows[0].querySelectorAll('td')[4].querySelector('span')!;
    const stockCellSpanRow2 = bodyRows[1].querySelectorAll('td')[4].querySelector('span')!;
    const stockCellSpanRow3 = bodyRows[2].querySelectorAll('td')[4].querySelector('span')!;

    expect(stockCellSpanRow1.classList.contains('text-red-600')).toBeTrue();
    expect(stockCellSpanRow2.classList.contains('text-red-600')).toBeTrue();
    expect(stockCellSpanRow3.classList.contains('text-red-600')).toBeFalse();
  });

  it('muestra el badge adecuado (agotado/bajo/ok) usando el dummy badge', () => {
    component.lowStockThreshold = 10;
    component.medicamentos = [
      med(1, { cantidadStock: 0 }),
      med(2, { cantidadStock: 5 }),
      med(3, { cantidadStock: 12 }),
    ];
    fixture.detectChanges();

    const bodyRows = Array.from(el.querySelectorAll('tbody tr'));
    const badge1 = bodyRows[0].querySelector('.dummy-badge')!;
    const badge2 = bodyRows[1].querySelector('.dummy-badge')!;
    const badge3 = bodyRows[2].querySelector('.dummy-badge')!;

    expect(badge1.textContent?.trim()).toBe('agotado');
    expect(badge2.textContent?.trim()).toBe('bajo');
    expect(badge3.textContent?.trim()).toBe('ok');
  });

  it('helpers de fecha: isVencido / isPorVencer / fmt', () => {
    // today = 15/01/2025
    expect(component.isVencido('2025-01-14')).toBeTrue();
    expect(component.isPorVencer('2025-01-14')).toBeFalse();

    expect(component.isVencido('2025-01-25')).toBeFalse();
    expect(component.isPorVencer('2025-01-25')).toBeTrue();

    // Borde de 30 días inclusive
    expect(component.isPorVencer('2025-02-14')).toBeTrue();
    // Lejano
    expect(component.isPorVencer('2025-03-01')).toBeFalse();

    // fmt con fecha válida (solo validamos patrón dd/mm/yyyy para hacerlo robusto a localización)
    const out = component.fmt('2025-01-02');
    expect(out).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);

    // fmt con inválida
    expect(component.fmt(null)).toBe('—' as any);
  });

  it('emite eventos vender / editar / eliminar con la fila correcta', () => {
    const row = med(10, { nombre: 'Amoxicilina', cantidadStock: 3 });

    const venderSpy = jasmine.createSpy('venderSpy');
    const editarSpy = jasmine.createSpy('editarSpy');
    const eliminarSpy = jasmine.createSpy('eliminarSpy');

    component.vender.subscribe(venderSpy);
    component.editar.subscribe(editarSpy);
    component.eliminar.subscribe(eliminarSpy);

    component.medicamentos = [row];
    fixture.detectChanges();

    const buttons = el.querySelectorAll('tbody tr td:last-child button');
    expect(buttons.length).toBe(3);

    // orden en plantilla: vender, editar, eliminar
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();

    expect(venderSpy).toHaveBeenCalledOnceWith(row);
    expect(editarSpy).toHaveBeenCalledOnceWith(row);
    expect(eliminarSpy).toHaveBeenCalledOnceWith(row);
  });

  it('muestra "Sin resultados" cuando no hay datos y loading = false', () => {
    component.medicamentos = [];
    component.loading = false;
    fixture.detectChanges();

    const empty = el.querySelector('tbody tr td');
    expect(empty?.textContent?.trim()).toBe('Sin resultados');
  });

  it('no muestra "Sin resultados" si está cargando aunque no haya datos', () => {
    component.medicamentos = [];
    component.loading = true;
    fixture.detectChanges();

    const empty = el.querySelector('tbody tr td');
    expect(empty).toBeNull();
  });
});
