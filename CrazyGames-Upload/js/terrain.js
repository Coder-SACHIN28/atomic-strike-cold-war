/**
 * Atomic Strike: Cold War - Multi-Theater Terrain Engine
 * Generates and renders 3 authentic, distinctive 2D theaters:
 * 1. EUROPEAN GREEN FRONT (Lush rolling grass pastures & hills)
 * 2. SIBERIAN MISSILE BASE (Snow, glacial permafrost, railroad tracks)
 * 3. DESERT STORM OILFIELDS (Golden sand dunes, sandstone wadis, oil pipelines)
 */

class TerrainEngine {
  constructor(mapWidth = 4800, worldHeight = 720) {
    if (typeof mapWidth === 'object' && mapWidth !== null) {
      this.mapWidth = mapWidth.mapWidth || mapWidth.width || 4800;
      this.worldHeight = mapWidth.worldHeight || mapWidth.height || 720;
    } else {
      this.mapWidth = mapWidth;
      this.worldHeight = worldHeight;
    }
    this.step = 16; // Ultra-smooth horizontal vertex step
    this.points = [];
    this.baseGroundY = 515; // Baseline ground level ensuring generous clearance above HUD
    this.craters = [];
    this.scorchMarks = [];
    this.currentMap = 'EUROPEAN'; // 'EUROPEAN' | 'SIBERIA' | 'DESERT'
    this.railwaySegments = [];
    this.pipelineSegments = [];
  }

  setMap(mapName, wave = 1) {
    this.currentMap = mapName || 'EUROPEAN';
    this.generate(wave, this.currentMap);
  }

  // Generates rolling hills / mountains for given wave and theater
  generate(wave = 1, mapType = this.currentMap) {
    this.currentMap = mapType;
    this.points = [];
    this.craters = [];
    this.scorchMarks = [];
    this.railwaySegments = [];
    this.pipelineSegments = [];
    this.waterBodies = [];

    const numPoints = Math.ceil(this.mapWidth / this.step) + 2;
    const phaseOffset = (wave * 137.5) % 1000;

    if (this.currentMap === 'SIBERIA') {
      // SIBERIAN SNOW & ICE: Majestic smooth rolling arctic hills & glacial valleys
      const mountainScale = Math.min(200, 110 + wave * 8);
      for (let i = 0; i <= numPoints; i++) {
        const x = i * this.step;
        const nx = x + phaseOffset;

        // Smooth multi-frequency harmonic contours - no harsh kinks!
        let yOffset =
          Math.sin(nx * 0.0026) * (mountainScale * 0.65) +
          Math.cos(nx * 0.0062) * (mountainScale * 0.35) +
          Math.sin(nx * 0.015) * 12;

        // Railway tracks valley (smoothed level segment between 1200 and 2600)
        if (x >= 1200 && x <= 2600) {
          const t = Math.sin(((x - 1200) / 1400) * Math.PI);
          yOffset = yOffset * (1 - t * 0.70) + 25 * t;
        }

        let y = this.baseGroundY + yOffset;
        y = Math.max(380, Math.min(575, y));
        this.points.push({ x, y, baseY: y });
      }

      // Record railway track line along level valley floor
      this.railwaySegments.push({ startX: 1100, endX: 2700 });

    } else if (this.currentMap === 'DESERT') {
      // DESERT STORM OILFIELDS: Flowing wind-swept sand dunes and flat canyon wadis
      const duneScale = Math.min(180, 95 + wave * 7);
      for (let i = 0; i <= numPoints; i++) {
        const x = i * this.step;
        const nx = x + phaseOffset;

        // Smooth flowing sand dune curves
        let yOffset =
          Math.sin(nx * 0.0024) * (duneScale * 0.70) +
          Math.cos(nx * 0.0058) * (duneScale * 0.30) +
          Math.sin(nx * 0.014) * 8;

        // Flat oil refinery wadi between 1800 and 3200
        if (x >= 1800 && x <= 3200) {
          const t = Math.sin(((x - 1800) / 1400) * Math.PI);
          yOffset = yOffset * (1 - t * 0.6) + 40 * t;
        }

        let y = this.baseGroundY + yOffset;
        y = Math.max(390, Math.min(575, y));
        this.points.push({ x, y, baseY: y });
      }

      // Record oil pipeline segment
      this.pipelineSegments.push({ startX: 1600, endX: 3400 });

    } else {
      // EUROPEAN GREEN FRONT: Authentic Atomic Bomber rolling lush green hills
      const hillHeight = Math.min(185, 90 + wave * 7);
      const hillFreq1 = 0.0032 + (wave % 3) * 0.0008;
      const hillFreq2 = 0.0085 + (wave % 2) * 0.0015;
      const hillFreq3 = 0.021;

      for (let i = 0; i <= numPoints; i++) {
        const x = i * this.step;
        const nx = x + phaseOffset;

        let yOffset =
          Math.sin(nx * hillFreq1) * hillHeight * 0.65 +
          Math.sin(nx * hillFreq2) * (hillHeight * 0.35) +
          Math.sin(nx * hillFreq3) * 10;

        let y = this.baseGroundY + yOffset;
        y = Math.max(390, Math.min(575, y));
        this.points.push({ x, y, baseY: y });
      }
    }
  }

  // Get ground elevation Y at exact world coordinate X
  getHeightAt(x) {
    if (isNaN(x) || !isFinite(x)) return this.baseGroundY;
    if (!this.points || this.points.length === 0) return this.baseGroundY;

    const wx = ((x % this.mapWidth) + this.mapWidth) % this.mapWidth;
    const index = Math.floor(wx / this.step);
    if (index < 0) return this.points[0] ? this.points[0].y : this.baseGroundY;
    if (index >= this.points.length - 1) {
      return this.points[this.points.length - 1] ? this.points[this.points.length - 1].y : this.baseGroundY;
    }

    const p1 = this.points[index];
    const p2 = this.points[index + 1];
    if (!p1 || !p2) return this.baseGroundY;
    const t = (wx - p1.x) / (p2.x - p1.x);
    return p1.y + t * (p2.y - p1.y);
  }

  // Get terrain slope angle at X for vehicle alignment
  getSlopeAngle(x) {
    const delta = 14;
    const y1 = this.getHeightAt(x - delta);
    const y2 = this.getHeightAt(x + delta);
    return Math.atan2(y2 - y1, delta * 2);
  }

  // Nuclear & Heavy Bomb Crater Flattening
  applyCrater(impactX, blastRadius, craterDepth = 30) {
    const wx = ((impactX % this.mapWidth) + this.mapWidth) % this.mapWidth;
    const minX = wx - blastRadius;
    const maxX = wx + blastRadius;

    this.craters.push({ x: wx, radius: blastRadius, depth: craterDepth, time: Date.now() });
    this.addScorchMark(wx, blastRadius, blastRadius >= 100, false);

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      if (pt.x >= minX && pt.x <= maxX) {
        const dist = Math.abs(pt.x - wx);
        const factor = 1 - Math.pow(dist / blastRadius, 2);
        if (factor > 0) {
          pt.y = Math.min(585, pt.y + craterDepth * factor);
        }
      }
    }
  }

  // Persistent Ground Scorch Marks & Bomb Blast Craters
  addScorchMark(x, blastRadius = 30, isNuke = false, isNapalm = false) {
    if (isNaN(x)) return;
    const wx = ((x % this.mapWidth) + this.mapWidth) % this.mapWidth;
    const r = Math.min(isNuke ? 160 : 75, Math.max(12, blastRadius * 0.75));
    const embers = [];
    const emberCount = isNuke ? 12 : (isNapalm ? 8 : 4);
    for (let i = 0; i < emberCount; i++) {
      embers.push({
        offsetX: (Math.random() - 0.5) * r * 1.4,
        offsetY: (Math.random() * 8) - 2,
        size: 1 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 3
      });
    }

    this.scorchMarks.push({
      x: wx,
      radius: r,
      isNuke: !!isNuke,
      isNapalm: !!isNapalm,
      createdAt: Date.now(),
      embers: embers
    });

    if (this.scorchMarks.length > 80) {
      this.scorchMarks.shift();
    }
  }

  // Ray-casting intersection against terrain segments
  checkRayIntersection(x1, y1, x2, y2) {
    const midX = (x1 + x2) / 2;
    const groundY = this.getHeightAt(midX);
    if (Math.max(y1, y2) < groundY - 35) return false;

    const startIdx = Math.max(0, Math.floor(Math.min(x1, x2) / this.step));
    const endIdx = Math.min(this.points.length - 2, Math.ceil(Math.max(x1, x2) / this.step));

    for (let i = startIdx; i <= endIdx; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      if (this.lineIntersects(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
        return true;
      }
    }
    return false;
  }

  lineIntersects(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    const s1_x = p1_x - p0_x;
    const s1_y = p1_y - p0_y;
    const s2_x = p3_x - p2_x;
    const s2_y = p3_y - p2_y;

    const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  }

  /**
   * Render Multi-Theater Terrain
   * Switches colors, shaders, contours, and decorators based on current theater
   */
  draw(ctx, cameraX, viewportWidth, viewportHeight, grassSprite) {
    const startX = cameraX - 100;
    const endX = cameraX + viewportWidth + 100;

    ctx.save();

    // 1. Build Subterranean Gradient based on active map
    let grad = ctx.createLinearGradient(0, 370, 0, this.worldHeight);

    if (this.currentMap === 'SIBERIA') {
      // Siberian Snow & Glacial Permafrost
      grad.addColorStop(0, '#f4f8ff');    // Fresh crisp arctic snow
      grad.addColorStop(0.12, '#d4e6f6'); // Packed cold snow
      grad.addColorStop(0.35, '#85a7c2'); // Glacial ice layer
      grad.addColorStop(0.70, '#2b3f54'); // Frozen Siberian bedrock
      grad.addColorStop(1, '#081018');    // Deep subterranean black
    } else if (this.currentMap === 'DESERT') {
      // Desert Storm Golden Sand & Canyons
      grad.addColorStop(0, '#e8b056');    // Warm golden sand crest
      grad.addColorStop(0.18, '#c88630'); // Ochre dune body
      grad.addColorStop(0.48, '#824618'); // Canyon sandstone
      grad.addColorStop(0.75, '#241006'); // Oil-rich subterranean shale
      grad.addColorStop(1, '#000000');    // Deep subterranean base
    } else {
      // Aircraft Evolution Rich Earth & Sediment Cross-Section
      grad.addColorStop(0, '#362014');    // Dark organic humus topsoil
      grad.addColorStop(0.08, '#4a2c1a'); // Warm loam
      grad.addColorStop(0.24, '#381f12'); // Sedimentary subsoil
      grad.addColorStop(0.55, '#26140b'); // Compacted earth & gravel
      grad.addColorStop(0.85, '#180c06'); // Deep bedrock
      grad.addColorStop(1, '#0c0502');    // Subterranean dark base
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(startX - cameraX, this.worldHeight);

    let started = false;
    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      if (pt.x >= startX - this.step && pt.x <= endX + this.step) {
        const sx = pt.x - cameraX;
        if (!started) {
          ctx.lineTo(sx, pt.y);
          started = true;
        } else {
          ctx.lineTo(sx, pt.y);
        }
      }
    }

    ctx.lineTo(endX - cameraX, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // 1b. Organic Subsoil Sedimentary Flecks & Micro-Pebbles (Cross-Section Depth)
    if (this.currentMap === 'EUROPEAN') {
      ctx.save();
      ctx.fillStyle = 'rgba(120, 75, 45, 0.28)';
      for (let i = 0; i < this.points.length; i += 2) {
        const pt = this.points[i];
        if (pt.x >= startX && pt.x <= endX) {
          const sx = pt.x - cameraX;
          // Organic gravel speckles at 25px, 55px, 95px beneath soil surface
          ctx.fillRect(sx, pt.y + 22, 5, 2.5);
          ctx.fillRect(sx + 10, pt.y + 55, 6, 3);
          ctx.fillRect(sx - 8, pt.y + 90, 7, 2);
        }
      }
      ctx.restore();
    }

    // 2. Surface Contour & Tactile Autumn Golden Grass Fringe (Aircraft Evolution REA)
    if (this.currentMap === 'SIBERIA') {
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#80d0ff';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      started = false;
      for (let i = 0; i < this.points.length; i++) {
        const pt = this.points[i];
        if (pt.x >= startX - this.step && pt.x <= endX + this.step) {
          const sx = pt.x - cameraX;
          if (!started) { ctx.moveTo(sx, pt.y); started = true; }
          else { ctx.lineTo(sx, pt.y); }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (this.currentMap === 'DESERT') {
      ctx.strokeStyle = '#ffc860';
      ctx.shadowColor = '#e07010';
      ctx.shadowBlur = 5;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      started = false;
      for (let i = 0; i < this.points.length; i++) {
        const pt = this.points[i];
        if (pt.x >= startX - this.step && pt.x <= endX + this.step) {
          const sx = pt.x - cameraX;
          if (!started) { ctx.moveTo(sx, pt.y); started = true; }
          else { ctx.lineTo(sx, pt.y); }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // EUROPEAN FRONT: Exact Aircraft Evolution Golden Autumn Grass Fringe
      // 2a. Dark soil contour under-rim
      ctx.strokeStyle = '#23120a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < this.points.length; i++) {
        const pt = this.points[i];
        if (pt.x >= startX - this.step && pt.x <= endX + this.step) {
          const sx = pt.x - cameraX;
          if (!started) { ctx.moveTo(sx, pt.y + 1); started = true; }
          else { ctx.lineTo(sx, pt.y + 1); }
        }
      }
      ctx.stroke();

      // 2b. Dense tactile golden autumn grass blades along slope
      const grassColors = ['#d97706', '#eab308', '#ca8a04', '#b45309', '#65a30d', '#f59e0b'];
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        if (p2.x < startX || p1.x > endX) continue;

        const sx1 = p1.x - cameraX;
        const sx2 = p2.x - cameraX;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const blades = Math.ceil(dist / 3.2);

        for (let b = 0; b < blades; b++) {
          const t = b / blades;
          const bx = sx1 + (sx2 - sx1) * t;
          const by = p1.y + (p2.y - p1.y) * t;
          const bladeH = 9 + ((b * 7 + i * 13) % 7); // 9px to 15px natural height variance
          const bladeTilt = ((b * 3 + i * 5) % 9) - 4; // Gentle wind sway angle
          const col = grassColors[(b + i * 3) % grassColors.length];

          ctx.strokeStyle = col;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(bx, by + 1);
          ctx.lineTo(bx + bladeTilt, by - bladeH);
          ctx.stroke();
        }
      }
    }

    // 2.5 Ground Scorch Marks & Craters (Game Juice)
    if (this.scorchMarks && this.scorchMarks.length > 0) {
      const now = Date.now();
      ctx.save();
      for (const sm of this.scorchMarks) {
        if (sm.x + sm.radius < startX || sm.x - sm.radius > endX) continue;
        const sx = sm.x - cameraX;
        const groundY = this.getHeightAt(sm.x);
        const age = (now - sm.createdAt) / 1000;
        const alpha = Math.max(0.45, 1.0 - age / 90);

        const gradScorch = ctx.createRadialGradient(sx, groundY + 3, sm.radius * 0.15, sx, groundY + 3, sm.radius);
        if (sm.isNuke) {
          gradScorch.addColorStop(0, `rgba(12, 22, 12, ${0.96 * alpha})`);
          gradScorch.addColorStop(0.5, `rgba(32, 48, 22, ${0.85 * alpha})`);
          gradScorch.addColorStop(0.85, `rgba(18, 24, 16, ${0.5 * alpha})`);
          gradScorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (sm.isNapalm) {
          gradScorch.addColorStop(0, `rgba(22, 10, 4, ${0.92 * alpha})`);
          gradScorch.addColorStop(0.6, `rgba(48, 20, 6, ${0.75 * alpha})`);
          gradScorch.addColorStop(0.9, `rgba(75, 28, 10, ${0.35 * alpha})`);
          gradScorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          gradScorch.addColorStop(0, `rgba(16, 16, 16, ${0.94 * alpha})`);
          gradScorch.addColorStop(0.65, `rgba(38, 32, 26, ${0.72 * alpha})`);
          gradScorch.addColorStop(0.9, `rgba(52, 46, 40, ${0.3 * alpha})`);
          gradScorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = gradScorch;
        ctx.beginPath();
        ctx.ellipse(sx, groundY + 3, sm.radius, Math.min(22, sm.radius * 0.38), 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Embers
        if (sm.embers && sm.embers.length > 0) {
          for (const emb of sm.embers) {
            const emberAlpha = (0.5 + 0.5 * Math.sin(now * 0.005 * emb.speed + emb.phase)) * alpha;
            if (emberAlpha <= 0.05) continue;
            ctx.fillStyle = sm.isNuke
              ? `rgba(120, 255, 80, ${emberAlpha})`
              : (sm.isNapalm ? `rgba(255, 120, 20, ${emberAlpha})` : `rgba(255, 160, 40, ${emberAlpha})`);
            ctx.beginPath();
            ctx.arc(sx + emb.offsetX, groundY + emb.offsetY, emb.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // 3. Biome Specific Surface Details
    if (this.currentMap === 'SIBERIA') {
      // Siberian Railway Tracks across flat valley segments
      for (const r of this.railwaySegments) {
        if (r.endX >= startX && r.startX <= endX) {
          const drawStart = Math.max(r.startX, startX);
          const drawEnd = Math.min(r.endX, endX);

          // Draw wooden railroad sleepers (ties)
          ctx.strokeStyle = '#4a3222';
          ctx.lineWidth = 4;
          for (let rx = drawStart; rx <= drawEnd; rx += 14) {
            const ry = this.getHeightAt(rx);
            const sx = rx - cameraX;
            ctx.beginPath();
            ctx.moveTo(sx, ry - 3);
            ctx.lineTo(sx, ry + 4);
            ctx.stroke();
          }

          // Draw double parallel steel rails
          ctx.strokeStyle = '#c0d4e8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let rx = drawStart; rx <= drawEnd; rx += 20) {
            const ry = this.getHeightAt(rx);
            const sx = rx - cameraX;
            if (rx === drawStart) ctx.moveTo(sx, ry - 2);
            else ctx.lineTo(sx, ry - 2);
          }
          ctx.stroke();

          ctx.beginPath();
          for (let rx = drawStart; rx <= drawEnd; rx += 20) {
            const ry = this.getHeightAt(rx);
            const sx = rx - cameraX;
            if (rx === drawStart) ctx.moveTo(sx, ry + 2);
            else ctx.lineTo(sx, ry + 2);
          }
          ctx.stroke();
        }
      }

      // Draw frost/snow drifts along ridge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < this.points.length; i += 3) {
        const pt = this.points[i];
        if (pt.x >= startX && pt.x <= endX) {
          const sx = pt.x - cameraX;
          ctx.beginPath();
          ctx.arc(sx, pt.y + 2, 4 + (i % 3) * 2, 0, Math.PI);
          ctx.fill();
        }
      }

    } else if (this.currentMap === 'DESERT') {
      // Industrial Oil Pipelines along flat desert segments
      for (const p of this.pipelineSegments) {
        if (p.endX >= startX && p.startX <= endX) {
          const drawStart = Math.max(p.startX, startX);
          const drawEnd = Math.min(p.endX, endX);

          // Pipeline shadow
          ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
          ctx.lineWidth = 8;
          ctx.beginPath();
          for (let px = drawStart; px <= drawEnd; px += 25) {
            const py = this.getHeightAt(px);
            const sx = px - cameraX;
            if (px === drawStart) ctx.moveTo(sx, py + 8);
            else ctx.lineTo(sx, py + 8);
          }
          ctx.stroke();

          // Steel Oil Pipeline (Black / Industrial dark slate with silver highlight)
          ctx.strokeStyle = '#2b2c30';
          ctx.lineWidth = 7;
          ctx.beginPath();
          for (let px = drawStart; px <= drawEnd; px += 25) {
            const py = this.getHeightAt(px);
            const sx = px - cameraX;
            if (px === drawStart) ctx.moveTo(sx, py + 5);
            else ctx.lineTo(sx, py + 5);
          }
          ctx.stroke();

          // Highlight specular line on top of pipe
          ctx.strokeStyle = '#808590';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let px = drawStart; px <= drawEnd; px += 25) {
            const py = this.getHeightAt(px);
            const sx = px - cameraX;
            if (px === drawStart) ctx.moveTo(sx, py + 3);
            else ctx.lineTo(sx, py + 3);
          }
          ctx.stroke();

          // Pipeline vertical stanchions / supports
          ctx.strokeStyle = '#444850';
          ctx.lineWidth = 3;
          for (let px = drawStart + 20; px <= drawEnd; px += 70) {
            const py = this.getHeightAt(px);
            const sx = px - cameraX;
            ctx.beginPath();
            ctx.moveTo(sx, py + 5);
            ctx.lineTo(sx, py + 14);
            ctx.stroke();
          }
        }
      }

    } else {
      // European lush grass tufts
      if (grassSprite && grassSprite.complete) {
        for (let i = 0; i < this.points.length; i += 2) {
          const pt = this.points[i];
          if (pt.x >= startX && pt.x <= endX) {
            const sx = pt.x - cameraX;
            ctx.drawImage(grassSprite, sx - 8, pt.y - 7);
          }
        }
      }
    }

    ctx.restore();
  }

  isWaterAt(x, y) {
    return false;
  }

  getWaterLevelAt(x) {
    return null;
  }
}

window.TerrainEngine = TerrainEngine;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerrainEngine;
}
