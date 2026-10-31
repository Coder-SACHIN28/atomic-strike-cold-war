/**
 * Atomic Strike: Cold War - Visual Rendering Engine
 * Multi-theater atmospheric rendering:
 * - EUROPEAN: Seamless blue horizon, mirrored mountain parallax, drifting cumulus clouds
 * - SIBERIAN: Arctic aurora sky, procedural snow peaks, active blizzard particle system
 * - DESERT: Twilight oilfield sky, sweeping military searchlights, rising fire embers & smoke
 */

class RenderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.cameraX = 0;
    this.cameraY = 0;

    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
    this.flashAlpha = 0;
    this.empGlitchTimer = 0; // EMP static & CRT phosphor disruption timer

    this.floatingTexts = [];
    this.ambientClouds = [];
    this.snowParticles = [];
    this.oilFireParticles = [];
    this.searchlights = [];

    this.initWeatherSystems();
  }

  initWeatherSystems() {
    // 1. European Clouds
    this.ambientClouds = [];
    for (let i = 0; i < 18; i++) {
      this.ambientClouds.push({
        x: Math.random() * 5200,
        y: 30 + Math.random() * 220,
        vx: 0.35 + Math.random() * 0.5,
        size: 32 + Math.random() * 40,
        alpha: 0.2 + Math.random() * 0.25
      });
    }

    // 2. Siberian Blizzard Snowflakes
    this.snowParticles = [];
    for (let i = 0; i < 90; i++) {
      this.snowParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: -(1.5 + Math.random() * 2.5), // Drifting left with arctic wind
        vy: 1.2 + Math.random() * 2.0,
        size: 1.5 + Math.random() * 3.0,
        alpha: 0.4 + Math.random() * 0.55
      });
    }

    // 3. Desert Rising Oil Sparks & Embers
    this.oilFireParticles = [];
    for (let i = 0; i < 60; i++) {
      this.oilFireParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(1.5 + Math.random() * 2.2), // Rising up with heat
        size: 2.0 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? '#ff6600' : '#ffcc00',
        alpha: 0.3 + Math.random() * 0.6
      });
    }

    // 4. Desert Searchlights
    this.searchlights = [
      { x: 1400, baseAngle: -Math.PI / 2, sweepSpeed: 0.015, width: 70, length: 650 },
      { x: 2600, baseAngle: -Math.PI / 2, sweepSpeed: 0.012, width: 85, length: 700 },
      { x: 3800, baseAngle: -Math.PI / 2, sweepSpeed: 0.018, width: 75, length: 680 }
    ];

    // 5. Dynamic Rain & Thunderstorm Simulation
    this.rainParticles = [];
    for (let i = 0; i < 120; i++) {
      this.rainParticles.push({
        x: Math.random() * (this.width + 120),
        y: Math.random() * this.height,
        vx: -(3.0 + Math.random() * 2.5),
        vy: 14.0 + Math.random() * 6.0,
        length: 12 + Math.random() * 10
      });
    }

    this.currentWeather = 'CLEAR';
    this.weatherCycleTimer = 1600; // ~25-35s cycle
    this.lightningTimer = 0;
    this.activeLightning = null;
  }

  triggerShake(intensity, duration = 20) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  triggerFlash(alpha = 1.0) {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  triggerEmpGlitch(duration = 120) {
    this.empGlitchTimer = Math.max(this.empGlitchTimer, duration);
  }

  addFloatingText(text, x, y, color = '#55ff55') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.2,
      color,
      alpha: 1.0,
      life: 55
    });
  }

  update(player, mapType = 'EUROPEAN') {
    // 1. Camera smoothly follows player with forward lookahead
    if (player && player.alive) {
      const lookahead = Math.cos(player.angle) * 220;
      const targetCamX = player.x - this.width / 2 + lookahead;
      this.cameraX += (targetCamX - this.cameraX) * 0.12;
    }

    // 2. Shake decay
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    // 3. Flash decay
    if (this.flashAlpha > 0.01) {
      this.flashAlpha *= 0.92;
    } else {
      this.flashAlpha = 0;
    }

    // 3.5 EMP Glitch decay
    if (this.empGlitchTimer > 0) {
      this.empGlitchTimer--;
    }

    // 4. Update Ambient Weather per Theater & Dynamic Weather Cycle
    this.weatherCycleTimer--;
    if (this.weatherCycleTimer <= 0) {
      const weathers = ['CLEAR', 'CLOUDY', 'RAIN', 'THUNDERSTORM'];
      this.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.weatherCycleTimer = 1600 + Math.floor(Math.random() * 1200); // 25-45 seconds
    }

    if (this.currentWeather === 'RAIN' || this.currentWeather === 'THUNDERSTORM') {
      for (const r of this.rainParticles) {
        r.x += r.vx;
        r.y += r.vy;
        if (r.y > this.height) {
          r.y = -10;
          r.x = Math.random() * (this.width + 120);
        }
        if (r.x < -10) r.x = this.width + 10;
      }

      if (this.currentWeather === 'THUNDERSTORM') {
        this.lightningTimer--;
        if (this.lightningTimer <= 0) {
          this.lightningTimer = 220 + Math.floor(Math.random() * 260);
          this.triggerFlash(0.85);
          if (window.soundSystem && typeof window.soundSystem.playThunder === 'function') {
            window.soundSystem.playThunder();
          }
          const lx = 120 + Math.random() * (this.width - 240);
          this.activeLightning = {
            x: lx,
            timer: 9,
            branches: this.generateLightningBranches(lx, 0, lx + (Math.random() - 0.5) * 160, 480)
          };
        }
        if (this.activeLightning) {
          this.activeLightning.timer--;
          if (this.activeLightning.timer <= 0) this.activeLightning = null;
        }
      }
    }

    if (mapType === 'SIBERIA') {
      for (const s of this.snowParticles) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = this.width + 10;
        if (s.y > this.height) s.y = -10;
      }
    } else if (mapType === 'DESERT') {
      for (const p of this.oilFireParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = this.height + 10;
          p.x = Math.random() * this.width;
        }
      }
    } else {
      for (const c of this.ambientClouds) {
        c.x += c.vx;
        if (c.x > 5400) c.x = -150;
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ft.alpha = ft.life / 55;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  generateLightningBranches(x1, y1, x2, y2) {
    const segments = [];
    let curX = x1;
    let curY = y1;
    const steps = 14;
    const dy = (y2 - y1) / steps;
    for (let i = 0; i < steps; i++) {
      const nextY = curY + dy;
      const nextX = curX + (Math.random() - 0.5) * 36;
      segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
      if (Math.random() < 0.35 && i < steps - 3) {
        const sideX = nextX + (Math.random() - 0.5) * 60;
        const sideY = nextY + dy * 0.8;
        segments.push({ x1: nextX, y1: nextY, x2: sideX, y2: sideY });
      }
      curX = nextX;
      curY = nextY;
    }
    return segments;
  }

  drawRainAndStorm(ctx) {
    ctx.save();
    // 1. Falling rain streaks
    ctx.strokeStyle = 'rgba(190, 220, 255, 0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const r of this.rainParticles) {
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.vx * 1.4, r.y + r.vy * 1.4);
    }
    ctx.stroke();

    // 2. Active Branching Lightning Bolt
    if (this.activeLightning && this.activeLightning.branches) {
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#66ccff';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (const seg of this.activeLightning.branches) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  render(game) {
    const ctx = this.ctx;
    const mapType = game.terrain ? game.terrain.currentMap : 'EUROPEAN';

    ctx.save();

    // Apply Screen Shake to World layer only
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. Draw Multi-Theater Sky & Distant Mountain Horizon
    this.drawSky(ctx, game.sprites['sky.png'], mapType);

    // 2. Draw Weather / Searchlights in background
    if (mapType === 'DESERT') {
      this.drawSearchlights(ctx, game.terrain);
    } else if (mapType === 'EUROPEAN') {
      this.drawAmbientClouds(ctx);
    }

    // 3. Draw Terrain (Authentic Multi-Theater Hill Geometry)
    game.terrain.draw(ctx, this.cameraX, this.width, this.height, game.sprites['grass.png']);

    // 4. Draw Weapons & Explosions
    game.weapons.draw(ctx, this.cameraX);

    // 5. Draw Entities (Planes, Tanks, SAMs, Radomes, Trains, Oil Wells)
    game.entities.draw(ctx, this.cameraX);

    // 6. Draw Foreground Weather (Siberian Snowfall / Desert Rising Embers)
    if (mapType === 'SIBERIA') {
      this.drawBlizzard(ctx);
    } else if (mapType === 'DESERT') {
      this.drawOilEmbers(ctx);
    }

    // 6.5 Draw Dynamic Rain & Thunderstorm Lightning
    if (this.currentWeather === 'RAIN' || this.currentWeather === 'THUNDERSTORM') {
      this.drawRainAndStorm(ctx);
    }

    // 7. Draw Floating Combat Text
    this.drawFloatingTexts(ctx);

    ctx.restore(); // Restore world translation so HUD remains rock solid!

    // 8. Draw Nuclear EMP Flash
    if (this.flashAlpha > 0.02) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 8.5 Draw Cockpit EMP Static & Phosphor Scanlines
    if (this.empGlitchTimer > 0) {
      this.drawEmpGlitch(ctx);
    }

    // 9. Draw Head-Up Display (HUD)
    game.hud.draw(ctx, this.width, this.height);
  }

  /**
   * Draw Cockpit EMP Phosphor Glitch & Digital Radar Static Overlay
   */
  drawEmpGlitch(ctx) {
    ctx.save();
    const intensity = Math.min(1.0, this.empGlitchTimer / 45);

    // CRT Horizontal Phosphor Jitter Lines
    for (let g = 0; g < 7; g++) {
      const gy = Math.random() * this.height;
      const gh = 2 + Math.random() * 9;
      ctx.fillStyle = `rgba(0, 255, 140, ${0.14 * intensity})`;
      ctx.fillRect(0, gy, this.width, gh);
    }

    // High-Voltage Static Warning Banner
    ctx.font = 'bold 15px "Courier New", Courier, monospace';
    ctx.fillStyle = `rgba(255, 230, 40, ${0.9 * intensity})`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 8;
    ctx.fillText('⚡ EMP WAVEFRONT ACTIVE • SENSORS BLINDED • AVIONICS REBOOTING ⚡', this.width / 2, 44);
    ctx.restore();
  }

  /**
   * Draw Sky Gradient & Parallax Horizons per Theater
   */
  drawSky(ctx, skySprite, mapType = 'EUROPEAN') {
    if (mapType === 'SIBERIA') {
      // SIBERIAN ARCTIC SKY: Deep twilight navy, aurora violet, cold icy horizon
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#060d1f');    // Deep arctic zenith
      grad.addColorStop(0.35, '#162642'); // Steel navy
      grad.addColorStop(0.70, '#314f73'); // Cold twilight blue
      grad.addColorStop(1, '#759bbd');    // Glacial horizon light
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Distant snow-capped jagged mountain peaks (parallax)
      this.drawDistantSnowMountains(ctx);

    } else if (mapType === 'DESERT') {
      // DESERT STORM TWILIGHT: Midnight blue, dusk purple, burning horizon glow
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#060814');    // Desert night zenith
      grad.addColorStop(0.35, '#1e172a'); // Twilight purple
      grad.addColorStop(0.70, '#452422'); // Warm dusk ochre
      grad.addColorStop(1, '#703822');    // Burning oil glow on horizon
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Distant sand dune silhouettes
      this.drawDistantDunes(ctx);

    } else {
      // AIRCRAFT EVOLUTION GOLDEN HOUR SUNSET ATMOSPHERE
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#586f87');    // Dusky slate-blue zenith
      grad.addColorStop(0.20, '#7f7a8b'); // Soft twilight mauve
      grad.addColorStop(0.45, '#bd8c7e'); // Dusty peach rose
      grad.addColorStop(0.70, '#f0ad78'); // Radiant salmon-amber
      grad.addColorStop(0.92, '#ffcd8e'); // Luminous golden horizon glow
      grad.addColorStop(1, '#ffe0a8');    // Warm sun-washed horizon light
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Procedural 3-Layer Alpine Mountain Ranges (Far Snowy Peaks + Autumn Ridges)
      this.drawDistantEuropeanMountains(ctx);

      // Mirrored seamless sky clouds if sprite available
      if (skySprite && skySprite.complete && skySprite.height > 0 && skySprite.width > 0) {
        ctx.save();
        ctx.globalAlpha = 0.22; // Soft atmospheric blend
        const targetH = this.height * 0.65;
        const scale = targetH / skySprite.height;
        const tileW = Math.max(10, Math.round(skySprite.width * scale));

        const offset = (this.cameraX * 0.14);
        const firstTileIndex = Math.floor(offset / tileW) - 1;
        const lastTileIndex = Math.ceil((offset + this.width) / tileW) + 1;

        for (let i = firstTileIndex; i <= lastTileIndex; i++) {
          const screenX = i * tileW - offset;
          const isFlipped = Math.abs(i) % 2 === 1;

          ctx.save();
          if (isFlipped) {
            ctx.translate(screenX + tileW, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(skySprite, 0, 0, tileW, targetH);
          } else {
            ctx.drawImage(skySprite, screenX, 0, tileW, targetH);
          }
          ctx.restore();
        }
        ctx.restore();
      }
    }

    // Dynamic Weather Ambient Sky Shading
    if (this.currentWeather === 'THUNDERSTORM' || this.currentWeather === 'RAIN' || this.currentWeather === 'CLOUDY') {
      ctx.save();
      const stormAlpha = this.currentWeather === 'THUNDERSTORM' ? 0.45 : (this.currentWeather === 'RAIN' ? 0.28 : 0.16);
      ctx.fillStyle = `rgba(12, 18, 28, ${stormAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  // Distant 3-Layer European Alpine Mountain Ranges (Deep Parallax & Atmospheric Haze)
  drawDistantEuropeanMountains(ctx) {
    ctx.save();

    // 0. Soft Horizon Sunlight Haze Backlight & Hollywood Anamorphic Sun Flare (Aircraft Evolution REA)
    const sunGrad = ctx.createRadialGradient(this.width / 2, 480, 50, this.width / 2, 480, 520);
    sunGrad.addColorStop(0, 'rgba(255, 235, 190, 0.28)');
    sunGrad.addColorStop(0.5, 'rgba(210, 235, 255, 0.15)');
    sunGrad.addColorStop(1, 'rgba(160, 205, 255, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 200, this.width, this.height - 200);

    // Cinematic Hollywood Horizon Sun Disk & Flare Streak
    const sunX = ((this.width * 0.76 - this.cameraX * 0.02) % (this.width * 1.6) + this.width * 1.6) % (this.width * 1.6) - this.width * 0.3;
    const sunY = 310;
    if (sunX > -250 && sunX < this.width + 250) {
      // Radiant Solar Corona
      const corona = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 130);
      corona.addColorStop(0, 'rgba(255, 255, 235, 0.75)');
      corona.addColorStop(0.25, 'rgba(255, 215, 130, 0.38)');
      corona.addColorStop(0.60, 'rgba(255, 160, 60, 0.12)');
      corona.addColorStop(1, 'rgba(255, 100, 20, 0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
      ctx.fill();

      // Hollywood Anamorphic Horizontal Flare Beam
      const flareBeam = ctx.createLinearGradient(sunX - 280, sunY, sunX + 280, sunY);
      flareBeam.addColorStop(0, 'rgba(120, 210, 255, 0)');
      flareBeam.addColorStop(0.35, 'rgba(180, 230, 255, 0.22)');
      flareBeam.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
      flareBeam.addColorStop(0.65, 'rgba(255, 210, 140, 0.22)');
      flareBeam.addColorStop(1, 'rgba(255, 150, 50, 0)');
      ctx.fillStyle = flareBeam;
      ctx.fillRect(sunX - 280, sunY - 2.5, 560, 5);
    }

    // --- 1. Far Distant Snow-Capped Alpine Mountain Peaks (Aircraft Evolution REA) ---
    const farOffset = this.cameraX * 0.04;
    const farBaseY = 490;
    const farGrad = ctx.createLinearGradient(0, farBaseY - 175, 0, this.height);
    farGrad.addColorStop(0, '#536b85');    // Cool alpine slate
    farGrad.addColorStop(0.35, '#3b4e63'); // Deep mountain shadow
    farGrad.addColorStop(1, '#202b38');    // Valley shadow
    ctx.fillStyle = farGrad;

    const farRidgePoints = [];
    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 12) {
      const wx = x + farOffset;
      // Majestic alpine crags with sharp angular peaks
      const h = Math.abs(Math.sin(wx * 0.0022)) * 135 + Math.cos(wx * 0.0058) * 45 + Math.sin(wx * 0.012) * 18;
      const py = farBaseY - h;
      farRidgePoints.push({ x, y: py, wx });
      ctx.lineTo(x, py);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();

    // 1b. Glistening Alpine Snow Mantle on Sunward Slopes
    const snowGrad = ctx.createLinearGradient(0, farBaseY - 180, 0, farBaseY - 80);
    snowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); // Sunlit crisp snow
    snowGrad.addColorStop(0.65, 'rgba(226, 238, 248, 0.78)');
    snowGrad.addColorStop(1, 'rgba(180, 202, 224, 0.0)');
    ctx.fillStyle = snowGrad;

    ctx.beginPath();
    let snowStarted = false;
    for (const pt of farRidgePoints) {
      if (pt.y < farBaseY - 55) {
        if (!snowStarted) {
          ctx.moveTo(pt.x, pt.y);
          snowStarted = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      } else if (snowStarted) {
        ctx.lineTo(pt.x, pt.y + 12);
        snowStarted = false;
      }
    }
    ctx.lineTo(this.width + 20, farBaseY - 30);
    ctx.lineTo(-20, farBaseY - 30);
    ctx.closePath();
    ctx.fill();

    // --- 2. Midground Autumn Forest Ridge (Parallax: 0.09) ---
    const midOffset = this.cameraX * 0.09;
    const midBaseY = 512;
    const midGrad = ctx.createLinearGradient(0, midBaseY - 120, 0, this.height);
    midGrad.addColorStop(0, 'rgba(120, 53, 15, 0.85)');   // Autumn russet/amber
    midGrad.addColorStop(0.35, 'rgba(90, 40, 12, 0.92)'); // Deep timber brown
    midGrad.addColorStop(1, 'rgba(35, 18, 8, 1.0)');      // Deep valley shadow
    ctx.fillStyle = midGrad;

    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 12) {
      const wx = x + midOffset;
      const h = Math.sin(wx * 0.0028) * 85 + Math.cos(wx * 0.0068) * 42 + Math.sin(wx * 0.015) * 16;
      ctx.lineTo(x, midBaseY - h);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();

    // --- 3. Near Rolling Autumn Foothills Ridge (Parallax: 0.16) ---
    const nearOffset = this.cameraX * 0.16;
    const nearBaseY = 535;
    const nearGrad = ctx.createLinearGradient(0, nearBaseY - 75, 0, this.height);
    nearGrad.addColorStop(0, 'rgba(68, 42, 22, 0.96)');   // Earthen foothill
    nearGrad.addColorStop(0.5, 'rgba(42, 24, 12, 0.98)');
    nearGrad.addColorStop(1, 'rgba(20, 10, 5, 1.0)');
    ctx.fillStyle = nearGrad;

    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 10) {
      const wx = x + nearOffset;
      const h = Math.sin(wx * 0.0038) * 55 + Math.cos(wx * 0.0085) * 28 + Math.sin(wx * 0.019) * 10;
      ctx.lineTo(x, nearBaseY - h);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Distant Smooth Arctic Mountain Ranges for Siberia
  drawDistantSnowMountains(ctx) {
    ctx.save();
    
    // --- 1. Distant Misty Background Mountain Ridge (Parallax: 0.05) ---
    const farOffset = this.cameraX * 0.05;
    const farBaseY = 510;
    const farGrad = ctx.createLinearGradient(0, farBaseY - 140, 0, this.height);
    farGrad.addColorStop(0, 'rgba(45, 68, 98, 0.55)');
    farGrad.addColorStop(0.5, 'rgba(25, 42, 65, 0.75)');
    farGrad.addColorStop(1, 'rgba(12, 22, 38, 0.90)');
    ctx.fillStyle = farGrad;

    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 15) {
      const wx = x + farOffset;
      const h = Math.sin(wx * 0.0022) * 90 + Math.cos(wx * 0.0055) * 45 + Math.sin(wx * 0.011) * 20;
      ctx.lineTo(x, farBaseY - h);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();

    // --- 2. Near Alpine Mountain Ridge (Parallax: 0.11) ---
    const nearOffset = this.cameraX * 0.11;
    const nearBaseY = 530;
    const nearGrad = ctx.createLinearGradient(0, nearBaseY - 170, 0, this.height);
    nearGrad.addColorStop(0, 'rgba(75, 105, 138, 0.92)'); // Cool arctic slate
    nearGrad.addColorStop(0.35, 'rgba(38, 58, 82, 0.95)'); // Deep mountain body
    nearGrad.addColorStop(1, 'rgba(14, 25, 40, 1.0)');     // Dark base
    ctx.fillStyle = nearGrad;

    // Cache ridge points to draw continuous snow mantle perfectly over it
    const ridgePoints = [];
    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 12) {
      const wx = x + nearOffset;
      const h = Math.sin(wx * 0.0031) * 115 + Math.sin(wx * 0.0078) * 55 + Math.cos(wx * 0.016) * 18;
      const py = nearBaseY - h;
      ridgePoints.push({ x, y: py, wx });
      ctx.lineTo(x, py);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();

    // --- 3. Seamless Atmospheric Snow Caps (Continuous, organic mantle - NO sharp triangles!) ---
    const snowGrad = ctx.createLinearGradient(0, nearBaseY - 180, 0, nearBaseY - 60);
    snowGrad.addColorStop(0, 'rgba(250, 253, 255, 0.95)'); // Crisp alpine snow crest
    snowGrad.addColorStop(0.5, 'rgba(215, 235, 255, 0.85)'); // Soft ice blue
    snowGrad.addColorStop(1, 'rgba(140, 185, 225, 0.0)');  // Soft atmospheric fade into rock
    ctx.fillStyle = snowGrad;

    ctx.beginPath();
    ctx.moveTo(ridgePoints[0].x, ridgePoints[0].y);
    for (let i = 1; i < ridgePoints.length; i++) {
      ctx.lineTo(ridgePoints[i].x, ridgePoints[i].y);
    }
    // Form lower snowline border that naturally dips down ridges
    for (let i = ridgePoints.length - 1; i >= 0; i--) {
      const pt = ridgePoints[i];
      const snowDepth = 22 + Math.sin(pt.wx * 0.008) * 12 + Math.cos(pt.wx * 0.019) * 8;
      ctx.lineTo(pt.x, pt.y + Math.max(14, snowDepth));
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Distant Smooth Golden Sand Dunes for Desert
  drawDistantDunes(ctx) {
    ctx.save();
    const offset = this.cameraX * 0.09;
    const baseDuneY = 520;

    const duneGrad = ctx.createLinearGradient(0, baseDuneY - 110, 0, this.height);
    duneGrad.addColorStop(0, 'rgba(180, 95, 45, 0.75)');
    duneGrad.addColorStop(0.4, 'rgba(105, 48, 22, 0.85)');
    duneGrad.addColorStop(1, 'rgba(40, 15, 8, 0.95)');
    ctx.fillStyle = duneGrad;

    ctx.beginPath();
    ctx.moveTo(-20, this.height);
    for (let x = -20; x <= this.width + 20; x += 15) {
      const wx = x + offset;
      const dune = Math.sin(wx * 0.0032) * 80 + Math.cos(wx * 0.0075) * 35;
      ctx.lineTo(x, baseDuneY - dune);
    }
    ctx.lineTo(this.width + 20, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Sweeping Military Searchlights across Desert Sky
  drawSearchlights(ctx, terrain) {
    ctx.save();
    const time = Date.now() * 0.001;

    for (let i = 0; i < this.searchlights.length; i++) {
      const sl = this.searchlights[i];
      const sx = sl.x - this.cameraX;
      if (sx < -200 || sx > this.width + 200) continue;

      const groundY = terrain ? terrain.getHeightAt(sl.x) : 560;
      const angle = sl.baseAngle + Math.sin(time * 0.8 + i * 2) * 0.55;

      const endX = sx + Math.cos(angle) * sl.length;
      const endY = groundY + Math.sin(angle) * sl.length;

      // Draw searchlight beam gradient
      const grad = ctx.createLinearGradient(sx, groundY, endX, endY);
      grad.addColorStop(0, 'rgba(255, 255, 200, 0.65)');
      grad.addColorStop(0.3, 'rgba(255, 255, 180, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 150, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx - 8, groundY);
      ctx.lineTo(endX - sl.width, endY);
      ctx.lineTo(endX + sl.width, endY);
      ctx.lineTo(sx + 8, groundY);
      ctx.closePath();
      ctx.fill();

      // Searchlight watchtower base
      ctx.fillStyle = '#1a1816';
      ctx.fillRect(sx - 6, groundY - 24, 12, 24);
      ctx.fillStyle = '#ffea88';
      ctx.beginPath();
      ctx.arc(sx, groundY - 24, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Siberian Active Blizzard Particles
  drawBlizzard(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (const s of this.snowParticles) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Desert Rising Oil Fire Embers & Heat Particles
  drawOilEmbers(ctx) {
    ctx.save();
    for (const p of this.oilFireParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAmbientClouds(ctx) {
    ctx.save();
    // Aircraft Evolution Painterly Volumetric Cumulus Clouds
    for (const c of this.ambientClouds) {
      const parallax = c.parallax || 0.22;
      const sx = c.x - this.cameraX * parallax;
      // Wrap smoothly around 5400px loop
      const wrapW = 5400;
      let renderX = ((sx % wrapW) + wrapW) % wrapW - 200;
      if (renderX < -350 || renderX > this.width + 350) continue;

      ctx.save();
      const cloudW = c.size * 3.2;
      const cloudH = c.size * 1.1;

      // 1. Shaded underside shadow (warm lilac/lavender gray)
      ctx.fillStyle = 'rgba(132, 118, 128, 0.42)';
      ctx.beginPath();
      ctx.ellipse(renderX, c.y + cloudH * 0.22, cloudW * 0.52, cloudH * 0.42, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX - cloudW * 0.26, c.y + cloudH * 0.26, cloudW * 0.36, cloudH * 0.36, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX + cloudW * 0.28, c.y + cloudH * 0.24, cloudW * 0.38, cloudH * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Midtone warm peach-cream body
      ctx.fillStyle = 'rgba(240, 228, 220, 0.70)';
      ctx.beginPath();
      ctx.ellipse(renderX, c.y, cloudW * 0.48, cloudH * 0.38, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX - cloudW * 0.22, c.y + 2, cloudW * 0.34, cloudH * 0.34, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX + cloudW * 0.24, c.y - 1, cloudW * 0.36, cloudH * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Sun-kissed golden/ivory crest highlights
      ctx.fillStyle = 'rgba(255, 252, 246, 0.90)';
      ctx.beginPath();
      ctx.ellipse(renderX, c.y - cloudH * 0.18, cloudW * 0.38, cloudH * 0.30, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX - cloudW * 0.20, c.y - cloudH * 0.14, cloudW * 0.26, cloudH * 0.26, 0, 0, Math.PI * 2);
      ctx.ellipse(renderX + cloudW * 0.20, c.y - cloudH * 0.16, cloudW * 0.28, cloudH * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  drawFloatingTexts(ctx) {
    ctx.save();
    ctx.font = 'bold 15px "Courier New", monospace';
    for (const ft of this.floatingTexts) {
      const sx = ft.x - this.cameraX;
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, sx - 20, ft.y);
    }
    ctx.restore();
  }
}

window.RenderEngine = RenderEngine;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderEngine;
}
