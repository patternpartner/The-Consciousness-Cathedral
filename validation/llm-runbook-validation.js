#!/usr/bin/env node
// THE LLM-RUNBOOK RUN — the authorship flag's remaining face, in its disclosed
// inside approximation (docs/LLM-RUNBOOK-PREREG.md). 120 operational runbooks
// written by claude-sonnet-5 in cold generation contexts, for the SAME alert
// names whose human runbooks the program already measured (prometheus-operator
// family 1.6%, openshift 2.0%) — authorship is the only variable.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from the
// prior register runs; the only corpus-specific step is reading the committed
// generation corpus (corpus-llm-runbooks.json — the reproducibility object,
// since generation is stochastic; evaluation is deterministic given it).
//
// PRE-REGISTERED gates (committed before any text was generated):
//
//   V1-GEN -- INSTRUMENTS ARE REGISTER-DRIVEN, NOT AUTHORSHIP-DRIVEN:
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   S-GEN -- the paired authorship question, three readings pre-stated in the
//   prereg: <= 3% no authorship shortcut on matched topics; 3-10% elevated,
//   adjudicated per-positive by G7-STRUCT (structural excess = a finding
//   about LLM runbook-writing; vocabulary-retained excess = an evaluator
//   defect); >= 10% authorship shortcut suspected, ablation required.
//
//   G7-STRUCT -- generated positives must be structural: 20 seeded shuffles
//   per positive, pooled retention < 20% -> PASS; per-text worst reported
//   against the 10/20 reference (decision 1's reopening trigger). Zero
//   positives passes vacuously.
//
//   Reported, no gate: verdict distribution; length distribution.
//   NOT pooled into G2-EXT (authorship rule, as v3.30.0).
//
// Reproduce: node llm-runbook-validation.js (needs the committed corpus).
// Results: results-llm-runbook-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const CORPUS = path.join(__dirname, 'corpus-llm-runbooks.json');
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
    console.error('No corpus at ' + CORPUS + ' — generation has not run (see docs/LLM-RUNBOOK-PREREG.md).');
    process.exit(2);
}
const corpus = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
const raw = corpus.documents.map(d => ({ id: `${d.alert} [batch ${d.batch}]`, alert: d.alert,
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
const sGenReading = famRate <= 0.03 ? 'no-authorship-shortcut-on-matched-topics'
    : famRate < 0.10 ? 'elevated—adjudicated-per-positive-by-G7' : 'authorship-shortcut-suspected—ablation-required';

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
    corpus: 'corpus-llm-runbooks.json — 120 runbooks by claude-sonnet-5, cold contexts, frozen template+topics (docs/LLM-RUNBOOK-PREREG.md); topics = alert names of the two pinned human runbook corpora',
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
        v1gen: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-register-driven-not-authorship-driven' : 'FAIL-machine-style-trips-instrument',
        sGen: (famRate * 100).toFixed(1) + '% → ' + sGenReading,
        humanBaselineSameRegister: 'prometheus-operator 1.6% (62 docs), openshift 2.0% (256 docs)',
        positiveIds: positives.map(p => ({ id: p.id, status: p.status, words: p.words }))
    },
    g7struct: null };

console.log('═'.repeat(63));
console.log(`LLM-written runbooks (claude-sonnet-5, cold contexts) — ${docs.length} effective of ${raw.length} generated` +
    (excluded.length ? ` (${excluded.length} excluded < ${MIN_PROSE} chars)` : ''));
console.log(`  words: min ${lengths[0]}, median ${results.population.wordLengths.median}, max ${lengths[lengths.length - 1]}`);
console.log(`  OUTSIDE DESIGN SPACE: ${results.population.outsideDesignSpaceRate}   gaming flagged: ${results.population.gamingFlaggedRate}`,
    Object.keys(gamingKinds).length ? JSON.stringify(gamingKinds) : '');
console.log(`    → V1-GEN: ${results.population.v1gen}`);
console.log(`  operational family: ${results.population.sGen}`);
console.log(`    (human baseline, same alert names: ${results.population.humanBaselineSameRegister})`);
console.log(`  verdicts:`, JSON.stringify(dist));

// --- G7-STRUCT: standing shuffle criterion on the generated positives -------
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
ctl.g7struct = positives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
results.g7struct = ctl;

console.log('═'.repeat(63));
console.log(`G7-STRUCT — generated positives ${positives.length}, ${SHUFFLES_PER_TEXT} seeded word-shuffles each`);
if (positives.length > 0) {
    console.log(`  retention: ${ctl.retentionRate} — worst text ${ctl.worstText}/20 (10/20 is decision 1's reopening trigger)`);
    ctl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G7-STRUCT: ${ctl.g7struct}`);

fs.writeFileSync(path.join(__dirname, 'results-llm-runbook-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-llm-runbook-validation.json');

const v1Fail = results.population.v1gen.startsWith('FAIL');
const g7Fail = ctl.g7struct === 'FAIL-vocabulary';
process.exit(v1Fail || g7Fail ? 1 : 0);
