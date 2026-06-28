// Device behaviour: reflection and the single beam-routing extension point.
import { rotateCW, rotateCCW } from "./types.js";

/** Reflect a travel direction off a 45° mirror.
 *  slash "/":      E<->N, W<->S
 *  backslash "\":  E<->S, W<->N
 */
export function reflect(orientation, dir) {
  if (orientation === "slash") {
    switch (dir) {
      case "E": return "N";
      case "N": return "E";
      case "W": return "S";
      case "S": return "W";
    }
  } else {
    switch (dir) {
      case "E": return "S";
      case "S": return "E";
      case "W": return "N";
      case "N": return "W";
    }
  }
  return dir;
}

export function otherOrientation(o) {
  return o === "slash" ? "backslash" : "slash";
}

/**
 * The single extension point for beam routing. Every device decides what a beam
 * entering its cell does, returning:
 *   { out: BeamState[], solid: boolean }
 * where `out` are the beams leaving the cell's centre (empty = beam ends here)
 * and `solid` marks opaque bodies that stop the beam at the entry face.
 *
 * New elements (prisms split 1->many, filters recolor, lenses deflect) are added
 * here without touching the simulation loop.
 */
export function interact(device, incoming) {
  switch (device.kind) {
    case "mirror":
      return {
        out: [{ dir: reflect(device.orientation, incoming.dir), color: incoming.color }],
        solid: false,
      };
    case "goal":
      // Pass-through: the beam continues unchanged. Whether it *lights* the
      // crystal (colour match) is decided by the simulation.
      return { out: [{ dir: incoming.dir, color: incoming.color }], solid: false };
    case "filter":
      // Recolours any beam passing through to the filter's colour.
      return { out: [{ dir: incoming.dir, color: device.color }], solid: false };
    case "splitter":
      // Half-silvered mirror: the beam both passes straight through AND reflects.
      return {
        out: [
          { dir: incoming.dir, color: incoming.color },
          { dir: reflect(device.orientation, incoming.dir), color: incoming.color },
        ],
        solid: false,
      };
    case "prism":
      // Disperses a white beam into red/green/blue fanned apart; green carries
      // straight on, red bends one way, blue the other. Coloured beams pass through.
      if (incoming.color === "white") {
        return {
          out: [
            { dir: incoming.dir, color: "green" },
            { dir: rotateCCW(incoming.dir), color: "red" },
            { dir: rotateCW(incoming.dir), color: "blue" },
          ],
          solid: false,
        };
      }
      return { out: [{ dir: incoming.dir, color: incoming.color }], solid: false };
    case "wall":
    case "emitter":
    // "combiner" is handled directly by the simulation (it aggregates beams).
    default:
      return { out: [], solid: true };
  }
}
