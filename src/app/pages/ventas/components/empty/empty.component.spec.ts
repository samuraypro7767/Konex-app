import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { EmptyComponent } from './empty.component';

describe('EmptyComponent', () => {
  let fixture: ComponentFixture<EmptyComponent>;
  let component: EmptyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, EmptyComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('muestra valores por defecto (cols=6, text="Sin resultados")', () => {
    fixture.detectChanges();
    const td: HTMLTableCellElement = fixture.nativeElement.querySelector('td');
    expect(td).toBeTruthy();
    expect(td.getAttribute('colspan')).toBe('6');
    expect(td.textContent?.trim()).toBe('Sin resultados');
  });

  it('respeta los @Input() personalizados', async () => {
    // Host con tabla para un DOM válido (<tr> dentro de <tbody>)
    @Component({
      standalone: true,
      imports: [CommonModule, EmptyComponent],
      template: `
        <table>
          <tbody>
            <app-empty [cols]="cols" [text]="text"></app-empty>
          </tbody>
        </table>
      `,
    })
    class HostComponent {
      cols = 3;
      text = 'Sin ventas';
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [HostComponent] })
      .compileComponents();

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const tdDE = hostFixture.debugElement.query(By.css('td'));
    const tdEl: HTMLTableCellElement = tdDE.nativeElement;

    expect(tdEl.getAttribute('colspan')).toBe('3');
    expect(tdEl.textContent?.trim()).toBe('Sin ventas');

    // Cambia inputs y verifica actualización
    hostFixture.componentInstance.cols = 5;
    hostFixture.componentInstance.text = 'No hay resultados';
    hostFixture.detectChanges();

    expect(tdEl.getAttribute('colspan')).toBe('5');
    expect(tdEl.textContent?.trim()).toBe('No hay resultados');
  });

  it('incluye clases de estilo utilitarias en el <td>', () => {
    fixture.detectChanges();
    const td: HTMLTableCellElement = fixture.nativeElement.querySelector('td');
    // No probamos todas, solo las claves
    expect(td.className).toContain('text-center');
    expect(td.className).toContain('text-gray-500');
  });
});
