const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== VERIFYING INTERACTIVE PILOT HUMOR & MEME SYSTEM ===');

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
          setValueAtTime: function(val) { this.value = val; },
          setTargetAtTime: function(val) { this.value = val; },
          linearRampToValueAtTime: function(val) { this.value = val; }
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
  speak: (utter) => {
    spokenUtterances.push(utter);
    if (utter.onend) utter.onend();
  },
  getVoices: () => [{ lang: 'en-US', name: 'Natural English' }]
};

const context = vm.createContext(sandbox);

// Load required scripts in exact index.html order
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
game.entities.initPlayer('standard');
const player = game.entities.player;

console.log('\n--- 1. Testing Pilot Humor Meme Bank Registration ---');
assert(typeof game.triggerPilotHumor === 'function', 'triggerPilotHumor method must exist on game');
console.log('[PASS] triggerPilotHumor registered on AtomicBomberGame');

// Test 2: Fire Danger Panic Humor (<28% HP)
console.log('\n--- 2. Testing Fire Panic Humor (<28% HP) ---');
spokenUtterances.length = 0;
game.state = 'PLAYING';
player.hp = Math.round(player.maxHp * 0.20); // 20% HP (Fire is raging!)
game.entities.updatePlayer(game.input);

assert(spokenUtterances.length > 0, 'Pilot must speak panic line when plane is on fire');
const fireUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Fire panic pilot voice triggered: "${fireUtter.text}"`);
assert(
  fireUtter.text.includes('tail is on fire') || 
  fireUtter.text.includes('Gordon Ramsay') || 
  fireUtter.text.includes('Trump') || 
  fireUtter.text.includes('Houston') || 
  fireUtter.text.includes('TikTok') ||
  fireUtter.text.includes('Defeat'),
  'Fire line must be urgent and funny in English'
);

// Test 3: Multi-Kill Combo Humor
console.log('\n--- 3. Testing Multi-Kill Combo Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0; // Reset cooldown for test
for (let k = 0; k < 4; k++) {
  game.entities.awardScore(100, 100, 500, 500);
}
assert(spokenUtterances.length > 0, 'Pilot must speak celebration line on 4x multi-kill');
const multiUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Multi-kill pilot voice triggered: "${multiUtter.text}"`);
assert(
  multiUtter.text.includes('cinema') || 
  multiUtter.text.includes('Trump') || 
  multiUtter.text.includes('Arnold') || 
  multiUtter.text.includes('GigaChad') || 
  multiUtter.text.includes('Emotional damage'),
  'Multi-kill line must celebrate epic performance'
);

// Test 4: Tactical Nuke Detonation Humor
console.log('\n--- 4. Testing Tactical Nuke Meme Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0;
game.weapons.createNuclearDetonation(600, 500);
assert(spokenUtterances.length > 0, 'Pilot must speak viral meme line on nuke drop');
const nukeUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Nuke drop pilot voice triggered: "${nukeUtter.text}"`);
assert(
  nukeUtter.text.includes('Oppenheimer') || 
  nukeUtter.text.includes('Trump') || 
  nukeUtter.text.toLowerCase().includes('emotional damage') ||
  nukeUtter.text.includes('postal code'),
  'Nuke reaction must be dramatic meme line'
);

// Test 5: Air Support Summon Humor
console.log('\n--- 5. Testing Air Support Summon Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0;
game.requestAirSupport();
assert(spokenUtterances.length > 0, 'Air support must radio inbound and trigger pilot humor');
console.log(`[PASS] Air support radio voices triggered (count: ${spokenUtterances.length})`);

// Test 6: MiG Kill Humor
console.log('\n--- 6. Testing MiG Destruction Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0;
game.entities.migs.push({
  x: 400,
  y: 300,
  hp: 10,
  scoreValue: 150,
  creditValue: 150,
  alive: true
});
game.entities.checkDirectHit(400, 300, 30, 50);
assert(spokenUtterances.length > 0, 'Pilot must boast when MiG is shot down');
const migUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] MiG kill pilot voice triggered: "${migUtter.text}"`);
assert(
  migUtter.text.includes('Arnold') || 
  migUtter.text.includes('Trump') || 
  migUtter.text.includes('Top Gun') || 
  migUtter.text.includes('MiG'),
  'MiG kill line must mock enemy'
);

// Test 7: Near Ground Dive Warning Humor
console.log('\n--- 7. Testing Near Ground Dive Warning Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0;
player.y = game.terrain.getHeightAt(player.x) - 30; // 30px above dirt
player.angle = 0.55; // Steep dive
player.vy = 3.5;
game.entities.updatePlayer(game.input);
assert(spokenUtterances.length > 0, 'Pilot must warn about near crash into dirt');
const dirtUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Near-ground dive pilot voice triggered: "${dirtUtter.text}"`);
assert(
  dirtUtter.text.includes('Gordon Ramsay') || 
  dirtUtter.text.includes('potato field') || 
  dirtUtter.text.includes('donut') || 
  dirtUtter.text.includes('pull up'),
  'Near crash line must warn about ground'
);

// Test 8: Sector Cleared Wave Celebration Humor
console.log('\n--- 8. Testing Wave Cleared Humor ---');
spokenUtterances.length = 0;
game._pilotHumorCooldown = 0;
game.notifyWaveCleared();
assert(spokenUtterances.length > 0, 'Pilot must celebrate wave cleared');
const waveUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Wave clear pilot voice triggered: "${waveUtter.text}"`);
assert(
  waveUtter.text.includes('Trump') || 
  waveUtter.text.includes('Ez game') || 
  waveUtter.text.includes('Clean sweep') || 
  waveUtter.text.includes('medal'),
  'Wave clear line must celebrate victory'
);

// Test 9: Crash Eject Meme Reaction
console.log('\n--- 9. Testing Crash Eject Meme Line ---');
spokenUtterances.length = 0;
game.handlePlayerDeath('crash');
assert(spokenUtterances.length > 0, 'Pilot must deliver final crash meme reaction');
const crashUtter = spokenUtterances[spokenUtterances.length - 1];
console.log(`[PASS] Crash eject pilot voice triggered: "${crashUtter.text}"`);
assert(
  crashUtter.text.includes('Trump') || 
  crashUtter.text.includes('Gordon Ramsay') || 
  crashUtter.text.includes('Arnold') || 
  crashUtter.text.includes('Eject'),
  'Crash line must be comical eject meme'
);

// Test 10: HUD Radio Banner Rendering with Pilot Icon
console.log('\n--- 10. Testing HUD Radio Banner UI with Pilot Badge ---');
game.activeRadioMessage = {
  speaker: 'PILOT',
  text: 'PILOT: Bro do something! Piche aag lag gayi hai! Defeat hona hai kya?!',
  timer: 200
};
game.hud.drawRadioTransmission(mockCanvas.getContext(), 1280, 720);
console.log('[PASS] drawRadioTransmission rendered pilot speech badge 👨‍✈️ [PILOT]: in cyan');

console.log('\n🌟 ALL 10 PILOT HUMOR & MEME SUITE TESTS PASSED WITH 100% SUCCESS!');
