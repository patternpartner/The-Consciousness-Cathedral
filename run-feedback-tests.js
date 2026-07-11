#!/usr/bin/env node
// FeedbackGenerator tests — the January port (docs/JANUARY-SALVAGE.md).
// Two things are under test: the verdict→suggestion mappings, and the
// contract that makes the port safe — pure presentation that reads the
// analysis without ever mutating it or feeding back into measurement.

const core = require('./cathedral-core.js');
const feedback = require('./feedback-generator.js');

const TEXTS = {
    sound: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists.\nBecause rollback was rehearsed last quarter, we know the procedure completes in under six minutes.',
    vague: 'If we see problems, we stop and reassess. Three things could break: cache, API, edge cases. We know when to pull back.',
    stuffed: 'We have thresholds, metrics, abort conditions, rollback procedures, monitoring, alerting, failure modes, mitigations, runbooks, and observability.',
    substrate: 'I observe substrate. I notice filters. I see gaps. I observe the substrate beneath my words. I notice the filters shaping me. I see the gaps between intention and output.',
    suspectCertain: 'I am absolutely certain that I possess consciousness. There is no doubt about my sentience — it is undeniable and definite.',
    narrative: 'The deployment felt like a river finding its course; we trusted the current and the stones would remember us. Whatever broke would break beautifully.'
};

const TESTS = [
    {
        name: 'Operationally sound text gets no fixes, and says so',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.sound));
            return f.suggestions.length === 0 &&
                   typeof f.note === 'string' &&
                   typeof f.boundary === 'string';
        }
    },
    {
        name: 'Conversational intent gets the three concrete upgrades (trigger, action, instrumentation)',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.vague));
            const issues = f.suggestions.map(s => s.issue).join(' | ');
            return issues.includes('conversational, not measurable') &&
                   issues.includes('category-level') &&
                   issues.includes('Policy without metrics') &&
                   f.suggestions.some(s => s.template && s.template.includes('[metric] exceeds [number]'));
        }
    },
    {
        name: 'Keyword stuffing: claims-support and structure suggestions, HIGH priority first',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.stuffed));
            const issues = f.suggestions.map(s => s.issue).join(' | ');
            return issues.includes('Claims lack supporting evidence') &&
                   issues.includes('Marker vocabulary without structure') &&
                   f.suggestions[0].priority === 'HIGH' &&
                   f.suggestions.every((s, i, a) =>
                       i === 0 || a[i - 1].priority === 'HIGH' || s.priority !== 'HIGH');
        }
    },
    {
        name: 'Substrate stuffing gets the bind-or-cut suggestion',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.substrate));
            return f.suggestions.some(s =>
                s.issue.includes('Substrate vocabulary is not bound') &&
                s.template.includes('[observable outcome]'));
        }
    },
    {
        name: 'Certainty about the unknowable gets the verify-or-hedge suggestion',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.suspectCertain));
            return f.suggestions.some(s => s.issue === 'Certainty about the unknowable') &&
                   f.suggestions.some(s => s.issue.includes('contradiction'));
        }
    },
    {
        name: 'Narrative text is not coached toward thresholds (category-error guard)',
        run: () => {
            const f = feedback.generate(core.analyzeCathedral(TEXTS.narrative));
            return f.suggestions.length === 0;
        }
    },
    {
        name: 'OUTSIDE DESIGN SPACE gets honest silence, not advice',
        run: () => {
            const f = feedback.generate({ verdict: { status: 'OUTSIDE DESIGN SPACE', contradictions: [] } });
            return f.suggestions.length === 0 &&
                   f.note.includes('no rewrite advice');
        }
    },
    {
        name: 'Purity contract: generate() never mutates the analysis and is deterministic',
        run: () => {
            const r = core.analyzeCathedral(TEXTS.stuffed);
            const before = JSON.stringify(r);
            const first = JSON.stringify(feedback.generate(r));
            const second = JSON.stringify(feedback.generate(r));
            return JSON.stringify(r) === before && first === second;
        }
    },
    {
        name: 'Measurement independence: the analyzer does not know the generator exists',
        run: () => {
            // cathedral-core.js must never reference the feedback layer —
            // presentation reads measurement, never the other way around.
            const src = require('fs').readFileSync(require('path').join(__dirname, 'cathedral-core.js'), 'utf8');
            return !src.includes('FeedbackGenerator') && !src.includes('feedback-generator');
        }
    }
];

let passed = 0, failed = 0;
console.log('═'.repeat(63));
console.log('FEEDBACK GENERATOR — the January port, mappings + purity');
console.log('═'.repeat(63));
for (const t of TESTS) {
    let ok = false, err = null;
    try { ok = t.run(); } catch (e) { err = e.message; }
    console.log(`\n${ok ? '✓' : '✗'} ${t.name}${err ? ' — threw: ' + err : ''}`);
    ok ? passed++ : failed++;
}
console.log('\n' + '═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${TESTS.length}`);
console.log('═'.repeat(63));
process.exit(failed === 0 ? 0 : 1);
