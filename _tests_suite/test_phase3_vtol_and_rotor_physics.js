/**
 * Phase 3 VTOL & Rotor Physics Verification Test
 * Verifies Harrier VTOL hover lock, precision bomb release,
 * Apache auto-swivel 30mm chin turret tracking, Chinook automated door gunners,
 * and airborne field repair system.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- STARTING PHASE 3: VTOL & ROTOR PHYSICS VERIFICATION ---');

// 1. Setup Sandbox & Load Engine Scripts
const localStorageStore = {};
const sandbox = {
  window: {
    localStorage: {
      getItem: (k) => localStorageStore[k] || null,
      setItem: (k, v) => { localStorageStore[k] = v; },
      removeItem: (k) => { delete localStorageStore[k]; }
    },
    location: { search: '' },
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: {
      getVoices: () => [],
      cancel: () => {},
      speak: () => {}
    }
  },
  localStorage: {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = v; },
    removeItem: (k) => { delete localStorageStore[k]; }
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window.window = sandbox.window;

vm.createContext(sandbox);

const scripts = ['audio.js', 'input.js', 'terrain.js', 'weapons.js', 'armory.js', 'entities.js'];
scripts.forEach(s => {
  const code = fs.readFileSync(path.join(__dirname, 'atomic-bomber', 'js', s), 'utf8');
  vm.runInContext(code, sandbox);
});

console.log('[PASS] All engine modules loaded in sandbox without syntax errors.');

const mockGame = {
  renderer: { width: 1280, height: 720 },
  addFloatingText: () => {},
  triggerScreenShake: () => {},
  handlePlayerDeath: () => {},
  requestRewardedAd: (n, cb) => cb(),
  terrain: {
    mapWidth: 8000,
    currentMap: 'EUROPEAN',
    getHeightAt: (x) => 500
  },
  sprites: {}
};

const weapons = new sandbox.window.WeaponManager(mockGame);
mockGame.weapons = weapons;
const entities = new sandbox.window.EntityManager(mockGame);
mockGame.entities = entities;

// Mock input controller
class MockInput {
  constructor() {
    this._accel = false;
    this._brake = false;
    this._climb = false;
    this._dive = false;
    this._bomb = false;
    this._cluster = false;
    this._nuke = false;
    this._gau8 = false;
    this._rocket = false;
    this._flare = false;
  }
  isAccelerating() { return this._accel; }
  isBraking() { return this._brake; }
  isClimbing() { return this._climb; }
  isDiving() { return this._dive; }
  isBombTriggered() { return this._bomb; }
  isClusterTriggered() { return this._cluster; }
  isNukeTriggered() { return this._nuke; }
  isGau8Firing() { return this._gau8; }
  isRocketTriggered() { return this._rocket; }
  isFlareTriggered() { return this._flare; }
}

const input = new MockInput();

// =========================================================================
// TEST 1: AV-8B Harrier II VTOL Hover Dynamics & Precision Bombing
// =========================================================================
console.log('Testing Harrier II VTOL hover mechanics...');
entities.initPlayer('harrier');
const pHarrier = entities.player;

assert.strictEqual(pHarrier.isVTOL, true, 'Harrier must have isVTOL=true');
assert.strictEqual(pHarrier.isHelicopter, false, 'Harrier must have isHelicopter=false');

// Decelerate into hover
input._brake = true;
for (let i = 0; i < 70; i++) {
  entities.updatePlayer(input);
}
input._brake = false;

assert.ok(pHarrier.currentSpeed <= 1.8, `Harrier speed should be in hover regime (<=1.8), was ${pHarrier.currentSpeed}`);
assert.strictEqual(pHarrier.isHovering, true, 'Harrier must be in isHovering=true state');
console.log(`[PASS] Harrier decelerated into stable VTOL hover at speed ${pHarrier.currentSpeed.toFixed(2)}.`);

// Vertical climb while hovering
const initialY = pHarrier.y;
input._climb = true;
entities.updatePlayer(input);
input._climb = false;
assert.ok(pHarrier.y < initialY, 'Harrier must gain altitude vertically when pressing climb in hover');
console.log(`[PASS] Harrier vertical lift climb verified (Y: ${initialY.toFixed(1)} -> ${pHarrier.y.toFixed(1)}).`);

// Precision Bomb Release in Hover (zero forward drift)
weapons.bombs = [];
input._bomb = true;
pHarrier.bombCooldown = 0;
entities.updatePlayer(input);
input._bomb = false;

assert.strictEqual(weapons.bombs.length, 1, 'Should have dropped 1 iron bomb');
const droppedBomb = weapons.bombs[0];
assert.strictEqual(droppedBomb.vx, 0, 'In VTOL hover, bomb vx must be 0 for sniper precision');
assert.ok(droppedBomb.vy > 3.0, 'In VTOL hover, bomb vy must be direct downward kinetic drop');
console.log(`[PASS] Precision vertical bomb drop verified (vx: ${droppedBomb.vx}, vy: ${droppedBomb.vy.toFixed(2)}).`);

// Acceleration out of hover into high-speed jet flight
input._accel = true;
for (let i = 0; i < 75; i++) {
  entities.updatePlayer(input);
}
input._accel = false;
assert.ok(pHarrier.currentSpeed > 5.0, `Harrier should have accelerated out of hover, was ${pHarrier.currentSpeed}`);
assert.strictEqual(pHarrier.isHovering, false, 'Harrier should have exited hover state');
console.log(`[PASS] Harrier transitioned out of hover to high-speed dash (${pHarrier.currentSpeed.toFixed(2)}).`);

// =========================================================================
// TEST 2: Apache Auto-Tracking Swivel 30mm Chin Turret
// =========================================================================
console.log('Testing Apache auto-swivel 30mm chin turret...');
entities.initPlayer('apache');
const pApache = entities.player;
pApache.x = 200;
pApache.y = 200;
pApache.angle = 0; // Flying horizontally

// Spawn an enemy tank forward and downward
entities.enemies = [
  {
    type: 'tank',
    x: 320,
    y: 300,
    hp: 80,
    alive: true,
    width: 32,
    height: 18
  }
];

entities.updatePlayer(input);
assert.strictEqual(pApache.hasTurretLock, true, 'Apache must lock onto ground tank in forward-downward cone');
assert.ok(pApache.turretAngle > pApache.angle, 'Turret angle must track downwards toward tank');
console.log(`[PASS] Apache chin turret locked target at angle ${(pApache.turretAngle * 180 / Math.PI).toFixed(1)} deg.`);

// Fire 30mm M230 Chain Gun with auto-aim angle
weapons.bullets = [];
input._gau8 = true;
pApache.gau8FiringCooldown = 1; // triggers on next frame
entities.updatePlayer(input);
input._gau8 = false;

assert.strictEqual(weapons.bullets.length, 1, '30mm chain gun should have fired 1 bullet');
const chainBullet = weapons.bullets[0];
assert.strictEqual(chainBullet.isHeavy30mm, true, 'Bullet must be marked as isHeavy30mm');
assert.strictEqual(chainBullet.damage >= 42, true, '30mm bullet must inflict heavy damage');
assert.ok(Math.abs(chainBullet.angle - pApache.turretAngle) < 0.05, 'Bullet angle must match turret angle');
console.log(`[PASS] 30mm M230 round fired along tracking vector with ${chainBullet.damage} damage.`);

// =========================================================================
// TEST 3: Chinook Dual Door Gunners & Airborne Field Repair
// =========================================================================
console.log('Testing Chinook defensive door gunners & repair...');
entities.initPlayer('chinook');
const pChinook = entities.player;
pChinook.x = 400;
pChinook.y = 250;

// Spawn an enemy target nearby (within 280px)
entities.migs = [
  {
    x: 480,
    y: 220,
    hp: 60,
    alive: true,
    dangerRadius: 180
  }
];

weapons.bullets = [];
// Advance 8 frames to trigger door gunner auto-interception
for (let f = 0; f < 8; f++) {
  entities.updatePlayer(input);
}

const doorBullets = weapons.bullets.filter(b => b.isDoorGun);
assert.ok(doorBullets.length >= 1, 'Chinook door gunner must have automatically engaged nearby enemy');
console.log(`[PASS] Chinook automated door gunners engaged target with minigun tracers.`);

// Test Chinook Airborne Field Repair System
pChinook.hp = 120; // Damaged from 230 max
pChinook.repairDropTimer = 1405; // Past threshold
entities.updatePlayer(input);
assert.strictEqual(pChinook.hp, 155, 'Chinook must heal +35 HP on field repair trigger');
assert.strictEqual(pChinook.repairDropTimer, 0, 'Repair drop timer must reset after healing');
console.log(`[PASS] Airborne field repair restored +35 HP (HP: 120 -> ${pChinook.hp}).`);

// =========================================================================
// TEST 4: Helicopter Non-Stall Dynamics
// =========================================================================
console.log('Testing helicopter non-stall dynamics in steep climb...');
pApache.angle = -Math.PI / 2; // Vertical nose-up climb
pApache.currentSpeed = 0.5;
for (let i = 0; i < 35; i++) {
  entities.updatePlayer(input);
}
assert.strictEqual(pApache.stallTimer, 0, 'Helicopters must never stall nose-down');
console.log('[PASS] Helicopter vertical climb non-stall verified.');

console.log('--- ALL PHASE 3 VTOL & ROTOR PHYSICS TESTS PASSED (100%)! ---');
