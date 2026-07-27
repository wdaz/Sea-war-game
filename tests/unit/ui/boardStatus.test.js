import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../../src/Game.js';
import { UI, boardStatus } from '../../../src/UI.js';

describe('UI.mount', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('throws a named error when the app root is missing', () => {
    const ui = new UI(new Game());
    expect(() => ui.mount()).toThrow('BattleShip: #app not found');
  });

  it('mounts the pinned contract selectors into the root', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const game = new Game();
    const ui = new UI(game);
    ui.mount();
    game.start();
    ui.render();

    expect(document.querySelector('.game').dataset.phase).toBe('placement');
    expect(document.querySelectorAll('[data-board="player"] > .cell')).toHaveLength(100);
    expect(document.querySelectorAll('[data-board="ai"] > .cell')).toHaveLength(100);
    expect(document.querySelectorAll('[data-action="new-game"]')).toHaveLength(1);
    expect(document.querySelector('[data-controls="placement"]')).not.toBeNull();
    expect(document.querySelector('[data-message]')).not.toBeNull();
  });

  it('is idempotent across repeated renders', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const game = new Game();
    const ui = new UI(game);
    ui.mount();
    game.start();

    ui.render();
    const first = document.querySelector('[data-board="ai"]').innerHTML;
    ui.render();
    ui.render();

    expect(document.querySelector('[data-board="ai"]').innerHTML).toBe(first);
    expect(document.querySelectorAll('[data-board="ai"] > .cell')).toHaveLength(100);
  });
});

describe('boardStatus', () => {
  it('describes the placement phase', () => {
    expect(boardStatus('placement', 'player', {})).toEqual({
      text: 'AKTİV', icon: 'radio-tower', tone: 'cyan',
    });
    expect(boardStatus('placement', 'ai', {})).toEqual({
      text: 'KİLİDLİ', icon: 'lock', tone: 'muted',
    });
  });

  it('describes the battle phase', () => {
    expect(boardStatus('battle', 'player', {})).toEqual({
      text: 'MÜDAFİƏ', icon: 'shield', tone: 'muted',
    });
    expect(boardStatus('battle', 'ai', {})).toEqual({
      text: 'HƏDƏF AKTİVDİR', icon: 'crosshair', tone: 'cyan',
    });
  });

  it('reports surviving ships for the player at game over', () => {
    expect(boardStatus('gameover', 'player', { shipsAlive: 4 })).toEqual({
      text: 'QALDI: 4', icon: 'shield-check', tone: 'muted',
    });
  });

  it('reports the AI fleet as destroyed only when the player won', () => {
    expect(boardStatus('gameover', 'ai', { playerWon: true, shipsAlive: 0 })).toEqual({
      text: 'MƏHV EDİLDİ', icon: 'skull', tone: 'danger',
    });
    expect(boardStatus('gameover', 'ai', { playerWon: false, shipsAlive: 3 })).toEqual({
      text: 'QALDI: 3', icon: 'shield', tone: 'muted',
    });
  });
});
