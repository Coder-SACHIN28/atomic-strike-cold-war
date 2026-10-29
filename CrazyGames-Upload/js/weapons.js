/**
 * Atomic Bomber - Weapons & Ballistics Subsystem
 * Faithful implementation of Iron Bombs, Cluster Munitions,
 * Tactical Nuclear Weapons, GAU-8 30mm Cannon, Hydra Rockets, and Flares.
 */

class WeaponManager {
  constructor(game) {
    this.game = game;
    this.bombs = [];
    this.bullets = [];
    this.rockets = [];
    this.flares = [];
    this.flakShells = [];
    this.explosions = [];
    this.mushroomClouds = [];
    this.shockwaves = [];
    this.debris = [];
    this.hellfires = [];
    this.napalmBombs = [];
    this.napalmFires = [];
    this.napalmDroplets = [];
    this.empBombs = [];
    this.empArcs = [];
    this.shellCasings = [];
    this.sparks = [];
    this.waterSplashes = [];

    // Next-Gen Nuclear Detonation & Fallout Physics Subsystem
    this.nuclearFireballs = [];
    this.vitrifiedCraters = [];
    this.nuclearFallout = [];

    this.gravity = 0.12; // Decompiled gravity constant from theview.java
  }

  reset() {
    this.bombs = [];
    this.bullets = [];
    this.rockets = [];
    this.flares = [];
    this.flakShells = [];
    this.explosions = [];
    this.mushroomClouds = [];
    this.shockwaves = [];
    this.debris = [];
    this.hellfires = [];
    this.napalmBombs = [];
    this.napalmFires = [];
    this.napalmDroplets = [];
    this.empBombs = [];
    this.empArcs = [];
    this.shellCasings = [];
    this.sparks = [];
    this.waterSplashes = [];
    this.nuclearFireballs = [];
    this.vitrifiedCraters = [];
    this.nuclearFallout = [];
  }

  // Drop Standard Iron Bomb
  dropIronBomb(x, y, vx, vy, blastUpgradeLevel = 0) {
    this.bombs.push({
      type: 'iron',
      x,
      y,
      vx,
      vy: vy + 1.2, // Drop release kick
      angle: Math.atan2(vy, vx),
      radius: 8,
      blastRadius: 65 + blastUpgradeLevel * 20,
      damage: 100,
      sprite: this.game.sprites['ironbomb.png'],
      active: true
    });
  }

  // Drop Cluster Munition
  dropClusterBomb(x, y, vx, vy, submunitionCount = 3) {
    this.bombs.push({
      type: 'cluster',
      x,
      y,
      vx,
      vy: vy + 1.0,
      angle: Math.atan2(vy, vx),
      radius: 9,
      submunitions: submunitionCount,
      hasSplit: false,
      sprite: this.game.sprites['clusterbomb.png'],
      active: true
    });
  }

  // Drop Tactical Nuclear Bomb (B61 / Mk-28 Tactical Thermonuclear Munition)
  dropNuke(x, y, vx, vy) {
    this.bombs.push({
      type: 'nuke',
      x,
      y,
      vx: vx * 0.95,
      vy: vy + 0.9,
      angle: Math.atan2(vy, vx),
      radius: 18,
      blastRadius: 440,
      damage: 9999,
      mass: 350,
      beaconTimer: 0,
      trail: [],
      active: true
    });

    if (window.soundSystem && typeof window.soundSystem.play === 'function') {
      window.soundSystem.play('beep', { volume: 0.85 });
    }
    if (this.game.setRadioMessage) {
      this.game.setRadioMessage('AWACS STRIKE LEAD', 'TACTICAL NUKE AWAY! SCRAMBLE CLEAR!');
    }
    if (this.game.addFloatingText) {
      this.game.addFloatingText('☢️ TACTICAL NUCLEAR WEAPON RELEASED!', x, y - 30, '#ffea00');
    }
  }

  // Fire GAU-8 30mm Avenger Gatling Gun (A-10)
  fireGau8(x, y, angle, speed, isDepletedUranium = false) {
    const spread = (Math.random() - 0.5) * 0.04;
    const bulletSpeed = speed + 15.0;
    const bAngle = angle + spread;
    const vx = Math.cos(bAngle) * bulletSpeed;
    const vy = Math.sin(bAngle) * bulletSpeed;

    this.bullets.push({
      x,
      y,
      vx,
      vy,
      angle: bAngle,
      damage: isDepletedUranium ? 45 : 30,
      isAP: isDepletedUranium,
      range: 800,
      distTraveled: 0,
      sprite: this.game.sprites['bullet1.png'],
      active: true
    });

    // Eject tumbling brass shell casings with recoil ejection physics
    const ejectAngle = angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.45;
    const ejectSpeed = 2.2 + Math.random() * 2.2;
    this.shellCasings.push({
      x: x - Math.cos(angle) * 10,
      y: y + 2,
      vx: Math.cos(ejectAngle) * ejectSpeed + (Math.random() - 0.5) * 1.2,
      vy: Math.sin(ejectAngle) * ejectSpeed + 1.2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.5,
      life: 55,
      active: true
    });

    if (window.soundSystem && typeof window.soundSystem.play30mm === 'function') {
      window.soundSystem.play30mm();
    } else if (window.soundSystem) {
      window.soundSystem.play('shot', { volume: 0.75, rate: 1.1 + Math.random() * 0.2 });
    }
  }

  // Fire Heavy 30mm M230 Chain Gun / Autocannon (AH-64 Apache & Gunships)
  fireChainGun30mm(x, y, angle, speed, isAP = false) {
    const spread = (Math.random() - 0.5) * 0.035;
    const bulletSpeed = speed + 15.5;
    const bAngle = angle + spread;
    const vx = Math.cos(bAngle) * bulletSpeed;
    const vy = Math.sin(bAngle) * bulletSpeed;

    this.bullets.push({
      x,
      y,
      vx,
      vy,
      angle: bAngle,
      damage: isAP ? 60 : 45,
      isAP: isAP,
      isHeavy30mm: true,
      range: 850,
      distTraveled: 0,
      sprite: this.game.sprites['bullet1.png'],
      active: true
    });

    // Eject heavy 30mm brass casings
    this.shellCasings.push({
      x: x - Math.cos(angle) * 12,
      y: y + 3,
      vx: -(Math.random() * 1.5 + 0.8),
      vy: 1.5 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      life: 55,
      active: true
    });

    if (window.soundSystem && typeof window.soundSystem.playChainFire === 'function') {
      window.soundSystem.playChainFire();
    } else if (window.soundSystem && typeof window.soundSystem.play30mm === 'function') {
      window.soundSystem.play30mm();
    } else {
      window.soundSystem.play('shot', { volume: 0.8, rate: 0.85 });
    }
  }

  // Create High-Velocity Kinetic Ricochet Metal Sparks
  createKineticSparks(x, y, count = 6) {
    for (let s = 0; s < count; s++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 5.0;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        life: 14 + Math.floor(Math.random() * 12),
        maxLife: 26,
        color: Math.random() > 0.3 ? '#ffee33' : '#ff7700'
      });
    }
    if (window.soundSystem && typeof window.soundSystem.playMetalHit === 'function') {
      window.soundSystem.playMetalHit();
    }
  }

  // Create Water Spray Geyser & Foaming Surface Ripples
  createWaterSplash(x, y, size = 'small') {
    const isBig = size === 'large' || size === 'bomb';
    const dropletCount = isBig ? 24 : 12;
    for (let w = 0; w < dropletCount; w++) {
      const spd = (isBig ? 6.5 : 4.0) + Math.random() * (isBig ? 7.5 : 4.5);
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * (isBig ? 1.4 : 0.8);
      this.waterSplashes.push({
        x: x + (Math.random() - 0.5) * (isBig ? 30 : 12),
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: (isBig ? 3.0 : 1.8) + Math.random() * 2.0,
        life: isBig ? 45 : 28,
        maxLife: isBig ? 45 : 28
      });
    }
    if (window.soundSystem && typeof window.soundSystem.playWaterHit === 'function') {
      window.soundSystem.playWaterHit();
    }
  }

  // Fire Chinook Defensive Door Gunner (7.62mm High-Rate Minigun Tracers)
  fireDoorGunner(x, y, angle, speed) {
    const spread = (Math.random() - 0.5) * 0.05;
    const bulletSpeed = speed + 13.0;
    const bAngle = angle + spread;
    const vx = Math.cos(bAngle) * bulletSpeed;
    const vy = Math.sin(bAngle) * bulletSpeed;

    this.bullets.push({
      x,
      y,
      vx,
      vy,
      angle: bAngle,
      damage: 26,
      isAP: false,
      isDoorGun: true,
      range: 480,
      distTraveled: 0,
      sprite: this.game.sprites['bullet2.png'] || this.game.sprites['bullet1.png'],
      active: true
    });

    if (window.soundSystem && typeof window.soundSystem.play20mm === 'function') {
      window.soundSystem.play20mm();
    }
  }

  // Fire Air-to-Ground Hydra 70 Rocket
  fireRocket(x, y, angle, speed) {
    const rocketSpeed = speed + 4.0;
    this.rockets.push({
      x,
      y,
      vx: Math.cos(angle) * rocketSpeed,
      vy: Math.sin(angle) * rocketSpeed,
      angle,
      accel: 0.38,
      maxSpeed: 16.0,
      damage: 180,
      blastRadius: 55,
      frame: 1,
      frameTimer: 0,
      life: 140,
      active: true
    });

    window.soundSystem.play('rocket', { volume: 0.45 });
  }

  // Deploy Flare Countermeasure (diverts heat-seeking SAMs)
  deployFlare(x, y, vx, vy) {
    for (let i = 0; i < 2; i++) {
      this.flares.push({
        x: x - 10,
        y: y + (Math.random() - 0.5) * 12,
        vx: vx * 0.4 + (Math.random() - 0.5) * 2,
        vy: vy * 0.3 + 1.5 + Math.random() * 1.5,
        life: 75,
        maxLife: 75,
        active: true
      });
    }
  }

  // Fire AGM-114 Hellfire Laser-Guided Precision Missile
  fireHellfire(x, y, angle, speed, target = null) {
    const launchSpeed = speed + 3.5;
    this.hellfires.push({
      x,
      y,
      vx: Math.cos(angle) * launchSpeed,
      vy: Math.sin(angle) * launchSpeed,
      angle,
      speed: launchSpeed,
      target,
      turnRate: 0.08,
      accel: 0.35,
      maxSpeed: 17.5,
      damage: 260,
      blastRadius: 75,
      life: 180,
      active: true
    });

    if (window.soundSystem) {
      if (typeof window.soundSystem.playMissileShoot === 'function') {
        window.soundSystem.playMissileShoot();
      } else {
        window.soundSystem.play('missilelaunch', { volume: 0.8 });
      }
    }
  }

  // Drop BLU-27 Napalm Firestorm Bomb
  dropNapalm(x, y, vx, vy) {
    this.napalmBombs.push({
      x,
      y,
      vx,
      vy: vy + 1.4,
      angle: Math.atan2(vy, vx),
      radius: 9,
      active: true
    });

    if (window.soundSystem) {
      if (typeof window.soundSystem.playBombWhistle === 'function') {
        window.soundSystem.playBombWhistle();
      } else {
        window.soundSystem.play('rocket', { volume: 0.5 });
      }
    }
  }

  // Drop Lightning EMP Shock Bomb (from Aircraft Evolution REA)
  dropEmpBomb(x, y, vx, vy) {
    this.empBombs.push({
      x,
      y,
      vx,
      vy: vy + 1.2,
      angle: Math.atan2(vy, vx),
      radius: 10,
      shockRadius: 0,
      maxShockRadius: 330,
      detonated: false,
      alpha: 1.0,
      active: true
    });

    if (window.soundSystem) {
      if (typeof window.soundSystem.playBombWhistle === 'function') {
        window.soundSystem.playBombWhistle();
      } else {
        window.soundSystem.play('rocket', { volume: 0.5 });
      }
    }
    if (this.game.addFloatingText) {
      this.game.addFloatingText('⚡ EMP SHOCK BOMB AWAY! [KEY M]', x, y - 30, '#00e5ff');
    }
  }

  // Create Napalm Firestorm Ground Area (used by fuel barrels & BLU-27)
  createNapalmFire(x, y, multiplier = 1.0) {
    this.napalmFires.push({
      x,
      y,
      width: Math.round(190 * multiplier),
      duration: Math.round(540 * multiplier),
      maxDuration: Math.round(540 * multiplier)
    });
    if (this.game && this.game.terrain && this.game.terrain.addScorchMark) {
      this.game.terrain.addScorchMark(x, 65 * multiplier, false, true);
    }
  }

  // Spawn Jagged High-Speed Shrapnel & Armor Debris
  spawnShrapnelDebris(x, y, count = 6, forceScale = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7; // Upwards ballistic spray
      const speed = (2.2 + Math.random() * 5.8) * forceScale;
      this.debris.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 4,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.32,
        size: 2.2 + Math.random() * 3.8,
        width: 3.0 + Math.random() * 5.0,
        height: 2.0 + Math.random() * 3.0,
        color: Math.random() < 0.4 ? '#475569' : (Math.random() < 0.7 ? '#1e293b' : '#334155'),
        sparkColor: Math.random() > 0.5 ? '#ff8800' : '#ff4400',
        bounces: 0,
        maxBounces: 1 + Math.floor(Math.random() * 2),
        life: 80 + Math.floor(Math.random() * 50),
        maxLife: 130,
        active: true
      });
    }
  }

  // Spawn Explosion
  createExplosion(x, y, size = 'medium', customRadius = 0) {
    let radius = 35;
    let sound = 'mdboom';
    let type = 'medium';

    if (size === 'small') {
      radius = customRadius || 20;
      sound = 'smboom';
      type = 'small';
    } else if (size === 'medium') {
      radius = customRadius || 45;
      sound = 'mdboom';
      type = 'medium';
    } else if (size === 'large') {
      radius = customRadius || 80;
      sound = 'lgboom';
      type = 'large';
    } else if (size === 'air') {
      radius = customRadius || 30;
      sound = 'shot';
      type = 'air';
    }

    this.explosions.push({
      x,
      y,
      radius,
      type,
      frame: 1,
      maxFrames: type === 'large' ? 4 : (type === 'air' ? 4 : 3),
      frameTimer: 0,
      active: true
    });

    // Persistent Ground Scorch Mark
    if (this.game && this.game.terrain && this.game.terrain.addScorchMark) {
      const gY = this.game.terrain.getHeightAt(x);
      if (Math.abs(y - gY) < 65 || type !== 'air') {
        this.game.terrain.addScorchMark(x, radius, false, false);
      }
    }

    // High-Velocity Shrapnel Debris
    const debrisCount = size === 'large' ? 9 : (size === 'medium' ? 5 : (size === 'air' ? 4 : 2));
    this.spawnShrapnelDebris(x, y, debrisCount, size === 'large' ? 1.3 : 1.0);

    window.soundSystem.play(sound, { volume: size === 'large' ? 0.95 : 0.75 });
  }

  // Trigger Multi-Phase Thermonuclear Detonation (Grounded in Physics from Cold War Weapons Research)
  createNuclearDetonation(x, y) {
    // Phase 1: Prompt Thermal Radiation & Ionization Whiteout
    this.game.triggerScreenFlash(1.0);
    this.game.triggerScreenShake(48, 90);
    if (window.soundSystem) {
      window.soundSystem.play('atomic', { volume: 1.0 });
    }

    // Cockpit EMP Disruption (flicker HUD & digital static)
    if (this.game.triggerEmpGlitch) {
      this.game.triggerEmpGlitch(130);
    }

    // Phase 2: Vitrified Permanent Scorched Crater
    this.game.terrain.applyCrater(x, 340, 52);
    if (this.game.terrain.addScorchMark) {
      this.game.terrain.addScorchMark(x, 260, true, false);
    }
    this.vitrifiedCraters.push({
      x,
      y,
      radius: 230,
      life: 720,
      maxLife: 720
    });

    // Phase 3: Hyperthermal Incandescent Plasma Fireball (0 - 85 frames)
    this.nuclearFireballs.push({
      x,
      y,
      radius: 14,
      maxRadius: 220,
      growthSpeed: 7.2,
      life: 85,
      maxLife: 85,
      rays: Array.from({ length: 18 }, (_, k) => ({
        angle: (k / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
        length: 160 + Math.random() * 100,
        width: 3 + Math.random() * 4
      }))
    });

    // Phase 4: Supersonic Mach Stem Shockwave (Dual Atmospheric Compression Rings)
    this.shockwaves.push({
      x,
      y,
      radius: 18,
      maxRadius: 720,
      speed: 15.0,
      thickness: 38,
      alpha: 1.0,
      isNuclear: true,
      active: true
    });

    // Phase 5: Ejected Molten Debris & Incandescent Soil
    for (let k = 0; k < 42; k++) {
      const pAngle = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const pSpeed = 4.0 + Math.random() * 11.0;
      this.debris.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y - 10,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        size: 3 + Math.random() * 5,
        color: Math.random() < 0.45 ? '#ffffff' : (Math.random() < 0.75 ? '#ff5500' : '#221105'),
        life: 90 + Math.random() * 60,
        active: true
      });
    }

    // Drifting radioactive fallout embers
    for (let f = 0; f < 36; f++) {
      this.nuclearFallout.push({
        x: x + (Math.random() - 0.5) * 260,
        y: y - 40 - Math.random() * 200,
        vx: -1.2 + (Math.random() - 0.5) * 1.5,
        vy: 0.6 + Math.random() * 1.2,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#ffaa00' : '#ff4400',
        life: 280 + Math.random() * 200,
        maxLife: 400
      });
    }

    // Phase 6: Volumetric Toroidal Mushroom Cloud
    this.mushroomClouds.push({
      x,
      y,
      stemHeight: 0,
      maxStemHeight: 330,
      capScale: 0.15,
      maxCapScale: 3.2,
      topFrame: 1,
      alpha: 1.0,
      life: 300,
      maxLife: 300,
      active: true,
      rings: [
        { heightRatio: 0.45, radius: 10, maxRadius: 180, alpha: 0.9 },
        { heightRatio: 0.75, radius: 10, maxRadius: 240, alpha: 0.8 }
      ]
    });

    // Wipe out ground & air enemies within kill radius
    this.game.entities.destroyAllInRadius(x, y, 460, 9999);

    if (this.game.setRadioMessage) {
      setTimeout(() => {
        this.game.setRadioMessage('AWACS AIR CONTROL', 'DETONATION CONFIRMED! SECTOR ATOMIZED!');
      }, 700);
    }

    // Pilot viral meme nuke reaction
    if (this.game.triggerPilotHumor) {
      setTimeout(() => {
        this.game.triggerPilotHumor('NUKE_DROP', true);
      }, 350);
    }
  }

  update() {
    const terrain = this.game.terrain;

    // 1. Update Bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.vy += this.gravity;
      b.x += b.vx;
      b.y += b.vy;
      b.angle = Math.atan2(b.vy, b.vx);

      // Tactical Thermonuclear Bomb in-flight aerodynamic trail & arming beacon
      if (b.type === 'nuke') {
        b.beaconTimer = (b.beaconTimer || 0) + 1;
        if (b.beaconTimer % 28 === 0) {
          if (window.soundSystem && typeof window.soundSystem.play === 'function') {
            window.soundSystem.play('beep', { volume: 0.35 });
          }
        }
        if (!b.trail) b.trail = [];
        b.trail.push({ x: b.x, y: b.y, alpha: 0.85 });
        if (b.trail.length > 14) b.trail.shift();
        for (const pt of b.trail) pt.alpha *= 0.90;
      }

      const groundY = terrain.getHeightAt(b.x);

      // Cluster bomb mid-air split
      if (b.type === 'cluster' && !b.hasSplit && b.y >= groundY - 120) {
        b.hasSplit = true;
        b.active = false;
        window.soundSystem.play('clusterburst', { volume: 0.85 });

        // Spawn bomblets with lateral scatter
        const count = b.submunitions || 3;
        for (let s = 0; s < count; s++) {
          const spreadVx = b.vx + (s - (count - 1) / 2) * 1.8;
          this.bombs.push({
            type: 'bomblet',
            x: b.x,
            y: b.y,
            vx: spreadVx,
            vy: b.vy + (Math.random() - 0.5) * 0.8,
            angle: Math.atan2(b.vy, spreadVx),
            radius: 5,
            blastRadius: 40,
            damage: 60,
            sprite: this.game.sprites['bomblet.png'],
            active: true
          });
        }
        continue;
      }

      // Check ground collision
      if (b.y >= groundY - 6) {
        b.active = false;
        if (terrain.isWaterAt && terrain.isWaterAt(b.x, groundY)) {
          this.createWaterSplash(b.x, groundY, b.type === 'nuke' ? 'huge' : 'bomb');
        }
        if (b.type === 'nuke') {
          this.createNuclearDetonation(b.x, groundY);
        } else if (b.type === 'iron') {
          this.createExplosion(b.x, groundY, 'large', b.blastRadius);
          this.game.entities.checkBlastDamage(b.x, groundY, b.blastRadius, b.damage);
          terrain.applyCrater(b.x, b.blastRadius * 0.45, 12);
          if (this.game.triggerScreenShake) {
            this.game.triggerScreenShake(8, 14);
          }
        } else if (b.type === 'bomblet') {
          this.createExplosion(b.x, groundY, 'small', b.blastRadius);
          this.game.entities.checkBlastDamage(b.x, groundY, b.blastRadius, b.damage);
        }
      }

      // Check direct collision with ground units
      if (b.active) {
        const hitTarget = this.game.entities.checkDirectHit(b.x, b.y, b.radius);
        if (hitTarget) {
          b.active = false;
          if (b.type === 'nuke') {
            this.createNuclearDetonation(b.x, b.y);
          } else {
            this.createExplosion(b.x, b.y, 'large', b.blastRadius);
            this.game.entities.checkBlastDamage(b.x, b.y, b.blastRadius, b.damage);
          }
        }
      }

      if (!b.active) {
        this.bombs.splice(i, 1);
      }
    }

    // 2. Update Bullets (GAU-8)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.distTraveled += Math.hypot(bullet.vx, bullet.vy);

      const groundY = terrain.getHeightAt(bullet.x);
      if (bullet.y >= groundY || bullet.distTraveled > bullet.range) {
        bullet.active = false;
        if (bullet.y >= groundY) {
          if (terrain.isWaterAt && terrain.isWaterAt(bullet.x, groundY)) {
            this.createWaterSplash(bullet.x, groundY, 'small');
          } else if (Math.random() < 0.35) {
            this.createExplosion(bullet.x, groundY, 'small', 12);
            this.createKineticSparks(bullet.x, groundY, 4);
          }
        }
      } else {
        // Hit check against enemies
        const hit = this.game.entities.checkDirectHit(bullet.x, bullet.y, 8, bullet.damage);
        if (hit) {
          bullet.active = false;
          this.createKineticSparks(bullet.x, bullet.y, 6);
          if (window.soundSystem && typeof window.soundSystem.playMetalHit === 'function') {
            window.soundSystem.playMetalHit();
          }
        }
      }

      if (!bullet.active) this.bullets.splice(i, 1);
    }

    // 3. Update Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      const curSpeed = Math.hypot(r.vx, r.vy);
      if (curSpeed < r.maxSpeed) {
        const newSpeed = curSpeed + r.accel;
        r.vx = Math.cos(r.angle) * newSpeed;
        r.vy = Math.sin(r.angle) * newSpeed;
      }
      r.x += r.vx;
      r.y += r.vy;
      r.life--;

      // Frame animation (rocket exhaust fire)
      r.frameTimer++;
      if (r.frameTimer > 2) {
        r.frameTimer = 0;
        r.frame = (r.frame % 6) + 1;
      }

      const groundY = terrain.getHeightAt(r.x);
      if (r.y >= groundY || r.life <= 0) {
        r.active = false;
        if (terrain.isWaterAt && terrain.isWaterAt(r.x, groundY)) {
          this.createWaterSplash(r.x, groundY, 'large');
        }
        this.createExplosion(r.x, groundY, 'medium', r.blastRadius);
        this.game.entities.checkBlastDamage(r.x, groundY, r.blastRadius, r.damage);
      } else {
        const hit = this.game.entities.checkDirectHit(r.x, r.y, 14, r.damage);
        if (hit) {
          r.active = false;
          this.createKineticSparks(r.x, r.y, 8);
          this.createExplosion(r.x, r.y, 'medium', r.blastRadius);
          this.game.entities.checkBlastDamage(r.x, r.y, r.blastRadius, r.damage);
        }
      }

      if (!r.active) this.rockets.splice(i, 1);
    }

    // 4. Update Flares
    for (let i = this.flares.length - 1; i >= 0; i--) {
      const f = this.flares[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.05;
      f.life--;
      if (f.life <= 0 || f.y >= terrain.getHeightAt(f.x)) {
        f.active = false;
        this.flares.splice(i, 1);
      }
    }

    // 4b. Update Napalm Bombs & Firestorm Areas
    for (let i = this.napalmBombs.length - 1; i >= 0; i--) {
      const nb = this.napalmBombs[i];
      nb.vy += this.gravity * 0.9;
      nb.x += nb.vx;
      nb.y += nb.vy;
      nb.angle = Math.atan2(nb.vy, nb.vx);

      const groundY = terrain.getHeightAt(nb.x);
      if (nb.y >= groundY - 6) {
        nb.active = false;
        this.createExplosion(nb.x, groundY, 'large', 70);
        this.game.entities.checkBlastDamage(nb.x, groundY, 70, 160);
        if (window.soundSystem && typeof window.soundSystem.playRocketExplo === 'function') {
          window.soundSystem.playRocketExplo();
        }

        // Rupture canister into 16 burning viscous liquid jelly droplets (Real-world fluid physics)
        for (let d = 0; d < 16; d++) {
          const dropAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
          const dropSpeed = 3.5 + Math.random() * 8.5;
          this.napalmDroplets.push({
            x: nb.x,
            y: groundY - 4,
            vx: Math.cos(dropAngle) * dropSpeed + nb.vx * 0.35,
            vy: Math.sin(dropAngle) * dropSpeed,
            radius: 3.5 + Math.random() * 3.5,
            life: 300 + Math.floor(Math.random() * 180),
            maxLife: 480,
            onGround: false
          });
        }

        this.napalmFires.push({
          x: nb.x,
          y: groundY,
          width: 190,
          duration: 540,
          maxDuration: 540
        });
        if (this.game.triggerScreenShake) {
          this.game.triggerScreenShake(8, 15);
        }
        if (this.game.addFloatingText) {
          this.game.addFloatingText('🔥 NAPALM FIRESTORM UNLEASHED!', nb.x, groundY - 45, '#ff5500');
        }
      }
      if (!nb.active) this.napalmBombs.splice(i, 1);
    }

    for (let i = this.napalmFires.length - 1; i >= 0; i--) {
      const nf = this.napalmFires[i];
      nf.duration--;
      nf.y = terrain.getHeightAt(nf.x);
      if (nf.duration % 4 === 0 && this.game.entities && this.game.entities.enemies) {
        for (const e of this.game.entities.enemies) {
          if (e.alive && Math.abs(e.x - nf.x) < nf.width / 2) {
            e.hp -= 3.5;
            e.onFire = 30;
            if (e.hp <= 0) {
              e.alive = false;
              this.createExplosion(e.x, e.y, 'medium');
              this.game.entities.awardScore(e.scoreValue, e.creditValue, e.x, e.y);
            }
          }
        }
      }
      if (nf.duration <= 0) this.napalmFires.splice(i, 1);
    }

    // 4b.2 Update Napalm Viscous Liquid Droplets (Splatter, Bounce & Slope Rolling)
    for (let i = this.napalmDroplets.length - 1; i >= 0; i--) {
      const d = this.napalmDroplets[i];
      d.life--;
      d.vy += 0.22; // Gravity
      d.vx *= 0.985; // Air drag
      d.x += d.vx;
      d.y += d.vy;

      const gy = terrain.getHeightAt(d.x);
      if (d.y >= gy - 3) {
        d.y = gy;
        d.onGround = true;
        // Slope roll: check slope between d.x - 6 and d.x + 6
        const slope = (terrain.getHeightAt(d.x + 6) - terrain.getHeightAt(d.x - 6)) / 12;
        d.vx += -slope * 0.22; // Physical gravity roll downhill!
        d.vx *= 0.86; // Viscous ground friction
        d.vy = -d.vy * 0.22; // Inelastic splatter bounce
      }

      // Thermal DOT on ground units
      if (d.life % 6 === 0 && this.game.entities && this.game.entities.enemies) {
        for (const e of this.game.entities.enemies) {
          if (e.alive && Math.hypot(e.x - d.x, e.y - d.y) < d.radius + 18) {
            e.hp -= 2.2;
            e.onFire = 35;
            if (e.hp <= 0) {
              e.alive = false;
              this.createExplosion(e.x, e.y, 'medium');
              this.game.entities.awardScore(e.scoreValue, e.creditValue, e.x, e.y);
            }
          }
        }
      }

      if (d.life <= 0) this.napalmDroplets.splice(i, 1);
    }

    // 4b.3 Update Ejected Brass Shell Casings
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const c = this.shellCasings[i];
      c.life--;
      c.vy += 0.20;
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.spin;
      const gy = terrain.getHeightAt(c.x);
      if (c.y >= gy - 2) {
        c.y = gy - 2;
        c.vy = -c.vy * 0.35;
        c.vx *= 0.70;
      }
      if (c.life <= 0) this.shellCasings.splice(i, 1);
    }

    // 4b.4 Update Kinetic Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life--;
      s.vy += 0.18;
      s.x += s.vx;
      s.y += s.vy;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    // 4b.5 Update Water Splashes
    for (let i = this.waterSplashes.length - 1; i >= 0; i--) {
      const ws = this.waterSplashes[i];
      ws.life--;
      ws.vy += 0.25;
      ws.x += ws.vx;
      ws.y += ws.vy;
      if (ws.life <= 0) this.waterSplashes.splice(i, 1);
    }

    // 4b.6 Update Lightning EMP Shock Bombs & Expanding Ionization Rings (Aircraft Evolution REA)
    for (let i = this.empBombs.length - 1; i >= 0; i--) {
      const eb = this.empBombs[i];
      if (!eb.detonated) {
        eb.vy += this.gravity * 0.95;
        eb.x += eb.vx;
        eb.y += eb.vy;
        eb.angle = Math.atan2(eb.vy, eb.vx);

        const groundY = terrain.getHeightAt(eb.x);
        if (eb.y >= groundY - 8) {
          eb.detonated = true;
          eb.y = groundY - 4;
          eb.shockRadius = 10;
          this.createExplosion(eb.x, groundY, 'medium', 50);
          if (this.game.triggerScreenShake) {
            this.game.triggerScreenShake(7, 18);
          }
          if (window.soundSystem && typeof window.soundSystem.playRocketExplo === 'function') {
            window.soundSystem.playRocketExplo();
          }

          // Disable SAMs, Pantsir, Flak, and Ground units within 330px for 8 seconds (480 frames)
          let disabledCount = 0;
          if (this.game.entities && this.game.entities.enemies) {
            for (const e of this.game.entities.enemies) {
              if (e.alive && Math.hypot(e.x - eb.x, e.y - eb.y) < eb.maxShockRadius) {
                e.empDisabledTimer = 480; // 8 seconds disabled
                e.hp -= 45; // EMP electrical damage
                disabledCount++;
                if (e.hp <= 0) {
                  e.alive = false;
                  this.createExplosion(e.x, e.y, 'medium');
                  this.game.entities.awardScore(e.scoreValue, e.creditValue, e.x, e.y);
                }
              }
            }
          }
          // Also disrupt Zeppelins & airborne MiGs
          if (this.game.entities && this.game.entities.zeppelins) {
            for (const z of this.game.entities.zeppelins) {
              if (z.alive && Math.hypot(z.x - eb.x, z.y - eb.y) < eb.maxShockRadius * 1.5) {
                z.empDisabledTimer = 360;
                z.hp -= 120;
                disabledCount++;
              }
            }
          }
          if (this.game.entities && this.game.entities.migs) {
            for (const m of this.game.entities.migs) {
              if (m.alive && Math.hypot(m.x - eb.x, m.y - eb.y) < eb.maxShockRadius) {
                m.empDisabledTimer = 300;
                m.hp -= 60;
                disabledCount++;
              }
            }
          }
          if (this.game.addFloatingText) {
            this.game.addFloatingText(`⚡ EMP BURST: ${disabledCount} SYSTEMS OFFLINE! ⚡`, eb.x, groundY - 55, '#00e5ff');
          }

          // Spawn branching procedural lightning arcs to nearby terrain/targets
          for (let a = 0; a < 8; a++) {
            const arcAngle = (Math.PI * 2 * a) / 8 + (Math.random() - 0.5) * 0.4;
            const arcDist = 70 + Math.random() * 160;
            this.empArcs.push({
              x1: eb.x,
              y1: eb.y,
              x2: eb.x + Math.cos(arcAngle) * arcDist,
              y2: eb.y + Math.sin(arcAngle) * arcDist,
              life: 24,
              maxLife: 24
            });
          }
        }
      } else {
        // Expanding shockwave ionization wave
        eb.shockRadius += (eb.maxShockRadius - eb.shockRadius) * 0.18;
        eb.alpha -= 0.035;
        if (eb.alpha <= 0) {
          eb.active = false;
        }
      }

      if (!eb.active) this.empBombs.splice(i, 1);
    }

    // Update EMP Lightning Arcs
    for (let i = this.empArcs.length - 1; i >= 0; i--) {
      const arc = this.empArcs[i];
      arc.life--;
      if (arc.life <= 0) this.empArcs.splice(i, 1);
    }

    // 4c. Update AGM-114 Hellfire Laser-Guided Missiles
    for (let i = this.hellfires.length - 1; i >= 0; i--) {
      const m = this.hellfires[i];
      m.life--;
      if (m.speed < m.maxSpeed) m.speed += m.accel;

      if (!m.target || !m.target.alive) {
        let minDist = 750;
        if (this.game.entities && this.game.entities.enemies) {
          for (const e of this.game.entities.enemies) {
            if (e.alive) {
              const d = Math.hypot(e.x - m.x, e.y - m.y);
              if (d < minDist) {
                minDist = d;
                m.target = e;
              }
            }
          }
        }
      }

      if (m.target && m.target.alive) {
        const targetAngle = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        let diff = targetAngle - m.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        m.angle += Math.sign(diff) * Math.min(Math.abs(diff), m.turnRate);
      }

      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;
      m.x += m.vx;
      m.y += m.vy;

      const groundY = terrain.getHeightAt(m.x);
      let detonated = false;
      if (m.y >= groundY - 4) detonated = true;
      if (!detonated && this.game.entities) {
        const hit = this.game.entities.checkDirectHit(m.x, m.y, 14, m.damage);
        if (hit) detonated = true;
      }

      if (detonated || m.life <= 0) {
        m.active = false;
        if (terrain.isWaterAt && terrain.isWaterAt(m.x, groundY)) {
          this.createWaterSplash(m.x, groundY, 'large');
        } else {
          this.createKineticSparks(m.x, m.y, 10);
        }
        this.createExplosion(m.x, m.y, 'large', m.blastRadius);
        this.game.entities.checkBlastDamage(m.x, m.y, m.blastRadius, m.damage);
        if (window.soundSystem) {
          if (typeof window.soundSystem.playBigExplo === 'function') {
            window.soundSystem.playBigExplo();
          } else {
            window.soundSystem.play('lgboom', { volume: 0.9 });
          }
        }
        if (this.game.triggerScreenShake) {
          this.game.triggerScreenShake(10, 16);
        }
      }

      if (!m.active) this.hellfires.splice(i, 1);
    }

    // 5. Update Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.frameTimer++;
      if (exp.frameTimer >= 4) {
        exp.frameTimer = 0;
        exp.frame++;
        if (exp.frame > exp.maxFrames) {
          exp.active = false;
          this.explosions.splice(i, 1);
        }
      }
    }

    // 6. Update Mushroom Clouds
    for (let i = this.mushroomClouds.length - 1; i >= 0; i--) {
      const mc = this.mushroomClouds[i];
      mc.life--;
      if (mc.stemHeight < mc.maxStemHeight) {
        mc.stemHeight += 3.2;
      }
      if (mc.capScale < mc.maxCapScale) {
        mc.capScale += 0.025;
      }
      mc.topFrame = Math.min(4, Math.floor((1 - mc.life / mc.maxLife) * 4) + 1);

      if (mc.life < 50) {
        mc.alpha = mc.life / 50;
      }
      if (mc.life <= 0) {
        mc.active = false;
        this.mushroomClouds.splice(i, 1);
      }
    }

    // 7. Update Supersonic Atmospheric Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      // Real-world airframe shockwave physics: Push aircraft outward
      const p = this.game.entities.player;
      if (p && p.alive) {
        const dist = Math.hypot(p.x - sw.x, p.y - sw.y);
        if (Math.abs(dist - sw.radius) < sw.speed * 1.5) {
          const pushAngle = Math.atan2(p.y - sw.y, p.x - sw.x);
          const pushForce = Math.max(0, 1 - dist / sw.maxRadius) * 7.5;
          p.vx += Math.cos(pushAngle) * pushForce;
          p.vy += Math.sin(pushAngle) * pushForce - 2.5; // Upward thermal draft
          this.game.triggerScreenShake(22, 20);
          this.game.addFloatingText('⚠️ SUPERSONIC SHOCKWAVE HIT!', p.x, p.y - 30, '#ffcc00');
        }
      }

      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 8. Update Ejected Ground Debris & Shrapnel
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.vy += this.gravity * 1.35;
      d.vx *= 0.985;
      d.x += d.vx;
      d.y += d.vy;
      if (d.vRot) d.rotation = (d.rotation || 0) + d.vRot;
      d.life--;

      const groundY = terrain.getHeightAt(d.x);
      if (d.y >= groundY - 2) {
        d.y = groundY - 2;
        if (d.bounces !== undefined && d.bounces < (d.maxBounces || 1) && Math.abs(d.vy) > 1.2) {
          d.vy = -d.vy * 0.38;
          d.vx *= 0.7;
          d.bounces++;
          if (d.vRot) d.vRot *= 0.5;
        } else {
          d.vx *= 0.5;
          d.vy = 0;
          if (d.vRot) d.vRot = 0;
        }
      }

      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }
  }

  draw(ctx, cameraX) {
    const sprites = this.game.sprites;

    // Draw Flares
    for (const f of this.flares) {
      const sx = f.x - cameraX;
      ctx.save();
      ctx.fillStyle = '#fff4a0';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, f.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Bombs
    for (const b of this.bombs) {
      const sx = b.x - cameraX;
      if (sx < -60 || sx > 1340) continue;
      ctx.save();
      ctx.translate(sx, b.y);
      ctx.rotate(b.angle);
      if (b.type === 'nuke') {
        this.drawTacticalNukeBomb(ctx, b);
      } else if (b.sprite && b.sprite.complete) {
        ctx.drawImage(b.sprite, -b.sprite.width / 2, -b.sprite.height / 2);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(-6, -3, 12, 6);
      }
      ctx.restore();
    }

    // Draw 30mm High-Velocity Tracer Rounds (Bold & Highly Visible)
    for (const bullet of this.bullets) {
      const sx = bullet.x - cameraX;
      if (sx < -40 || sx > 1320) continue;
      ctx.save();
      ctx.translate(sx, bullet.y);
      ctx.rotate(bullet.angle);

      // Glowing Tracer Beam
      ctx.fillStyle = bullet.isAP ? '#ffff00' : '#ff9900';
      ctx.shadowColor = bullet.isAP ? '#ffff33' : '#ff7700';
      ctx.shadowBlur = 10;
      ctx.fillRect(-18, -3, 26, 6);

      // White-Hot Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-14, -1.2, 18, 2.4);
      ctx.restore();
    }

    // Draw Rockets with Exhaust Fire Trail
    for (const r of this.rockets) {
      const sx = r.x - cameraX;
      if (sx < -50 || sx > 1330) continue;
      const spriteName = `rocket${r.frame}.png`;
      const rSprite = sprites[spriteName] || sprites['rocket1.png'];

      // Rocket exhaust flame & smoke
      const backX = sx - Math.cos(r.angle) * 16;
      const backY = r.y - Math.sin(r.angle) * 16;
      ctx.save();
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(backX, backY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(sx, r.y);
      ctx.rotate(r.angle);
      if (rSprite && rSprite.complete) {
        ctx.drawImage(rSprite, -rSprite.width / 2, -rSprite.height / 2);
      } else {
        ctx.fillStyle = '#aaccff';
        ctx.fillRect(-10, -3, 20, 6);
      }
      ctx.restore();
    }

    // Draw Explosions (Aircraft Evolution Painterly Volumetric Fireballs)
    for (const exp of this.explosions) {
      const sx = exp.x - cameraX;
      if (sx < -120 || sx > 1400) continue;

      ctx.save();
      const progress = (exp.frame || 1) / (exp.maxFrames || 4);
      const baseR = (exp.type === 'large' ? 46 : (exp.type === 'air' ? 34 : 26));
      const expR = baseR * (0.65 + progress * 0.75);
      const alpha = Math.max(0, 1.0 - progress * 0.35);

      // 1. Billowing Charcoal Soot Clouds rising
      ctx.fillStyle = `rgba(32, 26, 22, ${alpha * 0.72})`;
      ctx.beginPath();
      ctx.arc(sx - expR * 0.35, exp.y - expR * 0.65, expR * 0.55, 0, Math.PI * 2);
      ctx.arc(sx + expR * 0.35, exp.y - expR * 0.65, expR * 0.55, 0, Math.PI * 2);
      ctx.arc(sx, exp.y - expR * 0.85, expR * 0.60, 0, Math.PI * 2);
      ctx.fill();

      // 2. Multi-Tiered Boiling Plasma Fireball
      const fGrad = ctx.createRadialGradient(sx, exp.y - expR * 0.25, 0, sx, exp.y - expR * 0.25, expR);
      fGrad.addColorStop(0, `rgba(255, 255, 240, ${alpha * 0.98})`);
      fGrad.addColorStop(0.25, `rgba(255, 235, 80, ${alpha * 0.95})`);
      fGrad.addColorStop(0.55, `rgba(255, 115, 15, ${alpha * 0.88})`);
      fGrad.addColorStop(0.82, `rgba(220, 38, 10, ${alpha * 0.75})`);
      fGrad.addColorStop(1, 'rgba(40, 15, 5, 0)');
      ctx.fillStyle = fGrad;

      ctx.beginPath();
      ctx.arc(sx, exp.y - expR * 0.25, expR, 0, Math.PI * 2);
      ctx.arc(sx - expR * 0.35, exp.y - expR * 0.15, expR * 0.72, 0, Math.PI * 2);
      ctx.arc(sx + expR * 0.35, exp.y - expR * 0.15, expR * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ground Shockwave Dust Ring
      ctx.strokeStyle = `rgba(255, 210, 150, ${alpha * 0.55})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(sx, exp.y, expR * 1.25, expR * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Draw Vitrified Molten Nuclear Craters
    for (let i = this.vitrifiedCraters.length - 1; i >= 0; i--) {
      const vc = this.vitrifiedCraters[i];
      vc.life--;
      const sx = vc.x - cameraX;
      if (sx < -300 || sx > 1580) {
        if (vc.life <= 0) this.vitrifiedCraters.splice(i, 1);
        continue;
      }
      const alpha = Math.min(1.0, vc.life / 180);

      ctx.save();
      // Glowing lava basin gradient
      const lGrad = ctx.createRadialGradient(sx, vc.y, 10, sx, vc.y, vc.radius);
      lGrad.addColorStop(0, `rgba(255, 68, 0, ${alpha * 0.88})`);
      lGrad.addColorStop(0.35, `rgba(255, 140, 0, ${alpha * 0.65})`);
      lGrad.addColorStop(0.7, `rgba(80, 20, 5, ${alpha * 0.45})`);
      lGrad.addColorStop(1, 'rgba(15, 8, 4, 0)');
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.ellipse(sx, vc.y, vc.radius, vc.radius * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing vitrified fissure cracks
      ctx.strokeStyle = `rgba(255, 230, 110, ${alpha * 0.65})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx - 50, vc.y - 3);
      ctx.lineTo(sx - 20, vc.y + 4);
      ctx.lineTo(sx + 30, vc.y - 2);
      ctx.lineTo(sx + 70, vc.y + 3);
      ctx.stroke();
      ctx.restore();

      if (vc.life <= 0) this.vitrifiedCraters.splice(i, 1);
    }

    // Draw Hyperthermal Incandescent Plasma Fireballs
    for (let i = this.nuclearFireballs.length - 1; i >= 0; i--) {
      const fb = this.nuclearFireballs[i];
      fb.life--;
      if (fb.radius < fb.maxRadius) {
        fb.radius += fb.growthSpeed;
      }
      const sx = fb.x - cameraX;
      const alpha = Math.min(1.0, fb.life / 25);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Solar flare ray spikes
      if (fb.rays && fb.life > 25) {
        for (const ray of fb.rays) {
          ctx.save();
          ctx.translate(sx, fb.y);
          ctx.rotate(ray.angle);
          ctx.fillStyle = 'rgba(255, 245, 180, 0.45)';
          ctx.beginPath();
          ctx.moveTo(0, -ray.width / 2);
          ctx.lineTo(ray.length * (fb.radius / fb.maxRadius), 0);
          ctx.lineTo(0, ray.width / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 4-Tier Multi-Stop Plasma Gradient (from 10^7 K core to outer soot)
      const pGrad = ctx.createRadialGradient(sx, fb.y, 0, sx, fb.y, fb.radius);
      pGrad.addColorStop(0, '#ffffff');                     // White-hot thermonuclear core
      pGrad.addColorStop(0.28, 'rgba(255, 255, 160, 0.98)'); // Electric yellow plasma
      pGrad.addColorStop(0.55, 'rgba(255, 120, 20, 0.92)');  // Searing convective fire
      pGrad.addColorStop(0.82, 'rgba(180, 30, 0, 0.85)');    // Crimson mantle
      pGrad.addColorStop(1, 'rgba(40, 5, 0, 0)');           // Outer boundary
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(sx, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (fb.life <= 0) this.nuclearFireballs.splice(i, 1);
    }

    // Draw Volumetric Toroidal Mushroom Clouds
    for (let i = this.mushroomClouds.length - 1; i >= 0; i--) {
      const mc = this.mushroomClouds[i];
      mc.life--;
      if (mc.stemHeight < mc.maxStemHeight) {
        mc.stemHeight += 3.4;
      }
      if (mc.capScale < mc.maxCapScale) {
        mc.capScale += 0.028;
      }
      mc.topFrame = Math.min(4, Math.floor((1 - mc.life / mc.maxLife) * 4) + 1);

      if (mc.life < 70) {
        mc.alpha = mc.life / 70;
      }
      if (mc.life <= 0) {
        mc.active = false;
        this.mushroomClouds.splice(i, 1);
        continue;
      }

      const sx = mc.x - cameraX;
      ctx.save();
      ctx.globalAlpha = mc.alpha;

      const stemSprite = sprites['nukestem.png'];
      const topSpriteName = `nuketop${mc.topFrame}.png`;
      const topSprite = sprites[topSpriteName] || sprites['nuketop1.png'];

      // 1. Columnar Chimney Stem with Glowing Convective Veins
      const stemW = Math.max(38, 48 * Math.min(1.6, mc.capScale));
      const sGrad = ctx.createLinearGradient(sx - stemW / 2, 0, sx + stemW / 2, 0);
      sGrad.addColorStop(0, 'rgba(20, 10, 5, 0.88)');
      sGrad.addColorStop(0.35, 'rgba(70, 30, 10, 0.94)');
      sGrad.addColorStop(0.5, 'rgba(255, 110, 20, 0.88)'); // Glowing incandescent chimney core
      sGrad.addColorStop(0.65, 'rgba(70, 30, 10, 0.94)');
      sGrad.addColorStop(1, 'rgba(20, 10, 5, 0.88)');

      ctx.fillStyle = sGrad;
      ctx.fillRect(sx - stemW / 2, mc.y - mc.stemHeight, stemW, mc.stemHeight);

      // Sprite overlay on stem if available
      if (stemSprite && stemSprite.complete && mc.stemHeight > 0) {
        ctx.drawImage(
          stemSprite,
          sx - stemSprite.width / 2,
          mc.y - mc.stemHeight,
          stemSprite.width,
          mc.stemHeight
        );
      }

      // 2. Wilson Condensation Vapor Ring (Atmospheric inversion layer)
      if (mc.rings) {
        for (const ring of mc.rings) {
          const ringY = mc.y - mc.stemHeight * ring.heightRatio;
          if (ring.radius < ring.maxRadius) ring.radius += 3.2;
          ctx.save();
          ctx.strokeStyle = `rgba(240, 248, 255, ${mc.alpha * 0.45 * (1 - ring.radius / ring.maxRadius)})`;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.ellipse(sx, ringY, ring.radius, ring.radius * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Toroidal Vortex Cap (Rolling Donut Firestorm)
      const capW = (topSprite && topSprite.complete ? topSprite.width : 160) * mc.capScale;
      const capH = (topSprite && topSprite.complete ? topSprite.height : 95) * mc.capScale;
      const capY = mc.y - mc.stemHeight - capH / 2;

      // Volumetric Under-Glow (Toroidal Fire Core)
      const capGrad = ctx.createRadialGradient(sx, capY, 10, sx, capY, capW / 2);
      capGrad.addColorStop(0, 'rgba(255, 235, 140, 0.95)');
      capGrad.addColorStop(0.32, 'rgba(255, 95, 15, 0.90)');
      capGrad.addColorStop(0.72, 'rgba(55, 18, 6, 0.85)');
      capGrad.addColorStop(1, 'rgba(15, 5, 2, 0)');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.ellipse(sx, capY, capW / 2, capH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top sprite
      if (topSprite && topSprite.complete) {
        ctx.drawImage(topSprite, sx - capW / 2, capY - capH / 2, capW, capH);
      }

      ctx.restore();
    }

    // Draw Drifting Radioactive Fallout Embers
    for (let i = this.nuclearFallout.length - 1; i >= 0; i--) {
      const fo = this.nuclearFallout[i];
      fo.life--;
      fo.x += fo.vx;
      fo.y += fo.vy;
      const sx = fo.x - cameraX;
      if (sx >= -20 && sx <= 1300) {
        ctx.save();
        ctx.fillStyle = fo.color;
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.min(1.0, fo.life / 60);
        ctx.beginPath();
        ctx.arc(sx, fo.y, fo.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (fo.life <= 0) this.nuclearFallout.splice(i, 1);
    }

    // Draw Supersonic Atmospheric Shockwave Rings
    for (const sw of this.shockwaves) {
      const sx = sw.x - cameraX;
      ctx.save();
      ctx.globalAlpha = sw.alpha;

      // Outer luminous supersonic edge
      ctx.beginPath();
      ctx.arc(sx, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, (1 - sw.radius / sw.maxRadius) * sw.thickness);
      ctx.strokeStyle = 'rgba(255, 235, 190, 0.95)';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Inner atmospheric refraction condensation ring
      if (sw.radius > 50) {
        ctx.beginPath();
        ctx.arc(sx, sw.y, sw.radius * 0.92, 0, Math.PI * 2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(160, 220, 255, 0.5)';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Ejected Ground Debris & Shrapnel
    for (const d of this.debris) {
      const sx = d.x - cameraX;
      if (sx < -30 || sx > 1310) continue;
      ctx.save();
      ctx.translate(sx, d.y);
      if (d.rotation) ctx.rotate(d.rotation);

      // Incandescent spark on hot fragment
      if (d.sparkColor && d.life > 35) {
        ctx.fillStyle = d.sparkColor;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 4;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = d.color || '#334155';
      if (d.width && d.height) {
        ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, d.size || 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Active Napalm Firestorms (Raging Liquid Fire & Billowing Smoke)
    for (const nf of this.napalmFires) {
      const sx = nf.x - cameraX;
      if (sx < -200 || sx > 1480) continue;
      const alpha = Math.min(1.0, nf.duration / 60);

      ctx.save();
      // Scorched ground shadow
      ctx.fillStyle = `rgba(15, 10, 5, ${alpha * 0.75})`;
      ctx.fillRect(sx - nf.width / 2, nf.y - 2, nf.width, 10);

      // Multi-layer animated fire tongues
      const flameCols = ['#ff3300', '#ff6600', '#ffaa00', '#ffff55'];
      for (let f = 0; f < 18; f++) {
        const fx = sx - nf.width / 2 + (f / 17) * nf.width;
        const fHeight = 16 + Math.sin(Date.now() * 0.02 + f * 1.5) * 12 + Math.random() * 8;
        const col = flameCols[f % flameCols.length];

        ctx.fillStyle = col;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(fx - 7, nf.y);
        ctx.lineTo(fx + 7, nf.y);
        ctx.lineTo(fx, nf.y - fHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Billowing smoke puffs rising
      ctx.fillStyle = `rgba(35, 30, 25, ${alpha * 0.45})`;
      for (let s = 0; s < 5; s++) {
        const smX = sx - nf.width / 3 + s * (nf.width / 4);
        const smY = nf.y - 25 - ((Date.now() * 0.04 + s * 25) % 65);
        const smR = 10 + s * 3;
        ctx.beginPath();
        ctx.arc(smX, smY, smR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Napalm Bombs
    for (const nb of this.napalmBombs) {
      const sx = nb.x - cameraX;
      if (sx < -50 || sx > 1330) continue;
      ctx.save();
      ctx.translate(sx, nb.y);
      ctx.rotate(nb.angle);
      // Olive-drab body with orange incendiary bands
      ctx.fillStyle = '#4a5d3e';
      ctx.fillRect(-10, -4, 20, 8);
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(-4, -4, 4, 8);
      ctx.fillRect(4, -4, 4, 8);
      // Fins
      ctx.fillStyle = '#2d3824';
      ctx.fillRect(-12, -6, 4, 12);
      ctx.restore();
    }

    // Draw AGM-114 Hellfire Laser-Guided Missiles
    for (const m of this.hellfires) {
      const sx = m.x - cameraX;
      if (sx < -50 || sx > 1330) continue;
      ctx.save();
      ctx.translate(sx, m.y);
      ctx.rotate(m.angle);

      // Rocket Motor Exhaust Flame
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 14;
      ctx.fillRect(-18, -3, 12, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-14, -1.5, 8, 3);

      // Missile Body
      ctx.fillStyle = '#1c242c';
      ctx.fillRect(-8, -3.5, 20, 7);
      // Seeker Head (Laser Optical Dome)
      ctx.fillStyle = '#ffee33';
      ctx.fillRect(10, -3, 4, 6);
      // Dual Control Fins
      ctx.fillStyle = '#445566';
      ctx.fillRect(-6, -7, 3, 14);
      ctx.fillRect(4, -5.5, 2.5, 11);
      ctx.restore();

      // Laser guide line to locked target
      if (m.target && m.target.alive) {
        const tx = m.target.x - cameraX;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 30, 30, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, m.y);
        ctx.lineTo(tx, m.target.y);
        ctx.stroke();

        // Target Laser Designator Crosshair
        ctx.strokeStyle = '#ff2222';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.strokeRect(tx - 10, m.target.y - 10, 20, 20);
        ctx.restore();
      }
    }

    // Draw Burning Viscous Liquid Napalm Droplets (Real-World Splatter & Slope Pools)
    for (const d of this.napalmDroplets) {
      const sx = d.x - cameraX;
      if (sx < -40 || sx > 1320) continue;
      ctx.save();
      const alpha = Math.min(1.0, d.life / 40);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.onGround ? '#ffee55' : '#ffffff';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();

      // Mini dancing flame tongue over liquid droplet
      const flH = 6 + Math.sin(Date.now() * 0.03 + d.x) * 4;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(sx - d.radius, d.y);
      ctx.lineTo(sx + d.radius, d.y);
      ctx.lineTo(sx, d.y - flH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw Ejected Brass 30mm Shell Casings
    for (const c of this.shellCasings) {
      const sx = c.x - cameraX;
      if (sx < -20 || sx > 1300) continue;
      ctx.save();
      ctx.translate(sx, c.y);
      ctx.rotate(c.angle);
      ctx.fillStyle = '#d4af37'; // High-polish cartridge brass
      ctx.fillRect(-2.5, -1, 5, 2);
      ctx.restore();
    }

    // Draw Kinetic Ricochet Metal Sparks
    for (const s of this.sparks) {
      const sx = s.x - cameraX;
      if (sx < -20 || sx > 1300) continue;
      ctx.save();
      ctx.globalAlpha = s.life / s.maxLife;
      ctx.fillStyle = s.color;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx, s.y, 2.0 * (s.life / s.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Water Geysers & Foaming Surface Ripples
    for (const ws of this.waterSplashes) {
      const sx = ws.x - cameraX;
      if (sx < -20 || sx > 1300) continue;
      ctx.save();
      const frac = ws.life / ws.maxLife;
      ctx.globalAlpha = frac * 0.85;
      ctx.fillStyle = '#b8e4f9';
      ctx.beginPath();
      ctx.arc(sx, ws.y, ws.radius * frac, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (frac * 0.6) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, ws.y, (1 - frac) * 20, (1 - frac) * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw EMP Shockwave Lightning Bombs (Aircraft Evolution REA)
    for (const eb of this.empBombs) {
      const sx = eb.x - cameraX;
      if (sx < -400 || sx > 1600) continue;
      ctx.save();
      if (!eb.detonated) {
        ctx.translate(sx, eb.y);
        ctx.rotate(eb.angle);
        // Cyan chrome EMP chassis
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(-12, -5, 24, 10);
        // Ionization coil bands (pulsing cyan/white)
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-4, -6, 3, 12);
        ctx.fillRect(4, -6, 3, 12);
        // EMP Core glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Tail Stabilizer fins
        ctx.fillStyle = '#164e63';
        ctx.fillRect(-14, -7, 4, 14);
      } else {
        // Expanding EMP Ionization Shockwave Rings
        ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, eb.alpha * 0.85)})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(sx, eb.y, eb.shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, eb.alpha * 0.7)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, eb.y, eb.shockRadius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // Draw Procedural Lightning Arcs
    for (const arc of this.empArcs) {
      const sx1 = arc.x1 - cameraX;
      const sx2 = arc.x2 - cameraX;
      const alpha = arc.life / arc.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 230, 255, ${alpha})`;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(sx1, arc.y1);
      const midX1 = (sx1 * 2 + sx2) / 3 + (Math.sin(arc.life * 4) * 12);
      const midY1 = (arc.y1 * 2 + arc.y2) / 3 + (Math.cos(arc.life * 3) * 12);
      const midX2 = (sx1 + sx2 * 2) / 3 - (Math.cos(arc.life * 4) * 12);
      const midY2 = (arc.y1 + arc.y2 * 2) / 3 - (Math.sin(arc.life * 3) * 12);
      ctx.lineTo(midX1, midY1);
      ctx.lineTo(midX2, midY2);
      ctx.lineTo(sx2, arc.y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Authentic Cold War B61 / Mk-28 Tactical Thermonuclear Gravity Munition Vector Model
  drawTacticalNukeBomb(ctx, b) {
    ctx.save();

    // 1. Aerodynamic condensation wake
    if (b.trail && b.trail.length > 1) {
      ctx.save();
      for (let t = 0; t < b.trail.length - 1; t++) {
        const pt1 = b.trail[t];
        const pt2 = b.trail[t + 1];
        ctx.strokeStyle = `rgba(255, 240, 200, ${pt1.alpha * 0.45})`;
        ctx.lineWidth = 2.5 + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(pt1.x - b.x, pt1.y - b.y);
        ctx.lineTo(pt2.x - b.x, pt2.y - b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Main Bomb Fuselage (Cylindrical body with tapered nose radome & boat-tail)
    // Scale: length 46px, diameter 13px
    ctx.beginPath();
    ctx.moveTo(23, 0);
    ctx.bezierCurveTo(23, -3.8, 15, -6.2, 7, -6.2);
    ctx.lineTo(-14, -6.2);
    ctx.lineTo(-22, -3.2);
    ctx.lineTo(-24, -3.2);
    ctx.lineTo(-24, 3.2);
    ctx.lineTo(-22, 3.2);
    ctx.lineTo(-14, 6.2);
    ctx.lineTo(7, 6.2);
    ctx.bezierCurveTo(15, 6.2, 23, 3.8, 23, 0);
    ctx.closePath();

    // Metallic body shading gradient (Brushed Cold War Titanium / Steel)
    const grad = ctx.createLinearGradient(0, -7, 0, 7);
    grad.addColorStop(0, '#19241d');    // Upper shadow
    grad.addColorStop(0.28, '#4f6655'); // Upper specular highlight
    grad.addColorStop(0.55, '#303f34'); // Mid olive metal
    grad.addColorStop(0.85, '#1b251e'); // Lower body
    grad.addColorStop(1, '#0e1510');    // Belly shadow
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#0a100c';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Specular highlight gleam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(17, -3.2);
    ctx.lineTo(-15, -3.2);
    ctx.stroke();

    // 3. High-Visibility Radioactive Hazard Warning Bands (2 Yellow Rings)
    const bandCols = ['#ffd200', '#ffb700'];
    [5, 11].forEach((bx, idx) => {
      ctx.fillStyle = bandCols[idx];
      ctx.fillRect(bx, -6.0, 3.5, 12.0);
      // Hazard black pinstripe
      ctx.fillStyle = '#111111';
      ctx.fillRect(bx + 1, -6.0, 1.4, 12.0);
    });

    // 4. Stenciled Radiation Trefoil Symbol (☢️)
    ctx.save();
    ctx.translate(-3, 0);
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. 4 Swept Cruciform Stabilizing Tail Fins
    ctx.fillStyle = '#243027';
    ctx.strokeStyle = '#3d5243';
    ctx.lineWidth = 1.0;

    // Top fin
    ctx.beginPath();
    ctx.moveTo(-11, -6.2);
    ctx.lineTo(-24, -13.5);
    ctx.lineTo(-25, -13.5);
    ctx.lineTo(-20, -5.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(-11, 6.2);
    ctx.lineTo(-24, 13.5);
    ctx.lineTo(-25, 13.5);
    ctx.lineTo(-20, 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side perspective fin
    ctx.fillStyle = '#36493b';
    ctx.beginPath();
    ctx.moveTo(-9, -1.0);
    ctx.lineTo(-23, -2.5);
    ctx.lineTo(-23, 2.5);
    ctx.lineTo(-9, 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Active Pulsing Red Arming Strobe Beacon
    const blinkOn = Math.floor(Date.now() / 80) % 2 === 0;
    if (blinkOn) {
      ctx.save();
      // Tail arming LED
      ctx.fillStyle = '#ff2200';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(-24, 0, 3.0, 0, Math.PI * 2);
      ctx.fill();

      // Nose radar altimeter sensor pulse
      ctx.fillStyle = '#ffff33';
      ctx.shadowColor = '#ffee00';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(23, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

window.WeaponManager = WeaponManager;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeaponManager;
}
