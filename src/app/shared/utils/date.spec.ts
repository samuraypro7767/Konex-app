import { toIsoDateSafe } from './date-utils';

describe('toIsoDate', () => {
  it('convierte Date a yyyy-mm-dd', () => {
    const d = new Date(2025, 0, 9); // 09 Ene 2025
    expect(toIsoDateSafe(d)).toBe('2025-01-09');
  });

  it('convierte string ISO a yyyy-mm-dd', () => {
    expect(toIsoDateSafe('2025-12-31T10:20:30Z')).toBe('2025-12-31');
  });
});
