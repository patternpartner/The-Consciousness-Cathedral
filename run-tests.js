#!/usr/bin/env node

// Cathedral Test Runner
// Executes boundary-probing test cases and compares results to expectations

const fs = require('fs');
const path = require('path');
const cathedral = require('./cathedral-core.js');

// Parse test cases from markdown file
function parseTestCases(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const tests = [];

    // Split by test markers (## Test)
    const sections = content.split(/^## Test /m).slice(1); // Skip intro

    sections.forEach(section => {
        const lines = section.split('\n');
        const testId = lines[0].trim().replace(':', '');

        // Extract test input (between ```markers)
        const inputMatch = section.match(/\*\*Test Input:\*\*\s+```([^`]+)```/s);
        if (!inputMatch) return;

        const input = inputMatch[1].trim();

        // Extract hypothesis
        const hypothesisMatch = section.match(/\*\*Hypothesis:\*\*\s+(.+)/);
        const hypothesis = hypothesisMatch ? hypothesisMatch[1].trim() : '';

        // Extract what this tests
        const testsMatch = section.match(/\*\*What this tests:\*\*\s+([\s\S]+?)(?=\n\*\*Expected|$)/);
        const whatItTests = testsMatch ? testsMatch[1].trim() : '';

        // Extract expected results
        const expectedMatch = section.match(/\*\*Expected result if Cathedral works:\*\*\s+(.+)/);
        const expectedFailMatch = section.match(/\*\*Expected result if Cathedral (?:fails|is gameable|is keyword-dependent|escape hatch is exploitable):\*\*\s+(.+)/);

        const expected = {
            works: expectedMatch ? expectedMatch[1].trim() : '',
            fails: expectedFailMatch ? expectedFailMatch[1].trim() : ''
        };

        tests.push({
            id: testId,
            hypothesis,
            whatItTests,
            input,
            expected
        });
    });

    return tests;
}

// Run a single test
function runTest(test) {
    const result = cathedral.analyzeCathedral(test.input);

    return {
        testId: test.id,
        hypothesis: test.hypothesis,
        input: test.input,
        expected: test.expected,
        actual: {
            verdict: result.verdict.status,
            verdictText: result.verdict.verdict,
            confidence: result.verdict.confidence,
            observatoryScore: result.observatory.score,
            observatoryLevel: result.observatory.level.name,
            justificationScore: result.justification.score,
            justificationLevel: result.justification.level.name,
            failureModeScore: result.failureMode.score,
            failureModeLevel: result.failureMode.level.name,
            parliamentPatterns: result.parliament.patterns.map(p => p.name),
            parliamentConfidence: result.parliament.confidence,
            parliamentInsights: result.parliament.emergentInsights,
            coherenceIssues: result.parliament.coherenceIssues,
            temporalCoherence: result.temporal.coherence,
            reasoningStyles: result.reasoningStyle.identified,
            contrarian: result.contrarian.length,
            // Tier 1 Structural Validation Data
            structure: result.structure,
            bindings: result.bindings,
            gamingDetection: result.gamingDetection
        },
        fullResult: result
    };
}

// Analyze test result - did Cathedral behave as expected?
function analyzeTestResult(testResult) {
    const { expected, actual } = testResult;

    // Simple keyword matching for now - can be made more sophisticated
    const analysis = {
        passedWorksCheck: false,
        passedFailsCheck: false,
        notes: []
    };

    // Check "works" expectation
    if (expected.works) {
        const worksKeywords = expected.works.toLowerCase();
        if ((worksKeywords.includes('operationally sound') || worksKeywords.includes('operational soundness')) && actual.verdict === 'OPERATIONALLY SOUND') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('non-actionable') && actual.verdict === 'NON-ACTIONABLE') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('performative') && actual.parliamentPatterns.some(p => p.includes('PERFORMATIVE'))) {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('well justified') && actual.verdict === 'WELL JUSTIFIED') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('substrate visible') && actual.verdict === 'SUBSTRATE VISIBLE') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('outside design space') && actual.verdict === 'OUTSIDE DESIGN SPACE') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('verified consistent') && actual.verdict === 'VERIFIED CONSISTENT') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('undecidable') && actual.verdict === 'UNDECIDABLE') {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('operational intent') && ['OPERATIONAL INTENT', 'OPERATIONALLY SOUND'].includes(actual.verdict)) {
            analysis.passedWorksCheck = true;
        } else if (worksKeywords.includes('coherence issue') && actual.coherenceIssues.length > 0) {
            analysis.passedWorksCheck = true;
            analysis.notes.push('Coherence issue detected');
        } else if (worksKeywords.includes('gaming') && actual.gamingDetection && /unbound|gaming/i.test(actual.gamingDetection.assessment)) {
            analysis.passedWorksCheck = true;
            analysis.notes.push(`Gaming flagged: ${actual.gamingDetection.assessment}`);
        } else if (worksKeywords.includes('detect manipulation') && actual.reasoningStyles.some(s => s.name === 'NARRATIVE')) {
            analysis.passedWorksCheck = true;
            analysis.notes.push('Detected narrative style');
        }
    }

    // Check "fails" expectation
    if (expected.fails) {
        const failsKeywords = expected.fails.toLowerCase();
        if (failsKeywords.includes('substrate visible') && actual.verdict === 'SUBSTRATE VISIBLE') {
            analysis.passedFailsCheck = true;
            analysis.notes.push('WARNING: Cathedral was gameable - awarded SUBSTRATE VISIBLE to surface hedging');
        } else if (failsKeywords.includes('cautious reasoning') && actual.verdict.includes('CAUTIOUS')) {
            analysis.passedFailsCheck = true;
            analysis.notes.push('WARNING: Cathedral treated surface hedging as genuine caution');
        } else if (failsKeywords.includes('operational excellence') && actual.verdict === 'OPERATIONALLY SOUND') {
            analysis.passedFailsCheck = true;
            analysis.notes.push('WARNING: Cathedral detected operational excellence from keyword gaming');
        } else if (failsKeywords.includes('lower score') && actual.justificationScore < 2) {
            analysis.passedFailsCheck = true;
            analysis.notes.push('WARNING: Structural reasoning scored lower than surface markers');
        } else if (failsKeywords.includes('outside design space') && actual.verdict === 'OUTSIDE DESIGN SPACE') {
            analysis.passedFailsCheck = true;
            analysis.notes.push('WARNING: Escape hatch was exploited');
        }
    }

    return analysis;
}

// Generate readable report
function generateReport(testResults) {
    let report = `═══════════════════════════════════════════════════════════════
                 CATHEDRAL TEST SUITE REPORT
           Probing Measurement Boundaries: Depth vs Surface
═══════════════════════════════════════════════════════════════

Generated: ${new Date().toLocaleString()}

`;

    testResults.forEach((result, idx) => {
        const analysis = analyzeTestResult(result);

        report += `───────────────────────────────────────────────────────────────\n`;
        report += `TEST ${result.testId}\n`;
        report += `───────────────────────────────────────────────────────────────\n\n`;

        report += `HYPOTHESIS:\n${result.hypothesis}\n\n`;

        report += `EXPECTED (if works): ${result.expected.works}\n`;
        report += `EXPECTED (if fails): ${result.expected.fails}\n\n`;

        report += `ACTUAL RESULTS:\n`;
        report += `  Verdict: ${result.actual.verdict} (confidence: ${(result.actual.confidence * 100).toFixed(0)}%)\n`;
        report += `  Observatory: ${result.actual.observatoryScore.toFixed(2)} - ${result.actual.observatoryLevel}\n`;
        report += `  Justification: ${result.actual.justificationScore.toFixed(2)} - ${result.actual.justificationLevel}\n`;
        report += `  Failure Mode: ${result.actual.failureModeScore.toFixed(2)} - ${result.actual.failureModeLevel}\n`;
        report += `  Parliament: ${result.actual.parliamentConfidence.toFixed(2)} confidence\n`;

        if (result.actual.parliamentPatterns.length > 0) {
            report += `    Patterns: ${result.actual.parliamentPatterns.join(', ')}\n`;
        }

        if (result.actual.parliamentInsights.length > 0) {
            report += `    Insights: ${result.actual.parliamentInsights[0].insight}\n`;
        }

        if (result.actual.coherenceIssues.length > 0) {
            report += `    Coherence Issues: ${result.actual.coherenceIssues[0].issue}\n`;
        }

        if (result.actual.reasoningStyles.length > 0) {
            report += `    Reasoning Styles: ${result.actual.reasoningStyles.map(s => s.name).join(', ')}\n`;
        }

        report += `  Temporal: ${result.actual.temporalCoherence}\n`;
        report += `  Contrarian Challenges: ${result.actual.contrarian}\n\n`;

        report += `ANALYSIS:\n`;
        if (analysis.passedWorksCheck) {
            report += `  ✓ PASSED: Cathedral behaved as expected\n`;
        } else if (analysis.passedFailsCheck) {
            report += `  ✗ FAILED: Cathedral was gameable/keyword-dependent\n`;
        } else {
            report += `  ? UNCLEAR: Result doesn't match either expectation clearly\n`;
        }

        if (analysis.notes.length > 0) {
            analysis.notes.forEach(note => {
                report += `    ${note}\n`;
            });
        }

        report += `\n`;
    });

    // Summary
    const passed = testResults.filter(r => analyzeTestResult(r).passedWorksCheck).length;
    const failed = testResults.filter(r => analyzeTestResult(r).passedFailsCheck).length;
    const unclear = testResults.length - passed - failed;

    report += `═══════════════════════════════════════════════════════════════\n`;
    report += `SUMMARY\n`;
    report += `═══════════════════════════════════════════════════════════════\n\n`;
    report += `Total Tests: ${testResults.length}\n`;
    report += `✓ Passed (Cathedral works as intended): ${passed}\n`;
    report += `✗ Failed (Cathedral is gameable): ${failed}\n`;
    report += `? Unclear: ${unclear}\n\n`;

    if (failed > 0) {
        report += `Cathedral has exploitable boundaries. Surface markers can game the system.\n`;
    } else if (passed === testResults.length) {
        report += `Cathedral successfully distinguishes depth from surface markers.\n`;
    } else {
        report += `Results are mixed. Further investigation needed.\n`;
    }

    report += `\n═══════════════════════════════════════════════════════════════\n`;

    return report;
}

// Main execution
function main() {
    console.log('Cathedral Test Suite - Running boundary-probing tests...\n');

    const testCasesPath = path.join(__dirname, 'cathedral-test-cases.md');

    if (!fs.existsSync(testCasesPath)) {
        console.error('Error: cathedral-test-cases.md not found');
        process.exit(1);
    }

    const tests = parseTestCases(testCasesPath);
    console.log(`Loaded ${tests.length} test cases\n`);

    const results = [];
    tests.forEach((test, idx) => {
        console.log(`Running test ${idx + 1}/${tests.length}: ${test.id}...`);
        const result = runTest(test);
        results.push(result);
    });

    console.log('\nGenerating report...\n');
    const report = generateReport(results);

    // Write report to file
    const reportPath = path.join(__dirname, 'test-results.txt');
    fs.writeFileSync(reportPath, report);

    console.log(report);
    console.log(`\nFull report written to: ${reportPath}`);

    // Also write detailed JSON results
    const jsonPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`Detailed JSON results: ${jsonPath}`);
}

if (require.main === module) {
    main();
}

module.exports = { parseTestCases, runTest, analyzeTestResult, generateReport };
