/**
 * Comprehensive Codebase Integrity & Runtime Edge Case Test
 * Tests every game state, all 11 flyable aircraft, all weapons, and all enemies.
 */

const fs = require('fs');
const path = require('path');

// Setup full browser mock
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
  roundRect() {}
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
  strokeText() {}
  drawImage() {}
  measureText(t) { return { width: (t || '').length * 8 }; }
  createLinearGradient() { return { addColorStop: () => {} }; }
  createRadialGradient() { return { addColorStop: () => {} }; }
}

const mockCanvas = {
  width: 1280,
  height: 720,
  getContext: () => new MockCanvasContext(),
  addEventListener: () => {},
  removeEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
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

global.AudioContext = class {
  constructor() { this.destination = {}; }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } }; }
  createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
  decodeAudioData(b, cb) { if (cb) cb({}); }
  resume() { return Promise.resolve(); }
};
global.webkitAudioContext = global.AudioContext;
global.Image = class { constructor() { this.complete = true; } };

// Load All 10 JS Engine Modules
const jsDir = path.join(__dirname, '..', 'atomic-bomber', 'js');
const moduleFiles = [
  'audio.js', 'input.js', 'terrain.js', 'weapons.js',
  'entities.js', 'hud.js', 'armory.js', 'codex.js',
  'engine.js', 'main.js'
];

moduleFiles.forEach(f => {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  eval(code);
});

console.log('=== RUNNING COMPREHENSIVE INTEGRITY & EDGE-CASE TEST ===\n');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
    failed++;
  }
}

const game = new window.AtomicBomberGame();

// 1. Test All 11 Playable Aircraft Flight Physics
console.log('--- 1. Testing Flight Physics for All 11 Aircraft ---');
const aircraftList = ['warthog', 'tomcat', 'frogfoot', 'phantom', 'harrier', 'spectre', 'apache', 'cobra', 'comanche', 'chinook', 'mig21'];

aircraftList.forEach(planeId => {
  test(`Spawn and flight tick for ${planeId}`, () => {
    game.startNewGame(planeId);
    const p = game.entities.player;
    if (!p || !p.alive) throw new Error(`Player not spawned for ${planeId}`);
    if (p.model !== planeId) throw new Error(`Model mismatch: expected ${planeId}, got ${p.model}`);
    
    // Simulate flight controls: Climb, Dive, Accel, Brake
    game.input.keys['ArrowUp'] = true;
    game.entities.updatePlayer(game.input);
    game.input.keys['ArrowUp'] = false;

    game.input.keys['ArrowDown'] = true;
    game.entities.updatePlayer(game.input);
    game.input.keys['ArrowDown'] = false;

    game.input.keys['ArrowRight'] = true;
    game.entities.updatePlayer(game.input);
    game.input.keys['ArrowRight'] = false;

    // Check speed is within bounds
    if (p.currentSpeed < p.minSpeed - 1.0 || p.currentSpeed > p.maxSpeed + 1.0) {
      throw new Error(`Speed out of bounds: ${p.currentSpeed} (min: ${p.minSpeed}, max: ${p.maxSpeed})`);
    }
    // Check no NaN in x, y, angle
    if (isNaN(p.x) || isNaN(p.y) || isNaN(p.angle)) {
      throw new Error(`NaN in player state: x=${p.x}, y=${p.y}, angle=${p.angle}`);
    }
  });
});

// 2. Test All Weapons Firing & Physics
console.log('\n--- 2. Testing All Weapons Firing & Physics ---');
test('Iron Bomb Drop and Ground Explosion', () => {
  const prevCount = game.weapons.bombs.length;
  game.weapons.dropIronBomb(500, 200, 4, 0);
  if (game.weapons.bombs.length !== prevCount + 1) throw new Error('Bomb not added');
  for (let i = 0; i < 60; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
});

test('Cluster Munition Drop and Submunition Dispersion', () => {
  game.weapons.dropClusterBomb(500, 150, 4, 0);
  for (let i = 0; i < 50; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
});

test('Tactical Nuclear Bomb Drop and Vitrification Physics', () => {
  game.weapons.dropNuke(600, 100, 4, 0);
  for (let i = 0; i < 120; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
  if (game.weapons.vitrifiedCraters.length === 0) throw new Error('Vitrified crater not generated on nuke explosion');
});

test('Napalm Canister Drop and Expanding Firestorm Pools', () => {
  game.weapons.dropNapalm(700, 100, 3, 0);
  for (let i = 0; i < 120; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
  if (game.weapons.napalmFires.length === 0) throw new Error('Napalm firestorm not ignited');
});

test('Hydra-70 Rocket Pods Salvo', () => {
  game.weapons.fireRocket(500, 300, 0, 4);
  for (let i = 0; i < 40; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
});

test('AGM-114 Laser-Guided Hellfire Missile', () => {
  game.weapons.fireHellfire(500, 300, 0, 800, 500);
  for (let i = 0; i < 50; i++) {
    game.weapons.update(game.terrain, game.entities);
  }
});

test('FPV Kamikaze Combat Drone Full Strike Cycle', () => {
  game.startNewGame('tomcat');
  game.entities.spawnWave(2);
  const ok = game.entities.deployFpvDroneStrike();
  if (!ok) throw new Error('FPV drone failed to deploy');
  if (game.entities.drones.length === 0) throw new Error('Drone not in active array');
  for (let i = 0; i < 150; i++) {
    game.entities.updateDrones();
  }
});

// 3. Test All Enemy Types and AI
console.log('\n--- 3. Testing All Enemy Types and AI ---');
test('Wave 1 Spawning and Enemy Update Loop', () => {
  game.entities.spawnWave(1);
  for (let i = 0; i < 30; i++) {
    game.entities.updateEnemies();
  }
});

test('Wave 3 Pantsir-S1 Spawning and Autocannon / SAM Defense', () => {
  game.entities.spawnWave(3);
  const pantsir = game.entities.enemies.find(e => e.type === 'pantsir');
  if (!pantsir) throw new Error('Pantsir-S1 missing at Wave 3');
  for (let i = 0; i < 40; i++) {
    game.entities.updateEnemies();
  }
});

test('Wave 4 Tu-22M3 Backfire Supersonic Raid & Kh-22 Cruise Missile Launch', () => {
  game.entities.spawnWave(4);
  game.entities.spawnStrategicBomber(4);
  const b = game.entities.bombers[0];
  if (!b) throw new Error('Tu-22M3 bomber missing');
  game.entities.player.x = b.x - 500;
  game.entities.player.y = b.y + 150;
  b.missileCooldown = 0;
  game.entities.updateBombers();
  const kh22 = game.entities.samMissiles.find(m => m.isKh22);
  if (!kh22) throw new Error('Kh-22 cruise missile not launched by Backfire');
});

// 4. Test Game States & Transitions
console.log('\n--- 4. Testing State Machine Transitions ---');
test('State Transitions: TITLE -> PLAYING -> ARMORY -> CODEX -> WAVE_COMPLETE -> GAMEOVER', () => {
  game.state = 'TITLE';
  game.startNewGame('warthog');
  if (game.state !== 'PLAYING') throw new Error(`Expected PLAYING, got ${game.state}`);

  game.openArmory();
  if (game.state !== 'ARMORY') throw new Error(`Expected ARMORY, got ${game.state}`);
  game.closeArmory();
  if (game.state !== 'PLAYING') throw new Error(`Expected PLAYING, got ${game.state}`);

  game.openCodex();
  if (game.state !== 'CODEX') throw new Error(`Expected CODEX, got ${game.state}`);
  game.closeCodex();
  if (game.state !== 'PLAYING') throw new Error(`Expected PLAYING, got ${game.state}`);

  game.state = 'PLAYING';
  game.handlePlayerDeath('test crash');
  for (let i = 0; i < 120; i++) {
    game.update();
  }
  if (game.state !== 'GAMEOVER') throw new Error(`Expected GAMEOVER, got ${game.state}`);
});

// 5. Test Full Render Pass (No Canvas Exceptions)
console.log('\n--- 5. Testing Full Canvas Render Pass for All States ---');
const ctx = new MockCanvasContext();
['TITLE', 'PLAYING', 'ARMORY', 'CODEX', 'WAVE_COMPLETE', 'GAMEOVER'].forEach(st => {
  test(`Render frame in state: ${st}`, () => {
    game.state = st;
    game.renderer.render(game);
  });
});

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
else process.exit(0);
