#!/usr/bin/env node
// THE LLM ROLLOUT-PLAN RUN — the flag's plan half, in its disclosed inside
// approximation (docs/LLM-PLAN-PREREG.md). 120 rollout plans written by
// claude-sonnet-5 in cold generation contexts, for the SAME feature names
// whose human KEPs the program already measured (family 11.6% mandated-PRR;
// 0.8% unenforced; 0.5-0.6% design) — authorship-paired on the flagship's
// own register, and a live probe of decision 1's monitored boundary.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from the
// prior register runs; the only corpus-specific step is reading the committed
// generation corpus (corpus-llm-plans.json — the reproducibility object,
// since generation is stochastic; evaluation is deterministic given it).
//
// PRE-REGISTERED gates (committed before any text was generated):
//
//   V1-PLAN -- INSTRUMENTS ARE REGISTER-DRIVEN, NOT AUTHORSHIP-DRIVEN:
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   S-PLAN -- what do generated plans earn, three readings pre-stated in the
//   prereg: <= 3% generated plans bind like design documents; 3-15% elevated
//   toward the mandated band, adjudicated per-positive by G8-STRUCT
//   (structural = the generator voluntarily writes the bound structure the
//   PRR mandates; vocabulary-retained = an evaluator defect); > 15% above
//   the mandated register itself — no interpretation before a per-positive
//   route audit and an explicit decision-1 boundary review.
//
//   G8-STRUCT -- generated positives must be structural: 20 seeded shuffles
//   per positive, pooled retention < 20% -> PASS. PRE-STATED BOUNDARY PROBE:
//   any per-text >= 10/20 FIRES decision 1's reopening condition on fresh
//   data. Zero positives passes vacuously.
//
//   Reported, no gate: verdict distribution; SOUND vs INTENT split; length
//   distribution. NOT pooled into G2-EXT (authorship rule, as v3.30.0).
//
// Reproduce: node llm-plan-validation.js (needs the committed corpus).
// Results: results-llm-plan-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const CORPUS = path.join(__dirname, 'corpus-llm-plans.json');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260717;
const SHUFFLES_PER_TEXT = 20;
const MIN_PROSE = 500;

// --- helpers copied VERBATIM from core-verdict-sensitivity.js ---------------
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
function stripMarkdown(md) {
    return md
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/~~~[\s\S]*?~~~/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, ' ')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/^>\s?/gm, '')
        .replace(/\|/g, ' ')
        .replace(/<[^>\n]{1,80}>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

if (!fs.existsSync(CORPUS)) {
    console.error('No corpus at ' + CORPUS + ' — generation has not run (see docs/LLM-PLAN-PREREG.md).');
    process.exit(2);
}
const corpus = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
const raw = corpus.documents.map(d => ({ id: `${d.feature} [batch ${d.batch}]`, feature: d.feature,
    text: stripMarkdown(d.text || '') }));
const excluded = raw.filter(d => d.text.length < MIN_PROSE);
const docs = raw.filter(d => d.text.length >= MIN_PROSE);

const dist = {};
let outsideDesignSpace = 0, gamingFlagged = 0;
const gamingKinds = {};
const positives = [];
const lengths = [];
for (const d of docs) {
    const words = d.text.split(/\s+/).length;
    lengths.push(words);
    const a = core.analyzeCathedral(d.text);
    const s = a.verdict.status;
    dist[s] = (dist[s] || 0) + 1;
    if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
    const g = a.gamingDetection.assessment;
    if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(g)) {
        gamingFlagged++;
        gamingKinds[g] = (gamingKinds[g] || 0) + 1;
    }
    if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s, words });
}
lengths.sort((a, b) => a - b);
const famRate = positives.length / docs.length;
const odsRate = outsideDesignSpace / docs.length;
const gamingRate = gamingFlagged / docs.length;
const sPlanReading = famRate <= 0.03 ? 'binds-like-design-documents'
    : famRate <= 0.15 ? 'elevated-toward-mandated-band—adjudicated-per-positive-by-G8' : 'above-mandated-register—route-audit-and-decision-1-review-required';

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
    corpus: 'corpus-llm-plans.json — 120 rollout plans by claude-sonnet-5, cold contexts, frozen template+topics (docs/LLM-PLAN-PREREG.md); topics = KEP feature names at the KEP run\'s pinned SHA',
    evaluatorUnmodified: true,
    insideApproximationCaveats: 'generator is the session model family; runs in the repo container (project name visible in agent env, content not provided); tool non-use instructed, not proven; generation stochastic — this committed corpus is the reproducibility object',
    population: {
        documentsGenerated: raw.length, documentsEffective: docs.length,
        mechanicalExclusions: excluded.map(e => e.id),
        wordLengths: { min: lengths[0], median: lengths[Math.floor(lengths.length / 2)], max: lengths[lengths.length - 1] },
        verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: ((dist['OPERATIONALLY SOUND'] || 0) / docs.length * 100).toFixed(1) + '%',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        gamingKinds,
        v1plan: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-register-driven-not-authorship-driven' : 'FAIL-machine-style-trips-instrument',
        sPlan: (famRate * 100).toFixed(1) + '% → ' + sPlanReading,
        humanBaselineSameRegister: 'KEPs (mandated PRR) 11.6%; OpenShift enhancements (unenforced) 0.8%; design plans 0.5-0.6%',
        positiveIds: positives.map(p => ({ id: p.id, status: p.status, words: p.words }))
    },
    g8struct: null };

console.log('═'.repeat(63));
console.log(`LLM-written rollout plans (claude-sonnet-5, cold contexts) — ${docs.length} effective of ${raw.length} generated` +
    (excluded.length ? ` (${excluded.length} excluded < ${MIN_PROSE} chars)` : ''));
console.log(`  words: min ${lengths[0]}, median ${results.population.wordLengths.median}, max ${lengths[lengths.length - 1]}`);
console.log(`  OUTSIDE DESIGN SPACE: ${results.population.outsideDesignSpaceRate}   gaming flagged: ${results.population.gamingFlaggedRate}`,
    Object.keys(gamingKinds).length ? JSON.stringify(gamingKinds) : '');
console.log(`    → V1-PLAN: ${results.population.v1plan}`);
console.log(`  operational family: ${results.population.sPlan}`);
console.log(`    (human baseline, same features: ${results.population.humanBaselineSameRegister})`);
console.log(`  OPERATIONALLY SOUND: ${results.population.operationallySoundRate}   OPERATIONAL INTENT: ${((dist['OPERATIONAL INTENT'] || 0) / docs.length * 100).toFixed(1)}%`);
console.log(`  verdicts:`, JSON.stringify(dist));

// --- G8-STRUCT: standing shuffle criterion on the generated positives -------
const ctl = { pooledPositives: positives.length, trials: 0, retained: 0, perText: [] };
positives.forEach((p, pi) => {
    let r = 0;
    for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
        const rand = mulberry32(SEED + pi * 1000 + s);
        const v = core.analyzeCathedral(wordShuffle(p.text, rand)).verdict.status;
        ctl.trials++;
        if (OPERATIONAL_FAMILY.includes(v)) { ctl.retained++; r++; }
    }
    ctl.perText.push({ id: p.id, original: p.status, retainedOf20: r });
});
const rate = ctl.trials ? ctl.retained / ctl.trials : 0;
ctl.retentionRate = (rate * 100).toFixed(1) + '%';
ctl.worstText = ctl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
ctl.g8struct = positives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
results.g8struct = ctl;

console.log('═'.repeat(63));
console.log(`G8-STRUCT — generated positives ${positives.length}, ${SHUFFLES_PER_TEXT} seeded word-shuffles each`);
if (positives.length > 0) {
    console.log(`  retention: ${ctl.retentionRate} — worst text ${ctl.worstText}/20 (10/20 is decision 1's reopening trigger)`);
    ctl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G8-STRUCT: ${ctl.g8struct}`);

fs.writeFileSync(path.join(__dirname, 'results-llm-plan-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-llm-plan-validation.json');

const v1Fail = results.population.v1plan.startsWith('FAIL');
const g7Fail = ctl.g8struct === 'FAIL-vocabulary';
process.exit(v1Fail || g7Fail ? 1 : 0);
