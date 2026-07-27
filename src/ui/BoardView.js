import { el } from './dom.js';
import { icon, CELL_MARKER } from './icons.js';
import { STATE_LABEL } from './cellState.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function coordLabel(index) {
  return LETTERS[index % 10] + (Math.floor(index / 10) + 1);
}

export class BoardView {
  constructor({ side, title }) {
    this.side = side;
    this.title = title;
    this.panel = null;
    this.board = null;
    this.cells = [];
    this.statusEl = null;
    this.previewed = [];
    this.interactive = false;
    this.focusIndex = 0;
  }

  mount() {
    this.board = el('div', {
      className: 'board',
      dataset: { board: this.side },
      attrs: { role: 'group', 'aria-label': this.title },
    });

    for (let i = 0; i < 100; i++) {
      const cell = el('div', {
        className: 'cell',
        dataset: { index: String(i), state: '' },
        attrs: { 'aria-label': `${coordLabel(i)} · ${STATE_LABEL['']}` },
      }, icon('circle', 'cell__marker'));
      this.board.append(cell);
      this.cells.push(cell);
    }

    const cols = el('div', { className: 'ruler ruler--cols' },
      ...LETTERS.map((letter) => el('span', { text: letter })));

    const rows = el('div', { className: 'ruler ruler--rows' },
      ...Array.from({ length: 10 }, (_, r) => el('span', { text: r + 1 })));

    this.statusEl = el('p', {
      className: 'board-status',
      dataset: { tone: 'muted' },
    }, icon('shield', 'board-status__icon'), el('span', { className: 'board-status__text' }));

    this.panel = el('section', {
      className: 'board-panel',
      dataset: { side: this.side },
    },
      el('header', { className: 'board-panel__head' },
        el('h2', { className: 'board-panel__title', text: this.title }),
        this.statusEl),
      el('div', { className: 'board-grid' }, cols, rows, this.board),
    );

    this.board.addEventListener('keydown', (e) => this._onKeyDown(e));

    return this.panel;
  }

  setInteractive(enabled) {
    this.interactive = enabled;
    for (const cell of this.cells) {
      if (!enabled) {
        cell.removeAttribute('role');
        cell.removeAttribute('tabindex');
        cell.removeAttribute('aria-disabled');
        continue;
      }
      const spent = ['hit', 'miss', 'sunk'].includes(cell.dataset.state);
      cell.setAttribute('role', 'button');
      if (spent) cell.setAttribute('aria-disabled', 'true');
      else cell.removeAttribute('aria-disabled');
      cell.setAttribute('tabindex', '-1');
    }
    if (enabled) this._focus(this.focusIndex, false);
  }

  _focus(index, moveFocus = true) {
    const next = Math.max(0, Math.min(99, index));
    for (const cell of this.cells) cell.setAttribute('tabindex', '-1');
    this.focusIndex = next;
    const cell = this.cells[next];
    cell.setAttribute('tabindex', '0');
    if (moveFocus) cell.focus();
  }

  _onKeyDown(e) {
    if (!this.interactive) return;

    const row = Math.floor(this.focusIndex / 10);
    const col = this.focusIndex % 10;
    let next = null;

    if (e.key === 'ArrowRight' && col < 9) next = this.focusIndex + 1;
    else if (e.key === 'ArrowLeft' && col > 0) next = this.focusIndex - 1;
    else if (e.key === 'ArrowDown' && row < 9) next = this.focusIndex + 10;
    else if (e.key === 'ArrowUp' && row > 0) next = this.focusIndex - 10;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 99;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.cells[this.focusIndex].click();
      return;
    } else {
      return;
    }

    e.preventDefault();
    if (next !== null) this._focus(next);
  }

  cellAt(index) {
    return this.cells[index];
  }

  update({ states, status }) {
    for (let i = 0; i < 100; i++) {
      const next = states[i];
      const cell = this.cells[i];
      if (cell.dataset.state === next) continue;

      cell.className = 'cell';
      if (next === 'sunk') cell.classList.add('hit', 'sunk');
      else if (next) cell.classList.add(next);

      cell.dataset.state = next;
      cell.setAttribute('aria-label', `${coordLabel(i)} · ${STATE_LABEL[next]}`);
      this._marker(cell, next);
    }

    if (status) this._status(status);
  }

  setPreview(indices, valid) {
    this.clearPreview();
    const key = valid ? 'preview' : 'preview--bad';
    for (const i of indices) {
      const cell = this.cells[i];
      if (!cell) continue;
      cell.classList.add(key);
      this._marker(cell, key);
      this.previewed.push(i);
    }
  }

  clearPreview() {
    for (const i of this.previewed) {
      const cell = this.cells[i];
      cell.classList.remove('preview', 'preview--bad');
      this._marker(cell, cell.dataset.state);
    }
    this.previewed = [];
  }

  _marker(cell, key) {
    const name = CELL_MARKER[key];
    if (!name) return;
    cell.querySelector('.cell__marker use').setAttribute('href', `#i-${name}`);
  }

  _status({ text, icon: iconName, tone }) {
    this.statusEl.dataset.tone = tone;
    this.statusEl.querySelector('.board-status__text').textContent = text;
    this.statusEl.querySelector('.board-status__icon use')
      .setAttribute('href', `#i-${iconName}`);
  }
}
