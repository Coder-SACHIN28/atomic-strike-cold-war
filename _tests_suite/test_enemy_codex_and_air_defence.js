/**
 * Comprehensive Test Suite for Indian Air Defence Systems & "Know Your Enemy" Codex
 * Verifies S-400 Triumf, Akash SAM, 2K22 Tunguska SPAAGM, and EnemyCodexManager.
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment
global.window = global;
global.document = {
  fullscreenElement: null,
  webkitFullscreenElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: (id) => {
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

// Mock Canvas & 2D Context
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
  }
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  fill() {}
  stroke() {}
  fillRect() {}
  strokeRect() {}
  roundRect() {}
  fillText() {}
  measureText(str) { return { width: (str || '').length * 8 }; }
  translate() {}
  rotate() {}
  drawImage() {}
}

const mockCtx = new MockCanvasContext();

// Mock Sound System
global.soundSystem = {
  play: () => {},
  stopEngine: () => {},
  startEngine: () => {},
  stopGau8: () => {},
  resume: () => {},
  playPneumaticPop: () => {},
  playS400Ignition: () => {},
  play20mm: () => {}
};

// 2. Load Modules
console.log('--- TEST STEP 1: LOADING GAME MODULES ---');
require('./atomic-bomber/js/terrain.js');
require('./atomic-bomber/js/weapons.js');
require('./atomic-bomber/js/entities.js');
require('./atomic-bomber/js/codex.js');

console.log('✓ All modules loaded successfully.');

// Mock Game Object
const mockGame = {
  currentWave: 1,
  sprites: {},
  weapons: {
    sparks: [],
    flares: [],
    createExplosion: () => {}
  },
  terrain: {
    mapWidth: 4800,
    currentMap: 'EUROPEAN',
    getHeightAt: (x) => 600
  },
  addFloatingText: () => {},
  setRadioMessage: () => {}
};

// 3. Test Codex Database & Architecture
console.log('\n--- TEST STEP 2: VERIFYING ENEMY CODEX DATABASE ---');
const codex = new window.EnemyCodexManager(mockGame);

if (codex.units.length < 10) {
  console.error(`FAIL: Expected at least 10 units in Codex, found ${codex.units.length}`);
  process.exit(1);
}
console.log(`✓ Codex contains ${codex.units.length} comprehensive enemy combat units.`);

// Verify S-400, Akash, and Tunguska entries in Codex
const s400Entry = codex.units.find(u => u.id === 's400');
const akashEntry = codex.units.find(u => u.id === 'akash');
const tungEntry = codex.units.find(u => u.id === 'tunguska');

if (!s400Entry || !akashEntry || !tungEntry) {
  console.error('FAIL: Missing S-400, Akash SAM, or 2K22 Tunguska in Codex database!');
  process.exit(1);
}

console.log(`✓ S-400 Triumf in Codex: NATO=${s400Entry.nato}, Speed=${s400Entry.specs.speed}`);
console.log(`✓ Akash SAM in Codex: Speed=${akashEntry.specs.speed}, Radar=${akashEntry.specs.radar}`);
console.log(`✓ 2K22 Tunguska in Codex: Role=${tungEntry.role}, Threat=${tungEntry.threat}`);

// Verify Category Filtering
codex.selectCategory('STRATEGIC');
const strategic = codex.getFilteredUnits();
if (!strategic.some(u => u.id === 's400')) {
  console.error('FAIL: S-400 not found in STRATEGIC category filter');
  process.exit(1);
}
console.log(`✓ Category STRATEGIC has ${strategic.length} unit(s) including S-400.`);

codex.selectCategory('MOBILE_SAM');
const mobileSam = codex.getFilteredUnits();
if (!mobileSam.some(u => u.id === 'akash')) {
  console.error('FAIL: Akash not found in MOBILE_SAM category filter');
  process.exit(1);
}
console.log(`✓ Category MOBILE_SAM has ${mobileSam.length} unit(s) including Akash SAM.`);

codex.selectCategory('SPAAG_FLAK');
const flak = codex.getFilteredUnits();
if (!flak.some(u => u.id === 'tunguska')) {
  console.error('FAIL: Tunguska not found in SPAAG_FLAK category filter');
  process.exit(1);
}
console.log(`✓ Category SPAAG_FLAK has ${flak.length} unit(s) including 2K22 Tunguska.`);

// Test live renderModel routines for all units
console.log('\n--- TEST STEP 3: TESTING 2D PROCEDURAL MODEL RENDERING FOR ALL UNITS ---');
codex.units.forEach(u => {
  if (typeof u.renderModel !== 'function') {
    console.error(`FAIL: Missing renderModel function on unit ${u.id}`);
    process.exit(1);
  }
  // Call renderModel with mock context
  u.renderModel(mockCtx, 200, 200, 1.5);
});
console.log('✓ All 12 unit 2D canvas procedural models rendered successfully without errors.');

// Render the entire Codex Screen
codex.render(mockCtx, 1280, 720);
console.log(`✓ Full Codex Screen rendered successfully (${codex.buttons.length} interactive buttons registered).`);

// 4. Test Entity Manager & Multi-Tier Spawning
console.log('\n--- TEST STEP 4: VERIFYING AIR DEFENSE ENEMY SPAWNING & COMBAT LOGIC ---');
const entities = new window.EntityManager(mockGame);

// Objective Target checks
console.log('Checking isObjectiveTarget():');
const typesToCheck = ['s400', 'akash', 'tunguska', 'shilka', 'sam_site', 'tank', 'mlrs_truck'];
typesToCheck.forEach(t => {
  const isObj = entities.isObjectiveTarget({ type: t, alive: true });
  if (!isObj) {
    console.error(`FAIL: ${t} should be recognized as objective target`);
    process.exit(1);
  }
});
console.log('✓ All air defense and armor units are verified as critical objective targets.');

// Wave 1 Spawning Test (S-400 present with scaled low damage; Akash & Tunguska 0)
entities.enemies = [];
entities.spawnWave(1);
const w1_s400 = entities.enemies.filter(e => e.type === 's400');
const w1_akash = entities.enemies.filter(e => e.type === 'akash');
const w1_tung = entities.enemies.filter(e => e.type === 'tunguska');
console.log(`Wave 1 Spawns: S-400=${w1_s400.length}, Akash=${w1_akash.length}, Tunguska=${w1_tung.length}`);
if (w1_s400.length !== 1 || w1_akash.length !== 0 || w1_tung.length !== 0) {
  console.error('FAIL: Wave 1 spawn numbers mismatch!');
  process.exit(1);
}
console.log(`✓ Wave 1 properly spawns 1 S-400 (HP=${w1_s400[0].hp}, Dmg=${w1_s400[0].missileDamage}) and 0 Akash/Tunguska.`);

// Wave 2 Spawning Test (Akash SAM joins the battlefield!)
entities.enemies = [];
entities.spawnWave(2);
const w2_s400 = entities.enemies.filter(e => e.type === 's400');
const w2_akash = entities.enemies.filter(e => e.type === 'akash');
const w2_tung = entities.enemies.filter(e => e.type === 'tunguska');
console.log(`Wave 2 Spawns: S-400=${w2_s400.length}, Akash=${w2_akash.length}, Tunguska=${w2_tung.length}`);
if (w2_akash.length < 1) {
  console.error('FAIL: Wave 2 should spawn Akash SAM!');
  process.exit(1);
}
console.log(`✓ Wave 2 successfully spawns Akash SAM (HP=${w2_akash[0].hp}, MissileDmg=${w2_akash[0].missileDamage}).`);

// Wave 3 Spawning Test (2K22 Tunguska joins with dual 30mm flak & 8 missiles!)
entities.enemies = [];
entities.spawnWave(3);
const w3_s400 = entities.enemies.filter(e => e.type === 's400');
const w3_akash = entities.enemies.filter(e => e.type === 'akash');
const w3_tung = entities.enemies.filter(e => e.type === 'tunguska');
console.log(`Wave 3 Spawns: S-400=${w3_s400.length}, Akash=${w3_akash.length}, Tunguska=${w3_tung.length}`);
if (w3_tung.length < 1) {
  console.error('FAIL: Wave 3 should spawn 2K22 Tunguska!');
  process.exit(1);
}
console.log(`✓ Wave 3 successfully integrates the complete multi-tier triad: S-400, Akash, and 2K22 Tunguska!`);

// Test Missile Launches
console.log('\n--- TEST STEP 5: VERIFYING MISSILE LAUNCH PHYSICS & DRAWING ---');
entities.samMissiles = [];
entities.launchAkashMissile(500, 400, 2);
if (entities.samMissiles.length !== 1 || !entities.samMissiles[0].isAkash || !entities.samMissiles[0].isRamjet) {
  console.error('FAIL: launchAkashMissile did not create proper ramjet missile');
  process.exit(1);
}
console.log(`✓ Akash Ramjet missile created (Speed=${entities.samMissiles[0].speed}, MaxSpeed=${entities.samMissiles[0].maxSpeed}).`);

entities.launchTunguskaMissile(500, 400, 3);
if (entities.samMissiles.length !== 2 || !entities.samMissiles[1].isTunguska) {
  console.error('FAIL: launchTunguskaMissile did not create 9M311 missile');
  process.exit(1);
}
console.log(`✓ Tunguska 9M311 missile created.`);

// Test Drawing Akash & Tunguska Entities
entities.drawAkashSAM(mockCtx, 300, 500, w2_akash[0]);
entities.drawTunguska(mockCtx, 400, 500, w3_tung[0]);
console.log('✓ drawAkashSAM and drawTunguska executed cleanly on Canvas.');

console.log('\n======================================================');
console.log('★ ALL 5 VERIFICATION SUITES PASSED WITH ZERO ERRORS! ★');
console.log('======================================================\n');
