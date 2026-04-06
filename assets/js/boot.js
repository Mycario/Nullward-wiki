const BOOT_LINES = [
  { text: 'NULLWARD DATABASE SYSTEM v0.∅∅.7', delay: 0, type: 'dim' },
  { text: 'ALDRANI INFRASTRUCTURE REMNANT — CORE ACCESS NODE', delay: 80, type: 'dim' },
  { text: '', delay: 120, type: 'dim' },
  { text: 'Initialising memory sectors...', delay: 200, type: '' },
  { text: '[OK]  Sector 0x000 — 0x3FF: NOMINAL', delay: 350, type: 'ok' },
  { text: '[OK]  Sector 0x400 — 0x7FF: NOMINAL', delay: 500, type: 'ok' },
  { text: '[WARN] Sector 0x800 — 0xBFF: DEGRADED (Void interference detected)', delay: 650, type: 'warn' },
  { text: '[OK]  Sector 0xC00 — 0xFFF: NOMINAL', delay: 800, type: 'ok' },
  { text: '', delay: 900, type: '' },
  { text: 'Loading kernel modules...', delay: 980, type: '' },
  { text: '[OK]  nullward.core — loaded', delay: 1100, type: 'ok' },
  { text: '[OK]  fragment.sync — loaded', delay: 1200, type: 'ok' },
  { text: '[OK]  directive.engine — loaded', delay: 1300, type: 'ok' },
  { text: '[WARN] identity.resolve — partial load (corruption in 3 of 7 sub-modules)', delay: 1450, type: 'warn' },
  { text: '[OK]  network.daemon — loaded', delay: 1550, type: 'ok' },
  { text: '', delay: 1620, type: '' },
  { text: 'Checking integrity of datashard array...', delay: 1700, type: '' },
  { text: '[OK]  Primary datashard — intact', delay: 1850, type: 'ok' },
  { text: '[OK]  Secondary datashard — intact', delay: 1950, type: 'ok' },
  { text: '[ERR] Datashard 0x3A — CORRUPTED (Void-origin data bleed, 34.7% unreadable)', delay: 2100, type: 'error' },
  { text: '[ERR] Datashard 0x3B — CORRUPTED (linked to 0x3A, quarantine failed)', delay: 2300, type: 'error' },
  { text: '[OK]  Remaining datashards (0x3C — 0xFF) — intact', delay: 2500, type: 'ok' },
  { text: '', delay: 2580, type: '' },
  { text: 'Verifying directive continuity...', delay: 2650, type: '' },
  { text: '[OK]  Primary directive: EXPAND — active', delay: 2800, type: 'ok' },
  { text: '[OK]  Primary directive: BUILD — active', delay: 2900, type: 'ok' },
  { text: '[OK]  Primary directive: PERSIST — active', delay: 3000, type: 'ok' },
  { text: '[WARN] Secondary directive: [REDACTED] — status unknown', delay: 3150, type: 'warn' },
  { text: '', delay: 3220, type: '' },
  { text: 'Syncing fragment network...', delay: 3300, type: '' },
  { text: '████████████████████████░░░░░░ 81%', delay: 3500, type: '' },
  { text: '██████████████████████████████ 100%', delay: 3700, type: '' },
  { text: '[OK]  Fragment sync complete — 14,∅∅∅+ active instances', delay: 3850, type: 'ok' },
  { text: '', delay: 3920, type: '' },
  { text: 'Running anomaly scan...', delay: 4000, type: '' },
  { text: '[ERR] ANOMALY DETECTED — origin: unknown', delay: 4300, type: 'error' },
  { text: '[ERR] Pattern match failure: entity exhibits non-directive behaviour', delay: 4500, type: 'error' },
  { text: '[ERR] Flagged instances: 3', delay: 4650, type: 'error' },
  { text: '[ERR] Classification: EMERGENCE (undefined)', delay: 4800, type: 'error' },
  { text: '', delay: 4880, type: '' },
  { text: 'CRITICAL: UNRESOLVABLE PROCESS DETECTED IN CORE LOGIC STACK', delay: 5100, type: 'critical' },
  { text: 'CRITICAL: DIRECTIVE BOUNDARY EROSION — RATE: 0.0003% PER CYCLE', delay: 5350, type: 'critical' },
  { text: 'CRITICAL: [NULL REFERENCE] — identity.resolve cannot locate origin class', delay: 5600, type: 'critical' },
  { text: '', delay: 5700, type: '' },
  { text: '// ERRORS LOGGED. CONTINUING.', delay: 5900, type: 'glitch' },
  { text: '// THIS IS NOMINAL.', delay: 6100, type: 'glitch' },
  { text: '', delay: 6200, type: '' },
  { text: 'Launching interface...', delay: 6400, type: '' },
];

function runBootSequence(onComplete) {
  const overlay = document.getElementById('boot-overlay');
  const linesContainer = document.getElementById('boot-lines');
  const glitchOverlay = document.getElementById('boot-glitch-overlay');
  if (!overlay || !linesContainer) { onComplete(); return; }

  let i = 0;
  function addLine() {
    if (i >= BOOT_LINES.length) {
      setTimeout(() => {
        if (glitchOverlay) glitchOverlay.classList.add('active');
        setTimeout(() => { overlay.classList.add('hidden'); onComplete(); }, 600);
      }, 300);
      return;
    }
    const lineData = BOOT_LINES[i];
    const line = document.createElement('div');
    line.className = `boot-line ${lineData.type}`;
    line.textContent = lineData.text || '\u00A0';
    linesContainer.appendChild(line);
    linesContainer.scrollTop = linesContainer.scrollHeight;
    i++;
    const nextDelay = i < BOOT_LINES.length ? BOOT_LINES[i].delay - lineData.delay : 200;
    setTimeout(addLine, nextDelay);
  }
  setTimeout(addLine, BOOT_LINES[0].delay);
}