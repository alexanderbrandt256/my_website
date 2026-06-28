// Geometry + shared constants for the laser engine.
//
// Devices are plain objects identified by a `kind` field:
//   { kind: "mirror", orientation: "slash" | "backslash", fixed?: boolean }
//   { kind: "wall" }
//   { kind: "emitter", dir: Direction, color: Color }
//   { kind: "goal", color: Color }
//
// Direction is one of "N" | "E" | "S" | "W".

/** Unit step vector for each direction (y grows downward, screen coords). */
export const DIRV = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

/** Key helper for cell-indexed sets/maps. */
export function cellKey(x, y) {
  return `${x},${y}`;
}

/** Rotate a direction 90° clockwise (N→E→S→W→N). */
export function rotateCW(dir) {
  return { N: "E", E: "S", S: "W", W: "N" }[dir];
}

/** Rotate a direction 90° counter-clockwise (N→W→S→E→N). */
export function rotateCCW(dir) {
  return { N: "W", W: "S", S: "E", E: "N" }[dir];
}
