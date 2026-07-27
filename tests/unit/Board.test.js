import { describe, test, expect, beforeEach } from 'vitest';
import { Board } from '../../src/Board.js';
import { Ship } from '../../src/Ship.js';

describe('Board', () => {
  let board;
  beforeEach(() => { board = new Board(); });

  test('placeShip returns true for valid placement', () => {
    const ship = new Ship(3);
    expect(board.placeShip(ship, 0, 'horizontal')).toBe(true);
  });

  test('placeShip returns false when ship goes out of bounds (horizontal)', () => {
    const ship = new Ship(4);
    expect(board.placeShip(ship, 8, 'horizontal')).toBe(false);
  });

  test('placeShip returns false when ship goes out of bounds (vertical)', () => {
    const ship = new Ship(4);
    expect(board.placeShip(ship, 80, 'vertical')).toBe(false);
  });

  test('placeShip returns false when ships overlap', () => {
    const shipA = new Ship(3);
    board.placeShip(shipA, 0, 'horizontal');
    const shipB = new Ship(2);
    expect(board.placeShip(shipB, 1, 'horizontal')).toBe(false);
  });

  test('placeShip returns false when ships are adjacent (no gap)', () => {
    const shipA = new Ship(2);
    board.placeShip(shipA, 0, 'horizontal');
    const shipB = new Ship(2);
    expect(board.placeShip(shipB, 2, 'horizontal')).toBe(false);
  });

  test('receiveAttack returns hit when ship is at index', () => {
    const ship = new Ship(3);
    board.placeShip(ship, 0, 'horizontal');
    expect(board.receiveAttack(0)).toBe('hit');
  });

  test('receiveAttack returns miss when no ship at index', () => {
    expect(board.receiveAttack(50)).toBe('miss');
  });

  test('receiveAttack returns already-attacked on repeat', () => {
    board.receiveAttack(5);
    expect(board.receiveAttack(5)).toBe('already-attacked');
  });

  test('allSunk returns false when ship is not sunk', () => {
    const ship = new Ship(1);
    board.placeShip(ship, 0, 'horizontal');
    expect(board.allSunk()).toBe(false);
  });

  test('allSunk returns true when all ships are sunk', () => {
    const ship = new Ship(1);
    board.placeShip(ship, 0, 'horizontal');
    board.receiveAttack(0);
    expect(board.allSunk()).toBe(true);
  });

  test('autoPlace places exactly 10 ships', () => {
    board.autoPlace();
    expect(board.ships.length).toBe(10);
  });

  test('autoPlace ships do not share any cell', () => {
    board.autoPlace();
    const allCells = board.ships.flatMap(s => s.getCells());
    expect(new Set(allCells).size).toBe(allCells.length);
  });
});
