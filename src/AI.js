const STORAGE_KEY = 'seawar_ai_difficulty';
const DEFAULT_DIFFICULTY = 0.5;
const MIN_DIFFICULTY = 0.1;
const MAX_DIFFICULTY = 1.0;
const DIFFICULTY_STEP = 0.1;

function clampDifficulty(value) {
  if (!Number.isFinite(value)) return DEFAULT_DIFFICULTY;
  const bounded = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value));
  return parseFloat(bounded.toFixed(1));
}

// A corrupted or hand-edited entry used to leave difficulty as NaN, which made
// every threshold comparison false: the AI stayed on its easiest behaviour for
// good, and adjustDifficulty could never recover it.
function readStoredDifficulty() {
  const raw = parseFloat(localStorage.getItem(STORAGE_KEY) ?? '');
  return Number.isFinite(raw) ? clampDifficulty(raw) : DEFAULT_DIFFICULTY;
}

export class AI {
  constructor() {
    this.difficulty = readStoredDifficulty();
    this.huntQueue = [];
    this.lastHit = null;
    this.direction = null;
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
    if (result !== 'hit') {
      this.lastHit = null;
      this.direction = null;
      return;
    }
    if (this.difficulty < 0.4) {
      this.lastHit = index;
      this.direction = null;
      return;
    }

    const ship = board.ships.find(s => s.occupies(index));
    if (ship && ship.isSunk()) {
      this._forgetSunkShip(ship);
      return;
    }

    if (this.difficulty > 0.7 && this.lastHit !== null) {
      const row = Math.floor(index / 10);
      const col = index % 10;
      const lastRow = Math.floor(this.lastHit / 10);
      const lastCol = this.lastHit % 10;
      if (row === lastRow) {
        this.direction = 'horizontal';
      } else if (col === lastCol) {
        this.direction = 'vertical';
      }
    }

    const row = Math.floor(index / 10);
    const col = index % 10;
    const candidates = [];

    if (this.difficulty > 0.7 && this.direction === 'horizontal') {
      if (col > 0) candidates.push(index - 1);
      if (col < 9) candidates.push(index + 1);
    } else if (this.difficulty > 0.7 && this.direction === 'vertical') {
      if (row > 0) candidates.push(index - 10);
      if (row < 9) candidates.push(index + 10);
    } else {
      if (row > 0) candidates.push(index - 10);
      if (row < 9) candidates.push(index + 10);
      if (col > 0) candidates.push(index - 1);
      if (col < 9) candidates.push(index + 1);
    }

    for (const adj of candidates) {
      if (!board.attacked.has(adj) && !this.huntQueue.includes(adj)) {
        this.huntQueue.push(adj);
      }
    }

    this.lastHit = index;
  }

  // Placement forbids ships from touching, so every cell around a sunk ship is
  // water. Leaving those queued cost roughly 18 guaranteed misses per game.
  _forgetSunkShip(ship) {
    const water = new Set();

    for (const cell of ship.getCells()) {
      const row = Math.floor(cell / 10);
      const col = cell % 10;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r > 9 || c < 0 || c > 9) continue;
          water.add(r * 10 + c);
        }
      }
    }

    this.huntQueue = this.huntQueue.filter(i => !water.has(i));
    this.lastHit = null;
    this.direction = null;
  }

  clearQueue() {
    this.huntQueue = [];
    this.lastHit = null;
    this.direction = null;
  }

  adjustDifficulty(playerWon) {
    const step = playerWon ? DIFFICULTY_STEP : -DIFFICULTY_STEP;
    this.difficulty = clampDifficulty(this.difficulty + step);
    localStorage.setItem(STORAGE_KEY, String(this.difficulty));
    this.clearQueue();
  }
}
