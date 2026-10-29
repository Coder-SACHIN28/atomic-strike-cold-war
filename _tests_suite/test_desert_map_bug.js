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
const Game = require('./atomic-bomber/js/main.js');

console.log('================================================================');
console.log('  TESTING DESERT MAP FREEZE, RENDERING & THEATER TRANSITIONS    ');
console.log('================================================================');

const game = new Game();
game.startNewGame('f14');

// --- TEST 1: TRANSITION DIRECTLY TO DESERT THEATER ---
console.log('\n--- TEST 1: IN-FLIGHT TRANSITION TO DESERT ---');
game.startTheaterTransition('DESERT', 'CAMPAIGN');
assert.strictEqual(game.mapTransition.active, true, 'Map transition must be active');
assert.strictEqual(game.mapTransition.targetTheater, 'DESERT', 'Target theater must be DESERT');

// Advance transition through halfway point (clouds switch) to completion
for (let t = 0; t < 105; t++) {
  game.update();
}

assert.strictEqual(game.currentTheater, 'DESERT', 'Active theater must now be DESERT');
assert.strictEqual(game.terrain.currentMap, 'DESERT', 'Terrain map must be DESERT');
console.log(`✓ PASS: Seamless cloud transition into DESERT completed! Player alive: ${game.entities.player.alive}`);

// --- TEST 2: SIMULATING 600 FRAMES (~10 SECONDS) IN DESERT COMBAT ---
console.log('\n--- TEST 2: 600 FRAMES OF DESERT COMBAT & RENDERING ---');
const technicals = game.entities.enemies.filter(e => e.type === 'desert_technical');
console.log(`Found ${technicals.length} Desert Technical gun trucks on battlefield.`);

let technicalFired = false;
for (let f = 0; f < 600; f++) {
  game.update();
  game.renderer.render(game);
  
  if (game.entities.enemyBullets.length > 0) {
    technicalFired = true;
  }
}

assert.strictEqual(technicalFired, true, 'Desert technicals must fire bullets at player without crashing');
console.log(`✓ PASS: 600 frames of combat and rendering in DESERT executed cleanly! Bullets in air: ${game.entities.enemyBullets.length}`);

// --- TEST 3: FULL MULTI-THEATER CYCLING (EUROPE -> SIBERIA -> DESERT -> EUROPE) ---
console.log('\n--- TEST 3: CYCLING ALL THEATERS UNDER LOAD ---');
const cycleOrder = ['EUROPEAN', 'SIBERIA', 'DESERT', 'EUROPEAN'];
for (const theater of cycleOrder) {
  game.startTheaterTransition(theater, 'MANUAL');
  for (let t = 0; t < 105; t++) {
    game.update();
    game.renderer.render(game);
  }
  assert.strictEqual(game.currentTheater, theater, `Must arrive in theater: ${theater}`);
  console.log(`✓ PASS: Transitioned to [${theater}], rendering & physics stable.`);
}

console.log('\n================================================================');
console.log('★ ALL DESERT MAP TESTS PASSED WITH 100% SUCCESS (BUG RESOLVED)! ★');
console.log('================================================================');
