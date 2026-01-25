#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class PatternDB {
  constructor(dbPath = './patterns.json') {
    this.dbPath = dbPath;
    this.patterns = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading pattern DB:', e.message);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.patterns, null, 2));
      return true;
    } catch (e) {
      console.error('Error saving pattern DB:', e.message);
      return false;
    }
  }

  store(pattern) {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...pattern
    };

    this.patterns.push(entry);
    this.save();
    return entry;
  }

  query(filters = {}) {
    let results = this.patterns;

    if (filters.type) {
      results = results.filter(p => p.type === filters.type);
    }

    if (filters.minScore) {
      results = results.filter(p => (p.score || 0) >= filters.minScore);
    }

    if (filters.tag) {
      results = results.filter(p =>
        p.tags && p.tags.includes(filters.tag)
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(p =>
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.context && p.context.toLowerCase().includes(search)) ||
        (p.solution && p.solution.toLowerCase().includes(search))
      );
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  findSimilar(context, limit = 5) {
    const keywords = this.extractKeywords(context);

    const scored = this.patterns.map(p => {
      let score = 0;

      keywords.forEach(keyword => {
        const text = `${p.context} ${p.description} ${p.solution}`.toLowerCase();
        if (text.includes(keyword)) {
          score++;
        }
      });

      if (p.tags) {
        keywords.forEach(keyword => {
          if (p.tags.some(tag => tag.toLowerCase().includes(keyword))) {
            score += 2;
          }
        });
      }

      return { ...p, similarityScore: score };
    });

    return scored
      .filter(p => p.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from']);

    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 10);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    const byType = {};
    const byTag = {};

    this.patterns.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1;

      if (p.tags) {
        p.tags.forEach(tag => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
      }
    });

    return {
      total: this.patterns.length,
      byType,
      byTag,
      oldest: this.patterns[0]?.timestamp,
      newest: this.patterns[this.patterns.length - 1]?.timestamp
    };
  }

  export() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: this.patterns.length,
      patterns: this.patterns
    };
  }

  import(data) {
    if (!data.patterns || !Array.isArray(data.patterns)) {
      throw new Error('Invalid import data');
    }

    this.patterns.push(...data.patterns);
    this.save();
    return data.patterns.length;
  }
}

if (require.main === module) {
  const db = new PatternDB();

  const command = process.argv[2];

  if (command === 'add') {
    const pattern = {
      type: process.argv[3] || 'general',
      description: process.argv[4] || 'No description',
      context: process.argv[5] || '',
      solution: process.argv[6] || '',
      tags: process.argv[7] ? process.argv[7].split(',') : []
    };

    const entry = db.store(pattern);
    console.log('Pattern stored:', entry.id);

  } else if (command === 'query') {
    const search = process.argv[3];
    const results = db.query({ search, limit: 10 });

    console.log(`\nFound ${results.length} patterns:\n`);
    results.forEach((p, i) => {
      console.log(`${i + 1}. [${p.type}] ${p.description}`);
      if (p.context) console.log(`   Context: ${p.context.substring(0, 80)}...`);
      if (p.solution) console.log(`   Solution: ${p.solution.substring(0, 80)}...`);
      console.log();
    });

  } else if (command === 'similar') {
    const context = process.argv.slice(3).join(' ');
    const results = db.findSimilar(context, 5);

    console.log(`\nSimilar patterns:\n`);
    results.forEach((p, i) => {
      console.log(`${i + 1}. [${p.type}] ${p.description} (score: ${p.similarityScore})`);
      if (p.solution) console.log(`   Solution: ${p.solution.substring(0, 80)}...`);
      console.log();
    });

  } else if (command === 'stats') {
    const stats = db.getStats();
    console.log('\nPattern Database Statistics:\n');
    console.log(`Total Patterns: ${stats.total}`);
    console.log(`\nBy Type:`);
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log(`\nBy Tag:`);
    Object.entries(stats.byTag).forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count}`);
    });

  } else {
    console.log('Pattern Database CLI\n');
    console.log('Usage:');
    console.log('  node pattern-db.js add <type> <description> <context> <solution> <tags>');
    console.log('  node pattern-db.js query <search-term>');
    console.log('  node pattern-db.js similar <context>');
    console.log('  node pattern-db.js stats');
    console.log('\nExample:');
    console.log('  node pattern-db.js add uncertainty "False certainty collapse" "User asked for definitive answer" "Hedge with uncertainty markers" "uncertainty,epistemic"');
  }
}

module.exports = PatternDB;
