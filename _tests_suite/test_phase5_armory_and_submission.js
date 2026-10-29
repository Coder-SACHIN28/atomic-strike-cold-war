const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- STARTING PHASE 5: ARMORY POLISH, RENTAL TEST FLIGHT & SUBMISSION SUITE ---');

// 1. Prepare sandboxed browser environment
const domMock = {
  document: {
    getElementById: (id) => ({
      innerText: '',
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
        createLinearGradient: () => ({ addColorStop: () => {} })
      })
    }),
    addEventListener: () => {},
    fullscreenElement: null
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
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
    }
  },
  console: console,
  Math: Math,
  Date: Date,
  Image: class { constructor() { this.complete = true; } },
  performance: { now: () => Date.now() },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

const sandbox = vm.createContext(domMock);

function loadScript(filePath) {
  const fullPath = path.resolve('C:/REA/atomic-bomber', filePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInContext(code, sandbox);
}

loadScript('js/audio.js');
loadScript('js/input.js');
loadScript('js/terrain.js');
loadScript('js/weapons.js');
loadScript('js/armory.js');
loadScript('js/entities.js');
loadScript('js/hud.js');
loadScript('js/engine.js');
loadScript('js/main.js');

console.log('[PASS] All game engine modules parsed cleanly in sandbox.');

// 2. Test Armory Manager with 10 Aircraft
const mockGame = {
  renderer: { width: 1280, height: 720 },
  addFloatingText: () => {},
  setRadioMessage: () => {},
  requestRewardedAd: (rewardType, onGranted) => {
    onGranted();
  },
  entities: {
    player: {
      model: 'standard',
      alive: true
    },
    switchPlayerModel: function(model) {
      this.player.model = model;
    }
  }
};

const armory = new sandbox.window.ArmoryManager(mockGame);
const planes = armory.getPlaneList();
assert.strictEqual(planes.length, 10, 'Hangar should contain exactly 10 aircraft.');
console.log(`[PASS] Verified 10 combat aircraft in Armory.`);

// Verify each aircraft has upgrades, cost, stats, tag
planes.forEach(p => {
  assert.ok(p.id && p.name && p.cost >= 0 && p.spriteName && p.tag, `Plane ${p.id} missing properties`);
  const upgs = armory.getUpgradeItems(p.id);
  assert.strictEqual(upgs.length, 6, `Plane ${p.id} must have exactly 6 unique airframe upgrades`);
});
console.log('[PASS] Verified all 10 aircraft have 6 dedicated airframe upgrades (60 total upgrades).');

// 3. Test 1-Ad Instant Rental Sortie
armory.state.unlockedPlanes = ['standard'];
armory.state.selectedPlane = 'standard';
armory.trialPlane = null;
armory.state.credits = 10000;

console.log('Testing 1-Ad Instant Rental Sortie for AH-64 Apache...');
const rentalStatusBefore = armory.getRentalStatus('apache');
assert.strictEqual(rentalStatusBefore.isUnlocked, false);
assert.strictEqual(rentalStatusBefore.canRent, true);

let adRewardTriggered = false;
armory.watchRentalAd('apache', () => {
  adRewardTriggered = true;
});

assert.strictEqual(adRewardTriggered, true, 'Rewarded ad callback should have fired');
assert.strictEqual(armory.trialPlane, 'apache', 'Trial plane should be apache');
assert.strictEqual(armory.state.selectedPlane, 'apache', 'Selected plane should be apache');
assert.strictEqual(mockGame.entities.player.model, 'apache', 'In-game player model should have switched to apache');
console.log('[PASS] 1-Ad Instant Rental successfully equipped AH-64 Apache for test flight.');

// 4. Test Rental Expiration on Crash
console.log('Testing Trial Expiration on player crash...');
const expired = armory.expireTrialPlane();
assert.strictEqual(expired, 'apache', 'Expired plane should be apache');
assert.strictEqual(armory.trialPlane, null, 'Trial plane should be reset to null');
assert.strictEqual(armory.state.selectedPlane, 'standard', 'Selected plane should revert to unlocked aircraft');
console.log('[PASS] Rental plane expired cleanly back to standard airframe.');

// 5. Test Credit Test Sortie Permit
console.log('Testing Combat Credit Test Sortie Permit for RAH-66 Comanche...');
const initialCredits = armory.state.credits;
const comancheStatus = armory.getRentalStatus('comanche');
const expectedFee = comancheStatus.rentalFee;
assert.ok(expectedFee > 0, 'Rental fee should be greater than 0');

const rentSuccess = armory.rentPlaneWithCredits('comanche');
assert.strictEqual(rentSuccess, true, 'Credit rental should succeed');
assert.strictEqual(armory.state.credits, initialCredits - expectedFee, 'Credits should be deducted');
assert.strictEqual(armory.trialPlane, 'comanche', 'Trial plane should be comanche');
console.log(`[PASS] Credit test flight permit issued for -$${expectedFee} combat funds.`);
armory.expireTrialPlane();

// 6. Test HUD Aircraft & Weapon Indicators
const hudGame = {
  sprites: {},
  input: { touchButtons: [] },
  buttons: [],
  terrain: { getHeightAt: () => 500 },
  entities: { enemies: [], migs: [] },
  armory: armory
};
const hud = new sandbox.window.HUD(hudGame);

const mockCanvasCtx = {
  save: () => {},
  restore: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  fillText: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  drawImage: () => {}
};

// Test HUD rendering for each of the 10 models without throwing
planes.forEach(p => {
  const testPlayer = {
    model: p.id,
    hp: 100,
    maxHp: 100,
    score: 12500,
    credits: 3200,
    gau8Ammo: 150,
    rocketAmmo: 12,
    bombs: 8,
    clusterBombs: 3,
    nukeAmmo: 1,
    flares: 4,
    alive: true
  };
  assert.doesNotThrow(() => {
    hud.drawOrdnanceStatus(mockCanvasCtx, 1280, 720, testPlayer);
    hud.drawFlightInstruments(mockCanvasCtx, 1280, testPlayer);
  }, `HUD should render cleanly for aircraft ${p.id}`);
});
console.log('[PASS] HUD weapon indicators & flight gauges verified for all 10 combat aircraft.');

// 7. Test CrazyGames SDK Hooks
const game = new sandbox.window.AtomicBomberGame();
assert.strictEqual(typeof game.notifyGameplayStart, 'function');
assert.strictEqual(typeof game.notifyGameplayStop, 'function');
assert.strictEqual(typeof game.triggerHappyTime, 'function');
assert.strictEqual(typeof game.requestMidgameAd, 'function');
assert.strictEqual(typeof game.requestRewardedAd, 'function');

assert.doesNotThrow(() => {
  game.notifyGameplayStart();
  game.triggerHappyTime();
  game.notifyGameplayStop();
}, 'CrazyGames SDK wrappers should execute without error.');
console.log('[PASS] CrazyGames SDK v3 lifecycle wrappers verified.');

console.log('--- ALL PHASE 5 ARMORY & SUBMISSION CHECKS PASSED (100%)! ---');
