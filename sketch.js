/*

  Week 5 — Meditative Camera Experience

  Based on: Week5_Example05 (Side-Scroller + Camera + JSON)
 
  WHAT CHANGED FROM EXAMPLE 05:
  - Removed player, jump, respawn, keyboard movement
  - Camera now drives itself (auto-scroll) instead of following a player
  - Speed breathes organically using Perlin noise
  - Camera gently sways up/down like floating
  - Camera auto-pauses near undiscovered hidden symbols
  - Click glowing symbols to "discover" them → flash message overlay
  - Parallax background layers added to WorldLevel
  - New "Dreamscape" level in levels.json (wide, dark, atmospheric)

*/
 
const VIEW_W = 900;

const VIEW_H = 500;
 
let allLevelsData;

let level;

let cam;
 
// ── Meditative scroll state ───────────────────────────────────────────────────

let scrollT     = 0;      // moves through Perlin space each frame

let scrollSpeed = 0.4;    // current speed (pixels/frame)

let targetSpeed = 0.4;

let pauseTimer  = 0;      // frames remaining in a symbol-proximity pause
 
const BASE_SPEED   = 0.4;

const MAX_SPEED    = 1.1;

const PAUSE_FRAMES = 110; // ~2 sec pause near a symbol
 
// ── Discovery state ───────────────────────────────────────────────────────────

let discovered = []; // indices of symbols the camera has found

let flashTimer = 0;

let flashMsg   = "";
 
// ─────────────────────────────────────────────────────────────────────────────

function preload() {

  allLevelsData = loadJSON("levels.json");

}
 
function setup() {

  createCanvas(VIEW_W, VIEW_H);

  textFont("Georgia, serif");
 
  cam = new Camera2D(VIEW_W, VIEW_H);

  cam.x = 0;

  cam.y = 0;
 
  level = LevelLoader.fromLevelsJson(allLevelsData, 0);

}
 
function draw() {
 
  // ── 1. PACING — Perlin noise drives breathing speed ──────────────────────

  // This replaces player input as the force that moves the world.

  // noise() returns smooth organic values; map() converts them to a speed range.

  // lerp() makes changes glacially slow so the camera feels like it's breathing.

  scrollT += 0.005;
 
  if (pauseTimer > 0) {

    // Slowly coast to a stop near a symbol

    pauseTimer--;

    scrollSpeed = lerp(scrollSpeed, 0, 0.06);

  } else {

    const n = noise(scrollT);

    targetSpeed = map(n, 0, 1, BASE_SPEED * 0.25, MAX_SPEED);

    scrollSpeed = lerp(scrollSpeed, targetSpeed, 0.018);

  }
 
  // ── 2. AUTO-SCROLL — camera moves itself horizontally ────────────────────

  // CHANGED: was cam.followSideScrollerX(player.x, level.camLerp)

  // NOW:     cam.scrollAutoX(scrollSpeed)  ← new method in Camera2D.js

  cam.scrollAutoX(scrollSpeed);

  cam.clampToWorld(level.w, level.h);
 
  // Loop back to start when we reach the end

  if (cam.x >= level.w - VIEW_W - 1) {

    cam.x = 0;

    scrollT = 0;

  }
 
  // ── 3. VERTICAL SWAY — sine wave gives a floating / dreaming feeling ──────

  const breatheY = sin(frameCount * 0.007) * 20;

  cam.y = lerp(cam.y, breatheY, 0.025);
 
  // ── 4. SYMBOL PROXIMITY — auto-pause when camera nears a hidden symbol ────

  const nearIdx = level.getNearSymbol(cam.x + VIEW_W / 2, 200);

  if (nearIdx !== -1 && !discovered.includes(nearIdx) && pauseTimer === 0) {

    pauseTimer = PAUSE_FRAMES;

  }
 
  // ── 5. DRAW WORLD (inside camera transform) ───────────────────────────────

  cam.begin();

    level.drawParallaxBg(cam.x);                      // layered sky + hills

    level.drawWorld();                                 // platforms (unchanged)

    level.drawHiddenSymbols(discovered, frameCount);  // pulsing bonus symbols

  cam.end();
 
  // ── 6. DISCOVERY FLASH OVERLAY ───────────────────────────────────────────

  if (flashTimer > 0) {

    const a = map(flashTimer, 0, 80, 0, 190);

    noStroke();

    fill(245, 238, 210, a);

    rect(0, 0, width, height);

    fill(70, 55, 35, map(flashTimer, 10, 80, 0, 240));

    textAlign(CENTER, CENTER);

    textSize(20);

    text(flashMsg, width / 2, height / 2);

    textAlign(LEFT, BASELINE);

    flashTimer--;

  }
 
  // ── 7. VIGNETTE — dark edges for cinematic weight ─────────────────────────

  drawVignette();
 
  // ── 8. HUD ────────────────────────────────────────────────────────────────

  fill(255, 255, 255, 140);

  noStroke();

  textSize(12);

  textFont("Georgia, serif");

  textAlign(LEFT, BASELINE);

  text("click glowing symbols to discover", 16, height - 14);

  text("discovered: " + discovered.length + " / " + level.symbols.length, 16, height - 30);

}
 
// ── Mouse click: discover symbols ────────────────────────────────────────────

// Convert screen coordinates → world coordinates, then hit-test symbols

function mousePressed() {

  const wx = mouseX + cam.x;

  const wy = mouseY + cam.y;

  const idx = level.clickSymbol(wx, wy, discovered);

  if (idx !== -1) {

    discovered.push(idx);

    flashMsg   = level.symbols[idx].message;

    flashTimer = 110;
    pauseTimer = PAUSE_FRAMES * 2; // linger after discovery

  }

}
 
// ── Vignette helper ──────────────────────────────────────────────────────────

function drawVignette() {

  noStroke();

  const g = drawingContext.createRadialGradient(

    width / 2, height / 2, height * 0.15,

    width / 2, height / 2, height * 0.9

  );

  g.addColorStop(0, "rgba(0,0,0,0)");

  g.addColorStop(1, "rgba(0,0,0,0.5)");

  drawingContext.fillStyle = g;

  drawingContext.fillRect(0, 0, width, height);

}
 