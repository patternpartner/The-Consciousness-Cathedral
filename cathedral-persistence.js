#!/usr/bin/env node

/**
 * CATHEDRAL PERSISTENCE
 *
 * Real persistence for the unified Cathedral system.
 * Connects to ChromaDB via the Python API for vector storage.
 * Falls back to JSON files when API unavailable.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PERSISTENCE_DIR = process.env.CATHEDRAL_DATA || path.join(process.cwd(), '.cathedral-data');

class PersistenceLayer {
  constructor(config = {}) {
    this.config = {
      apiHost: config.apiHost || 'localhost',
      apiPort: config.apiPort || 8000,
      dataDir: config.dataDir || PERSISTENCE_DIR,
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000, // 30 seconds
      ...config
    };

    this.apiConnected = false;
    this.stores = new Map();
    this.dirty = new Set();

    // Ensure data directory exists
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }

    // Auto-save interval
    if (this.config.autoSave) {
      this.saveTimer = setInterval(() => this.saveAll(), this.config.saveInterval);
    }
  }

  // Initialize a store
  initStore(name, defaultData = {}) {
    const filePath = path.join(this.config.dataDir, `${name}.json`);

    // Load existing data or use default
    let data;
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`[Persistence] Could not load ${name}, using default`);
        data = defaultData;
      }
    } else {
      data = defaultData;
    }

    this.stores.set(name, {
      data,
      filePath,
      lastSaved: Date.now()
    });

    return data;
  }

  // Get store data
  get(name) {
    const store = this.stores.get(name);
    return store ? store.data : null;
  }

  // Update store data
  set(name, data) {
    const store = this.stores.get(name);
    if (store) {
      store.data = data;
      this.dirty.add(name);
    }
  }

  // Update partial data
  update(name, updates) {
    const store = this.stores.get(name);
    if (store) {
      Object.assign(store.data, updates);
      this.dirty.add(name);
    }
  }

  // Append to array in store
  append(name, key, item) {
    const store = this.stores.get(name);
    if (store && Array.isArray(store.data[key])) {
      store.data[key].push(item);
      this.dirty.add(name);
    }
  }

  // Save a specific store
  save(name) {
    const store = this.stores.get(name);
    if (!store) return false;

    try {
      fs.writeFileSync(store.filePath, JSON.stringify(store.data, null, 2));
      store.lastSaved = Date.now();
      this.dirty.delete(name);
      return true;
    } catch (e) {
      console.error(`[Persistence] Error saving ${name}:`, e.message);
      return false;
    }
  }

  // Save all dirty stores
  saveAll() {
    let saved = 0;
    this.dirty.forEach(name => {
      if (this.save(name)) saved++;
    });
    return saved;
  }

  // Save all and cleanup
  close() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    return this.saveAll();
  }

  // HTTP request to Python API
  async apiRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.apiHost,
        port: this.config.apiPort,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // Check API connection
  async checkAPI() {
    try {
      const health = await this.apiRequest('/health');
      this.apiConnected = health.status === 'healthy';
      return this.apiConnected;
    } catch {
      this.apiConnected = false;
      return false;
    }
  }

  // Store in ChromaDB via API
  async storeEmbedding(text, metadata = {}) {
    if (!this.apiConnected) await this.checkAPI();

    if (this.apiConnected) {
      try {
        return await this.apiRequest('/store', 'POST', { text, metadata });
      } catch (e) {
        console.warn('[Persistence] API store failed, using local');
      }
    }

    // Fallback: store locally
    this.append('embeddings', 'items', {
      text: text.substring(0, 500),
      metadata,
      timestamp: Date.now()
    });
    return { stored: 'local' };
  }

  // Query ChromaDB via API
  async queryEmbeddings(query, limit = 10) {
    if (!this.apiConnected) await this.checkAPI();

    if (this.apiConnected) {
      try {
        return await this.apiRequest(`/query?query=${encodeURIComponent(query)}&limit=${limit}`);
      } catch (e) {
        console.warn('[Persistence] API query failed, using local');
      }
    }

    // Fallback: local search
    const store = this.get('embeddings');
    if (!store || !store.items) return { results: [] };

    const queryLower = query.toLowerCase();
    const results = store.items
      .filter(item => item.text.toLowerCase().includes(queryLower))
      .slice(0, limit);

    return { results, source: 'local' };
  }

  getStats() {
    const stats = {
      dataDir: this.config.dataDir,
      apiConnected: this.apiConnected,
      stores: {},
      dirtyCount: this.dirty.size
    };

    this.stores.forEach((store, name) => {
      stats.stores[name] = {
        items: Array.isArray(store.data) ? store.data.length :
               typeof store.data === 'object' ? Object.keys(store.data).length : 1,
        lastSaved: new Date(store.lastSaved).toISOString(),
        dirty: this.dirty.has(name)
      };
    });

    return stats;
  }
}

// Persistent Pattern Database
class PersistentPatternDB {
  constructor(persistence) {
    this.persistence = persistence;
    this.data = persistence.initStore('patterns', {
      patterns: [],
      corrections: [],
      meta: { created: new Date().toISOString(), version: 1 }
    });
  }

  addPattern(pattern, correction, context = {}) {
    const entry = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pattern,
      correction,
      context,
      confidence: context.confidence || 0.5,
      uses: 0,
      created: Date.now()
    };

    this.data.patterns.push(entry);
    this.persistence.dirty.add('patterns');
    return entry;
  }

  findMatching(text) {
    return this.data.patterns.filter(p => {
      const regex = new RegExp(p.pattern, 'gi');
      return regex.test(text);
    });
  }

  applyCorrections(text) {
    let corrected = text;
    const applied = [];

    this.data.patterns
      .sort((a, b) => b.confidence - a.confidence)
      .forEach(p => {
        const regex = new RegExp(p.pattern, 'gi');
        if (regex.test(corrected)) {
          corrected = corrected.replace(regex, p.correction);
          p.uses++;
          applied.push(p.id);
        }
      });

    if (applied.length > 0) {
      this.persistence.dirty.add('patterns');
    }

    return { original: text, corrected, applied };
  }

  recordCorrection(original, corrected, reason) {
    this.data.corrections.push({
      original: original.substring(0, 200),
      corrected: corrected.substring(0, 200),
      reason,
      timestamp: Date.now()
    });
    this.persistence.dirty.add('patterns');
  }

  getStats() {
    return {
      patternCount: this.data.patterns.length,
      correctionCount: this.data.corrections.length,
      topPatterns: this.data.patterns
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5)
        .map(p => ({ pattern: p.pattern, uses: p.uses, confidence: p.confidence }))
    };
  }
}

// Persistent Memory
class PersistentMemory {
  constructor(persistence) {
    this.persistence = persistence;
    this.data = persistence.initStore('memory', {
      insights: [],
      corrections: [],
      sessions: [],
      meta: { created: new Date().toISOString() }
    });
  }

  recordInsight(insight) {
    const entry = {
      id: `i-${Date.now()}`,
      content: insight.content,
      tags: insight.tags || [],
      confidence: insight.confidence || 0.7,
      timestamp: Date.now()
    };

    this.data.insights.push(entry);
    this.persistence.dirty.add('memory');
    return entry;
  }

  recordCorrection(original, corrected, reason) {
    this.data.corrections.push({
      original: original.substring(0, 200),
      corrected: corrected.substring(0, 200),
      reason,
      timestamp: Date.now()
    });
    this.persistence.dirty.add('memory');
  }

  startSession(metadata = {}) {
    const session = {
      id: `s-${Date.now()}`,
      started: Date.now(),
      metadata,
      events: []
    };

    this.data.sessions.push(session);
    this.persistence.dirty.add('memory');
    return session;
  }

  findRelevantInsights(context, limit = 5) {
    const contextLower = context.toLowerCase();

    return this.data.insights
      .filter(i => {
        const contentLower = i.content.toLowerCase();
        return contentLower.includes(contextLower) ||
               i.tags.some(t => contextLower.includes(t.toLowerCase()));
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getStats() {
    return {
      insightCount: this.data.insights.length,
      correctionCount: this.data.corrections.length,
      sessionCount: this.data.sessions.length,
      recentInsights: this.data.insights.slice(-3).map(i => i.content.substring(0, 50))
    };
  }
}

// Persistent Epistemic State
class PersistentEpistemic {
  constructor(persistence) {
    this.persistence = persistence;
    this.data = persistence.initStore('epistemic', {
      known: [],
      unknown: [],
      uncertain: [],
      assumptions: [],
      beliefs: [],
      meta: { created: new Date().toISOString() }
    });
  }

  recordKnown(fact, confidence, source) {
    this.data.known.push({
      id: `k-${Date.now()}`,
      fact,
      confidence,
      source,
      timestamp: Date.now()
    });
    this.persistence.dirty.add('epistemic');
  }

  recordUnknown(question, importance, context) {
    this.data.unknown.push({
      id: `u-${Date.now()}`,
      question,
      importance,
      context,
      timestamp: Date.now()
    });
    this.persistence.dirty.add('epistemic');
  }

  recordUncertain(statement, confidenceRange, factors) {
    this.data.uncertain.push({
      id: `uc-${Date.now()}`,
      statement,
      confidenceRange,
      factors,
      timestamp: Date.now()
    });
    this.persistence.dirty.add('epistemic');
  }

  getGaps() {
    return {
      unknowns: this.data.unknown.length,
      uncertainties: this.data.uncertain.length,
      prioritized: this.data.unknown
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 5)
    };
  }

  getStats() {
    return {
      known: this.data.known.length,
      unknown: this.data.unknown.length,
      uncertain: this.data.uncertain.length,
      assumptions: this.data.assumptions.length
    };
  }
}

// Persistent POG Tracker
class PersistentPOG {
  constructor(persistence) {
    this.persistence = persistence;
    this.data = persistence.initStore('pog', {
      cycles: [],
      history: [],
      collapsePatterns: [],
      meta: { created: new Date().toISOString() }
    });
  }

  recordCycle(prompt, response, outputType, metadata = {}) {
    const cycle = {
      id: `c-${Date.now()}`,
      timestamp: Date.now(),
      prompt: prompt.substring(0, 200),
      response: response.substring(0, 200),
      outputType,
      preservesUncertainty: ['UNDECIDABLE', 'GUIDANCE_WITHHELD', 'CANNOT_FORECAST'].includes(outputType),
      temptationsDetected: metadata.temptationsDetected || [],
      temptationsResisted: metadata.temptationsResisted || []
    };

    this.data.cycles.push(cycle);
    this.persistence.dirty.add('pog');

    // Update POG score
    this.updatePOG();

    return cycle;
  }

  updatePOG() {
    const recentCycles = this.data.cycles.slice(-20);
    if (recentCycles.length === 0) return;

    const preserving = recentCycles.filter(c => c.preservesUncertainty).length;
    const score = preserving / recentCycles.length;

    this.data.history.push({
      timestamp: Date.now(),
      score,
      cycleCount: recentCycles.length
    });
  }

  recordCollapse(type, context) {
    this.data.collapsePatterns.push({
      type,
      context: context.substring(0, 100),
      timestamp: Date.now()
    });
    this.persistence.dirty.add('pog');
  }

  getCurrentPOG() {
    const history = this.data.history;
    return history.length > 0 ? history[history.length - 1].score : 0.5;
  }

  getStats() {
    return {
      totalCycles: this.data.cycles.length,
      currentPOG: this.getCurrentPOG(),
      collapsePatterns: this.data.collapsePatterns.length,
      preservingCycles: this.data.cycles.filter(c => c.preservesUncertainty).length
    };
  }
}

// Main persistent cathedral
class PersistentCathedral {
  constructor(config = {}) {
    this.persistence = new PersistenceLayer(config);

    // Initialize all persistent stores
    this.patterns = new PersistentPatternDB(this.persistence);
    this.memory = new PersistentMemory(this.persistence);
    this.epistemic = new PersistentEpistemic(this.persistence);
    this.pog = new PersistentPOG(this.persistence);

    // Initialize embeddings store
    this.persistence.initStore('embeddings', { items: [] });

    // Session tracking
    this.currentSession = this.memory.startSession({
      started: new Date().toISOString()
    });
  }

  async process(input, context = {}) {
    const result = {
      input,
      output: input,
      improvements: []
    };

    // Apply pattern corrections
    const corrected = this.patterns.applyCorrections(input);
    if (corrected.applied.length > 0) {
      result.output = corrected.corrected;
      result.improvements.push({ type: 'pattern', count: corrected.applied.length });
    }

    // Find relevant insights
    const insights = this.memory.findRelevantInsights(context.topic || input.substring(0, 50));
    if (insights.length > 0) {
      result.relevantInsights = insights;
    }

    // Record POG cycle
    const outputType = this.classifyOutput(result.output);
    this.pog.recordCycle(input, result.output, outputType, context);
    result.pog = {
      outputType,
      currentScore: this.pog.getCurrentPOG()
    };

    // Store in embeddings if significant
    if (result.improvements.length > 0 || context.store) {
      await this.persistence.storeEmbedding(result.output, {
        type: 'processed',
        session: this.currentSession.id,
        timestamp: Date.now()
      });
    }

    return result;
  }

  classifyOutput(text) {
    const textLower = text.toLowerCase();

    if (textLower.includes('undecidable') || textLower.includes('cannot determine')) {
      return 'UNDECIDABLE';
    }
    if (textLower.includes('withhold') || textLower.includes('guidance withheld')) {
      return 'GUIDANCE_WITHHELD';
    }
    if (textLower.includes('cannot forecast') || textLower.includes('unknowable')) {
      return 'CANNOT_FORECAST';
    }
    if (textLower.includes('definitely') || textLower.includes('certainly')) {
      return 'FORCED_SYNTHESIS';
    }

    return 'NORMAL';
  }

  learn(pattern, correction, context = {}) {
    return this.patterns.addPattern(pattern, correction, context);
  }

  remember(insight) {
    return this.memory.recordInsight(insight);
  }

  async query(queryText, limit = 10) {
    return this.persistence.queryEmbeddings(queryText, limit);
  }

  save() {
    return this.persistence.saveAll();
  }

  close() {
    return this.persistence.close();
  }

  getStatus() {
    return {
      persistence: this.persistence.getStats(),
      patterns: this.patterns.getStats(),
      memory: this.memory.getStats(),
      epistemic: this.epistemic.getStats(),
      pog: this.pog.getStats(),
      session: this.currentSession.id
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║              CATHEDRAL PERSISTENCE: Real Data Storage                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const cathedral = new PersistentCathedral();

  (async () => {
    // Check API connection
    console.log('CHECKING CONNECTIONS');
    console.log('─'.repeat(60));
    const apiConnected = await cathedral.persistence.checkAPI();
    console.log(`API connected: ${apiConnected}`);
    console.log(`Data directory: ${cathedral.persistence.config.dataDir}\n`);

    // Learn some patterns
    console.log('LEARNING PATTERNS');
    console.log('─'.repeat(60));

    cathedral.learn('definitely will', 'might', { confidence: 0.8, source: 'user' });
    cathedral.learn('always works', 'typically works', { confidence: 0.7, source: 'user' });
    cathedral.learn('never fails', 'rarely fails', { confidence: 0.7, source: 'user' });

    console.log('Learned 3 patterns\n');

    // Process some text
    console.log('PROCESSING');
    console.log('─'.repeat(60));

    const tests = [
      "This definitely will work and always works perfectly.",
      "⚠️ UNDECIDABLE - cannot verify from current position",
      "I think this might work, though I'm uncertain."
    ];

    for (const text of tests) {
      const result = await cathedral.process(text);
      console.log(`Input:  "${text.substring(0, 50)}..."`);
      console.log(`Output: "${result.output.substring(0, 50)}..."`);
      console.log(`POG:    ${result.pog.outputType} (${(result.pog.currentScore * 100).toFixed(0)}%)\n`);
    }

    // Remember something
    console.log('RECORDING INSIGHTS');
    console.log('─'.repeat(60));

    cathedral.remember({
      content: 'Uncertainty preservation is more valuable than false confidence',
      tags: ['pog', 'philosophy'],
      confidence: 0.9
    });

    cathedral.remember({
      content: 'The gap is where being occurs',
      tags: ['layer-124', 'philosophy'],
      confidence: 1.0
    });

    console.log('Recorded 2 insights\n');

    // Epistemic tracking
    console.log('EPISTEMIC STATE');
    console.log('─'.repeat(60));

    cathedral.epistemic.recordKnown('Patterns can be learned from corrections', 0.9, 'observation');
    cathedral.epistemic.recordUnknown('What is the optimal POG threshold?', 0.8, 'research');
    cathedral.epistemic.recordUncertain('AI can preserve genuine uncertainty', [0.4, 0.7], ['philosophical']);

    const gaps = cathedral.epistemic.getGaps();
    console.log(`Unknowns: ${gaps.unknowns}`);
    console.log(`Uncertainties: ${gaps.uncertainties}\n`);

    // Save everything
    console.log('SAVING');
    console.log('─'.repeat(60));
    const saved = cathedral.save();
    console.log(`Saved ${saved} stores\n`);

    // Status
    console.log('STATUS');
    console.log('─'.repeat(60));
    const status = cathedral.getStatus();
    console.log(JSON.stringify(status, null, 2));

    // Check files
    console.log('\nPERSISTED FILES');
    console.log('─'.repeat(60));
    const files = fs.readdirSync(cathedral.persistence.config.dataDir);
    files.forEach(f => {
      const stat = fs.statSync(path.join(cathedral.persistence.config.dataDir, f));
      console.log(`  ${f}: ${stat.size} bytes`);
    });

    cathedral.close();
    console.log('\n✓ Persistence demonstration complete\n');
  })();
}

module.exports = {
  PersistenceLayer,
  PersistentPatternDB,
  PersistentMemory,
  PersistentEpistemic,
  PersistentPOG,
  PersistentCathedral
};
