/**
 * Atomic Bomber - In-Game Currency Armory & Aircraft Hangar
 * Single-player in-game economy with Per-Plane Specialized Upgrade Trees,
 * 2-Ad Rental Trial & 24h Cooldown.
 *
 * Each aircraft (F-4 Phantom, A-10 Warthog, SU-25 Frogfoot, AH-1 Cobra)
 * possesses its own distinct upgrade matrix and combat doctrine.
 */

class ArmoryManager {
  constructor(game) {
    this.game = game;
    this.trialPlane = null; // Active rental plane for current sortie only (in-memory)
    this.inspectingPlane = 'standard'; // Currently viewed aircraft in Armory UI

    // Load persistent state from localStorage
    this.state = this.loadState();
    this.inspectingPlane = this.state.selectedPlane || 'standard';
  }

  loadState() {
    const defaultPlaneUpgrades = {
      standard: { f4_armor: 0, f4_speed: 0, f4_vulcan: 0, f4_cluster: 0, f4_bombs: 0, f4_chaff: 0 },
      a10: { a10_armor: 0, a10_gau8: 0, a10_rockets: 0, a10_bombBlast: 0, a10_nuke: 0, a10_flares: 0 },
      su25: { su25_armor: 0, su25_cannon: 0, su25_s8: 0, su25_fab: 0, su25_nuke: 0, su25_flares: 0 },
      cobra: { ah1_armor: 0, ah1_turret: 0, ah1_tow: 0, ah1_bombs: 0, ah1_stealth: 0, ah1_flares: 0 },
      f14: { f14_armor: 0, f14_afterburner: 0, f14_phoenix: 0, f14_vulcan: 0, f14_bombs: 0, f14_chaff: 0 },
      ac130: { ac130_armor: 0, ac130_howitzer: 0, ac130_bofors: 0, ac130_gatling: 0, ac130_nuke: 0, ac130_flares: 0 },
      apache: { apache_armor: 0, apache_m230: 0, apache_hydra: 0, apache_hellfire: 0, apache_nuke: 0, apache_flares: 0 },
      comanche: { comanche_stealth: 0, comanche_armor: 0, comanche_gatling: 0, comanche_hellfire: 0, comanche_bombs: 0, comanche_flares: 0 },
      chinook: { chinook_armor: 0, chinook_door_guns: 0, chinook_bombs: 0, chinook_cluster: 0, chinook_repair: 0, chinook_flares: 0 },
      harrier: { harrier_armor: 0, harrier_pegasus: 0, harrier_gau12: 0, harrier_maverick: 0, harrier_bombs: 0, harrier_chaff: 0 }
    };

    const defaults = {
      version: 4,
      credits: 500, // Starting combat fund bonus for pilot
      highScore: 0,
      selectedPlane: 'standard', // Free starter F-4 Phantom II
      unlockedPlanes: ['standard'], // Only F-4 is unlocked by default
      adRentalCooldowns: {}, // { [planeId]: timestamp }
      adRentalProgress: {}, // { [planeId]: count (0 or 1) }
      planeUpgrades: defaultPlaneUpgrades
    };

    try {
      let saved = null;
      // 1. Try CrazyGames SDK Data Module (cloud-synced account data)
      try {
        if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.data) {
          if (typeof window.CrazyGames.SDK.data.getItem === 'function') {
            saved = window.CrazyGames.SDK.data.getItem('atomic_bomber_save');
          }
        }
      } catch (err) {}

      // 2. Fallback to standard browser localStorage
      if (!saved) {
        saved = localStorage.getItem('atomic_bomber_save');
      }

      if (saved) {
        const parsed = JSON.parse(saved);

        let unlocked = ['standard'];
        if ((parsed.version >= 2) && Array.isArray(parsed.unlockedPlanes)) {
          unlocked = parsed.unlockedPlanes;
          if (!unlocked.includes('standard')) unlocked.unshift('standard');
        }

        // Migrate per-plane upgrades if upgrading from older save
        const mergedPlaneUpgrades = {
          standard: { ...defaultPlaneUpgrades.standard, ...((parsed.planeUpgrades && parsed.planeUpgrades.standard) || {}) },
          a10: { ...defaultPlaneUpgrades.a10, ...((parsed.planeUpgrades && parsed.planeUpgrades.a10) || {}) },
          su25: { ...defaultPlaneUpgrades.su25, ...((parsed.planeUpgrades && parsed.planeUpgrades.su25) || {}) },
          cobra: { ...defaultPlaneUpgrades.cobra, ...((parsed.planeUpgrades && parsed.planeUpgrades.cobra) || {}) },
          f14: { ...defaultPlaneUpgrades.f14, ...((parsed.planeUpgrades && parsed.planeUpgrades.f14) || {}) },
          ac130: { ...defaultPlaneUpgrades.ac130, ...((parsed.planeUpgrades && parsed.planeUpgrades.ac130) || {}) },
          apache: { ...defaultPlaneUpgrades.apache, ...((parsed.planeUpgrades && parsed.planeUpgrades.apache) || {}) },
          comanche: { ...defaultPlaneUpgrades.comanche, ...((parsed.planeUpgrades && parsed.planeUpgrades.comanche) || {}) },
          chinook: { ...defaultPlaneUpgrades.chinook, ...((parsed.planeUpgrades && parsed.planeUpgrades.chinook) || {}) },
          harrier: { ...defaultPlaneUpgrades.harrier, ...((parsed.planeUpgrades && parsed.planeUpgrades.harrier) || {}) }
        };

        return {
          ...defaults,
          ...parsed,
          version: 4,
          credits: Math.max(defaults.credits, Number(parsed.credits) || 0),
          unlockedPlanes: unlocked,
          selectedPlane: unlocked.includes(parsed.selectedPlane) ? parsed.selectedPlane : 'standard',
          adRentalCooldowns: parsed.adRentalCooldowns || {},
          adRentalProgress: parsed.adRentalProgress || {},
          planeUpgrades: mergedPlaneUpgrades
        };
      }
    } catch (e) {}

    return defaults;
  }

  saveState() {
    const json = JSON.stringify(this.state);
    try {
      localStorage.setItem('atomic_bomber_save', json);
    } catch (e) {}

    // Cloud-sync to CrazyGames user account via SDK Data Module
    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.data) {
        if (typeof window.CrazyGames.SDK.data.setItem === 'function') {
          window.CrazyGames.SDK.data.setItem('atomic_bomber_save', json);
        }
      }
    } catch (e) {}
  }

  isPlanePermanentlyUnlocked(id) {
    return id === 'standard' || this.state.unlockedPlanes.includes(id);
  }

  isPlaneUnlocked(id) {
    return this.isPlanePermanentlyUnlocked(id) || this.trialPlane === id;
  }

  isPlaneActive(id) {
    return (this.trialPlane === id) || (this.state.selectedPlane === id);
  }

  getPlaneList() {
    return [
      {
        id: 'standard',
        name: 'F-4 PHANTOM II',
        tag: 'NATO SUPERSONIC STRIKE JET',
        cost: 0,
        unlocked: true,
        isTrial: false,
        spriteName: 'plane.png',
        stats: { armor: 95, speed: 100, firepower: 80 },
        desc: 'Supersonic NATO interceptor. High airspeed, nimble turning, 20mm Vulcan & Rockeye cluster carpet munitions.'
      },
      {
        id: 'a10',
        name: 'A-10 WARTHOG',
        tag: 'TANK BUSTER SUPREME',
        cost: 1500,
        unlocked: this.isPlanePermanentlyUnlocked('a10') || this.trialPlane === 'a10',
        isTrial: this.trialPlane === 'a10',
        spriteName: 'warthog1.png',
        stats: { armor: 135, speed: 70, firepower: 98 },
        desc: 'Heavily armored CAS fighter. 30mm GAU-8 Avenger Gatling, Hydra 70 rockets & Mark 84 heavy crater bombs.'
      },
      {
        id: 'su25',
        name: 'SU-25 FROGFOOT',
        tag: 'SOVIET CAS TANK BUSTER',
        cost: 2800,
        unlocked: this.isPlanePermanentlyUnlocked('su25') || this.trialPlane === 'su25',
        isTrial: this.trialPlane === 'su25',
        spriteName: 'su25.png',
        stats: { armor: 155, speed: 75, firepower: 92 },
        desc: 'Heavy titanium armored twin-engine attack jet. Highest HP, Twin GSh-30-2 autocannons & heavy S-8 rockets.'
      },
      {
        id: 'cobra',
        name: 'AH-1 COBRA',
        tag: 'ATTACK HELICOPTER',
        cost: 4500,
        unlocked: this.isPlanePermanentlyUnlocked('cobra') || this.trialPlane === 'cobra',
        isTrial: this.trialPlane === 'cobra',
        spriteName: 'cobra.png',
        stats: { armor: 110, speed: 55, firepower: 85 },
        desc: 'Precision attack helicopter. Mid-air hover, slow-flight precision, M197 chin turret & heavy TOW anti-tank missiles.'
      },
      {
        id: 'f14',
        name: 'F-14 TOMCAT',
        tag: 'SUPERSONIC INTERCEPTOR',
        cost: 6200,
        unlocked: this.isPlanePermanentlyUnlocked('f14') || this.trialPlane === 'f14',
        isTrial: this.trialPlane === 'f14',
        spriteName: 'f14.png',
        stats: { armor: 120, speed: 110, firepower: 94 },
        desc: 'Twin-engine variable-sweep supersonic interceptor. Highest top speed, long-range AIM-54 Phoenix heavy missiles & M61A1 Vulcan.'
      },
      {
        id: 'ac130',
        name: 'AC-130 SPECTRE',
        tag: 'HEAVY FLYING GUNSHIP',
        cost: 8500,
        unlocked: this.isPlanePermanentlyUnlocked('ac130') || this.trialPlane === 'ac130',
        isTrial: this.trialPlane === 'ac130',
        spriteName: 'ac130.png',
        stats: { armor: 190, speed: 60, firepower: 100 },
        desc: 'Fortified CAS gunship fortress. Massive hull armor, 105mm M102 Howitzer crater shells, 40mm Bofors autocannon & 25mm Equalizer.'
      },
      {
        id: 'apache',
        name: 'AH-64 APACHE',
        tag: 'HEAVY TANK BUSTER GUNSHIP',
        cost: 7500,
        unlocked: this.isPlanePermanentlyUnlocked('apache') || this.trialPlane === 'apache',
        isTrial: this.trialPlane === 'apache',
        spriteName: 'apache.png',
        stats: { armor: 180, speed: 62, firepower: 96 },
        desc: 'All-weather heavy attack helicopter. Auto-tracking 30mm M230 chain gun, Hydra 70 rockets & laser-guided Hellfire missiles.'
      },
      {
        id: 'comanche',
        name: 'RAH-66 COMANCHE',
        tag: 'STEALTH RECON GUNSHIP',
        cost: 8000,
        unlocked: this.isPlanePermanentlyUnlocked('comanche') || this.trialPlane === 'comanche',
        isTrial: this.trialPlane === 'comanche',
        spriteName: 'comanche.png',
        stats: { armor: 130, speed: 75, firepower: 90 },
        desc: 'Advanced stealth scout gunship. Low-observable radar cloaking (immune to SAM locks at low alt), 20mm XM301 Gatling & internal Hellfire bay.'
      },
      {
        id: 'chinook',
        name: 'CH-47 CHINOOK',
        tag: 'TANDEM-ROTOR FORTRESS',
        cost: 9200,
        unlocked: this.isPlanePermanentlyUnlocked('chinook') || this.trialPlane === 'chinook',
        isTrial: this.trialPlane === 'chinook',
        spriteName: 'chinook.png',
        stats: { armor: 230, speed: 50, firepower: 95 },
        desc: 'Heavy tandem-rotor flying fortress. Highest helicopter armor, dual-side auto-firing minigun door gunners & airborne repair crate generator.'
      },
      {
        id: 'harrier',
        name: 'AV-8B HARRIER II',
        tag: 'VTOL JUMP JET',
        cost: 8800,
        unlocked: this.isPlanePermanentlyUnlocked('harrier') || this.trialPlane === 'harrier',
        isTrial: this.trialPlane === 'harrier',
        spriteName: 'harrier.png',
        stats: { armor: 115, speed: 95, firepower: 94 },
        desc: 'V/STOL vector-thrust strike fighter. Full mid-air stationary hover mode, supersonic dash, 25mm GAU-12 Equalizer & precision Maverick strikes.'
      }
    ];
  }

  getRentalStatus(id) {
    if (this.isPlanePermanentlyUnlocked(id)) {
      return { isUnlocked: true, canRent: false, onCooldown: false, minutesLeft: 0, progress: 0, rentalFee: 0 };
    }
    const pObj = this.getPlaneList().find(p => p.id === id);
    const rentalFee = Math.max(350, Math.round((pObj ? pObj.cost : 5000) * 0.08));
    const lastRental = this.state.adRentalCooldowns[id] || 0;
    const now = Date.now();
    const COOLDOWN_MS = 3 * 60 * 1000; // 3-minute fair web session cooldown
    if (now - lastRental < COOLDOWN_MS) {
      const minutesLeft = Math.ceil((COOLDOWN_MS - (now - lastRental)) / (1000 * 60));
      return { isUnlocked: false, canRent: false, onCooldown: true, minutesLeft, progress: 0, rentalFee };
    }
    const progress = this.state.adRentalProgress[id] || 0;
    return { isUnlocked: false, canRent: true, onCooldown: false, minutesLeft: 0, progress, rentalFee };
  }

  // 1-Ad Instant Rental Sortie (100% CrazyGames Submission Compliant)
  watchRentalAd(id, onSuccess) {
    const status = this.getRentalStatus(id);
    if (status.isUnlocked || status.onCooldown) return;

    this.game.requestRewardedAd(`plane_trial_${id}`, () => {
      this.state.adRentalProgress[id] = 0;
      this.state.adRentalCooldowns[id] = Date.now();
      this.trialPlane = id;
      this.state.selectedPlane = id;
      this.inspectingPlane = id;
      this.saveState();
      window.soundSystem.play('beep', { volume: 1.0 });
      if (typeof window.soundSystem.playCoinChime === 'function') {
        window.soundSystem.playCoinChime();
      }
      const pObj = this.getPlaneList().find(p => p.id === id);
      const name = pObj ? pObj.name : 'AIRCRAFT';
      this.game.addFloatingText(`★ ${name} RENTED FOR 1 SORTIE! ★`, this.game.renderer.width / 2, 85, '#00ff66');
      if (this.game.setRadioMessage) {
        this.game.setRadioMessage('COMMAND', `COMMAND: Tactical rental cleared! You are piloting the ${name} for this sortie!`, 260);
      }

      if (this.game.entities && this.game.entities.player && this.game.entities.player.alive) {
        this.game.entities.switchPlayerModel(id);
      }
      if (onSuccess) onSuccess();
    });
  }

  // Combat Credit Rental Option (Test Sortie Permit)
  rentPlaneWithCredits(id, onSuccess) {
    const status = this.getRentalStatus(id);
    if (status.isUnlocked) return false;
    const rentalFee = status.rentalFee || 500;
    if (this.state.credits < rentalFee) {
      this.game.addFloatingText(`NEED $${rentalFee} CREDITS FOR TEST SORTIE!`, this.game.renderer.width / 2, 85, '#ff4444');
      window.soundSystem.play('beep', { volume: 0.5 });
      return false;
    }

    this.state.credits -= rentalFee;
    this.trialPlane = id;
    this.state.selectedPlane = id;
    this.inspectingPlane = id;
    this.state.adRentalCooldowns[id] = Date.now();
    this.saveState();
    window.soundSystem.play('beep', { volume: 1.0 });
    if (typeof window.soundSystem.playCoinChime === 'function') {
      window.soundSystem.playCoinChime();
    }
    const pObj = this.getPlaneList().find(p => p.id === id);
    const name = pObj ? pObj.name : 'AIRCRAFT';
    this.game.addFloatingText(`★ ${name} TEST SORTIE PERMIT PURCHASED (-$${rentalFee})! ★`, this.game.renderer.width / 2, 85, '#00e5ff');
    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('COMMAND', `COMMAND: Test flight permit authorized for ${name}! Take her into combat!`, 260);
    }

    if (this.game.entities && this.game.entities.player && this.game.entities.player.alive) {
      this.game.entities.switchPlayerModel(id);
    }
    if (onSuccess) onSuccess();
    return true;
  }

  expireTrialPlane() {
    if (this.trialPlane) {
      const expiredId = this.trialPlane;
      this.trialPlane = null;
      if (!this.state.unlockedPlanes.includes(this.state.selectedPlane)) {
        this.state.selectedPlane = 'standard';
      }
      this.inspectingPlane = this.state.selectedPlane;
      this.saveState();
      return expiredId;
    }
    return null;
  }

  getPlaneUpgrades(planeId) {
    const pId = planeId || this.trialPlane || this.state.selectedPlane || 'standard';
    return (this.state.planeUpgrades && this.state.planeUpgrades[pId]) || {};
  }

  getUpgradeItems(planeId = null) {
    const pId = planeId || this.inspectingPlane || this.trialPlane || this.state.selectedPlane || 'standard';
    const u = this.getPlaneUpgrades(pId);

    if (pId === 'standard') {
      const costs1 = [500, 1000, 1800, 2800];
      const costs2 = [600, 1400, 2500];
      const costs3 = [500, 1100, 2000, 3200];
      const costs4 = [750, 1600, 3000];
      const costs5 = [600, 1300, 2400];
      const costs6 = [400, 900, 1700];
      return [
        { id: 'f4_armor', name: 'TITANIUM WING SPARS', level: u.f4_armor || 0, maxLevel: 4, costs: costs1, cost: costs1[u.f4_armor || 0] || 2800, desc: '+25 HP per tier & SAM shrapnel resistance.' },
        { id: 'f4_speed', name: 'AFTERBURNER THRUST INJECTORS', level: u.f4_speed || 0, maxLevel: 3, costs: costs2, cost: costs2[u.f4_speed || 0] || 2500, desc: '+12% Max Airspeed & faster climb acceleration.' },
        { id: 'f4_vulcan', name: 'M61 VULCAN 20mm ROTARY CANNON', level: u.f4_vulcan || 0, maxLevel: 4, costs: costs3, cost: costs3[u.f4_vulcan || 0] || 3200, desc: '+50 Vulcan rounds & +20% muzzle velocity.' },
        { id: 'f4_cluster', name: 'CBU-24 ROCKEYE CLUSTERS', level: u.f4_cluster || 0, maxLevel: 3, costs: costs4, cost: costs4[u.f4_cluster || 0] || 3000, desc: '+2 Cluster canisters & +2 submunitions per canister.' },
        { id: 'f4_bombs', name: 'EXTENDED ORDNANCE PYLONS', level: u.f4_bombs || 0, maxLevel: 3, costs: costs5, cost: costs5[u.f4_bombs || 0] || 2400, desc: '+4 Iron bombs capacity & +15% explosion blast radius.' },
        { id: 'f4_chaff', name: 'AN/ALE-40 FLARE & CHAFF DISPENSER', level: u.f4_chaff || 0, maxLevel: 3, costs: costs6, cost: costs6[u.f4_chaff || 0] || 1700, desc: '+2 Decoy flares with extended burn duration.' }
      ];
    } else if (pId === 'a10') {
      const costs1 = [800, 1600, 2600, 3800, 5500];
      const costs2 = [900, 1800, 3000, 4500];
      const costs3 = [750, 1500, 2600, 4000];
      const costs4 = [800, 1600, 2800, 4200];
      const costs5 = [3000, 6000];
      const costs6 = [500, 1200, 2200];
      return [
        { id: 'a10_armor', name: 'TITANIUM COCKPIT BATHTUB', level: u.a10_armor || 0, maxLevel: 5, costs: costs1, cost: costs1[u.a10_armor || 0] || 5500, desc: '+35 HP per tier & 25% flak resistance.' },
        { id: 'a10_gau8', name: '30mm GAU-8 DEPLETED URANIUM', level: u.a10_gau8 || 0, maxLevel: 4, costs: costs2, cost: costs2[u.a10_gau8 || 0] || 4500, desc: 'Equips AP depleted uranium & +60 GAU-8 ammo.' },
        { id: 'a10_rockets', name: 'LAU-68 HYDRA 70 ROCKET PODS', level: u.a10_rockets || 0, maxLevel: 4, costs: costs3, cost: costs3[u.a10_rockets || 0] || 4000, desc: '+4 Hydra rockets capacity & increased rocket speed.' },
        { id: 'a10_bombBlast', name: 'MARK 84 2,000lb HEAVY BOMBS', level: u.a10_bombBlast || 0, maxLevel: 4, costs: costs4, cost: costs4[u.a10_bombBlast || 0] || 4200, desc: '+30% Crater destruction & kinetic shockwave.' },
        { id: 'a10_nuke', name: 'TACTICAL ATOMIC BOMB HARDPOINT', level: u.a10_nuke || 0, maxLevel: 2, costs: costs5, cost: costs5[u.a10_nuke || 0] || 6000, desc: 'Stores additional tactical nuclear warheads.' },
        { id: 'a10_flares', name: 'HIGH-INTENSITY MAGNESIUM FLARES', level: u.a10_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.a10_flares || 0] || 2200, desc: '+2 Decoy flares with wider heat signature.' }
      ];
    } else if (pId === 'su25') {
      const costs1 = [900, 1800, 2900, 4200, 5800];
      const costs2 = [850, 1700, 2800, 4200];
      const costs3 = [800, 1600, 2700, 4100];
      const costs4 = [850, 1700, 2900, 4400];
      const costs5 = [3200, 6500];
      const costs6 = [550, 1300, 2400];
      return [
        { id: 'su25_armor', name: 'ALLOY TITANIUM HULL PLATING', level: u.su25_armor || 0, maxLevel: 5, costs: costs1, cost: costs1[u.su25_armor || 0] || 5800, desc: '+40 HP per tier (Highest airframe armor in game).' },
        { id: 'su25_cannon', name: 'TWIN GSh-30-2 30mm HIGH EXPLOSIVE', level: u.su25_cannon || 0, maxLevel: 4, costs: costs2, cost: costs2[u.su25_cannon || 0] || 4200, desc: 'Twin autocannon explosive blast & +50 ammo.' },
        { id: 'su25_s8', name: 'B-8M1 HEAVY S-8 ROCKET PODS', level: u.su25_s8 || 0, maxLevel: 4, costs: costs3, cost: costs3[u.su25_s8 || 0] || 4100, desc: '+4 S-8 Heavy rockets with expanded blast radius.' },
        { id: 'su25_fab', name: 'FAB-500 SOVIET HEAVY BOMBS', level: u.su25_fab || 0, maxLevel: 4, costs: costs4, cost: costs4[u.su25_fab || 0] || 4400, desc: '+4 Bombs & deep ground crater penetration.' },
        { id: 'su25_nuke', name: 'RN-28 TACTICAL NUCLEAR MUNITION', level: u.su25_nuke || 0, maxLevel: 2, costs: costs5, cost: costs5[u.su25_nuke || 0] || 6500, desc: 'Equips Soviet tactical atomic bomb hardpoint.' },
        { id: 'su25_flares', name: 'ASO-2V TRIPLE FLARE PACK', level: u.su25_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.su25_flares || 0] || 2400, desc: '+3 Decoy flares against radar SAM batteries.' }
      ];
    } else if (pId === 'cobra') {
      const costs1 = [700, 1500, 2500, 3800];
      const costs2 = [800, 1600, 2700, 4000];
      const costs3 = [850, 1700, 2900, 4300];
      const costs4 = [700, 1500, 2600];
      const costs5 = [900, 1900, 3400];
      const costs6 = [600, 1400, 2500];
      return [
        { id: 'ah1_armor', name: 'KEVLAR ROTOR & ENGINE PLATING', level: u.ah1_armor || 0, maxLevel: 4, costs: costs1, cost: costs1[u.ah1_armor || 0] || 3800, desc: '+25 HP per tier & rotor flak resistance.' },
        { id: 'ah1_turret', name: 'M197 20mm 3-BARREL CHIN TURRET', level: u.ah1_turret || 0, maxLevel: 4, costs: costs2, cost: costs2[u.ah1_turret || 0] || 4000, desc: '+50 Ammo & auto-aim ground cone in hover.' },
        { id: 'ah1_tow', name: 'BGM-71 TOW HEAVY MISSILES', level: u.ah1_tow || 0, maxLevel: 4, costs: costs3, cost: costs3[u.ah1_tow || 0] || 4300, desc: '+4 Anti-tank missiles with heavy armor punch.' },
        { id: 'ah1_bombs', name: 'LIGHTNING TACTICAL BOMB RACKS', level: u.ah1_bombs || 0, maxLevel: 3, costs: costs4, cost: costs4[u.ah1_bombs || 0] || 2600, desc: '+4 Bombs with quick release in hover.' },
        { id: 'ah1_stealth', name: 'NOE (NAP-OF-EARTH) RADAR MASK', level: u.ah1_stealth || 0, maxLevel: 3, costs: costs5, cost: costs5[u.ah1_stealth || 0] || 3400, desc: 'Flying low (< 220 alt) cuts SAM lock range by 40%.' },
        { id: 'ah1_flares', name: 'OMNI-DIRECTIONAL FLARE PACK', level: u.ah1_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.ah1_flares || 0] || 2500, desc: '+3 Decoy flares in dual-angle dispersal.' }
      ];
    } else if (pId === 'f14') {
      const costs1 = [1000, 2000, 3200, 4800];
      const costs2 = [1100, 2200, 3600, 5200];
      const costs3 = [1200, 2400, 3800, 5500];
      const costs4 = [900, 1800, 3000, 4500];
      const costs5 = [1000, 2100, 3500];
      const costs6 = [700, 1500, 2600];
      return [
        { id: 'f14_armor', name: 'TITANIUM SWING-WING BOX', level: u.f14_armor || 0, maxLevel: 4, costs: costs1, cost: costs1[u.f14_armor || 0] || 4800, desc: '+25 HP per tier & supersonic wing integrity.' },
        { id: 'f14_afterburner', name: 'GE F110 TWIN AFTERBURNERS', level: u.f14_afterburner || 0, maxLevel: 4, costs: costs2, cost: costs2[u.f14_afterburner || 0] || 5200, desc: '+15% Top Airspeed & Mach 2.3 burst climb.' },
        { id: 'f14_phoenix', name: 'AIM-54 PHOENIX LONG-RANGE MISSILES', level: u.f14_phoenix || 0, maxLevel: 4, costs: costs3, cost: costs3[u.f14_phoenix || 0] || 5500, desc: '+4 Long-range supersonic heavy missiles.' },
        { id: 'f14_vulcan', name: 'M61A1 VULCAN 20mm ROTARY CANNON', level: u.f14_vulcan || 0, maxLevel: 4, costs: costs4, cost: costs4[u.f14_vulcan || 0] || 4500, desc: '+60 Vulcan rounds & high muzzle velocity.' },
        { id: 'f14_bombs', name: 'GBU-16 PAVEWAY STRIKE PYLONS', level: u.f14_bombs || 0, maxLevel: 3, costs: costs5, cost: costs5[u.f14_bombs || 0] || 3500, desc: '+4 Heavy strike bombs & shockwave blast.' },
        { id: 'f14_chaff', name: 'AN/ALE-39 DUAL FLARE DISPENSER', level: u.f14_chaff || 0, maxLevel: 3, costs: costs6, cost: costs6[u.f14_chaff || 0] || 2600, desc: '+3 Decoy flares against SAM radar tracking.' }
      ];
    } else if (pId === 'ac130') {
      const costs1 = [1200, 2400, 3800, 5600, 7500];
      const costs2 = [1400, 2800, 4400, 6200];
      const costs3 = [1100, 2200, 3600, 5200];
      const costs4 = [1000, 2000, 3200, 4800];
      const costs5 = [3500, 7000];
      const costs6 = [800, 1800, 3000];
      return [
        { id: 'ac130_armor', name: 'CERAMIC AIRFRAME BULKHEADS', level: u.ac130_armor || 0, maxLevel: 5, costs: costs1, cost: costs1[u.ac130_armor || 0] || 7500, desc: '+40 HP per tier & 30% heavy flak resistance.' },
        { id: 'ac130_howitzer', name: '105mm M102 AIRBORNE HOWITZER', level: u.ac130_howitzer || 0, maxLevel: 4, costs: costs2, cost: costs2[u.ac130_howitzer || 0] || 6200, desc: 'Heavy howitzer shells with massive ground craters.' },
        { id: 'ac130_bofors', name: '40mm L/60 BOFORS AUTOCANNON', level: u.ac130_bofors || 0, maxLevel: 4, costs: costs3, cost: costs3[u.ac130_bofors || 0] || 5200, desc: '+80 High-explosive 40mm autocannon rounds.' },
        { id: 'ac130_gatling', name: '25mm GAU-12 EQUALIZER GATLING', level: u.ac130_gatling || 0, maxLevel: 4, costs: costs4, cost: costs4[u.ac130_gatling || 0] || 4800, desc: '+120 Rotary Gatling rounds with shredder tracers.' },
        { id: 'ac130_nuke', name: 'TWIN TACTICAL ATOMIC BOMB BAY', level: u.ac130_nuke || 0, maxLevel: 2, costs: costs5, cost: costs5[u.ac130_nuke || 0] || 7000, desc: 'Holds 2 deployable tactical nuclear warheads.' },
        { id: 'ac130_flares', name: 'ANGEL-WING FLARE MATRIX', level: u.ac130_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.ac130_flares || 0] || 3000, desc: '+4 Decoy flares with massive angel-wing spread.' }
      ];
    } else if (pId === 'apache') {
      const costs1 = [1100, 2200, 3600, 5400, 7200];
      const costs2 = [1200, 2400, 3800, 5600];
      const costs3 = [1000, 2000, 3300, 4800];
      const costs4 = [1200, 2500, 4000, 5800];
      const costs5 = [3400, 6800];
      const costs6 = [750, 1600, 2800];
      return [
        { id: 'apache_armor', name: 'TITANIUM ROTOR & COCKPIT TUB', level: u.apache_armor || 0, maxLevel: 5, costs: costs1, cost: costs1[u.apache_armor || 0] || 7200, desc: '+35 HP per tier & heavy armor-piercing flak shielding.' },
        { id: 'apache_m230', name: 'M230 30mm CHAIN GUN BURST', level: u.apache_m230 || 0, maxLevel: 4, costs: costs2, cost: costs2[u.apache_m230 || 0] || 5600, desc: '30mm explosive bursts with auto-swivel ground lock & +60 ammo.' },
        { id: 'apache_hydra', name: 'HYDRA 70 ROCKET POD MATRIX', level: u.apache_hydra || 0, maxLevel: 4, costs: costs3, cost: costs3[u.apache_hydra || 0] || 4800, desc: '+4 Hydra rockets per tier & widened kinetic saturation.' },
        { id: 'apache_hellfire', name: 'AGM-114 HELLFIRE ANTI-ARMOR MISSILES', level: u.apache_hellfire || 0, maxLevel: 4, costs: costs4, cost: costs4[u.apache_hellfire || 0] || 5800, desc: '+4 Laser-guided supersonic anti-tank heavy missiles.' },
        { id: 'apache_nuke', name: 'TACTICAL ATOMIC BOMB PYLON', level: u.apache_nuke || 0, maxLevel: 2, costs: costs5, cost: costs5[u.apache_nuke || 0] || 6800, desc: 'Carries tactical atomic warhead for surgical bunker annihilation.' },
        { id: 'apache_flares', name: 'OMNI-DIRECTIONAL MAGNESIUM FLARES', level: u.apache_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.apache_flares || 0] || 2800, desc: '+3 High-temperature flares deployed in 360-degree dispersal.' }
      ];
    } else if (pId === 'comanche') {
      const costs1 = [1200, 2400, 3900, 5600];
      const costs2 = [1000, 2000, 3400, 5000];
      const costs3 = [1100, 2200, 3600, 5200];
      const costs4 = [1300, 2600, 4200, 6000];
      const costs5 = [1000, 2100, 3500];
      const costs6 = [700, 1500, 2700];
      return [
        { id: 'comanche_stealth', name: 'RAM (RADAR ABSORBENT MATERIAL) COATING', level: u.comanche_stealth || 0, maxLevel: 4, costs: costs1, cost: costs1[u.comanche_stealth || 0] || 5600, desc: 'Nap-of-the-Earth stealth cloaking: cuts SAM lock range by 60%.' },
        { id: 'comanche_armor', name: 'KEVLAR-GRAPHITE COMPOSITE HULL', level: u.comanche_armor || 0, maxLevel: 4, costs: costs2, cost: costs2[u.comanche_armor || 0] || 5000, desc: '+30 HP per tier & low-acoustic rotor blade tips.' },
        { id: 'comanche_gatling', name: 'XM301 20mm STEALTH GATLING', level: u.comanche_gatling || 0, maxLevel: 4, costs: costs3, cost: costs3[u.comanche_gatling || 0] || 5200, desc: '+60 High-velocity 20mm rounds with low tracer signature.' },
        { id: 'comanche_hellfire', name: 'INTERNAL BAY HELLFIRE MISSILES', level: u.comanche_hellfire || 0, maxLevel: 4, costs: costs4, cost: costs4[u.comanche_hellfire || 0] || 6000, desc: '+4 Internal bay guided missiles that launch from stealth.' },
        { id: 'comanche_bombs', name: 'INTERNAL TACTICAL BOMB RACKS', level: u.comanche_bombs || 0, maxLevel: 3, costs: costs5, cost: costs5[u.comanche_bombs || 0] || 3500, desc: '+3 High-explosive bombs with streamlined bay drop.' },
        { id: 'comanche_flares', name: 'CHAMELEON DECOY FLARE MATRIX', level: u.comanche_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.comanche_flares || 0] || 2700, desc: '+3 Advanced multi-spectral decoys that confuse radar & IR missiles.' }
      ];
    } else if (pId === 'chinook') {
      const costs1 = [1300, 2600, 4200, 6000, 8000];
      const costs2 = [1400, 2800, 4500, 6400];
      const costs3 = [1100, 2300, 3800, 5400];
      const costs4 = [1200, 2500, 4000];
      const costs5 = [1500, 3000, 5000];
      const costs6 = [850, 1900, 3200];
      return [
        { id: 'chinook_armor', name: 'HEAVY REINFORCED HULL PLATING', level: u.chinook_armor || 0, maxLevel: 5, costs: costs1, cost: costs1[u.chinook_armor || 0] || 8000, desc: '+45 HP per tier (Highest health in rotary fleet) & 25% flak armor.' },
        { id: 'chinook_door_guns', name: 'TWIN M134 MINIGUN DOOR GUNNERS', level: u.chinook_door_guns || 0, maxLevel: 4, costs: costs2, cost: costs2[u.chinook_door_guns || 0] || 6400, desc: 'Dual-side gunners auto-track ground infantry, tanks & low MiGs.' },
        { id: 'chinook_bombs', name: 'HIGH-CAPACITY CARGO BOMB BAY', level: u.chinook_bombs || 0, maxLevel: 4, costs: costs3, cost: costs3[u.chinook_bombs || 0] || 5400, desc: '+6 Heavy iron bombs per tier dropped in rapid sequence.' },
        { id: 'chinook_cluster', name: 'CBU-87 COMBINED EFFECTS CLUSTERS', level: u.chinook_cluster || 0, maxLevel: 3, costs: costs4, cost: costs4[u.chinook_cluster || 0] || 4000, desc: '+3 Heavy cluster munition canisters with widespread carpet blast.' },
        { id: 'chinook_repair', name: 'AIRBORNE FIELD REPAIR GENERATOR', level: u.chinook_repair || 0, maxLevel: 3, costs: costs5, cost: costs5[u.chinook_repair || 0] || 5000, desc: 'Generates emergency medical & mechanical repair crates during flight.' },
        { id: 'chinook_flares', name: 'HEAVY INDUSTRIAL FLARE MATRIX', level: u.chinook_flares || 0, maxLevel: 3, costs: costs6, cost: costs6[u.chinook_flares || 0] || 3200, desc: '+4 Industrial-yield decoy flares with massive thermal bloom.' }
      ];
    } else if (pId === 'harrier') {
      const costs1 = [1100, 2200, 3600, 5200];
      const costs2 = [1300, 2600, 4200, 6000];
      const costs3 = [1200, 2400, 3800, 5500];
      const costs4 = [1300, 2700, 4400, 6200];
      const costs5 = [1000, 2100, 3500];
      const costs6 = [750, 1600, 2800];
      return [
        { id: 'harrier_armor', name: 'LIGHTWEIGHT TITANIUM AIRFRAME', level: u.harrier_armor || 0, maxLevel: 4, costs: costs1, cost: costs1[u.harrier_armor || 0] || 5200, desc: '+25 HP per tier & high-g aerodynamic load tolerance.' },
        { id: 'harrier_pegasus', name: 'ROLLS-ROYCE PEGASUS VECTOR NOZZLES', level: u.harrier_pegasus || 0, maxLevel: 4, costs: costs2, cost: costs2[u.harrier_pegasus || 0] || 6000, desc: 'Instant 0-airspeed hover lock, 360-degree rotation & +15% boost speed.' },
        { id: 'harrier_gau12', name: '25mm GAU-12 EQUALIZER CANNON', level: u.harrier_gau12 || 0, maxLevel: 4, costs: costs3, cost: costs3[u.harrier_gau12 || 0] || 5500, desc: '+60 25mm depleted uranium rounds & extreme muzzle velocity.' },
        { id: 'harrier_maverick', name: 'AGM-65 MAVERICK GUIDED MISSILES', level: u.harrier_maverick || 0, maxLevel: 4, costs: costs4, cost: costs4[u.harrier_maverick || 0] || 6200, desc: '+4 Supersonic electro-optical precision strike missiles.' },
        { id: 'harrier_bombs', name: 'EXTENDED WING PYLONS', level: u.harrier_bombs || 0, maxLevel: 3, costs: costs5, cost: costs5[u.harrier_bombs || 0] || 3500, desc: '+4 Laser-guided bombs with zero-drift accuracy in hover.' },
        { id: 'harrier_chaff', name: 'AN/ALE-39 COUNTERMEASURE PACK', level: u.harrier_chaff || 0, maxLevel: 3, costs: costs6, cost: costs6[u.harrier_chaff || 0] || 2800, desc: '+3 High-temperature decoy flares against naval & land SAMs.' }
      ];
    } else {
      // Fallback standard F-4 Phantom
      const costs1 = [500, 1000, 1800, 2800];
      const costs2 = [600, 1200, 2000];
      const costs3 = [700, 1400, 2200, 3200];
      const costs4 = [600, 1200, 2000];
      const costs5 = [500, 1000, 1600];
      const costs6 = [400, 900, 1700];
      return [
        { id: 'f4_armor', name: 'TITANIUM WING SPARS', level: u.f4_armor || 0, maxLevel: 4, costs: costs1, cost: costs1[u.f4_armor || 0] || 2800, desc: '+25 HP per tier & SAM shrapnel resistance.' },
        { id: 'f4_speed', name: 'AFTERBURNER THRUST INJECTORS', level: u.f4_speed || 0, maxLevel: 3, costs: costs2, cost: costs2[u.f4_speed || 0] || 2500, desc: '+12% Max Airspeed & faster climb acceleration.' },
        { id: 'f4_vulcan', name: 'M61 VULCAN 20mm ROTARY CANNON', level: u.f4_vulcan || 0, maxLevel: 4, costs: costs3, cost: costs3[u.f4_vulcan || 0] || 3200, desc: '+50 Vulcan rounds & +20% muzzle velocity.' },
        { id: 'f4_cluster', name: 'CBU-24 ROCKEYE CLUSTERS', level: u.f4_cluster || 0, maxLevel: 3, costs: costs4, cost: costs4[u.f4_cluster || 0] || 3000, desc: '+2 Cluster canisters & +2 submunitions per canister.' },
        { id: 'f4_bombs', name: 'EXTENDED ORDNANCE PYLONS', level: u.f4_bombs || 0, maxLevel: 3, costs: costs5, cost: costs5[u.f4_bombs || 0] || 2400, desc: '+4 Iron bombs capacity & +15% explosion blast radius.' },
        { id: 'f4_chaff', name: 'AN/ALE-40 FLARE & CHAFF DISPENSER', level: u.f4_chaff || 0, maxLevel: 3, costs: costs6, cost: costs6[u.f4_chaff || 0] || 1700, desc: '+2 Decoy flares with extended burn duration.' }
      ];
    }
  }

  buyUpgrade(id, planeId = null) {
    const pId = planeId || this.inspectingPlane || this.trialPlane || this.state.selectedPlane || 'standard';
    const items = this.getUpgradeItems(pId);
    const item = items.find((x) => x.id === id);
    if (!item) return false;

    if (item.level >= item.maxLevel) return false;
    const cost = item.cost;
    if (this.state.credits < cost) return false;

    this.state.credits -= cost;
    if (!this.state.planeUpgrades[pId]) {
      this.state.planeUpgrades[pId] = {};
    }
    this.state.planeUpgrades[pId][id] = (this.state.planeUpgrades[pId][id] || 0) + 1;

    this.saveState();
    if (typeof window.soundSystem.playUpgradeMount === 'function') {
      window.soundSystem.playUpgradeMount();
    } else {
      window.soundSystem.play('button', { volume: 0.8 });
    }
    return true;
  }

  unlockPlane(id) {
    const plane = this.getPlaneList().find((p) => p.id === id);
    if (!plane) return false;
    if (this.state.unlockedPlanes.includes(id)) {
      return this.selectPlane(id);
    }
    if (this.state.credits < plane.cost) return false;

    this.state.credits -= plane.cost;
    if (!this.state.unlockedPlanes.includes(id)) {
      this.state.unlockedPlanes.push(id);
    }
    if (this.trialPlane === id) {
      this.trialPlane = null; // Promoted from trial to permanent!
    }
    this.state.selectedPlane = id;
    this.inspectingPlane = id;
    this.saveState();
    if (typeof window.soundSystem.playUpgradeMount === 'function') {
      window.soundSystem.playUpgradeMount();
    } else {
      window.soundSystem.play('button', { volume: 0.9 });
    }

    if (this.game && this.game.entities && this.game.entities.player && this.game.entities.player.alive) {
      this.game.entities.switchPlayerModel(id);
    }
    return true;
  }

  selectPlane(id) {
    if (!this.state.unlockedPlanes.includes(id) && this.trialPlane !== id) {
      if (id === 'standard') {
        if (!this.state.unlockedPlanes.includes('standard')) this.state.unlockedPlanes.push('standard');
      } else {
        return false;
      }
    }
    this.state.selectedPlane = id;
    this.inspectingPlane = id;
    this.saveState();
    window.soundSystem.play('button', { volume: 0.8 });

    if (this.game && this.game.entities && this.game.entities.player && this.game.entities.player.alive) {
      this.game.entities.switchPlayerModel(id);
    }
    return true;
  }
}

window.ArmoryManager = ArmoryManager;
