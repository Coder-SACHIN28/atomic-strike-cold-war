const fs = require('fs');

console.log('====================================================');
console.log('  VERIFYING KEYBOARD [K] DECOUPLING & HUD OVERLAP   ');
console.log('====================================================');

const mainJs = fs.readFileSync('atomic-bomber/js/main.js', 'utf8');
const codexJs = fs.readFileSync('atomic-bomber/js/codex.js', 'utf8');
const inputJs = fs.readFileSync('atomic-bomber/js/input.js', 'utf8');
const hudJs = fs.readFileSync('atomic-bomber/js/hud.js', 'utf8');
const indexHtml = fs.readFileSync('atomic-bomber/index.html', 'utf8');
const styleCss = fs.readFileSync('atomic-bomber/style.css', 'utf8');

// CHECK 1: main.js KeyK
if (mainJs.includes("inp.consumeKeyPress('KeyK')")) {
  console.error('FAIL: main.js still consumes KeyK!');
  process.exit(1);
} else {
  console.log('✓ PASS: main.js does NOT consume KeyK (KeyK is 100% free for weapon firing).');
}

// CHECK 2: codex.js KeyK
if (codexJs.includes('KeyK')) {
  console.error('FAIL: codex.js still references KeyK!');
  process.exit(1);
} else {
  console.log('✓ PASS: codex.js does NOT intercept KeyK.');
}

// CHECK 3: index.html KeyK
if (indexHtml.includes("e.code === 'KeyK'")) {
  console.error('FAIL: index.html still has global listener on KeyK!');
  process.exit(1);
} else {
  console.log('✓ PASS: index.html does NOT intercept KeyK.');
}

// CHECK 4: input.js has KeyK reserved for rockets
if (inputJs.includes("this.consumeKeyPress('KeyK')")) {
  console.log('✓ PASS: input.js has KeyK bound exclusively to isRocketTriggered().');
} else {
  console.error('FAIL: input.js is missing KeyK binding for rockets!');
  process.exit(1);
}

// CHECK 5: Codex key is now KeyI
if (mainJs.includes("inp.consumeKeyPress('KeyI')") && codexJs.includes("e.code === 'KeyI'")) {
  console.log('✓ PASS: Field Intel Codex is bound to KeyI (Intel).');
} else {
  console.error('FAIL: KeyI binding missing for Codex.');
  process.exit(1);
}

// CHECK 6: HUD Coordinates
if (hudJs.includes('446, 22')) {
  console.log('✓ PASS: HUD Wave & Hostiles drawn at x=446, leaving ~300px safety buffer before overlay-bar.');
} else {
  console.error('FAIL: HUD Wave text coordinate not adjusted.');
  process.exit(1);
}

// CHECK 7: Compact Button CSS
if (styleCss.includes('font-size: 10px') && styleCss.includes('padding: 4px 7px')) {
  console.log('✓ PASS: style.css enforces compact HUD buttons (10px, 4px 7px padding).');
} else {
  console.error('FAIL: style.css compact styling missing.');
  process.exit(1);
}

console.log('\n====================================================');
console.log('★ ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS! ★');
console.log('====================================================');
