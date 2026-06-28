// Canvas palette + sizing. Mirrors the CSS neon theme so the field blends with
// the surrounding HUD.

export const THEME = {
  // Board surface
  boardBg: "#0a0e1a",
  cellFill: "#10162a",
  cellFillAlt: "#0d1322",
  cellInset: "rgba(255,255,255,0.025)",
  gridLine: "rgba(120,150,220,0.10)",
  cellHover: "rgba(54,241,205,0.14)",
  cellHoverEdge: "rgba(54,241,205,0.55)",
  cellBlocked: "rgba(255,90,110,0.16)",

  // Walls
  wallTop: "#39456e",
  wallBottom: "#222a45",
  wallEdge: "#4a578a",

  // Mirror
  mirrorGlass: "#dff3ff",
  mirrorEdge: "rgba(180,220,255,0.9)",
  mirrorBack: "rgba(120,150,200,0.35)",

  // Emitter body
  emitterBody: "#2a3252",
  emitterBodyHi: "#3c466e",
  emitterRim: "rgba(160,180,230,0.5)",

  // Crystal outline when unlit
  crystalUnlit: "rgba(150,170,220,0.45)",
  crystalUnlitFill: "rgba(40,50,80,0.55)",

  // Layout
  padding: 18,
  minCell: 30,
  maxCell: 78,
};

/** Compute a layout (cell size + origin) that fits `board` inside maxW x maxH px. */
export function computeLayout(board, maxW, maxH) {
  const pad = THEME.padding;
  const availW = maxW - pad * 2;
  const availH = maxH - pad * 2;
  let cell = Math.floor(Math.min(availW / board.width, availH / board.height));
  cell = Math.max(THEME.minCell, Math.min(THEME.maxCell, cell));
  const w = cell * board.width + pad * 2;
  const h = cell * board.height + pad * 2;
  return { cell, pad, w, h };
}
