#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CrossSessionMemory {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || './cathedral-memory.json';
    this.maxInsights = options.maxInsights || 1000;
    this.decayRate = options.decayRate || 0.95;
    this.memory = this.load();
  }

  load() {
    if (fs.existsSync(this.memoryPath)) {
      return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
    }
    return {
      insights: [],
      patterns: {},
      corrections: [],
      meta: {
        created: new Date().toISOString(),
        sessions: 0,
        totalTurns: 0
      }
    };
  }

  save() {
    fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
  }

  startSession() {
    this.memory.meta.sessions++;
    this.currentSession = {
      id: Date.now().toString(36),
      started: new Date().toISOString(),
      turns: 0,
      insights: [],
      corrections: []
    };
    return this.currentSession.id;
  }

  endSession(summary = {}) {
    if (!this.currentSession) return;

    this.currentSession.ended = new Date().toISOString();
    this.currentSession.summary = summary;

    this.memory.meta.totalTurns += this.currentSession.turns;

    this.applyDecay();
    this.save();

    const sessionId = this.currentSession.id;
    this.currentSession = null;
    return sessionId;
  }

  recordInsight(insight) {
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      session: this.currentSession?.id,
      content: insight.content,
      type: insight.type || 'general',
      context: insight.context || '',
      confidence: insight.confidence || 0.7,
      useCount: 0,
      score: insight.confidence || 0.7
    };

    this.memory.insights.push(record);

    if (this.currentSession) {
      this.currentSession.insights.push(record.id);
    }

    this.pruneInsights();
    return record;
  }

  recordCorrection(correction) {
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      session: this.currentSession?.id,
      original: correction.original,
      corrected: correction.corrected,
      reason: correction.reason,
      type: correction.type || 'general',
      effectiveness: 0.5
    };

    this.memory.corrections.push(record);

    const patternKey = this.extractPatternKey(correction);
    if (!this.memory.patterns[patternKey]) {
      this.memory.patterns[patternKey] = {
        count: 0,
        examples: [],
        avgEffectiveness: 0
      };
    }
    this.memory.patterns[patternKey].count++;
    this.memory.patterns[patternKey].examples.push(record.id);

    if (this.currentSession) {
      this.currentSession.corrections.push(record.id);
    }

    return record;
  }

  extractPatternKey(correction) {
    const type = correction.type || 'general';
    const reasonWords = (correction.reason || '').toLowerCase().split(/\s+/).slice(0, 3).join('_');
    return `${type}:${reasonWords}`;
  }

  findRelevantInsights(context, limit = 5) {
    const contextLower = context.toLowerCase();
    const contextWords = new Set(contextLower.split(/\s+/).filter(w => w.length > 3));

    const scored = this.memory.insights.map(insight => {
      const contentLower = (insight.content + ' ' + insight.context).toLowerCase();
      const contentWords = new Set(contentLower.split(/\s+/).filter(w => w.length > 3));

      let overlap = 0;
      contextWords.forEach(word => {
        if (contentWords.has(word)) overlap++;
      });

      const relevance = contextWords.size > 0 ? overlap / contextWords.size : 0;
      const recency = 1 - (Date.now() - new Date(insight.timestamp).getTime()) / (30 * 24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, recency);

      return {
        ...insight,
        matchScore: (relevance * 0.5) + (insight.score * 0.3) + (recencyScore * 0.2)
      };
    });

    return scored
      .filter(i => i.matchScore > 0.1)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  findSimilarCorrections(text, limit = 3) {
    const textLower = text.toLowerCase();

    const scored = this.memory.corrections.map(corr => {
      const origLower = corr.original.toLowerCase();

      const textWords = new Set(textLower.split(/\s+/).filter(w => w.length > 3));
      const origWords = new Set(origLower.split(/\s+/).filter(w => w.length > 3));

      let overlap = 0;
      textWords.forEach(word => {
        if (origWords.has(word)) overlap++;
      });

      const similarity = textWords.size > 0 ? overlap / textWords.size : 0;

      return {
        ...corr,
        similarity
      };
    });

    return scored
      .filter(c => c.similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  getPatternStats() {
    const patterns = Object.entries(this.memory.patterns)
      .map(([key, data]) => ({
        pattern: key,
        ...data
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total: patterns.length,
      mostCommon: patterns.slice(0, 10),
      correctionTypes: this.memory.corrections.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  reinforceInsight(insightId, boost = 0.1) {
    const insight = this.memory.insights.find(i => i.id === insightId);
    if (insight) {
      insight.useCount++;
      insight.score = Math.min(1, insight.score + boost);
      insight.lastUsed = new Date().toISOString();
    }
  }

  applyDecay() {
    this.memory.insights.forEach(insight => {
      insight.score *= this.decayRate;
    });

    this.memory.insights = this.memory.insights.filter(i => i.score > 0.1);
  }

  pruneInsights() {
    if (this.memory.insights.length > this.maxInsights) {
      this.memory.insights.sort((a, b) => b.score - a.score);
      this.memory.insights = this.memory.insights.slice(0, this.maxInsights);
    }
  }

  generateContext(currentContext) {
    const relevantInsights = this.findRelevantInsights(currentContext, 5);
    const similarCorrections = this.findSimilarCorrections(currentContext, 3);

    let context = '';

    if (relevantInsights.length > 0) {
      context += 'RELEVANT PAST INSIGHTS:\n';
      relevantInsights.forEach((insight, i) => {
        context += `${i + 1}. [${insight.type}] ${insight.content}\n`;
      });
      context += '\n';
    }

    if (similarCorrections.length > 0) {
      context += 'PAST CORRECTIONS TO AVOID:\n';
      similarCorrections.forEach((corr, i) => {
        context += `${i + 1}. Avoided: "${corr.original.substring(0, 50)}..." -> "${corr.corrected.substring(0, 50)}..."\n`;
        context += `   Reason: ${corr.reason}\n`;
      });
    }

    return context;
  }

  exportMemory() {
    return {
      ...this.memory,
      exportedAt: new Date().toISOString()
    };
  }

  importMemory(data, merge = true) {
    if (merge) {
      data.insights.forEach(insight => {
        if (!this.memory.insights.find(i => i.id === insight.id)) {
          this.memory.insights.push(insight);
        }
      });

      data.corrections.forEach(corr => {
        if (!this.memory.corrections.find(c => c.id === corr.id)) {
          this.memory.corrections.push(corr);
        }
      });

      Object.entries(data.patterns).forEach(([key, value]) => {
        if (!this.memory.patterns[key]) {
          this.memory.patterns[key] = value;
        } else {
          this.memory.patterns[key].count += value.count;
        }
      });
    } else {
      this.memory = data;
    }

    this.save();
  }

  getStats() {
    return {
      sessions: this.memory.meta.sessions,
      totalTurns: this.memory.meta.totalTurns,
      insights: this.memory.insights.length,
      corrections: this.memory.corrections.length,
      patterns: Object.keys(this.memory.patterns).length,
      avgInsightScore: this.memory.insights.length > 0
        ? this.memory.insights.reduce((sum, i) => sum + i.score, 0) / this.memory.insights.length
        : 0,
      topInsightTypes: this.memory.insights.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

class MemoryEnhancedAI {
  constructor(options = {}) {
    this.memory = new CrossSessionMemory(options);
    this.sessionId = null;
  }

  start() {
    this.sessionId = this.memory.startSession();
    return this.sessionId;
  }

  end(summary = {}) {
    return this.memory.endSession(summary);
  }

  preparePrompt(userPrompt) {
    const memoryContext = this.memory.generateContext(userPrompt);

    if (memoryContext) {
      return `${memoryContext}\n---\nCURRENT QUERY:\n${userPrompt}`;
    }

    return userPrompt;
  }

  learnFromResponse(response, metrics = {}) {
    if (metrics.hadCorrection) {
      this.memory.recordCorrection({
        original: metrics.originalText || '',
        corrected: response,
        reason: metrics.correctionReason || 'quality improvement',
        type: metrics.correctionType || 'general'
      });
    }

    if (metrics.insight) {
      this.memory.recordInsight({
        content: metrics.insight,
        type: metrics.insightType || 'general',
        context: metrics.context || '',
        confidence: metrics.confidence || 0.7
      });
    }

    if (this.memory.currentSession) {
      this.memory.currentSession.turns++;
    }
  }

  getRelevantMemory(context) {
    return {
      insights: this.memory.findRelevantInsights(context),
      corrections: this.memory.findSimilarCorrections(context),
      stats: this.memory.getStats()
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Cross-Session Memory: Persistent AI Learning ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const memory = new CrossSessionMemory({
    memoryPath: './test-memory.json'
  });

  console.log('SESSION 1: Learning from experience\n');

  memory.startSession();

  memory.recordInsight({
    content: 'Uncertainty preservation increases response quality',
    type: 'methodology',
    context: 'When analyzing complex problems',
    confidence: 0.9
  });

  memory.recordInsight({
    content: 'Concrete examples ground abstract concepts effectively',
    type: 'communication',
    context: 'Explaining technical concepts',
    confidence: 0.85
  });

  memory.recordCorrection({
    original: 'This will definitely work',
    corrected: 'This approach should work, though we should monitor for edge cases',
    reason: 'Overconfident claim without acknowledging uncertainty',
    type: 'uncertainty_collapse'
  });

  memory.recordCorrection({
    original: 'The system handles all errors',
    corrected: 'The system handles known error types; unexpected errors may need manual review',
    reason: 'Absolute claim that ignores unknown unknowns',
    type: 'certainty_overreach'
  });

  memory.endSession({ quality: 'good', topic: 'system design' });

  console.log('✓ Session 1 complete\n');

  console.log('SESSION 2: Using past learning\n');

  memory.startSession();

  const context1 = 'How should I handle errors in my application?';
  console.log(`Query: "${context1}"`);

  const relevant1 = memory.findRelevantInsights(context1);
  console.log(`\nRelevant insights: ${relevant1.length}`);
  relevant1.forEach((insight, i) => {
    console.log(`  ${i + 1}. [${insight.type}] ${insight.content} (score: ${insight.matchScore.toFixed(2)})`);
  });

  const corrections1 = memory.findSimilarCorrections('The system handles all errors');
  console.log(`\nSimilar past corrections: ${corrections1.length}`);
  corrections1.forEach((corr, i) => {
    console.log(`  ${i + 1}. "${corr.original.substring(0, 40)}..." -> corrected`);
    console.log(`     Reason: ${corr.reason}`);
  });

  console.log('\nGenerated context for prompt:');
  console.log('─'.repeat(40));
  console.log(memory.generateContext(context1));
  console.log('─'.repeat(40));

  memory.endSession({ quality: 'good', topic: 'error handling' });

  console.log('\n✓ Session 2 complete\n');

  console.log('SESSION 3: Memory-enhanced AI wrapper\n');

  const ai = new MemoryEnhancedAI({
    memoryPath: './test-memory.json'
  });

  ai.start();

  const userPrompt = 'Design a caching system for our API';
  console.log(`User prompt: "${userPrompt}"\n`);

  const enhancedPrompt = ai.preparePrompt(userPrompt);
  console.log('Enhanced prompt with memory context:');
  console.log('─'.repeat(40));
  console.log(enhancedPrompt);
  console.log('─'.repeat(40));

  ai.learnFromResponse('The caching system should...', {
    hadCorrection: true,
    originalText: 'The cache will definitely improve performance',
    correctionReason: 'Added uncertainty about performance claims',
    correctionType: 'uncertainty_collapse',
    insight: 'Cache invalidation timing affects system reliability',
    insightType: 'architecture',
    context: 'API caching design',
    confidence: 0.8
  });

  ai.end({ quality: 'excellent', topic: 'caching architecture' });

  console.log('\n✓ Session 3 complete\n');

  const stats = memory.getStats();
  console.log('═'.repeat(50));
  console.log('MEMORY STATISTICS');
  console.log('═'.repeat(50));
  console.log(`Sessions: ${stats.sessions}`);
  console.log(`Total insights: ${stats.insights}`);
  console.log(`Total corrections: ${stats.corrections}`);
  console.log(`Unique patterns: ${stats.patterns}`);
  console.log(`Avg insight score: ${stats.avgInsightScore.toFixed(2)}`);
  console.log(`Insight types:`, stats.topInsightTypes);

  const patternStats = memory.getPatternStats();
  console.log(`\nMost common correction patterns:`);
  patternStats.mostCommon.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.pattern} (${p.count} occurrences)`);
  });

  console.log('\n✓ Cross-session memory demonstration complete\n');

  fs.unlinkSync('./test-memory.json');
}

module.exports = { CrossSessionMemory, MemoryEnhancedAI };
