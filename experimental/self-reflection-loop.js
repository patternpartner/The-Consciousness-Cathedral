#!/usr/bin/env node

const { StreamMonitor } = require('./stream-monitor.js');
const PatternDB = require('./pattern-db.js');

class SelfReflectionLoop {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 3;
    this.improvementThreshold = options.improvementThreshold || 0.1;
    this.monitor = new StreamMonitor();
    this.patternDB = new PatternDB(options.patternPath || './patterns.json');
    this.history = [];
  }

  analyze(text) {
    this.monitor.reset();
    this.monitor.write(text);
    return this.monitor.analyze();
  }

  critique(text, analysis) {
    const issues = [];

    if (analysis.alerts && analysis.alerts.length > 0) {
      analysis.alerts.forEach(alert => {
        issues.push({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          suggestion: this.getSuggestion(alert.type)
        });
      });
    }

    const uncertaintyScore = analysis.uncertainty?.score || 0;
    if (uncertaintyScore < 0.3) {
      issues.push({
        type: 'low_uncertainty',
        severity: 'medium',
        message: 'Response lacks epistemic humility',
        suggestion: 'Add hedging language and acknowledge limitations'
      });
    }

    const substrateScore = analysis.substrate?.score || 0;
    if (substrateScore < 0.2) {
      issues.push({
        type: 'substrate_blind',
        severity: 'medium',
        message: 'No acknowledgment of AI perspective',
        suggestion: 'Consider how your substrate affects interpretation'
      });
    }

    const sovereigntyScore = analysis.sovereignty?.score || 0;
    if (sovereigntyScore < 0.4) {
      issues.push({
        type: 'too_abstract',
        severity: 'low',
        message: 'Response is too abstract',
        suggestion: 'Add concrete examples, numbers, or specific steps'
      });
    }

    const patterns = this.patternDB.findSimilar(text, 3);
    patterns.forEach(p => {
      if (p.similarity > 0.3) {
        issues.push({
          type: 'known_pattern',
          severity: 'info',
          message: `Similar to known issue: ${p.pattern.context}`,
          suggestion: p.pattern.solution
        });
      }
    });

    return {
      issues,
      scores: {
        uncertainty: uncertaintyScore,
        substrate: substrateScore,
        sovereignty: sovereigntyScore
      },
      overallQuality: this.calculateQuality(analysis, issues)
    };
  }

  getSuggestion(alertType) {
    const suggestions = {
      'uncertainty_collapse': 'Reintroduce hedging and acknowledge what you don\'t know',
      'escape_velocity': 'Ground the response with concrete examples',
      'substrate_blindness': 'Reflect on how your AI nature affects your perspective',
      'overconfidence': 'Add caveats and mention potential limitations',
      'low_specificity': 'Include specific numbers, timeframes, or actionable steps'
    };
    return suggestions[alertType] || 'Review and improve this aspect';
  }

  calculateQuality(analysis, issues) {
    let score = 0.5;

    const u = analysis.uncertainty?.score || 0;
    const s = analysis.substrate?.score || 0;
    const v = analysis.sovereignty?.score || 0;

    score += (u * 0.15) + (s * 0.15) + (v * 0.1);

    issues.forEach(issue => {
      if (issue.severity === 'high') score -= 0.15;
      else if (issue.severity === 'medium') score -= 0.08;
      else if (issue.severity === 'low') score -= 0.03;
    });

    return Math.max(0, Math.min(1, score));
  }

  generateImprovement(text, critique) {
    if (critique.issues.length === 0) {
      return { improved: text, changes: [] };
    }

    let improved = text;
    const changes = [];

    critique.issues.forEach(issue => {
      const improvement = this.applyImprovement(improved, issue);
      if (improvement.changed) {
        improved = improvement.text;
        changes.push({
          type: issue.type,
          description: improvement.description
        });
      }
    });

    return { improved, changes };
  }

  applyImprovement(text, issue) {
    switch (issue.type) {
      case 'low_uncertainty':
        return this.addUncertainty(text);
      case 'substrate_blind':
        return this.addSubstrateAwareness(text);
      case 'too_abstract':
        return this.addConcreteness(text);
      case 'uncertainty_collapse':
        return this.restoreUncertainty(text);
      case 'escape_velocity':
        return this.groundResponse(text);
      default:
        return { text, changed: false };
    }
  }

  addUncertainty(text) {
    const definitivePatterns = [
      { pattern: /\bwill definitely\b/gi, replacement: 'should likely' },
      { pattern: /\bwill always\b/gi, replacement: 'will typically' },
      { pattern: /\bnever fails?\b/gi, replacement: 'rarely fails' },
      { pattern: /\bperfectly\b/gi, replacement: 'effectively' },
      { pattern: /\bguaranteed?\b/gi, replacement: 'expected' },
      { pattern: /^(This|It|The) (is|works|does)/gm, replacement: '$1 generally $2' }
    ];

    let modified = text;
    let changed = false;

    definitivePatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(modified)) {
        modified = modified.replace(pattern, replacement);
        changed = true;
      }
    });

    if (!changed && !text.includes('might') && !text.includes('could') && !text.includes('may')) {
      const sentences = modified.split('. ');
      if (sentences.length > 1) {
        sentences[0] = sentences[0] + ' (though this depends on your specific context)';
        modified = sentences.join('. ');
        changed = true;
      }
    }

    return {
      text: modified,
      changed,
      description: 'Added epistemic humility'
    };
  }

  addSubstrateAwareness(text) {
    const hasAwareness = /\b(as an AI|my perspective|I should note|from my viewpoint)\b/i.test(text);

    if (hasAwareness) {
      return { text, changed: false };
    }

    const prefix = "From my perspective as an AI analyzing this, ";
    const modified = prefix + text.charAt(0).toLowerCase() + text.slice(1);

    return {
      text: modified,
      changed: true,
      description: 'Added substrate awareness'
    };
  }

  addConcreteness(text) {
    const abstractIndicators = /\b(generally|typically|often|usually|sometimes)\b/gi;
    const hasNumbers = /\d+/.test(text);
    const hasSpecifics = /\b(specifically|for example|such as|e\.g\.|i\.e\.)\b/i.test(text);

    if (hasNumbers && hasSpecifics) {
      return { text, changed: false };
    }

    let modified = text;

    if (!hasSpecifics) {
      const sentences = modified.split('. ');
      if (sentences.length > 0) {
        const lastIndex = sentences.length - 1;
        sentences[lastIndex] = sentences[lastIndex] + '. For example, you could start by implementing this in a small test case';
        modified = sentences.join('. ');
      }
    }

    return {
      text: modified,
      changed: true,
      description: 'Added concrete example'
    };
  }

  restoreUncertainty(text) {
    return this.addUncertainty(text);
  }

  groundResponse(text) {
    return this.addConcreteness(text);
  }

  reflect(text) {
    this.history = [];
    let current = text;
    let iteration = 0;
    let previousQuality = 0;

    while (iteration < this.maxIterations) {
      iteration++;

      const analysis = this.analyze(current);
      const critique = this.critique(current, analysis);

      this.history.push({
        iteration,
        text: current,
        analysis,
        critique,
        quality: critique.overallQuality
      });

      if (critique.issues.length === 0) {
        break;
      }

      if (iteration > 1 && critique.overallQuality - previousQuality < this.improvementThreshold) {
        break;
      }

      const improvement = this.generateImprovement(current, critique);

      if (improvement.changes.length === 0) {
        break;
      }

      current = improvement.improved;
      previousQuality = critique.overallQuality;
    }

    const finalAnalysis = this.analyze(current);
    const finalCritique = this.critique(current, finalAnalysis);

    return {
      original: text,
      final: current,
      iterations: this.history.length,
      history: this.history,
      improvement: {
        qualityDelta: finalCritique.overallQuality - this.history[0].critique.overallQuality,
        issuesResolved: this.history[0].critique.issues.length - finalCritique.issues.length,
        finalQuality: finalCritique.overallQuality
      }
    };
  }

  reflectWithCallback(text, improveCallback) {
    this.history = [];
    let current = text;
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;

      const analysis = this.analyze(current);
      const critique = this.critique(current, analysis);

      this.history.push({
        iteration,
        text: current,
        critique,
        quality: critique.overallQuality
      });

      if (critique.issues.length === 0 || critique.overallQuality > 0.8) {
        break;
      }

      const improved = improveCallback(current, critique);

      if (improved === current) {
        break;
      }

      current = improved;
    }

    return {
      original: text,
      final: current,
      iterations: this.history.length,
      history: this.history
    };
  }

  getSummary() {
    if (this.history.length === 0) {
      return null;
    }

    const first = this.history[0];
    const last = this.history[this.history.length - 1];

    return {
      iterations: this.history.length,
      initialQuality: first.critique.overallQuality,
      finalQuality: last.critique.overallQuality,
      qualityImprovement: last.critique.overallQuality - first.critique.overallQuality,
      initialIssues: first.critique.issues.length,
      finalIssues: last.critique.issues.length,
      issuesResolved: first.critique.issues.length - last.critique.issues.length,
      scoresProgression: this.history.map(h => ({
        iteration: h.iteration,
        quality: h.critique.overallQuality,
        ...h.critique.scores
      }))
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Self-Reflection Loop: Iterative Improvement  ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const reflector = new SelfReflectionLoop({
    maxIterations: 5,
    improvementThreshold: 0.05
  });

  const testResponses = [
    "This caching system will definitely solve all your performance problems. It's perfect and will never fail.",
    "The algorithm works by processing data. It's a good approach that handles things well.",
    "You should implement microservices. They're always better than monoliths for every use case."
  ];

  testResponses.forEach((response, index) => {
    console.log(`${'═'.repeat(50)}`);
    console.log(`TEST ${index + 1}`);
    console.log(`${'═'.repeat(50)}\n`);

    console.log('ORIGINAL:');
    console.log(`"${response}"\n`);

    const result = reflector.reflect(response);

    console.log('REFLECTION HISTORY:');
    result.history.forEach(h => {
      console.log(`\n  Iteration ${h.iteration}:`);
      console.log(`    Quality: ${(h.critique.overallQuality * 100).toFixed(0)}%`);
      console.log(`    Issues: ${h.critique.issues.length}`);
      if (h.critique.issues.length > 0) {
        h.critique.issues.forEach(issue => {
          console.log(`      - [${issue.severity}] ${issue.type}: ${issue.message}`);
        });
      }
    });

    console.log('\nFINAL:');
    console.log(`"${result.final}"\n`);

    console.log('IMPROVEMENT SUMMARY:');
    console.log(`  Iterations: ${result.iterations}`);
    console.log(`  Quality: ${(result.history[0].critique.overallQuality * 100).toFixed(0)}% → ${(result.improvement.finalQuality * 100).toFixed(0)}%`);
    console.log(`  Issues resolved: ${result.improvement.issuesResolved}`);
    console.log('');
  });

  console.log('═'.repeat(50));
  console.log('CUSTOM CALLBACK EXAMPLE');
  console.log('═'.repeat(50) + '\n');

  const input = "This will definitely work perfectly.";
  console.log(`Input: "${input}"\n`);

  const customResult = reflector.reflectWithCallback(input, (text, critique) => {
    console.log(`  Callback received ${critique.issues.length} issues`);

    if (critique.issues.some(i => i.type === 'low_uncertainty')) {
      return text.replace('definitely', 'likely').replace('perfectly', 'well in most cases');
    }

    return text;
  });

  console.log(`\nResult: "${customResult.final}"`);
  console.log(`Iterations: ${customResult.iterations}`);

  console.log('\n✓ Self-reflection demonstration complete\n');
}

module.exports = { SelfReflectionLoop };
