# Code Review — Sea War Game Rewrite

**Date:** 2026-07-27
**Git range:** `fde9b9c..d96e313`
**Reviews run:** 2
**Verdict:** Not ready — fix Critical #1, then ready to merge

---

## Strengths

- Sound five-class ES Module architecture (Ship → Board → AI → Game → UI) with genuine DOM-free domain logic
- TDD methodology actually followed — 50/50 unit tests pass in 539ms, commit history confirms correct sequence
- `Board._isOccupiedOrAdjacent` handles diagonals, edge clamping, and the 1-cell gap correctly
- AI `adjustDifficulty` uses `toFixed(1)` + `parseFloat` to avoid floating-point drift
- **Incremental DOM diffing in `_renderBoard`** (`UI.js:89-109`) — tracks `cell.dataset.state`, only updates changed cells; avoids animation replay on untouched cells (better than the plan spec)
- **Event delegation** (`UI.js:46-68`) — board-level listeners instead of 100 per-cell; no listener accumulation across re-renders
- **AI direction tracking** (`AI.js:36-63`) — `lastHit` + `direction` state with reset on miss; genuine enhancement over the spec
- CSS custom properties, `clamp()`, `data-phase` visibility control, and CSS animations — all clean
- HTML structure deviation from the plan was the right call (plan's `<footer>` outside `<main>` would have broken its own CSS descendant selector; implementation silently fixed it)

---

## Issues

### Critical (Must Fix)

**1. `Board.placeShip` mutates the ship before full validation — `src/Board.js:18`**

`ship.place(index, direction)` is called before the adjacency loop. If adjacency check fails,
the ship is left in a dirty state (`startIndex` and `direction` already set) even though
`placeShip` returns `false`.

No current caller reuses a ship after failure (every call site creates a `new Ship` immediately
before calling `placeShip`). But the API contract is broken — a function that returns `false`
should leave its arguments unmodified.

**Fix:** Move `ship.place(index, direction)` to after all validation passes:

```js
placeShip(ship, index, direction) {
  // bounds check
  if (direction === 'horizontal') {
    if (index % 10 + ship.size > 10) return false;
  } else {
    if (Math.floor(index / 10) + ship.size > 10) return false;
  }
  // compute cells without mutating ship
  const cells = [];
  for (let i = 0; i < ship.size; i++) {
    cells.push(direction === 'horizontal' ? index + i : index + i * 10);
  }
  for (const cell of cells) {
    if (this._isOccupiedOrAdjacent(cell)) return false;
  }
  ship.place(index, direction);  // mutate only on success
  this.ships.push(ship);
  return true;
}
```

---

### Important (Should Fix)

**2. AI difficulty tier `> 0.7` not implemented — `src/AI.js`**

The spec defines three tiers:
- `< 0.4`: random
- `0.4–0.7`: hunt & target ✓
- `> 0.7`: hunt & target + direction refinement (finds ship axis after 2 consecutive hits) ✗

Difficulty can reach `1.0` but behavior at `0.8+` is identical to `0.5`.
Either implement the third tier or add a comment in `AI.js` noting the intentional scope cut.

**3. No unit tests for win conditions — `tests/unit/Game.test.js`**

`winner: 'player'` and `winner: 'ai'` return paths are untested. Score increment,
phase transition to `'gameover'`, and `adjustDifficulty` on win are all uncovered.

Suggested additions:
```js
test('playerAttack sets winner to player when all AI ships sunk', ...);
test('playerAttack sets winner to ai when all player ships sunk', ...);
```

**4. Crosshair cursor persists in gameover phase — `main.css:88`**

`.cell { cursor: crosshair }` should be scoped to the battle phase only:
```css
.game[data-phase="battle"] [data-board="ai"] .cell { cursor: crosshair; }
```

**5. `gameover.spec.js` tests nothing from its spec responsibility — `tests/e2e/gameover.spec.js`**

The file covers "Scores and persistence" but has zero tests for: win condition triggering,
score incrementing, phase transition to `gameover`, or the win message.
Its three existing tests duplicate coverage already in `battle.spec.js`.

**6. `_showPreview` doesn't check overlap/adjacency — `UI.js:153-168`**

Preview only validates bounds. Cells adjacent to already-placed ships show green,
then immediately error on click. The spec requires invalid placements to be visually
rejected upfront.

**Fix:** Integrate `Board._isOccupiedOrAdjacent` into the preview coloring logic.

**7. `AI.registerResult` leaves `lastHit` stale when difficulty < 0.4 — `AI.js:29-34`**

An early return skips updating `lastHit` on hits when difficulty is below 0.4.
Safe given current architecture (`clearQueue()` resets `lastHit` before each new game),
but it's a latent state bug. At minimum, add a comment; ideally update `lastHit` for
all hits regardless of difficulty tier.

---

### Minor (Nice to Have)

**8. Horizontal preview wrap-around — `UI.js:164-168`**

A ship previewing from index 8 (horizontal, size 3) shows cells 8, 9, and 10 — cell 10
is row 1 col 0, on the wrong visual row. Fix: break the preview loop when a cell crosses
a row boundary:

```js
const targetRow = isHorizontal ? Math.floor(index / 10) : null;
for (let i = 0; i < size; i++) {
  const ci = isHorizontal ? index + i : index + i * 10;
  if (isHorizontal && Math.floor(ci / 10) !== targetRow) break;
  // ...
}
```

**9. `autoPlace` has no iteration cap — `Board.js:58-68`**

Theoretical infinite loop. Impossible in practice for standard ship sizes on 10×10,
but worth adding a safety limit (e.g., 10,000 iterations) with an error throw.

**10. `Game.clearQueue()` is an unnecessary thin wrapper — `Game.js:88-90`**

`restart()` calls `this.clearQueue()` which just calls `this.ai.clearQueue()`.
One caller, no added abstraction value. Remove the wrapper and call `this.ai.clearQueue()`
directly.

**11. `vitest.config.js` has `passWithNoTests: true`**

Likely added to make Task 1's setup step pass before any tests existed.
Can be removed now that 50 tests are in place.

**12. Missing trailing newline in Playwright spec files**

All three e2e spec files lack a trailing newline:
- `tests/e2e/battle.spec.js`
- `tests/e2e/gameover.spec.js`
- `tests/e2e/placement.spec.js`

**13. `color-mix()` limited browser support — `main.css:91,99`**

Requires Chrome 111+, Firefox 113+, Safari 16.2+. Fine for a modern-browser target;
worth a comment if cross-browser support becomes a requirement.

---

## Resolved (from first review)

- ~~Animation re-trigger on every render~~ — **resolved**: `_renderBoard` uses incremental
  cell-state diffing, not `innerHTML = ''`. Animations only fire on newly changed cells.

---

## Recommendations

1. Fix `Board.placeShip` mutation order (Critical #1) — it's a one-line move.
2. Add win-condition tests to `Game.test.js` — the most critical untested logic path.
3. Add a real gameover e2e test that sinks all ships and verifies phase + score.
4. Enhance `_showPreview` to check adjacency against placed ships for better UX.
5. AI third tier: either implement or explicitly note the scope reduction in `AI.js`.
