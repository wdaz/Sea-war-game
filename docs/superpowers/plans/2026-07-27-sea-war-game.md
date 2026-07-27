# Sea War Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vanilla JS OOP battleship game with TDD, adaptive AI, polished responsive UI, Vitest unit tests, Playwright e2e tests.

**Architecture:** 5 ES Module classes (Ship, Board, AI, Game, UI) + `main.js` entry point. Logic classes (Ship, Board, AI, Game) are DOM-free and fully unit-tested with Vitest TDD. UI handles rendering and events. Playwright covers full game flows.

**Tech Stack:** Vanilla JS (ES Modules), Vitest 1.x, @playwright/test 1.x, CSS3, HTML5

## Global Constraints

- No external JS libraries or frameworks
- ES Modules only (`import`/`export`), no CommonJS
- No bundler — Vitest and Playwright bring their own runners; app served with `serve`
- `"type": "module"` in `package.json`
- All identifiers in English
- Grid: 10×10, indices 0–99. `row = Math.floor(index / 10)`, `col = index % 10`
- Ship sizes in placement order: `[4, 3, 3, 2, 2, 2, 1, 1, 1, 1]` — 10 ships total
- AI difficulty stored in `localStorage` key `'seawar_ai_difficulty'`, range `0.1`–`1.0`
- TDD for Tasks 2–5: write ALL tests first (Red), then implement (Green), then commit

---

### Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `src/` (empty)
- Create: `tests/unit/` (empty)
- Create: `tests/e2e/` (empty)

**Interfaces:**
- Produces: `npm test` runs Vitest, `npm run test:e2e` runs Playwright, `npm run serve` serves app at port 3000

- [ ] **Step 1: Replace package.json**

```json
{
  "name": "sea-war",
  "version": "2.0.0",
  "description": "Battleship game — OOP, TDD, adaptive AI",
  "type": "module",
  "scripts": {
    "test":       "vitest run",
    "test:watch": "vitest",
    "test:e2e":   "playwright test",
    "serve":      "npx serve . -p 3000"
  },
  "devDependencies": {
    "vitest":           "^1.6.0",
    "@playwright/test": "^1.44.0",
    "serve":            "^14.2.3"
  }
}
```

- [ ] **Step 2: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 3: Create playwright.config.js**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run serve',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 4: Create directories and install**

```bash
mkdir -p src tests/unit tests/e2e
npm install
```

- [ ] **Step 5: Verify Vitest works**

Run: `npm test`
Expected: "No test files found" (exits 0)

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.js playwright.config.js
git commit -m "chore: add Vitest and Playwright setup"
```

---

### Task 2: Ship — TDD

**Files:**
- Create: `tests/unit/Ship.test.js`
- Create: `src/Ship.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  ```js
  export class Ship {
    constructor(size)              // size: number
    place(startIndex, direction)   // direction: 'horizontal' | 'vertical'
    getCells()                     // → number[]
    occupies(index)                // → boolean
    hit(index)                     // → void
    isSunk()                       // → boolean
  }
  ```

- [ ] **Step 1: Write all failing tests**

Create `tests/unit/Ship.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/unit/Ship.test.js
```

Expected: FAIL — "Cannot find module '../../src/Ship.js'"

- [ ] **Step 3: Implement src/Ship.js**

```js
export class Ship {
  constructor(size) {
    this.size = size;
    this.startIndex = null;
    this.direction = null;
    this.hits = new Set();
  }

  place(startIndex, direction) {
    this.startIndex = startIndex;
    this.direction = direction;
  }

  getCells() {
    const cells = [];
    for (let i = 0; i < this.size; i++) {
      cells.push(
        this.direction === 'horizontal'
          ? this.startIndex + i
          : this.startIndex + i * 10
      );
    }
    return cells;
  }

  occupies(index) {
    return this.getCells().includes(index);
  }

  hit(index) {
    this.hits.add(index);
  }

  isSunk() {
    return this.getCells().every(cell => this.hits.has(cell));
  }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/unit/Ship.test.js
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/Ship.js tests/unit/Ship.test.js
git commit -m "feat: add Ship class (TDD)"
```

---

### Task 3: Board — TDD

**Files:**
- Create: `tests/unit/Board.test.js`
- Create: `src/Board.js`

**Interfaces:**
- Consumes: `Ship` from `src/Ship.js`
- Produces:
  ```js
  export const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

  export class Board {
    constructor()
    ships: Ship[]
    attacked: Set<number>
    placeShip(ship, index, direction)  // → boolean
    receiveAttack(index)               // → 'hit' | 'miss' | 'already-attacked'
    allSunk()                          // → boolean
    autoPlace()                        // → void
  }
  ```

- [ ] **Step 1: Write all failing tests**

Create `tests/unit/Board.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/unit/Board.test.js
```

Expected: FAIL — "Cannot find module '../../src/Board.js'"

- [ ] **Step 3: Implement src/Board.js**

```js
import { Ship } from './Ship.js';

export const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

export class Board {
  constructor() {
    this.ships = [];
    this.attacked = new Set();
  }

  placeShip(ship, index, direction) {
    ship.place(index, direction);
    const cells = ship.getCells();

    // Bounds check
    if (direction === 'horizontal') {
      if (index % 10 + ship.size > 10) return false;
    } else {
      if (Math.floor(index / 10) + ship.size > 10) return false;
    }

    // Overlap and adjacency check (1-cell gap required on all sides)
    for (const cell of cells) {
      if (this._isOccupiedOrAdjacent(cell)) return false;
    }

    this.ships.push(ship);
    return true;
  }

  _isOccupiedOrAdjacent(index) {
    const row = Math.floor(index / 10);
    const col = index % 10;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r > 9 || c < 0 || c > 9) continue;
        if (this.ships.some(s => s.occupies(r * 10 + c))) return true;
      }
    }
    return false;
  }

  receiveAttack(index) {
    if (this.attacked.has(index)) return 'already-attacked';
    this.attacked.add(index);
    const ship = this.ships.find(s => s.occupies(index));
    if (ship) {
      ship.hit(index);
      return 'hit';
    }
    return 'miss';
  }

  allSunk() {
    return this.ships.length > 0 && this.ships.every(s => s.isSunk());
  }

  autoPlace() {
    this.ships = [];
    for (const size of SHIP_SIZES) {
      let placed = false;
      while (!placed) {
        const index = Math.floor(Math.random() * 100);
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        placed = this.placeShip(new Ship(size), index, direction);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/unit/Board.test.js
```

Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/Board.js tests/unit/Board.test.js
git commit -m "feat: add Board class (TDD)"
```

---

### Task 4: AI — TDD

**Files:**
- Create: `tests/unit/AI.test.js`
- Create: `src/AI.js`

**Interfaces:**
- Consumes: `Board` from `src/Board.js`
- Produces:
  ```js
  export class AI {
    constructor()
    difficulty: number           // 0.1–1.0, loaded from localStorage
    huntQueue: number[]
    chooseAttack(board)          // → number (valid unattacked index)
    registerResult(index, result, board)  // result: 'hit' | 'miss'
    adjustDifficulty(playerWon)  // playerWon: boolean → updates difficulty + localStorage
  }
  ```

- [ ] **Step 1: Write all failing tests**

Create `tests/unit/AI.test.js`:

```js
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

  test('chooseAttack uses huntQueue when difficulty >= 0.4', () => {
    ai.difficulty = 0.5;
    ai.huntQueue = [42];
    expect(ai.chooseAttack(board)).toBe(42);
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/unit/AI.test.js
```

Expected: FAIL — "Cannot find module '../../src/AI.js'"

- [ ] **Step 3: Implement src/AI.js**

```js
export class AI {
  constructor() {
    this.difficulty = parseFloat(
      localStorage.getItem('seawar_ai_difficulty') ?? '0.5'
    );
    this.huntQueue = [];
  }

  chooseAttack(board) {
    const available = [];
    for (let i = 0; i < 100; i++) {
      if (!board.attacked.has(i)) available.push(i);
    }

    if (this.difficulty >= 0.4 && this.huntQueue.length > 0) {
      const target = this.huntQueue.find(i => !board.attacked.has(i));
      if (target !== undefined) {
        this.huntQueue = this.huntQueue.filter(i => i !== target);
        return target;
      }
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  registerResult(index, result, board) {
    if (result !== 'hit' || this.difficulty < 0.4) return;

    const row = Math.floor(index / 10);
    const col = index % 10;
    const candidates = [];
    if (row > 0) candidates.push(index - 10);
    if (row < 9) candidates.push(index + 10);
    if (col > 0) candidates.push(index - 1);
    if (col < 9) candidates.push(index + 1);

    for (const adj of candidates) {
      if (!board.attacked.has(adj) && !this.huntQueue.includes(adj)) {
        this.huntQueue.push(adj);
      }
    }
  }

  adjustDifficulty(playerWon) {
    if (playerWon) {
      this.difficulty = Math.min(1.0, parseFloat((this.difficulty + 0.1).toFixed(1)));
    } else {
      this.difficulty = Math.max(0.1, parseFloat((this.difficulty - 0.1).toFixed(1)));
    }
    localStorage.setItem('seawar_ai_difficulty', String(this.difficulty));
    this.huntQueue = [];
  }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/unit/AI.test.js
```

Expected: PASS — 11 tests

- [ ] **Step 5: Commit**

```bash
git add src/AI.js tests/unit/AI.test.js
git commit -m "feat: add AI class with adaptive difficulty (TDD)"
```

---

### Task 5: Game — TDD

**Files:**
- Create: `tests/unit/Game.test.js`
- Create: `src/Game.js`

**Interfaces:**
- Consumes: `Board`, `SHIP_SIZES` from `src/Board.js`; `Ship` from `src/Ship.js`; `AI` from `src/AI.js`
- Produces:
  ```js
  export class Game {
    constructor()
    playerBoard: Board
    aiBoard: Board
    ai: AI
    phase: 'placement' | 'battle' | 'gameover'
    placementDirection: 'horizontal' | 'vertical'
    currentShipIndex: number          // 0–10
    scores: { player: number, ai: number }

    start()                           // → void
    placePlayerShip(index)            // → boolean
    autoPlacePlayer()                 // → void
    toggleDirection()                 // → void
    playerAttack(index)               // → { player: string, ai: string|null, winner: 'player'|'ai'|null } | null
    restart()                         // → void (preserves scores)
  }
  ```

- [ ] **Step 1: Write all failing tests**

Create `tests/unit/Game.test.js`:

```js
import { describe, test, expect, beforeEach } from 'vitest';
import { Game } from '../../src/Game.js';

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
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm test -- tests/unit/Game.test.js
```

Expected: FAIL — "Cannot find module '../../src/Game.js'"

- [ ] **Step 3: Implement src/Game.js**

```js
import { Board, SHIP_SIZES } from './Board.js';
import { Ship } from './Ship.js';
import { AI } from './AI.js';

export class Game {
  constructor() {
    this.playerBoard = new Board();
    this.aiBoard = new Board();
    this.ai = new AI();
    this.phase = 'placement';
    this.placementDirection = 'horizontal';
    this.currentShipIndex = 0;
    this.scores = { player: 0, ai: 0 };
  }

  start() {
    this.aiBoard.autoPlace();
    this.phase = 'placement';
    this.currentShipIndex = 0;
  }

  placePlayerShip(index) {
    if (this.currentShipIndex >= SHIP_SIZES.length) return false;
    const ship = new Ship(SHIP_SIZES[this.currentShipIndex]);
    const success = this.playerBoard.placeShip(ship, index, this.placementDirection);
    if (success) {
      this.currentShipIndex++;
      if (this.currentShipIndex >= SHIP_SIZES.length) {
        this.phase = 'battle';
      }
    }
    return success;
  }

  autoPlacePlayer() {
    this.playerBoard = new Board();
    this.playerBoard.autoPlace();
    this.currentShipIndex = SHIP_SIZES.length;
    this.phase = 'battle';
  }

  toggleDirection() {
    this.placementDirection =
      this.placementDirection === 'horizontal' ? 'vertical' : 'horizontal';
  }

  playerAttack(index) {
    if (this.phase !== 'battle') return null;

    const playerResult = this.aiBoard.receiveAttack(index);
    if (playerResult === 'already-attacked') {
      return { player: playerResult, ai: null, winner: null };
    }

    if (this.aiBoard.allSunk()) {
      this.scores.player++;
      this.phase = 'gameover';
      this.ai.adjustDifficulty(true);
      return { player: playerResult, ai: null, winner: 'player' };
    }

    const aiIndex = this.ai.chooseAttack(this.playerBoard);
    const aiResult = this.playerBoard.receiveAttack(aiIndex);
    this.ai.registerResult(aiIndex, aiResult, this.playerBoard);

    if (this.playerBoard.allSunk()) {
      this.scores.ai++;
      this.phase = 'gameover';
      this.ai.adjustDifficulty(false);
      return { player: playerResult, ai: aiResult, winner: 'ai' };
    }

    return { player: playerResult, ai: aiResult, winner: null };
  }

  restart() {
    const scores = this.scores;
    this.playerBoard = new Board();
    this.aiBoard = new Board();
    this.ai.huntQueue = [];
    this.phase = 'placement';
    this.currentShipIndex = 0;
    this.placementDirection = 'horizontal';
    this.scores = scores;
    this.aiBoard.autoPlace();
  }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm test -- tests/unit/Game.test.js
```

Expected: PASS — 14 tests

- [ ] **Step 5: Run ALL unit tests**

```bash
npm test
```

Expected: PASS — all 44 tests (Ship + Board + AI + Game)

- [ ] **Step 6: Commit**

```bash
git add src/Game.js tests/unit/Game.test.js
git commit -m "feat: add Game class (TDD)"
```

---

### Task 6: HTML & CSS

**Files:**
- Modify: `index.html`
- Modify: `main.css`

**Interfaces:**
- Produces: static HTML skeleton with `data-*` attributes used by `UI.js` and Playwright
- Note: browser will show blank page until Task 7 adds `src/main.js`

- [ ] **Step 1: Rewrite index.html**

```html
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sea War</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <header class="header">
    <h1 class="title">SEA WAR</h1>
    <div class="scoreboard">
      <span>Oyunçu: <strong data-score="player">0</strong></span>
      <span>AI: <strong data-score="ai">0</strong></span>
    </div>
    <button class="btn btn--secondary" data-action="new-game">Yeni Oyun</button>
  </header>

  <main class="game" data-phase="placement">
    <section class="board-wrapper">
      <h2 class="board-label">SƏNİN LÖVHƏN</h2>
      <div class="board" data-board="player"></div>
    </section>
    <section class="board-wrapper">
      <h2 class="board-label">AI-NİN LÖVHƏSI</h2>
      <div class="board" data-board="ai"></div>
    </section>
  </main>

  <footer class="controls">
    <div class="placement-controls" data-controls="placement">
      <button class="btn btn--primary"   data-action="rotate">Fırlat (R)</button>
      <button class="btn btn--secondary" data-action="auto-place">Avtomatik Yerləşdir</button>
    </div>
    <p class="message" data-message></p>
  </footer>

  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Rewrite main.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --clr-bg:     #0a1628;
  --clr-sea:    #1a2744;
  --clr-ship:   #4a6fa5;
  --clr-hit:    #e63946;
  --clr-miss:   #457b9d;
  --clr-accent: #f4a261;
  --clr-text:   #f1faee;
  --clr-border: #2a3f6f;
  --cell-size:  clamp(32px, 5vw, 50px);
}

body {
  background: var(--clr-bg);
  color: var(--clr-text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;
  flex-wrap: wrap;
  justify-content: center;
}
.title { font-size: 2rem; letter-spacing: .2em; color: var(--clr-accent); }
.scoreboard { display: flex; gap: 1.5rem; font-size: 1.1rem; }

/* Buttons */
.btn {
  padding: .5rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: .95rem;
  font-weight: 600;
  transition: opacity .15s;
}
.btn:hover { opacity: .85; }
.btn--primary   { background: var(--clr-accent); color: var(--clr-bg); }
.btn--secondary { background: var(--clr-ship);   color: var(--clr-text); }

/* Game layout */
.game {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
  justify-content: center;
}
.board-wrapper { display: flex; flex-direction: column; align-items: center; gap: .75rem; }
.board-label { font-size: .85rem; letter-spacing: .15em; text-transform: uppercase; color: var(--clr-accent); }

/* Board grid */
.board {
  display: grid;
  grid-template-columns: repeat(10, var(--cell-size));
  grid-template-rows:    repeat(10, var(--cell-size));
  border: 2px solid var(--clr-border);
  background: var(--clr-sea);
}

/* Cells */
.cell {
  border: 1px solid var(--clr-border);
  background: var(--clr-sea);
  cursor: default;
  position: relative;
  transition: background .1s;
}
[data-board="ai"] .cell { cursor: crosshair; }
[data-board="ai"] .cell:hover { background: color-mix(in srgb, var(--clr-miss) 30%, var(--clr-sea)); }
[data-board="ai"] .cell.hit,
[data-board="ai"] .cell.miss { cursor: not-allowed; }

.cell.ship          { background: var(--clr-ship); }
.cell.hit           { background: var(--clr-hit); }
.cell.miss          { background: var(--clr-miss); }
.cell.preview       { background: color-mix(in srgb, var(--clr-ship) 50%, var(--clr-sea)); }
.cell.preview--bad  { background: color-mix(in srgb, var(--clr-hit)  50%, var(--clr-sea)); }

/* Animations */
@keyframes explode {
  0%   { transform: scale(1);   }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1);   }
}
@keyframes ripple {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes sink {
  to { opacity: .3; transform: scale(.9); }
}

.cell.hit  { animation: explode .3s ease-out; }
.cell.sunk { animation: sink .5s ease-out forwards; }
.cell.miss::after {
  content: '';
  position: absolute; inset: 20%;
  border-radius: 50%;
  background: rgba(255,255,255,.3);
  animation: ripple .4s ease-out forwards;
}

/* Phase-based visibility */
[data-controls="placement"] { display: flex; gap: 1rem; }
.game[data-phase="battle"]   [data-controls="placement"],
.game[data-phase="gameover"] [data-controls="placement"] { display: none; }

/* Active board highlight in battle */
.game[data-phase="battle"] [data-board="ai"] {
  box-shadow: 0 0 0 2px var(--clr-accent);
}

/* Controls */
.controls { display: flex; flex-direction: column; align-items: center; gap: .75rem; }
.message  { font-size: 1.1rem; min-height: 1.5em; color: var(--clr-accent); text-align: center; }

/* Responsive */
@media (max-width: 768px) {
  .game { flex-direction: column; gap: 2rem; }
  .header { gap: 1rem; }
}
```

- [ ] **Step 3: Run unit tests — verify no regression**

```bash
npm test
```

Expected: PASS — all tests still pass

- [ ] **Step 4: Commit**

```bash
git add index.html main.css
git commit -m "feat: rewrite HTML structure and polished CSS"
```

---

### Task 7: UI.js & main.js

**Files:**
- Create: `src/main.js`
- Create: `src/UI.js`

**Interfaces:**
- Consumes:
  - `Game` from `src/Game.js`
  - `SHIP_SIZES` from `src/Board.js`
- Produces: fully playable game at `http://localhost:3000`

- [ ] **Step 1: Create src/main.js**

```js
import { Game } from './Game.js';
import { UI } from './UI.js';

const game = new Game();
const ui = new UI(game);
game.start();
ui.render();
```

- [ ] **Step 2: Create src/UI.js**

```js
import { SHIP_SIZES } from './Board.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.gameEl      = document.querySelector('[data-phase]');
    this.playerBoard = document.querySelector('[data-board="player"]');
    this.aiBoard     = document.querySelector('[data-board="ai"]');
    this.message     = document.querySelector('[data-message]');
    this.scoreEls    = {
      player: document.querySelector('[data-score="player"]'),
      ai:     document.querySelector('[data-score="ai"]'),
    };
    this._bindStaticEvents();
  }

  _bindStaticEvents() {
    document.querySelector('[data-action="rotate"]').addEventListener('click', () => {
      this.game.toggleDirection();
      this._showMessage(
        this.game.placementDirection === 'horizontal' ? 'İstiqamət: Üfüqi' : 'İstiqamət: Şaquli'
      );
    });

    document.querySelector('[data-action="auto-place"]').addEventListener('click', () => {
      this.game.autoPlacePlayer();
      this.render();
    });

    document.querySelector('[data-action="new-game"]').addEventListener('click', () => {
      this.game.restart();
      this.render();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.game.toggleDirection();
      }
    });
  }

  render() {
    this._renderBoard(this.playerBoard, this.game.playerBoard, false);
    this._renderBoard(this.aiBoard,     this.game.aiBoard,     true);
    this.gameEl.dataset.phase        = this.game.phase;
    this.scoreEls.player.textContent = this.game.scores.player;
    this.scoreEls.ai.textContent     = this.game.scores.ai;
    this._updateMessage();
  }

  _renderBoard(boardEl, boardData, isAI) {
    boardEl.innerHTML = '';
    for (let i = 0; i < 100; i++) {
      const cell      = document.createElement('div');
      cell.className  = 'cell';
      cell.dataset.index = i;

      const attacked = boardData.attacked.has(i);
      const ship     = boardData.ships.find(s => s.occupies(i));

      if (attacked && ship) {
        cell.classList.add('hit');
        if (ship.isSunk()) cell.classList.add('sunk');
      } else if (attacked) {
        cell.classList.add('miss');
      } else if (!isAI && ship) {
        cell.classList.add('ship');
      }

      if (!isAI && this.game.phase === 'placement') {
        cell.addEventListener('click',      () => this._handlePlacement(i));
        cell.addEventListener('mouseenter', () => this._showPreview(i));
        cell.addEventListener('mouseleave', () => this._clearPreview());
      }

      if (isAI && this.game.phase === 'battle') {
        cell.addEventListener('click', () => this._handleAttack(i));
      }

      boardEl.appendChild(cell);
    }
  }

  _handlePlacement(index) {
    const success = this.game.placePlayerShip(index);
    if (!success) {
      this._showMessage('Buraya yerləşdirilə bilməz!');
      return;
    }
    this._clearPreview();
    this.render();
    if (this.game.phase === 'battle') {
      this._showMessage('Bütün gəmilər yerləşdirildi. Döyüş başlayır!');
    } else {
      const size      = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._showMessage(`${size} xanalı gəmini yerləşdir (qalan: ${remaining})`);
    }
  }

  _handleAttack(index) {
    const result = this.game.playerAttack(index);
    if (!result || result.player === 'already-attacked') {
      this._showMessage('Bu xanaya artıq hücum edilib!');
      return;
    }
    this.render();
    this._showResult(result);
  }

  _showResult(result) {
    if (result.winner === 'player') {
      this._showMessage('Təbrik edirik! Siz qalibisiniz! 🎉');
      return;
    }
    if (result.winner === 'ai') {
      this._showMessage('AI qazandı. Yenidən cəhd edin!');
      return;
    }
    const playerMsg = result.player === 'hit' ? 'Vuruldu!' : 'Keçdi.';
    const aiMsg     = result.ai    === 'hit' ? 'AI vurdu!'  : 'AI keçdi.';
    this._showMessage(`${playerMsg} ${aiMsg}`);
  }

  _showPreview(index) {
    if (this.game.phase !== 'placement') return;
    this._clearPreview();
    const size = SHIP_SIZES[this.game.currentShipIndex];
    if (!size) return;

    const col          = index % 10;
    const row          = Math.floor(index / 10);
    const isHorizontal = this.game.placementDirection === 'horizontal';
    const outOfBounds  = isHorizontal ? col + size > 10 : row + size > 10;

    for (let i = 0; i < size; i++) {
      const ci  = isHorizontal ? index + i : index + i * 10;
      const el  = this.playerBoard.querySelector(`[data-index="${ci}"]`);
      if (el) el.classList.add(outOfBounds ? 'preview--bad' : 'preview');
    }
  }

  _clearPreview() {
    this.playerBoard.querySelectorAll('.preview, .preview--bad').forEach(el => {
      el.classList.remove('preview', 'preview--bad');
    });
  }

  _updateMessage() {
    if (this.game.phase === 'placement') {
      const size      = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._showMessage(size ? `${size} xanalı gəmini yerləşdir (qalan: ${remaining})` : '');
    }
  }

  _showMessage(text) {
    this.message.textContent = text;
  }
}
```

- [ ] **Step 3: Open in browser and manually verify**

```bash
npm run serve
```

Open `http://localhost:3000`. Check:
- 10×10 grids render with sea-blue color
- Hover over player board shows ship preview (green = valid, red = invalid)
- "Avtomatik Yerləşdir" places ships, switches to battle phase
- Clicking AI board shows hit (red + explode animation) or miss (blue + ripple)
- Win/lose message appears
- "Yeni Oyun" resets without losing score

- [ ] **Step 4: Run all unit tests**

```bash
npm test
```

Expected: PASS — all 44 tests

- [ ] **Step 5: Commit**

```bash
git add src/UI.js src/main.js
git commit -m "feat: add UI and main entry point — game fully playable"
```

---

### Task 8: E2E Tests (Playwright)

**Files:**
- Create: `tests/e2e/placement.spec.js`
- Create: `tests/e2e/battle.spec.js`
- Create: `tests/e2e/gameover.spec.js`

**Interfaces:**
- Consumes: running game at `http://localhost:3000` (started by `playwright.config.js` webServer)

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create tests/e2e/placement.spec.js**

```js
import { test, expect } from '@playwright/test';

test.describe('Placement phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows placement controls on load', async ({ page }) => {
    await expect(page.locator('[data-controls="placement"]')).toBeVisible();
  });

  test('auto-place moves to battle phase', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'battle');
  });

  test('rotate button updates message to Şaquli', async ({ page }) => {
    await page.click('[data-action="rotate"]');
    await expect(page.locator('[data-message]')).toContainText('Şaquli');
  });

  test('R key rotates direction', async ({ page }) => {
    await page.keyboard.press('r');
    await expect(page.locator('[data-message]')).toContainText('Şaquli');
  });

  test('clicking valid cell places ship and shows it', async ({ page }) => {
    await page.click('[data-board="player"] [data-index="0"]');
    await expect(
      page.locator('[data-board="player"] [data-index="0"]')
    ).toHaveClass(/ship/);
  });

  test('placement controls hidden in battle phase', async ({ page }) => {
    await page.click('[data-action="auto-place"]');
    await expect(page.locator('[data-controls="placement"]')).toBeHidden();
  });
});
```

- [ ] **Step 3: Create tests/e2e/battle.spec.js**

```js
import { test, expect } from '@playwright/test';

test.describe('Battle phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
  });

  test('clicking AI board cell marks it as hit or miss', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    await expect(
      page.locator('[data-board="ai"] [data-index="0"]')
    ).toHaveClass(/hit|miss/);
  });

  test('clicking same AI cell twice shows already-attacked message', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    await page.click('[data-board="ai"] [data-index="0"]');
    await expect(page.locator('[data-message]')).toContainText('artıq hücum edilib');
  });

  test('new-game button resets to placement phase', async ({ page }) => {
    await page.click('[data-action="new-game"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
  });

  test('player board also receives AI attack after player attacks', async ({ page }) => {
    await page.click('[data-board="ai"] [data-index="0"]');
    const attacked = await page.locator('[data-board="player"] .hit, [data-board="player"] .miss').count();
    expect(attacked).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 4: Create tests/e2e/gameover.spec.js**

```js
import { test, expect } from '@playwright/test';

test.describe('Scores and persistence', () => {
  test('scores start at 0', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-score="player"]')).toHaveText('0');
    await expect(page.locator('[data-score="ai"]')).toHaveText('0');
  });

  test('scores are visible after new game', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-action="new-game"]');
    await expect(page.locator('[data-score="player"]')).toBeVisible();
    await expect(page.locator('[data-score="ai"]')).toBeVisible();
  });

  test('game returns to placement phase after new game', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="auto-place"]');
    await page.click('[data-action="new-game"]');
    await expect(page.locator('.game')).toHaveAttribute('data-phase', 'placement');
  });
});
```

- [ ] **Step 5: Run e2e tests**

```bash
npm run test:e2e
```

Expected: All tests pass.
If timing issues occur, add `await page.waitForTimeout(100)` after click actions.

- [ ] **Step 6: Run full test suite**

```bash
npm test && npm run test:e2e
```

Expected: All 44 unit tests + all e2e tests pass.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/
git commit -m "test: add Playwright e2e tests"
```

---

### Task 9: Archive Legacy Files

**Files:**
- Move: `helper.js`, `index.js`, `Variables.js` → `legacy/`

- [ ] **Step 1: Move old files to legacy/**

```bash
mkdir -p legacy
git mv helper.js Variables.js index.js legacy/
```

- [ ] **Step 2: Run full test suite to confirm nothing broke**

```bash
npm test && npm run test:e2e
```

Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: archive legacy JS files"
```

---

## Done

At this point:
- `npm test` → 44 unit tests passing (Ship, Board, AI, Game)
- `npm run test:e2e` → all Playwright tests passing
- `npm run serve` → fully playable game at `http://localhost:3000`
