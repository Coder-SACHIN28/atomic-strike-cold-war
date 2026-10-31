/**
 * Atomic Strike: Cold War - Main Game Controller & State Machine
 * Web portal implementation ready for CrazyGames, Poki, and Standalone.
 * 100% authentic graphics and menus matching the original APK.
 */

class AtomicBomberGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new RenderEngine(this.canvas);
    this.input = window.inputController;
    this.terrain = new TerrainEngine(4800, 720);
    this.weapons = new WeaponManager(this);
    this.entities = new EntityManager(this);
    this.hud = new HUD(this);
    this.armory = new ArmoryManager(this);
    this.codex = (typeof window !== 'undefined' && window.EnemyCodexManager) ? new window.EnemyCodexManager(this) : (typeof EnemyCodexManager !== 'undefined' ? new EnemyCodexManager(this) : null);

    this.state = 'TITLE'; // TITLE, BRIEFING, PLAYING, PAUSED, ARMORY, CODEX, WAVE_COMPLETE, GAMEOVER
    this.currentWave = 1;
    this.wave = 1;
    this.waveGraceTimer = 0; // 2.5s safe recon buffer
    this.waveClearTimer = 0; // Seamless victory flight countdown before next wave
    this.migTimer = 350;
    this.deathTimer = 0; // Deterministic frame counter for crash explosion before GAMEOVER

    this.sprites = {};
    this.spritesLoaded = false;

    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.fixedDelta = 1000 / 60; // 60 FPS fixed physics step

    this.buttons = []; // Clickable button rects for mouse / touch

    // Multi-Theater Map Management (Europe -> Siberia -> Desert)
    this.theaters = ['EUROPEAN', 'SIBERIA', 'DESERT'];
    this.currentTheater = 'EUROPEAN';
    this.theaterTransitionCooldown = 0;
    this.mapTransition = {
      active: false,
      timer: 0,
      maxTimer: 100,
      targetTheater: 'SIBERIA',
      radioSpeaker: '',
      radioMessage: '',
      reason: 'ALTITUDE'
    };
    this.clouds = [];
    for (let i = 0; i < 28; i++) {
      this.clouds.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        radius: 80 + Math.random() * 120,
        speed: 0.8 + Math.random() * 1.5,
        layer: Math.floor(Math.random() * 3)
      });
    }

    // CrazyGames Monetization & Ad Tracking
    this.lastMidgameAdTime = 0;
    this.isAdShowing = false;

    // Allied AI Wingmen Air Support System & Military Radio Comms
    this.wingmenFreeUsed = false;
    this.wingmenCost = 1500;
    this.wingmenCooldown = 0;
    this.activeRadioMessage = { speaker: '', text: '', timer: 0 };
    this.ambientRadioTimer = 750;
    this._pilotHumorCooldown = 0;

    this.initPlatformSDKs();
    this.preloadSprites();
    this.initCanvasClickListeners();
  }

  // Official CrazyGames v3 SDK & Poki Connectors
  async initPlatformSDKs() {
    const isCrazyGames = typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      typeof window.location.hostname === 'string' && (
        window.location.hostname.includes('crazygames') ||
        window.location.hostname.includes('127.0.0.1') ||
        window.location.hostname.includes('localhost')
      );

    if (!isCrazyGames) {
      console.log('[Platform] Standalone / Itch.io environment detected. Platform SDK init skipped.');
      return;
    }

    try {
      if (window.CrazyGames && window.CrazyGames.SDK && typeof window.CrazyGames.SDK.init === 'function') {
        await Promise.race([
          window.CrazyGames.SDK.init(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('SDK init timeout')), 2000))
        ]);
        console.log('CrazyGames SDK v3 initialized successfully');

        // Cloud Save Sync via CrazyGames Data Module
        if (window.CrazyGames.SDK.data && typeof window.CrazyGames.SDK.data.getItem === 'function') {
          try {
            const cloudSave = await window.CrazyGames.SDK.data.getItem('atomic_bomber_save');
            if (cloudSave && this.armory) {
              const saveStr = typeof cloudSave === 'string' ? cloudSave : JSON.stringify(cloudSave);
              localStorage.setItem('atomic_bomber_save', saveStr);
              this.armory.state = this.armory.loadState();
            }
          } catch (err) {}
        }
      }
    } catch (e) {
      console.warn('CrazyGames SDK init notice:', e);
    }

    try {
      if (window.PokiSDK && typeof window.PokiSDK.init === 'function') {
        await window.PokiSDK.init();
      }
    } catch (e) {}
  }

  notifyLoadingStart() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
        if (typeof window.CrazyGames.SDK.game.loadingStart === 'function') {
          window.CrazyGames.SDK.game.loadingStart();
        }
      }
      if (window.PokiSDK && typeof window.PokiSDK.gameLoadingStart === 'function') {
        window.PokiSDK.gameLoadingStart();
      }
    } catch (e) {}
  }

  notifyLoadingStop() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
        if (typeof window.CrazyGames.SDK.game.loadingStop === 'function') {
          window.CrazyGames.SDK.game.loadingStop();
        }
      }
      if (window.PokiSDK && typeof window.PokiSDK.gameLoadingFinished === 'function') {
        window.PokiSDK.gameLoadingFinished();
      }
    } catch (e) {}
  }

  notifyGameplayStart() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
        if (typeof window.CrazyGames.SDK.game.gameplayStart === 'function') {
          window.CrazyGames.SDK.game.gameplayStart();
        }
      }
      if (window.PokiSDK && typeof window.PokiSDK.gameplayStart === 'function') {
        window.PokiSDK.gameplayStart();
      }
    } catch (e) {}
  }

  notifyGameplayStop() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
        if (typeof window.CrazyGames.SDK.game.gameplayStop === 'function') {
          window.CrazyGames.SDK.game.gameplayStop();
        }
      }
      if (window.PokiSDK && typeof window.PokiSDK.gameplayStop === 'function') {
        window.PokiSDK.gameplayStop();
      }
    } catch (e) {}
  }

  notifyWaveCleared() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK) {
        if (window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.happytime === 'function') {
          window.CrazyGames.SDK.game.happytime();
        } else if (typeof window.CrazyGames.SDK.happytime === 'function') {
          window.CrazyGames.SDK.happytime();
        }
      }
      if (window.PokiSDK && typeof window.PokiSDK.happyTime === 'function') {
        window.PokiSDK.happyTime();
      }
    } catch (e) {}

    // Pilot celebrates sector clear with funny meme lines
    setTimeout(() => {
      if (this.triggerPilotHumor) {
        this.triggerPilotHumor('WAVE_CLEARED');
      }
    }, 400);
  }

  triggerHappyTime() {
    this.notifyWaveCleared();
  }

  // Clean Pure GitHub / Web Game: Instant execution without any ads or blocks
  requestMidgameAd(onComplete) {
    this.isAdShowing = false;
    if (onComplete) onComplete();
  }

  // Pure Web / GitHub Mode: Grants rewards / tactical capabilities directly
  requestRewardedAd(rewardName, onRewarded, onDismissed) {
    this.isAdShowing = false;
    if (onRewarded) onRewarded();
  }

  // Emergency Revive Feature (Second Chance) from Rewarded Ad
  revivePlayer() {
    if (!this.entities.player) return;
    const p = this.entities.player;
    p.alive = true;
    p.hp = p.maxHp;
    p.bombs = Math.max(10, p.bombs);
    p.rocketAmmo = Math.max(8, p.rocketAmmo);
    p.flares = Math.max(6, p.flares);
    p.invulnerableTimer = 180; // 3 seconds invulnerability shield
    p.y = Math.min(p.y, 250); // Elevate plane safely above ground
    p.angle = 0; // Level flight attitude
    p.currentSpeed = p.baseSpeed;
    this.deathTimer = 0;
    this.state = 'PLAYING';
    this.notifyGameplayStart();
    window.soundSystem.startEngine();
    window.soundSystem.play('beep', { volume: 1.0 });
    this.addFloatingText('EMERGENCY REVIVE: 100% HEALTH & SHIELD ACTIVE!', p.x, p.y - 30, '#00ff66');
  }

  // Set Active Radio Pilot Comms Message with HUD Banner & Real Audible Voice
  setRadioMessage(speaker, text, duration = 240, forceVoice = false) {
    // Dynamically scale on-screen HUD duration with message text length so speech finishes cleanly
    const calcDuration = Math.max(duration, Math.ceil(((text || '').length / 11) * 60) + 70);
    this.activeRadioMessage = { speaker, text, timer: calcDuration };

    // Real voice speech ONLY plays when calling Air Support or when bot pilots talk (per user request)
    const isWingmanComms = forceVoice || 
      speaker.includes('RAZOR') || 
      speaker.includes('VIPER') || 
      speaker.includes('WINGMAN') || 
      speaker.includes('AIR SUPPORT');

    if (isWingmanComms && window.soundSystem && typeof window.soundSystem.speakRadioVoice === 'function') {
      window.soundSystem.speakRadioVoice(text, speaker);
    } else if (window.soundSystem) {
      window.soundSystem.playRadioChime(); // Tactical radio squelch click for HUD banner alerts
    }
  }

  // Interactive Pilot Tactical Comms & English NATO Military Reactions
  triggerPilotHumor(category, force = false) {
    if (this.state !== 'PLAYING') return;
    const now = Date.now();
    if (!this._pilotHumorCooldown) this._pilotHumorCooldown = 0;

    // Minimum 8.0s delay between spontaneous remarks
    if (!force && now - this._pilotHumorCooldown < 8000) return;

    const commsBank = {
      // 1. Plane On Fire (< 28% HP) - Critical warning
      FIRE_DANGER: [
        "Viper Lead: Taking severe fire! Airframe structural failure imminent!",
        "Viper Lead: Engine fire warning! Need an emergency repair airdrop immediately!",
        "Viper Lead: Controls sluggish, hydraulic pressure dropping! Scrambling for supplies!",
        "Houston, we have a critical problem! Airframe compromised!"
      ],

      // 2. High Combo Multi-Kill (4+ kills in streak)
      MULTIKILL: [
        "Viper Lead: Direct hits across the entire target grid! Outstanding impact!",
        "AWACS: Multiple hostile detonations confirmed. Target cluster eliminated!",
        "Viper Lead: Strike package delivered. Complete hostile convoy neutralized!"
      ],

      // 3. Nuke Detonation [N]
      NUKE_DROP: [
        "Viper Lead: Tactical atomic strike released! Turn and climb, shockwave inbound!",
        "AWACS: Flash detected! Thermal burst confirmed across entire sector!",
        "Viper Lead: Detonation confirmed. Target zone completely wiped clean!"
      ],

      // 4. Calling Air Support [H]
      AIR_SUPPORT: [
        "Mayday Mayday! Viper Lead to Razor Flight, request CAS air support at my coordinates!",
        "Allied Command: Air support scrambled! Flight of two strike fighters en route!"
      ],

      // 5. MiG Jet Shot Down
      MIG_KILL: [
        "Viper Lead: Splash one bandit! Hostile supersonic interceptor down!",
        "AWACS: Hostile air contact off the scope. Clean kill, Viper Lead!",
        "Viper Lead: MiG down in flames! Airspace secured!"
      ],

      // 6. Near Ground Dive (Kissing the dirt)
      NEAR_CRASH: [
        "PULL UP! TERRAIN AHEAD! PULL UP!",
        "Altitude warning! Pull up before ground impact!"
      ],

      // 7. Engine Stall (Too slow in air)
      STALL: [
        "STALL WARNING! Increase airspeed immediately!"
      ],

      // 8. Out of Ammo
      OUT_OF_AMMO: [
        "Winchester on ordnance! Intercept supply parachute for reload!"
      ],

      // 9. Wave Cleared
      WAVE_CLEARED: [
        "AWACS: Sector cleared of Warsaw Pact hostiles! Excellent sortie, Viper Lead!",
        "Command: All primary defense objectives eliminated! Prepare for next assault wave!",
        "Viper Lead: Airspace under NATO control. Refuel and rearm for next mission!"
      ],

      // 10. Cruising / No-Fight Roaming (When player is flying peacefully without firing)
      CRUISING_IDLE: [
        "AWACS: Airspace quiet on radar. Maintain combat combat patrol heading.",
        "Viper Lead: Cruising altitude steady. Scanning forward horizon for hostiles.",
        "Overlord: Reconnaissance confirms enemy armored columns advancing ahead.",
        "Viper Lead: Systems green, scanning terrain contour for target signatures."
      ]
    };

    const lines = commsBank[category];
    if (!lines || lines.length === 0) return;

    const text = lines[Math.floor(Math.random() * lines.length)];
    this._pilotHumorCooldown = now;
    // Note: only Air Support calls voice speech; other alerts display silently on HUD
    const shouldVoice = category === 'AIR_SUPPORT';
    this.setRadioMessage('PILOT', text, 270, shouldVoice);
  }

  // Request Allied AI Air Support (Razor 1 & Razor 2)
  requestAirSupport() {
    if (this.state !== 'PLAYING') return;
    const player = this.entities.player;
    if (!player || !player.alive) return;

    if (this.wingmenCooldown > 0) {
      const secLeft = Math.ceil(this.wingmenCooldown / 60);
      this.addFloatingText(`⏱️ AIR SUPPORT REARMING (${secLeft}s)`, player.x, player.y - 35, '#ffaa00');
      return;
    }

    // 1. First Call-in is 100% FREE!
    if (!this.wingmenFreeUsed) {
      this.wingmenFreeUsed = true;
      this.wingmenCooldown = 1100; // ~18s tactical turnaround
      this.setRadioMessage('VIPER LEAD', 'Mayday Mayday! Viper Lead to Razor Flight, request CAS air support at my coordinates!', 240, true);
      this.entities.spawnWingmenStrike();
      this.updateAirSupportButtonUi();
      return;
    }

    // 2. Can be purchased with in-game Combat Funds ($1,500)
    if (player.credits >= this.wingmenCost) {
      player.credits -= this.wingmenCost;
      if (this.armory) {
        this.armory.state.credits = player.credits;
        this.armory.saveState();
      }
      this.notifyGameplayStop();
      this.wingmenCooldown = 1100;
      this.setRadioMessage('VIPER LEAD', 'Mayday Mayday! Viper Lead to Razor Flight, request CAS air support at my coordinates!', 240, true);
      this.entities.spawnWingmenStrike();
      this.addFloatingText('-$1,500 COMBAT AIR SUPPORT PURCHASED', player.x, player.y - 45, '#55ff55');
      this.updateAirSupportButtonUi();
      return;
    }

    // 3. Low on funds: Emergency Tactical Scramble
    this.wingmenCooldown = 1200;
    this.setRadioMessage('VIPER LEAD', 'Emergency distress call! Scrambling CAS air support immediately!', 240, true);
    this.entities.spawnWingmenStrike();
    this.addFloatingText('★ ⚠️ EMERGENCY DISTRESS AIR SUPPORT DEPLOYED! ★', player.x, player.y - 45, '#ff8800');
    this.updateAirSupportButtonUi();
  }

  updateAirSupportButtonUi() {
    const btn = document.getElementById('btn-airsupport');
    if (!btn) return;
    if (this.wingmenCooldown > 0) {
      const sec = Math.ceil(this.wingmenCooldown / 60);
      btn.innerText = `👥 AIR SUPPORT (${sec}s)`;
      btn.classList.add('muted');
    } else if (!this.wingmenFreeUsed) {
      btn.innerText = '👥 AIR SUPPORT [H] (FREE)';
      btn.classList.remove('muted');
    } else {
      btn.innerText = '👥 AIR SUPPORT [H] ($1,500 / AD)';
      btn.classList.remove('muted');
    }
  }

  // Deploy Tactical Autonomous FPV Kamikaze Combat Drone (FPV-7 Phoenix)
  callDroneStrike() {
    if (this.state !== 'PLAYING') return;
    const player = this.entities.player;
    if (!player || !player.alive) return;

    if (player.droneCooldown > 0) {
      const secLeft = Math.ceil(player.droneCooldown / 60);
      this.addFloatingText(`⏱️ DRONE FABRICATION IN PROGRESS (${secLeft}s)`, player.x, player.y - 35, '#ffaa00');
      return;
    }

    // 1. Free Strike if available
    if (player.droneStrikesAvailable > 0) {
      player.droneStrikesAvailable--;
      player.droneCooldown = 720; // 12s cooldown
      this.entities.deployFpvDroneStrike();
      this.updateDroneButtonUi();
      return;
    }

    // 2. Buy with combat funds ($500)
    const droneCost = 500;
    if (player.credits >= droneCost) {
      player.credits -= droneCost;
      if (this.armory) {
        this.armory.state.credits = player.credits;
        this.armory.saveState();
      }
      player.droneCooldown = 720;
      this.entities.deployFpvDroneStrike();
      this.addFloatingText('-$500 FPV COMBAT DRONE LAUNCHED', player.x, player.y - 45, '#55ff55');
      this.updateDroneButtonUi();
      return;
    }

    // 3. Low on funds: Emergency Drone Dispatch
    player.droneCooldown = 900;
    this.entities.deployFpvDroneStrike();
    this.addFloatingText('★ 🎯 EMERGENCY FPV DRONE DISPATCHED! ★', player.x, player.y - 45, '#00e5ff');
    this.updateDroneButtonUi();
  }

  updateDroneButtonUi() {
    const btn = document.getElementById('btn-drone');
    if (!btn) return;
    const player = this.entities.player;
    if (!player) return;
    if (player.droneCooldown > 0) {
      const sec = Math.ceil(player.droneCooldown / 60);
      btn.innerText = `🎯 DRONE (${sec}s)`;
      btn.classList.add('muted');
    } else if (player.droneStrikesAvailable > 0) {
      btn.innerText = `🎯 DRONE [U] (${player.droneStrikesAvailable} FREE)`;
      btn.classList.remove('muted');
    } else {
      btn.innerText = '🎯 DRONE [U] ($500 / AD)';
      btn.classList.remove('muted');
    }
  }

  renderAdOverlay(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPONSOR ADVERTISEMENT IN PROGRESS...', width / 2, height / 2 - 20);
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#55ff55';
    ctx.fillText('Game paused. Will resume immediately upon completion.', width / 2, height / 2 + 20);
    ctx.restore();
  }

  // Preload all 101 sprites extracted from APK
  preloadSprites() {
    const spriteNames = [
      'plane.png', 'plane2.png', 'warthog1.png', 'warthog2.png', 'warthogdiving1.png', 'warthogdiving2.png',
      'su25.png', 'cobra.png', 'f14.png', 'ac130.png',
      'apache.png', 'comanche.png', 'chinook.png', 'harrier.png',
      'mig1.png', 'migwarning.png', 'tank1.png', 'tank2.png', 'deadtank1.png', 'deadtank2.png', 'deadtank3.png',
      'truck.png', 'jeep.png', 'zsu57.png', 'zsu572.png', 'zsu57veteran.png', 'sam.png', 'sam1.png', 'sam2.png', 'samsite.png',
      'building.png', 'building2.png', 'bunker1.png', 'bunker2.png', 'tree.png', 'tree2.png', 'tree3.png',
      'ironbomb.png', 'clusterbomb.png', 'nukebomb.png', 'bomblet.png', 'bombupperfragment.png', 'bomblowerfragment.png',
      'bullet1.png', 'bullet2.png', 'rocket1.png', 'rocket2.png', 'rocket3.png', 'rocket4.png', 'rocket5.png', 'rocket6.png',
      'blast1.png', 'blast2.png', 'blast3.png', 'bigblast1.png', 'bigblast2.png', 'bigblast3.png', 'bigblast4.png',
      'airblast1.png', 'airblast2.png', 'airblast3.png', 'airblast4.png', 'smoke.png', 'blacksmoke.png', 'fire1.png', 'fire2.png', 'fire3.png',
      'flash.png', 'nukestem.png', 'nuketop1.png', 'nuketop2.png', 'nuketop3.png', 'nuketop4.png',
      'bonusbomb.png', 'bonuscluster.png', 'bonusnuke.png', 'bonusrocket.png', 'bonusgau8.png', 'bonusblast.png',
      'bombicon.png', 'nukeicon.png', 'gau8icon.png', 'rocketicon.png', 'scoreicon.png', 'joystick.png',
      'dropbombbutton.png', 'dropnukebutton.png', 'gau8button.png', 'rocketbutton.png', 'soundonbutton.png', 'soundoffbutton.png',
      'modeselectbuttona10.png', 'modeselectbuttonstandard.png', 'newgamebutton.png', 'continuebutton.png', 'settingsbutton.png',
      'sky.png', 'grass.png', 'gameover.png', 'instructions.png', 'screenshot.png'
    ];

    this.notifyLoadingStart();
    let loadedCount = 0;
    spriteNames.forEach((name) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= spriteNames.length) {
          this.spritesLoaded = true;
          this.notifyLoadingStop();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= spriteNames.length) {
          this.spritesLoaded = true;
          this.notifyLoadingStop();
        }
      };
      img.src = `assets/sprites/${name}`;
      this.sprites[name] = img;
    });
  }

  initCanvasClickListeners() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 1280;
      const clickY = ((e.clientY - rect.top) / rect.height) * 720;

      if (this.state === 'CODEX' && this.codex) {
        if (this.codex.handleClick(clickX, clickY)) {
          return;
        }
      }

      for (const btn of this.buttons) {
        if (
          clickX >= btn.x &&
          clickX <= btn.x + btn.w &&
          clickY >= btn.y &&
          clickY <= btn.y + btn.h
        ) {
          window.soundSystem.play('button', { volume: 0.8 });
          btn.callback();
          return;
        }
      }
    });
  }

  get cameraX() {
    return this.renderer.cameraX;
  }

  triggerScreenShake(intensity, duration) {
    this.renderer.triggerShake(intensity, duration);
  }

  triggerScreenFlash(alpha) {
    this.renderer.triggerFlash(alpha);
  }

  triggerEmpGlitch(duration = 120) {
    if (this.renderer && typeof this.renderer.triggerEmpGlitch === 'function') {
      this.renderer.triggerEmpGlitch(duration);
    }
  }

  addFloatingText(text, x, y, color) {
    this.renderer.addFloatingText(text, x, y, color);
  }

  startNewGame(model = null) {
    const chosen = model || this.armory.trialPlane || this.armory.state.selectedPlane || 'standard';
    this.armory.state.selectedPlane = chosen;
    this.armory.saveState();
    this.currentWave = 1;
    this.startWave(this.currentWave, false);
  }

  getThreatLevelInfo(wave) {
    if (wave <= 2) {
      return {
        level: 'NORMAL',
        title: 'BORDER PATROL - SOVIET ADVANCE',
        desc: 'T-55 Medium Tanks & Light Convoy Columns',
        color: '#55ff55'
      };
    } else if (wave <= 4) {
      return {
        level: 'HARD',
        title: 'ARMORED INCURSION - FRONT LINE',
        desc: 'T-72 Heavy Battle Tanks & Veteran Flak Batteries',
        color: '#ffff33'
      };
    } else if (wave <= 6) {
      return {
        level: 'VERY HARD',
        title: 'AIR DOMINANCE - HIGH INTENSITY',
        desc: 'Advanced Interceptors, Pursuit Fighters & SAM Batteries',
        color: '#ff9922'
      };
    } else if (wave <= 9) {
      return {
        level: 'EXPERT',
        title: 'RED STORM - SEVERE THREAT',
        desc: 'Su-35 & MiG-29 Dogfight Squadrons, SAM Salvos & Heavy Flak',
        color: '#ff4433'
      };
    } else {
      return {
        level: 'NIGHTMARE',
        title: 'APOCALYPSE - MAXIMUM SURVIVAL',
        desc: 'All Soviet Elite Armored Assets Deployed',
        color: '#ff1111'
      };
    }
  }

  startWave(waveNum, isNextWave = false) {
    this.currentWave = waveNum;
    this.wave = waveNum;
    this.terrain.generate(this.currentWave, this.currentTheater);
    this.weapons.reset();
    if (this.hud && this.hud.reset && (waveNum === 1 || !isNextWave)) {
      this.hud.reset();
    }

    const selectedPlane = this.armory.trialPlane || this.armory.state.selectedPlane || 'standard';
    const planeUpg = this.armory.getPlaneUpgrades(selectedPlane);
    this.entities.initPlayer(selectedPlane, planeUpg, isNextWave);

    const p = this.entities.player;

    // Automatic 100% Full Health Repair for New Wave
    p.hp = p.maxHp;

    if (isNextWave) {
      this.addFloatingText('AIRFRAME REPAIRED - 100% HEALTH!', p.x, p.y - 35, '#00ff66');
      window.soundSystem.play('beep', { volume: 0.9 });
    }

    // Reset cached theater states when starting a fresh wave
    if (this.entities) {
      this.entities.theaterStates = {};
    }

    this.entities.spawnWave(this.currentWave, this.currentTheater);
    if (this.entities.player) {
      this.entities.player.droneStrikesAvailable = Math.max(1, (this.entities.player.droneStrikesAvailable || 0) + 1);
    }
    this.migTimer = this.currentWave >= 3 ? Math.max(220, 600 - Math.min(260, this.currentWave * 28)) : 400;

    // Tactical radio briefing per wave
    if (this.currentWave === 1) {
      this.setRadioMessage('TOWER', 'TOWER: Welcome to the combat zone, Pilot! Bomb the enemy armor. Good hunting!', 280);
    } else if (this.currentWave === 2) {
      this.setRadioMessage('COMMAND', 'COMMAND: Sector 2 alert! Enemy armor & Phalanx C-RAM CIWS active! Intercepts bombs — call FPV Drone [U]!', 300);
    } else if (this.currentWave === 3) {
      this.setRadioMessage('COMMAND', 'COMMAND: Warning! SAM site active! Deploy flares with [F] if locked!', 280);
    } else if (this.currentWave >= 4 && isNextWave) {
      this.setRadioMessage('COMMAND', `COMMAND: Entering ${this.currentTheater} front! Enemy fighters airborne!`, 280);
    }

    // Wave Grace Period (3 seconds briefing & safe recon buffer)
    this.waveGraceTimer = (typeof window !== 'undefined' && window._testNoGrace) ? 0 : 180;
    this.waveClearTimer = 0;
    this.deathTimer = 0;
    this.state = 'PLAYING';
    this.notifyGameplayStart();

    window.soundSystem.startEngine();
  }

  handlePlayerDeath(cause) {
    this.notifyGameplayStop();
    this.deathTimer = 110; // ~1.8s crash explosion before transitioning to GAMEOVER

    // Pilot funny final crash reaction (International English memes)
    const crashMemes = [
      "PILOT: Trump: This was a totally rigged crash! Terrible pilot controls, very sad!",
      "PILOT: Gordon Ramsay: You absolute donut! Look what you did to this million dollar aircraft!",
      "PILOT: Arnold: I'll be back... if you hit the revive button! Eject eject eject!",
      "PILOT: Well, that did not go according to plan! Eject eject eject!"
    ];
    const pick = crashMemes[Math.floor(Math.random() * crashMemes.length)];
    this.setRadioMessage('PILOT', pick, 260);

    // Revoke single-sortie trial plane on crash
    if (this.armory && this.armory.trialPlane) {
      const expiredPlane = this.armory.trialPlane;
      this.armory.expireTrialPlane();
      this.addFloatingText(`TRIAL EXPIRED: ${expiredPlane.toUpperCase()} HAS RETURNED TO HANGAR!`, this.renderer.width / 2, 90, '#ff9933');
    }

    if (this.entities.player) {
      this.armory.state.credits += this.entities.player.credits;
      if (this.entities.player.score > this.armory.state.highScore) {
        this.armory.state.highScore = this.entities.player.score;
      }
      this.armory.saveState();
    }
  }

  openArmory() {
    this.armoryReturnState = (this.state === 'PLAYING' || this.state === 'PAUSED') ? 'PLAYING' : (this.state === 'GAMEOVER' ? 'GAMEOVER' : 'TITLE');
    if (this.state === 'PLAYING') {
      this.notifyGameplayStop();
    }
    this.state = 'ARMORY';
    window.soundSystem.stopEngine();
    window.soundSystem.stopGau8();
    if (typeof window.soundSystem.playUpgradeOpen === 'function') {
      window.soundSystem.playUpgradeOpen();
    } else {
      window.soundSystem.play('button', { volume: 0.8 });
    }

    const btnArmory = document.getElementById('btn-armory');
    if (btnArmory) {
      btnArmory.innerText = '🛩️ RESUME';
      if (btnArmory.classList) btnArmory.classList.add('active');
    }
  }

  closeArmory() {
    if (this.armoryReturnState === 'PLAYING' && this.entities.player && this.entities.player.alive) {
      this.state = 'PLAYING';
      this.notifyGameplayStart();
      window.soundSystem.startEngine();
    } else if (this.armoryReturnState === 'GAMEOVER') {
      this.state = 'GAMEOVER';
    } else {
      this.state = 'TITLE';
    }
    window.soundSystem.play('button', { volume: 0.8 });

    const btnArmory = document.getElementById('btn-armory');
    if (btnArmory) {
      btnArmory.innerText = '🎖️ ARMORY';
      if (btnArmory.classList) btnArmory.classList.remove('active');
    }
  }

  openCodex() {
    this.codexReturnState = (this.state === 'PLAYING' || this.state === 'PAUSED') ? 'PLAYING' : (this.state === 'GAMEOVER' ? 'GAMEOVER' : (this.state === 'ARMORY' ? 'ARMORY' : 'TITLE'));
    if (this.state === 'PLAYING') {
      this.notifyGameplayStop();
    }
    this.state = 'CODEX';
    window.soundSystem.stopEngine();
    window.soundSystem.stopGau8();
    if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.8 });

    const btnCodex = document.getElementById('btn-codex');
    if (btnCodex) {
      btnCodex.innerText = '🛩️ RESUME';
      if (btnCodex.classList) btnCodex.classList.add('active');
    }
  }

  closeCodex() {
    if (this.codexReturnState === 'PLAYING' && this.entities.player && this.entities.player.alive) {
      this.state = 'PLAYING';
      this.notifyGameplayStart();
      window.soundSystem.startEngine();
    } else if (this.codexReturnState === 'GAMEOVER') {
      this.state = 'GAMEOVER';
    } else if (this.codexReturnState === 'ARMORY') {
      this.state = 'ARMORY';
    } else {
      this.state = 'TITLE';
    }
    if (window.soundSystem) window.soundSystem.play('button', { volume: 0.8 });

    const btnCodex = document.getElementById('btn-codex');
    if (btnCodex) {
      btnCodex.innerText = '📖 INTEL (I)';
      if (btnCodex.classList) btnCodex.classList.remove('active');
    }
  }

  cycleTheater(target = null) {
    if (this.mapTransition && this.mapTransition.active) return;
    let nextTheater = target;
    if (!nextTheater) {
      const idx = (this.theaters.indexOf(this.currentTheater) + 1) % this.theaters.length;
      nextTheater = this.theaters[idx];
    }
    this.startTheaterTransition(nextTheater, 'MANUAL');
  }

  startTheaterTransition(targetTheater, reason = 'ALTITUDE') {
    if (this.mapTransition && this.mapTransition.active) return;
    this.mapTransition.active = true;
    this.mapTransition.timer = 0;
    this.mapTransition.maxTimer = 100;
    this.mapTransition.targetTheater = targetTheater;
    this.mapTransition.reason = reason;

    if (targetTheater === 'SIBERIA') {
      this.mapTransition.radioSpeaker = '📻 HQ STRATEGIC DISPATCH: ARCTIC THEATER';
      this.mapTransition.radioMessage = 'CROSSING URALS INTO SIBERIAN MISSILE BASE! HEAVY RADOMES & ARMORED TRAIN DETECTED!';
    } else if (targetTheater === 'DESERT') {
      this.mapTransition.radioSpeaker = '📻 HQ STRATEGIC DISPATCH: DESERT STORM';
      this.mapTransition.radioMessage = 'CROSSING RED SEA CORRIDOR: ENTERING DESERT SECTOR! WATCH FOR REFINERY FLAK & SEARCHLIGHTS!';
    } else {
      this.mapTransition.radioSpeaker = '📻 HQ STRATEGIC DISPATCH: CENTRAL FRONT';
      this.mapTransition.radioMessage = 'RETURNING TO EUROPEAN THEATER: FULDA GAP DEFENSE LINE ON HIGH ALERT!';
    }

    if (window.soundSystem) {
      window.soundSystem.play('beep', { volume: 1.0, pitch: 1.2 });
      setTimeout(() => {
        if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.9, pitch: 1.4 });
      }, 140);
    }
  }

  update() {
    this.input.update();
    const inp = this.input;

    if (this.theaterTransitionCooldown > 0) this.theaterTransitionCooldown--;

    // Key T: Cycle Mission Theater
    if (inp.consumeKeyPress('KeyT')) {
      this.cycleTheater();
    }

    // Update In-Flight Cloud Map Transition
    if (this.mapTransition && this.mapTransition.active) {
      this.mapTransition.timer++;
      const mid = Math.floor(this.mapTransition.maxTimer / 2);

      // Halfway point: switch terrain, weather, and enemies while completely covered in clouds!
      if (this.mapTransition.timer === mid) {
        const prevTheater = this.currentTheater;
        this.currentTheater = this.mapTransition.targetTheater;
        this.terrain.setMap(this.currentTheater, this.currentWave);

        // Intelligent theater switching: preserves wave targets, kill progress, and dead wrecks!
        this.entities.switchTheater(prevTheater, this.currentTheater, this.currentWave);

        // Update Top Bar Button
        const btnTheater = document.getElementById('btn-theater');
        if (btnTheater) {
          btnTheater.innerText = '🗺️ ' + (this.currentTheater === 'EUROPEAN' ? 'EUR' : (this.currentTheater === 'SIBERIA' ? 'SIB' : 'DES'));
        }

        // Dive out from clouds with boost! (Preserves existing health & ammo intact - no exploits or resets!)
        if (this.entities.player && this.entities.player.alive) {
          const p = this.entities.player;
          // Note: p.hp and ammo remain strictly preserved!
          p.y = 80;
          p.angle = 0.28;
          p.currentSpeed = p.baseSpeed * 1.35;

          this.addFloatingText(`★ TRANSFERRED TO ${this.currentTheater} THEATER ★`, p.x, p.y - 45, '#55ff55');
        }
      }

      if (this.mapTransition.timer >= this.mapTransition.maxTimer) {
        this.mapTransition.active = false;
        this.theaterTransitionCooldown = 400; // 6.5s buffer
      }

      // Cloud drift animation
      for (const c of this.clouds) {
        c.x -= c.speed * 4;
        if (c.x < -c.radius * 2) c.x = 1280 + c.radius * 2;
      }
    }

    // Global Hotkeys
    if (inp.consumeKeyPress('KeyM')) {
      if (window.soundSystem) {
        const enabled = window.soundSystem.toggleSound();
        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
          btnSound.innerText = enabled ? '🔊 SOUND: ON' : '🔇 SOUND: MUTED';
          btnSound.classList.toggle('muted', !enabled);
        }
      }
    }
    // Field Intel Codex (KeyI exclusively - KeyK is strictly reserved for Rockets!)
    if (inp.consumeKeyPress('KeyI')) {
      if (this.state === 'CODEX') {
        this.closeCodex();
      } else {
        this.openCodex();
      }
    }

    if (this.state === 'TITLE') {
      if (inp.consumeKeyPress('Space') || inp.consumeKeyPress('Enter')) {
        this.startNewGame(this.armory.state.selectedPlane || 'a10');
      } else if (inp.consumeKeyPress('KeyA')) {
        this.openArmory();
      } else if (inp.consumeKeyPress('KeyI')) {
        this.openCodex();
      } else if (inp.consumeKeyPress('KeyT')) {
        this.cycleTheater();
      }
      return;
    }

    if (this.state === 'CODEX') {
      if (inp.consumeKeyPress('Escape') || inp.consumeKeyPress('KeyI')) {
        this.closeCodex();
      } else if (inp.consumeKeyPress('ArrowDown') || inp.consumeKeyPress('KeyS')) {
        this.codex.selectNextUnit();
      } else if (inp.consumeKeyPress('ArrowUp') || inp.consumeKeyPress('KeyW')) {
        this.codex.selectPrevUnit();
      } else if (inp.consumeKeyPress('ArrowRight') || inp.consumeKeyPress('KeyD')) {
        const idx = this.codex.categories.findIndex(c => c.id === this.codex.activeCategory);
        const nextCat = this.codex.categories[(idx + 1) % this.codex.categories.length].id;
        this.codex.selectCategory(nextCat);
      } else if (inp.consumeKeyPress('ArrowLeft') || inp.consumeKeyPress('KeyA')) {
        const idx = this.codex.categories.findIndex(c => c.id === this.codex.activeCategory);
        const prevCat = this.codex.categories[(idx - 1 + this.codex.categories.length) % this.codex.categories.length].id;
        this.codex.selectCategory(prevCat);
      }
      return;
    }

    if (this.state === 'ARMORY') {
      // Hotkeys for aircraft selection / buy / rental (1 to 10: 1-9 and 0 for 10th)
      for (let k = 1; k <= 10; k++) {
        const digitCode = k === 10 ? 'Digit0' : `Digit${k}`;
        if (inp.consumeKeyPress(digitCode)) {
          const plane = this.armory.getPlaneList()[k - 1];
          if (plane) {
            this.armory.inspectingPlane = plane.id;
            if (plane.unlocked) {
              this.armory.selectPlane(plane.id);
            } else {
              if (this.armory.state.credits >= plane.cost) {
                this.armory.unlockPlane(plane.id);
              } else {
                this.armory.watchRentalAd(plane.id);
              }
            }
          }
        }
      }

      // Hotkeys for dedicated airframe upgrades (Q, W, E, R, T, Y)
      const upgKeyCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY'];
      const currentInspect = this.armory.inspectingPlane || this.armory.trialPlane || this.armory.state.selectedPlane || 'standard';
      const upgList = this.armory.getUpgradeItems(currentInspect);
      upgKeyCodes.forEach((kc, idx) => {
        if (inp.consumeKeyPress(kc) && idx < upgList.length) {
          this.armory.buyUpgrade(upgList[idx].id, currentInspect);
        }
      });

      // Tactical Supply Funds Hotkey [V]
      if (inp.consumeKeyPress('KeyV')) {
        this.armory.state.credits += 1500;
        this.armory.saveState();
        window.soundSystem.play('beep', { volume: 1.0 });
        this.addFloatingText('+$1,500 COMBAT FUNDS GRANTED!', this.renderer.width / 2, 75, '#ffff00');
        return;
      }

      if (
        inp.consumeKeyPress('Escape') ||
        inp.consumeKeyPress('KeyB') ||
        inp.consumeKeyPress('Backspace') ||
        inp.consumeKeyPress('Space') ||
        inp.consumeKeyPress('KeyA')
      ) {
        this.closeArmory();
      }
      return;
    }

    if (this.state === 'PLAYING') {
      // If player died, let the crash explosion play out before transitioning to GAMEOVER
      if (this.deathTimer > 0) {
        this.deathTimer--;
        this.weapons.update();
        this.entities.updateEnemies();
        this.renderer.update(this.entities.player);
        if (this.deathTimer <= 0) {
          // Trigger midgame ad according to 180s cooldown policy, then open GAMEOVER screen
          this.requestMidgameAd(() => {
            this.input.keysPressed = {};
            this.input.keys['Space'] = false;
            this.input.keys['Enter'] = false;
            this.state = 'GAMEOVER';
          });
        }
        return;
      }

      if (inp.isPauseTriggered() && this.entities.player && this.entities.player.alive) {
        this.notifyGameplayStop();
        this.state = 'PAUSED';
        window.soundSystem.stopEngine();
        window.soundSystem.stopGau8();
        window.soundSystem.play('button', { volume: 0.8 });
        return;
      }

      // Air Support: Assume Gunship Overwatch Control [G]
      if (inp.consumeKeyPress('KeyG')) {
        this.launchGunshipMode();
        return;
      }

      // Allied AI Wingmen Air Support [Key H]
      if (inp.consumeKeyPress('KeyH')) {
        this.requestAirSupport();
      }

      // Tactical Autonomous FPV Drone Strike [Key U / Y / Touch]
      if (inp.isDroneTriggered && inp.isDroneTriggered()) {
        this.callDroneStrike();
      }

      // Update Air Support Cooldown & Radio Timers
      if (this.wingmenCooldown > 0) {
        this.wingmenCooldown--;
        if (this.wingmenCooldown % 60 === 0) {
          this.updateAirSupportButtonUi();
        }
      }
      if (this.activeRadioMessage && this.activeRadioMessage.timer > 0) {
        this.activeRadioMessage.timer--;
      }

      // Ambient Pilot Radio Chatter (Adds realistic Cold War immersion)
      this.ambientRadioTimer--;
      if (this.ambientRadioTimer <= 0) {
        const chatterList = [
          { spk: 'TOWER', msg: 'RADAR DETECTS ENEMY PATROLS ADVANCING IN SECTOR' },
          { spk: 'AWACS OVERLORD', msg: 'AIR PICTURE CLEAR. WATCH FOR LOW-ALTITUDE SAM SITES' },
          { spk: 'VIPER 2', msg: 'LEADER, CHECK YOUR SIX! FLAK BATTERIES ACTIVE' },
          { spk: 'RED CROWN', msg: 'WEATHER IS STABLE OVER TARGET ZONE. GOOD HUNTING' },
          { spk: 'TACTICAL COMMAND', msg: 'GROUND RECON CONFIRMS STRATEGIC TARGETS AHEAD' }
        ];
        const item = chatterList[Math.floor(Math.random() * chatterList.length)];
        this.setRadioMessage(item.spk, item.msg, 240);
        if (window.soundSystem) window.soundSystem.playRadioComms('chatter');
        this.ambientRadioTimer = 1100 + Math.random() * 800; // 18 - 32s interval
      }

      if (this.waveGraceTimer > 0) this.waveGraceTimer--;

      // Update Player & Entities
      this.entities.updatePlayer(inp);
      this.entities.updateEnemies();
      this.weapons.update();
      this.hud.update();
      this.renderer.update(this.entities.player);

      // Periodic MiG Interceptor Sortie (Starts strictly at Wave 3+)
      this.migTimer--;
      if (this.migTimer <= 0) {
        if (this.currentWave >= 3) {
          this.entities.spawnMig(this.currentWave);
          const waveScale = Math.min(280, this.currentWave * 28);
          this.migTimer = Math.max(220, 650 - waveScale) + Math.random() * 140;
        } else {
          this.migTimer = 400; // Stand down on Wave 1 and 2
        }
      }

      // Check Wave Clear Condition (Seamless, continuous arcade flight, zero freeze!)
      const remainingTargets = this.entities.enemies.filter(
        (e) => this.entities.isObjectiveTarget(e)
      );

      if (remainingTargets.length === 0 && this.entities.player && this.entities.player.alive) {
        if (this.waveClearTimer <= 0) {
          // Trigger victory fanfare & credit award
          this.waveClearTimer = 160; // ~2.6 seconds celebratory flight before next wave
          this.notifyWaveCleared();
          window.soundSystem.play('beep', { volume: 1.0 });

          const waveBonus = this.currentWave * 250;
          this.entities.player.credits += waveBonus;
          this.armory.state.credits += waveBonus;
          if (this.entities.player.score > this.armory.state.highScore) {
            this.armory.state.highScore = this.entities.player.score;
          }
          this.armory.saveState();

          // Instantly restore 100% full health!
          this.entities.player.hp = this.entities.player.maxHp;
          this.addFloatingText(`★ WAVE ${this.currentWave} CLEARED! +$${waveBonus} ★`, this.entities.player.x, this.entities.player.y - 45, '#55ff55');
          this.addFloatingText('AIRFRAME REPAIRED - 100% HEALTH!', this.entities.player.x, this.entities.player.y - 25, '#00ff66');
        } else {
          this.waveClearTimer--;

          // Launch immediately on Space or Enter
          if (inp.consumeKeyPress('Space') || inp.consumeKeyPress('Enter')) {
            this.waveClearTimer = 0;
            if (this.currentWave === 2) {
              this.currentWave = 3;
              this.startTheaterTransition('SIBERIA', 'CAMPAIGN');
              return;
            } else if (this.currentWave === 4) {
              this.currentWave = 5;
              this.startTheaterTransition('DESERT', 'CAMPAIGN');
              return;
            } else if (this.currentWave === 6) {
              this.currentWave = 7;
              this.startTheaterTransition('EUROPEAN', 'CAMPAIGN');
              return;
            }
            this.startWave(this.currentWave + 1, true);
            return;
          }

          if (this.waveClearTimer <= 0) {
            if (this.currentWave === 2) {
              this.currentWave = 3;
              this.startTheaterTransition('SIBERIA', 'CAMPAIGN');
              return;
            } else if (this.currentWave === 4) {
              this.currentWave = 5;
              this.startTheaterTransition('DESERT', 'CAMPAIGN');
              return;
            } else if (this.currentWave === 6) {
              this.currentWave = 7;
              this.startTheaterTransition('EUROPEAN', 'CAMPAIGN');
              return;
            }
            this.startWave(this.currentWave + 1, true);
            return;
          }
        }
      } else {
        this.waveClearTimer = 0;
      }
      return;
    }

    if (this.state === 'PAUSED') {
      if (inp.isPauseTriggered()) {
        this.state = 'PLAYING';
        this.notifyGameplayStart();
        window.soundSystem.startEngine();
      }
      return;
    }

    if (this.state === 'WAVE_COMPLETE') {
      if (inp.consumeKeyPress('Space') || inp.consumeKeyPress('Enter')) {
        this.startWave(this.currentWave + 1, true);
      }
      if (inp.consumeKeyPress('KeyA')) {
        this.openArmory();
      }
      return;
    }

    if (this.state === 'GAMEOVER') {
      if (inp.consumeKeyPress('KeyR')) {
        this.revivePlayer();
        return;
      }
      if (inp.consumeKeyPress('Space') || inp.consumeKeyPress('Enter')) {
        this.startNewGame(this.armory.state.selectedPlane);
        return;
      }
      if (inp.consumeKeyPress('KeyA')) {
        this.openArmory();
        return;
      }
      return;
    }
  }

  render() {
    const ctx = this.renderer.ctx;
    const width = this.renderer.width;
    const height = this.renderer.height;
    this.buttons = []; // Re-register button rects per frame

    if (this.state === 'PLAYING') {
      if (!this.entities.player) {
        this.state = 'TITLE';
        return;
      }

      this.renderer.render(this);

      // Tactical Combat Briefing & Threat Alert Banner
      if (this.waveGraceTimer > 0) {
        ctx.save();
        const threat = this.getThreatLevelInfo(this.currentWave);
        const bannerW = 680;
        const bannerH = 68;
        const bannerX = width / 2 - bannerW / 2;
        const bannerY = 56;

        ctx.fillStyle = 'rgba(8, 20, 14, 0.94)';
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeStyle = threat.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

        // Header: Threat Level & Wave
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = threat.color;
        ctx.fillText(`★ COMBAT SORTIE • WAVE ${this.currentWave} [${threat.level}] ★`, width / 2, bannerY + 22);

        // Subtitle & Intelligence
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(threat.title, width / 2, bannerY + 42);

        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#99ccaa';
        ctx.fillText(`INTEL: ${threat.desc}`, width / 2, bannerY + 58);
        ctx.restore();
      }

      // Victory Banner during Seamless Wave Transition (Continuous flight, zero freeze!)
      if (this.waveClearTimer > 0) {
        ctx.save();
        const vW = 680;
        const vH = 72;
        const vX = width / 2 - vW / 2;
        const vY = 56;

        ctx.fillStyle = 'rgba(8, 30, 16, 0.95)';
        ctx.fillRect(vX, vY, vW, vH);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(vX, vY, vW, vH);

        this.buttons.push({
          x: vX,
          y: vY,
          w: vW,
          h: vH,
          callback: () => this.startWave(this.currentWave + 1, true)
        });

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
        ctx.fillStyle = '#55ff55';
        ctx.fillText(`★ SECTOR SECURED • WAVE ${this.currentWave} CLEARED! ★`, width / 2, vY + 24);

        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffff33';
        const countdownSec = Math.ceil(this.waveClearTimer / 60);
        ctx.fillText(`AIRFRAME 100% REPAIRED  |  NEXT WAVE IN ${countdownSec}s... [CLICK OR PRESS SPACE]`, width / 2, vY + 50);
        ctx.restore();
      }
    } else if (this.state === 'TITLE') {
      this.renderTitleScreen(ctx, width, height);
    } else if (this.state === 'ARMORY') {
      this.renderArmoryScreen(ctx, width, height);
    } else if (this.state === 'CODEX') {
      this.codex.render(ctx, width, height);
    } else if (this.state === 'PAUSED') {
      this.renderer.render(this);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#55ff55';
      ctx.textAlign = 'center';
      ctx.fillText('SORTIE PAUSED', width / 2, height / 2 - 40);
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRESS [P] OR [ESC] TO RESUME', width / 2, height / 2 + 10);
    } else if (this.state === 'WAVE_COMPLETE') {
      this.renderer.render(this);
      const nextThreat = this.getThreatLevelInfo(this.currentWave + 1);

      ctx.fillStyle = 'rgba(10, 25, 15, 0.94)';
      ctx.fillRect(width / 2 - 340, height / 2 - 170, 680, 340);
      ctx.strokeStyle = '#55ff55';
      ctx.lineWidth = 3;
      ctx.strokeRect(width / 2 - 340, height / 2 - 170, 680, 340);

      ctx.textAlign = 'center';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
      ctx.fillStyle = '#55ff55';
      ctx.fillText(`WAVE ${this.currentWave} SECURED!`, width / 2, height / 2 - 100);

      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SECTOR CLEARED • SOVIET ADVANCE REPELLED`, width / 2, height / 2 - 65);

      ctx.fillStyle = '#ffff00';
      ctx.fillText(`SORTIE REWARD: +$${this.currentWave * 250} COMBAT CREDITS`, width / 2, height / 2 - 30);

      // Warning about incoming wave threat
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = nextThreat.color;
      ctx.fillText(`NEXT THREAT LEVEL: ${nextThreat.level} • ${nextThreat.title}`, width / 2, height / 2 + 12);

      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#88bba0';
      ctx.fillText(`INTELLIGENCE: ${nextThreat.desc}`, width / 2, height / 2 + 32);

      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#00ff66';
      ctx.fillText('AIRFRAME RESTORED - 100% HEALTH REPAIRED FOR NEXT WAVE!', width / 2, height / 2 + 55);

      // 1. Next Sortie Clickable Button
      const bW = 240;
      const bH = 46;
      const bY = height / 2 + 85;
      const btn1X = width / 2 - bW - 15;
      const btn2X = width / 2 + 15;

      ctx.fillStyle = 'rgba(18, 48, 26, 0.95)';
      ctx.fillRect(btn1X, bY, bW, bH);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btn1X, bY, bW, bH);

      this.buttons.push({
        x: btn1X,
        y: bY,
        w: bW,
        h: bH,
        callback: () => this.startWave(this.currentWave + 1, true)
      });

      ctx.textAlign = 'center';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LAUNCH NEXT SORTIE [SPACE]', btn1X + bW / 2, bY + bH / 2);

      // 2. Visit Hangar Clickable Button
      ctx.fillStyle = 'rgba(25, 35, 55, 0.95)';
      ctx.fillRect(btn2X, bY, bW, bH);
      ctx.strokeStyle = '#66ccff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btn2X, bY, bW, bH);

      this.buttons.push({
        x: btn2X,
        y: bY,
        w: bW,
        h: bH,
        callback: () => this.openArmory()
      });

      ctx.fillStyle = '#ffffff';
      ctx.fillText('ARMORY / HANGAR [A]', btn2X + bW / 2, bY + bH / 2);
    } else if (this.state === 'GAMEOVER') {
      this.renderGameOverScreen(ctx, width, height);
    }

    // Render Multi-Theater Cloud Transition overlay over all states!
    if (this.mapTransition && this.mapTransition.active) {
      this.renderTheaterTransition(ctx, width, height);
    }
  }

  renderTheaterTransition(ctx, width, height) {
    const t = this.mapTransition;
    if (!t || !t.active) return;

    ctx.save();
    const progress = t.timer / t.maxTimer; // 0.0 to 1.0
    // Alpha bell-curve peaking at 1.0 halfway through
    const alpha = Math.min(1.0, Math.sin(progress * Math.PI) * 1.35);

    // 1. Procedural volumetric cloud bank
    for (const c of this.clouds) {
      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.1, c.x, c.y, c.radius);
      grad.addColorStop(0, `rgba(240, 245, 255, ${alpha * 0.95})`);
      grad.addColorStop(0.5, `rgba(210, 225, 245, ${alpha * 0.75})`);
      grad.addColorStop(1, 'rgba(180, 200, 230, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Fullscreen soft atmospheric haze veil
    ctx.fillStyle = `rgba(215, 230, 250, ${alpha * 0.85})`;
    ctx.fillRect(0, 0, width, height);

    // 3. Center Strategic Radio Dispatch Box
    if (alpha > 0.35) {
      const boxW = Math.min(780, width - 40);
      const boxH = 110;
      const boxX = (width - boxW) / 2;
      const boxY = (height - boxH) / 2;

      // Dark tactical military glass
      ctx.fillStyle = `rgba(12, 18, 24, ${alpha * 0.94})`;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Border color customized per target theater
      let pulseColor = '#00ff66';
      if (t.targetTheater === 'SIBERIA') pulseColor = '#00e5ff';
      else if (t.targetTheater === 'DESERT') pulseColor = '#ffaa00';

      ctx.strokeStyle = pulseColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Corner accent brackets
      const bLen = 14;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(boxX, boxY + bLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + bLen, boxY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW - bLen, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + bLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - bLen); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + bLen, boxY + boxH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW - bLen, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - bLen); ctx.stroke();

      // Speaker Header
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = pulseColor;
      ctx.fillText(t.radioSpeaker || '📻 HQ STRATEGIC DISPATCH', width / 2, boxY + 28);

      // Animated Frequency / Status indicator
      ctx.font = '11px monospace';
      ctx.fillStyle = '#88aacc';
      const freq = (142.85 + Math.sin(t.timer * 0.2) * 0.05).toFixed(2);
      ctx.fillText(`FREQ: ${freq} MHz • SATELLITE SECURE LINK • [TRANSMITTING]`, width / 2, boxY + 46);

      // Message text
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.radioMessage, width / 2, boxY + 78);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  /**
   * Title Screen matching authentic APK assets:
   * Uses modeselectbuttonstandard.png and modeselectbuttona10.png
   */
  renderTitleScreen(ctx, width, height) {
    ctx.save();
    this.renderer.drawSky(ctx, this.sprites['sky.png']);

    // Soft dark military backdrop
    ctx.fillStyle = 'rgba(8, 16, 12, 0.82)';
    ctx.fillRect(0, 0, width, height);

    // 1. Tactical CRT Radar Station (Upper-Left from Gunship Battle Command Dossier)
    const radarX = 76;
    const radarY = 82;
    const radarR = 48;
    ctx.save();
    ctx.fillStyle = '#0a140d';
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#274e30';
    ctx.lineWidth = 2;
    ctx.stroke();

    const radarGrad = ctx.createRadialGradient(radarX, radarY, 0, radarX, radarY, radarR);
    radarGrad.addColorStop(0, '#042410');
    radarGrad.addColorStop(1, '#021208');
    ctx.fillStyle = radarGrad;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(40, 180, 80, 0.35)';
    ctx.lineWidth = 1;
    [16, 32, 46].forEach(r => {
      ctx.beginPath();
      ctx.arc(radarX, radarY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(radarX - radarR, radarY); ctx.lineTo(radarX + radarR, radarY);
    ctx.moveTo(radarX, radarY - radarR); ctx.lineTo(radarX, radarY + radarR);
    ctx.stroke();

    const sweepAngle = (Date.now() * 0.0022) % (Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR, sweepAngle - 0.5, sweepAngle);
    ctx.lineTo(radarX, radarY);
    ctx.fillStyle = 'rgba(0, 255, 100, 0.18)';
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(radarX, radarY);
    ctx.lineTo(radarX + Math.cos(sweepAngle) * radarR, radarY + Math.sin(sweepAngle) * radarR);
    ctx.stroke();

    const tTime = Date.now() * 0.003;
    ctx.fillStyle = '#ff3333'; // Mi-24 / MiG
    ctx.beginPath();
    ctx.arc(radarX + 22, radarY - 14, 2.5 + Math.sin(tTime) * 0.8, 0, Math.PI * 2);
    ctx.arc(radarX - 26, radarY + 18, 2.2 + Math.cos(tTime) * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffff00'; // MLRS / Shilka
    ctx.beginPath();
    ctx.arc(radarX + 14, radarY + 28, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00ff88'; // NATO Base
    ctx.beginPath();
    ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#55ff77';
    ctx.textAlign = 'center';
    ctx.fillText('AN/APQ-120 RADAR', radarX, radarY + radarR + 14);
    ctx.restore();

    // 2. DEFCON 1 Readiness & Classified Mission Badge (Upper-Right)
    const defconX = width - 130;
    const defconY = 54;
    const defconW = 190;
    const defconH = 56;
    ctx.save();
    ctx.fillStyle = 'rgba(28, 12, 12, 0.9)';
    ctx.fillRect(defconX - defconW / 2, defconY, defconW, defconH);
    ctx.strokeStyle = (Math.floor(Date.now() / 450) % 2 === 0) ? '#ff2222' : '#ff8800';
    ctx.lineWidth = 2;
    ctx.strokeRect(defconX - defconW / 2, defconY, defconW, defconH);

    ctx.textAlign = 'center';
    ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ff3333';
    ctx.fillText('⚡ DEFCON 1: MAXIMUM ⚡', defconX, defconY + 18);
    ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffaa33';
    ctx.fillText('WARSAW PACT AIR ALERT', defconX, defconY + 33);
    ctx.fillStyle = '#88aacc';
    ctx.fillText('SECTOR: 48°12\'N 16°22\'E', defconX, defconY + 46);
    ctx.restore();

    // Center Title Banner
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff1100';
    ctx.shadowBlur = 12;
    ctx.fillText('ATOMIC STRIKE: COLD WAR', width / 2, 75);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#ffff44';
    ctx.fillText('EUROPE 1970 • NATO GROUND-ATTACK FIGHTER SORTIE', width / 2, 108);

    // High Score & Credits Pill Bar
    const pillW = 460;
    const pillH = 24;
    ctx.fillStyle = 'rgba(15, 30, 20, 0.85)';
    ctx.fillRect(width / 2 - pillW / 2, 126, pillW, pillH);
    ctx.strokeStyle = '#2d6638';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - pillW / 2, 126, pillW, pillH);

    ctx.font = 'bold 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#55ff55';
    ctx.fillText(`★ HIGH SCORE: ${this.armory.state.highScore}   |   🎖️ SAVED CREDITS: $${this.armory.state.credits} ★`, width / 2, 138);

    // Current Selected Aircraft Info & Technical Dossier Spotlight
    const curPlaneId = this.armory.state.selectedPlane || 'a10';
    const curPlaneObj = this.armory.getPlaneList().find(p => p.id === curPlaneId) || { name: 'A-10 WARTHOG', role: 'Close Air Support' };
    const pRole = curPlaneObj.role || (curPlaneObj.isHelicopter ? 'Heavy Attack Gunship' : 'Ground-Attack Interceptor');
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#66d3ff';
    ctx.fillText(`DEPLOYED SQUADRON FLAGSHIP: [ ${curPlaneObj.name} ] • ${pRole.toUpperCase()}`, width / 2, 172);

    // === DUAL TACTICAL LAUNCH COMMAND BUTTONS ===
    // 1. Left Button: 2D Cold War Fighter Sortie
    const btnW = 390;
    const btnH = 72;
    const btnX = width / 2 - 405;
    const btnY = 202;

    ctx.fillStyle = 'rgba(18, 42, 26, 0.95)';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#2d6638';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX + 3, btnY + 3, btnW - 6, btnH - 6);

    this.buttons.push({
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      callback: () => this.startNewGame(curPlaneId)
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText('🛩️ 2D COLD WAR AIR SORTIE', btnX + btnW / 2, btnY + 26);

    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#ffff44';
    ctx.fillText('TACTICAL BOMBING RUN [SPACE / CLICK]', btnX + btnW / 2, btnY + 50);

    // 2. Right Button: Multi-Theater Mission Selector (Europe -> Siberia -> Desert)
    const mapBtnW = 390;
    const mapBtnH = 72;
    const mapBtnX = width / 2 + 15;
    const mapBtnY = 202;

    let mapColor = '#00ff66';
    let mapTitle = '🌲 THEATER: EUROPE (FOREST)';
    let mapSub = 'ROLLING HILLS & FLAK BATTERIES [T / CLICK]';
    if (this.currentTheater === 'SIBERIA') {
      mapColor = '#00e5ff';
      mapTitle = '❄️ THEATER: SIBERIA (SNOW & ICE)';
      mapSub = 'MISSILE SILOS & ARMORED TRAIN [T / CLICK]';
    } else if (this.currentTheater === 'DESERT') {
      mapColor = '#ffaa00';
      mapTitle = '🏜️ THEATER: DESERT OILFIELDS';
      mapSub = 'BURNING REFINERIES & SEARCHLIGHTS [T / CLICK]';
    }

    ctx.fillStyle = 'rgba(20, 32, 42, 0.95)';
    ctx.fillRect(mapBtnX, mapBtnY, mapBtnW, mapBtnH);
    ctx.strokeStyle = mapColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(mapBtnX, mapBtnY, mapBtnW, mapBtnH);

    this.buttons.push({
      x: mapBtnX,
      y: mapBtnY,
      w: mapBtnW,
      h: mapBtnH,
      callback: () => this.cycleTheater()
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(mapTitle, mapBtnX + mapBtnW / 2, mapBtnY + 22);

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = mapColor;
    ctx.fillText(mapSub, mapBtnX + mapBtnW / 2, mapBtnY + 42);

    ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('🌊 PACIFIC TRIDENT (OCEAN WARFARE): COMING SOON', mapBtnX + mapBtnW / 2, mapBtnY + 60);

    // === TACTICAL ARMORY & FIELD INTEL BUTTONS ===
    const bW = 280;
    const bH = 42;
    const gap = 16;
    const totalW = bW * 2 + gap;
    const armBtnX = width / 2 - totalW / 2;
    const codexBtnX = armBtnX + bW + gap;
    const armBtnY = 292;

    // 1. Armory Button
    ctx.fillStyle = 'rgba(25, 45, 30, 0.9)';
    ctx.fillRect(armBtnX, armBtnY, bW, bH);
    ctx.strokeStyle = '#3d7745';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(armBtnX, armBtnY, bW, bH);

    this.buttons.push({
      x: armBtnX,
      y: armBtnY,
      w: bW,
      h: bH,
      callback: () => this.openArmory()
    });

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#55ff55';
    ctx.textAlign = 'center';
    ctx.fillText(`[A] 🎖️ ARMORY ($${this.armory.state.credits})`, armBtnX + bW / 2, armBtnY + 26);

    // 2. Know Your Enemy Codex Button
    ctx.fillStyle = 'rgba(15, 38, 25, 0.95)';
    ctx.fillRect(codexBtnX, armBtnY, bW, bH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(codexBtnX, armBtnY, bW, bH);

    this.buttons.push({
      x: codexBtnX,
      y: armBtnY,
      w: bW,
      h: bH,
      callback: () => this.openCodex()
    });

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`[I] 📖 KNOW YOUR ENEMY (INTEL)`, codexBtnX + bW / 2, armBtnY + 26);

    // === VISUAL GRAPHIC ACTION CARDS (Simple, Intuitive, No Walls of Text) ===
    const cardsBoxX = width / 2 - 450;
    const cardsBoxY = 352;
    const cardsBoxW = 900;
    const cardsBoxH = 245;

    ctx.fillStyle = 'rgba(10, 20, 15, 0.94)';
    ctx.fillRect(cardsBoxX, cardsBoxY, cardsBoxW, cardsBoxH);
    ctx.strokeStyle = '#2d6638';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cardsBoxX, cardsBoxY, cardsBoxW, cardsBoxH);

    const cards = [
      {
        icon: this.sprites['warthog1.png'],
        key: '[W / S] • [A / D]',
        title: 'FLIGHT & HOVER',
        desc: 'Climb / Dive • Airbrake / Hover',
        col: '#55ff55'
      },
      {
        icon: this.sprites['ironbomb.png'],
        key: '[SPACE] or [B]',
        title: 'HEAVY IRON BOMBS',
        desc: 'Precision Kinetic Ground Strike',
        col: '#ffffff'
      },
      {
        icon: this.sprites['gau8icon.png'],
        key: '[J] or [LEFT-CLICK]',
        title: '30mm GATLING GUN',
        desc: 'Depleted Uranium AP Rounds',
        col: '#ffff00'
      },
      {
        icon: this.sprites['rocket1.png'],
        key: '[K] or [RIGHT-CLICK]',
        title: 'HYDRA 70 ROCKETS',
        desc: 'High-Velocity Salvo Barrage',
        col: '#66ff66'
      },
      {
        icon: this.sprites['rocket1.png'],
        key: '[L] HELLFIRE • [V] NAPALM',
        title: 'PRECISION & FIRESTORM',
        desc: 'Laser-Homing & Napalm Carpet',
        col: '#ff9900'
      },
      {
        icon: this.sprites['nukeicon.png'],
        key: '[C] CLUSTER • [N] NUKE',
        title: 'TACTICAL DEVASTATION',
        desc: 'Carpet Bombs & Atomic Strike',
        col: '#ff4444'
      }
    ];

    const cardW = 280;
    const cardH = 100;

    cards.forEach((c, idx) => {
      const colIdx = idx % 3;
      const rowIdx = Math.floor(idx / 3);
      const cx = cardsBoxX + 15 + colIdx * (cardW + 15);
      const cy = cardsBoxY + 16 + rowIdx * (cardH + 14);

      // Card Body
      ctx.fillStyle = 'rgba(16, 34, 24, 0.9)';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = '#32663c';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Icon on left
      const iconCenterX = cx + 32;
      const iconCenterY = cy + 50;

      if (c.icon && c.icon.complete) {
        ctx.drawImage(c.icon, iconCenterX - 16, iconCenterY - 16, 32, 32);
      }

      // Key Badge
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = c.col;
      ctx.fillText(c.key, cx + 64, cy + 18);

      // Title
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(c.title, cx + 64, cy + 38);

      // Short Desc
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#88aa99';
      ctx.fillText(c.desc, cx + 64, cy + 62);
    });

    // Launch action footer
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('PRESS [SPACE] OR CLICK BUTTON TO SCRAMBLE  •  [A] OPEN ARMORY', width / 2, 642);

    ctx.restore();
  }

  /**
   * Game Over Screen matching original_gameover.png from APK:
   * Uses gameover.png as full background card, with newgamebutton.png
   */
  renderGameOverScreen(ctx, width, height) {
    this.renderer.render(this);

    // Semi-transparent backdrop blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    // Draw authentic gameover.png as center card
    const goSprite = this.sprites['gameover.png'];
    const cardW = 680;
    const cardH = 400;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2;

    if (goSprite && goSprite.complete) {
      ctx.drawImage(goSprite, cardX, cardY, cardW, cardH);
      // Clean border around card
      ctx.strokeStyle = '#225588';
      ctx.lineWidth = 3;
      ctx.strokeRect(cardX, cardY, cardW, cardH);
    } else {
      ctx.fillStyle = '#102030';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Game Over', width / 2, cardY + 50);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SORTIE TERMINATED AT WAVE ${this.currentWave}`, width / 2, cardY + 95);

    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`SORTIE SCORE: ${this.entities.player ? this.entities.player.score : 0}`, width / 2, cardY + 130);
    ctx.fillStyle = '#55ff55';
    ctx.fillText(`CREDITS SAVED TO ACCOUNT: $${this.armory.state.credits}`, width / 2, cardY + 160);

    // Second Chance: Emergency Tactical Revive (Free in GitHub / Web Edition)
    const revW = 460;
    const revH = 46;
    const revX = width / 2 - revW / 2;
    const revY = cardY + 185;

    ctx.fillStyle = 'rgba(16, 54, 25, 0.96)';
    ctx.fillRect(revX, revY, revW, revH);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(revX, revY, revW, revH);

    this.buttons.push({
      x: revX,
      y: revY,
      w: revW,
      h: revH,
      callback: () => {
        this.revivePlayer();
      }
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚡ EMERGENCY FIELD REVIVE & CONTINUE SORTIE [R]', width / 2, revY + 18);

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#77ff99';
    ctx.fillText('+100% Armor Repair • Full Ammo Restock • 3s Shield', width / 2, revY + 34);

    // Render original APK Buttons:
    // 1. newgamebutton.png
    // 2. continuebutton.png
    const newGameBtn = this.sprites['newgamebutton.png'];
    const continueBtn = this.sprites['continuebutton.png'];
    const btnY = cardY + 250;

    if (newGameBtn && newGameBtn.complete) {
      const bx = width / 2 - 160;
      ctx.drawImage(newGameBtn, bx, btnY, 110, 65);
      this.buttons.push({
        x: bx,
        y: btnY,
        w: 110,
        h: 65,
        callback: () => this.startNewGame(this.armory.state.selectedPlane)
      });
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('[SPACE / ENTER]', bx + 55, btnY + 80);
    }

    if (continueBtn && continueBtn.complete) {
      const bx = width / 2 + 50;
      ctx.drawImage(continueBtn, bx, btnY, 110, 65);
      this.buttons.push({
        x: bx,
        y: btnY,
        w: 110,
        h: 65,
        callback: () => this.openArmory()
      });
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#66ff66';
      ctx.fillText('[ARMORY / A]', bx + 55, btnY + 80);
    }
  }

  renderArmoryScreen(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#060f09';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif';
    ctx.fillStyle = '#55ff55';
    ctx.fillText('NATO TACTICAL ARMORY & SQUADRON HANGAR', width / 2, 40);

    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`AVAILABLE MILITARY COMBAT CREDITS: $${this.armory.state.credits}`, width / 2, 70);

    // Top-Right Enemy Codex Navigation Button
    const codexBtnX = width - 225;
    const codexBtnY = 16;
    const codexBtnW = 205;
    const codexBtnH = 34;
    this.buttons.push({
      x: codexBtnX,
      y: codexBtnY,
      w: codexBtnW,
      h: codexBtnH,
      callback: () => {
        this.openCodex();
      }
    });
    ctx.fillStyle = 'rgba(16, 48, 28, 0.95)';
    ctx.fillRect(codexBtnX, codexBtnY, codexBtnW, codexBtnH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(codexBtnX, codexBtnY, codexBtnW, codexBtnH);
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';
    ctx.fillText('📖 ENEMY INTEL CODEX [I]', codexBtnX + codexBtnW / 2, codexBtnY + 22);

    // 1. Aircraft Hangar Cards (6 Distinct Flyable Combat Planes)
    const planes = this.armory.getPlaneList();
    const planeCardW = Math.min(195, Math.floor((width - 40 - (planes.length - 1) * 8) / planes.length));
    const cardH = 190;
    const gap = 8;
    const startX = (width - (planeCardW * planes.length + (planes.length - 1) * gap)) / 2;

    planes.forEach((p, idx) => {
      const cx = startX + idx * (planeCardW + gap);
      const cy = 88;
      const isSelected = (this.armory.state.selectedPlane === p.id) && !p.isTrial;
      const isTrial = p.isTrial;
      const isPermanentlyUnlocked = this.armory.isPlanePermanentlyUnlocked(p.id);
      const isInspected = (this.armory.inspectingPlane === p.id);

      // Register Click on top card area to inspect upgrade tree
      this.buttons.push({
        x: cx,
        y: cy,
        w: planeCardW,
        h: 115,
        callback: () => {
          this.armory.inspectingPlane = p.id;
          if (this.armory.isPlanePermanentlyUnlocked(p.id) || p.isTrial) {
            this.armory.selectPlane(p.id);
          }
          window.soundSystem.play('beep', { volume: 0.6 });
        }
      });

      // Card Background
      ctx.fillStyle = isSelected ? 'rgba(22, 50, 32, 0.96)' : (isTrial ? 'rgba(15, 35, 52, 0.96)' : (isInspected ? 'rgba(18, 38, 48, 0.94)' : 'rgba(12, 25, 18, 0.88)'));
      ctx.fillRect(cx, cy, planeCardW, cardH);
      ctx.strokeStyle = isSelected ? '#ffff00' : (isInspected ? '#00e5ff' : (isTrial ? '#33ccff' : (isPermanentlyUnlocked ? '#44cc55' : '#444444')));
      ctx.lineWidth = isSelected ? 3 : (isInspected ? 2.5 : (isTrial ? 2.5 : 1.5));
      ctx.strokeRect(cx, cy, planeCardW, cardH);

      // Aircraft Name & Role
      ctx.textAlign = 'center';
      ctx.font = 'bold ' + (planes.length > 6 ? '10px' : '12.5px') + ' -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isSelected ? '#ffff00' : (isInspected ? '#00e5ff' : (isTrial ? '#33ccff' : '#ffffff'));
      ctx.fillText(p.name, cx + planeCardW / 2, cy + 20);

      ctx.font = 'bold ' + (planes.length > 6 ? '8px' : '9px') + ' -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#88bba0';
      ctx.fillText(p.tag, cx + planeCardW / 2, cy + 35);

      // Aircraft Graphic Preview (Crisp Pixel Art)
      const sprite = this.sprites[p.spriteName];
      const previewY = cy + 68;
      if (sprite && sprite.complete) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const scale = planes.length > 6 ? 2.2 : 2.6;
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;
        ctx.drawImage(sprite, cx + planeCardW / 2 - sw / 2, previewY - sh / 2, sw, sh);

        // Animated Rotor Blade for AH-1 Cobra
        if (p.id === 'cobra') {
          ctx.strokeStyle = 'rgba(200, 225, 255, 0.75)';
          ctx.lineWidth = 1.6;
          const rotorW = 30 * Math.sin(Date.now() * 0.05);
          ctx.beginPath();
          ctx.moveTo(cx + planeCardW / 2 - rotorW, previewY - sh / 2 - 2);
          ctx.lineTo(cx + planeCardW / 2 + rotorW, previewY - sh / 2 - 2);
          ctx.stroke();
        }

        // Animated Afterburners for F-14 Tomcat
        if (p.id === 'f14') {
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#0088ff';
          ctx.shadowBlur = 6;
          const abLen = 6 + Math.abs(Math.sin(Date.now() * 0.04)) * 6;
          ctx.fillRect(cx + planeCardW / 2 - sw / 2 - abLen, previewY - 3, abLen, 2);
          ctx.fillRect(cx + planeCardW / 2 - sw / 2 - abLen, previewY + 1, abLen, 2);
          ctx.shadowBlur = 0;
        }

        // Animated Turboprops for AC-130 Spectre Gunship
        if (p.id === 'ac130') {
          ctx.strokeStyle = 'rgba(200, 220, 240, 0.65)';
          ctx.lineWidth = 1.2;
          const propH = 6 * Math.sin(Date.now() * 0.06);
          ctx.beginPath();
          ctx.moveTo(cx + planeCardW / 2 - 16, previewY - propH);
          ctx.lineTo(cx + planeCardW / 2 - 16, previewY + propH);
          ctx.moveTo(cx + planeCardW / 2 + 12, previewY - propH);
          ctx.lineTo(cx + planeCardW / 2 + 12, previewY + propH);
          ctx.stroke();
        }

        // Animated 4-Blade Rotor for AH-64 Apache
        if (p.id === 'apache') {
          ctx.strokeStyle = 'rgba(215, 235, 255, 0.85)';
          ctx.lineWidth = 1.8;
          const rotorW = 32 * Math.sin(Date.now() * 0.06);
          ctx.beginPath();
          ctx.moveTo(cx + planeCardW / 2 - rotorW, previewY - sh / 2 - 2);
          ctx.lineTo(cx + planeCardW / 2 + rotorW, previewY - sh / 2 - 2);
          ctx.stroke();
        }

        // Animated Stealth Rotor for RAH-66 Comanche
        if (p.id === 'comanche') {
          ctx.strokeStyle = 'rgba(180, 220, 255, 0.75)';
          ctx.lineWidth = 1.5;
          const rotorW = 28 * Math.sin(Date.now() * 0.065);
          ctx.beginPath();
          ctx.moveTo(cx + planeCardW / 2 - rotorW, previewY - sh / 2 - 2);
          ctx.lineTo(cx + planeCardW / 2 + rotorW, previewY - sh / 2 - 2);
          ctx.stroke();
        }

        // Animated Dual Tandem Rotors for CH-47 Chinook
        if (p.id === 'chinook') {
          ctx.strokeStyle = 'rgba(220, 235, 255, 0.85)';
          ctx.lineWidth = 1.8;
          const fR = 24 * Math.sin(Date.now() * 0.055);
          const rR = 24 * Math.cos(Date.now() * 0.055);
          ctx.beginPath();
          ctx.moveTo(cx + planeCardW / 2 + 16 - fR, previewY - sh / 2 - 2);
          ctx.lineTo(cx + planeCardW / 2 + 16 + fR, previewY - sh / 2 - 2);
          ctx.moveTo(cx + planeCardW / 2 - 16 - rR, previewY - sh / 2 - 3);
          ctx.lineTo(cx + planeCardW / 2 - 16 + rR, previewY - sh / 2 - 3);
          ctx.stroke();
        }

        // Animated Vector Nozzles for AV-8B Harrier II
        if (p.id === 'harrier') {
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 6;
          const abLen = 5 + Math.abs(Math.sin(Date.now() * 0.05)) * 5;
          ctx.fillRect(cx + planeCardW / 2 - sw / 2 - abLen, previewY - 2, abLen, 3);
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      // Stat Indicators Bar
      ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isInspected ? '#88ffff' : '#99ccaa';
      ctx.textAlign = 'center';
      const stats = p.stats || { armor: 100, speed: 70, firepower: 80 };
      ctx.fillText(`ARM: ${stats.armor}  •  SPD: ${stats.speed}%  •  PWR: ${stats.firepower}%`, cx + planeCardW / 2, cy + 106);

      // Action Buttons at Bottom of Card
      const btnW = planeCardW - 14;
      const btnX = cx + 8;

      if (isSelected) {
        // Active Permanent Squadron Fighter
        const bY = cy + 120;
        const bH = 58;
        ctx.fillStyle = 'rgba(65, 55, 12, 0.95)';
        ctx.fillRect(btnX, bY, btnW, bH);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, bY, btnW, bH);

        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('★ ACTIVE SQUADRON FIGHTER ★', cx + planeCardW / 2, bY + 22);
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffaa';
        ctx.fillText('READY FOR COMBAT SORTIE', cx + planeCardW / 2, bY + 41);
      } else if (isTrial) {
        // Active 1-Sortie Trial Rental
        const bY = cy + 120;
        const bH = 58;
        ctx.fillStyle = 'rgba(15, 45, 65, 0.95)';
        ctx.fillRect(btnX, bY, btnW, bH);
        ctx.strokeStyle = '#33ccff';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, bY, btnW, bH);

        this.buttons.push({
          x: btnX,
          y: bY,
          w: btnW,
          h: bH,
          callback: () => {
            this.armory.inspectingPlane = p.id;
            this.armory.selectPlane(p.id);
          }
        });

        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#33ccff';
        ctx.fillText('★ 1-SORTIE TRIAL ACTIVE ★', cx + planeCardW / 2, bY + 22);
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#aaddff';
        ctx.fillText('CLICK TO FLY / INSPECT', cx + planeCardW / 2, bY + 41);
      } else if (isPermanentlyUnlocked) {
        // Unlocked, Click to Select
        const bY = cy + 120;
        const bH = 58;
        ctx.fillStyle = 'rgba(18, 48, 25, 0.95)';
        ctx.fillRect(btnX, bY, btnW, bH);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, bY, btnW, bH);

        this.buttons.push({
          x: btnX,
          y: bY,
          w: btnW,
          h: bH,
          callback: () => {
            this.armory.inspectingPlane = p.id;
            this.armory.selectPlane(p.id);
          }
        });

        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#55ff55';
        const keyLabel = idx === 9 ? '0' : `${idx + 1}`;
        ctx.fillText(`SELECT [KEY ${keyLabel}]`, cx + planeCardW / 2, bY + 22);
        ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#88ddaa';
        ctx.fillText('UNLOCKED', cx + planeCardW / 2, bY + 41);
      } else {
        // Locked: Option 1 (Permanent Buy with Credits) & Option 2 (1-Sortie Trial with 2 Ads)
        const b1Y = cy + 118;
        const b1H = 28;
        const canAfford = this.armory.state.credits >= p.cost;

        ctx.fillStyle = canAfford ? 'rgba(55, 50, 15, 0.95)' : 'rgba(38, 18, 18, 0.9)';
        ctx.fillRect(btnX, b1Y, btnW, b1H);
        ctx.strokeStyle = canAfford ? '#ffff00' : '#ff4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, b1Y, btnW, b1H);

        this.buttons.push({
          x: btnX,
          y: b1Y,
          w: btnW,
          h: b1H,
          callback: () => {
            this.armory.inspectingPlane = p.id;
            this.armory.unlockPlane(p.id);
          }
        });

        ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = canAfford ? '#ffff00' : '#ff7777';
        const buyKey = idx === 9 ? '0' : `${idx + 1}`;
        ctx.fillText(
          canAfford ? `★ BUY: $${p.cost} [${buyKey}]` : `UNLOCK: $${p.cost}`,
          cx + planeCardW / 2,
          b1Y + 18
        );

        // Option 2: 1-Ad Instant Test Sortie (or Credit Test Flight Permit)
        const b2Y = cy + 150;
        const b2H = 28;
        const rental = this.armory.getRentalStatus(p.id);

        if (rental.onCooldown && this.armory.state.credits < rental.rentalFee) {
          ctx.fillStyle = 'rgba(25, 25, 25, 0.9)';
          ctx.fillRect(btnX, b2Y, btnW, b2H);
          ctx.strokeStyle = '#555555';
          ctx.lineWidth = 1;
          ctx.strokeRect(btnX, b2Y, btnW, b2H);

          ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#888888';
          ctx.fillText(`⏱️ COOLDOWN (${rental.minutesLeft}m)`, cx + planeCardW / 2, b2Y + 18);
        } else if (rental.onCooldown) {
          // Can rent with credits during ad cooldown
          ctx.fillStyle = 'rgba(12, 42, 55, 0.95)';
          ctx.fillRect(btnX, b2Y, btnW, b2H);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(btnX, b2Y, btnW, b2H);

          this.buttons.push({
            x: btnX,
            y: b2Y,
            w: btnW,
            h: b2H,
            callback: () => {
              this.armory.inspectingPlane = p.id;
              this.armory.rentPlaneWithCredits(p.id);
            }
          });

          ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#00e5ff';
          ctx.fillText(`✈ TEST FLY: $${rental.rentalFee}`, cx + planeCardW / 2, b2Y + 18);
        } else {
          // Free 1-Sortie Tactical Test Flight Permit
          ctx.fillStyle = 'rgba(14, 38, 58, 0.95)';
          ctx.fillRect(btnX, b2Y, btnW, b2H);
          ctx.strokeStyle = '#33ccff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(btnX, b2Y, btnW, b2H);

          this.buttons.push({
            x: btnX,
            y: b2Y,
            w: btnW,
            h: b2H,
            callback: () => {
              this.armory.inspectingPlane = p.id;
              this.armory.watchRentalAd(p.id);
            }
          });

          ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#33ccff';
          ctx.fillText('✈ TEST SORTIE (FREE)', cx + planeCardW / 2, b2Y + 18);
        }
      }
    });

    // 2. Dedicated Airframe Upgrades Matrix
    const currentInspect = this.armory.inspectingPlane || this.armory.trialPlane || this.armory.state.selectedPlane || 'standard';
    const currentPlaneObj = planes.find(pl => pl.id === currentInspect) || planes[0];
    const upgrades = this.armory.getUpgradeItems(currentInspect);

    // Dedicated Matrix Header Banner
    const bannerY = 285;
    ctx.fillStyle = 'rgba(12, 32, 22, 0.95)';
    ctx.fillRect(width / 2 - 450, bannerY, 900, 26);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 450, bannerY, 900, 26);

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#66ffaa';
    ctx.fillText(`★ [Q] TO [Y] DEDICATED AIRFRAME UPGRADE MATRIX • ${currentPlaneObj.name.toUpperCase()} ★`, width / 2, bannerY + 17);

    const upgStartY = 316;
    const upgRowH = 41;
    const upgHotkeys = ['Q', 'W', 'E', 'R', 'T', 'Y'];

    upgrades.forEach((u, idx) => {
      const rowY = upgStartY + idx * upgRowH;
      const isMaxed = u.level >= u.maxLevel;
      const canAfford = this.armory.state.credits >= u.cost;

      ctx.fillStyle = 'rgba(14, 28, 20, 0.9)';
      ctx.fillRect(width / 2 - 450, rowY, 900, upgRowH - 4);
      ctx.strokeStyle = isMaxed ? '#2a5535' : (canAfford ? '#4a8555' : '#2d4535');
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 - 450, rowY, 900, upgRowH - 4);

      // Register Clickable Upgrade Row
      this.buttons.push({
        x: width / 2 - 450,
        y: rowY,
        w: 900,
        h: upgRowH - 4,
        callback: () => this.armory.buyUpgrade(u.id, currentInspect)
      });

      // Name & Description
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`[${upgHotkeys[idx]}] ${u.name}`, width / 2 - 430, rowY + 16);

      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#88bba0';
      ctx.fillText(u.desc, width / 2 - 430, rowY + 30);

      // Level / Cost Meter
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      if (isMaxed) {
        ctx.fillStyle = '#55ff55';
        ctx.fillText('★ MAXED TIER ★', width / 2 + 430, rowY + 23);
      } else {
        ctx.fillStyle = canAfford ? '#ffff00' : '#888888';
        ctx.fillText(`LVL ${u.level}/${u.maxLevel} • BUY: $${u.cost}`, width / 2 + 430, rowY + 23);
      }
    });

    // Armory Controls Guide & Future Expansion Teaser (Y: 575 to 640)
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#66cc88';
    ctx.fillText('⌨️ CONTROLS: [1-0] Select/Inspect Aircraft • [Q-Y] Upgrades • [V] Bonus Funds • [ESC / A] Return', width / 2, 582);

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('🌊 PACIFIC TRIDENT: CARRIER STRIKE GROUP & NAVAL WARFARE COMING SOON IN V2.5!', width / 2, 604);

    // Top-Left Quick Back Button
    const topBackW = 130;
    const topBackH = 34;
    const topBackX = 25;
    const topBackY = 12;

    ctx.fillStyle = 'rgba(18, 42, 26, 0.95)';
    ctx.fillRect(topBackX, topBackY, topBackW, topBackH);
    ctx.strokeStyle = '#55ff55';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(topBackX, topBackY, topBackW, topBackH);

    this.buttons.push({
      x: topBackX,
      y: topBackY,
      w: topBackW,
      h: topBackH,
      callback: () => this.closeArmory()
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#66ff66';
    ctx.fillText('← BACK [ESC]', topBackX + topBackW / 2, topBackY + topBackH / 2);

    // Prominent Clickable Return Button at Bottom-Center
    const retBtnW = 380;
    const retBtnH = 44;
    const retBtnX = width / 2 - retBtnW / 2;
    const retBtnY = height - 52;

    ctx.fillStyle = 'rgba(20, 50, 32, 0.95)';
    ctx.fillRect(retBtnX, retBtnY, retBtnW, retBtnH);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(retBtnX, retBtnY, retBtnW, retBtnH);

    this.buttons.push({
      x: retBtnX,
      y: retBtnY,
      w: retBtnW,
      h: retBtnH,
      callback: () => this.closeArmory()
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText('← RETURN TO SORTIE / GAME [ESC]', width / 2, retBtnY + retBtnH / 2);

    // Bottom-Right Tactical Grant: +$1,500 Bonus Funds [V]
    const adFundW = 340;
    const adFundH = 44;
    const adFundX = width - adFundW - 35;
    const adFundY = height - 52;

    ctx.fillStyle = 'rgba(25, 45, 25, 0.95)';
    ctx.fillRect(adFundX, adFundY, adFundW, adFundH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(adFundX, adFundY, adFundW, adFundH);

    this.buttons.push({
      x: adFundX,
      y: adFundY,
      w: adFundW,
      h: adFundH,
      callback: () => {
        this.armory.state.credits += 1500;
        this.armory.saveState();
        window.soundSystem.play('beep', { volume: 1.0 });
        this.addFloatingText('+$1,500 COMBAT SUPPLY FUNDS GRANTED!', width / 2, 75, '#ffff00');
      }
    });

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('💰 CLAIM SUPPLY GRANT: +$1,500 [V]', adFundX + adFundW / 2, adFundY + adFundH / 2);

    ctx.restore();
  }

  // 60-120 FPS Loop with Fail-Safe Error Boundary
  loop(currentTime) {
    try {
      if (this.isAdShowing) {
        this.renderAdOverlay(this.renderer.ctx, this.renderer.width, this.renderer.height);
        return;
      }

      if (!this.lastTime) this.lastTime = currentTime;
      const elapsed = currentTime - this.lastTime;
      this.lastTime = currentTime;
      this.accumulatedTime += Math.min(100, Math.max(0, elapsed));

      let safetyStep = 0;
      while (this.accumulatedTime >= this.fixedDelta && safetyStep < 6) {
        this.update();
        this.accumulatedTime -= this.fixedDelta;
        safetyStep++;
      }
      if (this.accumulatedTime > this.fixedDelta * 6) {
        this.accumulatedTime = 0; // Prevent accumulator spiral / freeze
      }

      this.render();
    } catch (err) {
      console.error('Recoverable game loop exception:', err);
    } finally {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  start() {
    requestAnimationFrame((t) => {
      this.lastTime = t;
      this.loop(t);
    });
  }
}

window.AtomicBomberGame = AtomicBomberGame;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtomicBomberGame;
}

window.addEventListener('load', () => {
  window.atomicGame = new AtomicBomberGame();
  window.atomicGame.start();

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('weather') && window.atomicGame.renderer) {
      window.atomicGame.renderer.currentWeather = params.get('weather').toUpperCase();
    }
    if (params.get('grace') === '0') {
      window._testNoGrace = true;
    }
    if (params.get('codex') === '1') {
      setTimeout(() => {
        if (window.atomicGame) {
          window.atomicGame.openCodex();
          const u = params.get('unit');
          if (u && window.atomicGame.codex) {
            window.atomicGame.codex.selectedUnitId = u;
          }
        }
      }, 300);
    }
    if (params.get('autostart') === '1') {
      setTimeout(() => {
        window.atomicGame.startWave(parseInt(params.get('wave') || '1'), false);
        if (params.get('demo_explosion') === '1') {
          setTimeout(() => {
            if (window.atomicGame && window.atomicGame.weapons) {
              window.atomicGame.weapons.createExplosion(600, 480, 'large', 85);
              window.atomicGame.weapons.createExplosion(720, 470, 'medium', 55);
            }
          }, 400);
        }
        if (params.get('demo_zeppelin') === '1') {
          setTimeout(() => {
            if (window.atomicGame && window.atomicGame.entities) {
              window.atomicGame.entities.spawnZeppelinDreadnought(5);
              if (window.atomicGame.entities.zeppelins[0] && window.atomicGame.entities.player) {
                window.atomicGame.entities.zeppelins[0].x = window.atomicGame.entities.player.x + 380;
                window.atomicGame.entities.zeppelins[0].y = 160;
              }
            }
          }, 500);
        }
        if (params.get('demo_emp') === '1') {
          setTimeout(() => {
            if (window.atomicGame && window.atomicGame.weapons && window.atomicGame.entities.player) {
              const p = window.atomicGame.entities.player;
              window.atomicGame.weapons.dropEmpBomb(p.x + 220, 460, 0, 6);
            }
          }, 700);
        }
      }, 400);
    }
  } catch (e) {}
});
