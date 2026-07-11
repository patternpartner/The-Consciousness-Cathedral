#!/usr/bin/env node
// FRESH plan-bearing corpus: Wikimedia SRE runbooks through the UNMODIFIED
// evaluator, and the powered G2-EXT retest the incident run left open.
//
// The incident run (docs/WIKIMEDIA-INCIDENT-VALIDATION.md) validated the
// v3.17.0 density fix out-of-sample but left G2-EXT UNDERPOWERED (n=10 < 20):
// a retrospective-only corpus yields too few operational-family positives,
// because retrospectives aren't plans. This run adds the missing register --
// runbooks, which ARE plans (thresholds bound to actions) -- and powers the
// external structure-not-vocabulary gate by POOLING the two fresh Wikimedia
// populations, exactly as core-verdict-sensitivity.js pooled GitLab incidents
// + runbooks to reach n=28.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// seed, gate thresholds, and the word-shuffle control are copied VERBATIM
// from core-verdict-sensitivity.js. Nothing here was tuned on this data; the
// gates were written before the analyzer touched a single runbook.
//
// Populations (raw data out of git):
//   Runbooks -- Wikimedia SRE runbooks (fetch-wikimedia-runbooks.sh):
//     Category:Runbooks members UNION intitle:Runbook pages, deduped;
//     labelled by construction (the runbook convention). NEW to the evaluator.
//   Incidents -- the incident corpus already on disk (data/wikimedia/,
//     fetch-wikimedia-incidents.sh), reused ONLY to pool positives for the
//     combined G2-EXT control (its own gates were reported in the incident run).
//
// Preprocessing identical to both prior runs: wiki plain-text (TextExtracts),
// same stripMarkdown, same >= 500-char prose floor, whole documents.
//
// PRE-REGISTERED gates (written before any verdict was computed):
//
//   V1 -- LENGTH-DENSITY FIX HOLDS ON A SECOND FRESH REGISTER (validates
//   v3.17.0 again). On the runbook population: OUTSIDE DESIGN SPACE < 5% AND
//   gaming-flagged < 10% (the GitLab/Wikimedia-incident post-fix regime).
//
//   G2-EXT-POOLED -- STRUCTURE, NOT VOCABULARY, POWERED ON FRESH DATA
//   (validates v3.18.0/v3.19.0 anti-gaming out-of-sample). Pool the runbook
//   AND incident operational-family positives; at n >= 20 apply the standing
//   word-shuffle gate (20 seeded shuffles per text, < 20% retention ->
//   PASS-structural). If positives exceed 40, a seeded subsample of 40 keeps
//   the control bounded. This is the retest the incident run left open.
//
//   S1 (runbooks, reported): operational family on >= 10% of runbooks.
//   R1 / R2 (reported): OPERATIONALLY SOUND share and verdict distribution.
//
// Reproduce: bash fetch-wikimedia-incidents.sh && bash fetch-wikimedia-runbooks.sh,
// then node wikimedia-runbook-validation.js. Deterministic: seeded shuffles.
// Results: results-wikimedia-runbook-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const RB_DATA = path.join(__dirname, 'data', 'wikimedia-runbooks');
const INC_DATA = path.join(__dirname, 'data', 'wikimedia');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260711;
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

function loadCorpus(dir, prefix) {
    if (!fs.existsSync(dir)) {
        console.error('No corpus at ' + dir + '. Run the matching fetch-*.sh first.');
        process.exit(2);
    }
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => re.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        docs.push({ id: `${rec.title} (rev ${rec.revid})`, text: stripMarkdown(rec.extract || '') });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

function runPopulation(name, docs) {
    const dist = {};
    let outsideDesignSpace = 0, gamingFlagged = 0;
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gamingFlagged++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    const famRate = positives.length / docs.length;
    const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / docs.length;
    const odsRate = outsideDesignSpace / docs.length;
    const gamingRate = gamingFlagged / docs.length;
    return {
        population: name, documents: docs.length, verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (soundRate * 100).toFixed(1) + '%',
        s1: famRate >= 0.10 ? 'PASS-sensitive' : 'FAIL-insensitive (expected; see blocker 3)',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        v1: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-density-fix-holds' : 'FAIL-density-fix-regressed',
        positives
    };
}

function shuffleControl(positives) {
    let texts = positives;
    let subsampled = false;
    if (texts.length > MAX_CONTROL_TEXTS) {
        texts = seededShuffle(texts, mulberry32(SEED)).slice(0, MAX_CONTROL_TEXTS)
            .sort((a, b) => a.id < b.id ? -1 : 1);
        subsampled = true;
    }
    const out = { pooledPositives: positives.length, controlTexts: texts.length, subsampled,
                  trials: 0, retained: 0, perText: [] };
    texts.forEach((p, pi) => {
        let r = 0;
        for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
            const rand = mulberry32(SEED + pi * 1000 + s);
            const v = core.analyzeCathedral(wordShuffle(p.text, rand)).verdict.status;
            out.trials++;
            if (OPERATIONAL_FAMILY.includes(v)) { out.retained++; r++; }
        }
        out.perText.push({ id: p.id, original: p.status, retainedOf20: r });
    });
    const rate = out.trials ? out.retained / out.trials : 0;
    out.retentionRate = (rate * 100).toFixed(1) + '%';
    out.g2extPooled = positives.length >= 20 ?
        (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
        'UNDERPOWERED (n=' + positives.length + ' < 20)';
    return out;
}

const results = { generated: '2026-07-11', seed: SEED, minProseChars: MIN_PROSE,
                  corpus: 'Wikimedia SRE runbooks (Category:Runbooks ∪ intitle:Runbook); incident positives pooled for G2-EXT',
                  evaluatorUnmodified: true, runbookPopulation: null, pooledControl: null };

// --- runbook population (V1, S1, R1, R2) ------------------------------------
const runbooks = loadCorpus(RB_DATA, 'rb');
const rb = runPopulation('Wikimedia SRE runbooks (real on-call docs)', runbooks);
rb.positiveIds = rb.positives.map(p => ({ id: p.id, status: p.status }));
const runbookPositives = rb.positives;
delete rb.positives;
results.runbookPopulation = rb;

console.log('═'.repeat(63));
console.log(`${rb.population} — ${rb.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${rb.outsideDesignSpaceRate}   gaming flagged: ${rb.gamingFlaggedRate}`);
console.log(`    → V1 (v3.17.0 density fix, second fresh register): ${rb.v1}`);
console.log(`  operational family: ${rb.operationalFamilyRate} → S1 ${rb.s1}`);
console.log(`  OPERATIONALLY SOUND: ${rb.operationallySoundRate} (R1, reported)`);
console.log(`  verdicts:`, JSON.stringify(rb.verdictDistribution));

// --- pooled G2-EXT: runbook + incident operational-family positives ---------
// Pool order mirrors core-verdict-sensitivity.js (population order, then the
// control's own seeded subsample/sort). Incident positives are re-derived from
// the incident corpus on disk so the pool is fully reproducible.
const incidents = loadCorpus(INC_DATA, 'inc');
const incidentPositives = [];
for (const d of incidents) {
    const s = core.analyzeCathedral(d.text).verdict.status;
    if (OPERATIONAL_FAMILY.includes(s)) incidentPositives.push({ id: d.id, text: d.text, status: s });
}
const pooled = incidentPositives.concat(runbookPositives);
results.pooledControl = shuffleControl(pooled);
results.pooledControl.composition = {
    incidentPositives: incidentPositives.length,
    runbookPositives: runbookPositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${results.pooledControl.pooledPositives} positives ` +
    `(${incidentPositives.length} incident + ${runbookPositives.length} runbook), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-wikimedia-runbook-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-wikimedia-runbook-validation.json');

// Exit reflects the pre-registered gates: V1 (runbooks) and G2-EXT-POOLED.
// S1 reported, not gated.
const v1Fail = rb.v1 === 'FAIL-density-fix-regressed';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g2Fail ? 1 : 0);
