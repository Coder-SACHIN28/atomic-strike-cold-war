const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('  CRAZYGAMES DEVELOPER PORTAL SUBMISSION REVIEW AUDIT SUITE     ');
console.log('================================================================\n');

// 1. Audit index.html for CrazyGames QA standards
console.log('CHECKPOINT 1: Checking index.html and SDK tags...');
const indexHtml = fs.readFileSync('C:\\REA\\atomic-bomber\\index.html', 'utf8');

assert.ok(indexHtml.includes('https://sdk.crazygames.com/crazygames-sdk-v3.js'), 'Must include official CrazyGames SDK v3');
assert.ok(!indexHtml.includes('poki-sdk.js'), 'MUST NOT include competing platform SDKs (e.g. Poki)');
assert.ok(indexHtml.includes('<canvas id="gameCanvas" width="1280" height="720"></canvas>'), 'Must have 1280x720 canvas');
assert.ok(indexHtml.includes('viewport'), 'Must contain responsive viewport tag');
console.log('✓ PASS: index.html is 100% CrazyGames compliant.\n');

// 2. Audit style.css for responsive letterbox scaling
console.log('CHECKPOINT 2: Checking style.css for 16:9 responsive display...');
const styleCss = fs.readFileSync('C:\\REA\\atomic-bomber\\style.css', 'utf8');
assert.ok(styleCss.includes('aspect-ratio: 16 / 9'), 'Must enforce 16:9 aspect ratio');
assert.ok(styleCss.includes('user-select: none'), 'Must prevent unwanted text selection during gameplay');
assert.ok(styleCss.includes('overflow: hidden'), 'Must prevent scrollbars');
console.log('✓ PASS: style.css enforces responsive 16:9 layout without page overflow.\n');

// 3. Simulate full CrazyGames SDK Lifecycle & In-Game Progression
console.log('CHECKPOINT 3: Simulating CrazyGames SDK Lifecycle & Event Calls...');

const sdkEvents = [];
const mockCrazyGamesSDK = {
  SDK: {
    init: async () => {
      sdkEvents.push('SDK.init');
      return true;
    },
    game: {
      loadingStart: () => sdkEvents.push('game.loadingStart'),
      loadingStop: () => sdkEvents.push('game.loadingStop'),
      gameplayStart: () => sdkEvents.push('game.gameplayStart'),
      gameplayStop: () => sdkEvents.push('game.gameplayStop'),
      happytime: () => sdkEvents.push('game.happytime'),
      addSettingsChangeListener: (cb) => {
        mockCrazyGamesSDK._settingsListener = cb;
        sdkEvents.push('game.addSettingsChangeListener');
      }
    },
    ad: {
      requestAd: (type, callbacks) => {
        sdkEvents.push(`ad.requestAd:${type}`);
        if (callbacks.adStarted) callbacks.adStarted();
        setTimeout(() => {
          if (callbacks.adFinished) callbacks.adFinished();
        }, 10);
      }
    },
    data: {
      getItem: (key) => {
        sdkEvents.push(`data.getItem:${key}`);
        return null;
      },
      setItem: (key, val) => {
        sdkEvents.push(`data.setItem:${key}`);
      }
    }
  }
};

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
    setLineDash: () => {},
    translate: () => {},
    scale: () => {},
    closePath: () => {}
  }),
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
};

const dom = {
  getElementById: (id) => {
    if (id === 'gameCanvas') return mockCanvas;
    return {
      innerText: '',
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      addEventListener: () => {}
    };
  }
};

const sandbox = {
  window: {},
  document: dom,
  console: console,
  setTimeout: (fn, ms) => setTimeout(fn, ms || 1),
  clearTimeout: () => {},
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  Image: class {
    constructor() {
      this.complete = true;
    }
    set src(val) {
      this._src = val;
      if (this.onload) this.onload();
    }
    get src() {
      return this._src;
    }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
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
          setValueAtTime: function(val) { this.value = val; },
          setTargetAtTime: function(val) { this.value = val; },
          linearRampToValueAtTime: function(val) { this.value = val; },
          exponentialRampToValueAtTime: function(val) { this.value = val; }
        },
        connect: () => {}
      };
    }
    createOscillator() { return { type: 'sine', frequency: { value: 440, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: { value: 300, setValueAtTime: () => {} }, Q: { value: 1, setValueAtTime: () => {} }, connect: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { buffer: null, loop: false, playbackRate: { value: 1.0 }, connect: () => {}, start: () => {}, stop: () => {} }; }
    resume() { return Promise.resolve(); }
  },
  SpeechSynthesisUtterance: class {
    constructor(text) {
      this.text = text;
      this.rate = 1.0;
      this.volume = 1.0;
      this.pitch = 1.0;
      this.voice = null;
    }
  }
};
sandbox.window = sandbox;
sandbox.window.CrazyGames = mockCrazyGamesSDK;
sandbox.addEventListener = () => {};
sandbox.window.addEventListener = () => {};
sandbox.window.speechSynthesis = {
  cancel: () => {},
  speak: () => {},
  getVoices: () => [{ name: 'Microsoft Ryan Online (Natural)', lang: 'en-US' }]
};

const context = vm.createContext(sandbox);

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

for (const scriptPath of scripts) {
  const code = fs.readFileSync(scriptPath, 'utf8');
  vm.runInContext(code, context, { filename: scriptPath });
}

vm.runInContext(`
  window.soundSystem = new SoundSystem();
  window.soundSystem.init();
  window.inputController = new InputController();
  window.atomicGame = new AtomicBomberGame();
`, context);

// 3.1 Verify loading events
assert.ok(sdkEvents.includes('game.loadingStart'), 'Must call loadingStart when preloading begins');
assert.ok(sdkEvents.includes('game.loadingStop'), 'Must call loadingStop when preloading completes');
console.log('✓ PASS: Loading lifecycle events (loadingStart, loadingStop) fired correctly.');

// 3.2 Verify Gameplay Start
vm.runInContext(`
  window.atomicGame.startNewGame('standard');
`, context);
assert.ok(sdkEvents.includes('game.gameplayStart'), 'Must call gameplayStart when sortie begins');
console.log('✓ PASS: gameplayStart fired when player deploys into combat.');

// 3.3 Verify Armory Open/Close Lifecycle
const eventsBeforeArmory = sdkEvents.length;
vm.runInContext(`
  window.atomicGame.openArmory();
`, context);
assert.ok(sdkEvents.slice(eventsBeforeArmory).includes('game.gameplayStop'), 'Must call gameplayStop when opening armory/hangar');

const eventsBeforeClose = sdkEvents.length;
vm.runInContext(`
  window.atomicGame.closeArmory();
`, context);
assert.ok(sdkEvents.slice(eventsBeforeClose).includes('game.gameplayStart'), 'Must call gameplayStart when resuming from armory/hangar');
console.log('✓ PASS: gameplayStop / gameplayStart fired on Armory transitions.');

// 3.4 Verify Pause / Resume Lifecycle
const eventsBeforePause = sdkEvents.length;
vm.runInContext(`
  window.inputController.keysPressed['KeyP'] = true;
  window.atomicGame.update(16.6);
`, context);
assert.ok(sdkEvents.slice(eventsBeforePause).includes('game.gameplayStop'), 'Must call gameplayStop on Pause');

const eventsBeforeUnpause = sdkEvents.length;
vm.runInContext(`
  window.inputController.keysPressed['KeyP'] = true;
  window.atomicGame.update(16.6);
`, context);
assert.ok(sdkEvents.slice(eventsBeforeUnpause).includes('game.gameplayStart'), 'Must call gameplayStart on Unpause');
console.log('✓ PASS: gameplayStop / gameplayStart fired on Game Pause / Resume.');

// 3.5 Verify Wave Clear Happytime
const eventsBeforeHappy = sdkEvents.length;
vm.runInContext(`
  window.atomicGame.notifyWaveCleared();
`, context);
assert.ok(sdkEvents.slice(eventsBeforeHappy).includes('game.happytime'), 'Must call happytime on Wave Cleared');
console.log('✓ PASS: happytime milestone event fired on Wave Clear.');

// 3.6 Verify Player Death Gameplay Stop
const eventsBeforeDeath = sdkEvents.length;
vm.runInContext(`
  window.atomicGame.handlePlayerDeath('ground collision');
`, context);
assert.ok(sdkEvents.slice(eventsBeforeDeath).includes('game.gameplayStop'), 'Must call gameplayStop on Crash / Game Over');
console.log('✓ PASS: gameplayStop fired when aircraft is destroyed.');

// 3.7 Verify Rewarded Ads without Anti-Cheat Delay Blocker
console.log('\nCHECKPOINT 4: Testing Rewarded Ad & Instant Reward Delivery for QA Review...');
let rewardReceived = false;
vm.runInContext(`
  window.atomicGame.requestRewardedAd('emergency_revive', () => {
    rewardReceived = true;
  });
`, context);

setTimeout(() => {
  const result = vm.runInContext('rewardReceived', context);
  assert.strictEqual(result, true, 'Rewarded ad must grant reward immediately upon adFinished in test mode');
  console.log('✓ PASS: Rewarded ad delivers reward reliably without client-side duration rejection.');

  // 3.8 Verify CrazyGames Portal Mute Setting
  console.log('\nCHECKPOINT 5: Testing CrazyGames Portal Audio Mute Setting...');
  vm.runInContext(`
    window.CrazyGames._settingsListener({ muteAudio: true });
  `, context);
  const isMuted = vm.runInContext('window.soundSystem.platformMuted', context);
  assert.strictEqual(isMuted, true, 'Game must mute when CrazyGames SDK settings reports muteAudio = true');

  vm.runInContext(`
    window.CrazyGames._settingsListener({ muteAudio: false });
  `, context);
  const isUnmuted = vm.runInContext('window.soundSystem.platformMuted', context);
  assert.strictEqual(isUnmuted, false, 'Game must restore sound when CrazyGames SDK settings reports muteAudio = false');
  console.log('✓ PASS: CrazyGames addSettingsChangeListener muteAudio is honored accurately.');

  console.log('\n================================================================');
  console.log('  ALL CRAZYGAMES PORTAL REVIEW AUDIT CHECKS PASSED (100%)!       ');
  console.log('  THE BUILD IS COMPLETELY READY FOR OFFICIAL SUBMISSION!        ');
  console.log('================================================================');
}, 50);
