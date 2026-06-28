// Pointer handling: drag a mirror from the inventory onto the grid, pick up /
// move placed mirrors, click a placed mirror to rotate, and drop off-board to
// return a mirror to the pool.

const DRAG_THRESHOLD = 6;

export class Input {
  constructor(game, renderer, canvas, inventoryEl) {
    this.game = game;
    this.renderer = renderer;
    this.canvas = canvas;
    this.inventoryEl = inventoryEl;
    this.state = null;
  }

  init() {
    // Start a drag from the inventory slot.
    this.inventoryEl.addEventListener("pointerdown", (e) => {
      const slot = e.target.closest(".inv-slot");
      if (!slot || slot.classList.contains("empty")) return;
      if (this.game.mirrors <= 0) return;
      e.preventDefault();
      this.begin("inventory", null, "slash", e);
      // inventory drags show the ghost immediately
      this.state.moved = true;
      this.updateGhost(e);
    });

    // Block the browser context menu so right-click can rotate mirrors freely.
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Pointer down on the canvas: maybe pick up / rotate a placed mirror.
    this.canvas.addEventListener("pointerdown", (e) => {
      const c = this.cellFromEvent(e);
      if (!c.inBoard) return;
      if (this.game.isPlacedMirror(c.x, c.y)) {
        e.preventDefault();
        const o = this.game.board.deviceAt(c.x, c.y).orientation;
        this.begin("board", { x: c.x, y: c.y }, o, e);
      }
    });

    this.canvas.addEventListener("pointermove", (e) => {
      const c = this.cellFromEvent(e);
      this.game.hover = c.inBoard ? { x: c.x, y: c.y } : null;
    });
    this.canvas.addEventListener("pointerleave", () => {
      if (!this.state) this.game.hover = null;
    });

    window.addEventListener("pointermove", (e) => this.onMove(e));
    window.addEventListener("pointerup", (e) => this.onUp(e));
  }

  begin(source, originCell, orientation, e) {
    this.state = {
      source,
      originCell,
      orientation,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pickedUp: false,
    };
  }

  onMove(e) {
    const s = this.state;
    if (!s) return;
    const dist = Math.hypot(e.clientX - s.startX, e.clientY - s.startY);
    if (!s.moved && dist > DRAG_THRESHOLD) s.moved = true;

    if (s.moved) {
      // Lift a board mirror off the grid the first time it actually moves.
      if (s.source === "board" && !s.pickedUp) {
        this.game.removeMirror(s.originCell.x, s.originCell.y);
        s.pickedUp = true;
      }
      this.updateGhost(e);
    }

    const c = this.cellFromEvent(e);
    this.game.hover = c.inBoard ? { x: c.x, y: c.y } : null;
  }

  updateGhost(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.game.drag = {
      orientation: this.state.orientation,
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    };
  }

  onUp(e) {
    const s = this.state;
    if (!s) return;
    this.state = null;
    const c = this.cellFromEvent(e);

    if (!s.moved) {
      // A click without dragging: rotate a placed mirror in place.
      if (s.source === "board") this.game.rotateMirror(s.originCell.x, s.originCell.y);
      this.clearDrag();
      return;
    }

    // A drag: drop onto a valid empty cell, otherwise the mirror returns to the pool.
    if (c.inBoard && this.game.board.isEmpty(c.x, c.y)) {
      this.game.placeMirror(c.x, c.y, s.orientation);
    }
    // (board-source mirrors were already removed; an invalid drop leaves them
    //  returned to the inventory, which is the desired "throw away" behaviour.)
    this.clearDrag();
  }

  clearDrag() {
    this.game.drag = null;
    this.game.hover = null;
    this.game.emit();
  }

  cellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { pad, cell } = this.renderer.layout;
    const x = Math.floor((px - pad) / cell);
    const y = Math.floor((py - pad) / cell);
    return { x, y, px, py, inBoard: this.game.board.inBounds(x, y) };
  }
}
