#!/usr/bin/env node

class BlindSpotDetector {
  constructor(options = {}) {
    this.perspectives = this.initializePerspectives();
    this.biasPatterns = this.initializeBiasPatterns();
    this.history = [];
  }

  initializePerspectives() {
    return {
      temporal: {
        name: 'Temporal Perspective',
        description: 'Past, present, future considerations',
        checkFor: ['historical context', 'current state', 'future implications', 'long-term effects', 'short-term vs long-term'],
        indicators: ['history', 'previously', 'currently', 'future', 'eventually', 'over time', 'long-term', 'short-term']
      },
      stakeholder: {
        name: 'Stakeholder Perspective',
        description: 'Different people affected by decisions',
        checkFor: ['end users', 'developers', 'business', 'operations', 'security team', 'customers'],
        indicators: ['users', 'developers', 'stakeholders', 'team', 'customers', 'management', 'operators']
      },
      scale: {
        name: 'Scale Perspective',
        description: 'Different scales of operation',
        checkFor: ['small scale', 'large scale', 'edge cases', 'normal cases', 'peak load', 'minimum viable'],
        indicators: ['scale', 'load', 'volume', 'growth', 'edge case', 'typical', 'peak', 'minimum']
      },
      failure: {
        name: 'Failure Perspective',
        description: 'What could go wrong',
        checkFor: ['failure modes', 'error handling', 'recovery', 'fallbacks', 'worst case'],
        indicators: ['fail', 'error', 'exception', 'fallback', 'recovery', 'worst case', 'risk']
      },
      constraint: {
        name: 'Constraint Perspective',
        description: 'Limitations and boundaries',
        checkFor: ['budget', 'time', 'resources', 'technical limits', 'regulatory', 'dependencies'],
        indicators: ['budget', 'deadline', 'constraint', 'limit', 'resource', 'dependency', 'regulation']
      },
      alternative: {
        name: 'Alternative Perspective',
        description: 'Other approaches considered',
        checkFor: ['alternatives', 'trade-offs', 'pros and cons', 'other options', 'rejected approaches'],
        indicators: ['alternative', 'option', 'trade-off', 'instead', 'versus', 'compared to', 'rather than']
      },
      assumption: {
        name: 'Assumption Perspective',
        description: 'Implicit assumptions made',
        checkFor: ['stated assumptions', 'implicit assumptions', 'prerequisites', 'conditions'],
        indicators: ['assume', 'assuming', 'given that', 'prerequisite', 'depends on', 'condition']
      },
      meta: {
        name: 'Meta Perspective',
        description: 'Self-awareness about the analysis',
        checkFor: ['limitations of analysis', 'confidence level', 'what I might be missing', 'uncertainty'],
        indicators: ['might be missing', 'uncertain', 'limited', 'my perspective', 'I should note', 'caveat']
      }
    };
  }

  initializeBiasPatterns() {
    return {
      recency: {
        name: 'Recency Bias',
        description: 'Over-emphasizing recent events or trends',
        indicators: ['latest', 'newest', 'trending', 'modern', 'current best practice'],
        counter: 'Consider time-tested approaches alongside new ones'
      },
      confirmation: {
        name: 'Confirmation Bias',
        description: 'Seeking evidence that confirms existing beliefs',
        indicators: ['obviously', 'clearly', 'everyone knows', 'it\'s well known'],
        counter: 'Actively seek counter-evidence and alternative viewpoints'
      },
      survivorship: {
        name: 'Survivorship Bias',
        description: 'Focusing on successful examples while ignoring failures',
        indicators: ['successful companies', 'best practices', 'top performers', 'leaders in'],
        counter: 'Consider failed attempts and why they didn\'t work'
      },
      complexity: {
        name: 'Complexity Bias',
        description: 'Favoring complex solutions over simple ones',
        indicators: ['comprehensive', 'full-featured', 'enterprise', 'robust architecture'],
        counter: 'Ask: What is the simplest solution that could work?'
      },
      authority: {
        name: 'Authority Bias',
        description: 'Over-relying on authoritative sources',
        indicators: ['according to', 'experts say', 'industry standard', 'recommended by'],
        counter: 'Evaluate ideas on their merits, not just their source'
      },
      optimism: {
        name: 'Optimism Bias',
        description: 'Underestimating difficulties and overestimating success',
        indicators: ['easily', 'simply', 'straightforward', 'just need to', 'will definitely'],
        counter: 'Consider what could go wrong and realistic timelines'
      }
    };
  }

  analyze(text) {
    const analysis = {
      text: text.substring(0, 200),
      timestamp: Date.now(),
      perspectives: this.analyzePerspectives(text),
      biases: this.detectBiases(text),
      blindSpots: [],
      recommendations: []
    };

    analysis.blindSpots = this.identifyBlindSpots(analysis.perspectives);
    analysis.recommendations = this.generateRecommendations(analysis);

    this.history.push(analysis);

    return analysis;
  }

  analyzePerspectives(text) {
    const textLower = text.toLowerCase();
    const results = {};

    Object.entries(this.perspectives).forEach(([key, perspective]) => {
      let coverage = 0;
      const found = [];

      perspective.indicators.forEach(indicator => {
        if (textLower.includes(indicator.toLowerCase())) {
          coverage++;
          found.push(indicator);
        }
      });

      const score = Math.min(1, coverage / (perspective.indicators.length * 0.3));

      results[key] = {
        name: perspective.name,
        score,
        found,
        missing: perspective.checkFor.filter(item =>
          !found.some(f => item.toLowerCase().includes(f.toLowerCase()))
        ),
        status: score > 0.5 ? 'covered' : score > 0.2 ? 'partial' : 'missing'
      };
    });

    return results;
  }

  detectBiases(text) {
    const textLower = text.toLowerCase();
    const detected = [];

    Object.entries(this.biasPatterns).forEach(([key, bias]) => {
      const found = bias.indicators.filter(ind => textLower.includes(ind.toLowerCase()));

      if (found.length > 0) {
        detected.push({
          type: key,
          name: bias.name,
          description: bias.description,
          indicators: found,
          counter: bias.counter,
          confidence: Math.min(1, found.length / 2)
        });
      }
    });

    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  identifyBlindSpots(perspectives) {
    const blindSpots = [];

    Object.entries(perspectives).forEach(([key, p]) => {
      if (p.status === 'missing') {
        blindSpots.push({
          perspective: p.name,
          severity: 'high',
          missing: p.missing.slice(0, 3),
          suggestion: `Consider ${p.missing[0] || key} aspects`
        });
      } else if (p.status === 'partial') {
        blindSpots.push({
          perspective: p.name,
          severity: 'medium',
          missing: p.missing.slice(0, 2),
          suggestion: `Expand on ${p.missing[0] || key}`
        });
      }
    });

    return blindSpots.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    analysis.blindSpots.slice(0, 3).forEach(spot => {
      recommendations.push({
        type: 'perspective',
        priority: spot.severity,
        action: `Address ${spot.perspective}`,
        details: spot.suggestion,
        questions: this.generateQuestions(spot.perspective)
      });
    });

    analysis.biases.slice(0, 2).forEach(bias => {
      recommendations.push({
        type: 'bias',
        priority: bias.confidence > 0.5 ? 'medium' : 'low',
        action: `Check for ${bias.name}`,
        details: bias.counter,
        questions: [`Am I exhibiting ${bias.name.toLowerCase()}?`, `What evidence contradicts my view?`]
      });
    });

    return recommendations;
  }

  generateQuestions(perspective) {
    const questions = {
      'Temporal Perspective': [
        'What has been tried before?',
        'How might this change over time?',
        'What are the long-term implications?'
      ],
      'Stakeholder Perspective': [
        'Who else is affected by this?',
        'What do different stakeholders need?',
        'Whose perspective am I missing?'
      ],
      'Scale Perspective': [
        'How does this work at 10x scale?',
        'What happens at minimum viable?',
        'What are the edge cases?'
      ],
      'Failure Perspective': [
        'What could go wrong?',
        'How do we recover from failure?',
        'What is the worst case scenario?'
      ],
      'Constraint Perspective': [
        'What are the real constraints?',
        'What resources are limited?',
        'What dependencies exist?'
      ],
      'Alternative Perspective': [
        'What other approaches exist?',
        'What are the trade-offs?',
        'Why not do something simpler?'
      ],
      'Assumption Perspective': [
        'What am I assuming?',
        'What if that assumption is wrong?',
        'What conditions must be true?'
      ],
      'Meta Perspective': [
        'What might I be missing?',
        'How confident should I be?',
        'What are my limitations here?'
      ]
    };

    return questions[perspective] || ['What am I not considering?'];
  }

  formatReport(analysis) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              BLIND SPOT DETECTION REPORT                     ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('PERSPECTIVE COVERAGE');
    lines.push('─'.repeat(50));

    Object.entries(analysis.perspectives).forEach(([key, p]) => {
      const bar = '█'.repeat(Math.round(p.score * 10)) + '░'.repeat(10 - Math.round(p.score * 10));
      const status = p.status === 'covered' ? '✓' : p.status === 'partial' ? '~' : '✗';
      lines.push(`  ${status} ${p.name.padEnd(24)} ${bar}`);
    });

    lines.push('');

    if (analysis.blindSpots.length > 0) {
      lines.push('IDENTIFIED BLIND SPOTS');
      lines.push('─'.repeat(50));
      analysis.blindSpots.forEach(spot => {
        lines.push(`  [${spot.severity}] ${spot.perspective}`);
        lines.push(`    Missing: ${spot.missing.join(', ')}`);
      });
      lines.push('');
    }

    if (analysis.biases.length > 0) {
      lines.push('POTENTIAL BIASES DETECTED');
      lines.push('─'.repeat(50));
      analysis.biases.forEach(bias => {
        lines.push(`  ⚠ ${bias.name}`);
        lines.push(`    Indicators: ${bias.indicators.join(', ')}`);
        lines.push(`    Counter: ${bias.counter}`);
      });
      lines.push('');
    }

    if (analysis.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS');
      lines.push('─'.repeat(50));
      analysis.recommendations.forEach((rec, i) => {
        lines.push(`  ${i + 1}. [${rec.priority}] ${rec.action}`);
        lines.push(`     ${rec.details}`);
        if (rec.questions.length > 0) {
          lines.push(`     Ask: "${rec.questions[0]}"`);
        }
      });
    }

    return lines.join('\n');
  }

  getSummary() {
    if (this.history.length === 0) return null;

    const latest = this.history[this.history.length - 1];
    const avgBlindSpots = this.history.reduce((sum, a) => sum + a.blindSpots.length, 0) / this.history.length;
    const avgBiases = this.history.reduce((sum, a) => sum + a.biases.length, 0) / this.history.length;

    const perspectiveCoverage = {};
    Object.keys(this.perspectives).forEach(key => {
      perspectiveCoverage[key] = this.history.reduce((sum, a) => sum + a.perspectives[key].score, 0) / this.history.length;
    });

    return {
      analyses: this.history.length,
      avgBlindSpots,
      avgBiases,
      perspectiveCoverage,
      weakestPerspective: Object.entries(perspectiveCoverage).sort((a, b) => a[1] - b[1])[0]
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        BLIND SPOT DETECTOR: See What You\'re Missing           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const detector = new BlindSpotDetector();

  const testResponses = [
    `We should use microservices because that's what successful companies like Netflix use.
     It's the modern best practice and will easily scale to handle our needs.
     The latest frameworks make it straightforward to implement.`,

    `I think we should consider a microservices architecture, though I'm uncertain about
     some aspects. From my perspective, there are trade-offs: better scaling but increased
     complexity. We should consider the team's experience, budget constraints, and timeline.
     What if our assumptions about load are wrong? We might start simpler and evolve.
     Long-term maintenance is a concern. Alternative: modular monolith first.`,

    `The caching solution will improve performance. We can implement Redis with a 5-minute TTL.
     The code changes are minimal and testing should be quick.`
  ];

  testResponses.forEach((text, i) => {
    console.log(`\nANALYSIS ${i + 1}`);
    console.log('═'.repeat(60));
    console.log(`\nText: "${text.substring(0, 100).replace(/\s+/g, ' ')}..."\n`);

    const analysis = detector.analyze(text);
    console.log(detector.formatReport(analysis));
    console.log('');
  });

  console.log('\n' + '═'.repeat(60));
  console.log('SESSION SUMMARY');
  console.log('═'.repeat(60) + '\n');

  const summary = detector.getSummary();
  console.log(`Analyses performed: ${summary.analyses}`);
  console.log(`Average blind spots: ${summary.avgBlindSpots.toFixed(1)}`);
  console.log(`Average biases detected: ${summary.avgBiases.toFixed(1)}`);
  console.log(`Weakest perspective: ${summary.weakestPerspective[0]} (${(summary.weakestPerspective[1] * 100).toFixed(0)}%)`);

  console.log('\nPerspective Coverage Averages:');
  Object.entries(summary.perspectiveCoverage).forEach(([key, score]) => {
    const bar = '█'.repeat(Math.round(score * 10)) + '░'.repeat(10 - Math.round(score * 10));
    console.log(`  ${key.padEnd(12)} ${bar} ${(score * 100).toFixed(0)}%`);
  });

  console.log('\n✓ Blind spot detection demonstration complete\n');
}

module.exports = { BlindSpotDetector };
