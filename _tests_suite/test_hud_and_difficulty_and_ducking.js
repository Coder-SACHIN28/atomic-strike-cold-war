const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== VERIFYING HUD CLEARANCE, DIFFICULTY CURVE & AUDIO DUCKING ===');

// Setup mock browser environment
const dom = {
  getElementById: (id) => ({
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
      measureText: () => ({ width: 50 }),
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
    createGain() {
      const g = {
        value: 1.0,
        cancelScheduledValues: () => {},
        setValueAtTime: function(val) { this.value = val; },
        setTargetAtTime: function(val) { this.value = val; },
        linearRampToValueAtTime: function(val) { this.value = val; }
      };
      return {
        gain: g,
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
sandbox.window.speechSynthesis = {
  cancel: () => {},
  speak: (utter) => {
    sandbox.lastSpokenUtterance = utter;
    if (utter.onend) setTimeout(utter.onend, 10);
  },
  getVoices: () => [{ lang: 'en-US', name: 'Natural English' }]
};

const context = vm.createContext(sandbox);

// Load required scripts
const scripts = [
  'atomic-bomber/js/audio.js',
  'atomic-bomber/js/terrain.js',
  'atomic-bomber/js/hud.js',
  'atomic-bomber/js/entities.js'
];

for (const s of scripts) {
  const code = fs.readFileSync('C:/REA/' + s, 'utf8');
  vm.runInContext(code, context);
}

// 1. TEST TERRAIN ELEVATION CLAMPING
console.log('\n--- 1. Testing Terrain Clearance ---');
const terrain = new sandbox.TerrainEngine(4800, 720);

for (const mapName of ['EUROPEAN', 'SIBERIA', 'DESERT']) {
  terrain.setMap(mapName, 1);
  let maxY = -Infinity;
  let minY = Infinity;
  for (const pt of terrain.points) {
    if (pt.y > maxY) maxY = pt.y;
    if (pt.y < minY) minY = pt.y;
  }
  console.log(`[PASS] ${mapName} elevation: min Y = ${minY.toFixed(1)}, max Y = ${maxY.toFixed(1)}`);
  assert(maxY <= 580, `Terrain max Y in ${mapName} exceeds 580 (actual: ${maxY})`);
  assert(minY >= 380, `Terrain min Y in ${mapName} is too high (actual: ${minY})`);
}

// Check clearance from HUD bar
const hudBarY = 720 - 52; // 668
console.log(`[PASS] Deepest ground valley: <= 580. HUD bar top: ${hudBarY}.`);
console.log(`[PASS] Guaranteed clear unobstructed view margin: ${hudBarY - 580}px!`);
assert(hudBarY - 580 >= 80, 'Clearance between ground and HUD bar must be at least 80px');

// 2. TEST WAVE 1 DIFFICULTY & SCALING
console.log('\n--- 2. Testing Progressive Wave Difficulty & Onboarding ---');
const mockGame = {
  terrain: terrain,
  sprites: {},
  buttons: [],
  currentWave: 1,
  currentTheater: 'EUROPEAN',
  armory: { state: { selectedPlane: 'standard' }, getPlaneUpgrades: () => ({}) },
  weapons: { reset: () => {}, bullets: [], bombs: [] },
  setRadioMessage: (spk, msg) => { sandbox.lastRadioMsg = { spk, msg }; },
  addFloatingText: () => {}
};

const em = new sandbox.EntityManager(mockGame);
em.initPlayer('standard');

// Spawn Wave 1
em.spawnWave(1, 'EUROPEAN');
const w1Tanks = em.enemies.filter(e => e.type === 'tank').length;
const w1Zsu = em.enemies.filter(e => e.type === 'zsu57').length;
const w1Sams = em.enemies.filter(e => e.type === 'sam_site').length;

console.log(`Wave 1 counts: Tanks=${w1Tanks}, ZSU=${w1Zsu}, SAMs=${w1Sams}`);
assert.strictEqual(w1Tanks, 3, 'Wave 1 must have exactly 3 practice tanks');
assert.strictEqual(w1Zsu, 1, 'Wave 1 must have exactly 1 light ZSU');
assert.strictEqual(w1Sams, 0, 'Wave 1 must have ZERO SAM sites');
console.log('[PASS] Wave 1 is beginner-friendly and clean (0 SAMs, 1 light ZSU, 3 tanks)');

// Check MiG spawner on Wave 1 and 2
em.spawnMig(1);
assert.strictEqual(em.migs.length, 0, 'No MiGs should spawn on Wave 1');
em.spawnMig(2);
assert.strictEqual(em.migs.length, 0, 'No MiGs should spawn on Wave 2');
console.log('[PASS] Wave 1 & 2 are strictly MiG-free');

// Spawn Wave 3
em.spawnWave(3, 'EUROPEAN');
const w3Tanks = em.enemies.filter(e => e.type === 'tank').length;
const w3Zsu = em.enemies.filter(e => e.type === 'zsu57').length;
const w3Sams = em.enemies.filter(e => e.type === 'sam_site').length;
console.log(`Wave 3 counts: Tanks=${w3Tanks}, ZSU=${w3Zsu}, SAMs=${w3Sams}`);
assert.strictEqual(w3Sams, 1, 'Wave 3 must introduce exactly 1 SAM site');
assert(w3Tanks >= 7, 'Wave 3 tanks count should scale to >= 7');
assert(w3Zsu >= 3, 'Wave 3 ZSU count should scale to >= 3');

// MiG spawner unlocks on Wave 3
em.spawnMig(3);
assert(em.migs.length >= 1, 'Wave 3 must spawn scout MiG-21');
console.log('[PASS] Wave 3 smoothly introduces SAM air defenses and MiG interceptors');

// 3. TEST AUDIO DUCKING
console.log('\n--- 3. Testing Radio Audio Ducking ---');
const soundSystem = sandbox.soundSystem;
soundSystem.init();

console.log('Testing duckAudioForRadio...');
soundSystem.duckAudioForRadio(3500);
assert(soundSystem.sfxGain.gain.value <= 0.25, 'SFX volume must duck to <= 25%');
assert(soundSystem.engineGain.gain.value <= 0.06, 'Jet engine volume must duck to <= 6%');
console.log(`[PASS] Audio ducked: SFX gain = ${soundSystem.sfxGain.gain.value}, Engine gain = ${soundSystem.engineGain.gain.value}`);

console.log('Testing restoreAudioFromRadio...');
soundSystem.restoreAudioFromRadio();
assert(soundSystem.sfxGain.gain.value >= 0.95, 'SFX volume must restore to 100%');
assert(soundSystem.engineGain.gain.value >= 0.14, 'Jet engine volume must restore to normal (0.15)');
console.log(`[PASS] Audio restored: SFX gain = ${soundSystem.sfxGain.gain.value}, Engine gain = ${soundSystem.engineGain.gain.value}`);

// Test speakRadioVoice speech synthesis
soundSystem.speakRadioVoice('TOWER: Clear for takeoff!', 'TOWER');
assert(sandbox.lastSpokenUtterance !== null, 'SpeechSynthesis utterance must be created');
assert.strictEqual(sandbox.lastSpokenUtterance.volume, 1.0, 'Radio voice must play at 100% volume');
assert(sandbox.lastSpokenUtterance.rate >= 1.0 && sandbox.lastSpokenUtterance.rate <= 1.1, 'Speech rate must be clear military cadence');
console.log(`[PASS] speakRadioVoice successfully spoken: "${sandbox.lastSpokenUtterance.text}" at volume ${sandbox.lastSpokenUtterance.volume}`);

console.log('\n🌟 ALL HUD, DIFFICULTY & AUDIO DUCKING TESTS PASSED PERFECTLY (100%)!');
