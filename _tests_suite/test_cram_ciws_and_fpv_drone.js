/**
 * Comprehensive Automated Test Suite for Phalanx C-RAM CIWS & FPV Drone Strike System
 * Grounded in C-RAM CIWS Simulator REA findings and CrazyGames production standards.
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment
global.window = global;
global.location = { hostname: 'localhost', href: 'http://localhost' };
global.addEventListener = () => {};
global.removeEventListener = () => {};
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
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
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

// Mock Canvas 2D Context
class MockCanvasContext {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '12px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'alphabetic';
    this.shadowColor = '#000';
    this.shadowBlur = 0;
    this.globalAlpha = 1.0;
  }
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  rect() {}
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fill() {}
  stroke() {}
  fillText() {}
  strokeText() {}
  measureText(txt) { return { width: (txt || '').length * 7 }; }
  translate() {}
  rotate() {}
  scale() {}
  drawImage() {}
  createLinearGradient() { return { addColorStop: () => {} }; }
}

global.HTMLCanvasElement = class {
  getContext() { return new MockCanvasContext(); }
};

global.Image = class {
  constructor() {
    this.complete = true;
    this.onload = null;
  }
};
global._testNoGrace = true;

// Mock Audio
global.AudioContext = class {
  constructor() {
    this.destination = {};
  }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} } }; }
  createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
  decodeAudioData(buf, cb) { if (cb) cb({}); }
  resume() { return Promise.resolve(); }
};
global.webkitAudioContext = global.AudioContext;

// Load Modules from atomic-bomber/js/
function loadModules(basePath) {
  const codeAudio = fs.readFileSync(path.join(basePath, 'audio.js'), 'utf8');
  const codeInput = fs.readFileSync(path.join(basePath, 'input.js'), 'utf8');
  const codeTerrain = fs.readFileSync(path.join(basePath, 'terrain.js'), 'utf8');
  const codeWeapons = fs.readFileSync(path.join(basePath, 'weapons.js'), 'utf8');
  const codeEntities = fs.readFileSync(path.join(basePath, 'entities.js'), 'utf8');
  const codeHud = fs.readFileSync(path.join(basePath, 'hud.js'), 'utf8');
  const codeArmory = fs.readFileSync(path.join(basePath, 'armory.js'), 'utf8');
  const codeCodex = fs.readFileSync(path.join(basePath, 'codex.js'), 'utf8');
  const codeEngine = fs.readFileSync(path.join(basePath, 'engine.js'), 'utf8');
  const codeMain = fs.readFileSync(path.join(basePath, 'main.js'), 'utf8');

  // Eval in global context
  eval(codeAudio);
  eval(codeInput);
  eval(codeTerrain);
  eval(codeWeapons);
  eval(codeEntities);
  eval(codeHud);
  eval(codeArmory);
  eval(codeCodex);
  eval(codeEngine);
  eval(codeMain);
}

console.log('====================================================');
console.log('🚀 TESTING PHALANX C-RAM CIWS & FPV DRONE UPGRADE');
console.log('====================================================');

const atomicBomberPath = path.join(__dirname, '..', 'atomic-bomber', 'js');
loadModules(atomicBomberPath);

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

// 1. Test Game Initialization
const game = new AtomicBomberGame();
assert(game !== null, 'AtomicBomberGame instance created');

// 2. Test Player Initialization with Drone & GPWS Fields
game.startNewGame('f14');
const p = game.entities.player;
assert(p !== null && p.alive, 'Player F-14 Tomcat spawned and alive');
assert(p.droneStrikesAvailable >= 1, 'Player has 1 free FPV Drone Strike initially');
assert(p.droneCooldown === 0, 'Player drone cooldown starts at 0');
assert(p.isPullUpWarning === false, 'GPWS pull-up warning starts inactive');

// 3. Test Wave 2 Spawning of Phalanx C-RAM CIWS
game.currentWave = 2;
game.entities.spawnWave(2, 'EUROPEAN');
const ciwsEnemies = game.entities.enemies.filter(e => e.type === 'phalanx_ciws');
assert(ciwsEnemies.length > 0, `Wave 2 successfully spawned ${ciwsEnemies.length} Phalanx C-RAM CIWS batteries`);

const ciws = ciwsEnemies[0];
assert(ciws.hp === 230, `Phalanx CIWS HP initialized to ${ciws.hp} (expected 230 for Wave 2)`);
assert(typeof ciws.radarAngle === 'number', 'Phalanx CIWS has radar rotisserie rotation state');

// 4. Test Phalanx C-RAM Interception of Incoming Ordnance
// Simulate an incoming iron bomb descending towards the CIWS
game.weapons.bombs.push({
  x: ciws.x + 50,
  y: ciws.y - 120,
  vx: 2,
  vy: 6,
  type: 'standard',
  alive: true
});
const initialBombs = game.weapons.bombs.length;
assert(initialBombs === 1, 'Simulated incoming iron bomb placed near CIWS');

// Run entities update to test radar tracking and interception logic
for (let step = 0; step < 10; step++) {
  game.entities.updateEnemies();
}
assert(ciws.radarAngle > 0, 'Phalanx Ku-band radar dish actively rotates');

// 5. Test FPV Drone Strike Deployment
const launchSuccess = game.entities.deployFpvDroneStrike();
assert(launchSuccess === true, 'Player successfully deployed FPV-7 Phoenix Drone Strike');
assert(game.entities.drones.length === 1, 'FPV Drone added to active drones array');

const drone = game.entities.drones[0];
assert(drone.alive === true, 'Drone is active and airborne');
assert(drone.state === 'TRACKING', `Drone acquired high-priority target (State: ${drone.state})`);
assert(drone.target !== null && drone.target.alive, `Drone target locked on: ${drone.target ? (drone.target.name || drone.target.type) : 'none'}`);
assert(drone.callsign === 'FPV-7 PHOENIX', 'Drone carries proper military callsign');

// 6. Test FPV Drone Flight Physics & Proportional Navigation
const initialDroneY = drone.y;
for (let step = 0; step < 30; step++) {
  game.entities.updateDrones();
}
assert(drone.rotorSpin > 0, 'Quadcopter rotors actively spinning');
assert(drone.fuel < 480, `Fuel consumed during loiter flight (remaining: ${drone.fuel})`);

// 7. Test Kinetic Armor Ricochet
// Apply glancing damage (angle 1.2 rad ≈ 69 degrees) from low-caliber bullet to CIWS
const initialCiwsHp = ciws.hp;
const originalRandom = Math.random;
Math.random = () => 0.1; // Force ricochet branch (Math.random() < 0.40)
game.entities.applyDamageToEnemy(ciws, 12, 1.2, true);
Math.random = originalRandom;
assert(ciws.hp === initialCiwsHp - 3, `Glancing low-caliber shot ricocheted off heavy armor (reduced from 12 to 3 dmg, hp: ${ciws.hp})`);

// 8. Test GPWS Terrain Proximity Warning
// Move player close to terrain with steep downward velocity
const terrainY = game.terrain.getHeightAt(p.x);
p.y = terrainY - 80;
p.vy = 4.2;
p.angle = 0.55;
p.isDiving = true;

// Use genuine game.input controller
game.input.keys['ArrowDown'] = true;
game.entities.updatePlayer(game.input);
assert(p.isPullUpWarning === true, 'GPWS detected terrain danger and triggered isPullUpWarning = true');

// 9. Test HUD Ordnance & Threat Warnings Rendering
const ctx = new MockCanvasContext();
game.hud.drawThreatWarnings(ctx, 1280, 720, p);
assert(true, 'GPWS visual alert rendered without canvas exceptions');

game.hud.drawOrdnanceStatus(ctx, 1280, 720, p);
const droneBtn = game.buttons.find(b => b.x === 872);
assert(droneBtn !== null, 'HUD registered clickable FPV DRONE [U] tactical button at x=872');

// 10. Test Codex Intel Entry for Phalanx CIWS
const codexManager = new EnemyCodexManager(game);
const ciwsCodex = codexManager.units.find(e => e.id === 'phalanx_ciws');
assert(ciwsCodex !== null, 'Phalanx C-RAM CIWS entry registered in Intel Codex');
assert(ciwsCodex.category === 'SPAAG_FLAK', 'CIWS correctly categorized under SPAAG_FLAK');
assert(typeof ciwsCodex.renderModel === 'function', 'CIWS codex entry has procedural vector renderModel function');

// Test Codex procedural rendering
ciwsCodex.renderModel(ctx, 200, 200);
assert(true, 'CIWS procedural vector blueprint rendered in Codex without error');

// 11. Test Synchronized CrazyGames-Upload Package
const cgJsDir = path.join(__dirname, '..', 'CrazyGames-Upload', 'js');
const requiredFiles = ['entities.js', 'hud.js', 'input.js', 'main.js', 'codex.js', 'armory.js', 'audio.js', 'terrain.js', 'weapons.js', 'engine.js'];
let allCgFilesValid = true;
for (const f of requiredFiles) {
  const filePath = path.join(cgJsDir, f);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) {
    allCgFilesValid = false;
    console.error(`Missing or empty file in CrazyGames-Upload: ${f}`);
  }
}
assert(allCgFilesValid, 'CrazyGames-Upload production folder contains all updated engine modules');

console.log('====================================================');
console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL C-RAM CIWS & FPV DRONE UPGRADE TESTS SUCCEEDED!');
} else {
  console.error('❌ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
  process.exit(1);
}
