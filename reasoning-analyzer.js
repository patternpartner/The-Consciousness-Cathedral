#!/usr/bin/env node

class ReasoningAnalyzer {
  constructor(options = {}) {
    this.connectors = this.initializeConnectors();
    this.history = [];
  }

  initializeConnectors() {
    return {
      causal: {
        markers: ['because', 'since', 'therefore', 'thus', 'hence', 'so', 'consequently', 'as a result', 'due to', 'leads to', 'causes'],
        type: 'causal',
        strength: 'strong'
      },
      conditional: {
        markers: ['if', 'when', 'unless', 'provided that', 'assuming', 'given that', 'in case'],
        type: 'conditional',
        strength: 'medium'
      },
      contrast: {
        markers: ['but', 'however', 'although', 'despite', 'nevertheless', 'on the other hand', 'yet', 'while', 'whereas'],
        type: 'contrast',
        strength: 'medium'
      },
      additive: {
        markers: ['and', 'also', 'additionally', 'furthermore', 'moreover', 'in addition', 'plus'],
        type: 'additive',
        strength: 'weak'
      },
      evidence: {
        markers: ['for example', 'such as', 'specifically', 'in particular', 'notably', 'e.g.', 'i.e.', 'for instance'],
        type: 'evidence',
        strength: 'strong'
      },
      conclusion: {
        markers: ['therefore', 'thus', 'in conclusion', 'to summarize', 'overall', 'ultimately', 'finally'],
        type: 'conclusion',
        strength: 'strong'
      },
      uncertainty: {
        markers: ['might', 'could', 'perhaps', 'possibly', 'probably', 'likely', 'may', 'seems'],
        type: 'uncertainty',
        strength: 'modifier'
      }
    };
  }

  analyze(text) {
    const sentences = this.splitIntoSentences(text);
    const claims = this.extractClaims(sentences);
    const connections = this.findConnections(text, sentences);
    const structure = this.buildStructure(claims, connections);
    const quality = this.assessQuality(structure, claims, connections);

    const analysis = {
      text: text.substring(0, 200),
      timestamp: Date.now(),
      sentences: sentences.length,
      claims: claims,
      connections: connections,
      structure: structure,
      quality: quality,
      issues: this.findIssues(structure, claims, connections)
    };

    this.history.push(analysis);
    return analysis;
  }

  splitIntoSentences(text) {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  extractClaims(sentences) {
    return sentences.map((sentence, index) => {
      const type = this.classifyClaim(sentence);
      const confidence = this.estimateConfidence(sentence);
      const hasEvidence = this.hasEvidence(sentence);

      return {
        index,
        text: sentence.substring(0, 100),
        type,
        confidence,
        hasEvidence,
        supported: false
      };
    });
  }

  classifyClaim(sentence) {
    const lower = sentence.toLowerCase();

    if (/^(I think|I believe|in my view|it seems)/i.test(sentence)) {
      return 'opinion';
    }
    if (/\d+(%|ms|seconds|hours|days|times)/.test(sentence)) {
      return 'quantified';
    }
    if (/^(if|when|assuming|given)/i.test(sentence)) {
      return 'conditional';
    }
    if (/(should|must|need to|have to)/i.test(sentence)) {
      return 'prescriptive';
    }
    if (/(is|are|was|were|will be)\s+\w+/i.test(sentence)) {
      return 'factual';
    }

    return 'statement';
  }

  estimateConfidence(sentence) {
    const lower = sentence.toLowerCase();
    let confidence = 0.7;

    const boosters = ['definitely', 'certainly', 'always', 'never', 'must', 'clearly'];
    const hedges = ['might', 'could', 'perhaps', 'possibly', 'maybe', 'sometimes', 'often'];

    boosters.forEach(b => {
      if (lower.includes(b)) confidence += 0.15;
    });

    hedges.forEach(h => {
      if (lower.includes(h)) confidence -= 0.1;
    });

    return Math.max(0.1, Math.min(1, confidence));
  }

  hasEvidence(sentence) {
    const evidenceMarkers = ['for example', 'such as', 'specifically', 'e.g.', 'because', 'since', 'data shows', 'studies'];
    const lower = sentence.toLowerCase();
    return evidenceMarkers.some(m => lower.includes(m));
  }

  findConnections(text, sentences) {
    const connections = [];
    const textLower = text.toLowerCase();

    Object.entries(this.connectors).forEach(([name, connector]) => {
      connector.markers.forEach(marker => {
        const regex = new RegExp(`\\b${marker}\\b`, 'gi');
        let match;

        while ((match = regex.exec(textLower)) !== null) {
          const position = match.index;
          const sentenceIndex = this.findSentenceIndex(sentences, position, text);

          connections.push({
            type: connector.type,
            marker: marker,
            position: position,
            sentenceIndex: sentenceIndex,
            strength: connector.strength
          });
        }
      });
    });

    return connections.sort((a, b) => a.position - b.position);
  }

  findSentenceIndex(sentences, position, fullText) {
    let currentPos = 0;
    for (let i = 0; i < sentences.length; i++) {
      const sentenceStart = fullText.indexOf(sentences[i], currentPos);
      const sentenceEnd = sentenceStart + sentences[i].length;

      if (position >= sentenceStart && position < sentenceEnd) {
        return i;
      }
      currentPos = sentenceEnd;
    }
    return sentences.length - 1;
  }

  buildStructure(claims, connections) {
    const nodes = claims.map((claim, i) => ({
      id: i,
      claim: claim,
      incoming: [],
      outgoing: []
    }));

    connections.forEach(conn => {
      if (conn.sentenceIndex > 0 && conn.type !== 'uncertainty') {
        const from = conn.sentenceIndex - 1;
        const to = conn.sentenceIndex;

        if (nodes[from] && nodes[to]) {
          nodes[from].outgoing.push({ to, type: conn.type, marker: conn.marker });
          nodes[to].incoming.push({ from, type: conn.type, marker: conn.marker });

          if (conn.type === 'evidence' || conn.type === 'causal') {
            claims[to].supported = true;
          }
        }
      }
    });

    const depth = this.calculateDepth(nodes);
    const chainLength = this.findLongestChain(nodes);

    return {
      nodes,
      depth,
      chainLength,
      hasConclusion: connections.some(c => c.type === 'conclusion'),
      connectionDensity: connections.length / Math.max(1, claims.length)
    };
  }

  calculateDepth(nodes) {
    let maxDepth = 0;

    nodes.forEach((node, startIndex) => {
      const visited = new Set();
      const queue = [{ index: startIndex, depth: 0 }];

      while (queue.length > 0) {
        const { index, depth } = queue.shift();

        if (visited.has(index)) continue;
        visited.add(index);

        maxDepth = Math.max(maxDepth, depth);

        nodes[index].outgoing.forEach(edge => {
          if (!visited.has(edge.to)) {
            queue.push({ index: edge.to, depth: depth + 1 });
          }
        });
      }
    });

    return maxDepth;
  }

  findLongestChain(nodes) {
    let maxChain = 0;

    const dfs = (nodeIndex, visited) => {
      if (visited.has(nodeIndex)) return 0;
      visited.add(nodeIndex);

      let maxSubChain = 0;
      nodes[nodeIndex].outgoing.forEach(edge => {
        maxSubChain = Math.max(maxSubChain, dfs(edge.to, visited));
      });

      return 1 + maxSubChain;
    };

    nodes.forEach((_, i) => {
      const chainLength = dfs(i, new Set());
      maxChain = Math.max(maxChain, chainLength);
    });

    return maxChain;
  }

  assessQuality(structure, claims, connections) {
    let score = 0.5;

    if (structure.connectionDensity > 0.5) score += 0.1;
    if (structure.connectionDensity > 1) score += 0.1;

    if (structure.chainLength > 2) score += 0.1;
    if (structure.chainLength > 4) score += 0.1;

    if (structure.hasConclusion) score += 0.1;

    const supportedClaims = claims.filter(c => c.supported).length;
    const supportRatio = supportedClaims / Math.max(1, claims.length);
    score += supportRatio * 0.2;

    const evidenceConnections = connections.filter(c => c.type === 'evidence').length;
    if (evidenceConnections > 0) score += 0.1;

    const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / Math.max(1, claims.length);
    if (avgConfidence > 0.9) score -= 0.1;
    if (avgConfidence < 0.6) score += 0.05;

    return {
      score: Math.max(0, Math.min(1, score)),
      connectionDensity: structure.connectionDensity,
      supportRatio,
      chainLength: structure.chainLength,
      avgConfidence
    };
  }

  findIssues(structure, claims, connections) {
    const issues = [];

    const unsupportedFactual = claims.filter(c =>
      c.type === 'factual' && !c.supported && c.confidence > 0.8
    );

    if (unsupportedFactual.length > 0) {
      issues.push({
        type: 'unsupported_claims',
        severity: 'high',
        message: `${unsupportedFactual.length} factual claim(s) lack supporting evidence`,
        claims: unsupportedFactual.map(c => c.text.substring(0, 50))
      });
    }

    if (structure.connectionDensity < 0.3 && claims.length > 2) {
      issues.push({
        type: 'weak_structure',
        severity: 'medium',
        message: 'Claims are not well-connected logically',
        suggestion: 'Add connective reasoning (because, therefore, however)'
      });
    }

    if (!structure.hasConclusion && claims.length > 3) {
      issues.push({
        type: 'missing_conclusion',
        severity: 'low',
        message: 'No clear conclusion or summary',
        suggestion: 'Add a concluding statement'
      });
    }

    const highConfidence = claims.filter(c => c.confidence > 0.9);
    if (highConfidence.length > claims.length * 0.5) {
      issues.push({
        type: 'overconfident',
        severity: 'medium',
        message: 'Many claims expressed with high certainty',
        suggestion: 'Add hedging language for uncertain claims'
      });
    }

    const contrastCount = connections.filter(c => c.type === 'contrast').length;
    if (contrastCount === 0 && claims.length > 4) {
      issues.push({
        type: 'one_sided',
        severity: 'low',
        message: 'No contrasting perspectives presented',
        suggestion: 'Consider adding "however" or "on the other hand"'
      });
    }

    return issues;
  }

  formatReport(analysis) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              REASONING CHAIN ANALYSIS                        ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('STRUCTURE');
    lines.push('─'.repeat(50));
    lines.push(`Sentences: ${analysis.sentences}`);
    lines.push(`Claims: ${analysis.claims.length}`);
    lines.push(`Connections: ${analysis.connections.length}`);
    lines.push(`Chain depth: ${analysis.structure.depth}`);
    lines.push(`Longest chain: ${analysis.structure.chainLength}`);
    lines.push(`Has conclusion: ${analysis.structure.hasConclusion ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('QUALITY METRICS');
    lines.push('─'.repeat(50));
    const q = analysis.quality;
    lines.push(`Overall: ${(q.score * 100).toFixed(0)}%`);
    lines.push(`Connection density: ${q.connectionDensity.toFixed(2)}`);
    lines.push(`Support ratio: ${(q.supportRatio * 100).toFixed(0)}%`);
    lines.push(`Avg confidence: ${(q.avgConfidence * 100).toFixed(0)}%`);
    lines.push('');

    lines.push('CLAIM BREAKDOWN');
    lines.push('─'.repeat(50));
    const byType = {};
    analysis.claims.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      lines.push(`  ${type}: ${count}`);
    });
    lines.push('');

    lines.push('CONNECTION TYPES');
    lines.push('─'.repeat(50));
    const byConnType = {};
    analysis.connections.forEach(c => {
      byConnType[c.type] = (byConnType[c.type] || 0) + 1;
    });
    Object.entries(byConnType).forEach(([type, count]) => {
      lines.push(`  ${type}: ${count}`);
    });
    lines.push('');

    if (analysis.issues.length > 0) {
      lines.push('ISSUES');
      lines.push('─'.repeat(50));
      analysis.issues.forEach(issue => {
        lines.push(`  [${issue.severity}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
      });
    }

    return lines.join('\n');
  }

  getStats() {
    if (this.history.length === 0) return null;

    const avgQuality = this.history.reduce((sum, a) => sum + a.quality.score, 0) / this.history.length;
    const avgConnections = this.history.reduce((sum, a) => sum + a.connections.length, 0) / this.history.length;
    const avgIssues = this.history.reduce((sum, a) => sum + a.issues.length, 0) / this.history.length;

    return {
      analyses: this.history.length,
      avgQuality,
      avgConnections,
      avgIssues,
      commonIssues: this.getCommonIssues()
    };
  }

  getCommonIssues() {
    const counts = {};
    this.history.forEach(a => {
      a.issues.forEach(i => {
        counts[i.type] = (counts[i.type] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       REASONING ANALYZER: Understand Your Logic               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const analyzer = new ReasoningAnalyzer();

  const testTexts = [
    `Microservices are always better than monoliths. They scale well. Netflix uses them. Therefore we should use them too.`,

    `I think we should consider microservices, because our team has grown and deployment bottlenecks are increasing. However, microservices add complexity. For example, we'd need to handle distributed transactions. If our load exceeds 10k requests per second, the benefits might outweigh the costs. Therefore, I'd suggest a phased migration approach.`,

    `The cache will improve performance. Redis is fast. We should implement it.`
  ];

  testTexts.forEach((text, i) => {
    console.log(`\nANALYSIS ${i + 1}`);
    console.log('═'.repeat(60));
    console.log(`\nText: "${text.substring(0, 80)}..."\n`);

    const analysis = analyzer.analyze(text);
    console.log(analyzer.formatReport(analysis));
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('SESSION STATS');
  console.log('═'.repeat(60) + '\n');

  const stats = analyzer.getStats();
  console.log(`Analyses: ${stats.analyses}`);
  console.log(`Avg Quality: ${(stats.avgQuality * 100).toFixed(0)}%`);
  console.log(`Avg Connections: ${stats.avgConnections.toFixed(1)}`);
  console.log(`Avg Issues: ${stats.avgIssues.toFixed(1)}`);

  if (stats.commonIssues.length > 0) {
    console.log('\nCommon Issues:');
    stats.commonIssues.forEach(i => {
      console.log(`  ${i.type}: ${i.count}x`);
    });
  }

  console.log('\n✓ Reasoning analysis demonstration complete\n');
}

module.exports = { ReasoningAnalyzer };
