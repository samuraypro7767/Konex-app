import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeStatusComponent } from './badge-status.component';

describe('BadgeStatusComponent', () => {
  let fixture: ComponentFixture<BadgeStatusComponent>;
  let comp: BadgeStatusComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeStatusComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(BadgeStatusComponent);
    comp = fixture.componentInstance;
  });

  it('muestra "Disponible" por defecto', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Disponible');
  });

  it('muestra "Stock bajo" y clase amarilla', () => {
    comp.status = 'bajo';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Stock bajo');
    expect(el.querySelector('span')!.className).toContain('bg-yellow-100');
  });

  it('muestra "Agotado" y clase roja', () => {
    comp.status = 'agotado';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Agotado');
    expect(el.querySelector('span')!.className).toContain('bg-red-100');
  });
});
