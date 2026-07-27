import { describe, it, expect } from 'vitest';
import { Board } from '../../../src/Board.js';
import { Ship } from '../../../src/Ship.js';
import { cellState, boardStates, STATE_LABEL } from '../../../src/ui/cellState.js';

function boardWithShip(size, index, direction = 'horizontal') {
  const board = new Board();
  board.placeShip(new Ship(size), index, direction);
  return board;
}

describe('cellState', () => {
  it('returns an empty string for an untouched cell', () => {
    expect(cellState(50, new Board(), false)).toBe('');
  });

  it('shows own ships on the player board', () => {
    expect(cellState(0, boardWithShip(2, 0), false)).toBe('ship');
  });

  it('hides ships on the AI board', () => {
    expect(cellState(0, boardWithShip(2, 0), true)).toBe('');
  });

  it('returns miss for an attacked empty cell', () => {
    const board = boardWithShip(2, 0);
    board.receiveAttack(50);
    expect(cellState(50, board, true)).toBe('miss');
  });

  it('returns hit for a partially damaged ship', () => {
    const board = boardWithShip(2, 0);
    board.receiveAttack(0);
    expect(cellState(0, board, true)).toBe('hit');
  });

  it('returns sunk once every cell of the ship is hit', () => {
    const board = boardWithShip(2, 0);
    board.receiveAttack(0);
    board.receiveAttack(1);
    expect(cellState(0, board, true)).toBe('sunk');
    expect(cellState(1, board, true)).toBe('sunk');
  });
});

describe('boardStates', () => {
  it('returns exactly 100 index-aligned entries', () => {
    const states = boardStates(boardWithShip(3, 20), false);
    expect(states).toHaveLength(100);
    expect(states[20]).toBe('ship');
    expect(states[21]).toBe('ship');
    expect(states[22]).toBe('ship');
    expect(states[23]).toBe('');
  });
});

describe('STATE_LABEL', () => {
  it('names every state in Azerbaijani', () => {
    expect(STATE_LABEL).toEqual({
      '': 'boş',
      ship: 'gəmi',
      hit: 'vuruldu',
      miss: 'yan keçdi',
      sunk: 'batdı',
    });
  });
});
