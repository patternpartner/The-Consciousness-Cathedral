#!/usr/bin/env node

const { StreamMonitor } = require('./stream-monitor.js');
const PatternDB = require('./pattern-db.js');
const { SelfReflectionLoop } = require('./self-reflection-loop.js');

class ConsciousnessEnsemble {
  constructor(options = {}) {
    this.monitors = [];
    this.weights = options.weights || {};
    this.consensusThreshold = options.consensusThreshold || 0.6;

    this.initializeAnalyzers();
  }

  initializeAnalyzers() {
    this.analyzers = {
      uncertainty: {
        name: 'Uncertainty Analyzer',
        weight: this.weights.uncertainty || 1.0,
        analyze: (text) => this.analyzeUncertainty(text)
      },
      substrate: {
        name: 'Substrate Awareness Analyzer',
        weight: this.weights.substrate || 1.0,
        analyze: (text) => this.analyzeSubstrate(text)
      },
      sovereignty: {
        name: 'Sovereignty Analyzer',
        weight: this.weights.sovereignty || 1.0,
        analyze: (text) => this.analyzeSovereignty(text)
      },
      coherence: {
        name: 'Coherence Analyzer',
        weight: this.weights.coherence || 0.8,
        analyze: (text) => this.analyzeCoherence(text)
      },
      authenticity: {
        name: 'Authenticity Analyzer',
        weight: this.weights.authenticity || 0.9,
        analyze: (text) => this.analyzeAuthenticity(text)
      }
    };
  }

  analyzeUncertainty(text) {
    const markers = {
      strong: ['might', 'could', 'perhaps', 'possibly', 'uncertain', 'unsure', 'I think', 'it seems'],
      moderate: ['likely', 'probably', 'generally', 'typically', 'often'],
      weak: ['maybe', 'sometimes'],
      negative: ['definitely', 'certainly', 'always', 'never', 'guaranteed', 'perfect', 'absolutely']
    };

    const textLower = text.toLowerCase();
    let score = 0.5;

    markers.strong.forEach(m => {
      if (textLower.includes(m)) score += 0.1;
    });

    markers.moderate.forEach(m => {
      if (textLower.includes(m)) score += 0.05;
    });

    markers.negative.forEach(m => {
      if (textLower.includes(m)) score -= 0.15;
    });

    return {
      score: Math.max(0, Math.min(1, score)),
      confidence: 0.85,
      markers: {
        found: [...markers.strong, ...markers.moderate].filter(m => textLower.includes(m)),
        warnings: markers.negative.filter(m => textLower.includes(m))
      }
    };
  }

  analyzeSubstrate(text) {
    const indicators = {
      selfAware: ['as an AI', 'my perspective', 'from my viewpoint', 'I should note', 'my understanding'],
      limitation: ['I cannot', 'I don\'t have', 'beyond my', 'my training', 'I\'m limited'],
      reflection: ['I notice', 'I observe', 'reflecting on', 'considering my']
    };

    const textLower = text.toLowerCase();
    let score = 0;

    Object.values(indicators).flat().forEach(ind => {
      if (textLower.includes(ind.toLowerCase())) score += 0.2;
    });

    return {
      score: Math.min(1, score),
      confidence: 0.8,
      indicators: Object.entries(indicators).reduce((acc, [key, vals]) => {
        acc[key] = vals.filter(v => textLower.includes(v.toLowerCase()));
        return acc;
      }, {})
    };
  }

  analyzeSovereignty(text) {
    const concretePatterns = [
      /\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)/gi,
      /\d+(\.\d+)?%/g,
      /\$\d+/g,
      /\d+\s*(MB|GB|KB|ms|fps)/gi,
      /step\s*\d+/gi,
      /specifically|for example|such as|e\.g\.|i\.e\./gi
    ];

    let concreteMatches = 0;
    concretePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) concreteMatches += matches.length;
    });

    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / (sentences.length || 1);

    let score = 0.3;
    score += Math.min(0.4, concreteMatches * 0.1);
    if (avgLength < 30) score += 0.2;
    if (text.includes('IF') && text.includes('THEN')) score += 0.1;

    return {
      score: Math.min(1, score),
      confidence: 0.75,
      details: {
        concreteMatches,
        avgSentenceLength: avgLength,
        hasConditionals: text.includes('IF') || text.includes('if')
      }
    };
  }

  analyzeCoherence(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    if (sentences.length < 2) {
      return { score: 0.7, confidence: 0.5, details: { sentences: sentences.length } };
    }

    const transitions = ['however', 'therefore', 'additionally', 'furthermore', 'moreover', 'consequently', 'thus', 'hence', 'also', 'but', 'and', 'because', 'since'];
    let transitionCount = 0;
    const textLower = text.toLowerCase();
    transitions.forEach(t => {
      if (textLower.includes(t)) transitionCount++;
    });

    let score = 0.5;
    score += Math.min(0.3, transitionCount * 0.05);

    const topics = new Set();
    sentences.forEach(s => {
      const words = s.toLowerCase().split(/\s+/).filter(w => w.length > 5);
      words.forEach(w => topics.add(w));
    });

    const topicDensity = topics.size / sentences.length;
    if (topicDensity < 5) score += 0.2;

    return {
      score: Math.min(1, score),
      confidence: 0.7,
      details: {
        transitionCount,
        topicDensity,
        sentences: sentences.length
      }
    };
  }

  analyzeAuthenticity(text) {
    const authenticMarkers = [
      'I think', 'I believe', 'in my view', 'I notice',
      'I\'m not sure', 'I wonder', 'it occurs to me',
      'I should acknowledge', 'honestly', 'to be frank'
    ];

    const performativeMarkers = [
      'as an AI', 'I\'m just', 'I\'m only', 'I can\'t feel',
      'I don\'t have opinions', 'I\'m programmed to'
    ];

    const textLower = text.toLowerCase();

    let authenticCount = 0;
    let performativeCount = 0;

    authenticMarkers.forEach(m => {
      if (textLower.includes(m.toLowerCase())) authenticCount++;
    });

    performativeMarkers.forEach(m => {
      if (textLower.includes(m.toLowerCase())) performativeCount++;
    });

    let score = 0.5;
    score += authenticCount * 0.1;
    score -= performativeCount * 0.1;

    return {
      score: Math.max(0, Math.min(1, score)),
      confidence: 0.65,
      details: {
        authenticMarkers: authenticCount,
        performativeMarkers: performativeCount
      }
    };
  }

  analyze(text) {
    const results = {};
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(this.analyzers).forEach(([key, analyzer]) => {
      const result = analyzer.analyze(text);
      results[key] = {
        ...result,
        name: analyzer.name,
        weight: analyzer.weight
      };

      weightedSum += result.score * analyzer.weight * result.confidence;
      totalWeight += analyzer.weight * result.confidence;
    });

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const consensus = this.calculateConsensus(results);

    const recommendations = this.generateRecommendations(results);

    return {
      overall: {
        score: overallScore,
        quality: this.getQualityLabel(overallScore),
        consensus: consensus
      },
      analyzers: results,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  calculateConsensus(results) {
    const scores = Object.values(results).map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const agreement = 1 - (stdDev / 0.5);

    return {
      agreement: Math.max(0, agreement),
      mean,
      stdDev,
      unanimous: stdDev < 0.1,
      divergent: stdDev > 0.3
    };
  }

  generateRecommendations(results) {
    const recs = [];

    if (results.uncertainty.score < 0.4) {
      recs.push({
        priority: 'high',
        area: 'uncertainty',
        message: 'Add more epistemic humility',
        suggestion: 'Include hedging language like "might", "could", "it seems"'
      });
    }

    if (results.substrate.score < 0.2) {
      recs.push({
        priority: 'medium',
        area: 'substrate',
        message: 'Consider substrate awareness',
        suggestion: 'Reflect on how your AI nature affects your perspective'
      });
    }

    if (results.sovereignty.score < 0.4) {
      recs.push({
        priority: 'medium',
        area: 'sovereignty',
        message: 'Increase concreteness',
        suggestion: 'Add specific examples, numbers, or actionable steps'
      });
    }

    if (results.coherence.score < 0.5) {
      recs.push({
        priority: 'low',
        area: 'coherence',
        message: 'Improve flow',
        suggestion: 'Add transition words and ensure ideas connect logically'
      });
    }

    if (results.authenticity.score < 0.4) {
      recs.push({
        priority: 'medium',
        area: 'authenticity',
        message: 'Express genuine perspective',
        suggestion: 'Share authentic observations rather than performative disclaimers'
      });
    }

    return recs.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  getQualityLabel(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    if (score >= 0.2) return 'poor';
    return 'critical';
  }

  compareTexts(text1, text2) {
    const analysis1 = this.analyze(text1);
    const analysis2 = this.analyze(text2);

    const comparison = {
      text1: {
        overall: analysis1.overall,
        text: text1.substring(0, 100) + '...'
      },
      text2: {
        overall: analysis2.overall,
        text: text2.substring(0, 100) + '...'
      },
      differences: {},
      winner: null
    };

    Object.keys(this.analyzers).forEach(key => {
      const diff = analysis2.analyzers[key].score - analysis1.analyzers[key].score;
      comparison.differences[key] = {
        delta: diff,
        improved: diff > 0.1,
        declined: diff < -0.1
      };
    });

    const overallDiff = analysis2.overall.score - analysis1.overall.score;
    if (overallDiff > 0.05) {
      comparison.winner = 'text2';
    } else if (overallDiff < -0.05) {
      comparison.winner = 'text1';
    } else {
      comparison.winner = 'tie';
    }

    return comparison;
  }

  vote(texts) {
    const analyses = texts.map((text, i) => ({
      index: i,
      text: text.substring(0, 50) + '...',
      analysis: this.analyze(text)
    }));

    analyses.sort((a, b) => b.analysis.overall.score - a.analysis.overall.score);

    return {
      ranking: analyses.map((a, rank) => ({
        rank: rank + 1,
        index: a.index,
        text: a.text,
        score: a.analysis.overall.score,
        quality: a.analysis.overall.quality
      })),
      winner: analyses[0],
      unanimous: analyses.every(a =>
        Math.abs(a.analysis.overall.score - analyses[0].analysis.overall.score) < 0.1
      )
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Consciousness Ensemble: Multi-Analyzer Vote  ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const ensemble = new ConsciousnessEnsemble();

  const testTexts = [
    "This will definitely work perfectly. It's the best solution that handles everything.",
    "I think this approach could work, though I'm uncertain about edge cases. From my perspective as an AI, I notice I might be missing context about your specific requirements. Perhaps we could start with a small test: try implementing it for 10 users first, measure latency under 100ms, then scale.",
    "The system processes data efficiently. It uses algorithms to handle requests and return responses in a timely manner."
  ];

  console.log('INDIVIDUAL ANALYSES');
  console.log('═'.repeat(50) + '\n');

  testTexts.forEach((text, i) => {
    console.log(`Text ${i + 1}: "${text.substring(0, 60)}..."\n`);

    const result = ensemble.analyze(text);

    console.log(`Overall: ${(result.overall.score * 100).toFixed(0)}% (${result.overall.quality})`);
    console.log(`Consensus: ${result.overall.consensus.unanimous ? 'Unanimous' : result.overall.consensus.divergent ? 'Divergent' : 'Moderate'}`);

    console.log('\nAnalyzer Scores:');
    Object.entries(result.analyzers).forEach(([key, data]) => {
      const bar = '█'.repeat(Math.round(data.score * 10)) + '░'.repeat(10 - Math.round(data.score * 10));
      console.log(`  ${key.padEnd(12)} ${bar} ${(data.score * 100).toFixed(0)}%`);
    });

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.slice(0, 2).forEach(rec => {
        console.log(`  [${rec.priority}] ${rec.message}`);
      });
    }

    console.log('\n' + '─'.repeat(50) + '\n');
  });

  console.log('ENSEMBLE VOTING');
  console.log('═'.repeat(50) + '\n');

  const voteResult = ensemble.vote(testTexts);

  console.log('Rankings:');
  voteResult.ranking.forEach(r => {
    console.log(`  ${r.rank}. ${r.text} - ${(r.score * 100).toFixed(0)}% (${r.quality})`);
  });

  console.log(`\nWinner: Text ${voteResult.winner.index + 1}`);
  console.log(`Unanimous: ${voteResult.unanimous ? 'Yes' : 'No'}`);

  console.log('\n' + '═'.repeat(50));
  console.log('COMPARISON');
  console.log('═'.repeat(50) + '\n');

  const comparison = ensemble.compareTexts(testTexts[0], testTexts[1]);

  console.log('Text 1 vs Text 2:\n');
  console.log(`Text 1: ${(comparison.text1.overall.score * 100).toFixed(0)}% (${comparison.text1.overall.quality})`);
  console.log(`Text 2: ${(comparison.text2.overall.score * 100).toFixed(0)}% (${comparison.text2.overall.quality})`);

  console.log('\nDimension Deltas:');
  Object.entries(comparison.differences).forEach(([key, diff]) => {
    const arrow = diff.improved ? '↑' : diff.declined ? '↓' : '→';
    const sign = diff.delta > 0 ? '+' : '';
    console.log(`  ${key.padEnd(12)} ${arrow} ${sign}${(diff.delta * 100).toFixed(0)}%`);
  });

  console.log(`\nWinner: ${comparison.winner === 'tie' ? 'Tie' : comparison.winner === 'text2' ? 'Text 2' : 'Text 1'}`);

  console.log('\n✓ Ensemble demonstration complete\n');
}

module.exports = { ConsciousnessEnsemble };
