const SVG_NS = 'http://www.w3.org/2000/svg';

// Hand-authored 24x24 stroke glyphs standing in for the named Lucide icons,
// so the project ships no external assets.
const GLYPHS = {
  'radar': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 20 6"/>',
  'radio-tower': '<path d="M6 20 12 8 18 20"/><path d="M8.5 15h7"/><circle cx="12" cy="4" r="2"/>',
  'crosshair': '<circle cx="12" cy="12" r="9"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M1 12h4"/><path d="M19 12h4"/>',
  'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  'circle': '<circle cx="12" cy="12" r="8"/>',
  'circle-dot': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  'skull': '<path d="M12 3a7 7 0 0 0-7 7v3l-1 3h16l-1-3v-3a7 7 0 0 0-7-7z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M9 19h6"/>',
  'triangle-alert': '<path d="M12 4 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  'lock': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  'shield': '<path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/>',
  'shield-check': '<path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/><path d="M9 12l2.5 2.5L16 10"/>',
  'ship': '<path d="M3 15h18l-2 5H5z"/><path d="M6 15V9h12v6"/><path d="M12 9V5"/>',
  'refresh-cw': '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
  'rotate-cw': '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>',
  // Sparkle arms are 6 and 4 units long on purpose: a stroke shorter than its
  // own 2-unit width collapses into a dot under stroke-linecap: round.
  'wand-sparkles': '<path d="M4 20 14 10"/><path d="M16 4v6"/><path d="M13 7h6"/><path d="M19 14v4"/><path d="M17 16h4"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3"/><path d="M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M9 20h6"/>',
};

export const ICON_NAMES = Object.keys(GLYPHS);

export const CELL_MARKER = {
  'ship': 'ship',
  'hit': 'circle-dot',
  'sunk': 'skull',
  'miss': 'circle',
  'preview': 'crosshair',
  'preview--bad': 'triangle-alert',
};

const SPRITE_ID = 'battleship-sprite';

export function injectSprite(doc = document) {
  const existing = doc.getElementById(SPRITE_ID);
  if (existing) return existing;

  const symbols = ICON_NAMES
    .map((name) => `<symbol id="i-${name}" viewBox="0 0 24 24">${GLYPHS[name]}</symbol>`)
    .join('');

  const sprite = doc.createElementNS(SVG_NS, 'svg');
  sprite.id = SPRITE_ID;
  sprite.setAttribute('hidden', '');
  sprite.setAttribute('fill', 'none');
  sprite.setAttribute('stroke', 'currentColor');
  sprite.setAttribute('stroke-width', '2');
  sprite.setAttribute('stroke-linecap', 'round');
  sprite.setAttribute('stroke-linejoin', 'round');
  sprite.innerHTML = symbols;

  doc.body.append(sprite);
  return sprite;
}

export function icon(name, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  if (className) svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}
