// DOM HUD: title bar, inventory, hint line, control buttons and the win banner.

const MIRROR_SVG = (orientation) => {
  const a = orientation === "slash" ? "M14 34 L34 14" : "M14 14 L34 34";
  return `<svg viewBox="0 0 48 48" width="44" height="44">
    <line x1="${orientation === "slash" ? 14 : 14}" y1="${orientation === "slash" ? 34 : 14}"
          x2="${orientation === "slash" ? 34 : 34}" y2="${orientation === "slash" ? 14 : 34}"
          stroke="rgba(120,150,200,0.35)" stroke-width="9" stroke-linecap="round"/>
    <path d="${a}" stroke="#dff3ff" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="${a}" stroke="rgba(255,255,255,0.9)" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </svg>`;
};

export class Hud {
  constructor(game, els) {
    this.game = game;
    this.els = els;
  }

  render() {
    const g = this.game;

    // Menu screen takes over the whole app.
    const inMenu = g.screen === "menu";
    this.els.menu.hidden = !inMenu;
    if (inMenu) {
      this.buildMenu();
      this.hideBanner();
      return;
    }

    this.els.roundLabel.textContent = `ROUND ${g.level.id} / ${g.levels.length}`;
    this.els.scoreValue.textContent = String(g.score);
    this.els.levelTitle && (this.els.levelTitle.textContent = g.level.title);

    // Inventory: a single mirror pool the player rotates freely once placed.
    const slot = this.els.inventory;
    slot.innerHTML = "";
    const item = document.createElement("div");
    item.className = "inv-slot" + (g.mirrors <= 0 ? " empty" : "");
    item.id = "mirror-slot";
    item.title = "Drag onto the grid · click a placed mirror to rotate";
    item.innerHTML = MIRROR_SVG("slash") + `<span class="inv-count">${g.mirrors}</span>`;
    slot.appendChild(item);

    // Hint line reflects the phase.
    if (g.phase === "won") {
      this.els.hint.textContent = "Solved! ✦  Press Next to continue.";
    } else if (g.phase === "fired") {
      this.els.hint.textContent = "Not all crystals are lit — adjust the mirrors and fire again.";
    } else {
      this.els.hint.textContent = g.level.hint;
    }

    // Buttons.
    this.els.btnFire.disabled = g.phase === "won";
    this.els.btnNext.hidden = g.phase !== "won";
    this.els.btnNext.textContent = g.hasNext() ? "Next ▶" : "Finish ▶";

    if (g.phase === "won") this.showBanner();
    else this.hideBanner();
  }

  /** Build the pack-selection cards once. */
  buildMenu() {
    if (this._menuBuilt) return;
    const host = this.els.menuPacks;
    host.innerHTML = "";
    for (const pack of this.game.packs) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pack-card" + (pack.key === "campaign" ? " is-campaign" : "");
      card.innerHTML =
        `<div class="pack-name">${pack.name}</div>` +
        `<div class="pack-sub">${pack.subtitle}</div>` +
        `<div class="pack-count">${pack.levels.length} levels</div>`;
      card.addEventListener("click", () => this.game.startPack(pack.key));
      host.appendChild(card);
    }
    this._menuBuilt = true;
  }

  showBanner() {
    if (this._banner) return;
    const g = this.game;
    const last = !g.hasNext();
    const b = document.createElement("div");
    b.className = "banner";
    b.innerHTML = `<h2>${last ? "Pack Complete!" : "Level Complete!"}</h2><p>${
      last ? `You finished ${g.pack.name}.` : "On to the next puzzle."
    }</p>`;
    this.els.overlay.appendChild(b);
    this._banner = b;
  }

  hideBanner() {
    if (this._banner) {
      this._banner.remove();
      this._banner = null;
    }
  }
}
