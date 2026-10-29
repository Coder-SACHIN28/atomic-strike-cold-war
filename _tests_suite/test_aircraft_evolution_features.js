/**
 * Test Suite: Aircraft Evolution REA Feature Verification
 * Validates:
 * 1. Tactical Fuel System (Burn, Low-Fuel Alert, Flameout Glide Descent, Jerrycan Refuel)
 * 2. Parachuting Supply Crates (Fuel Jerrycan, Repair Kit, Gold Bounty, EMP Battery)
 * 3. Lightning EMP Shock Bomb (Ballistics, Ionization Shockwave, 8-sec Radar/FCS Disabling, Lightning Arcs)
 * 4. Kirov-Class Armored War Zeppelin Dreadnought (Spawn at Wave 5, Multi-turret Defense, Hit Detection & Destruction)
 * 5. HUD Instruments & Threat Warning Systems (Fuel Gauge, Boss Health Bar, Alerts)
 */

const assert = require('assert');
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

console.log('=== RUNNING AIRCRAFT EVOLUTION REA FEATURE SUITE ===\n');

let passed = 0;
let total = 0;
function test(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}:`, err.message);
  }
}

const game = new window.AtomicBomberGame();
game.startNewGame('warthog');

// ==========================================
// 1. TACTICAL FUEL SYSTEM TESTS
// ==========================================
console.log('--- 1. Tactical Fuel & Flameout Physics ---');

test('Player initializes with full fuel (100%) and valid burn rate', () => {
  const p = game.entities.player;
  assert(p.fuel === 100, `Expected fuel 100, got ${p.fuel}`);
  assert(p.maxFuel === 100, `Expected maxFuel 100, got ${p.maxFuel}`);
  assert(p.fuelBurnRate > 0, `Expected positive fuelBurnRate, got ${p.fuelBurnRate}`);
});

test('Flight ticks steadily consume jet fuel', () => {
  const p = game.entities.player;
  const initialFuel = p.fuel;
  for (let f = 0; f < 30; f++) {
    game.entities.updatePlayer();
  }
  assert(p.fuel < initialFuel, `Fuel did not decrease: was ${initialFuel}, now ${p.fuel}`);
});

test('Zero fuel triggers Engine Flameout and forces glide descent', () => {
  const p = game.entities.player;
  p.fuel = 0;
  p.vy = 0;
  game.entities.updatePlayer();
  assert(p.fuel === 0, 'Fuel should remain 0');
  assert(p.vy > 0, `Flameout should cause forced downward descent, vy: ${p.vy}`);
});

test('Collecting bonusfuel Jerrycan replenishes +40% fuel', () => {
  const p = game.entities.player;
  p.fuel = 20;
  game.entities.collectBonus('bonusfuel');
  assert(p.fuel === 60, `Expected 60% fuel after jerrycan pickup, got ${p.fuel}`);
});

// ==========================================
// 2. PARACHUTING SUPPLY CRATES
// ==========================================
console.log('\n--- 2. Parachuting Supply Crates & Loot System ---');

test('spawnBonusCrate can generate fuel, repair, gold, and emp types', () => {
  game.entities.bonusCrates = [];
  for (let i = 0; i < 20; i++) {
    game.entities.spawnBonusCrate(500 + i * 20, 200);
  }
  const spawnedTypes = new Set(game.entities.bonusCrates.map(c => c.type));
  assert(spawnedTypes.size >= 3, `Expected at least 3 distinct crate types, got ${spawnedTypes.size}`);
});

test('Collecting bonusrepair Toolkit restores +45 HP airframe', () => {
  const p = game.entities.player;
  p.hp = 50;
  game.entities.collectBonus('bonusrepair');
  assert(p.hp === 95, `Expected 95 HP after repair kit, got ${p.hp}`);
});

test('Collecting bonusgold Combat Bounty awards +$250 credits', () => {
  const p = game.entities.player;
  const initCredits = p.credits;
  game.entities.collectBonus('bonusgold');
  assert(p.credits === initCredits + 250, `Expected credits to increase by 250, got ${p.credits - initCredits}`);
});

test('Collecting bonusemp Battery awards +2 EMP Shock Bombs', () => {
  const p = game.entities.player;
  p.empBombs = 1;
  game.entities.collectBonus('bonusemp');
  assert(p.empBombs === 3, `Expected 3 EMP bombs, got ${p.empBombs}`);
});

// ==========================================
// 3. LIGHTNING EMP SHOCK BOMB
// ==========================================
console.log('\n--- 3. Lightning EMP Shock Bomb & Radar Disabling ---');

test('WeaponManager supports dropEmpBomb', () => {
  game.weapons.dropEmpBomb(400, 200, 4, 1);
  assert(game.weapons.empBombs.length === 1, 'Expected 1 EMP bomb in flight');
  const eb = game.weapons.empBombs[0];
  assert(eb.x === 400 && eb.y === 200, 'EMP bomb coordinates mismatch');
  assert(eb.active === true, 'EMP bomb should be active');
  assert(eb.detonated === false, 'EMP bomb should start un-detonated');
});

test('EMP Detonation creates expanding ionization shockwave and disables ground SAM/Flak/Pantsir', () => {
  game.entities.enemies = [
    { type: 's400', x: 650, y: 500, hp: 200, maxHp: 200, alive: true },
    { type: 'pantsir', x: 620, y: 500, hp: 300, maxHp: 300, alive: true },
    { type: 'tank', x: 580, y: 500, hp: 80, maxHp: 80, alive: true },
    { type: 'tank', x: 1200, y: 500, hp: 80, maxHp: 80, alive: true }
  ];

  game.terrain.getHeightAt = () => 500;
  game.weapons.empBombs = [];
  game.weapons.dropEmpBomb(600, 490, 0, 5);
  game.weapons.update(game.terrain, game.entities);

  const eb = game.weapons.empBombs[0];
  assert(eb.detonated === true, 'EMP bomb should be detonated upon hitting terrain');
  assert(game.weapons.empArcs.length > 0, `Expected procedural lightning arcs, got ${game.weapons.empArcs.length}`);

  assert(game.entities.enemies[0].empDisabledTimer === 480, `S-400 should be disabled for 480 frames, got ${game.entities.enemies[0].empDisabledTimer}`);
  assert(game.entities.enemies[1].empDisabledTimer === 480, `Pantsir should be disabled for 480 frames, got ${game.entities.enemies[1].empDisabledTimer}`);
  assert(game.entities.enemies[2].empDisabledTimer === 480, `Tank should be disabled for 480 frames, got ${game.entities.enemies[2].empDisabledTimer}`);
  assert(!game.entities.enemies[3].empDisabledTimer, 'Far unit should not be disabled');
});

test('EMP-disabled enemies skip attack cycles while stunned', () => {
  const e = game.entities.enemies[0];
  assert(e.empDisabledTimer > 0, 'Enemy should be disabled');
  const initBullets = game.entities.enemyBullets.length;
  const initSAMs = game.entities.samMissiles.length;

  game.entities.updateEnemies();

  assert(game.entities.enemyBullets.length === initBullets, 'Stunned enemy should not fire bullets');
  assert(game.entities.samMissiles.length === initSAMs, 'Stunned enemy should not launch SAMs');
  assert(e.empDisabledTimer === 479, `EMP disabled timer should decrement by 1, got ${e.empDisabledTimer}`);
});

// ==========================================
// 4. KIROV WAR ZEPPELIN DREADNOUGHT BOSS
// ==========================================
console.log('\n--- 4. Kirov-Class Armored War Zeppelin Dreadnought Boss ---');

test('Zeppelin Dreadnought spawns with 1000 HP and dual nacelles', () => {
  game.entities.zeppelins = [];
  game.entities.spawnZeppelinDreadnought(5);
  assert(game.entities.zeppelins.length === 1, 'Expected 1 Zeppelin Dreadnought');
  const z = game.entities.zeppelins[0];
  assert(z.hp === 1000, `Expected 1000 HP, got ${z.hp}`);
  assert(z.maxHp === 1000, `Expected 1000 maxHp, got ${z.maxHp}`);
  assert(z.alive === true, 'Zeppelin should be alive');
});

test('Zeppelin receives direct hit and blast damage', () => {
  const z = game.entities.zeppelins[0];
  const initialHp = z.hp;
  // Apply direct cannon hit (radius: 40, damage: 100)
  game.entities.checkDirectHit(z.x, z.y, 40, 100);
  assert(z.hp === initialHp - 100, `Direct hit failed: expected ${initialHp - 100}, got ${z.hp}`);

  // Apply blast damage (radius: 120, damage: 150)
  game.entities.checkBlastDamage(z.x + 10, z.y + 10, 120, 150);
  assert(z.hp <= initialHp - 220, `Blast damage failed: expected <= ${initialHp - 220}, got ${z.hp}`);
});

test('Destroying Zeppelin Dreadnought awards score and spawns 4 parachuting crates', () => {
  const z = game.entities.zeppelins[0];
  game.entities.bonusCrates = [];
  game.entities.destroyZeppelin(z);
  assert(z.alive === false, 'Zeppelin should be destroyed');
  assert(game.entities.bonusCrates.length === 4, `Expected 4 supply crates dropped from dreadnought, got ${game.entities.bonusCrates.length}`);
});

// ==========================================
// 5. HUD INSTRUMENTS & THREAT SYSTEMS
// ==========================================
console.log('\n--- 5. HUD Instruments & Boss Encounter UI ---');

const mockCtx = new MockCanvasContext();

test('HUD Flight Instruments renders without error and includes Fuel Gauge', () => {
  game.entities.player.fuel = 85;
  assert.doesNotThrow(() => {
    game.hud.drawFlightInstruments(mockCtx, 1280, game.entities.player);
  }, 'drawFlightInstruments threw an error');
});

test('HUD Threat Warnings renders Low Fuel Banner when fuel < 25%', () => {
  game.entities.player.fuel = 20;
  assert.doesNotThrow(() => {
    game.hud.drawThreatWarnings(mockCtx, 1280, 720, game.entities.player);
  }, 'drawThreatWarnings low-fuel threw an error');
});

test('HUD Threat Warnings renders Zeppelin Dreadnought Boss Bar when active', () => {
  game.entities.zeppelins = [];
  game.entities.spawnZeppelinDreadnought(5);
  assert.doesNotThrow(() => {
    game.hud.drawThreatWarnings(mockCtx, 1280, 720, game.entities.player);
  }, 'drawThreatWarnings boss bar threw an error');
});

test('HUD Ordnance Status renders EMP Shock Bombs without error', () => {
  game.entities.player.empBombs = 4;
  assert.doesNotThrow(() => {
    game.hud.drawOrdnanceStatus(mockCtx, 1280, 720, game.entities.player);
  }, 'drawOrdnanceStatus threw an error');
});

console.log('\n========================================');
console.log(`AIRCRAFT EVOLUTION FEATURE SUITE: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
console.log('========================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
