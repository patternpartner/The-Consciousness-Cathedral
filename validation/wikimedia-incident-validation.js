#!/usr/bin/env node
// FRESH-CORPUS validation: Wikimedia production incident reports through the
// UNMODIFIED evaluator. This is the standing ask stated in
// docs/CORE-VERDICT-SENSITIVITY.md: the GitLab operational corpora became
// DEVELOPMENT DATA once v3.17.0 (length-density), v3.18.0 (bound structure
// satisfies the failure-mode requirement) and v3.19.0 (Tier-2 opened to
// instrumented text; implicit-binding tightened) were iterated against them.
// "The operational corpora are development data for this fix; fresh operational
// corpora are its validation." This run is that validation, on a corpus the
// evaluator has never seen.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. The preprocessing,
// gate thresholds, seed, and word-shuffle control are copied VERBATIM from
// core-verdict-sensitivity.js -- the analysis path is byte-for-byte identical,
// only the corpus source is new. Nothing here was tuned on this data; the
// gates below were written before the analyzer touched a single report.
//
// Population (fetch-wikimedia-incidents.sh; raw data stays out of git),
// operational BY CONSTRUCTION -- the label is Wikimedia SRE's incident-report
// naming convention, not an annotator's opinion:
//
//   Wikimedia incident reports -- ~896 real production incident reports from
//     wikitech.wikimedia.org (mainspace `Incidents/<date>-<name>` pages,
//     2011-2026): summary, impact, timeline, detection, root cause,
//     actionables. Human-written; the same honest shape as the GitLab run
//     (no labelled corpus of genuinely operational AI outputs exists).
//
// Preprocessing (identical to the GitLab run): the wiki's own plain-text
// prose rendering (TextExtracts explaintext + exsectionformat=plain, done in
// the fetch step) is passed through the SAME stripMarkdown normalizer;
// documents with < 500 chars of prose dropped; whole documents analyzed.
//
// PRE-REGISTERED gates (written before any verdict was computed):
//
//   V1 -- LENGTH-DENSITY FIX HOLDS OUT-OF-SAMPLE (validates v3.17.0). The
//   two long-document instrument bugs were fixed against GitLab development
//   data, dropping OUTSIDE DESIGN SPACE to 0.0-0.6% and gaming flags to
//   2.4-5.0% there. Pre-fix those rates were 14-29% and 21-24%. On a fresh
//   corpus the fix PASSES iff both stay in the same regime: OUTSIDE DESIGN
//   SPACE < 5% AND gaming-flagged < 10%. This is the gate this corpus most
//   directly answers.
//
//   V2 / G2-EXT -- STRUCTURE, NOT VOCABULARY, on fresh external positives
//   (validates the v3.18.0/v3.19.0 anti-gaming work). Pool operational-family
//   positives; at n >= 20 apply the standing word-shuffle gate (20 seeded
//   shuffles per text, < 20% retention). At n < 20, UNDERPOWERED. If positives
//   exceed 40, a seeded subsample of 40 keeps the control bounded.
//
//   S1 -- SENSITIVITY (reported, expected FAIL by design). Operational-family
//   verdict on >= 10% of reports. Per blocker 3 (v3.19.0: "the design space is
//   plans"), an incident report narrates one past failure and is not a plan
//   enumerating what could break, so S1 is expected to FAIL here exactly as it
//   did on GitLab. It is REPORTED as the record of that boundary, not gated:
//   the process exit code reflects V1 and V2 only.
//
//   R1 -- FLAGSHIP RECALL (reported): share earning OPERATIONALLY SOUND.
//   R2 -- DESIGN-SPACE SHAPE (reported): full verdict distribution and
//   gaming-flag rates on a fresh operational register.
//
// Reproduce: bash fetch-wikimedia-incidents.sh, then
// node wikimedia-incident-validation.js. Deterministic: seeded shuffles.
// Results: results-wikimedia-incident-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data', 'wikimedia');
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
        .replace(/<!--[\s\S]*?-->/g, ' ')            // HTML comments (template furniture)
        .replace(/```[\s\S]*?```/g, ' ')             // fenced code blocks
        .replace(/~~~[\s\S]*?~~~/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')                  // inline code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')       // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // links -> anchor text
        .replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, ' ')  // table separator rows
        .replace(/^#{1,6}\s*/gm, '')                 // heading markers
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')// emphasis
        .replace(/^>\s?/gm, '')                      // blockquotes
        .replace(/\|/g, ' ')                         // remaining table pipes
        .replace(/<[^>\n]{1,80}>/g, ' ')             // inline HTML tags
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// --- corpus -----------------------------------------------------------------
function incidentReports() {
    if (!fs.existsSync(DATA)) {
        console.error('No corpus found at ' + DATA + '. Run: bash fetch-wikimedia-incidents.sh');
        process.exit(2);
    }
    const docs = [];
    for (const f of fs.readdirSync(DATA).filter(f => /^inc_\d+\.json$/.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
        docs.push({ id: `${rec.title} (rev ${rec.revid})`, text: stripMarkdown(rec.extract || '') });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

function runPopulation(name, docs) {
    const dist = {};
    const gaming = { flagged: 0 };
    let outsideDesignSpace = 0;
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gaming.flagged++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    const famRate = positives.length / docs.length;
    const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / docs.length;
    const odsRate = outsideDesignSpace / docs.length;
    const gamingRate = gaming.flagged / docs.length;
    return {
        population: name, documents: docs.length,
        verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (soundRate * 100).toFixed(1) + '%',
        s1: famRate >= 0.10 ? 'PASS-sensitive' : 'FAIL-insensitive (expected; see blocker 3)',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        // V1: the v3.17.0 length-density fix must hold on this unseen corpus.
        v1: (odsRate < 0.05 && gamingRate < 0.10)
            ? 'PASS-density-fix-holds'
            : 'FAIL-density-fix-regressed',
        positives
    };
}

function shuffleControl(positives) {
    // Bound the control deterministically if positives are plentiful.
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
    out.g2ext = positives.length >= 20 ?
        (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
        'UNDERPOWERED (n=' + positives.length + ' < 20)';
    return out;
}

const results = { generated: '2026-07-11', seed: SEED, minProseChars: MIN_PROSE,
                  corpus: 'Wikimedia production incident reports (wikitech.wikimedia.org, Incidents/<date>-<name>)',
                  evaluatorUnmodified: true, populations: [], control: null };

const docs = incidentReports();
const r = runPopulation('Wikimedia incident reports (real production postmortems)', docs);
r.positiveIds = r.positives.map(p => ({ id: p.id, status: p.status }));
const positives = r.positives;
delete r.positives;
results.populations.push(r);

console.log('═'.repeat(63));
console.log(`${r.population} — ${r.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${r.outsideDesignSpaceRate}   gaming flagged: ${r.gamingFlaggedRate}`);
console.log(`    → V1 (v3.17.0 density fix out-of-sample): ${r.v1}`);
console.log(`  operational family: ${r.operationalFamilyRate} → S1 ${r.s1}`);
console.log(`  OPERATIONALLY SOUND: ${r.operationallySoundRate} (R1, reported)`);
console.log(`  verdicts:`, JSON.stringify(r.verdictDistribution));

results.control = shuffleControl(positives);
console.log('═'.repeat(63));
console.log(`CONTROL — ${results.control.pooledPositives} pooled positives, ` +
    `${results.control.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.control.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.control.retentionRate} → V2/G2-EXT ${results.control.g2ext}`);

fs.writeFileSync(path.join(__dirname, 'results-wikimedia-incident-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-wikimedia-incident-validation.json');

// Exit code reflects the PRE-REGISTERED gates this corpus validates: V1 and
// V2. S1 is reported, not gated (its FAIL is expected by design, blocker 3).
const v1Fail = results.populations.some(p => p.v1 === 'FAIL-density-fix-regressed');
const v2Fail = results.control.g2ext === 'FAIL-vocabulary';
process.exit(v1Fail || v2Fail ? 1 : 0);
