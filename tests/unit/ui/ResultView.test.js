import { describe, it, expect, beforeEach } from 'vitest';
import { injectSprite } from '../../../src/ui/icons.js';
import { ResultView } from '../../../src/ui/ResultView.js';

function mounted() {
  const view = new ResultView();
  document.body.append(view.mount());
  return view;
}

beforeEach(() => {
  document.body.innerHTML = '';
  injectSprite(document);
});

describe('ResultView', () => {
  it('is hidden before the game ends', () => {
    const view = mounted();
    view.update({ phase: 'battle', playerWon: false, scores: { player: 0, ai: 0 } });
    expect(view.root.hasAttribute('hidden')).toBe(true);
  });

  it('uses data-action="restart" so it never collides with new-game', () => {
    mounted();
    expect(document.querySelectorAll('[data-action="new-game"]')).toHaveLength(0);
    const btn = document.querySelector('[data-action="restart"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('YENİDƏN OYNA');
  });

  it('shows victory copy when the player won', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 4, ai: 2 } });

    expect(view.root.hasAttribute('hidden')).toBe(false);
    expect(view.root.dataset.outcome).toBe('victory');
    expect(view.root.querySelector('.result__title').textContent).toBe('QƏLƏBƏ');
    expect(view.root.querySelector('.result__copy').textContent)
      .toBe('Rəqib donanmasının bütün gəmiləri məhv edildi.');
    expect(view.root.querySelector('.result__eyebrow').textContent).toBe('DÖYÜŞ TAMAMLANDI');
    expect(view.root.querySelector('use').getAttribute('href')).toBe('#i-trophy');
  });

  it('shows defeat copy when the AI won', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: false, scores: { player: 2, ai: 4 } });

    expect(view.root.dataset.outcome).toBe('defeat');
    expect(view.root.querySelector('.result__title').textContent).toBe('MƏĞLUBİYYƏT');
    expect(view.root.querySelector('.result__copy').textContent)
      .toBe('Bütün gəmiləriniz məhv edildi.');
    expect(view.root.querySelector('use').getAttribute('href')).toBe('#i-skull');
  });

  it('renders the score in player—ai order', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 4, ai: 2 } });
    expect(view.root.querySelector('.result__score').textContent).toBe('4 — 2');
  });

  it('hides again after a restart back to placement', () => {
    const view = mounted();
    view.update({ phase: 'gameover', playerWon: true, scores: { player: 1, ai: 0 } });
    view.update({ phase: 'placement', playerWon: false, scores: { player: 1, ai: 0 } });
    expect(view.root.hasAttribute('hidden')).toBe(true);
  });
});
