import { Game } from './Game.js';
import { UI } from './UI.js';

const game = new Game();
const ui = new UI(game);
game.start();
ui.render();
