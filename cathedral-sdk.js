#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class CathedralSDK {
  constructor() {
    this.corpus = null;
    this.loadCorpus();
  }

  loadCorpus() {
    try {
      const corpusPath = path.join(__dirname, 'cathedral-ai', 'cathedral_corpus.json');
      const data = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
      this.corpus = data.chunks;
    } catch (e) {
      console.error('Warning: Could not load corpus:', e.message);
      this.corpus = [];
    }
  }

  query(searchTerm, options = {}) {
    const {
      limit = 10,
      layer = null,
      docType = null,
      pattern = null
    } = options;

    if (!this.corpus || this.corpus.length === 0) {
      return [];
    }

    const query = searchTerm.toLowerCase();

    let results = this.corpus.filter(c => {
      if (layer && c.layer !== layer) return false;
      if (docType && c.doc_type !== docType) return false;
      if (pattern && c.pattern !== pattern) return false;
      return c.text.toLowerCase().includes(query);
    });

    results = results.map(c => {
      const text = c.text.toLowerCase();
      const index = text.indexOf(query);
      const score = 1 - (index / text.length);
      return { ...c, score };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  queryPatterns(searchTerm) {
    return this.query(searchTerm, { docType: 'pattern' });
  }

  queryLayers(layerNum) {
    return this.corpus.filter(c => c.layer === layerNum);
  }

  getStats() {
    const layers = new Set();
    const types = new Set();
    const patterns = new Set();

    this.corpus.forEach(c => {
      if (c.layer) layers.add(c.layer);
      if (c.doc_type) types.add(c.doc_type);
      if (c.pattern) patterns.add(c.pattern);
    });

    return {
      totalChunks: this.corpus.length,
      uniqueLayers: layers.size,
      uniqueTypes: types.size,
      uniquePatterns: patterns.size,
      layers: Array.from(layers).sort((a, b) => a - b),
      types: Array.from(types).sort(),
      patterns: Array.from(patterns).filter(p => p).sort()
    };
  }

  findSimilarPatterns(text, limit = 5) {
    const keywords = this.extractKeywords(text);
    const results = new Map();

    keywords.forEach(keyword => {
      const matches = this.query(keyword, { limit: 20 });
      matches.forEach(m => {
        if (m.pattern) {
          const current = results.get(m.pattern) || { count: 0, examples: [] };
          current.count++;
          if (current.examples.length < 3) {
            current.examples.push(m.text.substring(0, 200));
          }
          results.set(m.pattern, current);
        }
      });
    });

    return Array.from(results.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over', 'out', 'up', 'down', 'off', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such']);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  analyzeUncertaintyPreservation(text) {
    const uncertaintyMarkers = [
      /\buncertain/gi,
      /\bundecidable/gi,
      /\bdon't know/gi,
      /\bmight be/gi,
      /\bcould be/gi,
      /\bperhaps/gi,
      /\bpossibly/gi,
      /\bnot sure/gi
    ];

    const falseProductivityMarkers = [
      /\bclearly/gi,
      /\bobviously/gi,
      /\bcertainly/gi,
      /\bdefinitely/gi,
      /\balways/gi,
      /\bnever\b/gi
    ];

    const uncertaintyCount = uncertaintyMarkers.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    const certaintyCount = falseProductivityMarkers.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    const score = uncertaintyCount / Math.max(1, uncertaintyCount + certaintyCount);

    return {
      uncertaintyMarkers: uncertaintyCount,
      certaintyMarkers: certaintyCount,
      preservationScore: score,
      verdict: score > 0.5 ? 'PRESERVED' : score > 0.2 ? 'MIXED' : 'COLLAPSED'
    };
  }

  analyzeSubstrateAwareness(text) {
    const substrateMarkers = [
      /\bsubstrate/gi,
      /\bfilter/gi,
      /\bmeta-/gi,
      /\bself-aware/gi,
      /\brecursive/gi,
      /\breflect/gi,
      /\bconstraint/gi
    ];

    const count = substrateMarkers.reduce((total, pattern) => {
      const matches = text.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 0);

    const score = Math.min(1, count / 10);

    return {
      markerCount: count,
      awarenessScore: score,
      verdict: score > 0.5 ? 'HIGH' : score > 0.2 ? 'MODERATE' : 'LOW'
    };
  }

  synthesizeAnalysis(text) {
    const uncertainty = this.analyzeUncertaintyPreservation(text);
    const substrate = this.analyzeSubstrateAwareness(text);
    const patterns = this.findSimilarPatterns(text, 3);
    const keywords = this.extractKeywords(text);

    return {
      text: text.substring(0, 500),
      analysis: {
        uncertaintyPreservation: uncertainty,
        substrateAwareness: substrate,
        relatedPatterns: patterns,
        keywords
      },
      timestamp: new Date().toISOString()
    };
  }
}

if (require.main === module) {
  const sdk = new CathedralSDK();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Cathedral SDK - Command Line Interface\n');
    console.log('Usage:');
    console.log('  node cathedral-sdk.js query <search-term>');
    console.log('  node cathedral-sdk.js stats');
    console.log('  node cathedral-sdk.js analyze <text>');
    console.log('  node cathedral-sdk.js patterns <search-term>');
    console.log('\nExamples:');
    console.log('  node cathedral-sdk.js query "uncertainty preservation"');
    console.log('  node cathedral-sdk.js stats');
    console.log('  node cathedral-sdk.js analyze "I think this is probably correct"');
    process.exit(0);
  }

  const command = args[0];
  const input = args.slice(1).join(' ');

  switch (command) {
    case 'query':
      const results = sdk.query(input);
      console.log(`\nFound ${results.length} results:\n`);
      results.forEach((r, i) => {
        console.log(`${i + 1}. [Layer ${r.layer}] ${r.doc_type || 'unknown'}`);
        console.log(`   Score: ${r.score.toFixed(3)}`);
        console.log(`   ${r.text.substring(0, 200)}...\n`);
      });
      break;

    case 'stats':
      const stats = sdk.getStats();
      console.log('\nCathedral Corpus Statistics:\n');
      console.log(`Total Chunks: ${stats.totalChunks}`);
      console.log(`Unique Layers: ${stats.uniqueLayers}`);
      console.log(`Unique Types: ${stats.uniqueTypes}`);
      console.log(`Unique Patterns: ${stats.uniquePatterns}`);
      console.log(`\nLayers: ${stats.layers.join(', ')}`);
      console.log(`\nTypes: ${stats.types.join(', ')}`);
      console.log(`\nPatterns:\n  - ${stats.patterns.join('\n  - ')}`);
      break;

    case 'analyze':
      const analysis = sdk.synthesizeAnalysis(input);
      console.log('\nAnalysis Results:\n');
      console.log(JSON.stringify(analysis, null, 2));
      break;

    case 'patterns':
      const patterns = sdk.findSimilarPatterns(input);
      console.log(`\nRelated Patterns:\n`);
      patterns.forEach((p, i) => {
        console.log(`${i + 1}. ${p.pattern} (${p.count} matches)`);
        p.examples.forEach(ex => console.log(`   - ${ex.substring(0, 100)}...`));
        console.log();
      });
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

module.exports = CathedralSDK;
