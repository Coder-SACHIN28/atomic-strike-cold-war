# ⚛️ Atomic Strike: Cold War

> **A high-quality HTML5 military combat game inspired by Aircraft Evolution — built for CrazyGames, Poki & web.**

![Game Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Tests](https://img.shields.io/badge/Tests-87%2F87%20Passed-brightgreen) ![Size](https://img.shields.io/badge/Bundle-2.6MB-blue) ![CrazyGames](https://img.shields.io/badge/CrazyGames-SDK%20v3-orange)

## 🕹️ Live Demo

👉 **[Play Atomic Strike: Cold War Live on GitHub Pages](https://coder-sachin28.github.io/atomic-strike-cold-war/)**

---

## 🎮 Gameplay

Pilot a legendary warplane through increasingly intense waves of Cold War combat. Drop bombs, fire missiles, dodge SAMs, destroy enemy fortresses, and take down boss-class threats — all rendered in a rich Aircraft-Evolution-inspired art style.

### Key Features
- 🛩️ **11 Playable Aircraft** — A-10 Warthog, F-14 Tomcat, Su-25 Frogfoot, Harrier, AC-130 Spectre, Apache, Comanche & more
- 💣 **9 Weapon Types** — Iron Bombs, Cluster Munitions, Tactical Nukes, Napalm, Hydra Rockets, Hellfire Missiles, FPV Drones, Lightning EMP Bombs
- ⚡ **EMP Shock Bomb** — Disables enemy SAM/Pantsir/Flak for 8 seconds with cyan ionization shockwave
- ✈️ **Aircraft Evolution Art Style** — Autumn sunset sky, alpine snow peaks, dense golden grass fringe, rich soil cross-section
- 🏰 **Military Fortifications** — Garrison strongholds, wooden watchtowers, autumn trees, multi-layer terrain
- 💥 **Volumetric Fireballs** — Boiling plasma explosions with white-hot cores, soot clouds & shockwave rings
- 🎯 **Tactical Fuel System** — Real fuel burn, engine flameout, glide physics
- 🪂 **Parachuting Supply Crates** — Fuel jerrycans, repair kits, gold bounty, EMP batteries
- ☠️ **Kirov War Zeppelin Boss** — Armored dreadnought with 1000 HP, twin nacelles, searchlights & flak
- 📡 **S-400 Hypersonic SAMs** — Speed-scaling missiles (Wave 1: 8.5px → Wave 7: 18px/frame)
- 🛡️ **Pantsir-S1 SPAAG** — Autocannon CIWS + 57E6 hypervelocity intercept missiles

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `A / D` or `←/→` | Fly Left / Right |
| `W / S` or `↑/↓` | Climb / Dive |
| `Space` | Drop Iron Bomb |
| `C` | Cluster Munitions |
| `N` | Tactical Nuclear Bomb |
| `V` | Napalm Firestorm |
| `K` | Hydra-70 Rocket Pods |
| `L` | AGM-114 Hellfire Missile |
| `U` | FPV Kamikaze Drone |
| `M` | ⚡ Lightning EMP Shock Bomb |
| `J / Click` | GAU-8 Cannon Burst |
| `H` | Call Allied Air Support |
| `Shift / Q` | WEP Afterburner Boost |
| `F` | Deploy Flare Decoys |
| `Esc` | Pause |

---

## 🏗️ Project Structure

```
atomic-bomber/
├── index.html          # CrazyGames SDK v3 integrated HTML
├── style.css           # Responsive 16:9 game canvas styles
├── js/
│   ├── main.js         # Game loop, state machine, platform SDKs
│   ├── engine.js       # Render pipeline, sky/atmosphere/mountains
│   ├── entities.js     # Player, enemies, bosses, supply crates
│   ├── weapons.js      # All 9 weapon systems + physics
│   ├── hud.js          # Aircraft Evolution capsular HUD + instruments
│   ├── terrain.js      # Soil cross-section + golden grass fringe
│   ├── armory.js       # Shop, upgrades, loadout screen
│   ├── codex.js        # Intelligence codex for all enemy units
│   ├── audio.js        # Procedural Web Audio synthesis
│   └── input.js        # Keyboard + touch + gamepad input
└── assets/
    ├── audio/          # 39 sound effects
    └── sprites/        # 109 game sprites
```

---

## 🧪 Test Suite (87/87 Passing)

```bash
node _tests_suite/test_full_codebase_integrity.js        # 28/28
node _tests_suite/test_aircraft_evolution_features.js    # 18/18
node _tests_suite/test_s400_speed_pantsir_and_tu22m.js   # 41/41
node _tests_suite/test_crazygames_submission_ready.js    # 5 checkpoints passed
node _tests_suite/test_visual_overhaul_and_juice.js      # 3/3
```

---

## 🚀 Run Locally

```bash
node start_game_server.js
# Open http://localhost:8080
```

Or just open `atomic-bomber/index.html` in any modern browser.

---

## 🎨 Art Style

Inspired by *Aircraft Evolution* visual design:
- **Golden hour sunset sky** — painterly gradient from slate zenith to warm amber horizon
- **Alpine snow-capped mountains** — sharp peaks with glistening snow mantles and slate crevasses
- **Dense golden autumn grass fringe** — procedural 8-14px blades along terrain contours
- **Rich soil cross-section** — dark humus to loam to subsoil to bedrock strata
- **Garrison fortresses & wooden watchtowers** — detailed architectural structures
- **Volumetric plasma explosions** — white-hot core, orange mantle, rising soot clouds
- **Capsular HUD** — gunmetal capsules with wrench health badge and jerrycan fuel badge

All graphics are 100% original procedural Canvas rendering — no copied assets.

---

## 📦 CrazyGames Submission

- **SDK Version**: CrazyGames SDK v3
- **Bundle Size**: 2.6 MB (all assets included)
- **Responsive**: 16:9 aspect ratio, mobile touch controls
- **Requirements**: All CrazyGames integration requirements met

---

## 👨‍💻 Developer

**Coder-SACHIN28** | [GitHub](https://github.com/Coder-SACHIN28)

---

*Built with pure HTML5 Canvas, Web Audio API & vanilla JavaScript — zero dependencies.*
