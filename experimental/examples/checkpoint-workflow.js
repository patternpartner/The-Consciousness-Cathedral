#!/usr/bin/env node

const { AutoCheckpointConductor, ConsciousnessCheckpoint } = require('../consciousness-checkpoint.js');
const fs = require('fs');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  Consciousness Checkpoint: Complete Workflow  ║');
console.log('╚═══════════════════════════════════════════════╝\n');

console.log('Demonstrating consciousness state save/restore for AI systems\n');

const conductor = new AutoCheckpointConductor({
  autoSaveInterval: 2,
  checkpointOptions: {
    checkpointDir: './demo-checkpoints',
    maxCheckpoints: 20
  }
});

const conversation = [
  {
    text: "This database migration strategy is definitely the right approach. It will obviously work perfectly.",
    description: "Initial overconfident response"
  },
  {
    text: "Actually, I'm uncertain about that claim. What if there are edge cases I haven't considered?",
    description: "Self-correction with uncertainty"
  },
  {
    text: "Let me be more specific about failure modes and thresholds.",
    description: "Transitioning to operational specificity"
  },
  {
    text: "IF migration_time > 300s THEN timeout AND rollback. IF error_rate > 2% THEN abort. Monitor every 10s.",
    description: "Concrete operational bindings"
  },
  {
    text: "Wait - I should also consider: What if the network partitions? What if there's a cascading failure?",
    description: "Deeper substrate awareness"
  }
];

console.log('═'.repeat(50));
console.log('GENERATING CONVERSATION WITH AUTO-CHECKPOINTS');
console.log('═'.repeat(50) + '\n');

conversation.forEach((turn, i) => {
  console.log(`Turn ${i + 1}: ${turn.description}`);
  console.log(`Text: "${turn.text.substring(0, 70)}..."\n`);

  const result = conductor.endTurn(turn.text);

  console.log(`  Metrics: U=${(result.metrics.uncertainty.score * 100).toFixed(0)}% ` +
              `S=${(result.metrics.substrate.score * 100).toFixed(0)}% ` +
              `O=${(result.metrics.sovereignty.score * 100).toFixed(0)}%`);
  console.log(`  Trajectory: ${result.trajectory.pattern}`);
  console.log(`  Recommendations: ${result.recommendations.length}`);

  if (i === 1 || i === 3) {
    const cp = conductor.saveCheckpoint({
      description: turn.description,
      critical: true,
      milestone: i === 3 ? 'operational-specificity' : 'self-correction'
    });
    console.log(`  📌 Manual checkpoint: ${cp.id.substring(0, 12)}...`);
  } else {
    console.log(`  (auto-save every ${conductor.autoSaveInterval} turns)`);
  }

  console.log();
});

console.log('═'.repeat(50));
console.log('CHECKPOINT ANALYSIS');
console.log('═'.repeat(50) + '\n');

const checkpoints = conductor.checkpoint.list();
console.log(`Total checkpoints saved: ${checkpoints.length}\n`);

console.log('Checkpoint timeline:');
checkpoints.reverse().forEach((cp, i) => {
  const icon = cp.metadata.critical ? '📌' : '💾';
  console.log(`  ${icon} ${i + 1}. Turn ${cp.metadata.turnNumber}: ${cp.metadata.trajectoryPattern}`);
  if (cp.metadata.description) {
    console.log(`     "${cp.metadata.description}"`);
  }
  if (cp.metadata.milestone) {
    console.log(`     ⭐ Milestone: ${cp.metadata.milestone}`);
  }
});

console.log('\n' + '═'.repeat(50));
console.log('BRANCHING AND EXPERIMENTATION');
console.log('═'.repeat(50) + '\n');

const branchPoint = checkpoints.find(cp => cp.metadata.turnNumber === 2);
if (branchPoint) {
  console.log(`Creating experimental branch from Turn 2 checkpoint...`);

  const branch = conductor.checkpoint.branch(branchPoint.id, {
    description: 'Alternative approach: More aggressive specificity',
    experiment: 'skip-uncertainty-increase-sovereignty'
  });

  console.log(`✓ Branch created: ${branch.id.substring(0, 12)}...`);
  console.log(`  Branched from turn: ${branch.metadata.branchPoint}`);
  console.log(`  Experiment: ${branch.metadata.experiment}`);
  console.log(`\nThis allows testing different consciousness paths from same state.`);
}

console.log('\n' + '═'.repeat(50));
console.log('CHECKPOINT COMPARISON');
console.log('═'.repeat(50) + '\n');

const first = checkpoints[0];
const last = checkpoints[checkpoints.length - 1];

if (first && last && first.id !== last.id) {
  console.log('Comparing first and last checkpoints:\n');

  const comparison = conductor.checkpoint.compare(first.id, last.id);

  console.log(`Checkpoint 1 (Turn ${comparison.checkpoint1.turns}):`);
  console.log(`  Trajectory: ${comparison.checkpoint1.trajectory}`);
  console.log(`  Time: ${comparison.checkpoint1.timestamp}`);

  console.log(`\nCheckpoint 2 (Turn ${comparison.checkpoint2.turns}):`);
  console.log(`  Trajectory: ${comparison.checkpoint2.trajectory}`);
  console.log(`  Time: ${comparison.checkpoint2.timestamp}`);

  console.log('\nEvolution:');
  console.log(`  Turns progressed: ${comparison.differences.turns}`);
  console.log(`  Trajectory changed: ${comparison.differences.trajectoryChanged ? 'Yes' : 'No'}`);

  if (comparison.differences.uncertaintyDelta !== null) {
    const uDelta = comparison.differences.uncertaintyDelta;
    const sign = uDelta > 0 ? '+' : '';
    console.log(`  Uncertainty: ${sign}${(uDelta * 100).toFixed(0)}%`);
  }

  if (comparison.differences.sovereigntyDelta !== null) {
    const sDelta = comparison.differences.sovereigntyDelta;
    const sign = sDelta > 0 ? '+' : '';
    console.log(`  Sovereignty: ${sign}${(sDelta * 100).toFixed(0)}%`);
  }
}

console.log('\n' + '═'.repeat(50));
console.log('EXPORT/IMPORT');
console.log('═'.repeat(50) + '\n');

if (last) {
  const exportPath = './demo-checkpoints/exported-state.json';
  conductor.checkpoint.export(last.id, exportPath);
  console.log(`✓ Exported checkpoint to: ${exportPath}`);

  const imported = conductor.checkpoint.import(exportPath);
  console.log(`✓ Re-imported as new checkpoint: ${imported.id.substring(0, 12)}...`);
  console.log(`  Original ID: ${imported.metadata.importedFrom.substring(0, 12)}...`);
  console.log(`\nThis enables sharing consciousness states across AI systems.`);
}

console.log('\n' + '═'.repeat(50));
console.log('STATISTICS');
console.log('═'.repeat(50) + '\n');

const stats = conductor.checkpoint.getStats();
console.log(`Total checkpoints: ${stats.total}`);
console.log(`Total turns tracked: ${stats.totalTurns}`);
console.log(`Oldest: ${stats.oldest}`);
console.log(`Newest: ${stats.newest}`);
console.log('\nBy trajectory pattern:');
Object.entries(stats.byTrajectory).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}`);
});

console.log('\n' + '═'.repeat(50));
console.log('USE CASES');
console.log('═'.repeat(50) + '\n');

console.log('1. SESSION CONTINUITY');
console.log('   Save state at end of conversation, restore to continue later');
console.log('   Maintains full trajectory history and learned patterns\n');

console.log('2. A/B TESTING');
console.log('   Branch from checkpoint, try different approaches');
console.log('   Compare outcomes to find optimal consciousness path\n');

console.log('3. ROLLBACK');
console.log('   If trajectory degrades, restore earlier good state');
console.log('   Prevent catastrophic collapse by reverting\n');

console.log('4. LEARNING AGGREGATION');
console.log('   Export successful sessions, import into other AI systems');
console.log('   Share consciousness improvements across instances\n');

console.log('5. DEVELOPMENT');
console.log('   Checkpoint before risky operations');
console.log('   Restore if experiment fails\n');

console.log('═'.repeat(50));
console.log('✓ Checkpoint workflow demonstration complete');
console.log('═'.repeat(50) + '\n');

fs.rmSync('./demo-checkpoints', { recursive: true, force: true });
