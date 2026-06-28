// ---- Small builders to keep level data readable ----
const emitter = (x, y, dir, color) => ({ x, y, device: { kind: "emitter", dir, color } });
const goal = (x, y, color) => ({ x, y, device: { kind: "goal", color } });
const wall = (x, y) => ({ x, y, device: { kind: "wall" } });
const walls = (...cells) => cells.map(([x, y]) => wall(x, y));

export const LEVELS = [
  // 1 — single deflection. One "/" mirror bends the beam up into the crystal.
  {
    id: 1,
    title: "First Light",
    hint: "Drag the mirror onto the beam's path to bend it up into the crystal, then press Fire!",
    width: 9,
    height: 7,
    devices: [emitter(0, 5, "E", "green"), goal(6, 1, "green")],
    inventory: { slash: 1, backslash: 0 },
  },

  // 2 — two mirrors form an S-bend (down, then across).
  {
    id: 2,
    title: "Around the Bend",
    hint: "Use two mirrors to step the beam down and across to the crystal.",
    width: 9,
    height: 7,
    devices: [emitter(0, 1, "E", "cyan"), goal(8, 5, "cyan")],
    inventory: { slash: 0, backslash: 2 },
  },

  // 3 — a wall blocks the straight shot; detour up and over it.
  {
    id: 3,
    title: "Obstruction",
    hint: "A wall blocks the direct path. Route the beam over it and back down.",
    width: 9,
    height: 7,
    devices: [emitter(0, 3, "E", "green"), goal(8, 3, "green"), wall(4, 3)],
    inventory: { slash: 2, backslash: 2 },
  },

  // 4 — a wall with a gap; thread the beam through it.
  {
    id: 4,
    title: "The Gap",
    hint: "Thread the beam down through the gap in the wall, then back up to the crystal.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 3, "E", "blue"),
      goal(8, 3, "blue"),
      ...walls([4, 0], [4, 1], [4, 2], [4, 3], [4, 4]),
    ],
    inventory: { slash: 2, backslash: 2 },
  },

  // 5 — pass-through goals: one beam lights a column of crystals.
  {
    id: 5,
    title: "Down the Line",
    hint: "Crystals are see-through — one beam can light several in a row.",
    width: 9,
    height: 7,
    devices: [emitter(0, 1, "E", "green"), goal(5, 3, "green"), goal(5, 5, "green")],
    inventory: { slash: 0, backslash: 1 },
  },

  // 6 — two emitters, two colours, two independent routes.
  {
    id: 6,
    title: "Two Colours",
    hint: "Two emitters now. Route each colour to its matching crystal.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 1, "E", "red"),
      emitter(0, 5, "E", "green"),
      goal(4, 6, "red"),
      goal(6, 1, "green"),
    ],
    inventory: { slash: 1, backslash: 1 },
  },

  // 7 — crossing beams. Different colours pass through each other.
  {
    id: 7,
    title: "Crossfire",
    hint: "Beams of different colours pass right through each other. Match each to its colour.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 1, "E", "red"),
      emitter(3, 0, "S", "blue"),
      goal(6, 5, "red"),
      goal(8, 2, "blue"),
    ],
    inventory: { slash: 0, backslash: 2 },
  },

  // 8 — consolidation: two colours, a wall, and a crystal pair.
  {
    id: 8,
    title: "Convergence",
    hint: "Everything at once: two colours, a wall, and a pair of crystals to light together.",
    width: 10,
    height: 8,
    devices: [
      emitter(0, 2, "E", "red"),
      emitter(0, 6, "E", "blue"),
      goal(8, 4, "red"),
      goal(8, 6, "red"),
      goal(6, 4, "blue"),
      wall(4, 6),
    ],
    inventory: { slash: 2, backslash: 1 },
  },
];
