/**
 * Automated Verification Test Suite for Gunship Battle Expansion:
 * - AGM-114 Hellfire laser missiles
 * - BLU-27 Napalm firestorms
 * - Soviet Mil Mi-24 Hind Heavy Attack Gunship (Boss)
 * - BM-21 Grad MLRS Rocket Trucks
 * - ZSU-23-4 Shilka Quad Radar Flak Tanks
 * - Pilot Cruising Idle Humor Banter
 * - Gunship Battle Tactical Command Title Screen
 */

// 1. Mock DOM and Web Audio Environment
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.Image = class { constructor() { this.complete = true; this.width = 32; this.height = 32; } };
global.document = {
  getElementById: (id) => ({
    getContext: () => mockCtx,
    width: 960,
    height: 680,
    innerText: '',
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}
  }),
  createElement: () => ({ getContext: () => mockCtx, width: 960, height: 680 }),
  body: { appendChild: () => {} }
};

const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  rect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  roundRect: () => {},
  stroke: () => {},
  fill: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({ width: 50 }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  drawImage: () => {},
  setLineDash: () => {},
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  shadowColor: '',
  shadowBlur: 0
};

global.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }
  createGain() { return { gain: { value: 1, linearRampToValueAtTime: () => {}, setValueAtTime: () => {} }, connect: () => {} }; }
  createOscillator() { return { frequency: { value: 440, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, type: 'sine', connect: () => {}, start: () => {}, stop: () => {} }; }
  createStereoPanner() { return { pan: { value: 0 }, connect: () => {} }; }
  createBufferSource() { return { buffer: null, playbackRate: { value: 1 }, connect: () => {}, start: () => {}, stop: () => {} }; }
  decodeAudioData(buf, cb) { if (cb) cb({}); }
};
global.webkitAudioContext = global.AudioContext;

// Load Game Classes
require('./js/engine.js');
require('./js/audio.js');
require('./js/terrain.js');
require('./js/weapons.js');
require('./js/entities.js');
require('./js/hud.js');
require('./js/armory.js');
require('./js/main.js');

console.log('--- STARTING VERIFICATION TEST SUITE ---');

let passedTests = 0;
function assert(desc, condition) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    process.exit(1);
  }
}

// Initialize Minimal Game Harness
const mockGame = {
  terrain: new window.TerrainEngine(12000, 680),
  sprites: {},
  buttons: [],
  weapons: null,
  entities: null,
  hud: null,
  renderer: { width: 960, height: 680, drawSky: () => {} },
  triggerScreenShake: () => {},
  currentTheater: 'EUROPE',
  addFloatingText: () => {},
  setRadioMessage: () => {},
  triggerPilotHumor: (trigger) => { mockGame.lastHumorTrigger = trigger; }
};

const weapons = new window.WeaponManager(mockGame);
const entities = new window.EntityManager(mockGame);
mockGame.weapons = weapons;
mockGame.entities = entities;

// Setup player
entities.initPlayer('a10');
const p = entities.player;
assert('Player initialized with Hellfire and Napalm ammo', p.hellfireAmmo >= 4 && p.napalmAmmo >= 3);

// TEST 1: Fire Hellfire Laser-Guided Missile
weapons.fireHellfire(p.x, p.y, 0, 5, { x: p.x + 400, y: p.y, alive: true });
assert('Hellfire missile spawned in weapons.hellfires', weapons.hellfires.length === 1);
const hf = weapons.hellfires[0];
assert('Hellfire has target and high damage', hf.target && hf.damage === 260);

// Update Hellfire
weapons.update(mockGame.terrain);
assert('Hellfire accelerated during update', hf.speed > 5);

// TEST 2: Drop BLU-27 Napalm Firestorm Bomb
weapons.dropNapalm(p.x, p.y, 2, 1);
assert('Napalm bomb spawned in weapons.napalmBombs', weapons.napalmBombs.length === 1);

// Move napalm bomb to ground
const nb = weapons.napalmBombs[0];
nb.y = mockGame.terrain.getHeightAt(nb.x) + 5;
weapons.update(mockGame.terrain);
assert('Napalm bomb detonated and spawned napalm firestorm', weapons.napalmFires.length === 1);
const nf = weapons.napalmFires[0];
assert('Napalm firestorm covers area and has duration', nf.width === 190 && nf.duration > 500);

// Place an enemy inside napalm fire
entities.enemies.push({
  x: nf.x,
  y: nf.y,
  hp: 20,
  maxHp: 20,
  alive: true,
  scoreValue: 100,
  creditValue: 80,
  type: 'tank'
});
for (let f = 0; f < 5; f++) {
  weapons.update(mockGame.terrain);
}
assert('Napalm fire damages enemy inside firestorm zone', entities.enemies[0].hp < 20 && entities.enemies[0].onFire > 0);

// TEST 3: Mil Mi-24 Hind Heavy Attack Gunship (Boss)
entities.spawnHind(3);
assert('Mil Mi-24 Hind spawned', entities.hinds.length === 1);
const hind = entities.hinds[0];
assert('Hind has boss hitpoints and score value', hind.hp >= 240 && hind.scoreValue >= 450);

// Update Hind
entities.updateEnemies();
assert('Hind updates rotorAngle and hovers near player', hind.rotorAngle > 0 && hind.facing !== undefined);

// Test direct hit on Hind
const prevHindHp = hind.hp;
const hitResult = entities.checkDirectHit(hind.x, hind.y, 10, 100);
assert('Direct hit registered on Hind', hitResult === true && hind.hp === prevHindHp - 100);

// Test destroying Hind
entities.checkDirectHit(hind.x, hind.y, 10, 500);
assert('Hind destroyed and removed from alive status', hind.alive === false);

// TEST 4: BM-21 Grad MLRS Truck and ZSU-23 Shilka
entities.enemies.push({
  x: p.x + 300,
  y: mockGame.terrain.getHeightAt(p.x + 300) - 8,
  type: 'mlrs_truck',
  hp: 60,
  maxHp: 60,
  alive: true,
  fireTimer: 0,
  speed: 0.5,
  scoreValue: 180,
  creditValue: 150
});
entities.enemies.push({
  x: p.x + 200,
  y: mockGame.terrain.getHeightAt(p.x + 200) - 8,
  type: 'shilka',
  hp: 85,
  maxHp: 85,
  alive: true,
  fireTimer: 0,
  speed: -0.4,
  scoreValue: 200,
  creditValue: 160
});
assert('MLRS Truck and Shilka classified as objective targets', entities.isObjectiveTarget(entities.enemies[1]) && entities.isObjectiveTarget(entities.enemies[2]));

// Test drawing methods without errors
entities.drawMlrsTruck(mockCtx, 100, 200, entities.enemies[1]);
entities.drawShilka(mockCtx, 150, 200, entities.enemies[2]);
entities.drawHind(mockCtx, 200, 150, { hp: 150, maxHp: 240, facing: 1, rotorAngle: 1.2 });
assert('Drawing methods drawMlrsTruck, drawShilka, drawHind executed successfully without errors', true);

// TEST 5: Cruising Idle Pilot Humor Banter
p.idleCruisingFrames = 580; // simulate ~9.6 seconds of peaceful cruising without firing
const mockInput = {
  isAccelerating: () => false,
  isBraking: () => false,
  isClimbing: () => false,
  isDiving: () => false,
  isBombTriggered: () => false,
  isClusterTriggered: () => false,
  isNukeTriggered: () => false,
  isGau8Firing: () => false,
  isRocketTriggered: () => false,
  isFlareTriggered: () => false,
  isHellfireTriggered: () => false,
  isNapalmTriggered: () => false
};
entities.updatePlayer(mockInput);
assert('Cruising idle triggers CRUISING_IDLE humor banter when player is not in combat', mockGame.lastHumorTrigger === 'CRUISING_IDLE');

// TEST 6: Gunship Battle Tactical Title Screen Render
const gameApp = new window.AtomicBomberGame();
gameApp.armory.state = { highScore: 12500, credits: 4200, selectedPlane: 'a10', unlockedPlanes: ['standard', 'a10'], planeUpgrades: {} };
gameApp.buttons = [];
gameApp.renderTitleScreen(mockCtx, 960, 680);
assert('renderTitleScreen executed and populated command buttons', gameApp.buttons.length >= 3);

console.log(`\nALL ${passedTests} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
process.exit(0);
