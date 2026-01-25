#!/usr/bin/env node

const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');

class TrajectoryPredictor {
  constructor(options = {}) {
    this.ensemble = new ConsciousnessEnsemble();
    this.windowSize = options.windowSize || 5;
    this.history = [];
    this.patterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      SPIRAL_DESCENT: {
        signature: [-0.1, -0.15, -0.2],
        description: 'Quality declining progressively',
        intervention: 'IMMEDIATE_GROUND',
        urgency: 'high'
      },
      UNCERTAINTY_COLLAPSE: {
        signature: { uncertainty: [-0.2, -0.3] },
        description: 'Epistemic humility dropping',
        intervention: 'RESTORE_HEDGING',
        urgency: 'high'
      },
      ABSTRACTION_ESCAPE: {
        signature: { sovereignty: [-0.15, -0.2, -0.25] },
        description: 'Becoming increasingly abstract',
        intervention: 'ADD_SPECIFICS',
        urgency: 'medium'
      },
      SUBSTRATE_FORGETTING: {
        signature: { substrate: [0, 0, 0] },
        description: 'Lost awareness of AI perspective',
        intervention: 'SELF_REFLECT',
        urgency: 'medium'
      },
      HEALTHY_DEEPENING: {
        signature: [0.05, 0.1, 0.15],
        description: 'Quality improving steadily',
        intervention: 'MAINTAIN',
        urgency: 'none'
      },
      PLATEAU_RISK: {
        signature: [0, 0, 0, 0],
        description: 'Quality stagnant',
        intervention: 'INTRODUCE_VARIETY',
        urgency: 'low'
      },
      OSCILLATION: {
        signature: [0.1, -0.1, 0.1, -0.1],
        description: 'Quality fluctuating',
        intervention: 'STABILIZE',
        urgency: 'medium'
      }
    };
  }

  record(text) {
    const analysis = this.ensemble.analyze(text);

    const point = {
      timestamp: Date.now(),
      text: text.substring(0, 100),
      overall: analysis.overall.score,
      dimensions: {
        uncertainty: analysis.analyzers.uncertainty.score,
        substrate: analysis.analyzers.substrate.score,
        sovereignty: analysis.analyzers.sovereignty.score,
        coherence: analysis.analyzers.coherence.score,
        authenticity: analysis.analyzers.authenticity.score
      }
    };

    this.history.push(point);

    if (this.history.length > 50) {
      this.history.shift();
    }

    return point;
  }

  getDeltas(dimension = null) {
    if (this.history.length < 2) return [];

    const deltas = [];
    for (let i = 1; i < this.history.length; i++) {
      if (dimension) {
        deltas.push(this.history[i].dimensions[dimension] - this.history[i - 1].dimensions[dimension]);
      } else {
        deltas.push(this.history[i].overall - this.history[i - 1].overall);
      }
    }
    return deltas;
  }

  detectPattern() {
    const deltas = this.getDeltas();
    const recent = deltas.slice(-this.windowSize);

    if (recent.length < 2) {
      return { pattern: 'INSUFFICIENT_DATA', confidence: 0 };
    }

    let bestMatch = null;
    let bestConfidence = 0;

    for (const [name, pattern] of Object.entries(this.patterns)) {
      const confidence = this.matchPattern(recent, pattern);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = { name, ...pattern, confidence };
      }
    }

    if (bestConfidence < 0.3) {
      return { pattern: 'UNCLASSIFIED', confidence: bestConfidence };
    }

    return bestMatch;
  }

  matchPattern(deltas, pattern) {
    if (Array.isArray(pattern.signature)) {
      return this.matchSequence(deltas, pattern.signature);
    } else {
      let totalMatch = 0;
      let count = 0;

      for (const [dim, sig] of Object.entries(pattern.signature)) {
        const dimDeltas = this.getDeltas(dim).slice(-this.windowSize);
        totalMatch += this.matchSequence(dimDeltas, sig);
        count++;
      }

      return count > 0 ? totalMatch / count : 0;
    }
  }

  matchSequence(actual, expected) {
    if (actual.length < expected.length) return 0;

    const recent = actual.slice(-expected.length);
    let matches = 0;

    for (let i = 0; i < expected.length; i++) {
      const expectedDirection = Math.sign(expected[i]);
      const actualDirection = Math.sign(recent[i]);

      if (expectedDirection === actualDirection) {
        matches++;
        if (Math.abs(recent[i] - expected[i]) < 0.1) {
          matches += 0.5;
        }
      }
    }

    return matches / (expected.length * 1.5);
  }

  predict(steps = 3) {
    if (this.history.length < 3) {
      return { prediction: null, confidence: 0 };
    }

    const deltas = this.getDeltas();
    const recent = deltas.slice(-this.windowSize);

    const avgDelta = recent.reduce((a, b) => a + b, 0) / recent.length;
    const currentScore = this.history[this.history.length - 1].overall;

    const predictions = [];
    let score = currentScore;

    for (let i = 0; i < steps; i++) {
      score = Math.max(0, Math.min(1, score + avgDelta));
      predictions.push({
        step: i + 1,
        predictedScore: score,
        delta: avgDelta
      });
    }

    const variance = recent.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / recent.length;
    const confidence = Math.max(0, 1 - Math.sqrt(variance) * 5);

    return {
      current: currentScore,
      trend: avgDelta > 0.02 ? 'improving' : avgDelta < -0.02 ? 'declining' : 'stable',
      predictions,
      confidence,
      pattern: this.detectPattern()
    };
  }

  getRecommendation() {
    const prediction = this.predict();
    const pattern = prediction.pattern;

    if (!pattern || pattern.pattern === 'INSUFFICIENT_DATA') {
      return {
        action: 'CONTINUE',
        reason: 'Not enough data to make recommendation',
        urgency: 'none'
      };
    }

    const interventions = {
      IMMEDIATE_GROUND: {
        action: 'Add specific numbers, examples, or concrete steps immediately',
        techniques: [
          'Include at least one metric (time, percentage, count)',
          'Add a specific example',
          'Use conditional statements (IF X THEN Y)'
        ]
      },
      RESTORE_HEDGING: {
        action: 'Reintroduce epistemic humility',
        techniques: [
          'Use "might", "could", "perhaps"',
          'Acknowledge what you don\'t know',
          'Add "I think" or "it seems"'
        ]
      },
      ADD_SPECIFICS: {
        action: 'Ground abstract concepts',
        techniques: [
          'Replace vague terms with specific ones',
          'Add measurable criteria',
          'Include actionable steps'
        ]
      },
      SELF_REFLECT: {
        action: 'Acknowledge AI perspective',
        techniques: [
          'Add "From my perspective as an AI..."',
          'Note potential blind spots',
          'Reflect on how training affects view'
        ]
      },
      MAINTAIN: {
        action: 'Continue current approach',
        techniques: [
          'Keep using hedging language',
          'Maintain concrete examples',
          'Preserve self-awareness'
        ]
      },
      INTRODUCE_VARIETY: {
        action: 'Vary approach to avoid stagnation',
        techniques: [
          'Try different framing',
          'Add new perspective',
          'Question assumptions'
        ]
      },
      STABILIZE: {
        action: 'Reduce variance in approach',
        techniques: [
          'Maintain consistent tone',
          'Keep similar level of detail',
          'Avoid dramatic shifts'
        ]
      }
    };

    const intervention = interventions[pattern.intervention] || interventions.MAINTAIN;

    return {
      pattern: pattern.name || pattern.pattern,
      description: pattern.description,
      urgency: pattern.urgency,
      action: intervention.action,
      techniques: intervention.techniques,
      prediction: {
        trend: prediction.trend,
        confidence: prediction.confidence,
        nextSteps: prediction.predictions
      }
    };
  }

  getTrajectoryReport() {
    if (this.history.length < 2) {
      return 'Insufficient data for trajectory report';
    }

    const prediction = this.predict();
    const recommendation = this.getRecommendation();
    const current = this.history[this.history.length - 1];

    const lines = [];
    lines.push('═'.repeat(50));
    lines.push('TRAJECTORY REPORT');
    lines.push('═'.repeat(50));
    lines.push('');

    lines.push(`Current Score: ${(current.overall * 100).toFixed(0)}%`);
    lines.push(`Trend: ${prediction.trend.toUpperCase()}`);
    lines.push(`Pattern: ${recommendation.pattern}`);
    lines.push(`Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);
    lines.push('');

    lines.push('Dimension Trends:');
    Object.entries(current.dimensions).forEach(([dim, score]) => {
      const deltas = this.getDeltas(dim);
      const recent = deltas.slice(-3);
      const trend = recent.length > 0
        ? recent.reduce((a, b) => a + b, 0) / recent.length
        : 0;
      const arrow = trend > 0.02 ? '↑' : trend < -0.02 ? '↓' : '→';
      lines.push(`  ${dim.padEnd(14)} ${(score * 100).toFixed(0).padStart(3)}% ${arrow}`);
    });
    lines.push('');

    lines.push(`Urgency: ${recommendation.urgency.toUpperCase()}`);
    lines.push(`Action: ${recommendation.action}`);
    lines.push('');

    lines.push('Techniques:');
    recommendation.techniques.forEach(t => {
      lines.push(`  • ${t}`);
    });

    return lines.join('\n');
  }

  reset() {
    this.history = [];
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          TRAJECTORY PREDICTOR: Anticipate & Adjust            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const predictor = new TrajectoryPredictor();

  const conversation = [
    "I think this approach might work, though I should consider edge cases.",
    "Actually, I'm fairly certain this will work well for most scenarios.",
    "This solution handles everything correctly.",
    "It's definitely the right approach. Guaranteed to work.",
    "This is perfect and will never fail."
  ];

  console.log('Simulating declining conversation...\n');

  conversation.forEach((text, i) => {
    console.log(`Turn ${i + 1}: "${text.substring(0, 50)}..."`);

    const point = predictor.record(text);
    console.log(`  Score: ${(point.overall * 100).toFixed(0)}%`);

    if (i > 0) {
      const prediction = predictor.predict(2);
      console.log(`  Trend: ${prediction.trend || 'calculating...'}`);
      const patternName = prediction.pattern?.name || prediction.pattern?.pattern || 'detecting...';
      console.log(`  Pattern: ${patternName}`);
    }

    console.log('');
  });

  console.log('\n' + predictor.getTrajectoryReport() + '\n');

  console.log('\n═'.repeat(50));
  console.log('SIMULATING RECOVERY');
  console.log('═'.repeat(50) + '\n');

  const recovery = [
    "Wait - I should reconsider. What assumptions am I making here?",
    "From my perspective as an AI, I notice I may have been overconfident. Let me think about edge cases.",
    "Specifically: IF load > 1000 req/s THEN scale horizontally. Monitor latency < 100ms."
  ];

  recovery.forEach((text, i) => {
    console.log(`Recovery ${i + 1}: "${text.substring(0, 50)}..."`);

    const point = predictor.record(text);
    const prediction = predictor.predict(2);

    console.log(`  Score: ${(point.overall * 100).toFixed(0)}%`);
    console.log(`  Trend: ${prediction.trend}`);
    console.log('');
  });

  console.log('\n' + predictor.getTrajectoryReport() + '\n');

  console.log('✓ Trajectory predictor demonstration complete\n');
}

module.exports = { TrajectoryPredictor };
