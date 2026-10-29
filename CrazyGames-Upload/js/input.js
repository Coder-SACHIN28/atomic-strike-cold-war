/**
 * Atomic Bomber - Comprehensive Input Controller
 * Handles Desktop Keyboard/Mouse (CrazyGames/Poki PC standard)
 * and Touch Screen virtual controls with repositionable joystick.
 */

class InputController {
  constructor() {
    this.keys = {};
    this.keysPressed = {};
    this.mouse = { x: 0, y: 0, down: false, rightDown: false };
    this.touchControlsActive = false;

    // Virtual touch joystick / button states
    this.touch = {
      climb: false,
      dive: false,
      accel: false,
      brake: false,
      boost: false,
      bomb: false,
      cluster: false,
      nuke: false,
      gau8: false,
      rocket: false,
      flare: false,
      hellfire: false,
      napalm: false,
      emp: false,
      drone: false,
      joystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dx: 0, dy: 0 }
    };

    this.touchButtons = [];
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys[e.code]) {
        this.keysPressed[e.code] = true;
      }
      this.keys[e.code] = true;

      // Resume Web Audio context on key press
      if (window.soundSystem) window.soundSystem.resume();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keysPressed[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      window.focus();
      if (window.soundSystem) window.soundSystem.resume();
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent browser context menu on right click
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Touch event listeners
    window.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouch(e), { passive: false });
    window.addEventListener('touchcancel', (e) => this.handleTouch(e), { passive: false });
  }

  handleTouch(e) {
    if (window.soundSystem) window.soundSystem.resume();
    this.touchControlsActive = true;

    // Reset touch triggers
    this.touch.bomb = false;
    this.touch.cluster = false;
    this.touch.nuke = false;
    this.touch.gau8 = false;
    this.touch.rocket = false;
    this.touch.flare = false;
    this.touch.hellfire = false;
    this.touch.napalm = false;
    this.touch.emp = false;
    this.touch.drone = false;
    this.touch.boost = false;
    this.touch.climb = false;
    this.touch.dive = false;
    this.touch.accel = false;
    this.touch.brake = false;

    const touches = e.touches;
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const tx = ((t.clientX - rect.left) / rect.width) * 1280;
      const ty = ((t.clientY - rect.top) / rect.height) * 720;

      // Check virtual buttons
      for (const btn of this.touchButtons) {
        if (
          tx >= btn.x &&
          tx <= btn.x + btn.w &&
          ty >= btn.y &&
          ty <= btn.y + btn.h
        ) {
          if (btn.action === 'bomb') this.touch.bomb = true;
          if (btn.action === 'cluster') this.touch.cluster = true;
          if (btn.action === 'nuke') this.touch.nuke = true;
          if (btn.action === 'gau8') this.touch.gau8 = true;
          if (btn.action === 'rocket') this.touch.rocket = true;
          if (btn.action === 'flare') this.touch.flare = true;
          if (btn.action === 'hellfire') this.touch.hellfire = true;
          if (btn.action === 'napalm') this.touch.napalm = true;
          if (btn.action === 'emp') this.touch.emp = true;
          if (btn.action === 'drone') this.touch.drone = true;
        }
      }

      // Left half touch acts as direct flight pitch / throttle
      if (tx < 500) {
        if (ty < 360) {
          this.touch.climb = true; // Upper left climbs
        } else {
          this.touch.dive = true; // Lower left dives
        }
      }
    }
  }

  // Consume a single-press trigger reliably
  consumeKeyPress(code) {
    if (this.keysPressed[code]) {
      this.keysPressed[code] = false;
      return true;
    }
    return false;
  }

  update() {
    // Keep keysPressed active until consumed or released on keyup
  }

  // Action queries
  isClimbing() {
    return (
      this.keys['KeyW'] ||
      this.keys['ArrowUp'] ||
      this.touch.climb ||
      (this.touch.joystick.active && this.touch.joystick.dy < -0.2)
    );
  }

  isDiving() {
    return (
      this.keys['KeyS'] ||
      this.keys['ArrowDown'] ||
      this.touch.dive ||
      (this.touch.joystick.active && this.touch.joystick.dy > 0.2)
    );
  }

  isAccelerating() {
    return (
      this.keys['KeyD'] ||
      this.keys['ArrowRight'] ||
      this.touch.accel ||
      (this.touch.joystick.active && this.touch.joystick.dx > 0.3)
    );
  }

  isBraking() {
    return (
      this.keys['KeyA'] ||
      this.keys['ArrowLeft'] ||
      this.touch.brake ||
      (this.touch.joystick.active && this.touch.joystick.dx < -0.3)
    );
  }

  isBoostActive() {
    return (
      this.keys['ShiftLeft'] ||
      this.keys['ShiftRight'] ||
      this.keys['KeyQ'] ||
      this.touch.boost
    );
  }

  isBombTriggered() {
    return (
      this.keys['Space'] ||
      this.consumeKeyPress('Space') ||
      this.keys['KeyB'] ||
      this.consumeKeyPress('KeyB') ||
      this.touch.bomb
    );
  }

  isClusterTriggered() {
    return this.consumeKeyPress('KeyC') || this.touch.cluster;
  }

  isNukeTriggered() {
    return this.consumeKeyPress('KeyN') || this.touch.nuke;
  }

  isGau8Firing() {
    return (
      this.keys['KeyJ'] ||
      this.keys['KeyX'] ||
      this.mouse.down ||
      this.touch.gau8
    );
  }

  isRocketTriggered() {
    return (
      this.consumeKeyPress('KeyK') ||
      this.consumeKeyPress('KeyE') ||
      this.consumeKeyPress('KeyR') ||
      this.mouse.rightDown ||
      this.touch.rocket
    );
  }

  isFlareTriggered() {
    return this.consumeKeyPress('KeyF') || this.touch.flare;
  }

  isHellfireTriggered() {
    return this.consumeKeyPress('KeyL') || this.consumeKeyPress('Digit4') || this.touch.hellfire;
  }

  isNapalmTriggered() {
    return this.consumeKeyPress('KeyV') || this.consumeKeyPress('Digit5') || this.touch.napalm;
  }

  isEmpTriggered() {
    return (
      this.consumeKeyPress('KeyM') ||
      this.consumeKeyPress('Digit6') ||
      this.touch.emp
    );
  }

  isDroneTriggered() {
    return this.consumeKeyPress('KeyU') || this.consumeKeyPress('KeyY') || this.touch.drone;
  }

  isPauseTriggered() {
    return this.consumeKeyPress('KeyP') || this.consumeKeyPress('Escape');
  }
}

window.inputController = new InputController();
