#!/usr/bin/env node
// OUT-OF-SAMPLE VALIDATION FOR v3.25.0 (the binding-density guard,
// docs/TIER2-BINDING-DENSITY.md). The guard's 20-signal reference was
// calibrated on the four fresh corpora, making them DEVELOPMENT DATA; the
// standing ask is the next corpus nobody has tuned on. This is that corpus —
// deliberately the shape the guard adjudicates: LONG, signal-dense,
// plan-bearing documents. Kubernetes Enhancement Proposals are forward-looking
// design plans with enumerated "Risks and Mitigations" sections — also the
// most favorable register yet for the operational-family verdict, so the
// family rate here is blocker 3's claim probed from the positive side. NEW
// provenance: kubernetes/enhancements. Not GitLab, not Wikimedia, not
// prometheus-operator, not Red Hat.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from the
// prior runs; the loader is byte-identical to the prometheus/openshift loader
// (stripFrontmatter is a no-op on KEP READMEs — their template boilerplate
// lives in HTML comments, which stripMarkdown already removes).
//
// PRE-REGISTERED gates (committed before any verdict was computed on this
// corpus):
//
//   V1 -- LENGTH-DENSITY FIX HOLDS ON A FIFTH FRESH REGISTER (validates
//   v3.17.0 again): OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   G4-DENS -- THE v3.25.0 GUARD HOLDS OUT-OF-SAMPLE (the fix-specific gate).
//   The fix's claim: an operational-family verdict must be structural at any
//   document scale. On THIS population's operational-family positives, the
//   standing word-shuffle control (20 seeded shuffles per text) must show
//   (a) pooled retention < 20% AND (b) no single text retaining >= 10/20.
//   Zero positives passes vacuously; guard activity below is then the
//   evidence.
//
//   GUARD ACTIVITY (reported, not gated): every document whose implicit-
//   binding assessment is SPARSE_BINDING, with its boundCount and
//   totalSignals. The fix predicts fires confined to chance-level densities
//   (bound counts within noise of the document's shuffled baseline).
//   PRE-STATED overreach diagnostic: any SPARSE_BINDING fire with
//   boundCount >= 4 is reported as potential overreach — substantial absolute
//   structure killed by scale — and counts against the fix in the findings
//   even though it does not flip the gate.
//
//   G2-EXT-POOLED (standing): pool operational-family positives across all
//   FIVE fresh populations; at n >= 20 apply the < 20% retention gate; at
//   n < 20, UNDERPOWERED. Honest caveat carried into the doc: the four prior
//   corpora are development data for v3.25.0; only the KEP contribution is
//   fresh for THIS fix.
//
//   S1 (KEPs, reported): operational family >= 10%. KEPs are plans — this is
//   the most favorable register the program has fed the verdict; the rate is
//   the blocker-3 probe from the positive side.
//   R1 / R2 (reported): OPERATIONALLY SOUND share and verdict distribution.
//
// Reproduce: bash fetch-kep-corpus.sh (plus the four prior fetch scripts for
// the pool), then node kep-validation.js. Deterministic: seeded shuffles.
// Results: results-kep-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const KEP = path.join(DATA, 'kep-corpus');
const OS_RB = path.join(DATA, 'openshift-runbooks');
const PROM = path.join(DATA, 'prometheus-runbooks');
const WM_INC = path.join(DATA, 'wikimedia');
const WM_RB = path.join(DATA, 'wikimedia-runbooks');
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
function stripFrontmatter(md) {
    return md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function loadWiki(dir, prefix) {
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => re.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        docs.push({ id: `${rec.title} (rev ${rec.revid})`, text: stripMarkdown(rec.extract || '') });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}
function loadRepoCorpus(dir, prefix, fetchHint) {
    if (!fs.existsSync(dir)) {
        console.error('No corpus at ' + dir + '. Run: bash ' + fetchHint);
        process.exit(2);
    }
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => re.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        docs.push({ id: `${rec.title} @${(rec.ref || '').slice(0, 8)}`, text: stripMarkdown(stripFrontmatter(rec.markdown || '')) });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

function familyPositives(docs) {
    const positives = [];
    for (const d of docs) {
        const s = core.analyzeCathedral(d.text).verdict.status;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    return positives;
}

function runPopulation(name, docs) {
    const dist = {};
    let outsideDesignSpace = 0, gamingFlagged = 0;
    const sparseFires = [];
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gamingFlagged++;
        const ib = a.bindings.implicitBindings;
        if (ib.assessment === 'SPARSE_BINDING') {
            sparseFires.push({ id: d.id, boundCount: ib.boundCount, totalSignals: ib.totalSignals,
                               effectiveBoundCount: +ib.effectiveBoundCount.toFixed(2),
                               overreachFlag: ib.boundCount >= 4 });
        }
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
        sparseFires,
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
    return out;
}

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
                  corpus: 'kubernetes/enhancements KEP READMEs (SHA-pinned); prior fresh positives pooled for G2-EXT',
                  evaluatorUnmodified: true, kepPopulation: null, g4dens: null, pooledControl: null };

// --- KEP population (V1, G4-DENS, S1, R1, R2, guard activity) ---------------
const kepDocs = loadRepoCorpus(KEP, 'kep', 'fetch-kep-corpus.sh');
const kep = runPopulation('kubernetes/enhancements KEP design documents', kepDocs);
kep.positiveIds = kep.positives.map(p => ({ id: p.id, status: p.status }));
const kepPositives = kep.positives;
delete kep.positives;
results.kepPopulation = kep;

console.log('═'.repeat(63));
console.log(`${kep.population} — ${kep.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${kep.outsideDesignSpaceRate}   gaming flagged: ${kep.gamingFlaggedRate}`);
console.log(`    → V1 (v3.17.0 density fix, FIFTH fresh register): ${kep.v1}`);
console.log(`  operational family: ${kep.operationalFamilyRate} → S1 ${kep.s1}`);
console.log(`  OPERATIONALLY SOUND: ${kep.operationallySoundRate} (R1, reported)`);
console.log(`  SPARSE_BINDING fires: ${kep.sparseFires.length}` +
    (kep.sparseFires.length ? ' (overreach-flagged: ' + kep.sparseFires.filter(f => f.overreachFlag).length + ')' : ''));
kep.sparseFires.forEach(f => console.log(`    bound=${f.boundCount} signals=${f.totalSignals} eff=${f.effectiveBoundCount}${f.overreachFlag ? '  ⚠ OVERREACH-FLAG' : ''}  ${f.id}`));
console.log(`  verdicts:`, JSON.stringify(kep.verdictDistribution));

// --- G4-DENS: the fix-specific shuffle gate on THIS population --------------
const kepControl = shuffleControl(kepPositives);
const kepRate = kepControl.trials ? kepControl.retained / kepControl.trials : 0;
const worst = kepControl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
kepControl.g4dens = kepPositives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (kepRate < 0.2 && worst < 10) ? 'PASS-structural' : 'FAIL-soft-verdicts-survive';
results.g4dens = kepControl;

console.log('═'.repeat(63));
console.log(`G4-DENS — KEP positives ${kepPositives.length}, ` +
    `${kepControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (kepControl.subsampled ? ' (seeded subsample)' : ''));
if (kepPositives.length > 0) {
    console.log(`  retention: ${kepControl.retentionRate}, worst text ${worst}/20`);
    kepControl.perText.forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G4-DENS (v3.25.0 out-of-sample): ${kepControl.g4dens}`);

// --- pooled G2-EXT across all five fresh populations ------------------------
const incPositives = familyPositives(loadWiki(WM_INC, 'inc'));
const wmRbPositives = familyPositives(loadWiki(WM_RB, 'rb'));
const promPositives = familyPositives(loadRepoCorpus(PROM, 'pr', 'fetch-prometheus-runbooks.sh'));
const osPositives = familyPositives(loadRepoCorpus(OS_RB, 'os', 'fetch-openshift-runbooks.sh'));
const pooled = incPositives.concat(wmRbPositives).concat(promPositives).concat(osPositives).concat(kepPositives);
results.pooledControl = shuffleControl(pooled);
const pooledRate = results.pooledControl.trials ? results.pooledControl.retained / results.pooledControl.trials : 0;
results.pooledControl.g2extPooled = pooled.length >= 20 ?
    (pooledRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
    'UNDERPOWERED (n=' + pooled.length + ' < 20)';
results.pooledControl.composition = {
    wikimediaIncidents: incPositives.length,
    wikimediaRunbooks: wmRbPositives.length,
    prometheusRunbooks: promPositives.length,
    openshiftRunbooks: osPositives.length,
    kepDesignDocs: kepPositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${pooled.length} positives ` +
    `(${incPositives.length} wmi + ${wmRbPositives.length} wmr + ${promPositives.length} prom + ${osPositives.length} os + ${kepPositives.length} kep), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-kep-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-kep-validation.json');

const v1Fail = kep.v1 === 'FAIL-density-fix-regressed';
const g4Fail = results.g4dens.g4dens === 'FAIL-soft-verdicts-survive';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g4Fail || g2Fail ? 1 : 0);
