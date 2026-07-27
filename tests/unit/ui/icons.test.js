import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite, icon, ICON_NAMES, CELL_MARKER } from '../../../src/ui/icons.js';

describe('icons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('injects a hidden sprite into the body', () => {
    injectSprite(document);
    const sprite = document.getElementById('battleship-sprite');
    expect(sprite).not.toBeNull();
    expect(sprite.hasAttribute('hidden')).toBe(true);
  });

  it('is idempotent', () => {
    const first = injectSprite(document);
    const second = injectSprite(document);
    expect(second).toBe(first);
    expect(document.querySelectorAll('#battleship-sprite')).toHaveLength(1);
  });

  it('defines a symbol for every declared icon name', () => {
    injectSprite(document);
    for (const name of ICON_NAMES) {
      expect(document.getElementById(`i-${name}`), name).not.toBeNull();
    }
  });

  it('gives every symbol a viewBox', () => {
    injectSprite(document);
    for (const name of ICON_NAMES) {
      expect(document.getElementById(`i-${name}`).getAttribute('viewBox')).toBe('0 0 24 24');
    }
  });

  it('builds an svg that references the sprite symbol', () => {
    const node = icon('crosshair', 'cell__marker');
    expect(node.tagName.toLowerCase()).toBe('svg');
    expect(node.getAttribute('class')).toBe('cell__marker');
    expect(node.querySelector('use').getAttribute('href')).toBe('#i-crosshair');
  });

  it('maps every cell state to a declared icon', () => {
    for (const [state, name] of Object.entries(CELL_MARKER)) {
      expect(ICON_NAMES, `${state} -> ${name}`).toContain(name);
    }
  });

  it('covers all six visual cell states', () => {
    expect(Object.keys(CELL_MARKER).sort()).toEqual(
      ['hit', 'miss', 'preview', 'preview--bad', 'ship', 'sunk'],
    );
  });
});
