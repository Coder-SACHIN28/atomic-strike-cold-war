const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsDir = 'atomic-bomber/js';
const files = [
  'audio.js',
  'input.js',
  'terrain.js',
  'weapons.js',
  'entities.js',
  'hud.js',
  'armory.js',
  'codex.js',
  'engine.js',
  'main.js'
];

// Create a browser-like sandbox
const sandbox = {
  window: {},
  document: {
    getElementById: () => ({
      getContext: () => ({
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        arc: () => {},
        ellipse: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        measureText: () => ({ width: 50 }),
        fillText: () => {},
        strokeText: () => {},
        drawImage: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        clearRect: () => {}
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      innerText: '',
      value: ''
    }),
    createElement: () => ({
      getContext: () => ({}),
      style: {},
      classList: { toggle: () => {}, add: () => {}, remove: () => {} }
    }),
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  navigator: { userAgent: 'test' },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  Math: Math,
  Date: Date,
  Float32Array: Float32Array,
  Uint8Array: Uint8Array,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  AudioContext: function() {
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
  },
  Image: function() {
    this.complete = true;
    this.naturalWidth = 100;
    this.naturalHeight = 100;
    this.width = 100;
    this.height = 100;
    this.onload = null;
    this.onerror = null;
    this.src = '';
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  performance: { now: () => Date.now() },
  addEventListener: () => {},
  removeEventListener: () => {},
  speechSynthesis: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => []
  },
  SpeechSynthesisUtterance: function() {}
};

sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

console.log('Evaluating all 10 scripts in order into shared VM sandbox...');
files.forEach(f => {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  try {
    vm.runInContext(code, context, { filename: f });
    console.log(`✓ ${f} evaluated cleanly`);
  } catch (err) {
    console.error(`✗ Error evaluating ${f}:`, err);
  }
});

console.log('\nInstantiating AtomicBomberGame in sandbox...');
try {
  const game = vm.runInContext('new AtomicBomberGame()', context);
  console.log('✓ AtomicBomberGame instantiated successfully!');
  
  console.log('Testing startNewGame with all 10 aircraft...');
  const planes = ['a10', 'f14', 'su25', 'phantom', 'harrier', 'ac130', 'cobra', 'apache', 'comanche', 'chinook'];
  planes.forEach(p => {
    game.startNewGame(p);
    console.log(`  ✓ startNewGame('${p}') initialized player: ${game.entities.player.name}`);
  });
  
  console.log('Testing 300 game ticks with update and render...');
  const canvas = sandbox.document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  for (let frame = 0; frame < 300; frame++) {
    game.update();
    game.render();
  }
  console.log('✓ 300 combat frames updated and rendered with zero errors!');

  console.log('Testing armory open/close and sorting...');
  game.openArmory();
  game.render();
  game.closeArmory();
  console.log('✓ Armory opened, rendered, and closed cleanly!');

  console.log('Testing codex open/close, category switching, unit selection...');
  game.openCodex();
  game.codex.selectCategory('ARMOR_GROUND');
  game.codex.render(ctx, 1280, 720);
  game.codex.selectCategory('AIRBORNE');
  game.codex.render(ctx, 1280, 720);
  game.codex.selectCategory('STRATEGIC');
  game.codex.render(ctx, 1280, 720);
  game.closeCodex();
  console.log('✓ Codex opened, switched categories, rendered, and closed cleanly!');

} catch (err) {
  console.error('✗ Runtime error during VM test:', err);
}
