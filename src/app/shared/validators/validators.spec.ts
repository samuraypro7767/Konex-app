import { FormBuilder } from '@angular/forms';
import { dateRangeValidator } from './date-range.validator';

describe('dateRangeValidator', () => {
  const fb = new FormBuilder();

  it('retorna null si fechas válidas', () => {
    const g = fb.group({ desde: '2025-01-01', hasta: '2025-01-31' });
    expect(dateRangeValidator(g)).toBeNull();
  });

  it('retorna error si desde > hasta', () => {
    const g = fb.group({ desde: '2025-02-01', hasta: '2025-01-31' });
    const err = dateRangeValidator(g);
    expect(err).toBeTruthy();
    expect(err!['dateRange']).toBeDefined();
  });
});
