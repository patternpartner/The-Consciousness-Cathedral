#!/usr/bin/env node
// TOPIC DERIVATION for the LLM rollout-plan run (docs/LLM-PLAN-PREREG.md).
//
// Same discipline as the runbook run (derive-llm-runbook-topics.js): the
// prompter has read the entire repository, so topic choice is a contamination
// channel and must be mechanical. Topics are the feature names of the KEP
// register the program already measured (kubernetes/enhancements, byte-pinned
// at the KEP run's own SHA): every `keps/sig-*/<dir>/README.md` at depth 3,
// the KEP directory basename with its numeric prefix stripped and dashes
// spaced (e.g. `2400-node-swap` → "node swap"), deduped case-insensitively,
// sorted, seeded Fisher-Yates with the standing seed, first 120, re-sorted.
// No human hand picks a topic.
//
// The pairing is the point: the human documents for these SAME features
// measured operational-family 11.6% (the mandated-PRR register) — the
// flagship's own register. Generating plans for the same features makes
// authorship the only variable on the plan side, as the runbook run did on
// the alert side.
//
// Output: llm-plan-topics.json — committed BEFORE any generation.
// Reproduce: node derive-llm-plan-topics.js (network: git clone at the pin).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SEED = 20260717;           // the program's standing seed
const N_TOPICS = 120;
const REPO = 'https://github.com/kubernetes/enhancements.git';
const PIN_SHA = '996e7d41387c4937b0b976800718d067cd1bdd16';   // the KEP run's pin

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

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'plantopics-'));
const dir = path.join(tmp, 'enhancements');
execSync(`git clone --quiet ${REPO} ${dir}`, { stdio: 'pipe' });
execSync(`git -C ${dir} checkout --quiet ${PIN_SHA}`, { stdio: 'pipe' });
const files = execSync(`git -C ${dir} ls-tree -r --name-only ${PIN_SHA}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n').filter(Boolean);
fs.rmSync(tmp, { recursive: true, force: true });

const byName = new Map();
let kepCount = 0;
for (const f of files) {
    const m = f.match(/^keps\/(sig-[^/]+)\/([^/]+)\/README\.md$/);
    if (!m) continue;
    kepCount++;
    const feature = m[2].replace(/^\d+-/, '').replace(/-/g, ' ').trim();
    if (!feature) continue;
    const key = feature.toLowerCase();
    if (!byName.has(key)) byName.set(key, { feature, keps: [] });
    byName.get(key).keps.push(`${m[1]}/${m[2]}`);
}

const pool = [...byName.values()].sort((a, b) => a.feature < b.feature ? -1 : 1);
const picked = seededShuffle(pool, mulberry32(SEED)).slice(0, N_TOPICS)
    .sort((a, b) => a.feature < b.feature ? -1 : 1);

const out = {
    generated: '2026-07-18', seed: SEED,
    rule: 'every keps/sig-*/<dir>/README.md at depth 3 at the pinned SHA; dir basename, numeric prefix stripped, dashes spaced; deduped case-insensitively, sorted, seeded Fisher-Yates, first ' + N_TOPICS + ', re-sorted',
    source: { repo: 'kubernetes/enhancements', sha: PIN_SHA, kepDocs: kepCount },
    poolSize: pool.length,
    topics: picked.map(p => p.feature),
};
fs.writeFileSync(path.join(__dirname, 'llm-plan-topics.json'), JSON.stringify(out, null, 2));
console.log(`${kepCount} KEP docs → ${pool.length} unique feature names → ${picked.length} topics → llm-plan-topics.json`);
