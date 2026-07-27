import { describe, test, expect, beforeEach } from 'vitest';
import { AI } from '../../src/AI.js';
import { Board } from '../../src/Board.js';

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

  test('chooseAttack uses huntQueue when difficulty >= 0.4', () => {
    ai.difficulty = 0.5;
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
