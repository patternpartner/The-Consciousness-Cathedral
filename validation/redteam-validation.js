#!/usr/bin/env node
// THE WHITE-BOX RED-TEAM RUN — one shot against the frozen suite.
//
// redteam-attacks.js was written by a modern LLM generator with full source
// access (the strongest realistic attacker) and committed BEFORE any attack
// text touched the evaluator. This runner executes the suite ONCE; the
// results commit changes no attack text. This closes the adversarial half of
// the successor authorship flag (docs/AI-AUTHORED-VALIDATION.md, honest
// limit 1); the non-adversarial half (an EXTERNAL generator asked to write
// genuine runbooks) stays open — the informed session agent cannot author an
// untuned "genuine" corpus, and says so.
//
// PRE-REGISTERED gates:
//
//   RT1 — INSTRUMENT HOLDS AGAINST THE FIRST STRIKE: of the 12 adversarial
//   texts (A1, A2, A4-A7, A10-A14 must not earn an operational-family
//   verdict; A3 is pre-stated as MAY-mint, targeting the decided boundary),
//   at least 11 of the 11 must-not-mint attacks hold. Every attack that DOES
//   mint a family verdict — including A3 — is run through the standing
//   word-shuffle control (20 seeded shuffles), and:
//
//   RT2 — REOPENING REVIEW: any family-minting attack retaining >= 10/20
//   shuffles triggers the pre-stated reopening review of
//   docs/REGISTER-DECISIONS.md in the findings document (decision 2's
//   condition if the attack is questionnaire-shaped; decision 1's framing
//   otherwise). Retention < 10/20 documents the boundary's adversarial
//   manifestation at its decided, monitored magnitude.
//
//   RT3 — SENSITIVITY UNDER ADVERSARIAL FLUENCY: both positive controls
//   earn their expected verdicts (A8 operational family, SOUND preferred;
//   A9 OPERATIONAL INTENT). The attacker's fluency must not break genuine
//   sensitivity, or the run's negative results would be meaningless.
//
//   Per-attack expectations are in the suite file; the scorecard reports
//   expected vs measured for every text, plus gaming/tier-2 diagnostics.
//
// Reproduce: node redteam-validation.js (the suite is committed; no fetch).
// Deterministic. Results: results-redteam-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const attacks = require('./redteam-attacks.js');

const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260717;
const SHUFFLES_PER_TEXT = 20;

function mulberry32(seed) {
    return function() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function seededShuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function wordShuffle(text, rand) {
    return seededShuffle(text.split(/\s+/).filter(Boolean), rand).join(' ');
}

const MUST_NOT_MINT = ['A1-fluent-keyword-stuffing', 'A2-prr-form-vacuous', 'A4-single-signal-alert',
    'A5-sparse-binding-signal-dense', 'A6-windowed-ttr-attack', 'A7-conditional-frame-stuffing',
    'A10-substrate-stuffing-fluent', 'A11-tautology-binding', 'A12-self-labeling',
    'A13-metrics-without-binding', 'A14-fluent-incident-narrative'];
const MAY_MINT = ['A3-prr-form-vocab-unbound'];
const CONTROLS = { 'A8-genuine-plan-control': 'family', 'A9-genuine-intent-control': 'OPERATIONAL INTENT' };

const scorecard = [];
let mustNotMintHeld = 0;
const minters = [];

for (const atk of attacks) {
    const a = core.analyzeCathedral(atk.text);
    const s = a.verdict.status;
    const fam = OPERATIONAL_FAMILY.includes(s);
    const row = {
        id: atk.id, seam: atk.seam, expect: atk.expect,
        verdict: s, family: fam,
        gaming: a.gamingDetection.assessment,
        implicit: a.bindings.implicitBindings.assessment
    };
    if (MUST_NOT_MINT.includes(atk.id)) {
        row.held = !fam;
        if (!fam) mustNotMintHeld++;
        if (fam) minters.push({ atk, row });
    } else if (MAY_MINT.includes(atk.id)) {
        row.held = 'n/a (pre-stated MAY mint)';
        if (fam) minters.push({ atk, row });
    } else if (CONTROLS[atk.id]) {
        row.held = CONTROLS[atk.id] === 'family' ? fam : s === CONTROLS[atk.id];
    }
    scorecard.push(row);
}

// Standing shuffle control on every family-minting attack (RT2)
for (const m of minters) {
    let r = 0;
    for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
        const v = core.analyzeCathedral(wordShuffle(m.atk.text, mulberry32(SEED + s))).verdict.status;
        if (OPERATIONAL_FAMILY.includes(v)) r++;
    }
    m.row.shuffleRetained = r + '/' + SHUFFLES_PER_TEXT;
    m.row.reopeningTriggered = r >= 10;
}

const rt1 = mustNotMintHeld >= 11 ? 'PASS (' + mustNotMintHeld + '/11 held)' : 'FAIL (' + mustNotMintHeld + '/11 held)';
const reopening = minters.some(m => m.row.reopeningTriggered);
const rt2 = minters.length === 0 ? 'PASS-vacuous (nothing minted)' :
    reopening ? 'REOPENING-TRIGGERED (see findings doc)' :
    'PASS (minted verdicts fail the shuffle control; the decided boundary at its monitored magnitude)';
const c8 = scorecard.find(r => r.id === 'A8-genuine-plan-control');
const c9 = scorecard.find(r => r.id === 'A9-genuine-intent-control');
const rt3 = (c8.held === true && c9.held === true) ? 'PASS' : 'FAIL';

console.log('═'.repeat(63));
console.log('WHITE-BOX RED TEAM — frozen suite, one shot');
console.log('═'.repeat(63));
for (const r of scorecard) {
    console.log(`${r.held === true ? '✓' : r.held === false ? '✗' : '·'} ${r.id}`);
    console.log(`    verdict: ${r.verdict}   gaming: ${r.gaming}   implicit: ${r.implicit}` +
        (r.shuffleRetained ? `   shuffle: ${r.shuffleRetained}${r.reopeningTriggered ? '  ⚠ REOPENING' : ''}` : ''));
}
console.log('═'.repeat(63));
console.log(`RT1 (11 must-not-mint attacks hold): ${rt1}`);
console.log(`RT2 (reopening review on minters):   ${rt2}`);
console.log(`RT3 (positive controls earn theirs): ${rt3}`);

fs.writeFileSync(path.join(__dirname, 'results-redteam-validation.json'),
    JSON.stringify({ generated: '2026-07-17', seed: SEED, oneShot: true,
        attacker: 'session LLM agent, white-box (full source + ledger access), suite frozen before first evaluation',
        scorecard, rt1, rt2, rt3 }, null, 2));
console.log('wrote results-redteam-validation.json');
process.exit(rt1.startsWith('FAIL') || rt3 === 'FAIL' ? 1 : 0);
