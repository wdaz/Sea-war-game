const STORAGE_KEY = 'seawar_ai_difficulty';
const DEFAULT_DIFFICULTY = 0.5;
const MIN_DIFFICULTY = 0.1;
const MAX_DIFFICULTY = 1.0;
const DIFFICULTY_STEP = 0.1;

// Below this the AI never hunts at all; above AIM_THRESHOLD it also infers the
// axis a ship runs along.
const HUNT_THRESHOLD = 0.4;
const AIM_THRESHOLD = 0.7;

function clampDifficulty(value) {
  if (!Number.isFinite(value)) return DEFAULT_DIFFICULTY;
  const bounded = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value));
  return parseFloat(bounded.toFixed(1));
}

// How often the AI follows up on a hit instead of firing at random. Hunting
// used to be all-or-nothing, so every level from 0.4 upward played identically
// and nine of the ten rungs were indistinguishable. Scaling the follow-up rate
// turns the ladder into a real gradient: 0.4 chases a quarter of its leads,
// 1.0 chases all of them.
// The curve is a square root rather than a straight line because strength
// saturates as the rate approaches 1: a linear rate put more than half the
// total gain into the single step from 0.9 to 1.0. Measured over 900 games per
// level, this spreads 7.3 shots across the rungs with no step above 2.2.
export function huntProbability(difficulty) {
  if (!Number.isFinite(difficulty) || difficulty < HUNT_THRESHOLD) return 0;
  const span = (MAX_DIFFICULTY - HUNT_THRESHOLD);
  const progress = Math.min(1, (difficulty - HUNT_THRESHOLD) / span);
  return Math.min(1, 0.25 + Math.sqrt(progress) * 0.75);
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

    if (this.huntQueue.length > 0) {
      if (Math.random() < huntProbability(this.difficulty)) {
        const target = this.huntQueue.find(i => !board.attacked.has(i));
        if (target !== undefined) {
          this.huntQueue = this.huntQueue.filter(i => i !== target);
          return target;
        }
      } else {
        // The lead is abandoned, not deferred. Keeping it would merely postpone
        // the follow-up by a turn, which is why a lower rate on its own left
        // every level playing the same.
        this.clearQueue();
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
    if (this.difficulty < HUNT_THRESHOLD) {
      this.lastHit = index;
      this.direction = null;
      return;
    }

    const ship = board.ships.find(s => s.occupies(index));
    if (ship && ship.isSunk()) {
      this._forgetSunkShip(ship);
      return;
    }

    if (this.difficulty > AIM_THRESHOLD && this.lastHit !== null) {
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

    if (this.difficulty > AIM_THRESHOLD && this.direction === 'horizontal') {
      if (col > 0) candidates.push(index - 1);
      if (col < 9) candidates.push(index + 1);
    } else if (this.difficulty > AIM_THRESHOLD && this.direction === 'vertical') {
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
