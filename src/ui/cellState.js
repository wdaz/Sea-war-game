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
