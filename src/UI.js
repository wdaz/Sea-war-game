import { SHIP_SIZES } from './Board.js';
import { el } from './ui/dom.js';
import { injectSprite } from './ui/icons.js';
import { boardStates } from './ui/cellState.js';
import { BoardView } from './ui/BoardView.js';
import { HudView } from './ui/HudView.js';
import { ResultView } from './ui/ResultView.js';

export function boardStatus(phase, side, { playerWon, shipsAlive }) {
  if (phase === 'placement') {
    return side === 'player'
      ? { text: 'AKTİV', icon: 'radio-tower', tone: 'cyan' }
      : { text: 'KİLİDLİ', icon: 'lock', tone: 'muted' };
  }
  if (phase === 'battle') {
    return side === 'player'
      ? { text: 'MÜDAFİƏ', icon: 'shield', tone: 'muted' }
      : { text: 'HƏDƏF AKTİVDİR', icon: 'crosshair', tone: 'cyan' };
  }
  if (side === 'player') {
    return { text: `QALDI: ${shipsAlive}`, icon: 'shield-check', tone: 'muted' };
  }
  return playerWon
    ? { text: 'MƏHV EDİLDİ', icon: 'skull', tone: 'danger' }
    : { text: `QALDI: ${shipsAlive}`, icon: 'shield', tone: 'muted' };
}

function shipsAlive(board) {
  return board.ships.filter((s) => !s.isSunk()).length;
}

export class UI {
  constructor(game) {
    this.game = game;
    this.message = '';
    this.tone = 'neutral';
    this.hud = new HudView();
    this.result = new ResultView();
    this.boards = {
      player: new BoardView({ side: 'player', title: 'SƏNİN DONANMAN' }),
      ai: new BoardView({ side: 'ai', title: 'RƏQİB SULARI' }),
    };
  }

  mount(root = document.getElementById('app')) {
    if (!root) throw new Error('BattleShip: #app not found');

    injectSprite(document);

    this.gameEl = el('main', {
      className: 'game',
      dataset: { phase: this.game.phase },
    },
      el('div', { className: 'boards' },
        this.boards.player.mount(),
        this.boards.ai.mount()),
      this.hud.mountOperations(),
      this.hud.mountStatusBar(),
      this.hud.mountLegend(),
    );

    root.append(this.hud.mountHeader(), this.gameEl, this.result.mount());

    this._bindStaticEvents();
    this._bindBoardEvents();
  }

  _bindStaticEvents() {
    const restart = () => {
      this.game.restart();
      this.message = '';
      this.tone = 'neutral';
      this.render();
    };

    this.hud.header.querySelector('[data-action="new-game"]')
      .addEventListener('click', restart);
    this.result.root.querySelector('[data-action="restart"]')
      .addEventListener('click', restart);

    this.hud.operations.querySelector('[data-action="rotate"]')
      .addEventListener('click', () => this._rotate());

    this.hud.operations.querySelector('[data-action="auto-place"]')
      .addEventListener('click', () => {
        this.game.autoPlacePlayer();
        this.render();
      });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') this._rotate();
    });
  }

  _rotate() {
    this.game.toggleDirection();
    this._setMessage(
      this.game.placementDirection === 'horizontal'
        ? 'İstiqamət: Üfüqi'
        : 'İstiqamət: Şaquli',
    );
    this.render();
  }

  _bindBoardEvents() {
    const playerBoard = this.boards.player.board;
    const aiBoard = this.boards.ai.board;

    playerBoard.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'placement') return;
      this._handlePlacement(Number(cell.dataset.index));
    });

    playerBoard.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'placement') return;
      this._showPreview(Number(cell.dataset.index));
    });

    playerBoard.addEventListener('mouseleave', () => {
      this.boards.player.clearPreview();
    });

    aiBoard.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.game.phase !== 'battle') return;
      this._handleAttack(Number(cell.dataset.index));
    });
  }

  render() {
    const { phase, scores } = this.game;
    const playerWon = this.game.aiBoard.allSunk();

    this.gameEl.dataset.phase = phase;

    this.boards.player.update({
      states: boardStates(this.game.playerBoard, false),
      status: boardStatus(phase, 'player', {
        playerWon,
        shipsAlive: shipsAlive(this.game.playerBoard),
      }),
    });

    this.boards.ai.update({
      states: boardStates(this.game.aiBoard, true),
      status: boardStatus(phase, 'ai', {
        playerWon,
        shipsAlive: shipsAlive(this.game.aiBoard),
      }),
    });

    this.boards.player.setInteractive(phase === 'placement');
    this.boards.ai.setInteractive(phase === 'battle');

    this.hud.update({
      phase,
      scores,
      nextShipSize: SHIP_SIZES[this.game.currentShipIndex],
      shipsRemaining: SHIP_SIZES.length - this.game.currentShipIndex,
      direction: this.game.placementDirection,
      message: this.message,
      tone: this.tone,
    });

    this.result.update({ phase, playerWon, scores });
  }

  _setMessage(text, tone = 'neutral') {
    this.message = text;
    this.tone = tone;
  }

  _handlePlacement(index) {
    if (!this.game.placePlayerShip(index)) {
      this._setMessage('Buraya yerləşdirilə bilməz!', 'danger');
      this.render();
      return;
    }

    this.boards.player.clearPreview();

    if (this.game.phase === 'battle') {
      this._setMessage('Bütün gəmilər yerləşdirildi. Döyüş başlayır!');
    } else {
      const size = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._setMessage(`${size} xanalı gəmini yerləşdir (qalan: ${remaining})`);
    }
    this.render();
  }

  _handleAttack(index) {
    const result = this.game.playerAttack(index);
    if (!result || result.player === 'already-attacked') {
      this._setMessage('Bu xanaya artıq hücum edilib!', 'danger');
      this.render();
      return;
    }

    if (result.winner === 'player') {
      this._setMessage('Təbrik edirik! Siz qalibisiniz! 🎉');
    } else if (result.winner === 'ai') {
      this._setMessage('AI qazandı. Yenidən cəhd edin!', 'danger');
    } else {
      const playerMsg = result.player === 'hit' ? 'Vuruldu!' : 'Keçdi.';
      const aiMsg = result.ai === 'hit' ? 'AI vurdu!' : 'AI keçdi.';
      this._setMessage(`${playerMsg} ${aiMsg}`);
    }
    this.render();
  }

  _showPreview(index) {
    const size = SHIP_SIZES[this.game.currentShipIndex];
    if (!size) return;

    const isHorizontal = this.game.placementDirection === 'horizontal';
    const targetRow = Math.floor(index / 10);
    const cells = [];
    let isValid = true;

    for (let i = 0; i < size; i++) {
      const ci = isHorizontal ? index + i : index + i * 10;
      if (ci > 99 || (isHorizontal && Math.floor(ci / 10) !== targetRow)) {
        isValid = false;
        break;
      }
      cells.push(ci);
      if (this.game.playerBoard._isOccupiedOrAdjacent(ci)) isValid = false;
    }

    if (cells.length !== size) isValid = false;

    this.boards.player.setPreview(cells, isValid);
  }
}
