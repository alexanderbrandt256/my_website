import { mixMany } from "./color.js";
import { interact } from "./devices.js";
import { cellKey, DIRV } from "./types.js";

/**
 * A drawable beam piece, in cell coordinates (cell centres are integer x/y):
 *   { ax, ay, bx, by, color }
 *
 * Simulation result:
 *   { segments: Segment[], litGoals: Set<string>, allGoals: Set<string>, won: boolean }
 */

/**
 * Pure ray-march. Starts a beam from every emitter, steps cell-to-cell, lets
 * each device it enters route it (via `interact`), and records segments plus
 * which goals got lit. Cycle detection on (cell, dir, colour) guards against
 * mirror loops.
 *
 * Combiners are special: they *absorb* every beam that enters and, once the
 * normal propagation settles, emit a single beam of the additive mix out their
 * fixed direction. This runs to a fixed point so chains of combiners resolve.
 *
 * @param {import("./grid.js").Board} board
 */
export function simulate(board) {
  const segments = [];
  const litGoals = new Set();
  const allGoals = new Set();
  /** combiner cell key -> { colors:Set<string>, t:number } */
  const combinerInputs = new Map();
  /** combiner cell key -> last emitted mix (to detect change / avoid re-emit loops) */
  const combinerEmitted = new Map();

  const queue = [];
  for (const { x, y, device } of board.entries()) {
    if (device.kind === "goal") allGoals.add(cellKey(x, y));
    if (device.kind === "emitter") {
      queue.push({ x, y, dir: device.dir, color: device.color, t: 0 });
    }
  }

  const visited = new Set();
  let maxT = 0;

  function faceSegment(head, v) {
    segments.push({
      ax: head.x,
      ay: head.y,
      bx: head.x + v.x * 0.5,
      by: head.y + v.y * 0.5,
      color: head.color,
      t: head.t,
    });
  }

  function drain() {
    while (queue.length > 0) {
      const head = queue.pop();
      const stateKey = `${head.x},${head.y},${head.dir},${head.color}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);
      if (head.t > maxT) maxT = head.t;

      const v = DIRV[head.dir];
      const nx = head.x + v.x;
      const ny = head.y + v.y;

      // Off the board: draw to the boundary face and stop.
      if (!board.inBounds(nx, ny)) {
        faceSegment(head, v);
        continue;
      }

      const device = board.deviceAt(nx, ny);

      if (!device) {
        // Empty cell: travel through to its centre and keep going.
        segments.push({ ax: head.x, ay: head.y, bx: nx, by: ny, color: head.color, t: head.t });
        queue.push({ x: nx, y: ny, dir: head.dir, color: head.color, t: head.t + 1 });
        continue;
      }

      // Combiner: absorb the beam (draw into its centre) and accumulate colour.
      if (device.kind === "combiner") {
        segments.push({ ax: head.x, ay: head.y, bx: nx, by: ny, color: head.color, t: head.t });
        const key = cellKey(nx, ny);
        let entry = combinerInputs.get(key);
        if (!entry) {
          entry = { colors: new Set(), t: 0 };
          combinerInputs.set(key, entry);
        }
        entry.colors.add(head.color);
        if (head.t > entry.t) entry.t = head.t;
        continue;
      }

      const result = interact(device, { dir: head.dir, color: head.color });

      if (result.solid) {
        faceSegment(head, v);
        continue;
      }

      // Beam enters the device cell; draw to its centre.
      segments.push({ ax: head.x, ay: head.y, bx: nx, by: ny, color: head.color, t: head.t });

      if (device.kind === "goal" && device.color === head.color) {
        litGoals.add(cellKey(nx, ny));
      }

      for (const out of result.out) {
        queue.push({ x: nx, y: ny, dir: out.dir, color: out.color, t: head.t + 1 });
      }
    }
  }

  drain();

  // Fixed point: combiners emit their mixed beam, which may feed further beams
  // (and other combiners). Colours are finite, so this converges.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [key, entry] of combinerInputs) {
      const mixed = mixMany([...entry.colors]);
      if (combinerEmitted.get(key) === mixed) continue;
      combinerEmitted.set(key, mixed);
      changed = true;
      const [cx, cy] = key.split(",").map(Number);
      const dir = board.deviceAt(cx, cy).dir;
      queue.push({ x: cx, y: cy, dir, color: mixed, t: entry.t + 1 });
    }
    if (changed) drain();
  }

  const won = allGoals.size > 0 && litGoals.size === allGoals.size;
  return { segments, litGoals, allGoals, won, maxT };
}
