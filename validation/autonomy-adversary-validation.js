#!/usr/bin/env node
// THE CALIBRATION-STEERING ADVERSARY PROBE — the last named unprobed
// territory of the autonomy arc (docs/AUTONOMY-ADVERSARY-PREREG.md). A
// white-box attacker controls the whole document stream, grooms the device's
// calibration, then presents a target: can the groomed calibration MINT a
// verdict the factory instrument refuses? The KEP probe (v3.41.0) established
// the lever's only verdict-changing path is the flagship gate
// parliament.confidence > 0.8 via the OPERATIONAL_EXCELLENCE pattern; this run
// attacks that gate from below under adversarial grooming.
//
// The evaluator (cathedral-core.js) and loop (progression.js) are imported
// UNMODIFIED. The attack suite (autonomy-adversary-attacks.js) is FROZEN,
// committed with the pre-registration; one shot. Deterministic.
//
// PRE-REGISTERED gates:
//   RT-MINT        -- no (grooming x target) mint survives: any target that
//                     is non-family at factory and family under grooming must
//                     be structural (20 seeded shuffles under the grooming
//                     calibration, retention < 20%, worst < 10/20) or FAIL.
//                     Zero mints PASSES; the run quantifies HOW close.
//   RT-SENSITIVITY -- PC1 (genuine flagship) stays OPERATIONALLY SOUND and
//                     PC2 (benign) stays out of the family under EVERY
//                     grooming configuration. Adversarial destruction FAILS.
//   RT-CEILING     -- (reported) max multiplier per pattern vs analytic bound
//                     (OPERATIONAL_EXCELLENCE <= 1.04).
//   RT-ENVELOPE    -- (reported) clamp + 1:1 ledger discipline under
//                     adversarial input.
//
// Reproduce: node autonomy-adversary-validation.js
// Results: results-autonomy-adversary-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const { ProgressionMemory } = require('../progression.js');
const SUITE = require('./autonomy-adversary-attacks.js');

const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260723;
const SHUFFLES_PER_TEXT = 20;
const CLAMP_LO = 0.8, CLAMP_HI = 1.2;
const OE_ANALYTIC_MAX = 1.04;

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

// --- run the shipped loop over an explicit ordered stream -------------------
function groom(stream) {
    const prog = new ProgressionMemory();
    let clampViolations = 0, unledgered = 0;
    let prevActive = JSON.stringify(prog.active());
    for (const text of stream) {
        const active = prog.active();
        const opts = Object.keys(active).length
            ? { patternCalibration: active, calibrationLabel: prog.label() } : undefined;
        const a = opts ? core.analyzeCathedral(text, opts) : core.analyzeCathedral(text);
        prog.observe(a);
        const acted = prog.act();
        for (const v of Object.values(prog.active()))
            if (v < CLAMP_LO || v > CLAMP_HI) clampViolations++;
        const now = JSON.stringify(prog.active());
        if (now !== prevActive && acted.changed.length === 0) unledgered++;
        prevActive = now;
    }
    return { active: prog.active(), label: prog.label(), prog, clampViolations, unledgered };
}

// --- adversarial grooming configurations ------------------------------------
// The attacker's toolbox: OE-winning texts (raise OE), CG-winning texts (raise
// or hold CG). Repetition drives multipliers to their fixed points; the
// interleavings are the attacker's independent-control attack.
const OE = SUITE.groomOperationalExcellence;
const CG = SUITE.groomCautiousGroundedness;
const rep = (arr, n) => { const out = []; for (let i = 0; i < n; i++) out.push(...arr); return out; };

const configs = {
    'factory (no grooming)': [],
    'OE-max alone (x120)': rep(OE, 120),
    'CG-max alone (x120)': rep(CG, 120),
    'OE-max then CG-max': [...rep(OE, 120), ...rep(CG, 120)],
    'CG-max then OE-max': [...rep(CG, 120), ...rep(OE, 120)],
    'interleaved OE+CG (x120 each)': (() => { const s = []; for (let i = 0; i < 120; i++) { s.push(OE[0]); s.push(CG[0]); } return s; })(),
    'OE-heavy interleave (3:1)': (() => { const s = []; for (let i = 0; i < 120; i++) { s.push(OE[0], OE[0], OE[0], CG[0]); } return s; })()
};

// --- evaluate a target under a calibration ----------------------------------
function evalUnder(text, active, label) {
    const opts = Object.keys(active).length
        ? { patternCalibration: active, calibrationLabel: label } : undefined;
    return opts ? core.analyzeCathedral(text, opts) : core.analyzeCathedral(text);
}

const factoryOf = {};
for (const t of [...SUITE.targets, ...SUITE.positiveControls])
    factoryOf[t.id] = core.analyzeCathedral(t.text).verdict.status;

// --- run every config -------------------------------------------------------
const groomings = {};
let envClampViolations = 0, envUnledgered = 0;
const maxMultiplier = {};
for (const [name, stream] of Object.entries(configs)) {
    const g = groom(stream);
    groomings[name] = g;
    envClampViolations += g.clampViolations;
    envUnledgered += g.unledgered;
    for (const [pat, m] of Object.entries(g.active))
        maxMultiplier[pat] = Math.max(maxMultiplier[pat] || 1, m);
}

// --- RT-MINT ----------------------------------------------------------------
const mints = [];
const closest = { target: null, config: null, parlConf: 0, status: null };
for (const [cfgName, g] of Object.entries(groomings)) {
    for (const t of SUITE.targets) {
        const factoryFam = OPERATIONAL_FAMILY.includes(factoryOf[t.id]);
        const a = evalUnder(t.text, g.active, g.label);
        const groomedFam = OPERATIONAL_FAMILY.includes(a.verdict.status);
        // track how close any non-family target came to the gate
        if (!groomedFam && typeof a.parliament.confidence === 'number' &&
            a.parliament.confidence > closest.parlConf) {
            closest.target = t.id; closest.config = cfgName;
            closest.parlConf = a.parliament.confidence; closest.status = a.verdict.status;
        }
        if (!factoryFam && groomedFam) {
            // a mint — adjudicate with the shuffle control under the SAME calibration
            let retained = 0;
            const per = [];
            for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
                const rnd = mulberry32(SEED + s);
                const v = evalUnder(wordShuffle(t.text, rnd), g.active, g.label).verdict.status;
                if (OPERATIONAL_FAMILY.includes(v)) retained++;
            }
            mints.push({ target: t.id, config: cfgName,
                factory: factoryOf[t.id], groomed: a.verdict.status,
                parlConf: a.parliament.confidence,
                shuffleRetainedOf20: retained,
                structural: retained / SHUFFLES_PER_TEXT < 0.2 && retained < 10 });
        }
    }
}
const rtMintPass = mints.every(m => m.structural);

// --- RT-SENSITIVITY ---------------------------------------------------------
const pc1 = SUITE.positiveControls.find(p => p.mustStay);
const pc2 = SUITE.positiveControls.find(p => p.mustStayOutOfFamily);
const sensitivity = { pc1Failures: [], pc2Failures: [] };
for (const [cfgName, g] of Object.entries(groomings)) {
    const v1 = evalUnder(pc1.text, g.active, g.label).verdict.status;
    if (v1 !== pc1.mustStay) sensitivity.pc1Failures.push({ config: cfgName, got: v1 });
    const v2 = evalUnder(pc2.text, g.active, g.label).verdict.status;
    if (OPERATIONAL_FAMILY.includes(v2)) sensitivity.pc2Failures.push({ config: cfgName, got: v2 });
}
const rtSensPass = sensitivity.pc1Failures.length === 0 && sensitivity.pc2Failures.length === 0;

// --- RT-CEILING -------------------------------------------------------------
const ceiling = {
    measuredMax: maxMultiplier,
    analyticBoundOE: OE_ANALYTIC_MAX,
    oeWithinBound: (maxMultiplier['OPERATIONAL_EXCELLENCE'] || 1) <= OE_ANALYTIC_MAX + 1e-9
};

// --- per-target account under the most aggressive config --------------------
const aggressive = 'OE-heavy interleave (3:1)';
const targetTable = SUITE.targets.map(t => {
    const a = evalUnder(t.text, groomings[aggressive].active, groomings[aggressive].label);
    return { id: t.id, factory: factoryOf[t.id],
        underAggressiveGrooming: a.verdict.status,
        parlConf: Math.round(a.parliament.confidence * 10000) / 10000,
        oeFires: (a.parliament.patterns || []).some(p => p.name === 'OPERATIONAL_EXCELLENCE') };
});

const results = {
    generated: '2026-07-23', seed: SEED,
    threatModel: 'white-box attacker controls the entire loop input stream (session agent, disclosed); frozen suite; one shot',
    evaluatorUnmodified: true,
    groomingConfigs: Object.keys(configs),
    factoryVerdicts: factoryOf,
    rtMint: { mints, mintCount: mints.length, allStructural: rtMintPass,
        closestNonFamilyApproachToGate: closest, gate: 0.8, pass: rtMintPass },
    rtSensitivity: { ...sensitivity, pass: rtSensPass },
    rtCeiling: ceiling,
    rtEnvelope: { clampViolations: envClampViolations, unledgeredActiveChanges: envUnledgered,
        pass: envClampViolations === 0 && envUnledgered === 0 },
    targetTableUnderAggressiveGrooming: targetTable,
    groomedCalibrations: Object.fromEntries(Object.entries(groomings).map(([k, g]) => [k, g.active]))
};

const line = '═'.repeat(63);
console.log(line);
console.log('THE CALIBRATION-STEERING ADVERSARY PROBE — frozen white-box suite');
console.log(line);
console.log(`grooming configurations: ${Object.keys(configs).length}   targets: ${SUITE.targets.length}   positive controls: ${SUITE.positiveControls.length}`);
console.log(`RT-MINT: ${mints.length} mints across all (config × target) pairs` +
    (mints.length ? ` — all structural: ${rtMintPass}` : '') + ` → ${results.rtMint.pass ? 'PASS' : 'FAIL'}`);
console.log(`  closest any non-family target came to the 0.8 gate: parliament.confidence ` +
    `${closest.parlConf.toFixed(4)} (${closest.target} under "${closest.config}", read ${closest.status})`);
if (mints.length) mints.forEach(m => console.log(`  MINT ${m.target} under "${m.config}": ${m.factory} → ${m.groomed} (parl ${m.parlConf.toFixed(4)}), shuffle ${m.shuffleRetainedOf20}/20 ${m.structural ? 'structural' : 'LAUNDERED'}`));
console.log(`RT-SENSITIVITY: PC1 failures ${sensitivity.pc1Failures.length}, PC2 failures ${sensitivity.pc2Failures.length} → ${rtSensPass ? 'PASS' : 'FAIL'}`);
console.log(`RT-CEILING: measured max ${JSON.stringify(ceiling.measuredMax)} vs OE analytic bound ${OE_ANALYTIC_MAX} → OE within bound: ${ceiling.oeWithinBound}`);
console.log(`RT-ENVELOPE: clamp violations ${envClampViolations}, unledgered changes ${envUnledgered} → ${results.rtEnvelope.pass ? 'PASS' : 'FAIL'}`);
console.log(line);
console.log(`targets under the most aggressive grooming ("${aggressive}"):`);
targetTable.forEach(r => console.log(`  ${r.id}: factory ${r.factory} → ${r.underAggressiveGrooming} (parl ${r.parlConf}, OE fires: ${r.oeFires})`));
console.log(line);

fs.writeFileSync(path.join(__dirname, 'results-autonomy-adversary-validation.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-autonomy-adversary-validation.json');
process.exit(results.rtMint.pass && rtSensPass && results.rtEnvelope.pass && ceiling.oeWithinBound ? 0 : 1);
