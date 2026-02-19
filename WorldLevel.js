/*
  WorldLevel.js
  Based on: Week5_Example05
 
  WHAT CHANGED:
  - Constructor now also loads this.symbols from JSON
  - drawWorld() is completely unchanged
  - Added drawParallaxBg(camX) — sky gradient + stars + 3 hill layers
  - Added drawHiddenSymbols(discovered, frameCount) — pulsing glowing symbols
  - Added getNearSymbol(worldX, range) — proximity check for auto-pause
  - Added clickSymbol(wx, wy, alreadyFound) — hit-test for mouse clicks
*/
 
class WorldLevel {
  constructor(levelJson) {
    this.name  = levelJson.name ?? "Level";
 
    this.theme = Object.assign(
      { bg: "#F0F0F0", platform: "#C8C8C8", blob: "#1478FF" },
      levelJson.theme ?? {}
    );
 
    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV   = levelJson.jumpV   ?? -11.0;
    this.camLerp = levelJson.camera?.lerp ?? 0.12;
 
    this.w      = levelJson.world?.w      ?? 2400;
    this.h      = levelJson.world?.h      ?? 500;
    this.deathY = levelJson.world?.deathY ?? this.h + 200;
 
    this.start = Object.assign({ x: 80, y: 220, r: 26 }, levelJson.start ?? {});
 
    this.platforms = (levelJson.platforms ?? []).map(
      (p) => new Platform(p.x, p.y, p.w, p.h)
    );
 
    // NEW: load hidden symbols array from JSON
    this.symbols = (levelJson.symbols ?? []).map((s) => ({
      x:       s.x,
      y:       s.y,
      r:       s.r       ?? 18,
      glyph:   s.glyph   ?? "✦",
      message: s.message ?? "...",
      color:   s.color   ?? "#FFD580",
    }));
  }
 
  // ── UNCHANGED from Example 05 ─────────────────────────────────────────────
  drawWorld() {
    push();
    rectMode(CORNER);
    noStroke();
    fill(this.theme.platform);
    for (const p of this.platforms) rect(p.x, p.y, p.w, p.h);
    pop();
  }
 
  // ── NEW: Parallax background ──────────────────────────────────────────────
  // camX is passed in so each layer can scroll at a different fraction of it.
  // Far things move slowly (0.05× for stars), near things faster (0.8× for hills).
  // This creates the illusion that the world has real depth.
  drawParallaxBg(camX) {
    const W = this.w;
    const H = this.h;
 
    // Sky gradient — drawn as horizontal lines top to bottom
    noStroke();
    const topCol   = color(this.theme.skyTop    ?? "#07071a");
    const horizCol = color(this.theme.skyHorizon ?? "#2b1a3a");
    for (let y = 0; y < H; y++) {
      stroke(lerpColor(topCol, horizCol, y / H));
      line(0, y, W, y);
    }
    noStroke();
 
    // Stars — nearly fixed (parallax 0.05), randomSeed keeps them consistent
    randomSeed(42);
    fill(255, 255, 255, 90);
    for (let i = 0; i < 120; i++) {
      const sx = (random(W) - camX * 0.05) % W;
      const sy = random(H * 0.6);
      ellipse(sx, sy, random(1.9, 4.2));
    }
    randomSeed();
 
    // Three hill layers — each scrolls at a different parallax speed
    this._drawHills(camX, 0.30, H * 0.62, H * 0.30,
                    color(this.theme.hillFar  ?? "#2d1b4e"), 18);
    this._drawHills(camX, 0.55, H * 0.72, H * 0.22,
                    color(this.theme.hillMid  ?? "#3a2460"),  9);
    this._drawHills(camX, 0.80, H * 0.82, H * 0.14,
                    color(this.theme.hillNear ?? "#1e3a2f"),  5);
  }
 
  // Internal helper — draws one hill silhouette using Perlin noise
  _drawHills(camX, parallax, baseY, amplitude, col, seed) {
    noStroke();
    fill(col);
    const offset = camX * parallax; // shift the noise sample by parallax amount
    beginShape();
    vertex(0, this.h + 10);
    for (let x = 0; x <= this.w; x += 6) {
      const n = noise(seed * 100 + (x + offset) * 0.0018);
      vertex(x, baseY - n * amplitude);
    }
    vertex(this.w, this.h + 10);
    endShape(CLOSE);
  }
 
  // ── NEW: Draw hidden symbols ──────────────────────────────────────────────
  // Undiscovered: 3-ring pulsing aura + glyph, staggered by index
  // Discovered:   expanding ring + faded glyph
  drawHiddenSymbols(discovered, frameCount) {
    for (let i = 0; i < this.symbols.length; i++) {
      const s     = this.symbols[i];
      const found = discovered.includes(i);
      const col   = color(s.color);
 
      if (found) {
        // Calm expanding ring after discovery
        noFill();
        stroke(col);
        strokeWeight(1.5);
        ellipse(s.x, s.y, s.r * 2 + (frameCount * 0.4) % 60,
                           s.r * 2 + (frameCount * 0.4) % 60);
        noStroke();
        fill(red(col), green(col), blue(col), 60);
        textAlign(CENTER, CENTER);
        textSize(s.r * 1.2);
        text(s.glyph, s.x, s.y);
 
      } else {
        // Breathing aura — each symbol has a slightly different phase (i * 1.3)
        const pulse  = sin(frameCount * 0.06 + i * 1.3);
        const glow   = map(pulse, -1, 1, 0.5, 1.0);
        const radius = s.r + pulse * 4;
 
        noStroke();
        // Outer soft aura
        fill(red(col), green(col), blue(col), 25 * glow);
        ellipse(s.x, s.y, radius * 3.5, radius * 3.5);
        // Mid glow
        fill(red(col), green(col), blue(col), 55 * glow);
        ellipse(s.x, s.y, radius * 2, radius * 2);
        // Solid core
        fill(red(col), green(col), blue(col), 160 * glow);
        ellipse(s.x, s.y, radius, radius);
        // Glyph on top
        fill(255, 255, 255, 200 * glow);
        textAlign(CENTER, CENTER);
        textSize(s.r * 0.95);
        text(s.glyph, s.x, s.y);
      }
    }
    // Always reset after drawing symbols
    textAlign(LEFT, BASELINE);
    strokeWeight(1);
    noStroke();
  }
 
  // ── NEW: Return index of nearest symbol within `range` pixels of worldX ──
  getNearSymbol(worldX, range) {
    for (let i = 0; i < this.symbols.length; i++) {
      if (abs(this.symbols[i].x - worldX) < range) return i;
    }
    return -1;
  }
 
  // ── NEW: Hit-test a world-space click against undiscovered symbols ─────────
  clickSymbol(wx, wy, alreadyFound) {
    for (let i = 0; i < this.symbols.length; i++) {
      if (alreadyFound.includes(i)) continue;
      const s = this.symbols[i];
      if (dist(wx, wy, s.x, s.y) < s.r + 14) return i;
    }
    return -1;
  }
}