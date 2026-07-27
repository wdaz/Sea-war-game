import { Ship } from './Ship.js';

export const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

export class Board {
  constructor() {
    this.ships = [];
    this.attacked = new Set();
  }

  placeShip(ship, index, direction) {
    if (direction === 'horizontal') {
      if (index % 10 + ship.size > 10) return false;
    } else {
      if (Math.floor(index / 10) + ship.size > 10) return false;
    }

    ship.place(index, direction);
    const cells = ship.getCells();

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
