import { Board } from "./grid.js";

/**
 * A level is plain data:
 *   { id, title, hint, width, height, devices: PlacedSpec[], inventory: {slash, backslash} }
 * where PlacedSpec is { x, y, device }.
 */

/** Build a fresh Board from a level's static devices (excludes player mirrors). */
export function buildBoard(level) {
  const board = new Board(level.width, level.height);
  for (const spec of level.devices) {
    // Clone so simulation/placement never mutates the level definition.
    board.set(spec.x, spec.y, { ...spec.device });
  }
  return board;
}
