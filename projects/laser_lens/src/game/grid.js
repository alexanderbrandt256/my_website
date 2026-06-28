import { cellKey } from "./types.js";

/** A mutable grid of devices keyed by cell. Shared by the simulation,
 *  the renderer and the input layer as the single source of board truth. */
export class Board {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    /** @type {Map<string, object>} */
    this.cells = new Map();
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  deviceAt(x, y) {
    return this.cells.get(cellKey(x, y)) ?? null;
  }

  set(x, y, device) {
    this.cells.set(cellKey(x, y), device);
  }

  remove(x, y) {
    this.cells.delete(cellKey(x, y));
  }

  isEmpty(x, y) {
    return !this.cells.has(cellKey(x, y));
  }

  /** All occupied cells, for rendering / scanning. */
  entries() {
    const out = [];
    for (const [key, device] of this.cells) {
      const [x, y] = key.split(",").map(Number);
      out.push({ x, y, device });
    }
    return out;
  }
}
