// Named beam colors. Primaries plus the additive mixes (reserved for later
// prism/combiner elements — the engine already carries color per beam).

export const COLORS = {
  red: { core: "#ff5a6e", rgb: "255,90,110" },
  green: { core: "#49f08a", rgb: "73,240,138" },
  blue: { core: "#4aa8ff", rgb: "74,168,255" },
  yellow: { core: "#ffe05a", rgb: "255,224,90" },
  cyan: { core: "#43f5e6", rgb: "67,245,230" },
  magenta: { core: "#ff5ad8", rgb: "255,90,216" },
  white: { core: "#f3f6ff", rgb: "243,246,255" },
};

export function colorCore(c) {
  return COLORS[c].core;
}

export function colorGlow(c, alpha) {
  return `rgba(${COLORS[c].rgb},${alpha})`;
}

// ---- Additive mixing (reserved for prisms / combiners; not used in MVP) ----

const MIX = {
  "red+green": "yellow",
  "green+red": "yellow",
  "red+blue": "magenta",
  "blue+red": "magenta",
  "green+blue": "cyan",
  "blue+green": "cyan",
};

/** Additively combine two beam colors, e.g. red + green -> yellow. */
export function mixColors(a, b) {
  if (a === b) return a;
  return MIX[`${a}+${b}`] ?? "white";
}

/** Additively combine many colors. Distinct primaries: R+G=yellow, R+B=magenta,
 *  G+B=cyan, R+G+B=white. Pass distinct colors (e.g. from a Set). */
export function mixMany(colors) {
  if (colors.length === 0) return "white";
  return colors.reduce((acc, c) => mixColors(acc, c));
}
