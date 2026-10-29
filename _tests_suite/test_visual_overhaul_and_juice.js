const assert = require('assert');

// Mock browser canvas & context
function createMockCanvas(width = 1280, height = 720) {
  const drawCalls = [];
  const ctx = {
    canvas: { width, height },
    save: () => drawCalls.push({ type: 'save' }),
    restore: () => drawCalls.push({ type: 'restore' }),
    beginPath: () => drawCalls.push({ type: 'beginPath' }),
    closePath: () => drawCalls.push({ type: 'closePath' }),
    moveTo: (x, y) => drawCalls.push({ type: 'moveTo', x, y }),
    lineTo: (x, y) => drawCalls.push({ type: 'lineTo', x, y }),
    arc: (x, y, r, sa, ea) => drawCalls.push({ type: 'arc', x, y, r }),
    ellipse: (x, y, rx, ry, rot, sa, ea) => drawCalls.push({ type: 'ellipse', x, y, rx, ry }),
    fill: () => drawCalls.push({ type: 'fill' }),
    stroke: () => drawCalls.push({ type: 'stroke' }),
    fillRect: (x, y, w, h) => drawCalls.push({ type: 'fillRect', x, y, w, h }),
    strokeRect: (x, y, w, h) => drawCalls.push({ type: 'strokeRect', x, y, w, h }),
    fillText: (text, x, y) => drawCalls.push({ type: 'fillText', text, x, y }),
    translate: (x, y) => drawCalls.push({ type: 'translate', x, y }),
    rotate: (rad) => drawCalls.push({ type: 'rotate', rad }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    drawImage: () => {}
  };
  return { ctx, drawCalls };
}

// Global stubs
global.window = {
  soundSystem: { play: () => {} }
};
global.Image = class { constructor() { this.complete = true; } };

const TerrainEngine = require('../atomic-bomber/js/terrain.js');
const WeaponManager = require('../atomic-bomber/js/weapons.js');
const HUD = require('../atomic-bomber/js/hud.js');

console.log('=== TEST SUITE: VISUAL OVERHAUL & GAME JUICE ===\n');

// 1. Test Scorch Marks & Craters on Terrain
console.log('--- 1. Testing Ground Scorch Marks & Craters ---');
const terrain = new TerrainEngine(4800, 720);
terrain.generate(1, 'EUROPEAN');

assert.strictEqual(terrain.scorchMarks.length, 0, 'Initial scorch marks empty');
terrain.addScorchMark(500, 45, false, false);
assert.strictEqual(terrain.scorchMarks.length, 1, 'Standard scorch mark added');
assert.strictEqual(terrain.scorchMarks[0].isNuke, false, 'Is not nuke');
assert.strictEqual(terrain.scorchMarks[0].isNapalm, false, 'Is not napalm');
assert(terrain.scorchMarks[0].embers.length >= 4, 'Has glowing embers');

// Nuclear scorch mark
terrain.addScorchMark(1200, 200, true, false);
assert.strictEqual(terrain.scorchMarks.length, 2, 'Nuclear scorch mark added');
assert.strictEqual(terrain.scorchMarks[1].isNuke, true, 'Is nuke');
assert(terrain.scorchMarks[1].embers.length >= 12, 'Has large cluster of radioactive embers');

// Render pass on terrain
const { ctx: tCtx, drawCalls: tCalls } = createMockCanvas();
terrain.draw(tCtx, 400, 1280, 720, null);
const ellipseCalls = tCalls.filter(c => c.type === 'ellipse');
assert(ellipseCalls.length >= 2, 'Ellipse scorch craters drawn to canvas');
console.log('  [PASS] Scorch marks and glowing embers verified in terrain engine');

// 2. Test Shrapnel Debris in WeaponsManager
console.log('\n--- 2. Testing Shrapnel Debris Physics & Bouncing ---');
const mockGame = {
  terrain: terrain,
  sprites: {},
  input: { keys: {} },
  wave: 1,
  currentTheater: 'EUROPEAN',
  entities: {
    player: { alive: true },
    migs: [],
    samMissiles: [],
    groundEnemies: []
  }
};
const weapons = new WeaponManager(mockGame);

weapons.spawnShrapnelDebris(600, 400, 8, 1.2);
assert.strictEqual(weapons.debris.length, 8, '8 shrapnel debris pieces spawned');
assert(weapons.debris[0].vy < 0, 'Debris launches upwards');
assert(weapons.debris[0].maxBounces >= 1, 'Debris has ground bouncing physics');

// Simulate 30 frames of ballistic flight
for (let f = 0; f < 30; f++) {
  weapons.update();
}
// Render debris
const { ctx: wCtx, drawCalls: wCalls } = createMockCanvas();
weapons.draw(wCtx, 500);
const debrisFills = wCalls.filter(c => c.type === 'fillRect');
assert(debrisFills.length > 0, 'Debris and spark trails rendered to canvas');
console.log('  [PASS] Shrapnel debris ballistic flight and ground interaction verified');

// 3. Test First 15-25s Dynamic Mission HUD Onboarding Badges
console.log('\n--- 3. Testing Dynamic Mission HUD Onboarding Badges ---');
const hud = new HUD(mockGame);
assert.strictEqual(hud.onboardingTimer, 0, 'Onboarding timer starts at 0');
assert.strictEqual(hud.tutorialAlpha.steer, 1.0, 'Steer tutorial badge full opacity');
assert.strictEqual(hud.tutorialAlpha.bomb, 1.0, 'Bomb tutorial badge full opacity');
assert.strictEqual(hud.tutorialAlpha.cannon, 1.0, 'Cannon tutorial badge full opacity');
assert.strictEqual(hud.tutorialAlpha.flare, 1.0, 'Flare tutorial badge full opacity');

// Simulate steering input
mockGame.input.keys['ArrowUp'] = true;
for (let i = 0; i < 10; i++) {
  hud.update();
}
assert(hud.tutorialAlpha.steer < 1.0, 'Steer badge fades out on steering input');
assert.strictEqual(hud.tutorialAlpha.bomb, 1.0, 'Bomb badge remains untouched');
mockGame.input.keys['ArrowUp'] = false; // release key

// Simulate bomb drop input
mockGame.input.keys['Space'] = true;
for (let i = 0; i < 10; i++) {
  hud.update();
}
assert(hud.tutorialAlpha.bomb < 1.0, 'Bomb badge fades out on spacebar input');
mockGame.input.keys['Space'] = false; // release key

// Draw HUD onboarding badges
const { ctx: hCtx, drawCalls: hCalls } = createMockCanvas();
hud.drawMissionOnboarding(hCtx, 1280, 720, mockGame.entities.player);
const badgeTexts = hCalls.filter(c => c.type === 'fillText');
assert(badgeTexts.some(t => t.text.includes('ARROWS') || t.text.includes('STEER')), 'Steer badge text drawn');
assert(badgeTexts.some(t => t.text.includes('SPACE') || t.text.includes('BOMBS')), 'Bomb badge text drawn');
assert(badgeTexts.some(t => t.text.includes('CANNON')), 'Cannon badge text drawn');
assert(badgeTexts.some(t => t.text.includes('FLARES')), 'Flares badge text drawn');
console.log('  [PASS] Dynamic mission HUD onboarding badges and auto-dismiss verified');

console.log('\n========================================');
console.log('VISUAL OVERHAUL TEST SUITE: 100% PASSED');
console.log('========================================');
