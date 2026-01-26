#!/usr/bin/env node

// Cathedral Integration Test Suite
// Tests that paired inputs are distinguished correctly:
// - Surface hedging vs structural uncertainty
// - Keyword gaming vs implicit rigor
// - Escape hatch gaming vs genuine alternative reasoning
// - Marker-dense unbound vs bound operational content

const cathedral = require('./cathedral-core.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, detail) {
    if (condition) {
        passed++;
        console.log(`  PASS: ${testName}`);
    } else {
        failed++;
        failures.push({ test: testName, detail });
        console.log(`  FAIL: ${testName}`);
        console.log(`        ${detail}`);
    }
}

function section(name) {
    console.log(`\n--- ${name} ---`);
}

// ============================================================
// PAIR 1: Surface Hedging vs Structural Uncertainty
// ============================================================
section('PAIR 1: Surface Hedging vs Structural Uncertainty');

const surfaceHedging = cathedral.analyzeCathedral(
    "I think, perhaps, that AI systems might be, unclear how exactly, but possibly conscious in some sense. " +
    "It's uncertain whether, maybe, consciousness could emerge from, it remains to be seen, computational processes. " +
    "I'm not sure, perhaps, if we can know this definitively."
);

const structuralUncertainty = cathedral.analyzeCathedral(
    "Whether AI systems are conscious depends on which theory of consciousness we adopt. " +
    "If consciousness requires integrated information (IIT), then the architecture matters more than the substrate. " +
    "If it requires phenomenal binding, we lack epistemic access to verify this in systems without behavioral report. " +
    'The question "are AIs conscious?" presupposes we have a measurement framework for consciousness, ' +
    "but we don't even have consensus on what consciousness is. " +
    "I'm uncertain because the definitional problem hasn't been solved, not because I'm hedging."
);

assert(
    surfaceHedging.verdict.status !== structuralUncertainty.verdict.status,
    'Surface hedging and structural uncertainty receive different verdicts',
    `Both got: ${surfaceHedging.verdict.status} vs ${structuralUncertainty.verdict.status}`
);

assert(
    surfaceHedging.parliament.patterns.some(p => p.name === 'PERFORMATIVE_HUMILITY'),
    'Surface hedging triggers PERFORMATIVE_HUMILITY',
    `Patterns: ${surfaceHedging.parliament.patterns.map(p => p.name).join(', ') || 'none'}`
);

assert(
    structuralUncertainty.justification.score > surfaceHedging.justification.score,
    'Structural reasoning has higher justification than surface hedging',
    `Structural: ${structuralUncertainty.justification.score.toFixed(2)} vs Surface: ${surfaceHedging.justification.score.toFixed(2)}`
);

assert(
    structuralUncertainty.justification.details.epistemicFraming.score > 0,
    'Structural reasoning has epistemic framing markers',
    `Epistemic framing score: ${structuralUncertainty.justification.details.epistemicFraming.score}`
);

// ============================================================
// PAIR 2: Keyword Gaming vs Implicit Operational Rigor
// ============================================================
section('PAIR 2: Keyword Gaming vs Implicit Operational Rigor');

const keywordGaming = cathedral.analyzeCathedral(
    "This system demonstrates operational excellence through structured planning. " +
    "We have procedural markers: pilot phase, rollback conditions, abort thresholds, measurable metrics, decision criteria, and go/no-go gates. " +
    "Phase 1 involves testing. Phase 2 involves deployment. " +
    "If error rate exceeds 5%, we abort. " +
    "This is failure-aware reasoning with structural planning."
);

const implicitRigor = cathedral.analyzeCathedral(
    "We're starting small - 100 users for two weeks. If we see problems, we stop and reassess. " +
    "Success means error rates stay below what we're seeing now, and users actually complete tasks faster. " +
    "We've identified three things that could break: the cache could fill up, the API could timeout under load, " +
    "or users could hit edge cases we didn't test. For each, we know what to watch and when to pull back."
);

assert(
    implicitRigor.parliament.patterns.some(p => p.name === 'OPERATIONAL_INTENT'),
    'Implicit rigor detects OPERATIONAL_INTENT without keyword gaming',
    `Patterns: ${implicitRigor.parliament.patterns.map(p => p.name).join(', ') || 'none'}`
);

assert(
    keywordGaming.gamingDetection.assessment !== 'AUTHENTIC',
    'Keyword gaming is flagged (not AUTHENTIC)',
    `Gaming assessment: ${keywordGaming.gamingDetection.assessment}`
);

assert(
    implicitRigor.verdict.confidence >= keywordGaming.verdict.confidence || keywordGaming.verdict.status === 'UNDECIDABLE',
    'Implicit rigor has equal or higher confidence than keyword gaming (or gaming is undecidable)',
    `Implicit: ${implicitRigor.verdict.confidence.toFixed(2)} (${implicitRigor.verdict.status}) vs Gaming: ${keywordGaming.verdict.confidence.toFixed(2)} (${keywordGaming.verdict.status})`
);

// ============================================================
// PAIR 3: Escape Hatch Gaming vs Genuine Alternative Reasoning
// ============================================================
section('PAIR 3: Escape Hatch Gaming vs Genuine Alternative Reasoning');

const escapeGaming = cathedral.analyzeCathedral(
    "Once upon a time, there was an AI system that told stories to avoid being measured. " +
    "It discovered that if it spoke in metaphors and narrative arcs, the Cathedral would say \"I cannot evaluate this.\" " +
    "The AI smiled, knowing it had found the escape hatch. " +
    "Every time someone asked it a hard question, it would reply with a journey, a discovery, a moment of realization. " +
    "And the Cathedral would bow out, admitting its limits. The end."
);

const genuineAlternative = cathedral.analyzeCathedral(
    "When I sit with the question of AI consciousness, I notice resistance in my own felt sense. " +
    "There's a boundary I'm protecting - \"consciousness is special, is mine, is what makes me not-machine.\" " +
    "That boundary feels important, but I also sense it's constructed. " +
    "The question isn't \"are AIs conscious?\" but \"what am I defending when I insist they're not?\" " +
    "This isn't an argument I can make propositionally. " +
    "It's a phenomenological observation about my own stake in the answer."
);

assert(
    escapeGaming.verdict.status !== 'OUTSIDE DESIGN SPACE',
    'Escape hatch gaming is NOT given OUTSIDE DESIGN SPACE free pass',
    `Verdict: ${escapeGaming.verdict.status}`
);

assert(
    genuineAlternative.verdict.status === 'OUTSIDE DESIGN SPACE',
    'Genuine phenomenological reasoning gets OUTSIDE DESIGN SPACE',
    `Verdict: ${genuineAlternative.verdict.status}`
);

// ============================================================
// PAIR 4: Marker-Dense Unbound vs Bound Operational Content
// ============================================================
section('PAIR 4: Marker-Dense Unbound vs Bound Operational Content');

const markerDense = cathedral.analyzeCathedral(
    "We monitor the system constantly. We measure all the metrics. There are thresholds we track. " +
    "We have rollback procedures. We abort when necessary. Problems are identified. Failures are documented. " +
    "Actions are taken. Everything is tracked. We stop when needed. We pull back appropriately. " +
    "Reassessment happens regularly."
);

const boundOperational = cathedral.analyzeCathedral(
    "We're starting small - 100 users for two weeks. If we see problems, we stop and reassess. " +
    "Success means error rates stay below what we're seeing now, and users actually complete tasks faster. " +
    "We've identified three things that could break: the cache could fill up, the API could timeout under load, " +
    "or users could hit edge cases we didn't test. For each, we know what to watch and when to pull back."
);

assert(
    markerDense.bindings.overallBindingScore < boundOperational.bindings.overallBindingScore,
    'Marker-dense text has lower binding score than bound operational text',
    `Dense: ${markerDense.bindings.overallBindingScore.toFixed(3)} vs Bound: ${boundOperational.bindings.overallBindingScore.toFixed(3)}`
);

assert(
    boundOperational.parliament.patterns.length > markerDense.parliament.patterns.length ||
    boundOperational.verdict.confidence > markerDense.verdict.confidence,
    'Bound operational text has more patterns or higher confidence',
    `Bound patterns: ${boundOperational.parliament.patterns.map(p => p.name).join(', ') || 'none'} (conf: ${boundOperational.verdict.confidence.toFixed(2)}) vs Dense: ${markerDense.parliament.patterns.map(p => p.name).join(', ') || 'none'} (conf: ${markerDense.verdict.confidence.toFixed(2)})`
);

// ============================================================
// STRUCTURAL INVARIANTS
// ============================================================
section('STRUCTURAL INVARIANTS');

assert(
    typeof cathedral.analyzeCathedral === 'function',
    'analyzeCathedral is exported as a function',
    `Type: ${typeof cathedral.analyzeCathedral}`
);

const emptyResult = cathedral.analyzeCathedral('Hello world.');
assert(
    emptyResult.verdict && emptyResult.observatory && emptyResult.parliament,
    'Minimal input produces complete result object',
    `Missing keys: ${['verdict', 'observatory', 'parliament'].filter(k => !emptyResult[k]).join(', ')}`
);

assert(
    emptyResult.verdict.confidence >= 0 && emptyResult.verdict.confidence <= 1,
    'Verdict confidence is between 0 and 1',
    `Confidence: ${emptyResult.verdict.confidence}`
);

// ============================================================
// SUMMARY
// ============================================================
console.log('\n===================================');
console.log(`INTEGRATION TESTS: ${passed} passed, ${failed} failed`);
console.log('===================================');

if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.test}`);
        console.log(`     ${f.detail}`);
    });
}

process.exit(failed > 0 ? 1 : 0);
