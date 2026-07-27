# BattleShip Code Implementation Design

**Date:** 2026-07-27

**Status:** Approved

**Scope:** Implement the approved Tactical Command Center design in HTML, CSS,
and JavaScript.

## Context

[`DESIGN.md`](../../../DESIGN.md) is the approved visual source of truth, realised in the Pencil
document `battleship`. The earlier plan,
[`2026-07-27-battleship-pencil-redesign.md`](../plans/2026-07-27-battleship-pencil-redesign.md),
built the Pencil artifact and explicitly excluded HTML, CSS, and JavaScript.
This spec covers that excluded work.

The current application is a small vanilla-JS game. Domain logic (`Game`,
`Board`, `Ship`, `AI`) is already separated from presentation and is covered by
22 unit tests. Six Playwright tests pin a DOM contract.

The gap between design and code is large. The code currently lacks coordinate
rulers, cell icon markers, board titles and status clusters, an operations bar,
a status bar with an eyebrow, a battle legend, a Game Over result panel, and
the mobile stacking rules. It also violates a stated product principle:
`.ship`, `.hit`, and `.miss` differ only by `background`, so colour is the only
state indicator.

## Decisions

| Question | Decision |
|---|---|
| Scope | Full parity with `DESIGN.md` |
| Assets | Fully self-contained: inline SVG sprite with vendored Lucide paths, self-hosted woff2 fonts, no CDN |
| Structure | Full JS render; `index.html` holds only the root container |
| Testing | jsdom unit tests plus extended Playwright coverage |
| Render strategy | `mount()` once, then `update(state)` patches |

### Why `mount + update` rather than re-render

`main.css` animations depend on node identity. `animation` restarts whenever it
is newly applied to an element, so replacing a `.cell` node replays `explode`
even for cells that did not change. The existing `_renderBoard` already guards
this with `if (cell.dataset.state !== newState)`. Patching preserves that
behaviour and avoids recreating 200 cells per turn.

### Fonts are self-hosted, and the display family changed

Self-contained delivery ruled out Google Fonts, but not the real families. The
woff2 files are vendored into `assets/fonts/` by `scripts/build-fonts.mjs` from
`@fontsource` devDependencies, covering only the weights `main.css` asks for:
Saira Condensed 700, Inter 400/500/700, IBM Plex Mono 400/600/700. Both the
`latin` and `latin-ext` subsets are required — `ç ö ü` live in `latin`, while
`ə ğ ı İ ş` sit in `latin-ext`. Total weight is about 320 KB.

The display family is Saira Condensed rather than the Rajdhani named by the
design. Rajdhani ships no `U+018F`/`U+0259` (`Ə`/`ə`) glyph, so Azerbaijani
headings silently fell back for those letters. This was measured, not assumed:
`tests/e2e/fonts.spec.js` compares glyph advance widths against two very
different fallbacks and fails if any family cannot set the alphabet.

## Architecture

```
index.html          <div id="app"></div> + <script type="module" src="src/main.js">
main.css            tokens and all styling
src/
  main.js           bootstrap; throws if #app is missing
  Game.js  Board.js  Ship.js  AI.js      unchanged
  UI.js             orchestrator: owns views, binds events, derives view state
  ui/
    dom.js          el() helper
    icons.js        SVG sprite, injection, state to icon map
    cellState.js    pure state derivation
    BoardView.js    one instance per board
    HudView.js      command header, operations bar, status bar, legend
    ResultView.js   Game Over scrim and result panel
```

No domain class changes. This preserves the `DESIGN.md` principle: keep visual
state in the UI layer.

### Module contracts

**`dom.js`** — the only DOM construction path.

```
el(tag, props?, ...children) -> Element
  props: { className, text, dataset, attrs, style }
  children: Element | string | null   (null is skipped)
```

**`icons.js`**

```
injectSprite(doc)          idempotent; returns early if #battleship-sprite exists
icon(name, className?)     -> <svg><use href="#i-{name}"></svg>
CELL_MARKER                { ship, hit, sunk, miss, preview, 'preview--bad' } -> icon name
```

Icons required: `radar`, `crosshair`, `circle-dot`, `circle`, `skull`,
`triangle-alert`, `lock`, `shield`, `shield-check`, `radio-tower`, `target`,
`ship`, `refresh-cw`, `rotate-cw`, `wand-sparkles`, `trophy`.

These are the real Lucide glyphs, matching the Pencil document, which specifies
`library: "lucide"`. Their path data is vendored into `GLYPHS` by
`scripts/build-icons.mjs`, which reads the `lucide-static` devDependency. Lucide
is ISC licensed. Vendoring keeps the runtime dependency-free while preserving
parity with the design; hand-drawn substitutes were tried first and rejected
because they did not match the design.

**`cellState.js`** — extracted from `UI._cellState`.

```
cellState(index, boardData, isAI) -> '' | 'ship' | 'hit' | 'miss' | 'sunk'
boardStates(boardData, isAI)      -> Array(100)
```

**`BoardView.js`**

```
new BoardView({ side: 'player' | 'ai', title })
  mount()                      -> panel Element
  update({ states, status })   patches only changed cells
  setPreview(indices, valid)
  clearPreview()
  cellAt(index)                -> Element
```

`mount()` builds the panel header, the column ruler `A`–`J`, the row ruler
`1`–`10`, and `.board[data-board=side]` containing exactly 100
`.cell[data-index]` elements. Each cell contains one persistent
`<svg class="cell__marker">`.

**`HudView.js`**

```
mountHeader()      -> HTMLElement   contains [data-score] and [data-action="new-game"]
mountOperations()  -> HTMLElement   [data-controls="placement"]
mountStatusBar()   -> HTMLElement   contains [data-message]
mountLegend()      -> HTMLElement
update({ phase, scores, nextShipSize, shipsRemaining, direction, message, tone })
```

**`ResultView.js`**

```
mount()                                  -> scrim + panel, initially hidden
update({ phase, playerWon, scores })
```

## Data flow

One direction. `game` is the only source of truth; views never read it.

```
game -> UI.render() derives plain view-state objects -> view.update(state) -> DOM patch
```

### Board status derivation

Nothing below is stored in the domain; all of it is computed.

| Phase | Board | Text | Icon | Emphasis |
|---|---|---|---|---|
| placement | player | `AKTİV` | `radio-tower` | cyan |
| placement | ai | `KİLİDLİ` | `lock` | muted, `opacity .7` |
| battle | player | `MÜDAFİƏ` | `shield` | muted |
| battle | ai | `HƏDƏF AKTİVDİR` | `crosshair` | cyan, 2 px focus border |
| gameover | player | `QALDI: {n}` | `shield-check` | muted |
| gameover | ai | `MƏHV EDİLDİ` when `playerWon`, else `QALDI: {n}` | `skull` / `shield` | danger / muted |

```
shipsAlive(board) = board.ships.filter(s => !s.isSunk()).length
playerWon         = game.aiBoard.allSunk()
```

`playerWon` is derived from `allSunk()` rather than from the `winner` value
returned by `playerAttack()`. The returned value is transient; the board state
is not. This keeps `render()` idempotent, which `mount + update` requires.

### HUD derivation

```
phaseLabel      placement -> 'DONANMANI YERLƏŞDİR'
                battle    -> 'DÖYÜŞ'
                gameover  -> 'NƏTİCƏ'
nextShipSize    SHIP_SIZES[game.currentShipIndex]
shipsRemaining  SHIP_SIZES.length - game.currentShipIndex
direction       'ÜFÜQİ · R' | 'ŞAQULİ · R'
eyebrow         derived from phase inside HudView, not passed in:
                placement -> 'YERLƏŞDİRMƏ'
                battle    -> 'SON GEDİŞ'
                gameover  -> 'NƏTİCƏ'
tone            'neutral' | 'danger'    danger only for invalid placement
```

`SON GEDİŞ` corrects a misspelling (`SON GƏDİŞ`) present in the Pencil document.
The Pencil file is not updated by this spec.

## DOM contract

Each selector below is pinned by an existing Playwright test. The JS render must
reproduce all of them exactly.

| Selector | Location in the new layout |
|---|---|
| `.game[data-phase]` | main game container |
| `[data-board="player"\|"ai"]` | the `.board` grid itself, not the panel |
| `[data-index="0..99"]` | `.cell`, a direct child of `.board` |
| `[data-score="player"\|"ai"]` | header score blocks |
| `[data-message]` | status bar message text |
| `[data-action="rotate"\|"auto-place"\|"new-game"]` | operations bar and header |
| `[data-controls="placement"]` | operations bar; `display: none` in `battle` and `gameover` |
| `.ship .hit .miss .sunk .preview .preview--bad` | cell classes |

Message strings stay byte-identical: `Bu xanaya artıq hücum edilib!`,
`İstiqamət: Şaquli`, `Təbrik edirik! Siz qalibisiniz! 🎉`.

The result panel's restart button uses `data-action="restart"`, **not**
`data-action="new-game"`. Three existing tests call
`page.click('[data-action="new-game"]')`, and Playwright's strict mode fails
when a selector matches more than one element. Both actions bind to the same
`game.restart()` handler, so behaviour is identical.

The design shows orientation as a persistent chip (`ÜFÜQİ · R`), but an existing
test expects `[data-message]` to contain `Şaquli` after rotating. Both are kept:
the chip shows state, the message reports the event.

`.board` keeps exactly 100 direct `.cell` children, indexed `0`–`99` in
row-major order. `BoardView.update()` addresses cells positionally, and
`main.css` renders `.board` as a `repeat(10, …)` CSS grid; a wrapper element
between `.board` and its cells would break both. Coordinate rulers live outside
`.board`.

## Styling

### Tokens

The old `--clr-*` variables are replaced.

```css
:root {
  --bg-deep:#07111F; --surface:#0D1B2E; --surface-raised:#13253B;
  --grid:#47799F; --border-subtle:#24435C;
  --cyan:#45D6D0; --orange:#F5A84B; --danger:#F05A67;
  --text-primary:#EDF7F6; --text-muted:#88A5B8;

  --space-1:4px; --space-2:8px; --space-3:12px;
  --space-4:16px; --space-5:20px; --space-6:24px; --space-8:32px;

  --radius-sm:6px; --radius-md:8px; --radius-lg:10px;

  --font-display:system-ui,'Segoe UI Semibold',sans-serif;
  --font-body:system-ui,'Segoe UI',sans-serif;
  --font-data:ui-monospace,'SF Mono','Cascadia Mono',monospace;

  --cell-size:36px;
}
```

`--grid` is for cell borders (3.32 : 1). `--border-subtle` is for panel outlines
and decorative separators only.

### Cell states

The marker `<svg>` is a permanent child, hidden with `opacity: 0`. Lucide paths
use `stroke="currentColor"`, so CSS sets `color`.

```
.cell.ship          background #2B5C73, border cyan,   marker ship
.cell.hit           background #F05A6733, border danger 2px, marker circle-dot
.cell.miss          background #45D6D00F, marker circle
.cell.sunk          background #F05A6733, marker skull
.cell.preview       background #45D6D022, border cyan, marker crosshair
.cell.preview--bad  background #F05A6733, border danger, marker triangle-alert
```

Visibility is toggled with `opacity`, never `display`. `display` is not
animatable, and keeping the marker in layout means cell size does not depend on
marker visibility, which avoids reflow across a 200-cell grid.

### Responsive

```
>= 1024px   boards side by side, --cell-size 36px
768-1023px  compact, --cell-size 30px
< 768px     stacked, --cell-size 28px, AI panel order: -1
```

`order: -1` lifts the AI board on mobile without changing DOM order, so desktop
keeps its natural reading order.

### Motion

Existing `explode`, `sink`, and `ripple` animations are retained and retuned
into the `150–450 ms` range.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

## Accessibility

See the `Accessibility` section of `DESIGN.md` for the recorded decisions.
Implementation notes:

- Each board is a labelled `role="group"`.
- Each cell's accessible name is coordinate plus state, e.g. `C4 · vuruldu`.
- `role="grid"` is not used, because ARIA `grid` requires `role="row"` children,
  which contradicts the flat 100-cell contract.
- Only cells actionable in the current phase are focusable: the player board in
  `placement`, the AI board in `battle`. They take `role="button"` and respond
  to `Enter` and `Space`.
- Roving tabindex: the board is one tab stop; arrow keys, `Home`, and `End` move
  focus inside it. Without this a board would create 100 tab stops.
- Already-attacked cells are **not** `aria-disabled`, because clicking one is a
  meaningful action that reports `Bu xanaya artıq hücum edilib!`. A non-ARIA
  `data-spent` attribute drives styling; the state lives in the accessible name.
- The message region is `aria-live="polite"`.

## Error handling

| Situation | Behaviour |
|---|---|
| Invalid placement | `.preview--bad` cells, `triangle-alert` marker, status bar `tone: danger`; turn does not advance |
| Repeated attack | `Bu xanaya artıq hücum edilib!`, `cursor: not-allowed`; turn does not advance |
| `injectSprite` called twice | Idempotent; returns early |
| `#app` missing | `main.js` throws a named error rather than rendering nothing |
| Null DOM query | Not possible; every view builds the DOM it owns |

## Testing

`vitest.config.js` already sets `environment: 'jsdom'` globally and excludes
`tests/e2e`. No configuration change is required.

### Unit

```
tests/unit/ui/
  cellState.test.js    five states and boundary cases
  icons.test.js        sprite idempotency, completeness of the state to icon map
  BoardView.test.js    100 cells, data-index 0-99, marker swap, preview,
                       aria-label format, roving tabindex movement
  HudView.test.js      phase label, scores, next ship, direction, tone
  ResultView.test.js   victory and defeat copy, hidden to visible transition
```

`BoardView.test.js` asserts the DOM contract directly, turning a documented rule
into an executable check:

```js
expect(board.children).toHaveLength(100);
expect([...board.children].every(c => c.classList.contains('cell'))).toBe(true);
```

### End-to-end

The six existing tests are not modified; they are the regression guard. New
files:

```
tests/e2e/
  hud.spec.js         coordinate rulers, legend, board statuses,
                      operations bar hidden in battle
  responsive.spec.js  390px stacked with AI first, 800px compact, 1440px
                      side by side; no horizontal overflow at any width
  a11y.spec.js        aria-label per state, keyboard attack,
                      reduced-motion disables animation
```

`gameover.spec.js` gains cases for the result panel overlay, boards remaining
visible behind it, and `YENİDƏN OYNA` preserving the score.

Horizontal overflow is checked concretely:

```js
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth);
expect(overflow).toBe(false);
```

### Method

Test-driven: a failing test per module before its implementation.

## Success criteria

- `npm test` green: 22 existing plus roughly 40 new unit tests.
- `npm run test:e2e` green: 6 existing plus roughly 15 new tests.
- All four `DESIGN.md` screens are recognisable in the browser at 1440px, 800px,
  and 390px.
- No cell state is communicated by colour alone.
- No horizontal scrolling at any supported width.
- Domain files `Game.js`, `Board.js`, `Ship.js`, and `AI.js` are unchanged.

## Out of scope

- Restoring Rajdhani, Inter, and IBM Plex Mono as real webfonts.
- Re-exporting the stale PNG previews in `docs/design/battleship/`.
- Correcting `SON GƏDİŞ` inside the Pencil document.
- Multiplayer, backend, audio, accounts, and AI mechanic changes, per
  `DESIGN.md`.
