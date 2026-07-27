import { describe, test, expect, beforeEach } from 'vitest';
import { Game } from '../../src/Game.js';
import { Ship } from '../../src/Ship.js';
import { Board, SHIP_SIZES } from '../../src/Board.js';

describe('Game', () => {
  let game;
  beforeEach(() => {
    localStorage.clear();
    game = new Game();
    game.start();
  });

  test('initial phase is placement', () => {
    expect(game.phase).toBe('placement');
  });

  test('initial scores are zero', () => {
    expect(game.scores).toEqual({ player: 0, ai: 0 });
  });

  test('initial placementDirection is horizontal', () => {
    expect(game.placementDirection).toBe('horizontal');
  });

  test('placePlayerShip returns true for valid placement', () => {
    expect(game.placePlayerShip(0)).toBe(true);
  });

  test('placePlayerShip advances currentShipIndex', () => {
    game.placePlayerShip(0);
    expect(game.currentShipIndex).toBe(1);
  });

  test('autoPlacePlayer sets phase to battle', () => {
    game.autoPlacePlayer();
    expect(game.phase).toBe('battle');
  });

  test('toggleDirection switches to vertical', () => {
    game.toggleDirection();
    expect(game.placementDirection).toBe('vertical');
  });

  test('toggleDirection switches back to horizontal', () => {
    game.toggleDirection();
    game.toggleDirection();
    expect(game.placementDirection).toBe('horizontal');
  });

  test('playerAttack returns already-attacked on repeat', () => {
    game.autoPlacePlayer();
    game.playerAttack(0);
    const result = game.playerAttack(0);
    expect(result.player).toBe('already-attacked');
  });

  test('playerAttack result.player is hit or miss', () => {
    game.autoPlacePlayer();
    const result = game.playerAttack(0);
    expect(['hit', 'miss']).toContain(result.player);
  });

  test('playerAttack returns null when phase is not battle', () => {
    expect(game.playerAttack(0)).toBeNull();
  });

  test('restart resets phase to placement', () => {
    game.autoPlacePlayer();
    game.restart();
    expect(game.phase).toBe('placement');
  });

  test('restart preserves scores', () => {
    game.scores.player = 3;
    game.restart();
    expect(game.scores.player).toBe(3);
  });

  test('restart resets currentShipIndex to 0', () => {
    game.placePlayerShip(0);
    game.restart();
    expect(game.currentShipIndex).toBe(0);
  });

  test('playerAttack sets winner to player when all AI ships sunk', () => {
    game.autoPlacePlayer();
    game.aiBoard = new Board();
    game.aiBoard.placeShip(new Ship(1), 99, 'horizontal');
    game.phase = 'battle';
    const result = game.playerAttack(99);
    expect(result.winner).toBe('player');
    expect(game.phase).toBe('gameover');
    expect(game.scores.player).toBe(1);
  });

  test('playerAttack sets winner to ai when all player ships sunk', () => {
    game.autoPlacePlayer();
    for (const ship of game.playerBoard.ships) {
      for (const cell of ship.getCells()) {
        game.playerBoard.attacked.add(cell);
        ship.hit(cell);
      }
    }
    game.phase = 'battle';
    const result = game.playerAttack(0);
    expect(result.winner).toBe('ai');
    expect(game.phase).toBe('gameover');
    expect(game.scores.ai).toBe(1);
  });
});
