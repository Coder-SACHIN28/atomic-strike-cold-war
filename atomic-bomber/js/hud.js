/**
 * Atomic Bomber - Head-Up Display (HUD) & Threat Radar
 * Includes RWR (Radar Warning Receiver) early warning arrows,
 * authentic flight telemetry dials, ordnance status, and mobile touch HUD.
 * Completely eliminates text overlap and UI clipping.
 */

class HUD {
  constructor(game) {
    this.game = game;
    this.radarBlink = 0;
    this.tutorialAlpha = {
      steer: 1.0,
      bomb: 1.0,
      cannon: 1.0,
      flare: 1.0
    };
    this.onboardingTimer = 0;
  }

  reset() {
    this.radarBlink = 0;
    this.tutorialAlpha = {
      steer: 1.0,
      bomb: 1.0,
      cannon: 1.0,
      flare: 1.0
    };
    this.onboardingTimer = 0;
  }

  update() {
    this.radarBlink = (this.radarBlink + 1) % 40;
    this.onboardingTimer++;

    // Track user input to dynamically dismiss onboarding badges as actions are taken
    const input = this.game.input;
    if (input && input.keys) {
      if (input.keys['ArrowUp'] || input.keys['ArrowDown'] || input.keys['ArrowLeft'] || input.keys['ArrowRight'] ||
          input.keys['KeyW'] || input.keys['KeyS'] || input.keys['KeyA'] || input.keys['KeyD']) {
        this.tutorialAlpha.steer = Math.max(0, this.tutorialAlpha.steer - 0.04);
      }
      if (input.keys['Space'] || input.keys[' ']) {
        this.tutorialAlpha.bomb = Math.max(0, this.tutorialAlpha.bomb - 0.04);
      }
      if (input.keys['KeyJ'] || input.keys['KeyC']) {
        this.tutorialAlpha.cannon = Math.max(0, this.tutorialAlpha.cannon - 0.04);
      }
      if (input.keys['KeyF']) {
        this.tutorialAlpha.flare = Math.max(0, this.tutorialAlpha.flare - 0.04);
      }
    }
  }

  draw(ctx, width, height) {
    const player = this.game.entities.player;
    if (!player) return;

    ctx.save();

    // 1. Draw RWR (Radar Warning Receiver) Early Threat Arrows
    this.drawThreatWarnings(ctx, width, height, player);

    // 2. Draw Top Flight Instrument Bar (Clean layout, no button overlap)
    this.drawFlightInstruments(ctx, width, player);

    // 2.5 Draw Tactical Weapon Suggestion Assistant (AI Combat Advisor)
    this.drawCombatAdvisory(ctx, width, height, player);

    // 3. Draw Ordnance & Munitions Panel (Unified, generous padding, zero text overlap)
    this.drawOrdnanceStatus(ctx, width, height, player);

    // 3.5 Draw First 15-25s Dynamic Mission HUD Onboarding Tutorial Badges
    this.drawMissionOnboarding(ctx, width, height, player);

    // 4. Draw On-Screen Touch Controls if on mobile/touch device
    if (this.game.input.touchControlsActive) {
      this.drawTouchControls(ctx, width, height);
    }

    // 5. Draw Active Tactical Radio Comms Transmission Popup
    this.drawRadioTransmission(ctx, width, height);

    ctx.restore();
  }

  /**
   * RWR Early Threat Warning System
   * Direct fix for player complaint: "MiG shoots me down from off-screen"
   */
  drawThreatWarnings(ctx, width, height, player) {
    const cameraX = this.game.cameraX;
    const sprites = this.game.sprites;
    const migWarningSprite = sprites['migwarning.png'];

    // 1. Check Off-Screen MiGs
    for (const mig of this.game.entities.migs) {
      if (!mig.alive) continue;
      const screenX = mig.x - cameraX;
      if (screenX < -20 || screenX > width + 20) {
        const isLeft = screenX < 0;
        const arrowX = isLeft ? 35 : width - 35;
        const arrowY = Math.max(70, Math.min(height - 120, mig.y));

        ctx.save();
        ctx.fillStyle = this.radarBlink < 20 ? '#ff2222' : '#ff8800';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        // Draw Warning Chevron
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(arrowX + 14, arrowY - 10);
          ctx.lineTo(arrowX - 6, arrowY);
          ctx.lineTo(arrowX + 14, arrowY + 10);
        } else {
          ctx.moveTo(arrowX - 14, arrowY - 10);
          ctx.lineTo(arrowX + 6, arrowY);
          ctx.lineTo(arrowX - 14, arrowY + 10);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Alert Icon
        if (migWarningSprite && migWarningSprite.complete) {
          ctx.drawImage(migWarningSprite, isLeft ? arrowX + 16 : arrowX - 45, arrowY - 12);
        }

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.fillText(mig.name || 'BANDIT', isLeft ? arrowX + 16 : arrowX - 60, arrowY + 18);
        ctx.restore();
      }
    }

    // Calculate non-overlapping vertical stack for warning banners
    const hasRadio = (this.game.activeRadioMessage && this.game.activeRadioMessage.timer > 0);
    const hasGrace = (this.game.waveGraceTimer && this.game.waveGraceTimer > 0);
    let nextBannerY = hasGrace ? 140 : (hasRadio ? 100 : 36);

    // Active 6 o'clock Bandit Tailing Alert Box
    const tailingBandit = this.game.entities.migs.find(m => m.alive && m.isPursuing);
    if (tailingBandit && player && player.alive) {
      ctx.save();
      const warnBoxW = 400;
      const warnBoxH = 26;
      const warnBoxX = width / 2 - warnBoxW / 2;
      const warnBoxY = nextBannerY;
      nextBannerY += 30;

      ctx.fillStyle = this.radarBlink < 20 ? 'rgba(220, 20, 20, 0.94)' : 'rgba(140, 10, 10, 0.90)';
      ctx.fillRect(warnBoxX, warnBoxY, warnBoxW, warnBoxH);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(warnBoxX, warnBoxY, warnBoxW, warnBoxH);

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      const flareHint = player.flares > 0 ? `• [F] DROP FLARES (${player.flares})` : '• EVADE HARD!';
      ctx.fillText(`⚠️ BANDIT ON YOUR SIX: ${tailingBandit.name} ${flareHint}`, width / 2, warnBoxY + 17);
      ctx.restore();
    }

    // Active Dynamic Stall Warning Alert Box
    if (player && player.alive && player.isStalling && player.stallTimer > 18) {
      ctx.save();
      const stallBoxW = 430;
      const stallBoxH = 26;
      const stallBoxX = width / 2 - stallBoxW / 2;
      const stallBoxY = nextBannerY;
      nextBannerY += 30;

      ctx.fillStyle = this.radarBlink < 20 ? 'rgba(255, 30, 30, 0.95)' : 'rgba(180, 0, 0, 0.90)';
      ctx.fillRect(stallBoxX, stallBoxY, stallBoxW, stallBoxH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(stallBoxX, stallBoxY, stallBoxW, stallBoxH);

      ctx.textAlign = 'center';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('⚠️ CRITICAL STALL WARNING • PULL NOSE DOWN TO RECOVER ⚠️', width / 2, stallBoxY + 18);
      ctx.restore();
    }

    // 1b. Active GPWS Ground Proximity Warning Alert Box ("PULL UP! TERRAIN CLOSE!")
    if (player && player.alive && player.isPullUpWarning) {
      ctx.save();
      const gpwsBoxW = 440;
      const gpwsBoxH = 28;
      const gpwsBoxX = width / 2 - gpwsBoxW / 2;
      const gpwsBoxY = nextBannerY;
      nextBannerY += 32;

      ctx.fillStyle = this.radarBlink < 20 ? 'rgba(255, 20, 20, 0.96)' : 'rgba(160, 0, 0, 0.92)';
      ctx.fillRect(gpwsBoxX, gpwsBoxY, gpwsBoxW, gpwsBoxH);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(gpwsBoxX, gpwsBoxY, gpwsBoxW, gpwsBoxH);

      ctx.textAlign = 'center';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('⚠️ TERRAIN AHEAD • PULL UP! PULL UP! ⚠️', width / 2, gpwsBoxY + 19);
      ctx.restore();
    }

    // 1c. Active Fuel Warning Alert Box (Aircraft Evolution REA)
    if (player && player.alive) {
      const fuel = (player.fuel !== undefined) ? player.fuel : 100;
      if (fuel <= 0) {
        ctx.save();
        const fuelBoxW = 480;
        const fuelBoxH = 28;
        const fuelBoxX = width / 2 - fuelBoxW / 2;
        const fuelBoxY = nextBannerY;
        nextBannerY += 32;

        ctx.fillStyle = this.radarBlink < 20 ? 'rgba(239, 68, 68, 0.96)' : 'rgba(185, 28, 28, 0.90)';
        ctx.fillRect(fuelBoxX, fuelBoxY, fuelBoxW, fuelBoxH);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(fuelBoxX, fuelBoxY, fuelBoxW, fuelBoxH);

        ctx.textAlign = 'center';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('⚠️ ENGINE FLAMEOUT! ZERO FUEL • GLIDING • GET FUEL CRATE! ⚠️', width / 2, fuelBoxY + 19);
        ctx.restore();
      } else if (fuel < 25) {
        ctx.save();
        const fuelBoxW = 430;
        const fuelBoxH = 26;
        const fuelBoxX = width / 2 - fuelBoxW / 2;
        const fuelBoxY = nextBannerY;
        nextBannerY += 30;

        ctx.fillStyle = this.radarBlink < 20 ? 'rgba(245, 158, 11, 0.94)' : 'rgba(180, 83, 9, 0.90)';
        ctx.fillRect(fuelBoxX, fuelBoxY, fuelBoxW, fuelBoxH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(fuelBoxX, fuelBoxY, fuelBoxW, fuelBoxH);

        ctx.textAlign = 'center';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(`⚠️ LOW FUEL WARNING [${Math.round(fuel)}%] • REFUEL VIA JERRYCAN CRATE! ⚠️`, width / 2, fuelBoxY + 17);
        ctx.restore();
      }
    }

    // 1d. Active Armored War Zeppelin Dreadnought Boss Bar (Aircraft Evolution REA)
    const activeZeppelin = this.game.entities.zeppelins && this.game.entities.zeppelins.find(z => z.alive);
    if (activeZeppelin) {
      ctx.save();
      const bossBarW = 460;
      const bossBarH = 26;
      const bossBarX = width / 2 - bossBarW / 2;
      const bossBarY = nextBannerY;
      nextBannerY += 32;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fillRect(bossBarX, bossBarY, bossBarW, bossBarH);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

      const zRatio = Math.max(0, Math.min(1, activeZeppelin.hp / activeZeppelin.maxHp));
      const grad = ctx.createLinearGradient(bossBarX, bossBarY, bossBarX + bossBarW, bossBarY);
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.fillRect(bossBarX + 2, bossBarY + 2, (bossBarW - 4) * zRatio, bossBarH - 4);

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      const zCur = Math.round(Math.max(0, activeZeppelin.hp));
      const zMax = Math.round(activeZeppelin.maxHp);
      ctx.fillText(`☠️ KIROV WAR ZEPPELIN DREADNOUGHT • ${zCur}/${zMax} HP (${Math.round(zRatio * 100)}%) ☠️`, width / 2, bossBarY + 17);
      ctx.restore();
    }

    // 2. Check Incoming SAM Missiles
    for (const sam of this.game.entities.samMissiles) {
      if (!sam.alive) continue;
      const screenX = sam.x - cameraX;
      if (screenX < -15 || screenX > width + 15) {
        const isLeft = screenX < 0;
        const arrowX = isLeft ? 25 : width - 25;
        const arrowY = Math.max(60, Math.min(height - 100, sam.y));

        ctx.save();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(arrowX, arrowY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('SAM', isLeft ? arrowX + 10 : arrowX - 30, arrowY + 4);
        ctx.restore();
      }
    }

    // 3. Check High-Altitude Parachute Sky Airdrops (Clean tactical pointers, max 2)
    let markerCount = 0;
    for (const crate of this.game.entities.bonusCrates) {
      if (!crate.alive) continue;
      if (markerCount >= 2) break; // Keep HUD clean and uncluttered
      const screenX = crate.x - cameraX;

      // Prioritize airborne drops in the sky, or nearby ground crates
      if (!crate.isGrounded || Math.abs(screenX) < width * 1.2) {
        if (screenX < -20 || screenX > width + 20 || crate.y < 50) {
          markerCount++;
          const isLeft = screenX < 0;
          const markerX = isLeft ? 40 : (screenX > width ? width - 40 : screenX);
          const markerY = Math.max(55, Math.min(height - 110, crate.y));

          ctx.save();
          ctx.fillStyle = this.radarBlink < 20 ? '#55ffff' : '#00ddbb';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;

          // Diamond marker
          ctx.beginPath();
          ctx.moveTo(markerX, markerY - 7);
          ctx.lineTo(markerX + 7, markerY);
          ctx.lineTo(markerX, markerY + 7);
          ctx.lineTo(markerX - 7, markerY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#55ffff';
          const label = crate.isGrounded ? 'CRATE' : 'AIRDROP';
          ctx.fillText(label, isLeft ? markerX + 10 : markerX - 35, markerY + 4);
          ctx.restore();
        }
      }
    }
  }

  drawFlightInstruments(ctx, width, player) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Sleek frosted floating glass instrument bar
    const barH = 38;
    ctx.fillStyle = 'rgba(10, 16, 24, 0.45)';
    ctx.fillRect(0, 0, width, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(width, barH);
    ctx.stroke();

    // ========================================================
    // 1. CAPSULE 1: WRENCH HEALTH METER (Aircraft Evolution Style)
    // ========================================================
    const hpX = 22;
    const hpY = 8;
    const hpBarW = 110;
    const hpBarH = 22;
    const badgeR = 13;

    // Capsule track body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(hpX + badgeR, hpY + 2, hpBarW, hpBarH - 4, [0, 9, 9, 0]);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Health Fill (Electric Cyan to Sky Blue)
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    const hpGrad = ctx.createLinearGradient(hpX + badgeR, 0, hpX + badgeR + hpBarW, 0);
    if (hpRatio < 0.28) {
      hpGrad.addColorStop(0, this.radarBlink < 20 ? '#ef4444' : '#dc2626');
      hpGrad.addColorStop(1, '#f87171');
    } else {
      hpGrad.addColorStop(0, '#0284c7');
      hpGrad.addColorStop(0.5, '#0ea5e9');
      hpGrad.addColorStop(1, '#38bdf8');
    }
    ctx.fillStyle = hpGrad;
    if (hpRatio > 0.02) {
      ctx.beginPath();
      ctx.roundRect(hpX + badgeR + 1, hpY + 3, (hpBarW - 2) * hpRatio, hpBarH - 6, [0, 7, 7, 0]);
      ctx.fill();
    }

    // Wrench Circular Badge (Gunmetal Bezel)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(hpX + badgeR, hpY + hpBarH / 2, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Crossed Wrench Vector Icon
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hpX + badgeR - 6, hpY + hpBarH / 2 - 6);
    ctx.lineTo(hpX + badgeR + 6, hpY + hpBarH / 2 + 6);
    ctx.moveTo(hpX + badgeR + 6, hpY + hpBarH / 2 - 6);
    ctx.lineTo(hpX + badgeR - 6, hpY + hpBarH / 2 + 6);
    ctx.stroke();

    // HP Text inside bar
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.round(player.hp)} HP`, hpX + badgeR + hpBarW / 2, hpY + hpBarH / 2);
    ctx.shadowBlur = 0;

    // ========================================================
    // 2. CAPSULE 2: JERRYCAN FUEL METER (Aircraft Evolution Style)
    // ========================================================
    const fX = 162;
    const fY = 8;
    const fBarW = 100;
    const fBarH = 22;

    // Capsule track body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(fX + badgeR, fY + 2, fBarW, fBarH - 4, [0, 9, 9, 0]);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Fuel Fill (Amber / Golden Orange)
    const fuelVal = (player.fuel !== undefined) ? player.fuel : 100;
    const fuelRatio = Math.max(0, Math.min(1, fuelVal / (player.maxFuel || 100)));
    const fGrad = ctx.createLinearGradient(fX + badgeR, 0, fX + badgeR + fBarW, 0);
    if (fuelRatio < 0.25) {
      fGrad.addColorStop(0, this.radarBlink < 20 ? '#ef4444' : '#f59e0b');
      fGrad.addColorStop(1, '#fbbf24');
    } else {
      fGrad.addColorStop(0, '#d97706');
      fGrad.addColorStop(0.5, '#f59e0b');
      fGrad.addColorStop(1, '#fbbf24');
    }
    ctx.fillStyle = fGrad;
    if (fuelRatio > 0.02) {
      ctx.beginPath();
      ctx.roundRect(fX + badgeR + 1, fY + 3, (fBarW - 2) * fuelRatio, fBarH - 6, [0, 7, 7, 0]);
      ctx.fill();
    }

    // Fuel Canister Badge (Gunmetal Bezel)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(fX + badgeR, fY + fBarH / 2, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Jerrycan Icon
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(fX + badgeR - 4, fY + fBarH / 2 - 5, 8, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(fX + badgeR - 4, fY + fBarH / 2 - 5, 8, 10);

    // Fuel Text inside bar
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.round(fuelRatio * 100)}%`, fX + badgeR + fBarW / 2, fY + fBarH / 2);
    ctx.shadowBlur = 0;

    // ========================================================
    // 3. FLIGHT TELEMETRY (KTS & ALT) & WEP BOOST
    // ========================================================
    const kts = Math.round(player.currentSpeed * 65);
    const groundY = this.game.terrain ? this.game.terrain.getHeightAt(player.x) : 520;
    const altFt = Math.max(0, Math.round((groundY - player.y) * 12));

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`KTS: ${kts}  ALT: ${altFt} FT`, 292, 19);

    // WEP / Boost
    const boostRatio = Math.max(0, Math.min(1, (player.boostFuel || 100) / (player.maxBoostFuel || 100)));
    const bBarX = 445;
    const bBarY = 10;
    const bBarW = 55;
    const bBarH = 18;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('WEP:', bBarX - 30, 19);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bBarX, bBarY, bBarW, bBarH);
    ctx.strokeStyle = player.isBoosting ? '#00ffff' : '#334155';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bBarX, bBarY, bBarW, bBarH);
    ctx.fillStyle = player.isBoosting ? '#00e5ff' : '#0284c7';
    ctx.fillRect(bBarX + 1, bBarY + 1, (bBarW - 2) * boostRatio, bBarH - 2);

    // ========================================================
    // 4. MISSION WAVE & TARGET STATUS BADGE
    // ========================================================
    const aliveTargets = this.game.entities.enemies.filter(
      (e) => this.game.entities.isObjectiveTarget(e)
    ).length;
    const threat = this.game.getThreatLevelInfo ? this.game.getThreatLevelInfo(this.game.currentWave) : { level: 'NORMAL', color: '#55ff55' };
    ctx.fillStyle = threat.color;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`WAVE ${this.game.currentWave} [${threat.level}] • FOES: ${aliveTargets}`, 522, 19);

    // ========================================================
    // 5. TOP-RIGHT MINIMALIST ORDNANCE ICONS (Aircraft Evolution Style)
    // ========================================================
    const ordX = width - 460;
    const ordY = 10;
    const ordItems = [
      { icon: '💣', label: `x${player.bombs}`, col: '#ffffff' },
      { icon: '💥', label: `x${player.clusters}`, col: '#38bdf8' },
      { icon: '⚔️', label: `${player.gau8Ammo}`, col: '#fef08a' },
      { icon: '🚀', label: `x${player.rocketAmmo}`, col: '#4ade80' },
      { icon: '🎯', label: `x${player.hellfireAmmo || 0}`, col: '#22d3ee' },
      { icon: '🔥', label: `x${player.napalmAmmo || 0}`, col: '#fb923c' },
      { icon: '⚡', label: `x${player.empBombs || 0}`, col: '#38bdf8' },
      { icon: '☢️', label: `x${player.nukes || 0}`, col: '#facc15' }
    ];

    let curItemX = ordX;
    for (const item of ordItems) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(curItemX, ordY, 48, 18, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = item.col;
      ctx.fillText(`${item.icon} ${item.label}`, curItemX + 24, ordY + 10);
      curItemX += 52;
    }

    // ========================================================
    // 6. OBJECTIVE NAVIGATION COMPASS CHEVRON IN THE SKY
    // ========================================================
    this.drawObjectiveCompass(ctx, width, player);

    ctx.restore();
  }

  drawObjectiveCompass(ctx, width, player) {
    if (!player || !player.alive) return;
    // Find nearest objective hostile target
    let nearestTarget = null;
    let minD = 999999;
    const candidates = [
      ...(this.game.entities.zeppelins || []),
      ...(this.game.entities.bombers || []),
      ...(this.game.entities.enemies || []).filter(e => e.alive && this.game.entities.isObjectiveTarget(e))
    ];

    for (const t of candidates) {
      if (!t.alive) continue;
      const d = Math.hypot(t.x - player.x, t.y - player.y);
      if (d < minD) {
        minD = d;
        nearestTarget = t;
      }
    }

    if (nearestTarget) {
      const aimAngle = Math.atan2(nearestTarget.y - player.y, nearestTarget.x - player.x);
      const chevronDist = 95;
      const pScreenX = player.x - this.game.cameraX;
      const pScreenY = player.y;

      // Keep within viewport circle
      const cx = Math.max(80, Math.min(width - 80, pScreenX + Math.cos(aimAngle) * chevronDist));
      const cy = Math.max(65, Math.min(600, pScreenY + Math.sin(aimAngle) * chevronDist));

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(aimAngle);

      // Gleaming golden compass chevron
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  drawOrdnanceStatus(ctx, width, height, player) {
    const sprites = this.game.sprites;
    const boxX = 14;
    const boxH = 46;
    const boxY = height - 52;
    const boxW = 760;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Sleek semi-transparent military glass HUD - never hides ground, valleys, or targets
    ctx.fillStyle = 'rgba(6, 16, 10, 0.28)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(0, 255, 120, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Text drop-shadow guarantees high contrast over terrain & sky
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

    // === ROW 1: Bombs, Clusters, Nukes, Flares ===
    const row1Y = boxY + 14;

    // 1. Heavy Iron Bombs (Inventory with pips, collect to reload)
    const bombIcon = sprites['bombicon.png'];
    if (bombIcon && bombIcon.complete) {
      ctx.drawImage(bombIcon, boxX + 10, row1Y - 8, 16, 16);
    }

    if (player.bombs > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`BOMBS [SPACE]: ${player.bombs}`, boxX + 30, row1Y);

      // Mini bomb pips (up to 8)
      const pipCount = Math.min(8, player.bombs);
      for (let b = 0; b < pipCount; b++) {
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(boxX + 185 + b * 5, row1Y - 5, 3, 10);
      }
    } else {
      ctx.fillStyle = this.radarBlink < 20 ? '#ffcc00' : '#ff4444';
      ctx.fillText('BOMBS: 0 (GET AIRDROP)', boxX + 30, row1Y);
    }

    // 2. Cluster Munitions
    ctx.fillStyle = player.clusters > 0 ? '#66ffff' : '#777777';
    ctx.fillText(`CLUSTER [C]: ${player.clusters}`, boxX + 270, row1Y);

    // 3. Tactical Nuclear Bomb
    const nukeIcon = sprites['nukeicon.png'];
    if (nukeIcon && nukeIcon.complete) {
      ctx.drawImage(nukeIcon, boxX + 415, row1Y - 8, 16, 16);
    }
    const nukeReady = player.nukes > 0;
    ctx.fillStyle = nukeReady ? (this.radarBlink < 20 ? '#ff3333' : '#ffff00') : '#777777';
    ctx.fillText(
      `NUKE [N]: ${nukeReady ? `ARMED (${player.nukes})` : 'EMPTY'}`,
      boxX + 438,
      row1Y
    );

    // 4. Flare Decoys
    ctx.fillStyle = player.flares > 0 ? '#ffaa00' : '#777777';
    ctx.fillText(`FLARES [F]: ${player.flares}`, boxX + 595, row1Y);

    // === ROW 2: Rapid-Fire Cannon, Rockets ===
    const row2Y = boxY + 32;

    // Cannon (All aircraft)
    const gau8Icon = sprites['gau8icon.png'];
    if (gau8Icon && gau8Icon.complete) {
      ctx.drawImage(gau8Icon, boxX + 10, row2Y - 8, 16, 16);
    }

    const gunNames = {
      standard: 'M61 20mm',
      a10: 'GAU-8 30mm',
      su25: 'GSh-30-2',
      cobra: 'M197 20mm',
      f14: 'M61A1 20mm',
      ac130: 'VULCAN 20mm',
      apache: 'M230 30mm',
      comanche: 'XM301 20mm',
      chinook: 'M134 MINIGUN',
      harrier: 'GAU-12 25mm'
    };
    const gunName = gunNames[player.model] || 'CANNON';
    if (player.gau8Ammo > 0) {
      ctx.fillStyle = player.hasDepletedUranium ? '#ffff00' : '#ffffff';
      ctx.fillText(
        `${gunName} [J/CLICK]: ${player.gau8Ammo}`,
        boxX + 30,
        row2Y
      );

      // Ammo gauge bar
      const ammoRatio = Math.min(1, player.gau8Ammo / 200);
      ctx.fillStyle = '#222222';
      ctx.fillRect(boxX + 185, row2Y - 4, 60, 8);
      ctx.fillStyle = player.hasDepletedUranium ? '#ffff00' : (ammoRatio > 0.25 ? '#00ff66' : '#ff3333');
      ctx.fillRect(boxX + 185, row2Y - 4, 60 * ammoRatio, 8);
      ctx.strokeStyle = '#445544';
      ctx.strokeRect(boxX + 185, row2Y - 4, 60, 8);
    } else {
      ctx.fillStyle = this.radarBlink < 20 ? '#ffaa00' : '#ff4444';
      ctx.fillText(`${gunName}: 0 (GET AIRDROP)`, boxX + 30, row2Y);
    }

    // Hydra 70 Rockets (All aircraft)
    const rocketIcon = sprites['rocketicon.png'];
    if (rocketIcon && rocketIcon.complete) {
      ctx.drawImage(rocketIcon, boxX + 270, row2Y - 8, 16, 16);
    }

    if (player.rocketAmmo > 0) {
      ctx.fillStyle = '#66ff66';
      ctx.fillText(`ROCKETS [K]: ${player.rocketAmmo}`, boxX + 292, row2Y);
    } else {
      ctx.fillStyle = this.radarBlink < 20 ? '#ffaa00' : '#777777';
      ctx.fillText('ROCKETS: 0', boxX + 292, row2Y);
    }

    // AGM-114 Hellfire Missiles [L]
    const hAmmo = player.hellfireAmmo || 0;
    if (hAmmo > 0) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`🎯 HELLFIRE [L]: ${hAmmo}`, boxX + 410, row2Y);
    } else {
      ctx.fillStyle = '#667788';
      ctx.fillText('🎯 HELLFIRE: 0', boxX + 410, row2Y);
    }

    // BLU-27 Napalm Firestorm Bombs [V]
    const nAmmo = player.napalmAmmo || 0;
    if (nAmmo > 0) {
      ctx.fillStyle = '#ff7700';
      ctx.fillText(`🔥 NAPALM [V]: ${nAmmo}`, boxX + 540, row2Y);
    } else {
      ctx.fillStyle = '#886655';
      ctx.fillText('🔥 NAPALM: 0', boxX + 540, row2Y);
    }

    // Lightning EMP Shock Bombs [M] (Aircraft Evolution REA)
    const empAmmo = player.empBombs || 0;
    if (empAmmo > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`⚡ EMP [M]: ${empAmmo}`, boxX + 665, row2Y);
    } else {
      ctx.fillStyle = '#475569';
      ctx.fillText('⚡ EMP: 0', boxX + 665, row2Y);
    }

    // ==========================================
    // 4. DEDICATED TACTICAL AIR SUPPORT PANEL [H]
    // ==========================================
    const supBtnX = 780;
    const supBtnY = boxY;
    const supBtnW = 98;
    const supBtnH = boxH;

    const cooldown = this.game.wingmenCooldown || 0;
    const freeAvail = !this.game.wingmenFreeUsed;
    const hasCash = player.credits >= (this.game.wingmenCost || 1500);

    let btnBg = 'rgba(10, 36, 20, 0.42)';
    let btnBorder = 'rgba(0, 255, 136, 0.6)';
    let titleText = '👥 SUPPORT [H]';
    let statusText = '★ FREE ★';
    let statusColor = '#00ff88';

    if (cooldown > 0) {
      btnBg = 'rgba(32, 22, 14, 0.42)';
      btnBorder = 'rgba(200, 140, 50, 0.6)';
      titleText = '👥 SUPPORT [H]';
      statusText = `⏱️ ${Math.ceil(cooldown / 60)}s`;
      statusColor = '#ffaa33';
    } else if (freeAvail) {
      btnBg = 'rgba(10, 44, 26, 0.48)';
      btnBorder = 'rgba(0, 255, 170, 0.8)';
      titleText = '👥 SUPPORT [H]';
      statusText = '★ FREE ★';
      statusColor = '#00ffcc';
    } else if (hasCash) {
      btnBg = 'rgba(12, 32, 48, 0.45)';
      btnBorder = 'rgba(0, 200, 255, 0.6)';
      titleText = '👥 SUPPORT [H]';
      statusText = '★ $1.5K ★';
      statusColor = '#55ffff';
    } else {
      btnBg = 'rgba(40, 32, 12, 0.42)';
      btnBorder = 'rgba(255, 200, 0, 0.6)';
      titleText = '👥 SUPPORT [H]';
      statusText = '📺 AD UNLOCK';
      statusColor = '#ffdd44';
    }

    ctx.fillStyle = btnBg;
    ctx.fillRect(supBtnX, supBtnY, supBtnW, supBtnH);
    ctx.strokeStyle = btnBorder;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(supBtnX, supBtnY, supBtnW, supBtnH);

    this.game.buttons.push({
      x: supBtnX,
      y: supBtnY,
      w: supBtnW,
      h: supBtnH,
      callback: () => this.game.requestAirSupport()
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(titleText, supBtnX + supBtnW / 2, supBtnY + 14);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, supBtnX + supBtnW / 2, supBtnY + 32);

    // ==========================================
    // 4b. DEDICATED TACTICAL FPV DRONE PANEL [U]
    // ==========================================
    const droneBtnX = 884;
    const droneBtnY = boxY;
    const droneBtnW = 98;
    const droneBtnH = boxH;

    const droneCd = player.droneCooldown || 0;
    const droneFree = (player.droneStrikesAvailable || 0) > 0;
    const hasDroneCash = player.credits >= 500;

    let dBtnBg = 'rgba(10, 32, 38, 0.45)';
    let dBtnBorder = 'rgba(0, 229, 255, 0.6)';
    let dTitleText = '🎯 DRONE [U]';
    let dStatusText = `★ FREE (${player.droneStrikesAvailable || 0}) ★`;
    let dStatusColor = '#00e5ff';

    if (droneCd > 0) {
      dBtnBg = 'rgba(32, 22, 14, 0.42)';
      dBtnBorder = 'rgba(200, 140, 50, 0.6)';
      dTitleText = '🎯 DRONE [U]';
      dStatusText = `⏱️ ${Math.ceil(droneCd / 60)}s`;
      dStatusColor = '#ffaa33';
    } else if (droneFree) {
      dBtnBg = 'rgba(10, 44, 46, 0.50)';
      dBtnBorder = 'rgba(0, 255, 255, 0.8)';
      dTitleText = '🎯 DRONE [U]';
      dStatusText = `★ FREE (${player.droneStrikesAvailable}) ★`;
      dStatusColor = '#00ffff';
    } else if (hasDroneCash) {
      dBtnBg = 'rgba(12, 32, 48, 0.45)';
      dBtnBorder = 'rgba(0, 200, 255, 0.6)';
      dTitleText = '🎯 DRONE [U]';
      dStatusText = '★ $500 ★';
      dStatusColor = '#55ffff';
    } else {
      dBtnBg = 'rgba(40, 32, 12, 0.42)';
      dBtnBorder = 'rgba(255, 200, 0, 0.6)';
      dTitleText = '🎯 DRONE [U]';
      dStatusText = '📺 AD UNLOCK';
      dStatusColor = '#ffdd44';
    }

    ctx.fillStyle = dBtnBg;
    ctx.fillRect(droneBtnX, droneBtnY, droneBtnW, droneBtnH);
    ctx.strokeStyle = dBtnBorder;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(droneBtnX, droneBtnY, droneBtnW, droneBtnH);

    this.game.buttons.push({
      x: droneBtnX,
      y: droneBtnY,
      w: droneBtnW,
      h: droneBtnH,
      callback: () => this.game.callDroneStrike()
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dTitleText, droneBtnX + droneBtnW / 2, droneBtnY + 14);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = dStatusColor;
    ctx.fillText(dStatusText, droneBtnX + droneBtnW / 2, droneBtnY + 32);

    // ==========================================
    // 5. COMBAT FUNDS & SCORE READOUT PANEL
    // ==========================================
    const statX = 988;
    const statY = boxY;
    const statW = width - statX - 14;
    const statH = boxH;

    ctx.fillStyle = 'rgba(6, 16, 10, 0.28)';
    ctx.fillRect(statX, statY, statW, statH);
    ctx.strokeStyle = 'rgba(0, 255, 120, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(statX, statY, statW, statH);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`★ SCORE: ${player.score.toLocaleString()}`, statX + 10, statY + 14);

    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`💰 $${player.credits.toLocaleString()}`, statX + 148, statY + 14);

    const planeNames = {
      standard: 'F-4 PHANTOM II',
      a10: 'A-10 WARTHOG',
      su25: 'SU-25 FROGFOOT',
      cobra: 'AH-1 COBRA',
      f14: 'F-14 TOMCAT',
      ac130: 'AC-130 SPECTRE',
      apache: 'AH-64 APACHE',
      comanche: 'RAH-66 COMANCHE',
      chinook: 'CH-47 CHINOOK',
      harrier: 'AV-8B HARRIER II'
    };
    const planeName = planeNames[player.model] || 'COMBAT AIRCRAFT';
    const isTrial = this.game.armory && this.game.armory.trialPlane === player.model;

    ctx.font = 'bold 11px -apple-system, sans-serif';
    if (isTrial) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`✈ TEST SORTIE: ${planeName} [RENTAL]`, statX + 10, statY + 32);
    } else {
      ctx.fillStyle = '#55ffff';
      ctx.fillText(`✈ SORTIE: ${planeName}`, statX + 10, statY + 32);
    }

    ctx.restore();
  }

  drawTouchControls(ctx, width, height) {
    const sprites = this.game.sprites;
    const input = this.game.input;

    // Responsive virtual touch buttons
    input.touchButtons = [
      { action: 'bomb', x: width - 85, y: height - 85, w: 65, h: 65, sprite: sprites['dropbombbutton.png'] },
      { action: 'cluster', x: width - 160, y: height - 85, w: 65, h: 65, text: 'CLUSTER' },
      { action: 'gau8', x: width - 85, y: height - 160, w: 65, h: 65, sprite: sprites['gau8button.png'] },
      { action: 'rocket', x: width - 160, y: height - 160, w: 65, h: 65, sprite: sprites['rocketbutton.png'] },
      { action: 'nuke', x: width - 85, y: height - 235, w: 65, h: 65, sprite: sprites['dropnukebutton.png'] },
      { action: 'drone', x: width - 160, y: height - 235, w: 65, h: 65, text: 'DRONE' }
    ];

    for (const btn of input.touchButtons) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      if (btn.sprite && btn.sprite.complete) {
        ctx.drawImage(btn.sprite, btn.x, btn.y, btn.w, btn.h);
      } else {
        ctx.fillStyle = '#1b3320';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#55ff55';
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(btn.text, btn.x + 8, btn.y + 36);
      }
      ctx.restore();
    }
  }

  /**
   * First 15-25 Second Dynamic Mission HUD Onboarding
   * Professional CrazyGames-standard control badge overlay that fades as player executes actions
   */
  drawMissionOnboarding(ctx, width, height, player) {
    const curWave = this.game.currentWave || this.game.wave || 1;
    if (curWave !== 1 || this.onboardingTimer > 1500) return;

    // Time-based overall fadeout towards 25s
    const globalFade = this.onboardingTimer > 1100 ? Math.max(0, (1500 - this.onboardingTimer) / 400) : 1.0;
    if (globalFade <= 0) return;

    const isTouch = this.game.input && this.game.input.touchControlsActive;
    const badges = isTouch ? [
      { key: 'JOYSTICK', action: 'DRAG TO STEER', alpha: this.tutorialAlpha.steer * globalFade },
      { key: 'BOMB BTN', action: 'TAP TO BOMB', alpha: this.tutorialAlpha.bomb * globalFade },
      { key: 'GUN BTN', action: 'TAP TO FIRE', alpha: this.tutorialAlpha.cannon * globalFade },
      { key: 'FLARE BTN', action: 'TAP FOR FLARES', alpha: this.tutorialAlpha.flare * globalFade }
    ] : [
      { key: 'ARROWS / WASD', action: 'STEER & THROTTLE', alpha: this.tutorialAlpha.steer * globalFade },
      { key: 'SPACE', action: 'DROP BOMBS', alpha: this.tutorialAlpha.bomb * globalFade },
      { key: 'J / C', action: '30mm ROTARY CANNON', alpha: this.tutorialAlpha.cannon * globalFade },
      { key: 'F', action: 'FLARES COUNTERMEASURES', alpha: this.tutorialAlpha.flare * globalFade }
    ];

    const activeBadges = badges.filter(b => b.alpha > 0.05);
    if (activeBadges.length === 0) return;

    ctx.save();
    const badgeW = isTouch ? 135 : 158;
    const badgeH = 34;
    const spacing = 10;
    const totalW = activeBadges.length * badgeW + (activeBadges.length - 1) * spacing;
    let startX = width / 2 - totalW / 2;
    const badgeY = height - 128; // Positioned right above bottom telemetry instrument strip

    for (const b of activeBadges) {
      ctx.save();
      ctx.globalAlpha = b.alpha;

      // Dark cyber glass container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(startX, badgeY, badgeW, badgeH, 6);
        ctx.fill();
      } else {
        ctx.fillRect(startX, badgeY, badgeW, badgeH);
      }

      // Cyber Cyan/Gold border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(startX, badgeY, badgeW, badgeH, 6);
        ctx.stroke();
      } else {
        ctx.strokeRect(startX, badgeY, badgeW, badgeH);
      }

      // Key pill box
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[ ${b.key} ]`, startX + badgeW / 2, badgeY + 14);

      // Action description
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillText(b.action, startX + badgeW / 2, badgeY + 28);

      ctx.restore();
      startX += badgeW + spacing;
    }
    ctx.restore();
  }

  // Draw Tactical Military Radio Comms Transmission Popup
  drawRadioTransmission(ctx, width, height) {
    const radio = this.game.activeRadioMessage;
    if (!radio || radio.timer <= 0 || !radio.text) return;

    ctx.save();
    const boxW = Math.min(880, width - 30);
    const boxH = 40;
    const boxX = (width - boxW) / 2;
    const boxY = (this.game.waveGraceTimer && this.game.waveGraceTimer > 0) ? 132 : 52;

    // Tactical Glass Backdrop
    ctx.fillStyle = 'rgba(6, 18, 14, 0.94)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 6;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.shadowBlur = 0;

    // Audio transmission frequency wave animation on the left
    ctx.fillStyle = '#00ff88';
    const bars = 5;
    for (let b = 0; b < bars; b++) {
      const barH = 6 + Math.abs(Math.sin(Date.now() * 0.015 + b)) * 16;
      ctx.fillRect(boxX + 12 + b * 5, boxY + (boxH - barH) / 2, 3, barH);
    }

    // Clean message text if speaker name is duplicated
    let msgText = radio.text || '';
    if (msgText.startsWith('PILOT: ')) msgText = msgText.slice(7);
    else if (radio.speaker && msgText.startsWith(radio.speaker + ': ')) msgText = msgText.slice(radio.speaker.length + 2);

    // Text: Speaker + Message (dynamically scale font if text is long)
    const fontSize = msgText.length > 70 ? 11 : 12;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const isPilot = radio.speaker && radio.speaker.includes('PILOT');
    ctx.fillStyle = isPilot ? '#00e5ff' : '#ffcc00';
    const spkText = isPilot ? '👨‍✈️ [PILOT]: ' : `📻 [${radio.speaker}]: `;
    ctx.fillText(spkText, boxX + 46, boxY + boxH / 2);

    const spkW = ctx.measureText(spkText).width;
    ctx.fillStyle = '#ffffff';

    // Blinking cursor
    const cursor = (Math.floor(Date.now() / 250) % 2 === 0) ? '▋' : '';
    ctx.fillText(msgText + cursor, boxX + 46 + spkW, boxY + boxH / 2);

    ctx.restore();
  }

  // 6. Tactical Weapon Suggestion Assistant (HUD AI Combat Advisor)
  drawCombatAdvisory(ctx, width, height, player) {
    if (!player || !player.alive || !this.game.entities || (this.game.waveGraceTimer && this.game.waveGraceTimer > 0)) return;
    // Yield screen space when radio comms are actively transmitting to prevent vertical stacking
    if (this.game.activeRadioMessage && this.game.activeRadioMessage.timer > 0) return;

    const entities = this.game.entities;
    const px = player.x;
    const py = player.y;

    let advice = null;

    // 1. Incoming SAM or S-400 Hypersonic Missile Alert -> Suggest Countermeasure Flares
    const incomingMissile = entities.samMissiles.find(
      m => m.alive && Math.hypot(m.x - px, m.y - py) < 550
    );
    if (incomingMissile && player.flares > 0) {
      const isS400 = incomingMissile.isS400;
      advice = {
        key: '[F] FLARE',
        action: isS400 ? 'S-400 HYPERSONIC LOCK!' : 'DEPLOY DECOY FLARES',
        sub: isS400 ? 'S-400 Triumf missile inbound! Press [F] to decoy lock or fly low!' : 'Incoming missile tracking! Press [F] to decoy lock!',
        col: isS400 ? '#ff1111' : '#ff2222'
      };
    }

    // 1b. S-400 Battery Erecting / Locking On
    if (!advice) {
      const s400Locked = entities.enemies.find(
        e => e.alive && e.type === 's400' && e.erectAngle > 0.25 && Math.hypot(e.x - px, e.y - py) < e.radarRange
      );
      if (s400Locked) {
        advice = {
          key: '[L] / [SPACE]',
          action: 'S-400 BATTERY IN RANGE',
          sub: 'S-400 radar locking! Strike with [L] Hellfire or drop [V] Napalm!',
          col: '#ff3d00'
        };
      }
    }

    // 2. Critical Health (< 35%) -> Suggest Air Support
    if (!advice && player.hp < player.maxHp * 0.35) {
      advice = {
        key: '[H] SUPPORT',
        action: 'CALL ALLIED AIR SUPPORT',
        sub: 'Airframe critical! Press [H] to summon Razor wingmen!',
        col: '#ff4444'
      };
    }

    // 3. Airborne Threat: Mi-24 Hind Boss or MiG-21 Ace nearby -> Suggest Hellfire or Rockets
    if (!advice) {
      const nearAirThreat = entities.hinds.find(h => h.alive && Math.hypot(h.x - px, h.y - py) < 650) ||
                            entities.migs.find(m => m.alive && Math.hypot(m.x - px, m.y - py) < 550);
      if (nearAirThreat) {
        if (player.hellfireAmmo > 0) {
          advice = {
            key: '[L] HELLFIRE',
            action: 'AGM-114 LASER HOMING',
            sub: 'Airborne threat in range! Press [L] for precision laser lock!',
            col: '#ff8800'
          };
        } else if (player.rocketAmmo > 0) {
          advice = {
            key: '[K] ROCKETS',
            action: 'HYDRA 70 SALVO',
            sub: 'Airborne armor ahead! Press [K] for high-velocity rocket strike!',
            col: '#ffff00'
          };
        }
      }
    }

    // 4. Clustered Ground Enemies -> Suggest Napalm Firestorm or Cluster Bomb
    if (!advice) {
      let clusteredCount = 0;
      for (const e of entities.enemies) {
        if (e.alive && Math.abs(e.x - px) < 320) clusteredCount++;
      }
      if (clusteredCount >= 3) {
        if (player.napalmAmmo > 0) {
          advice = {
            key: '[V] NAPALM',
            action: 'BLU-27 FIRESTORM',
            sub: 'Ground targets clustered! Press [V] to incinerate area!',
            col: '#ff7700'
          };
        } else if (player.clusters > 0) {
          advice = {
            key: '[C] CLUSTER',
            action: 'CARPET BOMBLETS',
            sub: 'Cluster targets below! Press [C] for wide bomblet dispersal!',
            col: '#ffff33'
          };
        }
      }
    }

    // 5. Fortified Hardened Targets (Bunker, Missile Silo, Armored Train) -> Suggest Iron Bomb or Nuke
    if (!advice) {
      const hardTarget = entities.enemies.find(
        e => e.alive && Math.abs(e.x - px) < 260 && (e.type === 'bunker' || e.type === 'missile_silo' || e.type === 'armored_train')
      );
      if (hardTarget) {
        if (player.nukes > 0 && (hardTarget.type === 'armored_train' || hardTarget.type === 'missile_silo')) {
          advice = {
            key: '[N] NUKE',
            action: 'TACTICAL ATOMIC STRIKE',
            sub: 'Strategic priority target! Press [N] for catastrophic blast!',
            col: '#ff3333'
          };
        } else if (player.bombs > 0) {
          advice = {
            key: '[SPACE] BOMB',
            action: '1,000lb IRON BOMB',
            sub: 'Fortification below! Press [SPACE] or [B] for direct kinetic hit!',
            col: '#ffee33'
          };
        }
      }
    }

    // 6. Fast Ground Technicals or Shilka AAA -> Suggest 30mm GAU-8 Cannon
    if (!advice) {
      const nearGround = entities.enemies.find(
        e => e.alive && Math.abs(e.x - px) < 420 && (e.type === 'shilka' || e.type === 'desert_technical' || e.type === 'zsu57' || e.type === 'mlrs_truck')
      );
      if (nearGround) {
        advice = {
          key: '[J] 30mm GAU-8',
          action: 'ARMOR-PIERCING BURST',
          sub: 'Mobile AAA flak in sight! Press [J] for armor-piercing cannon fire!',
          col: '#00e5ff'
        };
      }
    }

    // 7. High-Altitude Patrol Default
    if (!advice) {
      advice = {
        key: '[SPACE] / [K]',
        action: 'WEAPONS READY',
        sub: 'Reconnaissance patrol. Acquire ground radar targets ahead.',
        col: '#55ff77'
      };
    }

    // Render NATO Tactical HUD Advisory Box (Upper Center)
    ctx.save();
    const boxW = 560;
    const boxH = 26;
    const boxX = width / 2 - boxW / 2;
    const boxY = (this.game.activeRadioMessage && this.game.activeRadioMessage.timer > 0) ? 96 : 44;

    ctx.fillStyle = 'rgba(10, 20, 16, 0.88)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = advice.col;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Glowing Key Pill Badge
    const keyW = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(boxX + 4, boxY + 3, keyW, boxH - 6);
    ctx.strokeStyle = advice.col;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, boxY + 3, keyW, boxH - 6);

    ctx.font = '900 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = advice.col;
    ctx.fillText(advice.key, boxX + 4 + keyW / 2, boxY + boxH / 2);

    // Advisory Text
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`💡 ${advice.action}: `, boxX + keyW + 12, boxY + boxH / 2);

    const actW = ctx.measureText(`💡 ${advice.action}: `).width;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#aaccbb';
    ctx.fillText(advice.sub, boxX + keyW + 12 + actW, boxY + boxH / 2);

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.HUD = HUD;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HUD;
}
