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
