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
