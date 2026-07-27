export class AI {
  constructor() {
    this.difficulty = parseFloat(
      localStorage.getItem('seawar_ai_difficulty') ?? '0.5'
    );
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

  clearQueue() {
    this.huntQueue = [];
    this.lastHit = null;
    this.direction = null;
  }

  adjustDifficulty(playerWon) {
    if (playerWon) {
      this.difficulty = Math.min(1.0, parseFloat((this.difficulty + 0.1).toFixed(1)));
    } else {
      this.difficulty = Math.max(0.1, parseFloat((this.difficulty - 0.1).toFixed(1)));
    }
    localStorage.setItem('seawar_ai_difficulty', String(this.difficulty));
    this.clearQueue();
  }
}
