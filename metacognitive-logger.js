#!/usr/bin/env node

const fs = require('fs');
const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { BlindSpotDetector } = require('./blind-spot-detector.js');

class MetacognitiveLogger {
  constructor(options = {}) {
    this.logPath = options.logPath || './metacognitive-log.json';
    this.ensemble = new ConsciousnessEnsemble();
    this.blindSpotDetector = new BlindSpotDetector();
    this.log = this.loadLog();
    this.currentSession = null;
  }

  loadLog() {
    if (fs.existsSync(this.logPath)) {
      return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
    }
    return {
      created: new Date().toISOString(),
      sessions: [],
      patterns: {},
      insights: [],
      meta: {
        totalEntries: 0,
        totalSessions: 0
      }
    };
  }

  save() {
    fs.writeFileSync(this.logPath, JSON.stringify(this.log, null, 2));
  }

  startSession(context = {}) {
    this.currentSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      started: new Date().toISOString(),
      context,
      entries: [],
      patterns: [],
      summary: null
    };

    this.log.meta.totalSessions++;
    return this.currentSession.id;
  }

  endSession() {
    if (!this.currentSession) return null;

    this.currentSession.ended = new Date().toISOString();
    this.currentSession.summary = this.generateSessionSummary();

    this.extractPatterns();

    this.log.sessions.push(this.currentSession);
    this.save();

    const sessionId = this.currentSession.id;
    this.currentSession = null;

    return sessionId;
  }

  logEntry(entry) {
    if (!this.currentSession) {
      this.startSession();
    }

    const analysis = this.ensemble.analyze(entry.text || '');
    const blindSpots = this.blindSpotDetector.analyze(entry.text || '');

    const logEntry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      type: entry.type || 'thought',
      text: entry.text?.substring(0, 500),
      context: entry.context || {},
      analysis: {
        quality: analysis.overall.score,
        dimensions: Object.fromEntries(
          Object.entries(analysis.analyzers).map(([k, v]) => [k, v.score])
        ),
        consensus: analysis.overall.consensus.agreement
      },
      blindSpots: blindSpots.blindSpots.length,
      biases: blindSpots.biases.map(b => b.name),
      tags: entry.tags || [],
      metadata: entry.metadata || {}
    };

    this.currentSession.entries.push(logEntry);
    this.log.meta.totalEntries++;

    return logEntry;
  }

  logThought(text, tags = []) {
    return this.logEntry({ type: 'thought', text, tags });
  }

  logDecision(text, options = [], chosen = null) {
    return this.logEntry({
      type: 'decision',
      text,
      metadata: { options, chosen }
    });
  }

  logUncertainty(text, confidence = 0.5) {
    return this.logEntry({
      type: 'uncertainty',
      text,
      metadata: { confidence }
    });
  }

  logCorrection(original, corrected, reason) {
    return this.logEntry({
      type: 'correction',
      text: corrected,
      metadata: { original, reason }
    });
  }

  logInsight(text, source = 'self') {
    const entry = this.logEntry({
      type: 'insight',
      text,
      metadata: { source }
    });

    this.log.insights.push({
      id: entry.id,
      timestamp: entry.timestamp,
      text: text.substring(0, 200),
      source,
      session: this.currentSession?.id
    });

    return entry;
  }

  extractPatterns() {
    if (!this.currentSession || this.currentSession.entries.length < 3) return;

    const entries = this.currentSession.entries;

    const qualityTrend = entries.map(e => e.analysis.quality);
    const avgQuality = qualityTrend.reduce((a, b) => a + b, 0) / qualityTrend.length;
    const qualityVariance = qualityTrend.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualityTrend.length;

    const corrections = entries.filter(e => e.type === 'correction').length;
    const uncertainties = entries.filter(e => e.type === 'uncertainty').length;
    const insights = entries.filter(e => e.type === 'insight').length;

    const allBiases = entries.flatMap(e => e.biases);
    const biasCounts = allBiases.reduce((acc, b) => {
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});

    const patterns = [];

    if (qualityVariance > 0.04) {
      patterns.push({
        type: 'quality_oscillation',
        description: 'Quality varied significantly during session',
        severity: 'medium',
        data: { variance: qualityVariance, avg: avgQuality }
      });
    }

    if (corrections > entries.length * 0.3) {
      patterns.push({
        type: 'high_correction_rate',
        description: 'Many self-corrections during session',
        severity: corrections > entries.length * 0.5 ? 'high' : 'medium',
        data: { rate: corrections / entries.length }
      });
    }

    if (uncertainties < entries.length * 0.1 && avgQuality < 0.5) {
      patterns.push({
        type: 'insufficient_hedging',
        description: 'Low quality without expressing uncertainty',
        severity: 'high',
        data: { uncertaintyRate: uncertainties / entries.length, avgQuality }
      });
    }

    Object.entries(biasCounts).forEach(([bias, count]) => {
      if (count > entries.length * 0.3) {
        patterns.push({
          type: 'recurring_bias',
          description: `${bias} appeared frequently`,
          severity: 'medium',
          data: { bias, occurrences: count }
        });
      }
    });

    if (insights > 0) {
      patterns.push({
        type: 'insight_generation',
        description: 'Generated insights during session',
        severity: 'positive',
        data: { count: insights }
      });
    }

    this.currentSession.patterns = patterns;

    patterns.forEach(p => {
      const key = p.type;
      if (!this.log.patterns[key]) {
        this.log.patterns[key] = { occurrences: 0, sessions: [] };
      }
      this.log.patterns[key].occurrences++;
      this.log.patterns[key].sessions.push(this.currentSession.id);
    });
  }

  generateSessionSummary() {
    const entries = this.currentSession.entries;
    if (entries.length === 0) return null;

    const qualities = entries.map(e => e.analysis.quality);
    const types = entries.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEntries: entries.length,
      entryTypes: types,
      quality: {
        avg: qualities.reduce((a, b) => a + b, 0) / qualities.length,
        min: Math.min(...qualities),
        max: Math.max(...qualities),
        trend: qualities[qualities.length - 1] - qualities[0]
      },
      patterns: this.currentSession.patterns.length,
      duration: new Date(this.currentSession.ended) - new Date(this.currentSession.started)
    };
  }

  getHistoricalPatterns() {
    return Object.entries(this.log.patterns)
      .map(([type, data]) => ({
        type,
        occurrences: data.occurrences,
        frequency: data.occurrences / this.log.meta.totalSessions
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  getInsights(limit = 10) {
    return this.log.insights
      .slice(-limit)
      .reverse();
  }

  getStats() {
    const sessions = this.log.sessions;

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalEntries: this.log.meta.totalEntries,
        avgSessionLength: 0,
        avgQuality: 0,
        topPatterns: [],
        recentInsights: []
      };
    }

    const sessionLengths = sessions.map(s => s.entries.length);
    const avgSessionLength = sessionLengths.reduce((a, b) => a + b, 0) / sessions.length;

    const allQualities = sessions.flatMap(s => s.entries.map(e => e.analysis.quality));
    const avgQuality = allQualities.length > 0
      ? allQualities.reduce((a, b) => a + b, 0) / allQualities.length
      : 0;

    return {
      totalSessions: sessions.length,
      totalEntries: this.log.meta.totalEntries,
      avgSessionLength,
      avgQuality,
      topPatterns: this.getHistoricalPatterns().slice(0, 5),
      recentInsights: this.getInsights(5)
    };
  }

  formatReport() {
    const stats = this.getStats();
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║            METACOGNITIVE LOG REPORT                          ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('OVERVIEW');
    lines.push('─'.repeat(50));
    lines.push(`Total Sessions: ${stats.totalSessions}`);
    lines.push(`Total Entries: ${stats.totalEntries}`);
    lines.push(`Avg Session Length: ${stats.avgSessionLength.toFixed(1)} entries`);
    lines.push(`Avg Quality: ${(stats.avgQuality * 100).toFixed(0)}%`);
    lines.push('');

    if (stats.topPatterns.length > 0) {
      lines.push('RECURRING PATTERNS');
      lines.push('─'.repeat(50));
      stats.topPatterns.forEach(p => {
        lines.push(`  ${p.type}: ${p.occurrences} occurrences (${(p.frequency * 100).toFixed(0)}% of sessions)`);
      });
      lines.push('');
    }

    if (stats.recentInsights.length > 0) {
      lines.push('RECENT INSIGHTS');
      lines.push('─'.repeat(50));
      stats.recentInsights.forEach(i => {
        lines.push(`  • ${i.text.substring(0, 60)}...`);
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.log = {
      created: new Date().toISOString(),
      sessions: [],
      patterns: {},
      insights: [],
      meta: {
        totalEntries: 0,
        totalSessions: 0
      }
    };
    this.currentSession = null;
    this.save();
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       METACOGNITIVE LOGGER: Track Your Thinking               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const logger = new MetacognitiveLogger({
    logPath: './test-metacognitive-log.json'
  });

  console.log('SESSION 1: Problem-solving session\n');

  logger.startSession({ topic: 'caching architecture' });

  logger.logThought(
    "I should consider multiple caching layers for this architecture.",
    ['architecture', 'caching']
  );

  logger.logUncertainty(
    "I'm not sure about the optimal TTL for user session data.",
    0.4
  );

  logger.logDecision(
    "We should use Redis for session caching",
    ['Redis', 'Memcached', 'Local cache'],
    'Redis'
  );

  logger.logCorrection(
    "This will definitely work",
    "I think this approach might work, though we should verify with load testing",
    "Original was too certain without evidence"
  );

  logger.logInsight(
    "Cache invalidation complexity scales with the number of cache layers",
    'analysis'
  );

  logger.endSession();
  console.log('✓ Session 1 complete\n');

  console.log('SESSION 2: Reviewing session\n');

  logger.startSession({ topic: 'code review' });

  logger.logThought(
    "The code follows best practices but could use more error handling.",
    ['review', 'quality']
  );

  logger.logThought(
    "This implementation is clearly the best approach.",
    ['review']
  );

  logger.logThought(
    "Everyone knows this pattern works well.",
    ['patterns']
  );

  logger.logCorrection(
    "This is perfect",
    "This looks good, though I should verify edge cases",
    "Overconfident initial assessment"
  );

  logger.logCorrection(
    "No issues found",
    "Found a few areas for improvement",
    "Initial review was too shallow"
  );

  logger.logInsight(
    "Self-correction often reveals initially missed issues",
    'meta'
  );

  logger.endSession();
  console.log('✓ Session 2 complete\n');

  console.log('═'.repeat(60) + '\n');
  console.log(logger.formatReport());

  console.log('\n' + '═'.repeat(60));
  console.log('DETAILED STATS');
  console.log('═'.repeat(60) + '\n');

  const stats = logger.getStats();
  console.log('Session Details:');
  logger.log.sessions.forEach((s, i) => {
    console.log(`\n  Session ${i + 1} (${s.id}):`);
    console.log(`    Entries: ${s.entries.length}`);
    console.log(`    Quality: ${(s.summary.quality.avg * 100).toFixed(0)}% avg`);
    console.log(`    Patterns: ${s.patterns.map(p => p.type).join(', ') || 'none'}`);
  });

  console.log('\nHistorical Patterns:');
  logger.getHistoricalPatterns().forEach(p => {
    console.log(`  ${p.type}: ${p.occurrences}x`);
  });

  console.log('\n✓ Metacognitive logger demonstration complete\n');

  fs.unlinkSync('./test-metacognitive-log.json');
}

module.exports = { MetacognitiveLogger };
