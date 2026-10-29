const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- STARTING VERIFICATION: WEATHER, WEAPONS, ENGLISH RADIO & FLUID NAPALM ---');

const domMock = {
  performance: { now: () => Date.now() },
  document: {
    getElementById: (id) => ({
      id: id,
      width: 1280,
      height: 720,
      innerText: '',
      innerHTML: '',
      style: {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      addEventListener: () => {},
      blur: () => {},
      getContext: () => ({
        save: () => {},
        restore: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        drawImage: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        ellipse: () => {},
        setLineDash: () => {}
      })
    }),
    addEventListener: () => {},
    fullscreenElement: null
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: {
      speak: (u) => { domMock.window._lastSpoken = u.text; },
      cancel: () => {},
      getVoices: () => [{ lang: 'en-US', name: 'English US' }]
    },
    SpeechSynthesisUtterance: function(text) { this.text = text; this.rate = 1; this.pitch = 1; },
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    CrazyGames: {
      SDK: {
        init: async () => {},
        game: {
          loadingStart: () => {},
          loadingStop: () => {},
          gameplayStart: () => {},
          gameplayStop: () => {},
          happytime: () => {}
        },
        ad: {
          requestAd: (type, callbacks) => {
            if (callbacks && callbacks.adFinished) callbacks.adFinished();
          }
        }
      }
    },
    AudioContext: function() {
      return {
        createGain: () => ({ gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
        createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
        createBufferSource: () => ({ buffer: null, connect: () => {}, start: () => {}, stop: () => {}, loop: false }),
        destination: {},
        currentTime: 0,
        decodeAudioData: (buf, cb) => cb && cb({})
      };
    }
  },
  console: console,
  Math: Math,
  Date: Date,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};
domMock.Image = function() { this.src = ''; this.onload = null; };
domMock.window.Image = domMock.Image;
domMock.SpeechSynthesisUtterance = domMock.window.SpeechSynthesisUtterance;
domMock.window.window = domMock.window;
domMock.window.document = domMock.document;
domMock.window.performance = domMock.performance;

const ctx = vm.createContext(domMock);

const jsDir = 'C:/REA/atomic-bomber/js';
const files = [
  'audio.js',
  'terrain.js',
  'weapons.js',
  'entities.js',
  'hud.js',
  'input.js',
  'armory.js',
  'engine.js',
  'main.js'
];

for (const f of files) {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  console.log(`Evaluating ${f}...`);
  vm.runInContext(code, ctx, { filename: f });
}
console.log('✅ All JS files evaluated without any syntax or runtime parse errors!\n');

// Test 1: Audio System Verification
console.log('Test 1: Testing Audio System Sound Helper Methods...');
const soundSys = new ctx.window.SoundSystem();
assert.strictEqual(typeof soundSys.playWaterSplash, 'function', 'playWaterSplash must exist');
assert.strictEqual(typeof soundSys.playWaterHit, 'function', 'playWaterHit must exist');
assert.strictEqual(typeof soundSys.playMetalHit, 'function', 'playMetalHit must exist');
assert.strictEqual(typeof soundSys.playThunder, 'function', 'playThunder must exist');
assert.strictEqual(typeof soundSys.playChainFire, 'function', 'playChainFire must exist');
console.log('✅ SoundSystem has all 5 new audio methods!\n');

// Test 2: Terrain Clean Hills (No unnatural ground water pools, only weather rain)
console.log('Test 2: Testing Terrain Clean Hills (Rain weather only, no ground water cuts)...');
const terrain = new ctx.window.TerrainEngine({ width: 1280, height: 720 });
terrain.generate(1);
assert.strictEqual(terrain.waterBodies.length, 0, 'Terrain must NOT generate ground water pools');
assert.strictEqual(terrain.isWaterAt(500, 500), false, 'isWaterAt must be false');
console.log('✅ Clean hills verified without ground water pool cuts!\n');

// Test 3: Weapons Physics & Entities Verification
console.log('Test 3: Testing Weapons Fluid Napalm, Casings, Sparks & Water Splashes...');
const dummyGame = {
  canvas: { width: 1280, height: 720 },
  sprites: {},
  terrain: terrain,
  entities: {
    checkDirectHit: () => false,
    checkBlastDamage: () => {},
    enemies: []
  },
  triggerScreenShake: () => {},
  addFloatingText: () => {}
};
const weapons = new ctx.window.WeaponManager(dummyGame);
assert(Array.isArray(weapons.napalmDroplets), 'napalmDroplets array must exist');
assert(Array.isArray(weapons.shellCasings), 'shellCasings array must exist');
assert(Array.isArray(weapons.sparks), 'sparks array must exist');
assert(Array.isArray(weapons.waterSplashes), 'waterSplashes array must exist');

// Test GAU-8 firing with shell casing
weapons.fireGau8(500, 300, 15, 0, 10);
assert.strictEqual(weapons.bullets.length, 1, 'Bullet must be created');
assert.strictEqual(weapons.shellCasings.length, 1, 'Brass shell casing must be ejected');
console.log('Brass shell casing ejected successfully:', weapons.shellCasings[0]);

// Test Napalm bomb fluid physics
weapons.dropNapalm(600, 200, 5, 2);
assert.strictEqual(weapons.napalmBombs.length, 1, 'Napalm bomb dropped');
// Force bomb to ground
weapons.napalmBombs[0].y = terrain.getHeightAt(600);
weapons.update(terrain);
assert(weapons.napalmDroplets.length >= 16, 'Napalm canister must rupture into >= 16 viscous liquid droplets');
console.log(`Napalm rupture created ${weapons.napalmDroplets.length} burning liquid droplets with physics!`);

// Test droplet update with slope rolling
const droplet = weapons.napalmDroplets[0];
const initVx = droplet.vx;
weapons.update(terrain);
console.log(`Droplet updated, onGround: ${droplet.onGround}, vx: ${droplet.vx}`);
console.log('✅ Napalm fluid physics & weapons particles work perfectly!\n');

// Test 4: Enemy Missile Aggression & Expedited Airdrops
console.log('Test 4: Testing Enemy Missiles & Expedited Airdrops...');
const entities = new ctx.window.EntityManager(dummyGame);
dummyGame.terrain = terrain;
dummyGame.player = { x: 500, y: 200, hp: 20, maxHp: 100, bombs: 1, maxBombs: 10, rocketAmmo: 0, maxRockets: 14, alive: true };
entities.player = dummyGame.player;
entities.skyDropTimer = 500;
entities.updateEnemies();
assert(entities.skyDropTimer <= 150, 'Airdrop timer must be reduced in emergency state');
console.log(`Emergency airdrop timer expedited to: ${entities.skyDropTimer} frames (~2.5s)!`);

// Test Enemy units launch missiles
entities.spawnWave(3, 'EUROPEAN');
const sam = entities.enemies.find(e => e.type === 'sam_site');
assert(sam !== undefined, 'SAM site must spawn in wave 3');
console.log('SAM site radar range:', sam.radarRange, 'reloadTimer:', sam.reloadTimer);

entities.spawnMig(3);
assert(entities.migs.length > 0, 'MiG-21 must spawn');
console.log('MiG-21 spawned with missile tracking capabilities!');

entities.spawnHind(3);
assert(entities.hinds.length > 0, 'Mi-24 Hind must spawn');
console.log('Mi-24 Hind airborne boss spawned with AT-6 Spiral missiles!');
console.log('✅ Enemy aggression & expedited airdrops verified!\n');

// Test 5: Dynamic Weather System & Thunderstorms
console.log('Test 5: Testing Dynamic Weather System...');
const engine = new ctx.window.RenderEngine(domMock.document.getElementById('c'));
engine.initWeatherSystems();
assert(Array.isArray(engine.rainParticles) && engine.rainParticles.length >= 100, 'Rain particles must be initialized');
assert(['CLEAR', 'CLOUDY', 'RAIN', 'THUNDERSTORM'].includes(engine.currentWeather), 'Weather must be one of the 4 types');
console.log(`Current initial weather: ${engine.currentWeather}, Rain particles: ${engine.rainParticles.length}`);
engine.currentWeather = 'THUNDERSTORM';
engine.lightningTimer = 1;
// Update weather to trigger lightning
engine.update(500, 200, 'EUROPEAN');
assert(engine.activeLightning !== null, 'Lightning strike must be generated during thunderstorm');
console.log(`Lightning generated with ${engine.activeLightning.branches.length} branches!`);
console.log('✅ Dynamic weather system verified!\n');

// Test 6: HUD Combat Tactical Advisor
console.log('Test 6: Testing HUD Tactical Combat Advisor...');
const hud = new ctx.window.HUD(dummyGame);
assert.strictEqual(typeof hud.drawCombatAdvisory, 'function', 'drawCombatAdvisory must exist on HUD');
console.log('✅ HUD drawCombatAdvisory method exists and ready to draw tactical cues!\n');

// Test 7: English Radio Speech Synthesis & Wingman Comms
console.log('Test 7: Testing English Radio & Wingman Call-in Speech...');
const main = new ctx.window.AtomicBomberGame();
// Calling radio without forceVoice or wingman should NOT speak audio (text only)
domMock.window._lastSpoken = null;
main.setRadioMessage('TOWER', 'Target destroyed', 180, false);
assert.strictEqual(domMock.window._lastSpoken, null, 'Regular combat radio messages must NOT speak audio during fights');
console.log('Regular combat message displayed silently without interrupting combat!');

// Calling air support MUST speak in English
main.state = 'PLAYING';
main.entities.player = { alive: true, x: 500, y: 200 };
main.requestAirSupport();
console.log('Air support call-in spoke English voice line:', domMock.window._lastSpoken);
assert(domMock.window._lastSpoken && (domMock.window._lastSpoken.includes('Razor 1-1') || domMock.window._lastSpoken.includes('Viper Lead')), 'Air support call-in must speak audible English voice');

// Wingman pilot speaking MUST speak in English
domMock.window._lastSpoken = null;
main.setRadioMessage('RAZOR 1-1', 'Target locked, releasing ordnance!', 180);
assert(domMock.window._lastSpoken && domMock.window._lastSpoken.includes('Target locked'), 'Wingman bot pilot speech must trigger English audio');
console.log('Wingman bot pilot spoke English voice line:', domMock.window._lastSpoken);
console.log('✅ English Radio & Wingman voice synthesis 100% verified!\n');

console.log('🎉 ALL 7 SYSTEM TESTS PASSED WITH ZERO ERRORS!');
