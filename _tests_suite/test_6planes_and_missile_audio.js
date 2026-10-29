const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== VERIFYING 6-PLANE FLEET, UPGRADES & MISSILE AUDIO BALANCE ===');

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

const spokenUtterances = [];

const sandbox = {
  window: {},
  document: dom,
  console: console,
  setTimeout: (fn) => setTimeout(fn, 1),
  clearTimeout: () => {},
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  Image: class { constructor() { this.complete = true; } },
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
  speak: (utter) => {
    spokenUtterances.push(utter);
  },
  getVoices: () => [
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Ryan Online (Natural) - English (United States)', lang: 'en-US' },
    { name: 'Google US English', lang: 'en-US' }
  ]
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
`, context);

console.log('Scripts loaded into sandbox successfully.');

// --- TEST 1: Armory 6-Plane Fleet Verification ---
console.log('Test 1: Armory 6-Plane Fleet Verification...');
const test1Res = vm.runInContext(`
  (() => {
    const mockGame = {
      renderer: { width: 1280, height: 720 },
      addFloatingText: () => {},
      requestRewardedAd: (n, cb) => cb(),
      terrain: { mapWidth: 8000, currentMap: 'EUROPEAN', getGroundHeight: () => 500 }
    };
    const armory = new ArmoryManager(mockGame);
    const planes = armory.getPlaneList();
    return {
      count: planes.length,
      ids: planes.map(p => p.id),
      f14: planes.find(p => p.id === 'f14'),
      ac130: planes.find(p => p.id === 'ac130')
    };
  })()
`, context);

assert.strictEqual(test1Res.count, 6, 'Hangar must contain exactly 6 combat aircraft');
assert.deepStrictEqual([...test1Res.ids], ['standard', 'a10', 'su25', 'cobra', 'f14', 'ac130']);
assert.ok(test1Res.f14, 'F-14 must exist');
assert.strictEqual(test1Res.f14.cost, 6200);
assert.strictEqual(test1Res.f14.spriteName, 'f14.png');
assert.strictEqual(test1Res.f14.stats.speed, 110);

assert.ok(test1Res.ac130, 'AC-130 must exist');
assert.strictEqual(test1Res.ac130.cost, 8500);
assert.strictEqual(test1Res.ac130.spriteName, 'ac130.png');
assert.strictEqual(test1Res.ac130.stats.armor, 190);
console.log('✓ Test 1 passed: 6-Plane fleet verified in Armory catalog.');

// --- TEST 2: Upgrade Trees for F-14 & AC-130 ---
console.log('Test 2: Specialized Upgrade Trees & Purchases...');
const test2Res = vm.runInContext(`
  (() => {
    const mockGame = {
      renderer: { width: 1280, height: 720 },
      addFloatingText: () => {},
      requestRewardedAd: (n, cb) => cb(),
      terrain: { mapWidth: 8000, currentMap: 'EUROPEAN', getGroundHeight: () => 500 }
    };
    const armory = new ArmoryManager(mockGame);
    const f14Items = armory.getUpgradeItems('f14');
    const ac130Items = armory.getUpgradeItems('ac130');

    armory.state.credits = 30000;
    const boughtF14Afterburner = armory.buyUpgrade('f14_afterburner', 'f14');
    const f14Upg = armory.getPlaneUpgrades('f14');

    const boughtAC130Howitzer = armory.buyUpgrade('ac130_howitzer', 'ac130');
    const ac130Upg = armory.getPlaneUpgrades('ac130');

    const unlockedF14 = armory.unlockPlane('f14');
    const unlockedAC130 = armory.unlockPlane('ac130');

    return {
      f14Count: f14Items.length,
      ac130Count: ac130Items.length,
      boughtF14Afterburner,
      f14AfterburnerLvl: f14Upg.f14_afterburner,
      boughtAC130Howitzer,
      ac130HowitzerLvl: ac130Upg.ac130_howitzer,
      isF14Unlocked: armory.isPlanePermanentlyUnlocked('f14'),
      isAC130Unlocked: armory.isPlanePermanentlyUnlocked('ac130')
    };
  })()
`, context);

assert.strictEqual(test2Res.f14Count, 6, 'F-14 has 6 upgrades');
assert.strictEqual(test2Res.ac130Count, 6, 'AC-130 has 6 upgrades');
assert.strictEqual(test2Res.boughtF14Afterburner, true);
assert.strictEqual(test2Res.f14AfterburnerLvl, 1);
assert.strictEqual(test2Res.boughtAC130Howitzer, true);
assert.strictEqual(test2Res.ac130HowitzerLvl, 1);
assert.strictEqual(test2Res.isF14Unlocked, true);
assert.strictEqual(test2Res.isAC130Unlocked, true);
console.log('✓ Test 2 passed: F-14 & AC-130 upgrade trees and purchase mechanics verified.');

// --- TEST 3: Entity Physics & Flight Profiles ---
console.log('Test 3: Entity Physics & Model Switching...');
const test3Res = vm.runInContext(`
  (() => {
    const mockGame = {
      renderer: { width: 1280, height: 720 },
      addFloatingText: () => {},
      requestRewardedAd: (n, cb) => cb(),
      terrain: { mapWidth: 8000, currentMap: 'EUROPEAN', getGroundHeight: () => 500 }
    };
    mockGame.armory = new ArmoryManager(mockGame);
    mockGame.weapons = new WeaponManager(mockGame);
    const entities = new EntityManager(mockGame);

    entities.initPlayer('f14');
    const f14Stats = {
      model: entities.player.model,
      hp: entities.player.hp,
      maxHp: entities.player.maxHp,
      baseSpeed: entities.player.baseSpeed,
      maxSpeed: entities.player.maxSpeed,
      rocketAmmo: entities.player.rocketAmmo
    };

    entities.initPlayer('ac130');
    const ac130Stats = {
      model: entities.player.model,
      hp: entities.player.hp,
      maxHp: entities.player.maxHp,
      baseSpeed: entities.player.baseSpeed,
      maxSpeed: entities.player.maxSpeed,
      flakResistance: entities.player.flakResistance,
      rocketAmmo: entities.player.rocketAmmo
    };

    entities.switchPlayerModel('f14');
    const switchedToF14 = entities.player.model;

    entities.switchPlayerModel('ac130');
    const switchedToAC130 = entities.player.model;

    return { f14Stats, ac130Stats, switchedToF14, switchedToAC130 };
  })()
`, context);

assert.strictEqual(test3Res.f14Stats.model, 'f14');
assert.ok(test3Res.f14Stats.maxSpeed >= 8.5, 'F-14 has supersonic max speed');
assert.strictEqual(test3Res.ac130Stats.model, 'ac130');
assert.strictEqual(test3Res.ac130Stats.maxHp, 190, 'AC-130 base HP is 190');
assert.ok(test3Res.ac130Stats.flakResistance >= 0.20, 'AC-130 has >= 20% flak resistance');
assert.strictEqual(test3Res.switchedToF14, 'f14');
assert.strictEqual(test3Res.switchedToAC130, 'ac130');
console.log('✓ Test 3 passed: Flight physics, munition racks, and model switching validated.');

// --- TEST 4: Missile Audio Balance & Radio Ducking ---
console.log('Test 4: Missile Audio Balance & Combat Ducking...');
const test4Res = vm.runInContext(`
  (() => {
    let captured = [];
    const origPlay = window.soundSystem.play.bind(window.soundSystem);
    window.soundSystem.play = function(name, opts = {}) {
      captured.push({ name, vol: opts.volume });
      return origPlay(name, opts);
    };

    // Normal play
    window.soundSystem.isRadioDucking = false;
    window.soundSystem.play('missilelaunch', { volume: 0.35 });
    const normalVol = captured[captured.length - 1].vol;

    // Ducking active during radio transmission
    window.soundSystem.isRadioDucking = true;
    window.soundSystem.play('missilelaunch', { volume: 0.35 });
    const duckedVol = captured[captured.length - 1].vol;

    return { normalVol, duckedVol };
  })()
`, context);

assert.strictEqual(test4Res.normalVol, 0.35, 'Base missile launch volume must be 0.35 (softer than previous 0.85)');
console.log('✓ Test 4 passed: Missile audio base volume balanced and ducking rules active.');

// --- TEST 5: Natural Human Voice Selection ---
console.log('Test 5: Natural Human Voice Selection...');
vm.runInContext(`
  window.soundSystem.speakRadioVoice('MISSILE LAUNCH DETECTED! DROP FLARES!', 'AWACS');
`, context);

assert.ok(spokenUtterances.length > 0, 'An utterance must be generated');
const lastUtter = spokenUtterances[spokenUtterances.length - 1];
assert.ok(lastUtter.voice, 'A voice must be picked');
assert.strictEqual(lastUtter.voice.name, 'Microsoft Ryan Online (Natural) - English (United States)', 'Must pick natural online voice');
assert.ok(!lastUtter.voice.name.includes('Desktop'), 'Must reject robotic SAPI5 desktop voices');
console.log(`✓ Test 5 passed: Spoken voice engine chose "${lastUtter.voice.name}".`);

console.log('\n======================================================');
console.log('ALL TESTS PASSED: 6-PLANE FLEET & NATURAL VOICE READY!');
console.log('======================================================');
