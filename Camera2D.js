/*
  Camera2D.js
  Based on: Week5_Example05
 
  WHAT CHANGED:
  - Added scrollAutoX(speed) — the only new method.
    Instead of the camera following a player, it advances itself
    by `speed` pixels each frame. This makes the camera the subject,
    not a passive observer.
  - All original methods kept exactly as they were.
*/
 
class Camera2D {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.x = 0;
    this.y = 0;
  }
 
  // ORIGINAL — kept for reference
  followSideScrollerX(targetX, lerpAmt) {
    const desired = targetX - this.viewW / 2;
    this.x = lerp(this.x, desired, lerpAmt);
  }
 
  // NEW — self-driven horizontal scroll
  // Called every draw() instead of followSideScrollerX()
  // speed is a float (pixels per frame), controlled by Perlin noise in sketch.js
  scrollAutoX(speed) {
    this.x += speed;
  }
 
  // ORIGINAL — unchanged
  clampToWorld(worldW, worldH) {
    const maxX = max(0, worldW - this.viewW);
    const maxY = max(0, worldH - this.viewH);
    this.x = constrain(this.x, 0, maxX);
    this.y = constrain(this.y, 0, maxY);
  }
 
  // ORIGINAL — unchanged
  begin() {
    push();
    translate(-this.x, -this.y);
  }
  
  end() {
    pop();
  }
}