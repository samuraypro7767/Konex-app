import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { VentasTableComponent } from './ventas-table.component';
import type { VentaResponse } from '../../../../core/model/venta.model';

describe('VentasTableComponent', () => {
  let fixture: ComponentFixture<VentasTableComponent>;
  let component: VentasTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasTableComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(VentasTableComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('muestra estado vacío cuando no hay ventas', () => {
    component.ventas = [];
    fixture.detectChanges();

    const emptyRow = fixture.nativeElement.querySelector('tbody tr td');
    expect(emptyRow?.textContent).toContain('Sin ventas');
    expect(component.total).toBe(0);
  });

  it('renderiza filas cuando hay ventas y calcula helpers correctamente', () => {
    const data: VentaResponse[] = [
      {
        fechaHora: '2024-01-01T10:00:00Z',
        valorTotal: 2500,
        items: [{ medicamentoNombre: 'Ibuprofeno', cantidad: 2, valorUnitario: 1250, laboratorioNombre: 'ACME' } as any],
      } as any,
      {
        fechaHora: '2024-01-02T12:30:00Z',
        valorTotal: 9999,
        items: [{ medicamentoNombre: 'Paracetamol', cantidad: 3, valorUnitario: 3333 } as any],
      } as any,
    ];

    component.ventas = data;
    fixture.detectChanges();

    // total getter
    expect(component.total).toBe(2);

    // helpers puros
    expect(component.medicamentoNombre(data[0])).toBe('Ibuprofeno');
    expect(component.cantidad(data[0])).toBe(2);
    expect(component.valorUnitario(data[0])).toBe(1250);

    // DOM: obtiene solo filas "de datos" (5 celdas por fila)
    const allRows = fixture.debugElement.queryAll(By.css('tbody tr'));
    const dataRows = allRows.filter(r => r.queryAll(By.css('td')).length === 5);
    expect(dataRows.length).toBe(2);

    // 1ª fila: columnas -> [fecha, medicamento, cantidad, unitario, total]
    const firstCells = dataRows[0].queryAll(By.css('td')).map(de => de.nativeElement as HTMLTableCellElement);
    expect(firstCells[1].textContent?.trim()).toBe('Ibuprofeno');
    expect(firstCells[2].textContent?.trim()).toBe('2');

    // 2ª fila: nombre y cantidad
    const secondCells = dataRows[1].queryAll(By.css('td')).map(de => de.nativeElement as HTMLTableCellElement);
    expect(secondCells[1].textContent?.trim()).toBe('Paracetamol');
    expect(secondCells[2].textContent?.trim()).toBe('3');
  });
});
