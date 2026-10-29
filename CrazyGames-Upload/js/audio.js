/**
 * Atomic Bomber - Web Audio API Sound Subsystem
 * Directly plays the 17 authentic .ogg sounds extracted from the APK,
 * with Web Audio API spatial/gain control and dynamic jet engine sound modulation.
 * Includes procedural audio synthesizer fallbacks for robust offline playback.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.engineGain = null;
    this.enabled = true;
    this.platformMuted = false; // CrazyGames SDK platform audio mute setting
    this.buffers = {};
    this.loaded = false;

    // Active looping sound sources
    this.engineOsc = null;
    this.engineNoise = null;
    this.engineGainNode = null;
    this.isEngineRunning = false;
    this.heliSource = null;
    this.heliGainNode = null;
    this.isHeliRunning = false;
    this.gau8Source = null;
    this.isGau8Playing = false;
    this.chainFireSource = null;
    this.isChainGunFiring = false;
    this._radioDuckTimeout = null;
    this.cachedVoices = [];

    // Preload speech synthesis voices early so natural voices are immediately ready
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices() || [];
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            this.cachedVoices = window.speechSynthesis.getVoices() || [];
          };
        }
      } catch (e) {}
    }

    // Authentic sounds from APKs (Original Bomber + Joycity Gunship Battle)
    this.soundNames = [
      'atomic',
      'gau8',
      'missilelaunch',
      'missilehit',
      'planehit',
      'tankhit',
      'rocket',
      'shot',
      'lgboom',
      'mdboom',
      'smboom',
      'clusterburst',
      'housefall',
      'woodcrack',
      'emptysitehit',
      'beep',
      'button',
      // Gunship Battle Studio Sound Assets
      'heli_rotor',
      'Chain_Active',
      'Chain_Fire',
      'Chain_End',
      '20mm_shoot',
      '30mm_shoot',
      'Sonic_Booms03',
      'BulletHit_Water',
      'BulletHit_Metal',
      'alert',
      'ExploRocket',
      'train',
      'CoinCounter',
      'missile_shoot',
      'BombDrop',
      'BombTarget',
      'ExploGeneral',
      'GetItem',
      'BuyItem',
      'upgrade_open',
      'upgrade_process',
      'MessageBox'
    ];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1.0;
      this.sfxGain.connect(this.masterGain);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.15;
      this.engineGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);

      // Check CrazyGames URL parameter (?muteAudio=true) and SDK settings
      try {
        if (typeof window !== 'undefined' && window.location && window.location.search.includes('muteAudio=true')) {
          this.setPlatformMuted(true);
        }
      } catch (e) {}

      // Register CrazyGames SDK settings listener
      try {
        if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
          if (typeof window.CrazyGames.SDK.game.addSettingsChangeListener === 'function') {
            window.CrazyGames.SDK.game.addSettingsChangeListener((settings) => {
              if (settings && typeof settings.muteAudio === 'boolean') {
                this.setPlatformMuted(settings.muteAudio);
              }
            });
          }
        }
      } catch (e) {}

      this.loadAllSounds();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadAllSounds() {
    const wavSounds = new Set([
      'heli_rotor',
      'Chain_Active',
      'Chain_Fire',
      'Chain_End',
      '20mm_shoot',
      '30mm_shoot',
      'Sonic_Booms03',
      'BulletHit_Water',
      'BulletHit_Metal',
      'alert',
      'ExploRocket',
      'train',
      'CoinCounter',
      'missile_shoot',
      'BombDrop',
      'BombTarget',
      'ExploGeneral',
      'GetItem',
      'BuyItem',
      'upgrade_open',
      'upgrade_process',
      'MessageBox'
    ]);

    const promises = this.soundNames.map(async (name) => {
      try {
        const ext = wavSounds.has(name) ? 'wav' : 'ogg';
        const res = await fetch(`assets/audio/${name}.${ext}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        this.buffers[name] = audioBuf;
      } catch (err) {
        // Fallback procedural sounds will be used if file fetch fails
      }
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  play(name, options = {}) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    let volume = options.volume !== undefined ? options.volume : 1.0;
    const playbackRate = options.rate !== undefined ? options.rate : 1.0;
    const pan = options.pan !== undefined ? options.pan : 0;

    // Heavily suppress all combat SFX (especially loud missiles & gunshots) during radio voice
    if (this.isRadioDucking) {
      if (name.includes('missile') || name.includes('rocket') || name.includes('boom')) {
        volume = Math.min(volume, 0.03);
      } else {
        volume = Math.min(volume, 0.06);
      }
    }

    // Use authentic decoded buffer from APK if available
    if (this.buffers[name]) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];
        source.playbackRate.value = playbackRate;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        if (this.ctx.createStereoPanner && pan !== 0) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.value = Math.max(-1, Math.min(1, pan));
          source.connect(gainNode);
          gainNode.connect(panner);
          panner.connect(this.sfxGain);
        } else {
          source.connect(gainNode);
          gainNode.connect(this.sfxGain);
        }

        source.start(0);
        return source;
      } catch (e) {
        // console.warn('Buffer playback error:', e);
      }
    }

    // Procedural synthesized fallback ensures audio always works
    this.synthesizeFallback(name, volume, playbackRate);
  }

  // Continuous GAU-8 Avenger rotary cannon burst
  startGau8() {
    if (this.isGau8Playing || !this.enabled) return;
    this.resume();
    this.isGau8Playing = true;
    this.play('gau8', { volume: 0.95 });
  }

  stopGau8() {
    this.isGau8Playing = false;
  }

  // 3-Stage Heavy Chain Gun / Minigun Audio Engine (Active Spinup -> Continuous Loop -> Spindown)
  startChainGun() {
    if (this.isChainGunFiring || !this.enabled) return;
    this.resume();
    this.isChainGunFiring = true;

    // 1. Electric motor spinup sound
    this.play('Chain_Active', { volume: 0.85 });

    // 2. Loop heavy chain gun burst
    if (this.ctx && this.buffers['Chain_Fire']) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers['Chain_Fire'];
        source.loop = true;
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0.90;
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        source.start(0);
        this.chainFireSource = source;
      } catch (e) {}
    } else {
      this.play('gau8', { volume: 0.90 });
    }
  }

  stopChainGun() {
    if (!this.isChainGunFiring) return;
    this.isChainGunFiring = false;

    // 1. Stop continuous firing burst loop
    try {
      if (this.chainFireSource) {
        this.chainFireSource.stop();
        this.chainFireSource.disconnect();
      }
    } catch (e) {}
    this.chainFireSource = null;

    // 2. Play motor deceleration spindown
    this.play('Chain_End', { volume: 0.75 });
  }

  // Dedicated Tactical Sound FX Helpers
  play20mm(pan = 0) {
    this.play('20mm_shoot', { volume: 0.85, pan });
  }

  play30mm(pan = 0) {
    this.play('30mm_shoot', { volume: 0.95, pan });
  }

  playWaterSplash(pan = 0) {
    this.play('BulletHit_Water', { volume: 0.85, pan });
  }

  playWaterHit(pan = 0) {
    this.play('BulletHit_Water', { volume: 0.90, pan });
  }

  playMetalHit(pan = 0) {
    this.play('BulletHit_Metal', { volume: 0.82, pan });
  }

  playThunder(pan = 0) {
    this.play('Sonic_Booms03', { volume: 1.0, pan });
  }

  playChainFire(pan = 0) {
    this.play('Chain_Fire', { volume: 0.85, pan });
  }

  playMetalHit(pan = 0) {
    this.play('BulletHit_Metal', { volume: 0.75, pan });
  }

  playSonicBoom() {
    this.play('Sonic_Booms03', { volume: 0.92 });
  }

  playPneumaticPop(pan = 0) {
    // S-400 Cold-launch pneumatic gas ejection pop
    this.play('missilelaunch', { volume: 0.45, rate: 1.6, pan });
  }

  playS400Ignition(pan = 0) {
    // S-400 Supersonic rocket motor ignition shockwave
    this.play('Sonic_Booms03', { volume: 0.75, pan });
    this.play('rocket', { volume: 0.85, pan });
  }

  playCockpitAlert() {
    this.play('alert', { volume: 0.85 });
  }

  playRocketExplo(pan = 0) {
    this.play('ExploRocket', { volume: 0.85, pan });
  }

  playTrainSound() {
    this.play('train', { volume: 0.70 });
  }

  playCoinChime() {
    this.play('CoinCounter', { volume: 0.80 });
  }

  playMissileShoot(pan = 0) {
    this.play('missile_shoot', { volume: 0.95, pan });
  }

  playBombWhistle(pan = 0) {
    this.play('BombDrop', { volume: 0.90, pan });
  }

  playLaserLock() {
    this.play('BombTarget', { volume: 0.85 });
  }

  playBigExplo(pan = 0) {
    this.play('ExploGeneral', { volume: 1.0, pan });
  }

  playUpgradeOpen() {
    this.play('upgrade_open', { volume: 0.85 });
  }

  playUpgradeMount() {
    this.play('upgrade_process', { volume: 0.88 });
  }

  playRadioChime() {
    if (this.buffers['MessageBox']) {
      this.play('MessageBox', { volume: 0.90 });
    } else {
      this.playRadioComms('incoming');
    }
  }

  playGetItem() {
    this.play('GetItem', { volume: 0.85 });
  }

  // Authentic Helicopter Rotor Acoustic Engine (Dual-Rotor Chop & Dynamic Pitch Shifting)
  startHeliRotor() {
    if (this.isHeliRunning || !this.ctx || !this.enabled) return;
    this.resume();

    try {
      this.heliGainNode = this.ctx.createGain();
      this.heliGainNode.gain.value = 0.22;
      this.heliGainNode.connect(this.engineGain);

      if (this.buffers['heli_rotor']) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers['heli_rotor'];
        source.loop = true;
        source.playbackRate.value = 1.0;
        source.connect(this.heliGainNode);
        source.start(0);
        this.heliSource = source;
      } else {
        // Fallback procedural helicopter rotor if sound file is not loaded
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 22; // Rotor chop frequency

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;

        osc.connect(filter);
        filter.connect(this.heliGainNode);
        osc.start(0);
        this.heliSource = osc;
      }
      this.isHeliRunning = true;
    } catch (e) {}
  }

  updateHeliRotor(speedRatio = 0.5, isHovering = false) {
    if (!this.isHeliRunning || !this.heliSource || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Hovering: deeper, heavy thudding ~0.88x rate; Full cruise: faster chop ~1.30x rate
      const targetRate = isHovering ? 0.88 : (0.95 + speedRatio * 0.35);
      if (this.heliSource.playbackRate && typeof this.heliSource.playbackRate.setTargetAtTime === 'function') {
        this.heliSource.playbackRate.setTargetAtTime(targetRate, now, 0.1);
      } else if (this.heliSource.frequency && typeof this.heliSource.frequency.setTargetAtTime === 'function') {
        this.heliSource.frequency.setTargetAtTime(18 + speedRatio * 14, now, 0.1);
      }
      if (this.heliGainNode) {
        const targetVol = isHovering ? 0.26 : (0.18 + speedRatio * 0.12);
        this.heliGainNode.gain.setTargetAtTime(targetVol, now, 0.1);
      }
    } catch (e) {}
  }

  stopHeliRotor() {
    if (!this.isHeliRunning) return;
    try {
      if (this.heliSource) {
        this.heliSource.stop();
        this.heliSource.disconnect();
      }
    } catch (e) {}
    this.heliSource = null;
    this.heliGainNode = null;
    this.isHeliRunning = false;
  }

  // Dynamic jet engine turbine sound with pitch shifting based on airspeed
  startJetEngine() {
    if (this.isEngineRunning || !this.ctx || !this.enabled) return;
    this.resume();

    try {
      // Low rumble osc + filtered noise for jet thrust
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 65; // Idle jet rumble

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;

      // Noise generator
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 600;
      noiseFilter.Q.value = 1.8;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.25;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 0.35;

      this.engineGainNode = this.ctx.createGain();
      this.engineGainNode.gain.value = 0.18;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.engineGainNode);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.engineGainNode);

      this.engineGainNode.connect(this.engineGain);

      osc.start(0);
      whiteNoise.start(0);

      this.engineOsc = osc;
      this.engineNoise = whiteNoise;
      this.isEngineRunning = true;
    } catch (e) {
      // Ignore
    }
  }

  updateJetEngine(speedRatio, isDiving) {
    if (!this.isEngineRunning || !this.engineOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const targetFreq = 55 + speedRatio * 85 + (isDiving ? 40 : 0);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
      if (this.engineGainNode) {
        const targetVol = 0.14 + speedRatio * 0.16 + (isDiving ? 0.08 : 0);
        this.engineGainNode.gain.setTargetAtTime(targetVol, now, 0.1);
      }
    } catch (e) {}
  }

  stopJetEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) this.engineOsc.stop();
      if (this.engineNoise) this.engineNoise.stop();
    } catch (e) {}
    this.engineOsc = null;
    this.engineNoise = null;
    this.isEngineRunning = false;
  }

  // Unified Engine Interface (automatically branches for Jet or Helicopter)
  startEngine(isHelicopter = false) {
    if (!isHelicopter && typeof window !== 'undefined' && window.atomicGame && window.atomicGame.entities && window.atomicGame.entities.player) {
      isHelicopter = !!window.atomicGame.entities.player.isHelicopter;
    }
    if (isHelicopter) {
      this.startHeliRotor();
    } else {
      this.startJetEngine();
    }
  }

  updateEngine(speedRatio = 0.5, isDiving = false, isHovering = false) {
    if (this.isHeliRunning) {
      this.updateHeliRotor(speedRatio, isHovering);
    }
    if (this.isEngineRunning) {
      this.updateJetEngine(speedRatio, isDiving);
    }
  }

  stopEngine() {
    this.stopJetEngine();
    this.stopHeliRotor();
    this.stopChainGun();
    this.stopGau8();
  }

  // Official CrazyGames SDK Game Settings: muteAudio priority override
  setPlatformMuted(isMuted) {
    this.platformMuted = isMuted;
    if (!this.ctx || !this.masterGain) return;
    if (isMuted) {
      this.masterGain.gain.value = 0;
      this.stopEngine();
      this.stopGau8();
    } else {
      if (this.enabled) {
        this.masterGain.gain.value = 0.85;
        if (window.atomicGame && window.atomicGame.state === 'PLAYING') {
          this.startEngine();
        }
      }
    }
  }

  toggleSound() {
    if (this.platformMuted) {
      // SDK muteAudio takes priority over user in-game settings according to CrazyGames specs
      return false;
    }
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.resume();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.value = 0.85;
      }
      this.play('button', { volume: 0.8 });
      if (window.atomicGame && window.atomicGame.state === 'PLAYING') {
        this.startEngine();
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.value = 0;
      }
      this.stopEngine();
      this.stopGau8();
    }
    return this.enabled;
  }

  // Temporary mute for advertisements without overwriting user sound preference
  setAdMuted(isMuted) {
    if (!this.ctx || !this.masterGain) return;
    if (isMuted) {
      this.masterGain.gain.value = 0;
      this.stopEngine();
      this.stopGau8();
    } else {
      // Only restore volume if SDK platform mute is not active
      if (this.enabled && !this.platformMuted) {
        this.masterGain.gain.value = 0.85;
        if (window.atomicGame && window.atomicGame.state === 'PLAYING') {
          this.startEngine();
        }
      }
    }
  }

  // Robust procedural synthesis fallback
  synthesizeFallback(name, volume, rate) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    try {
      if (name.includes('boom') || name === 'missilehit' || name === 'planehit' || name === 'tankhit') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(name === 'lgboom' ? 95 : 140, now);
        osc.frequency.exponentialRampToValueAtTime(15, now + 0.45);
        gain.gain.setValueAtTime(volume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (name === 'atomic') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(25, now + 1.8);
        gain.gain.setValueAtTime(volume * 1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 2.3);
      } else if (name === 'shot' || name === 'gau8') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (name === 'missilelaunch' || name === 'rocket') {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.32);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(volume * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (name === 'beep') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (name === 'button') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (name === '20mm_shoot' || name === '30mm_shoot') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(name === '30mm_shoot' ? 160 : 210, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(volume * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (name === 'BulletHit_Water') {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
        const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(850, now);
        filter.Q.setValueAtTime(1.2, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.20);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
      } else if (name === 'BulletHit_Metal') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.10);
      } else if (name === 'Sonic_Booms03') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.65);
        gain.gain.setValueAtTime(volume * 0.95, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.70);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.72);
      } else if (name === 'alert') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);
        osc.frequency.setValueAtTime(820, now + 0.12);
        osc.frequency.setValueAtTime(1050, now + 0.24);
        gain.gain.setValueAtTime(volume * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.36);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.38);
      } else if (name === 'Chain_Active') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(550, now + 0.18);
        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.20);
      } else if (name === 'Chain_End') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (name === 'CoinCounter') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.30);
      } else if (name === 'ExploRocket') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.40);
        gain.gain.setValueAtTime(volume * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (name === 'train') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.60);
        gain.gain.setValueAtTime(volume * 0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.70);
      }
    } catch (e) {}
  }

  /**
   * Authentic Procedural Military VHF Radio Squelch & Pilot Voice Comms
   * Synthesizes tactical walkie-talkie mic click, VHF static burst,
   * frequency-modulated formant speech cadence, and classic Roger beep.
   */
  playRadioComms(dialogueType = 'chatter') {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // 1. Initial PTT Radio Squelch / Mic Open Static Burst (60ms)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.8));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const squelchFilter = this.ctx.createBiquadFilter();
      squelchFilter.type = 'bandpass';
      squelchFilter.frequency.setValueAtTime(1900, now);
      squelchFilter.Q.setValueAtTime(2.2, now);

      const squelchGain = this.ctx.createGain();
      squelchGain.gain.setValueAtTime(0.35, now);
      squelchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.065);

      noiseSource.connect(squelchFilter);
      squelchFilter.connect(squelchGain);
      squelchGain.connect(this.sfxGain);
      noiseSource.start(now);

      // 2. Synthesized Pilot Voice Syllable Formants (3-4 speech rhythm bursts)
      const syllables = dialogueType === 'incoming' 
        ? [ { f: 185, dur: 0.11 }, { f: 230, dur: 0.14 }, { f: 195, dur: 0.16 } ] // "We are coming!"
        : dialogueType === 'attack' 
        ? [ { f: 220, dur: 0.10 }, { f: 260, dur: 0.12 }, { f: 210, dur: 0.10 }, { f: 175, dur: 0.15 } ] // "Engaging targets!"
        : dialogueType === 'repair'
        ? [ { f: 240, dur: 0.13 }, { f: 200, dur: 0.11 }, { f: 220, dur: 0.18 } ] // "Dropping repair!"
        : dialogueType === 'rtb'
        ? [ { f: 190, dur: 0.12 }, { f: 210, dur: 0.15 }, { f: 165, dur: 0.18 } ] // "Mission done, RTB!"
        : [ { f: 200, dur: 0.10 }, { f: 240, dur: 0.12 }, { f: 190, dur: 0.14 } ]; // Ambient chatter

      let syllableTime = now + 0.07;
      syllables.forEach((syl, idx) => {
        const osc = this.ctx.createOscillator();
        const vGain = this.ctx.createGain();
        const vFilter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(syl.f, syllableTime);
        osc.frequency.linearRampToValueAtTime(syl.f * (idx % 2 === 0 ? 1.15 : 0.9), syllableTime + syl.dur);

        // Vocal tract telephone bandpass
        vFilter.type = 'bandpass';
        vFilter.frequency.setValueAtTime(syl.f * 5.5, syllableTime);
        vFilter.Q.setValueAtTime(3.5, syllableTime);

        vGain.gain.setValueAtTime(0.001, syllableTime);
        vGain.gain.linearRampToValueAtTime(0.24, syllableTime + syl.dur * 0.25);
        vGain.gain.linearRampToValueAtTime(0.18, syllableTime + syl.dur * 0.75);
        vGain.gain.exponentialRampToValueAtTime(0.001, syllableTime + syl.dur);

        osc.connect(vFilter);
        vFilter.connect(vGain);
        vGain.connect(this.sfxGain);

        osc.start(syllableTime);
        osc.stop(syllableTime + syl.dur + 0.02);

        syllableTime += syl.dur + 0.04;
      });

      // 3. Radio Mic Release Squelch & Roger Beep at the end
      const rogerTime = syllableTime + 0.02;
      const rogerOsc = this.ctx.createOscillator();
      const rogerGain = this.ctx.createGain();
      rogerOsc.type = 'sine';
      rogerOsc.frequency.setValueAtTime(1780, rogerTime);
      rogerOsc.frequency.setValueAtTime(1350, rogerTime + 0.045);

      rogerGain.gain.setValueAtTime(0.15, rogerTime);
      rogerGain.gain.exponentialRampToValueAtTime(0.001, rogerTime + 0.09);

      rogerOsc.connect(rogerGain);
      rogerGain.connect(this.sfxGain);
      rogerOsc.start(rogerTime);
      rogerOsc.stop(rogerTime + 0.095);

    } catch (e) {
      // Audio fallback
    }
  }

  /**
   * Radio Audio Ducking: Dips battlefield combat SFX (to 3%) & jet engine (to 1.5%)
   * so incoming pilot/controller transmissions punch through with total crystal clarity.
   */
  duckAudioForRadio(durationMs = 5000) {
    if (!this.ctx) return;
    try {
      this.isRadioDucking = true;
      const now = this.ctx.currentTime;
      if (this.sfxGain && this.sfxGain.gain) {
        this.sfxGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, now);
        this.sfxGain.gain.linearRampToValueAtTime(0.03, now + 0.03); // Instant deep duck to 3% volume
      }
      if (this.engineGain && this.engineGain.gain) {
        this.engineGain.gain.cancelScheduledValues(now);
        this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
        this.engineGain.gain.linearRampToValueAtTime(0.015, now + 0.03); // Jet engine quiet whisper
      }
      if (this._radioDuckTimeout) clearTimeout(this._radioDuckTimeout);
      this._radioDuckTimeout = setTimeout(() => {
        this.restoreAudioFromRadio();
      }, durationMs);
    } catch (e) {}
  }

  restoreAudioFromRadio() {
    if (!this.ctx) return;
    try {
      this.isRadioDucking = false;
      if (this._radioDuckTimeout) {
        clearTimeout(this._radioDuckTimeout);
        this._radioDuckTimeout = null;
      }
      const now = this.ctx.currentTime;
      if (this.sfxGain && this.sfxGain.gain) {
        this.sfxGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, now);
        this.sfxGain.gain.linearRampToValueAtTime(1.0, now + 0.20); // Smoothly ramp SFX back to 100%
      }
      if (this.engineGain && this.engineGain.gain) {
        this.engineGain.gain.cancelScheduledValues(now);
        this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
        this.engineGain.gain.linearRampToValueAtTime(0.15, now + 0.20); // Jet engine back to normal
      }
    } catch (e) {}
  }

  /**
   * Real Spoken English Voice over Military Tactical Radio
   * Uses browser native Web Speech API combined with audio ducking, radio squelch & pitch profiles
   */
  speakRadioVoice(text, speaker = 'PILOT') {
    if (!this.enabled || this.platformMuted) return;

    // Strip UI emojis, brackets, and callsigns from speech string
    const cleanText = (text || '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[★⚠️🔧👥📺💰✈⏱️📻★☢️🎯💥🚀💣✨👨‍✈️▋]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!cleanText) return;

    // Calculate realistic speech duration: ~12 chars/sec + buffer
    const estDurationMs = Math.max(5500, Math.ceil((cleanText.length / 12) * 1000) + 1800);

    this.playRadioChime(); // Play crisp tactical VHF radio click / notification
    this.duckAudioForRadio(estDurationMs); // Deep duck combat roar so pilot voice is 100% loud and crystal clear

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.volume = 1.0;

        // Warm, natural human pitch & conversational speech cadence (clear, loud, intelligible)
        utter.rate = 1.02;
        utter.pitch = 1.0;
        const lowerText = cleanText.toLowerCase();
        if (lowerText.includes('trump')) {
          utter.rate = 0.95; // Deliberate, confident natural cadence
          utter.pitch = 0.94;
        } else if (lowerText.includes('ramsay')) {
          utter.rate = 1.04; // Energetic, sharp human cadence
          utter.pitch = 1.04;
        } else if (lowerText.includes('arnold')) {
          utter.rate = 0.92; // Deep, solid baritone
          utter.pitch = 0.91;
        } else if (speaker.includes('RAZOR 1')) {
          utter.pitch = 1.02;
          utter.rate = 1.0;
        } else if (speaker.includes('RAZOR 2')) {
          utter.pitch = 0.95; // Deeper wingman
          utter.rate = 0.98;
        } else if (speaker.includes('PILOT')) {
          utter.pitch = 1.01; // Expressive cockpit pilot
          utter.rate = 1.01;
        }

        const voices = (this.cachedVoices && this.cachedVoices.length > 0)
          ? this.cachedVoices
          : (window.speechSynthesis.getVoices() || []);

        // Priority 1: High-fidelity Natural / Neural / Online human voices
        const naturalVoice = voices.find(v => v.lang.startsWith('en') && (
          v.name.includes('Natural') ||
          v.name.includes('Neural') ||
          v.name.includes('Online') ||
          v.name.includes('Google') ||
          v.name.includes('Premium') ||
          v.name.includes('Enhanced') ||
          v.name.includes('Christopher') ||
          v.name.includes('Guy') ||
          v.name.includes('Eric') ||
          v.name.includes('Aria') ||
          v.name.includes('Jenny') ||
          v.name.includes('Samantha') ||
          v.name.includes('Alex') ||
          v.name.includes('Daniel')
        ));
        // Priority 2: Non-desktop modern voices (avoid robotic legacy SAPI5 Desktop voices like David Desktop / Zira Desktop)
        const modernVoice = voices.find(v => v.lang.startsWith('en') && !v.name.includes('Desktop') && !v.name.includes('David') && !v.name.includes('Zira'));
        // Priority 3: Any English voice
        const fallbackVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];

        const selectedVoice = naturalVoice || modernVoice || fallbackVoice;
        if (selectedVoice) {
          utter.voice = selectedVoice;
        }

        utter.onend = () => {
          this.play('beep', { volume: 0.5 });
          // Brief 200ms buffer after speech finishes before restoring combat audio
          setTimeout(() => {
            this.restoreAudioFromRadio();
          }, 200);
        };

        utter.onerror = () => {
          this.restoreAudioFromRadio();
        };

        window.speechSynthesis.speak(utter);
      } catch (e) {
        this.restoreAudioFromRadio();
      }
    }
  }

  // Heavy 120mm/125mm APFSDS Tank Cannon Blast
  playTank120mm() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      // 1. Deep low-end concussive thump (120 Hz -> 28 Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.40);

      // 2. High-pressure muzzle crack
      const bufSize = Math.floor(this.ctx.sampleRate * 0.12);
      const noise = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
      }
      const nSource = this.ctx.createBufferSource();
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.70, now);
      nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      nSource.buffer = noise;
      nSource.connect(nGain);
      nGain.connect(this.sfxGain);
      nSource.start(now);
    } catch (e) {}
  }

  // High-Tech Electromagnetic Shield Barrier Absorption Ping
  playShieldHit() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.22);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  // Heavy Thermobaric MLRS Multi-Tube Rocket Ignition
  playThermobaricLaunch() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.40);
      gain.gain.setValueAtTime(0.60, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }
}

// Global singleton instance
window.SoundSystem = SoundSystem;
window.soundSystem = new SoundSystem();
