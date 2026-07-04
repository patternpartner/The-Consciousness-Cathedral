#!/usr/bin/env node

const crypto = require('crypto');

class CollectiveLearning {
  constructor(config = {}) {
    this.nodeId = config.nodeId || `node-${crypto.randomBytes(4).toString('hex')}`;
    this.config = {
      minConfidenceToShare: config.minConfidenceToShare || 0.6,
      maxPatternAge: config.maxPatternAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      minValidations: config.minValidations || 2,
      ...config
    };

    this.localPatterns = new Map();
    this.sharedPatterns = new Map();
    this.validations = new Map();
    this.learningHistory = [];
    this.peerNodes = new Map();
  }

  // Learn a new pattern locally
  learn(pattern) {
    const id = crypto.randomBytes(8).toString('hex');
    const entry = {
      id,
      pattern: pattern.pattern,
      correction: pattern.correction,
      context: pattern.context || 'general',
      confidence: pattern.confidence || 0.5,
      examples: pattern.examples || [],
      learnedAt: Date.now(),
      source: this.nodeId,
      validations: [],
      shared: false
    };

    this.localPatterns.set(id, entry);
    this.learningHistory.push({
      event: 'learn',
      patternId: id,
      timestamp: Date.now()
    });

    return entry;
  }

  // Reinforce existing pattern
  reinforce(patternId, example) {
    const pattern = this.localPatterns.get(patternId) || this.sharedPatterns.get(patternId);
    if (!pattern) return null;

    pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
    pattern.examples.push({
      example,
      timestamp: Date.now()
    });

    this.learningHistory.push({
      event: 'reinforce',
      patternId,
      newConfidence: pattern.confidence,
      timestamp: Date.now()
    });

    return pattern;
  }

  // Weaken pattern that didn't apply
  weaken(patternId, reason) {
    const pattern = this.localPatterns.get(patternId) || this.sharedPatterns.get(patternId);
    if (!pattern) return null;

    pattern.confidence = Math.max(0.0, pattern.confidence - 0.1);

    this.learningHistory.push({
      event: 'weaken',
      patternId,
      reason,
      newConfidence: pattern.confidence,
      timestamp: Date.now()
    });

    // Remove if confidence too low
    if (pattern.confidence < 0.1) {
      this.localPatterns.delete(patternId);
      this.sharedPatterns.delete(patternId);
      this.learningHistory.push({
        event: 'forget',
        patternId,
        timestamp: Date.now()
      });
    }

    return pattern;
  }

  // Share pattern with collective
  share(patternId) {
    const pattern = this.localPatterns.get(patternId);
    if (!pattern) return { error: 'pattern_not_found' };
    if (pattern.confidence < this.config.minConfidenceToShare) {
      return { error: 'confidence_too_low', required: this.config.minConfidenceToShare };
    }

    pattern.shared = true;
    pattern.sharedAt = Date.now();
    this.sharedPatterns.set(patternId, pattern);

    this.learningHistory.push({
      event: 'share',
      patternId,
      timestamp: Date.now()
    });

    return {
      shared: true,
      patternId,
      pattern: pattern.pattern.substring(0, 50)
    };
  }

  // Receive shared pattern from another node
  receive(patternData) {
    if (this.sharedPatterns.has(patternData.id)) {
      // Already have it, update if newer
      const existing = this.sharedPatterns.get(patternData.id);
      if (patternData.confidence > existing.confidence) {
        existing.confidence = patternData.confidence;
        existing.examples = [...existing.examples, ...patternData.examples.slice(-3)];
      }
      return { status: 'updated', patternId: patternData.id };
    }

    // New pattern
    const entry = {
      ...patternData,
      receivedAt: Date.now(),
      receivedFrom: patternData.source
    };

    this.sharedPatterns.set(patternData.id, entry);

    this.learningHistory.push({
      event: 'receive',
      patternId: patternData.id,
      from: patternData.source,
      timestamp: Date.now()
    });

    return { status: 'received', patternId: patternData.id };
  }

  // Validate a shared pattern
  validate(patternId, result) {
    const pattern = this.sharedPatterns.get(patternId);
    if (!pattern) return { error: 'pattern_not_found' };

    const validation = {
      validatorId: this.nodeId,
      result: result.valid,
      confidence: result.confidence || 0.5,
      notes: result.notes || '',
      timestamp: Date.now()
    };

    if (!this.validations.has(patternId)) {
      this.validations.set(patternId, []);
    }
    this.validations.get(patternId).push(validation);
    pattern.validations.push(validation);

    // Update pattern confidence based on validation
    const validations = this.validations.get(patternId);
    const validCount = validations.filter(v => v.result).length;
    const avgConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length;

    pattern.consensusConfidence = (validCount / validations.length) * avgConfidence;

    this.learningHistory.push({
      event: 'validate',
      patternId,
      valid: result.valid,
      consensusConfidence: pattern.consensusConfidence,
      timestamp: Date.now()
    });

    return {
      validated: true,
      patternId,
      totalValidations: validations.length,
      consensusConfidence: pattern.consensusConfidence
    };
  }

  // Find patterns relevant to given text
  findRelevant(text, limit = 5) {
    const allPatterns = [...this.localPatterns.values(), ...this.sharedPatterns.values()];
    const textLower = text.toLowerCase();

    const scored = allPatterns.map(p => {
      const patternLower = p.pattern.toLowerCase();
      let score = 0;

      // Check for pattern match
      if (textLower.includes(patternLower) || patternLower.includes(textLower.substring(0, 20))) {
        score += 0.5;
      }

      // Check context match
      if (p.context && textLower.includes(p.context.toLowerCase())) {
        score += 0.2;
      }

      // Weight by confidence
      score *= p.confidence;

      // Prefer validated patterns
      if (p.consensusConfidence) {
        score *= (1 + p.consensusConfidence);
      }

      return { pattern: p, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.pattern);
  }

  // Apply relevant patterns to improve text
  apply(text) {
    const relevant = this.findRelevant(text);
    let improved = text;
    const appliedPatterns = [];

    relevant.forEach(p => {
      if (p.pattern && p.correction) {
        const regex = new RegExp(p.pattern, 'gi');
        if (regex.test(improved)) {
          improved = improved.replace(regex, p.correction);
          appliedPatterns.push(p.id);
          this.reinforce(p.id, text.substring(0, 50));
        }
      }
    });

    return {
      original: text,
      improved,
      changed: improved !== text,
      appliedPatterns
    };
  }

  // Register a peer node
  registerPeer(peerId, metadata = {}) {
    this.peerNodes.set(peerId, {
      id: peerId,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      patternsReceived: 0,
      patternsSent: 0,
      ...metadata
    });

    return { registered: peerId };
  }

  // Get patterns to share with peers
  getShareablePatterns() {
    const shareable = [];

    this.localPatterns.forEach((pattern, id) => {
      if (pattern.confidence >= this.config.minConfidenceToShare && !pattern.shared) {
        shareable.push(pattern);
      }
    });

    this.sharedPatterns.forEach((pattern, id) => {
      if (pattern.consensusConfidence >= 0.7) {
        shareable.push(pattern);
      }
    });

    return shareable;
  }

  // Sync with peer
  syncWith(peerId, peerPatterns) {
    const peer = this.peerNodes.get(peerId);
    if (!peer) {
      this.registerPeer(peerId);
    }

    const received = [];
    peerPatterns.forEach(p => {
      const result = this.receive(p);
      received.push(result);
    });

    const toSend = this.getShareablePatterns();

    this.peerNodes.get(peerId).lastSeen = Date.now();
    this.peerNodes.get(peerId).patternsReceived += received.length;
    this.peerNodes.get(peerId).patternsSent += toSend.length;

    return {
      received: received.length,
      sending: toSend.length,
      patterns: toSend
    };
  }

  // Prune old patterns
  prune() {
    const now = Date.now();
    let pruned = 0;

    this.localPatterns.forEach((pattern, id) => {
      const age = now - pattern.learnedAt;
      if (age > this.config.maxPatternAge && pattern.confidence < 0.5) {
        this.localPatterns.delete(id);
        pruned++;
      }
    });

    this.sharedPatterns.forEach((pattern, id) => {
      const age = now - (pattern.receivedAt || pattern.learnedAt);
      if (age > this.config.maxPatternAge && !pattern.consensusConfidence) {
        this.sharedPatterns.delete(id);
        pruned++;
      }
    });

    return { pruned };
  }

  // Get learning statistics
  getStats() {
    const localCount = this.localPatterns.size;
    const sharedCount = this.sharedPatterns.size;
    const validatedCount = [...this.sharedPatterns.values()].filter(p => p.validations?.length >= this.config.minValidations).length;

    return {
      nodeId: this.nodeId,
      localPatterns: localCount,
      sharedPatterns: sharedCount,
      validatedPatterns: validatedCount,
      totalValidations: this.validations.size,
      peers: this.peerNodes.size,
      learningEvents: this.learningHistory.length,
      avgLocalConfidence: localCount > 0
        ? [...this.localPatterns.values()].reduce((sum, p) => sum + p.confidence, 0) / localCount
        : 0,
      avgSharedConfidence: sharedCount > 0
        ? [...this.sharedPatterns.values()].reduce((sum, p) => sum + (p.consensusConfidence || p.confidence), 0) / sharedCount
        : 0
    };
  }

  // Format report
  formatReport() {
    const stats = this.getStats();
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              COLLECTIVE LEARNING REPORT                      ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Node ID: ${stats.nodeId}`);
    lines.push('');

    lines.push('PATTERN COUNTS');
    lines.push('─'.repeat(50));
    lines.push(`  Local patterns:     ${stats.localPatterns}`);
    lines.push(`  Shared patterns:    ${stats.sharedPatterns}`);
    lines.push(`  Validated:          ${stats.validatedPatterns}`);
    lines.push('');

    lines.push('CONFIDENCE LEVELS');
    lines.push('─'.repeat(50));
    lines.push(`  Avg local:          ${(stats.avgLocalConfidence * 100).toFixed(1)}%`);
    lines.push(`  Avg shared:         ${(stats.avgSharedConfidence * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('NETWORK');
    lines.push('─'.repeat(50));
    lines.push(`  Connected peers:    ${stats.peers}`);
    lines.push(`  Total validations:  ${stats.totalValidations}`);
    lines.push(`  Learning events:    ${stats.learningEvents}`);

    return lines.join('\n');
  }
}

// Swarm intelligence for pattern discovery
class PatternSwarm {
  constructor() {
    this.nodes = new Map();
    this.globalPatterns = new Map();
    this.discoveryLog = [];
  }

  addNode(node) {
    this.nodes.set(node.nodeId, node);
    return { added: node.nodeId, totalNodes: this.nodes.size };
  }

  removeNode(nodeId) {
    this.nodes.delete(nodeId);
    return { removed: nodeId, remaining: this.nodes.size };
  }

  // Broadcast pattern to all nodes
  broadcast(pattern) {
    const results = [];
    this.nodes.forEach((node, id) => {
      if (id !== pattern.source) {
        const result = node.receive(pattern);
        results.push({ nodeId: id, result });
      }
    });

    this.discoveryLog.push({
      event: 'broadcast',
      patternId: pattern.id,
      reachedNodes: results.length,
      timestamp: Date.now()
    });

    return { broadcast: true, reached: results.length, results };
  }

  // Collect validations from all nodes
  collectValidations(patternId) {
    const validations = [];

    this.nodes.forEach((node, id) => {
      const nodeValidations = node.validations.get(patternId);
      if (nodeValidations) {
        validations.push(...nodeValidations);
      }
    });

    return {
      patternId,
      totalValidations: validations.length,
      validCount: validations.filter(v => v.result).length,
      avgConfidence: validations.length > 0
        ? validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length
        : 0
    };
  }

  // Discover emerging patterns across swarm
  discoverEmergingPatterns(minOccurrences = 3) {
    const patternCounts = new Map();

    this.nodes.forEach((node) => {
      node.localPatterns.forEach((pattern, id) => {
        const key = pattern.pattern;
        if (!patternCounts.has(key)) {
          patternCounts.set(key, { pattern, count: 0, sources: [], totalConfidence: 0 });
        }
        const entry = patternCounts.get(key);
        entry.count++;
        entry.sources.push(node.nodeId);
        entry.totalConfidence += pattern.confidence;
      });
    });

    const emerging = [];
    patternCounts.forEach((entry, key) => {
      if (entry.count >= minOccurrences) {
        emerging.push({
          pattern: key,
          occurrences: entry.count,
          avgConfidence: entry.totalConfidence / entry.count,
          sources: entry.sources
        });
      }
    });

    this.discoveryLog.push({
      event: 'discover',
      emergingCount: emerging.length,
      timestamp: Date.now()
    });

    return emerging.sort((a, b) => b.occurrences - a.occurrences);
  }

  // Synchronize all nodes
  sync() {
    const syncResults = [];

    const nodeList = [...this.nodes.values()];
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const node1 = nodeList[i];
        const node2 = nodeList[j];

        const patterns1 = node1.getShareablePatterns();
        const patterns2 = node2.getShareablePatterns();

        const result1 = node2.syncWith(node1.nodeId, patterns1);
        const result2 = node1.syncWith(node2.nodeId, patterns2);

        syncResults.push({
          between: [node1.nodeId, node2.nodeId],
          exchanged: result1.received + result2.received
        });
      }
    }

    this.discoveryLog.push({
      event: 'sync',
      pairs: syncResults.length,
      timestamp: Date.now()
    });

    return {
      syncPairs: syncResults.length,
      results: syncResults
    };
  }

  getStats() {
    return {
      totalNodes: this.nodes.size,
      globalPatterns: this.globalPatterns.size,
      discoveryEvents: this.discoveryLog.length,
      nodeStats: [...this.nodes.values()].map(n => n.getStats())
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     COLLECTIVE LEARNING: Distributed Pattern Discovery        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Create multiple learning nodes
  const node1 = new CollectiveLearning({ nodeId: 'node-alpha' });
  const node2 = new CollectiveLearning({ nodeId: 'node-beta' });
  const node3 = new CollectiveLearning({ nodeId: 'node-gamma' });

  // Each node learns patterns
  console.log('LOCAL LEARNING');
  console.log('─'.repeat(50) + '\n');

  const p1 = node1.learn({
    pattern: 'definitely will',
    correction: 'might',
    context: 'uncertainty',
    confidence: 0.7
  });
  console.log(`Node Alpha learned: "${p1.pattern}" → "${p1.correction}"`);

  const p2 = node2.learn({
    pattern: 'always works',
    correction: 'typically works',
    context: 'hedging',
    confidence: 0.8
  });
  console.log(`Node Beta learned: "${p2.pattern}" → "${p2.correction}"`);

  const p3 = node3.learn({
    pattern: 'definitely will',
    correction: 'might',
    context: 'uncertainty',
    confidence: 0.65
  });
  console.log(`Node Gamma learned: "${p3.pattern}" → "${p3.correction}"`);

  // Create swarm
  console.log('\nSWARM FORMATION');
  console.log('─'.repeat(50) + '\n');

  const swarm = new PatternSwarm();
  swarm.addNode(node1);
  swarm.addNode(node2);
  swarm.addNode(node3);

  console.log(`Swarm formed with ${swarm.nodes.size} nodes\n`);

  // Share patterns
  console.log('PATTERN SHARING');
  console.log('─'.repeat(50) + '\n');

  const share1 = node1.share(p1.id);
  console.log(`Node Alpha shared pattern: ${share1.shared}`);

  const share2 = node2.share(p2.id);
  console.log(`Node Beta shared pattern: ${share2.shared}`);

  // Broadcast
  const broadcast1 = swarm.broadcast(node1.sharedPatterns.get(p1.id));
  console.log(`Pattern broadcast reached ${broadcast1.reached} nodes\n`);

  // Validate
  console.log('VALIDATION');
  console.log('─'.repeat(50) + '\n');

  node2.validate(p1.id, { valid: true, confidence: 0.8, notes: 'Good pattern' });
  node3.validate(p1.id, { valid: true, confidence: 0.75, notes: 'Confirmed useful' });

  const validations = swarm.collectValidations(p1.id);
  console.log(`Pattern "${p1.pattern}" validated:`);
  console.log(`  Total validations: ${validations.totalValidations}`);
  console.log(`  Valid count: ${validations.validCount}`);
  console.log(`  Avg confidence: ${(validations.avgConfidence * 100).toFixed(0)}%\n`);

  // Discover emerging patterns
  console.log('PATTERN DISCOVERY');
  console.log('─'.repeat(50) + '\n');

  const emerging = swarm.discoverEmergingPatterns(2);
  console.log('Emerging patterns across swarm:');
  emerging.forEach(e => {
    console.log(`  "${e.pattern}" - ${e.occurrences} nodes, ${(e.avgConfidence * 100).toFixed(0)}% confidence`);
  });
  console.log('');

  // Sync nodes
  console.log('SYNCHRONIZATION');
  console.log('─'.repeat(50) + '\n');

  const syncResult = swarm.sync();
  console.log(`Synchronized ${syncResult.syncPairs} node pairs\n`);

  // Apply patterns
  console.log('PATTERN APPLICATION');
  console.log('─'.repeat(50) + '\n');

  const testText = "This definitely will work and always works perfectly.";
  console.log(`Original: "${testText}"`);

  const result = node1.apply(testText);
  console.log(`Improved: "${result.improved}"`);
  console.log(`Applied ${result.appliedPatterns.length} patterns\n`);

  // Final stats
  console.log('NODE REPORTS');
  console.log('─'.repeat(50) + '\n');

  console.log(node1.formatReport());

  console.log('\n✓ Collective learning demonstration complete\n');
}

module.exports = { CollectiveLearning, PatternSwarm };
