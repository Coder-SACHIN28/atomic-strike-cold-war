const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('  TESTING REAL IN-GAME ROCKET FIRE & CODEX ISOLATION ');
console.log('====================================================');

// Mock browser environment
const mockContext = {
  save: () => {}, restore: () => {}, fillRect: () => {}, strokeRect: () => {},
  fillText: () => {}, strokeText: () => {}, measureText: () => ({ width: 50 }),
  beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
  arc: () => {}, stroke: () => {}, fill: () => {}, clearRect: () => {},
  translate: () => {}, rotate: () => {}, drawImage: () => {}, roundRect: () => {}
};

const dom = {
  getElementById: (id) => {
    if (id === 'gameCanvas') {
      return {
        width: 1280,
        height: 720,
        getContext: () => mockContext,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
        addEventListener: () => {}
      };
    }
    return {
      innerText: '',
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      addEventListener: () => {},
      blur: () => {}
    };
  },
  fullscreenElement: null
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.Image = class { constructor() { this.onload = null; } };

global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  document: dom,
  localStorage: global.localStorage,
  performance: global.performance,
  requestAnimationFrame: global.requestAnimationFrame,
  addEventListener: () => {},
  removeEventListener: () => {},
  soundSystem: {
    play: () => {},
    startEngine: () => {},
    stopEngine: () => {},
    stopGau8: () => {},
    setAdMuted: () => {},
    toggleSound: () => true
  },
  CrazyGames: {
    SDK: {
      game: {
        loadingStart: () => {},
        loadingStop: () => {},
        gameplayStart: () => {},
        gameplayStop: () => {},
        happytime: () => {}
      },
      ad: {
        requestAd: (type, callbacks) => {
          if (callbacks.adFinished) callbacks.adFinished();
        }
      },
      user: {
        addSettingsChangeListener: () => {}
      }
    }
  }
};
global.document = dom;

// Load code files into global context
const files = [
  'atomic-bomber/js/audio.js',
  'atomic-bomber/js/input.js',
  'atomic-bomber/js/terrain.js',
  'atomic-bomber/js/weapons.js',
  'atomic-bomber/js/entities.js',
  'atomic-bomber/js/hud.js',
  'atomic-bomber/js/armory.js',
  'atomic-bomber/js/codex.js',
  'atomic-bomber/js/engine.js',
  'atomic-bomber/js/main.js'
];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInThisContext(code);
}

// Instantiate game
const game = new window.AtomicBomberGame();
game.canvas = { width: 1280, height: 720, getContext: () => ({
  save: () => {}, restore: () => {}, fillRect: () => {}, strokeRect: () => {},
  fillText: () => {}, strokeText: () => {}, measureText: () => ({ width: 50 }),
  beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
  arc: () => {}, stroke: () => {}, fill: () => {}, clearRect: () => {}
}) };

// Start game
game.startNewGame('a10');
console.log('Game started, current state:', game.state);
if (game.state !== 'PLAYING') {
  console.error('FAIL: Expected state PLAYING');
  process.exit(1);
}

const initialRockets = game.entities.player.rockets;
console.log('Initial player rockets:', initialRockets);

// 1. Simulate Player pressing KeyK (to fire rocket)
console.log('\n--- SIMULATING KEY [K] PRESS (ROCKET LAUNCH) ---');
game.input.keys['KeyK'] = true;
game.input.keysPressed['KeyK'] = true;

// Run game frame
game.update();

console.log('State after KeyK:', game.state);
if (game.state !== 'PLAYING') {
  console.error('CRITICAL BUG: State changed on KeyK! Screen is flickering to state:', game.state);
  process.exit(1);
} else {
  console.log('✓ PASS: State remained solidly PLAYING (zero screen flicker!).');
}

const remainingRockets = game.entities.player.rockets;
console.log('Remaining player rockets:', remainingRockets);
const rocketsInFlight = game.weapons.rockets.length;
console.log('Rockets in flight:', rocketsInFlight);

if (remainingRockets === initialRockets - 1 && rocketsInFlight === 1) {
  console.log('✓ PASS: Hydra 70 / S-8 Rocket fired successfully on KeyK!');
} else {
  console.error('FAIL: Rocket did not fire!');
  process.exit(1);
}

// 2. Simulate Player pressing KeyI (to open Intel Codex)
console.log('\n--- SIMULATING KEY [I] PRESS (INTEL CODEX) ---');
game.input.keys['KeyI'] = true;
game.input.keysPressed['KeyI'] = true;
game.update();

console.log('State after KeyI:', game.state);
if (game.state === 'CODEX') {
  console.log('✓ PASS: Codex opened cleanly on KeyI.');
} else {
  console.error('FAIL: Codex did not open on KeyI!');
  process.exit(1);
}

// 3. Simulate pressing KeyK WHILE in Codex (should do NOTHING, not close or toggle!)
console.log('\n--- SIMULATING KEY [K] WHILE IN CODEX (SHOULD NOT CLOSE) ---');
game.input.keys['KeyK'] = true;
game.input.keysPressed['KeyK'] = true;
game.update();

console.log('State after KeyK inside Codex:', game.state);
if (game.state === 'CODEX') {
  console.log('✓ PASS: Codex stayed open; KeyK does NOT toggle or flicker Codex.');
} else {
  console.error('FAIL: KeyK toggled Codex!');
  process.exit(1);
}

// 4. Simulate pressing KeyI to close Codex
console.log('\n--- SIMULATING KEY [I] TO CLOSE CODEX ---');
game.input.keys['KeyI'] = true;
game.input.keysPressed['KeyI'] = true;
game.update();

console.log('State after second KeyI:', game.state);
if (game.state === 'PLAYING') {
  console.log('✓ PASS: Returned cleanly to PLAYING state.');
} else {
  console.error('FAIL: Did not return to PLAYING!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('★ ALL IN-GAME COMBAT & CODEX TESTS PASSED 100%! ★');
console.log('====================================================');
