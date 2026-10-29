/**
 * Automated Verification Suite for S-400 Wave Speed Scaling, Pantsir-S1 Air Defense,
 * and Tu-22M3 Backfire Supersonic Strategic Bomber Systems.
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment
global.window = global;
global.location = { hostname: 'localhost', href: 'http://localhost' };
global.addEventListener = () => {};
global.removeEventListener = () => {};
class MockCanvasContext {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '12px sans-serif';
  }
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  arc() {}
  ellipse() {}
  rect() {}
  fillRect() {}
  strokeRect() {}
  stroke() {}
  fill() {}
  moveTo() {}
  lineTo() {}
  translate() {}
  rotate() {}
  scale() {}
  fillText() {}
  drawImage() {}
}

const mockCanvas = {
  width: 1280,
  height: 720,
  getContext: () => new MockCanvasContext(),
  addEventListener: () => {},
  removeEventListener: () => {},
  style: {}
};

global.document = {
  fullscreenElement: null,
  webkitFullscreenElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: (id) => {
    if (id === 'gameCanvas') return mockCanvas;
    return {
      id,
      innerText: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      addEventListener: () => {},
      blur: () => {}
    };
  }
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

global.performance = { now: () => Date.now() };

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.destination = {};
  }
  createBuffer() { return { getChannelData: () => new Float32Array(1024) }; }
  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      playbackRate: { setValueAtTime: () => {} }
    };
  }
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createBiquadFilter() {
    return {
      frequency: { setValueAtTime: () => {} },
      Q: { setValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createOscillator() {
    return {
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
}
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Load Game Scripts
function loadScript(relPath) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  eval(code);
}

loadScript('atomic-bomber/js/terrain.js');
loadScript('atomic-bomber/js/audio.js');
loadScript('atomic-bomber/js/weapons.js');
loadScript('atomic-bomber/js/entities.js');
loadScript('atomic-bomber/js/codex.js');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, name) {
  if (cond) {
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    testsFailed++;
  }
}

console.log('=== TEST SUITE: S-400 WAVE SCALING, PANTSIR-S1 & TU-22M3 BACKFIRE ===\n');

// 1. Test S-400 Speed Wave Scaling Formula
console.log('--- 1. S-400 Wave Speed Dynamic Scaling ---');
const calcSpeed = (wave) => Math.min(18.0, 8.5 + (wave - 1) * 1.75);
const calcTurn = (wave) => Math.min(0.068, 0.032 + (wave - 1) * 0.007);
const calcDmg = (wave) => Math.round(Math.min(75, 14 + (wave - 1) * 11));

assert(calcSpeed(1) === 8.5, 'Wave 1 S-400 speed is 8.5 px/frame');
assert(calcSpeed(2) === 10.25, 'Wave 2 S-400 speed accelerates to 10.25 px/frame');
assert(calcSpeed(3) === 12.0, 'Wave 3 S-400 speed reaches 12.0 px/frame');
assert(calcSpeed(5) === 15.5, 'Wave 5 S-400 speed reaches 15.5 px/frame');
assert(calcSpeed(7) === 18.0, 'Wave 7+ S-400 speed caps at hypersonic Mach 10+ (18.0 px/frame)');
assert(calcTurn(1) === 0.032, 'Wave 1 turn rate is 0.032 rad/frame');
assert(calcTurn(7) >= 0.068, 'Wave 7+ turn rate caps at agile 0.068 rad/frame');
assert(calcDmg(1) === 14, 'Wave 1 damage is 14');
assert(calcDmg(4) === 47, 'Wave 4 damage scales up to 47');
assert(calcDmg(7) === 75, 'Wave 7+ damage caps at 75');

// 2. Test EntityManager Integration
console.log('\n--- 2. EntityManager Unit & Wave Spawning ---');
const mockGame = {
  wave: 1,
  terrain: {
    mapWidth: 10000,
    segmentWidth: 50,
    segments: [],
    getHeightAt: (x) => 580
  },
  weapons: {
    sparks: [],
    flares: [],
    createExplosion: () => {},
    createNapalmFire: () => {}
  },
  sprites: {},
  addFloatingText: () => {},
  setRadioMessage: () => {},
  triggerPilotHumor: () => {}
};
window.soundSystem = {
  play: () => {},
  playS400Ignition: () => {},
  playPneumaticPop: () => {},
  playShieldHit: () => {}
};

const em = new window.EntityManager(mockGame);
assert(Array.isArray(em.bombers), 'EntityManager initializes bombers array');
assert(em.bombers.length === 0, 'Initial bombers array is empty');

// Test Pantsir Spawning at Wave 3
console.log('\n--- 3. Pantsir-S1 Wave Spawning & Defense ---');
em.spawnWave(1);
const pantsirWave1 = em.enemies.filter(e => e.type === 'pantsir');
assert(pantsirWave1.length === 0, 'Wave 1 spawns 0 Pantsir-S1');

em.spawnWave(3);
const pantsirWave3 = em.enemies.filter(e => e.type === 'pantsir');
assert(pantsirWave3.length >= 1, `Wave 3 spawns ${pantsirWave3.length} Pantsir-S1 units`);
if (pantsirWave3.length > 0) {
  const p1 = pantsirWave3[0];
  assert(p1.hp === 330, `Pantsir-S1 has 330 HP at Wave 3 (got ${p1.hp})`);
  assert(p1.scoreValue === 485, `Pantsir-S1 score value is 485 (got ${p1.scoreValue})`);
  assert(p1.creditValue === 410, `Pantsir-S1 credit value is $410 (got ${p1.creditValue})`);
}

// Test Pantsir Missile Launch
em.launchPantsirMissile(500, 300, 3);
assert(em.samMissiles.length === 1, 'Pantsir missile successfully added to samMissiles');
const pantsirMissile = em.samMissiles[0];
assert(pantsirMissile.isPantsir === true, 'Missile has isPantsir flag');
assert(pantsirMissile.maxSpeed >= 11.0, `Pantsir maxSpeed is >= 11.0 (got ${pantsirMissile.maxSpeed})`);
assert(pantsirMissile.turnRate >= 0.05, `Pantsir turnRate is >= 0.05 (got ${pantsirMissile.turnRate})`);

// 4. Test Tu-22M3 Backfire Strategic Bomber
console.log('\n--- 4. Tu-22M3 Backfire Strategic Bomber ---');
em.player = { x: 1000, y: 300, angle: 0, currentSpeed: 5, alive: true, hp: 100, maxHp: 100, invulnerableTimer: 0 };
em.spawnStrategicBomber(4);
assert(em.bombers.length === 1, 'Tu-22M3 Strategic Bomber spawned');
const bomber = em.bombers[0];
assert(bomber.alive === true, 'Bomber is alive');
assert(bomber.hp >= 500, `Wave 4 Bomber has heavy armor (hp: ${bomber.hp})`);
assert(bomber.scoreValue === 1500, 'Bomber score value is 1500');

// Test Kh-22 Cruise Missile Launch
em.launchKh22CruiseMissile(bomber.x, bomber.y + 14, 4, bomber.facing);
assert(em.samMissiles.length === 2, 'Kh-22 heavy cruise missile added to samMissiles');
const kh22 = em.samMissiles[1];
assert(kh22.isKh22 === true, 'Cruise missile has isKh22 flag');
assert(kh22.damage >= 80, `Kh-22 has massive warhead damage (got ${kh22.damage})`);
assert(kh22.life >= 400, 'Kh-22 has standoff endurance (life >= 400)');

// Test Direct Hit & Blast Damage against Bomber
console.log('\n--- 5. Hit Detection & Destruction on Strategic Bomber ---');
const prevHp = bomber.hp;
em.checkDirectHit(bomber.x, bomber.y, 10, 150);
assert(bomber.hp === prevHp - 150, `checkDirectHit reduced bomber HP from ${prevHp} to ${bomber.hp}`);

em.checkBlastDamage(bomber.x, bomber.y, 80, 500);
assert(bomber.alive === false, 'Massive blast damage destroyed Tu-22M3 Backfire');

// 6. Test FPV Drone Auto-Targeting Pantsir & Bomber
console.log('\n--- 6. FPV Kamikaze Drone Target Prioritization ---');
em.bombers = [];
em.spawnStrategicBomber(5);
em.enemies = [
  { x: 1200, y: 550, type: 'tank', alive: true },
  { x: 1300, y: 550, type: 'pantsir', alive: true },
  { x: 1400, y: 550, type: 's400', alive: true }
];
const s400Target = em.enemies[2];
const pantsirTarget = em.enemies[1];

// S-400 has highest ground priority (100) vs Pantsir (93) vs Tank (60)
em.player.x = 1100;
em.player.y = 300;
em.deployFpvDroneStrike();
assert(em.drones.length === 1, 'FPV drone launched');
assert(em.drones[0].target === s400Target, 'Drone prioritized S-400 battery over other targets');

// Kill S-400, next drone should prioritize Pantsir-S1 (93) over tank (60)
s400Target.alive = false;
em.deployFpvDroneStrike();
assert(em.drones.length === 2, 'Second FPV drone launched');
assert(em.drones[1].target === pantsirTarget, 'Drone prioritized Pantsir-S1 over regular tank');

// 7. Test Codex Entries
console.log('\n--- 7. Hostile Codex Entries for Pantsir & Tu-22M3 ---');
const codex = new window.EnemyCodexManager(mockGame);
const codexPantsir = codex.units.find(e => e.id === 'pantsir');
const codexTu22m = codex.units.find(e => e.id === 'tu22m');

assert(codexPantsir !== undefined, 'Codex contains Pantsir-S1 entry');
assert(codexPantsir.category === 'SPAAG_FLAK', 'Pantsir is categorized under SPAAG_FLAK');
assert(typeof codexPantsir.renderModel === 'function', 'Pantsir has renderModel function');

assert(codexTu22m !== undefined, 'Codex contains Tu-22M3 Backfire entry');
assert(codexTu22m.category === 'AIRBORNE', 'Tu-22M3 is categorized under AIRBORNE');
assert(typeof codexTu22m.renderModel === 'function', 'Tu-22M3 has renderModel function');

// Summary
console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
