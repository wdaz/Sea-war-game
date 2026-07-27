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
| `grid` | `#24435C` | Grid lines and default borders |
| `cyan` | `#45D6D0` | Active state, focus, radar, miss |
| `orange` | `#F5A84B` | Primary actions and score |
| `danger` | `#F05A67` | Hit, invalid placement, destructive state |
| `text-primary` | `#EDF7F6` | Primary text |
| `text-muted` | `#88A5B8` | Secondary text and metadata |

Color must never be the only state indicator.

### Typography

| Role | Font | Size / weight | Usage |
|---|---|---:|---|
| Display | Rajdhani | `32 / 700` | Product and result headlines |
| Heading | Rajdhani | `20 / 700` | Board and section headings |
| Body | Inter | `14 / 400` | Status and explanatory copy |
| Data | IBM Plex Mono | `12 / 600` | Coordinates, score, tactical metadata |

Uppercase labels may use restrained letter spacing. Long Azerbaijani messages
must not use wide tracking.

### Spacing

The spacing scale is:

| Token | Value |
|---|---:|
| `space-1` | `4 px` |
| `space-2` | `8 px` |
| `space-3` | `12 px` |
| `space-4` | `16 px` |
| `space-6` | `24 px` |
| `space-8` | `32 px` |

### Radius, stroke, and elevation

- Radius scale: `0`, `6`, `8`, and `10 px`.
- Default border: `1 px` using `grid`.
- Focus border: `2 px` using `cyan` or the relevant semantic color.
- Floating result panel: restrained `0 / 6 / 14` dark shadow.
- Most hierarchy comes from surface contrast and borders, not shadows.

### Motion

- Interaction feedback should use `150–450 ms` durations.
- Hit, miss, and sunk feedback may animate.
- Layout and decorative motion must respect `prefers-reduced-motion`.

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

## Reusable components

The Pencil file contains five reusable components:

1. `Component / Command Header`
2. `Component / Action Button`
3. `Component / Status Bar`
4. `Component / Board Panel`
5. `Component / Result Panel`

The board component includes deterministic coordinates from `Cell A1` through
`Cell J10`, enabling state overrides without duplicating board structure.

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

- Reference viewport: `390 × 844`.
- AI board appears first, followed by the player board.
- Both 10×10 boards remain fully visible without horizontal scrolling.
- Spatial grid cells are `28 × 28 px`.
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

Coordinate labels must live outside `.board` so the board can retain exactly
100 direct `.cell` children.

Fleet status and combat messages must be derived from existing `Game`, `Board`,
and `UI` state.

## Responsive rules

- `≥ 1024 px`: boards side by side.
- `768–1023 px`: compact boards; header may wrap into two rows.
- `< 768 px`: boards stack vertically.
- No horizontal scrolling for the 10×10 grid.
- Long status messages use fixed-width wrapping without changing the overall
  control layout unexpectedly.

## Pencil artifact

Active Pencil document:

`/Users/ruslan/.pencil/documents/23efeefe-b072-45a2-811b-2ed3d4fdadd3/pencil-new.pen`

Current top-level frames:

- `00 – BattleShip Design System`
- `01 – Placement Phase`
- `02 – Battle Phase`
- `03 – Game Over`
- `04 – Mobile Battle`

The Design System frame is positioned above Placement with an `80 px` gap so
the screens do not overlap.

## Exported previews

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

## Validation status

- Pencil reports five intended top-level frames.
- Pencil reports five reusable components.
- Global layout validation reports no clipping, collapse, or overlap problems.
