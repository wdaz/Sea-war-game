import { describe, test, expect } from 'vitest';
import { Ship } from '../../src/Ship.js';

describe('Ship', () => {
  test('has correct size', () => {
    const ship = new Ship(3);
    expect(ship.size).toBe(3);
  });

  test('getCells returns horizontal cells', () => {
    const ship = new Ship(3);
    ship.place(5, 'horizontal');
    expect(ship.getCells()).toEqual([5, 6, 7]);
  });

  test('getCells returns vertical cells', () => {
    const ship = new Ship(3);
    ship.place(5, 'vertical');
    expect(ship.getCells()).toEqual([5, 15, 25]);
  });

  test('occupies returns true for ship cell', () => {
    const ship = new Ship(3);
    ship.place(5, 'horizontal');
    expect(ship.occupies(6)).toBe(true);
  });

  test('occupies returns false for non-ship cell', () => {
    const ship = new Ship(3);
    ship.place(5, 'horizontal');
    expect(ship.occupies(9)).toBe(false);
  });

  test('isSunk returns false when partially hit', () => {
    const ship = new Ship(3);
    ship.place(0, 'horizontal');
    ship.hit(0);
    expect(ship.isSunk()).toBe(false);
  });

  test('isSunk returns true when all cells hit', () => {
    const ship = new Ship(3);
    ship.place(0, 'horizontal');
    ship.hit(0); ship.hit(1); ship.hit(2);
    expect(ship.isSunk()).toBe(true);
  });
});
