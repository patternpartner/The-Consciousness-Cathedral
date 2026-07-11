#!/usr/bin/env node
// FRESH plan-DENSE corpus: prometheus-operator/runbooks alert pages through
// the UNMODIFIED evaluator, and the powered G2-EXT retest the Wikimedia runs
// left open (pooled n=16 < 20; Wikimedia's operational-family base rate ~2-3%
// exhausted the source). prometheus-operator/runbooks is denser in plan-bearing
// text -- each page is Meaning / Impact / Diagnosis / Mitigation for a firing
// alert (threshold semantics bound to a mitigation). NEW to the evaluator; not
// GitLab, not Wikimedia.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// seed, gate thresholds, and the word-shuffle control are copied VERBATIM from
// core-verdict-sensitivity.js. The ONLY corpus-specific step is stripping Hugo
// YAML frontmatter (the markdown-file analogue of the wiki template comments
// stripMarkdown already removes) before the identical stripMarkdown normalizer;
// stripMarkdown itself is byte-identical to every prior run.
//
// POOLED G2-EXT draws operational-family positives from all three FRESH
// populations -- Wikimedia incidents, Wikimedia runbooks, prometheus runbooks
// -- exactly as core-verdict-sensitivity.js pooled GitLab incidents + runbooks
// to reach n=28. The Wikimedia corpora are reused only to contribute positives
// to the pool (their own gates were reported in their runs).
//
// PRE-REGISTERED gates (written before any verdict was computed):
//
//   V1 -- LENGTH-DENSITY FIX HOLDS ON A THIRD FRESH REGISTER (validates
//   v3.17.0 again): on the prometheus population, OUTSIDE DESIGN SPACE < 5%
//   AND gaming-flagged < 10%.
//
//   G2-EXT-POOLED -- STRUCTURE, NOT VOCABULARY, POWERED ON FRESH DATA
//   (validates v3.18.0/v3.19.0). Pool the operational-family positives of all
//   three fresh populations; at n >= 20 apply the standing word-shuffle gate
//   (20 seeded shuffles per text, < 20% retention -> PASS-structural). If
//   positives exceed 40, a seeded subsample of 40 keeps the control bounded.
//
//   S1 (prometheus, reported): operational family >= 10%.
//   R1 / R2 (reported): OPERATIONALLY SOUND share and verdict distribution.
//
// Reproduce: bash fetch-wikimedia-incidents.sh && bash fetch-wikimedia-runbooks.sh
// && bash fetch-prometheus-runbooks.sh, then node prometheus-runbook-validation.js.
// Deterministic: seeded shuffles. Results: results-prometheus-runbook-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const PROM = path.join(DATA, 'prometheus-runbooks');
const WM_INC = path.join(DATA, 'wikimedia');
const WM_RB = path.join(DATA, 'wikimedia-runbooks');
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
// corpus-specific: strip leading Hugo YAML frontmatter (format furniture)
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
function loadProm(dir) {
    if (!fs.existsSync(dir)) {
        console.error('No corpus at ' + dir + '. Run: bash fetch-prometheus-runbooks.sh');
        process.exit(2);
    }
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => /^pr_\d+\.json$/.test(f)).sort()) {
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
                  corpus: 'prometheus-operator/runbooks alert pages (SHA-pinned); Wikimedia incident + runbook positives pooled for G2-EXT',
                  evaluatorUnmodified: true, promPopulation: null, pooledControl: null };

// --- prometheus population (V1, S1, R1, R2) ---------------------------------
const promDocs = loadProm(PROM);
const pr = runPopulation('prometheus-operator/runbooks alert pages', promDocs);
pr.positiveIds = pr.positives.map(p => ({ id: p.id, status: p.status }));
const promPositives = pr.positives;
delete pr.positives;
results.promPopulation = pr;

console.log('═'.repeat(63));
console.log(`${pr.population} — ${pr.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${pr.outsideDesignSpaceRate}   gaming flagged: ${pr.gamingFlaggedRate}`);
console.log(`    → V1 (v3.17.0 density fix, third fresh register): ${pr.v1}`);
console.log(`  operational family: ${pr.operationalFamilyRate} → S1 ${pr.s1}`);
console.log(`  OPERATIONALLY SOUND: ${pr.operationallySoundRate} (R1, reported)`);
console.log(`  verdicts:`, JSON.stringify(pr.verdictDistribution));

// --- pooled G2-EXT across all three fresh populations -----------------------
const incPositives = familyPositives(loadWiki(WM_INC, 'inc'));
const wmRbPositives = familyPositives(loadWiki(WM_RB, 'rb'));
const pooled = incPositives.concat(wmRbPositives).concat(promPositives);
results.pooledControl = shuffleControl(pooled);
results.pooledControl.composition = {
    wikimediaIncidents: incPositives.length,
    wikimediaRunbooks: wmRbPositives.length,
    prometheusRunbooks: promPositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${results.pooledControl.pooledPositives} positives ` +
    `(${incPositives.length} wmi + ${wmRbPositives.length} wmr + ${promPositives.length} prom), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-prometheus-runbook-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-prometheus-runbook-validation.json');

const v1Fail = pr.v1 === 'FAIL-density-fix-regressed';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g2Fail ? 1 : 0);
