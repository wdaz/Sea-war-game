import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { AI, huntProbability } from '../../src/AI.js';
import { Board } from '../../src/Board.js';
import { Ship } from '../../src/Ship.js';

describe('AI', () => {
  let ai, board;
  beforeEach(() => {
    localStorage.clear();
    ai = new AI();
    board = new Board();
    board.autoPlace();
  });

  test('initial difficulty is 0.5', () => {
    expect(ai.difficulty).toBe(0.5);
  });

  test('chooseAttack returns a number 0–99', () => {
    const index = ai.chooseAttack(board);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThanOrEqual(99);
  });

  test('chooseAttack never returns an already-attacked cell', () => {
    for (let i = 0; i < 99; i++) board.attacked.add(i);
    expect(ai.chooseAttack(board)).toBe(99);
  });

  test('adjustDifficulty increases when player wins', () => {
    ai.difficulty = 0.5;
    ai.adjustDifficulty(true);
    expect(ai.difficulty).toBeCloseTo(0.6);
  });

  test('adjustDifficulty decreases when AI wins', () => {
    ai.difficulty = 0.5;
    ai.adjustDifficulty(false);
    expect(ai.difficulty).toBeCloseTo(0.4);
  });

  test('adjustDifficulty does not exceed 1.0', () => {
    ai.difficulty = 1.0;
    ai.adjustDifficulty(true);
    expect(ai.difficulty).toBe(1.0);
  });

  test('adjustDifficulty does not go below 0.1', () => {
    ai.difficulty = 0.1;
    ai.adjustDifficulty(false);
    expect(ai.difficulty).toBe(0.1);
  });

  test('adjustDifficulty saves to localStorage', () => {
    ai.difficulty = 0.5;
    ai.adjustDifficulty(true);
    expect(localStorage.getItem('seawar_ai_difficulty')).toBe('0.6');
  });

  test('huntQueue is populated after hit when difficulty >= 0.4', () => {
    ai.difficulty = 0.5;
    ai.registerResult(55, 'hit', board);
    expect(ai.huntQueue.length).toBeGreaterThan(0);
  });

  test('huntQueue is NOT populated after hit when difficulty < 0.4', () => {
    ai.difficulty = 0.3;
    ai.registerResult(55, 'hit', board);
    expect(ai.huntQueue.length).toBe(0);
  });

  test('lastHit is updated after hit when difficulty < 0.4', () => {
    ai.difficulty = 0.3;
    ai.lastHit = 10;
    ai.direction = 'horizontal';

    ai.registerResult(55, 'hit', board);

    expect(ai.lastHit).toBe(55);
    expect(ai.direction).toBeNull();
  });

  test('chooseAttack always uses huntQueue at maximum difficulty', () => {
    ai.difficulty = 1.0;
    ai.huntQueue = [42];
    expect(ai.chooseAttack(board)).toBe(42);
  });

  test('direction tracking sets horizontal after 2 hits on same row (difficulty > 0.7)', () => {
    ai.difficulty = 0.8;
    ai.registerResult(10, 'hit', board);
    expect(ai.direction).toBeNull();
    ai.registerResult(11, 'hit', board);
    expect(ai.direction).toBe('horizontal');
  });

  test('direction tracking sets vertical after 2 hits on same column (difficulty > 0.7)', () => {
    ai.difficulty = 0.8;
    ai.registerResult(10, 'hit', board);
    ai.registerResult(20, 'hit', board);
    expect(ai.direction).toBe('vertical');
  });

  test('direction tracking does not activate at difficulty 0.5', () => {
    ai.difficulty = 0.5;
    ai.registerResult(10, 'hit', board);
    ai.registerResult(11, 'hit', board);
    expect(ai.direction).toBeNull();
  });

  test('miss resets direction tracking', () => {
    ai.difficulty = 0.8;
    ai.registerResult(10, 'hit', board);
    ai.registerResult(20, 'hit', board);
    expect(ai.direction).toBe('vertical');
    ai.registerResult(30, 'miss', board);
    expect(ai.direction).toBeNull();
    expect(ai.lastHit).toBeNull();
  });
});

describe('AI difficulty loading', () => {
  beforeEach(() => localStorage.clear());

  test('falls back to 0.5 when nothing is stored', () => {
    expect(new AI().difficulty).toBe(0.5);
  });

  // Infinity is corruption, not "very hard": clamping it to the maximum would
  // hand the player the strongest AI because of a bad write.
  test.each(['abc', '', 'null', 'undefined', 'NaN', 'Infinity', '-Infinity', '1e999'])(
    'falls back to 0.5 for the unusable value %p',
    (stored) => {
      localStorage.setItem('seawar_ai_difficulty', stored);
      expect(new AI().difficulty).toBe(0.5);
    },
  );

  // A finite out-of-range number reads as a deliberate hand-edit, so it is
  // clamped into the ladder instead of discarded.
  test.each([
    ['5', 1.0],
    ['2.5', 1.0],
    ['-5', 0.1],
    ['0', 0.1],
    ['0.05', 0.1],
  ])('clamps the out-of-range value %p to %p', (stored, expected) => {
    localStorage.setItem('seawar_ai_difficulty', stored);
    expect(new AI().difficulty).toBe(expected);
  });

  test('keeps a valid stored value', () => {
    localStorage.setItem('seawar_ai_difficulty', '0.8');
    expect(new AI().difficulty).toBe(0.8);
  });

  test('a corrupted value still adapts after a game', () => {
    localStorage.setItem('seawar_ai_difficulty', 'abc');
    const fresh = new AI();
    fresh.adjustDifficulty(true);
    expect(fresh.difficulty).toBeCloseTo(0.6);
  });
});

describe('AI forgets a sunk ship', () => {
  let sunkAi, sunkBoard, ship;

  beforeEach(() => {
    localStorage.clear();
    sunkAi = new AI();
    sunkAi.difficulty = 1.0;
    sunkBoard = new Board();
    ship = new Ship(2);
    sunkBoard.placeShip(ship, 0, 'horizontal'); // A1, B1
  });

  function sink() {
    sunkBoard.receiveAttack(0);
    sunkAi.registerResult(0, 'hit', sunkBoard);
    sunkBoard.receiveAttack(1);
    sunkAi.registerResult(1, 'hit', sunkBoard);
  }

  test('drops queued cells touching the sunk ship', () => {
    sink();
    // Ships may never be adjacent, so every cell around a sunk one is water.
    expect(sunkAi.huntQueue).toEqual([]);
  });

  test('resets lastHit and direction after a sink', () => {
    sink();
    expect(sunkAi.lastHit).toBeNull();
    expect(sunkAi.direction).toBeNull();
  });

  test('keeps queued cells that belong to another target', () => {
    sunkAi.huntQueue = [77];
    sink();
    expect(sunkAi.huntQueue).toEqual([77]);
  });

  test('still hunts a ship that is only damaged', () => {
    const board = new Board();
    board.placeShip(new Ship(3), 40, 'horizontal'); // A5, B5, C5
    board.receiveAttack(41);
    sunkAi.registerResult(41, 'hit', board);

    expect(sunkAi.huntQueue.length).toBeGreaterThan(0);
    expect(sunkAi.lastHit).toBe(41);
  });
});


describe('huntProbability', () => {
  test('is zero below the hunting threshold', () => {
    for (const d of [0.1, 0.2, 0.3]) expect(huntProbability(d)).toBe(0);
  });

  test('rises across every rung from 0.4 to 1.0', () => {
    const rungs = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(huntProbability);
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i], `rung ${i}`).toBeGreaterThan(rungs[i - 1]);
    }
  });

  test('spans a quarter to certainty', () => {
    expect(huntProbability(0.4)).toBeCloseTo(0.25);
    expect(huntProbability(1.0)).toBeCloseTo(1.0);
  });

  test('never exceeds 1 or accepts nonsense', () => {
    expect(huntProbability(5)).toBe(1);
    expect(huntProbability(NaN)).toBe(0);
  });
});

describe('AI follow-up rate honours difficulty', () => {
  let rng, restore;

  beforeEach(() => {
    localStorage.clear();
    restore = Math.random;
  });

  afterEach(() => {
    Math.random = restore;
  });

  function usesQueue(difficulty, roll) {
    const probe = new AI();
    probe.difficulty = difficulty;
    probe.huntQueue = [42];
    // First call decides queue vs random; later calls pick the random cell.
    let first = true;
    Math.random = () => {
      if (first) { first = false; return roll; }
      return 0;
    };
    return probe.chooseAttack(new Board()) === 42;
  }

  test('follows the lead when the roll lands under the probability', () => {
    expect(usesQueue(0.5, 0.1)).toBe(true);
  });

  test('fires at random when the roll lands above it', () => {
    expect(usesQueue(0.5, 0.9)).toBe(false);
  });

  test('never follows a lead below the threshold', () => {
    expect(usesQueue(0.3, 0.0001)).toBe(false);
  });
});
