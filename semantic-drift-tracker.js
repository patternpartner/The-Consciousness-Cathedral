#!/usr/bin/env node

class SemanticDriftTracker {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 5;
    this.driftThreshold = options.driftThreshold || 0.3;
    this.history = [];
    this.topicHistory = [];
    this.alerts = [];
  }

  extractKeyTerms(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they',
      'their', 'what', 'when', 'where', 'which', 'while', 'about',
      'would', 'could', 'should', 'there', 'these', 'those', 'being',
      'some', 'than', 'then', 'them', 'into', 'only', 'other', 'such',
      'more', 'most', 'also', 'just', 'over', 'your', 'very', 'will'
    ]);

    const filtered = words.filter(w => !stopWords.has(w));

    const counts = {};
    filtered.forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([term, count]) => ({ term, count, weight: count / filtered.length }));
  }

  extractTopics(text) {
    const topics = [];
    const lower = text.toLowerCase();

    const domainPatterns = {
      'architecture': /\b(microservice|monolith|distributed|scalab|architect)/,
      'performance': /\b(performance|latency|throughput|cache|optimiz)/,
      'security': /\b(security|auth|encrypt|vulnerab|attack)/,
      'database': /\b(database|query|sql|nosql|mongo|postgres)/,
      'testing': /\b(test|coverage|unit|integration|mock)/,
      'deployment': /\b(deploy|kubernetes|docker|ci\/cd|pipeline)/,
      'api': /\b(api|endpoint|rest|graphql|request)/,
      'frontend': /\b(frontend|react|vue|angular|component)/,
      'backend': /\b(backend|server|node|python|java)/,
      'data': /\b(data|analytics|machine learning|model|train)/
    };

    Object.entries(domainPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(lower)) {
        topics.push(topic);
      }
    });

    return topics;
  }

  calculateSimilarity(terms1, terms2) {
    if (terms1.length === 0 || terms2.length === 0) return 0;

    const set1 = new Set(terms1.map(t => t.term));
    const set2 = new Set(terms2.map(t => t.term));

    const intersection = [...set1].filter(t => set2.has(t)).length;
    const union = new Set([...set1, ...set2]).size;

    return union > 0 ? intersection / union : 0;
  }

  track(text, metadata = {}) {
    const terms = this.extractKeyTerms(text);
    const topics = this.extractTopics(text);

    const entry = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      text: text.substring(0, 200),
      terms,
      topics,
      metadata,
      drift: null,
      similarity: null
    };

    if (this.history.length > 0) {
      const previous = this.history[this.history.length - 1];
      entry.similarity = this.calculateSimilarity(terms, previous.terms);
      entry.drift = 1 - entry.similarity;

      const windowStart = Math.max(0, this.history.length - this.windowSize);
      const window = this.history.slice(windowStart);
      const avgSimilarity = window.reduce((sum, e) => {
        return sum + this.calculateSimilarity(terms, e.terms);
      }, 0) / window.length;

      entry.windowDrift = 1 - avgSimilarity;

      if (entry.drift > this.driftThreshold) {
        this.alerts.push({
          type: 'sudden_drift',
          timestamp: entry.timestamp,
          drift: entry.drift,
          message: `Sudden topic shift detected (${(entry.drift * 100).toFixed(0)}% drift)`
        });
      }

      const topicShift = this.detectTopicShift(topics);
      if (topicShift) {
        this.alerts.push({
          type: 'topic_shift',
          timestamp: entry.timestamp,
          from: topicShift.from,
          to: topicShift.to,
          message: `Topic shifted from ${topicShift.from.join(', ')} to ${topicShift.to.join(', ')}`
        });
      }
    }

    this.history.push(entry);
    this.topicHistory.push(topics);

    return entry;
  }

  detectTopicShift(currentTopics) {
    if (this.topicHistory.length < 2) return null;

    const recent = this.topicHistory.slice(-3);
    const recentTopics = new Set(recent.flat());
    const currentSet = new Set(currentTopics);

    const newTopics = currentTopics.filter(t => !recentTopics.has(t));
    const droppedTopics = [...recentTopics].filter(t => !currentSet.has(t));

    if (newTopics.length > 0 && droppedTopics.length > 0) {
      return {
        from: droppedTopics,
        to: newTopics
      };
    }

    return null;
  }

  getTrajectory() {
    if (this.history.length < 2) {
      return { status: 'insufficient_data', points: [] };
    }

    const points = this.history.map((entry, i) => ({
      index: i,
      drift: entry.drift || 0,
      windowDrift: entry.windowDrift || 0,
      topics: entry.topics
    }));

    const drifts = points.map(p => p.drift).filter(d => d !== null);
    const avgDrift = drifts.reduce((a, b) => a + b, 0) / drifts.length;
    const maxDrift = Math.max(...drifts);

    let trend = 'stable';
    if (drifts.length >= 3) {
      const recentDrifts = drifts.slice(-3);
      const earlierDrifts = drifts.slice(0, -3);

      if (earlierDrifts.length > 0) {
        const recentAvg = recentDrifts.reduce((a, b) => a + b, 0) / recentDrifts.length;
        const earlierAvg = earlierDrifts.reduce((a, b) => a + b, 0) / earlierDrifts.length;

        if (recentAvg > earlierAvg + 0.1) trend = 'increasing_drift';
        else if (recentAvg < earlierAvg - 0.1) trend = 'stabilizing';
      }
    }

    return {
      status: 'tracked',
      points,
      avgDrift,
      maxDrift,
      trend,
      totalEntries: this.history.length
    };
  }

  getTopicProgression() {
    if (this.topicHistory.length === 0) return [];

    const progression = [];
    let currentTopics = [];

    this.topicHistory.forEach((topics, i) => {
      const newTopics = topics.filter(t => !currentTopics.includes(t));
      const removedTopics = currentTopics.filter(t => !topics.includes(t));

      if (newTopics.length > 0 || removedTopics.length > 0) {
        progression.push({
          index: i,
          added: newTopics,
          removed: removedTopics,
          current: topics
        });
      }

      currentTopics = topics;
    });

    return progression;
  }

  getCoherence() {
    if (this.history.length < 3) {
      return { score: null, message: 'Need at least 3 entries' };
    }

    const similarities = this.history.slice(1).map(e => e.similarity || 0);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    const variance = similarities.reduce((sum, s) =>
      sum + Math.pow(s - avgSimilarity, 2), 0) / similarities.length;
    const stability = 1 - Math.sqrt(variance);

    const coherenceScore = (avgSimilarity * 0.6) + (stability * 0.4);

    return {
      score: coherenceScore,
      avgSimilarity,
      stability,
      interpretation: coherenceScore > 0.7 ? 'highly coherent' :
        coherenceScore > 0.5 ? 'moderately coherent' :
          coherenceScore > 0.3 ? 'somewhat scattered' : 'incoherent'
    };
  }

  getAlerts(since = 0) {
    return this.alerts.filter(a => a.timestamp > since);
  }

  formatReport() {
    const lines = [];
    const trajectory = this.getTrajectory();
    const coherence = this.getCoherence();
    const progression = this.getTopicProgression();
    const alerts = this.getAlerts();

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║            SEMANTIC DRIFT TRACKING REPORT                    ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('OVERVIEW');
    lines.push('─'.repeat(50));
    lines.push(`Entries tracked: ${this.history.length}`);
    lines.push(`Trend: ${trajectory.trend}`);
    lines.push(`Avg drift: ${(trajectory.avgDrift * 100).toFixed(0)}%`);
    lines.push(`Max drift: ${(trajectory.maxDrift * 100).toFixed(0)}%`);
    lines.push('');

    if (coherence.score !== null) {
      lines.push('COHERENCE');
      lines.push('─'.repeat(50));
      lines.push(`Score: ${(coherence.score * 100).toFixed(0)}% (${coherence.interpretation})`);
      lines.push(`Avg similarity: ${(coherence.avgSimilarity * 100).toFixed(0)}%`);
      lines.push(`Stability: ${(coherence.stability * 100).toFixed(0)}%`);
      lines.push('');
    }

    lines.push('DRIFT TRAJECTORY');
    lines.push('─'.repeat(50));
    this.history.slice(-10).forEach((entry, i) => {
      const drift = entry.drift !== null ? `${(entry.drift * 100).toFixed(0)}%` : '  -';
      const bar = entry.drift !== null
        ? '█'.repeat(Math.round(entry.drift * 10)) + '░'.repeat(10 - Math.round(entry.drift * 10))
        : '          ';
      lines.push(`  ${(i + 1).toString().padStart(2)}. ${bar} ${drift.padStart(4)} [${entry.topics.join(', ') || 'general'}]`);
    });
    lines.push('');

    if (progression.length > 0) {
      lines.push('TOPIC PROGRESSION');
      lines.push('─'.repeat(50));
      progression.slice(-5).forEach(p => {
        if (p.added.length > 0) {
          lines.push(`  + Added: ${p.added.join(', ')}`);
        }
        if (p.removed.length > 0) {
          lines.push(`  - Removed: ${p.removed.join(', ')}`);
        }
      });
      lines.push('');
    }

    if (alerts.length > 0) {
      lines.push('ALERTS');
      lines.push('─'.repeat(50));
      alerts.slice(-5).forEach(a => {
        lines.push(`  ⚠ ${a.message}`);
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.history = [];
    this.topicHistory = [];
    this.alerts = [];
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      SEMANTIC DRIFT TRACKER: Monitor Topic Coherence          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const tracker = new SemanticDriftTracker({
    driftThreshold: 0.4
  });

  const conversation = [
    "We should use microservices for better scalability. The architecture needs to handle high load.",
    "The microservice deployment can use Kubernetes. Docker containers will help with isolation.",
    "For the API layer, we need REST endpoints. GraphQL might be overkill for our use case.",
    "Actually, let me talk about database design. We need PostgreSQL for transactions.",
    "The database schema should have proper indexes. Query optimization is important.",
    "Wait, going back to security - we need authentication for the API endpoints.",
    "Let me discuss something completely different - the frontend uses React components.",
    "The React components need proper state management. Redux might help here."
  ];

  console.log('Tracking conversation drift...\n');

  conversation.forEach((text, i) => {
    const entry = tracker.track(text);

    console.log(`Turn ${i + 1}: "${text.substring(0, 50)}..."`);
    console.log(`  Topics: ${entry.topics.join(', ') || 'general'}`);
    console.log(`  Drift: ${entry.drift !== null ? (entry.drift * 100).toFixed(0) + '%' : 'baseline'}`);

    const recentAlerts = tracker.getAlerts(entry.timestamp - 100);
    recentAlerts.forEach(a => {
      console.log(`  ⚠ ${a.message}`);
    });

    console.log('');
  });

  console.log('\n' + tracker.formatReport());

  console.log('\n✓ Semantic drift tracking demonstration complete\n');
}

module.exports = { SemanticDriftTracker };
