import { colorCore, colorGlow } from "../game/color.js";
import { cellKey } from "../game/types.js";
import { computeLayout, THEME } from "./theme.js";

/** Draws the playfield: grid, devices and glowing beams onto a canvas. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.layout = { cell: 48, pad: THEME.padding, w: 0, h: 0 };
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  }

  /** Size the canvas to fit the board within the given pixel box. */
  fit(board, maxW, maxH) {
    this.layout = computeLayout(board, maxW, maxH);
    const { w, h } = this.layout;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    return this.layout;
  }

  // cell-space coordinate -> pixel (cell index i has its centre at (i+0.5)*cell)
  px(c) {
    return this.layout.pad + (c + 0.5) * this.layout.cell;
  }

  render(game, anim) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.layout.w, this.layout.h);

    this.drawBoard(game.board);
    this.drawHover(game);

    // Static bodies under the beams.
    for (const { x, y, device } of game.board.entries()) {
      if (device.kind === "wall") this.drawWall(x, y);
      else if (device.kind === "emitter") this.drawEmitter(x, y, device);
      else if (device.kind === "goal") this.drawCrystalBase(x, y, device);
      else if (device.kind === "filter") this.drawFilter(x, y, device);
    }

    // Beams.
    if (game.sim && game.phase !== "edit") this.drawBeams(game.sim, anim);

    // Beam-routing devices sit over the beams so the interaction reads correctly.
    for (const { x, y, device } of game.board.entries()) {
      if (device.kind === "mirror") this.drawMirror(x, y, device);
      else if (device.kind === "splitter") this.drawSplitter(x, y, device);
      else if (device.kind === "prism") this.drawPrism(x, y, device, anim);
      else if (device.kind === "combiner") this.drawCombiner(x, y, device, anim);
    }

    // Lit-crystal glow + emitter glow on top.
    if (game.sim && game.phase !== "edit") {
      for (const { x, y, device } of game.board.entries()) {
        if (device.kind === "goal" && game.sim.litGoals.has(cellKey(x, y))) {
          this.drawCrystalLit(x, y, device, anim);
        }
      }
    }

    // Drag ghost.
    if (game.drag) this.drawGhost(game, cell);

    ctx.restore();
  }

  drawBoard(board) {
    const ctx = this.ctx;
    const { pad, cell, w, h } = this.layout;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.fillStyle = THEME.boardBg;
    ctx.fill();

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const gx = pad + x * cell;
        const gy = pad + y * cell;
        ctx.fillStyle = (x + y) % 2 === 0 ? THEME.cellFill : THEME.cellFillAlt;
        roundRect(ctx, gx + 1.5, gy + 1.5, cell - 3, cell - 3, 6);
        ctx.fill();
        ctx.strokeStyle = THEME.gridLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  drawHover(game) {
    if (!game.hover) return;
    const ctx = this.ctx;
    const { pad, cell } = this.layout;
    const { x, y } = game.hover;
    const blocked = !game.board.isEmpty(x, y);
    const gx = pad + x * cell;
    const gy = pad + y * cell;
    roundRect(ctx, gx + 1.5, gy + 1.5, cell - 3, cell - 3, 6);
    if (game.drag) {
      ctx.fillStyle = blocked ? THEME.cellBlocked : THEME.cellHover;
      ctx.fill();
    }
    ctx.strokeStyle = blocked ? "rgba(255,90,110,0.6)" : THEME.cellHoverEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawWall(x, y) {
    const ctx = this.ctx;
    const { pad, cell } = this.layout;
    const gx = pad + x * cell + 3;
    const gy = pad + y * cell + 3;
    const s = cell - 6;
    const grad = ctx.createLinearGradient(gx, gy, gx, gy + s);
    grad.addColorStop(0, THEME.wallTop);
    grad.addColorStop(1, THEME.wallBottom);
    roundRect(ctx, gx, gy, s, s, 6);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = THEME.wallEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // rivets
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    const r = Math.max(1.4, cell * 0.035);
    for (const [dx, dy] of [[0.22, 0.22], [0.78, 0.22], [0.22, 0.78], [0.78, 0.78]]) {
      ctx.beginPath();
      ctx.arc(gx + s * dx, gy + s * dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawEmitter(x, y, device) {
    const ctx = this.ctx;
    const { pad, cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const s = cell * 0.62;
    // body
    const grad = ctx.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2);
    grad.addColorStop(0, THEME.emitterBodyHi);
    grad.addColorStop(1, THEME.emitterBody);
    roundRect(ctx, cx - s / 2, cy - s / 2, s, s, 7);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = THEME.emitterRim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // nozzle in the emit direction
    const dir = device.dir;
    const v = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[dir];
    const nLen = cell * 0.34;
    const nW = cell * 0.26;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate({ E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 }[dir]);
    // barrel
    ctx.fillStyle = "#1c2238";
    roundRect(ctx, s * 0.25, -nW / 2, nLen, nW, 4);
    ctx.fill();
    ctx.strokeStyle = THEME.emitterRim;
    ctx.stroke();
    // glowing lens
    ctx.shadowColor = colorGlow(device.color, 0.9);
    ctx.shadowBlur = cell * 0.25;
    ctx.fillStyle = colorCore(device.color);
    ctx.beginPath();
    ctx.arc(s * 0.25 + nLen, 0, nW * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void v;
  }

  crystalPath(cx, cy, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.72, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.72, cy);
    ctx.closePath();
  }

  drawCrystalBase(x, y, device) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.34;
    this.crystalPath(cx, cy, r);
    ctx.fillStyle = THEME.crystalUnlitFill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = withAlpha(colorCore(device.color), 0.55);
    ctx.stroke();
    // inner facet hint
    this.crystalPath(cx, cy, r * 0.5);
    ctx.strokeStyle = THEME.crystalUnlit;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawCrystalLit(x, y, device, anim) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.34;
    const pulse = 0.82 + 0.18 * Math.sin(anim.time / 260);
    ctx.save();
    ctx.shadowColor = colorGlow(device.color, 0.95);
    ctx.shadowBlur = cell * 0.55 * pulse;
    this.crystalPath(cx, cy, r);
    ctx.fillStyle = colorCore(device.color);
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.shadowBlur = 0;
    // bright core
    this.crystalPath(cx, cy, r * 0.55);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.restore();
  }

  drawMirror(x, y, device) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.36;
    // endpoints of the 45° bar
    let ax, ay, bx, by;
    if (device.orientation === "slash") {
      ax = cx - r; ay = cy + r; bx = cx + r; by = cy - r; // bottom-left -> top-right
    } else {
      ax = cx - r; ay = cy - r; bx = cx + r; by = cy + r; // top-left -> bottom-right
    }
    // back tint
    ctx.lineCap = "round";
    ctx.strokeStyle = THEME.mirrorBack;
    ctx.lineWidth = cell * 0.20;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // reflective glass with gradient sheen
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, "rgba(190,225,255,0.65)");
    grad.addColorStop(0.5, THEME.mirrorGlass);
    grad.addColorStop(1, "rgba(150,200,255,0.7)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = cell * 0.12;
    ctx.shadowColor = "rgba(180,220,255,0.6)";
    ctx.shadowBlur = cell * 0.12;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // bright edge line
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  drawFilter(x, y, device) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const gx = this.px(x) - cell * 0.34;
    const gy = this.px(y) - cell * 0.34;
    const s = cell * 0.68;
    // translucent coloured pane
    roundRect(ctx, gx, gy, s, s, 6);
    ctx.fillStyle = colorGlow(device.color, 0.22);
    ctx.fill();
    ctx.strokeStyle = colorGlow(device.color, 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
    // frame ticks (top & bottom rails) to read as a glass pane
    ctx.strokeStyle = colorGlow(device.color, 0.95);
    ctx.lineWidth = Math.max(2, cell * 0.06);
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx + s, gy);
    ctx.moveTo(gx, gy + s); ctx.lineTo(gx + s, gy + s);
    ctx.stroke();
  }

  drawSplitter(x, y, device) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.36;
    let ax, ay, bx, by;
    if (device.orientation === "slash") {
      ax = cx - r; ay = cy + r; bx = cx + r; by = cy - r;
    } else {
      ax = cx - r; ay = cy - r; bx = cx + r; by = cy + r;
    }
    // half-silvered: a translucent dashed bar
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(200,230,255,0.35)";
    ctx.lineWidth = cell * 0.16;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.setLineDash([cell * 0.12, cell * 0.09]);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, cell * 0.055);
    ctx.shadowColor = "rgba(190,225,255,0.6)";
    ctx.shadowBlur = cell * 0.1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.restore();
  }

  drawPrism(x, y, device, anim) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.36;
    void device;
    // upward triangle with a rainbow sheen
    const tri = () => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.92, cy + r * 0.7);
      ctx.lineTo(cx - r * 0.92, cy + r * 0.7);
      ctx.closePath();
    };
    const grad = ctx.createLinearGradient(cx - r, cy + r, cx + r, cy - r);
    grad.addColorStop(0.0, "rgba(255,90,110,0.85)");
    grad.addColorStop(0.5, "rgba(73,240,138,0.85)");
    grad.addColorStop(1.0, "rgba(74,168,255,0.85)");
    tri();
    ctx.fillStyle = "rgba(20,26,44,0.85)";
    ctx.fill();
    tri();
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5 + 0.1 * Math.sin(anim.time / 300);
    ctx.fill();
    ctx.globalAlpha = 1;
    tri();
    ctx.lineWidth = Math.max(1.5, cell * 0.04);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.stroke();
  }

  drawCombiner(x, y, device, anim) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const cx = this.px(x);
    const cy = this.px(y);
    const r = cell * 0.34;
    // hexagon body
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(24,30,50,0.95)";
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, cell * 0.045);
    ctx.strokeStyle = "rgba(180,200,240,0.7)";
    ctx.stroke();
    // output arrow in the emit direction
    const v = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[device.dir];
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(anim.time / 320));
    ctx.save();
    ctx.translate(cx + v[0] * r * 0.5, cy + v[1] * r * 0.5);
    ctx.rotate(Math.atan2(v[1], v[0]));
    ctx.fillStyle = `rgba(243,246,255,${pulse})`;
    const a = cell * 0.13;
    ctx.beginPath();
    ctx.moveTo(a, 0);
    ctx.lineTo(-a * 0.6, a * 0.7);
    ctx.lineTo(-a * 0.6, -a * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBeams(sim, anim) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    const revealDist = anim.beamProgress * (sim.maxT + 1);
    const flicker = 0.92 + 0.08 * Math.sin(anim.time / 90);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const pass of [0, 1, 2]) {
      for (const seg of sim.segments) {
        const local = clamp(revealDist - seg.t, 0, 1);
        if (local <= 0) continue;
        const ax = this.px(seg.ax);
        const ay = this.px(seg.ay);
        const ex = this.px(seg.ax + (seg.bx - seg.ax) * local);
        const ey = this.px(seg.ay + (seg.by - seg.ay) * local);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ex, ey);
        if (pass === 0) {
          ctx.strokeStyle = colorGlow(seg.color, 0.14 * flicker);
          ctx.lineWidth = cell * 0.40;
        } else if (pass === 1) {
          ctx.strokeStyle = colorGlow(seg.color, 0.5 * flicker);
          ctx.lineWidth = cell * 0.16;
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.lineWidth = Math.max(1.5, cell * 0.05);
          ctx.shadowColor = colorGlow(seg.color, 1);
          ctx.shadowBlur = cell * 0.3;
        }
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }

  drawGhost(game) {
    const ctx = this.ctx;
    const { cell } = this.layout;
    ctx.save();
    ctx.globalAlpha = 0.85;
    if (game.hover && game.board.isEmpty(game.hover.x, game.hover.y)) {
      // snap preview into the cell
      this.drawMirror(game.hover.x, game.hover.y, { kind: "mirror", orientation: game.drag.orientation });
    } else {
      // free-floating ghost following the cursor
      const r = cell * 0.34;
      const { px, py } = game.drag;
      let ax, ay, bx, by;
      if (game.drag.orientation === "slash") {
        ax = px - r; ay = py + r; bx = px + r; by = py - r;
      } else {
        ax = px - r; ay = py - r; bx = px + r; by = py + r;
      }
      ctx.lineCap = "round";
      ctx.strokeStyle = THEME.mirrorGlass;
      ctx.lineWidth = cell * 0.12;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---- small canvas helpers ----
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
