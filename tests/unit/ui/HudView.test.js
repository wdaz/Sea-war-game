import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite } from '../../../src/ui/icons.js';
import { HudView, PHASE_LABEL, EYEBROW } from '../../../src/ui/HudView.js';

function mounted() {
  const hud = new HudView();
  document.body.append(
    hud.mountHeader(),
    hud.mountOperations(),
    hud.mountStatusBar(),
    hud.mountLegend(),
  );
  return hud;
}

const BASE = {
  phase: 'placement',
  scores: { player: 0, ai: 0 },
  nextShipSize: 4,
  shipsRemaining: 10,
  direction: 'horizontal',
  message: '',
  tone: 'neutral',
};

beforeEach(() => {
  document.body.innerHTML = '';
  injectSprite(document);
});

describe('HudView contract selectors', () => {
  it('renders every pinned selector', () => {
    mounted();
    expect(document.querySelector('[data-score="player"]')).not.toBeNull();
    expect(document.querySelector('[data-score="ai"]')).not.toBeNull();
    expect(document.querySelector('[data-action="new-game"]')).not.toBeNull();
    expect(document.querySelector('[data-action="rotate"]')).not.toBeNull();
    expect(document.querySelector('[data-action="auto-place"]')).not.toBeNull();
    expect(document.querySelector('[data-controls="placement"]')).not.toBeNull();
    expect(document.querySelector('[data-message]')).not.toBeNull();
  });

  it('announces the message region politely', () => {
    mounted();
    expect(document.querySelector('[data-message]').getAttribute('aria-live')).toBe('polite');
  });

  it('exposes exactly one new-game action', () => {
    mounted();
    expect(document.querySelectorAll('[data-action="new-game"]')).toHaveLength(1);
  });
});

describe('HudView.update', () => {
  it('writes the phase label for each phase', () => {
    const hud = mounted();
    for (const phase of ['placement', 'battle', 'gameover']) {
      hud.update({ ...BASE, phase });
      expect(document.querySelector('.phase__label').textContent).toBe(PHASE_LABEL[phase]);
    }
  });

  it('writes the eyebrow for each phase', () => {
    const hud = mounted();
    for (const phase of ['placement', 'battle', 'gameover']) {
      hud.update({ ...BASE, phase });
      expect(document.querySelector('.statusbar__eyebrow').textContent).toBe(EYEBROW[phase]);
    }
  });

  it('writes scores as text', () => {
    const hud = mounted();
    hud.update({ ...BASE, scores: { player: 3, ai: 2 } });
    expect(document.querySelector('[data-score="player"]').textContent).toBe('3');
    expect(document.querySelector('[data-score="ai"]').textContent).toBe('2');
  });

  it('describes the next ship and remaining fleet', () => {
    const hud = mounted();
    hud.update({ ...BASE, nextShipSize: 3, shipsRemaining: 7 });
    expect(document.querySelector('.ops__size').textContent).toBe('3 XANALI');
    expect(document.querySelector('.ops__left').textContent).toBe('· 7 GƏMİ QALIB');
  });

  it('hides the fleet block when no ship is left to place', () => {
    const hud = mounted();
    hud.update({ ...BASE, nextShipSize: undefined, shipsRemaining: 0 });
    expect(document.querySelector('.ops__size').textContent).toBe('');
  });

  it('shows the orientation chip in Azerbaijani', () => {
    const hud = mounted();
    hud.update({ ...BASE, direction: 'horizontal' });
    expect(document.querySelector('.chip__text').textContent).toBe('ÜFÜQİ · R');
    hud.update({ ...BASE, direction: 'vertical' });
    expect(document.querySelector('.chip__text').textContent).toBe('ŞAQULİ · R');
  });

  it('writes the message and tone', () => {
    const hud = mounted();
    hud.update({ ...BASE, message: 'Buraya yerləşdirilə bilməz!', tone: 'danger' });
    expect(document.querySelector('[data-message]').textContent).toBe('Buraya yerləşdirilə bilməz!');
    expect(document.querySelector('.statusbar').dataset.tone).toBe('danger');
  });

  it('lists the three shipped legend entries', () => {
    mounted();
    const labels = [...document.querySelectorAll('.legend__label')].map((n) => n.textContent);
    expect(labels).toEqual(['GƏMİ', 'VURULDU', 'YAN KEÇDİ']);
  });
});
