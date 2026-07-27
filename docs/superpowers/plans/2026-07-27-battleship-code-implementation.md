# BattleShip Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the approved Tactical Command Center design in HTML, CSS, and JavaScript without changing any domain class.

**Architecture:** `index.html` holds only `<div id="app">`. Four view modules (`BoardView`, `HudView`, `ResultView`, plus `dom`/`icons`/`cellState` helpers) each `mount()` their DOM once, then `update(state)` patches text, classes, and `<use href>` in place. `UI.js` is the only module that reads `game`; it derives plain view-state objects and passes them down.

**Tech Stack:** Vanilla ES modules, no build step. Vitest + jsdom for unit tests, Playwright for end-to-end. Inline SVG sprite for icons. System font stacks.

**Spec:** [`docs/superpowers/specs/2026-07-27-battleship-code-implementation-design.md`](../specs/2026-07-27-battleship-code-implementation-design.md)

## Global Constraints

- Do not modify `src/Game.js`, `src/Board.js`, `src/Ship.js`, or `src/AI.js`.
- Do not modify the six existing tests in `tests/e2e/`. They must stay green.
- `.board` must have exactly 100 direct `.cell` children, `data-index` `0`–`99`, row-major. No wrapper element between them.
- Preserve these selectors: `.game[data-phase]`, `[data-board="player"|"ai"]`, `[data-index]`, `[data-score="player"|"ai"]`, `[data-message]`, `[data-action="rotate"|"auto-place"|"new-game"]`, `[data-controls="placement"]`, and the classes `.ship .hit .miss .sunk .preview .preview--bad`.
- The result panel restart button uses `data-action="restart"`, never `data-action="new-game"` — Playwright strict mode fails on duplicate matches.
- Preserve these strings byte-for-byte: `Bu xanaya artıq hücum edilib!`, `İstiqamət: Şaquli`, `İstiqamət: Üfüqi`, `Təbrik edirik! Siz qalibisiniz! 🎉`, `AI qazandı. Yenidən cəhd edin!`, `Buraya yerləşdirilə bilməz!`, `Bütün gəmilər yerləşdirildi. Döyüş başlayır!`.
- No network requests. No CDN fonts, no external icon library at runtime.
- Colour is never the only state indicator: every cell state carries an icon marker and an accessible name.
- `role="grid"` is forbidden — ARIA `grid` requires `role="row"` children, which the flat 100-cell contract disallows. Use `role="group"`.
- Azerbaijani copy in the UI; English for CSS class names, JS identifiers, and code comments.
- `vitest.config.js` already sets `environment: 'jsdom'` and excludes `tests/e2e`. Do not change it.
- Commit after every task.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `src/ui/dom.js` | The single `el()` element factory |
| `src/ui/icons.js` | SVG sprite string, idempotent injection, `icon()`, `CELL_MARKER` |
| `src/ui/cellState.js` | Pure cell-state derivation, extracted from `UI` |
| `src/ui/BoardView.js` | One board panel: header, rulers, 100 cells, markers, preview, focus |
| `src/ui/HudView.js` | Command header, operations bar, status bar, legend |
| `src/ui/ResultView.js` | Game Over scrim and result panel |
| `tests/unit/ui/dom.test.js` | `el()` behaviour |
| `tests/unit/ui/icons.test.js` | Sprite idempotency, marker map completeness |
| `tests/unit/ui/cellState.test.js` | Five states and boundaries |
| `tests/unit/ui/BoardView.test.js` | Structure, patching, preview, accessibility |
| `tests/unit/ui/HudView.test.js` | HUD text derivation |
| `tests/unit/ui/ResultView.test.js` | Victory and defeat states |
| `tests/e2e/hud.spec.js` | Rulers, legend, board statuses, operations bar visibility |
| `tests/e2e/responsive.spec.js` | Three widths, no horizontal overflow |
| `tests/e2e/a11y.spec.js` | Accessible names, keyboard attack, reduced motion |

**Modify:**

| File | Change |
|---|---|
| `index.html` | Reduce to `<div id="app">` plus the module script |
| `main.css` | Full rewrite: new tokens, panels, cell states, responsive, motion |
| `src/UI.js` | Rewrite as orchestrator; keep public `render()` |
| `src/main.js` | Call `ui.mount(root)` before `ui.render()` |
| `tests/e2e/gameover.spec.js` | Append result-panel cases; do not touch existing three |

---

### Task 1: DOM helper and icon sprite

**Files:**
- Create: `src/ui/dom.js`
- Create: `src/ui/icons.js`
- Test: `tests/unit/ui/dom.test.js`
- Test: `tests/unit/ui/icons.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `el(tag, props?, ...children) -> Element` where `props` is `{ className?: string, text?: string|number, dataset?: Record<string,string>, attrs?: Record<string,string>, style?: Record<string,string> }`; `null` and `undefined` children are skipped
  - `injectSprite(doc = document) -> SVGElement` — idempotent, returns the existing sprite if `#battleship-sprite` is present
  - `icon(name, className?) -> SVGElement` — `<svg class><use href="#i-{name}"></use></svg>`
  - `ICON_NAMES: string[]` — every symbol id in the sprite, without the `i-` prefix
  - `CELL_MARKER: Record<string,string>` — `{ ship, hit, sunk, miss, preview, 'preview--bad' }` mapped to icon names

- [ ] **Step 1: Write the failing test for `el()`**

Create `tests/unit/ui/dom.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { el } from '../../../src/ui/dom.js';

describe('el', () => {
  it('creates an element with the given tag', () => {
    expect(el('section').tagName).toBe('SECTION');
  });

  it('applies className, text, dataset, and attrs', () => {
    const node = el('div', {
      className: 'cell',
      text: 'A1',
      dataset: { index: '0', state: '' },
      attrs: { 'aria-label': 'A1 · boş' },
    });
    expect(node.className).toBe('cell');
    expect(node.textContent).toBe('A1');
    expect(node.dataset.index).toBe('0');
    expect(node.dataset.state).toBe('');
    expect(node.getAttribute('aria-label')).toBe('A1 · boş');
  });

  it('appends element and string children and skips nullish ones', () => {
    const node = el('p', {}, el('span'), null, 'text', undefined);
    expect(node.childNodes).toHaveLength(2);
    expect(node.firstChild.tagName).toBe('SPAN');
    expect(node.textContent).toBe('text');
  });

  it('accepts numeric text', () => {
    expect(el('b', { text: 0 }).textContent).toBe('0');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/dom.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/dom.js"`

- [ ] **Step 3: Implement `el()`**

Create `src/ui/dom.js`:

```js
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  const { className, text, dataset, attrs, style } = props;

  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (dataset) for (const [k, v] of Object.entries(dataset)) node.dataset[k] = v;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (style) Object.assign(node.style, style);

  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/dom.test.js`
Expected: PASS — 4 tests

- [ ] **Step 5: Write the failing test for the sprite**

Create `tests/unit/ui/icons.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite, icon, ICON_NAMES, CELL_MARKER } from '../../../src/ui/icons.js';

describe('icons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('injects a hidden sprite into the body', () => {
    injectSprite(document);
    const sprite = document.getElementById('battleship-sprite');
    expect(sprite).not.toBeNull();
    expect(sprite.hasAttribute('hidden')).toBe(true);
  });

  it('is idempotent', () => {
    const first = injectSprite(document);
    const second = injectSprite(document);
    expect(second).toBe(first);
    expect(document.querySelectorAll('#battleship-sprite')).toHaveLength(1);
  });

  it('defines a symbol for every declared icon name', () => {
    injectSprite(document);
    for (const name of ICON_NAMES) {
      expect(document.getElementById(`i-${name}`), name).not.toBeNull();
    }
  });

  it('gives every symbol a viewBox', () => {
    injectSprite(document);
    for (const name of ICON_NAMES) {
      expect(document.getElementById(`i-${name}`).getAttribute('viewBox')).toBe('0 0 24 24');
    }
  });

  it('builds an svg that references the sprite symbol', () => {
    const node = icon('crosshair', 'cell__marker');
    expect(node.tagName.toLowerCase()).toBe('svg');
    expect(node.getAttribute('class')).toBe('cell__marker');
    expect(node.querySelector('use').getAttribute('href')).toBe('#i-crosshair');
  });

  it('maps every cell state to a declared icon', () => {
    for (const [state, name] of Object.entries(CELL_MARKER)) {
      expect(ICON_NAMES, `${state} -> ${name}`).toContain(name);
    }
  });

  it('covers all six visual cell states', () => {
    expect(Object.keys(CELL_MARKER).sort()).toEqual(
      ['hit', 'miss', 'preview', 'preview--bad', 'ship', 'sunk'],
    );
  });
});
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/icons.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/icons.js"`

- [ ] **Step 7: Implement the sprite**

Create `src/ui/icons.js`. These are hand-authored 24×24 stroke glyphs standing in for the named Lucide icons, so the project stays free of external assets:

```js
const SVG_NS = 'http://www.w3.org/2000/svg';

const GLYPHS = {
  'radar': '<circle cx="12" cy="12" r="9"/><path d="M12 12 12 4"/><path d="M12 12 19 16"/><circle cx="12" cy="12" r="1.5"/>',
  'radio-tower': '<path d="M6 20 12 8 18 20"/><path d="M8.5 15h7"/><circle cx="12" cy="4" r="2"/>',
  'crosshair': '<circle cx="12" cy="12" r="9"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M1 12h4"/><path d="M19 12h4"/>',
  'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  'circle': '<circle cx="12" cy="12" r="8"/>',
  'circle-dot': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  'skull': '<path d="M12 3a7 7 0 0 0-7 7v3l-1 3h16l-1-3v-3a7 7 0 0 0-7-7z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M9 19h6"/>',
  'triangle-alert': '<path d="M12 4 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  'lock': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  'shield': '<path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/>',
  'shield-check': '<path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/><path d="M9 12l2.5 2.5L16 10"/>',
  'ship': '<path d="M3 15h18l-2 5H5z"/><path d="M6 15V9h12v6"/><path d="M12 9V5"/>',
  'refresh-cw': '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
  'rotate-cw': '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>',
  'wand-sparkles': '<path d="M5 19 17 7"/><path d="M15 5l2-2 2 2-2 2z"/><path d="M6 6h2"/><path d="M7 5v2"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3"/><path d="M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M9 20h6"/>',
};

export const ICON_NAMES = Object.keys(GLYPHS);

export const CELL_MARKER = {
  'ship': 'ship',
  'hit': 'circle-dot',
  'sunk': 'skull',
  'miss': 'circle',
  'preview': 'crosshair',
  'preview--bad': 'triangle-alert',
};

const SPRITE_ID = 'battleship-sprite';

export function injectSprite(doc = document) {
  const existing = doc.getElementById(SPRITE_ID);
  if (existing) return existing;

  const symbols = ICON_NAMES
    .map((name) => `<symbol id="i-${name}" viewBox="0 0 24 24">${GLYPHS[name]}</symbol>`)
    .join('');

  const sprite = doc.createElementNS(SVG_NS, 'svg');
  sprite.id = SPRITE_ID;
  sprite.setAttribute('hidden', '');
  sprite.setAttribute('fill', 'none');
  sprite.setAttribute('stroke', 'currentColor');
  sprite.setAttribute('stroke-width', '2');
  sprite.setAttribute('stroke-linecap', 'round');
  sprite.setAttribute('stroke-linejoin', 'round');
  sprite.innerHTML = symbols;

  doc.body.append(sprite);
  return sprite;
}

export function icon(name, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  if (className) svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}
```

- [ ] **Step 8: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/icons.test.js`
Expected: PASS — 7 tests

- [ ] **Step 9: Confirm nothing else broke**

Run: `npm test`
Expected: PASS — 22 existing plus 11 new

- [ ] **Step 10: Commit**

```bash
git add src/ui/dom.js src/ui/icons.js tests/unit/ui/dom.test.js tests/unit/ui/icons.test.js
git commit -m "feat: add DOM helper and self-contained icon sprite"
```

---

### Task 2: Pure cell-state derivation

**Files:**
- Create: `src/ui/cellState.js`
- Test: `tests/unit/ui/cellState.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `cellState(index, boardData, isAI) -> '' | 'ship' | 'hit' | 'miss' | 'sunk'` — identical logic to the current `UI._cellState`
  - `boardStates(boardData, isAI) -> string[]` — length 100, index-aligned
  - `STATE_LABEL: Record<string,string>` — `{ '': 'boş', ship: 'gəmi', hit: 'vuruldu', miss: 'yan keçdi', sunk: 'batdı' }`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ui/cellState.test.js`:

```js
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
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/cellState.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/cellState.js"`

- [ ] **Step 3: Implement the module**

Create `src/ui/cellState.js`:

```js
export const STATE_LABEL = {
  '': 'boş',
  ship: 'gəmi',
  hit: 'vuruldu',
  miss: 'yan keçdi',
  sunk: 'batdı',
};

export function cellState(index, boardData, isAI) {
  const attacked = boardData.attacked.has(index);
  const ship = boardData.ships.find((s) => s.occupies(index));
  if (attacked && ship) return ship.isSunk() ? 'sunk' : 'hit';
  if (attacked) return 'miss';
  if (!isAI && ship) return 'ship';
  return '';
}

export function boardStates(boardData, isAI) {
  const states = new Array(100);
  for (let i = 0; i < 100; i++) states[i] = cellState(i, boardData, isAI);
  return states;
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/cellState.test.js`
Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/cellState.js tests/unit/ui/cellState.test.js
git commit -m "refactor: extract cell state derivation into a pure module"
```

---

### Task 3: BoardView structure and state patching

**Files:**
- Create: `src/ui/BoardView.js`
- Test: `tests/unit/ui/BoardView.test.js`

**Interfaces:**
- Consumes: `el` from `src/ui/dom.js`; `icon`, `CELL_MARKER` from `src/ui/icons.js`; `STATE_LABEL` from `src/ui/cellState.js`
- Produces:
  - `coordLabel(index) -> string` — `0` becomes `A1`, `9` becomes `J1`, `99` becomes `J10`
  - `class BoardView`
    - `new BoardView({ side, title })` where `side` is `'player'` or `'ai'`
    - `mount() -> HTMLElement` — the panel; also sets `this.panel`, `this.board`, `this.cells`
    - `update({ states, status }) -> void` — `status` is `{ text, icon, tone }` with `tone` in `'cyan' | 'muted' | 'danger'`
    - `cellAt(index) -> HTMLElement`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ui/BoardView.test.js`:

```js
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
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/BoardView.js"`

- [ ] **Step 3: Implement `BoardView`**

Create `src/ui/BoardView.js`:

```js
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

    return this.panel;
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
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: PASS — 13 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/BoardView.js tests/unit/ui/BoardView.test.js
git commit -m "feat: add BoardView with rulers, markers, and state patching"
```

---

### Task 4: BoardView placement preview

**Files:**
- Modify: `src/ui/BoardView.js`
- Test: `tests/unit/ui/BoardView.test.js`

**Interfaces:**
- Consumes: `BoardView` from Task 3
- Produces:
  - `BoardView.prototype.setPreview(indices, valid) -> void` — adds `.preview` when `valid`, `.preview--bad` otherwise, and swaps those cells' markers
  - `BoardView.prototype.clearPreview() -> void` — removes both classes and restores each marker from `dataset.state`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/ui/BoardView.test.js`:

```js
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
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: FAIL — `view.setPreview is not a function`

- [ ] **Step 3: Add the preview methods**

In `src/ui/BoardView.js`, add `this.previewed = [];` to the constructor, then add these two methods to the class:

```js
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
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: PASS — 17 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/BoardView.js tests/unit/ui/BoardView.test.js
git commit -m "feat: add placement preview to BoardView"
```

---

### Task 5: BoardView keyboard access

**Files:**
- Modify: `src/ui/BoardView.js`
- Test: `tests/unit/ui/BoardView.test.js`

**Interfaces:**
- Consumes: `BoardView` from Task 4
- Produces:
  - `BoardView.prototype.setInteractive(enabled) -> void` — when `enabled`, playable cells get `role="button"` and join the roving tab order; attacked cells get `aria-disabled="true"` and `tabindex="-1"`. When disabled, all cells lose `role`, `tabindex`, and `aria-disabled`.
  - Arrow keys, `Home`, and `End` move focus inside the board. `Enter` and `Space` click the focused cell.
  - Exactly one cell carries `tabindex="0"` while interactive.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/ui/BoardView.test.js`:

```js
function key(board, k) {
  const event = new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  board.dispatchEvent(event);
  return event;
}

describe('BoardView keyboard access', () => {
  it('creates exactly one tab stop when interactive', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);

    expect(view.board.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(view.cellAt(0).getAttribute('tabindex')).toBe('0');
    expect(view.cellAt(0).getAttribute('role')).toBe('button');
  });

  it('removes roles and tab stops when not interactive', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);
    view.setInteractive(false);

    expect(view.board.querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(view.cellAt(0).hasAttribute('role')).toBe(false);
  });

  it('marks attacked cells as disabled and unfocusable', () => {
    const view = mounted();
    const states = new Array(100).fill('');
    states[4] = 'miss';
    states[5] = 'hit';
    view.update({ states });
    view.setInteractive(true);

    expect(view.cellAt(4).getAttribute('aria-disabled')).toBe('true');
    expect(view.cellAt(4).getAttribute('tabindex')).toBe('-1');
    expect(view.cellAt(5).getAttribute('aria-disabled')).toBe('true');
  });

  it('moves focus with the arrow keys', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);

    key(view.board, 'ArrowRight');
    expect(view.focusIndex).toBe(1);
    key(view.board, 'ArrowDown');
    expect(view.focusIndex).toBe(11);
    key(view.board, 'ArrowLeft');
    expect(view.focusIndex).toBe(10);
    key(view.board, 'ArrowUp');
    expect(view.focusIndex).toBe(0);
  });

  it('does not move focus past an edge', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);

    key(view.board, 'ArrowLeft');
    expect(view.focusIndex).toBe(0);
    key(view.board, 'ArrowUp');
    expect(view.focusIndex).toBe(0);
  });

  it('jumps to the first and last cell with Home and End', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);

    key(view.board, 'End');
    expect(view.focusIndex).toBe(99);
    key(view.board, 'Home');
    expect(view.focusIndex).toBe(0);
  });

  it('clicks the focused cell on Enter and Space', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    view.setInteractive(true);

    const clicked = [];
    view.board.addEventListener('click', (e) => clicked.push(e.target.dataset.index));

    key(view.board, 'ArrowRight');
    key(view.board, 'Enter');
    key(view.board, ' ');

    expect(clicked).toEqual(['1', '1']);
  });

  it('ignores keys while not interactive', () => {
    const view = mounted();
    view.update({ states: new Array(100).fill('') });
    key(view.board, 'ArrowRight');
    expect(view.focusIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: FAIL — `view.setInteractive is not a function`

- [ ] **Step 3: Add keyboard support**

In `src/ui/BoardView.js`, add to the constructor:

```js
    this.interactive = false;
    this.focusIndex = 0;
```

In `mount()`, immediately before `return this.panel;`, register the handler:

```js
    this.board.addEventListener('keydown', (e) => this._onKeyDown(e));
```

Add these methods to the class:

```js
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
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/BoardView.test.js`
Expected: PASS — 25 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/BoardView.js tests/unit/ui/BoardView.test.js
git commit -m "feat: add roving tabindex keyboard access to BoardView"
```

---

### Task 6: HudView

**Files:**
- Create: `src/ui/HudView.js`
- Test: `tests/unit/ui/HudView.test.js`

**Interfaces:**
- Consumes: `el` from `src/ui/dom.js`; `icon` from `src/ui/icons.js`
- Produces:
  - `PHASE_LABEL: Record<string,string>` — `{ placement: 'DONANMANI YERLƏŞDİR', battle: 'DÖYÜŞ', gameover: 'NƏTİCƏ' }`
  - `EYEBROW: Record<string,string>` — `{ placement: 'YERLƏŞDİRMƏ', battle: 'SON GEDİŞ', gameover: 'NƏTİCƏ' }`
  - `class HudView`
    - `mountHeader() -> HTMLElement` — the command header, containing `[data-score]` and `[data-action="new-game"]`
    - `mountOperations() -> HTMLElement` — `[data-controls="placement"]`, containing `[data-action="rotate"]` and `[data-action="auto-place"]`
    - `mountStatusBar() -> HTMLElement` — contains `[data-message]` with `aria-live="polite"`
    - `mountLegend() -> HTMLElement`
    - `update({ phase, scores, nextShipSize, shipsRemaining, direction, message, tone }) -> void` where `direction` is `'horizontal'` or `'vertical'` and `tone` is `'neutral'` or `'danger'`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ui/HudView.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite } from '../../../src/ui/icons.js';
import { HudView, PHASE_LABEL, EYEBROW } from '../../../src/ui/HudView.js';

function mounted() {
  const hud = new HudView();
  document.body.append(hud.mountHeader(), hud.mountOperations(), hud.mountStatusBar(), hud.mountLegend());
  return hud;
}

const BASE = {
  phase: 'placement',
  scores: { player: 0, ai: 0 },
  nextShipSize: 4,
  shipsRemaining: 10,
  direction: 'horizontal',
  message: '',
  tone: 'neutral',
};

beforeEach(() => {
  document.body.innerHTML = '';
  injectSprite(document);
});

describe('HudView contract selectors', () => {
  it('renders every pinned selector', () => {
    mounted();
    expect(document.querySelector('[data-score="player"]')).not.toBeNull();
    expect(document.querySelector('[data-score="ai"]')).not.toBeNull();
    expect(document.querySelector('[data-action="new-game"]')).not.toBeNull();
    expect(document.querySelector('[data-action="rotate"]')).not.toBeNull();
    expect(document.querySelector('[data-action="auto-place"]')).not.toBeNull();
    expect(document.querySelector('[data-controls="placement"]')).not.toBeNull();
    expect(document.querySelector('[data-message]')).not.toBeNull();
  });

  it('announces the message region politely', () => {
    mounted();
    expect(document.querySelector('[data-message]').getAttribute('aria-live')).toBe('polite');
  });

  it('exposes exactly one new-game action', () => {
    mounted();
    expect(document.querySelectorAll('[data-action="new-game"]')).toHaveLength(1);
  });
});

describe('HudView.update', () => {
  it('writes the phase label for each phase', () => {
    const hud = mounted();
    for (const phase of ['placement', 'battle', 'gameover']) {
      hud.update({ ...BASE, phase });
      expect(document.querySelector('.phase__label').textContent).toBe(PHASE_LABEL[phase]);
    }
  });

  it('writes the eyebrow for each phase', () => {
    const hud = mounted();
    for (const phase of ['placement', 'battle', 'gameover']) {
      hud.update({ ...BASE, phase });
      expect(document.querySelector('.statusbar__eyebrow').textContent).toBe(EYEBROW[phase]);
    }
  });

  it('writes scores as text', () => {
    const hud = mounted();
    hud.update({ ...BASE, scores: { player: 3, ai: 2 } });
    expect(document.querySelector('[data-score="player"]').textContent).toBe('3');
    expect(document.querySelector('[data-score="ai"]').textContent).toBe('2');
  });

  it('describes the next ship and remaining fleet', () => {
    const hud = mounted();
    hud.update({ ...BASE, nextShipSize: 3, shipsRemaining: 7 });
    expect(document.querySelector('.ops__size').textContent).toBe('3 XANALI');
    expect(document.querySelector('.ops__left').textContent).toBe('· 7 GƏMİ QALIB');
  });

  it('hides the fleet block when no ship is left to place', () => {
    const hud = mounted();
    hud.update({ ...BASE, nextShipSize: undefined, shipsRemaining: 0 });
    expect(document.querySelector('.ops__size').textContent).toBe('');
  });

  it('shows the orientation chip in Azerbaijani', () => {
    const hud = mounted();
    hud.update({ ...BASE, direction: 'horizontal' });
    expect(document.querySelector('.chip__text').textContent).toBe('ÜFÜQİ · R');
    hud.update({ ...BASE, direction: 'vertical' });
    expect(document.querySelector('.chip__text').textContent).toBe('ŞAQULİ · R');
  });

  it('writes the message and tone', () => {
    const hud = mounted();
    hud.update({ ...BASE, message: 'Buraya yerləşdirilə bilməz!', tone: 'danger' });
    expect(document.querySelector('[data-message]').textContent).toBe('Buraya yerləşdirilə bilməz!');
    expect(document.querySelector('.statusbar').dataset.tone).toBe('danger');
  });

  it('lists the three shipped legend entries', () => {
    mounted();
    const labels = [...document.querySelectorAll('.legend__label')].map((n) => n.textContent);
    expect(labels).toEqual(['GƏMİ', 'VURULDU', 'YAN KEÇDİ']);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/HudView.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/HudView.js"`

- [ ] **Step 3: Implement `HudView`**

Create `src/ui/HudView.js`:

```js
import { el } from './dom.js';
import { icon } from './icons.js';

export const PHASE_LABEL = {
  placement: 'DONANMANI YERLƏŞDİR',
  battle: 'DÖYÜŞ',
  gameover: 'NƏTİCƏ',
};

export const EYEBROW = {
  placement: 'YERLƏŞDİRMƏ',
  battle: 'SON GEDİŞ',
  gameover: 'NƏTİCƏ',
};

const STATUS_ICON = {
  placement: 'crosshair',
  battle: 'radar',
  gameover: 'trophy',
};

const LEGEND = [
  { icon: 'ship', label: 'GƏMİ', tone: 'muted' },
  { icon: 'circle-dot', label: 'VURULDU', tone: 'danger' },
  { icon: 'circle', label: 'YAN KEÇDİ', tone: 'cyan' },
];

function button(action, iconName, label, variant) {
  return el('button', {
    className: `btn btn--${variant}`,
    dataset: { action },
    attrs: { type: 'button' },
  }, icon(iconName, 'btn__icon'), el('span', { text: label }));
}

export class HudView {
  mountHeader() {
    this.phaseLabelEl = el('span', { className: 'phase__label' });
    this.scoreEls = {
      player: el('b', { className: 'score__value', dataset: { score: 'player' }, text: '0' }),
      ai: el('b', { className: 'score__value', dataset: { score: 'ai' }, text: '0' }),
    };

    this.header = el('header', { className: 'cmd' },
      el('div', { className: 'cmd__brand' },
        icon('radar', 'cmd__logo'),
        el('span', { className: 'cmd__wordmark', text: 'BATTLESHIP' })),
      el('p', { className: 'phase' },
        el('span', { className: 'phase__dot' }),
        this.phaseLabelEl),
      el('div', { className: 'cmd__right' },
        el('p', { className: 'score' },
          this.scoreEls.player,
          el('span', { className: 'score__sep', text: '—' }),
          this.scoreEls.ai),
        button('new-game', 'refresh-cw', 'YENİ OYUN', 'ghost')),
    );

    return this.header;
  }

  mountOperations() {
    this.sizeEl = el('b', { className: 'ops__size' });
    this.leftEl = el('span', { className: 'ops__left' });
    this.chipEl = el('span', { className: 'chip__text' });

    this.operations = el('div', {
      className: 'ops',
      dataset: { controls: 'placement' },
    },
      el('div', { className: 'ops__fleet' },
        el('span', { className: 'eyebrow', text: 'NÖVBƏTİ GƏMİ' }),
        el('span', { className: 'ops__ship' },
          icon('ship', 'ops__icon'), this.sizeEl, this.leftEl)),
      el('p', { className: 'chip' }, icon('rotate-cw', 'chip__icon'), this.chipEl),
      el('div', { className: 'ops__actions' },
        button('rotate', 'rotate-cw', 'FIRLAT', 'secondary'),
        button('auto-place', 'wand-sparkles', 'AVTOMATİK YERLƏŞDİR', 'primary')),
    );

    return this.operations;
  }

  mountStatusBar() {
    this.eyebrowEl = el('span', { className: 'eyebrow statusbar__eyebrow' });
    this.messageEl = el('p', {
      className: 'statusbar__msg',
      dataset: { message: '' },
      attrs: { 'aria-live': 'polite' },
    });
    this.statusIcon = icon('crosshair', 'statusbar__icon');

    this.statusBar = el('div', {
      className: 'statusbar',
      dataset: { tone: 'neutral' },
    },
      el('span', { className: 'statusbar__badge' }, this.statusIcon),
      el('div', { className: 'statusbar__copy' }, this.eyebrowEl, this.messageEl),
    );

    return this.statusBar;
  }

  mountLegend() {
    this.legend = el('ul', { className: 'legend' },
      ...LEGEND.map((entry) => el('li', {
        className: 'legend__item',
        dataset: { tone: entry.tone },
      }, icon(entry.icon, 'legend__icon'),
        el('span', { className: 'legend__label', text: entry.label }))),
    );

    return this.legend;
  }

  update({ phase, scores, nextShipSize, shipsRemaining, direction, message, tone }) {
    this.phaseLabelEl.textContent = PHASE_LABEL[phase];
    this.eyebrowEl.textContent = EYEBROW[phase];
    this.statusIcon.querySelector('use').setAttribute('href', `#i-${STATUS_ICON[phase]}`);

    this.scoreEls.player.textContent = String(scores.player);
    this.scoreEls.ai.textContent = String(scores.ai);

    this.sizeEl.textContent = nextShipSize ? `${nextShipSize} XANALI` : '';
    this.leftEl.textContent = shipsRemaining > 0 ? `· ${shipsRemaining} GƏMİ QALIB` : '';

    this.chipEl.textContent = direction === 'horizontal' ? 'ÜFÜQİ · R' : 'ŞAQULİ · R';

    this.messageEl.textContent = message;
    this.statusBar.dataset.tone = tone;
  }
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/HudView.test.js`
Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/HudView.js tests/unit/ui/HudView.test.js
git commit -m "feat: add HudView for header, operations, status, and legend"
```

---

### Task 7: ResultView

**Files:**
- Create: `src/ui/ResultView.js`
- Test: `tests/unit/ui/ResultView.test.js`

**Interfaces:**
- Consumes: `el` from `src/ui/dom.js`; `icon` from `src/ui/icons.js`
- Produces:
  - `class ResultView`
    - `mount() -> HTMLElement` — the overlay, hidden until `phase` is `gameover`; the restart button carries `data-action="restart"`
    - `update({ phase, playerWon, scores }) -> void`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ui/ResultView.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite } from '../../../src/ui/icons.js';
import { ResultView } from '../../../src/ui/ResultView.js';

function mounted() {
  const view = new ResultView();
  document.body.append(view.mount());
  return view;
}

beforeEach(() => {
  document.body.innerHTML = '';
  injectSprite(document);
});

describe('ResultView', () => {
  it('is hidden before the game ends', () => {
    const view = mounted();
    view.update({ phase: 'battle', playerWon: false, scores: { player: 0, ai: 0 } });
    expect(view.root.hasAttribute('hidden')).toBe(true);
  });

  it('uses data-action="restart" so it never collides with new-game', () => {
    mounted();
    expect(document.querySelectorAll('[data-action="new-game"]')).toHaveLength(0);
    const btn = document.querySelector('[data-action="restart"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('YENİDƏN OYNA');
  });

  it('shows victory copy when the player won', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 4, ai: 2 } });

    expect(view.root.hasAttribute('hidden')).toBe(false);
    expect(view.root.dataset.outcome).toBe('victory');
    expect(view.root.querySelector('.result__title').textContent).toBe('QƏLƏBƏ');
    expect(view.root.querySelector('.result__copy').textContent)
      .toBe('Rəqib donanmasının bütün gəmiləri məhv edildi.');
    expect(view.root.querySelector('.result__eyebrow').textContent).toBe('DÖYÜŞ TAMAMLANDI');
    expect(view.root.querySelector('use').getAttribute('href')).toBe('#i-trophy');
  });

  it('shows defeat copy when the AI won', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: false, scores: { player: 2, ai: 4 } });

    expect(view.root.dataset.outcome).toBe('defeat');
    expect(view.root.querySelector('.result__title').textContent).toBe('MƏĞLUBİYYƏT');
    expect(view.root.querySelector('.result__copy').textContent)
      .toBe('Bütün gəmiləriniz məhv edildi.');
    expect(view.root.querySelector('use').getAttribute('href')).toBe('#i-skull');
  });

  it('renders the score in player—ai order', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 4, ai: 2 } });
    expect(view.root.querySelector('.result__score').textContent).toBe('4 — 2');
  });

  it('hides again after a restart back to placement', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 1, ai: 0 } });
    view.update({ phase: 'placement', playerWon: false, scores: { player: 1, ai: 0 } });
    expect(view.root.hasAttribute('hidden')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/ResultView.test.js`
Expected: FAIL — `Failed to resolve import "../../../src/ui/ResultView.js"`

- [ ] **Step 3: Implement `ResultView`**

Create `src/ui/ResultView.js`:

```js
import { el } from './dom.js';
import { icon } from './icons.js';

const OUTCOME = {
  victory: {
    icon: 'trophy',
    eyebrow: 'DÖYÜŞ TAMAMLANDI',
    title: 'QƏLƏBƏ',
    copy: 'Rəqib donanmasının bütün gəmiləri məhv edildi.',
  },
  defeat: {
    icon: 'skull',
    eyebrow: 'DÖYÜŞ TAMAMLANDI',
    title: 'MƏĞLUBİYYƏT',
    copy: 'Bütün gəmiləriniz məhv edildi.',
  },
};

export class ResultView {
  mount() {
    this.iconEl = icon('trophy', 'result__icon');
    this.eyebrowEl = el('span', { className: 'eyebrow result__eyebrow' });
    this.titleEl = el('h2', { className: 'result__title' });
    this.copyEl = el('p', { className: 'result__copy' });
    this.scoreEl = el('p', { className: 'result__score' });

    this.root = el('div', {
      className: 'result',
      dataset: { outcome: 'victory' },
      attrs: { hidden: '' },
    },
      el('div', { className: 'result__scrim' }),
      el('section', {
        className: 'result__panel',
        attrs: { role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'result-title' },
      },
        el('span', { className: 'result__badge' }, this.iconEl),
        this.eyebrowEl,
        this.titleEl,
        this.copyEl,
        this.scoreEl,
        el('button', {
          className: 'btn btn--primary',
          dataset: { action: 'restart' },
          attrs: { type: 'button' },
        }, icon('refresh-cw', 'btn__icon'), el('span', { text: 'YENİDƏN OYNA' }))),
    );

    this.titleEl.id = 'result-title';
    return this.root;
  }

  update({ phase, playerWon, scores }) {
    if (phase !== 'gameover') {
      this.root.setAttribute('hidden', '');
      return;
    }

    const key = playerWon ? 'victory' : 'defeat';
    const copy = OUTCOME[key];

    this.root.dataset.outcome = key;
    this.iconEl.querySelector('use').setAttribute('href', `#i-${copy.icon}`);
    this.eyebrowEl.textContent = copy.eyebrow;
    this.titleEl.textContent = copy.title;
    this.copyEl.textContent = copy.copy;
    this.scoreEl.textContent = `${scores.player} — ${scores.ai}`;
    this.root.removeAttribute('hidden');
  }
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run tests/unit/ui/ResultView.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/ui/ResultView.js tests/unit/ui/ResultView.test.js
git commit -m "feat: add ResultView game over overlay"
```

---

### Task 8: Wire the views together

**Files:**
- Modify: `src/UI.js` (full rewrite)
- Modify: `src/main.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `BoardView`, `HudView`, `ResultView`, `boardStates`, `injectSprite`, `el`
- Produces:
  - `UI.prototype.mount(root = document.getElementById('app')) -> void` — builds the whole tree and binds events; throws `Error('BattleShip: #app not found')` when the root is missing
  - `UI.prototype.render() -> void` — idempotent; safe to call any number of times
  - `boardStatus(phase, side, { playerWon, shipsAlive }) -> { text, icon, tone }`

- [ ] **Step 1: Write the failing test for `boardStatus` and the mount guard**

Create `tests/unit/ui/boardStatus.test.js`:

```js
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
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/unit/ui/boardStatus.test.js`
Expected: FAIL — `boardStatus is not a function`, and `ui.mount is not a function`

- [ ] **Step 3: Rewrite `src/UI.js`**

Replace the whole file:

```js
import { SHIP_SIZES } from './Board.js';
import { el } from './ui/dom.js';
import { injectSprite } from './ui/icons.js';
import { boardStates } from './ui/cellState.js';
import { BoardView } from './ui/BoardView.js';
import { HudView } from './ui/HudView.js';
import { ResultView } from './ui/ResultView.js';

export function boardStatus(phase, side, { playerWon, shipsAlive }) {
  if (phase === 'placement') {
    return side === 'player'
      ? { text: 'AKTİV', icon: 'radio-tower', tone: 'cyan' }
      : { text: 'KİLİDLİ', icon: 'lock', tone: 'muted' };
  }
  if (phase === 'battle') {
    return side === 'player'
      ? { text: 'MÜDAFİƏ', icon: 'shield', tone: 'muted' }
      : { text: 'HƏDƏF AKTİVDİR', icon: 'crosshair', tone: 'cyan' };
  }
  if (side === 'player') {
    return { text: `QALDI: ${shipsAlive}`, icon: 'shield-check', tone: 'muted' };
  }
  return playerWon
    ? { text: 'MƏHV EDİLDİ', icon: 'skull', tone: 'danger' }
    : { text: `QALDI: ${shipsAlive}`, icon: 'shield', tone: 'muted' };
}

function shipsAlive(board) {
  return board.ships.filter((s) => !s.isSunk()).length;
}

export class UI {
  constructor(game) {
    this.game = game;
    this.message = '';
    this.tone = 'neutral';
    this.hud = new HudView();
    this.result = new ResultView();
    this.boards = {
      player: new BoardView({ side: 'player', title: 'SƏNİN DONANMAN' }),
      ai: new BoardView({ side: 'ai', title: 'RƏQİB SULARI' }),
    };
  }

  mount(root = document.getElementById('app')) {
    if (!root) throw new Error('BattleShip: #app not found');

    injectSprite(document);

    this.gameEl = el('main', {
      className: 'game',
      dataset: { phase: this.game.phase },
    },
      el('div', { className: 'boards' },
        this.boards.player.mount(),
        this.boards.ai.mount()),
      this.hud.mountOperations(),
      this.hud.mountStatusBar(),
      this.hud.mountLegend(),
    );

    root.append(this.hud.mountHeader(), this.gameEl, this.result.mount());

    this._bindStaticEvents();
    this._bindBoardEvents();
  }

  _bindStaticEvents() {
    const restart = () => {
      this.game.restart();
      this.message = '';
      this.tone = 'neutral';
      this.render();
    };

    this.hud.header.querySelector('[data-action="new-game"]')
      .addEventListener('click', restart);
    this.result.root.querySelector('[data-action="restart"]')
      .addEventListener('click', restart);

    this.hud.operations.querySelector('[data-action="rotate"]')
      .addEventListener('click', () => this._rotate());

    this.hud.operations.querySelector('[data-action="auto-place"]')
      .addEventListener('click', () => {
        this.game.autoPlacePlayer();
        this.render();
      });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') this._rotate();
    });
  }

  _rotate() {
    this.game.toggleDirection();
    this._setMessage(
      this.game.placementDirection === 'horizontal'
        ? 'İstiqamət: Üfüqi'
        : 'İstiqamət: Şaquli',
    );
    this.render();
  }

  _bindBoardEvents() {
    const playerBoard = this.boards.player.board;
    const aiBoard = this.boards.ai.board;

    playerBoard.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'placement') return;
      this._handlePlacement(Number(cell.dataset.index));
    });

    playerBoard.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'placement') return;
      this._showPreview(Number(cell.dataset.index));
    });

    playerBoard.addEventListener('mouseleave', () => {
      this.boards.player.clearPreview();
    });

    aiBoard.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'battle') return;
      this._handleAttack(Number(cell.dataset.index));
    });
  }

  render() {
    const { phase, scores } = this.game;
    const playerWon = this.game.aiBoard.allSunk();

    this.gameEl.dataset.phase = phase;

    this.boards.player.update({
      states: boardStates(this.game.playerBoard, false),
      status: boardStatus(phase, 'player', {
        playerWon,
        shipsAlive: shipsAlive(this.game.playerBoard),
      }),
    });

    this.boards.ai.update({
      states: boardStates(this.game.aiBoard, true),
      status: boardStatus(phase, 'ai', {
        playerWon,
        shipsAlive: shipsAlive(this.game.aiBoard),
      }),
    });

    this.boards.player.setInteractive(phase === 'placement');
    this.boards.ai.setInteractive(phase === 'battle');

    this.hud.update({
      phase,
      scores,
      nextShipSize: SHIP_SIZES[this.game.currentShipIndex],
      shipsRemaining: SHIP_SIZES.length - this.game.currentShipIndex,
      direction: this.game.placementDirection,
      message: this.message,
      tone: this.tone,
    });

    this.result.update({ phase, playerWon, scores });
  }

  _setMessage(text, tone = 'neutral') {
    this.message = text;
    this.tone = tone;
  }

  _handlePlacement(index) {
    if (!this.game.placePlayerShip(index)) {
      this._setMessage('Buraya yerləşdirilə bilməz!', 'danger');
      this.render();
      return;
    }

    this.boards.player.clearPreview();

    if (this.game.phase === 'battle') {
      this._setMessage('Bütün gəmilər yerləşdirildi. Döyüş başlayır!');
    } else {
      const size = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._setMessage(`${size} xanalı gəmini yerləşdir (qalan: ${remaining})`);
    }
    this.render();
  }

  _handleAttack(index) {
    const result = this.game.playerAttack(index);
    if (!result || result.player === 'already-attacked') {
      this._setMessage('Bu xanaya artıq hücum edilib!', 'danger');
      this.render();
      return;
    }

    if (result.winner === 'player') {
      this._setMessage('Təbrik edirik! Siz qalibisiniz! 🎉');
    } else if (result.winner === 'ai') {
      this._setMessage('AI qazandı. Yenidən cəhd edin!', 'danger');
    } else {
      const playerMsg = result.player === 'hit' ? 'Vuruldu!' : 'Keçdi.';
      const aiMsg = result.ai === 'hit' ? 'AI vurdu!' : 'AI keçdi.';
      this._setMessage(`${playerMsg} ${aiMsg}`);
    }
    this.render();
  }

  _showPreview(index) {
    const size = SHIP_SIZES[this.game.currentShipIndex];
    if (!size) return;

    const isHorizontal = this.game.placementDirection === 'horizontal';
    const targetRow = Math.floor(index / 10);
    const cells = [];
    let isValid = true;

    for (let i = 0; i < size; i++) {
      const ci = isHorizontal ? index + i : index + i * 10;
      if (ci > 99 || (isHorizontal && Math.floor(ci / 10) !== targetRow)) {
        isValid = false;
        break;
      }
      cells.push(ci);
      if (this.game.playerBoard._isOccupiedOrAdjacent(ci)) isValid = false;
    }

    if (cells.length !== size) isValid = false;

    this.boards.player.setPreview(cells, isValid);
  }
}
```

- [ ] **Step 4: Run the new test to verify it passes**

Run: `npx vitest run tests/unit/ui/boardStatus.test.js`
Expected: PASS — 7 tests

- [ ] **Step 5: Reduce `index.html` to the app shell**

Replace the whole file:

```html
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BattleShip</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Update `src/main.js` to mount before rendering**

Replace the whole file:

```js
import { Game } from './Game.js';
import { UI } from './UI.js';

const game = new Game();
const ui = new UI(game);

ui.mount();
game.start();
ui.render();
```

- [ ] **Step 7: Run the full unit suite**

Run: `npm test`
Expected: PASS — 22 existing plus all new unit tests

- [ ] **Step 8: Run the existing end-to-end suite unchanged**

Run: `npm run test:e2e`
Expected: PASS — all 6 existing tests. Styling is still the old stylesheet, so appearance will be wrong; only behaviour matters at this step.

- [ ] **Step 9: Commit**

```bash
git add src/UI.js src/main.js index.html tests/unit/ui/boardStatus.test.js
git commit -m "feat: render the whole interface from JS view modules"
```

---

### Task 9: Stylesheet

**Files:**
- Modify: `main.css` (full rewrite)

**Interfaces:**
- Consumes: the class names produced by Tasks 3 to 8
- Produces: no JS interface. Visual contract only.

- [ ] **Step 1: Replace `main.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-deep: #07111F;
  --surface: #0D1B2E;
  --surface-raised: #13253B;
  --grid: #47799F;
  --border-subtle: #24435C;
  --cyan: #45D6D0;
  --orange: #F5A84B;
  --danger: #F05A67;
  --text-primary: #EDF7F6;
  --text-muted: #88A5B8;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;

  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 10px;

  --font-display: system-ui, 'Segoe UI Semibold', sans-serif;
  --font-body: system-ui, 'Segoe UI', sans-serif;
  --font-data: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace;

  --cell-size: 36px;
}

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
}

#app { display: flex; flex-direction: column; min-height: 100vh; }

.eyebrow {
  font-family: var(--font-data);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .12em;
  color: var(--cyan);
}

/* ---------- command header ---------- */

.cmd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  padding: 0 var(--space-6);
  height: 72px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-subtle);
}
.cmd__brand { display: flex; align-items: center; gap: var(--space-3); }
.cmd__logo { width: 28px; height: 28px; color: var(--cyan); }
.cmd__wordmark {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: .12em;
}
.cmd__right { display: flex; align-items: center; gap: var(--space-6); }

.phase {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--cyan);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--cyan) 8%, transparent);
}
.phase__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cyan); }
.phase__label {
  font-family: var(--font-data);
  font-size: 11px; font-weight: 600; letter-spacing: .1em;
  color: var(--cyan);
}

.score { display: flex; align-items: center; gap: var(--space-3); font-family: var(--font-data); }
.score__value { font-size: 16px; font-weight: 700; color: var(--orange); }
.score__sep { color: var(--text-muted); }

/* ---------- buttons ---------- */

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 12px; font-weight: 700; letter-spacing: .04em;
  cursor: pointer;
  transition: filter .15s ease;
}
.btn:hover { filter: brightness(1.12); }
.btn:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
.btn__icon { width: 18px; height: 18px; }
.btn--primary { background: var(--orange); color: var(--bg-deep); }
.btn--secondary { background: var(--surface-raised); color: var(--text-primary); border-color: var(--border-subtle); }
.btn--ghost { background: var(--surface-raised); color: var(--text-primary); border-color: var(--border-subtle); }

/* ---------- game shell ---------- */

.game {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6) var(--space-6);
}
.boards { display: flex; gap: var(--space-8); justify-content: center; }

/* ---------- board panel ---------- */

.board-panel {
  display: flex; flex-direction: column; gap: var(--space-3);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.game[data-phase="placement"] .board-panel[data-side="ai"] { opacity: .7; }
.game[data-phase="battle"] .board-panel[data-side="ai"] {
  border-color: var(--cyan);
  box-shadow: 0 0 20px color-mix(in srgb, var(--cyan) 13%, transparent);
}
.board-panel__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
.board-panel__title {
  font-family: var(--font-display);
  font-size: 18px; font-weight: 700; letter-spacing: .08em;
}
.board-status { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-data); font-size: 11px; font-weight: 600; letter-spacing: .1em; }
.board-status__icon { width: 14px; height: 14px; }
.board-status[data-tone="cyan"] { color: var(--cyan); }
.board-status[data-tone="muted"] { color: var(--text-muted); }
.board-status[data-tone="danger"] { color: var(--danger); }

.board-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: var(--space-2);
}
.ruler { font-family: var(--font-data); font-size: 10px; color: var(--text-muted); }
.ruler span { display: grid; place-items: center; }
.ruler--cols { grid-column: 2; grid-row: 1; display: grid; grid-template-columns: repeat(10, var(--cell-size)); }
.ruler--rows { grid-column: 1; grid-row: 2; display: grid; grid-template-rows: repeat(10, var(--cell-size)); }

.board {
  grid-column: 2; grid-row: 2;
  display: grid;
  grid-template-columns: repeat(10, var(--cell-size));
  grid-template-rows: repeat(10, var(--cell-size));
}

/* ---------- cells ---------- */

.cell {
  display: grid; place-items: center;
  background: var(--surface-raised);
  border: 1px solid var(--grid);
  color: var(--text-muted);
  transition: background .15s ease;
}
.cell:focus-visible { outline: 2px solid var(--cyan); outline-offset: -2px; }
.cell__marker { width: 60%; height: 60%; opacity: 0; }

.cell.ship { background: #2B5C73; border-color: var(--cyan); }
.cell.hit { background: color-mix(in srgb, var(--danger) 20%, transparent); border: 2px solid var(--danger); color: var(--danger); }
.cell.miss { background: color-mix(in srgb, var(--cyan) 6%, transparent); color: var(--cyan); }
.cell.sunk { background: color-mix(in srgb, var(--danger) 20%, transparent); color: var(--danger); }
.cell.preview { background: color-mix(in srgb, var(--cyan) 13%, transparent); border-color: var(--cyan); color: var(--cyan); }
.cell.preview--bad { background: color-mix(in srgb, var(--danger) 20%, transparent); border-color: var(--danger); color: var(--danger); }

.cell.ship .cell__marker,
.cell.hit .cell__marker,
.cell.miss .cell__marker,
.cell.sunk .cell__marker,
.cell.preview .cell__marker,
.cell.preview--bad .cell__marker { opacity: 1; }

.game[data-phase="battle"] [data-board="ai"] .cell[role="button"] { cursor: crosshair; }
.game[data-phase="battle"] [data-board="ai"] .cell:not([aria-disabled]):hover {
  background: color-mix(in srgb, var(--cyan) 12%, var(--surface-raised));
}
[data-board="ai"] .cell[aria-disabled="true"] { cursor: not-allowed; }
.game[data-phase="placement"] [data-board="player"] .cell[role="button"] { cursor: pointer; }

/* ---------- operations bar ---------- */

.ops {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-4);
  width: min(960px, 100%);
  min-height: 72px;
  padding: 0 var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.game[data-phase="battle"] .ops,
.game[data-phase="gameover"] .ops { display: none; }

.ops__fleet { display: flex; flex-direction: column; gap: var(--space-1); }
.ops__ship { display: flex; align-items: center; gap: var(--space-3); }
.ops__icon { width: 18px; height: 18px; color: var(--cyan); }
.ops__size { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
.ops__left { font-family: var(--font-data); font-size: 11px; color: var(--orange); }
.ops__actions { display: flex; gap: var(--space-3); }

.chip {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid color-mix(in srgb, var(--cyan) 33%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--cyan) 6%, transparent);
  font-family: var(--font-data); font-size: 11px; font-weight: 600; letter-spacing: .1em;
  color: var(--cyan);
}
.chip__icon { width: 14px; height: 14px; }

/* ---------- status bar ---------- */

.statusbar {
  display: flex; align-items: center; gap: var(--space-4);
  width: min(960px, 100%);
  min-height: 72px;
  padding: 0 var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.statusbar__badge {
  display: grid; place-items: center;
  width: 38px; height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--cyan) 40%, transparent);
  background: color-mix(in srgb, var(--cyan) 8%, transparent);
  color: var(--cyan);
}
.statusbar__icon { width: 18px; height: 18px; }
.statusbar__copy { display: flex; flex-direction: column; gap: var(--space-1); }
.statusbar__msg { font-size: 14px; font-weight: 500; min-height: 1.4em; }
.statusbar[data-tone="danger"] .statusbar__badge {
  border-color: color-mix(in srgb, var(--danger) 40%, transparent);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  color: var(--danger);
}
.statusbar[data-tone="danger"] .statusbar__eyebrow { color: var(--danger); }

/* ---------- legend ---------- */

.legend {
  display: flex; gap: var(--space-6);
  list-style: none;
  width: min(960px, 100%);
  padding: 0 var(--space-4);
}
.game[data-phase="placement"] .legend { display: none; }
.legend__item {
  display: flex; align-items: center; gap: var(--space-2);
  font-family: var(--font-data); font-size: 11px; letter-spacing: .08em;
  color: var(--text-muted);
}
.legend__icon { width: 14px; height: 14px; }
.legend__item[data-tone="cyan"] .legend__icon { color: var(--cyan); }
.legend__item[data-tone="danger"] .legend__icon { color: var(--danger); }

/* ---------- result overlay ---------- */

.result { position: fixed; inset: 0; display: grid; place-items: center; z-index: 10; }
.result[hidden] { display: none; }
.result__scrim { position: absolute; inset: 0; background: color-mix(in srgb, var(--bg-deep) 73%, transparent); }
.result__panel {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-4);
  width: min(520px, calc(100vw - 2 * var(--space-6)));
  padding: var(--space-8);
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--cyan);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 14px #00000066;
}
.result[data-outcome="defeat"] .result__panel { border-color: var(--danger); }
.result__badge {
  display: grid; place-items: center;
  width: 54px; height: 54px;
  border-radius: var(--radius-md);
  border: 1px solid var(--cyan);
  background: color-mix(in srgb, var(--cyan) 8%, transparent);
  color: var(--orange);
}
.result[data-outcome="defeat"] .result__badge { border-color: var(--danger); color: var(--danger); }
.result__icon { width: 26px; height: 26px; }
.result__title { font-family: var(--font-display); font-size: 42px; font-weight: 700; letter-spacing: .05em; }
.result__copy { font-size: 14px; color: var(--text-muted); }
.result__score { font-family: var(--font-data); font-size: 24px; font-weight: 700; color: var(--orange); }

/* ---------- motion ---------- */

@keyframes explode { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes sink { to { opacity: .45; } }

.cell.hit .cell__marker { animation: explode 200ms ease-out; }
.cell.sunk { animation: sink 450ms ease-out forwards; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* ---------- responsive ---------- */

@media (max-width: 1023px) {
  :root { --cell-size: 30px; }
  .cmd { flex-wrap: wrap; height: auto; padding: var(--space-3) var(--space-4); }
}

@media (max-width: 767px) {
  :root { --cell-size: 28px; }
  .boards { flex-direction: column; align-items: center; }
  .board-panel[data-side="ai"] { order: -1; }
  .game { padding: var(--space-3); }
  .ops { flex-direction: column; align-items: stretch; padding: var(--space-3); }
  .ops__actions { flex-direction: column; }
  .btn { width: 100%; }
  .result__title { font-size: 32px; }
}
```

- [ ] **Step 2: Confirm the unit suite is unaffected**

Run: `npm test`
Expected: PASS — unchanged count. CSS is not exercised by jsdom.

- [ ] **Step 3: Confirm the existing end-to-end suite still passes**

Run: `npm run test:e2e`
Expected: PASS — all 6 existing tests

- [ ] **Step 4: Look at the result in a browser**

Run: `npm run serve`
Open `http://localhost:3000` and confirm: two boards side by side with visible grid lines, coordinate rulers, icon markers on placed ships, the operations bar under the boards, and the status bar below it. Then narrow the window under 768px and confirm the boards stack with the AI board on top.

- [ ] **Step 5: Commit**

```bash
git add main.css
git commit -m "style: implement the Tactical Command Center stylesheet"
```

---

### Task 10: End-to-end coverage for the new surface

**Files:**
- Create: `tests/e2e/hud.spec.js`
- Create: `tests/e2e/responsive.spec.js`
- Create: `tests/e2e/a11y.spec.js`
- Modify: `tests/e2e/gameover.spec.js` (append only)

**Interfaces:**
- Consumes: the rendered application from Tasks 8 and 9
- Produces: no code interface

- [ ] **Step 1: Write `tests/e2e/hud.spec.js`**

```js
import { test, expect } from '@playwright/test';

test.describe('HUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders coordinate rulers outside the board', async ({ page }) => {
    const panel = page.locator('.board-panel[data-side="player"]');
    await expect(panel.locator('.ruler--cols')).toHaveText('ABCDEFGHIJ');
    await expect(panel.locator('.ruler--rows')).toHaveText('12345678910');
    await expect(panel.locator('[data-board="player"] .ruler--cols')).toHaveCount(0);
  });

  test('keeps exactly 100 cells per board', async ({ page }) => {
    await expect(page.locator('[data-board="player"] > .cell')).toHaveCount(100);
    await expect(page.locator('[data-board="ai"] > .cell')).toHaveCount(100);
  });

  test('shows placement board statuses', async ({ page }) => {
    await expect(page.locator('.board-panel[data-side="player"] .board-status__text')).toHaveText('AKTİV');
    await expect(page.locator('.board-panel[data-side="ai"] .board-status__text')).toHaveText('KİLİDLİ');
  });

  test('switches board statuses in battle', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.board-panel[data-side="player"] .board-status__text')).toHaveText('MÜDAFİƏ');
    await expect(page.locator('.board-panel[data-side="ai"] .board-status__text')).toHaveText('HƏDƏF AKTİVDİR');
  });

  test('hides the legend during placement and shows it in battle', async ({ page }) => {
    await expect(page.locator('.legend')).toBeHidden();
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.legend')).toBeVisible();
    await expect(page.locator('.legend__label')).toHaveText(['GƏMİ', 'VURULDU', 'YAN KEÇDİ']);
  });

  test('tracks the next ship and remaining fleet', async ({ page }) => {
    await expect(page.locator('.ops__size')).toHaveText('4 XANALI');
    await expect(page.locator('.ops__left')).toHaveText('· 10 GƏMİ QALIB');
    await page.click('[data-board="player"] [data-index="0"]');
    await expect(page.locator('.ops__size')).toHaveText('3 XANALI');
    await expect(page.locator('.ops__left')).toHaveText('· 9 GƏMİ QALIB');
  });

  test('reflects orientation in the chip', async ({ page }) => {
    await expect(page.locator('.chip__text')).toHaveText('ÜFÜQİ · R');
    await page.click('[data-action="rotate"]');
    await expect(page.locator('.chip__text')).toHaveText('ŞAQULİ · R');
  });

  test('marks an occupied cell with a state and an icon', async ({ page }) => {
    await page.click('[data-board="player"] [data-index="0"]');
    const cell = page.locator('[data-board="player"] [data-index="0"]');
    await expect(cell).toHaveClass(/ship/);
    await expect(cell.locator('.cell__marker use')).toHaveAttribute('href', '#i-ship');
  });
});
```

- [ ] **Step 2: Write `tests/e2e/responsive.spec.js`**

```js
import { test, expect } from '@playwright/test';

async function horizontalOverflow(page) {
  return page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

test.describe('Responsive layout', () => {
  for (const [label, width, height] of [['desktop', 1440, 900], ['tablet', 800, 900], ['mobile', 390, 844]]) {
    test(`has no horizontal overflow at ${label} width`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      expect(await horizontalOverflow(page)).toBe(false);
      await page.click('[data-action="auto-place"]');
      expect(await horizontalOverflow(page)).toBe(false);
    });
  }

  test('places boards side by side on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const player = await page.locator('.board-panel[data-side="player"]').boundingBox();
    const ai = await page.locator('.board-panel[data-side="ai"]').boundingBox();
    expect(ai.x).toBeGreaterThan(player.x + player.width - 1);
  });

  test('stacks boards with the AI board on top on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const player = await page.locator('.board-panel[data-side="player"]').boundingBox();
    const ai = await page.locator('.board-panel[data-side="ai"]').boundingBox();
    expect(ai.y).toBeLessThan(player.y);
  });
});
```

- [ ] **Step 3: Write `tests/e2e/a11y.spec.js`**

```js
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('labels boards as groups, never grids', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"]')).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-board="player"]')).toHaveAttribute('aria-label', 'SƏNİN DONANMAN');
    await expect(page.locator('[role="grid"]')).toHaveCount(0);
  });

  test('names each cell by coordinate and state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"] [data-index="0"]'))
      .toHaveAttribute('aria-label', 'A1 · boş');
    await expect(page.locator('[data-board="player"] [data-index="99"]'))
      .toHaveAttribute('aria-label', 'J10 · boş');

    await page.click('[data-board="player"] [data-index="0"]');
    await expect(page.locator('[data-board="player"] [data-index="0"]'))
      .toHaveAttribute('aria-label', 'A1 · gəmi');
  });

  test('exposes a single tab stop per interactive board', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-board="player"] [tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('[data-board="ai"] [tabindex]')).toHaveCount(0);
  });

  test('allows attacking with the keyboard', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');

    await page.locator('[data-board="ai"] [data-index="0"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-board="ai"] [data-index="1"]')).toHaveClass(/hit|miss/);
  });

  test('marks attacked cells as disabled', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-board="ai"] [data-index="0"]');
    await expect(page.locator('[data-board="ai"] [data-index="0"]'))
      .toHaveAttribute('aria-disabled', 'true');
  });

  test('announces the message region politely', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-message]')).toHaveAttribute('aria-live', 'polite');
  });

  test('disables animation under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    const duration = await page.locator('[data-board="player"] [data-index="0"]')
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(duration).toBe('0s');
  });
});
```

- [ ] **Step 4: Append result-panel cases to `tests/e2e/gameover.spec.js`**

Add this block at the end of the file, leaving the existing three tests untouched:

```js
test.describe('Result panel', () => {
  const placements = [
    0.001, 0.1, 0.201, 0.1, 0.251, 0.1, 0.401, 0.1, 0.441, 0.1,
    0.481, 0.1, 0.091, 0.1, 0.291, 0.1, 0.601, 0.1, 0.661, 0.1,
    0.001, 0.1, 0.201, 0.1, 0.251, 0.1, 0.401, 0.1, 0.441, 0.1,
    0.481, 0.1, 0.091, 0.1, 0.291, 0.1, 0.601, 0.1, 0.661, 0.1,
  ];
  const aiMisses = Array.from({ length: 30 }, () => 0.999);
  const winningCells = [0, 1, 2, 3, 20, 21, 22, 25, 26, 27, 40, 41, 44, 45, 48, 49, 9, 29, 60, 66];

  async function playToVictory(page) {
    await page.addInitScript((randomValues) => {
      let index = 0;
      const originalRandom = Math.random;
      Math.random = () => randomValues[index++] ?? originalRandom();
    }, [...placements, ...aiMisses]);

    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    for (const cell of winningCells) {
      await page.click(`[data-board="ai"] [data-index="${cell}"]`);
    }
  }

  test('is hidden until the game ends', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.result')).toBeHidden();
  });

  test('shows victory copy over the still-visible boards', async ({ page }) => {
    await playToVictory(page);

    const result = page.locator('.result');
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute('data-outcome', 'victory');
    await expect(result.locator('.result__title')).toHaveText('QƏLƏBƏ');
    await expect(result.locator('.result__score')).toHaveText('1 — 0');
    await expect(page.locator('[data-board="ai"]')).toBeVisible();
  });

  test('reports the AI fleet as destroyed', async ({ page }) => {
    await playToVictory(page);
    await expect(page.locator('.board-panel[data-side="ai"] .board-status__text'))
      .toHaveText('MƏHV EDİLDİ');
  });

  test('restart keeps the score and returns to placement', async ({ page }) => {
    await playToVictory(page);
    await page.click('[data-action="restart"]');

    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
    await expect(page.locator('[data-score="player"]')).toHaveText('1');
    await expect(page.locator('.result')).toBeHidden();
  });
});
```

- [ ] **Step 5: Run the whole end-to-end suite**

Run: `npm run test:e2e`
Expected: PASS — 6 existing plus the new tests

- [ ] **Step 6: Run the whole unit suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/hud.spec.js tests/e2e/responsive.spec.js tests/e2e/a11y.spec.js tests/e2e/gameover.spec.js
git commit -m "test: cover HUD, responsive layout, accessibility, and result panel"
```

---

## Verification

Run both suites and confirm the browser result before calling the work done:

```bash
npm test
npm run test:e2e
npm run serve   # then check 1440px, 800px, and 390px by hand
```

Confirm every item:

- No cell state is conveyed by colour alone; each carries an icon and an accessible name.
- `.board` has exactly 100 direct `.cell` children on both boards.
- No horizontal scrollbar at 1440px, 800px, or 390px.
- `git diff --stat master -- src/Game.js src/Board.js src/Ship.js src/AI.js` prints nothing.
- The six original end-to-end tests are unmodified: `git diff master -- tests/e2e/placement.spec.js tests/e2e/battle.spec.js` prints nothing, and `tests/e2e/gameover.spec.js` shows additions only.
