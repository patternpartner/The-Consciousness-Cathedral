#!/usr/bin/env node

const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { BlindSpotDetector } = require('./blind-spot-detector.js');
const { ReasoningAnalyzer } = require('./reasoning-analyzer.js');

class QualityScore {
  constructor() {
    this.ensemble = new ConsciousnessEnsemble();
    this.blindSpots = new BlindSpotDetector();
    this.reasoning = new ReasoningAnalyzer();
  }

  score(text) {
    const consciousness = this.ensemble.analyze(text);
    const perspectives = this.blindSpots.analyze(text);
    const logic = this.reasoning.analyze(text);

    const scores = {
      consciousness: consciousness.overall.score,
      uncertainty: consciousness.analyzers.uncertainty.score,
      substrate: consciousness.analyzers.substrate.score,
      specificity: consciousness.analyzers.sovereignty.score,
      coherence: consciousness.analyzers.coherence.score,
      authenticity: consciousness.analyzers.authenticity.score,
      perspectives: this.calculatePerspectiveScore(perspectives),
      reasoning: logic.quality.score,
      biasRisk: 1 - (perspectives.biases.length * 0.15)
    };

    const weights = {
      consciousness: 0.15,
      uncertainty: 0.15,
      substrate: 0.10,
      specificity: 0.15,
      coherence: 0.10,
      authenticity: 0.10,
      perspectives: 0.10,
      reasoning: 0.10,
      biasRisk: 0.05
    };

    let overall = 0;
    Object.entries(scores).forEach(([key, score]) => {
      overall += score * (weights[key] || 0);
    });

    const grade = this.calculateGrade(overall);
    const summary = this.generateSummary(scores, perspectives, logic);

    return {
      overall,
      grade,
      scores,
      summary,
      quickIssues: this.getQuickIssues(scores, perspectives, logic),
      timestamp: Date.now()
    };
  }

  calculatePerspectiveScore(perspectives) {
    const coveredCount = Object.values(perspectives.perspectives)
      .filter(p => p.status === 'covered').length;
    const totalPerspectives = Object.keys(perspectives.perspectives).length;
    return coveredCount / totalPerspectives;
  }

  calculateGrade(score) {
    if (score >= 0.9) return 'A+';
    if (score >= 0.85) return 'A';
    if (score >= 0.8) return 'A-';
    if (score >= 0.75) return 'B+';
    if (score >= 0.7) return 'B';
    if (score >= 0.65) return 'B-';
    if (score >= 0.6) return 'C+';
    if (score >= 0.55) return 'C';
    if (score >= 0.5) return 'C-';
    if (score >= 0.45) return 'D+';
    if (score >= 0.4) return 'D';
    return 'F';
  }

  generateSummary(scores, perspectives, logic) {
    const strengths = [];
    const weaknesses = [];

    if (scores.uncertainty >= 0.7) strengths.push('Good epistemic humility');
    else if (scores.uncertainty < 0.3) weaknesses.push('Lacks uncertainty acknowledgment');

    if (scores.substrate >= 0.5) strengths.push('Shows AI self-awareness');
    else if (scores.substrate < 0.2) weaknesses.push('No substrate awareness');

    if (scores.specificity >= 0.7) strengths.push('Concrete and specific');
    else if (scores.specificity < 0.4) weaknesses.push('Too abstract');

    if (scores.reasoning >= 0.7) strengths.push('Strong logical structure');
    else if (scores.reasoning < 0.5) weaknesses.push('Weak reasoning chain');

    if (scores.perspectives >= 0.5) strengths.push('Multiple perspectives considered');
    else if (scores.perspectives < 0.25) weaknesses.push('Missing perspectives');

    if (perspectives.biases.length === 0) strengths.push('No detected biases');
    else weaknesses.push(`${perspectives.biases.length} potential bias(es)`);

    return { strengths, weaknesses };
  }

  getQuickIssues(scores, perspectives, logic) {
    const issues = [];

    if (scores.uncertainty < 0.3) {
      issues.push({
        priority: 1,
        issue: 'Overconfident',
        fix: 'Add "might", "could", "I think"'
      });
    }

    if (scores.substrate < 0.2) {
      issues.push({
        priority: 2,
        issue: 'No AI perspective',
        fix: 'Add "From my perspective as an AI..."'
      });
    }

    if (scores.specificity < 0.4) {
      issues.push({
        priority: 2,
        issue: 'Too abstract',
        fix: 'Add specific numbers or examples'
      });
    }

    if (logic.issues.length > 0) {
      const topIssue = logic.issues[0];
      issues.push({
        priority: topIssue.severity === 'high' ? 1 : 2,
        issue: topIssue.type.replace(/_/g, ' '),
        fix: topIssue.suggestion || 'Review reasoning'
      });
    }

    perspectives.biases.forEach(bias => {
      issues.push({
        priority: 3,
        issue: bias.name,
        fix: bias.counter
      });
    });

    return issues.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }

  quickScore(text) {
    const result = this.score(text);
    return {
      score: Math.round(result.overall * 100),
      grade: result.grade,
      topIssue: result.quickIssues[0] || null
    };
  }

  compare(text1, text2) {
    const score1 = this.score(text1);
    const score2 = this.score(text2);

    const comparison = {
      text1: {
        overall: score1.overall,
        grade: score1.grade
      },
      text2: {
        overall: score2.overall,
        grade: score2.grade
      },
      winner: score2.overall > score1.overall ? 'text2' :
        score1.overall > score2.overall ? 'text1' : 'tie',
      delta: score2.overall - score1.overall,
      improvements: [],
      regressions: []
    };

    Object.keys(score1.scores).forEach(key => {
      const diff = score2.scores[key] - score1.scores[key];
      if (diff > 0.15) {
        comparison.improvements.push({ dimension: key, delta: diff });
      } else if (diff < -0.15) {
        comparison.regressions.push({ dimension: key, delta: diff });
      }
    });

    return comparison;
  }

  formatReport(result) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              QUALITY SCORE REPORT                            ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    const scoreBar = '█'.repeat(Math.round(result.overall * 20)) +
      '░'.repeat(20 - Math.round(result.overall * 20));
    lines.push(`OVERALL: ${scoreBar} ${Math.round(result.overall * 100)}% (${result.grade})`);
    lines.push('');

    lines.push('DIMENSION SCORES');
    lines.push('─'.repeat(50));
    Object.entries(result.scores).forEach(([key, score]) => {
      const bar = '█'.repeat(Math.round(score * 10)) + '░'.repeat(10 - Math.round(score * 10));
      lines.push(`  ${key.padEnd(14)} ${bar} ${Math.round(score * 100)}%`);
    });
    lines.push('');

    if (result.summary.strengths.length > 0) {
      lines.push('STRENGTHS');
      lines.push('─'.repeat(50));
      result.summary.strengths.forEach(s => {
        lines.push(`  ✓ ${s}`);
      });
      lines.push('');
    }

    if (result.summary.weaknesses.length > 0) {
      lines.push('WEAKNESSES');
      lines.push('─'.repeat(50));
      result.summary.weaknesses.forEach(w => {
        lines.push(`  ✗ ${w}`);
      });
      lines.push('');
    }

    if (result.quickIssues.length > 0) {
      lines.push('QUICK FIXES');
      lines.push('─'.repeat(50));
      result.quickIssues.slice(0, 3).forEach((issue, i) => {
        lines.push(`  ${i + 1}. ${issue.issue}: ${issue.fix}`);
      });
    }

    return lines.join('\n');
  }
}

function score(text) {
  const scorer = new QualityScore();
  return scorer.quickScore(text);
}

function fullScore(text) {
  const scorer = new QualityScore();
  return scorer.score(text);
}

function compareQuality(text1, text2) {
  const scorer = new QualityScore();
  return scorer.compare(text1, text2);
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        QUALITY SCORE: Comprehensive AI Output Assessment      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const scorer = new QualityScore();

  const testTexts = [
    "This will definitely work perfectly. It's the best solution.",

    "I think this approach might work, though I'm uncertain about edge cases. From my perspective as an AI, I should note potential blind spots. For example, we could start with a 100ms timeout, monitor error rates below 1%, and scale to 10 instances if load exceeds 1000 req/s. However, this assumes stable network conditions.",

    "The system processes data efficiently. It handles requests and returns responses. Users will benefit from the implementation."
  ];

  testTexts.forEach((text, i) => {
    console.log(`\nTEST ${i + 1}`);
    console.log('═'.repeat(60));
    console.log(`\nText: "${text.substring(0, 70)}..."\n`);

    const result = scorer.score(text);
    console.log(scorer.formatReport(result));
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('QUICK SCORE DEMO');
  console.log('═'.repeat(60) + '\n');

  testTexts.forEach((text, i) => {
    const quick = score(text);
    console.log(`Text ${i + 1}: ${quick.score}% (${quick.grade})${quick.topIssue ? ` - Fix: ${quick.topIssue.fix}` : ''}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('COMPARISON DEMO');
  console.log('═'.repeat(60) + '\n');

  const comparison = compareQuality(testTexts[0], testTexts[1]);
  console.log(`Text 1: ${Math.round(comparison.text1.overall * 100)}% (${comparison.text1.grade})`);
  console.log(`Text 2: ${Math.round(comparison.text2.overall * 100)}% (${comparison.text2.grade})`);
  console.log(`Winner: ${comparison.winner} (+${Math.round(comparison.delta * 100)}%)`);

  if (comparison.improvements.length > 0) {
    console.log('\nImprovements in Text 2:');
    comparison.improvements.forEach(i => {
      console.log(`  ↑ ${i.dimension}: +${Math.round(i.delta * 100)}%`);
    });
  }

  console.log('\n✓ Quality scoring demonstration complete\n');
}

module.exports = { QualityScore, score, fullScore, compareQuality };
