/**
 * Phase 2 Aircraft Fleet Expansion Verification Test
 * Verifies 10-aircraft hangar roster, catalog stats, specialized upgrade trees,
 * flight dynamics initialization, helicopter/VTOL flags, and sprite files.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- STARTING PHASE 2: AIRCRAFT FLEET EXPANSION VERIFICATION ---');

// 1. Verify 10 Aircraft Sprite PNGs on Disk
const spriteDir = path.join(__dirname, 'atomic-bomber', 'assets', 'sprites');
const expectedSprites = [
  'plane.png', 'warthog1.png', 'su25.png', 'cobra.png', 'f14.png', 'ac130.png',
  'apache.png', 'comanche.png', 'chinook.png', 'harrier.png'
];

expectedSprites.forEach(s => {
  const p = path.join(spriteDir, s);
  assert.ok(fs.existsSync(p), `Sprite missing on disk: ${s}`);
  const b = fs.readFileSync(p);
  assert.strictEqual(b.toString('ascii', 1, 4), 'PNG', `File is not valid PNG: ${s}`);
  console.log(`[PASS] Sprite verified: ${s} (${b.length} bytes)`);
});

// 2. Setup Sandbox & Load Engine Scripts
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

// Load scripts
const scripts = ['audio.js', 'input.js', 'terrain.js', 'weapons.js', 'armory.js', 'entities.js'];
scripts.forEach(s => {
  const code = fs.readFileSync(path.join(__dirname, 'atomic-bomber', 'js', s), 'utf8');
  vm.runInContext(code, sandbox);
});

console.log('[PASS] All game engine modules loaded in sandbox without syntax errors.');

// 3. Test Armory Hangar Catalog (10 Aircraft)
const mockGame = {
  renderer: { width: 1280, height: 720 },
  addFloatingText: () => {},
  requestRewardedAd: (n, cb) => cb(),
  terrain: {
    mapWidth: 8000,
    currentMap: 'EUROPEAN',
    getHeightAt: (x) => 500
  },
  sprites: {}
};

const armory = new sandbox.window.ArmoryManager(mockGame);
const planes = armory.getPlaneList();

assert.strictEqual(planes.length, 10, 'Hangar roster must contain exactly 10 aircraft');
const expectedIds = ['standard', 'a10', 'su25', 'cobra', 'f14', 'ac130', 'apache', 'comanche', 'chinook', 'harrier'];
assert.strictEqual(JSON.stringify(planes.map(p => p.id)), JSON.stringify(expectedIds), 'Aircraft order and IDs must match specification');
console.log(`[PASS] Hangar contains 10 combat aircraft: ${expectedIds.join(', ')}`);

// Verify new aircraft specifications
const apache = planes.find(p => p.id === 'apache');
assert.strictEqual(apache.cost, 7500);
assert.strictEqual(apache.stats.armor, 180);
assert.strictEqual(apache.stats.firepower, 96);
assert.strictEqual(apache.spriteName, 'apache.png');
console.log('[PASS] AH-64 Apache catalog stats verified.');

const comanche = planes.find(p => p.id === 'comanche');
assert.strictEqual(comanche.cost, 8000);
assert.strictEqual(comanche.stats.armor, 130);
assert.strictEqual(comanche.stats.speed, 75);
assert.strictEqual(comanche.spriteName, 'comanche.png');
console.log('[PASS] RAH-66 Comanche catalog stats verified.');

const chinook = planes.find(p => p.id === 'chinook');
assert.strictEqual(chinook.cost, 9200);
assert.strictEqual(chinook.stats.armor, 230);
assert.strictEqual(chinook.stats.firepower, 95);
assert.strictEqual(chinook.spriteName, 'chinook.png');
console.log('[PASS] CH-47 Chinook catalog stats verified.');

const harrier = planes.find(p => p.id === 'harrier');
assert.strictEqual(harrier.cost, 8800);
assert.strictEqual(harrier.stats.armor, 115);
assert.strictEqual(harrier.stats.speed, 95);
assert.strictEqual(harrier.spriteName, 'harrier.png');
console.log('[PASS] AV-8B Harrier II catalog stats verified.');

// 4. Test Upgrade Trees for All 4 New War Machines
const newPlanes = ['apache', 'comanche', 'chinook', 'harrier'];
newPlanes.forEach(pId => {
  const upgs = armory.getUpgradeItems(pId);
  assert.strictEqual(upgs.length, 6, `${pId} must have exactly 6 specialized upgrades`);
  upgs.forEach(u => {
    assert.ok(u.id && u.name && u.desc, `Upgrade must have valid id, name, desc for ${pId}`);
    assert.ok(u.costs.length >= 2, `Upgrade ${u.id} must have cost progression`);
  });
  console.log(`[PASS] Upgrade tree for ${pId} verified (6 upgrades).`);
});

// 5. Test Upgrade Purchase & Persistence
armory.state.credits = 50000;
const apacheArmor = armory.getUpgradeItems('apache').find(u => u.id === 'apache_armor');
const buyRes = armory.buyUpgrade(apacheArmor.id, 'apache');
assert.strictEqual(buyRes, true, 'Upgrade purchase should succeed with credits');
assert.strictEqual(armory.getPlaneUpgrades('apache').apache_armor, 1, 'apache_armor should be level 1');
console.log('[PASS] Successfully purchased and verified upgrade tier.');

// 6. Test Entity Initialization & Flight Characteristics for All 10 Aircraft
const entities = new sandbox.window.EntityManager(mockGame);

expectedIds.forEach(modelId => {
  entities.initPlayer(modelId);
  const p = entities.player;
  assert.strictEqual(p.model, modelId, `Player model must be ${modelId}`);
  assert.ok(p.maxHp > 80, `${modelId} maxHp must be > 80`);
  assert.ok(p.currentSpeed > 0, `${modelId} speed must be > 0`);
  assert.ok(p.bombs > 0, `${modelId} must have bombs`);
  assert.ok(p.flares > 0, `${modelId} must have flares`);

  // Verify helicopter & VTOL flags
  const isExpectedHeli = ['cobra', 'apache', 'comanche', 'chinook'].includes(modelId);
  const isExpectedVTOL = modelId === 'harrier';
  assert.strictEqual(p.isHelicopter, isExpectedHeli, `${modelId} isHelicopter flag mismatch`);
  assert.strictEqual(p.isVTOL, isExpectedVTOL, `${modelId} isVTOL flag mismatch`);
  console.log(`[PASS] Flight physics & weapon loadout verified for ${modelId} (HP: ${p.maxHp}, Heli: ${p.isHelicopter}, VTOL: ${p.isVTOL})`);
});

// 7. Test Seamless Model Switching (Preserving Health Ratio)
entities.initPlayer('standard');
entities.player.hp = 50; // Damaged F-4
entities.switchPlayerModel('apache');
assert.strictEqual(entities.player.model, 'apache');
assert.strictEqual(entities.player.isHelicopter, true);
assert.ok(entities.player.hp > 0, 'HP must be preserved on model switch');
console.log(`[PASS] switchPlayerModel transitioned to Apache with HP ${entities.player.hp}/${entities.player.maxHp}`);

entities.switchPlayerModel('harrier');
assert.strictEqual(entities.player.model, 'harrier');
assert.strictEqual(entities.player.isVTOL, true);
assert.strictEqual(entities.player.isHelicopter, false);
console.log(`[PASS] switchPlayerModel transitioned to Harrier with HP ${entities.player.hp}/${entities.player.maxHp}`);

console.log('--- ALL PHASE 2 AIRCRAFT FLEET TESTS PASSED SUCCESSFULLY! ---');
