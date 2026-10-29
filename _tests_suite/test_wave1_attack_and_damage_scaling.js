const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== VERIFYING WAVE 1 ACTIVE ATTACKS & PROGRESSIVE DAMAGE SCALING ===\n');

// Mock DOM and browser environment
const dom = {
  getElementById: (id) => ({
    getContext: () => ({
      save: () => {}, restore: () => {}, fillRect: () => {}, strokeRect: () => {},
      fillText: () => {}, strokeText: () => {}, beginPath: () => {}, moveTo: () => {},
      lineTo: () => {}, arc: () => {}, stroke: () => {}, fill: () => {},
      drawImage: () => {}, measureText: () => ({ width: 50 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {}
    }),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
  })
};

const sandbox = {
  window: {},
  document: dom,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  Image: class { constructor() { this.complete = true; } },
  AudioContext: class {
    constructor() {
      this.currentTime = 10.0;
      this.sampleRate = 44100;
      this.state = 'running';
      this.destination = {};
    }
    createGain() { return { gain: { value: 1.0, cancelScheduledValues: () => {}, setTargetAtTime: () => {} }, connect: () => {} }; }
    createOscillator() { return { type: 'sine', frequency: { value: 440, setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: { value: 300 }, Q: { value: 1 }, connect: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { buffer: null, loop: false, connect: () => {}, start: () => {}, stop: () => {} }; }
    resume() { return Promise.resolve(); }
  },
  SpeechSynthesisUtterance: class {
    constructor(text) { this.text = text; }
  }
};
sandbox.window = sandbox;
sandbox.window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };

const context = vm.createContext(sandbox);

const scripts = [
  'atomic-bomber/js/audio.js',
  'atomic-bomber/js/terrain.js',
  'atomic-bomber/js/weapons.js',
  'atomic-bomber/js/entities.js'
];

for (const s of scripts) {
  const code = fs.readFileSync('C:/REA/' + s, 'utf8');
  vm.runInContext(code, context);
}

const terrain = new sandbox.TerrainEngine(4800, 720);
terrain.setMap('EUROPEAN', 1);

const mockGame = {
  terrain: terrain,
  sprites: {},
  buttons: [],
  currentWave: 1,
  currentTheater: 'EUROPEAN',
  armory: { state: { selectedPlane: 'standard' }, getPlaneUpgrades: () => ({}) },
  weapons: new sandbox.WeaponManager(null, terrain),
  setRadioMessage: () => {},
  addFloatingText: () => {}
};
mockGame.weapons.game = mockGame;

const em = new sandbox.EntityManager(mockGame);
em.initPlayer('standard');

// --- TEST 1: Wave 1 Active Attacks (Tanks, Jeeps & ZSU all actively attack!) ---
console.log('--- 1. Testing Wave 1 Active Attacks ---');
em.spawnWave(1, 'EUROPEAN');

const tank = em.enemies.find(e => e.type === 'tank');
const jeep = em.enemies.find(e => e.type === 'jeep');
const zsu = em.enemies.find(e => e.type === 'zsu57');

assert(tank, 'Tank must exist in Wave 1');
assert(jeep, 'Jeep must exist in Wave 1');
assert(zsu, 'ZSU must exist in Wave 1');

// Position player in combat range above enemies
em.player.x = tank.x + 80;
em.player.y = tank.y - 150;
em.player.alive = true;
em.enemyBullets = [];

// Force fire timers to 0 to trigger immediate attack
tank.fireTimer = 0;
em.updateEnemies();
assert(em.enemyBullets.length > 0, 'Tank MUST actively shoot at player in Wave 1!');
const tankBullet = em.enemyBullets[em.enemyBullets.length - 1];
console.log(`[PASS] Tank actively shoots in Wave 1! Bullet dmg: ${tankBullet.damage} HP`);
assert.strictEqual(tankBullet.damage, 7, 'Wave 1 tank bullet damage must be gentle (7 HP)');

// Test Jeep active attack
em.enemyBullets = [];
em.player.x = jeep.x + 50;
em.player.y = jeep.y - 120;
jeep.fireTimer = 0;
em.updateEnemies();
assert(em.enemyBullets.length > 0, 'Jeep MUST actively shoot machine-gun at player in Wave 1!');
const jeepBullet = em.enemyBullets[em.enemyBullets.length - 1];
console.log(`[PASS] Jeep actively shoots in Wave 1! Bullet dmg: ${jeepBullet.damage} HP`);
assert.strictEqual(jeepBullet.damage, 4, 'Wave 1 jeep bullet damage must be gentle (4 HP)');

// Test ZSU-57 active flak attack
em.enemyBullets = [];
em.player.x = zsu.x + 60;
em.player.y = zsu.y - 180;
zsu.fireTimer = 0;
em.updateEnemies();
const flakBullet = em.enemyBullets.find(b => b.isFlak);
assert(flakBullet, 'ZSU-57 MUST actively fire anti-aircraft flak in Wave 1!');
console.log(`[PASS] ZSU-57 actively shoots flak in Wave 1! Flak dmg: ${flakBullet.damage} HP, blast: ${flakBullet.blastRadius}px`);
assert.strictEqual(flakBullet.damage, 9, 'Wave 1 flak burst damage must be gentle (9 HP)');

// --- TEST 2: Damage Scaling Across Progressive Waves ---
console.log('\n--- 2. Testing Progressive Damage Scaling Across Waves ---');

// Check Tank Damage Scaling
const w1TankDmg = 7;
em.fireGroundBullet(0, 0, 100, 100, false, 2, 'tank');
const w2TankDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireGroundBullet(0, 0, 100, 100, false, 3, 'tank');
const w3TankDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireGroundBullet(0, 0, 100, 100, false, 5, 'tank');
const w5TankDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;

console.log(`Tank Damage: Wave 1 = ${w1TankDmg} HP -> Wave 2 = ${w2TankDmg} HP -> Wave 3 = ${w3TankDmg} HP -> Wave 5 = ${w5TankDmg} HP`);
assert(w2TankDmg > w1TankDmg, 'Wave 2 tank damage must be higher than Wave 1');
assert(w3TankDmg > w2TankDmg, 'Wave 3 tank damage must be higher than Wave 2');
assert(w5TankDmg > w3TankDmg, 'Wave 5 tank damage must be higher than Wave 3');
console.log('[PASS] Tank damage scales progressively and smoothly across waves!');

// Check Jeep Damage Scaling
em.fireGroundBullet(0, 0, 100, 100, false, 1, 'jeep');
const w1JeepDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireGroundBullet(0, 0, 100, 100, false, 3, 'jeep');
const w3JeepDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireGroundBullet(0, 0, 100, 100, false, 5, 'jeep');
const w5JeepDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;

console.log(`Jeep Damage: Wave 1 = ${w1JeepDmg} HP -> Wave 3 = ${w3JeepDmg} HP -> Wave 5 = ${w5JeepDmg} HP`);
assert(w3JeepDmg > w1JeepDmg && w5JeepDmg > w3JeepDmg, 'Jeep machine-gun damage must scale with waves');
console.log('[PASS] Jeep damage scales progressively across waves!');

// Check ZSU Flak Damage Scaling
em.fireZsuFlak(0, 0, 100, 100, false, 1);
const w1FlakDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireZsuFlak(0, 0, 100, 100, false, 2);
const w2FlakDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;
em.fireZsuFlak(0, 0, 100, 100, false, 4);
const w4FlakDmg = em.enemyBullets[em.enemyBullets.length - 1].damage;

console.log(`Flak Damage: Wave 1 = ${w1FlakDmg} HP -> Wave 2 = ${w2FlakDmg} HP -> Wave 4 = ${w4FlakDmg} HP`);
assert(w2FlakDmg > w1FlakDmg && w4FlakDmg > w2FlakDmg, 'Flak damage must scale with waves');
console.log('[PASS] Flak damage scales progressively across waves!');

// Check SAM Guided Missile Scaling
em.samMissiles = [];
em.launchSamMissile(0, 0, 1);
const w1SamDmg = em.samMissiles[0].damage;
em.launchSamMissile(0, 0, 3);
const w3SamDmg = em.samMissiles[1].damage;
em.launchSamMissile(0, 0, 6);
const w6SamDmg = em.samMissiles[2].damage;

console.log(`SAM Damage: Wave 1 = ${w1SamDmg} HP -> Wave 3 = ${w3SamDmg} HP -> Wave 6 = ${w6SamDmg} HP`);
assert(w3SamDmg > w1SamDmg && w6SamDmg > w3SamDmg, 'SAM missile damage must scale with waves');
console.log('[PASS] SAM missile damage scales progressively across waves!');

// --- TEST 3: Player Health Impact in Wave 1 (Gentle chip vs Instant kill) ---
console.log('\n--- 3. Testing Player Damage Absorption in Wave 1 ---');
em.player.hp = 100;
em.player.maxHp = 100;
em.player.invulnerableTimer = 0;
em.player.flakResistance = 0;

// Simulate Tank hit on player
em.enemyBullets = [{
  x: em.player.x,
  y: em.player.y,
  vx: 0, vy: 0,
  life: 10,
  damage: 7,
  alive: true
}];
em.updateEnemies();
console.log(`Player HP after 1 Wave 1 tank hit: ${em.player.hp} / 100 (took ${100 - em.player.hp} damage)`);
assert.strictEqual(em.player.hp, 93, 'Player must lose exactly 7 HP from a Wave 1 tank shell');
assert(em.player.alive, 'Player must comfortably survive multiple hits in Wave 1');
console.log('[PASS] Wave 1 damage allows player to feel combat danger without instant unfair death!');

console.log('\n🌟 ALL WAVE 1 ATTACK & DAMAGE SCALING TESTS PASSED PERFECTLY (100%)!');
