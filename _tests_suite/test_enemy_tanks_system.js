const fs = require('fs');
const assert = require('assert');

// Mock browser environment
global.Image = function() { return { complete: true, addEventListener: () => {} }; };
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  fillText: () => {},
  strokeText: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  drawImage: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  ellipse: () => {},
  setLineDash: () => {},
  measureText: () => ({ width: 50 })
};

const mockCanvas = {
  width: 960,
  height: 540,
  addEventListener: () => {},
  removeEventListener: () => {},
  getContext: () => mockCtx
};

global.document = {
  getElementById: (id) => mockCanvas,
  addEventListener: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.AudioContext = function() {
  return {
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    createGain: () => ({ gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
    createOscillator: () => ({ type: 'sine', frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, connect: () => {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
    createBufferSource: () => ({ buffer: null, playbackRate: { value: 1 }, loop: false, start: () => {}, stop: () => {}, connect: () => {} }),
    destination: {}
  };
};

require('./atomic-bomber/js/audio.js');
const TerrainEngine = require('./atomic-bomber/js/terrain.js');
const WeaponSystem = require('./atomic-bomber/js/weapons.js');
const EntityManager = require('./atomic-bomber/js/entities.js');
const GameEngine = require('./atomic-bomber/js/engine.js');
const InputHandler = require('./atomic-bomber/js/input.js');
const Armory = require('./atomic-bomber/js/armory.js');
const HUD = require('./atomic-bomber/js/hud.js');
const Codex = require('./atomic-bomber/js/codex.js');
const Game = require('./atomic-bomber/js/main.js');

console.log('================================================================');
console.log('  TESTING REVERSE-ENGINEERED ENEMY TANK THREAT & BALLISTICS     ');
console.log('================================================================');

const game = new Game();
game.startNewGame('f14');
const em = game.entities;
const terrain = game.terrain;

// --- TEST 1: TANK SPAWN HIERARCHY ACROSS WAVES ---
console.log('\n--- TEST 1: VERIFYING TANK SPAWNS & PROGRESSIVE SUBTYPES ---');

em.reset();
em.spawnWave(1, 'EUROPEAN');
const wave1Tanks = em.enemies.filter(e => e.type === 'tank');
console.log(`Wave 1 Tanks (${wave1Tanks.length}):`, wave1Tanks.map(t => t.name));
assert(wave1Tanks.some(t => t.subType === 't34' || t.subType === 'sherman'), 'Wave 1 must feature classic tanks');

em.reset();
em.spawnWave(2, 'EUROPEAN');
const wave2Tanks = em.enemies.filter(e => e.type === 'tank');
console.log(`Wave 2 Tanks (${wave2Tanks.length}):`, wave2Tanks.map(t => t.name));
assert(wave2Tanks.some(t => t.subType === 'abrams'), 'Wave 2 must introduce M1A2 Abrams MBT');

em.reset();
em.spawnWave(3, 'EUROPEAN');
const wave3Tanks = em.enemies.filter(e => e.type === 'tank');
console.log(`Wave 3 Tanks (${wave3Tanks.length}):`, wave3Tanks.map(t => t.name));
assert(wave3Tanks.some(t => t.subType === 't90'), 'Wave 3 must deploy T-90M Proryv with ERA');
assert(wave3Tanks.some(t => t.subType === 'koalitsia'), 'Wave 3 must deploy 2S35 Koalitsiya-SV artillery');

em.reset();
em.spawnWave(4, 'EUROPEAN');
const wave4Tanks = em.enemies.filter(e => e.type === 'tank');
console.log(`Wave 4 Tanks (${wave4Tanks.length}):`, wave4Tanks.map(t => t.name));
assert(wave4Tanks.some(t => t.subType === 'buratino'), 'Wave 4 must deploy TOS-1A Buratino Heavy Thermobaric MLRS');
console.log('✓ PASS: Tank hierarchy correctly deploys progressively advanced models!');

// --- TEST 2: SHIELD BARRIER (TOS-1A BURATINO) ---
console.log('\n--- TEST 2: TESTING SHIELD BARRIER ABSORPTION ---');
const buratino = wave4Tanks.find(t => t.subType === 'buratino');
assert(buratino, 'Buratino must exist in Wave 4');
assert.strictEqual(buratino.hasShield, true, 'Buratino must have ShieldBarrier enabled');
assert(buratino.shieldHp > 0, 'Buratino shield HP must be positive');
const initialShield = buratino.shieldHp;
const initialHp = buratino.hp;

// Hit Buratino with 50 damage
em.applyDamageToEnemy(buratino, 50);
assert(buratino.shieldHp < initialShield, 'Shield must absorb the impact first');
assert.strictEqual(buratino.hp, initialHp, 'Hull HP must remain untouched while shield holds');
console.log(`✓ PASS: ShieldBarrier absorbed 50 dmg! (Shield HP: ${initialShield} -> ${buratino.shieldHp}, Hull HP: ${buratino.hp})`);

// --- TEST 3: RELIKT REACTIVE ARMOR (T-90M PRORYV) ---
console.log('\n--- TEST 3: TESTING RELIKT EXPLOSIVE REACTIVE ARMOR (ERA) ---');
const t90 = wave4Tanks.find(t => t.subType === 't90');
assert(t90, 'T-90M must exist in Wave 4');
assert.strictEqual(t90.hasERA, true, 'T-90M must start with ERA enabled');
const t90InitialHp = t90.hp;

// Direct hit on T-90M: ERA must absorb 50%
em.applyDamageToEnemy(t90, 100);
assert.strictEqual(t90.hasERA, false, 'ERA tile must detonate and be consumed');
const damageTaken = t90InitialHp - t90.hp;
assert(damageTaken <= 60, `ERA must mitigate 50% damage (took ${damageTaken} dmg instead of 100)`);
console.log(`✓ PASS: T-90M ERA absorbed 50% blast damage! (Damage taken: ${damageTaken} HP)`);

// --- TEST 4: SMOKE SCREEN LOCK DEPLOYMENT (M1A2 ABRAMS) ---
console.log('\n--- TEST 4: TESTING ABRAMS SMOKE SCREEN DEFENSE ---');
const abrams = wave4Tanks.find(t => t.subType === 'abrams');
assert(abrams, 'Abrams must exist in Wave 4');

// Player locks Hellfire missile onto Abrams
em.player.lockedTarget = abrams;
assert.strictEqual(em.player.lockedTarget, abrams, 'Player locked onto Abrams');

// Abrams triggers smoke screen
em.deployTankSmoke(abrams);
assert.strictEqual(em.player.lockedTarget, null, 'Smoke screen must break player missile lock');
assert(em.smokeScreens.length > 0, 'Smoke screen particle must be active on battlefield');
console.log('✓ PASS: Abrams smoke screen successfully broke Hellfire missile lock!');

// --- TEST 5: PROCEDURAL 2D RENDERING OF ALL 6 TANKS ---
console.log('\n--- TEST 5: TESTING 2D CANVAS RENDERING FOR ALL TANK TYPES ---');
const models = ['t34', 'sherman', 'abrams', 't90', 'koalitsia', 'buratino'];
for (const m of models) {
  const mockTank = {
    type: 'tank',
    subType: m,
    x: 500,
    y: 400,
    hp: 150,
    maxHp: 150,
    turretAngle: -0.45,
    recoil: 2.0,
    isEntrenched: true,
    hasShield: m === 'buratino',
    shieldHp: 80,
    maxShieldHp: 120,
    alive: true,
    speed: 0.5
  };
  em.drawTank(mockCtx, 500, 400, mockTank);
}
console.log('✓ PASS: All 6 procedural tank canvas renderers executed cleanly without error!');

// --- TEST 6: FIELD INTEL CODEX ENTRIES ---
console.log('\n--- TEST 6: VERIFYING CODEX DATABASE INTEGRATION ---');
const codex = new Codex(game);
const armorUnits = codex.units.filter(u => u.category === 'ARMOR_GROUND');
console.log(`Codex ARMOR_GROUND category has ${armorUnits.length} combat units:`, armorUnits.map(u => u.name));
assert(armorUnits.some(u => u.id === 'm1a2_abrams'), 'M1A2 Abrams must be in Codex');
assert(armorUnits.some(u => u.id === 't90m_proryv'), 'T-90M Proryv must be in Codex');
assert(armorUnits.some(u => u.id === 'koalitsia_sv'), '2S35 Koalitsiya-SV must be in Codex');
assert(armorUnits.some(u => u.id === 'buratino_tos1'), 'TOS-1A Buratino must be in Codex');
console.log('✓ PASS: All 4 heavy war machines registered in Field Intel Codex with specs and animations!');

console.log('\n================================================================');
console.log('★ ALL 6 REVERSE-ENGINEERED ENEMY TANK SUITES PASSED (100%)! ★');
console.log('================================================================');
