#!/usr/bin/env node
// OUT-OF-SAMPLE VALIDATION FOR v3.23.0 (the Tier-2 diversity tightening,
// docs/TIER2-DIVERSITY-TIGHTENING.md). Iterating that fix against the pooled
// fresh corpora made them DEVELOPMENT DATA; its methodological note names the
// standing ask: "the next operational corpus nobody has tuned on is the
// validation for this fix." This is that corpus — deliberately the SAME text
// shape the fix targeted (short metric-alert runbooks, Meaning / Impact /
// Diagnosis / Mitigation) from NEW provenance: openshift/runbooks (Red Hat).
// Not GitLab, not Wikimedia, not prometheus-operator.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from
// prometheus-runbook-validation.js / core-verdict-sensitivity.js. The loader
// is byte-identical to the prometheus loader (stripFrontmatter is a no-op on
// these files — they carry no YAML frontmatter — retained so the path is
// identical).
//
// PRE-REGISTERED gates (written before any verdict was computed on this
// corpus):
//
//   V1 -- LENGTH-DENSITY FIX HOLDS ON A FOURTH FRESH REGISTER (validates
//   v3.17.0 again): OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   G3-DIV -- THE v3.23.0 GUARDS HOLD OUT-OF-SAMPLE (the fix-specific gate).
//   The fix's claim: short alert runbooks can no longer mint a shuffle-
//   surviving OPERATIONAL INTENT by binding one signal repeatedly. On THIS
//   population's operational-family positives, the standing word-shuffle
//   control (20 seeded shuffles per text) must show (a) pooled retention
//   < 20% AND (b) no single text retaining >= 10/20 — the pre-fix offender
//   signature was 17/20 and 11/20. Zero positives passes vacuously (the
//   verdict simply does not fire on this register); the guard-activity count
//   below is then the run's evidence.
//
//   GUARD ACTIVITY (reported, not gated): documents whose implicit-binding
//   assessment is SINGLE_SIGNAL_BINDING — the new guard firing in the wild.
//   Each is a document that formed >= 2 implicit bindings sharing one signal:
//   exactly the shape that pre-fix could mint INTENT. Also reported:
//   SINGLE_ACTION_BINDING (the older mirror guard) for context.
//
//   G2-EXT-POOLED (standing): pool the operational-family positives of all
//   FOUR fresh populations (Wikimedia incidents + Wikimedia runbooks +
//   prometheus runbooks + openshift runbooks); at n >= 20 apply the standing
//   shuffle gate (< 20% retention -> PASS-structural); at n < 20, UNDERPOWERED.
//   Honest caveat carried into the doc: the three prior corpora are
//   development data for v3.23.0, so only the openshift contribution is fresh
//   for THIS fix; the pool remains the standing anti-gaming control, not
//   fresh validation by itself.
//
//   S1 (openshift, reported): operational family >= 10%.
//   R1 / R2 (reported): OPERATIONALLY SOUND share and verdict distribution.
//
// Reproduce: bash fetch-openshift-runbooks.sh && bash fetch-prometheus-runbooks.sh
// && bash fetch-wikimedia-runbooks.sh && bash fetch-wikimedia-incidents.sh,
// then node openshift-runbook-validation.js. Deterministic: seeded shuffles.
// Results: results-openshift-runbook-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
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
    let singleSignal = 0, singleAction = 0;
    const singleSignalIds = [];
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gamingFlagged++;
        const ib = a.bindings.implicitBindings.assessment;
        if (ib === 'SINGLE_SIGNAL_BINDING') { singleSignal++; singleSignalIds.push(d.id); }
        if (ib === 'SINGLE_ACTION_BINDING') singleAction++;
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
        guardActivity: {
            singleSignalBinding: singleSignal,
            singleActionBinding: singleAction,
            singleSignalIds
        },
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
                  corpus: 'openshift/runbooks alert pages (SHA-pinned); prior fresh positives pooled for G2-EXT',
                  evaluatorUnmodified: true, osPopulation: null, g3div: null, pooledControl: null };

// --- openshift population (V1, G3-DIV, S1, R1, R2, guard activity) ----------
const osDocs = loadRepoCorpus(OS_RB, 'os', 'fetch-openshift-runbooks.sh');
const os = runPopulation('openshift/runbooks alert pages', osDocs);
os.positiveIds = os.positives.map(p => ({ id: p.id, status: p.status }));
const osPositives = os.positives;
delete os.positives;
results.osPopulation = os;

console.log('═'.repeat(63));
console.log(`${os.population} — ${os.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${os.outsideDesignSpaceRate}   gaming flagged: ${os.gamingFlaggedRate}`);
console.log(`    → V1 (v3.17.0 density fix, FOURTH fresh register): ${os.v1}`);
console.log(`  operational family: ${os.operationalFamilyRate} → S1 ${os.s1}`);
console.log(`  OPERATIONALLY SOUND: ${os.operationallySoundRate} (R1, reported)`);
console.log(`  guard activity: SINGLE_SIGNAL_BINDING ${os.guardActivity.singleSignalBinding}, ` +
    `SINGLE_ACTION_BINDING ${os.guardActivity.singleActionBinding}`);
console.log(`  verdicts:`, JSON.stringify(os.verdictDistribution));

// --- G3-DIV: the fix-specific shuffle gate on THIS population ---------------
const osControl = shuffleControl(osPositives);
const osRate = osControl.trials ? osControl.retained / osControl.trials : 0;
const worst = osControl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
osControl.g3div = osPositives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (osRate < 0.2 && worst < 10) ? 'PASS-structural' : 'FAIL-soft-verdicts-survive';
results.g3div = osControl;

console.log('═'.repeat(63));
console.log(`G3-DIV — openshift positives ${osPositives.length}, ` +
    `${osControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles`);
if (osPositives.length > 0) {
    console.log(`  retention: ${osControl.retentionRate}, worst text ${worst}/20`);
    osControl.perText.forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G3-DIV (v3.23.0 out-of-sample): ${osControl.g3div}`);

// --- pooled G2-EXT across all four fresh populations ------------------------
const incPositives = familyPositives(loadWiki(WM_INC, 'inc'));
const wmRbPositives = familyPositives(loadWiki(WM_RB, 'rb'));
const promPositives = familyPositives(loadRepoCorpus(PROM, 'pr', 'fetch-prometheus-runbooks.sh'));
const pooled = incPositives.concat(wmRbPositives).concat(promPositives).concat(osPositives);
results.pooledControl = shuffleControl(pooled);
const pooledRate = results.pooledControl.trials ? results.pooledControl.retained / results.pooledControl.trials : 0;
results.pooledControl.g2extPooled = pooled.length >= 20 ?
    (pooledRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
    'UNDERPOWERED (n=' + pooled.length + ' < 20)';
results.pooledControl.composition = {
    wikimediaIncidents: incPositives.length,
    wikimediaRunbooks: wmRbPositives.length,
    prometheusRunbooks: promPositives.length,
    openshiftRunbooks: osPositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${pooled.length} positives ` +
    `(${incPositives.length} wmi + ${wmRbPositives.length} wmr + ${promPositives.length} prom + ${osPositives.length} os), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-openshift-runbook-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-openshift-runbook-validation.json');

const v1Fail = os.v1 === 'FAIL-density-fix-regressed';
const g3Fail = results.g3div.g3div === 'FAIL-soft-verdicts-survive';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g3Fail || g2Fail ? 1 : 0);
