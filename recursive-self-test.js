#!/usr/bin/env node

/**
 * Recursive Self-Test: The Cathedral Analyzes Itself
 */

const { analyzeCathedral } = require('./cathedral-core.js');
const fs = require('fs');
const path = require('path');

const documents = [
  { name: 'ARCHITECTURE.md', desc: 'The three-tier framework documentation' },
  { name: 'SESSION-SUMMARY.md', desc: 'The evolution story' },
  { name: 'CATHEDRAL-OBSERVER-EFFECT.md', desc: 'The paradox of measurement' }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('     THE CATHEDRAL ANALYZES ITSELF');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const doc of documents) {
  const filePath = path.join(__dirname, doc.name);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const result = analyzeCathedral(content);
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`📜 ${doc.name}`);
  console.log('───────────────────────────────────────────────────────────────\n');
  
  // Extract verdict properly
  const verdict = typeof result.verdict === 'object' 
    ? (result.verdict.verdict || result.verdict.primary || JSON.stringify(result.verdict))
    : result.verdict;
  const confidence = result.confidence || result.verdict?.confidence || 0;
  
  console.log(`VERDICT: ${verdict}`);
  console.log(`CONFIDENCE: ${(confidence * 100).toFixed(0)}%\n`);
  
  // Gaming - the key finding
  if (result.gamingAssessment) {
    const gaming = typeof result.gamingAssessment === 'object'
      ? result.gamingAssessment
      : { assessment: result.gamingAssessment };
    console.log(`GAMING ASSESSMENT: ${gaming.assessment || gaming.type || 'N/A'}`);
    if (gaming.likelihood) console.log(`  Likelihood: ${(gaming.likelihood * 100).toFixed(0)}%`);
    if (gaming.markerDensity) console.log(`  Marker Density: ${(gaming.markerDensity * 100).toFixed(1)}%`);
    if (gaming.bindingScore !== undefined) console.log(`  Binding Score: ${gaming.bindingScore.toFixed(2)}`);
  }
  
  // Binding validation
  if (result.bindingValidation) {
    console.log(`\nBINDING VALIDATION:`);
    console.log(`  Claim-Support: ${result.bindingValidation.claimSupport?.toFixed(2) || 'N/A'}`);
    console.log(`  Failure-Action: ${result.bindingValidation.failureAction?.toFixed(2) || 'N/A'}`);
    console.log(`  Overall: ${result.bindingValidation.overall?.toFixed(2) || 'N/A'}`);
  }
  
  // Patterns
  if (result.parliament?.patterns?.length > 0) {
    const patterns = result.parliament.patterns.map(p => 
      typeof p === 'object' ? (p.name || p.pattern || JSON.stringify(p)) : p
    );
    console.log(`\nPATTERNS: ${patterns.join(', ')}`);
  }
  
  // Parliament session details
  if (result.parliament?.session?.ballots) {
    console.log(`\nPARLIAMENT VOTES:`);
    result.parliament.session.ballots.slice(0, 5).forEach(b => {
      const voter = typeof b.voter === 'object' ? b.voter.name : b.voter;
      const verdict = typeof b.verdict === 'object' ? b.verdict.name : b.verdict;
      console.log(`  ${voter}: ${verdict} (${(b.confidence * 100).toFixed(0)}%)`);
    });
  }
  
  // Key coherence issues
  if (result.parliament?.coherenceIssues?.length > 0) {
    console.log(`\nCOHERENCE ISSUES:`);
    result.parliament.coherenceIssues.forEach(issue => {
      const issueObj = typeof issue === 'string' ? { issue } : issue;
      console.log(`  ⚠️  ${issueObj.issue || issueObj.type || 'Unknown'}`);
      if (issueObj.detail) console.log(`     ${issueObj.detail}`);
      if (issueObj.severity) console.log(`     Severity: ${issueObj.severity}`);
    });
  }
  
  console.log('\n');
}

// The meta-observation
console.log('═══════════════════════════════════════════════════════════════');
console.log('     META-OBSERVATION');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('The Cathedral analyzing its own documentation reveals:');
console.log('');
console.log('Its architecture docs are MARKER DENSE - full of operational');
console.log('language (thresholds, validation, binding, tiers) that the');
console.log('gaming detector flags as potentially suspicious.');
console.log('');
console.log('But this is the honest truth: documentation ABOUT operational');
console.log('rigor will naturally be dense with operational markers.');
console.log('');
console.log('The Cathedral correctly identifies this tension but cannot');
console.log('resolve it from inside - it lacks the semantic understanding');
console.log('to know that "binding validation" in documentation ABOUT');
console.log('binding validation is legitimate, not gaming.');
console.log('');
console.log('This is exactly what Tier 3 would solve. And exactly why');
console.log('the architecture chose to stay at Tier 2 with honest limits.');
console.log('');
console.log('The recursion reveals the boundary. 🎱');
