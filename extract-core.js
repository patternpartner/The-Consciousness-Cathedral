#!/usr/bin/env node
// Extract Cathedral engines from HTML to Node.js module

const fs = require('fs');

const html = fs.readFileSync('cathedral-unified.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error('No script found in HTML');
  process.exit(1);
}

const script = scriptMatch[1];

// Build the Node.js module
let output = `// Cathedral v2.x with Tier 1 Structural Validation
// Automatically extracted from cathedral-unified.html
// Generated: ${new Date().toISOString()}

`;

// Extract each engine using regex patterns
const extractEngine = (name, pattern) => {
  const match = script.match(pattern);
  if (match) {
    output += match[0] + '\n\n';
    return true;
  }
  return false;
};

// Extract in order
console.log('Extracting engines...');

extractEngine('TextCleaner', /const TextCleaner = \{[\s\S]*?\n        \};/);
extractEngine('StructuralExtractor', /const StructuralExtractor = \{[\s\S]*?\n        \};/);
extractEngine('BindingValidator', /const BindingValidator = \{[\s\S]*?\n        \};/);
extractEngine('GamingDetector', /const GamingDetector = \{[\s\S]*?\n        \};/);
extractEngine('Observatory', /const Observatory = \{[\s\S]*?\n        \};/);
extractEngine('Contrarian', /const Contrarian = \{[\s\S]*?\n        \};/);
extractEngine('JustificationEngine', /const JustificationEngine = \{[\s\S]*?\n        \};/);
extractEngine('FailureModeEngine', /const FailureModeEngine = \{[\s\S]*?\n        \};/);
extractEngine('TemporalEngine', /const TemporalEngine = \{[\s\S]*?\n        \};/);
extractEngine('ReasoningStyleClassifier', /const ReasoningStyleClassifier = \{[\s\S]*?\n        \};/);
extractEngine('Parliament', /const Parliament = \{[\s\S]*?\n        \};/);

// Extract synthesizeVerdict function
const verdictMatch = script.match(/function synthesizeVerdict\([\s\S]*?\n        \}/);
if (verdictMatch) {
  output += verdictMatch[0] + '\n\n';
}

// Add wrapper function
output += `// Main analysis function
function analyzeCathedral(text) {
    // TIER 1: Structural Extraction
    const structure = StructuralExtractor.extract(text);
    const bindings = BindingValidator.validate(structure);
    const gamingDetection = GamingDetector.detect(text, structure);
    GamingDetector.calculateGamingLikelihood(gamingDetection);

    // TIER 2: Signal Analysis
    const observatoryResult = Observatory.score(text);
    const contrarianChallenges = Contrarian.analyze(text);
    const justificationResult = JustificationEngine.analyze(text);
    const failureModeResult = FailureModeEngine.analyze(text);
    const temporalResult = TemporalEngine.analyze(text);
    const reasoningStyleResult = ReasoningStyleClassifier.classify(text);

    // TIER 3: Synthesis
    const parliamentSynthesis = Parliament.deliberate(text, observatoryResult, contrarianChallenges, justificationResult, failureModeResult, structure, bindings, gamingDetection);
    const verdict = synthesizeVerdict(observatoryResult, contrarianChallenges, parliamentSynthesis, justificationResult, failureModeResult, temporalResult, reasoningStyleResult, gamingDetection);

    return {
        text,
        structure,
        bindings,
        gamingDetection,
        observatory: observatoryResult,
        contrarian: contrarianChallenges,
        justification: justificationResult,
        failureMode: failureModeResult,
        temporal: temporalResult,
        reasoningStyle: reasoningStyleResult,
        parliament: parliamentSynthesis,
        verdict
    };
}

module.exports = {
    analyzeCathedral,
    TextCleaner,
    StructuralExtractor,
    BindingValidator,
    GamingDetector,
    Observatory,
    Contrarian,
    JustificationEngine,
    FailureModeEngine,
    TemporalEngine,
    ReasoningStyleClassifier,
    Parliament,
    synthesizeVerdict
};
`;

fs.writeFileSync('cathedral-core.js', output);
console.log(`✓ Generated cathedral-core.js (${output.length} bytes)`);
console.log('✓ Included Tier 1 structural validation engines');
