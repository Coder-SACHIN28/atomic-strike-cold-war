/**
 * Atomic Bomber - Entities Subsystem
 * Complete implementation of Player Planes, Limited Ammo & Reload System,
 * Sky Parachute Airdrops, MiGs, SAM Batteries & Guided Missiles, Tanks, ZSU-57, Trucks, Jeeps, Bunkers, Trees.
 */

class EntityManager {
  constructor(game) {
    this.game = game;
    this.player = null;
    this.enemies = [];
    this.migs = [];
    this.samMissiles = [];
    this.enemyBullets = [];
    this.bonusCrates = [];
    this.deadWrecks = [];
    this.wingmen = []; // Allied AI Wingmen Air Support
    this.drones = []; // Autonomous FPV Kamikaze Combat Drones
    this.hinds = []; // Mil Mi-24 Hind Heavy Attack Gunships (Airborne Bosses)
    this.bombers = []; // Tu-22M3 Backfire Supersonic Strategic Bombers (Airborne Bosses)
    this.zeppelins = []; // Kirov-class Armored War Zeppelin Dreadnoughts (Giant Airborne Bosses from Aircraft Evolution REA)
    this.damageParticles = []; // Trailing smoke & fire damage particles
    this.smokeScreens = []; // Aerosol smoke screen canisters deployed by modern MBTs

    this.skyDropTimer = 350; // Timer for periodic high-altitude parachute drops
    this.healthDropCooldown = 0; // Strict timer between rare health crates
    this.nukeDropCooldown = 0; // Strict timer between ultra-rare tactical nuke crates
    this.theaterStates = {}; // Per-theater state cache preserving wave progress across maps
    this.chainExplosionQueue = []; // Staggered secondary fuel/ammo chain explosions
  }

  // Objective Target Identifier (Destruction required to clear sector wave)
  isObjectiveTarget(e) {
    if (!e || !e.alive) return false;
    return e.type === 'tank' || e.type === 'zsu57' || e.type === 'sam_site' || e.type === 's400' || e.type === 'akash' || e.type === 'tunguska' || e.type === 'truck' || e.type === 'desert_technical' || e.type === 'mlrs_truck' || e.type === 'shilka' || e.type === 'phalanx_ciws' || e.type === 'pantsir';
  }

  // Seamless Theater Switch preserving Wave Progress, Hostile Count & Dead Wrecks
  switchTheater(fromTheater, toTheater, wave) {
    if (!this.theaterStates) this.theaterStates = {};

    // 1. Save state of previous theater
    this.theaterStates[fromTheater] = {
      enemies: this.enemies,
      deadWrecks: this.deadWrecks,
      bonusCrates: this.bonusCrates,
      craters: [...this.game.terrain.craters]
    };
    this.drones = [];

    // Calculate how many objective targets remain alive right now
    const livingTargets = this.enemies.filter(e => this.isObjectiveTarget(e)).length;

    // 2. Target theater already visited in this wave -> restore and sync
    if (this.theaterStates[toTheater]) {
      const saved = this.theaterStates[toTheater];
      this.enemies = saved.enemies;
      this.deadWrecks = saved.deadWrecks;
      this.bonusCrates = saved.bonusCrates;
      this.game.terrain.craters = saved.craters;

      // Sync living target count so kills in previous theater are strictly preserved
      const currentLiving = this.enemies.filter(e => this.isObjectiveTarget(e));
      if (currentLiving.length > livingTargets) {
        const excess = currentLiving.length - livingTargets;
        for (let i = 0; i < excess; i++) {
          const victim = currentLiving[i];
          victim.alive = false;
          if (victim.type === 'tank') {
            this.deadWrecks.push({ x: victim.x, y: victim.y, sprite: this.game.sprites['deadtank1.png'] });
          }
        }
      }
    } else {
      // 3. First time entering toTheater during this wave:
      // Spawn only the remaining livingTargets count!
      this.enemies = [];
      this.deadWrecks = [];
      this.bonusCrates = [];
      this.game.terrain.craters = [];
      this.spawnWave(wave, toTheater, livingTargets);
      this.theaterStates[toTheater] = {
        enemies: this.enemies,
        deadWrecks: this.deadWrecks,
        bonusCrates: this.bonusCrates,
        craters: [...this.game.terrain.craters]
      };
    }
  }

  reset() {
    this.enemies = [];
    this.migs = [];
    this.samMissiles = [];
    this.enemyBullets = [];
    this.bonusCrates = [];
    this.deadWrecks = [];
    this.wingmen = [];
    this.drones = [];
    this.bombers = [];
    this.zeppelins = [];
    this.damageParticles = [];
    this.smokeScreens = [];
    this.skyDropTimer = 350;
    this.healthDropCooldown = 0;
    this.nukeDropCooldown = 0;
    this.chainExplosionQueue = [];
  }

  initPlayer(model = 'standard', planeUpg = {}, isNextWave = false) {
    const prevScore = (this.player && isNextWave) ? this.player.score : 0;
    const prevCredits = (this.player && isNextWave) ? this.player.credits : 0;

    const startX = 300;
    const startY = 220;

    let baseSpd = 4.2;
    let minSpd = 2.6;
    let maxSpd = 6.5;
    let turn = 0.042;
    let baseHp = 135;
    let bombsCount = 10;
    let bombsMax = 24;
    let clusterCount = 4;
    let clusterMax = 8;
    let nukeCount = 1;
    let nukeMax = 2;
    let gau8Rounds = 300;
    let gau8Max = 500;
    let rocketRounds = 12;
    let rocketMax = 24;
    let flareRounds = 6;
    let flareMax = 14;
    let hasDepletedUranium = false;
    let blastUpgrade = 0;
    let flakResistance = 0;
    let stealthLevel = 0;

    if (model === 'standard') {
      // F-4 Phantom II NATO Supersonic Strike Jet
      const armorLvl = planeUpg.f4_armor || 0;
      const spdLvl = planeUpg.f4_speed || 0;
      const vulcanLvl = planeUpg.f4_vulcan || 0;
      const clusterLvl = planeUpg.f4_cluster || 0;
      const bombLvl = planeUpg.f4_bombs || 0;
      const chaffLvl = planeUpg.f4_chaff || 0;

      baseSpd = 5.2 + spdLvl * 0.35;
      minSpd = 3.2;
      maxSpd = 7.8 + spdLvl * 0.6;
      turn = 0.046;
      baseHp = 95 + armorLvl * 25;
      bombsCount = 12 + bombLvl * 4;
      bombsMax = 28;
      clusterCount = 6 + clusterLvl * 2;
      clusterMax = 12;
      nukeCount = 1;
      gau8Rounds = 250 + vulcanLvl * 60;
      gau8Max = 500;
      rocketRounds = 8;
      rocketMax = 16;
      flareRounds = 8 + chaffLvl * 2;
      flareMax = 16;
      blastUpgrade = bombLvl;
    } else if (model === 'a10') {
      // A-10 Warthog Tank Buster Supreme
      const armorLvl = planeUpg.a10_armor || 0;
      const gau8Lvl = planeUpg.a10_gau8 || 0;
      const rktLvl = planeUpg.a10_rockets || 0;
      const bombLvl = planeUpg.a10_bombBlast || 0;
      const nukeLvl = planeUpg.a10_nuke || 0;
      const flareLvl = planeUpg.a10_flares || 0;

      baseSpd = 4.2;
      minSpd = 2.6;
      maxSpd = 6.5;
      turn = 0.042;
      baseHp = 135 + armorLvl * 35;
      flakResistance = armorLvl * 0.06;
      bombsCount = 10 + bombLvl * 3;
      bombsMax = 24;
      clusterCount = 4;
      clusterMax = 8;
      nukeCount = 1 + nukeLvl;
      nukeMax = 3;
      gau8Rounds = 300 + gau8Lvl * 60;
      gau8Max = 600;
      hasDepletedUranium = gau8Lvl >= 1;
      rocketRounds = 12 + rktLvl * 4;
      rocketMax = 28;
      flareRounds = 6 + flareLvl * 2;
      flareMax = 14;
      blastUpgrade = bombLvl * 1.5;
    } else if (model === 'su25') {
      // SU-25 Frogfoot Soviet Heavy Armor CAS Jet
      const armorLvl = planeUpg.su25_armor || 0;
      const cannonLvl = planeUpg.su25_cannon || 0;
      const s8Lvl = planeUpg.su25_s8 || 0;
      const fabLvl = planeUpg.su25_fab || 0;
      const nukeLvl = planeUpg.su25_nuke || 0;
      const flareLvl = planeUpg.su25_flares || 0;

      baseSpd = 4.5;
      minSpd = 2.8;
      maxSpd = 6.8;
      turn = 0.040;
      baseHp = 155 + armorLvl * 40;
      flakResistance = armorLvl * 0.05;
      bombsCount = 14 + fabLvl * 4;
      bombsMax = 30;
      clusterCount = 6;
      clusterMax = 10;
      nukeCount = 1 + nukeLvl;
      nukeMax = 3;
      gau8Rounds = 240 + cannonLvl * 50;
      gau8Max = 500;
      rocketRounds = 16 + s8Lvl * 4;
      rocketMax = 32;
      flareRounds = 10 + flareLvl * 3;
      flareMax = 20;
      blastUpgrade = fabLvl * 1.3;
    } else if (model === 'cobra') {
      // AH-1 Cobra Attack Helicopter
      const armorLvl = planeUpg.ah1_armor || 0;
      const turretLvl = planeUpg.ah1_turret || 0;
      const towLvl = planeUpg.ah1_tow || 0;
      const bombLvl = planeUpg.ah1_bombs || 0;
      const stlthLvl = planeUpg.ah1_stealth || 0;
      const flareLvl = planeUpg.ah1_flares || 0;

      baseSpd = 3.2;
      minSpd = 0.0;
      maxSpd = 5.4;
      turn = 0.055;
      baseHp = 110 + armorLvl * 25;
      bombsCount = 6 + bombLvl * 3;
      bombsMax = 18;
      clusterCount = 2;
      clusterMax = 6;
      nukeCount = 1;
      nukeMax = 2;
      gau8Rounds = 200 + turretLvl * 50;
      gau8Max = 450;
      rocketRounds = 16 + towLvl * 4;
      rocketMax = 32;
      flareRounds = 8 + flareLvl * 3;
      flareMax = 18;
      blastUpgrade = bombLvl;
      stealthLevel = stlthLvl;
    } else if (model === 'f14') {
      // F-14 Tomcat Supersonic Fleet Interceptor
      const armorLvl = planeUpg.f14_armor || 0;
      const spdLvl = planeUpg.f14_afterburner || 0;
      const phxLvl = planeUpg.f14_phoenix || 0;
      const vulcanLvl = planeUpg.f14_vulcan || 0;
      const bombLvl = planeUpg.f14_bombs || 0;
      const flareLvl = planeUpg.f14_chaff || 0;

      baseSpd = 5.6 + spdLvl * 0.45;
      minSpd = 3.4;
      maxSpd = 8.5 + spdLvl * 0.7; // Mach 2.3 supersonic afterburners
      turn = 0.048;
      baseHp = 120 + armorLvl * 25;
      flakResistance = armorLvl * 0.04;
      bombsCount = 10 + bombLvl * 3;
      bombsMax = 24;
      clusterCount = 6;
      clusterMax = 10;
      nukeCount = 1;
      nukeMax = 2;
      gau8Rounds = 350 + vulcanLvl * 60;
      gau8Max = 650;
      rocketRounds = 16 + phxLvl * 4;
      rocketMax = 32;
      flareRounds = 10 + flareLvl * 3;
      flareMax = 22;
      blastUpgrade = bombLvl * 1.3;
    } else if (model === 'ac130') {
      // AC-130 Spectre Heavy Flying Gunship Fortress
      const armorLvl = planeUpg.ac130_armor || 0;
      const howitzerLvl = planeUpg.ac130_howitzer || 0;
      const boforsLvl = planeUpg.ac130_bofors || 0;
      const gatlingLvl = planeUpg.ac130_gatling || 0;
      const nukeLvl = planeUpg.ac130_nuke || 0;
      const flareLvl = planeUpg.ac130_flares || 0;

      baseSpd = 3.8;
      minSpd = 2.2;
      maxSpd = 5.8;
      turn = 0.038;
      baseHp = 190 + armorLvl * 40; // Highest HP airframe in game!
      flakResistance = 0.20 + armorLvl * 0.06;
      bombsCount = 16 + howitzerLvl * 4;
      bombsMax = 36;
      clusterCount = 8;
      clusterMax = 14;
      nukeCount = 2 + nukeLvl;
      nukeMax = 4;
      gau8Rounds = 500 + (gatlingLvl + boforsLvl) * 60;
      gau8Max = 900;
      hasDepletedUranium = boforsLvl >= 1;
      rocketRounds = 24 + howitzerLvl * 4;
      rocketMax = 44;
      flareRounds = 14 + flareLvl * 4;
      flareMax = 28;
      blastUpgrade = 2.0 + howitzerLvl * 1.5;
    } else if (model === 'apache') {
      // AH-64 Apache Heavy Tank Buster Gunship
      const armorLvl = planeUpg.apache_armor || 0;
      const m230Lvl = planeUpg.apache_m230 || 0;
      const hydraLvl = planeUpg.apache_hydra || 0;
      const hellfireLvl = planeUpg.apache_hellfire || 0;
      const nukeLvl = planeUpg.apache_nuke || 0;
      const flareLvl = planeUpg.apache_flares || 0;

      baseSpd = 3.6;
      minSpd = 0.0;
      maxSpd = 5.8;
      turn = 0.052;
      baseHp = 180 + armorLvl * 35;
      flakResistance = 0.15 + armorLvl * 0.05;
      bombsCount = 10 + hellfireLvl * 3;
      bombsMax = 24;
      clusterCount = 4;
      clusterMax = 8;
      nukeCount = 1 + nukeLvl;
      nukeMax = 2;
      gau8Rounds = 300 + m230Lvl * 60;
      gau8Max = 600;
      hasDepletedUranium = m230Lvl >= 1;
      rocketRounds = 20 + hydraLvl * 4;
      rocketMax = 36;
      flareRounds = 12 + flareLvl * 3;
      flareMax = 24;
      blastUpgrade = 1.5 + hellfireLvl;
    } else if (model === 'comanche') {
      // RAH-66 Comanche Stealth Recon Gunship
      const stealthLvl = planeUpg.comanche_stealth || 0;
      const armorLvl = planeUpg.comanche_armor || 0;
      const gatlingLvl = planeUpg.comanche_gatling || 0;
      const hellfireLvl = planeUpg.comanche_hellfire || 0;
      const bombLvl = planeUpg.comanche_bombs || 0;
      const flareLvl = planeUpg.comanche_flares || 0;

      baseSpd = 4.2;
      minSpd = 0.0;
      maxSpd = 6.6;
      turn = 0.058;
      baseHp = 130 + armorLvl * 30;
      stealthLevel = 1 + stealthLvl;
      bombsCount = 8 + bombLvl * 3;
      bombsMax = 20;
      clusterCount = 4;
      clusterMax = 8;
      nukeCount = 1;
      nukeMax = 2;
      gau8Rounds = 260 + gatlingLvl * 60;
      gau8Max = 550;
      rocketRounds = 16 + hellfireLvl * 4;
      rocketMax = 32;
      flareRounds = 10 + flareLvl * 3;
      flareMax = 20;
      blastUpgrade = 1.0 + bombLvl;
    } else if (model === 'chinook') {
      // CH-47 Chinook Tandem-Rotor Fortress
      const armorLvl = planeUpg.chinook_armor || 0;
      const doorGunLvl = planeUpg.chinook_door_guns || 0;
      const bombLvl = planeUpg.chinook_bombs || 0;
      const clusterLvl = planeUpg.chinook_cluster || 0;
      const flareLvl = planeUpg.chinook_flares || 0;

      baseSpd = 3.2;
      minSpd = 0.0;
      maxSpd = 5.2;
      turn = 0.042;
      baseHp = 230 + armorLvl * 45;
      flakResistance = 0.20 + armorLvl * 0.05;
      bombsCount = 18 + bombLvl * 6;
      bombsMax = 42;
      clusterCount = 8 + clusterLvl * 3;
      clusterMax = 16;
      nukeCount = 1;
      nukeMax = 2;
      gau8Rounds = 450 + doorGunLvl * 80;
      gau8Max = 850;
      rocketRounds = 16 + doorGunLvl * 4;
      rocketMax = 32;
      flareRounds = 14 + flareLvl * 4;
      flareMax = 28;
      blastUpgrade = 1.5 + bombLvl;
    } else if (model === 'harrier') {
      // AV-8B Harrier II VTOL Jump Jet
      const armorLvl = planeUpg.harrier_armor || 0;
      const pegasusLvl = planeUpg.harrier_pegasus || 0;
      const gau12Lvl = planeUpg.harrier_gau12 || 0;
      const mavLvl = planeUpg.harrier_maverick || 0;
      const bombLvl = planeUpg.harrier_bombs || 0;
      const flareLvl = planeUpg.harrier_chaff || 0;

      baseSpd = 5.2 + pegasusLvl * 0.35;
      minSpd = 0.0; // Full VTOL hover capability
      maxSpd = 7.6 + pegasusLvl * 0.55;
      turn = 0.054;
      baseHp = 115 + armorLvl * 25;
      bombsCount = 12 + bombLvl * 4;
      bombsMax = 28;
      clusterCount = 6;
      clusterMax = 10;
      nukeCount = 1;
      nukeMax = 2;
      gau8Rounds = 320 + gau12Lvl * 60;
      gau8Max = 620;
      rocketRounds = 18 + mavLvl * 4;
      rocketMax = 34;
      flareRounds = 12 + flareLvl * 3;
      flareMax = 24;
      blastUpgrade = 1.4 + bombLvl;
    }

    this.player = {
      model,
      isHelicopter: (model === 'cobra' || model === 'apache' || model === 'comanche' || model === 'chinook'),
      isVTOL: (model === 'harrier'),
      x: startX,
      y: startY,
      vx: 4.6,
      vy: 0,
      angle: 0,
      baseSpeed: baseSpd,
      minSpeed: minSpd,
      maxSpeed: maxSpd,
      currentSpeed: baseSpd,
      turnRate: turn,
      maxHp: baseHp,
      hp: baseHp,
      alive: true,
      invulnerableTimer: 120,
      stallTimer: 0,
      isStalling: false,
      boostFuel: 100,
      maxBoostFuel: 100,
      isBoosting: false,
      isDiving: false,
      isPullUpWarning: false,
      pullUpAudioTimer: 0,
      droneStrikesAvailable: 1,
      droneCooldown: 0,
      flakResistance,
      stealthLevel,

      // Pilot humor & situation reaction cooldown timers
      fireHumorTimer: 0,
      nearCrashHumorTimer: 0,
      stallHumorTimer: 0,
      outOfAmmoHumorTimer: 0,

      // === Tactical Munitions Inventory ===
      bombs: bombsCount,
      bombsMax,
      bombCooldown: 0,

      clusters: clusterCount,
      clustersMax: clusterMax,

      nukes: nukeCount,
      nukesMax: nukeMax,
      nukeCooldown: 0,

      gau8Ammo: gau8Rounds,
      gau8MaxAmmo: gau8Max,
      gau8FiringCooldown: 0,
      hasDepletedUranium,

      rocketAmmo: rocketRounds,
      rocketMaxAmmo: rocketMax,
      rocketCooldown: 0,

      flares: flareRounds,
      flaresMax: flareMax,

      hellfireAmmo: 4,
      hellfireMaxAmmo: 8,
      hellfireCooldown: 0,

      napalmAmmo: 3,
      napalmMaxAmmo: 6,
      napalmCooldown: 0,

      empBombs: 3,
      empMaxBombs: 6,
      empCooldown: 0,

      blastUpgrade,
      muzzleFlash: 0,
      score: prevScore,
      credits: prevCredits,
      fuel: 100,
      maxFuel: 100,
      fuelBurnRate: 0.024
    };

    // Compatibility getters & setters
    Object.defineProperty(this.player, 'bombsInRack', {
      get() { return this.bombs; },
      set(v) { this.bombs = v; }
    });
    Object.defineProperty(this.player, 'bombRackMax', {
      get() { return this.bombsMax; },
      set(v) { this.bombsMax = v; }
    });
    Object.defineProperty(this.player, 'rockets', {
      get() { return this.rocketAmmo; },
      set(v) { this.rocketAmmo = v; }
    });
  }

  switchPlayerModel(model) {
    if (!this.player || !this.player.alive) return;
    this.player.model = model;
    const planeUpg = this.game.armory ? this.game.armory.getPlaneUpgrades(model) : {};
    let newMaxHp = 100;

    if (model === 'standard') {
      const spdLvl = planeUpg.f4_speed || 0;
      const armorLvl = planeUpg.f4_armor || 0;
      this.player.baseSpeed = 5.2 + spdLvl * 0.35;
      this.player.minSpeed = 3.2;
      this.player.maxSpeed = 7.8 + spdLvl * 0.6;
      this.player.turnRate = 0.046;
      this.player.flakResistance = 0;
      this.player.stealthLevel = 0;
      newMaxHp = 95 + armorLvl * 25;
    } else if (model === 'a10') {
      const armorLvl = planeUpg.a10_armor || 0;
      this.player.baseSpeed = 4.2;
      this.player.minSpeed = 2.6;
      this.player.maxSpeed = 6.5;
      this.player.turnRate = 0.042;
      this.player.flakResistance = armorLvl * 0.06;
      this.player.stealthLevel = 0;
      newMaxHp = 135 + armorLvl * 35;
    } else if (model === 'su25') {
      const armorLvl = planeUpg.su25_armor || 0;
      this.player.baseSpeed = 4.5;
      this.player.minSpeed = 2.8;
      this.player.maxSpeed = 6.8;
      this.player.turnRate = 0.040;
      this.player.flakResistance = armorLvl * 0.05;
      this.player.stealthLevel = 0;
      newMaxHp = 155 + armorLvl * 40;
    } else if (model === 'cobra') {
      const armorLvl = planeUpg.ah1_armor || 0;
      const stlthLvl = planeUpg.ah1_stealth || 0;
      this.player.baseSpeed = 3.2;
      this.player.minSpeed = 0.0;
      this.player.maxSpeed = 5.4;
      this.player.turnRate = 0.055;
      this.player.flakResistance = 0;
      this.player.stealthLevel = stlthLvl;
      newMaxHp = 110 + armorLvl * 25;
    } else if (model === 'f14') {
      const armorLvl = planeUpg.f14_armor || 0;
      const spdLvl = planeUpg.f14_afterburner || 0;
      this.player.baseSpeed = 5.6 + spdLvl * 0.45;
      this.player.minSpeed = 3.4;
      this.player.maxSpeed = 8.5 + spdLvl * 0.7;
      this.player.turnRate = 0.048;
      this.player.flakResistance = armorLvl * 0.04;
      this.player.stealthLevel = 0;
      newMaxHp = 120 + armorLvl * 25;
    } else if (model === 'ac130') {
      const armorLvl = planeUpg.ac130_armor || 0;
      this.player.baseSpeed = 3.8;
      this.player.minSpeed = 2.2;
      this.player.maxSpeed = 5.8;
      this.player.turnRate = 0.038;
      this.player.flakResistance = 0.20 + armorLvl * 0.06;
      this.player.stealthLevel = 0;
      newMaxHp = 190 + armorLvl * 40;
    } else if (model === 'apache') {
      const armorLvl = planeUpg.apache_armor || 0;
      this.player.baseSpeed = 3.6;
      this.player.minSpeed = 0.0;
      this.player.maxSpeed = 5.8;
      this.player.turnRate = 0.052;
      this.player.flakResistance = 0.15 + armorLvl * 0.05;
      this.player.stealthLevel = 0;
      newMaxHp = 180 + armorLvl * 35;
    } else if (model === 'comanche') {
      const stealthLvl = planeUpg.comanche_stealth || 0;
      const armorLvl = planeUpg.comanche_armor || 0;
      this.player.baseSpeed = 4.2;
      this.player.minSpeed = 0.0;
      this.player.maxSpeed = 6.6;
      this.player.turnRate = 0.058;
      this.player.flakResistance = 0;
      this.player.stealthLevel = 1 + stealthLvl;
      newMaxHp = 130 + armorLvl * 30;
    } else if (model === 'chinook') {
      const armorLvl = planeUpg.chinook_armor || 0;
      this.player.baseSpeed = 3.2;
      this.player.minSpeed = 0.0;
      this.player.maxSpeed = 5.2;
      this.player.turnRate = 0.042;
      this.player.flakResistance = 0.20 + armorLvl * 0.05;
      this.player.stealthLevel = 0;
      newMaxHp = 230 + armorLvl * 45;
    } else if (model === 'harrier') {
      const armorLvl = planeUpg.harrier_armor || 0;
      const pegasusLvl = planeUpg.harrier_pegasus || 0;
      this.player.baseSpeed = 5.2 + pegasusLvl * 0.35;
      this.player.minSpeed = 0.0;
      this.player.maxSpeed = 7.6 + pegasusLvl * 0.55;
      this.player.turnRate = 0.054;
      this.player.flakResistance = 0;
      this.player.stealthLevel = 0;
      newMaxHp = 115 + armorLvl * 25;
    }

    this.player.isHelicopter = (model === 'cobra' || model === 'apache' || model === 'comanche' || model === 'chinook');
    this.player.isVTOL = (model === 'harrier');

    const hpRatio = this.player.hp / this.player.maxHp;
    this.player.maxHp = newMaxHp;
    this.player.hp = Math.round(newMaxHp * Math.max(0.25, hpRatio));
    this.player.currentSpeed = this.player.baseSpeed;

    const planeObj = this.game.armory ? this.game.armory.getPlaneList().find(p => p.id === model) : null;
    const planeName = planeObj ? planeObj.name : model.toUpperCase();
    this.game.addFloatingText(`DEPLOYED: ${planeName}`, this.player.x, this.player.y - 40, '#ffff00');
  }

  spawnWave(wave = 1, mapType = null, targetCountOverride = null) {
    this.reset();
    const terrain = this.game.terrain;
    const mapWidth = terrain.mapWidth;
    const activeTheater = mapType || (terrain ? terrain.currentMap : 'EUROPEAN');

    // Progressive unit scaling based on wave number (Smooth onboarding & progressive difficulty)
    let tankCount, zsuCount, samCount, s400Count, akashCount, tunguskaCount, truckCount, jeepCount, bunkerCount, buildingCount, treeCount, desertTechnicalCount, mlrsCount, shilkaCount, pantsirCount;

    if (targetCountOverride !== null) {
      // Synchronized wave transition: only spawn the exact remaining target count!
      let rem = Math.max(0, targetCountOverride);
      s400Count = rem >= 1 ? 1 : 0;
      rem -= s400Count;
      pantsirCount = (wave >= 3 && rem >= 4) ? 1 : 0;
      rem -= pantsirCount;
      akashCount = (wave >= 2 && rem >= 4) ? 1 : 0;
      rem -= akashCount;
      tunguskaCount = (wave >= 3 && rem >= 3) ? 1 : 0;
      rem -= tunguskaCount;
      samCount = (wave >= 3 && rem >= 4) ? 1 : 0;
      rem -= samCount;
      zsuCount = rem >= 2 ? Math.min(2, Math.floor(rem / 2)) : 0;
      rem -= zsuCount;
      mlrsCount = (wave >= 3 && rem >= 3) ? 1 : 0;
      rem -= mlrsCount;
      shilkaCount = (wave >= 4 && rem >= 2) ? 1 : 0;
      rem -= shilkaCount;
      if (activeTheater === 'DESERT' && rem >= 1) {
        desertTechnicalCount = Math.min(2, rem);
        rem -= desertTechnicalCount;
      } else {
        desertTechnicalCount = 0;
      }
      tankCount = rem;
      truckCount = 0;
      jeepCount = 0;
      bunkerCount = 0;
      buildingCount = 5;
      treeCount = 45;
    } else {
      desertTechnicalCount = activeTheater === 'DESERT' ? Math.min(6, 3 + Math.floor(wave * 0.6)) : 0;
      // S-400 Triumf spawns starting directly from Wave 1 per user specification
      s400Count = (wave === 1 || wave === 2) ? 1 : (wave <= 4 ? 2 : Math.min(3, 2 + Math.floor((wave - 4) * 0.5)));

      if (wave === 1) {
        // WAVE 1: Training & Onboarding - gentle introduction to bombing and strafing
        tankCount = 3;
        zsuCount = 1;
        samCount = 0; // Standard static SAM is 0; S-400 starts with gentle chip damage (14 HP)
        akashCount = 0;
        tunguskaCount = 0;
        mlrsCount = 0;
        shilkaCount = 0;
        pantsirCount = 0;
        truckCount = 4;
        jeepCount = 2;
        bunkerCount = 1;
        buildingCount = 6;
        treeCount = 50;
      } else if (wave === 2) {
      // WAVE 2: Armored convoy push & Akash Medium Ramjet SAM introduction
      tankCount = 5;
      zsuCount = 2;
      samCount = 0; // Standard static SAM is 0; Akash joins as medium ramjet threat
      akashCount = 1;
      tunguskaCount = 0;
      mlrsCount = 0;
      shilkaCount = 0;
      pantsirCount = 0;
      truckCount = 5;
      jeepCount = 3;
      bunkerCount = 2;
      buildingCount = 6;
      treeCount = 55;
    } else if (wave === 3) {
      // WAVE 3: First Air Defense alert - SAM site, Akash, 2K22 Tunguska, Pantsir-S1, BM-21 Grad
      tankCount = 6;
      zsuCount = 2;
      samCount = 1;
      akashCount = 1;
      tunguskaCount = 1;
      mlrsCount = 1;
      shilkaCount = 0;
      pantsirCount = 1; // Pantsir-S1 Greyhound introduced!
      truckCount = 6;
      jeepCount = 4;
      bunkerCount = 3;
      buildingCount = 7;
      treeCount = 60;
    } else if (wave === 4) {
      // WAVE 4: Theater assault - Shilka quad flak + Pantsir-S1 added!
      tankCount = 8;
      zsuCount = 3;
      samCount = 2;
      akashCount = 1;
      tunguskaCount = 1;
      mlrsCount = 1;
      shilkaCount = 1;
      pantsirCount = 1;
      truckCount = 8;
      jeepCount = 5;
      bunkerCount = 4;
      buildingCount = 8;
      treeCount = 65;
    } else {
      // WAVE 5+: Heavy progressive war escalation
      tankCount = Math.min(20, 8 + (wave - 4) * 2);
      zsuCount = Math.min(10, 3 + Math.floor((wave - 4) * 1.1));
      samCount = Math.min(6, 2 + Math.floor((wave - 4) * 0.7));
      akashCount = Math.min(3, 1 + Math.floor((wave - 4) * 0.5));
      tunguskaCount = Math.min(3, 1 + Math.floor((wave - 4) * 0.5));
      mlrsCount = Math.min(3, 1 + Math.floor((wave - 4) * 0.5));
      shilkaCount = Math.min(4, 1 + Math.floor((wave - 4) * 0.6));
      pantsirCount = Math.min(3, 1 + Math.floor((wave - 4) * 0.5));
      truckCount = Math.min(15, 8 + Math.floor((wave - 4) * 1.2));
      jeepCount = Math.min(12, 5 + Math.floor((wave - 4) * 1.0));
      bunkerCount = Math.min(8, 4 + Math.floor((wave - 4) * 0.7));
      buildingCount = Math.min(12, 8 + Math.floor((wave - 4) * 0.5));
      treeCount = Math.min(75, 65 + wave * 2);
    }
  }

    const usedX = [];
    const getSafeX = (minSpacing = 65) => {
      let attempts = 0;
      while (attempts < 50) {
        attempts++;
        const candidate = 300 + Math.random() * (mapWidth - 600);
        let ok = true;
        for (const ux of usedX) {
          if (Math.abs(ux - candidate) < minSpacing) {
            ok = false;
            break;
          }
        }
        if (ok) {
          usedX.push(candidate);
          return candidate;
        }
      }
      return 300 + Math.random() * (mapWidth - 600);
    };

    // 1. Spawn SAM Sites (Surface-to-Air Missile Batteries)
    for (let i = 0; i < samCount; i++) {
      const x = getSafeX(220);
      const isAdvanced = wave >= 4;
      const baseHp = 80 + Math.min(80, (wave - 1) * 12);
      this.enemies.push({
        type: 'sam_site',
        x,
        y: terrain.getHeightAt(x) - 10,
        isAdvanced,
        hp: baseHp,
        maxHp: baseHp,
        scoreValue: 100 + wave * 20,
        creditValue: 100 + wave * 15,
        radarRange: 750 + Math.min(220, wave * 25),
        reloadTimer: Math.max(100, 220 - Math.min(100, wave * 14)) + Math.random() * 80,
        sprite: this.game.sprites['samsite.png'],
        alive: true
      });
    }

    // 1b. Spawn S-400 Triumf ("SA-21 Growler" / "Sudarshan Chakra") Defense Systems (Starts from Wave 1!)
    for (let i = 0; i < s400Count; i++) {
      const x = getSafeX(280);
      const s400Hp = Math.round(110 + (wave - 1) * 45);
      const s400Dmg = Math.round(Math.min(60, 12 + (wave - 1) * 9.5));
      const salvo = (wave >= 5) ? 4 : (wave >= 3 ? 2 : 1);
      const reload = Math.max(150, Math.round(300 - Math.min(150, (wave - 1) * 35))) + Math.random() * 40;
      const radar = Math.min(1400, 850 + (wave - 1) * 110);
      const spd = Math.min(18.0, 8.5 + (wave - 1) * 1.75);
      const turn = Math.min(0.068, 0.032 + (wave - 1) * 0.007);

      this.enemies.push({
        type: 's400',
        x,
        y: terrain.getHeightAt(x) - 12,
        hp: s400Hp,
        maxHp: s400Hp,
        missileDamage: s400Dmg,
        salvoCount: salvo,
        reloadTimer: reload,
        reloadMax: reload,
        radarRange: radar,
        missileSpeed: spd,
        turnRate: turn,
        erectAngle: 0,
        radarSpin: 0,
        jacksDeployed: false,
        scoreValue: 200 + wave * 40,
        creditValue: 220 + wave * 30,
        alive: true
      });
    }

    // 1c. Spawn Akash Air Defence Systems (Medium-Range Ramjet Mobile SAM - Wave 2+)
    for (let i = 0; i < akashCount; i++) {
      const x = getSafeX(240);
      const akashHp = Math.round(120 + (wave - 1) * 35);
      const akashDmg = Math.round(Math.min(52, 22 + (wave - 1) * 7.5));
      const reload = Math.max(160, Math.round(280 - (wave - 1) * 25)) + Math.random() * 40;
      const radar = Math.min(1250, 780 + (wave - 1) * 80);
      const spd = Math.min(11.0, 7.0 + (wave - 1) * 0.9);
      const turn = Math.min(0.065, 0.038 + (wave - 1) * 0.006);

      this.enemies.push({
        type: 'akash',
        x,
        y: terrain.getHeightAt(x) - 10,
        hp: akashHp,
        maxHp: akashHp,
        missileDamage: akashDmg,
        reloadTimer: reload,
        reloadMax: reload,
        radarRange: radar,
        missileSpeed: spd,
        turnRate: turn,
        aimAngle: -0.65,
        targetAngle: -0.65,
        radarSpin: 0,
        scoreValue: 180 + wave * 30,
        creditValue: 190 + wave * 25,
        alive: true
      });
    }

    // 1d. Spawn 2K22 Tunguska SPAAGM (Dual 30mm Flak + 8 Missiles - Wave 3+)
    for (let i = 0; i < tunguskaCount; i++) {
      const x = getSafeX(220);
      const tungHp = Math.round(140 + (wave - 1) * 38);
      const reload = Math.max(140, Math.round(240 - (wave - 1) * 22)) + Math.random() * 30;
      this.enemies.push({
        type: 'tunguska',
        x,
        y: terrain.getHeightAt(x) - 10,
        hp: tungHp,
        maxHp: tungHp,
        missileTimer: reload,
        missileMax: reload,
        flakTimer: 25 + Math.random() * 15,
        radarSpin: 0,
        aimAngle: -0.65,
        scoreValue: 200 + wave * 35,
        creditValue: 210 + wave * 30,
        alive: true
      });
    }

    // 2. Spawn ZSU-57 Anti-Aircraft Flak Guns
    for (let i = 0; i < zsuCount; i++) {
      const x = getSafeX(160);
      const isVeteran = wave >= 3 && Math.random() < Math.min(0.85, 0.25 + (wave - 3) * 0.12);
      const spriteKey = isVeteran ? 'zsu57veteran.png' : 'zsu57.png';
      const baseHp = isVeteran ? (85 + Math.min(65, (wave - 1) * 9)) : (50 + Math.min(50, (wave - 1) * 6));
      this.enemies.push({
        type: 'zsu57',
        x,
        y: terrain.getHeightAt(x) - 8,
        isVeteran,
        hp: baseHp,
        maxHp: baseHp,
        scoreValue: isVeteran ? (130 + wave * 15) : (75 + wave * 10),
        creditValue: isVeteran ? (120 + wave * 15) : (75 + wave * 10),
        range: 650 + Math.min(200, wave * 25),
        fireTimer: (wave === 1 ? (60 + Math.random() * 40) : (Math.max(35, (isVeteran ? 45 : 75) - Math.min(35, wave * 4)) + Math.random() * 40)),
        sprite: this.game.sprites[spriteKey],
        alive: true
      });
    }

    // 3. Spawn Multi-Tier Armored Tanks (T-34-85, Sherman, M1A2 Abrams, T-90M Proryv, 2S35 Koalitsiya, TOS-1A Buratino)
    for (let i = 0; i < tankCount; i++) {
      const x = getSafeX(130);
      let subType = 't34';
      if (wave === 1) {
        subType = (i % 2 === 0) ? 't34' : 'sherman';
      } else if (wave === 2) {
        if (i === 0) subType = 'abrams';
        else subType = (i % 2 === 0) ? 't34' : 'sherman';
      } else if (wave === 3) {
        const pool = ['abrams', 't90', 'koalitsia'];
        subType = pool[i % pool.length];
      } else {
        // Wave 4+
        if (i === 0) {
          subType = 'buratino'; // Heavy Thermobaric MLRS Ground Boss
        } else {
          const pool = ['abrams', 't90', 'koalitsia', 't34'];
          subType = pool[(i - 1) % pool.length];
        }
      }

      let name = 'T-34-85 Medium Tank';
      let baseHp = 65 + wave * 8;
      let scoreVal = 60 + wave * 10;
      let creditVal = 55 + wave * 10;
      let hasERA = false;
      let hasShield = false;
      let shieldHp = 0;
      let isEntrenched = false;

      if (subType === 'sherman') {
        name = 'M4A3 Sherman Assault Tank';
        baseHp = 60 + wave * 8;
        scoreVal = 55 + wave * 10;
        creditVal = 50 + wave * 10;
      } else if (subType === 'abrams') {
        name = 'M1A2 Abrams Main Battle Tank';
        baseHp = 135 + wave * 15;
        scoreVal = 130 + wave * 20;
        creditVal = 120 + wave * 20;
      } else if (subType === 't90') {
        name = 'T-90M Proryv Breakthrough Tank';
        baseHp = 165 + wave * 18;
        scoreVal = 150 + wave * 20;
        creditVal = 140 + wave * 20;
        hasERA = true; // Relikt Explosive Reactive Armor absorbs 50% on first HE hit
        isEntrenched = Math.random() < 0.55;
      } else if (subType === 'koalitsia') {
        name = '2S35 Koalitsiya-SV Automated Howitzer';
        baseHp = 145 + wave * 16;
        scoreVal = 140 + wave * 20;
        creditVal = 130 + wave * 20;
        isEntrenched = true;
      } else if (subType === 'buratino') {
        name = 'TOS-1A Buratino Heavy Thermobaric MLRS';
        baseHp = 240 + wave * 25;
        scoreVal = 260 + wave * 30;
        creditVal = 240 + wave * 30;
        hasShield = true;
        shieldHp = 120; // TankShieldBarrier: absorbs 120 HP of ordnance before hull damage
      }

      const tankSpeed = (isEntrenched || subType === 'koalitsia' || subType === 'buratino') ? 0 : ((Math.random() - 0.5) * (0.6 + Math.min(0.6, wave * 0.08)));

      this.enemies.push({
        type: 'tank',
        subType,
        x,
        y: terrain.getHeightAt(x) - 8,
        name,
        hp: baseHp,
        maxHp: baseHp,
        scoreValue: scoreVal,
        creditValue: creditVal,
        speed: tankSpeed,
        turretAngle: -0.35,
        recoil: 0,
        hasERA,
        hasShield,
        shieldHp,
        maxShieldHp: shieldHp,
        isEntrenched,
        smokeCooldown: 0,
        repositionTimer: 0,
        cookOffTimer: 0,
        fireTimer: (wave === 1 ? (60 + Math.random() * 40) : (Math.max(35, 75 - Math.min(45, wave * 5)) + Math.random() * 40)),
        sprite: this.game.sprites[subType === 't90' || subType === 'abrams' ? 'tank2.png' : 'tank1.png'],
        alive: true
      });
    }

    // 4. Spawn Supply Trucks (Convoys)
    for (let i = 0; i < truckCount; i++) {
      const x = getSafeX(100);
      const truckHp = 30 + Math.min(35, (wave - 1) * 5);
      const truckSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.min(0.7, wave * 0.08));
      this.enemies.push({
        type: 'truck',
        x,
        y: terrain.getHeightAt(x) - 8,
        hp: truckHp,
        maxHp: truckHp,
        scoreValue: 25 + wave * 5,
        creditValue: 25 + wave * 5,
        speed: truckSpeed,
        sprite: this.game.sprites['truck.png'],
        alive: true
      });
    }

    // 5. Spawn Armed Patrol Jeeps
    for (let i = 0; i < jeepCount; i++) {
      const x = getSafeX(90);
      const jeepHp = 20 + Math.min(25, (wave - 1) * 4);
      const jeepSpeed = (Math.random() > 0.5 ? 1 : -1) * (1.3 + Math.min(0.8, wave * 0.1));
      this.enemies.push({
        type: 'jeep',
        x,
        y: terrain.getHeightAt(x) - 6,
        hp: jeepHp,
        maxHp: jeepHp,
        scoreValue: 15 + wave * 5,
        creditValue: 15 + wave * 5,
        speed: jeepSpeed,
        fireTimer: (wave === 1 ? (40 + Math.random() * 40) : (Math.max(30, 75 - Math.min(40, wave * 5)) + Math.random() * 40)),
        sprite: this.game.sprites['jeep.png'],
        alive: true
      });
    }

    // 6. Spawn Fortified Bunkers
    for (let i = 0; i < bunkerCount; i++) {
      const x = getSafeX(150);
      const bunkerHp = 120 + Math.min(120, (wave - 1) * 15);
      this.enemies.push({
        type: 'bunker',
        x,
        y: terrain.getHeightAt(x) - 18,
        hp: bunkerHp,
        maxHp: bunkerHp,
        scoreValue: 80 + wave * 15,
        creditValue: 60 + wave * 15,
        hasTurret: wave >= 4,
        fireTimer: 80 + Math.random() * 60,
        sprite: this.game.sprites['bunker1.png'],
        alive: true
      });
    }

    // 6b. Spawn BM-21 Grad MLRS Katyusha Trucks
    for (let i = 0; i < (mlrsCount || 0); i++) {
      const x = getSafeX(95);
      const y = terrain.getHeightAt(x) - 10;
      this.enemies.push({
        type: 'mlrs_truck',
        x,
        y,
        hp: 120 + Math.min(80, wave * 10),
        maxHp: 120 + Math.min(80, wave * 10),
        scoreValue: 220 + wave * 25,
        creditValue: 180 + wave * 20,
        fireTimer: 140 + Math.random() * 100,
        alive: true
      });
    }

    // 6c. Spawn ZSU-23-4 Shilka Quad Radar Flak Tanks
    for (let i = 0; i < (shilkaCount || 0); i++) {
      const x = getSafeX(90);
      const y = terrain.getHeightAt(x) - 9;
      this.enemies.push({
        type: 'shilka',
        x,
        y,
        hp: 140 + Math.min(90, wave * 12),
        maxHp: 140 + Math.min(90, wave * 12),
        scoreValue: 260 + wave * 30,
        creditValue: 200 + wave * 25,
        fireTimer: 65 + Math.random() * 40,
        radarAngle: 0,
        alive: true
      });
    }

    // 6d. Spawn Phalanx C-RAM CIWS (Counter-Rocket, Artillery & Mortar) Rotary Air Defense
    const ciwsCount = wave === 1 ? 0 : (wave <= 3 ? 1 : (wave <= 6 ? 2 : 3));
    for (let i = 0; i < ciwsCount; i++) {
      const x = getSafeX(170);
      this.enemies.push({
        type: 'phalanx_ciws',
        x,
        y: terrain.getHeightAt(x) - 14,
        hp: 180 + wave * 25,
        maxHp: 180 + wave * 25,
        scoreValue: 320 + wave * 35,
        creditValue: 280 + wave * 30,
        radarAngle: 0,
        barrelAngle: -Math.PI / 3,
        fireCooldown: 0,
        interceptCooldown: 0,
        alive: true
      });
    }

    // 6e. Spawn Pantsir-S1 (SA-22 Greyhound) Mobile Gun-Missile Air Defense (Wave 3+)
    for (let i = 0; i < (pantsirCount || 0); i++) {
      const x = getSafeX(220);
      const hp = 240 + wave * 30;
      this.enemies.push({
        type: 'pantsir',
        x,
        y: terrain.getHeightAt(x) - 14,
        hp,
        maxHp: hp,
        scoreValue: 380 + wave * 35,
        creditValue: 320 + wave * 30,
        radarSpin: 0,
        trackingRadarAngle: -Math.PI / 3,
        cannonCooldown: 0,
        missileCooldown: 180 + Math.random() * 80,
        interceptCooldown: 0,
        alive: true
      });
    }

    // 6f. Airborne Strategic Boss: Tu-22M3 Backfire Supersonic Heavy Bomber (Wave 4+)
    if (wave >= 4 && this.bombers.length === 0) {
      setTimeout(() => {
        if (this.player && this.player.alive) this.spawnStrategicBomber(wave);
      }, 2400);
    }

    // 6g. Giant Armored War Zeppelin Dreadnought Boss (Wave 5+) (from Aircraft Evolution REA)
    if (wave >= 5 && this.zeppelins.length === 0) {
      setTimeout(() => {
        if (this.player && this.player.alive) this.spawnZeppelinDreadnought(wave);
      }, 3500);
    }

    // 7. Spawn Buildings
    for (let i = 0; i < buildingCount; i++) {
      const x = getSafeX(140);
      this.enemies.push({
        type: 'building',
        x,
        y: terrain.getHeightAt(x) - 18,
        hp: 40 + Math.min(40, (wave - 1) * 6),
        maxHp: 40 + Math.min(40, (wave - 1) * 6),
        scoreValue: 30 + wave * 5,
        creditValue: 20 + wave * 5,
        sprite: this.game.sprites['building.png'],
        alive: true
      });
    }

    // Spawn Trees
    for (let i = 0; i < treeCount; i++) {
      const x = 100 + Math.random() * (mapWidth - 200);
      const treeIdx = Math.floor(Math.random() * 3) + 1;
      const spriteName = treeIdx === 1 ? 'tree.png' : `tree${treeIdx}.png`;
      this.enemies.push({
        type: 'tree',
        x,
        y: terrain.getHeightAt(x) - 16,
        hp: 15,
        maxHp: 15,
        scoreValue: 5,
        creditValue: 5,
        sprite: this.game.sprites[spriteName],
        alive: true
      });
    }

    // 8. Spawn Tactical Fuel Depots & Ammo Drum Clusters (Secondary Chain Explosions)
    const barrelClusterCount = Math.min(5, 2 + Math.floor(wave * 0.4));
    for (let c = 0; c < barrelClusterCount; c++) {
      const clusterBaseX = getSafeX(160);
      const barrelInCluster = 2 + Math.floor(Math.random() * 2); // 2-3 barrels clustered together
      for (let b = 0; b < barrelInCluster; b++) {
        const bx = clusterBaseX + (b - 1) * 20;
        const by = terrain.getHeightAt(bx) - 10;
        this.enemies.push({
          type: 'fuel_barrel',
          x: bx,
          y: by,
          hp: 20,
          maxHp: 20,
          scoreValue: 75 + wave * 10,
          creditValue: 50 + wave * 5,
          alive: true
        });
      }
    }

    // === THEATER-SPECIFIC ENEMY INSTALLATIONS ===
    if (activeTheater === 'SIBERIA') {
      // 1. Armored Soviet Supply Train patrolling valley tracks
      const trainCount = wave >= 3 ? 2 : 1;
      for (let t = 0; t < trainCount; t++) {
        const startX = 1350 + t * 700;
        this.enemies.push({
          type: 'armored_train',
          x: startX,
          y: terrain.getHeightAt(startX) - 10,
          speed: (t % 2 === 0 ? 1 : -1) * (1.2 + wave * 0.1),
          minX: 1100,
          maxX: 2700,
          hp: 380 + wave * 45,
          maxHp: 380 + wave * 45,
          scoreValue: 450 + wave * 50,
          creditValue: 400 + wave * 40,
          fireTimer: 45,
          alive: true
        });
      }

      // 2. Underground Nuclear Missile Silos
      const siloCount = Math.min(4, 2 + Math.floor(wave * 0.4));
      for (let i = 0; i < siloCount; i++) {
        const sx = 2850 + i * 550;
        this.enemies.push({
          type: 'missile_silo',
          x: sx,
          y: terrain.getHeightAt(sx) - 6,
          hp: 220 + wave * 25,
          maxHp: 220 + wave * 25,
          scoreValue: 260 + wave * 30,
          creditValue: 220 + wave * 25,
          missileTimer: 160 + Math.random() * 80,
          hatchOpen: false,
          alive: true
        });
      }

      // 3. Giant Radomes
      const radomeCount = Math.min(4, 2 + Math.floor(wave * 0.4));
      for (let i = 0; i < radomeCount; i++) {
        const rx = 650 + i * 1150;
        this.enemies.push({
          type: 'radome',
          x: rx,
          y: terrain.getHeightAt(rx) - 16,
          hp: 160 + wave * 20,
          maxHp: 160 + wave * 20,
          scoreValue: 200 + wave * 20,
          creditValue: 180 + wave * 20,
          spinAngle: 0,
          alive: true
        });
      }

    } else if (activeTheater === 'DESERT') {
      // 1. Active Oil Pumpjacks with Burning Flare Stacks
      const pumpCount = Math.min(5, 3 + Math.floor(wave * 0.5));
      for (let i = 0; i < pumpCount; i++) {
        const ox = 1800 + i * 380;
        this.enemies.push({
          type: 'oil_well',
          x: ox,
          y: terrain.getHeightAt(ox) - 14,
          hp: 140 + wave * 20,
          maxHp: 140 + wave * 20,
          scoreValue: 180 + wave * 20,
          creditValue: 180 + wave * 20,
          pumpAngle: i * 1.5,
          alive: true
        });
      }

      // 2. Desert Technical Gun Trucks
      const technicalCount = desertTechnicalCount;
      for (let i = 0; i < technicalCount; i++) {
        const tx = 600 + i * 750;
        this.enemies.push({
          type: 'desert_technical',
          x: tx,
          y: terrain.getHeightAt(tx) - 8,
          speed: (Math.random() > 0.5 ? 1 : -1) * (1.7 + Math.random() * 0.5),
          hp: 55 + wave * 8,
          maxHp: 55 + wave * 8,
          scoreValue: 80 + wave * 10,
          creditValue: 75 + wave * 10,
          fireTimer: 45 + Math.random() * 30,
          alive: true
        });
      }
    }

    // Spawn initial high-altitude sky supply drop so players have one ready!
    this.spawnSkyAirdrop(600, 100);
  }

  // Periodic High-Altitude Sky Airdrop (Balanced drops: reliably supplies health & nukes without flooding)
  spawnSkyAirdrop(x = null, y = null) {
    if (this.bonusCrates.length >= 4) return; // Cap active crates to prevent screen flooding
    const terrain = this.game.terrain;
    const p = this.player;
    const dropX = x !== null ? x : (p ? p.x + 350 + Math.random() * 500 : 1000);
    const dropY = y !== null ? y : (50 + Math.random() * 90);

    // Standard Munition Supply Pool
    let selected = 'bonusbomb';
    const rand = Math.random();

    // 1. Tactical Airframe Health Repair Crate (Active whenever damaged, 20s cooldown, high clutch chance)
    if (p && p.hp < p.maxHp * 0.75 && this.healthDropCooldown <= 0 && rand < (p.hp < p.maxHp * 0.40 ? 0.55 : 0.35)) {
      selected = 'bonusrepair';
      this.healthDropCooldown = 1200; // ~20s cooldown (reliable recovery when under fire)
    }
    // 2. Tactical Nuke Crate (Balanced ~40s cooldown if 0 nukes in inventory, 18% chance)
    else if (p && p.nukes < 2 && this.nukeDropCooldown <= 0 && rand < (p.nukes === 0 ? 0.18 : 0.08)) {
      selected = 'bonusnuke';
      this.nukeDropCooldown = p.nukes === 0 ? 2400 : 3600; // ~40s or 60s cooldown
    }
    // 3. Core Combat Munitions (Bombs, 30mm AP Cannon, Hydra Rockets, Cluster Munitions)
    else {
      const munitionTypes = ['bonusbomb', 'bonusgau8', 'bonusrocket', 'bonuscluster'];
      const munitionWeights = [0.38, 0.28, 0.22, 0.12];
      let mRand = Math.random();
      selected = munitionTypes[0];
      for (let i = 0; i < munitionTypes.length; i++) {
        if (mRand < munitionWeights[i]) {
          selected = munitionTypes[i];
          break;
        }
        mRand -= munitionWeights[i];
      }
    }

    const spriteKey = selected === 'bonusrepair' ? 'bonusblast.png' : `${selected}.png`;

    this.bonusCrates.push({
      type: selected,
      x: ((dropX % terrain.mapWidth) + terrain.mapWidth) % terrain.mapWidth,
      y: dropY,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.65, // Gentle parachute descent
      isSkyAirdrop: true,
      swayOffset: Math.random() * 100,
      sprite: this.game.sprites[spriteKey],
      alive: true
    });

    if (this.game.addFloatingText && this.player) {
      const dropLabel = selected === 'bonusrepair' ? '🔧 HEALTH CRATE INCOMING!' : (selected === 'bonusnuke' ? '☢️ ATOMIC AIRDROP INCOMING!' : 'SUPPLY AIRDROP INCOMING!');
      this.game.addFloatingText(dropLabel, this.player.x, 80, selected === 'bonusrepair' ? '#00ff66' : (selected === 'bonusnuke' ? '#ff3333' : '#ffff00'));
    }
  }

  // Determine an enemy counter-aircraft that is strictly MORE ADVANCED than the player's chosen aircraft
  getEnemyCounterAircraft(playerModel = 'standard', wave = 1) {
    // Advanced Hierarchy Matrix:
    // 1. Player in Rotary / Helicopters (cobra, apache, chinook)
    if (playerModel === 'cobra' || playerModel === 'apache' || playerModel === 'chinook') {
      return {
        type: 'ka52',
        name: 'Ka-52 ALLIGATOR',
        natoName: 'HOKUM-B',
        role: 'Coaxial Hunter-Killer Attack Helicopter',
        genTag: 'ADVANCED CHOPPER HUNTER',
        baseSpeed: 7.2,
        maxSpeed: 8.6,
        turnRate: 0.052,
        baseHp: 180,
        damage: 18,
        missileType: 'Igla-V Dogfight AAM',
        missileCooldown: 220,
        fireInterval: 20,
        hasCobra: false,
        scoreValue: 350,
        creditValue: 250,
        description: 'Coaxial twin-rotor gunship designed specifically to intercept and annihilate enemy combat helicopters.'
      };
    }

    // 2. Player in Heavy Fortress Gunship or Stealth (ac130, comanche) OR late waves (wave >= 7)
    if (playerModel === 'ac130' || playerModel === 'comanche' || wave >= 7) {
      return {
        type: 'su57',
        name: 'Su-57 FELON',
        natoName: 'FELON (5TH-GEN STEALTH)',
        role: '5th Generation Stealth Hypersonic Air Superiority Fighter',
        genTag: '5TH-GEN STEALTH HYPERSONIC',
        baseSpeed: 11.6,
        maxSpeed: 13.8,
        turnRate: 0.075,
        baseHp: 290,
        damage: 32,
        missileType: 'R-74M2 Hypersonic AAM',
        missileCooldown: 150,
        fireInterval: 12,
        hasCobra: true,
        isStealth: true,
        scoreValue: 750,
        creditValue: 550,
        description: '5th-gen stealth interceptor with internal weapon bays, 3D vector supercruise, and hyper-agile dogfighting AI.'
      };
    }

    // 3. Supersonic Variable-Sweep Interceptor or VTOL Jump Jet (f14, harrier) OR wave >= 5
    if (playerModel === 'f14' || playerModel === 'harrier' || wave >= 5) {
      return {
        type: 'su35',
        name: 'Su-35 FLANKER-E',
        natoName: 'SUPER FLANKER',
        role: '4.5++ Generation Air Dominance Fighter',
        genTag: '4.5++ GEN SUPER-MANEUVERABLE',
        baseSpeed: 10.4,
        maxSpeed: 12.2,
        turnRate: 0.065,
        baseHp: 230,
        damage: 26,
        missileType: 'R-77 Active Radar Viper',
        missileCooldown: 180,
        fireInterval: 16,
        hasCobra: true,
        scoreValue: 500,
        creditValue: 380,
        description: 'Super-maneuverable air supremacy fighter with 3D thrust vectoring and Pugachev Cobra airbrake capability.'
      };
    }

    // 4. Player in Subsonic CAS / 3rd Gen Strike (a10, su25, standard F-4)
    // Counter: 4th Generation MiG-29 Fulcrum (Mach 2.25 Air Superiority Interceptor)
    return {
      type: 'mig29',
      name: 'MiG-29 FULCRUM',
      natoName: 'FULCRUM',
      role: '4th Generation Air Superiority Interceptor',
      genTag: '4TH-GEN AIR SUPERIORITY',
      baseSpeed: 9.2,
      maxSpeed: 10.8,
      turnRate: 0.058,
      baseHp: 160,
      damage: 20,
      missileType: 'R-73 Archer High Off-Boresight AAM',
      missileCooldown: 210,
      fireInterval: 18,
      hasCobra: false,
      scoreValue: 320,
      creditValue: 240,
      description: '4th-gen supersonic interceptor with twin RD-33 afterburners, helmet-mounted targeting and R-73 Archer missiles.'
    };
  }

  spawnMig(wave = 1) {
    if (!this.player || !this.player.alive) return;
    if (wave < 3) return; // Wave 1 & 2 are strictly MiG-free for clean onboarding!
    const p = this.player;
    const pFacing = Math.cos(p.angle) >= 0 ? 1 : -1;

    // Determine counter-aircraft that is strictly MORE ADVANCED than player's aircraft!
    const counter = this.getEnemyCounterAircraft(p.model, wave);

    // Multi-aircraft scrambles as wave increases:
    let migCount = 1;
    if (wave >= 8) {
      migCount = Math.random() < 0.6 ? 3 : 2;
    } else if (wave >= 5) {
      migCount = Math.random() < 0.5 ? 2 : 1;
    }

    const isAceSquadron = (wave >= 6 && Math.random() < 0.45) || (counter.type === 'su57');

    for (let m = 0; m < migCount; m++) {
      // Spawn behind player's tail on the 6 o'clock pursuit vector!
      const spawnX = p.x - pFacing * (620 + m * 170);
      const spawnY = Math.max(70, p.y - 40 + (Math.random() - 0.5) * 60 + m * 20);
      const migSpeed = counter.baseSpeed + Math.min(2.5, (wave - 1) * 0.28) + (isAceSquadron ? 1.0 : 0);
      const migHp = counter.baseHp + Math.min(120, (wave - 1) * 12) + (isAceSquadron ? 40 : 0);

      this.migs.push({
        type: counter.type,
        name: counter.name,
        natoName: counter.natoName,
        genTag: counter.genTag,
        role: counter.role,
        x: spawnX,
        y: spawnY,
        vx: pFacing * migSpeed,
        vy: 0,
        angle: pFacing > 0 ? 0 : Math.PI,
        hp: migHp,
        maxHp: migHp,
        scoreValue: counter.scoreValue + wave * 25 + (isAceSquadron ? 120 : 0),
        creditValue: counter.creditValue + wave * 20 + (isAceSquadron ? 90 : 0),
        dangerRadius: 190,
        hasCobra: counter.hasCobra,
        cobraTimer: 0,
        isPursuing: true,
        tailOffset: 180 + m * 40 + (Math.random() - 0.5) * 30, // Distance to maintain on player's 6 o'clock
        verticalOffset: (m === 0 ? 0 : (m % 2 === 1 ? -30 : 30)) + (Math.random() - 0.5) * 20,
        afterburner: true,
        afterburnerFlameAnim: 0,
        rotorAngle1: 0,
        rotorAngle2: 0,
        isAce: isAceSquadron,
        fireCooldown: counter.fireInterval,
        missileCooldown: counter.missileCooldown,
        missileType: counter.missileType,
        sprite: this.game.sprites['mig1.png'],
        alive: true,
        facing: pFacing,
        baseSpeed: migSpeed,
        maxSpeed: counter.maxSpeed + Math.min(2.8, (wave - 1) * 0.32) + (isAceSquadron ? 1.2 : 0),
        turnRate: counter.turnRate
      });
    }

    if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.95 });

    // Tactical Alert overhead and radio announcement
    if (migCount > 1) {
      this.game.addFloatingText(`⚠️ ${counter.name} PURSUIT SQUADRON ON YOUR SIX!`, p.x, p.y - 50, '#ff3333');
    } else {
      this.game.addFloatingText(`⚠️ ${counter.name} ON YOUR SIX! [HOT PURSUIT]`, p.x, p.y - 50, '#ff4444');
    }

    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('AWACS', `BANDIT ON YOUR SIX! Hostile ${counter.name} (${counter.genTag}) locked on your tail! Break hard!`, 220);
    }

    if (wave >= 3 && this.hinds.length === 0 && Math.random() < 0.40) {
      setTimeout(() => {
        if (this.player && this.player.alive) this.spawnHind(wave);
      }, 1500);
    }
  }

  // Spawn Soviet Mil Mi-24 "Hind" Flying Fortress Gunship (Airborne Boss / Rival)
  spawnHind(wave = 3) {
    if (!this.player || !this.player.alive) return;
    if (this.hinds.length >= 1) return; // Max 1 active Hind at a time
    const p = this.player;

    const spawnSide = Math.random() > 0.5 ? 1 : -1;
    const spawnX = p.x + spawnSide * 850;
    const spawnY = Math.max(120, Math.min(230, p.y - 50 + (Math.random() - 0.5) * 60));
    const hindHp = 240 + Math.min(180, (wave - 1) * 25);

    this.hinds.push({
      x: spawnX,
      y: spawnY,
      vx: -spawnSide * 2.8,
      vy: 0,
      baseY: spawnY,
      angle: spawnSide < 0 ? 0 : Math.PI,
      hp: hindHp,
      maxHp: hindHp,
      scoreValue: 450 + wave * 50,
      creditValue: 350 + wave * 40,
      fireCooldown: 40,
      burstCount: 0,
      missileCooldown: 380, // Periodic AT-6 Spiral guided missile
      rotorAngle: 0,
      facing: spawnSide < 0 ? 1 : -1,
      alive: true
    });

    if (window.soundSystem) {
      if (typeof window.soundSystem.playCockpitAlert === 'function') {
        window.soundSystem.playCockpitAlert();
      } else {
        window.soundSystem.play('beep', { volume: 1.0 });
      }
    }

    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('AWACS', '⚠️ DANGER: ENEMY MIL MI-24 HIND FLYING TANK DETECTED IN AIRSPACE!', 280);
    }
    this.game.addFloatingText('⚠️ WARNING: SOVIET MI-24 HIND DETECTED!', p.x, p.y - 55, '#ff2222');
  }

  updatePlayer(input) {
    if (!this.player || !this.player.alive) return;
    input = input || (this.game && this.game.input) || {};
    const p = this.player;
    const terrain = this.game.terrain;

    if (p.invulnerableTimer > 0) p.invulnerableTimer--;

    // 0. Tactical Jet Fuel Consumption (from Aircraft Evolution REA)
    if (p.fuel === undefined) p.fuel = 100;
    if (p.maxFuel === undefined) p.maxFuel = 100;
    if (p.fuelBurnRate === undefined) p.fuelBurnRate = 0.024;
    const fuelDrain = (input.isBoostActive && input.isBoostActive() ? p.fuelBurnRate * 2.2 : p.fuelBurnRate);
    p.fuel = Math.max(0, p.fuel - fuelDrain);

    if (p.fuel <= 0) {
      p.currentSpeed = Math.max(2.0, p.currentSpeed * 0.992);
      p.angle = Math.min(0.24, p.angle + 0.012); // Forced aerodynamic glide descent toward ground
      if (!p.fuelWarningCooldown) p.fuelWarningCooldown = 0;
      p.fuelWarningCooldown--;
      if (p.fuelWarningCooldown <= 0) {
        p.fuelWarningCooldown = 360;
        if (this.game.setRadioMessage) {
          this.game.setRadioMessage('TOWER', '⚠️ ENGINE FLAMEOUT: Out of fuel! Scoop parachuting fuel jerrycans!', 240);
        }
      }
    }

    // 1. Speed Controls (Throttle, Brake & WEP Afterburner Boost)
    const isHeli = !!p.isHelicopter || (p.model === 'cobra' || p.model === 'apache' || p.model === 'comanche' || p.model === 'chinook');
    const isVTOL = !!p.isVTOL || p.model === 'harrier';
    const effectiveMinSpeed = (isHeli || isVTOL) ? (isHeli ? -1.2 : 0.0) : p.minSpeed;

    const wantsBoost = input.isBoostActive && input.isBoostActive();
    if (wantsBoost && (p.boostFuel || 0) > 2) {
      p.boostFuel = Math.max(0, (p.boostFuel || 100) - 0.45);
      p.isBoosting = true;
      const boostMaxSpeed = p.maxSpeed * 1.35;
      p.currentSpeed = Math.min(boostMaxSpeed, p.currentSpeed + 0.16);

      // Spawn twin afterburner / Mach sparks
      if (this.game.weapons && this.game.weapons.sparks && Math.random() < 0.6) {
        const tailDist = 22;
        const tailX = p.x - Math.cos(p.angle) * tailDist;
        const tailY = p.y - Math.sin(p.angle) * tailDist;
        this.game.weapons.sparks.push({
          x: tailX + (Math.random() - 0.5) * 6,
          y: tailY + (Math.random() - 0.5) * 6,
          vx: -Math.cos(p.angle) * 3 + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(p.angle) * 3 + (Math.random() - 0.5) * 1.5,
          color: Math.random() < 0.5 ? '#00e5ff' : '#ffaa00',
          life: 12,
          maxLife: 12
        });
      }
    } else {
      p.isBoosting = false;
      p.boostFuel = Math.min(p.maxBoostFuel || 100, (p.boostFuel || 0) + 0.22);

      if (input.isAccelerating()) {
        p.currentSpeed = Math.min(p.maxSpeed, p.currentSpeed + 0.08);
      } else if (input.isBraking()) {
        p.currentSpeed = Math.max(effectiveMinSpeed, p.currentSpeed - 0.08);
      } else {
        if (p.currentSpeed > p.baseSpeed) p.currentSpeed -= 0.02;
        if (p.currentSpeed < p.baseSpeed) p.currentSpeed += 0.02;
      }
    }

    // 2. Pitch Controls (Climb / Dive)
    if (input.isClimbing()) {
      p.angle -= p.turnRate;
    }
    if (input.isDiving()) {
      p.angle += p.turnRate;
    }

    // Advanced VTOL Hover Flight Physics (AV-8B Harrier II & Helicopters)
    if (isVTOL && p.currentSpeed <= 1.8) {
      p.isHovering = true;
      // Direct vertical lift controls via Climb / Dive inputs
      if (input.isClimbing()) {
        p.y -= 2.2;
      }
      if (input.isDiving()) {
        p.y += 2.2;
      }
      // Horizontal hover stabilization: gently pulls pitch angle level
      p.angle *= 0.86;
    } else if (isHeli && Math.abs(p.currentSpeed) < 1.2) {
      p.isHovering = true;
      if (input.isClimbing()) {
        p.y -= 1.8;
      }
      if (input.isDiving() && p.currentSpeed <= 0.4) {
        p.y += 1.8;
      }
      p.angle *= 0.90;
    } else {
      p.isHovering = false;
    }

    if (isNaN(p.angle) || !isFinite(p.angle)) p.angle = 0;
    while (p.angle > Math.PI) p.angle -= Math.PI * 2;
    while (p.angle < -Math.PI) p.angle += Math.PI * 2;

    p.isDiving = p.angle > 0.35 && p.angle < Math.PI - 0.35;

    // 3. Gravity & Stall Dynamics (Helicopters & VTOL jets do not stall nose-down)
    const isClimbingSteep = p.angle < -Math.PI / 3.4; // > 31 degrees steep climb
    if (isClimbingSteep && !isHeli && !isVTOL) {
      p.currentSpeed -= 0.055;
      if (p.currentSpeed < p.minSpeed + 0.35) {
        p.stallTimer = (p.stallTimer || 0) + 1;
        p.isStalling = true;
        if (p.stallTimer > 18) {
          p.angle += 0.065; // Dynamic nose-down stall recovery authority
          if (p.stallTimer % 28 === 0 && window.soundSystem) {
            window.soundSystem.play('radarwarning', { volume: 0.45 });
            if (this.game.addFloatingText) {
              this.game.addFloatingText('⚠️ STALL! NOSE DOWN ⚠️', p.x, p.y - 35, '#ff3333');
            }
          }
          if (p.stallTimer === 28 && this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('STALL');
          }
        }
      } else {
        p.isStalling = false;
      }
    } else {
      p.isStalling = false;
      p.stallTimer = Math.max(0, (p.stallTimer || 0) - 1);
    }

    // 4. Position Integration
    p.vx = Math.cos(p.angle) * p.currentSpeed;
    p.vy = Math.sin(p.angle) * p.currentSpeed;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x += terrain.mapWidth;
    if (p.x >= terrain.mapWidth) p.x -= terrain.mapWidth;

    // GPWS Ground Proximity Warning System ("PULL UP! PULL UP! ALTITUDE!")
    const lookaheadX = p.x + p.vx * 18;
    const futureGroundY = terrain.getHeightAt(lookaheadX);
    const altToGround = futureGroundY - p.y;
    const tti = p.vy > 1.8 ? altToGround / p.vy : 999;

    if (p.isDiving && altToGround < 140 && tti < 25 && p.vy > 2.0) {
      p.isPullUpWarning = true;
      if (!p.pullUpAudioTimer) p.pullUpAudioTimer = 0;
      p.pullUpAudioTimer--;
      if (p.pullUpAudioTimer <= 0) {
        p.pullUpAudioTimer = 65; // ~1.1s cooldown
        if (window.soundSystem) {
          window.soundSystem.play('radarwarning', { volume: 0.65 });
        }
        if (this.game.addFloatingText) {
          this.game.addFloatingText('⚠️ PULL UP! TERRAIN CLOSE! ⚠️', p.x, p.y - 45, '#ff2222');
        }
      }
    } else {
      p.isPullUpWarning = false;
      if (p.pullUpAudioTimer > 0) p.pullUpAudioTimer--;
    }

    // Pilot near-crash warning (diving steep into ground)
    const terrainY = terrain.getHeightAt(p.x);
    if (p.y > terrainY - 48 && p.angle > 0.40 && p.vy > 2.2) {
      if (!p.nearCrashHumorTimer) p.nearCrashHumorTimer = 0;
      p.nearCrashHumorTimer--;
      if (p.nearCrashHumorTimer <= 0) {
        p.nearCrashHumorTimer = 550; // ~9s cooldown
        if (this.game.triggerPilotHumor) {
          this.game.triggerPilotHumor('NEAR_CRASH');
        }
      }
    } else {
      if (p.y < terrainY - 120 && p.nearCrashHumorTimer > 0) {
        p.nearCrashHumorTimer--;
      }
    }

    // Pilot out-of-ammo comical complaint
    if (p.bombs === 0 && p.gau8Ammo === 0 && p.rocketAmmo === 0) {
      if (!p.outOfAmmoHumorTimer) p.outOfAmmoHumorTimer = 0;
      p.outOfAmmoHumorTimer--;
      if (p.outOfAmmoHumorTimer <= 0) {
        p.outOfAmmoHumorTimer = 750; // ~12s cooldown
        if (this.game.triggerPilotHumor) {
          this.game.triggerPilotHumor('OUT_OF_AMMO');
        }
      }
    } else {
      p.outOfAmmoHumorTimer = 0;
    }

    // FPV Combat Drone Cooldown
    if (p.droneCooldown > 0) p.droneCooldown--;

    // Dynamic Damage FX: Smoke fog trail (<55% HP) and Fire flames (<28% HP)
    const hpRatio = p.hp / p.maxHp;
    if (hpRatio < 0.55 && p.alive) {
      const isRed = hpRatio < 0.28;
      const tailDist = 20;
      const tailX = p.x - Math.cos(p.angle) * tailDist;
      const tailY = p.y - Math.sin(p.angle) * tailDist;

      // 1. Billowing Smoke / Fog Trail
      this.damageParticles.push({
        x: tailX + (Math.random() - 0.5) * 6,
        y: tailY + (Math.random() - 0.5) * 6,
        vx: -Math.cos(p.angle) * p.currentSpeed * 0.35 + (Math.random() - 0.5) * 0.5,
        vy: -Math.sin(p.angle) * p.currentSpeed * 0.35 - 0.25 + (Math.random() - 0.5) * 0.4,
        radius: isRed ? (5 + Math.random() * 3) : (4 + Math.random() * 3),
        maxRadius: isRed ? 24 : 16,
        life: isRed ? 42 : 36,
        maxLife: isRed ? 42 : 36,
        type: 'smoke',
        color: isRed ? 'rgba(35, 35, 40,' : 'rgba(190, 205, 220,'
      });

      // 2. Blazing Fire & Sparks when Health is in the Red (<28%)
      if (isRed) {
        // Pilot panic reaction directly confronting player
        if (!p.fireHumorTimer) p.fireHumorTimer = 0;
        p.fireHumorTimer--;
        if (p.fireHumorTimer <= 0) {
          p.fireHumorTimer = 480; // ~8 seconds cooldown
          if (this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('FIRE_DANGER', true);
          }
        }

        for (let f = 0; f < 2; f++) {
          this.damageParticles.push({
            x: tailX + (Math.random() - 0.5) * 8,
            y: tailY + (Math.random() - 0.5) * 8,
            vx: -Math.cos(p.angle) * (p.currentSpeed * 0.5 + Math.random() * 1.5),
            vy: -Math.sin(p.angle) * (p.currentSpeed * 0.5) + (Math.random() - 0.5) * 1.2,
            radius: 3 + Math.random() * 4,
            maxRadius: 9 + Math.random() * 4,
            life: 18,
            maxLife: 18,
            type: 'fire',
            color: Math.random() > 0.4 ? '#ff3300' : (Math.random() > 0.5 ? '#ffaa00' : '#ffee33')
          });
        }
      }
    }

    // Update Damage Trail Particles
    for (let i = this.damageParticles.length - 1; i >= 0; i--) {
      const dp = this.damageParticles[i];
      dp.x += dp.vx;
      dp.y += dp.vy;
      dp.radius += (dp.maxRadius - dp.radius) * 0.08;
      dp.life--;

      if (dp.x < 0) dp.x += terrain.mapWidth;
      if (dp.x >= terrain.mapWidth) dp.x -= terrain.mapWidth;

      if (dp.life <= 0) {
        this.damageParticles.splice(i, 1);
      }
    }

    // High-Altitude Cloud Entry: Seamless Dynamic Theater Switch (Europe -> Siberia -> Desert)
    const isClimbingToStratosphere = p.y <= 38 && p.angle < -0.32 && p.vy < -0.4;
    if (isClimbingToStratosphere && this.game.theaterTransitionCooldown <= 0 && (!this.game.mapTransition || !this.game.mapTransition.active)) {
      p.cloudClimbTimer = (p.cloudClimbTimer || 0) + 1;
      if (p.cloudClimbTimer === 25 && this.game.addFloatingText) {
        this.game.addFloatingText('☁️ CLIMBING TO STRATOSPHERE... (DIVE TO CANCEL)', p.x, 80, '#00ffcc');
      }
      if (p.cloudClimbTimer > 85) {
        p.cloudClimbTimer = 0;
        if (this.game.cycleTheater) {
          this.game.cycleTheater();
        }
      }
    } else {
      if (p.y > 45 || p.vy >= 0 || p.angle >= -0.2) {
        p.cloudClimbTimer = 0;
      } else {
        p.cloudClimbTimer = Math.max(0, (p.cloudClimbTimer || 0) - 1);
      }
    }

    if (p.y < 35) {
      p.y = 35;
    }

    // 5. Terrain Ground Collision
    const groundY = terrain.getHeightAt(p.x);
    if (p.y >= groundY - 8) {
      this.killPlayer('crashed into terrain');
      return;
    }

    const speedRatio = (p.currentSpeed - p.minSpeed) / (p.maxSpeed - p.minSpeed);
    const isHovering = (isHeli && Math.abs(p.currentSpeed) < 1.2) || (isVTOL && p.currentSpeed < 1.8);
    window.soundSystem.updateEngine(speedRatio, p.isDiving, isHovering);

    // Cooldown timers
    if (p.bombCooldown > 0) p.bombCooldown--;
    if (p.rocketCooldown > 0) p.rocketCooldown--;
    if (p.nukeCooldown > 0) p.nukeCooldown--;

    // === TACTICAL WEAPON FIRING TRIGGERS (No Auto-Reload! Collect Sky Airdrops when used) ===

    // Turret Auto-Aim Tracking Calculation (AH-64 Apache & AH-1 Cobra)
    p.hasTurretLock = false;
    p.turretAngle = p.angle;
    if (p.model === 'apache' || p.model === 'cobra') {
      let nearestTarget = null;
      let minDist = 380;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          const angleToTarget = Math.atan2(dy, dx);
          let diff = angleToTarget - p.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          // Can track targets within +/- 45 degrees downward/forward
          if (diff >= -0.25 && diff <= 0.85) {
            minDist = d;
            nearestTarget = e;
            p.turretAngle = angleToTarget;
            p.hasTurretLock = true;
            p.lockedTarget = e;
          }
        }
      }
    }

    // 1. Heavy Iron Bomb [SPACE] / [B]
    if (input.isBombTriggered()) {
      if (p.bombs > 0 && p.bombCooldown <= 0) {
        p.bombCooldown = 12; // Smooth continuous drop if holding Space
        p.bombs--;
        const bVx = (p.isHovering && isVTOL) ? 0 : p.vx;
        const bVy = (p.isHovering && isVTOL) ? 3.6 : p.vy;
        this.game.weapons.dropIronBomb(p.x, p.y + 10, bVx, bVy, p.blastUpgrade || 0);
      }
    }

    // 2. Cluster Munition Canister [C]
    if (input.isClusterTriggered() && p.clusters > 0 && p.bombCooldown <= 0) {
      p.bombCooldown = 20;
      p.clusters--;
      this.game.weapons.dropClusterBomb(p.x, p.y + 10, p.vx, p.vy, 4);
    }

    // 3. Tactical Nuclear Bomb [N]
    if (input.isNukeTriggered() && p.nukes > 0 && p.nukeCooldown <= 0) {
      p.nukeCooldown = 120;
      p.nukes--;
      this.game.weapons.dropNuke(p.x, p.y + 12, p.vx, p.vy);
    }

    // 4. Primary Rapid-Fire Cannon (GAU-8 30mm / M230 30mm Chain Gun / Vulcan 20mm) [J] / [L-CLICK]
    if (input.isGau8Firing()) {
      if (p.gau8Ammo > 0) {
        p.gau8FiringCooldown++;
        if (p.gau8FiringCooldown % 2 === 0) {
          p.gau8Ammo--;
          p.muzzleFlash = 2;
          const muzzleOffset = 24;
          const fireAngle = p.hasTurretLock ? p.turretAngle : p.angle;
          const mx = p.x + Math.cos(fireAngle) * muzzleOffset;
          const my = p.y + Math.sin(fireAngle) * muzzleOffset;
          if (p.model === 'apache') {
            this.game.weapons.fireChainGun30mm(mx, my, fireAngle, p.currentSpeed, p.hasDepletedUranium);
          } else {
            this.game.weapons.fireGau8(mx, my, fireAngle, p.currentSpeed, p.hasDepletedUranium);
          }
        }
        if (p.model === 'apache') {
          window.soundSystem.startChainGun();
        } else {
          window.soundSystem.startGau8();
        }
      } else {
        window.soundSystem.stopChainGun();
        window.soundSystem.stopGau8();
      }
    } else {
      window.soundSystem.stopChainGun();
      window.soundSystem.stopGau8();
    }

    // 5. Hydra 70 Rockets [K] / [R-CLICK]
    if (input.isRocketTriggered() && p.rocketCooldown <= 0) {
      if (p.rocketAmmo > 0) {
        p.rocketCooldown = 15;
        p.rocketAmmo--;
        const rx = p.x + Math.cos(p.angle) * 16;
        const ry = p.y + Math.sin(p.angle) * 16;
        this.game.weapons.fireRocket(rx, ry, p.angle, p.currentSpeed);
      }
    }

    // 6. Flare Decoys [F]
    if (input.isFlareTriggered() && p.flares > 0) {
      p.flares--;
      this.game.weapons.deployFlare(p.x, p.y, p.vx, p.vy);
      window.soundSystem.play('button', { volume: 0.5 });
    }

    // 6b. AGM-114 Hellfire Laser-Guided Precision Missile [L] / [4]
    if (p.hellfireCooldown > 0) p.hellfireCooldown--;
    if (input.isHellfireTriggered() && p.hellfireCooldown <= 0) {
      if (p.hellfireAmmo > 0) {
        p.hellfireAmmo--;
        p.hellfireCooldown = 35;
        const hx = p.x + Math.cos(p.angle) * 18;
        const hy = p.y + Math.sin(p.angle) * 18 + 6;
        this.game.weapons.fireHellfire(hx, hy, p.angle, p.currentSpeed, p.lockedTarget);
        if (this.game.addFloatingText) {
          this.game.addFloatingText('🎯 HELLFIRE MISSILE AWAY!', p.x, p.y - 35, '#00e5ff');
        }
      } else {
        if (this.game.addFloatingText) {
          this.game.addFloatingText('OUT OF HELLFIRE MISSILES!', p.x, p.y - 35, '#ff4444');
        }
      }
    }

    // 6c. BLU-27 Napalm Firestorm Bomb [V] / [5]
    if (p.napalmCooldown > 0) p.napalmCooldown--;
    if (input.isNapalmTriggered() && p.napalmCooldown <= 0) {
      if (p.napalmAmmo > 0) {
        p.napalmAmmo--;
        p.napalmCooldown = 45;
        this.game.weapons.dropNapalm(p.x, p.y + 12, p.vx, p.vy);
        if (this.game.addFloatingText) {
          this.game.addFloatingText('🔥 NAPALM CANISTER DROPPED!', p.x, p.y - 35, '#ff6600');
        }
      } else {
        if (this.game.addFloatingText) {
          this.game.addFloatingText('OUT OF NAPALM CANISTERS!', p.x, p.y - 35, '#ff4444');
        }
      }
    }

    // 6d. EMP Shockwave Lightning Bomb [M] / [6] (Aircraft Evolution REA)
    if (p.empCooldown > 0) p.empCooldown--;
    if (input.isEmpTriggered && input.isEmpTriggered() && p.empCooldown <= 0) {
      if (p.empBombs > 0) {
        p.empBombs--;
        p.empCooldown = 45;
        this.game.weapons.dropEmpBomb(p.x, p.y + 12, p.vx, p.vy);
      } else {
        if (this.game.addFloatingText) {
          this.game.addFloatingText('OUT OF EMP BOMBS! GET AIRDROP', p.x, p.y - 35, '#ff4444');
        }
      }
    }

    // 7. Chinook Defensive Dual Door Gunners & Airborne Field Repair
    if (p.model === 'chinook' && p.alive) {
      p.doorGunTimer = (p.doorGunTimer || 0) + 1;
      if (p.doorGunTimer % 8 === 0) {
        let defenseTarget = null;
        let dMin = 280;
        // Intercept nearby enemy MiGs
        for (const mig of this.migs) {
          if (!mig.alive) continue;
          const dm = Math.hypot(mig.x - p.x, mig.y - p.y);
          if (dm < dMin) {
            dMin = dm;
            defenseTarget = mig;
          }
        }
        // Intercept ground targets
        if (!defenseTarget) {
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const de = Math.hypot(e.x - p.x, e.y - p.y);
            if (de < dMin) {
              dMin = de;
              defenseTarget = e;
            }
          }
        }

        if (defenseTarget) {
          const aimAngle = Math.atan2(defenseTarget.y - p.y, defenseTarget.x - p.x);
          const portX = p.x - Math.cos(p.angle) * 8;
          const portY = p.y + 4;
          this.game.weapons.fireDoorGunner(portX, portY, aimAngle, p.currentSpeed);
          p.doorMuzzleFlash = 2;
        }
      }

      // Chinook Airborne Field Repair Generation (+35 HP every ~24s)
      p.repairDropTimer = (p.repairDropTimer || 0) + 1;
      if (p.repairDropTimer > 1400) {
        p.repairDropTimer = 0;
        if (p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + 35);
          if (this.game.addFloatingText) {
            this.game.addFloatingText('🔧 AIRBORNE FIELD REPAIR: +35 HP!', p.x, p.y - 45, '#00ff88');
          }
          if (window.soundSystem && typeof window.soundSystem.playRadioComms === 'function') {
            window.soundSystem.playRadioComms('repair');
          }
        }
      }
    }

    // 8. Peaceful Cruising / No-Combat Humor Trigger (When player is flying without attacking)
    const isActivelyShooting = input.isGau8Firing() || input.isBombTriggered() || input.isRocketTriggered() || input.isHellfireTriggered() || input.isNapalmTriggered() || (input.isClusterTriggered && input.isClusterTriggered()) || (input.isNukeTriggered && input.isNukeTriggered());
    if (isActivelyShooting) {
      p.idleCruisingFrames = 0;
    } else {
      p.idleCruisingFrames = (p.idleCruisingFrames || 0) + 1;
      // ~9.5 seconds of peaceful flight without firing (570 frames)
      if (p.idleCruisingFrames >= 570) {
        p.idleCruisingFrames = 0;
        if (this.game && typeof this.game.triggerPilotHumor === 'function') {
          this.game.triggerPilotHumor('CRUISING_IDLE');
        }
      }
    }
  }

  killPlayer(cause = 'destroyed') {
    if (!this.player || !this.player.alive) return;
    this.player.alive = false;
    window.soundSystem.stopGau8();
    window.soundSystem.stopChainGun();
    window.soundSystem.stopEngine();
    window.soundSystem.play('planehit', { volume: 1.0 });

    this.game.weapons.createExplosion(this.player.x, this.player.y, 'large', 90);
    this.game.triggerScreenShake(20, 30);
    this.game.handlePlayerDeath(cause);
  }

  updateEnemies() {
    const p = this.player;
    const terrain = this.game.terrain;
    const wave = (this.game && this.game.currentWave) || 1;

    // Periodic Sky Airdrop Parachute Dispatcher (~6-9 seconds between drops)
    this.skyDropTimer--;
    if (this.healthDropCooldown > 0) this.healthDropCooldown--;
    if (this.nukeDropCooldown > 0) this.nukeDropCooldown--;

    // Process Staggered Secondary Chain Reaction Explosions
    if (this.chainExplosionQueue && this.chainExplosionQueue.length > 0) {
      for (let i = this.chainExplosionQueue.length - 1; i >= 0; i--) {
        const item = this.chainExplosionQueue[i];
        item.timer--;
        if (item.timer <= 0) {
          if (item.target && item.target.alive) {
            item.target.alive = false;
            this.destroyGroundEnemy(item.target);
          }
          this.chainExplosionQueue.splice(i, 1);
        }
      }
    }

    // Update Active Smoke Screens (Aerosol dissipation)
    for (let s = this.smokeScreens.length - 1; s >= 0; s--) {
      const sm = this.smokeScreens[s];
      sm.life--;
      sm.radius += 0.22;
      sm.alpha = Math.max(0, sm.life / sm.maxLife);
      if (sm.life <= 0) this.smokeScreens.splice(s, 1);
    }

    // Expedite supply drop if player health < 40% or ordnance low
    if (p && p.alive && (p.hp < p.maxHp * 0.40 || p.bombs <= 2 || p.rocketAmmo <= 2 || (p.hellfireAmmo !== undefined && p.hellfireAmmo <= 0))) {
      if (this.skyDropTimer > 150) {
        this.skyDropTimer = 150; // Inbound in ~2.5 seconds!
      }
    }

    if (this.skyDropTimer <= 0) {
      this.spawnSkyAirdrop();
      this.skyDropTimer = 360 + Math.random() * 180; // ~6-9 seconds
    }

    // 1. Update Ground Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) continue;

      if (e.speed) {
        e.x += e.speed;
        if (e.x < 100) { e.x = 100; e.speed = Math.abs(e.speed); }
        if (e.x > terrain.mapWidth - 100) { e.x = terrain.mapWidth - 100; e.speed = -Math.abs(e.speed); }
        e.y = terrain.getHeightAt(e.x) - (e.type === 'jeep' ? 6 : 8);
      }

      // Check EMP Disabled Status (from Aircraft Evolution REA)
      if (e.empDisabledTimer > 0) {
        e.empDisabledTimer--;
        // Emit crackling cyan electric ionization sparks
        if (Math.random() < 0.28 && this.game.weapons && this.game.weapons.sparks) {
          this.game.weapons.sparks.push({
            x: e.x + (Math.random() - 0.5) * 18,
            y: e.y - 10 + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.8,
            life: 14,
            maxLife: 14,
            color: '#00e5ff'
          });
        }
        continue; // Radar/FCS offline! Cannot lock on or fire weapons
      }

      // Theater-Specific Enemy Unit Update Behaviors
      if (e.type === 'armored_train') {
        e.x += e.speed;
        if (e.x > e.maxX) { e.x = e.maxX; e.speed = -Math.abs(e.speed); }
        if (e.x < e.minX) { e.x = e.minX; e.speed = Math.abs(e.speed); }
        e.y = terrain.getHeightAt(e.x) - 10;

        e.fireTimer--;
        if (e.fireTimer <= 0 && p && p.alive) {
          e.fireTimer = 40 + Math.random() * 25;
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 650) {
            const angle = Math.atan2(dy, dx);
            this.enemyBullets.push({
              x: e.x,
              y: e.y - 12,
              vx: Math.cos(angle) * 7.5,
              vy: Math.sin(angle) * 7.5,
              isFlak: true,
              damage: 18,
              life: 110
            });
            window.soundSystem.play('tankhit', { volume: 0.6 });
          }
        }
      } else if (e.type === 'missile_silo') {
        e.missileTimer--;
        if (e.missileTimer <= 30) e.hatchOpen = true;
        if (e.missileTimer <= 0 && p && p.alive) {
          e.missileTimer = 220 + Math.random() * 100;
          e.hatchOpen = false;
          this.samMissiles.push({
            x: e.x,
            y: e.y - 12,
            targetX: p.x,
            targetY: p.y,
            speed: 5.8,
            angle: -Math.PI / 2,
            turnRate: 0.05,
            life: 220,
            damage: 45
          });
          window.soundSystem.play('rocket', { volume: 0.40 });
          this.game.addFloatingText('⚠️ SILO CRUISE MISSILE LAUNCHED!', e.x, e.y - 35, '#ff3333');
        }
      } else if (e.type === 'radome') {
        e.spinAngle = (e.spinAngle || 0) + 0.04;
      } else if (e.type === 'oil_well') {
        e.pumpAngle = (e.pumpAngle || 0) + 0.035;
      } else if (e.type === 'desert_technical') {
        e.fireTimer--;
        if (e.fireTimer <= 0 && p && p.alive) {
          e.fireTimer = (wave === 1 ? (55 + Math.random() * 30) : (Math.max(25, 48 - Math.min(22, wave * 2.5)) + Math.random() * 20));
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 550) {
            const angle = Math.atan2(dy, dx);
            const dmg = wave === 1 ? 5 : (8 + Math.min(14, (wave - 1) * 1.6));
            this.enemyBullets.push({
              x: e.x,
              y: e.y - 8,
              vx: Math.cos(angle) * (wave === 1 ? 7.2 : 8.5),
              vy: Math.sin(angle) * (wave === 1 ? 7.2 : 8.5),
              damage: Math.round(dmg),
              life: 90,
              alive: true
            });
          }
        }
      }

      if (!p || !p.alive) continue;

      const dist = Math.hypot(p.x - e.x, p.y - e.y);

      // 1. SAM Sites (Radar Guided Surface-to-Air Missile Batteries)
      let samRange = e.radarRange;
      if (p.model === 'cobra' && p.stealthLevel > 0 && p.y > terrain.getHeightAt(p.x) - 140) {
        samRange *= 0.60; // Nap-of-the-Earth stealth masks Cobra from SAM radar!
      }
      if (e.type === 'sam_site' && dist < samRange && this.samMissiles.length < 7) {
        e.reloadTimer--;
        if (e.reloadTimer <= 0) {
          e.reloadTimer = Math.max(50, 130 - Math.min(80, wave * 12)) + Math.random() * 35;
          this.launchSamMissile(e.x, e.y - 12, wave);

          // Advanced SAM Sites fire a 2-missile salvo at Wave 3+
          if (wave >= 3 && Math.random() < Math.min(0.85, 0.45 + (wave - 3) * 0.12)) {
            setTimeout(() => {
              if (e.alive && this.samMissiles.length < 8) {
                this.launchSamMissile(e.x + 8, e.y - 12, wave);
              }
            }, 260);
          }
        }
      }

      // 1b. S-400 Triumf ("SA-21 Growler" / "Sudarshan Chakra") Defense System
      if (e.type === 's400') {
        e.radarSpin = (e.radarSpin || 0) + 0.055;
        let s400Range = e.radarRange;
        // Nap-of-the-Earth low flying terrain masking reduces radar lock
        if (p && p.alive && p.y > terrain.getHeightAt(p.x) - 130) {
          s400Range *= 0.60;
        }

        const inLockRange = dist < s400Range;
        // Smoothly erect (80° elevation = ~1.38 rad) or lower canisters
        const targetAngle = inLockRange ? (Math.PI * 0.44) : 0;
        e.erectAngle += (targetAngle - e.erectAngle) * 0.08;
        e.jacksDeployed = e.erectAngle > 0.12;

        if (inLockRange && this.samMissiles.length < 9) {
          e.reloadTimer--;
          if (e.reloadTimer <= 0) {
            e.reloadTimer = Math.max(150, Math.round(300 - Math.min(150, (wave - 1) * 35))) + Math.random() * 40;

            // Cold-launch salvo
            for (let s = 0; s < e.salvoCount; s++) {
              setTimeout(() => {
                if (e.alive && this.samMissiles.length < 10) {
                  const tubeOffsetX = (s % 2 === 0 ? -6 : 6);
                  this.launchS400Missile(e.x + tubeOffsetX, e.y - 20, wave, e.missileDamage, e.missileSpeed, e.turnRate);
                }
              }, s * 280);
            }
          }
        }
      }

      // 1c. Akash Air Defence System (Medium-Range Ramjet Mobile SAM)
      if (e.type === 'akash') {
        e.radarSpin = (e.radarSpin || 0) + 0.06;
        let akashRange = e.radarRange || 850;
        if (p && p.alive && p.y > terrain.getHeightAt(p.x) - 100) {
          akashRange *= 0.70; // Low-altitude terrain masking
        }

        const inLock = dist < akashRange;
        if (inLock && p) {
          const lead = 14;
          const tx = p.x + p.vx * lead;
          const ty = p.y + p.vy * lead;
          const targetAngle = Math.atan2(ty - e.y, tx - e.x);
          e.aimAngle = (e.aimAngle || -0.65) + (targetAngle - (e.aimAngle || -0.65)) * 0.05;
        }

        if (inLock && this.samMissiles.length < 10) {
          e.reloadTimer--;
          if (e.reloadTimer <= 0) {
            e.reloadTimer = Math.max(160, Math.round(280 - (wave - 1) * 25)) + Math.random() * 40;
            this.launchAkashMissile(e.x, e.y - 16, wave, e.missileDamage, e.missileSpeed, e.turnRate, e.aimAngle);
            if (this.game.addFloatingText) {
              this.game.addFloatingText('⚠️ AKASH RAMJET SAM LAUNCH!', e.x, e.y - 32, '#ff8800');
            }
          }
        }
      }

      // 1d. 2K22 Tunguska SPAAGM (Dual 30mm Flak + 8 Missiles)
      if (e.type === 'tunguska') {
        e.radarSpin = (e.radarSpin || 0) + 0.09;

        if (p) {
          const lead = 10;
          const tx = p.x + p.vx * lead;
          const ty = p.y + p.vy * lead;
          const targetAngle = Math.atan2(ty - e.y, tx - e.x);
          e.aimAngle = (e.aimAngle || -0.65) + (targetAngle - (e.aimAngle || -0.65)) * 0.08;
        }

        // Long/Medium Range (280 to 720px): Fires 9M311 Surface-to-Air Missiles
        if (dist >= 280 && dist < 720 && this.samMissiles.length < 10) {
          e.missileTimer = (e.missileTimer || 180) - 1;
          if (e.missileTimer <= 0) {
            e.missileTimer = Math.max(150, Math.round(250 - (wave - 1) * 22)) + Math.random() * 35;
            this.launchTunguskaMissile(e.x + (Math.random() < 0.5 ? -10 : 10), e.y - 18, wave, e.aimAngle);
            if (this.game.addFloatingText) {
              this.game.addFloatingText('⚠️ 2K22 TUNGUSKA 9M311 MISSILE!', e.x, e.y - 32, '#ff3333');
            }
          }
        }

        // Close Range (< 440px): Twin 30mm Autocannons engage in rapid flak bursts!
        if (dist < 440) {
          e.flakTimer = (e.flakTimer || 25) - 1;
          if (e.flakTimer <= 0) {
            e.flakTimer = Math.max(14, 28 - Math.min(12, wave * 2)) + Math.random() * 10;
            const aim = e.aimAngle || -0.65;
            // Twin muzzle blasts
            for (let b = -1; b <= 1; b += 2) {
              this.enemyBullets.push({
                x: e.x + b * 6,
                y: e.y - 16,
                vx: Math.cos(aim + b * 0.02) * 12.0,
                vy: Math.sin(aim + b * 0.02) * 12.0,
                damage: 12,
                isFlak: true,
                blastRadius: 28,
                life: 60,
                alive: true
              });
            }
            if (window.soundSystem && typeof window.soundSystem.play20mm === 'function') {
              window.soundSystem.play20mm();
            }
          }
        }
      }

      // 2. ZSU-57 Anti-Aircraft Flak Batteries
      if (e.type === 'zsu57' && dist < e.range) {
        e.fireTimer--;
        if (e.fireTimer <= 0) {
          if (wave === 1) {
            // Wave 1: Active flak screen! Frequent air bursts (~1.2s-1.8s) with gentle chip damage (9 HP)
            e.fireTimer = 75 + Math.random() * 35;
            const scatterX = (Math.random() - 0.5) * 45;
            const scatterY = (Math.random() - 0.5) * 30;
            this.fireZsuFlak(e.x, e.y - 10, p.x + scatterX, p.y + scatterY, false, 1);
          } else {
            e.fireTimer = Math.max(22, (e.isVeteran ? 32 : 50) - Math.min(30, wave * 4.2)) + Math.random() * 18;
            const leadFactor = Math.min(22, 5 + wave * 2.4);
            const leadX = p.x + p.vx * leadFactor;
            const leadY = p.y + p.vy * leadFactor;
            this.fireZsuFlak(e.x, e.y - 10, leadX, leadY, e.isVeteran, wave);
          }
        }
      }

      // 3. Tanks (Multi-Tier Ground Armor: T-34, Sherman, M1A2 Abrams, T-90M Proryv, 2S35 Koalitsiya, TOS-1A Buratino)
      if (e.type === 'tank') {
        // Dynamic Turret Angle Tracking & Elevation
        const leadFrames = Math.min(22, dist / 9.5);
        const aimX = p.x + p.vx * leadFrames;
        const aimY = p.y + p.vy * leadFrames;
        const targetAngle = Math.atan2(aimY - (e.y - 10), aimX - e.x);
        e.turretAngle = (e.turretAngle || -0.35) + (targetAngle - (e.turretAngle || -0.35)) * 0.08;

        // Recoil decay
        if (e.recoil > 0) e.recoil = Math.max(0, e.recoil - 0.22);
        if (e.smokeCooldown > 0) e.smokeCooldown--;

        // Repositioning movement when damaged
        if (e.repositionTimer > 0) {
          e.repositionTimer--;
          e.x += e.speed;
          e.y = terrain.getHeightAt(e.x) - 8;
          if (e.repositionTimer === 0) e.speed = 0;
        }

        // Tactical Smoke Screen (M1A2 Abrams)
        if (e.subType === 'abrams' && p.lockedTarget === e && e.smokeCooldown <= 0 && dist < 650) {
          this.deployTankSmoke(e);
          e.smokeCooldown = 420;
        }

        // Firing within engagement range
        const maxRange = (e.subType === 'koalitsia' ? 780 : (e.subType === 'buratino' ? 700 : (e.subType === 'abrams' || e.subType === 't90' ? 660 : 500)));
        if (dist < maxRange) {
          e.fireTimer--;
          if (e.fireTimer <= 0) {
            e.fireTimer = (wave === 1 ? (75 + Math.random() * 35) : (Math.max(32, 68 - Math.min(38, wave * 4)) + Math.random() * 25));
            this.fireTankWeapon(e, p, wave, aimX, aimY, targetAngle);
          }
        }
      } else if (e.type === 'jeep' && dist < 480) {
        // Armed Jeeps: rapid peppery machine-gun bursts, 4 HP on Wave 1 scaling to 8-16 HP
        e.fireTimer--;
        if (e.fireTimer <= 0) {
          e.fireTimer = (wave === 1 ? (60 + Math.random() * 30) : (Math.max(25, 55 - Math.min(35, wave * 4)) + Math.random() * 20));
          this.fireGroundBullet(e.x, e.y - 6, p.x, p.y, false, wave, 'jeep');
        }
      }

      // 4. Fortified Bunkers (Heavy roof turret at Wave 4+)
      if (e.type === 'bunker' && e.hasTurret && dist < 520) {
        e.fireTimer--;
        if (e.fireTimer <= 0) {
          e.fireTimer = Math.max(40, 80 - Math.min(40, wave * 4)) + Math.random() * 30;
          this.fireGroundBullet(e.x, e.y - 16, p.x, p.y, false, wave, 'bunker');
        }
      }

      // 5. BM-21 Grad MLRS Katyusha Rocket Artillery Trucks
      if (e.type === 'mlrs_truck' && dist < 680) {
        e.fireTimer = (e.fireTimer || 100) - 1;
        if (e.fireTimer <= 0) {
          e.fireTimer = 380 + Math.random() * 100;
          for (let r = 0; r < 6; r++) {
            setTimeout(() => {
              if (e.alive) {
                const launchAngle = -Math.PI * 0.42 + (Math.random() - 0.5) * 0.25;
                const launchSpeed = 9.0 + Math.random() * 2.2;
                this.enemyBullets.push({
                  x: e.x,
                  y: e.y - 12,
                  vx: Math.cos(launchAngle) * launchSpeed,
                  vy: Math.sin(launchAngle) * launchSpeed,
                  isMlrsRocket: true,
                  damage: 22,
                  life: 140,
                  alive: true
                });
                if (window.soundSystem && typeof window.soundSystem.playRocketExplo === 'function') {
                  window.soundSystem.playRocketExplo();
                }
              }
            }, r * 160);
          }
          if (this.game.addFloatingText) {
            this.game.addFloatingText('⚠️ BM-21 GRAD 6-ROCKET SALVO!', e.x, e.y - 30, '#ff6600');
          }
        }
      }

      // 6. ZSU-23-4 Shilka Quad Radar Flak Tank
      if (e.type === 'shilka' && dist < 540) {
        e.radarAngle = (e.radarAngle || 0) + 0.08;
        e.fireTimer = (e.fireTimer || 60) - 1;
        if (e.fireTimer <= 0) {
          e.fireTimer = 30 + Math.random() * 20;
          const leadFactor = 12;
          const tx = p.x + p.vx * leadFactor;
          const ty = p.y + p.vy * leadFactor;
          const aimAngle = Math.atan2(ty - e.y, tx - e.x);
          for (let b = 0; b < 4; b++) {
            const spread = (b - 1.5) * 0.04;
            this.enemyBullets.push({
              x: e.x + (b - 1.5) * 3,
              y: e.y - 14,
              vx: Math.cos(aimAngle + spread) * 11.0,
              vy: Math.sin(aimAngle + spread) * 11.0,
              damage: 10,
              isFlak: true,
              blastRadius: 26,
              life: 65,
              alive: true
            });
          }
          if (window.soundSystem && typeof window.soundSystem.play20mm === 'function') {
            window.soundSystem.play20mm();
          }
        }
      }

      // 7. Phalanx C-RAM CIWS (Counter-Rocket, Artillery & Mortar) Air Defense
      if (e.type === 'phalanx_ciws') {
        e.radarAngle = ((e.radarAngle || 0) + 0.10) % (Math.PI * 2);
        if (e.interceptCooldown > 0) e.interceptCooldown--;
        if (e.fireCooldown > 0) e.fireCooldown--;

        let interceptTarget = null;
        const weapons = this.game.weapons;
        if (weapons) {
          if (weapons.bombs && weapons.bombs.length > 0) {
            interceptTarget = weapons.bombs.find(b => b.alive && Math.hypot(b.x - e.x, b.y - e.y) < 320);
          }
          if (!interceptTarget && weapons.clusterBombs && weapons.clusterBombs.length > 0) {
            interceptTarget = weapons.clusterBombs.find(cb => cb.alive && Math.hypot(cb.x - e.x, cb.y - e.y) < 320);
          }
          if (!interceptTarget && weapons.rockets && weapons.rockets.length > 0) {
            interceptTarget = weapons.rockets.find(r => r.alive && Math.hypot(r.x - e.x, r.y - e.y) < 340);
          }
        }

        if (interceptTarget && e.interceptCooldown <= 0) {
          e.interceptCooldown = 10;
          e.barrelAngle = Math.atan2(interceptTarget.y - e.y, interceptTarget.x - e.x);
          this.fireCiwsTracer(e.x, e.y - 14, interceptTarget.x, interceptTarget.y);
          if (Math.random() < 0.40) {
            interceptTarget.alive = false;
            weapons.createExplosion(interceptTarget.x, interceptTarget.y, 'small', 25);
            window.soundSystem.play('smboom', { volume: 0.7 });
            if (this.game.addFloatingText) {
              this.game.addFloatingText('⚠️ C-RAM INTERCEPTED ORDNANCE! ⚠️', interceptTarget.x, interceptTarget.y - 20, '#ff3333');
            }
          }
        } else if (p && p.alive && dist < 440 && p.y < e.y) {
          e.barrelAngle = Math.atan2(p.y - e.y, p.x - e.x);
          if (e.fireCooldown <= 0) {
            e.fireCooldown = 16;
            this.fireCiwsTracer(e.x, e.y - 14, p.x, p.y);
          }
        }
      }

      // 8. Pantsir-S1 (SA-22 Greyhound) Mobile Gun-Missile Air Defense
      if (e.type === 'pantsir') {
        e.radarSpin = ((e.radarSpin || 0) + 0.08) % (Math.PI * 2);
        if (e.cannonCooldown > 0) e.cannonCooldown--;
        if (e.missileCooldown > 0) e.missileCooldown--;
        if (e.interceptCooldown > 0) e.interceptCooldown--;

        const weapons = this.game.weapons;
        let interceptTarget = null;
        if (weapons && e.interceptCooldown <= 0) {
          if (weapons.bombs && weapons.bombs.length > 0) {
            interceptTarget = weapons.bombs.find(b => b.alive && Math.hypot(b.x - e.x, b.y - e.y) < 320);
          }
          if (!interceptTarget && this.drones && this.drones.length > 0) {
            interceptTarget = this.drones.find(d => d.alive && Math.hypot(d.x - e.x, d.y - e.y) < 280);
          }
          if (!interceptTarget && weapons.rockets && weapons.rockets.length > 0) {
            interceptTarget = weapons.rockets.find(r => r.alive && Math.hypot(r.x - e.x, r.y - e.y) < 320);
          }
        }

        if (interceptTarget && e.interceptCooldown <= 0) {
          e.interceptCooldown = 12;
          e.trackingRadarAngle = Math.atan2(interceptTarget.y - e.y, interceptTarget.x - e.x);
          this.firePantsirAutocannon(e.x, e.y - 14, interceptTarget.x, interceptTarget.y);
          if (Math.random() < 0.42) {
            interceptTarget.alive = false;
            weapons.createExplosion(interceptTarget.x, interceptTarget.y, 'small', 25);
            window.soundSystem.play('smboom', { volume: 0.65 });
            if (this.game.addFloatingText) {
              this.game.addFloatingText('⚡ PANTSIR INTERCEPTED ORDNANCE! ⚡', interceptTarget.x, interceptTarget.y - 20, '#ffaa00');
            }
          }
        } else if (p && p.alive && dist < 950) {
          e.trackingRadarAngle = Math.atan2(p.y - e.y, p.x - e.x);
          // 1. Launch 57E6 hypervelocity missile if in range
          if (e.missileCooldown <= 0 && this.samMissiles.length < 10) {
            e.missileCooldown = Math.max(160, 280 - wave * 22) + Math.random() * 60;
            this.launchPantsirMissile(e.x, e.y - 18, wave);
          }
          // 2. Twin 30mm 2A38M autocannon burst if aircraft is low (within 460px)
          if (dist < 460 && e.cannonCooldown <= 0 && p.y < e.y) {
            e.cannonCooldown = 18;
            this.firePantsirAutocannon(e.x, e.y - 14, p.x, p.y);
          }
        }
      }
    }

    // 1.5 Update Strategic Supersonic Bombers (Tu-22M3 Backfire Airborne Bosses)
    this.updateBombers();

    // 1.6 Update Kirov-Class Armored War Zeppelin Dreadnoughts (Giant Airborne Bosses from Aircraft Evolution REA)
    this.updateZeppelins();

    // 2. Update SAM Guided Missiles
    for (let i = this.samMissiles.length - 1; i >= 0; i--) {
      const m = this.samMissiles[i];

      // Handle S-400 Two-Stage Cold Launch Physics
      if (m.isS400 && m.phase === 'cold_launch') {
        m.coldTimer--;
        m.x += m.vx;
        m.y += m.vy;
        m.vy += 0.12; // Cold-gas pneumatic deceleration near apex

        // Pneumatic cold gas puff trail
        if (m.coldTimer % 3 === 0 && this.game.weapons && this.game.weapons.sparks) {
          this.game.weapons.sparks.push({
            x: m.x,
            y: m.y + 6,
            vx: (Math.random() - 0.5) * 1.4,
            vy: Math.random() * 0.8 + 0.4,
            color: 'rgba(235, 248, 255, 0.85)',
            life: 16,
            maxLife: 16
          });
        }

        if (m.coldTimer <= 0) {
          // Transition to Stage 2: Main Solid Rocket Motor Ignition!
          m.phase = 'powered';
          m.isIgnited = true;
          // Hypersonic ignition kick scaled with wave
          m.speed = Math.min(m.maxSpeed, 7.5 + (wave - 1) * 1.3);

          if (window.soundSystem && typeof window.soundSystem.playS400Ignition === 'function') {
            window.soundSystem.playS400Ignition();
          } else if (window.soundSystem) {
            window.soundSystem.play('lgboom', { volume: 0.5 });
          }

          // Ignition shockwave burst ring & smoke ring
          if (this.game.weapons && this.game.weapons.sparks) {
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * Math.PI * 2;
              this.game.weapons.sparks.push({
                x: m.x,
                y: m.y + 4,
                vx: Math.cos(a) * 3.8,
                vy: Math.sin(a) * 3.8,
                color: '#ff7700',
                life: 18,
                maxLife: 18
              });
            }
          }
        }
        continue;
      }

      let targetX = p ? p.x : m.x + Math.cos(m.angle) * 100;
      let targetY = p ? p.y : m.y + Math.sin(m.angle) * 100;

      for (const fl of this.game.weapons.flares) {
        if (Math.hypot(fl.x - m.x, fl.y - m.y) < 220) {
          targetX = fl.x;
          targetY = fl.y;
          break;
        }
      }

      const desiredAngle = Math.atan2(targetY - m.y, targetX - m.x);
      let diff = desiredAngle - m.angle;
      if (isNaN(diff) || !isFinite(diff)) diff = 0;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const agileTurn = m.turnRate + Math.min(0.02, wave * 0.002);
      m.angle += Math.max(-agileTurn, Math.min(agileTurn, diff));
      if (isNaN(m.angle) || !isFinite(m.angle)) m.angle = 0;
      const topSpeed = m.maxSpeed;
      const accelRate = m.isS400 ? 0.42 : (m.isPantsir ? 0.35 : (m.isAkash ? 0.28 : (m.isKh22 ? 0.22 : 0.18)));
      if (m.speed < topSpeed) m.speed = Math.min(topSpeed, m.speed + accelRate);

      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life--;

      // S-400 Hypersonic White-Hot Plasma Wake
      if (m.isS400 && this.game.weapons && this.game.weapons.sparks && m.speed > 8.0) {
        this.game.weapons.sparks.push({
          x: m.x - Math.cos(m.angle) * 16,
          y: m.y - Math.sin(m.angle) * 16,
          vx: -Math.cos(m.angle) * 3.5 + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(m.angle) * 3.5 + (Math.random() - 0.5) * 1.5,
          color: Math.random() < 0.5 ? '#ffffff' : '#00e5ff',
          life: 16,
          maxLife: 16
        });
      }

      // Pantsir 57E6 Cyan Ionization Trail
      if (m.isPantsir && this.game.weapons && this.game.weapons.sparks && m.life % 2 === 0) {
        this.game.weapons.sparks.push({
          x: m.x - Math.cos(m.angle) * 12,
          y: m.y - Math.sin(m.angle) * 12,
          vx: -Math.cos(m.angle) * 2.5 + (Math.random() - 0.5) * 1.2,
          vy: -Math.sin(m.angle) * 2.5 + (Math.random() - 0.5) * 1.2,
          color: '#38bdf8',
          life: 12,
          maxLife: 12
        });
      }

      // Kh-22 Heavy Cruise Missile Billowing Dense Smoke & Fire Exhaust
      if (m.isKh22 && this.game.weapons && this.game.weapons.sparks) {
        this.game.weapons.sparks.push({
          x: m.x - Math.cos(m.angle) * 20,
          y: m.y - Math.sin(m.angle) * 20,
          vx: -Math.cos(m.angle) * 3.0 + (Math.random() - 0.5) * 1.8,
          vy: -Math.sin(m.angle) * 3.0 + (Math.random() - 0.5) * 1.8,
          color: Math.random() < 0.6 ? '#ff2200' : '#ff9900',
          life: 20,
          maxLife: 20
        });
      }

      // Akash Ramjet Orange Exhaust Jet Trail
      if (m.isAkash && this.game.weapons && this.game.weapons.sparks && m.life % 2 === 0) {
        this.game.weapons.sparks.push({
          x: m.x - Math.cos(m.angle) * 14,
          y: m.y - Math.sin(m.angle) * 14,
          vx: -Math.cos(m.angle) * 2.2 + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(m.angle) * 2.2 + (Math.random() - 0.5) * 1.5,
          color: Math.random() < 0.6 ? '#ff6600' : '#ffcc00',
          life: 14,
          maxLife: 14
        });
      }

      if (m.y >= terrain.getHeightAt(m.x)) {
        m.alive = false;
        this.game.weapons.createExplosion(m.x, m.y, m.isKh22 ? 'large' : 'medium', m.isKh22 ? 65 : 40);
      }

      if (p && p.alive && m.alive) {
        const pDist = Math.hypot(p.x - m.x, p.y - m.y);
        const hitRadius = m.isKh22 ? 38 : 24;
        if (pDist < hitRadius) {
          m.alive = false;
          this.game.weapons.createExplosion(m.x, m.y, m.isKh22 ? 'nuke' : 'large', m.isKh22 ? 85 : 60);
          window.soundSystem.play(m.isKh22 ? 'bigboom' : 'missilehit', { volume: 0.65 });
          if (p.invulnerableTimer <= 0) {
            const finalDmg = (m.isS400 || m.isAkash || m.isTunguska || m.isPantsir || m.isKh22) ? m.damage : ((m.damage || 45) + Math.min(30, wave * 3.5));
            p.hp -= finalDmg;
            if (p.hp <= 0) {
              const reason = m.isS400 ? 'shot down by S-400 Triumf hypersonic missile' :
                             (m.isPantsir ? 'shot down by Pantsir-S1 57E6 hypervelocity missile' :
                             (m.isKh22 ? 'annihilated by Tu-22M3 Kh-22 supersonic heavy cruise missile' :
                             (m.isAkash ? 'shot down by Akash Ramjet SAM missile' :
                             (m.isTunguska ? 'shot down by 2K22 Tunguska 9M311 missile' : 
                             (m.isAirLaunched ? (m.missileName ? `shot down by ${m.missileName}` : 'shot down by air-to-air missile') : 'shot down by SAM missile')))));
              this.killPlayer(reason);
            }
          }
        }
      }

      if (!m.alive || m.life <= 0) {
        this.samMissiles.splice(i, 1);
      }
    }

    // 3. Update Advanced Enemy Interceptors with Active 6 o'clock Tailing & Pursuit AI
    for (let i = this.migs.length - 1; i >= 0; i--) {
      const mig = this.migs[i];

      if (p && p.alive) {
        const pFacing = Math.cos(p.angle) >= 0 ? 1 : -1;
        const pSpeed = p.currentSpeed || p.baseSpeed || 4.2;
        const tailOffset = mig.tailOffset || 200;
        const vertOffset = mig.verticalOffset || 0;

        // Player's 6 o'clock coordinates (directly behind the tail)
        const targetX = p.x - pFacing * tailOffset;
        const targetY = Math.max(65, Math.min(610, p.y + vertOffset));

        const dx = targetX - mig.x;
        const dy = targetY - mig.y;
        const distToPlayer = Math.hypot(p.x - mig.x, p.y - mig.y);
        const relX = (mig.x - p.x) * pFacing; // negative = behind player (ideal!), positive = in front of player

        // 1. Pugachev's Cobra Supermaneuver Execution
        if (mig.cobraTimer > 0) {
          mig.cobraTimer--;
          // Pitches up nearly 90 degrees, horizontal velocity drops to near zero
          mig.angle = -Math.PI / 2.3;
          mig.vx *= 0.86;
          mig.vy *= 0.90;
          mig.x += mig.vx;
          mig.y += mig.vy;

          // Condensation vapor puffs
          if (mig.cobraTimer % 4 === 0 && this.game.weapons && this.game.weapons.sparks) {
            this.game.weapons.sparks.push({
              x: mig.x,
              y: mig.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: '#ffffff',
              life: 16,
              maxLife: 16
            });
          }
          if (mig.cobraTimer === 0) {
            // Slam down from Cobra with instant maximum afterburner acceleration!
            mig.facing = pFacing;
            mig.angle = pFacing > 0 ? 0 : Math.PI;
            mig.vx = pFacing * (mig.maxSpeed || 11.0);
            mig.afterburner = true;
          }
          continue;
        }

        // Trigger Cobra if player hit airbrake to force an overshoot
        if (mig.hasCobra && relX > -120 && relX < 80 && Math.abs(dy) < 55 && pSpeed < 3.2 && (mig.cobraTimer || 0) === 0) {
          mig.cobraTimer = 40;
          mig.angle = -Math.PI / 2.3;
          mig.vx *= 0.86;
          if (this.game.addFloatingText) {
            this.game.addFloatingText(`★ ${mig.name || 'Su-35'} PUGASHEV'S COBRA MANEUVER! ★`, mig.x, mig.y - 35, '#00ffff');
          }
          continue;
        }

        // 2. Active Tailing AI Logic:
        if (relX <= 20) {
          // Bandit is BEHIND the player (or right on the tail)
          mig.isPursuing = true;
          mig.facing = pFacing;

          // Smooth altitude matching with player flight level
          mig.vy += dy * 0.052;
          mig.vy *= 0.86; // smooth aerodynamic dampening

          // Longitudinal control:
          const distBehind = -relX;
          if (distBehind > tailOffset + 35) {
            // Falling behind -> Kick in afterburners to close distance!
            mig.afterburner = true;
            mig.vx += pFacing * 0.38;
            const topSpd = mig.maxSpeed || 10.5;
            if (Math.abs(mig.vx) > topSpd) mig.vx = pFacing * topSpd;
          } else if (distBehind < tailOffset - 35) {
            // Closing too close -> Throttle back to maintain pursuit formation!
            mig.afterburner = false;
            mig.vx = pFacing * Math.max((mig.baseSpeed || 6.5) * 0.8, pSpeed * 0.94);
          } else {
            // Locked perfectly in the tail pocket!
            mig.afterburner = Math.random() < 0.25;
            mig.vx = pFacing * pSpeed;
          }

          // Pitch angle aligns towards player's rear
          mig.angle = Math.atan2(p.y - mig.y, p.x - mig.x);

          // 3. Autocannon Attacks (Rapid tracer bursts)
          if (distToPlayer < 450 && Math.abs(dy) < 65) {
            if (mig.fireCooldown <= 0) {
              mig.fireCooldown = mig.type === 'su57' ? 14 : (mig.type === 'su35' ? 17 : (mig.type === 'mig29' ? 20 : 25));
              this.fireMigBullet(mig.x, mig.y, p.x, p.y, true, wave, mig.name);
            }
          }

          // 4. Air-to-Air Dogfight Missile Launches
          if (distToPlayer < 520 && Math.abs(dy) < 85 && (mig.missileCooldown || 0) <= 0 && this.samMissiles.length < 8) {
            mig.missileCooldown = mig.type === 'su57' ? 160 : (mig.type === 'su35' ? 200 : (mig.type === 'ka52' ? 220 : 260));
            const mAngle = Math.atan2(p.y - mig.y, p.x - mig.x);
            const mSpeed = mig.type === 'su57' ? 7.6 : (mig.type === 'su35' ? 7.2 : 6.6);
            this.samMissiles.push({
              x: mig.x,
              y: mig.y + (mig.type === 'ka52' ? 6 : 2),
              vx: Math.cos(mAngle) * mSpeed,
              vy: Math.sin(mAngle) * mSpeed,
              angle: mAngle,
              speed: mSpeed,
              turnRate: mig.type === 'su57' ? 0.058 : (mig.type === 'su35' ? 0.050 : 0.042),
              maxSpeed: mig.type === 'su57' ? 9.8 : (mig.type === 'su35' ? 8.8 : 7.8),
              life: 280,
              target: p,
              alive: true,
              isAirLaunched: true,
              missileName: mig.missileType || 'R-73 AAM'
            });
            if (window.soundSystem && typeof window.soundSystem.playMissileShoot === 'function') {
              window.soundSystem.playMissileShoot();
            }
            if (this.game.addFloatingText) {
              this.game.addFloatingText(`⚠️ ${mig.name || 'BANDIT'}: ${mig.missileType || 'AAM'} LAUNCHED!`, mig.x, mig.y - 25, '#ff2222');
            }
          }
        } else {
          // Bandit is in front or overshot! High Yo-Yo Tactical Reversal
          mig.isPursuing = false;
          mig.afterburner = true;

          if (!mig.yoYoPhase) mig.yoYoPhase = 'climb';

          if (mig.yoYoPhase === 'climb') {
            // High Yo-Yo: Zoom climb to trade excessive speed for altitude advantage
            mig.vy -= 0.38;
            mig.vx *= 0.93;
            if (mig.y < p.y - 140 || Math.abs(mig.vx) < 1.4) {
              mig.yoYoPhase = 'invert_dive';
              mig.facing = pFacing;
            }
          } else if (mig.yoYoPhase === 'invert_dive') {
            // Dive back down into player's 6 o'clock turn circle
            mig.vy += 0.35;
            mig.vx += pFacing * 0.45;
            if (mig.y >= p.y - 35 || relX <= 20) {
              mig.yoYoPhase = null; // Re-acquired pursuit pocket!
            }
          }
          mig.angle = Math.atan2(mig.vy, mig.vx);
        }

        // Apply velocities
        mig.x += mig.vx;
        mig.y += mig.vy;

        // Predictive Ground Proximity Sensor (140px lookahead based on flight velocity & direction)
        const lookaheadDist = (mig.vx >= 0 ? 1 : -1) * 140;
        const futureGroundH = this.game.terrain ? this.game.terrain.getHeightAt(mig.x + lookaheadDist) : 600;
        const currentGroundH = this.game.terrain ? this.game.terrain.getHeightAt(mig.x) : 600;
        const minSafetyAlt = Math.min(currentGroundH, futureGroundH) - 90;
        if (mig.y > minSafetyAlt) {
          // Smooth progressive pull-up authority - eliminates suicide crashes into mountain slopes
          const proximityRatio = Math.min(1.0, (mig.y - minSafetyAlt) / 55);
          mig.vy -= 0.65 * (1 + proximityRatio * 1.5);
          if (mig.vy > 0) mig.vy *= 0.65;
          if (mig.y > currentGroundH - 45) {
            mig.y = currentGroundH - 45;
          }
          mig.angle = Math.max(-Math.PI / 3, mig.angle - 0.05);
        }

        // Rotor spin animation for Ka-52 Alligator
        if (mig.type === 'ka52') {
          mig.rotorAngle1 = ((mig.rotorAngle1 || 0) + 0.65) % (Math.PI * 2);
          mig.rotorAngle2 = ((mig.rotorAngle2 || 0) - 0.65) % (Math.PI * 2);
        }
      } else {
        // Player inactive
        mig.x += mig.vx;
        mig.y += mig.vy;
      }

      if (mig.fireCooldown > 0) mig.fireCooldown--;
      if (mig.missileCooldown > 0) mig.missileCooldown--;

      // Despawn if far away
      if (p && Math.abs(mig.x - p.x) > 2400) {
        mig.alive = false;
      }
      if (!mig.alive) this.migs.splice(i, 1);
    }

    // 3.5. Update Mil Mi-24 "Hind" Attack Gunships (Airborne Bosses)
    for (let i = this.hinds.length - 1; i >= 0; i--) {
      const hind = this.hinds[i];
      if (!hind.alive) {
        this.hinds.splice(i, 1);
        continue;
      }

      // Rotor animation and hover floating
      hind.rotorAngle = (hind.rotorAngle || 0) + 0.45;
      hind.hoverTimer = (hind.hoverTimer || 0) + 0.05;

      if (p && p.alive) {
        // Face player
        hind.facing = p.x > hind.x ? 1 : -1;

        // Hover around player at standoff distance (320-390px)
        const targetX = p.x - hind.facing * 350;
        const targetY = Math.max(90, Math.min(270, p.y - 40 + Math.sin(hind.hoverTimer) * 22));

        // Smooth acceleration towards target hover point
        hind.vx += (targetX - hind.x) * 0.005;
        hind.vy += (targetY - hind.y) * 0.008;
        hind.vx = Math.max(-4.2, Math.min(4.2, hind.vx * 0.96));
        hind.vy = Math.max(-3.0, Math.min(3.0, hind.vy * 0.96));

        hind.x += hind.vx;
        hind.y += hind.vy;

        const distToPlayer = Math.hypot(p.x - hind.x, p.y - hind.y);

        // 1. 12.7mm Yak-B Gatling rotary gun burst
        if (distToPlayer < 560) {
          hind.fireCooldown--;
          if (hind.fireCooldown <= 0) {
            hind.burstCount = (hind.burstCount || 0) + 1;
            const aimAngle = Math.atan2(p.y - hind.y, p.x - hind.x);
            const bulletSpeed = 7.5;
            this.enemyBullets.push({
              x: hind.x + (hind.facing > 0 ? 30 : -30),
              y: hind.y + 8,
              vx: Math.cos(aimAngle) * bulletSpeed + (Math.random() - 0.5) * 0.7,
              vy: Math.sin(aimAngle) * bulletSpeed + (Math.random() - 0.5) * 0.7,
              life: 90,
              damage: 12,
              isTracer: true,
              isFlak: false
            });
            if (window.soundSystem) {
              window.soundSystem.play('shot', { volume: 0.5, rate: 1.4 });
            }

            if (hind.burstCount >= 4) {
              hind.fireCooldown = 65; // Cooldown between bursts
              hind.burstCount = 0;
            } else {
              hind.fireCooldown = 6; // Rapid fire within burst
            }
          }
        }

        // 2. AT-6 Spiral Guided Missile launch
        hind.missileCooldown--;
        if (hind.missileCooldown <= 0 && distToPlayer < 650 && this.samMissiles.length < 8) {
          hind.missileCooldown = 180 + Math.floor(Math.random() * 80); // 3.0 - 4.5 seconds
          this.samMissiles.push({
            x: hind.x + (hind.facing > 0 ? 15 : -15),
            y: hind.y + 12,
            vx: hind.facing * 3.8,
            vy: 0.5,
            angle: hind.facing > 0 ? 0 : Math.PI,
            speed: 5.8,
            life: 280,
            target: p,
            alive: true,
            isAirLaunched: true
          });
          if (window.soundSystem && typeof window.soundSystem.playMissileShoot === 'function') {
            window.soundSystem.playMissileShoot();
          } else if (window.soundSystem) {
            window.soundSystem.play('beep', { volume: 0.8 });
          }
        }
      } else {
        hind.x += hind.vx;
        hind.y += hind.vy;
      }

      // Ground collision prevention
      const groundY = terrain.getHeightAt(hind.x) - 15;
      if (hind.y > groundY) {
        hind.y = groundY;
        hind.vy = -Math.abs(hind.vy) * 0.5;
      }

      // Despawn if player outdistanced by > 2200px
      if (p && Math.abs(hind.x - p.x) > 2200) {
        hind.alive = false;
      }

      if (!hind.alive) {
        this.hinds.splice(i, 1);
      }
    }

    // 4. Update Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // 152mm Automated Howitzer Airburst Flak Burst (2S35 Koalitsiya-SV)
      if (b.isArtilleryFlak && (b.life <= 0 || (b.burstY && Math.abs(b.y - b.burstY) < 30 && b.y < 380))) {
        b.alive = false;
        const blastRad = 36;
        this.game.weapons.createExplosion(b.x, b.y, 'large', blastRad);
        if (p && p.alive && p.invulnerableTimer <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < blastRad + 12) {
          const rawDamage = b.damage || 26;
          const actualDamage = Math.max(1, Math.round(rawDamage * (1 - (p.flakResistance || 0))));
          p.hp -= actualDamage;
          window.soundSystem.play('planehit', { volume: 0.7 });
          if (p.hp <= 0) this.killPlayer('2S35 Koalitsiya-SV 152mm airburst shrapnel');
        }
      }

      // Heavy Thermobaric Rocket Blast (TOS-1A Buratino)
      if (b.isThermobaric && (b.life <= 0 || b.y >= terrain.getHeightAt(b.x) || (p && Math.hypot(p.x - b.x, p.y - b.y) < 28))) {
        b.alive = false;
        this.game.weapons.createExplosion(b.x, b.y, 'large', 45);
        if (this.game.weapons.shockwaves) {
          this.game.weapons.shockwaves.push({ x: b.x, y: b.y, radius: 10, maxRadius: 55, speed: 3.5, alpha: 0.9 });
        }
        if (this.game.weapons.createNapalmPool) {
          this.game.weapons.createNapalmPool(b.x, b.y);
        }
        if (p && p.alive && p.invulnerableTimer <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < 45) {
          p.hp -= b.damage || 26;
          window.soundSystem.play('planehit', { volume: 0.8 });
          if (p.hp <= 0) this.killPlayer('TOS-1A Buratino thermobaric firestorm');
        }
      }

      if (b.isFlak && b.life <= 0) {
        const blastRad = b.blastRadius || 24;
        this.game.weapons.createExplosion(b.x, b.y, 'air', blastRad);
        if (p && p.alive && p.invulnerableTimer <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < blastRad + 8) {
          const rawDamage = b.damage !== undefined ? b.damage : (wave === 1 ? 9 : 18);
          const actualDamage = Math.max(1, Math.round(rawDamage * (1 - (p.flakResistance || 0))));
          p.hp -= actualDamage;
          window.soundSystem.play('planehit', { volume: 0.6 });
          if (p.hp <= 0) this.killPlayer('flak shrapnel hit');
        }
      }

      if (p && p.alive && p.invulnerableTimer <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < 14) {
        b.alive = false;
        const rawDamage = b.damage !== undefined ? b.damage : (wave === 1 ? 6 : 12);
        const actualDamage = Math.max(1, Math.round(rawDamage * (1 - (p.flakResistance || 0) * 0.5)));
        p.hp -= actualDamage;
        window.soundSystem.play('planehit', { volume: 0.6 });
        if (p.hp <= 0) this.killPlayer(b.isAPFSDS ? '120mm APFSDS kinetic sabot shell' : (b.isHeavyShell ? 'heavy cannon round' : (b.isBandit ? `${b.banditName} autocannon fire` : (b.isAce ? 'Ace MiG cannon fire' : 'enemy gunfire'))));
      }

      if (!b.alive || b.life <= 0 || b.y >= terrain.getHeightAt(b.x)) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 5. Update Sky & Ground Bonus Parachutes
    for (let i = this.bonusCrates.length - 1; i >= 0; i--) {
      const crate = this.bonusCrates[i];
      crate.y += crate.vy;

      // Parachute gentle swaying in sky wind
      if (!crate.isGrounded) {
        crate.swayOffset = (crate.swayOffset || 0) + 0.05;
        crate.x += Math.sin(crate.swayOffset) * 0.7;
      }
      if (crate.x < 0) crate.x += terrain.mapWidth;
      if (crate.x >= terrain.mapWidth) crate.x -= terrain.mapWidth;

      // Player collection (can fly through it in the sky or grab on the ground!)
      const grabRadius = crate.isGrounded ? 38 : 46;
      if (p && p.alive && Math.hypot(p.x - crate.x, p.y - crate.y) < grabRadius) {
        crate.alive = false;
        this.collectBonus(crate.type);
      }

      // Ground landing
      const groundY = terrain.getHeightAt(crate.x);
      if (crate.y >= groundY - 10) {
        crate.y = groundY - 10;
        crate.vy = 0;
        crate.isGrounded = true;
        crate.groundTimer = (crate.groundTimer !== undefined ? crate.groundTimer : 720) - 1;
        if (crate.groundTimer <= 0) {
          crate.alive = false;
        }
      }

      if (!crate.alive) this.bonusCrates.splice(i, 1);
    }

    // 6. Update Allied AI Wingmen Air Support
    this.updateWingmen();

    // 7. Update Autonomous FPV Kamikaze Strike Drones
    this.updateDrones();
  }

  // Scramble 2 Allied AI Wingmen (Razor 1 & Razor 2) to Assist Player
  spawnWingmenStrike() {
    if (!this.player || !this.player.alive) return false;
    const p = this.player;
    const terrain = this.game.terrain;

    this.wingmen = [
      {
        id: 1,
        callsign: 'RAZOR 1',
        role: 'strafer',
        x: ((p.x - 320) % terrain.mapWidth + terrain.mapWidth) % terrain.mapWidth,
        y: Math.max(60, p.y - 45),
        targetOffsetX: -80,
        targetOffsetY: -35,
        speed: p.currentSpeed * 1.35,
        angle: p.angle,
        state: 'inbound', // 'inbound' | 'attack' | 'depart'
        timer: 0,
        maxTimer: 520,
        fireTimer: 0,
        rocketTimer: 0,
        bombsDropped: 0,
        healedPlayer: false,
        sprite: this.game.sprites['plane2.png'] || this.game.sprites['plane.png'],
        alive: true
      },
      {
        id: 2,
        callsign: 'RAZOR 2',
        role: 'bomber',
        x: ((p.x - 410) % terrain.mapWidth + terrain.mapWidth) % terrain.mapWidth,
        y: Math.min(this.game.terrain.baseGroundY - 80, p.y + 40),
        targetOffsetX: -130,
        targetOffsetY: 35,
        speed: p.currentSpeed * 1.30,
        angle: p.angle,
        state: 'inbound',
        timer: 0,
        maxTimer: 520,
        fireTimer: 0,
        bombTimer: 0,
        bombsDropped: 0,
        healedPlayer: false,
        sprite: this.game.sprites['warthog1.png'] || this.game.sprites['plane.png'],
        alive: true
      }
    ];

    if (window.soundSystem) window.soundSystem.playRadioComms('incoming');
    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('RAZOR 1', 'Razor 1-1 copies Viper Lead, rolling in hot, guns guns guns!', 260, true);
      setTimeout(() => {
        if (this.game.setRadioMessage) {
          this.game.setRadioMessage('RAZOR 2', 'Razor 1-2 on station, weapons bay open, bombs away!', 260, true);
        }
      }, 3500);
    }
    this.game.addFloatingText('★ 👥 ALLIED AIR SUPPORT SCRAMBLED! ★', p.x, p.y - 40, '#55ff55');
    return true;
  }

  // Update Allied AI Wingmen Sortie Physics, Combat AI & Support
  updateWingmen() {
    if (!this.wingmen || this.wingmen.length === 0) return;
    const p = this.player;
    const terrain = this.game.terrain;
    const weapons = this.game.weapons;

    for (let i = this.wingmen.length - 1; i >= 0; i--) {
      const wm = this.wingmen[i];
      wm.timer++;

      // Emergency Player Healing Check: If Player HP is low, wingmen heal & deploy emergency repair!
      if (p && p.alive && p.hp < p.maxHp * 0.55 && !wm.healedPlayer) {
        wm.healedPlayer = true;
        const healAmt = 40;
        p.hp = Math.min(p.maxHp, p.hp + healAmt);

        // Airdrop an emergency repair crate
        this.bonusCrates.push({
          type: 'bonusrepair',
          x: wm.x,
          y: wm.y + 10,
          vy: 0.9,
          swayOffset: 0,
          sprite: this.game.sprites['bonusblast.png'],
          alive: true
        });

        if (window.soundSystem) window.soundSystem.playRadioComms('repair');
        if (this.game.setRadioMessage) {
          this.game.setRadioMessage(wm.callsign, 'Viper Lead taking heavy damage! Airdropping emergency repair stabilizer!', 260, true);
        }
        this.game.addFloatingText('★ 🔧 ALLIED EMERGENCY REPAIR! +40 HP ★', p.x, p.y - 35, '#00ffcc');
      }

      // Movement & States
      if (wm.state === 'inbound' || wm.state === 'attack') {
        if (p && p.alive) {
          const targetX = ((p.x + wm.targetOffsetX) % terrain.mapWidth + terrain.mapWidth) % terrain.mapWidth;
          const targetY = p.y + wm.targetOffsetY;
          let dx = targetX - wm.x;
          // Toroidal shortest-distance wrap across cyclical map boundary
          if (dx > terrain.mapWidth / 2) dx -= terrain.mapWidth;
          if (dx < -terrain.mapWidth / 2) dx += terrain.mapWidth;
          const dy = targetY - wm.y;
          const dist = Math.hypot(dx, dy);

          // Fly towards escort position
          if (dist > 25) {
            const targetAngle = Math.atan2(dy, dx);
            wm.angle += (targetAngle - wm.angle) * 0.06;
          } else {
            wm.angle += (p.angle - wm.angle) * 0.06;
          }
          wm.speed = Math.max(3.5, p.currentSpeed * 1.15 + (dist > 80 ? 0.8 : 0));
        }

        wm.x += Math.cos(wm.angle) * wm.speed;
        wm.y += Math.sin(wm.angle) * wm.speed;

        // Wrap wm.x within mapWidth
        if (wm.x < 0) wm.x += terrain.mapWidth;
        if (wm.x >= terrain.mapWidth) wm.x -= terrain.mapWidth;

        // Ground avoidance
        const gY = terrain.getHeightAt(wm.x);
        if (wm.y > gY - 45) {
          wm.y = gY - 45;
          if (wm.angle > 0) wm.angle = -0.15;
        }
        if (wm.y < 45) {
          wm.y = 45;
          if (wm.angle < 0) wm.angle = 0.15;
        }

        // Transition from inbound to attack
        if (wm.timer > 60 && wm.state === 'inbound') {
          wm.state = 'attack';
          if (wm.id === 1) {
            if (window.soundSystem) window.soundSystem.playRadioComms('attack');
            if (this.game.setRadioMessage) {
              this.game.setRadioMessage('RAZOR 1', 'ENGAGING HOSTILE TARGETS! WEAPONS FREE!');
            }
          }
        }

        // Combat behavior in attack state
        if (wm.state === 'attack') {
          // Razor 1: Strafer with 30mm AP cannon and Hydra rockets
          if (wm.role === 'strafer') {
            wm.fireTimer = (wm.fireTimer || 0) + 1;
            wm.rocketTimer = (wm.rocketTimer || 0) + 1;

            if (wm.fireTimer % 10 === 0 && weapons) {
              weapons.fireGau8(wm.x + 20, wm.y, wm.angle, wm.speed, true);
            }
            if (wm.rocketTimer % 55 === 0 && weapons) {
              weapons.fireRocket(wm.x + 24, wm.y + 4, wm.angle, wm.speed, 95);
            }

            // Target airborne hostile MiGs
            for (const mig of this.migs) {
              if (mig.alive && Math.abs(mig.x - wm.x) < 550) {
                if (Math.random() < 0.04 && weapons) {
                  weapons.fireRocket(wm.x + 25, wm.y, Math.atan2(mig.y - wm.y, mig.x - wm.x), wm.speed + 4, 120);
                }
              }
            }
          }

          // Razor 2: Bomber dropping heavy bombs & cluster canisters on ground units
          if (wm.role === 'bomber') {
            wm.bombTimer = (wm.bombTimer || 0) + 1;
            // Check if enemies are beneath or ahead
            const hasEnemyBelow = this.enemies.some(
              (e) => e.alive && Math.abs(e.x - (wm.x + 80)) < 160 && e.type !== 'tree'
            );

            if (hasEnemyBelow && wm.bombTimer >= 35 && wm.bombsDropped < 8 && weapons) {
              wm.bombTimer = 0;
              wm.bombsDropped++;
              const vx = Math.cos(wm.angle) * wm.speed;
              const vy = Math.sin(wm.angle) * wm.speed + 1.0;
              if (wm.bombsDropped % 2 === 0) {
                weapons.dropClusterBomb(wm.x, wm.y + 12, vx, vy, 4);
              } else {
                weapons.dropIronBomb(wm.x, wm.y + 12, vx, vy, 1);
              }
            }
          }
        }

        // Transition to depart
        if (wm.timer > 380 && wm.state === 'attack') {
          wm.state = 'depart';
          if (weapons && typeof weapons.deployFlare === 'function') {
            weapons.deployFlare(wm.x - 15, wm.y, -wm.speed * 0.4, 1.2);
            weapons.deployFlare(wm.x - 20, wm.y - 8, -wm.speed * 0.4, -1.2);
          }
          if (wm.id === 1) {
            if (window.soundSystem) window.soundSystem.playRadioComms('rtb');
            if (this.game.setRadioMessage) {
              this.game.setRadioMessage('RAZOR FLIGHT', 'Razor flight Winchester, bingo fuel, RTB! Good hunting, Viper Lead!', 240, true);
            }
          }
        }

      } else if (wm.state === 'depart') {
        // High speed zoom climb out into the clouds
        wm.speed = Math.min(10.5, wm.speed + 0.12);
        wm.angle = Math.max(-0.65, wm.angle - 0.035);
        wm.x += Math.cos(wm.angle) * wm.speed;
        wm.y += Math.sin(wm.angle) * wm.speed;

        // Wrap wm.x
        if (wm.x < 0) wm.x += terrain.mapWidth;
        if (wm.x >= terrain.mapWidth) wm.x -= terrain.mapWidth;

        if (wm.y < 30 || wm.timer >= wm.maxTimer) {
          wm.alive = false;
        }
      }

      if (!wm.alive) {
        this.wingmen.splice(i, 1);
      }
    }
  }

  // === AUTONOMOUS FPV KAMIKAZE COMBAT DRONE SYSTEM ===

  deployFpvDroneStrike() {
    if (!this.player || !this.player.alive) return false;
    const p = this.player;

    // Search for highest-threat strategic target: S-400 > CIWS > Shilka > Tunguska > Tank > Convoy
    let target = null;
    let highestPriority = -1;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      let prio = 0;
      if (e.type === 's400') prio = 100;
      else if (e.type === 'phalanx_ciws') prio = 95;
      else if (e.type === 'pantsir') prio = 93;
      else if (e.type === 'shilka') prio = 90;
      else if (e.type === 'tunguska') prio = 85;
      else if (e.type === 'akash' || e.type === 'sam_site') prio = 80;
      else if (e.type === 'armored_train') prio = 75;
      else if (e.type === 'tank') prio = 60;
      else if (e.type === 'mlrs_truck') prio = 55;
      else prio = 20;

      // Prefer targets in front of aircraft
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      prio -= dist * 0.02;

      if (prio > highestPriority) {
        highestPriority = prio;
        target = e;
      }
    }

    if (!target) {
      const livingBomber = this.bombers.find(b => b.alive);
      if (livingBomber) target = livingBomber;
      else {
        const livingHind = this.hinds.find(h => h.alive);
        if (livingHind) target = livingHind;
        else {
          const livingMig = this.migs.find(m => m.alive);
          if (livingMig) target = livingMig;
        }
      }
    }

    const launchVx = Math.cos(p.angle) * (p.currentSpeed + 2.5);
    const launchVy = Math.sin(p.angle) * p.currentSpeed - 2.8;

    const drone = {
      x: p.x - Math.cos(p.angle) * 15,
      y: p.y - 12,
      vx: launchVx,
      vy: launchVy,
      angle: p.angle,
      speed: 6.8,
      target,
      state: target ? 'TRACKING' : 'SEARCHING',
      fuel: 480, // ~8s loiter time
      wobbleTimer: 0,
      rotorSpin: 0,
      callsign: 'FPV-7 PHOENIX',
      alive: true
    };

    this.drones.push(drone);

    window.soundSystem.play('bombdrop', { volume: 0.8, pitch: 1.6 });
    if (this.game.setRadioMessage) {
      const tgtName = target ? (target.name || target.type.toUpperCase().replace('_', ' ')) : 'HOSTILE CONVOY';
      this.game.setRadioMessage('DRONE OP', `[FPV-7 PHOENIX DEPLOYED]: Quadcopter armed with HEAT warhead! Locked on ${tgtName}!`, 260);
    }
    if (this.game.addFloatingText) {
      this.game.addFloatingText('⚡ FPV COMBAT DRONE AIRBORNE!', p.x, p.y - 45, '#00ffff');
    }

    return true;
  }

  updateDrones() {
    if (!this.drones || this.drones.length === 0) return;
    const terrain = this.game.terrain;

    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.fuel--;
      d.rotorSpin = (d.rotorSpin + 1.2) % (Math.PI * 2);
      d.wobbleTimer += 0.12;

      // Validate target
      if (d.target && (!d.target.alive || (!this.enemies.includes(d.target) && !this.bombers.includes(d.target) && !this.hinds.includes(d.target) && !this.migs.includes(d.target)))) {
        d.target = this.bombers.find(b => b.alive) || this.enemies.find(e => e.alive && this.isObjectiveTarget(e)) || null;
      }

      if (d.target && d.target.alive) {
        // High-speed proportional navigation homing
        const targetX = d.target.x;
        const targetY = d.target.y - 10;
        const angleToTarget = Math.atan2(targetY - d.y, targetX - d.x);

        let angleDiff = angleToTarget - d.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        d.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.14);

        // Terminal dive acceleration
        const distToTgt = Math.hypot(targetX - d.x, targetY - d.y);
        if (distToTgt < 350) {
          d.state = 'TERMINAL_DIVE';
          d.speed = Math.min(13.8, d.speed + 0.38);
        } else {
          d.speed = Math.min(9.5, d.speed + 0.16);
        }

        d.vx = Math.cos(d.angle) * d.speed;
        d.vy = Math.sin(d.angle) * d.speed;

        // Smoke / Motor spark trail
        if (d.fuel % 3 === 0 && this.game.weapons && this.game.weapons.sparks) {
          this.game.weapons.sparks.push({
            x: d.x,
            y: d.y,
            vx: -d.vx * 0.2 + (Math.random() - 0.5) * 1.5,
            vy: -d.vy * 0.2 + (Math.random() - 0.5) * 1.5,
            color: '#88eeff',
            life: 14,
            maxLife: 14
          });
        }

        // Direct hit detection
        if (distToTgt < 24) {
          d.alive = false;
          this.detonateFpvDrone(d, d.target);
          this.drones.splice(i, 1);
          continue;
        }
      } else {
        d.vx *= 0.98;
        d.vy += 0.08;
      }

      d.x += d.vx;
      d.y += d.vy;

      // Ground impact check
      const groundH = terrain ? terrain.getHeightAt(d.x) : 600;
      if (d.y >= groundH - 6 || d.fuel <= 0) {
        d.alive = false;
        this.detonateFpvDrone(d, null);
        this.drones.splice(i, 1);
      }
    }
  }

  detonateFpvDrone(d, hitTarget) {
    window.soundSystem.play('bigboom', { volume: 0.95 });
    this.game.weapons.createExplosion(d.x, d.y, 'large', 85);
    const splashHits = this.checkBlastDamage(d.x, d.y, 85, 260) || 0;

    let scoredHit = false;
    if (hitTarget && hitTarget.alive) {
      this.applyDamageToEnemy(hitTarget, 260);
      scoredHit = true;
    } else if (splashHits > 0) {
      scoredHit = true;
    }

    if (scoredHit) {
      this.awardScore(180, 150, d.x, d.y);
      if (this.game.addFloatingText) {
        this.game.addFloatingText('🎯 FPV DRONE DIRECT IMPACT! +$150', d.x, d.y - 30, '#00ffcc');
      }
      if (this.game.setRadioMessage) {
        this.game.setRadioMessage('DRONE OP', '⭐⭐ DIRECT HIT CONFIRMED! Enemy target destroyed by FPV Drone Strike!', 280);
      }
    } else {
      if (this.game.addFloatingText) {
        this.game.addFloatingText('💥 FPV DRONE DETONATED', d.x, d.y - 25, '#88aacc');
      }
    }
  }

  fireCiwsTracer(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.12;
    const speed = 14;
    this.enemyBullets.push({
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: 8,
      isCiws: true,
      life: 55,
      color: '#ff3300'
    });
    if (window.soundSystem) {
      window.soundSystem.playGau8Single ? window.soundSystem.playGau8Single() : window.soundSystem.play('tracer', { volume: 0.4 });
    }
  }

  launchSamMissile(x, y, wave = 1) {
    const maxSpd = 8.0 + Math.min(3.5, (wave - 1) * 0.45);
    const turn = 0.035 + Math.min(0.024, (wave - 1) * 0.0035);
    // SAM missile damage: Wave 1 = 22 HP, Wave 2 = 32 HP, Wave 3 = 42 HP, Wave 4+ = 48-83 HP
    const dmg = wave === 1 ? 22 : (34 + Math.min(42, (wave - 1) * 5));

    this.samMissiles.push({
      x,
      y,
      vx: 0,
      vy: -3.5,
      angle: -Math.PI / 2,
      speed: 3.5,
      maxSpeed: maxSpd,
      turnRate: turn,
      damage: Math.round(dmg),
      life: 300,
      alive: true
    });
    window.soundSystem.play('missilelaunch', { volume: 0.35 });

    if (this.game.setRadioMessage && (!this.game.activeRadioMessage || this.game.activeRadioMessage.timer <= 0)) {
      this.game.setRadioMessage('AWACS', 'MISSILE LAUNCH DETECTED! DROP FLARES [F]!', 180);
    }
  }

  launchS400Missile(x, y, wave = 1, customDmg = null, customSpeed = null, customTurn = null) {
    const dmg = customDmg !== null ? customDmg : Math.round(Math.min(75, 14 + (wave - 1) * 11));
    const maxSpd = customSpeed !== null ? customSpeed : Math.min(18.0, 8.5 + (wave - 1) * 1.75);
    const turn = customTurn !== null ? customTurn : Math.min(0.068, 0.032 + (wave - 1) * 0.007);

    // Stage 1: Cold Launch (Pneumatic gas piston ejection straight up from tube)
    this.samMissiles.push({
      isS400: true,
      phase: 'cold_launch',
      coldTimer: 18,
      isIgnited: false,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -4.8, // Initial vertical ejection pop
      angle: -Math.PI / 2,
      speed: 4.8,
      maxSpeed: maxSpd,
      turnRate: turn,
      damage: dmg,
      life: 380,
      smokeTimer: 0,
      alive: true
    });

    if (window.soundSystem && typeof window.soundSystem.playPneumaticPop === 'function') {
      window.soundSystem.playPneumaticPop();
    } else if (window.soundSystem) {
      window.soundSystem.play('missilelaunch', { volume: 0.35 });
    }

    if (this.game.setRadioMessage && (!this.game.activeRadioMessage || this.game.activeRadioMessage.timer <= 0)) {
      this.game.setRadioMessage('AWACS', '⚠️ S-400 SA-21 GROWLER LAUNCH! DEPLOY COUNTERMEASURES [F]!', 200);
    }
  }

  launchAkashMissile(x, y, wave = 2, customDmg = null, customSpeed = null, customTurn = null, initialAngle = -Math.PI / 3) {
    const dmg = customDmg !== null ? customDmg : Math.round(Math.min(52, 22 + (wave - 1) * 7.5));
    const maxSpd = customSpeed !== null ? customSpeed : Math.min(11.0, 7.0 + (wave - 1) * 0.9);
    const turn = customTurn !== null ? customTurn : Math.min(0.065, 0.038 + (wave - 1) * 0.006);

    this.samMissiles.push({
      isAkash: true,
      isRamjet: true,
      x,
      y,
      angle: initialAngle,
      speed: 6.0,
      maxSpeed: maxSpd,
      turnRate: turn,
      damage: dmg,
      life: 340,
      alive: true
    });

    if (window.soundSystem) {
      window.soundSystem.play('missilelaunch', { volume: 0.45 });
    }

    if (this.game.setRadioMessage && (!this.game.activeRadioMessage || this.game.activeRadioMessage.timer <= 0)) {
      this.game.setRadioMessage('AWACS', '⚠️ INCOMING AKASH RAMJET SAM! HIGH-G BREAK REQUIRED!', 190);
    }
  }

  launchTunguskaMissile(x, y, wave = 3, initialAngle = -Math.PI / 3) {
    const dmg = Math.round(Math.min(48, 25 + (wave - 1) * 6));
    const maxSpd = Math.min(10.8, 7.5 + (wave - 1) * 0.8);
    const turn = Math.min(0.060, 0.035 + (wave - 1) * 0.006);

    this.samMissiles.push({
      isTunguska: true,
      x,
      y,
      angle: initialAngle,
      speed: 6.8,
      maxSpeed: maxSpd,
      turnRate: turn,
      damage: dmg,
      life: 300,
      alive: true
    });

    if (window.soundSystem) {
      window.soundSystem.play('missilelaunch', { volume: 0.40 });
    }

    if (this.game.setRadioMessage && (!this.game.activeRadioMessage || this.game.activeRadioMessage.timer <= 0)) {
      this.game.setRadioMessage('AWACS', '⚠️ TUNGUSKA 9M311 MISSILE LAUNCH! JINK VERTICALLY!', 190);
    }
  }

  launchPantsirMissile(x, y, wave = 3) {
    const dmg = Math.round(Math.min(58, 26 + (wave - 1) * 8));
    const maxSpd = Math.min(13.8, 8.8 + (wave - 1) * 1.15);
    const turn = Math.min(0.075, 0.042 + (wave - 1) * 0.007);

    this.samMissiles.push({
      isPantsir: true,
      x,
      y,
      angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.35,
      speed: 7.2,
      maxSpeed: maxSpd,
      turnRate: turn,
      damage: dmg,
      life: 300,
      alive: true
    });

    if (window.soundSystem) {
      window.soundSystem.play('missilelaunch', { volume: 0.42 });
    }

    if (this.game.setRadioMessage && (!this.game.activeRadioMessage || this.game.activeRadioMessage.timer <= 0)) {
      this.game.setRadioMessage('AWACS', '⚠️ PANTSIR-S1 57E6 HYPERVELOCITY SAM LAUNCH! BREAK HARD!', 180);
    }
  }

  launchKh22CruiseMissile(x, y, wave = 4, facing = 1) {
    const dmg = Math.round(Math.min(95, 55 + (wave - 1) * 10));
    const maxSpd = Math.min(12.5, 7.8 + (wave - 1) * 1.0);
    const initialAngle = facing > 0 ? 0.35 : Math.PI - 0.35;

    this.samMissiles.push({
      isKh22: true,
      x,
      y,
      angle: initialAngle,
      speed: 6.5,
      maxSpeed: maxSpd,
      turnRate: 0.038,
      damage: dmg,
      life: 420,
      alive: true
    });

    if (window.soundSystem) {
      window.soundSystem.play('missilelaunch', { volume: 0.65 });
    }

    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('AWACS', '🚨 STRATEGIC ALERT: Tu-22M3 BACKFIRE LAUNCHED Kh-22 CRUISE MISSILE!', 260);
    }
  }

  firePantsirAutocannon(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = 12.0;
    const baseDamage = 10;

    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 0.07;
      const bAngle = angle + spread;
      this.enemyBullets.push({
        x: fromX + (Math.random() - 0.5) * 6,
        y: fromY + (Math.random() - 0.5) * 4,
        vx: Math.cos(bAngle) * speed,
        vy: Math.sin(bAngle) * speed,
        isFlak: false,
        isPantsirTracer: true,
        damage: baseDamage,
        life: 65,
        alive: true
      });
    }

    if (window.soundSystem) {
      window.soundSystem.play('cannon', { volume: 0.28 });
    }
  }

  fireZsuFlak(x, y, tx, ty, isVeteran = false, wave = 1) {
    const angle = Math.atan2(ty - y, tx - x);
    const speed = wave === 1 ? 8.6 : (9.2 + Math.min(3.0, (wave - 1) * 0.35));
    // Wave 1: 9 damage (low chip flak, exciting without instant kill)
    // Wave 2: 15 damage
    // Wave 3: 21 damage
    // Wave 4+: up to 38-44 damage
    const flakDmg = wave === 1 ? 9 : (14 + Math.min(26, (wave - 1) * 2.8));
    const blastRad = wave === 1 ? 22 : (26 + Math.min(16, (wave - 1) * 2));

    this.enemyBullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      isFlak: true,
      life: Math.floor(Math.hypot(tx - x, ty - y) / speed),
      damage: Math.round(flakDmg),
      blastRadius: blastRad,
      alive: true
    });

    // Twin flak burst for Veteran ZSU or Wave 4+
    if (isVeteran || wave >= 4) {
      const spread = 0.065;
      this.enemyBullets.push({
        x: x + 6,
        y: y - 2,
        vx: Math.cos(angle + spread) * (speed * 0.95),
        vy: Math.sin(angle + spread) * (speed * 0.95),
        isFlak: true,
        life: Math.floor(Math.hypot(tx - x, ty - y) / (speed * 0.95)) + 3,
        damage: Math.round(flakDmg),
        blastRadius: blastRad,
        alive: true
      });
    }

    window.soundSystem.play('shot', { volume: 0.7, rate: 0.85 });
  }

  // Tactical Smoke Screen Deployed by Modern MBTs (Breaks Player Missile Locks)
  deployTankSmoke(tank) {
    if (!tank || !tank.alive) return;
    if (this.player && this.player.lockedTarget === tank) {
      this.player.lockedTarget = null;
    }
    // Release aerosol smoke screen canisters
    for (let s = -2; s <= 2; s++) {
      this.smokeScreens.push({
        x: tank.x + s * 14 + (Math.random() - 0.5) * 8,
        y: tank.y - 10 + (Math.random() - 0.5) * 8,
        radius: 18 + Math.random() * 8,
        maxLife: 150 + Math.random() * 50,
        life: 150 + Math.random() * 50,
        alpha: 0.85
      });
    }
    if (this.game.addFloatingText) {
      this.game.addFloatingText('💨 SMOKE SCREEN DEPLOYED! (LOCK LOST)', tank.x, tank.y - 30, '#cccccc');
    }
    window.soundSystem.play('button', { volume: 0.4 });
  }

  // Multi-Tier Tank Ordnance & Ballistics Subsystem
  fireTankWeapon(e, p, wave, aimX, aimY, targetAngle) {
    const subType = e.subType || 't34';
    e.recoil = 4.5;

    if (subType === 'abrams') {
      // M1A2 Abrams: 120mm M256 APFSDS Sabot (hypersonic kinetic line, 20-40 HP damage)
      const spd = 11.4;
      this.enemyBullets.push({
        x: e.x + Math.cos(targetAngle) * 22,
        y: e.y - 12 + Math.sin(targetAngle) * 22,
        vx: Math.cos(targetAngle) * spd,
        vy: Math.sin(targetAngle) * spd,
        isHeavyShell: true,
        isAPFSDS: true,
        damage: Math.round(20 + Math.min(20, wave * 2.8)),
        life: 85,
        alive: true
      });
      if (window.soundSystem && typeof window.soundSystem.playTank120mm === 'function') {
        window.soundSystem.playTank120mm();
      }

    } else if (subType === 't90') {
      // T-90M Proryv: 125mm APFSDS + 30% chance for 9M119 Refleks guided missile on Wave 3+
      const spd = 11.8;
      this.enemyBullets.push({
        x: e.x + Math.cos(targetAngle) * 24,
        y: e.y - 12 + Math.sin(targetAngle) * 24,
        vx: Math.cos(targetAngle) * spd,
        vy: Math.sin(targetAngle) * spd,
        isHeavyShell: true,
        isAPFSDS: true,
        damage: Math.round(22 + Math.min(24, wave * 3.0)),
        life: 85,
        alive: true
      });
      if (window.soundSystem && typeof window.soundSystem.playTank120mm === 'function') {
        window.soundSystem.playTank120mm();
      }

      if (wave >= 3 && Math.hypot(p.x - e.x, p.y - e.y) < 640 && this.samMissiles.length < 7 && Math.random() < 0.35) {
        this.launchSamMissile(e.x, e.y - 16, wave);
        if (this.game.addFloatingText) {
          this.game.addFloatingText('⚠️ T-90M 9M119 REFLEKS MISSILE!', e.x, e.y - 28, '#ff3300');
        }
      }

    } else if (subType === 'koalitsia') {
      // 2S35 Koalitsiya-SV: 152mm Automated Howitzer Plunging Airburst Flak Shell
      // Lofts into sky and explodes near player altitude with concussive shrapnel!
      const highArcAngle = targetAngle - 0.28;
      const shellSpeed = 9.2;
      this.enemyBullets.push({
        x: e.x + Math.cos(highArcAngle) * 26,
        y: e.y - 14 + Math.sin(highArcAngle) * 26,
        vx: Math.cos(highArcAngle) * shellSpeed,
        vy: Math.sin(highArcAngle) * shellSpeed,
        isArtilleryFlak: true,
        isFlak: true,
        burstY: p.y + (Math.random() - 0.5) * 40,
        damage: Math.round(26 + Math.min(22, wave * 2.8)),
        life: 110,
        alive: true
      });
      if (window.soundSystem && typeof window.soundSystem.playTank120mm === 'function') {
        window.soundSystem.playTank120mm();
      }

    } else if (subType === 'buratino') {
      // TOS-1A Buratino: 24-tube Thermobaric Rocket Salvo (Fires 6 cascading rockets creating vacuum shockwaves!)
      e.fireTimer = 280 + Math.random() * 80;
      for (let r = 0; r < 6; r++) {
        setTimeout(() => {
          if (e.alive) {
            const launchAngle = -Math.PI * 0.40 + (Math.random() - 0.5) * 0.30;
            const rSpeed = 8.6 + Math.random() * 2.0;
            this.enemyBullets.push({
              x: e.x + (r % 2 === 0 ? -6 : 6),
              y: e.y - 18,
              vx: Math.cos(launchAngle) * rSpeed,
              vy: Math.sin(launchAngle) * rSpeed,
              isThermobaric: true,
              damage: 26,
              life: 130,
              alive: true
            });
            if (window.soundSystem && typeof window.soundSystem.playThermobaricLaunch === 'function') {
              window.soundSystem.playThermobaricLaunch();
            }
          }
        }, r * 150);
      }
      if (this.game.addFloatingText) {
        this.game.addFloatingText('🔥 TOS-1A BURATINO THERMOBARIC SALVO!', e.x, e.y - 34, '#ff2200');
      }

    } else {
      // T-34-85 & Sherman: Classic 85mm / 75mm kinetic cannon
      const spd = 8.8;
      this.enemyBullets.push({
        x: e.x + Math.cos(targetAngle) * 18,
        y: e.y - 10 + Math.sin(targetAngle) * 18,
        vx: Math.cos(targetAngle) * spd,
        vy: Math.sin(targetAngle) * spd,
        damage: Math.round(wave === 1 ? 7 : (12 + Math.min(18, wave * 2.0))),
        life: 90,
        alive: true
      });
      window.soundSystem.play('tankhit', { volume: 0.65 });
    }
  }

  fireGroundBullet(x, y, tx, ty, isT72 = false, wave = 1, shooterType = 'tank') {
    const isJeep = shooterType === 'jeep';
    const isBunker = shooterType === 'bunker';
    const spread = isT72 ? 0.05 : (isJeep ? 0.14 : 0.09);
    const angle = Math.atan2(ty - y, tx - x) + (Math.random() - 0.5) * spread;
    const speed = isT72 ? 9.6 : (isJeep ? 7.2 : 8.2);

    // Starter gentle damage on Wave 1, progressively scaling up with wave level
    let dmg;
    if (isJeep) {
      // Jeep light MG: 4 HP on Wave 1 -> 6 -> 8 -> up to 18 HP
      dmg = wave === 1 ? 4 : (6 + Math.min(12, (wave - 1) * 1.6));
    } else if (isT72) {
      // T-72 Heavy Battle Tank: 26 HP on Wave 3 -> up to 50 HP
      dmg = wave <= 2 ? 18 : (24 + Math.min(24, (wave - 2) * 3.5));
    } else if (isBunker) {
      // Fortified Bunker Turret: 18 HP -> up to 36 HP
      dmg = 16 + Math.min(20, (wave - 3) * 2.5);
    } else {
      // Standard T-55 Medium Tank: 7 HP on Wave 1 -> 13 -> 18 -> up to 38 HP
      dmg = wave === 1 ? 7 : (12 + Math.min(22, (wave - 1) * 2.2));
    }

    this.enemyBullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 75,
      damage: Math.round(dmg),
      isHeavyShell: isT72,
      alive: true
    });
    if (isT72) {
      window.soundSystem.play('shot', { volume: 0.75, rate: 0.7 });
    } else if (!isJeep) {
      window.soundSystem.play('shot', { volume: 0.55, rate: 0.9 });
    }
  }

  fireMigBullet(x, y, tx, ty, isAce = false, wave = 1, banditName = '') {
    const spread = isAce ? 0.04 : 0.08;
    const angle = Math.atan2(ty - y, tx - x) + (Math.random() - 0.5) * spread;
    const speed = 10.5 + Math.min(3.0, (wave - 1) * 0.35);
    const dmg = wave <= 3 ? 15 : (18 + Math.min(20, (wave - 3) * 2.5)) + (isAce ? 8 : 0);

    this.enemyBullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      damage: Math.round(dmg),
      isAce,
      isBandit: !!banditName,
      banditName: banditName || 'Hostile Interceptor',
      alive: true
    });
    window.soundSystem.play('shot', { volume: 0.65, rate: 1.3 });
  }



  checkDirectHit(x, y, radius, damage = 100) {
    for (const z of this.zeppelins) {
      if (z.alive && Math.hypot(z.x - x, z.y - y) < radius + 65) {
        z.hp -= damage;
        z.hitFlashTimer = 3;
        this.game.weapons.createExplosion(x, y, 'medium', 45);
        if (z.hp <= 0) {
          this.destroyZeppelin(z);
        }
        return true;
      }
    }

    for (const b of this.bombers) {
      if (b.alive && Math.hypot(b.x - x, b.y - y) < radius + 42) {
        b.hp -= damage;
        b.hitFlashTimer = 3;
        this.game.weapons.createExplosion(b.x + (Math.random() - 0.5) * 20, b.y + (Math.random() - 0.5) * 10, 'medium', 35);
        if (b.hp <= 0) {
          this.destroyBomber(b);
        }
        return true;
      }
    }

    for (const hind of this.hinds) {
      if (hind.alive && Math.hypot(hind.x - x, hind.y - y) < radius + 28) {
        hind.hp -= damage;
        this.game.weapons.createExplosion(hind.x + (Math.random() - 0.5) * 15, hind.y + (Math.random() - 0.5) * 15, 'small', 25);
        if (hind.hp <= 0) {
          hind.alive = false;
          this.game.weapons.createExplosion(hind.x, hind.y, 'nuke', 95);
          this.awardScore(hind.scoreValue, hind.creditValue, hind.x, hind.y);
          this.spawnBonusCrate(hind.x, hind.y);
          if (this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('MIG_KILL');
          }
          if (this.game.setRadioMessage) {
            this.game.setRadioMessage('COMMAND', '⭐ TARGET DESTROYED: Enemy Mi-24 Gunship splashed! Outstanding flying!', 280);
          }
        }
        return true;
      }
    }

    for (const mig of this.migs) {
      if (mig.alive && Math.hypot(mig.x - x, mig.y - y) < radius + 22) {
        mig.hp -= damage;
        if (mig.hp <= 0) {
          mig.alive = false;
          this.game.weapons.createExplosion(mig.x, mig.y, 'large', 60);
          this.awardScore(mig.scoreValue, mig.creditValue, mig.x, mig.y);
          this.spawnBonusCrate(mig.x, mig.y);
          if (this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('MIG_KILL');
          }
        }
        return true;
      }
    }

    for (const e of this.enemies) {
      if (e.alive && Math.hypot(e.x - x, e.y - y) < radius + 18) {
        this.applyDamageToEnemy(e, damage);
        return true;
      }
    }
    return false;
  }

  applyAreaDamage(x, y, blastRadius, maxDamage) {
    this.checkBlastDamage(x, y, blastRadius, maxDamage);
  }

  // Handle layered damage: ShieldBarrier -> Reactive Armor (ERA) -> Entrenchment -> Hull HP
  applyDamageToEnemy(e, damage) {
    if (!e || !e.alive) return;

    let finalDmg = damage;

    // 1. Shield Barrier Absorption (TOS-1A Buratino)
    if (e.hasShield && e.shieldHp > 0) {
      if (e.shieldHp >= finalDmg) {
        e.shieldHp -= finalDmg;
        finalDmg = 0;
      } else {
        finalDmg -= e.shieldHp;
        e.shieldHp = 0;
      }
      if (window.soundSystem && typeof window.soundSystem.playShieldHit === 'function') {
        window.soundSystem.playShieldHit();
      }
      this.game.weapons.createExplosion(e.x, e.y - 12, 'small', 15);
      if (this.game.addFloatingText) {
        this.game.addFloatingText(`🛡️ SHIELD: ${Math.round(e.shieldHp)} HP`, e.x, e.y - 30, '#00e5ff');
      }
    }

    if (finalDmg <= 0) return;

    // 2. Relikt Explosive Reactive Armor (T-90M Proryv)
    if (e.hasERA) {
      e.hasERA = false;
      finalDmg *= 0.50; // ERA absorbs 50% of the first high-explosive hit
      this.game.weapons.createExplosion(e.x, e.y - 8, 'small', 20);
      if (this.game.addFloatingText) {
        this.game.addFloatingText('💥 ERA TILES DEFLECTED 50% BLAST!', e.x, e.y - 32, '#ffaa00');
      }
      window.soundSystem.play('tankhit', { volume: 0.9 });
    }

    // 3. Fortified Entrenchment (Dug-in stance)
    if (e.isEntrenched) {
      finalDmg *= 0.65; // 35% damage reduction from front armor
    }

    // 3.5 Kinetic Armor Ricochet Check for Heavy Armor & Fortifications
    const isHeavyArmor = (e.type === 'tank' && (e.subType === 't90' || e.subType === 'tos1a' || e.subType === 'abrams')) || e.type === 'phalanx_ciws';
    if (isHeavyArmor && finalDmg < 45 && Math.random() < 0.40) {
      window.soundSystem.play('tankhit', { volume: 0.6, pitch: 1.4 });
      if (this.game.weapons && this.game.weapons.sparks) {
        for (let s = 0; s < 5; s++) {
          this.game.weapons.sparks.push({
            x: e.x,
            y: e.y - 8,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 5 - 2,
            color: '#ffcc00',
            life: 16,
            maxLife: 16
          });
        }
      }
      if (this.game.addFloatingText) {
        this.game.addFloatingText('⚡ RICOCHET!', e.x, e.y - 20, '#ffff00');
      }
      finalDmg = Math.round(finalDmg * 0.25);
    }

    // Apply hull damage
    e.hp -= finalDmg;

    // 4. Tactical Repositioning when Damaged
    if (e.type === 'tank' && e.hp > 0 && e.repositionTimer <= 0) {
      e.repositionTimer = 80;
      e.speed = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6);
      e.isEntrenched = false;
    }

    if (e.hp <= 0) {
      e.alive = false;
      this.destroyGroundEnemy(e);
    }
  }

  checkBlastDamage(x, y, blastRadius, maxDamage) {
    let hitCount = 0;

    for (const z of this.zeppelins) {
      if (!z.alive) continue;
      const d = Math.hypot(z.x - x, z.y - y);
      if (d <= blastRadius + 55) {
        hitCount++;
        z.hitFlashTimer = 3;
        z.hp -= maxDamage * (1 - Math.min(1, d / (blastRadius + 55)));
        this.game.weapons.createExplosion(z.x + (Math.random() - 0.5) * 40, z.y + (Math.random() - 0.5) * 15, 'large', 60);
        if (z.hp <= 0) {
          this.destroyZeppelin(z);
        }
      }
    }

    for (const b of this.bombers) {
      if (!b.alive) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d <= blastRadius + 30) {
        hitCount++;
        b.hitFlashTimer = 3;
        b.hp -= maxDamage * (1 - Math.min(1, d / (blastRadius + 30)));
        if (b.hp <= 0) {
          this.destroyBomber(b);
        }
      }
    }

    for (const hind of this.hinds) {
      if (!hind.alive) continue;
      const d = Math.hypot(hind.x - x, hind.y - y);
      if (d <= blastRadius) {
        hitCount++;
        hind.hp -= maxDamage * (1 - d / blastRadius);
        if (hind.hp <= 0) {
          hind.alive = false;
          this.game.weapons.createExplosion(hind.x, hind.y, 'nuke', 95);
          this.awardScore(hind.scoreValue, hind.creditValue, hind.x, hind.y);
          this.spawnBonusCrate(hind.x, hind.y);
          if (this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('MIG_KILL');
          }
          if (this.game.setRadioMessage) {
            this.game.setRadioMessage('COMMAND', '⭐ TARGET DESTROYED: Enemy Mi-24 Gunship splashed in blast!', 280);
          }
        }
      }
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= blastRadius) {
        hitCount++;
        const falloff = 1 - d / blastRadius;
        const dmg = maxDamage * falloff;
        this.applyDamageToEnemy(e, dmg);
      }
    }

    for (const mig of this.migs) {
      if (!mig.alive) continue;
      const d = Math.hypot(mig.x - x, mig.y - y);
      if (d <= blastRadius) {
        hitCount++;
        mig.hp -= maxDamage * (1 - d / blastRadius);
        if (mig.hp <= 0) {
          mig.alive = false;
          this.game.weapons.createExplosion(mig.x, mig.y, 'large', 65);
          this.awardScore(mig.scoreValue, mig.creditValue, mig.x, mig.y);
          this.spawnBonusCrate(mig.x, mig.y);
          if (this.game.triggerPilotHumor) {
            this.game.triggerPilotHumor('MIG_KILL');
          }
        }
      }
    }
    return hitCount;
  }

  destroyAllInRadius(x, y, radius, damage) {
    this.checkBlastDamage(x, y, radius, damage);
    for (const m of this.samMissiles) {
      if (Math.hypot(m.x - x, m.y - y) < radius) {
        m.alive = false;
      }
    }
  }

  destroyGroundEnemy(e) {
    let sound = 'mdboom';
    if (e.type === 'building') sound = 'housefall';
    else if (e.type === 'tree') sound = 'woodcrack';
    else if (e.type === 'tank') sound = 'tankhit';
    else if (e.type === 'fuel_barrel') sound = 'bigboom';
    else if (e.type === 'phalanx_ciws') sound = 'bigboom';
    else if (e.type === 'pantsir') sound = 'bigboom';

    window.soundSystem.play(sound, { volume: 0.85 });

    if (e.type === 'fuel_barrel') {
      this.game.weapons.createExplosion(e.x, e.y, 'large', 75);
      if (this.game.terrain) {
        this.game.weapons.createNapalmFire(e.x, this.game.terrain.getHeightAt(e.x), 1.2);
      }
      this.triggerBarrelChainReaction(e.x, e.y);
      if (this.game.addFloatingText) {
        this.game.addFloatingText('💥 SECONDARY EXPLOSION! +75', e.x, e.y - 25, '#ff9900');
      }
    } else if (e.type === 'pantsir') {
      this.game.weapons.createExplosion(e.x, e.y, 'nuke', 95);
      if (this.game.addFloatingText) {
        this.game.addFloatingText('💥 PANTSIR-S1 ELIMINATED! +$350', e.x, e.y - 25, '#38bdf8');
      }
    } else if (e.type === 'phalanx_ciws') {
      this.game.weapons.createExplosion(e.x, e.y, 'large', 85);
      if (this.game.addFloatingText) {
        this.game.addFloatingText('💥 C-RAM CIWS DESTROYED! +$280', e.x, e.y - 25, '#00ffff');
      }
    } else {
      this.game.weapons.createExplosion(e.x, e.y, e.type === 'bunker' ? 'large' : 'medium');
    }
    this.awardScore(e.scoreValue, e.creditValue, e.x, e.y);

    if (e.type === 'tank') {
      this.deadWrecks.push({
        x: e.x,
        y: e.y,
        sprite: this.game.sprites['deadtank1.png']
      });
    }

    if (e.type !== 'tree' && e.type !== 'fuel_barrel' && Math.random() < 0.25) {
      this.spawnBonusCrate(e.x, e.y - 15);
    }
  }

  triggerBarrelChainReaction(sourceX, sourceY) {
    // Deal blast damage to nearby enemies caught in fuel deflagration
    this.checkBlastDamage(sourceX, sourceY, 100, 150);

    // Staggered cascade to adjacent barrels within 115px
    for (const other of this.enemies) {
      if (!other.alive || other.type !== 'fuel_barrel') continue;
      const dist = Math.hypot(other.x - sourceX, other.y - sourceY);
      if (dist > 0 && dist < 115) {
        if (!this.chainExplosionQueue) this.chainExplosionQueue = [];
        this.chainExplosionQueue.push({
          target: other,
          timer: 5 + Math.floor(Math.random() * 8)
        });
      }
    }
  }

  awardScore(score, credits, x, y) {
    if (this.player) {
      this.player.score += score;
      this.player.credits += credits;
      this.game.addFloatingText(`+$${credits}`, x, y - 20, '#55ff55');

      // Track kill combo streak for funny pilot reactions
      const now = Date.now();
      if (!this.killCombo) this.killCombo = { count: 0, lastTime: 0 };
      if (now - this.killCombo.lastTime < 2400) {
        this.killCombo.count++;
      } else {
        this.killCombo.count = 1;
      }
      this.killCombo.lastTime = now;

      if (this.killCombo.count === 4 && this.game.triggerPilotHumor) {
        this.game.triggerPilotHumor('MULTIKILL');
      }
    }
  }

  spawnBonusCrate(x, y) {
    if (this.bonusCrates.length >= 10) return;
    const types = ['bonusbomb', 'bonuscluster', 'bonusrocket', 'bonusfuel', 'bonusrepair', 'bonusemp', 'bonusgold', 'bonusgau8', 'bonusnuke'];
    const weights = [0.20, 0.14, 0.14, 0.15, 0.13, 0.10, 0.08, 0.05, 0.01];
    let r = Math.random();
    let selected = types[0];
    for (let i = 0; i < types.length; i++) {
      if (r < weights[i]) {
        selected = types[i];
        break;
      }
      r -= weights[i];
    }

    this.bonusCrates.push({
      type: selected,
      x,
      y,
      vy: 0.9,
      swayOffset: Math.random() * 50,
      sprite: this.game.sprites[`${selected}.png`],
      alive: true
    });
  }

  collectBonus(type) {
    if (!this.player) return;
    const p = this.player;
    window.soundSystem.play('beep', { volume: 0.95 });

    let msg = '';
    if (type === 'bonusbomb') {
      p.bombs = Math.min(p.bombsMax || 24, p.bombs + 8);
      msg = '+8 HEAVY BOMBS ACQUIRED!';
    } else if (type === 'bonuscluster') {
      p.clusters = Math.min(p.clustersMax || 8, p.clusters + 2);
      msg = '+2 CLUSTER CANISTERS!';
    } else if (type === 'bonusrocket') {
      p.rocketAmmo = Math.min(p.rocketMaxAmmo || 16, p.rocketAmmo + 6);
      msg = '+6 HYDRA ROCKETS!';
    } else if (type === 'bonusnuke') {
      p.nukes = Math.min(p.nukesMax || 3, p.nukes + 1);
      msg = '☢️ +1 TACTICAL NUKE ARMED!';
    } else if (type === 'bonusfuel') {
      p.fuel = Math.min(p.maxFuel || 100, (p.fuel || 0) + 40);
      msg = '⛽ +40% JET FUEL REFILLED!';
    } else if (type === 'bonusrepair') {
      p.hp = Math.min(p.maxHp, p.hp + 45);
      msg = '🔧 +45 AIRFRAME REPAIR!';
    } else if (type === 'bonusgold') {
      this.awardScore(1000, 250, p.x, p.y);
      msg = '💰 +$250 COMBAT BOUNTY!';
    } else if (type === 'bonusemp') {
      p.empBombs = Math.min(p.empMaxBombs || 6, (p.empBombs || 0) + 2);
      msg = '⚡ +2 EMP SHOCK BOMBS! [KEY M]';
    } else if (type === 'bonusgau8') {
      p.gau8Ammo = Math.min(p.gau8MaxAmmo || 400, p.gau8Ammo + 150);
      p.hasDepletedUranium = true;
      msg = '+150 GAU-8 AP ROUNDS!';
    } else if (type === 'bonusblast') {
      p.blastUpgrade = (p.blastUpgrade || 0) + 1;
      msg = '💥 ENLARGED BLAST RADIUS!';
    }

    this.game.addFloatingText(msg, p.x, p.y - 30, '#ffff00');
  }

  draw(ctx, cameraX) {
    const sprites = this.game.sprites;

    // 1. Draw Dead Wrecks
    for (const w of this.deadWrecks) {
      const sx = w.x - cameraX;
      if (sx < -50 || sx > 1330) continue;
      if (w.sprite && w.sprite.complete) {
        ctx.drawImage(w.sprite, sx - w.sprite.width / 2, w.y - w.sprite.height / 2);
      }
    }

    // 2. Draw Ground Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const sx = e.x - cameraX;
      if (sx < -140 || sx > 1420) continue;

      if (e.type === 'armored_train') {
        this.drawArmoredTrain(ctx, sx, e.y, e);
      } else if (e.type === 'missile_silo') {
        this.drawMissileSilo(ctx, sx, e.y, e);
      } else if (e.type === 'radome') {
        this.drawRadome(ctx, sx, e.y, e);
      } else if (e.type === 'oil_well') {
        this.drawOilWell(ctx, sx, e.y, e);
      } else if (e.type === 'desert_technical') {
        this.drawDesertTechnical(ctx, sx, e.y, e);
      } else if (e.type === 'mlrs_truck') {
        this.drawMlrsTruck(ctx, sx, e.y, e);
      } else if (e.type === 'shilka') {
        this.drawShilka(ctx, sx, e.y, e);
      } else if (e.type === 's400') {
        this.drawS400(ctx, sx, e.y, e);
      } else if (e.type === 'akash') {
        this.drawAkashSAM(ctx, sx, e.y, e);
      } else if (e.type === 'tunguska') {
        this.drawTunguska(ctx, sx, e.y, e);
      } else if (e.type === 'phalanx_ciws') {
        this.drawPhalanxCiws(ctx, sx, e.y, e);
      } else if (e.type === 'pantsir') {
        this.drawPantsir(ctx, sx, e.y, e);
      } else if (e.type === 'fuel_barrel') {
        this.drawFuelBarrel(ctx, sx, e.y, e);
      } else if (e.type === 'tank') {
        this.drawTank(ctx, sx, e.y, e);
      } else if (e.type === 'building') {
        this.drawGarrisonBuilding(ctx, sx, e.y, e);
      } else if (e.type === 'bunker') {
        this.drawWatchtower(ctx, sx, e.y, e);
      } else if (e.type === 'tree') {
        this.drawAutumnTree(ctx, sx, e.y, e);
      } else if (e.sprite && e.sprite.complete) {
        ctx.drawImage(e.sprite, sx - e.sprite.width / 2, e.y - e.sprite.height / 2);
      }

      if (e.hp < e.maxHp && e.hp > 0) {
        const barW = (e.type === 'armored_train' ? 90 : (e.type === 'mlrs_truck' || e.type === 'shilka' || e.type === 'phalanx_ciws' || e.type === 'pantsir' || e.type === 's400' || e.type === 'akash' || e.type === 'tunguska' ? 44 : 28));
        const barY = (e.type === 'armored_train' ? e.y - 28 : (e.type === 's400' || e.type === 'phalanx_ciws' || e.type === 'pantsir' || e.type === 'akash' || e.type === 'tunguska' ? e.y - 30 : (e.sprite ? e.y - e.sprite.height / 2 - 8 : e.y - 18)));
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(sx - barW / 2, barY, barW, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(sx - barW / 2, barY, barW * (e.hp / e.maxHp), 3);
      }

      if (e.empDisabledTimer > 0) {
        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#0088cc';
        ctx.shadowBlur = 4;
        ctx.fillText(`⚡ EMP [${Math.ceil(e.empDisabledTimer / 60)}s]`, sx, e.y - 28);
        ctx.restore();
      }
    }

    // 2.5 Draw Active Smoke Screens
    for (const sm of this.smokeScreens) {
      const sx = sm.x - cameraX;
      if (sx < -60 || sx > 1300) continue;
      ctx.save();
      ctx.fillStyle = `rgba(225, 230, 235, ${sm.alpha * 0.75})`;
      ctx.beginPath();
      ctx.arc(sx, sm.y, sm.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(180, 190, 200, ${sm.alpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(sx + 4, sm.y - 3, sm.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw SAM Missiles in Flight
    for (const m of this.samMissiles) {
      const sx = m.x - cameraX;
      ctx.save();
      ctx.translate(sx, m.y);
      ctx.rotate(m.angle);

      if (m.isS400) {
        // High-altitude S-400 Triumf Hypersonic Dart Missile
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(-10, -2, 20, 4);

        // Seeker dome
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(10, 0, 2, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Cruciform stabilization fins
        ctx.fillStyle = '#455a64';
        ctx.fillRect(-9, -5, 3, 10);
        ctx.fillRect(1, -4, 2.5, 8);

        // If ignited: supersonic rocket plume
        if (m.isIgnited) {
          ctx.fillStyle = '#ff9100';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 10;
          const flm = 14 + Math.random() * 8;
          ctx.fillRect(-10 - flm, -2, flm, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10 - flm * 0.5, -1, flm * 0.5, 2);

          // Hypersonic Mach Shock Diamonds
          if (m.speed > 9.5) {
            ctx.fillStyle = '#00e5ff';
            for (let d = 0; d < 3; d++) {
              const dx = -14 - d * 7;
              ctx.beginPath();
              ctx.moveTo(dx, -2);
              ctx.lineTo(dx + 2.5, 0);
              ctx.lineTo(dx, 2);
              ctx.lineTo(dx - 2.5, 0);
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.shadowBlur = 0;
        }
      } else if (m.isPantsir) {
        // Pantsir-S1 57E6 Two-Stage Hypervelocity Bimodal Interceptor
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-8, -1.5, 17, 3);
        // Pointed needle nose cone
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(9, -1.5);
        ctx.lineTo(13, 0);
        ctx.lineTo(9, 1.5);
        ctx.closePath();
        ctx.fill();
        // Booster section & canards
        ctx.fillStyle = '#334155';
        ctx.fillRect(-8, -3.5, 2.5, 7);
        ctx.fillRect(4, -2.5, 2, 5);
        // Cyan Hypervelocity Ion Plume
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        const flm = 12 + Math.random() * 6;
        ctx.fillRect(-8 - flm, -1.2, flm, 2.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8 - flm * 0.4, -0.8, flm * 0.4, 1.6);
        ctx.shadowBlur = 0;
      } else if (m.isKh22) {
        // Tu-22M3 Kh-22 Heavy Supersonic Cruise Missile (Burya)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-15, -3.5, 30, 7);
        // Heavy conical ogive radome
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(15, -3.5);
        ctx.lineTo(21, 0);
        ctx.lineTo(15, 3.5);
        ctx.closePath();
        ctx.fill();
        // Delta wings & cruciform stabilizer fins
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(0, -3.5);
        ctx.lineTo(-7, -10);
        ctx.lineTo(-8, -3.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 3.5);
        ctx.lineTo(-7, 10);
        ctx.lineTo(-8, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-14, -6, 3, 12);
        // Heavy Twin Rocket Exhaust Flame
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 12;
        const flm = 18 + Math.random() * 10;
        ctx.fillRect(-15 - flm, -3, flm, 6);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(-15 - flm * 0.6, -1.8, flm * 0.6, 3.6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-15 - flm * 0.25, -0.8, flm * 0.25, 1.6);
        ctx.shadowBlur = 0;
      } else if (m.isAkash) {
        // Akash Ramjet Interceptor
        ctx.fillStyle = '#edf2f7';
        ctx.fillRect(-9, -2, 18, 4);
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(9, 0, 2, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.fillStyle = '#dd6b20';
        ctx.fillRect(-2, -3.5, 4, 7);
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(-8, -4.5, 3, 9);
        // Continuous Ramjet Flame
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        const flm = 14 + Math.random() * 6;
        ctx.fillRect(-9 - flm, -1.5, flm, 3);
        ctx.fillStyle = '#ffff55';
        ctx.fillRect(-9 - flm * 0.5, -1, flm * 0.5, 2);
        ctx.shadowBlur = 0;
      } else if (m.isTunguska) {
        // Tunguska 9M311 Needle Missile
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-8, -1.5, 16, 3);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(7, -1.5, 2, 3);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(-7, -3.5, 2.5, 7);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        const flm = 10 + Math.random() * 5;
        ctx.fillRect(-8 - flm, -1, flm, 2);
        ctx.shadowBlur = 0;
      } else {
        const samSprite = sprites['sam.png'] || sprites['sam1.png'];
        if (samSprite && samSprite.complete) {
          ctx.drawImage(samSprite, -samSprite.width / 2, -samSprite.height / 2);
        }
      }
      ctx.restore();

      const smokeSprite = sprites['smoke.png'];
      if (smokeSprite && smokeSprite.complete && m.isIgnited !== false) {
        const backX = sx - Math.cos(m.angle) * 12;
        const backY = m.y - Math.sin(m.angle) * 12;
        ctx.drawImage(smokeSprite, backX - 5, backY - 5);
      }
    }

    // 4. Draw Advanced Enemy Interceptors & Pursuit Fighters
    for (const mig of this.migs) {
      if (!mig.alive) continue;
      const sx = mig.x - cameraX;
      if (sx < -140 || sx > 1420) continue;

      ctx.save();
      // Danger Reticle Circle
      ctx.strokeStyle = (mig.type === 'su57') ? '#00f0ff' : ((mig.type === 'su35') ? '#ffea00' : (mig.isAce ? '#ffcc00' : '#ff3333'));
      ctx.lineWidth = mig.isAce ? 2.0 : 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(sx, mig.y, mig.dangerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Tactical Overhead Threat Badge
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;

      let badgeColor = '#ff4444';
      let tagText = `★ ${mig.name || 'HOSTILE INTERCEPTOR'} ★`;
      if (mig.type === 'su57') {
        badgeColor = '#00f0ff';
        tagText = `⚡ 5TH-GEN STEALTH: Su-57 FELON ⚡`;
      } else if (mig.type === 'su35') {
        badgeColor = '#ffea00';
        tagText = `★ 4.5++ GEN SUPER-MANEUVERABLE: Su-35 FLANKER ★`;
      } else if (mig.type === 'mig29') {
        badgeColor = '#ff8833';
        tagText = `★ 4TH-GEN AIR SUPERIORITY: MiG-29 FULCRUM ★`;
      } else if (mig.type === 'ka52') {
        badgeColor = '#ff3366';
        tagText = `★ COAXIAL HUNTER-KILLER: Ka-52 ALLIGATOR ★`;
      } else if (mig.isAce) {
        badgeColor = '#ffcc00';
        tagText = '★ SOVIET ACE INTERCEPTOR ★';
      }
      ctx.fillStyle = badgeColor;
      ctx.fillText(tagText, sx, mig.y - 28);

      // Overhead Dynamic Health Bar
      const barW = 55;
      const barH = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(sx - barW / 2 - 1, mig.y - 23, barW + 2, barH + 2);
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(sx - barW / 2, mig.y - 22, barW, barH);
      const hpFrac = Math.max(0, mig.hp / mig.maxHp);
      ctx.fillStyle = hpFrac > 0.4 ? '#00e676' : '#ffea00';
      ctx.fillRect(sx - barW / 2, mig.y - 22, barW * hpFrac, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(sx - barW / 2 - 1, mig.y - 23, barW + 2, barH + 2);
      ctx.restore();

      // Procedural Aircraft Rendering with Heading & Pitch
      ctx.save();
      ctx.translate(sx, mig.y);
      ctx.rotate(mig.angle);

      if (mig.type === 'mig29') {
        this.drawMig29(ctx, mig);
      } else if (mig.type === 'su35') {
        this.drawSu35(ctx, mig);
      } else if (mig.type === 'su57') {
        this.drawSu57(ctx, mig);
      } else if (mig.type === 'ka52') {
        this.drawKa52(ctx, mig);
      } else {
        this.drawMig21(ctx, mig);
      }
      ctx.restore();
    }

    // 4.5. Draw Mil Mi-24 Hind Heavy Attack Gunships
    for (const hind of this.hinds) {
      if (!hind.alive) continue;
      const sx = hind.x - cameraX;
      if (sx < -120 || sx > 1400) continue;
      this.drawHind(ctx, sx, hind.y, hind);
    }

    // 4.6. Draw Strategic Supersonic Bombers (Tu-22M3 Backfire)
    this.drawBombers(ctx, cameraX);

    // 4.7. Draw Kirov-Class Armored War Zeppelin Dreadnoughts (from Aircraft Evolution REA)
    this.drawZeppelins(ctx, cameraX);

    // 5. Draw Enemy Bullets & Cannon Shells
    for (const b of this.enemyBullets) {
      const sx = b.x - cameraX;
      if (b.isHeavyShell) {
        ctx.fillStyle = '#ff9900';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, b.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (b.isAce) {
        ctx.fillStyle = '#ff2222';
        ctx.beginPath();
        ctx.arc(sx, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = b.isFlak ? '#ffaa00' : '#ff4444';
        ctx.beginPath();
        ctx.arc(sx, b.y, b.isFlak ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Draw Bonus Crates with Parachutes in the Sky!
    for (const c of this.bonusCrates) {
      const sx = c.x - cameraX;
      if (sx < -60 || sx > 1340) continue;

      ctx.save();
      if (!c.isGrounded) {
        // Draw Parachute Canopy in the Sky
        ctx.fillStyle = '#f0f5ff';
        ctx.strokeStyle = '#223322';
        ctx.lineWidth = 1.3;

        // Parachute dome
        ctx.beginPath();
        ctx.arc(sx, c.y - 20, 18, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Parachute suspension cords
        ctx.beginPath();
        ctx.moveTo(sx - 18, c.y - 20);
        ctx.lineTo(sx, c.y - 5);
        ctx.moveTo(sx + 18, c.y - 20);
        ctx.lineTo(sx, c.y - 5);
        ctx.moveTo(sx - 6, c.y - 20);
        ctx.lineTo(sx, c.y - 5);
        ctx.moveTo(sx + 6, c.y - 20);
        ctx.lineTo(sx, c.y - 5);
        ctx.stroke();
      } else {
        // Soft aura glow for grounded supply crate
        ctx.fillStyle = 'rgba(255, 255, 100, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, c.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Supply Crate Icon (with Aircraft Evolution high-visibility vector fallbacks)
      if (c.sprite && c.sprite.complete) {
        ctx.drawImage(c.sprite, sx - c.sprite.width / 2, c.y - c.sprite.height / 2);
      } else {
        ctx.save();
        if (c.type === 'bonusfuel') {
          // Military Olive Jerrycan with Yellow Fuel Cap & Label
          ctx.fillStyle = '#2d4a22';
          ctx.fillRect(sx - 9, c.y - 10, 18, 20);
          ctx.strokeStyle = '#1e3317';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 9, c.y - 10, 18, 20);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(sx - 4, c.y - 13, 8, 3);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('FUEL', sx, c.y + 3);
        } else if (c.type === 'bonusrepair') {
          // White & Red Cross Medical Toolkit
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx - 10, c.y - 8, 20, 16);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 10, c.y - 8, 20, 16);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(sx - 6, c.y - 2, 12, 4);
          ctx.fillRect(sx - 2, c.y - 6, 4, 12);
        } else if (c.type === 'bonusgold') {
          // Gleaming Gold Coin
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx, c.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('$', sx, c.y + 4);
        } else if (c.type === 'bonusemp') {
          // Cyan Ionization EMP Shock Battery
          ctx.fillStyle = '#0891b2';
          ctx.fillRect(sx - 9, c.y - 10, 18, 20);
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 9, c.y - 10, 18, 20);
          ctx.fillStyle = '#a5f3fc';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', sx, c.y + 4);
        } else {
          // Standard Ammo / Ordnance Box
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(sx - 9, c.y - 9, 18, 18);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 9, c.y - 9, 18, 18);
          ctx.beginPath();
          ctx.moveTo(sx - 9, c.y - 9); ctx.lineTo(sx + 9, c.y + 9);
          ctx.moveTo(sx + 9, c.y - 9); ctx.lineTo(sx - 9, c.y + 9);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }

    // 6.5. Draw Player Damage FX: Trailing Smoke Fog & Fire Flames
    const terrain = this.game.terrain;
    for (const dp of this.damageParticles) {
      let dsx = dp.x - cameraX;
      if (dsx < -terrain.mapWidth / 2) dsx += terrain.mapWidth;
      if (dsx > terrain.mapWidth / 2) dsx -= terrain.mapWidth;
      if (dsx < -50 || dsx > 1330) continue;

      ctx.save();
      if (dp.type === 'smoke') {
        const alpha = Math.max(0, (dp.life / dp.maxLife) * 0.55);
        ctx.fillStyle = `${dp.color} ${alpha})`;
        ctx.beginPath();
        ctx.arc(dsx, dp.y, dp.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (dp.type === 'fire') {
        ctx.fillStyle = dp.color;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(dsx, dp.y, dp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Draw Player Plane
    if (this.player && this.player.alive) {
      const p = this.player;
      const sx = p.x - cameraX;

      if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
        return;
      }

      ctx.save();
      ctx.translate(sx, p.y);
      ctx.rotate(p.angle);

      let planeSprite = null;
      if (p.model === 'a10') {
        if (p.isDiving) {
          planeSprite = sprites['warthogdiving1.png'] || sprites['warthog1.png'];
        } else {
          planeSprite = sprites['warthog1.png'];
        }
      } else if (p.model === 'su25') {
        planeSprite = sprites['su25.png'] || sprites['plane2.png'];
      } else if (p.model === 'cobra') {
        planeSprite = sprites['cobra.png'] || sprites['plane.png'];
      } else if (p.model === 'f14') {
        planeSprite = sprites['f14.png'] || sprites['plane2.png'];
      } else if (p.model === 'ac130') {
        planeSprite = sprites['ac130.png'] || sprites['plane.png'];
      } else if (p.model === 'apache') {
        planeSprite = sprites['apache.png'] || sprites['cobra.png'] || sprites['plane.png'];
      } else if (p.model === 'comanche') {
        planeSprite = sprites['comanche.png'] || sprites['cobra.png'] || sprites['plane.png'];
      } else if (p.model === 'chinook') {
        planeSprite = sprites['chinook.png'] || sprites['ac130.png'] || sprites['plane.png'];
      } else if (p.model === 'harrier') {
        planeSprite = sprites['harrier.png'] || sprites['plane.png'];
      } else {
        planeSprite = (p.currentSpeed > p.baseSpeed * 1.1 && sprites['plane2.png']) ? sprites['plane2.png'] : sprites['plane.png'];
      }

      if (planeSprite && planeSprite.complete) {
        ctx.drawImage(planeSprite, -planeSprite.width / 2, -planeSprite.height / 2);
      } else {
        ctx.fillStyle = p.model === 'f14' ? '#5588aa' : (p.model === 'ac130' ? '#444d55' : '#4488ff');
        ctx.fillRect(-16, -5, 32, 10);
      }

      // Dynamic animated spinning top rotor for AH-1 Cobra
      if (p.model === 'cobra') {
        ctx.save();
        ctx.strokeStyle = 'rgba(210, 230, 255, 0.75)';
        ctx.lineWidth = 1.8;
        const rotorSpan = 30 * Math.sin(Date.now() * 0.05);
        ctx.beginPath();
        ctx.moveTo(-rotorSpan, -10);
        ctx.lineTo(rotorSpan, -10);
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic twin afterburner trails for F-14 Tomcat
      if (p.model === 'f14' && p.currentSpeed >= p.baseSpeed) {
        ctx.save();
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 10;
        const flmLen = (8 + Math.random() * 8) * (p.currentSpeed / p.baseSpeed);
        ctx.beginPath();
        ctx.moveTo(-16, -3);
        ctx.lineTo(-16 - flmLen, -2);
        ctx.lineTo(-16, -1);
        ctx.moveTo(-16, 1);
        ctx.lineTo(-16 - flmLen, 2);
        ctx.lineTo(-16, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Dynamic WEP / Afterburner Boost Flame (All aircraft when holding Shift / Q)
      if (p.isBoosting && !p.isHelicopter) {
        ctx.save();
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 14;
        const flmLen = 22 + Math.random() * 14;
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.lineTo(-18 - flmLen, 0);
        ctx.lineTo(-18, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00b0ff';
        ctx.beginPath();
        ctx.moveTo(-18, -2);
        ctx.lineTo(-18 - flmLen * 0.65, 0);
        ctx.lineTo(-18, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Dynamic 4 spinning turboprop discs for AC-130 Spectre
      if (p.model === 'ac130') {
        ctx.save();
        ctx.strokeStyle = 'rgba(210, 220, 235, 0.6)';
        ctx.lineWidth = 1.2;
        const propOffsets = [-12, -4, 4, 12];
        for (const po of propOffsets) {
          const propH = 7 * Math.sin(Date.now() * 0.06 + po);
          ctx.beginPath();
          ctx.moveTo(po, -propH);
          ctx.lineTo(po, propH);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Dynamic animated spinning 4-blade rotor for AH-64 Apache
      if (p.model === 'apache') {
        ctx.save();
        ctx.strokeStyle = 'rgba(215, 235, 255, 0.85)';
        ctx.lineWidth = 2.0;
        const rotorSpan = 34 * Math.sin(Date.now() * 0.06);
        ctx.beginPath();
        ctx.moveTo(-rotorSpan, -11);
        ctx.lineTo(rotorSpan, -11);
        ctx.stroke();
        // Tail rotor
        const tailRotorSpan = 9 * Math.cos(Date.now() * 0.08);
        ctx.beginPath();
        ctx.moveTo(-16, 2 - tailRotorSpan);
        ctx.lineTo(-16, 2 + tailRotorSpan);
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic animated composite rotor & stealth aura for RAH-66 Comanche
      if (p.model === 'comanche') {
        ctx.save();
        ctx.strokeStyle = 'rgba(180, 220, 255, 0.75)';
        ctx.lineWidth = 1.6;
        const rotorSpan = 30 * Math.sin(Date.now() * 0.065);
        ctx.beginPath();
        ctx.moveTo(-rotorSpan, -9);
        ctx.lineTo(rotorSpan, -9);
        ctx.stroke();
        // Stealth radar cloak HUD pulse when flying low altitude
        if (p.stealthLevel > 0 && p.y > terrain.getHeightAt(p.x) - 160) {
          ctx.strokeStyle = `rgba(0, 255, 200, ${0.35 + 0.25 * Math.sin(Date.now() * 0.008)})`;
          ctx.lineWidth = 1.0;
          ctx.strokeRect(-18, -12, 36, 20);
        }
        ctx.restore();
      }

      // Dynamic dual tandem counter-rotating rotors for CH-47 Chinook
      if (p.model === 'chinook') {
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 235, 255, 0.85)';
        ctx.lineWidth = 2.0;
        // Front rotor
        const fRotorSpan = 32 * Math.sin(Date.now() * 0.055);
        ctx.beginPath();
        ctx.moveTo(12 - fRotorSpan, -13);
        ctx.lineTo(12 + fRotorSpan, -13);
        ctx.stroke();
        // Rear elevated rotor (counter-rotating)
        const rRotorSpan = 32 * Math.cos(Date.now() * 0.055);
        ctx.beginPath();
        ctx.moveTo(-15 - rRotorSpan, -15);
        ctx.lineTo(-15 + rRotorSpan, -15);
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic Pegasus swiveling vector-thrust nozzles for AV-8B Harrier II
      if (p.model === 'harrier') {
        ctx.save();
        const isHover = p.currentSpeed < 2.0;
        ctx.fillStyle = isHover ? '#ffaa00' : '#00e5ff';
        ctx.shadowColor = isHover ? '#ff6600' : '#00aaff';
        ctx.shadowBlur = 8;
        if (isHover) {
          // Downward thrust jets when in VTOL hover
          const flm = 6 + Math.random() * 6;
          ctx.fillRect(-4, 6, 3, flm);
          ctx.fillRect(6, 6, 3, flm);
        } else if (p.currentSpeed >= p.baseSpeed) {
          // Rearward thrust jets when flying
          const flm = (6 + Math.random() * 6) * (p.currentSpeed / p.baseSpeed);
          ctx.fillRect(-16 - flm, -2, flm, 4);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Swiveling Chin Turret Barrel (AH-64 Apache & AH-1 Cobra)
      if (p.model === 'apache' || p.model === 'cobra') {
        ctx.save();
        const turretRelAngle = (p.hasTurretLock && p.turretAngle !== undefined) ? (p.turretAngle - p.angle) : 0;
        ctx.translate(14, 4);
        ctx.rotate(turretRelAngle);
        ctx.fillStyle = '#22252a';
        ctx.fillRect(0, -1.5, 9, 3);
        ctx.restore();

        // Laser targeting designator pointer when target locked
        if (p.hasTurretLock && p.lockedTarget && p.lockedTarget.alive) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 255, 120, 0.40)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([4, 4]);
          const targetRelX = (p.lockedTarget.x - p.x);
          const targetRelY = (p.lockedTarget.y - p.y);
          const cosA = Math.cos(-p.angle);
          const sinA = Math.sin(-p.angle);
          const lx = targetRelX * cosA - targetRelY * sinA;
          const ly = targetRelX * sinA + targetRelY * cosA;
          ctx.beginPath();
          ctx.moveTo(14, 4);
          ctx.lineTo(lx, ly);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Chinook Side Door Gunner Muzzle Flash
      if (p.model === 'chinook' && p.doorMuzzleFlash > 0) {
        p.doorMuzzleFlash--;
        ctx.save();
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-8, 5, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Downward ground dust wash for Harrier in hover near terrain
      if (p.model === 'harrier' && p.isHovering) {
        const groundDist = terrain.getHeightAt(p.x) - p.y;
        if (groundDist > 0 && groundDist < 160) {
          ctx.save();
          ctx.fillStyle = 'rgba(215, 200, 175, 0.35)';
          const washW = (160 - groundDist) * 0.35;
          ctx.beginPath();
          ctx.arc(0, groundDist, washW, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // High-visibility muzzle flash when firing cannon
      if (p.muzzleFlash > 0) {
        p.muzzleFlash--;
        ctx.fillStyle = '#ffff66';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(26, 0, 9 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // 8. Draw Tactical Health Bar above Player Plane
      ctx.save();
      const barW = 46;
      const barH = 6;
      const barX = sx - barW / 2;
      const barY = p.y - 28;

      // Dark background with crisp border
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // Dynamic HP fill color (Green -> Amber -> Red)
      const hpPct = Math.max(0, Math.min(1, p.hp / p.maxHp));
      ctx.fillStyle = hpPct > 0.5 ? '#00ff66' : (hpPct > 0.25 ? '#ffcc00' : '#ff2222');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    // 8. Draw Allied AI Wingmen Planes & Formations
    this.drawWingmen(ctx, cameraX);

    // 9. Draw Autonomous FPV Kamikaze Strike Drones
    this.drawDrones(ctx, cameraX);
  }

  // Draw Allied AI Wingmen with Afterburners, Wingtip Beacons & Callsigns
  drawWingmen(ctx, cameraX) {
    if (!this.wingmen || this.wingmen.length === 0) return;
    const terrain = this.game.terrain;

    for (const wm of this.wingmen) {
      if (!wm.alive) continue;
      let sx = wm.x - cameraX;
      if (sx < -terrain.mapWidth / 2) sx += terrain.mapWidth;
      if (sx > terrain.mapWidth / 2) sx -= terrain.mapWidth;
      if (sx < -100 || sx > 1380) continue;

      ctx.save();
      ctx.translate(sx, wm.y);
      ctx.rotate(wm.angle);

      // 1. Engine Afterburner Exhaust Plume
      const flameLen = 14 + Math.random() * 8;
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(-18, -3);
      ctx.lineTo(-18 - flameLen, 0);
      ctx.lineTo(-18, 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.moveTo(-18, -1.5);
      ctx.lineTo(-18 - flameLen * 0.6, 0);
      ctx.lineTo(-18, 1.5);
      ctx.closePath();
      ctx.fill();

      // 2. Aircraft Sprite
      if (wm.sprite && wm.sprite.complete) {
        ctx.drawImage(wm.sprite, -wm.sprite.width / 2, -wm.sprite.height / 2);
      } else {
        ctx.fillStyle = '#2d6898';
        ctx.fillRect(-18, -4, 36, 8);
      }

      // 3. Allied Wingtip Green/Blue Formation Beacons
      ctx.fillStyle = (Date.now() % 400 < 200) ? '#00ff88' : '#00b4ff';
      ctx.beginPath();
      ctx.arc(-2, -14, 2.5, 0, Math.PI * 2);
      ctx.arc(-2, 14, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 4. Callsign Text Marker
      ctx.save();
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(`👥 ${wm.callsign} [ALLIED]`, sx, wm.y - 20);
      ctx.restore();
    }
  }

  // === AUTONOMOUS FPV COMBAT DRONE RENDERING ===
  drawDrones(ctx, cameraX) {
    if (!this.drones || this.drones.length === 0) return;
    const terrain = this.game.terrain;

    for (const d of this.drones) {
      if (!d.alive) continue;
      let sx = d.x - cameraX;
      if (sx < -terrain.mapWidth / 2) sx += terrain.mapWidth;
      if (sx > terrain.mapWidth / 2) sx -= terrain.mapWidth;
      if (sx < -60 || sx > 1340) continue;

      ctx.save();
      ctx.translate(sx, d.y);
      ctx.rotate(d.angle);

      // 1. Carbon-Fiber X-Frame Arms
      ctx.strokeStyle = '#1e242b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, 8);
      ctx.moveTo(-10, 8);
      ctx.lineTo(10, -8);
      ctx.stroke();

      // 2. 4 Spinning Rotor Blur Discs
      ctx.fillStyle = 'rgba(180, 240, 255, 0.55)';
      const rotorRadius = 5.5;
      const armCoords = [
        [-10, -8],
        [10, -8],
        [-10, 8],
        [10, 8]
      ];
      for (const [rx, ry] of armCoords) {
        ctx.beginPath();
        ctx.ellipse(rx, ry, rotorRadius, rotorRadius * 0.45, d.rotorSpin, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(180, 240, 255, 0.55)';
      }

      // 3. Central Drone Avionics Pod & Battery
      ctx.fillStyle = '#263238';
      ctx.fillRect(-6, -4, 12, 8);
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6, -4, 12, 8);

      // Blinking Green Telemetry LED
      ctx.fillStyle = (Math.floor(d.wobbleTimer * 10) % 2 === 0) ? '#00ff66' : '#007722';
      ctx.beginPath();
      ctx.arc(0, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Forward FPV Camera Lens with Red Recording Strobe
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(7.5, 0, 1, 0, Math.PI * 2);
      ctx.fill();

      // 5. Underslung RPG-7 HEAT Warhead
      ctx.fillStyle = '#4a5d3f';
      ctx.beginPath();
      ctx.moveTo(3, 4);
      ctx.lineTo(11, 4);
      ctx.lineTo(13, 5);
      ctx.lineTo(11, 6);
      ctx.lineTo(3, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#283618';
      ctx.stroke();

      ctx.restore();

      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(d.state === 'TERMINAL_DIVE' ? '⚡ FPV DIVE' : '🎯 FPV-7', sx, d.y - 14);

      // Target lock bracket if target is active
      if (d.target && d.target.alive) {
        let tsx = d.target.x - cameraX;
        if (tsx < -terrain.mapWidth / 2) tsx += terrain.mapWidth;
        if (tsx > terrain.mapWidth / 2) tsx -= terrain.mapWidth;
        if (tsx > -40 && tsx < 1320) {
          ctx.strokeStyle = '#00ffcc';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(tsx - 14, d.target.y - 18, 28, 20);
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#00ffcc';
          ctx.fillText('LOCKED', tsx, d.target.y - 22);
        }
      }
      ctx.restore();
    }
  }

  // === PHALANX C-RAM CIWS ANTI-AIR ARTILLERY RENDERING ===
  drawPhalanxCiws(ctx, sx, y, e) {
    ctx.save();
    ctx.translate(sx, y);

    // 1. Reinforced Steel & Concrete Pedestal Mount
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-16, -6, 32, 8);
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, -6, 32, 8);

    // Yellow Hazard Warning Stripes on Pedestal
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-14, -5, 4, 3);
    ctx.fillRect(-6, -5, 4, 3);
    ctx.fillRect(2, -5, 4, 3);
    ctx.fillRect(10, -5, 4, 3);

    // 2. Armored Barbette Turret Ring
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(-12, -14, 24, 8);

    // 3. Slewing Gun Mount & 6-Barrel M61A1 20mm Vulcan Rotary Cannon
    ctx.save();
    ctx.translate(0, -11);
    const bAngle = e.barrelAngle !== undefined ? e.barrelAngle : -Math.PI / 3;
    ctx.rotate(bAngle);

    // Gun body
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, -3, 12, 6);

    // 6 Rotary Barrels
    ctx.fillStyle = '#111111';
    ctx.fillRect(12, -2.5, 14, 5);
    ctx.fillStyle = '#424242';
    ctx.fillRect(18, -3, 2, 6); // Barrel clamp ring 1
    ctx.fillRect(24, -3, 2, 6); // Barrel muzzle clamp ring 2

    // Muzzle flash when firing
    if (e.fireCooldown > 8 || e.interceptCooldown > 4) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(26, -4);
      ctx.lineTo(38 + Math.random() * 8, 0);
      ctx.lineTo(26, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4. White Radome "R2-D2" Radar Dome (Ku-Band Search/Track Radar)
    ctx.fillStyle = '#eceff1'; // Radome off-white fiberglass
    ctx.beginPath();
    ctx.arc(0, -22, 9, Math.PI, 0, false);
    ctx.lineTo(9, -14);
    ctx.lineTo(-9, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Radome center seam band
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(-8.5, -20, 17, 3);

    // 5. Spinning Search Radar Antenna on Top
    ctx.save();
    ctx.translate(0, -31);
    const dishW = 10 * Math.cos(e.radarAngle || 0);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-dishW, 0);
    ctx.lineTo(dishW, 0);
    ctx.stroke();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // === PANTSIR-S1 (SA-22 GREYHOUND) GUN-MISSILE HYBRID SYSTEM RENDERING ===
  drawPantsir(ctx, sx, y, e) {
    ctx.save();
    ctx.translate(sx, y);

    // Identity Badge Overhead
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('🛡️ PANTSIR-S1 (SA-22) 🛡️', 0, -36);
    ctx.restore();

    // 1. KamAZ-6560 8x8 Heavy Chassis & All-Terrain Wheels
    const wheelPositions = [-20, -10, 8, 18];
    for (const wx of wheelPositions) {
      // Tire
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(wx, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Armored Hub
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(wx, 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Axle bolt
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx, 2, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chassis Lower Hull & Mudguards
    ctx.fillStyle = '#334155';
    ctx.fillRect(-24, -4, 48, 4);

    // 2. Armored Forward Cab
    ctx.fillStyle = '#3f4e3c'; // Tactical Russian Camo Green
    ctx.fillRect(10, -14, 14, 10);
    // Cab Sloped Windshield
    ctx.fillStyle = '#0284c7'; // Armored ballistic glass
    ctx.beginPath();
    ctx.moveTo(18, -14);
    ctx.lineTo(24, -8);
    ctx.lineTo(18, -8);
    ctx.closePath();
    ctx.fill();

    // 3. Central Armored Turret Base
    ctx.fillStyle = '#4a5b46';
    ctx.fillRect(-18, -15, 26, 11);

    // 4. Slewing Gun-Missile Mount
    ctx.save();
    ctx.translate(-5, -14);
    const bAngle = e.barrelAngle !== undefined ? e.barrelAngle : -Math.PI / 3;
    ctx.rotate(bAngle);

    // Twin 30mm 2A38M Autocannons (Upper & Lower barrels)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(24, -3);
    ctx.moveTo(0, 3);
    ctx.lineTo(24, 3);
    ctx.stroke();
    // Muzzle Flash Suppressors / compensators
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(22, -4.5, 3, 3);
    ctx.fillRect(22, 1.5, 3, 3);

    // 12-Canister 57E6 SAM Missile Launch Tubes (6 on left, 6 on right)
    ctx.fillStyle = '#475569';
    // Top bank of 3 tubes
    ctx.fillRect(-8, -9, 18, 4);
    // Bottom bank of 3 tubes
    ctx.fillRect(-8, 5, 18, 4);
    // Red protective launch caps
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(9, -9, 2, 4);
    ctx.fillRect(9, 5, 2, 4);

    ctx.restore();

    // 5. Phased Array Tracking Radar (Forward Face)
    ctx.save();
    ctx.translate(-5, -17);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 6. 360° Rotating Target Acquisition Surveillance Radar on Mast
    ctx.save();
    ctx.translate(-14, -22);
    // Mast
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-1.5, 0, 3, 7);
    // Rotating Antenna
    const rAngle = e.radarAngle || 0;
    const rSpan = 11 * Math.cos(rAngle);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-rSpan, -2);
    ctx.lineTo(rSpan, -2);
    ctx.stroke();
    // Radar Feed Horn
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // === THEATER-SPECIFIC ENEMY RENDERING ===

  // 1. Armored Soviet Supply Train (Locomotive + Flak Car + Missile Car)
  drawArmoredTrain(ctx, sx, y, e) {
    ctx.save();
    const dir = e.speed > 0 ? 1 : -1;

    // A. Locomotive
    ctx.fillStyle = '#2c333d';
    ctx.fillRect(sx - 35, y - 20, 70, 20);
    // Locomotive Cab
    ctx.fillStyle = '#1e232a';
    ctx.fillRect(sx - 32, y - 28, 26, 10);
    // Cabin window with yellow furnace / cab light
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(sx - 28, y - 25, 10, 5);
    // Cowcatcher grill
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(sx + 35 * dir, y);
    ctx.lineTo(sx + 45 * dir, y);
    ctx.lineTo(sx + 35 * dir, y - 12);
    ctx.closePath();
    ctx.fill();
    // Smokestack with animated steam puff
    ctx.fillStyle = '#14181d';
    ctx.fillRect(sx + 15 * dir, y - 28, 7, 10);
    ctx.fillStyle = 'rgba(200, 210, 225, 0.45)';
    ctx.beginPath();
    ctx.arc(sx + 18 * dir - dir * (Date.now() * 0.04 % 25), y - 32 - (Date.now() * 0.04 % 20), 6 + (Date.now() * 0.03 % 6), 0, Math.PI * 2);
    ctx.fill();

    // B. Flak Turret Car (Coupled behind locomotive)
    const flakX = sx - 68 * dir;
    ctx.fillStyle = '#323a45';
    ctx.fillRect(flakX - 25, y - 16, 50, 16);
    // Dual flak gun barrels angled upward
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(flakX, y - 16);
    ctx.lineTo(flakX + 18 * dir, y - 28);
    ctx.moveTo(flakX - 3, y - 16);
    ctx.lineTo(flakX + 15 * dir, y - 28);
    ctx.stroke();

    // C. Missile Railcar (Coupled further behind)
    const missileX = sx - 128 * dir;
    ctx.fillStyle = '#262d36';
    ctx.fillRect(missileX - 26, y - 18, 52, 18);
    // Angled missile launcher rail on roof
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(missileX - 12, y - 24, 28, 5);
    ctx.fillStyle = '#ff2222'; // Missile nose cone
    ctx.beginPath();
    ctx.moveTo(missileX + 16, y - 24);
    ctx.lineTo(missileX + 22, y - 21.5);
    ctx.lineTo(missileX + 16, y - 19);
    ctx.closePath();
    ctx.fill();

    // Draw Steel Wheels along track
    ctx.fillStyle = '#111317';
    for (let wx = -145; wx <= 35; wx += 18) {
      ctx.beginPath();
      ctx.arc(sx + wx * dir, y + 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 2. Underground Nuclear Missile Silo
  drawMissileSilo(ctx, sx, y, e) {
    ctx.save();
    // Concrete ring collar
    ctx.fillStyle = '#444b54';
    ctx.fillRect(sx - 34, y - 4, 68, 12);
    // Yellow/Black Hazard Warning Stripes
    ctx.fillStyle = '#ffcc00';
    for (let hx = sx - 32; hx <= sx + 24; hx += 12) {
      ctx.fillRect(hx, y - 3, 6, 4);
    }
    // Blast Door Hatch
    if (e.hatchOpen) {
      // Hatch sliding open revealing missile bay
      ctx.fillStyle = '#111315';
      ctx.fillRect(sx - 20, y - 2, 40, 10);
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(sx, y + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Silo Hatch covers pushed aside
      ctx.fillStyle = '#23282e';
      ctx.fillRect(sx - 32, y - 6, 14, 5);
      ctx.fillRect(sx + 18, y - 6, 14, 5);
    } else {
      ctx.fillStyle = '#23282e';
      ctx.fillRect(sx - 22, y - 5, 44, 7);
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(sx, y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Giant Spherical Radar Dome (Radome)
  drawRadome(ctx, sx, y, e) {
    ctx.save();
    // Octagonal concrete base
    ctx.fillStyle = '#505a66';
    ctx.fillRect(sx - 26, y - 8, 52, 16);
    ctx.fillStyle = '#3c444d';
    ctx.fillRect(sx - 22, y - 14, 44, 6);

    // Giant White Geodesic Sphere
    const rad = 22;
    const grad = ctx.createRadialGradient(sx - 6, y - 26, 4, sx, y - 22, rad);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, '#d8e5f2');
    grad.addColorStop(1, '#9cb8d4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, y - 22, rad, 0, Math.PI * 2);
    ctx.fill();

    // Geodesic panel line segments
    ctx.strokeStyle = 'rgba(100, 130, 160, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, y - 22, rad * 0.65, 0, Math.PI * 2);
    ctx.moveTo(sx - rad, y - 22);
    ctx.lineTo(sx + rad, y - 22);
    ctx.stroke();

    // Spinning Radar Antenna on Top
    ctx.save();
    ctx.translate(sx, y - 44);
    ctx.rotate(e.spinAngle || 0);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-10, -2, 20, 4);
    ctx.restore();

    ctx.restore();
  }

  // 4. Burning Oil Pumpjack & Flare Stack
  drawOilWell(ctx, sx, y, e) {
    ctx.save();
    // Heavy Steel A-frame Derrick base
    ctx.strokeStyle = '#32363b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - 16, y);
    ctx.lineTo(sx, y - 26);
    ctx.lineTo(sx + 16, y);
    ctx.stroke();

    // Pivoting Walking Beam (Counterweight)
    const beamAngle = Math.sin(e.pumpAngle || 0) * 0.35;
    ctx.save();
    ctx.translate(sx, y - 26);
    ctx.rotate(beamAngle);
    ctx.fillStyle = '#1c2024';
    ctx.fillRect(-28, -4, 56, 8);
    // Horse head pump front
    ctx.fillStyle = '#cc3322';
    ctx.beginPath();
    ctx.arc(28, 0, 7, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.restore();

    // Adjacent Flare Burnoff Stack Pipe
    const flareX = sx - 32;
    ctx.strokeStyle = '#22252a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(flareX, y);
    ctx.lineTo(flareX, y - 36);
    ctx.stroke();

    // Animated Flare Fire and Billowing Smoke
    const time = Date.now() * 0.01;
    const flameH = 14 + Math.sin(time) * 5;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(flareX - 5, y - 36);
    ctx.lineTo(flareX, y - 36 - flameH);
    ctx.lineTo(flareX + 5, y - 36);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffee44';
    ctx.beginPath();
    ctx.arc(flareX, y - 36 - flameH * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Billowing dark smoke puff drifting upward
    ctx.fillStyle = 'rgba(20, 15, 10, 0.45)';
    ctx.beginPath();
    ctx.arc(flareX + Math.sin(time * 0.5) * 8 - 10, y - 46 - flameH, 8, 0, Math.PI * 2);
    ctx.arc(flareX + Math.sin(time * 0.3) * 12 - 18, y - 60 - flameH, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. Desert Technical Gun Truck
  drawDesertTechnical(ctx, sx, y, e) {
    ctx.save();
    const dir = e.speed > 0 ? 1 : -1;

    // Sand-camo pickup truck body
    ctx.fillStyle = '#d4a359';
    ctx.fillRect(sx - 18, y - 10, 36, 10);
    // Cab & Windshield
    ctx.fillStyle = '#b8863b';
    ctx.fillRect(sx - 4 * dir, y - 18, 16 * dir, 8);
    ctx.fillStyle = '#88ccee'; // windshield glass
    ctx.fillRect(sx + 4 * dir, y - 16, 6 * dir, 6);

    // Mounted heavy DShK machine gun on flatbed
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(sx - 12 * dir, y - 16, 4, 8); // mount tripod
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx - 12 * dir, y - 16);
    ctx.lineTo(sx - 24 * dir, y - 24); // barrel pointed up
    ctx.stroke();

    // Black wheels
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(sx - 10, y, 4, 0, Math.PI * 2);
    ctx.arc(sx + 10, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. BM-21 "Grad" Multiple Launch Rocket System (MLRS) Truck
  drawMlrsTruck(ctx, sx, y, e) {
    ctx.save();
    const dir = e.speed > 0 ? 1 : -1;

    // Heavy 6x6 Ural Military Truck Frame
    ctx.fillStyle = '#3a4430'; // Soviet Olive Drab
    ctx.fillRect(sx - 24 * dir, y - 12, 48 * dir, 9);

    // Armored Driver Cab & Windshield
    ctx.fillStyle = '#45523a';
    ctx.beginPath();
    ctx.moveTo(sx + 8 * dir, y - 12);
    ctx.lineTo(sx + 24 * dir, y - 12);
    ctx.lineTo(sx + 24 * dir, y - 22);
    ctx.lineTo(sx + 14 * dir, y - 22);
    ctx.lineTo(sx + 8 * dir, y - 15);
    ctx.closePath();
    ctx.fill();

    // Windshield glass
    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(sx + 15 * dir, y - 20, 7 * dir, 6);

    // Rear 40-tube rocket launcher rack tilted up at 35 degrees
    ctx.save();
    ctx.translate(sx - 8 * dir, y - 14);
    ctx.rotate(dir > 0 ? -0.55 : 0.55); // Elevated launch angle

    // Launcher Box/Cage
    ctx.fillStyle = '#2a3124';
    ctx.fillRect(-18, -10, 36, 12);
    ctx.strokeStyle = '#1b2017';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -10, 36, 12);

    // Tube Matrix & Red Rocket Tips
    ctx.fillStyle = '#d32f2f'; // Red rocket warhead tips
    for (let row = -8; row <= -2; row += 3.5) {
      for (let col = 12; col <= 16; col += 3.5) {
        ctx.beginPath();
        ctx.arc(col, row, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Heavy 6x6 Off-road Wheels (3 axles)
    ctx.fillStyle = '#181b18';
    ctx.beginPath();
    ctx.arc(sx - 16 * dir, y - 2, 5, 0, Math.PI * 2);
    ctx.arc(sx - 4 * dir, y - 2, 5, 0, Math.PI * 2);
    ctx.arc(sx + 16 * dir, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wheel hub caps
    ctx.fillStyle = '#657357';
    ctx.beginPath();
    ctx.arc(sx - 16 * dir, y - 2, 2, 0, Math.PI * 2);
    ctx.arc(sx - 4 * dir, y - 2, 2, 0, Math.PI * 2);
    ctx.arc(sx + 16 * dir, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 7. ZSU-23-4 "Shilka" Quad Radar Flak Tank
  drawShilka(ctx, sx, y, e) {
    ctx.save();
    const dir = e.speed > 0 ? 1 : -1;

    // Tracked Armored Hull
    ctx.fillStyle = '#343f2d'; // Dark Olive Green
    ctx.fillRect(sx - 22, y - 11, 44, 8);

    // Tracks & Road Wheels
    ctx.fillStyle = '#1c201a';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - 24, y - 5, 48, 6, 3);
    else if (ctx.rect) ctx.rect(sx - 24, y - 5, 48, 6);
    else if (ctx.fillRect) ctx.fillRect(sx - 24, y - 5, 48, 6);
    ctx.fill();
    ctx.fillStyle = '#4a5742';
    for (let wx = -18; wx <= 18; wx += 9) {
      ctx.beginPath();
      ctx.arc(sx + wx, y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cylindrical Armor Turret
    ctx.fillStyle = '#414f38';
    ctx.beginPath();
    ctx.arc(sx, y - 13, 11, Math.PI, 0);
    ctx.lineTo(sx + 11, y - 11);
    ctx.lineTo(sx - 11, y - 11);
    ctx.closePath();
    ctx.fill();

    // RPK-2 "Tobol" Scanning Radar Dish (Turret Rear)
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(sx - 8 * dir, y - 20, 6, -Math.PI * 0.7, 0);
    ctx.stroke();
    ctx.fillStyle = '#2b3525';
    ctx.fillRect(sx - 9 * dir, y - 16, 3, 5);

    // Quad 23mm Autocannon Barrels (2A7) angled upward
    ctx.strokeStyle = '#181c15';
    ctx.lineWidth = 2.0;
    const barrelAngle = dir > 0 ? -0.7 : -2.44;
    const bx = sx + 4 * dir;
    const by = y - 14;

    for (let offset = -3; offset <= 3; offset += 2) {
      ctx.beginPath();
      ctx.moveTo(bx, by + offset);
      ctx.lineTo(bx + Math.cos(barrelAngle) * 22, by + offset + Math.sin(barrelAngle) * 22);
      ctx.stroke();
    }

    // Flash compensators on barrel tips
    ctx.fillStyle = '#ff8800';
    if (e.fireTimer && e.fireTimer % 6 < 3) {
      const tipX = bx + Math.cos(barrelAngle) * 23;
      const tipY = by + Math.sin(barrelAngle) * 23;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 8. Mil Mi-24 "Hind" Heavy Attack Gunship (Airborne Boss)
  drawHind(ctx, sx, y, hind) {
    ctx.save();
    const facing = hind.facing || 1;

    // Boss Name & Tactical Threat Tag Overhead
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('⚡ SOVIET MI-24 HIND FLYING FORTRESS ⚡', sx, y - 32);

    // Boss Health Bar
    const barW = 70;
    const barH = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(sx - barW / 2 - 1, y - 26, barW + 2, barH + 2);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(sx - barW / 2, y - 25, barW, barH);
    const hpFrac = Math.max(0, hind.hp / hind.maxHp);
    ctx.fillStyle = hpFrac > 0.4 ? '#00e676' : '#ffea00';
    ctx.fillRect(sx - barW / 2, y - 25, barW * hpFrac, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barW / 2 - 1, y - 26, barW + 2, barH + 2);
    ctx.restore();

    ctx.save();
    ctx.translate(sx, y);
    if (ctx.scale) ctx.scale(facing, 1);

    // 1. Spinning Tail Rotor
    const tailX = -38;
    const tailY = -6;
    ctx.save();
    ctx.translate(tailX, tailY);
    ctx.rotate(hind.rotorAngle * 2.2);
    ctx.strokeStyle = 'rgba(230, 230, 230, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();

    // 2. Tail Boom & Vertical Fin
    ctx.fillStyle = '#445139'; // Camo Soviet Green
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-38, -4);
    ctx.lineTo(-42, -12); // Vertical fin tip
    ctx.lineTo(-36, -12);
    ctx.lineTo(-32, -2);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();

    // 3. Engine Nacelles & Exhaust Shimmer
    ctx.fillStyle = '#394330';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-8, -12, 22, 7, 3);
    else if (ctx.rect) ctx.rect(-8, -12, 22, 7);
    else if (ctx.fillRect) ctx.fillRect(-8, -12, 22, 7);
    ctx.fill();
    // Titanium exhaust port with heat glow
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(-10, -10, 3, 4);

    // 4. Armored Helicopter Fuselage
    ctx.fillStyle = '#4e5d42';
    ctx.beginPath();
    ctx.moveTo(-15, 6);
    ctx.lineTo(14, 6);
    ctx.lineTo(28, 2);
    ctx.lineTo(34, -2); // Slender nose
    ctx.lineTo(24, -7);
    ctx.lineTo(0, -9);
    ctx.lineTo(-15, -4);
    ctx.closePath();
    ctx.fill();

    // Soviet Red Star Decal on fuselage
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', -2, 2);

    // 5. Tandem Bubble Canopies (Stepped Gunner & Pilot Cockpits)
    ctx.fillStyle = '#4fc3f7'; // Tinted cyan cockpit glass
    // Pilot bubble (rear)
    ctx.beginPath();
    ctx.arc(8, -6, 4.5, Math.PI, 0);
    ctx.fill();
    // Weapons officer bubble (front)
    ctx.beginPath();
    ctx.arc(20, -4, 4, Math.PI, 0);
    ctx.fill();

    // 6. Chin-mounted 12.7mm Yak-B Gatling Rotary Turret
    ctx.fillStyle = '#1c201a';
    ctx.fillRect(26, 1, 8, 3);
    ctx.strokeStyle = '#111310';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(34, 2);
    ctx.lineTo(41, 4);
    ctx.stroke();

    // 7. Stub Wings & Weapons Pylons
    ctx.fillStyle = '#3d4834';
    ctx.fillRect(2, 2, 8, 4);
    // UB-32 Rocket Pod
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 5, 12, 4, 1.5);
    else if (ctx.rect) ctx.rect(0, 5, 12, 4);
    else if (ctx.fillRect) ctx.fillRect(0, 5, 12, 4);
    ctx.fill();
    // AT-6 Spiral Missile Rail
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(2, 9, 8, 2);

    // 8. Main 5-Blade Rotor & Motion Blur Disk
    ctx.save();
    ctx.translate(6, -14);
    // Rotor Hub Mast
    ctx.fillStyle = '#263238';
    ctx.fillRect(-2, 0, 4, 4);

    // Semi-transparent rotor speed disk
    ctx.fillStyle = 'rgba(220, 235, 220, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blade streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    const bSpan = Math.cos(hind.rotorAngle) * 44;
    ctx.beginPath();
    ctx.moveTo(-bSpan, 0);
    ctx.lineTo(bSpan, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  // === TU-22M3 BACKFIRE SUPERSONIC STRATEGIC BOMBER (AIRBORNE BOSS) ===

  spawnStrategicBomber(wave) {
    if (!this.player) return;
    const facing = Math.random() < 0.5 ? 1 : -1;
    const startX = facing > 0 ? this.player.x - 1400 : this.player.x + 1400;
    const startY = 85 + Math.random() * 45; // High altitude supersonic ingress
    const maxHp = 340 + (wave - 1) * 80;

    this.bombers.push({
      x: startX,
      y: startY,
      speed: 3.2 + Math.min(1.8, (wave - 1) * 0.3),
      facing,
      hp: maxHp,
      maxHp,
      scoreValue: 1500,
      creditValue: 500,
      missileCooldown: 120, // Initial ready to launch
      tailGunCooldown: 60,
      alive: true
    });

    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('AWACS', '🚨 WARNING: Tu-22M3 BACKFIRE SUPERSONIC STRATEGIC BOMBER HIGH INGRESS!', 300);
    }
  }

  updateBombers() {
    const p = this.player;

    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const b = this.bombers[i];
      if (!b.alive) {
        this.bombers.splice(i, 1);
        continue;
      }

      // Fly across theater
      b.x += b.speed * b.facing;

      // Wrap around or turnaround if far away
      if (p) {
        const dx = b.x - p.x;
        if (b.facing > 0 && dx > 1800) {
          b.facing = -1;
          b.y = 85 + Math.random() * 45;
        } else if (b.facing < 0 && dx < -1800) {
          b.facing = 1;
          b.y = 85 + Math.random() * 45;
        }
      }

      // Supersonic Twin RD-25F Afterburner Exhaust Particles
      if (this.game.weapons && this.game.weapons.sparks && Math.random() < 0.7) {
        const exhaustX = b.x - b.facing * 38;
        const exhaustY = b.y - 1;
        this.game.weapons.sparks.push({
          x: exhaustX,
          y: exhaustY + (Math.random() - 0.5) * 5,
          vx: -b.facing * (4.5 + Math.random() * 2.5),
          vy: (Math.random() - 0.5) * 1.2,
          color: Math.random() < 0.5 ? '#ff4400' : '#00e5ff',
          life: 14,
          maxLife: 14
        });
      }

      // Heavy Standoff Kh-22 Cruise Missile Launch AI
      if (b.missileCooldown > 0) b.missileCooldown--;
      if (p && p.alive && b.missileCooldown <= 0) {
        const distToPlayer = Math.hypot(p.x - b.x, p.y - b.y);
        // Standoff launch range: 220px to 950px
        if (distToPlayer > 220 && distToPlayer < 950 && this.samMissiles.length < 10) {
          b.missileCooldown = Math.max(180, 360 - this.game.wave * 25);
          this.launchKh22CruiseMissile(b.x, b.y + 14, this.game.wave, b.facing);
        }
      }

      // Defensive Rear 23mm GSh-23 Tail Turret AI
      if (b.tailGunCooldown > 0) b.tailGunCooldown--;
      if (p && p.alive && b.tailGunCooldown <= 0) {
        const behind = (b.facing > 0 && p.x < b.x) || (b.facing < 0 && p.x > b.x);
        const dist = Math.hypot(p.x - b.x, p.y - b.y);
        if (behind && dist < 420) {
          b.tailGunCooldown = 45;
          const tailX = b.x - b.facing * 44;
          const tailY = b.y - 2;
          const tAngle = Math.atan2(p.y - tailY, p.x - tailX);
          const tSpeed = 9.5;
          this.enemyBullets.push({
            x: tailX,
            y: tailY,
            vx: Math.cos(tAngle) * tSpeed,
            vy: Math.sin(tAngle) * tSpeed,
            damage: 12,
            life: 60,
            alive: true
          });
          if (window.soundSystem) {
            window.soundSystem.play('cannon', { volume: 0.22 });
          }
        }
      }
    }
  }

  destroyBomber(b) {
    b.alive = false;
    window.soundSystem.play('bigboom', { volume: 1.0 });

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.game.weapons.createExplosion(
          b.x + (Math.random() - 0.5) * 60,
          b.y + (Math.random() - 0.5) * 30,
          'nuke',
          110
        );
      }, i * 140);
    }

    this.awardScore(b.scoreValue, b.creditValue, b.x, b.y);
    this.spawnBonusCrate(b.x, b.y);
    this.spawnBonusCrate(b.x + 25, b.y);

    if (this.game.addFloatingText) {
      this.game.addFloatingText('💥 STRATEGIC BOMBER SPLASHED! +$500', b.x, b.y - 30, '#ffd700');
    }
    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('COMMAND', '⭐⭐⭐ AIR SUPERIORITY: Tu-22M3 Backfire destroyed! Hostile cruise missile carrier down!', 300);
    }
  }

  drawBombers(ctx, cameraX) {
    for (const b of this.bombers) {
      if (!b.alive) continue;
      const sx = b.x - cameraX;
      if (sx < -160 || sx > 1460) continue;
      this.drawTu22mBomber(ctx, sx, b.y, b);
    }
  }

  drawTu22mBomber(ctx, sx, y, b) {
    ctx.save();
    const facing = b.facing || 1;

    // Boss Identity Overhead
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('⚡ TU-22M3 BACKFIRE STRATEGIC BOMBER ⚡', sx, y - 34);

    // Boss Health Bar
    const barW = 85;
    const barH = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(sx - barW / 2 - 1, y - 27, barW + 2, barH + 2);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(sx - barW / 2, y - 26, barW, barH);
    const hpFrac = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = hpFrac > 0.4 ? '#00e676' : '#ffea00';
    ctx.fillRect(sx - barW / 2, y - 26, barW * hpFrac, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barW / 2 - 1, y - 27, barW + 2, barH + 2);
    ctx.restore();

    ctx.save();
    ctx.translate(sx, y);
    if (ctx.scale) ctx.scale(facing, 1);

    // 1. Variable-Sweep Wings (Outer Swing Wings swept back at 65°)
    ctx.fillStyle = '#475569';
    // Port & Starboard Swept Wing Blades
    ctx.beginPath();
    ctx.moveTo(-10, -3);
    ctx.lineTo(-34, -18);
    ctx.lineTo(-28, -21);
    ctx.lineTo(8, -5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-10, 3);
    ctx.lineTo(-34, 18);
    ctx.lineTo(-28, 21);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();

    // 2. Fixed Wing Glove (Leading edge root extensions)
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(16, -7);
    ctx.lineTo(16, 7);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();

    // 3. Main Fuselage & Needle Nose Radome
    ctx.fillStyle = '#94a3b8'; // Russian naval maritime grey
    ctx.beginPath();
    ctx.moveTo(-42, -5);
    ctx.lineTo(-42, 5);
    ctx.lineTo(25, 4);
    ctx.lineTo(48, 0); // Sharp needle nose
    ctx.lineTo(25, -4);
    ctx.closePath();
    ctx.fill();

    // Radome Dielectric Tip
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(38, -2);
    ctx.lineTo(48, 0);
    ctx.lineTo(38, 2);
    ctx.closePath();
    ctx.fill();

    // 4. Cockpit Canopy
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(18, -4);
    ctx.lineTo(28, -2);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();

    // 5. Twin RD-25F Engine Air Intakes & Nozzles
    ctx.fillStyle = '#1e293b';
    // Square side air intakes
    ctx.fillRect(4, -8, 12, 4);
    ctx.fillRect(4, 4, 12, 4);
    // Afterburner exhaust nozzles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-44, -5, 4, 10);
    // Afterburner glow
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(-46, -4, 2, 8);

    // 6. Swept Vertical Stabilizer Tail Fin
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-28, -5);
    ctx.lineTo(-42, -22);
    ctx.lineTo(-36, -22);
    ctx.lineTo(-18, -5);
    ctx.closePath();
    ctx.fill();

    // Red Star on Tail Fin
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', -34, -14);

    // 7. Defensive Tail Turret (GSh-23 Twin 23mm)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-46, -2, 5, 4);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-46, -1);
    ctx.lineTo(-51, -1);
    ctx.moveTo(-46, 1);
    ctx.lineTo(-51, 1);
    ctx.stroke();

    // 8. Underslung Centerline Kh-22 Heavy Cruise Missile (If ready to launch)
    if (b.missileCooldown <= 60) {
      ctx.fillStyle = '#dc2626'; // Distinctive red radome
      ctx.fillRect(-8, 5, 20, 4);
      ctx.beginPath();
      ctx.moveTo(12, 5);
      ctx.lineTo(16, 7);
      ctx.lineTo(12, 9);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // === KIROV-CLASS ARMORED WAR ZEPPELIN DREADNOUGHT (GIANT AIRBORNE BOSS from Aircraft Evolution REA) ===

  spawnZeppelinDreadnought(wave = 5) {
    if (!this.player) return;
    if (this.zeppelins.length >= 1) return; // Only 1 active Dreadnought Zeppelin
    const facing = Math.random() < 0.5 ? 1 : -1;
    const startX = facing > 0 ? this.player.x - 1350 : this.player.x + 1350;
    const startY = 145; // High majestic cruising altitude
    const maxHp = 680 + Math.min(350, (wave - 1) * 80);

    this.zeppelins.push({
      x: startX,
      y: startY,
      speed: 1.15,
      facing,
      hp: maxHp,
      maxHp,
      scoreValue: 3500,
      creditValue: 1200,
      propellerAngle: 0,
      searchlightAngle: 0,
      noseGunCooldown: 70,
      topFlakCooldown: 120,
      bellyGunCooldown: 85,
      hitFlashTimer: 0,
      smokePoints: [
        { offsetX: -65, offsetY: -12, timer: 0 },
        { offsetX: 25, offsetY: 8, timer: 0 }
      ],
      alive: true
    });

    if (window.soundSystem) {
      if (typeof window.soundSystem.playCockpitAlert === 'function') {
        window.soundSystem.playCockpitAlert();
      } else {
        window.soundSystem.play('beep', { volume: 1.0 });
      }
    }

    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('COMMAND', '🚨 EMERGENCY: HEAVY ARMORED WAR ZEPPELIN DREADNOUGHT SPOTTED! TARGET THE AIRSHIP ENVELOPE!', 350);
    }
  }

  updateZeppelins() {
    const p = this.player;

    for (let i = this.zeppelins.length - 1; i >= 0; i--) {
      const z = this.zeppelins[i];
      if (!z.alive) {
        this.zeppelins.splice(i, 1);
        continue;
      }

      z.propellerAngle = ((z.propellerAngle || 0) + 0.45) % (Math.PI * 2);
      z.searchlightAngle = Math.sin(Date.now() * 0.002) * 0.45;
      z.x += z.facing * z.speed;

      // Reverse direction at world bounds
      if (this.game.terrain) {
        if (z.x < 350) z.facing = 1;
        if (z.x > this.game.terrain.mapWidth - 350) z.facing = -1;
      }

      // Damage smoke trails from punctured gas cells
      const hpFrac = z.hp / z.maxHp;
      if (hpFrac < 0.65) {
        for (const sp of z.smokePoints) {
          sp.timer++;
          if (sp.timer % 6 === 0 && this.damageParticles) {
            this.damageParticles.push({
              x: z.x + sp.offsetX * z.facing,
              y: z.y + sp.offsetY,
              vx: -z.facing * (0.8 + Math.random() * 0.6),
              vy: -0.6 - Math.random() * 0.8,
              radius: hpFrac < 0.3 ? 7 : 5,
              maxRadius: hpFrac < 0.3 ? 28 : 18,
              life: 45,
              maxLife: 45,
              type: hpFrac < 0.3 && Math.random() < 0.45 ? 'fire' : 'smoke',
              color: hpFrac < 0.3 ? 'rgba(255, 60, 0,' : 'rgba(40, 45, 50,'
            });
          }
        }
      }

      // Check EMP Disabled Status
      if (z.empDisabledTimer > 0) {
        z.empDisabledTimer--;
        if (Math.random() < 0.4 && this.game.weapons && this.game.weapons.sparks) {
          this.game.weapons.sparks.push({
            x: z.x + (Math.random() - 0.5) * 120,
            y: z.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2,
            life: 18,
            maxLife: 18,
            color: '#00e5ff'
          });
        }
        continue; // Turrets temporarily offline
      }

      if (p && p.alive) {
        const dist = Math.hypot(p.x - z.x, p.y - z.y);

        // 1. Nose 37mm rapid-fire twin cannon
        if (z.noseGunCooldown > 0) z.noseGunCooldown--;
        if (z.noseGunCooldown <= 0 && dist < 700) {
          z.noseGunCooldown = 90;
          const gunX = z.x + z.facing * 95;
          const gunY = z.y + 12;
          const aimAngle = Math.atan2(p.y - gunY, p.x - gunX);
          this.enemyBullets.push({
            x: gunX,
            y: gunY,
            vx: Math.cos(aimAngle) * 7.5,
            vy: Math.sin(aimAngle) * 7.5,
            damage: 18,
            life: 110,
            color: '#ff8800',
            radius: 3.5,
            alive: true
          });
          if (window.soundSystem) window.soundSystem.play('shot', { volume: 0.6 });
        }

        // 2. Upper Deck Heavy Flak Turret (creates proximity bursts)
        if (z.topFlakCooldown > 0) z.topFlakCooldown--;
        if (z.topFlakCooldown <= 0 && dist < 850 && p.y < z.y + 40) {
          z.topFlakCooldown = 135;
          const flakX = z.x - z.facing * 20;
          const flakY = z.y - 32;
          const aimAngle = Math.atan2(p.y - flakY, p.x - flakX);
          this.enemyBullets.push({
            x: flakX,
            y: flakY,
            vx: Math.cos(aimAngle) * 6.5,
            vy: Math.sin(aimAngle) * 6.5,
            damage: 28,
            life: 80,
            isFlak: true,
            color: '#ffdd44',
            radius: 5,
            alive: true
          });
          if (window.soundSystem) window.soundSystem.play('shot', { volume: 0.75 });
        }

        // 3. Belly Gondola Heavy Machine Gun (firing down at passing aircraft)
        if (z.bellyGunCooldown > 0) z.bellyGunCooldown--;
        if (z.bellyGunCooldown <= 0 && dist < 550 && p.y > z.y) {
          z.bellyGunCooldown = 75;
          const gondolaX = z.x;
          const gondolaY = z.y + 36;
          const aimAngle = Math.atan2(p.y - gondolaY, p.x - gondolaX);
          this.enemyBullets.push({
            x: gondolaX,
            y: gondolaY,
            vx: Math.cos(aimAngle) * 8.0,
            vy: Math.sin(aimAngle) * 8.0,
            damage: 15,
            life: 95,
            color: '#ff4444',
            radius: 3,
            alive: true
          });
        }
      }
    }
  }

  destroyZeppelin(z) {
    z.alive = false;
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        this.game.weapons.createExplosion(
          z.x + (Math.random() - 0.5) * 160,
          z.y + (Math.random() - 0.5) * 45,
          i % 2 === 0 ? 'large' : 'medium',
          85
        );
      }, i * 160);
    }

    this.awardScore(z.scoreValue, z.creditValue, z.x, z.y);
    this.spawnBonusCrate(z.x - 40, z.y);
    this.spawnBonusCrate(z.x, z.y);
    this.spawnBonusCrate(z.x + 40, z.y);
    this.spawnBonusCrate(z.x + 80, z.y);

    if (this.game.addFloatingText) {
      this.game.addFloatingText('💥 WAR ZEPPELIN DREADNOUGHT DESTROYED! +$1200', z.x, z.y - 45, '#ffd700');
    }
    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('COMMAND', '⭐⭐⭐ VICTORY: Kirov War Zeppelin destroyed! Hostile flagship eliminated!', 320);
    }
  }

  drawZeppelins(ctx, cameraX) {
    for (const z of this.zeppelins) {
      if (!z.alive) continue;
      const sx = z.x - cameraX;
      if (sx < -220 || sx > 1500) continue;
      ctx.save();
      if (z.hitFlashTimer && z.hitFlashTimer > 0) {
        z.hitFlashTimer--;
        ctx.filter = 'brightness(3.2) contrast(1.5)';
      }
      this.drawZeppelinDreadnought(ctx, sx, z.y, z);
      ctx.restore();
    }
  }

  drawZeppelinDreadnought(ctx, sx, y, z) {
    ctx.save();
    const facing = z.facing || 1;

    // Boss Identity Overhead
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('⚡ KIROV ARMORED WAR ZEPPELIN DREADNOUGHT ⚡', sx, y - 46);

    // Boss Health Bar
    const barW = 120;
    const barH = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(sx - barW / 2 - 1, y - 38, barW + 2, barH + 2);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(sx - barW / 2, y - 37, barW, barH);
    const hpFrac = Math.max(0, z.hp / z.maxHp);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sx - barW / 2, y - 37, barW * hpFrac, barH);
    ctx.restore();

    ctx.translate(sx, y);
    ctx.scale(facing, 1);

    // 1. Searchlight Conical Beam
    ctx.save();
    ctx.rotate(z.searchlightAngle || 0);
    const beamGrad = ctx.createLinearGradient(0, 35, 0, 240);
    beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.35)');
    beamGrad.addColorStop(0.5, 'rgba(255, 255, 200, 0.12)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.lineTo(-65, 240);
    ctx.lineTo(65, 240);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Main Rigid Airship Hull Envelope (Battleship Grey with Dark Armor Plating)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor Belly Plate
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 8, 102, 22, 0, 0, Math.PI);
    ctx.fill();

    // Rivet & Panel Seams
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    for (let px = -80; px <= 80; px += 35) {
      ctx.beginPath();
      ctx.moveTo(px, -28);
      ctx.lineTo(px, 28);
      ctx.stroke();
    }

    // 3. Tail Stabilizer Fins (Cruciform)
    ctx.fillStyle = '#334155';
    // Top Fin
    ctx.beginPath();
    ctx.moveTo(-85, -20);
    ctx.lineTo(-125, -42);
    ctx.lineTo(-105, -15);
    ctx.closePath();
    ctx.fill();
    // Bottom Fin
    ctx.beginPath();
    ctx.moveTo(-85, 20);
    ctx.lineTo(-125, 42);
    ctx.lineTo(-105, 15);
    ctx.closePath();
    ctx.fill();

    // Red Star Emblem on Envelope
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', -35, 6);

    // 4. Engine Nacelles & Rotating Propellers (Flank Mounted)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-45, 18, 22, 10);
    ctx.fillRect(15, 18, 22, 10);
    // Spinning brass propeller blades
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    const pAng = z.propellerAngle || 0;
    // Rear engine prop
    ctx.beginPath();
    ctx.moveTo(-45, 23);
    ctx.lineTo(-45 - Math.cos(pAng) * 12, 23 - Math.sin(pAng) * 12);
    ctx.moveTo(-45, 23);
    ctx.lineTo(-45 + Math.cos(pAng) * 12, 23 + Math.sin(pAng) * 12);
    ctx.stroke();
    // Forward engine prop
    ctx.beginPath();
    ctx.moveTo(15, 23);
    ctx.lineTo(15 - Math.cos(pAng) * 12, 23 - Math.sin(pAng) * 12);
    ctx.moveTo(15, 23);
    ctx.lineTo(15 + Math.cos(pAng) * 12, 23 + Math.sin(pAng) * 12);
    ctx.stroke();

    // 5. Lower Command Gondola & Observation Cabins
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-28, 28, 56, 12);
    // Portholes (Warm amber lights)
    ctx.fillStyle = '#fbbf24';
    for (let w = -20; w <= 20; w += 10) {
      ctx.fillRect(w - 2, 32, 4, 4);
    }

    // 6. Defensive Weapons: Nose Cannon & Top Flak Gun
    // Nose Gun
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(92, 6, 12, 5);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(104, 8); ctx.lineTo(115, 8);
    ctx.moveTo(104, 10); ctx.lineTo(115, 10);
    ctx.stroke();

    // Upper Flak Turret Cupola
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-20, -30, 8, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-20, -34);
    ctx.lineTo(-20 + Math.cos(-Math.PI / 3) * 14, -34 + Math.sin(-Math.PI / 3) * 14);
    ctx.stroke();

    ctx.restore();
  }

  // 9. S-400 Triumf ("SA-21 Growler" / "Sudarshan Chakra") 8x8 Heavy TEL Mobile Battery
  drawS400(ctx, sx, y, e) {
    ctx.save();

    // S-400 Identity Badge Overhead when player approaches
    if (e.erectAngle > 0.15) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('⚡ S-400 TRIUMF (SA-21) ⚡', sx, y - 38);
      ctx.restore();
    }

    // 1. Hydraulic Outrigger Stabilizer Jacks (Extend down when erecting to absorb launch forces)
    if (e.jacksDeployed) {
      ctx.fillStyle = '#222822';
      ctx.fillRect(sx - 24, y - 3, 4, 8); // Rear jack leg
      ctx.fillRect(sx + 18, y - 3, 4, 8); // Front jack leg
      ctx.fillStyle = '#556050';
      ctx.fillRect(sx - 27, y + 4, 10, 2); // Rear foot pad
      ctx.fillRect(sx + 15, y + 4, 10, 2); // Front foot pad
    }

    // 2. Heavy 8x8 All-Terrain Truck Wheels (4 dual wheel axles)
    const wheelPositions = [-22, -10, 6, 18];
    for (const wx of wheelPositions) {
      // Outer tire tread
      ctx.fillStyle = '#1c201a';
      ctx.beginPath();
      ctx.arc(sx + wx, y - 3, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Steel wheel rim & hub
      ctx.fillStyle = '#445040';
      ctx.beginPath();
      ctx.arc(sx + wx, y - 3, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(sx + wx, y - 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Heavy 8x8 Chassis Frame & Bed
    ctx.fillStyle = '#2d3826'; // Dark Russian military green
    ctx.fillRect(sx - 28, y - 10, 56, 7);

    // 4. Armored Driver & Operations Cabin (Front Cab)
    ctx.fillStyle = '#3a4832';
    ctx.beginPath();
    ctx.moveTo(sx + 14, y - 10);
    ctx.lineTo(sx + 28, y - 10);
    ctx.lineTo(sx + 28, y - 22);
    ctx.lineTo(sx + 18, y - 22);
    ctx.lineTo(sx + 14, y - 14);
    ctx.closePath();
    ctx.fill();

    // Cabin Windshield Vision Ports (Tinted armored glass)
    ctx.fillStyle = '#78909c';
    ctx.fillRect(sx + 19, y - 20, 7, 5);

    // Amber Tactical Strobe on Cab Roof
    ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0) ? '#ffaa00' : '#885500';
    ctx.fillRect(sx + 22, y - 24, 3, 2);

    // 5. Equipment Shelter & Rotating Phased-Array Radar Dish
    ctx.fillStyle = '#425239';
    ctx.fillRect(sx - 2, y - 18, 15, 8);

    // Rotating Radar Mast & Dish
    const dishOffset = Math.sin(e.radarSpin || 0) * 7;
    ctx.strokeStyle = '#222822';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 5, y - 18);
    ctx.lineTo(sx + 5, y - 26);
    ctx.stroke();

    // Radar Phased-Array Dish (elliptical rotation illusion)
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.ellipse(sx + 5, y - 27, Math.max(1.5, Math.abs(dishOffset)), 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Transporter Erector Launcher (TEL) - Quad Canister Pack
    // Pivot hinge at rear: sx - 18, y - 10
    ctx.save();
    const pivotX = sx - 18;
    const pivotY = y - 10;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(-e.erectAngle); // 0 = horizontal, -0.44*PI = tilted up ~80 degrees

    // Hydraulic Erector Piston
    if (e.erectAngle > 0.05) {
      ctx.strokeStyle = '#8899aa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(12, 8 * Math.sin(e.erectAngle));
      ctx.stroke();
    }

    // Heavy Quad Canister Base Cradle
    ctx.fillStyle = '#283324';
    ctx.fillRect(0, -7, 36, 12);

    // Upper Tier Tubes (2 cylinders)
    ctx.fillStyle = '#3f5038';
    ctx.fillRect(0, -10, 36, 6);
    // Lower Tier Tubes (2 cylinders)
    ctx.fillStyle = '#34422e';
    ctx.fillRect(0, -4, 36, 6);

    // End Sealing Caps & Hazardous Payload Bands
    ctx.fillStyle = '#d32f2f'; // Red missile nose warning caps
    ctx.fillRect(34, -10, 3, 12);
    ctx.fillStyle = '#fbc02d'; // Yellow caution band
    ctx.fillRect(10, -10, 2, 12);
    ctx.fillRect(24, -10, 2, 12);

    ctx.restore();
    ctx.restore();
  }

  // 12. Akash Air Defence System (Tracked 3-Missile Ramjet Launcher)
  drawAkashSAM(ctx, sx, y, e) {
    ctx.save();

    // Overhead identification text when in lock or aiming
    if (e.aimAngle && Math.abs(e.aimAngle) > 0.2) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('⚡ AKASH SAM (RAJENDRA 3D PESA) ⚡', sx, y - 36);
      ctx.restore();
    }

    // BMP-2 Derived Tracked Armored Hull (Olive Green & Khaki Camo)
    ctx.fillStyle = '#38462a';
    ctx.fillRect(sx - 24, y - 10, 48, 8);
    // Khaki camouflage blotches
    ctx.fillStyle = '#5c5032';
    ctx.fillRect(sx - 18, y - 9, 14, 6);
    ctx.fillRect(sx + 6, y - 9, 12, 6);

    // Track Skirts & Road Wheels (6 pairs)
    ctx.fillStyle = '#1c201a';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - 26, y - 5, 52, 6, 2.5);
    else if (ctx.rect) ctx.rect(sx - 26, y - 5, 52, 6);
    else if (ctx.fillRect) ctx.fillRect(sx - 26, y - 5, 52, 6);
    ctx.fill();
    ctx.fillStyle = '#4a5742';
    for (let wx = -20; wx <= 20; wx += 8) {
      ctx.beginPath();
      ctx.arc(sx + wx, y - 2, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Armored Central Turret Base
    ctx.fillStyle = '#445435';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - 12, y - 16, 24, 7, 2);
    else if (ctx.rect) ctx.rect(sx - 12, y - 16, 24, 7);
    else if (ctx.fillRect) ctx.fillRect(sx - 12, y - 16, 24, 7);
    ctx.fill();

    // Rajendra Radar / Data Link Mast Antenna
    ctx.strokeStyle = '#22281e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 8, y - 16);
    ctx.lineTo(sx - 8, y - 25);
    ctx.stroke();
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(sx - 11, y - 28, 6, 4);

    // 3-Missile Triple Rail Mount (Pivoting at sx + 2, y - 14)
    ctx.save();
    ctx.translate(sx + 2, y - 14);
    const aim = e.aimAngle || -0.65;
    ctx.rotate(aim);

    // Steel Guide Rails
    ctx.fillStyle = '#1e241b';
    ctx.fillRect(0, -4, 28, 5);

    // 3x Akash Ramjet Missiles on Rails
    const railOffsets = [-5, 0, 5];
    for (const off of railOffsets) {
      // White cylindrical missile body
      ctx.fillStyle = '#edf2f7';
      ctx.fillRect(2, off - 1.5, 26, 3);
      // Red missile seeker radome
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.moveTo(28, off);
      ctx.lineTo(31, off);
      ctx.lineTo(28, off - 1.5);
      ctx.closePath();
      ctx.fill();
      // Mid-body ramjet air-intake nacelles
      ctx.fillStyle = '#dd6b20';
      ctx.fillRect(11, off - 2.5, 6, 5);
      // Cruciform tail stabilization fins
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(3, off - 3, 4, 6);
    }
    ctx.restore();

    ctx.restore();
  }

  // 13. 2K22 Tunguska SPAAGM (Tracked Dual 30mm Flak + 8 Missiles)
  drawTunguska(ctx, sx, y, e) {
    ctx.save();

    // Overhead identification badge
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ff3b30';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('⚡ 2K22 TUNGUSKA (SA-19) ⚡', sx, y - 36);
    ctx.restore();

    // GM-352M Heavy Tracked Chassis
    ctx.fillStyle = '#2d3a24';
    ctx.fillRect(sx - 25, y - 11, 50, 8);

    // Track Wheels & Skirts
    ctx.fillStyle = '#181e15';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx - 27, y - 5, 54, 6, 2.5);
    else if (ctx.rect) ctx.rect(sx - 27, y - 5, 54, 6);
    else if (ctx.fillRect) ctx.fillRect(sx - 27, y - 5, 54, 6);
    ctx.fill();
    ctx.fillStyle = '#445237';
    for (let wx = -21; wx <= 21; wx += 8.4) {
      ctx.beginPath();
      ctx.arc(sx + wx, y - 2, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Angular Armored Turret
    ctx.fillStyle = '#39492f';
    ctx.fillRect(sx - 14, y - 18, 28, 8);

    // Rotating 1RL144 Target Acquisition Radar Dish on Turret Rear
    const rSpin = e.radarSpin || 0;
    ctx.strokeStyle = '#1e2619';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 9, y - 18);
    ctx.lineTo(sx - 9, y - 27);
    ctx.stroke();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(sx - 9, y - 28, Math.max(1.5, Math.abs(Math.sin(rSpin) * 7)), 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8x 9M311 Missile Launch Canisters (4 on each side)
    ctx.fillStyle = '#1c221a';
    ctx.fillRect(sx - 12, y - 22, 9, 5); // Left cluster
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(sx - 3, y - 22, 2, 5); // Red missile caps

    // Dual Twin-Barrel 30mm 2A38M Autocannons
    ctx.save();
    ctx.translate(sx + 6, y - 15);
    const aim = e.aimAngle || -0.65;
    ctx.rotate(aim);

    // Twin Gun Barrels
    ctx.strokeStyle = '#151b12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(24, -2);
    ctx.moveTo(0, 2);
    ctx.lineTo(24, 2);
    ctx.stroke();

    // Muzzle compensator flash fire when firing
    if (e.flakTimer && e.flakTimer < 4) {
      ctx.fillStyle = '#ff7700';
      ctx.beginPath();
      ctx.arc(26, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(26, 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, -3, 2, 6);
    }
    ctx.restore();

    ctx.restore();
  }

  // 9. MiG-29 Fulcrum 4th-Gen Air Superiority Interceptor
  drawMig29(ctx, mig) {
    ctx.save();
    // Afterburner Thrust Flames
    if (mig.afterburner || Math.abs(mig.vx) > 7.5) {
      const flm = 16 + Math.random() * 12;
      ctx.fillStyle = '#ff5500';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 8;
      // Twin engine plumes
      ctx.beginPath();
      ctx.moveTo(-22, -6);
      ctx.lineTo(-22 - flm, -4);
      ctx.lineTo(-22, -2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-22, 2);
      ctx.lineTo(-22 - flm, 4);
      ctx.lineTo(-22, 6);
      ctx.fill();
      // Core blue supersonic shock diamond
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-22 - flm * 0.4, -4.5, flm * 0.3, 1.5);
      ctx.fillRect(-22 - flm * 0.4, 3.5, flm * 0.3, 1.5);
      ctx.shadowBlur = 0;
    }

    // Wings & Blended Fuselage (Dark Blue-Grey Camo)
    ctx.fillStyle = '#3a4e5e';
    ctx.strokeStyle = '#1d2730';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(26, 0); // Nose tip
    ctx.lineTo(8, -6); // LERX
    ctx.lineTo(-12, -20); // Wingtip Port
    ctx.lineTo(-18, -19);
    ctx.lineTo(-14, -6); // Wing root
    ctx.lineTo(-24, -6); // Engine port
    ctx.lineTo(-24, 6);  // Engine stbd
    ctx.lineTo(-14, 6);  // Wing root
    ctx.lineTo(-18, 19);
    ctx.lineTo(-12, 20); // Wingtip Stbd
    ctx.lineTo(8, 6);   // LERX
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Canted Vertical Stabilizers
    ctx.fillStyle = '#2c3c4a';
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.lineTo(-23, -11);
    ctx.lineTo(-17, -5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12, 7);
    ctx.lineTo(-23, 11);
    ctx.lineTo(-17, 5);
    ctx.closePath();
    ctx.fill();

    // Red Star Insignia on Wings
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(-8, -12, 2.5, 0, Math.PI * 2);
    ctx.arc(-8, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tinted Bubble Cockpit Canopy
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.ellipse(6, 0, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, -1, 4, 1.5); // Sunlight glint

    // Underwing R-73 Archer Missile Rails
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(-10, -21, 8, 1.5);
    ctx.fillRect(-10, 19.5, 8, 1.5);
    ctx.fillStyle = '#ff3300'; // Missile infrared seeker tip
    ctx.fillRect(-2, -21, 2, 1.5);
    ctx.fillRect(-2, 19.5, 2, 1.5);
    ctx.restore();
  }

  // 10. Su-35 Flanker-E 4.5++ Gen Super-Maneuverable Dominance
  drawSu35(ctx, mig) {
    ctx.save();
    // 3D Thrust-Vectoring Supersonic Afterburners
    if (mig.afterburner || Math.abs(mig.vx) > 8.0) {
      const flm = 24 + Math.random() * 14;
      ctx.fillStyle = '#ff7700';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 10;
      // Twin AL-41F1S afterburners
      ctx.beginPath();
      ctx.moveTo(-26, -7);
      ctx.lineTo(-26 - flm, -5);
      ctx.lineTo(-26, -3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, 3);
      ctx.lineTo(-26 - flm, 5);
      ctx.lineTo(-26, 7);
      ctx.fill();
      // Intense cyan supersonic shock diamonds
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-26 - flm * 0.35, -5.5, flm * 0.25, 1.8);
      ctx.fillRect(-26 - flm * 0.35, 4.5, flm * 0.25, 1.8);
      ctx.shadowBlur = 0;
    }

    // Large Blended Airframe (Splinter Cyan-Grey Camouflage)
    ctx.fillStyle = '#47697d';
    ctx.strokeStyle = '#1b2d38';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(34, 0);  // Needle radome tip
    ctx.lineTo(12, -7);  // Curved LERX
    ctx.lineTo(-14, -25); // Port wingtip
    ctx.lineTo(-22, -23);
    ctx.lineTo(-18, -8);  // Trailing root
    ctx.lineTo(-30, 0);   // Extended rear stinger radar tailcone
    ctx.lineTo(-18, 8);   // Trailing root
    ctx.lineTo(-22, 23);
    ctx.lineTo(-14, 25);  // Stbd wingtip
    ctx.lineTo(12, 7);   // Curved LERX
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Splinter Camo Patches
    ctx.fillStyle = '#6d92a8';
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(-2, -14);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(-6, 15);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    // Twin Tall Vertical Stabilizers
    ctx.fillStyle = '#314c5c';
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(-27, -13);
    ctx.lineTo(-20, -6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(-27, 13);
    ctx.lineTo(-20, 6);
    ctx.closePath();
    ctx.fill();

    // Long Tinted Cockpit
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.ellipse(10, 0, 10, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, -1, 5, 1.5);

    // Wingtip R-77 Active Radar Viper Missile Rails
    ctx.fillStyle = '#edf2f7';
    ctx.fillRect(-12, -26, 10, 1.8);
    ctx.fillRect(-12, 24.2, 10, 1.8);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-2, -26, 2, 1.8);
    ctx.fillRect(-2, 24.2, 2, 1.8);
    ctx.restore();
  }

  // 11. Su-57 Felon 5th-Gen Stealth Hypersonic Air Superiority Fighter
  drawSu57(ctx, mig) {
    ctx.save();
    // Hypersonic Plasma Blue Afterburner Plumes
    if (mig.afterburner || Math.abs(mig.vx) > 8.5) {
      const flm = 28 + Math.random() * 16;
      ctx.fillStyle = '#00b0ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-28, -7);
      ctx.lineTo(-28 - flm, -5);
      ctx.lineTo(-28, -3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-28, 3);
      ctx.lineTo(-28 - flm, 5);
      ctx.lineTo(-28, 7);
      ctx.fill();
      // Pure white plasma core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-28 - flm * 0.45, -5.5, flm * 0.35, 1.5);
      ctx.fillRect(-28 - flm * 0.45, 4.5, flm * 0.35, 1.5);
      ctx.shadowBlur = 0;
    }

    // Stealth Diamond-Trapezoid Airframe (Matte Radar-Absorbing Charcoal)
    ctx.fillStyle = '#1c2226';
    ctx.strokeStyle = '#36434d';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(36, 0);   // Chined faceted stealth nose
    ctx.lineTo(14, -9);  // Forward chine
    ctx.lineTo(-8, -27); // Diamond wingtip port
    ctx.lineTo(-18, -25);
    ctx.lineTo(-15, -11); // Forward-swept trailing edge
    ctx.lineTo(-28, -8);  // Engine nozzle port
    ctx.lineTo(-24, 0);   // Beaver-tail central spine
    ctx.lineTo(-28, 8);   // Engine nozzle stbd
    ctx.lineTo(-15, 11); // Forward-swept trailing edge
    ctx.lineTo(-18, 25);
    ctx.lineTo(-8, 27);  // Diamond wingtip stbd
    ctx.lineTo(14, 9);   // Forward chine
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stealth Digital Polygonal Camouflage
    ctx.fillStyle = '#2f3940';
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(-6, -18);
    ctx.lineTo(-12, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(-8, 19);
    ctx.lineTo(-14, 11);
    ctx.closePath();
    ctx.fill();

    // Internal Weapons Bay Seam Lines
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-8, -3.5, 14, 7);

    // Stealth Canted All-Moving Tailfins
    ctx.fillStyle = '#13181b';
    ctx.beginPath();
    ctx.moveTo(-16, -9);
    ctx.lineTo(-30, -14);
    ctx.lineTo(-24, -6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, 9);
    ctx.lineTo(-30, 14);
    ctx.lineTo(-24, 6);
    ctx.closePath();
    ctx.fill();

    // Gold-Indium Oxide Coated Stealth Canopy
    ctx.fillStyle = '#e6a100';
    ctx.beginPath();
    ctx.ellipse(12, 0, 10, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, -1, 5, 1.2);
    ctx.restore();
  }

  // 12. Ka-52 Alligator Coaxial Hunter-Killer Attack Helicopter
  drawKa52(ctx, mig) {
    ctx.save();
    // Main Fuselage (Army Black / Olive Camo)
    ctx.fillStyle = '#1d271e';
    ctx.strokeStyle = '#101611';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(26, 2);   // Nose radome
    ctx.lineTo(16, -6);  // Cockpit roof
    ctx.lineTo(-10, -5); // Engine bay
    ctx.lineTo(-28, -2); // Tailboom
    ctx.lineTo(-30, -7); // Twin vertical tail fin port
    ctx.lineTo(-33, -7);
    ctx.lineTo(-31, 0);
    ctx.lineTo(-33, 7);  // Twin vertical tail fin stbd
    ctx.lineTo(-30, 7);
    ctx.lineTo(-28, 2);
    ctx.lineTo(-10, 5);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side Stub-Wings with B-8 Rocket Pods & Igla AAMs
    ctx.fillStyle = '#2b382d';
    ctx.fillRect(-6, -17, 10, 3);
    ctx.fillRect(-6, 14, 10, 3);
    // Rocket pods
    ctx.fillStyle = '#78909c';
    ctx.fillRect(-4, -19, 8, 2.5);
    ctx.fillRect(-4, 16.5, 8, 2.5);

    // Cheek-mounted 30mm 2A42 Autocannon (Starboard side)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(10, 6);
    ctx.lineTo(26, 6);
    ctx.stroke();
    // Muzzle brake
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(24, 5, 2, 2);

    // Coaxial Counter-Rotating Dual Rotors
    const rot1 = mig.rotorAngle1 || 0;
    const rot2 = mig.rotorAngle2 || 0;
    ctx.strokeStyle = 'rgba(230, 240, 245, 0.75)';
    ctx.lineWidth = 1.8;
    // Lower Rotor
    ctx.beginPath();
    ctx.moveTo(-2 + Math.cos(rot1) * 36, -2 + Math.sin(rot1) * 12);
    ctx.lineTo(-2 - Math.cos(rot1) * 36, -2 - Math.sin(rot1) * 12);
    ctx.stroke();
    // Upper Rotor (spinning in opposite direction!)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-2 + Math.cos(rot2) * 38, -6 + Math.sin(rot2) * 12);
    ctx.lineTo(-2 - Math.cos(rot2) * 38, -6 - Math.sin(rot2) * 12);
    ctx.stroke();

    // Armored Cockpit Canopy
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.ellipse(14, -1, 7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 13. MiG-21bis Classic Delta Interceptor
  drawMig21(ctx, mig) {
    ctx.save();
    const migSprite = mig.sprite;
    if (migSprite && migSprite.complete) {
      ctx.drawImage(migSprite, -migSprite.width / 2, -migSprite.height / 2);
    } else {
      // Procedural fallback
      ctx.fillStyle = '#90a4ae';
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(6, -4);
      ctx.lineTo(-12, -18);
      ctx.lineTo(-16, -18);
      ctx.lineTo(-14, -4);
      ctx.lineTo(-22, -4);
      ctx.lineTo(-22, 4);
      ctx.lineTo(-14, 4);
      ctx.lineTo(-16, 18);
      ctx.lineTo(-12, 18);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nose intake shock cone
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(22, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // === TACTICAL FUEL DEPOT & AMMO BARRELS (CHAIN REACTIONS) ===
  drawFuelBarrel(ctx, sx, y, e) {
    ctx.save();
    ctx.translate(sx, y);

    // 1. Red 55-Gallon Steel Drum Body with Metallic Shading
    const barrelW = 14;
    const barrelH = 20;
    const grad = ctx.createLinearGradient(-barrelW / 2, 0, barrelW / 2, 0);
    grad.addColorStop(0, '#770000');
    grad.addColorStop(0.3, '#dd2222');
    grad.addColorStop(0.7, '#ff4444');
    grad.addColorStop(1, '#550000');
    ctx.fillStyle = grad;
    ctx.fillRect(-barrelW / 2, -barrelH, barrelW, barrelH);

    // Outer border
    ctx.strokeStyle = '#220000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barrelW / 2, -barrelH, barrelW, barrelH);

    // 2. Black Reinforcement Chimes / Steel Hoops
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-barrelW / 2 - 1, -barrelH + 4, barrelW + 2, 2.5);
    ctx.fillRect(-barrelW / 2 - 1, -barrelH / 2 - 1, barrelW + 2, 2.5);
    ctx.fillRect(-barrelW / 2 - 1, -6, barrelW + 2, 2.5);

    // 3. Top Rim & Metal Bung Cap
    ctx.fillStyle = '#991111';
    ctx.fillRect(-barrelW / 2, -barrelH - 1.5, barrelW, 2);
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(2, -barrelH - 2.5, 3, 2);

    // 4. Yellow Hazmat Flammable Diamond
    ctx.save();
    ctx.translate(0, -barrelH / 2 + 1);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffee00';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // Flame core inside diamond
    ctx.fillStyle = '#dd1100';
    ctx.beginPath();
    ctx.arc(0, -barrelH / 2 + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // === MULTI-TIER PROCEDURAL TANK RENDERING ===

  drawTank(ctx, sx, y, e) {
    ctx.save();
    const subType = e.subType || (e.isT72 ? 't90' : 't34');

    // 1. Draw Energy Shield Barrier Dome (TOS-1A Buratino)
    if (e.hasShield && e.shieldHp > 0) {
      ctx.save();
      const shieldRatio = e.shieldHp / (e.maxShieldHp || 120);
      const pulse = Math.sin(Date.now() * 0.008) * 2.5;
      const r = 38 + pulse;
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + shieldRatio * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = `rgba(0, 200, 255, ${0.08 + shieldRatio * 0.14})`;
      ctx.beginPath();
      ctx.arc(sx, y - 10, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hexagonal outer rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, y - 10, r - 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Dispatch to model renderer
    if (subType === 'abrams') {
      this.drawAbrams(ctx, sx, y, e);
    } else if (subType === 't90') {
      this.drawT90M(ctx, sx, y, e);
    } else if (subType === 'koalitsia') {
      this.drawKoalitsia(ctx, sx, y, e);
    } else if (subType === 'buratino') {
      this.drawBuratino(ctx, sx, y, e);
    } else if (subType === 'sherman') {
      this.drawSherman(ctx, sx, y, e);
    } else {
      this.drawT34(ctx, sx, y, e);
    }

    // 3. Entrenchment Berm / Sandbags
    if (e.isEntrenched) {
      ctx.fillStyle = '#b38d50';
      for (let sb = -20; sb <= 20; sb += 10) {
        ctx.beginPath();
        ctx.arc(sx + sb, y + 2, 5, 0, Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = '#5a4628';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx - 24, y + 3);
      ctx.lineTo(sx + 24, y + 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 1. M1A2 Abrams Main Battle Tank (120mm Smoothbore Gun + CITV + .50 cal)
  drawAbrams(ctx, sx, y, e) {
    ctx.save();
    const recoil = e.recoil || 0;
    const turretAngle = e.turretAngle || -0.35;

    // Track Assembly & Rubber Side Skirts
    ctx.fillStyle = '#222622';
    ctx.fillRect(sx - 27, y - 6, 54, 8); // Track tread outline
    ctx.fillStyle = '#6e7a5e'; // NATO Woodland Green
    ctx.fillRect(sx - 28, y - 9, 56, 5); // Side skirt armor plate

    // 7 Road wheels per side
    ctx.fillStyle = '#1c1f1c';
    for (let w = -22; w <= 22; w += 7.3) {
      ctx.beginPath();
      ctx.arc(sx + w, y, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sloped Hull
    ctx.fillStyle = '#5c674e';
    ctx.beginPath();
    ctx.moveTo(sx - 26, y - 6);
    ctx.lineTo(sx - 20, y - 13);
    ctx.lineTo(sx + 22, y - 13);
    ctx.lineTo(sx + 26, y - 6);
    ctx.closePath();
    ctx.fill();

    // Rotatable Turret with Blowout Bustle Rack
    ctx.save();
    ctx.translate(sx, y - 13);

    // Turret Hull
    ctx.fillStyle = '#4c5640';
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-14, -8);
    ctx.lineTo(14, -8);
    ctx.lineTo(18, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#32392a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Bustle Rack on Turret Rear
    ctx.fillStyle = '#2d3326';
    ctx.fillRect(-19, -7, 5, 8);

    // CITV Commander Independent Thermal Viewer (Cylindrical sight)
    ctx.fillStyle = '#1e241c';
    ctx.fillRect(-5, -12, 5, 4);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-4, -11, 3, 2);

    // Roof M2HB .50 cal Machine Gun
    ctx.strokeStyle = '#1a1d1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.lineTo(10, -14);
    ctx.stroke();

    // 120mm M256 Cannon with Bore Evacuator (Oriented along turretAngle with recoil)
    ctx.rotate(turretAngle);
    ctx.strokeStyle = '#3b4332';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-recoil, 0);
    ctx.lineTo(30 - recoil, 0);
    ctx.stroke();

    // Bore Evacuator Cylinder (midway along barrel)
    ctx.fillStyle = '#2c3325';
    ctx.fillRect(16 - recoil, -3, 6, 6);

    ctx.restore();
    ctx.restore();
  }

  // 2. T-90M Proryv Main Battle Tank (Relikt ERA Wedges + 125mm Gun + Slat Armor)
  drawT90M(ctx, sx, y, e) {
    ctx.save();
    const recoil = e.recoil || 0;
    const turretAngle = e.turretAngle || -0.35;

    // Track Base & Scalloped Side Skirts
    ctx.fillStyle = '#1c201a';
    ctx.fillRect(sx - 25, y - 6, 50, 8);
    ctx.fillStyle = '#3a4630'; // Russian Digital Forest Green
    ctx.fillRect(sx - 26, y - 8, 52, 4);

    // 6 Large Road wheels
    ctx.fillStyle = '#161914';
    for (let w = -20; w <= 20; w += 8) {
      ctx.beginPath();
      ctx.arc(sx + w, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Low Profile Sloped Hull
    ctx.fillStyle = '#48563c';
    ctx.beginPath();
    ctx.moveTo(sx - 24, y - 6);
    ctx.lineTo(sx - 18, y - 11);
    ctx.lineTo(sx + 20, y - 11);
    ctx.lineTo(sx + 25, y - 6);
    ctx.closePath();
    ctx.fill();

    // Turret with Relikt ERA Wedges
    ctx.save();
    ctx.translate(sx, y - 11);

    // Cast welded turret dome
    ctx.fillStyle = '#3f4b34';
    ctx.beginPath();
    ctx.moveTo(-15, 2);
    ctx.lineTo(-12, -7);
    ctx.lineTo(13, -7);
    ctx.lineTo(16, 2);
    ctx.closePath();
    ctx.fill();

    // Relikt ERA Tiles (Angled protective bricks on turret cheeks)
    if (e.hasERA) {
      ctx.fillStyle = '#283122';
      ctx.fillRect(2, -6, 12, 4);
      ctx.fillRect(-12, -6, 8, 4);
      ctx.strokeStyle = '#5a694e';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(2, -6, 12, 4);
    }

    // Remote Weapon Station (PKT Machine Gun)
    ctx.fillStyle = '#1b2016';
    ctx.fillRect(-2, -11, 4, 4);
    ctx.strokeStyle = '#1b2016';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(8, -14);
    ctx.stroke();

    // 125mm 2A46M-5 Cannon with Thermal Sleeve & Muzzle Brake
    ctx.rotate(turretAngle);
    ctx.strokeStyle = '#323c2a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-recoil, 0);
    ctx.lineTo(32 - recoil, 0);
    ctx.stroke();

    // Thermal Sleeve Band
    ctx.fillStyle = '#1e2419';
    ctx.fillRect(18 - recoil, -2.5, 4, 5);

    ctx.restore();
    ctx.restore();
  }

  // 3. 2S35 Koalitsiya-SV Automated 152mm Self-Propelled Howitzer
  drawKoalitsia(ctx, sx, y, e) {
    ctx.save();
    const recoil = e.recoil || 0;
    const turretAngle = e.turretAngle || -0.45;

    // Heavy Track Base
    ctx.fillStyle = '#181c16';
    ctx.fillRect(sx - 27, y - 7, 54, 9);
    ctx.fillStyle = '#404c35';
    ctx.fillRect(sx - 28, y - 10, 56, 5);

    // 6 Dual Road Wheels
    ctx.fillStyle = '#141812';
    for (let w = -21; w <= 21; w += 8.4) {
      ctx.beginPath();
      ctx.arc(sx + w, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Hull
    ctx.fillStyle = '#4c5a3f';
    ctx.fillRect(sx - 26, y - 14, 52, 6);

    // Massive Unmanned Box Turret
    ctx.save();
    ctx.translate(sx - 4, y - 14);

    ctx.fillStyle = '#3b4731';
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-14, -14);
    ctx.lineTo(16, -14);
    ctx.lineTo(19, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#262f1f';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Automated Radar Antenna on Roof
    ctx.fillStyle = '#20271a';
    ctx.fillRect(-6, -18, 8, 4);

    // Giant 152mm Long-Range Ordnance Barrel
    ctx.rotate(turretAngle);
    ctx.strokeStyle = '#2d3525';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(-recoil, 0);
    ctx.lineTo(38 - recoil, 0);
    ctx.stroke();

    // Double-Baffle Slotted Muzzle Brake
    ctx.fillStyle = '#181d14';
    ctx.fillRect(36 - recoil, -4, 6, 8);
    ctx.fillStyle = '#ff9900';
    if (recoil > 1.5) {
      // Muzzle fire flash
      ctx.beginPath();
      ctx.arc(43 - recoil, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // 4. TOS-1A Buratino Heavy Thermobaric Multiple Rocket Launcher (24-Tube Battery)
  drawBuratino(ctx, sx, y, e) {
    ctx.save();
    const turretAngle = e.turretAngle || -0.42;

    // T-72 Heavy Chassis Base
    ctx.fillStyle = '#1a1f18';
    ctx.fillRect(sx - 26, y - 7, 52, 9);
    ctx.fillStyle = '#3c4734';
    ctx.fillRect(sx - 27, y - 10, 54, 5);

    // 6 Road Wheels
    ctx.fillStyle = '#121610';
    for (let w = -20; w <= 20; w += 8) {
      ctx.beginPath();
      ctx.arc(sx + w, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Armored Hull
    ctx.fillStyle = '#46533c';
    ctx.fillRect(sx - 25, y - 13, 50, 5);

    // Rotating Launcher Turntable Mount
    ctx.save();
    ctx.translate(sx - 2, y - 13);

    // Base Pivot
    ctx.fillStyle = '#242b1f';
    ctx.fillRect(-10, -4, 20, 5);

    // Hydraulic Elevation Cylinders
    ctx.fillStyle = '#607d8b';
    ctx.fillRect(-6, -8, 4, 6);

    // 24-Tube Armored Rocket Box
    ctx.rotate(turretAngle);
    ctx.fillStyle = '#283122';
    ctx.fillRect(-14, -10, 32, 16);
    ctx.strokeStyle = '#192015';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-14, -10, 32, 16);

    // 3 Rows x 8 Rocket Tubes with Red Thermobaric Warhead Tips
    ctx.fillStyle = '#ff2a1a';
    for (let row = -7; row <= 4; row += 5.5) {
      for (let col = 14; col <= 17; col += 3.5) {
        ctx.beginPath();
        ctx.arc(col, row, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.restore();
  }

  // 5. T-34-85 Soviet Classic Medium Tank (WWII 85mm ZiS-S-53)
  drawT34(ctx, sx, y, e) {
    ctx.save();
    const recoil = e.recoil || 0;
    const turretAngle = e.turretAngle || -0.32;

    // Track Tread
    ctx.fillStyle = '#1a1c18';
    ctx.fillRect(sx - 23, y - 5, 46, 7);

    // 5 Large Christie Road Wheels
    ctx.fillStyle = '#2a3322';
    for (let w = -18; w <= 18; w += 9) {
      ctx.beginPath();
      ctx.arc(sx + w, y - 1, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#151911';
      ctx.beginPath();
      ctx.arc(sx + w, y - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a3322';
    }

    // Sloped Glacis Hull
    ctx.fillStyle = '#3d4a30'; // Soviet Olive Drab
    ctx.beginPath();
    ctx.moveTo(sx - 23, y - 5);
    ctx.lineTo(sx - 16, y - 11);
    ctx.lineTo(sx + 18, y - 11);
    ctx.lineTo(sx + 24, y - 5);
    ctx.closePath();
    ctx.fill();

    // Cylindrical Fuel Drums on Hull Rear
    ctx.fillStyle = '#2c3623';
    ctx.fillRect(sx - 22, y - 14, 5, 4);

    // Cast Rounded Turret
    ctx.save();
    ctx.translate(sx + 2, y - 11);

    ctx.fillStyle = '#343f29';
    ctx.beginPath();
    ctx.arc(0, -2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#202619';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Commander Cupola
    ctx.fillStyle = '#202619';
    ctx.fillRect(-7, -13, 6, 3);

    // 85mm ZiS-S-53 Cannon
    ctx.rotate(turretAngle);
    ctx.strokeStyle = '#283120';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-recoil, 0);
    ctx.lineTo(26 - recoil, 0);
    ctx.stroke();

    // Mantlet Collar
    ctx.fillStyle = '#1d2316';
    ctx.fillRect(-2, -3, 6, 6);

    ctx.restore();
    ctx.restore();
  }

  // 6. M4A3 Sherman US Assault Tank (75mm M3 Gun + VVSS Bogies)
  drawSherman(ctx, sx, y, e) {
    ctx.save();
    const recoil = e.recoil || 0;
    const turretAngle = e.turretAngle || -0.32;

    // Track Tread
    ctx.fillStyle = '#1e1c18';
    ctx.fillRect(sx - 22, y - 5, 44, 7);

    // 3 Dual-wheel VVSS Suspension Bogies
    ctx.fillStyle = '#363d27';
    for (let w = -15; w <= 15; w += 15) {
      ctx.beginPath();
      ctx.arc(sx + w - 3, y - 1, 3.2, 0, Math.PI * 2);
      ctx.arc(sx + w + 3, y - 1, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tall Rounded Hull
    ctx.fillStyle = '#485234'; // US Army Olive Drab
    ctx.beginPath();
    ctx.moveTo(sx - 21, y - 5);
    ctx.lineTo(sx - 16, y - 13);
    ctx.lineTo(sx + 16, y - 13);
    ctx.lineTo(sx + 21, y - 5);
    ctx.closePath();
    ctx.fill();

    // Cast Turret
    ctx.save();
    ctx.translate(sx - 1, y - 13);

    ctx.fillStyle = '#3c452b';
    ctx.beginPath();
    ctx.ellipse(0, -3, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Star Emblem on Turret
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // 75mm M3 Cannon with Gun Mantlet
    ctx.rotate(turretAngle);
    ctx.strokeStyle = '#2b311f';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-recoil, 0);
    ctx.lineTo(24 - recoil, 0);
    ctx.stroke();

    // Rotor Mantlet
    ctx.fillStyle = '#222718';
    ctx.fillRect(-2, -3.5, 6, 7);

    ctx.restore();
    ctx.restore();
  }

  // === AIRCRAFT EVOLUTION MILITARY STRONGHOLDS & ENVIRONMENT ===

  drawGarrisonBuilding(ctx, sx, y, e) {
    ctx.save();
    const bw = 54;
    const bh = 42;
    const bx = sx - bw / 2;
    const by = y - bh;

    // 1. Foundation: Heavy rustic stone blocks
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(bx, by + bh - 14, bw, 14);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by + bh - 14, bw, 14);
    ctx.beginPath();
    ctx.moveTo(bx + 16, by + bh - 14); ctx.lineTo(bx + 16, by + bh);
    ctx.moveTo(bx + 36, by + bh - 14); ctx.lineTo(bx + 36, by + bh);
    ctx.moveTo(bx, by + bh - 7); ctx.lineTo(bx + bw, by + bh - 7);
    ctx.stroke();

    // Reinforced Iron-banded Timber Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bx + bw / 2 - 5, by + bh - 13, 10, 13);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bx + bw / 2 + 1, by + bh - 7, 2, 2);

    // 2. Upper Floor: Log walls & timber planking
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 2, by + 10, bw - 4, bh - 24);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(bx + 2, by + 10, bw - 4, bh - 24);
    for (let p = by + 14; p < by + bh - 14; p += 4.5) {
      ctx.beginPath();
      ctx.moveTo(bx + 2, p);
      ctx.lineTo(bx + bw - 2, p);
      ctx.stroke();
    }

    // Two Fortified Window Embrasures with Warm Candlelight
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx + 9, by + 15, 8, 8);
    ctx.fillRect(bx + bw - 17, by + 15, 8, 8);
    ctx.strokeStyle = '#292524';
    ctx.strokeRect(bx + 9, by + 15, 8, 8);
    ctx.strokeRect(bx + bw - 17, by + 15, 8, 8);
    ctx.beginPath();
    ctx.moveTo(bx + 13, by + 15); ctx.lineTo(bx + 13, by + 23);
    ctx.moveTo(bx + bw - 13, by + 15); ctx.lineTo(bx + bw - 13, by + 23);
    ctx.stroke();

    // 3. Mansard Shingled Roof with Overhang
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(bx - 3, by + 10);
    ctx.lineTo(bx + 6, by);
    ctx.lineTo(bx + bw - 6, by);
    ctx.lineTo(bx + bw + 3, by + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Rooftop Defensive Sandbag Parapet & Sniper Lookout
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(bx + 10, by - 4, bw - 20, 5);
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 10, by - 4, bw - 20, 5);

    // Rooftop Garrison Defender Sentry
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(bx + bw / 2 - 2, by - 14, 4, 10);
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by - 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bx + bw / 2 - 3, by - 19, 6, 3);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by - 12);
    ctx.lineTo(bx + bw / 2 - 12, by - 18);
    ctx.stroke();

    // Red Garrison Command Pennant Flag
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(bx + bw - 8, by - 1);
    ctx.lineTo(bx + bw + 6, by - 6);
    ctx.lineTo(bx + bw - 8, by - 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx + bw - 8, by - 1);
    ctx.lineTo(bx + bw - 8, by - 13);
    ctx.stroke();

    ctx.restore();
  }

  drawWatchtower(ctx, sx, y, e) {
    ctx.save();
    const tw = 24;
    const th = 56;
    const tx = sx;
    const ty = y - th;

    // 1. Heavy Timber Lattice Pylon with Diagonal Bracing
    ctx.strokeStyle = '#5a2e12';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2, y);
    ctx.lineTo(tx - tw / 2 + 3, ty + 12);
    ctx.moveTo(tx + tw / 2, y);
    ctx.lineTo(tx + tw / 2 - 3, ty + 12);
    const tiers = 3;
    const tierH = (th - 12) / tiers;
    for (let t = 0; t < tiers; t++) {
      const yBottom = y - t * tierH;
      const yTop = y - (t + 1) * tierH;
      const wBot = tw - t * 2;
      const wTop = tw - (t + 1) * 2;
      ctx.moveTo(tx - wBot / 2, yBottom);
      ctx.lineTo(tx + wTop / 2, yTop);
      ctx.moveTo(tx + wBot / 2, yBottom);
      ctx.lineTo(tx - wTop / 2, yTop);
      ctx.moveTo(tx - wTop / 2, yTop);
      ctx.lineTo(tx + wTop / 2, yTop);
    }
    ctx.stroke();

    // 2. Elevated Timber Observation Deck & Railing
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx - tw / 2 - 2, ty + 10, tw + 4, 3);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tx - tw / 2 - 2, ty + 2, tw + 4, 8);

    // Sentry Platform Guard
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(tx - 2, ty + 2, 4, 8);
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx - 3, ty - 3, 6, 2.5);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty + 4);
    ctx.lineTo(tx + 8, ty - 5);
    ctx.stroke();

    ctx.restore();
  }

  drawAutumnTree(ctx, sx, y, e) {
    ctx.save();
    const seed = Math.abs(Math.sin((e.x || 100) * 0.05));
    const treeH = 34 + Math.round(seed * 12);
    const canopyR = 14 + Math.round(seed * 5);

    // 1. Gnarly Textured Bark Trunk
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(sx - 3, y);
    ctx.lineTo(sx - 2, y - treeH * 0.65);
    ctx.lineTo(sx + 2, y - treeH * 0.65);
    ctx.lineTo(sx + 3.5, y);
    ctx.closePath();
    ctx.fill();

    // 2. Multi-lobed Lush Autumn Foliage (Exact Aircraft Evolution golden-orange palette)
    const autumnColors = [
      ['#9a3412', '#c2410c', '#ea580c', '#f59e0b'],
      ['#b45309', '#d97706', '#f59e0b', '#fcd34d'],
      ['#7c2d12', '#b91c1c', '#dc2626', '#f87171']
    ];
    const palette = autumnColors[Math.floor(seed * 3) % 3];
    const cy = y - treeH * 0.72;

    // Base shaded canopy layer
    ctx.fillStyle = palette[0];
    ctx.beginPath();
    ctx.arc(sx, cy + 4, canopyR * 0.95, 0, Math.PI * 2);
    ctx.arc(sx - canopyR * 0.45, cy + 5, canopyR * 0.75, 0, Math.PI * 2);
    ctx.arc(sx + canopyR * 0.45, cy + 5, canopyR * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Mid warm amber canopy layer
    ctx.fillStyle = palette[1];
    ctx.beginPath();
    ctx.arc(sx, cy - 1, canopyR * 0.85, 0, Math.PI * 2);
    ctx.arc(sx - canopyR * 0.4, cy, canopyR * 0.65, 0, Math.PI * 2);
    ctx.arc(sx + canopyR * 0.4, cy, canopyR * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Top vibrant sunlit canopy layer
    ctx.fillStyle = palette[2];
    ctx.beginPath();
    ctx.arc(sx, cy - 6, canopyR * 0.75, 0, Math.PI * 2);
    ctx.arc(sx - canopyR * 0.35, cy - 4, canopyR * 0.55, 0, Math.PI * 2);
    ctx.arc(sx + canopyR * 0.35, cy - 4, canopyR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Golden leaf highlight rim
    ctx.fillStyle = palette[3];
    ctx.beginPath();
    ctx.arc(sx - 2, cy - 9, canopyR * 0.45, 0, Math.PI * 2);
    ctx.arc(sx + 3, cy - 8, canopyR * 0.40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.EntityManager = EntityManager;
