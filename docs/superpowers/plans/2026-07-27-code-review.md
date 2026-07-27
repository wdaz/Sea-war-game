# Code Review — Sea War Game Rewrite

**Date:** 2026-07-27
**Git range:** `fde9b9c..d96e313`
**Verdict:** Ready to merge — With fixes

---

## Strengths

- Sound five-class ES Module architecture (Ship → Board → AI → Game → UI) with genuine DOM-free domain logic
- TDD methodology actually followed — 44/44 unit tests pass, commit history confirms correct sequence
- `Board._isOccupiedOrAdjacent` handles diagonals, edge clamping, and the 1-cell gap correctly
- AI `adjustDifficulty` uses `toFixed(1)` + `parseFloat` to avoid floating-point drift
- CSS custom properties, `clamp()`, `data-phase` visibility control, and CSS animations — all clean
- HTML structure deviation from the plan was the right call (plan had a structural bug; implementation silently fixed it)

---

## Issues

### Critical (Must Fix)

**1. `Board.placeShip` mutates the ship before validation — `src/Board.js:11`**

`ship.place(index, direction)` is called before out-of-bounds and adjacency checks. On rejection,
the ship is left in a dirty state (`startIndex` and `direction` already set).
No current caller reuses a ship after failure, but the contract is broken for future callers.

**Fix:** Move `ship.place()` to after all validation passes.

---

### Important (Should Fix)

**2. AI difficulty tier `> 0.7` not implemented — `src/AI.js`**

The spec defines three tiers:
- `< 0.4`: random
- `0.4–0.7`: hunt & target ✓
- `> 0.7`: hunt & target + direction refinement (finds ship axis after 2 consecutive hits) ✗

Difficulty can reach `1.0` but behavior at `0.8+` is identical to `0.5`.
Confirm if this is an intentional scope cut; if so, add a comment in `AI.js`.

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

---

### Minor (Nice to Have)

**5. Animation re-trigger on every render — `src/UI.js:52`**

`_renderBoard` tears down and rebuilds all 200 DOM cells on every `render()` call.
This re-triggers CSS hit/miss/sunk animations on all previously hit cells each turn.

**Fix:** Update individual cell classes in place instead of clearing `innerHTML`.

**6. Confusing `scores` self-assignment — `src/Game.js:73`**

`restart()` saves and restores the same object reference. Add a comment explaining
the intent ("preserve score counts across restart").

**7. Missing trailing newline in Playwright spec files**

All three e2e spec files lack a trailing newline:
- `tests/e2e/battle.spec.js`
- `tests/e2e/gameover.spec.js`
- `tests/e2e/placement.spec.js`

**8. `color-mix()` limited browser support — `main.css:91,99`**

Requires Chrome 111+, Firefox 113+, Safari 16.2+. Fine for a modern-browser target;
worth a comment if cross-browser support becomes a requirement.

---

## Recommendations

- Fix animation re-trigger: set a `data-animated` attribute on cells after first animation; only add animation class to newly attacked cells.
- Add win-condition tests to `Game.test.js` — the most critical untested logic path.
- AI third tier: either implement or explicitly note the scope reduction in `AI.js`.
