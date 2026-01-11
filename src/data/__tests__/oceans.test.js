import { describe, it, expect } from 'vitest';
import { OCEANS } from '../oceans';

describe('OCEANS Data Integrity', () => {
  it('should be an array', () => {
    expect(Array.isArray(OCEANS)).toBe(true);
  });

  it('should have at least one ocean', () => {
    expect(OCEANS.length).toBeGreaterThan(0);
  });

  it('should have required properties for every ocean', () => {
    OCEANS.forEach((ocean) => {
      expect(ocean).toHaveProperty('id');
      expect(typeof ocean.id).toBe('string');

      expect(ocean).toHaveProperty('name');
      expect(typeof ocean.name).toBe('string');

      expect(ocean).toHaveProperty('description');
      expect(typeof ocean.description).toBe('string');

      expect(ocean).toHaveProperty('colors');
      expect(typeof ocean.colors).toBe('object');

      expect(ocean).toHaveProperty('creatures');
      expect(Array.isArray(ocean.creatures)).toBe(true);
    });
  });

  it('should have valid color codes', () => {
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    OCEANS.forEach((ocean) => {
      const { colors } = ocean;
      expect(colors).toHaveProperty('fog');
      expect(colors.fog).toMatch(hexRegex);

      expect(colors).toHaveProperty('water');
      expect(colors.water).toMatch(hexRegex);

      expect(colors).toHaveProperty('light');
      expect(colors.light).toMatch(hexRegex);

      expect(colors).toHaveProperty('background');
      expect(colors.background).toMatch(hexRegex);
    });
  });

  it('should have unique IDs', () => {
    const ids = OCEANS.map(o => o.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
