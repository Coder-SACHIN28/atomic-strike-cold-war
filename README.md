# REA (Reverse Engineer Anything) Workspace

Consolidated reverse engineering forensic investigations, decompilation toolkits, and clean-room web remakes.

---

## Active Projects

### 1. `brick-game/` - [Brick Game: Retro Classic Definitive Edition](file:///C:/REA/brick-game/README.md)
- **Target Apparatus:** `C:\REA\com.rubysoft.brick_1.6.7.xapk` (*Brick Game: Retro Classic Brick 9999 in 1*)
- **Engine Analyzed:** Unity 2022.3 IL2CPP v31 (ARM64-v8a)
- **Status:** **Completed & Deployed locally on `http://localhost:8080`**
- **Architecture:** Clean-Room Vanilla ES6 Modules + Canvas 2D + Web Audio Synthesizer (Zero Dependencies).
- **Key Modernized Features:**
  - **Ergonomic Dual Controller Layouts:** Switchable between *Ergonomic Split-Thumb* (eliminates left/right missclicks) and *Classic Nostalgia D-Pad*.
  - **Hold / Swap Piece Queue:** 1-Click hold functionality on-screen or via `C` / `Shift` / tap directly on the LCD hold box.
  - **Console Theme Studio:** Vintage 90s Brick Yellow, DMG Classic Gray, Atomic Purple, Cyberpunk Stealth, plus custom RGB color sliders for shell and LCD pixels.
  - **8-Bit Piezo Audio Synthesis:** Pure Web Audio API square-wave buzzer reproduction.
  - **Web Portal Ready:** Built for Poki and CrazyGames (<50KB footprint, zero cookies, instant load).

---

## Forensic Artifacts
- **Target XAPK:** `C:\REA\com.rubysoft.brick_1.6.7.xapk`
- **Extracted Contents:** `C:\REA\brick_extracted/`
  - `global-metadata.dat`: IL2CPP Metadata v31 (6.75 MB, 7,947 types, 61,835 methods)
  - `libil2cpp.so`: 44.6 MB native ARM64 binary
