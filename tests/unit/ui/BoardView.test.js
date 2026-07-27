import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite } from '../../../src/ui/icons.js';
import { BoardView, coordLabel } from '../../../src/ui/BoardView.js';

function mounted(side = 'player', title = 'SƏNİN DONANMAN') {
  const view = new BoardView({ side, title });
  document.body.append(view.mount());
  return view;
}

beforeEach(() => {
  document.body.innerHTML = '';
  injectSprite(document);
});

describe('coordLabel', () => {
  it('maps flat indices to chess-style coordinates', () => {
    expect(coordLabel(0)).toBe('A1');
    expect(coordLabel(9)).toBe('J1');
    expect(coordLabel(10)).toBe('A2');
    expect(coordLabel(99)).toBe('J10');
  });
});

describe('BoardView structure', () => {
  it('exposes the board through the data-board contract', () => {
    mounted('ai', 'RƏQİB SULARI');
    expect(document.querySelector('[data-board="ai"]')).not.toBeNull();
  });

  it('holds exactly 100 direct cell children', () => {
    const view = mounted();
    expect(view.board.children).toHaveLength(100);
    expect([...view.board.children].every((c) => c.classList.contains('cell'))).toBe(true);
  });

  it('numbers cells 0 to 99 in row-major order', () => {
    const view = mounted();
    const indices = [...view.board.children].map((c) => c.dataset.index);
    expect(indices[0]).toBe('0');
    expect(indices[99]).toBe('99');
    expect(indices).toHaveLength(100);
  });

  it('gives every cell exactly one persistent marker', () => {
    const view = mounted();
    expect(view.board.querySelectorAll('.cell > .cell__marker')).toHaveLength(100);
  });

  it('renders coordinate rulers outside the board', () => {
    const view = mounted();
    const cols = view.panel.querySelector('.ruler--cols');
    const rows = view.panel.querySelector('.ruler--rows');
    expect(cols.textContent).toBe('ABCDEFGHIJ');
    expect(rows.textContent).toBe('12345678910');
    expect(view.board.contains(cols)).toBe(false);
    expect(view.board.contains(rows)).toBe(false);
  });

  it('labels the board as a group, never a grid', () => {
    const view = mounted('ai', 'RƏQİB SULARI');
    expect(view.board.getAttribute('role')).toBe('group');
    expect(view.board.getAttribute('aria-label')).toBe('RƏQİB SULARI');
  });
});

describe('BoardView.update', () => {
  it('applies state classes and data-state', () => {
    const view = mounted();
    const states = new Array(100).fill('');
    states[0] = 'ship';
    states[5] = 'miss';
    view.update({ states });

    expect(view.cellAt(0).classList.contains('ship')).toBe(true);
    expect(view.cellAt(0).dataset.state).toBe('ship');
    expect(view.cellAt(5).classList.contains('miss')).toBe(true);
  });

  it('adds both hit and sunk classes for a sunk cell', () => {
    const view = mounted();
    const states = new Array(100).fill('');
    states[3] = 'sunk';
    view.update({ states });

    const cell = view.cellAt(3);
    expect(cell.classList.contains('hit')).toBe(true);
    expect(cell.classList.contains('sunk')).toBe(true);
  });

  it('swaps the marker reference to match the state', () => {
    const view = mounted();
    const states = new Array(100).fill('');
    states[7] = 'hit';
    view.update({ states });

    const use = view.cellAt(7).querySelector('use');
    expect(use.getAttribute('href')).toBe('#i-circle-dot');
  });

  it('keeps the same marker node across updates', () => {
    const view = mounted();
    const marker = view.cellAt(0).querySelector('.cell__marker');

    const first = new Array(100).fill('');
    first[0] = 'miss';
    view.update({ states: first });

    const second = new Array(100).fill('');
    second[0] = 'hit';
    view.update({ states: second });

    expect(view.cellAt(0).querySelector('.cell__marker')).toBe(marker);
  });

  it('clears a state back to empty', () => {
    const view = mounted();
    const filled = new Array(100).fill('');
    filled[0] = 'ship';
    view.update({ states: filled });
    view.update({ states: new Array(100).fill('') });

    expect(view.cellAt(0).className).toBe('cell');
    expect(view.cellAt(0).dataset.state).toBe('');
  });

  it('renders the board status text, icon, and tone', () => {
    const view = mounted();
    view.update({
      states: new Array(100).fill(''),
      status: { text: 'HƏDƏF AKTİVDİR', icon: 'crosshair', tone: 'cyan' },
    });

    const status = view.panel.querySelector('.board-status');
    expect(status.querySelector('.board-status__text').textContent).toBe('HƏDƏF AKTİVDİR');
    expect(status.querySelector('use').getAttribute('href')).toBe('#i-crosshair');
    expect(status.dataset.tone).toBe('cyan');
  });
});

describe('BoardView preview', () => {
  it('marks a valid preview with the preview class and crosshair', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setPreview([0, 1, 2], true);

    for (const i of [0, 1, 2]) {
      expect(view.cellAt(i).classList.contains('preview')).toBe(true);
      expect(view.cellAt(i).querySelector('use').getAttribute('href')).toBe('#i-crosshair');
    }
  });

  it('marks an invalid preview with preview--bad and an alert', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setPreview([88, 89], false);

    expect(view.cellAt(88).classList.contains('preview--bad')).toBe(true);
    expect(view.cellAt(89).querySelector('use').getAttribute('href')).toBe('#i-triangle-alert');
  });

  it('restores the underlying marker when the preview is cleared', () => {
    const view = mounted();
    const states = new Array(100).fill('');
    states[0] = 'ship';
    view.update({ states });

    view.setPreview([0], true);
    expect(view.cellAt(0).querySelector('use').getAttribute('href')).toBe('#i-crosshair');

    view.clearPreview();
    expect(view.cellAt(0).classList.contains('preview')).toBe(false);
    expect(view.cellAt(0).classList.contains('ship')).toBe(true);
    expect(view.cellAt(0).querySelector('use').getAttribute('href')).toBe('#i-ship');
  });

  it('leaves cells untouched when clearing with no active preview', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.clearPreview();
    expect(view.cellAt(0).className).toBe('cell');
  });
});
