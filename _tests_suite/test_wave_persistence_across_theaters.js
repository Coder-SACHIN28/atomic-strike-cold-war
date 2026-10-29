const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== VERIFYING WAVE PROGRESS PERSISTENCE ACROSS THEATERS ===');

const mockCanvas = {
  classList: { add: () => {}, remove: () => {} },
  style: {},
  getContext: () => ({
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    drawImage: () => {},
    measureText: (txt) => ({ width: txt.length * 7 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {}
  }),
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
};

const dom = {
  getElementById: () => mockCanvas
};

const sandbox = {
  window: {},
  document: dom,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  Image: class { constructor() { this.complete = true; } },
  AudioContext: class {
    constructor() {
      this.currentTime = 10.0;
      this.sampleRate = 44100;
      this.state = 'running';
      this.destination = {};
    }
    createGain() {
      return {
        gain: {
          value: 1.0,
          cancelScheduledValues: () => {},
          setTargetAtTime: function(val) { this.value = val; }
        },
        connect: () => {}
      };
    }
    createOscillator() { return { type: 'sine', frequency: { value: 440, setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: { value: 300 }, Q: { value: 1 }, connect: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { buffer: null, loop: false, connect: () => {}, start: () => {}, stop: () => {} }; }
    resume() { return Promise.resolve(); }
  },
  SpeechSynthesisUtterance: class {
    constructor(text) {
      this.text = text;
      this.rate = 1.0;
      this.volume = 1.0;
      this.pitch = 1.0;
      this.voice = null;
      this.onend = null;
      this.onerror = null;
    }
  }
};
sandbox.window = sandbox;
sandbox.addEventListener = () => {};
sandbox.window.addEventListener = () => {};
sandbox.window.speechSynthesis = {
  cancel: () => {},
  speak: (utter) => { if (utter.onend) utter.onend(); },
  getVoices: () => [{ lang: 'en-US', name: 'Natural English' }]
};

const context = vm.createContext(sandbox);

// Load required scripts in order
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

for (const s of scripts) {
  const code = fs.readFileSync('C:/REA/' + s, 'utf8');
  vm.runInContext(code, context);
}

// Instantiate game instance
const game = new sandbox.AtomicBomberGame();
game.startWave(1, false);

console.log('\n--- 1. Testing Initial Wave 1 State in Europe ---');
const em = game.entities;
const initialLiving = em.enemies.filter(e => em.isObjectiveTarget(e));
console.log(`Initial Wave 1 Living Hostiles in Europe: ${initialLiving.length}`);
assert(initialLiving.length >= 8, 'Wave 1 in Europe should start with convoy hostiles');

// 2. Player kills all hostiles except 1 in Europe
console.log('\n--- 2. Destroying Hostiles in Europe (1 target remains) ---');
for (let i = 0; i < initialLiving.length - 1; i++) {
  initialLiving[i].alive = false;
  em.deadWrecks.push({ x: initialLiving[i].x, y: initialLiving[i].y, sprite: {} });
}

const livingAfterKills = em.enemies.filter(e => em.isObjectiveTarget(e)).length;
console.log(`Remaining Living Hostiles in Europe: ${livingAfterKills}`);
assert.strictEqual(livingAfterKills, 1, 'Exactly 1 hostile must remain in Europe');
assert.strictEqual(em.deadWrecks.length, initialLiving.length - 1, 'Dead wrecks must be recorded in Europe');

// 3. Player switches from EUROPEAN to SIBERIA mid-wave
console.log('\n--- 3. Mid-Wave Theater Switch: Europe -> Siberia ---');
em.switchTheater('EUROPEAN', 'SIBERIA', 1);

const siberiaLiving = em.enemies.filter(e => em.isObjectiveTarget(e)).length;
console.log(`Living Hostiles in Siberia: ${siberiaLiving}`);
assert.strictEqual(siberiaLiving, 1, 'Siberia must spawn with EXACTLY 1 hostile (NO WAVE RESET!)');
console.log('[PASS] Wave was NOT reset! Target count strictly preserved at 1.');

// 4. Player switches back from SIBERIA to EUROPEAN
console.log('\n--- 4. Mid-Wave Switch Back: Siberia -> Europe ---');
em.switchTheater('SIBERIA', 'EUROPEAN', 1);

const europeRestoredLiving = em.enemies.filter(e => em.isObjectiveTarget(e)).length;
console.log(`Restored Living Hostiles in Europe: ${europeRestoredLiving}`);
console.log(`Restored Dead Wrecks in Europe: ${em.deadWrecks.length}`);
assert.strictEqual(europeRestoredLiving, 1, 'Europe must restore with exactly 1 living hostile');
assert.strictEqual(em.deadWrecks.length, initialLiving.length - 1, 'Europe must restore previous dead wrecks');
console.log('[PASS] Previous map state successfully restored from cache with 1 hostile & dead wrecks intact!');

// 5. Player destroys the final remaining hostile
console.log('\n--- 5. Destroying Final Hostile & Testing Wave Clear ---');
const finalHostile = em.enemies.find(e => em.isObjectiveTarget(e));
finalHostile.alive = false;

const remaining = em.enemies.filter(e => em.isObjectiveTarget(e)).length;
assert.strictEqual(remaining, 0, 'All hostiles must now be dead');
console.log('[PASS] All hostiles destroyed! Sector is clear.');

// 6. Advance to Wave 2
console.log('\n--- 6. Advancing to Wave 2 (Fresh Wave Generation) ---');
game.startWave(2, true);
const w2Living = em.enemies.filter(e => em.isObjectiveTarget(e)).length;
console.log(`Wave 2 fresh living hostiles: ${w2Living}`);
assert(w2Living >= 12, 'Wave 2 must start fresh with full hostiles');
console.log('[PASS] Wave 2 started fresh without old cache interference.');

// 7. Testing Accidental Cloud Switch Cancellation
console.log('\n--- 7. Testing Accidental Cloud Climb vs Intentional Stratosphere Entry ---');
const p = em.player;
p.y = 42; // Not deep enough in stratosphere
p.vy = -0.2;
em.updatePlayer(game.input);
assert.strictEqual(p.cloudClimbTimer, 0, 'Momentary climb at y=42 must not increment cloud climb timer');

p.y = 36; // Deep in cloud ceiling
p.angle = -0.45;
p.vy = -0.8;
em.updatePlayer(game.input);
assert(p.cloudClimbTimer > 0, 'Steep climb into stratosphere must increment timer');

// Player levels off or dives
p.angle = 0.2;
em.updatePlayer(game.input);
assert.strictEqual(p.cloudClimbTimer, 0, 'Leveling off or diving must immediately cancel cloud climb timer to 0');
console.log('[PASS] Accidental cloud transition prevention verified: diving or turning immediately cancels transition!');

console.log('\n🌟 ALL 7 TESTS PASSED PERFECTLY (100%)! WAVE PERSISTENCE & ACCIDENTAL SWITCH FIX VERIFIED!');
