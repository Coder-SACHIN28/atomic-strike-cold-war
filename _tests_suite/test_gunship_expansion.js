// Headless Test Suite for Death From Above 3D Gunship Engine & Atomic Strike Integration

// Mock minimal DOM environment
global.window = {
  location: { search: '' },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  getElementById: (id) => {
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

// Mock SoundSystem
class MockSoundSystem {
  constructor() {
    this.enabled = true;
  }
  play() {}
  startEngine() {}
  stopEngine() {}
  stopGau8() {}
  setPlatformMuted() {}
}
global.soundSystem = new MockSoundSystem();

// Require Modules
const Gunship3DEngine = require('./atomic-bomber/js/gunship3d.js');

async function runTests() {
  console.log('=== TEST 1: Gunship3DEngine Instantiation & Battlefield Generation ===');
  const mockGame = {
    canvas: mockCanvas,
    renderer: {
      ctx: new MockCanvasContext(),
      triggerShake: () => {},
      triggerFlash: () => {},
      addFloatingText: () => {}
    },
    state: 'TITLE',
    armory: {
      state: { credits: 5000, highScore: 12000, selectedPlane: 'a10' },
      saveState: () => {}
    },
    buttons: [],
    notifyGameplayStart: () => {},
    returnTo2DSortie: () => {}
  };

  const gunship = new Gunship3DEngine(mockGame);
  console.log('✓ Gunship3DEngine instantiated successfully!');
  console.log(`✓ Terrain Heightmap Grid Size: ${gunship.heightmap.length}x${gunship.heightmap[0].length}`);
  console.log(`✓ Destructible Buildings Count: ${gunship.buildings.length}`);
  console.log(`✓ Initial Enemies Spawned: ${gunship.enemies.length}`);
  console.log(`✓ Friendly Allies Spawned: ${gunship.allies.length}`);

  console.log('\n=== TEST 2: 3D Orbital Projection Math ===');
  const origin3D = { x: 0, y: 0, z: 0 };
  const projOrigin = gunship.project(origin3D);
  console.log(`✓ Projected Origin (0,0,0) -> Screen (${projOrigin.x.toFixed(1)}, ${projOrigin.y.toFixed(1)}), Depth: ${projOrigin.depth.toFixed(1)}, Visible: ${projOrigin.visible}`);
  if (projOrigin.depth <= 0) throw new Error('Orbital camera depth projection failed!');

  console.log('\n=== TEST 3: Weapon Ballistics & Firing System ===');
  // 1. 40mm Bofors
  gunship.selectedWeapon = '40mm';
  gunship.crosshair.groundX = 20;
  gunship.crosshair.groundZ = -30;
  gunship.fireActiveWeapon();
  console.log(`✓ 40mm Fired! Active Projectiles: ${gunship.projectiles.length}`);

  // 2. 25mm Gatling
  gunship.selectedWeapon = '25mm';
  gunship.weapons['25mm'].cooldown = 0;
  gunship.fireActiveWeapon();
  console.log(`✓ 25mm Fired! Active Projectiles: ${gunship.projectiles.length}`);

  // 3. 105mm Howitzer
  gunship.selectedWeapon = '105mm';
  gunship.weapons['105mm'].cooldown = 0;
  gunship.fireActiveWeapon();
  console.log(`✓ 105mm Fired! Active Projectiles: ${gunship.projectiles.length}`);

  // 4. Parachute Mine
  gunship.selectedWeapon = 'mine';
  gunship.weapons['mine'].cooldown = 0;
  gunship.fireActiveWeapon();
  console.log(`✓ Parachute Mine Fired! Active Projectiles: ${gunship.projectiles.length}`);

  // 5. Countermeasure Flares
  gunship.deployFlares();
  console.log(`✓ Flares Deployed! Active Flares: ${gunship.flaresActive.length}`);

  console.log('\n=== TEST 4: Physics & Simulation Ticks (60 Frames) ===');
  for (let f = 0; f < 60; f++) {
    gunship.update();
  }
  console.log(`✓ 60 Frames simulated without errors. Orbit Angle: ${(gunship.orbitAngle * 180 / Math.PI).toFixed(1)}°`);

  console.log('\n=== TEST 5: Explosion, Terrain Deformation & Building Collapse ===');
  const factory = gunship.buildings.find(b => b.id === 'factory');
  console.log(`Factory initial HP: ${factory.hp}`);
  gunship.explodeAt(factory.x, 0, factory.z, 80, 2000, '105mm');
  if (factory.hp > 0) {
    gunship.explodeAt(factory.x, 0, factory.z, 80, 2000, '105mm');
  }
  console.log(`Factory HP after hits: ${factory.hp}, Rubble: ${factory.rubble}`);
  console.log(`Craters registered: ${gunship.craters.length}`);
  if (!factory.rubble) throw new Error('Factory collapse failed on heavy hit!');

  console.log('\n=== TEST 6: Water Simulation & Impact Geysers ===');
  gunship.explodeAt(150, 0, 150, 50, 200, '40mm'); // In water bounds
  console.log(`✓ Water explosion handled! Active particles: ${gunship.particles.length}`);

  console.log('\n=== TEST 7: Full 3D Frame Render Pass (Daylight & FLIR) ===');
  gunship.visionMode = 'DAYLIGHT';
  gunship.render();
  console.log('✓ Daylight Mode rendered successfully!');

  gunship.visionMode = 'FLIR_THERMAL';
  gunship.render();
  console.log('✓ FLIR Military Thermal Mode rendered successfully!');

  console.log('\n🎉 ALL 7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
