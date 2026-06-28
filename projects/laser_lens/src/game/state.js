import { simulate } from "./beam.js";
import { otherOrientation } from "./devices.js";
import { buildBoard } from "./level.js";
import { LEVELS } from "./levels.js";
import { CAMPAIGN } from "./campaign.js";

/** Total mirrors a level grants the player (orientation is set by rotating). */
export function levelMirrorCount(level) {
  return level.inventory.slash + level.inventory.backslash;
}

/** Selectable level packs shown on the main menu. */
export const PACKS = [
  {
    key: "tutorial",
    name: "Tutorial",
    subtitle: "Learn the basics: mirrors, walls & colour matching",
    levels: LEVELS,
  },
  {
    key: "campaign",
    name: "New Game",
    subtitle: "The real puzzles: filters, splitters, prisms & colour mixing",
    levels: CAMPAIGN,
  },
];

/**
 * Holds all mutable game state: the active screen ("menu" | "playing"), current
 * pack/level, board, remaining mirrors, and the play phase ("edit" | "fired" |
 * "won"). The renderer and input layer read this; the HUD subscribes via onChange.
 */
export class Game {
  constructor() {
    this.packs = PACKS;
    this.screen = "menu";
    this.pack = PACKS[0];
    this.levels = PACKS[0].levels;
    this.levelIndex = 0;
    this.score = 0;
    this.solvedLevels = new Set();
    this.onChange = () => {};
    this.load(0); // a default board so the renderer never sees undefined
  }

  /** Begin a pack from its first level. */
  startPack(key) {
    const pack = this.packs.find((p) => p.key === key) || this.packs[0];
    this.pack = pack;
    this.levels = pack.levels;
    this.score = 0;
    this.solvedLevels = new Set();
    this.screen = "playing";
    this.load(0);
    this.emit();
  }

  toMenu() {
    this.screen = "menu";
    this.emit();
  }

  load(index) {
    this.levelIndex = index;
    this.level = this.levels[index];
    this.board = buildBoard(this.level);
    this.mirrors = levelMirrorCount(this.level);
    this.phase = "edit"; // "edit" | "fired" | "won"
    this.sim = null;
    this.hover = null;
    this.drag = null;
  }

  reset() {
    this.load(this.levelIndex);
    this.emit();
  }

  next() {
    if (this.levelIndex < this.levels.length - 1) {
      this.load(this.levelIndex + 1);
      this.emit();
    } else {
      // Finished the pack — return to the main menu.
      this.toMenu();
    }
  }

  hasNext() {
    return this.levelIndex < this.levels.length - 1;
  }

  isPlacedMirror(x, y) {
    const d = this.board.deviceAt(x, y);
    return !!d && d.kind === "mirror" && !d.fixed;
  }

  /** Editing the board after a fire returns to the edit phase (clears beams). */
  toEdit() {
    if (this.phase === "fired") {
      this.phase = "edit";
      this.sim = null;
    }
  }

  placeMirror(x, y, orientation) {
    if (this.phase === "won") return false;
    if (!this.board.inBounds(x, y) || !this.board.isEmpty(x, y)) return false;
    if (this.mirrors <= 0) return false;
    this.toEdit();
    this.board.set(x, y, { kind: "mirror", orientation });
    this.mirrors--;
    this.emit();
    return true;
  }

  removeMirror(x, y) {
    if (this.phase === "won") return false;
    if (!this.isPlacedMirror(x, y)) return false;
    this.toEdit();
    this.board.remove(x, y);
    this.mirrors++;
    this.emit();
    return true;
  }

  rotateMirror(x, y) {
    if (this.phase === "won") return false;
    if (!this.isPlacedMirror(x, y)) return false;
    this.toEdit();
    const d = this.board.deviceAt(x, y);
    d.orientation = otherOrientation(d.orientation);
    this.emit();
    return true;
  }

  fire() {
    this.sim = simulate(this.board);
    // Always show "fired" first so the beam reveal plays before the banner.
    // Call confirmWin() once the animation finishes.
    this._pendingWin = this.sim.won;
    this.phase = "fired";
    if (this.sim.won && !this.solvedLevels.has(this.level.id)) {
      this.solvedLevels.add(this.level.id);
      this.score += 100;
    }
    this.emit();
    return this.sim;
  }

  /** Called by the animation loop once the beam reveal finishes. */
  confirmWin() {
    if (!this._pendingWin) return;
    this._pendingWin = false;
    this.phase = "won";
    this.emit();
  }

  emit() {
    this.onChange();
  }
}
