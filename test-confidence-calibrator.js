#!/usr/bin/env node

// ConfidenceCalibrator Integration Test
// Tests that the calibrator correctly:
// - Records predictions and tracks calibration
// - Detects overconfidence and underconfidence
// - Provides domain-specific analysis
// - Generates actionable recommendations

const { ConfidenceCalibrator } = require('./confidence-calibrator.js');
const fs = require('fs');

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

const historyPath = './test-cc-integration-history.json';

// ============================================================
// CORE API
// ============================================================
section('CORE API');

const cal = new ConfidenceCalibrator({ historyPath });

assert(typeof cal.recordPrediction === 'function', 'recordPrediction is a function', `Type: ${typeof cal.recordPrediction}`);
assert(typeof cal.verifyPrediction === 'function', 'verifyPrediction is a function', `Type: ${typeof cal.verifyPrediction}`);
assert(typeof cal.getCalibrationScore === 'function', 'getCalibrationScore is a function', `Type: ${typeof cal.getCalibrationScore}`);
assert(typeof cal.suggestConfidenceAdjustment === 'function', 'suggestConfidenceAdjustment is a function', `Type: ${typeof cal.suggestConfidenceAdjustment}`);
assert(typeof cal.getRecommendations === 'function', 'getRecommendations is a function', `Type: ${typeof cal.getRecommendations}`);
assert(typeof cal.analyzeByDomain === 'function', 'analyzeByDomain is a function', `Type: ${typeof cal.analyzeByDomain}`);

// ============================================================
// PREDICTION RECORDING
// ============================================================
section('PREDICTION RECORDING');

const record = cal.recordPrediction({
    statement: 'The system will handle 10k requests per second',
    confidence: 0.85,
    domain: 'performance'
});

assert(record.id !== undefined, 'Record has an ID', `ID: ${record.id}`);
assert(record.confidence === 0.85, 'Confidence is stored correctly', `Confidence: ${record.confidence}`);
assert(record.domain === 'performance', 'Domain is stored correctly', `Domain: ${record.domain}`);
assert(record.verified === false, 'Record starts unverified', `Verified: ${record.verified}`);

// ============================================================
// PREDICTION VERIFICATION
// ============================================================
section('PREDICTION VERIFICATION');

const verified = cal.verifyPrediction(record.id, true);

assert(verified !== null, 'Verification returns the record', `Result: ${verified}`);
assert(verified.verified === true, 'Record is now verified', `Verified: ${verified.verified}`);
assert(verified.outcome === true, 'Outcome is recorded', `Outcome: ${verified.outcome}`);

const noMatch = cal.verifyPrediction('nonexistent_id', true);
assert(noMatch === null, 'Nonexistent ID returns null', `Result: ${noMatch}`);

// ============================================================
// CALIBRATION WITH OVERCONFIDENCE
// ============================================================
section('CALIBRATION - OVERCONFIDENCE DETECTION');

const overconfCal = new ConfidenceCalibrator({ historyPath: './test-cc-overconf.json' });

// Simulate overconfident predictions: high stated confidence, often wrong
const overconfPredictions = [
    { statement: 'Bug-free code', confidence: 0.9, domain: 'code', correct: false },
    { statement: 'Perfect security', confidence: 0.9, domain: 'security', correct: false },
    { statement: 'No latency issues', confidence: 0.85, domain: 'performance', correct: false },
    { statement: 'Tests all pass', confidence: 0.9, domain: 'code', correct: true },
    { statement: 'Deploy succeeds', confidence: 0.85, domain: 'ops', correct: false },
    { statement: 'Users will adopt', confidence: 0.8, domain: 'user', correct: true },
    { statement: 'Cache works', confidence: 0.9, domain: 'performance', correct: false },
];

// Note: recordPrediction uses Date.now() for IDs, which collides in tight loops.
// We patch IDs to be unique before verifying.
overconfPredictions.forEach((p, i) => {
    const r = overconfCal.recordPrediction({ statement: p.statement, confidence: p.confidence, domain: p.domain });
    r.id = 'overconf_' + i;
    overconfCal.verifyPrediction(r.id, p.correct);
});

const overconfScore = overconfCal.getCalibrationScore();
assert(overconfScore.score !== null, 'Calibration score is computed', `Score: ${overconfScore.score}`);
assert(overconfScore.score < 0.8, 'Overconfident predictions yield poor calibration', `Score: ${overconfScore.score}`);

const overconfRecs = overconfCal.getRecommendations();
const hasOverconfRec = overconfRecs.some(r => r.type === 'overconfidence');
assert(hasOverconfRec, 'Overconfidence recommendation is generated', `Recommendations: ${JSON.stringify(overconfRecs.map(r => r.type))}`);

// ============================================================
// CALIBRATION WITH GOOD CALIBRATION
// ============================================================
section('CALIBRATION - WELL-CALIBRATED');

const goodCal = new ConfidenceCalibrator({ historyPath: './test-cc-good.json' });

// Well-calibrated: confidence roughly matches accuracy
const goodPredictions = [
    { statement: 'High conf correct', confidence: 0.9, domain: 'code', correct: true },
    { statement: 'High conf correct 2', confidence: 0.9, domain: 'code', correct: true },
    { statement: 'Medium conf correct', confidence: 0.7, domain: 'ops', correct: true },
    { statement: 'Medium conf wrong', confidence: 0.6, domain: 'ops', correct: false },
    { statement: 'Low conf wrong', confidence: 0.3, domain: 'user', correct: false },
    { statement: 'Low conf correct', confidence: 0.4, domain: 'user', correct: true },
    { statement: 'High conf correct 3', confidence: 0.85, domain: 'code', correct: true },
];

goodPredictions.forEach((p, i) => {
    const r = goodCal.recordPrediction({ statement: p.statement, confidence: p.confidence, domain: p.domain });
    r.id = 'good_' + i;
    goodCal.verifyPrediction(r.id, p.correct);
});

const goodScore = goodCal.getCalibrationScore();
assert(goodScore.score !== null, 'Good calibration score is computed', `Score: ${goodScore.score}`);
assert(goodScore.score > overconfScore.score, 'Well-calibrated scores higher than overconfident', `Good: ${goodScore.score} vs Overconf: ${overconfScore.score}`);

// ============================================================
// DOMAIN ANALYSIS
// ============================================================
section('DOMAIN ANALYSIS');

const domains = overconfCal.analyzeByDomain();
assert(domains.length > 0, 'Domain analysis returns results', `Domains: ${domains.length}`);
assert(domains[0].domain !== undefined, 'Domain entries have domain field', `First: ${JSON.stringify(domains[0])}`);
assert(domains[0].accuracy !== undefined, 'Domain entries have accuracy', `Accuracy: ${domains[0].accuracy}`);
assert(domains[0].calibrationGap !== undefined, 'Domain entries have calibration gap', `Gap: ${domains[0].calibrationGap}`);

// ============================================================
// CONFIDENCE ADJUSTMENT SUGGESTIONS
// ============================================================
section('CONFIDENCE ADJUSTMENT');

const adjustment = overconfCal.suggestConfidenceAdjustment(0.9);
assert(adjustment.suggested !== undefined, 'Adjustment has suggested value', `Suggested: ${adjustment.suggested}`);
assert(adjustment.reason !== undefined, 'Adjustment has reason', `Reason: ${adjustment.reason}`);
// Overconfident calibrator should suggest lower confidence at 0.9
assert(adjustment.suggested <= 0.9, 'Overconfident calibrator suggests lower or equal confidence', `Suggested: ${adjustment.suggested} for raw 0.9`);

// ============================================================
// CALIBRATION CURVE
// ============================================================
section('CALIBRATION CURVE');

const curve = overconfCal.getCalibrationCurve();
assert(Array.isArray(curve), 'Calibration curve is an array', `Type: ${typeof curve}`);
const populatedBuckets = curve.filter(c => c.sampleSize > 0);
assert(populatedBuckets.length > 0, 'Curve has populated buckets', `Populated: ${populatedBuckets.length}`);
assert(populatedBuckets[0].expectedConfidence !== undefined, 'Buckets have expected confidence', `Value: ${populatedBuckets[0].expectedConfidence}`);
assert(populatedBuckets[0].actualAccuracy !== undefined, 'Buckets have actual accuracy', `Value: ${populatedBuckets[0].actualAccuracy}`);

// ============================================================
// REPORT FORMAT
// ============================================================
section('REPORT FORMAT');

const report = overconfCal.formatReport();
assert(typeof report === 'string', 'Report is a string', `Type: ${typeof report}`);
assert(report.includes('CALIBRATION'), 'Report includes calibration header', `Contains: ${report.includes('CALIBRATION')}`);
assert(report.includes('RECOMMENDATIONS') || report.includes('Predictions'), 'Report includes recommendations or predictions section', `Length: ${report.length}`);

// ============================================================
// CLEANUP
// ============================================================
[historyPath, './test-cc-overconf.json', './test-cc-good.json'].forEach(f => {
    try { fs.unlinkSync(f); } catch(e) {}
});

// ============================================================
// SUMMARY
// ============================================================
console.log('\n===================================');
console.log(`CONFIDENCE CALIBRATOR TESTS: ${passed} passed, ${failed} failed`);
console.log('===================================');

if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.test}`);
        console.log(`     ${f.detail}`);
    });
}

process.exit(failed > 0 ? 1 : 0);
