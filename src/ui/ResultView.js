import { el } from './dom.js';
import { icon } from './icons.js';

const OUTCOME = {
  victory: {
    icon: 'trophy',
    eyebrow: 'DÖYÜŞ TAMAMLANDI',
    title: 'QƏLƏBƏ',
    copy: 'Rəqib donanmasının bütün gəmiləri məhv edildi.',
  },
  defeat: {
    icon: 'skull',
    eyebrow: 'DÖYÜŞ TAMAMLANDI',
    title: 'MƏĞLUBİYYƏT',
    copy: 'Bütün gəmiləriniz məhv edildi.',
  },
};

export class ResultView {
  mount() {
    this.iconEl = icon('trophy', 'result__icon');
    this.eyebrowEl = el('span', { className: 'eyebrow result__eyebrow' });
    this.titleEl = el('h2', { className: 'result__title' });
    this.copyEl = el('p', { className: 'result__copy' });
    this.scoreEl = el('p', { className: 'result__score' });

    this.root = el('div', {
      className: 'result',
      dataset: { outcome: 'victory' },
      attrs: { hidden: '' },
    },
      el('div', { className: 'result__scrim' }),
      el('section', {
        className: 'result__panel',
        attrs: { role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'result-title' },
      },
        el('span', { className: 'result__badge' }, this.iconEl),
        this.eyebrowEl,
        this.titleEl,
        this.copyEl,
        this.scoreEl,
        el('button', {
          className: 'btn btn--primary',
          dataset: { action: 'restart' },
          attrs: { type: 'button' },
        }, icon('refresh-cw', 'btn__icon'), el('span', { text: 'YENİDƏN OYNA' }))),
    );

    this.titleEl.id = 'result-title';
    return this.root;
  }

  update({ phase, playerWon, scores }) {
    if (phase !== 'gameover') {
      this.root.setAttribute('hidden', '');
      return;
    }

    const key = playerWon ? 'victory' : 'defeat';
    const copy = OUTCOME[key];

    this.root.dataset.outcome = key;
    this.iconEl.querySelector('use').setAttribute('href', `#i-${copy.icon}`);
    this.eyebrowEl.textContent = copy.eyebrow;
    this.titleEl.textContent = copy.title;
    this.copyEl.textContent = copy.copy;
    this.scoreEl.textContent = `${scores.player} — ${scores.ai}`;
    this.root.removeAttribute('hidden');
  }
}
