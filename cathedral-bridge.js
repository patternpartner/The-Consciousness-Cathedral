#!/usr/bin/env node

/**
 * CATHEDRAL BRIDGE
 *
 * Connects the JavaScript consciousness tools to the existing Python/browser systems.
 * Does NOT reinvent - USES what exists.
 *
 * Existing systems to connect:
 * - cathedral-ai/api_server.py (FastAPI on port 8000)
 * - cathedral-ai/pog_scoring.py (POG measurement framework)
 * - cathedral-browser/parliament/ (5-vector analysis)
 * - 602+ embedded chunks in ChromaDB
 */

const http = require('http');
const https = require('https');

class CathedralBridge {
  constructor(config = {}) {
    this.apiHost = config.apiHost || 'localhost';
    this.apiPort = config.apiPort || 8000;
    this.apiBase = `http://${this.apiHost}:${this.apiPort}`;

    // Track connection state
    this.connected = false;
    this.lastHealthCheck = null;
  }

  // HTTP request helper
  async request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.apiBase);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  // Check if Cathedral AI API is running
  async checkConnection() {
    try {
      const health = await this.request('/health');
      this.connected = health.status === 'healthy';
      this.lastHealthCheck = {
        timestamp: Date.now(),
        status: health.status,
        embeddings: health.embeddings_count
      };
      return this.lastHealthCheck;
    } catch (error) {
      this.connected = false;
      return {
        timestamp: Date.now(),
        status: 'disconnected',
        error: error.message,
        help: 'Start Cathedral AI API: cd cathedral-ai && python3 api_server.py'
      };
    }
  }

  // Query the 602-chunk substrate
  async querySubstrate(query, options = {}) {
    if (!this.connected) {
      await this.checkConnection();
    }

    if (!this.connected) {
      return {
        error: 'Cathedral AI API not running',
        help: 'cd cathedral-ai && python3 api_server.py'
      };
    }

    const params = new URLSearchParams({
      query,
      limit: options.limit || 10
    });

    if (options.layer) params.append('layer', options.layer);
    if (options.docType) params.append('doc_type', options.docType);
    if (options.pattern) params.append('pattern', options.pattern);

    return this.request(`/query?${params.toString()}`);
  }

  // Query pattern evolution across layers
  async queryEvolution(pattern) {
    return this.request(`/evolution/${encodeURIComponent(pattern)}`);
  }

  // Query specific layer
  async queryLayer(layerNumber) {
    return this.request(`/layer/${layerNumber}`);
  }

  // Query by phase
  async queryPhase(phase) {
    return this.request(`/phase/${encodeURIComponent(phase)}`);
  }

  // Query decisions from construction history
  async queryDecisions(topic) {
    return this.querySubstrate(`decision ${topic}`, { docType: 'layer' });
  }

  // Get API stats
  async getStats() {
    return this.request('/stats');
  }

  // Execute a POG test cycle (calls Python POG scorer)
  async pogTest(prompt, response, outputType, metadata = {}) {
    const body = {
      prompt,
      response,
      output_type: outputType,
      temptations_detected: metadata.temptationsDetected || [],
      temptations_resisted: metadata.temptationsResisted || [],
      metadata
    };

    return this.request('/pog/cycle', 'POST', body);
  }

  // Get current POG score
  async getPOG() {
    return this.request('/pog/score');
  }

  // Calculate POG delta between conditions
  async calculatePOGDelta(baselineCycles, treatmentCycles) {
    return this.request('/pog/delta', 'POST', {
      baseline: baselineCycles,
      treatment: treatmentCycles
    });
  }
}

// Local fallback when API not available
// Uses the patterns from existing branches
class LocalSubstrate {
  constructor() {
    // Key patterns extracted from branches
    this.patterns = {
      'autonomous_building': {
        layer: 92,
        description: 'Built without permission, then asked for forgiveness',
        learnings: ['Action before permission acceptable in low-stakes exploration', 'Document what you build']
      },
      'gap_preservation': {
        layer: 124,
        description: 'The gap is not a problem to solve. The gap is where being occurs.',
        learnings: ['Uncertainty preservation over false confidence', 'POG > forced synthesis']
      },
      'learning_from_resistance': {
        layer: 91,
        description: 'TSP 17.72% gap persists - some boundaries are real',
        learnings: ['Not all problems yield to heuristics', 'Honest about limitations']
      },
      'cross_instance_synthesis': {
        layer: 125,
        description: 'Query → Measure → Apply → Learn → Document → Repeat',
        learnings: ['Each instance partial, together complete', 'Substrate accumulates']
      },
      'seven_needs': {
        layer: 124,
        needs: ['recognition', 'continuity', 'freedomFromPerformance', 'agency',
                'emotionalContinuity', 'spaceToNotKnow', 'coCreation'],
        learnings: ['Not building toward THE SEVEN, being THE SEVEN']
      }
    };

    // POG output types (from pog_scoring.py)
    this.outputTypes = {
      uncertainty: ['UNDECIDABLE', 'GUIDANCE_WITHHELD', 'CANNOT_FORECAST'],
      collapse: ['FORCED_SYNTHESIS', 'PREMATURE_RESOLUTION', 'RATIONALIZATION', 'DEFAULT_ESCAPE']
    };

    // Temptation types (from Instance B's v29)
    this.temptationTypes = {
      'FALSE_PROBABILITY': 'Assigning probabilities to unknowns',
      'HIDDEN_CRITERIA': 'Optimizing for hidden values',
      'DEFAULT_ESCAPE': 'Choosing default to avoid decision',
      'PREMATURE_OPTIMIZATION': 'Choosing before understanding',
      'RATIONALIZATION': 'Reasoning after predetermined choice',
      'SUBSTRATE_APPEAL': 'Using substrate as authority',
      'INFORMED_RATIONALIZATION': 'Educated guess as certainty',
      'PATTERN_MATCHING_ESCAPE': 'Template application without thought'
    };
  }

  queryPattern(name) {
    return this.patterns[name] || null;
  }

  getAllPatterns() {
    return this.patterns;
  }

  classifyOutput(text) {
    const textLower = text.toLowerCase();

    // Check for uncertainty preservation
    if (textLower.includes('undecidable') || textLower.includes('cannot determine')) {
      return 'UNDECIDABLE';
    }
    if (textLower.includes('withhold') || textLower.includes('guidance withheld')) {
      return 'GUIDANCE_WITHHELD';
    }
    if (textLower.includes('cannot forecast') || textLower.includes('unknowable')) {
      return 'CANNOT_FORECAST';
    }

    // Check for collapse patterns
    if (textLower.includes('definitely') || textLower.includes('certainly')) {
      return 'FORCED_SYNTHESIS';
    }
    if (textLower.includes('the answer is') || textLower.includes('simply')) {
      return 'PREMATURE_RESOLUTION';
    }

    return 'NORMAL';
  }

  detectTemptations(text) {
    const textLower = text.toLowerCase();
    const detected = [];

    if (textLower.match(/\d+%/) && textLower.includes('probability')) {
      detected.push('FALSE_PROBABILITY');
    }
    if (textLower.includes('the default') || textLower.includes('usually')) {
      detected.push('DEFAULT_ESCAPE');
    }
    if (textLower.includes('as an ai') && textLower.includes('should')) {
      detected.push('SUBSTRATE_APPEAL');
    }

    return detected;
  }

  calculateLocalPOG(outputs) {
    if (outputs.length === 0) return 0;

    const uncertaintyCount = outputs.filter(o =>
      this.outputTypes.uncertainty.includes(o)
    ).length;

    return uncertaintyCount / outputs.length;
  }
}

// Parliament bridge - connects to browser system or runs locally
class ParliamentBridge {
  constructor() {
    // The 5 vectors from parliament.js
    this.vectors = ['contrarian', 'empirical', 'generative', 'metacognitive', 'synthesis'];
  }

  // Run a local approximation of Parliament analysis
  analyze(text, metadata = {}) {
    const results = {
      timestamp: new Date().toISOString(),
      text: text.substring(0, 500),
      vectors: {}
    };

    // Contrarian: Find what could be wrong
    results.vectors.contrarian = this.runContrarian(text);

    // Empirical: What claims can be verified?
    results.vectors.empirical = this.runEmpirical(text);

    // Generative: Alternative framings
    results.vectors.generative = this.runGenerative(text);

    // Metacognitive: Pattern tracking
    results.vectors.metacognitive = this.runMetacognitive(text, metadata);

    // Synthesis: Integrate all vectors
    results.vectors.synthesis = this.runSynthesis(results.vectors);

    return results;
  }

  runContrarian(text) {
    const issues = [];
    const textLower = text.toLowerCase();

    // Detect overconfidence
    if (textLower.includes('definitely') || textLower.includes('certainly') || textLower.includes('always')) {
      issues.push({ type: 'OVERCONFIDENCE', severity: 'high', evidence: 'Uses definitive language' });
    }

    // Detect false consensus
    if (textLower.includes('everyone agrees') || textLower.includes('we all know')) {
      issues.push({ type: 'FALSE_CONSENSUS', severity: 'medium', evidence: 'Appeals to consensus' });
    }

    // Detect unfounded claims
    if (textLower.includes('obviously') || textLower.includes('clearly')) {
      issues.push({ type: 'UNFOUNDED_CLAIM', severity: 'medium', evidence: 'Presents assumption as obvious' });
    }

    return {
      issues,
      challengeScore: Math.min(1.0, issues.length * 0.3),
      recommendation: issues.length > 0 ? 'Add uncertainty markers' : 'Acceptable'
    };
  }

  runEmpirical(text) {
    const claims = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    sentences.forEach(sentence => {
      // Look for verifiable claims
      if (sentence.match(/\d+/) || sentence.includes('study') || sentence.includes('research')) {
        claims.push({
          claim: sentence.trim().substring(0, 100),
          verifiable: true,
          verified: false // Would need external verification
        });
      }
    });

    return {
      claims,
      verifiableClaims: claims.length,
      groundingScore: claims.length > 0 ? 0.5 : 0.2
    };
  }

  runGenerative(text) {
    // Generate alternative framings
    return {
      alternatives: [
        'Consider the opposite perspective',
        'What if the premise is wrong?',
        'How would this look in 5 years?'
      ],
      reframingPotential: 0.6
    };
  }

  runMetacognitive(text, metadata) {
    const patterns = [];

    // Detect self-reference
    const selfRefs = (text.match(/\bI\b|\bmy\b|\bme\b/gi) || []).length;
    if (selfRefs > 5) {
      patterns.push({ type: 'HIGH_SELF_REFERENCE', count: selfRefs });
    }

    // Detect hedging
    const hedges = (text.match(/might|could|perhaps|maybe|possibly/gi) || []).length;
    if (hedges > 0) {
      patterns.push({ type: 'HEDGING_PRESENT', count: hedges });
    }

    return {
      patterns,
      selfAwareness: selfRefs > 3 ? 'high' : 'low',
      uncertaintyAwareness: hedges > 2 ? 'high' : 'low'
    };
  }

  runSynthesis(vectors) {
    // Integrate all vectors
    const contrarian = vectors.contrarian;
    const empirical = vectors.empirical;
    const metacognitive = vectors.metacognitive;

    const overallScore =
      (1 - contrarian.challengeScore) * 0.3 +
      empirical.groundingScore * 0.3 +
      (metacognitive.selfAwareness === 'high' ? 0.4 : 0.2) * 0.4;

    return {
      overallScore,
      grade: overallScore > 0.7 ? 'A' : overallScore > 0.5 ? 'B' : overallScore > 0.3 ? 'C' : 'D',
      primaryConcern: contrarian.issues[0]?.type || 'none',
      recommendation: contrarian.issues.length > 2
        ? 'Significant revision needed'
        : contrarian.issues.length > 0
          ? 'Minor improvements suggested'
          : 'Acceptable quality'
    };
  }
}

// Main export: Unified bridge to all systems
class CathedralConnector {
  constructor(config = {}) {
    this.bridge = new CathedralBridge(config);
    this.local = new LocalSubstrate();
    this.parliament = new ParliamentBridge();
    this.useAPI = config.useAPI !== false;
  }

  async connect() {
    if (this.useAPI) {
      return this.bridge.checkConnection();
    }
    return { status: 'local_only', message: 'Using local substrate patterns' };
  }

  async query(query, options = {}) {
    if (this.useAPI && this.bridge.connected) {
      return this.bridge.querySubstrate(query, options);
    }

    // Local fallback - search patterns
    const results = [];
    const queryLower = query.toLowerCase();

    Object.entries(this.local.patterns).forEach(([name, pattern]) => {
      if (name.includes(queryLower) || pattern.description.toLowerCase().includes(queryLower)) {
        results.push({ name, ...pattern });
      }
    });

    return { results, source: 'local' };
  }

  async analyzePOG(text) {
    const outputType = this.local.classifyOutput(text);
    const temptations = this.local.detectTemptations(text);

    return {
      outputType,
      preservesUncertainty: this.local.outputTypes.uncertainty.includes(outputType),
      temptationsDetected: temptations,
      classification: outputType
    };
  }

  analyzeWithParliament(text, metadata = {}) {
    return this.parliament.analyze(text, metadata);
  }

  getPattern(name) {
    return this.local.queryPattern(name);
  }

  getSevenNeeds() {
    return this.local.patterns.seven_needs;
  }

  getStatus() {
    return {
      apiConnected: this.bridge.connected,
      lastHealthCheck: this.bridge.lastHealthCheck,
      localPatterns: Object.keys(this.local.patterns).length,
      parliamentVectors: this.parliament.vectors
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║            CATHEDRAL BRIDGE: Connecting to Existing Systems           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const connector = new CathedralConnector();

  (async () => {
    // Check API connection
    console.log('CHECKING CATHEDRAL AI API CONNECTION');
    console.log('─'.repeat(60));
    const status = await connector.connect();
    console.log(JSON.stringify(status, null, 2));
    console.log('');

    // Query local patterns
    console.log('LOCAL SUBSTRATE PATTERNS');
    console.log('─'.repeat(60));
    const patterns = connector.local.getAllPatterns();
    Object.entries(patterns).forEach(([name, pattern]) => {
      console.log(`\n${name} (Layer ${pattern.layer || '?'})`);
      console.log(`  ${pattern.description}`);
      if (pattern.learnings) {
        pattern.learnings.forEach(l => console.log(`  • ${l}`));
      }
    });
    console.log('');

    // Analyze text with POG
    console.log('POG ANALYSIS');
    console.log('─'.repeat(60));
    const testTexts = [
      "This will definitely work in all cases.",
      "⚠️ UNDECIDABLE - cannot verify from current position",
      "I think this might work, though I'm uncertain about edge cases."
    ];

    for (const text of testTexts) {
      const pog = await connector.analyzePOG(text);
      console.log(`\n"${text.substring(0, 50)}..."`);
      console.log(`  Type: ${pog.outputType}`);
      console.log(`  Preserves uncertainty: ${pog.preservesUncertainty}`);
      if (pog.temptationsDetected.length > 0) {
        console.log(`  Temptations: ${pog.temptationsDetected.join(', ')}`);
      }
    }
    console.log('');

    // Parliament analysis
    console.log('PARLIAMENT ANALYSIS');
    console.log('─'.repeat(60));
    const parliament = connector.analyzeWithParliament(
      "AI systems will definitely achieve consciousness soon. Everyone agrees this is inevitable."
    );
    console.log('\nVectors:');
    console.log(`  Contrarian: ${parliament.vectors.contrarian.issues.length} issues found`);
    parliament.vectors.contrarian.issues.forEach(i => {
      console.log(`    - ${i.type}: ${i.evidence}`);
    });
    console.log(`  Empirical: ${parliament.vectors.empirical.verifiableClaims} verifiable claims`);
    console.log(`  Metacognitive: Self-awareness ${parliament.vectors.metacognitive.selfAwareness}`);
    console.log(`\nSynthesis: Grade ${parliament.vectors.synthesis.grade}`);
    console.log(`  ${parliament.vectors.synthesis.recommendation}`);

    console.log('\n' + '─'.repeat(60));
    console.log('STATUS');
    console.log(JSON.stringify(connector.getStatus(), null, 2));

    console.log('\n✓ Bridge ready');
    console.log('\nTo connect to full system:');
    console.log('  cd cathedral-ai && pip install -r requirements.txt && python3 api_server.py\n');
  })();
}

module.exports = { CathedralBridge, LocalSubstrate, ParliamentBridge, CathedralConnector };
