import { el } from './dom.js';
import { icon } from './icons.js';

export const PHASE_LABEL = {
  placement: 'DONANMANI YERLƏŞDİR',
  battle: 'DÖYÜŞ',
  gameover: 'NƏTİCƏ',
};

export const EYEBROW = {
  placement: 'YERLƏŞDİRMƏ',
  battle: 'SON GEDİŞ',
  gameover: 'NƏTİCƏ',
};

const STATUS_ICON = {
  placement: 'crosshair',
  battle: 'radar',
  gameover: 'trophy',
};

const LEGEND = [
  { icon: 'ship', label: 'GƏMİ', tone: 'muted' },
  { icon: 'circle-dot', label: 'VURULDU', tone: 'danger' },
  { icon: 'circle', label: 'YAN KEÇDİ', tone: 'cyan' },
];

function button(action, iconName, label, variant) {
  return el('button', {
    className: `btn btn--${variant}`,
    dataset: { action },
    attrs: { type: 'button' },
  }, icon(iconName, 'btn__icon'), el('span', { text: label }));
}

export class HudView {
  mountHeader() {
    this.phaseLabelEl = el('span', { className: 'phase__label' });
    this.scoreEls = {
      player: el('b', { className: 'score__value', dataset: { score: 'player' }, text: '0' }),
      ai: el('b', { className: 'score__value', dataset: { score: 'ai' }, text: '0' }),
    };

    this.header = el('header', { className: 'cmd' },
      el('div', { className: 'cmd__brand' },
        icon('radar', 'cmd__logo'),
        el('span', { className: 'cmd__wordmark', text: 'BATTLESHIP' })),
      el('p', { className: 'phase' },
        el('span', { className: 'phase__dot' }),
        this.phaseLabelEl),
      el('div', { className: 'cmd__right' },
        el('p', { className: 'score' },
          this.scoreEls.player,
          el('span', { className: 'score__sep', text: '—' }),
          this.scoreEls.ai),
        button('new-game', 'refresh-cw', 'YENİ OYUN', 'ghost')),
    );

    return this.header;
  }

  mountOperations() {
    this.sizeEl = el('b', { className: 'ops__size' });
    this.leftEl = el('span', { className: 'ops__left' });
    this.chipEl = el('span', { className: 'chip__text' });

    this.operations = el('div', {
      className: 'ops',
      dataset: { controls: 'placement' },
    },
      el('div', { className: 'ops__fleet' },
        el('span', { className: 'eyebrow', text: 'NÖVBƏTİ GƏMİ' }),
        el('span', { className: 'ops__ship' },
          icon('ship', 'ops__icon'), this.sizeEl, this.leftEl)),
      el('p', { className: 'chip' }, icon('rotate-cw', 'chip__icon'), this.chipEl),
      el('div', { className: 'ops__actions' },
        button('rotate', 'rotate-cw', 'FIRLAT', 'secondary'),
        button('auto-place', 'wand-sparkles', 'AVTOMATİK YERLƏŞDİR', 'primary')),
    );

    return this.operations;
  }

  mountStatusBar() {
    this.eyebrowEl = el('span', { className: 'eyebrow statusbar__eyebrow' });
    this.messageEl = el('p', {
      className: 'statusbar__msg',
      dataset: { message: '' },
      attrs: { 'aria-live': 'polite' },
    });
    this.statusIcon = icon('crosshair', 'statusbar__icon');

    this.statusBar = el('div', {
      className: 'statusbar',
      dataset: { tone: 'neutral' },
    },
      el('span', { className: 'statusbar__badge' }, this.statusIcon),
      el('div', { className: 'statusbar__copy' }, this.eyebrowEl, this.messageEl),
    );

    return this.statusBar;
  }

  mountLegend() {
    this.legend = el('ul', { className: 'legend' },
      ...LEGEND.map((entry) => el('li', {
        className: 'legend__item',
        dataset: { tone: entry.tone },
      }, icon(entry.icon, 'legend__icon'),
        el('span', { className: 'legend__label', text: entry.label }))),
    );

    return this.legend;
  }

  update({ phase, scores, nextShipSize, shipsRemaining, direction, message, tone }) {
    this.phaseLabelEl.textContent = PHASE_LABEL[phase];
    this.eyebrowEl.textContent = EYEBROW[phase];
    this.statusIcon.querySelector('use').setAttribute('href', `#i-${STATUS_ICON[phase]}`);

    this.scoreEls.player.textContent = String(scores.player);
    this.scoreEls.ai.textContent = String(scores.ai);

    this.sizeEl.textContent = nextShipSize ? `${nextShipSize} XANALI` : '';
    this.leftEl.textContent = shipsRemaining > 0 ? `· ${shipsRemaining} GƏMİ QALIB` : '';

    this.chipEl.textContent = direction === 'horizontal' ? 'ÜFÜQİ · R' : 'ŞAQULİ · R';

    this.messageEl.textContent = message;
    this.statusBar.dataset.tone = tone;
  }
}
