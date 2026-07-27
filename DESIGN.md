# BattleShip Design Decisions

**Status:** Approved and implemented in Pencil

**Last updated:** 2026-07-27

**Design direction:** Tactical Command Center

This document is the source of truth for BattleShip UI decisions. The detailed
redesign specification remains in
[`docs/superpowers/specs/2026-07-27-battleship-redesign-design.md`](docs/superpowers/specs/2026-07-27-battleship-redesign-design.md).

## Product principles

- Preserve the existing `placement → battle → gameover` game flow.
- Keep the two 10×10 boards as the dominant game objects.
- Communicate every important state with color plus an icon, shape, or text.
- Keep the interface technical and atmospheric without imitating a dense
  military simulator.
- Prefer clear hierarchy and restrained decoration over generic card grids,
  heavy gradients, and excessive shadows.
- Keep visual state in the UI layer; do not add presentation state to the
  domain classes.

## Direction decision

The selected direction is a modern naval command interface:

- deep navy surfaces;
- cyan radar and focus signals;
- orange primary commands and score emphasis;
- red danger, invalid placement, and hit feedback;
- thin technical borders and sparse construction marks.

Retro nautical-map and neon-arcade directions were rejected. They had stronger
decoration but weaker grid legibility and were less aligned with the adaptive
AI and tactical decision-making theme.

## Design system

The visible Pencil design system is the top-level frame
`00 – BattleShip Design System`. It contains both foundations and reusable
components. Tokens also exist as native Pencil variables.

### Color

| Token | Value | Usage |
|---|---:|---|
| `bg-deep` | `#07111F` | Application background |
| `surface` | `#0D1B2E` | Main panels |
| `surface-raised` | `#13253B` | Cells, controls, raised surfaces |
| `grid` | `#47799F` | Board grid lines and cell borders |
| `border-subtle` | `#24435C` | Panel outlines and decorative separators |
| `cyan` | `#45D6D0` | Active state, focus, radar, miss |
| `orange` | `#F5A84B` | Primary actions and score |
| `danger` | `#F05A67` | Hit, invalid placement, destructive state |
| `text-primary` | `#EDF7F6` | Primary text |
| `text-muted` | `#88A5B8` | Secondary text and metadata |

Color must never be the only state indicator.

Verified contrast ratios:

| Pair | Ratio | Requirement |
|---|---:|---|
| `grid` on `surface-raised` (cell borders) | `3.32 : 1` | ≥ 3:1, WCAG 1.4.11 |
| `grid` on `surface` | `3.71 : 1` | ≥ 3:1, WCAG 1.4.11 |
| `text-muted` on `surface` | `6.69 : 1` | ≥ 4.5:1, WCAG 1.4.3 |
| `danger` on `surface` | `5.25 : 1` | ≥ 4.5:1, WCAG 1.4.3 |

`border-subtle` is `1.67 : 1` and is therefore restricted to decorative
separators. It must never be the only boundary of an interactive element.

### Typography

| Role | Font | Size / weight | Usage |
|---|---|---:|---|
| `display-xl` | Rajdhani | `42 / 700` | Result headline |
| `display-lg` | Rajdhani | `28 / 700` | Design system title |
| `display-md` | Rajdhani | `24 / 700` | Desktop wordmark |
| `heading` | Rajdhani | `20 / 700` | Section headings |
| `heading-sm` | Rajdhani | `18 / 700` | Board titles, current ship |
| `heading-xs` | Rajdhani | `16 / 700` | Mobile wordmark and board titles |
| `body` | Inter | `14 / 400–500` | Status and explanatory copy |
| `body-sm` | Inter | `12 / 400–700` | Buttons, descriptions, mobile status |
| `data-lg` | IBM Plex Mono | `24 / 700` | Result score |
| `data` | IBM Plex Mono | `12–16 / 600–700` | Score, tactical metadata |
| `data-sm` | IBM Plex Mono | `11 / 600` | Eyebrows, legends, token labels |
| `data-xs` | IBM Plex Mono | `10 / 400` | Coordinate rulers only |

Rules:

- `10 px` is the absolute minimum and is reserved for the A–J / 1–10 coordinate
  rulers, which are read positionally rather than as prose.
- Every other label uses `11 px` or larger.
- Uppercase labels may use restrained letter spacing. Long Azerbaijani messages
  must not use wide tracking.

### Spacing

The spacing scale is:

| Token | Value |
|---|---:|
| `space-1` | `4 px` |
| `space-2` | `8 px` |
| `space-3` | `12 px` |
| `space-4` | `16 px` |
| `space-5` | `20 px` |
| `space-6` | `24 px` |
| `space-8` | `32 px` |

### Radius, stroke, and elevation

- Radius scale: `0`, `6`, `8`, and `10 px`.
- Panel border: `1 px` using `border-subtle`.
- Board cell border: `1 px` using `grid`.
- Focus border: `2 px` using `cyan` or the relevant semantic color.
- Floating result panel: restrained `0 / 6 / 14` dark shadow.
- Most hierarchy comes from surface contrast and borders, not shadows.

### Motion

- Interaction feedback should use `150–450 ms` durations.
- Hit, miss, and sunk feedback may animate.
- Layout and decorative motion must respect `prefers-reduced-motion`.

### Accessibility

Icon markers satisfy the "never color alone" rule for sighted users, but they
carry no information for a screen reader. The implementation therefore adds an
accessible name layer on top of the visual vocabulary.

- Each board is a labelled `role="group"` (`SƏNİN DONANMAN` / `RƏQİB SULARI`).
- Each cell exposes coordinate plus state as its accessible name, for example
  `C4 · vuruldu`, `A1 · boş`, `H4 · gəmi`, `E7 · batdı`.
- `role="grid"` is deliberately **not** used. ARIA `grid` requires `role="row"`
  children, which contradicts the flat 100-cell DOM contract. `group` is the
  correct role for a flat collection.
- Cells that are actionable in the current phase are the only focusable ones:
  the player board during `placement`, the AI board during `battle`. They take
  `role="button"` and respond to `Enter` and `Space`.
- Focus uses the roving-tabindex pattern: the board holds a single tab stop,
  and `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `Home` / `End`
  move focus within it. Without this, a 10×10 board would create 100 tab stops.
- Already-attacked cells are **not** `aria-disabled`. Clicking one is a real
  action that reports `Bu xanaya artıq hücum edilib!`, so the control is not
  disabled — it is a rejected move. Marking it disabled would both misdescribe
  the behaviour and make the cell unclickable for assistive technology and test
  tooling alike. Their state is already carried by the accessible name
  (`A1 · vuruldu`); a non-ARIA `data-spent` attribute drives the styling.
- The status bar message region is an `aria-live="polite"` container so combat
  results and placement errors are announced without stealing focus.

## Game-state vocabulary

| State | Visual treatment |
|---|---|
| Ship | Muted blue ship fill plus ship form |
| Preview | Cyan fill or border plus crosshair |
| Invalid | Red border/fill plus alert icon and message |
| Hit | Red center/ring plus `circle-dot` marker |
| Miss | Cyan ring/dot plus `circle` marker |
| Sunk | Red treatment across the whole ship plus sunk/skull marker |
| Locked | Reduced emphasis plus lock icon and status text |
| Active target | Orange or cyan focus border plus crosshair |

Repeated attacks must show a disabled cell and a message without advancing the
turn.

All eight states plus `Empty` are documented in Pencil in two places:

- `Foundation Card / States` in the Design System frame carries the full
  vocabulary as icon-plus-label patterns.
- `Cell State Samples` inside `Component / Board Panel` carries the same
  vocabulary as an in-component legend. It is set to `opacity: 0` on every
  screen instance, so it serves as documentation rather than shipped UI.

The Battle screen ships its own reduced three-item legend
(`GƏMİ`, `VURULDU`, `YAN KEÇDİ`), which is the only legend visible to players.

## Reusable components

The Pencil file contains five reusable components:

1. `Component / Command Header`
2. `Component / Action Button`
3. `Component / Status Bar`
4. `Component / Board Panel`
5. `Component / Result Panel`

The board component includes deterministic coordinates from `Cell A1` through
`Cell J10`, enabling state overrides without duplicating board structure.

`Component / Status Bar` is authored at `fill_container` width. Screen
instances pin it to `960 px`; the component itself must stay fluid so the
`768–1023 px` compact breakpoint can be expressed.

## Screen decisions

### 01 – Placement Phase

- Player board is dominant.
- AI board remains visible but locked.
- Current ship, remaining fleet, orientation, rotate, and auto-place actions are
  grouped in one operations bar.
- Auto-place is the primary action; rotate is secondary.
- Invalid placement uses red cells, alert icons, and an explanatory status.
- Placing the final ship automatically starts the battle, matching the current
  game behavior.

### 02 – Battle Phase

- AI board becomes the dominant target surface.
- Player board remains visible as defense context.
- Hit, miss, and focus examples are visible on the boards.
- The latest player and AI actions are combined into one combat-status line.
- A compact legend explains ship, hit, and miss symbols.

### 03 – Game Over

- The boards remain visible behind a dimmed overlay.
- The result panel is the dominant element.
- Victory uses cyan/orange emphasis; defeat uses danger emphasis.
- Restart preserves the accumulated player/AI score.

### 04 – Mobile Battle

- Reference frame: `390 × 844`. This is the iPhone 14 **device** height, not
  the usable web viewport.
- Layout content occupies `836 px`, so on a browser with visible chrome
  (usable height roughly `745 px`) the page scrolls vertically. This is
  accepted: only horizontal scrolling of the grid is forbidden.
- AI board appears first, followed by the player board.
- Both 10×10 boards remain fully visible without horizontal scrolling.
- Spatial grid cells are `28 × 28 px`. The `44 px` minimum does not apply to
  them, because they are a positional grid rather than standalone controls.
- Standalone touch controls remain at least `44 × 44 px`.

## Codebase compatibility

The implementation must preserve:

- `[data-phase]`
- `[data-board="player"]`
- `[data-board="ai"]`
- `[data-action="rotate"]`
- `[data-action="auto-place"]`
- `[data-action="new-game"]`
- `[data-message]`
- `.ship`
- `.hit`
- `.miss`
- `.sunk`
- `.preview`
- `.preview--bad`

Fleet status and combat messages must be derived from existing `Game`, `Board`,
and `UI` state.

### Board DOM contract

This constraint belongs to the implementation, not to the Pencil file:

- `.board` must contain exactly **100 direct** `.cell` children, `data-index`
  `0`–`99`, row-major.
- Required by `src/UI.js` `_renderBoard`, which indexes `boardEl.children[i]`
  for `i` in `0..99`, and by `main.css` `.board`, which is a CSS grid with
  `grid-template-columns/rows: repeat(10, var(--cell-size))`.
- `.board` is empty in `index.html`; every cell is created at runtime.
- Coordinate labels live outside `.board`, in `.board-wrapper`.

The Pencil file groups cells into `Grid Row 1`–`Grid Row 10` frames because
Pencil auto-layout is single-axis with no wrapping, so row frames are the only
way to draw a 10×10 grid. **Those wrappers are a drawing artifact and must not
be mirrored in the DOM.** Emitting them would break both `boardEl.children[i]`
and the CSS grid. The three `Grid Rows` frames in Pencil (`a98Tz`, `H9Aj9`,
`kHT1Q`) carry this contract in their `context` field.

## Responsive rules

- `≥ 1024 px`: boards side by side.
- `768–1023 px`: compact boards; header may wrap into two rows.
- `< 768 px`: boards stack vertically.
- No horizontal scrolling for the 10×10 grid.
- Long status messages use fixed-width wrapping without changing the overall
  control layout unexpectedly.

## Pencil artifact

Active Pencil document, now stored in the repository root:

`battleship`

It is an encrypted `.pen` document despite the missing extension. Open it only
through the Pencil MCP tools; never `Read` or `Grep` it.

Current top-level frames:

- `00 – BattleShip Design System`
- `01 – Placement Phase`
- `02 – Battle Phase`
- `03 – Game Over`
- `04 – Mobile Battle`

The Design System frame is positioned above Placement with an `80 px` gap so
the screens do not overlap.

## Exported previews

**Stale.** These PNGs predate the 2026-07-27 accessibility and token pass and
still show the old low-contrast grid, the `7.5 px` labels, and the English
state legend. `export_nodes` currently fails against this document, so they
must be re-exported from Pencil manually before being trusted.


- [`Placement`](docs/design/battleship/placement.png)
- [`Battle`](docs/design/battleship/battle.png)
- [`Game Over`](docs/design/battleship/gameover.png)
- [`Mobile Battle`](docs/design/battleship/mobile-battle.png)

## Out of scope

- Multiplayer and backend
- New AI mechanics or a visible difficulty selector
- Audio effects
- Account and profile systems
- Changes to the core Battleship rules

## Language

- Product vocabulary is Azerbaijani. This includes the game-state names
  (`BOŞ`, `GƏMİ`, `ÖNBAXIŞ`, `YANLIŞ`, `VURULDU`, `YAN KEÇDİ`, `BATDI`,
  `KİLİDLİ`, `HƏDƏF`), because the same terms appear in the shipped battle
  legend.
- Design system scaffolding (`FOUNDATIONS`, `COMPONENTS`, `SPACING`, `RADIUS`,
  token names, layer names) stays in English as developer documentation.

## Validation status

Last verified: 2026-07-27.

- Pencil reports five intended top-level frames.
- Pencil reports five reusable components.
- Global layout validation reports no clipping, collapse, or overlap problems.
- Cell borders meet WCAG 1.4.11 at `3.32 : 1`.
- No text below `10 px`; `10 px` is used only for coordinate rulers.
- No spacing value outside the `4 / 8 / 12 / 16 / 20 / 24 / 32` scale.
- All nine game states are represented in the Design System frame.
