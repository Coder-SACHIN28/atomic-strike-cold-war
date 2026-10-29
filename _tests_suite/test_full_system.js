// Full System Integration Test for Atomic Strike: Cold War + Death From Above 3D Gunship
const fs = require('fs');
const vm = require('vm');

// Mock complete browser environment
global.window = global;
global.window.location = { search: '' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

global.document = {
  getElementById: (id) => {
    if (id === 'gameCanvas') return mockCanvas;
    return {
      id: id,
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      addEventListener: () => {},
      innerText: '',
      style: {}
    };
  },
  addEventListener: () => {}
};
global.performance = { now: () => Date.now() };
global.Image = class { constructor() { this.src = ''; this.complete = true; } };

// Mock Canvas 2D Context
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.shadowColor = '';
    this.shadowBlur = 0;
  }
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  setLineDash() {}
  getLineDash() { return []; }
  clip() {}
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
  clearRect() {}
  fillText() {}
  measureText(text) { return { width: (text || '').length * 8 }; }
  createLinearGradient() { return { addColorStop: () => {} }; }
  createRadialGradient() { return { addColorStop: () => {} }; }
  drawImage() {}
}

const mockCanvas = {
  width: 1280,
  height: 720,
  getContext: () => new MockCanvasContext(),
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
};

// Mock Audio
class MockSoundSystem {
  constructor() { this.enabled = true; }
  play() {}
  startEngine() {}
  stopEngine() {}
  stopGau8() {}
  setPlatformMuted() {}
  setAdMuted() {}
}
global.soundSystem = new MockSoundSystem();

// Load All Scripts in exact order as index.html
const scripts = [
  'atomic-bomber/js/audio.js',
  'atomic-bomber/js/input.js',
  'atomic-bomber/js/terrain.js',
  'atomic-bomber/js/weapons.js',
  'atomic-bomber/js/entities.js',
  'atomic-bomber/js/hud.js',
  'atomic-bomber/js/armory.js',
  'atomic-bomber/js/engine.js',
  'atomic-bomber/js/main.js'
];

scripts.forEach(scriptPath => {
  const code = fs.readFileSync(scriptPath, 'utf8');
  vm.runInThisContext(code);
});

async function testFullSystem() {
  console.log('=== FULL SYSTEM TEST 1: Initialize AtomicBomberGame ===');
  const game = new window.AtomicBomberGame();
  game.canvas = mockCanvas;
  game.renderer.canvas = mockCanvas;
  game.renderer.ctx = new MockCanvasContext();

  console.log(`✓ Initial State: ${game.state}`);
  console.log(`✓ Initial Theater: ${game.currentTheater}`);
  if (game.state !== 'TITLE') throw new Error('Initial state must be TITLE');
  if (game.currentTheater !== 'EUROPEAN') throw new Error('Initial theater must be EUROPEAN');

  console.log('\n=== FULL SYSTEM TEST 2: Title Screen Render & Theater Selector ===');
  game.render();
  console.log(`✓ Title Screen Buttons Registered: ${game.buttons.length}`);
  if (game.buttons.length < 3) throw new Error('Expected at least 3 buttons on Title Screen!');

  console.log('\n=== FULL SYSTEM TEST 3: Launch European Air Sortie ===');
  game.startNewGame('a10');
  console.log(`✓ Game State after start: ${game.state}`);
  if (game.state !== 'PLAYING') throw new Error('State must be PLAYING after launch');
  console.log(`✓ Wave: ${game.currentWave}, Player HP: ${game.entities.player.hp}/${game.entities.player.maxHp}`);

  console.log('\n=== FULL SYSTEM TEST 4: High-Altitude Climb -> Seamless Transition to Siberia ===');
  game.theaterTransitionCooldown = 0;
  game.entities.player.y = 36;
  game.entities.player.angle = -0.6; // Actively climbing
  for (let i = 0; i < 90; i++) {
    game.entities.player.y = 36;
    game.entities.player.angle = -0.6;
    game.entities.updatePlayer(game.input);
  }
  console.log(`✓ Map transition active: ${game.mapTransition.active}`);
  console.log(`✓ Target Theater: ${game.mapTransition.targetTheater}`);
  if (!game.mapTransition.active) throw new Error('Cloud climb must trigger map transition');

  // Simulate frames until midpoint of transition where map switches
  for (let i = 0; i < 55; i++) {
    game.update();
    game.render();
  }
  console.log(`✓ Active Theater after midpoint: ${game.currentTheater}`);
  if (game.currentTheater !== 'SIBERIA') throw new Error('Theater must switch to SIBERIA');

  const hasTrain = game.entities.enemies.some(e => e.type === 'armored_train');
  const hasSilo = game.entities.enemies.some(e => e.type === 'missile_silo');
  const hasRadome = game.entities.enemies.some(e => e.type === 'radome');
  console.log(`✓ Siberian Armored Train Spawned: ${hasTrain}`);
  console.log(`✓ Underground Missile Silos Spawned: ${hasSilo}`);
  console.log(`✓ Giant Radomes Spawned: ${hasRadome}`);
  if (!hasTrain || !hasSilo || !hasRadome) throw new Error('Siberian unique installations missing');

  // Complete Siberian transition frames
  for (let i = 0; i < 55; i++) {
    game.update();
    game.render();
  }
  game.theaterTransitionCooldown = 0;

  console.log('\n=== FULL SYSTEM TEST 5: Transition to Desert Storm Oilfields ===');
  game.cycleTheater('DESERT');
  console.log(`✓ Desert transition active: ${game.mapTransition.active}`);
  for (let i = 0; i < 60; i++) {
    game.update();
    game.render();
  }
  console.log(`✓ Active Theater: ${game.currentTheater}`);
  if (game.currentTheater !== 'DESERT') throw new Error('Theater must switch to DESERT');

  const hasOil = game.entities.enemies.some(e => e.type === 'oil_well');
  const hasTech = game.entities.enemies.some(e => e.type === 'desert_technical');
  console.log(`✓ Burning Oil Pumpjacks Spawned: ${hasOil}`);
  console.log(`✓ Desert Technical Trucks Spawned: ${hasTech}`);
  if (!hasOil || !hasTech) throw new Error('Desert unique installations missing');

  console.log('\n=== FULL SYSTEM TEST 6: Armory & Per-Plane Economy ===');
  game.openArmory();
  console.log(`✓ State: ${game.state}`);
  if (game.state !== 'ARMORY') throw new Error('State must be ARMORY');
  game.closeArmory();
  console.log(`✓ State after closing Armory: ${game.state}`);
  if (game.state !== 'PLAYING') throw new Error('State must resume to PLAYING');

  console.log('\n🌟 ALL FULL-SYSTEM INTEGRATION TESTS PASSED 100%! MULTI-THEATER SYSTEM OPERATIONAL!');
}

testFullSystem().catch(err => {
  console.error('Full system test failed:', err);
  process.exit(1);
});
