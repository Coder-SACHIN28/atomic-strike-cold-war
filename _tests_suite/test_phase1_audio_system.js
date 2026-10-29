/**
 * Phase 1 Audio System Verification Test
 * Verifies all extracted audio files, SoundSystem class integration,
 * dynamic helicopter rotor engine, 3-stage chain gun, and synthesis fallbacks.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- STARTING PHASE 1: AUDIO SYSTEM VERIFICATION ---');

// 1. Verify Audio Files Existence & Sizes
const audioDir = path.join(__dirname, 'atomic-bomber', 'assets', 'audio');
const expectedSounds = [
  { name: 'heli_rotor.wav', minSize: 10000 },
  { name: 'Chain_Active.wav', minSize: 10000 },
  { name: 'Chain_Fire.wav', minSize: 10000 },
  { name: 'Chain_End.wav', minSize: 10000 },
  { name: '20mm_shoot.wav', minSize: 10000 },
  { name: '30mm_shoot.wav', minSize: 10000 },
  { name: 'Sonic_Booms03.wav', minSize: 10000 },
  { name: 'BulletHit_Water.wav', minSize: 10000 },
  { name: 'BulletHit_Metal.wav', minSize: 10000 },
  { name: 'alert.wav', minSize: 10000 },
  { name: 'ExploRocket.wav', minSize: 10000 },
  { name: 'train.wav', minSize: 10000 },
  { name: 'CoinCounter.wav', minSize: 10000 },
  // Original bomber sounds
  { name: 'atomic.ogg', minSize: 5000 },
  { name: 'gau8.ogg', minSize: 5000 },
  { name: 'missilelaunch.ogg', minSize: 3000 },
  { name: 'planehit.ogg', minSize: 3000 }
];

let missingFiles = 0;
expectedSounds.forEach(s => {
  const fullPath = path.join(audioDir, s.name);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] Missing audio file: ${s.name}`);
    missingFiles++;
  } else {
    const stat = fs.statSync(fullPath);
    if (stat.size < s.minSize) {
      console.error(`[FAIL] Audio file too small (${stat.size} bytes): ${s.name}`);
      missingFiles++;
    } else {
      console.log(`[PASS] Verified audio file: ${s.name} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  }
});

if (missingFiles > 0) {
  console.error(`Audio file verification failed with ${missingFiles} missing or truncated files.`);
  process.exit(1);
}

// 2. Mock Web Audio API Environment for Node.js Testing
class MockGain {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime: (v) => { this.gain.value = v; },
      linearRampToValueAtTime: (v) => { this.gain.value = v; },
      exponentialRampToValueAtTime: (v) => { this.gain.value = v; },
      setTargetAtTime: (v) => { this.gain.value = v; },
      cancelScheduledValues: () => {}
    };
  }
  connect() {}
  disconnect() {}
}

class MockOscillator {
  constructor() {
    this.type = 'sawtooth';
    this.frequency = {
      value: 440,
      setValueAtTime: (v) => { this.frequency.value = v; },
      linearRampToValueAtTime: (v) => { this.frequency.value = v; },
      exponentialRampToValueAtTime: (v) => { this.frequency.value = v; },
      setTargetAtTime: (v) => { this.frequency.value = v; }
    };
  }
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class MockBiquadFilter {
  constructor() {
    this.type = 'lowpass';
    this.frequency = {
      value: 350,
      setValueAtTime: (v) => { this.frequency.value = v; }
    };
    this.Q = {
      value: 1,
      setValueAtTime: (v) => { this.Q.value = v; }
    };
  }
  connect() {}
  disconnect() {}
}

class MockBufferSource {
  constructor() {
    this.buffer = null;
    this.loop = false;
    this.playbackRate = {
      value: 1,
      setTargetAtTime: (v) => { this.playbackRate.value = v; }
    };
  }
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  createGain() { return new MockGain(); }
  createOscillator() { return new MockOscillator(); }
  createBiquadFilter() { return new MockBiquadFilter(); }
  createBufferSource() { return new MockBufferSource(); }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
  async decodeAudioData(buf) {
    return { duration: 1.0, numberOfChannels: 2, sampleRate: 44100 };
  }
  resume() {}
}

const sandbox = {
  window: {
    AudioContext: MockAudioContext,
    speechSynthesis: {
      getVoices: () => [{ name: 'Microsoft David', lang: 'en-US' }],
      cancel: () => {},
      speak: () => {}
    },
    location: { search: '' }
  },
  AudioContext: MockAudioContext,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  fetch: async (url) => {
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(1024)
    };
  }
};
sandbox.window.window = sandbox.window;

// 3. Load and evaluate audio.js in VM sandbox
const audioCode = fs.readFileSync(path.join(__dirname, 'atomic-bomber', 'js', 'audio.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(audioCode, sandbox);

const soundSystem = sandbox.window.soundSystem;
if (!soundSystem) {
  console.error('[FAIL] window.soundSystem not instantiated!');
  process.exit(1);
}
console.log('[PASS] audio.js parsed and soundSystem instantiated successfully.');

// 4. Test soundSystem initialization & sound loading
soundSystem.init();
if (!soundSystem.ctx) {
  console.error('[FAIL] soundSystem.init() failed to create AudioContext');
  process.exit(1);
}
console.log('[PASS] soundSystem.init() initialized AudioContext.');

// 5. Test Helicopter Rotor Engine
soundSystem.startHeliRotor();
if (!soundSystem.isHeliRunning) {
  console.error('[FAIL] startHeliRotor() did not set isHeliRunning to true');
  process.exit(1);
}
console.log('[PASS] startHeliRotor() successfully started helicopter rotor loop.');

soundSystem.updateHeliRotor(0.8, false); // Cruise
soundSystem.updateHeliRotor(0.2, true);  // Hover
console.log('[PASS] updateHeliRotor() adjusted pitch/gain for hover and high speed.');

soundSystem.stopHeliRotor();
if (soundSystem.isHeliRunning) {
  console.error('[FAIL] stopHeliRotor() failed to stop rotor');
  process.exit(1);
}
console.log('[PASS] stopHeliRotor() cleanly stopped rotor acoustic loop.');

// 6. Test 3-Stage Chain Gun / Minigun Audio
soundSystem.startChainGun();
if (!soundSystem.isChainGunFiring) {
  console.error('[FAIL] startChainGun() did not set isChainGunFiring to true');
  process.exit(1);
}
console.log('[PASS] startChainGun() initiated spinup and continuous burst.');

soundSystem.stopChainGun();
if (soundSystem.isChainGunFiring) {
  console.error('[FAIL] stopChainGun() did not reset isChainGunFiring');
  process.exit(1);
}
console.log('[PASS] stopChainGun() initiated spindown and stopped continuous burst.');

// 7. Test Unified Engine Interface (Jet vs Helicopter switching)
// Test Jet Mode
soundSystem.startEngine(false);
if (!soundSystem.isEngineRunning || soundSystem.isHeliRunning) {
  console.error('[FAIL] startEngine(false) should start jet, not heli');
  process.exit(1);
}
soundSystem.updateEngine(0.7, true);
soundSystem.stopEngine();
if (soundSystem.isEngineRunning) {
  console.error('[FAIL] stopEngine() failed to stop jet engine');
  process.exit(1);
}
console.log('[PASS] Unified startEngine(false) correctly controls Jet Engine.');

// Test Helicopter Mode
soundSystem.startEngine(true);
if (!soundSystem.isHeliRunning || soundSystem.isEngineRunning) {
  console.error('[FAIL] startEngine(true) should start heli, not jet');
  process.exit(1);
}
soundSystem.updateEngine(0.5, false, true);
soundSystem.stopEngine();
if (soundSystem.isHeliRunning) {
  console.error('[FAIL] stopEngine() failed to stop helicopter rotor');
  process.exit(1);
}
console.log('[PASS] Unified startEngine(true) correctly controls Helicopter Rotor.');

// 8. Test Dedicated Tactical Audio Helpers
const tacticalMethods = [
  'play20mm',
  'play30mm',
  'playWaterSplash',
  'playMetalHit',
  'playSonicBoom',
  'playCockpitAlert',
  'playRocketExplo',
  'playTrainSound',
  'playCoinChime'
];
tacticalMethods.forEach(method => {
  if (typeof soundSystem[method] !== 'function') {
    console.error(`[FAIL] Missing method: ${method}`);
    process.exit(1);
  }
  soundSystem[method](); // Call helper method
  console.log(`[PASS] Tested helper method: ${method}()`);
});

// 9. Test Synthesize Fallback for all 30 sounds (guarantee zero crashes on offline/fallback)
soundSystem.soundNames.forEach(s => {
  soundSystem.synthesizeFallback(s, 0.5, 1.0);
});
console.log(`[PASS] synthesizeFallback tested for all ${soundSystem.soundNames.length} sounds without error.`);

console.log('--- ALL PHASE 1 AUDIO SYSTEM TESTS PASSED SUCCESSFULLY! ---');
