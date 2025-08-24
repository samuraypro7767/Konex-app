import { CurrencyColPipe } from './currency-col.pipe';

describe('CurrencyColPipe', () => {
  it('formatea COP sin decimales', () => {
    const pipe = new CurrencyColPipe();
    const out = pipe.transform(1234567);
    expect(out).toContain('$');
    expect(out.replace(/\D/g,'')).toBe('1234567'); // números esperados
  });
});
