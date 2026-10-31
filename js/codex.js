/**
 * Atomic Strike: Cold War - Field Intelligence Codex ("Know Your Enemy")
 * Reverse Engineered & Grounded in "Full List Of India’s Air Defence Systems.pdf"
 *
 * Provides a comprehensive, interactive CRT Tactical Intelligence Terminal:
 * - Live animated 2D procedural model previews for all enemy units
 * - Full technical telemetry (Range, Mach speed, Radar type, In-game HP & Damage)
 * - Real-world military dossier & historical deployment details
 * - Tactical survival countermeasures and weapon counter-recommendations
 */

class EnemyCodexManager {
  constructor(game) {
    this.game = game;
    this.activeCategory = 'ALL';
    this.selectedUnitId = 's400';
    this.scrollIndex = 0;
    this.radarSweepAngle = 0;
    this.hologramTime = 0;
    this.buttons = [];

    this.categories = [
      { id: 'ALL', label: '🌐 ALL HOSTILES' },
      { id: 'STRATEGIC', label: '🛡️ STRATEGIC SAM' },
      { id: 'MOBILE_SAM', label: '🚀 MOBILE SAM' },
      { id: 'SPAAG_FLAK', label: '💥 FLAK & SPAAG' },
      { id: 'ARMOR_GROUND', label: '🪖 GROUND ARMOR' },
      { id: 'AIRBORNE', label: '🦅 AIR WINGS' }
    ];

    this.units = this.buildCodexDatabase();
  }

  buildCodexDatabase() {
    return [
      // 1. S-400 TRIUMF ("SUDARSHAN CHAKRA" / SA-21 GROWLER)
      {
        id: 's400',
        name: 'S-400 TRIUMF ("SUDARSHAN CHAKRA")',
        nato: 'SA-21 GROWLER / 55R6M TEL',
        category: 'STRATEGIC',
        threat: 'CRITICAL',
        threatColor: '#ff2222',
        origin: 'Russia / Deployed by Indian Air Force (IAF)',
        role: 'Long-Range Multi-Tier Strategic Air Defence System',
        firstAppeared: 'Active from Wave 1 (Damage scales 12 → 60 HP)',
        specs: {
          range: '400 km (Strategic Umbrella)',
          speed: 'Mach 14.0 (Hypersonic Interception)',
          altitude: '10 m to 30,000 m (Stratospheric Ceiling)',
          radar: '91N6E Big Bird (600km) + 92N6E Grave Stone AESA',
          hp: '110 HP (Wave 1) → 290 HP (Wave 5+)',
          damage: '12 HP (Wave 1) → 50+ HP (Wave 5+)',
          fireRate: 'Pneumatic Cold Launch (1 to 4 Canisters)'
        },
        dossier:
          'Acquired under Indian Air Force designation "Sudarshan Chakra", the S-400 Triumf represents the apex of modern area-denial warfare. Built upon an 8x8 heavy BAZ-69092 all-terrain chassis, it deploys four hermetically sealed missile transport-launch canisters.\n\n' +
          'Employs a two-stage pneumatic cold vertical launch: high-pressure gas catapults the missile 30m above the launcher before the solid-fuel rocket motor ignites at supersonic velocity. Intercepts stealth aircraft, supersonic cruise missiles, and ballistic warheads with terminal active radar homing.',
        countermeasures:
          '★ TERRAIN MASKING / NAP-OF-THE-EARTH (NOE): Maintain extreme low altitude (< 35m) to break line-of-sight with the 92N6E Grave Stone radar horizon.\n' +
          '★ DECOY FLARES [F]: Dispense magnesium flares immediately when the high-frequency radar lock warning sounds.\n' +
          '★ PREEMPTIVE STRIKE: S-400 TEL outriggers lock the vehicle in place when elevated. Strike with AGM-114 Hellfire or Mk-82 Bombs before the canisters erect to 80°!',
        renderModel: (ctx, cx, cy, time) => {
          // Live Animated S-400 TEL
          ctx.save();
          const elev = Math.sin(time * 1.5) * 0.35 + 0.35; // 0 to ~0.7 rad elevation
          const radarSpin = time * 3.0;

          // Outrigger Jacks
          ctx.fillStyle = '#222822';
          ctx.fillRect(cx - 36, cy + 18, 5, 12);
          ctx.fillRect(cx + 26, cy + 18, 5, 12);
          ctx.fillStyle = '#607d8b';
          ctx.fillRect(cx - 40, cy + 28, 13, 3);
          ctx.fillRect(cx + 22, cy + 28, 13, 3);

          // 8x8 Wheels
          const wx = [-32, -16, 8, 24];
          for (const x of wx) {
            ctx.fillStyle = '#1c201a';
            ctx.beginPath();
            ctx.arc(cx + x, cy + 18, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#445040';
            ctx.beginPath();
            ctx.arc(cx + x, cy + 18, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Chassis
          ctx.fillStyle = '#2d3826';
          ctx.fillRect(cx - 42, cy + 6, 84, 11);

          // Cab
          ctx.fillStyle = '#3a4832';
          ctx.beginPath();
          ctx.moveTo(cx + 18, cy + 6);
          ctx.lineTo(cx + 40, cy + 6);
          ctx.lineTo(cx + 40, cy - 12);
          ctx.lineTo(cx + 26, cy - 12);
          ctx.lineTo(cx + 18, cy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#78909c';
          ctx.fillRect(cx + 28, cy - 9, 10, 6);

          // Radar Dish
          ctx.strokeStyle = '#222822';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 8, cy + 6);
          ctx.lineTo(cx + 8, cy - 16);
          ctx.stroke();
          ctx.fillStyle = '#81c784';
          ctx.beginPath();
          ctx.ellipse(cx + 8, cy - 17, Math.max(2, Math.abs(Math.sin(radarSpin) * 11)), 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#2e7d32';
          ctx.stroke();

          // Tilting 4-Tube Canisters
          ctx.save();
          ctx.translate(cx - 28, cy + 6);
          ctx.rotate(-elev);
          ctx.fillStyle = '#283324';
          ctx.fillRect(0, -9, 52, 16);
          ctx.fillStyle = '#3f5038';
          ctx.fillRect(0, -12, 52, 8);
          ctx.fillStyle = '#34422e';
          ctx.fillRect(0, -4, 52, 8);
          ctx.fillStyle = '#d32f2f';
          ctx.fillRect(49, -12, 4, 16);
          ctx.fillStyle = '#fbc02d';
          ctx.fillRect(15, -12, 3, 16);
          ctx.fillRect(35, -12, 3, 16);
          ctx.restore();

          ctx.restore();
        }
      },

      // 2. AKASH AIR DEFENCE SYSTEM (DRDO / BDL)
      {
        id: 'akash',
        name: 'AKASH AIR DEFENCE SYSTEM (AKASH-1S)',
        nato: 'AKASH SAM / RAJENDRA 3D PESA',
        category: 'MOBILE_SAM',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'India (DRDO / Bharat Dynamics / Bharat Electronics)',
        role: 'Medium-Range Mobile Ramjet Surface-to-Air Missile',
        firstAppeared: 'Wave 2+ (Armed with Mach 3.5 Ramjets)',
        specs: {
          range: '30 to 45 km Tactical Envelope',
          speed: 'Mach 2.5 to Mach 3.5 (Continuous Ramjet Burn)',
          altitude: '30 m to 18,000 m Operational Ceiling',
          radar: 'Rajendra 3D Multi-Target PESA Phased Array',
          hp: '130 HP (Wave 2) → 240 HP (Wave 5+)',
          damage: '28 HP (Wave 2) → 48 HP (Wave 5+)',
          fireRate: 'Triple-Rail Rapid Sequential Salvo'
        },
        dossier:
          'Developed indigenous Indian air defense pillar engineered by DRDO. Mounted on an armored BMP-2 Sarath tracked chassis, Akash utilizes an advanced Integrated Rocket Ramjet (IRR) propulsion system.\n\n' +
          'A solid booster initiates hypersonic rail acceleration before four radial air-intake nacelles ignite the ramjet sustainer motor, ensuring continuous supersonic acceleration all the way to target impact. Directed by the Rajendra multi-function phased-array radar, capable of tracking 64 aircraft simultaneously.',
        countermeasures:
          '★ HIGH-G KINETIC BREAK: Akash missiles sustain velocity via ramjet combustion and do not suffer kinetic bleed. Break hard perpendicular to missile flight path!\n' +
          '★ CHAFF & FLARE COMBINED BURST [C & F]: Confuses the Rajendra radar command link and optical proximity fuse.\n' +
          '★ STANDOFF ROCKET ENGAGEMENT: Destroy the tracked chassis using Hydra 70 or S-8 rocket pods [R] before the 3-missile rail locks onto your airframe.',
        renderModel: (ctx, cx, cy, time) => {
          // Live Animated Akash SAM Launcher
          ctx.save();
          const aimAngle = -0.45 - Math.sin(time * 2.0) * 0.25;

          // Tracked Hull
          ctx.fillStyle = '#3a4428';
          ctx.fillRect(cx - 38, cy + 6, 76, 12);
          // Camouflage skirts
          ctx.fillStyle = '#655734';
          ctx.fillRect(cx - 30, cy + 8, 22, 9);
          ctx.fillRect(cx + 8, cy + 8, 20, 9);

          // Road Wheels (6 pairs)
          ctx.fillStyle = '#1a1f18';
          for (let wx = -32; wx <= 32; wx += 12.8) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 20, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4e5a3c';
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 20, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1f18';
          }

          // Rotating Turret Base
          ctx.fillStyle = '#485536';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(cx - 18, cy - 4, 36, 11, 3);
          else ctx.rect(cx - 18, cy - 4, 36, 11);
          ctx.fill();

          // Rajendra Data Link Mast
          ctx.strokeStyle = '#22281e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx - 12, cy - 4);
          ctx.lineTo(cx - 12, cy - 18);
          ctx.stroke();
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(cx - 16, cy - 22, 8, 5);

          // Triple Missile Rail
          ctx.save();
          ctx.translate(cx + 2, cy - 2);
          ctx.rotate(aimAngle);

          // Steel Guide Rails
          ctx.fillStyle = '#22281e';
          ctx.fillRect(0, -5, 42, 6);

          // 3x Akash Missiles
          const offsets = [-7, 0, 7];
          for (const off of offsets) {
            // White missile body
            ctx.fillStyle = '#edf2f7';
            ctx.fillRect(2, off - 2, 38, 4);
            // Red missile nose
            ctx.fillStyle = '#e53e3e';
            ctx.beginPath();
            ctx.moveTo(40, off);
            ctx.lineTo(44, off);
            ctx.lineTo(40, off - 2);
            ctx.closePath();
            ctx.fill();
            // Ramjet intake fairings & fins
            ctx.fillStyle = '#dd6b20';
            ctx.fillRect(16, off - 3.5, 8, 7);
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(4, off - 4, 6, 8);
          }
          ctx.restore();

          ctx.restore();
        }
      },

      // 3. 2K22 TUNGUSKA (SA-19 GRISON SPAAGM)
      {
        id: 'tunguska',
        name: '2K22 TUNGUSKA (SPAAGM)',
        nato: 'SA-19 GRISON / 2S6 COMBAT VEHICLE',
        category: 'SPAAG_FLAK',
        threat: 'CRITICAL',
        threatColor: '#ff2222',
        origin: 'Russia / Indian Army Air Defence',
        role: 'Tracked Hybrid Dual 30mm Flak + 8-Missile Point Defense',
        firstAppeared: 'Wave 3+ (Twin 30mm Guns + 9M311 Missiles)',
        specs: {
          range: '10 km (Missiles) / 4.0 km (Twin 30mm Cannons)',
          speed: 'Mach 3.0 (Missiles) / 960 m/s (30mm Autocannons)',
          altitude: '0 to 3,500 m (Low-Altitude Shredder)',
          radar: '1RL144 Target Acquisition + 1RL144M Target Tracking',
          hp: '160 HP (Wave 3) → 280 HP (Wave 5+)',
          damage: '12 HP per 30mm flak shell / 42 HP per 9M311 missile',
          fireRate: '5,000 Rounds/Min Combined Autocannon + 8 Missiles'
        },
        dossier:
          'One of the deadliest anti-aircraft platforms ever engineered. Operates on a GM-352M tracked armored combat hull, combining long-range missile interception with close-in autocannon annihilation.\n\n' +
          'Armed with two 2A38M twin-barrel 30mm liquid-cooled rotary autocannons delivering a devastating 5,000 rounds per minute curtain of high-explosive incendiary fire, alongside eight containerized 9M311-M1 supersonic beam-riding missiles.',
        countermeasures:
          '★ NEVER LOW-DIVE STRAIGHT AT A TUNGUSKA: Diving into the 30mm engagement arc guarantees rapid catastrophic airframe destruction.\n' +
          '★ STANDOFF PRECISION ORDNANCE: Strike from outside 400m using AGM-65 Maverick, AGM-114 Hellfire, or GBU-12 Laser Bombs.\n' +
          '★ S-TURNS & FLARES [F]: If a 9M311 missile is airborne, execute rapid vertical jinks while dispensing flares.',
        renderModel: (ctx, cx, cy, time) => {
          // Live Animated 2K22 Tunguska SPAAGM
          ctx.save();
          const radarSpin = time * 4.5;
          const gunElev = -0.35 - Math.sin(time * 3.0) * 0.2;
          const recoil = Math.sin(time * 25.0) * 2;

          // GM-352M Tracked Hull
          ctx.fillStyle = '#2f3b26';
          ctx.fillRect(cx - 36, cy + 4, 72, 14);

          // Wheels
          ctx.fillStyle = '#1c2217';
          for (let wx = -30; wx <= 30; wx += 12) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 20, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#455537';
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 20, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1c2217';
          }

          // Turret Body
          ctx.fillStyle = '#3c4b31';
          ctx.fillRect(cx - 20, cy - 8, 40, 14);

          // Spinning Acquisition Radar (Rear Mast)
          ctx.strokeStyle = '#22291c';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx - 14, cy - 8);
          ctx.lineTo(cx - 14, cy - 22);
          ctx.stroke();
          ctx.fillStyle = '#f6ad55';
          ctx.beginPath();
          ctx.ellipse(cx - 14, cy - 23, Math.max(2, Math.abs(Math.sin(radarSpin) * 9)), 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tracking Radar Radome (Front)
          ctx.fillStyle = '#edf2f7';
          ctx.beginPath();
          ctx.arc(cx + 8, cy - 10, 6, 0, Math.PI * 2);
          ctx.fill();

          // 8x 9M311 Missile Tubes (4 on each side)
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(cx - 18, cy - 16, 12, 7);
          ctx.fillStyle = '#e53e3e';
          ctx.fillRect(cx - 6, cy - 15, 2, 5);

          // Twin 30mm Autocannon Barrels (Elevating & Recoiling)
          ctx.save();
          ctx.translate(cx + 10, cy - 4);
          ctx.rotate(gunElev);
          ctx.strokeStyle = '#1a202c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.lineTo(28 + recoil, -3);
          ctx.moveTo(0, 3);
          ctx.lineTo(28 - recoil, 3);
          ctx.stroke();
          // Muzzle brakes
          ctx.fillStyle = '#ff7700';
          if (Math.sin(time * 25.0) > 0.4) {
            ctx.fillRect(29, -4, 4, 3);
            ctx.fillRect(29, 2, 4, 3);
          }
          ctx.restore();

          ctx.restore();
        }
      },

      // 4. ZSU-23-4 SHILKA (QUAD 23mm RADAR FLAK)
      {
        id: 'shilka',
        name: 'ZSU-23-4 SHILKA QUAD FLAK',
        nato: 'SPZ-23-4 / "GUN DISH" RADAR',
        category: 'SPAAG_FLAK',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'Soviet Union / Indian Army Air Defence',
        role: 'Self-Propelled Quad 23mm High-RPM Anti-Aircraft Gun',
        firstAppeared: 'Wave 4+ (Quad 2A7 Autocannons)',
        specs: {
          range: '2.5 km Effective Low-Altitude Flak',
          speed: '950 m/s Muzzle Velocity',
          altitude: '1,500 m Anti-Air Curtain',
          radar: 'RPK-2 "Gun Dish" J-Band Fire Control Radar',
          hp: '120 HP (Wave 4) → 220 HP (Wave 5+)',
          damage: '10 HP per 23mm flak round',
          fireRate: '3,400 Rounds/Min Quad Interlocking Burst'
        },
        dossier:
          'Legendary self-propelled anti-aircraft combat vehicle. Integrates four liquid-cooled 23mm 2A7 autocannons mounted on a central mantlet, guided by the RPK-2 "Gun Dish" radar atop the turret rear.\n\n' +
          'Fires interlocking quad bursts that create an impenetrable cloud of proximity flak shrapnel, deadly against diving jets and hovering gunships.',
        countermeasures:
          '★ HIGH ALTITUDE STRATAGEM: Shilka 23mm flak has high trajectory drop above 300m. Bomb from mid-to-high altitude.\n' +
          '★ CARPET BOMBING RUN: Iron bombs (Mk-82, FAB-500) dropped from altitude obliterate the unarmored Shilka turret.\n' +
          '★ CHAFF DISPENSER [C]: Disrupts the RPK-2 Gun Dish radar lock, scattering its quad aim spread.',
        renderModel: (ctx, cx, cy, time) => {
          // Live Animated Shilka
          ctx.save();
          const radarSpin = time * 5.0;

          // Tracked Hull
          ctx.fillStyle = '#343f2d';
          ctx.fillRect(cx - 30, cy + 6, 60, 12);
          ctx.fillStyle = '#1c201a';
          for (let wx = -24; wx <= 24; wx += 12) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 18, 5.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Turret
          ctx.fillStyle = '#414f38';
          ctx.beginPath();
          ctx.arc(cx, cy - 2, 14, Math.PI, 0);
          ctx.fill();

          // Gun Dish Radar
          ctx.strokeStyle = '#ffb300';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx - 10, cy - 14, 8, -Math.PI * 0.7, 0);
          ctx.stroke();

          // Quad Barrels
          ctx.strokeStyle = '#181c15';
          ctx.lineWidth = 2.5;
          const bAngle = -0.65;
          for (let off = -4; off <= 4; off += 2.6) {
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy - 4 + off);
            ctx.lineTo(cx + 4 + Math.cos(bAngle) * 26, cy - 4 + off + Math.sin(bAngle) * 26);
            ctx.stroke();
          }
          ctx.restore();
        }
      },

      // PHALANX C-RAM CIWS (CLOSE-IN WEAPON SYSTEM / COUNTER-MUNITION)
      {
        id: 'phalanx_ciws',
        name: 'PHALANX C-RAM CIWS (LPWS)',
        nato: 'CENTURION C-RAM / 20mm M61A1 VULCAN ROTARY CANNON',
        category: 'SPAAG_FLAK',
        threat: 'EXTREME (POINT DEFENSE)',
        threatColor: '#ff2200',
        origin: 'Raytheon / General Dynamics / NATO & Allies',
        role: 'Counter-Rocket, Artillery, Mortar & Aircraft Interceptor',
        firstAppeared: 'Wave 2+ (Intercepts Bombs, Rockets & Engages Low Aircraft)',
        specs: {
          range: '1,500m Effective Intercept Range against Ordnance and Dive Bombers',
          speed: '1,030 m/s Armor-Piercing Tungsten / HEIT Tracers',
          altitude: '1,200m Point-Defense Anti-Air Dome',
          radar: 'Integrated Search & Ku-Band Monopulse Track Radar (White "R2-D2" Radome)'
        },
        tactics: [
          'High-rate intercept capability: 40% chance to shoot down incoming iron bombs and dumb rockets mid-air.',
          'Continuous radar rotisserie scan: Automatically tracks aircraft descending into its engagement envelope.',
          'Vulnerable to precision FPV Kamikaze Drone [U] strikes and standoff Hellfire missiles.'
        ],
        weakness: 'Cannot intercept agile standoff FPV drones or low-angle high-speed strafing runs from outside radar cone.',
        renderModel: (ctx, cx, cy) => {
          ctx.save();
          // Pedestal base
          ctx.fillStyle = '#2b3038';
          ctx.fillRect(cx - 16, cy + 8, 32, 16);
          ctx.strokeStyle = '#44505c';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - 16, cy + 8, 32, 16);
          // Hazard Stripes
          ctx.fillStyle = '#e5a50a';
          ctx.fillRect(cx - 14, cy + 18, 28, 4);

          // Turret mount
          ctx.fillStyle = '#3a424e';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 8, 14, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // White R2-D2 Ku-band Radome
          ctx.fillStyle = '#f0f3f6';
          ctx.beginPath();
          ctx.arc(cx - 4, cy - 8, 10, Math.PI, 0);
          ctx.lineTo(cx + 6, cy + 4);
          ctx.lineTo(cx - 14, cy + 4);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Radome band
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(cx - 14, cy - 2);
          ctx.lineTo(cx + 6, cy - 2);
          ctx.stroke();

          // 6-barrel M61A1 Vulcan Gatling Cannon
          ctx.save();
          ctx.translate(cx + 6, cy - 2);
          ctx.rotate(-0.35);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, -3, 24, 6);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0, -3, 24, 6);
          // Muzzle clamps
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(6, -4, 3, 8);
          ctx.fillRect(18, -4, 3, 8);
          ctx.restore();
          ctx.restore();
        }
      },

      // 4.6. PANTSIR-S1 (SA-22 GREYHOUND) HYBRID GUN-MISSILE SYSTEM
      {
        id: 'pantsir',
        name: 'PANTSIR-S1 (SA-22 GREYHOUND)',
        nato: 'SA-22 GREYHOUND / 96K6 PANTSIR-S1',
        category: 'SPAAG_FLAK',
        threat: 'EXTREME',
        threatColor: '#38bdf8',
        origin: 'KBP Instrument Design Bureau / Russian Aerospace Forces',
        role: 'Short-Range Point Defense with 12x 57E6 SAMs & Twin 30mm 2A38M Cannons',
        firstAppeared: 'Wave 3+ (Point-Defense Interception & Mach 4.5 SAMs)',
        specs: {
          range: '20 km (SAM) / 4 km (Autocannon)',
          speed: 'Mach 4.5 (57E6 Hypervelocity Bimodal Interceptor)',
          altitude: '15,000 m (49,200 ft)',
          radar: '1RS2-1E Phased Array (360° Search & Multi-Target Fire Control)',
          hp: '330 HP (Armored 8x8 KamAZ Chassis)',
          damage: '58 (57E6 SAM) / 10x3 (30mm Autocannon Bursts)',
          fireRate: '5,000 RPM Autocannon + 12-Canister Ripple Launch'
        },
        description: 'The Pantsir-S1 is a formidable mobile point-defense battery designed to protect high-value assets and S-400 batteries. Equipped with both twin 30mm rotary autocannons and 12 hypervelocity 57E6 missiles, the Pantsir automatically intercepts incoming bombs, rockets, and FPV drones while firing deadly bursts at low-flying strike aircraft.',
        counterTactics: 'Pantsir units actively shoot down incoming bombs within a 320px radius. Use high-altitude standoff bombs, high-speed dive attacks, or saturate its defenses with rapid rocket pods and FPV drone swarms.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // KamAZ 8x8 wheels
          const wx = [-26, -14, 12, 24];
          for (const x of wx) {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(cx + x, cy + 8, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(cx + x, cy + 8, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Chassis
          ctx.fillStyle = '#334155';
          ctx.fillRect(cx - 30, cy + 1, 60, 5);
          // Armored Cab
          ctx.fillStyle = '#3f4e3c';
          ctx.fillRect(cx + 12, cy - 11, 18, 12);
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(cx + 22, cy - 11);
          ctx.lineTo(cx + 30, cy - 4);
          ctx.lineTo(cx + 22, cy - 4);
          ctx.closePath();
          ctx.fill();
          // Turret & 12 tubes
          ctx.fillStyle = '#4a5b46';
          ctx.fillRect(cx - 20, cy - 13, 30, 14);
          ctx.fillStyle = '#475569';
          ctx.fillRect(cx - 10, cy - 8, 22, 5);
          ctx.fillRect(cx - 10, cy - 2, 22, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(cx + 12, cy - 8, 2.5, 5);
          ctx.fillRect(cx + 12, cy - 2, 2.5, 5);
          // Twin 30mm barrels
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(cx - 2, cy - 5);
          ctx.lineTo(cx + 28, cy - 16);
          ctx.stroke();
          // Mast Radar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx - 16, cy - 22, 3, 9);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(cx - 24, cy - 22);
          ctx.lineTo(cx - 8, cy - 22);
          ctx.stroke();
          ctx.restore();
        }
      },

      // 5. 2K12 KUB / SA-6 GAINFUL (MOBILE SAM)
      {
        id: 'sa6',
        name: '2K12 KUB (SA-6 GAINFUL)',
        nato: 'SA-6 GAINFUL / 3M9 MISSILE BATTERY',
        category: 'MOBILE_SAM',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'Soviet Union / Indian Air Force & Army',
        role: 'Tracked Triple-Rail Low-to-Medium Altitude SAM',
        firstAppeared: 'Wave 3+ (Heat-Seeking SAM Missiles)',
        specs: {
          range: '24 km Engagement Radius',
          speed: 'Mach 2.8',
          altitude: '100 m to 14,000 m Ceiling',
          radar: '1S91 "Straight Flush" 3D Radar',
          hp: '90 HP (Wave 3) → 180 HP (Wave 5+)',
          damage: '45 HP (+3.5 HP per wave level)',
          fireRate: 'Triple Heavy Missile Rail Launcher'
        },
        dossier:
          'Battle-proven mobile surface-to-air missile system. Mounted on a GM-578 tracked vehicle, it carries three large 3M9 solid-rocket/ramjet missiles on an armored turntable launcher.\n\n' +
          'Renowned for its high-g turning ability in the terminal phase, requiring aggressive maneuvering and thermal countermeasures to evade.',
        countermeasures:
          '★ MAGNESIUM FLARES [F]: Successfully distracts the infrared terminal seeker.\n' +
          '★ RAPID CLIMB & DIVE JINK: Force the 3M9 missile into an extreme angle-of-attack where it runs out of kinetic energy.\n' +
          '★ 30mm CANNON STRAFING: The exposed missile rails are susceptible to direct 30mm GAU-8 or Vulcan fire.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Tracked Chassis
          ctx.fillStyle = '#3a442d';
          ctx.fillRect(cx - 32, cy + 6, 64, 12);
          ctx.fillStyle = '#1c201a';
          for (let wx = -26; wx <= 26; wx += 13) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 18, 5.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Turntable with 3 missiles
          ctx.fillStyle = '#4e5b3c';
          ctx.fillRect(cx - 10, cy - 4, 20, 10);
          ctx.save();
          ctx.translate(cx, cy - 4);
          ctx.rotate(-0.55);
          for (let off = -5; off <= 5; off += 5) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(0, off - 2, 34, 4);
            ctx.fillStyle = '#e53e3e';
            ctx.fillRect(32, off - 2, 4, 4);
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(4, off - 3.5, 6, 7);
          }
          ctx.restore();
          ctx.restore();
        }
      },

      // 6. ZSU-57-2 TWIN 57mm FLAK ARTILLERY
      {
        id: 'zsu57',
        name: 'ZSU-57-2 TWIN FLAK TANK',
        nato: 'SPZ-57-2 / "SPARK"' ,
        category: 'SPAAG_FLAK',
        threat: 'MODERATE',
        threatColor: '#48bb78',
        origin: 'Soviet Union / Export Variants',
        role: 'Heavy Twin 57mm Anti-Aircraft Gun Platform',
        firstAppeared: 'Wave 1+ (Heavy Kinetic Flak Bursts)',
        specs: {
          range: '4.0 km Ground-to-Air Blast Range',
          speed: '1,000 m/s Muzzle Velocity',
          altitude: '4,000 m Flak Altitude',
          radar: 'Optical Ring Sight + Rangefinder',
          hp: '90 HP (+15 HP per wave)',
          damage: '15 HP per 57mm heavy flak shell',
          fireRate: 'Twin 57mm Heavy Alternating Recoil'
        },
        dossier:
          'Classic heavy anti-aircraft tank utilizing a modified T-54 chassis with an open-topped turret holding twin 57mm S-68 autocannons. Fires heavy fragmentation shells that create massive kinetic airburst clouds.',
        countermeasures:
          '★ HIGH HORIZONTAL AIRSPEED: The manual optical turret has a slow traverse rate; high-speed flanking runs leave it unable to track.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // T-54 Chassis
          ctx.fillStyle = '#343a2b';
          ctx.fillRect(cx - 32, cy + 6, 64, 12);
          ctx.fillStyle = '#1c201a';
          for (let wx = -24; wx <= 24; wx += 12) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 18, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          // Open Turret
          ctx.fillStyle = '#444d39';
          ctx.fillRect(cx - 16, cy - 6, 32, 12);
          // Twin Long 57mm Barrels
          ctx.strokeStyle = '#181c15';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy - 4);
          ctx.lineTo(cx + 4 + Math.cos(-0.6) * 32, cy - 4 + Math.sin(-0.6) * 32);
          ctx.moveTo(cx + 4, cy);
          ctx.lineTo(cx + 4 + Math.cos(-0.6) * 32, cy + Math.sin(-0.6) * 32);
          ctx.stroke();
          ctx.restore();
        }
      },

      // 7. BM-21 GRAD MLRS (ROCKET ARTILLERY)
      {
        id: 'bm21',
        name: 'BM-21 GRAD MLRS TRUCK',
        nato: 'BM-21 GRAD / 9K51 MULTIPLE ROCKET LAUNCHER',
        category: 'ARMOR_GROUND',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'Soviet Union / Indian Army Regiment of Artillery',
        role: '122mm 40-Tube Heavy Rocket Artillery Platform',
        firstAppeared: 'Wave 3+ (Fires 6-Rocket Saturation Salvos)',
        specs: {
          range: '20 to 40 km Saturation Bombardment',
          speed: '690 m/s Rocket Velocity',
          altitude: 'Ballistic Arcing Trajectory',
          radar: 'PG-1M Panoramic Sight + Radio Telemetry',
          hp: '75 HP (+15 HP per wave)',
          damage: '30 HP per 122mm rocket explosion',
          fireRate: '40-Tube Rapid Sequenced Volley'
        },
        dossier:
          'Mounted on a rugged Ural-375D 6x6 truck, the BM-21 Grad carries a 40-tube launcher pack for 122mm unguided rockets. In combat, it saturates entire grid squares with devastating high-explosive fragmentation volleys.',
        countermeasures:
          '★ UNARMORED TRUCK CABIN: Easily pierced by 20mm Vulcan or 30mm GAU-8 fire.\n' +
          '★ CLUSTER BOMBS [C]: Excellent area weapon to incinerate the launcher rack before it fires.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Ural Truck
          ctx.fillStyle = '#39462f';
          ctx.fillRect(cx - 30, cy + 6, 60, 10);
          ctx.fillStyle = '#48573b';
          ctx.fillRect(cx + 14, cy - 4, 16, 10);
          ctx.fillStyle = '#1c201a';
          for (const x of [-22, -10, 18]) {
            ctx.beginPath();
            ctx.arc(cx + x, cy + 16, 6.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // 40-Tube Rocket Rack
          ctx.save();
          ctx.translate(cx - 10, cy + 4);
          ctx.rotate(-0.55);
          ctx.fillStyle = '#22281e';
          ctx.fillRect(0, -10, 32, 14);
          ctx.fillStyle = '#d69e2e';
          for (let ry = -8; ry <= 2; ry += 3) {
            ctx.fillRect(30, ry, 3, 2);
          }
          ctx.restore();
          ctx.restore();
        }
      },

      // 8. T-72 URAL MAIN BATTLE TANK
      {
        id: 't72',
        name: 'T-72 URAL / AJEYA TANK',
        nato: 'T-72M1 MAIN BATTLE TANK',
        category: 'ARMOR_GROUND',
        threat: 'MODERATE',
        threatColor: '#48bb78',
        origin: 'Soviet Union / Indian Army Armoured Corps',
        role: 'Heavy Armored Ground Assault Vehicle',
        firstAppeared: 'Wave 1+ (125mm Cannon & Heavy Armor)',
        specs: {
          range: '4.0 km Ground Cannon / 1.5 km Anti-Air DShK',
          speed: '60 km/h Cross-Country',
          altitude: 'Ground Level Mobile Platform',
          radar: 'Laser Rangefinder TPD-K1',
          hp: '80 HP (Wave 1) → 180 HP (Wave 5+)',
          damage: '15 HP cannon / machine gun fire',
          fireRate: 'Autoloaded 125mm Smoothbore'
        },
        dossier:
          'Backbone of armored formations. Low-profile cast turret, composite armor glacis, and a 125mm 2A46 smoothbore gun with coaxial and roof-mounted anti-aircraft machine gun.',
        countermeasures:
          '★ TOP-ATTACK HELLFIRE MISSILE: Exploits thin roof armor above the autoloader carousel for instant 1-hit kill.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          ctx.fillStyle = '#3a442d';
          ctx.fillRect(cx - 30, cy + 6, 60, 10);
          ctx.fillStyle = '#1c201a';
          for (let wx = -24; wx <= 24; wx += 9.6) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 16, 5.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#485539';
          ctx.beginPath();
          ctx.arc(cx, cy + 4, 12, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = '#181c15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy + 2);
          ctx.lineTo(cx + 34, cy + 2);
          ctx.stroke();
          ctx.restore();
        }
      },

      // 8b. M1A2 SEPv3 ABRAMS (MAIN BATTLE TANK - TROPHY APS)
      {
        id: 'm1a2_abrams',
        name: 'M1A2 SEPv3 ABRAMS',
        nato: 'ABRAMS HEAVY MBT / TROPHY APS',
        category: 'ARMOR_GROUND',
        threat: 'HIGH',
        threatColor: '#f6ad55',
        origin: 'United States Army / Coalition Forces',
        role: 'Heavy Main Battle Tank with Active Trophy Barrier & 120mm APFSDS',
        firstAppeared: 'Wave 2+ (Lead-Tracking APFSDS & Trophy APS)',
        specs: {
          range: '4.5 km Direct Fire APFSDS Kinetic Sabot',
          speed: '67 km/h AGT1500 Gas Turbine',
          altitude: 'Ground Level Mobile Heavy Platform',
          radar: 'CITV 3rd Gen FLIR + Trophy Radar Antennas',
          hp: '140 HP Base + 50 HP Trophy Active Shield',
          damage: '30 HP High-Velocity Kinetic Penetrator',
          fireRate: 'Manual Loader with Fast Lead Prediction'
        },
        dossier:
          'REA reverse-engineered from Tank Stars heavy armor doctrine. Fitted with a Trophy Active Protection System generating a kinetic intercept barrier (50 HP shield), Chobham depleted uranium composite armor, and a 120mm M256 smoothbore cannon firing Mach 5 APFSDS sabot darts.',
        countermeasures:
          '★ DEPLETED URANIUM OR MULTI-HIT: Strip the Trophy shield barrier with 20mm Vulcan or GBU-12 bomb splash before delivering heavy rocket ordnance.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          ctx.fillStyle = '#bfa576';
          ctx.fillRect(cx - 32, cy + 5, 64, 11);
          ctx.fillStyle = '#222';
          for (let wx = -26; wx <= 26; wx += 8.6) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 16, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#cfb989';
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy + 5);
          ctx.lineTo(cx - 16, cy - 6);
          ctx.lineTo(cx + 14, cy - 6);
          ctx.lineTo(cx + 24, cy + 5);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#2b261f';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx + 14, cy - 2);
          ctx.lineTo(cx + 38, cy - 2);
          ctx.stroke();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(cx - 18, cy - 8, 4, 3);
          ctx.fillRect(cx + 8, cy - 8, 4, 3);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - 34, cy - 10, 68, 30);
          ctx.restore();
        }
      },

      // 8c. T-90M PRORYV-3 (MAIN BATTLE TANK - RELIKT ERA)
      {
        id: 't90m_proryv',
        name: 'T-90M PRORYV-3',
        nato: 'BREAKTHROUGH-3 ADVANCED MBT / RELIKT ERA',
        category: 'ARMOR_GROUND',
        threat: 'HIGH',
        threatColor: '#f6ad55',
        origin: 'Russian Federation Armed Forces',
        role: 'Advanced Breakthrough MBT with Relikt Explosive Reactive Armor',
        firstAppeared: 'Wave 2+ (Relikt ERA & 125mm Guided Cannon)',
        specs: {
          range: '5.0 km Gun-Launched Refleks Guided Missiles',
          speed: '60 km/h V-92S2F Diesel',
          altitude: 'Ground Level Mobile Heavy Platform',
          radar: 'Kalina Fire Control & Sosna-U Thermal Sight',
          hp: '160 HP Base + Relikt ERA (50% Blast Absorption)',
          damage: '28 HP 125mm Smoothbore APFSDS',
          fireRate: 'Carousel Autoloader (8 rounds/min)'
        },
        dossier:
          'REA reverse-engineered from Tank Stars frontline tanks. Features modular Relikt Explosive Reactive Armor (ERA) tiles covering turret and skirts that reduce explosive bomb damage by 50%. Deploys 3D aerosol smoke screens upon taking damage to disrupt targeting.',
        countermeasures:
          '★ DIRECT CANNON PENETRATION: Sustained 20mm armor-piercing cannon fire bypasses ERA explosive detonation plates better than high-explosive bombs.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          ctx.fillStyle = '#3f4f38';
          ctx.fillRect(cx - 30, cy + 6, 60, 10);
          ctx.fillStyle = '#1c201a';
          for (let wx = -24; wx <= 24; wx += 8) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 16, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#4c5d42';
          ctx.beginPath();
          ctx.moveTo(cx - 18, cy + 6);
          ctx.lineTo(cx - 10, cy - 5);
          ctx.lineTo(cx + 12, cy - 5);
          ctx.lineTo(cx + 22, cy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#2c3627';
          for (let ex = -12; ex <= 16; ex += 6) {
            ctx.fillRect(cx + ex, cy + 1, 4, 3);
          }
          ctx.strokeStyle = '#22281e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 12, cy);
          ctx.lineTo(cx + 40, cy);
          ctx.stroke();
          ctx.fillStyle = '#111';
          ctx.fillRect(cx + 38, cy - 2, 4, 4);
          ctx.restore();
        }
      },

      // 8d. 2S35 KOALITSIYA-SV (152mm SELF-PROPELLED HOWITZER)
      {
        id: 'koalitsia_sv',
        name: '2S35 KOALITSIYA-SV',
        nato: 'COALITION 152mm HIGH-ANGLE ARTILLERY',
        category: 'ARMOR_GROUND',
        threat: 'HIGH',
        threatColor: '#ed8936',
        origin: 'Russian Ground Forces Artillery Brigade',
        role: 'Autonomous Long-Range Artillery & High-Angle Flak Airburst Barrage',
        firstAppeared: 'Wave 3+ (Entrenched High-Angle Anti-Air Airburst)',
        specs: {
          range: '70 km Precision Guided / 6.0 km High-Angle Direct',
          speed: '60 km/h Armored Tracked Chassis',
          altitude: 'Ground Level Fortified Artillery Position',
          radar: 'Autonomous Automated Fire Direction Computer',
          hp: '130 HP (Heavy Fortified Entrenchment: -35% Damage)',
          damage: '35 HP 152mm Airburst Proximity Flak Shrapnel',
          fireRate: 'Pneumatic Autoloader (16 rounds/min)'
        },
        dossier:
          'REA reverse-engineered from Tank Stars artillery systems. Features a massive uncrewed 152mm 2A88 long-barreled howitzer capable of vertical elevation, lobbing airburst flak shells that detonate near the player aircraft, spraying lethal proximity shrapnel.',
        countermeasures:
          '★ HIGH-SPEED VERTICAL DIVE: Attack from the blind spot behind its firing arc before its pneumatic autoloader cycles another airburst flak shell.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          ctx.fillStyle = '#44503b';
          ctx.fillRect(cx - 32, cy + 6, 64, 10);
          ctx.fillStyle = '#1c201a';
          for (let wx = -26; wx <= 26; wx += 8.6) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 16, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#55644a';
          ctx.fillRect(cx - 16, cy - 8, 30, 14);
          ctx.strokeStyle = '#283023';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(cx + 10, cy - 2);
          ctx.lineTo(cx + 36, cy - 18);
          ctx.stroke();
          ctx.fillStyle = '#1a1f17';
          ctx.fillRect(cx + 34, cy - 22, 6, 6);
          ctx.fillStyle = '#333';
          ctx.fillRect(cx + 8, cy - 6, 12, 4);
          ctx.restore();
        }
      },

      // 8e. TOS-1A BURATINO (HEAVY THERMOBARIC FLAMETHROWER)
      {
        id: 'buratino_tos1',
        name: 'TOS-1A BURATINO / SOLNTSEPEK',
        nato: 'HEAVY THERMOBARIC MULTIPLE LAUNCH ROCKET TANK',
        category: 'ARMOR_GROUND',
        threat: 'CRITICAL',
        threatColor: '#f56565',
        origin: 'NBC Protection Troops of Russian Armed Forces',
        role: 'Heavy Armored Thermobaric Rocket Launcher & Shockwave Area Denial',
        firstAppeared: 'Wave 3+ (220mm Thermobaric Salvos & Firestorms)',
        specs: {
          range: '6.0 km Maximum Rocket Range',
          speed: '60 km/h T-72 Heavy Tank Chassis',
          altitude: 'Ground Level Mobile Siege Platform',
          radar: 'Ballistic Computer & Laser Rangefinder 1D14',
          hp: '150 HP Heavy Armored Launcher Box',
          damage: '40 HP Fuel-Air Thermobaric Vacuum Blast Shockwave',
          fireRate: '24-Tube Salvo (3-Round Thermobaric Waves)'
        },
        dossier:
          'REA reverse-engineered from Tank Stars heavy rocket launchers (Atomic/Toxic). Mounted on a heavy T-72 chassis, the TOS-1A fires 220mm unguided thermobaric rockets creating high-temperature fuel-air fireballs and expanding overpressure shockwaves that catch low-flying aircraft.',
        countermeasures:
          '★ IMMEDIATE ALTITUDE CLIMB: Climb above 350m to escape the expanding fuel-air overpressure shockwave, then strike the unprotected rocket box with AGM-65 missiles.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          ctx.fillStyle = '#4a4435';
          ctx.fillRect(cx - 30, cy + 6, 60, 10);
          ctx.fillStyle = '#1c201a';
          for (let wx = -24; wx <= 24; wx += 8) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 16, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.save();
          ctx.translate(cx - 2, cy - 2);
          ctx.rotate(-0.35);
          ctx.fillStyle = '#2d3328';
          ctx.fillRect(-10, -12, 28, 14);
          ctx.fillStyle = '#e65100';
          for (let rx = -6; rx <= 14; rx += 5) {
            for (let ry = -9; ry <= -1; ry += 4) {
              ctx.fillRect(rx, ry, 3, 2.5);
            }
          }
          ctx.restore();
          ctx.restore();
        }
      },

      // 9. MIL MI-24 HIND (AIRBORNE BOSS GUNSHIP)
      {
        id: 'mi24',
        name: 'MIL MI-24 HIND ("FLYING TANK")',
        nato: 'HIND-E / 35-SQUADRON AIRBORNE BOSS',
        category: 'AIRBORNE',
        threat: 'CRITICAL',
        threatColor: '#ff2222',
        origin: 'Soviet Union / Indian Air Force Attack Squadron',
        role: 'Heavy Armored Attack Helicopter & Air Superiority Boss',
        firstAppeared: 'Boss Sorties & Escorted Waves',
        specs: {
          range: '450 km Combat Radius',
          speed: '335 km/h High-Speed Rotor Flight',
          altitude: 'Hover to 4,500 m Flight Ceiling',
          radar: 'Raduga-F Anti-Tank Guidance Optics',
          hp: '350 HP (Heavy Armored Cockpit Bathtub)',
          damage: '12 HP 12.7mm Gatling / 45 HP Ataka Missiles',
          fireRate: 'Rotary 4-Barrel Gatling + Dual S-8 Rocket Pods'
        },
        dossier:
          'Feared worldwide as the "Flying Tank". Combines titanium armored tandem cockpits with heavy stub-wings carrying dual rocket pods and anti-tank guided missiles. Commands the skies with rotary cannon bursts and airborne missile launches.',
        countermeasures:
          '★ ENERGY DOGFIGHT: Do not hover in front of the Hind\'s nose turret. Perform high-speed boom-and-zoom passes with 20mm/30mm rotary cannons.\n' +
          '★ AIM-9 SIDEWINDER / AIM-54 PHOENIX: Lock from rear quadrant where rotor downwash masks thermal signatures.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          const rotorSpin = time * 24.0;
          // Fuselage
          ctx.fillStyle = '#3c4c34';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 32, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tail Boom
          ctx.fillStyle = '#2f3b28';
          ctx.fillRect(cx - 52, cy - 3, 24, 5);
          // Tail Rotor
          ctx.fillStyle = '#718096';
          ctx.fillRect(cx - 54, cy - 10 + Math.sin(rotorSpin) * 7, 3, 14);
          // Tandem Bubble Cockpits
          ctx.fillStyle = '#90cdf4';
          ctx.beginPath();
          ctx.arc(cx + 18, cy - 2, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + 26, cy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Stub Wings & Rocket Pods
          ctx.fillStyle = '#22281e';
          ctx.fillRect(cx - 4, cy + 4, 14, 4);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cx + 2, cy + 7, 10, 4);
          // Main Rotor Mast & Spinning Blades
          ctx.strokeStyle = '#181c15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy - 9);
          ctx.lineTo(cx + 4, cy - 15);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(200, 225, 200, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(cx + 4, cy - 16, Math.abs(Math.sin(rotorSpin) * 44) + 6, 2.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      },

      // 10. MIG-21 FISHBED (SUPERSONIC JET INTERCEPTOR)
      {
        id: 'mig21',
        name: 'MIKOPYAN-GUREVICH MIG-21',
        nato: 'FISHBED / IAF BISON INTERCEPTOR',
        category: 'AIRBORNE',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'Soviet Union / Indian Air Force Interceptor Wing',
        role: 'Mach 2+ Delta-Wing High-Altitude Air Superiority Fighter',
        firstAppeared: 'Wave 2+ (Air-to-Air Guns & Atoll Missiles)',
        specs: {
          range: '1,200 km Operational Range',
          speed: 'Mach 2.05 (Supersonic Interception)',
          altitude: '17,500 m Flight Ceiling',
          radar: 'Kopyo Phased Array Interceptor Radar',
          hp: '70 HP (Fast & Highly Agile)',
          damage: '15 HP GSh-23 twin cannon / 40 HP R-3S Atoll missile',
          fireRate: 'High-Speed Diving Strafing Run'
        },
        dossier:
          'Classic supersonic interceptor renowned for its triangular delta-wing design and conical shock-cone nose intake. Capable of supersonic dive attacks, strafing with twin GSh-23 cannons, and launching infrared R-3S Atoll missiles.',
        countermeasures:
          '★ SCISSORS MANEUVER: The MiG-21 bleeds airspeed rapidly during sustained turns. Force it to overshoot, then acquire missile lock from its 6 o\'clock!',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Delta-Wing Jet
          ctx.fillStyle = '#718096';
          ctx.beginPath();
          ctx.moveTo(cx + 34, cy);
          ctx.lineTo(cx - 24, cy - 7);
          ctx.lineTo(cx - 28, cy);
          ctx.lineTo(cx - 24, cy + 7);
          ctx.closePath();
          ctx.fill();
          // Delta Wings
          ctx.fillStyle = '#4a5568';
          ctx.beginPath();
          ctx.moveTo(cx + 6, cy);
          ctx.lineTo(cx - 16, cy - 20);
          ctx.lineTo(cx - 20, cy);
          ctx.lineTo(cx - 16, cy + 20);
          ctx.closePath();
          ctx.fill();
          // Afterburner Pulse
          ctx.fillStyle = '#ff7700';
          const ab = 8 + Math.random() * 6;
          ctx.fillRect(cx - 28 - ab, cy - 2, ab, 4);
          ctx.restore();
        }
      },

      // 10B. MIG-29 FULCRUM (4TH-GEN AIR SUPERIORITY INTERCEPTOR)
      {
        id: 'mig29',
        name: 'MIKOYAN MIG-29 FULCRUM',
        nato: 'FULCRUM / 4TH-GEN AIR SUPERIORITY',
        category: 'AIRBORNE',
        threat: 'VERY HIGH',
        threatColor: '#ff7733',
        origin: 'Soviet Union / Russian VKS Interceptor Regiments',
        role: '4th-Gen Twin-Engine All-Weather Air Superiority Interceptor',
        firstAppeared: 'Counters Subsonic CAS (A-10, Su-25, F-4)',
        specs: {
          range: '1,500 km Combat Radius',
          speed: 'Mach 2.25 (Supersonic Interceptor)',
          altitude: '18,000 m Operational Ceiling',
          radar: 'N019 Rubin Pulse-Doppler Radar',
          hp: '160 HP (Twin Klimov RD-33 Engines)',
          damage: '20 HP GSh-30-1 AP / 45 HP R-73 Archer Missile',
          fireRate: 'Continuous 6 o\'clock Tailing Burst'
        },
        dossier:
          'Engineered specifically to outmatch subsonic ground-attack planes and early fighters. Possesses an extraordinary thrust-to-weight ratio, helmet-mounted target cuing, and high-off-boresight R-73 Archer heat-seeking missiles. Automatically latches onto the player\'s 6 o\'clock and closes distance with afterburners.',
        countermeasures:
          '★ EVASIVE SPIRAL & FLARES: Deploy magnesium decoy flares [F] the instant an R-73 missile lock is detected. Break high and force an overshoot to switch from prey to hunter!',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Twin Afterburner Plumes
          ctx.fillStyle = '#ff5500';
          const flm = 12 + Math.random() * 8;
          ctx.fillRect(cx - 24 - flm, cy - 5, flm, 3);
          ctx.fillRect(cx - 24 - flm, cy + 2, flm, 3);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(cx - 24 - flm * 0.4, cy - 4.5, flm * 0.3, 2);
          ctx.fillRect(cx - 24 - flm * 0.4, cy + 2.5, flm * 0.3, 2);

          // Blended Airframe
          ctx.fillStyle = '#3a4e5e';
          ctx.beginPath();
          ctx.moveTo(cx + 28, cy);
          ctx.lineTo(cx + 8, cy - 6);
          ctx.lineTo(cx - 12, cy - 20);
          ctx.lineTo(cx - 18, cy - 19);
          ctx.lineTo(cx - 14, cy - 6);
          ctx.lineTo(cx - 24, cy - 6);
          ctx.lineTo(cx - 24, cy + 6);
          ctx.lineTo(cx - 14, cy + 6);
          ctx.lineTo(cx - 18, cy + 19);
          ctx.lineTo(cx - 12, cy + 20);
          ctx.lineTo(cx + 8, cy + 6);
          ctx.closePath();
          ctx.fill();

          // Canted Twin Fins
          ctx.fillStyle = '#2c3c4a';
          ctx.beginPath();
          ctx.moveTo(cx - 12, cy - 7);
          ctx.lineTo(cx - 23, cy - 11);
          ctx.lineTo(cx - 17, cy - 5);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx - 12, cy + 7);
          ctx.lineTo(cx - 23, cy + 11);
          ctx.lineTo(cx - 17, cy + 5);
          ctx.closePath();
          ctx.fill();

          // Cockpit Bubble
          ctx.fillStyle = '#ffb300';
          ctx.beginPath();
          ctx.ellipse(cx + 6, cy, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },

      // 10C. SU-35 FLANKER-E (4.5++ GEN SUPER-MANEUVERABLE AIR DOMINANCE)
      {
        id: 'su35',
        name: 'SUKHOI SU-35 FLANKER-E',
        nato: 'SUPER FLANKER / 4.5++ GEN DOMINANCE',
        category: 'AIRBORNE',
        threat: 'EXTREME',
        threatColor: '#ffea00',
        origin: 'Russian Air Force 23rd Fighter Aviation Regiment',
        role: '4.5++ Generation Super-Maneuverable Air Superiority Fighter',
        firstAppeared: 'Counters F-14 Tomcat & AV-8B Harrier',
        specs: {
          range: '3,600 km Ferry Range',
          speed: 'Mach 2.25+ Supercruise capable',
          altitude: '20,000 m Stratospheric Ceiling',
          radar: 'Irbis-E PESA Phased Array Radar (400 km range)',
          hp: '230 HP (Heavy Airframe & Titanium Spars)',
          damage: '26 HP 30mm AP / 55 HP R-77 Active Radar Viper',
          fireRate: 'Rapid Tracer Salvo + Pugachev Cobra'
        },
        dossier:
          'The pinnacle of supermaneuverability. Equipped with 3D thrust-vectoring nozzles and the deadly Pugachev\'s Cobra maneuver: if a target attempts to airbrake, the Su-35 pitches up 90° in mid-air, sheds velocity in an instant, and remains glued to the victim\'s tail!',
        countermeasures:
          '★ DO NOT RELY ON SIMPLE BRAKING: When the Su-35 executes a Cobra, dive immediately towards terrain and initiate an Immelmann turn to escape its weapon cone.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Thrust-Vectoring Flame Plumes
          ctx.fillStyle = '#ff7700';
          const flm = 18 + Math.random() * 10;
          ctx.fillRect(cx - 26 - flm, cy - 6, flm, 3);
          ctx.fillRect(cx - 26 - flm, cy + 3, flm, 3);
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(cx - 26 - flm * 0.4, cy - 5.5, flm * 0.3, 2);
          ctx.fillRect(cx - 26 - flm * 0.4, cy + 3.5, flm * 0.3, 2);

          // Blended Splinter Camo Airframe
          ctx.fillStyle = '#47697d';
          ctx.beginPath();
          ctx.moveTo(cx + 34, cy);
          ctx.lineTo(cx + 12, cy - 7);
          ctx.lineTo(cx - 14, cy - 25);
          ctx.lineTo(cx - 22, cy - 23);
          ctx.lineTo(cx - 18, cy - 8);
          ctx.lineTo(cx - 30, cy);
          ctx.lineTo(cx - 18, cy + 8);
          ctx.lineTo(cx - 22, cy + 23);
          ctx.lineTo(cx - 14, cy + 25);
          ctx.lineTo(cx + 12, cy + 7);
          ctx.closePath();
          ctx.fill();

          // Splinter Camo
          ctx.fillStyle = '#6d92a8';
          ctx.beginPath();
          ctx.moveTo(cx + 10, cy - 5);
          ctx.lineTo(cx - 2, cy - 14);
          ctx.lineTo(cx - 10, cy - 8);
          ctx.closePath();
          ctx.fill();

          // Twin Tailfins
          ctx.fillStyle = '#314c5c';
          ctx.fillRect(cx - 25, cy - 11, 10, 4);
          ctx.fillRect(cx - 25, cy + 7, 10, 4);

          // Tinted Cyan Cockpit
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.ellipse(cx + 10, cy, 10, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },

      // 10D. SU-57 FELON (5TH-GEN STEALTH HYPERSONIC AIR SUPERIORITY)
      {
        id: 'su57',
        name: 'SUKHOI SU-57 FELON',
        nato: 'FELON / 5TH-GEN STEALTH HYPERSONIC',
        category: 'AIRBORNE',
        threat: 'CRITICAL',
        threatColor: '#00f0ff',
        origin: 'Russian Aerospace Forces 5th-Gen Stealth Wing',
        role: '5th Generation Stealth Multirole Air Superiority Fighter',
        firstAppeared: 'Counters AC-130 Gunship & RAH-66 Comanche',
        specs: {
          range: '3,500 km Supercruise Range',
          speed: 'Mach 2.0+ Supercruise / Hypersonic Dash',
          altitude: '20,000 m Stealth Operational Ceiling',
          radar: 'Sh121 N036 Byelka 3D AESA Radar',
          hp: '290 HP (Titanium & Radar-Absorbing Composites)',
          damage: '32 HP 30mm AP / 65 HP R-74M2 Hypersonic Missile',
          fireRate: 'Hypersonic Internal Bay Missile Barrage'
        },
        dossier:
          'The apex aerial predator. Coated in radar-absorbent graphite composites with internal weapon bays and 3D thrust-vectoring supercruise engines. Deployed to hunt down heavy gunships (AC-130) and stealth scouts. Has near-zero radar cross section and merciless dogfighting AI.',
        countermeasures:
          '★ MAXIMUM ALERT: The Su-57 is faster, stealthier, and more heavily armed than any standard aircraft. Call in Air Support wingmen [H], pop emergency flares [F], and employ napalm/rockets defensively!',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Blue-White Plasma Afterburners
          ctx.fillStyle = '#00b0ff';
          const flm = 22 + Math.random() * 12;
          ctx.fillRect(cx - 28 - flm, cy - 6, flm, 3);
          ctx.fillRect(cx - 28 - flm, cy + 3, flm, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - 28 - flm * 0.45, cy - 5, flm * 0.35, 1.5);
          ctx.fillRect(cx - 28 - flm * 0.45, cy + 4, flm * 0.35, 1.5);

          // Diamond-Trapezoid Stealth Airframe
          ctx.fillStyle = '#1c2226';
          ctx.strokeStyle = '#36434d';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx + 36, cy);
          ctx.lineTo(cx + 14, cy - 9);
          ctx.lineTo(cx - 8, cy - 27);
          ctx.lineTo(cx - 18, cy - 25);
          ctx.lineTo(cx - 15, cy - 11);
          ctx.lineTo(cx - 28, cy - 8);
          ctx.lineTo(cx - 24, cy);
          ctx.lineTo(cx - 28, cy + 8);
          ctx.lineTo(cx - 15, cy + 11);
          ctx.lineTo(cx - 18, cy + 25);
          ctx.lineTo(cx - 8, cy + 27);
          ctx.lineTo(cx + 14, cy + 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Internal Bay Seam
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(cx - 8, cy - 3.5, 14, 7);

          // Gold-Indium Oxide Canopy
          ctx.fillStyle = '#e6a100';
          ctx.beginPath();
          ctx.ellipse(cx + 12, cy, 10, 3.0, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },

      // 10E. KA-52 ALLIGATOR (COAXIAL CHOPPER HUNTER)
      {
        id: 'ka52',
        name: 'KAMOV KA-52 ALLIGATOR',
        nato: 'HOKUM-B / COAXIAL CHOPPER HUNTER',
        category: 'AIRBORNE',
        threat: 'VERY HIGH',
        threatColor: '#ff3366',
        origin: 'Russian Army Aviation Coaxial Gunship Fleet',
        role: 'Coaxial Dual-Rotor Reconnaissance & Attack Helicopter',
        firstAppeared: 'Counters AH-1 Cobra, Apache & Chinook',
        specs: {
          range: '1,100 km Combat Range',
          speed: '310 km/h (Fastest Attack Helicopter)',
          altitude: '5,500 m Static Ceiling',
          radar: 'FH01 Arbalet Dual-Band Radar',
          hp: '180 HP (Armored Titanium Tub)',
          damage: '18 HP 30mm 2A42 / 40 HP Igla-V AAM',
          fireRate: '30mm Armor Piercing Autocannon Salvos'
        },
        dossier:
          'Twin coaxial counter-rotating rotor design completely removes the need for a tail rotor, granting unrivaled agility in hovering dogfights. Dispatched specifically to hunt and destroy player helicopters (AH-1 Cobra, Apache, Chinook) with 30mm side cannons and Igla-V dogfight missiles.',
        countermeasures:
          '★ VERTICAL HOVER DOGFIGHT: Utilize VTOL hover and circle around its flank. The Ka-52\'s side cannon has limited traverse to port.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Fuselage
          ctx.fillStyle = '#1d271e';
          ctx.beginPath();
          ctx.moveTo(cx + 26, cy + 2);
          ctx.lineTo(cx + 16, cy - 6);
          ctx.lineTo(cx - 10, cy - 5);
          ctx.lineTo(cx - 28, cy - 2);
          ctx.lineTo(cx - 30, cy - 7);
          ctx.lineTo(cx - 33, cy - 7);
          ctx.lineTo(cx - 31, cy);
          ctx.lineTo(cx - 33, cy + 7);
          ctx.lineTo(cx - 30, cy + 7);
          ctx.lineTo(cx - 28, cy + 2);
          ctx.lineTo(cx - 10, cy + 5);
          ctx.lineTo(cx + 18, cy + 5);
          ctx.closePath();
          ctx.fill();

          // Coaxial Rotors
          const rot1 = (time * 12) % (Math.PI * 2);
          const rot2 = (-time * 12) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(230, 240, 245, 0.75)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(cx - 2 + Math.cos(rot1) * 36, cy - 2 + Math.sin(rot1) * 10);
          ctx.lineTo(cx - 2 - Math.cos(rot1) * 36, cy - 2 - Math.sin(rot1) * 10);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.moveTo(cx - 2 + Math.cos(rot2) * 38, cy - 6 + Math.sin(rot2) * 10);
          ctx.lineTo(cx - 2 - Math.cos(rot2) * 38, cy - 6 - Math.sin(rot2) * 10);
          ctx.stroke();

          // Green Cockpit
          ctx.fillStyle = '#00e676';
          ctx.beginPath();
          ctx.ellipse(cx + 14, cy - 1, 7, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },

      // 10.5. TU-22M3 BACKFIRE SUPERSONIC STRATEGIC BOMBER
      {
        id: 'tu22m',
        name: 'TUPOLEV TU-22M3 BACKFIRE',
        nato: 'BACKFIRE-C / STRATEGIC BOMBER',
        category: 'AIRBORNE',
        threat: 'EXTREME',
        threatColor: '#ff2222',
        origin: 'Tupolev Design Bureau / Russian Aerospace Forces',
        role: 'Long-Range Supersonic Maritime Strike & Standoff Cruise Missile Carrier',
        firstAppeared: 'Wave 4+ (Supersonic Strategic Raids & Kh-22 Cruise Missiles)',
        specs: {
          range: '7,000 km Combat Radius (Air-to-Air Refueled)',
          speed: 'Mach 1.88 (2,300 km/h Supersonic Dash)',
          altitude: '13,300 m (43,600 ft Stratospheric Ceiling)',
          radar: 'Leninets PN-A Downward & Standoff Target Acquisition',
          hp: '580 HP (Titanium Armor Plated Strategic Bomber)',
          damage: '95 (Kh-22 Burya Heavy Supersonic Cruise Missile)',
          fireRate: 'Standoff Heavy Missile Drop + Automated 23mm Tail Turret'
        },
        description: 'The Tu-22M3 Backfire is an imposing Soviet-era variable-sweep supersonic strategic bomber. Entering the combat theater at high altitude, it launches massive Kh-22 standoff cruise missiles capable of obliterating your strike aircraft. It also features an automated rear tail radar and twin 23mm autocannon to engage pursuit fighters.',
        counterTactics: 'Do not stay directly behind the Backfire due to its rear GSh-23 tail turret. Use high-speed climbing intercepts, launch Phoenix or Sidewinder air-to-air missiles, or deploy FPV suicide drone strikes to detonate its heavy cruise missile while in transit.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Variable sweep wings
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy - 3);
          ctx.lineTo(cx - 36, cy - 20);
          ctx.lineTo(cx - 30, cy - 23);
          ctx.lineTo(cx + 8, cy - 5);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cx - 10, cy + 3);
          ctx.lineTo(cx - 36, cy + 20);
          ctx.lineTo(cx - 30, cy + 23);
          ctx.lineTo(cx + 8, cy + 5);
          ctx.closePath();
          ctx.fill();

          // Fuselage
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(cx - 44, cy - 5);
          ctx.lineTo(cx - 44, cy + 5);
          ctx.lineTo(cx + 25, cy + 4);
          ctx.lineTo(cx + 50, cy);
          ctx.lineTo(cx + 25, cy - 4);
          ctx.closePath();
          ctx.fill();

          // Cockpit
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(cx + 18, cy - 3);
          ctx.lineTo(cx + 28, cy - 1);
          ctx.lineTo(cx + 18, cy + 1);
          ctx.closePath();
          ctx.fill();

          // Tail Fin
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(cx - 28, cy - 5);
          ctx.lineTo(cx - 42, cy - 22);
          ctx.lineTo(cx - 36, cy - 22);
          ctx.lineTo(cx - 18, cy - 5);
          ctx.closePath();
          ctx.fill();

          // Underslung Kh-22 missile preview
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(cx - 10, cy + 5, 22, 4);

          // Afterburner fire
          ctx.fillStyle = '#ff5500';
          ctx.fillRect(cx - 52, cy - 3, 8, 6);
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(cx - 48, cy - 1, 4, 2);

          ctx.restore();
        }
      },

      // 11. ARMORED COMBAT RAIL TRAIN
      {
        id: 'train',
        name: 'ARMORED COMBAT RAIL TRAIN',
        nato: 'HEAVY RAIL-MOBILE FORTRESS',
        category: 'ARMOR_GROUND',
        threat: 'HIGH',
        threatColor: '#ff8800',
        origin: 'Soviet Union / Warsaw Pact Doctrine',
        role: 'Heavy Rail-Mounted Multi-Turret Mobile Fortress',
        firstAppeared: 'Railroad Track Sectors',
        specs: {
          range: 'Rail Line Restricted Mobility',
          speed: '65 km/h Track Speed',
          altitude: 'Railway Level',
          radar: 'Optical Fire Director',
          hp: '300 HP (Heavily Armored Steel Carriage)',
          damage: '18 HP Flak Turret Cannons',
          fireRate: 'Multi-Turret Rapid Fire'
        },
        dossier:
          'Heavily armored locomotive and wagons outfitted with reinforced steel plating, flak cannons, and heavy machine gun cupolas. Patrolling rail corridors to suppress allied close air support.',
        countermeasures:
          '★ DERAILEUR BOMBING: Drop 2,000lb heavy bombs directly onto the locomotive engine to trigger catastrophic train explosion.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Heavy Train Carriages
          ctx.fillStyle = '#2d3748';
          ctx.fillRect(cx - 42, cy + 2, 84, 14);
          // Wheels & Rails
          ctx.strokeStyle = '#a0aec0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 48, cy + 20);
          ctx.lineTo(cx + 48, cy + 20);
          ctx.stroke();
          ctx.fillStyle = '#1a202c';
          for (let wx = -36; wx <= 36; wx += 12) {
            ctx.beginPath();
            ctx.arc(cx + wx, cy + 18, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Armored Turrets
          ctx.fillStyle = '#4a5568';
          ctx.beginPath();
          ctx.arc(cx - 18, cy + 2, 7, Math.PI, 0);
          ctx.arc(cx + 18, cy + 2, 7, Math.PI, 0);
          ctx.fill();
          ctx.restore();
        }
      },

      // 12. FORTIFIED PILLBOX BUNKER
      {
        id: 'bunker',
        name: 'FORTIFIED HEAVY PILLBOX BUNKER',
        nato: 'HARDENED EMPLACEMENT / AAA PILLBOX',
        category: 'ARMOR_GROUND',
        threat: 'MODERATE',
        threatColor: '#48bb78',
        origin: 'Universal Defensive Doctrine',
        role: 'Reinforced Concrete Anti-Air Emplacement',
        firstAppeared: 'Wave 1+ (Twin Heavy Anti-Air Guns)',
        specs: {
          range: '1.2 km Anti-Air Envelope',
          speed: 'Static Emplacement',
          altitude: 'Ground Fortification',
          radar: 'Slit Optical Sights',
          hp: '100 HP (Reinforced High-PSI Concrete)',
          damage: '8 HP Machine Gun Bullets',
          fireRate: 'Continuous Arc Suppression'
        },
        dossier:
          'Reinforced ferroconcrete bunker with armored gun slits and top-mounted twin heavy machine guns. Protects strategic bridges, radar stations, and command posts.',
        countermeasures:
          '★ DIRECT KINETIC PENETRATION: Concrete is immune to light 20mm strafing; use high-explosive Mk-82 bombs or precision AGM-114 Hellfire missiles.',
        renderModel: (ctx, cx, cy, time) => {
          ctx.save();
          // Reinforced Concrete Pillbox
          ctx.fillStyle = '#4a5568';
          ctx.beginPath();
          ctx.moveTo(cx - 28, cy + 18);
          ctx.lineTo(cx - 22, cy);
          ctx.lineTo(cx + 22, cy);
          ctx.lineTo(cx + 28, cy + 18);
          ctx.closePath();
          ctx.fill();
          // Vision & Gun Slit
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(cx - 14, cy + 5, 28, 4);
          // Twin Gun Barrels
          ctx.strokeStyle = '#2d3748';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx - 4, cy + 7);
          ctx.lineTo(cx - 4 + Math.cos(-0.5) * 14, cy + 7 + Math.sin(-0.5) * 14);
          ctx.moveTo(cx + 4, cy + 7);
          ctx.lineTo(cx + 4 + Math.cos(-0.5) * 14, cy + 7 + Math.sin(-0.5) * 14);
          ctx.stroke();
          ctx.restore();
        }
      }
    ];
  }

  getFilteredUnits() {
    if (this.activeCategory === 'ALL') return this.units;
    return this.units.filter(u => u.category === this.activeCategory);
  }

  getSelectedUnit() {
    const unit = this.units.find(u => u.id === this.selectedUnitId);
    return unit || this.units[0];
  }

  selectNextUnit() {
    const list = this.getFilteredUnits();
    const currIdx = list.findIndex(u => u.id === this.selectedUnitId);
    const nextIdx = (currIdx + 1) % list.length;
    this.selectedUnitId = list[nextIdx].id;
    if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.5 });
  }

  selectPrevUnit() {
    const list = this.getFilteredUnits();
    const currIdx = list.findIndex(u => u.id === this.selectedUnitId);
    const prevIdx = (currIdx - 1 + list.length) % list.length;
    this.selectedUnitId = list[prevIdx].id;
    if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.5 });
  }

  selectCategory(catId) {
    this.activeCategory = catId;
    const list = this.getFilteredUnits();
    if (list.length > 0) {
      this.selectedUnitId = list[0].id;
    }
    if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.7 });
  }

  handleKeyDown(e) {
    if (e.code === 'KeyI' || e.code === 'Escape') {
      if (this.game && typeof this.game.closeCodex === 'function') {
        this.game.closeCodex();
        return true;
      }
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.selectNextUnit();
      return true;
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.selectPrevUnit();
      return true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      const idx = this.categories.findIndex(c => c.id === this.activeCategory);
      const nextCat = this.categories[(idx + 1) % this.categories.length].id;
      this.selectCategory(nextCat);
      return true;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      const idx = this.categories.findIndex(c => c.id === this.activeCategory);
      const prevCat = this.categories[(idx - 1 + this.categories.length) % this.categories.length].id;
      this.selectCategory(prevCat);
      return true;
    }
    return false;
  }

  handleClick(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (typeof btn.callback === 'function') {
          btn.callback();
          return true;
        }
      }
    }
    return false;
  }

  render(ctx, width, height) {
    this.buttons = [];
    this.hologramTime += 0.025;
    this.radarSweepAngle = (this.radarSweepAngle + 0.04) % (Math.PI * 2);

    ctx.save();

    // 1. CRT Carbon / Dark Terminal Backdrop
    ctx.fillStyle = '#060d08';
    ctx.fillRect(0, 0, width, height);

    // Subtle tactical grid background
    ctx.strokeStyle = 'rgba(25, 65, 35, 0.25)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // 2. Top Header Bar
    ctx.fillStyle = 'rgba(10, 28, 16, 0.95)';
    ctx.fillRect(0, 0, width, 75);
    ctx.strokeStyle = '#2d6a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 75);
    ctx.lineTo(width, 75);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#44ff66';
    ctx.fillText('📖 KNOW YOUR ENEMY // FIELD INTELLIGENCE CODEX', 24, 34);

    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#ffbb00';
    ctx.fillText('DEFENSE INTEGRATION: S-400 TRIUMF • AKASH RAMJET SAM • 2K22 TUNGUSKA • MULTI-TIER REA', 24, 55);

    // Close Button (Top Right)
    const closeBtnX = width - 150;
    const closeBtnY = 20;
    const closeBtnW = 126;
    const closeBtnH = 36;
    this.buttons.push({
      x: closeBtnX,
      y: closeBtnY,
      w: closeBtnW,
      h: closeBtnH,
      callback: () => {
        if (this.game && typeof this.game.closeCodex === 'function') {
          this.game.closeCodex();
        }
      }
    });
    ctx.fillStyle = 'rgba(180, 40, 40, 0.9)';
    ctx.fillRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH);
    ctx.strokeStyle = '#ff6666';
    ctx.strokeRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✕ RESUME (ESC)', closeBtnX + closeBtnW / 2, closeBtnY + 23);

    // 3. Category Filter Tabs
    const tabY = 82;
    const tabH = 30;
    let tabX = 24;
    this.categories.forEach(cat => {
      const isSelected = (this.activeCategory === cat.id);
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      const textW = ctx.measureText(cat.label).width + 24;
      this.buttons.push({
        x: tabX,
        y: tabY,
        w: textW,
        h: tabH,
        callback: () => this.selectCategory(cat.id)
      });

      ctx.fillStyle = isSelected ? 'rgba(30, 95, 45, 0.95)' : 'rgba(12, 35, 18, 0.75)';
      ctx.fillRect(tabX, tabY, textW, tabH);
      ctx.strokeStyle = isSelected ? '#55ff77' : '#225530';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(tabX, tabY, textW, tabH);

      ctx.fillStyle = isSelected ? '#ffff55' : '#88c998';
      ctx.textAlign = 'center';
      ctx.fillText(cat.label, tabX + textW / 2, tabY + 20);

      tabX += textW + 8;
    });

    // 4. Left Sidebar: Scrollable Hostile Unit Roster
    const listX = 24;
    const listY = 120;
    const listW = 270;
    const listH = height - 135;

    ctx.fillStyle = 'rgba(8, 22, 12, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = '#225530';
    ctx.strokeRect(listX, listY, listW, listH);

    const filtered = this.getFilteredUnits();
    const itemH = 44;
    filtered.forEach((u, idx) => {
      const iy = listY + 8 + idx * (itemH + 4);
      if (iy + itemH > listY + listH) return; // simple clamp

      const isSelected = (u.id === this.selectedUnitId);
      this.buttons.push({
        x: listX + 6,
        y: iy,
        w: listW - 12,
        h: itemH,
        callback: () => {
          this.selectedUnitId = u.id;
          if (window.soundSystem) window.soundSystem.play('beep', { volume: 0.6 });
        }
      });

      ctx.fillStyle = isSelected ? 'rgba(28, 80, 42, 0.95)' : 'rgba(14, 32, 18, 0.7)';
      ctx.fillRect(listX + 6, iy, listW - 12, itemH);
      ctx.strokeStyle = isSelected ? '#ffff00' : '#1d4526';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(listX + 6, iy, listW - 12, itemH);

      // Threat Badge on left edge
      ctx.fillStyle = u.threatColor;
      ctx.fillRect(listX + 7, iy + 1, 4, itemH - 2);

      // Name & NATO Code
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isSelected ? '#ffff55' : '#ffffff';
      const shortName = u.name.length > 24 ? u.name.substring(0, 22) + '..' : u.name;
      ctx.fillText(shortName, listX + 18, iy + 18);

      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = '#78a888';
      const shortNato = u.nato.length > 28 ? u.nato.substring(0, 26) + '..' : u.nato;
      ctx.fillText(shortNato, listX + 18, iy + 34);

      // Threat pill on right
      ctx.textAlign = 'right';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillStyle = u.threatColor;
      ctx.fillText(u.threat, listX + listW - 14, iy + 25);
    });

    // 5. Center Viewport: Animated 2D Hologram Viewer
    const centerBoxX = listX + listW + 16;
    const centerBoxY = 120;
    const centerBoxW = 420;
    const centerBoxH = 260;

    ctx.fillStyle = 'rgba(6, 18, 10, 0.95)';
    ctx.fillRect(centerBoxX, centerBoxY, centerBoxW, centerBoxH);
    ctx.strokeStyle = '#327042';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerBoxX, centerBoxY, centerBoxW, centerBoxH);

    // Radar scan lines & circle
    const hcx = centerBoxX + centerBoxW / 2;
    const hcy = centerBoxY + centerBoxH / 2 + 10;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hcx, hcy, 90, 0, Math.PI * 2);
    ctx.arc(hcx, hcy, 50, 0, Math.PI * 2);
    ctx.moveTo(hcx - 100, hcy);
    ctx.lineTo(hcx + 100, hcy);
    ctx.moveTo(hcx, hcy - 100);
    ctx.lineTo(hcx, hcy + 100);
    ctx.stroke();

    // Sweeping Radar Line
    ctx.strokeStyle = 'rgba(85, 255, 120, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hcx, hcy);
    ctx.lineTo(hcx + Math.cos(this.radarSweepAngle) * 90, hcy + Math.sin(this.radarSweepAngle) * 90);
    ctx.stroke();
    ctx.restore();

    // Top Hologram Title Badge
    ctx.fillStyle = 'rgba(15, 45, 25, 0.9)';
    ctx.fillRect(centerBoxX + 1, centerBoxY + 1, centerBoxW - 2, 26);
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#55ff55';
    ctx.fillText('📡 LIVE 2D TACTICAL VECTOR HOLOGRAM // REAL-TIME ANIMATION', centerBoxX + 10, centerBoxY + 18);

    // Call unit-specific live renderModel routine!
    const activeUnit = this.getSelectedUnit();
    if (activeUnit && typeof activeUnit.renderModel === 'function') {
      ctx.save();
      // Ground baseline line
      ctx.strokeStyle = 'rgba(45, 120, 65, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerBoxX + 20, hcy + 25);
      ctx.lineTo(centerBoxX + centerBoxW - 20, hcy + 25);
      ctx.stroke();

      activeUnit.renderModel(ctx, hcx, hcy, this.hologramTime);
      ctx.restore();
    }

    // Hologram Viewport Corner Reticles
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    const cornerSize = 10;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(centerBoxX + 4, centerBoxY + 4 + cornerSize);
    ctx.lineTo(centerBoxX + 4, centerBoxY + 4);
    ctx.lineTo(centerBoxX + 4 + cornerSize, centerBoxY + 4);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(centerBoxX + centerBoxW - 4, centerBoxY + centerBoxH - 4 - cornerSize);
    ctx.lineTo(centerBoxX + centerBoxW - 4, centerBoxY + centerBoxH - 4);
    ctx.lineTo(centerBoxX + centerBoxW - 4 - cornerSize, centerBoxY + centerBoxH - 4);
    ctx.stroke();

    // 6. Center-Bottom: Technical Specifications Grid (2 columns x 4 rows)
    const specBoxY = centerBoxY + centerBoxH + 12;
    const specBoxH = height - specBoxY - 15;
    ctx.fillStyle = 'rgba(8, 22, 12, 0.95)';
    ctx.fillRect(centerBoxX, specBoxY, centerBoxW, specBoxH);
    ctx.strokeStyle = '#225530';
    ctx.strokeRect(centerBoxX, specBoxY, centerBoxW, specBoxH);

    ctx.fillStyle = 'rgba(15, 45, 25, 0.9)';
    ctx.fillRect(centerBoxX + 1, specBoxY + 1, centerBoxW - 2, 24);
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('📊 TECHNICAL TELEMETRY & IN-GAME COMBAT METRICS', centerBoxX + 10, specBoxY + 17);

    if (activeUnit && activeUnit.specs) {
      const sp = activeUnit.specs;
      const metrics = [
        { label: 'ENGAGEMENT RANGE', val: sp.range },
        { label: 'INTERCEPT SPEED', val: sp.speed },
        { label: 'ALTITUDE CEILING', val: sp.altitude },
        { label: 'RADAR GUIDANCE', val: sp.radar },
        { label: 'IN-GAME ARMOR (HP)', val: sp.hp },
        { label: 'WARHEAD DAMAGE', val: sp.damage },
        { label: 'FIRING DOCTRINE', val: sp.fireRate }
      ];

      const rowH = 34;
      metrics.forEach((m, idx) => {
        const ry = specBoxY + 32 + idx * rowH;
        if (ry + rowH > specBoxY + specBoxH) return;

        // Metric strip
        ctx.fillStyle = (idx % 2 === 0) ? 'rgba(14, 34, 20, 0.6)' : 'rgba(10, 26, 15, 0.3)';
        ctx.fillRect(centerBoxX + 6, ry, centerBoxW - 12, rowH - 4);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.fillStyle = '#81c784';
        ctx.fillText(m.label, centerBoxX + 14, ry + 14);

        ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(m.val, centerBoxX + 14, ry + 26);
      });
    }

    // 7. Right Panel: Military Intelligence Dossier & Pilot Survival Protocol
    const rightBoxX = centerBoxX + centerBoxW + 16;
    const rightBoxY = 120;
    const rightBoxW = width - rightBoxX - 24;
    const rightBoxH = height - 135;

    ctx.fillStyle = 'rgba(8, 22, 12, 0.95)';
    ctx.fillRect(rightBoxX, rightBoxY, rightBoxW, rightBoxH);
    ctx.strokeStyle = '#225530';
    ctx.strokeRect(rightBoxX, rightBoxY, rightBoxW, rightBoxH);

    // Unit Identity Header
    ctx.fillStyle = 'rgba(15, 45, 25, 0.95)';
    ctx.fillRect(rightBoxX + 1, rightBoxY + 1, rightBoxW - 2, 58);
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(activeUnit.name, rightBoxX + 14, rightBoxY + 24);

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#68d391';
    ctx.fillText(`ORIGIN: ${activeUnit.origin}  |  THREAT: `, rightBoxX + 14, rightBoxY + 46);
    const prefixW = ctx.measureText(`ORIGIN: ${activeUnit.origin}  |  THREAT: `).width;
    ctx.fillStyle = activeUnit.threatColor;
    ctx.fillText(activeUnit.threat, rightBoxX + 14 + prefixW, rightBoxY + 46);

    // Section 1: Military Lore & PDF Dossier
    const loreY = rightBoxY + 70;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#55ff77';
    ctx.fillText('📜 MILITARY DOSSIER & OPERATIONAL CAPABILITIES:', rightBoxX + 14, loreY);

    // Multi-line text wrapper
    const renderParagraph = (text, startX, startY, maxW, lineH, fillStyle, fontStr) => {
      ctx.font = fontStr;
      ctx.fillStyle = fillStyle;
      const paragraphs = text.split('\n\n');
      let curY = startY;
      for (const p of paragraphs) {
        const words = p.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxW && n > 0) {
            ctx.fillText(line, startX, curY);
            line = words[n] + ' ';
            curY += lineH;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, startX, curY);
        curY += lineH + 6;
      }
      return curY;
    };

    const nextY = renderParagraph(
      activeUnit.dossier,
      rightBoxX + 14,
      loreY + 20,
      rightBoxW - 28,
      17,
      '#cbd5e0',
      '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    );

    // Section 2: Pilot Survival Protocol & Tactical Countermeasures
    const cmBoxY = Math.max(nextY + 10, rightBoxY + 285);
    const cmBoxH = rightBoxH - (cmBoxY - rightBoxY) - 14;

    ctx.fillStyle = 'rgba(28, 18, 12, 0.95)';
    ctx.fillRect(rightBoxX + 10, cmBoxY, rightBoxW - 20, cmBoxH);
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rightBoxX + 10, cmBoxY, rightBoxW - 20, cmBoxH);

    ctx.fillStyle = 'rgba(80, 20, 20, 0.9)';
    ctx.fillRect(rightBoxX + 11, cmBoxY + 1, rightBoxW - 22, 24);
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('⚠️ PILOT SURVIVAL PROTOCOL & COUNTERMEASURES:', rightBoxX + 20, cmBoxY + 17);

    renderParagraph(
      activeUnit.countermeasures,
      rightBoxX + 20,
      cmBoxY + 38,
      rightBoxW - 40,
      17,
      '#fed7d7',
      '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    );

    ctx.restore();
  }
}

window.EnemyCodexManager = EnemyCodexManager;
if (typeof module !== 'undefined') {
  module.exports = EnemyCodexManager;
}
