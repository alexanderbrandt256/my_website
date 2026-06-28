// "New Game" campaign — introduces the optical tools one at a time:
// filters (recolor), splitters (one beam -> two), prisms (white -> R/G/B), and
// combiners (additive colour mixing). Mirrors remain the player's only tool;
// the new elements are fixed field devices.

const emitter = (x, y, dir, color) => ({ x, y, device: { kind: "emitter", dir, color } });
const goal = (x, y, color) => ({ x, y, device: { kind: "goal", color } });
const wall = (x, y) => ({ x, y, device: { kind: "wall" } });
const filter = (x, y, color) => ({ x, y, device: { kind: "filter", color } });
const splitter = (x, y, orientation) => ({ x, y, device: { kind: "splitter", orientation } });
const prism = (x, y) => ({ x, y, device: { kind: "prism" } });
const combiner = (x, y, dir) => ({ x, y, device: { kind: "combiner", dir } });

export const CAMPAIGN = [
  // 1 — FILTER intro: a filter recolours the beam.
  {
    id: 1,
    title: "Tint",
    hint: "A filter recolours any beam passing through it. The red beam turns blue — steer it into the blue crystal.",
    width: 9,
    height: 7,
    devices: [emitter(0, 3, "E", "red"), filter(4, 3, "blue"), goal(8, 1, "blue")],
    inventory: { slash: 1, backslash: 0 },
  },

  // 2 — FILTER, with routing through it.
  {
    id: 2,
    title: "Dye Works",
    hint: "Send the green beam down through the red filter, then across to the red crystal.",
    width: 9,
    height: 7,
    devices: [emitter(0, 1, "E", "green"), filter(4, 4, "red"), goal(8, 5, "red")],
    inventory: { slash: 0, backslash: 2 },
  },

  // 3 — SPLITTER intro: one beam becomes two.
  {
    id: 3,
    title: "Fork",
    hint: "A splitter sends the beam two ways at once — straight on and reflected. Light both crystals.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 3, "E", "green"),
      splitter(4, 3, "slash"),
      goal(8, 3, "green"),
      goal(8, 0, "green"),
    ],
    inventory: { slash: 1, backslash: 0 },
  },

  // 4 — SPLITTER + mirrors steer both branches.
  {
    id: 4,
    title: "Branches",
    hint: "Split the beam, then steer each branch to its own crystal.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 5, "E", "green"),
      splitter(3, 5, "slash"),
      goal(8, 1, "green"),
      goal(6, 6, "green"),
    ],
    inventory: { slash: 1, backslash: 1 },
  },

  // 5 — PRISM intro: white light disperses into R/G/B.
  {
    id: 5,
    title: "Dispersion",
    hint: "A prism splits white light into red, green and blue, fanned apart. Send the red beam to the red crystal.",
    width: 9,
    height: 7,
    devices: [emitter(0, 3, "E", "white"), prism(4, 3), goal(8, 1, "red")],
    inventory: { slash: 1, backslash: 0 },
  },

  // 6 — PRISM: use all three dispersed colours.
  {
    id: 6,
    title: "Full Spectrum",
    hint: "Green carries straight on, red bends up, blue bends down. Guide each to its matching crystal.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 3, "E", "white"),
      prism(4, 3),
      goal(8, 3, "green"),
      goal(8, 1, "red"),
      goal(8, 5, "blue"),
    ],
    inventory: { slash: 1, backslash: 1 },
  },

  // 7 — COMBINER intro: red + green = yellow.
  {
    id: 7,
    title: "Mixer",
    hint: "A combiner adds beams together. Feed it red and green to make yellow for the yellow crystal.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 1, "E", "red"),
      emitter(0, 5, "E", "green"),
      combiner(4, 3, "E"),
      goal(8, 3, "yellow"),
    ],
    inventory: { slash: 1, backslash: 1 },
  },

  // 8 — COMBINER: red + green + blue = white.
  {
    id: 8,
    title: "White Light",
    hint: "Red, green and blue together make white. Pour all three into the combiner.",
    width: 9,
    height: 7,
    devices: [
      emitter(0, 1, "E", "red"),
      emitter(0, 3, "E", "green"),
      emitter(0, 5, "E", "blue"),
      combiner(5, 3, "E"),
      goal(8, 3, "white"),
    ],
    inventory: { slash: 1, backslash: 1 },
  },

  // 9 — capstone: prism splits white, a combiner recombines two of the colours.
  {
    id: 9,
    title: "Spectrum Lab",
    hint: "Split the white beam, let green run to its crystal, and recombine red + blue into magenta.",
    width: 13,
    height: 11,
    devices: [
      emitter(0, 5, "E", "white"),
      prism(3, 5),
      combiner(9, 2, "E"),
      goal(12, 5, "green"),
      goal(12, 2, "magenta"),
    ],
    inventory: { slash: 2, backslash: 1 },
  },
];
