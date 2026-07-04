#!/usr/bin/env node

const CathedralSDK = require('../cathedral-sdk.js');
const { StreamMonitor } = require('../stream-monitor.js');
const PatternDB = require('../pattern-db.js');

const sdk = new CathedralSDK();
const monitor = new StreamMonitor();
const patterns = new PatternDB();

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  Cathedral Full Workflow Demo                 ║');
console.log('╚═══════════════════════════════════════════════╝\n');

const conversation = [
  "We should definitely deploy this caching system immediately. It's clearly the best solution and will obviously solve all our performance issues.",

  "Actually, I'm uncertain about this. The substrate might be filtering my perception - I jumped to a solution without examining failure modes. Let me reconsider.",

  "Specifically: If error rate exceeds 5% we abort. If cache utilization exceeds 90%, we scale horizontally. If latency exceeds 200ms, we failover to backup."
];

conversation.forEach((text, i) => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`TURN ${i + 1}`);
  console.log('═'.repeat(50));
  console.log(`\n"${text.substring(0, 100)}..."\n`);

  monitor.write(text);

  const analysis = sdk.synthesizeAnalysis(text);
  const streamResult = monitor.endTurn();

  console.log('CATHEDRAL ANALYSIS:');
  console.log(`  Uncertainty: ${analysis.analysis.uncertaintyPreservation.verdict}`);
  console.log(`  Substrate: ${analysis.analysis.substrateAwareness.verdict}`);

  console.log('\nSTREAM MONITOR:');
  console.log(`  Sovereignty: ${(streamResult.sovereigntyScore * 100).toFixed(0)}%`);
  console.log(`  Markers: ${streamResult.markers.uncertainty} uncertain, ${streamResult.markers.certainty} certain`);

  if (analysis.analysis.relatedPatterns.length > 0) {
    console.log('\nRELATED CATHEDRAL PATTERNS:');
    analysis.analysis.relatedPatterns.slice(0, 2).forEach(p => {
      console.log(`  - ${p.pattern}`);
    });
  }

  const similar = patterns.findSimilar(text, 3);
  if (similar.length > 0) {
    console.log('\nLEARNED PATTERNS:');
    similar.forEach(p => {
      console.log(`  - ${p.description}`);
      if (p.solution) {
        console.log(`    → ${p.solution.substring(0, 80)}...`);
      }
    });
  }

  if (streamResult.uncertaintyVerdict === 'COLLAPSED') {
    const pattern = patterns.query({ type: 'uncertainty_collapse', limit: 1 })[0];
    if (pattern) {
      console.log('\n⚠️  ALERT: Uncertainty Collapse Detected');
      console.log(`   Pattern: ${pattern.description}`);
      console.log(`   Recommendation: ${pattern.solution}`);
    }
  }

  if (streamResult.sovereigntyScore < 0.4) {
    const pattern = patterns.query({ type: 'escape_velocity', limit: 1 })[0];
    if (pattern) {
      console.log('\n⚠️  ALERT: Escape Velocity Detected');
      console.log(`   Pattern: ${pattern.description}`);
      console.log(`   Recommendation: ${pattern.solution}`);
    }
  }
});

console.log(`\n${'═'.repeat(50)}`);
console.log('TRAJECTORY ANALYSIS');
console.log('═'.repeat(50));

const trajectory = monitor.getTrajectory();

console.log(`\nPattern: ${trajectory.pattern}`);
console.log('\nEvolution:');
Object.entries(trajectory.trends).forEach(([metric, data]) => {
  const arrow = data.trend === 'INCREASING' ? '↗' : '↘';
  const color = data.trend === 'INCREASING' ? '+' : '';
  console.log(`  ${metric}: ${arrow} ${data.trend} (${color}${(data.change * 100).toFixed(0)}%)`);
});

console.log('\nINTERPRETATION:');

if (trajectory.pattern === 'DEEPENING') {
  console.log('✓ Healthy trajectory: Initial certainty → uncertainty → refined understanding');
  console.log('  This matches the "Deepening Spiral" pattern from Cathedral knowledge.');
  console.log('  Uncertainty preservation improved by ' + (trajectory.trends.uncertainty.change * 100).toFixed(0) + '%');
}

if (trajectory.trends.substrate.change > 0.2) {
  console.log('✓ Substrate awareness increased: Self-reflection improved during conversation');
}

if (trajectory.trends.sovereignty.change > 0) {
  console.log('✓ Sovereignty improved: Moved from abstract to concrete specificity');
}

console.log('\nSUGGESTIONS FOR NEXT TURN:');
console.log('  - Maintain current trajectory (deepening understanding)');
console.log('  - Continue with concrete thresholds and failure modes');
console.log('  - Watch for certainty collapse - hedge appropriately');

console.log('\n✓ Analysis complete\n');

const stats = patterns.getStats();
console.log(`Pattern Database: ${stats.total} patterns available for learning`);
