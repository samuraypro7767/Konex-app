import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App], // standalone
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shell (router-outlet or dashboard)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Acepta dos escenarios:
    // 1) App con <router-outlet>
    // 2) App que renderiza directamente <app-dashboard-page>
    const hasRouterOutlet = !!fixture.debugElement.query(By.css('router-outlet'));
    const hasDashboard   = !!fixture.debugElement.query(By.css('app-dashboard-page'));

    expect(hasRouterOutlet || hasDashboard).toBeTrue();
  });
});
