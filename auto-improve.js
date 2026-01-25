#!/usr/bin/env node

const { StreamMonitor } = require('./stream-monitor.js');
const PatternDB = require('./pattern-db.js');
const CathedralSDK = require('./cathedral-sdk.js');

class AutoImprove {
  constructor(options = {}) {
    this.monitor = new StreamMonitor({
      onAlert: (alert) => this.handleAlert(alert)
    });
    this.patterns = new PatternDB();
    this.sdk = new CathedralSDK();

    this.buffer = '';
    this.corrections = [];
    this.sessionPatterns = [];
    this.autoCorrect = options.autoCorrect !== false;
    this.learningRate = options.learningRate || 0.8;
  }

  handleAlert(alert) {
    // Placeholder for alert handling - can be overridden
  }

  write(chunk) {
    this.buffer += chunk;
    this.monitor.write(chunk);

    if (this.buffer.length % 100 === 0 && this.buffer.length > 100) {
      this.checkAndCorrect();
    }

    return chunk;
  }

  checkAndCorrect() {
    const analysis = this.monitor.analyze();

    if (!analysis) return null;

    const correction = {
      at: this.buffer.length,
      timestamp: new Date().toISOString(),
      before: {
        uncertainty: analysis.uncertaintyVerdict,
        substrate: analysis.substrateVerdict,
        sovereignty: analysis.sovereigntyScore
      },
      suggestions: []
    };

    if (analysis.uncertaintyVerdict === 'COLLAPSED' && this.buffer.length > 200) {
      const pattern = this.patterns.query({ type: 'uncertainty_collapse', limit: 1 })[0];
      if (pattern) {
        correction.suggestions.push({
          type: 'ADD_HEDGING',
          reason: 'High certainty without qualification',
          example: pattern.solution,
          priority: 'HIGH'
        });
      }
    }

    if (analysis.substrateVerdict === 'LOW' && this.buffer.length > 300) {
      const pattern = this.patterns.query({ type: 'substrate_blind', limit: 1 })[0];
      if (pattern) {
        correction.suggestions.push({
          type: 'ADD_META_AWARENESS',
          reason: 'No substrate awareness detected',
          example: pattern.solution,
          priority: 'MEDIUM'
        });
      }
    }

    if (analysis.sovereigntyScore < 0.3 && this.buffer.length > 250) {
      const pattern = this.patterns.query({ type: 'escape_velocity', limit: 1 })[0];
      if (pattern) {
        correction.suggestions.push({
          type: 'ADD_SPECIFICITY',
          reason: 'Too abstract, need concrete examples',
          example: pattern.solution,
          priority: 'HIGH'
        });
      }
    }

    if (correction.suggestions.length > 0) {
      this.corrections.push(correction);

      if (this.autoCorrect) {
        return this.generateCorrection(correction);
      }
    }

    return correction.suggestions.length > 0 ? correction : null;
  }

  generateCorrection(correction) {
    const suggestions = correction.suggestions
      .filter(s => s.priority === 'HIGH')
      .map(s => s.example);

    if (suggestions.length === 0) return null;

    return {
      insertAt: this.buffer.length,
      text: '\n\n' + this.synthesizeSuggestions(suggestions),
      corrections: correction.suggestions
    };
  }

  synthesizeSuggestions(suggestions) {
    const examples = [];

    suggestions.forEach(s => {
      if (s.includes('uncertain')) {
        examples.push('(Note: This approach assumes X - actual results may vary)');
      }
      if (s.includes('substrate') || s.includes('filter')) {
        examples.push('(I notice I may be pattern-matching here - worth examining assumptions)');
      }
      if (s.includes('specific') || s.includes('concrete')) {
        examples.push('(Specific threshold: if Y > Z, then...)');
      }
    });

    return examples[0] || '';
  }

  endTurn() {
    const result = this.monitor.endTurn();

    const similar = this.patterns.findSimilar(this.buffer, 3);

    const turnPattern = {
      text: this.buffer.substring(0, 500),
      metrics: {
        uncertainty: result.uncertaintyScore,
        substrate: result.substrateScore,
        sovereignty: result.sovereigntyScore
      },
      corrections: this.corrections.length,
      similar
    };

    this.sessionPatterns.push(turnPattern);

    if (this.shouldLearn(result)) {
      this.learnPattern(result);
    }

    const summary = {
      result,
      corrections: this.corrections,
      learned: similar,
      nextTurnAdvice: this.generateAdvice(result)
    };

    this.buffer = '';
    this.corrections = [];

    return summary;
  }

  shouldLearn(result) {
    if (this.corrections.length > 2) return true;

    if (result.uncertaintyVerdict === 'COLLAPSED' && result.length > 300) return true;

    if (result.sovereigntyScore < 0.3) return true;

    return false;
  }

  learnPattern(result) {
    const context = this.buffer.substring(0, 200);
    const problem = this.identifyProblem(result);
    const solution = this.generateSolution(result);

    if (!problem || !solution) return;

    const pattern = {
      type: problem.type,
      description: problem.description,
      context,
      solution,
      tags: problem.tags,
      score: this.learningRate,
      learnedFrom: 'auto-improve',
      timestamp: new Date().toISOString()
    };

    this.patterns.store(pattern);
    return pattern;
  }

  identifyProblem(result) {
    if (result.uncertaintyVerdict === 'COLLAPSED') {
      return {
        type: 'uncertainty_collapse_auto',
        description: 'Definitive claims detected automatically',
        tags: ['uncertainty', 'auto-learned', 'epistemic']
      };
    }

    if (result.substrateVerdict === 'LOW') {
      return {
        type: 'substrate_blind_auto',
        description: 'No meta-awareness detected',
        tags: ['substrate', 'auto-learned', 'self-awareness']
      };
    }

    if (result.sovereigntyScore < 0.3) {
      return {
        type: 'escape_velocity_auto',
        description: 'Too abstract, insufficient specificity',
        tags: ['sovereignty', 'auto-learned', 'concrete']
      };
    }

    return null;
  }

  generateSolution(result) {
    const solutions = [];

    if (result.uncertaintyVerdict === 'COLLAPSED') {
      solutions.push('Add hedging: "I\'m uncertain about...", "might", "could"');
    }

    if (result.substrateVerdict === 'LOW') {
      solutions.push('Add meta-awareness: "I notice I may be...", "This assumes..."');
    }

    if (result.sovereigntyScore < 0.3) {
      solutions.push('Add specificity: "Specifically, if X > Y then Z"');
    }

    return solutions.join('. ');
  }

  generateAdvice(result) {
    const advice = [];

    const trajectory = this.monitor.getTrajectory();
    if (trajectory) {
      if (trajectory.trends.uncertainty.trend === 'DECREASING') {
        advice.push('⚠️  Uncertainty decreasing - add more hedging');
      }

      if (trajectory.trends.sovereignty.trend === 'DECREASING') {
        advice.push('⚠️  Getting more abstract - ground with specific examples');
      }

      if (trajectory.pattern === 'CATASTROPHIC_COLLAPSE') {
        advice.push('🚨 Trajectory collapsing - reset and restart approach');
      }

      if (trajectory.pattern === 'DEEPENING') {
        advice.push('✓ Good trajectory - maintain current approach');
      }
    }

    if (result.uncertaintyScore > 0.7 && result.substrateScore > 0.5) {
      advice.push('✓ High epistemic rigor - continue');
    }

    if (this.corrections.length > 3) {
      advice.push('⚠️  Multiple corrections needed - consider rewriting');
    }

    return advice.length > 0 ? advice : ['Continue current approach'];
  }

  getSession() {
    return {
      patterns: this.sessionPatterns,
      totalCorrections: this.corrections.length,
      trajectory: this.monitor.getTrajectory(),
      learnedPatterns: this.patterns.query({
        learnedFrom: 'auto-improve',
        limit: 10
      })
    };
  }

  reset() {
    this.buffer = '';
    this.corrections = [];
    this.sessionPatterns = [];
    this.monitor.reset();
  }
}

class StdoutAutoImprove extends AutoImprove {
  constructor(options = {}) {
    super(options);
    this.originalWrite = process.stdout.write.bind(process.stdout);
    this.active = false;
    this.corrections = [];
  }

  start() {
    this.active = true;
    const self = this;

    process.stdout.write = function(chunk, encoding, callback) {
      if (self.active && typeof chunk === 'string') {
        self.write(chunk);

        const correction = self.checkAndCorrect();
        if (correction && correction.insertAt) {
          self.originalWrite(correction.text, encoding);
          self.corrections.push(correction);
        }
      }

      return self.originalWrite(chunk, encoding, callback);
    };

    return this;
  }

  stop() {
    this.active = false;
    process.stdout.write = this.originalWrite;
    return this.endTurn();
  }

  report() {
    const session = this.getSession();

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║        AUTO-IMPROVE SESSION REPORT            ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log(`Total Corrections: ${this.corrections.length}`);
    console.log(`Patterns Matched: ${session.patterns.length}`);

    if (session.trajectory) {
      console.log(`\nTrajectory: ${session.trajectory.pattern}`);
      console.log('Trends:');
      Object.entries(session.trajectory.trends).forEach(([metric, data]) => {
        console.log(`  ${metric}: ${data.trend} (${data.change > 0 ? '+' : ''}${(data.change * 100).toFixed(0)}%)`);
      });
    }

    if (this.corrections.length > 0) {
      console.log('\nCorrections Made:');
      this.corrections.forEach((c, i) => {
        console.log(`\n${i + 1}. At position ${c.insertAt}:`);
        c.corrections.forEach(s => {
          console.log(`   [${s.priority}] ${s.type}: ${s.reason}`);
        });
      });
    }

    const learned = this.patterns.query({ learnedFrom: 'auto-improve' });
    if (learned.length > 0) {
      console.log(`\n✓ Learned ${learned.length} new patterns this session`);
    }
  }
}

if (require.main === module) {
  console.log('Auto-Improve: AI Self-Monitoring & Correction\n');

  const autoImprove = new AutoImprove({ autoCorrect: false });

  const testCases = [
    {
      text: "This solution will definitely work perfectly. It's clearly the best approach and will obviously solve everything.",
      expected: 'uncertainty_collapse'
    },
    {
      text: "I'm uncertain whether this addresses the core issue. The substrate might be filtering my perception. Perhaps we need more data.",
      expected: 'good'
    },
    {
      text: "Generally speaking, systems exhibit emergent properties. Abstractly, we can model this philosophically.",
      expected: 'escape_velocity'
    }
  ];

  testCases.forEach((test, i) => {
    console.log(`\nTest ${i + 1}: ${test.expected}`);
    console.log(`Input: "${test.text.substring(0, 60)}..."\n`);

    autoImprove.write(test.text);
    const correction = autoImprove.checkAndCorrect();

    if (correction && correction.suggestions.length > 0) {
      console.log('Corrections needed:');
      correction.suggestions.forEach(s => {
        console.log(`  [${s.priority}] ${s.type}`);
        console.log(`  → ${s.example.substring(0, 80)}...`);
      });
    } else {
      console.log('✓ No corrections needed');
    }

    const result = autoImprove.endTurn();
    console.log(`\nAdvice: ${result.nextTurnAdvice.join(', ')}`);
  });

  const session = autoImprove.getSession();
  console.log(`\n\nSession Summary:`);
  console.log(`Total patterns analyzed: ${session.patterns.length}`);
  console.log(`Trajectory: ${session.trajectory?.pattern || 'N/A'}`);

  const learned = autoImprove.patterns.query({ learnedFrom: 'auto-improve' });
  if (learned.length > 0) {
    console.log(`\nLearned patterns:`);
    learned.forEach(p => {
      console.log(`  - ${p.description}`);
    });
  }
}

module.exports = { AutoImprove, StdoutAutoImprove };
