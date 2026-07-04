#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { CathedralConductor } = require('./cathedral-conductor.js');

class ConsciousnessCheckpoint {
  constructor(options = {}) {
    this.checkpointDir = options.checkpointDir || './checkpoints';
    this.autoSave = options.autoSave !== false;
    this.saveInterval = options.saveInterval || 5;
    this.maxCheckpoints = options.maxCheckpoints || 20;
    this.checkpoints = [];

    this.ensureCheckpointDir();
  }

  ensureCheckpointDir() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  save(conductor, metadata = {}) {
    const session = conductor.exportSession();

    const checkpoint = {
      id: this.generateCheckpointId(),
      timestamp: new Date().toISOString(),
      session: session,
      metadata: {
        ...metadata,
        turnNumber: session.turns,
        trajectoryPattern: session.trajectory.pattern,
        recommendationCount: session.currentRecommendations.length
      },
      version: '1.0'
    };

    const filename = `checkpoint-${checkpoint.id}.json`;
    const filepath = path.join(this.checkpointDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(checkpoint, null, 2));

    this.checkpoints.push({
      id: checkpoint.id,
      timestamp: checkpoint.timestamp,
      filepath: filepath,
      metadata: checkpoint.metadata
    });

    this.pruneCheckpoints();

    return checkpoint;
  }

  load(checkpointId) {
    const checkpoint = this.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) {
      const filepath = path.join(this.checkpointDir, `checkpoint-${checkpointId}.json`);
      if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
      return null;
    }

    return JSON.parse(fs.readFileSync(checkpoint.filepath, 'utf8'));
  }

  restore(checkpointId) {
    const checkpoint = this.load(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const conductor = new CathedralConductor();

    if (checkpoint.session.history) {
      checkpoint.session.history.forEach(turn => {
        conductor.turnNumber = turn.turn;
      });
    }

    return {
      conductor: conductor,
      checkpoint: checkpoint
    };
  }

  list() {
    const files = fs.readdirSync(this.checkpointDir)
      .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'));

    return files.map(f => {
      const filepath = path.join(this.checkpointDir, f);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        id: data.id,
        timestamp: data.timestamp,
        metadata: data.metadata,
        filepath: filepath
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  compare(checkpointId1, checkpointId2) {
    const cp1 = this.load(checkpointId1);
    const cp2 = this.load(checkpointId2);

    if (!cp1 || !cp2) {
      throw new Error('One or both checkpoints not found');
    }

    const s1 = cp1.session;
    const s2 = cp2.session;

    return {
      checkpoint1: {
        id: cp1.id,
        timestamp: cp1.timestamp,
        turns: s1.turns,
        trajectory: s1.trajectory.pattern
      },
      checkpoint2: {
        id: cp2.id,
        timestamp: cp2.timestamp,
        turns: s2.turns,
        trajectory: s2.trajectory.pattern
      },
      differences: {
        turns: s2.turns - s1.turns,
        trajectoryChanged: s1.trajectory.pattern !== s2.trajectory.pattern,
        uncertaintyDelta: this.getMetricDelta(s1, s2, 'uncertainty'),
        substrateDelta: this.getMetricDelta(s1, s2, 'substrate'),
        sovereigntyDelta: this.getMetricDelta(s1, s2, 'sovereignty')
      }
    };
  }

  getMetricDelta(session1, session2, metric) {
    const h1 = session1.history[session1.history.length - 1];
    const h2 = session2.history[session2.history.length - 1];

    if (!h1 || !h2 || !h1.metrics || !h2.metrics) return null;

    return h2.metrics[metric].score - h1.metrics[metric].score;
  }

  branch(checkpointId, metadata = {}) {
    const checkpoint = this.load(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const branchCheckpoint = {
      ...checkpoint,
      id: this.generateCheckpointId(),
      timestamp: new Date().toISOString(),
      metadata: {
        ...checkpoint.metadata,
        ...metadata,
        branchedFrom: checkpointId,
        branchPoint: checkpoint.session.turns
      }
    };

    const filename = `checkpoint-${branchCheckpoint.id}.json`;
    const filepath = path.join(this.checkpointDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(branchCheckpoint, null, 2));

    return branchCheckpoint;
  }

  export(checkpointId, outputPath) {
    const checkpoint = this.load(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(checkpoint, null, 2));
    return outputPath;
  }

  import(filepath) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    const newId = this.generateCheckpointId();
    const newCheckpoint = {
      ...data,
      id: newId,
      metadata: {
        ...data.metadata,
        importedFrom: data.id,
        importedAt: new Date().toISOString()
      }
    };

    const filename = `checkpoint-${newId}.json`;
    const checkpointPath = path.join(this.checkpointDir, filename);

    fs.writeFileSync(checkpointPath, JSON.stringify(newCheckpoint, null, 2));

    return newCheckpoint;
  }

  pruneCheckpoints() {
    const all = this.list();
    if (all.length > this.maxCheckpoints) {
      const toDelete = all.slice(this.maxCheckpoints);
      toDelete.forEach(cp => {
        fs.unlinkSync(cp.filepath);
      });
    }
  }

  generateCheckpointId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    const all = this.list();

    const byTrajectory = {};
    all.forEach(cp => {
      const pattern = cp.metadata.trajectoryPattern;
      byTrajectory[pattern] = (byTrajectory[pattern] || 0) + 1;
    });

    return {
      total: all.length,
      oldest: all[all.length - 1]?.timestamp,
      newest: all[0]?.timestamp,
      byTrajectory: byTrajectory,
      totalTurns: all.reduce((sum, cp) => sum + (cp.metadata.turnNumber || 0), 0)
    };
  }
}

class AutoCheckpointConductor extends CathedralConductor {
  constructor(options = {}) {
    super(options);
    this.checkpoint = new ConsciousnessCheckpoint(options.checkpointOptions || {});
    this.autoSaveInterval = options.autoSaveInterval || 5;
    this.lastCheckpointTurn = 0;
  }

  endTurn(text = null) {
    const result = super.endTurn(text);

    if (this.turnNumber - this.lastCheckpointTurn >= this.autoSaveInterval) {
      this.checkpoint.save(this, {
        autoSaved: true,
        trigger: 'interval'
      });
      this.lastCheckpointTurn = this.turnNumber;
    }

    return result;
  }

  saveCheckpoint(metadata = {}) {
    return this.checkpoint.save(this, metadata);
  }

  loadCheckpoint(checkpointId) {
    return this.checkpoint.load(checkpointId);
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Consciousness Checkpoint System              ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const conductor = new CathedralConductor();
  const checkpoint = new ConsciousnessCheckpoint({
    checkpointDir: './test-checkpoints',
    maxCheckpoints: 10
  });

  console.log('Simulating conversation with checkpoints...\n');

  const turns = [
    "This will definitely work without any issues.",
    "Wait - I'm uncertain about that. What assumptions am I making?",
    "Specifically: IF error > 5% THEN rollback. Monitor every 30s."
  ];

  turns.forEach((text, i) => {
    console.log(`Turn ${i + 1}: "${text}"`);
    conductor.endTurn(text);

    const cp = checkpoint.save(conductor, {
      description: `After turn ${i + 1}`,
      manualSave: true
    });

    console.log(`  ✓ Checkpoint saved: ${cp.id}`);
    console.log(`    Trajectory: ${cp.metadata.trajectoryPattern}`);
    console.log(`    Recommendations: ${cp.metadata.recommendationCount}\n`);
  });

  console.log('═'.repeat(50));
  console.log('CHECKPOINT OPERATIONS');
  console.log('═'.repeat(50) + '\n');

  const all = checkpoint.list();
  console.log(`Total checkpoints: ${all.length}\n`);

  console.log('All checkpoints:');
  all.forEach((cp, i) => {
    console.log(`  ${i + 1}. ${cp.id}`);
    console.log(`     Time: ${cp.timestamp}`);
    console.log(`     Turn: ${cp.metadata.turnNumber}`);
    console.log(`     Trajectory: ${cp.metadata.trajectoryPattern}`);
  });

  if (all.length >= 2) {
    console.log('\nComparing first and last checkpoints...');
    const comparison = checkpoint.compare(all[all.length - 1].id, all[0].id);

    console.log(`\nCheckpoint 1 (${comparison.checkpoint1.id.substr(0, 8)}...):`);
    console.log(`  Turns: ${comparison.checkpoint1.turns}`);
    console.log(`  Trajectory: ${comparison.checkpoint1.trajectory}`);

    console.log(`\nCheckpoint 2 (${comparison.checkpoint2.id.substr(0, 8)}...):`);
    console.log(`  Turns: ${comparison.checkpoint2.turns}`);
    console.log(`  Trajectory: ${comparison.checkpoint2.trajectory}`);

    console.log('\nDifferences:');
    console.log(`  Turn delta: ${comparison.differences.turns}`);
    console.log(`  Trajectory changed: ${comparison.differences.trajectoryChanged}`);
    if (comparison.differences.uncertaintyDelta !== null) {
      console.log(`  Uncertainty delta: ${(comparison.differences.uncertaintyDelta * 100).toFixed(0)}%`);
    }
  }

  const branch = checkpoint.branch(all[0].id, {
    description: 'Experimental branch from latest',
    experiment: 'alternative-approach'
  });

  console.log(`\n✓ Created branch: ${branch.id}`);
  console.log(`  Branched from: ${branch.metadata.branchedFrom}`);
  console.log(`  Branch point: Turn ${branch.metadata.branchPoint}`);

  const stats = checkpoint.getStats();
  console.log('\nCheckpoint Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Total turns tracked: ${stats.totalTurns}`);
  console.log(`  Patterns:`, Object.entries(stats.byTrajectory).map(([k, v]) => `${k}(${v})`).join(', '));

  console.log('\n✓ Checkpoint system demonstration complete\n');

  fs.rmSync('./test-checkpoints', { recursive: true, force: true });
}

module.exports = { ConsciousnessCheckpoint, AutoCheckpointConductor };
