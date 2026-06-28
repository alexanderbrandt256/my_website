import { Game } from "./game/state.js";
import { Renderer } from "./render/renderer.js";
import { Hud } from "./ui/hud.js";
import { Input } from "./ui/input.js";

const FIRE_REVEAL_MS = 360;

const els = {
  canvas: document.getElementById("field"),
  stage: document.getElementById("stage"),
  overlay: document.getElementById("overlay"),
  inventory: document.getElementById("inventory"),
  hint: document.getElementById("hint"),
  roundLabel: document.getElementById("round-label"),
  scoreValue: document.getElementById("score-value"),
  menu: document.getElementById("menu"),
  menuPacks: document.getElementById("menu-packs"),
  btnMenu: document.getElementById("btn-menu"),
  btnFire: document.getElementById("btn-fire"),
  btnReset: document.getElementById("btn-reset"),
  btnNext: document.getElementById("btn-next"),
};

const game = new Game();
const renderer = new Renderer(els.canvas);
const hud = new Hud(game, els);
const input = new Input(game, renderer, els.canvas, els.inventory);

const anim = { time: 0, beamProgress: 1, firing: false, fireStart: 0 };

game.onChange = () => hud.render();

function layoutToBoard() {
  const rect = els.stage.getBoundingClientRect();
  renderer.fit(game.board, rect.width, rect.height);
}

let lastBoard = null;
function frame(now) {
  anim.time = now;
  if (game.screen !== "playing") {
    requestAnimationFrame(frame); // menu is pure DOM; skip canvas work
    return;
  }
  if (game.board !== lastBoard) {
    lastBoard = game.board;
    layoutToBoard();
  }
  if (anim.firing) {
    anim.beamProgress = Math.min(1, (now - anim.fireStart) / FIRE_REVEAL_MS);
    if (anim.beamProgress >= 1) {
      anim.firing = false;
      game.confirmWin(); // show banner only once beams have fully drawn
    }
  }
  renderer.render(game, anim);
  requestAnimationFrame(frame);
}

function fire() {
  if (game.screen !== "playing" || game.phase === "won") return;
  game.fire();
  anim.firing = true;
  anim.fireStart = performance.now();
  anim.beamProgress = 0;
}

els.btnFire.addEventListener("click", fire);
els.btnReset.addEventListener("click", () => game.reset());
els.btnNext.addEventListener("click", () => game.next());
els.btnMenu.addEventListener("click", () => game.toMenu());

window.addEventListener("keydown", (e) => {
  if (game.screen !== "playing") return;
  if (e.code === "Space" || e.key === "Enter") {
    if (game.phase === "won" || game._pendingWin) game.next();
    else if (!els.btnFire.disabled) fire();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "r") {
    game.reset();
  } else if (e.key === "Escape") {
    game.toMenu();
  }
});

window.addEventListener("resize", layoutToBoard);

input.init();
hud.render();
layoutToBoard();
requestAnimationFrame(frame);

// Debug hooks (handy for inspecting state from the console).
window.__game = game;
window.__fire = fire;
window.__renderer = renderer;
