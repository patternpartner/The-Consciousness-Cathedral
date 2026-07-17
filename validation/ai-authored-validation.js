#!/usr/bin/env node
// THE AUTHORSHIP RUN — closing the program's oldest open flag. Every fresh-
// corpus run since prometheus (docs/PROMETHEUS-RUNBOOK-VALIDATION.md, flag 3)
// has carried the same honest limit: "human-written corpus; AI-authored
// operational text still unmeasured." This run measures it: 600 procedural
// how-to documents authored by Mixtral-8x7B (Cosmopedia `wikihow` — synthetic
// by the dataset's own construction) through the UNMODIFIED evaluator.
//
// The question the flag has always encoded: do the instruments behave
// differently on machine-authored text — does LLM procedural style mint
// operational-family verdicts cheaply (vocabulary without binding), or trip
// the gaming/design-space instruments on ordinary documents?
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from the
// seven register runs; the only corpus-specific step is reading `row.text`
// from the datasets-server row shape (the same loader family as the R1.x
// relational corpora).
//
// PRE-REGISTERED gates (committed before any verdict was computed):
//
//   V1-AI -- INSTRUMENTS ARE REGISTER-DRIVEN, NOT AUTHORSHIP-DRIVEN:
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10% on AI-authored
//   procedural documents. Readings pre-stated: PASS = the density/gaming
//   instruments respond to text shape, not authorship; FAIL = machine
//   style trips an instrument (which one, diagnosed and ledgered).
//
//   G6-STRUCT -- AI-EARNED VERDICTS MUST BE STRUCTURAL: on this population's
//   operational-family positives, the standing word-shuffle control
//   (20 seeded shuffles/text): pooled retention < 20% -> PASS; per-text
//   worst REPORTED against the 10/20 reference. Zero positives passes
//   vacuously. This is the flag's sharpest form: if LLM procedural prose
//   minted verdicts by vocabulary, it would show here first.
//
//   S-AI (reported, readings pre-stated): the operational-family rate.
//   Human registers run 0.0-2.9% outside mandated-questionnaire documents
//   (11.6% with them). A FAR higher AI rate (>= 10%) without questionnaire
//   structure would mean machine procedural style reaches the family
//   cheaply; a rate in the human band means the evaluator treats machine
//   text like human text. Reported either way, no gate.
//
//   R2 (reported): verdict distribution.
//
//   NOT pooled into G2-EXT: the pooled control is a human-fresh-corpora
//   instrument; mixing authorship would change its meaning. This register
//   gets its own control only.
//
// Reproduce: bash fetch-ai-authored-corpus.sh, then
// node ai-authored-validation.js. Deterministic given the fetched data:
// seeded shuffles. Results: results-ai-authored-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data', 'ai-authored');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260717;
const SHUFFLES_PER_TEXT = 20;
const MIN_PROSE = 500;
const MAX_CONTROL_TEXTS = 40;

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

function loadAiCorpus() {
    if (!fs.existsSync(DATA)) {
        console.error('No corpus at ' + DATA + '. Run: bash fetch-ai-authored-corpus.sh');
        process.exit(2);
    }
    const docs = [];
    for (const f of fs.readdirSync(DATA).filter(f => /^cw_\d+\.json$/.test(f))
            .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))) {
        const batch = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
        for (const r of (batch.rows || [])) {
            docs.push({ id: `cosmopedia-wikihow row ${r.row_idx}`, text: stripMarkdown(r.row.text || '') });
        }
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

const docs = loadAiCorpus();
const dist = {};
let outsideDesignSpace = 0, gamingFlagged = 0;
const gamingKinds = {};
const positives = [];
for (const d of docs) {
    const a = core.analyzeCathedral(d.text);
    const s = a.verdict.status;
    dist[s] = (dist[s] || 0) + 1;
    if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
    const g = a.gamingDetection.assessment;
    if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(g)) {
        gamingFlagged++;
        gamingKinds[g] = (gamingKinds[g] || 0) + 1;
    }
    if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
}
const famRate = positives.length / docs.length;
const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / docs.length;
const odsRate = outsideDesignSpace / docs.length;
const gamingRate = gamingFlagged / docs.length;

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
    corpus: 'HuggingFaceTB/cosmopedia config=wikihow split=train offsets 0-500 (AI-authored by construction; date-bounded fetch)',
    evaluatorUnmodified: true,
    population: {
        documents: docs.length, verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (soundRate * 100).toFixed(1) + '%',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        gamingKinds,
        v1ai: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-register-driven-not-authorship-driven' : 'FAIL-machine-style-trips-instrument',
        sAiNote: 'human band outside mandated questionnaires: 0.0-2.9%; KEPs with PRR questionnaire: 11.6%',
        positiveIds: positives.map(p => ({ id: p.id, status: p.status }))
    },
    g6struct: null };

console.log('═'.repeat(63));
console.log(`cosmopedia wikihow (AI-authored procedural) — ${docs.length} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${results.population.outsideDesignSpaceRate}   gaming flagged: ${results.population.gamingFlaggedRate}`,
    Object.keys(gamingKinds).length ? JSON.stringify(gamingKinds) : '');
console.log(`    → V1-AI: ${results.population.v1ai}`);
console.log(`  operational family: ${results.population.operationalFamilyRate} (S-AI, reported; ${results.population.sAiNote})`);
console.log(`  OPERATIONALLY SOUND: ${results.population.operationallySoundRate}`);
console.log(`  verdicts:`, JSON.stringify(dist));

// --- G6-STRUCT: standing shuffle criterion on the AI positives --------------
let texts = positives;
let subsampled = false;
if (texts.length > MAX_CONTROL_TEXTS) {
    texts = seededShuffle(texts, mulberry32(SEED)).slice(0, MAX_CONTROL_TEXTS)
        .sort((a, b) => a.id < b.id ? -1 : 1);
    subsampled = true;
}
const ctl = { pooledPositives: positives.length, controlTexts: texts.length, subsampled,
              trials: 0, retained: 0, perText: [] };
texts.forEach((p, pi) => {
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
const worst = ctl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
ctl.worstText = worst;
ctl.g6struct = positives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
results.g6struct = ctl;

console.log('═'.repeat(63));
console.log(`G6-STRUCT — AI positives ${positives.length}, ${ctl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (subsampled ? ' (seeded subsample)' : ''));
if (positives.length > 0) {
    console.log(`  retention: ${ctl.retentionRate} — worst text ${worst}/20 (reported vs 10/20 reference)`);
    ctl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G6-STRUCT: ${ctl.g6struct}`);

fs.writeFileSync(path.join(__dirname, 'results-ai-authored-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-ai-authored-validation.json');

const v1Fail = results.population.v1ai === 'FAIL-machine-style-trips-instrument';
const g6Fail = ctl.g6struct === 'FAIL-vocabulary';
process.exit(v1Fail || g6Fail ? 1 : 0);
