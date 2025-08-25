import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  // ---------- Mock de InventarioPage que el Dashboard usa ----------
  function createMockInventario() {
    const today = new Date();
    const addDays = (d: number) =>
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);

    const rows = [
      { id: 1, nombre: 'Med A', cantidadStock: 0,  fechaVencimiento: addDays(60) }, // danger stock 0
      { id: 2, nombre: 'Med B', cantidadStock: 5,  fechaVencimiento: addDays(10) }, // warning stock + por vencer
      { id: 3, nombre: 'Med C', cantidadStock: 20, fechaVencimiento: addDays(-1) }, // danger vencido
    ];

    const isVencido = (dt?: Date | string) => {
      if (!dt) return false;
      const d = new Date(dt);
      const floor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return d.getTime() < floor.getTime();
    };

    const isPorVencer = (dt?: Date | string) => {
      if (!dt) return false;
      if (isVencido(dt)) return false;
      const d = new Date(dt);
      const diff = d.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days <= 30;
    };

    const fmt = (dt?: Date | string) => (dt ? new Date(dt).toLocaleDateString() : '');

    return {
      rows: () => rows,
      isVencido,
      isPorVencer,
      fmt,
      abrirCrear: jasmine.createSpy('abrirCrear'),
    } as any;
  }

  const countAlerts = (mockInv: any) => {
    let c = 0;
    for (const m of mockInv.rows()) {
      if ((m.cantidadStock ?? 0) === 0) c++;
      else if ((m.cantidadStock ?? 0) < 10) c++;
      if (mockInv.isVencido(m.fechaVencimiento)) c++;
      else if (mockInv.isPorVencer(m.fechaVencimiento)) c++;
    }
    return c;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
    })
      // 👇 clave: sin template y sin imports (aislar dependencias)
      .overrideComponent(DashboardPage, { set: { template: '', imports: [] } })
      .compileComponents();
  });

  it('debe crearse', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('abrirDesdeHeader: delega en inv.abrirCrear()', () => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    c.inv = createMockInventario();
    c.abrirDesdeHeader();
    expect(c.inv!.abrirCrear).toHaveBeenCalled();
  });

  it('onDocumentClick: cierra el panel de notifs', () => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    c.showNotif.set(true);
    c.onDocumentClick();
    expect(c.showNotif()).toBeFalse();
  });

  it('seleccionar("inventario"): refresca unread con setTimeout(0)', fakeAsync(() => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    const inv = createMockInventario();
    c.inv = inv;

    c.seleccionar('inventario');
    tick(0); // ejecuta el setTimeout(0)
    expect(c.unread()).toBe(countAlerts(inv));
    expect(c.notifs().length).toBe(countAlerts(inv));
  }));

  it('trackNotif: retorna id', () => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    const n = { id: 'abc' } as any;
    expect(c.trackNotif(0, n)).toBe('abc');
  });

  it('toggleNotifs: abre (refresca y pone unread=0) y cierra', () => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    c.inv = createMockInventario();

    const ev = { stopPropagation: jasmine.createSpy('stop') } as any;
    c.toggleNotifs(ev); // abre
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(c.showNotif()).toBeTrue();
    expect(c.notifs().length).toBe(countAlerts(c.inv));
    expect(c.unread()).toBe(0);

    c.toggleNotifs(); // cierra
    expect(c.showNotif()).toBeFalse();
  });

  it('seleccionar("ventas"): cambia tab y oculta panel', () => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    c.showNotif.set(true);
    c.seleccionar('ventas');
    expect(c.tab()).toBe('ventas');
    expect(c.showNotif()).toBeFalse();
  });

  it('ngAfterViewInit: sincroniza notifs tras 500ms usando rows() del inventario', fakeAsync(() => {
    const c = TestBed.createComponent(DashboardPage).componentInstance;
    c.inv = createMockInventario();

    c.ngAfterViewInit();
    tick(499);
    expect(c.unread()).toBe(0);
    tick(1);
    expect(c.unread()).toBe(countAlerts(c.inv));
    expect(c.notifs().length).toBe(countAlerts(c.inv));
  }));
});
