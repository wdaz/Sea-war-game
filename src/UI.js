import { SHIP_SIZES } from './Board.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.gameEl      = document.querySelector('[data-phase]');
    this.playerBoard = document.querySelector('[data-board="player"]');
    this.aiBoard     = document.querySelector('[data-board="ai"]');
    this.message     = document.querySelector('[data-message]');
    this.scoreEls    = {
      player: document.querySelector('[data-score="player"]'),
      ai:     document.querySelector('[data-score="ai"]'),
    };
    this._bindStaticEvents();
  }

  _bindStaticEvents() {
    document.querySelector('[data-action="rotate"]').addEventListener('click', () => {
      this.game.toggleDirection();
      this._showMessage(
        this.game.placementDirection === 'horizontal' ? 'İstiqamət: Üfüqi' : 'İstiqamət: Şaquli'
      );
    });

    document.querySelector('[data-action="auto-place"]').addEventListener('click', () => {
      this.game.autoPlacePlayer();
      this.render();
    });

    document.querySelector('[data-action="new-game"]').addEventListener('click', () => {
      this.game.restart();
      this.render();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.game.toggleDirection();
      }
    });
  }

  render() {
    this._renderBoard(this.playerBoard, this.game.playerBoard, false);
    this._renderBoard(this.aiBoard,     this.game.aiBoard,     true);
    this.gameEl.dataset.phase        = this.game.phase;
    this.scoreEls.player.textContent = this.game.scores.player;
    this.scoreEls.ai.textContent     = this.game.scores.ai;
    this._updateMessage();
  }

  _renderBoard(boardEl, boardData, isAI) {
    boardEl.innerHTML = '';
    for (let i = 0; i < 100; i++) {
      const cell      = document.createElement('div');
      cell.className  = 'cell';
      cell.dataset.index = i;

      const attacked = boardData.attacked.has(i);
      const ship     = boardData.ships.find(s => s.occupies(i));

      if (attacked && ship) {
        cell.classList.add('hit');
        if (ship.isSunk()) cell.classList.add('sunk');
      } else if (attacked) {
        cell.classList.add('miss');
      } else if (!isAI && ship) {
        cell.classList.add('ship');
      }

      if (!isAI && this.game.phase === 'placement') {
        cell.addEventListener('click',      () => this._handlePlacement(i));
        cell.addEventListener('mouseenter', () => this._showPreview(i));
        cell.addEventListener('mouseleave', () => this._clearPreview());
      }

      if (isAI && this.game.phase === 'battle') {
        cell.addEventListener('click', () => this._handleAttack(i));
      }

      boardEl.appendChild(cell);
    }
  }

  _handlePlacement(index) {
    const success = this.game.placePlayerShip(index);
    if (!success) {
      this._showMessage('Buraya yerləşdirilə bilməz!');
      return;
    }
    this._clearPreview();
    this.render();
    if (this.game.phase === 'battle') {
      this._showMessage('Bütün gəmilər yerləşdirildi. Döyüş başlayır!');
    } else {
      const size      = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._showMessage(`${size} xanalı gəmini yerləşdir (qalan: ${remaining})`);
    }
  }

  _handleAttack(index) {
    const result = this.game.playerAttack(index);
    if (!result || result.player === 'already-attacked') {
      this._showMessage('Bu xanaya artıq hücum edilib!');
      return;
    }
    this.render();
    this._showResult(result);
  }

  _showResult(result) {
    if (result.winner === 'player') {
      this._showMessage('Təbrik edirik! Siz qalibisiniz! 🎉');
      return;
    }
    if (result.winner === 'ai') {
      this._showMessage('AI qazandı. Yenidən cəhd edin!');
      return;
    }
    const playerMsg = result.player === 'hit' ? 'Vuruldu!' : 'Keçdi.';
    const aiMsg     = result.ai    === 'hit' ? 'AI vurdu!'  : 'AI keçdi.';
    this._showMessage(`${playerMsg} ${aiMsg}`);
  }

  _showPreview(index) {
    if (this.game.phase !== 'placement') return;
    this._clearPreview();
    const size = SHIP_SIZES[this.game.currentShipIndex];
    if (!size) return;

    const col          = index % 10;
    const row          = Math.floor(index / 10);
    const isHorizontal = this.game.placementDirection === 'horizontal';
    const outOfBounds  = isHorizontal ? col + size > 10 : row + size > 10;

    for (let i = 0; i < size; i++) {
      const ci  = isHorizontal ? index + i : index + i * 10;
      const el  = this.playerBoard.querySelector(`[data-index="${ci}"]`);
      if (el) el.classList.add(outOfBounds ? 'preview--bad' : 'preview');
    }
  }

  _clearPreview() {
    this.playerBoard.querySelectorAll('.preview, .preview--bad').forEach(el => {
      el.classList.remove('preview', 'preview--bad');
    });
  }

  _updateMessage() {
    if (this.game.phase === 'placement') {
      const size      = SHIP_SIZES[this.game.currentShipIndex];
      const remaining = SHIP_SIZES.length - this.game.currentShipIndex;
      this._showMessage(size ? `${size} xanalı gəmini yerləşdir (qalan: ${remaining})` : '');
    }
  }

  _showMessage(text) {
    this.message.textContent = text;
  }
}
