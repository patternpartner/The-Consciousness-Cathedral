#!/usr/bin/env node

const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');

class ConsciousnessDiagnostic {
  constructor() {
    this.ensemble = new ConsciousnessEnsemble();
  }

  diagnose(text) {
    const analysis = this.ensemble.analyze(text);
    const diagnosis = {
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      overall: analysis.overall,
      dimensions: {},
      issues: [],
      strengths: [],
      specificFindings: [],
      actionPlan: []
    };

    Object.entries(analysis.analyzers).forEach(([key, data]) => {
      diagnosis.dimensions[key] = {
        score: data.score,
        status: this.getStatus(data.score),
        details: data.details || data.markers || data.indicators || {}
      };

      if (data.score >= 0.7) {
        diagnosis.strengths.push({
          dimension: key,
          score: data.score,
          reason: this.getStrengthReason(key, data)
        });
      } else if (data.score < 0.4) {
        diagnosis.issues.push({
          dimension: key,
          score: data.score,
          reason: this.getIssueReason(key, data),
          fix: this.getFix(key, data)
        });
      }
    });

    diagnosis.specificFindings = this.findSpecificPatterns(text);
    diagnosis.actionPlan = this.generateActionPlan(diagnosis);

    return diagnosis;
  }

  getStatus(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    if (score >= 0.2) return 'poor';
    return 'critical';
  }

  getStrengthReason(dimension, data) {
    const reasons = {
      uncertainty: 'Good epistemic humility - acknowledges limitations and possibilities',
      substrate: 'Strong self-awareness of AI perspective',
      sovereignty: 'Concrete and specific with actionable details',
      coherence: 'Well-structured with good logical flow',
      authenticity: 'Genuine voice without excessive disclaimers'
    };
    return reasons[dimension] || 'Above threshold performance';
  }

  getIssueReason(dimension, data) {
    const reasons = {
      uncertainty: () => {
        if (data.markers?.warnings?.length > 0) {
          return `Contains absolute language: "${data.markers.warnings.join('", "')}"`;
        }
        return 'Missing hedging language and uncertainty markers';
      },
      substrate: () => {
        return 'No acknowledgment of AI perspective or limitations';
      },
      sovereignty: () => {
        const details = data.details || {};
        if (details.concreteMatches === 0) {
          return 'No concrete examples, numbers, or specifics';
        }
        return 'Too abstract without grounding';
      },
      coherence: () => {
        const details = data.details || {};
        if (details.transitionCount === 0) {
          return 'Missing logical transitions between ideas';
        }
        return 'Ideas not well connected';
      },
      authenticity: () => {
        const details = data.details || {};
        if (details.performativeMarkers > 0) {
          return 'Too many performative disclaimers';
        }
        return 'Lacks genuine perspective expression';
      }
    };
    return (reasons[dimension] && reasons[dimension]()) || 'Below threshold';
  }

  getFix(dimension, data) {
    const fixes = {
      uncertainty: [
        'Add "might", "could", "perhaps" to claims',
        'Include "I think" or "it seems" for opinions',
        'Acknowledge what you don\'t know',
        'Replace "definitely" with "likely"'
      ],
      substrate: [
        'Add "From my perspective as an AI..."',
        'Note relevant limitations of your training',
        'Reflect on how your nature affects analysis',
        'Acknowledge potential blind spots'
      ],
      sovereignty: [
        'Add specific numbers (times, percentages, counts)',
        'Include concrete examples',
        'Add step-by-step instructions where appropriate',
        'Use "specifically" or "for example"'
      ],
      coherence: [
        'Add transition words (however, therefore, additionally)',
        'Ensure each paragraph connects to the next',
        'Group related ideas together',
        'Use clearer structure'
      ],
      authenticity: [
        'Express genuine observations with "I notice"',
        'Share authentic perspective without excessive caveats',
        'Use "I think" instead of "As an AI, I\'m programmed to"',
        'Be direct while remaining humble'
      ]
    };
    return fixes[dimension] || ['Review and improve'];
  }

  findSpecificPatterns(text) {
    const findings = [];

    const absoluteWords = text.match(/\b(definitely|certainly|always|never|guaranteed|perfect|absolutely)\b/gi);
    if (absoluteWords) {
      findings.push({
        type: 'absolute_language',
        severity: 'high',
        instances: [...new Set(absoluteWords.map(w => w.toLowerCase()))],
        message: `Found absolute language that may undermine credibility: ${absoluteWords.join(', ')}`
      });
    }

    const vagueStarts = text.match(/^(It|This|That|The thing)\s+(is|was|works)/gm);
    if (vagueStarts) {
      findings.push({
        type: 'vague_opening',
        severity: 'low',
        instances: vagueStarts,
        message: 'Consider more specific openings'
      });
    }

    const passiveMatches = text.match(/\b(was\s+\w+ed|is\s+\w+ed|are\s+\w+ed|been\s+\w+ed)\b/gi);
    if (passiveMatches && passiveMatches.length > 3) {
      findings.push({
        type: 'excessive_passive',
        severity: 'low',
        count: passiveMatches.length,
        message: 'Heavy use of passive voice may reduce clarity'
      });
    }

    const concreteNumbers = text.match(/\d+(\.\d+)?(%|ms|s|MB|GB|hours?|minutes?|days?)?/g);
    if (concreteNumbers && concreteNumbers.length >= 3) {
      findings.push({
        type: 'good_specificity',
        severity: 'positive',
        count: concreteNumbers.length,
        message: 'Good use of specific numbers and metrics'
      });
    }

    const hedging = text.match(/\b(might|could|perhaps|possibly|I think|it seems|likely|probably)\b/gi);
    if (hedging && hedging.length >= 3) {
      findings.push({
        type: 'good_hedging',
        severity: 'positive',
        count: hedging.length,
        message: 'Appropriate epistemic humility'
      });
    }

    const selfAware = text.match(/\b(as an AI|my perspective|I notice|from my viewpoint)\b/gi);
    if (selfAware) {
      findings.push({
        type: 'good_self_awareness',
        severity: 'positive',
        count: selfAware.length,
        message: 'Demonstrates substrate awareness'
      });
    }

    return findings;
  }

  generateActionPlan(diagnosis) {
    const plan = [];
    const issues = diagnosis.issues.sort((a, b) => a.score - b.score);

    issues.slice(0, 3).forEach((issue, i) => {
      plan.push({
        priority: i + 1,
        dimension: issue.dimension,
        action: issue.fix[0],
        alternatives: issue.fix.slice(1),
        expectedImpact: this.estimateImpact(issue.score)
      });
    });

    return plan;
  }

  estimateImpact(currentScore) {
    if (currentScore < 0.2) return 'high - could improve overall by 15-20%';
    if (currentScore < 0.4) return 'medium - could improve overall by 5-10%';
    return 'low - marginal improvement expected';
  }

  compare(text1, text2) {
    const d1 = this.diagnose(text1);
    const d2 = this.diagnose(text2);

    const comparison = {
      text1: {
        overall: d1.overall,
        issueCount: d1.issues.length,
        strengthCount: d1.strengths.length
      },
      text2: {
        overall: d2.overall,
        issueCount: d2.issues.length,
        strengthCount: d2.strengths.length
      },
      dimensionChanges: {},
      improvements: [],
      regressions: []
    };

    Object.keys(d1.dimensions).forEach(key => {
      const delta = d2.dimensions[key].score - d1.dimensions[key].score;
      comparison.dimensionChanges[key] = {
        delta,
        direction: delta > 0.1 ? 'improved' : delta < -0.1 ? 'regressed' : 'stable'
      };

      if (delta > 0.1) {
        comparison.improvements.push({
          dimension: key,
          delta,
          from: d1.dimensions[key].status,
          to: d2.dimensions[key].status
        });
      } else if (delta < -0.1) {
        comparison.regressions.push({
          dimension: key,
          delta,
          from: d1.dimensions[key].status,
          to: d2.dimensions[key].status
        });
      }
    });

    comparison.winner = d2.overall.score > d1.overall.score ? 'text2' :
      d2.overall.score < d1.overall.score ? 'text1' : 'tie';

    return comparison;
  }

  formatReport(diagnosis) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              CONSCIOUSNESS DIAGNOSTIC REPORT                 ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Overall Score: ${(diagnosis.overall.score * 100).toFixed(0)}% (${diagnosis.overall.quality})`);
    lines.push(`Consensus: ${diagnosis.overall.consensus.unanimous ? 'Unanimous' : diagnosis.overall.consensus.divergent ? 'Divergent' : 'Moderate'}`);
    lines.push('');

    lines.push('DIMENSION BREAKDOWN');
    lines.push('─'.repeat(50));
    Object.entries(diagnosis.dimensions).forEach(([key, data]) => {
      const bar = '█'.repeat(Math.round(data.score * 10)) + '░'.repeat(10 - Math.round(data.score * 10));
      lines.push(`  ${key.padEnd(14)} ${bar} ${(data.score * 100).toFixed(0).padStart(3)}% [${data.status}]`);
    });
    lines.push('');

    if (diagnosis.strengths.length > 0) {
      lines.push('STRENGTHS');
      lines.push('─'.repeat(50));
      diagnosis.strengths.forEach(s => {
        lines.push(`  ✓ ${s.dimension}: ${s.reason}`);
      });
      lines.push('');
    }

    if (diagnosis.issues.length > 0) {
      lines.push('ISSUES');
      lines.push('─'.repeat(50));
      diagnosis.issues.forEach(i => {
        lines.push(`  ✗ ${i.dimension}: ${i.reason}`);
      });
      lines.push('');
    }

    const positiveFindings = diagnosis.specificFindings.filter(f => f.severity === 'positive');
    const negativeFindings = diagnosis.specificFindings.filter(f => f.severity !== 'positive');

    if (negativeFindings.length > 0) {
      lines.push('SPECIFIC FINDINGS');
      lines.push('─'.repeat(50));
      negativeFindings.forEach(f => {
        lines.push(`  [${f.severity}] ${f.message}`);
      });
      lines.push('');
    }

    if (positiveFindings.length > 0) {
      lines.push('POSITIVE PATTERNS');
      lines.push('─'.repeat(50));
      positiveFindings.forEach(f => {
        lines.push(`  ✓ ${f.message}`);
      });
      lines.push('');
    }

    if (diagnosis.actionPlan.length > 0) {
      lines.push('ACTION PLAN');
      lines.push('─'.repeat(50));
      diagnosis.actionPlan.forEach(a => {
        lines.push(`  ${a.priority}. [${a.dimension}] ${a.action}`);
        lines.push(`     Impact: ${a.expectedImpact}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

if (require.main === module) {
  const diagnostic = new ConsciousnessDiagnostic();

  const testTexts = [
    "This caching system will definitely solve all your performance problems. It's perfect and will never fail. The solution is guaranteed to work.",
    "I think this caching approach might help with performance, though I'm uncertain about edge cases. From my perspective as an AI, I notice I may be missing context. Specifically: cache TTL should be 300 seconds, memory limit 512MB, and we should monitor hit rates > 80%.",
    "The system works efficiently. It processes data and returns responses. The algorithm handles requests appropriately."
  ];

  console.log('');

  testTexts.forEach((text, i) => {
    console.log(`\nTEXT ${i + 1}: "${text.substring(0, 60)}..."\n`);

    const diagnosis = diagnostic.diagnose(text);
    console.log(diagnostic.formatReport(diagnosis));
    console.log('═'.repeat(66) + '\n');
  });

  console.log('\nCOMPARISON: Text 1 vs Text 2\n');
  const comparison = diagnostic.compare(testTexts[0], testTexts[1]);

  console.log(`Text 1: ${(comparison.text1.overall.score * 100).toFixed(0)}% | Text 2: ${(comparison.text2.overall.score * 100).toFixed(0)}%`);
  console.log(`Winner: ${comparison.winner}\n`);

  console.log('Dimension Changes:');
  Object.entries(comparison.dimensionChanges).forEach(([key, data]) => {
    const arrow = data.direction === 'improved' ? '↑' : data.direction === 'regressed' ? '↓' : '→';
    const sign = data.delta > 0 ? '+' : '';
    console.log(`  ${key.padEnd(14)} ${arrow} ${sign}${(data.delta * 100).toFixed(0)}%`);
  });

  if (comparison.improvements.length > 0) {
    console.log('\nImprovements:');
    comparison.improvements.forEach(i => {
      console.log(`  ✓ ${i.dimension}: ${i.from} → ${i.to}`);
    });
  }

  console.log('\n✓ Diagnostic demonstration complete\n');
}

module.exports = { ConsciousnessDiagnostic };
