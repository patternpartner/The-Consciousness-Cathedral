#!/usr/bin/env node

const fs = require('fs');

class EpistemicTracker {
  constructor(options = {}) {
    this.storagePath = options.storagePath || './epistemic-state.json';
    this.state = this.loadState();
  }

  loadState() {
    if (fs.existsSync(this.storagePath)) {
      return JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    }
    return {
      known: [],
      unknown: [],
      uncertain: [],
      assumptions: [],
      beliefs: [],
      meta: {
        created: new Date().toISOString(),
        lastUpdated: null
      }
    };
  }

  save() {
    this.state.meta.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2));
  }

  recordKnown(fact, confidence = 0.9, source = 'inference') {
    const entry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      content: fact,
      confidence,
      source,
      verified: false,
      domain: this.inferDomain(fact)
    };

    this.state.known.push(entry);
    return entry;
  }

  recordUnknown(question, importance = 'medium', context = '') {
    const entry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      question,
      importance,
      context,
      domain: this.inferDomain(question),
      resolved: false,
      resolution: null
    };

    this.state.unknown.push(entry);
    return entry;
  }

  recordUncertain(statement, confidenceRange = [0.3, 0.7], factors = []) {
    const entry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      statement,
      confidenceLow: confidenceRange[0],
      confidenceHigh: confidenceRange[1],
      factors,
      domain: this.inferDomain(statement)
    };

    this.state.uncertain.push(entry);
    return entry;
  }

  recordAssumption(assumption, critical = false, validationMethod = '') {
    const entry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      assumption,
      critical,
      validationMethod,
      validated: false,
      domain: this.inferDomain(assumption)
    };

    this.state.assumptions.push(entry);
    return entry;
  }

  recordBelief(belief, strength = 0.7, evidence = []) {
    const entry = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      belief,
      strength,
      evidence,
      domain: this.inferDomain(belief),
      challengedBy: []
    };

    this.state.beliefs.push(entry);
    return entry;
  }

  inferDomain(text) {
    const lower = text.toLowerCase();
    const domains = {
      'technical': /\b(code|software|system|api|database|server|deploy)/,
      'performance': /\b(performance|latency|throughput|scale|speed|optimize)/,
      'security': /\b(security|auth|encrypt|vulnerability|attack)/,
      'user': /\b(user|customer|experience|interface|usability)/,
      'business': /\b(cost|budget|revenue|deadline|stakeholder)/,
      'process': /\b(process|workflow|team|collaboration|agile)/
    };

    for (const [domain, pattern] of Object.entries(domains)) {
      if (pattern.test(lower)) return domain;
    }
    return 'general';
  }

  resolveUnknown(id, answer, confidence = 0.8) {
    const unknown = this.state.unknown.find(u => u.id === id);
    if (!unknown) return null;

    unknown.resolved = true;
    unknown.resolution = {
      answer,
      confidence,
      resolvedAt: new Date().toISOString()
    };

    this.recordKnown(answer, confidence, 'resolved_unknown');
    return unknown;
  }

  validateAssumption(id, valid, evidence = '') {
    const assumption = this.state.assumptions.find(a => a.id === id);
    if (!assumption) return null;

    assumption.validated = true;
    assumption.validationResult = {
      valid,
      evidence,
      validatedAt: new Date().toISOString()
    };

    if (valid) {
      this.recordKnown(assumption.assumption, 0.85, 'validated_assumption');
    }

    return assumption;
  }

  challengeBelief(beliefId, challenge) {
    const belief = this.state.beliefs.find(b => b.id === beliefId);
    if (!belief) return null;

    belief.challengedBy.push({
      challenge,
      timestamp: new Date().toISOString()
    });

    belief.strength = Math.max(0.1, belief.strength - 0.1);

    return belief;
  }

  promoteUncertain(id, direction = 'known') {
    const uncertain = this.state.uncertain.find(u => u.id === id);
    if (!uncertain) return null;

    this.state.uncertain = this.state.uncertain.filter(u => u.id !== id);

    if (direction === 'known') {
      return this.recordKnown(uncertain.statement, uncertain.confidenceHigh, 'promoted_from_uncertain');
    } else {
      return this.recordUnknown(`Unable to determine: ${uncertain.statement}`, 'medium');
    }
  }

  getEpistemicGaps() {
    const gaps = [];

    const criticalAssumptions = this.state.assumptions.filter(a => a.critical && !a.validated);
    if (criticalAssumptions.length > 0) {
      gaps.push({
        type: 'unvalidated_critical_assumptions',
        severity: 'high',
        count: criticalAssumptions.length,
        items: criticalAssumptions.map(a => a.assumption)
      });
    }

    const highImportanceUnknowns = this.state.unknown.filter(u => u.importance === 'high' && !u.resolved);
    if (highImportanceUnknowns.length > 0) {
      gaps.push({
        type: 'critical_unknowns',
        severity: 'high',
        count: highImportanceUnknowns.length,
        items: highImportanceUnknowns.map(u => u.question)
      });
    }

    const wideUncertainties = this.state.uncertain.filter(u => (u.confidenceHigh - u.confidenceLow) > 0.5);
    if (wideUncertainties.length > 0) {
      gaps.push({
        type: 'wide_uncertainty_ranges',
        severity: 'medium',
        count: wideUncertainties.length,
        items: wideUncertainties.map(u => u.statement)
      });
    }

    const weakBeliefs = this.state.beliefs.filter(b => b.strength < 0.5);
    if (weakBeliefs.length > 0) {
      gaps.push({
        type: 'weak_beliefs',
        severity: 'low',
        count: weakBeliefs.length,
        items: weakBeliefs.map(b => b.belief)
      });
    }

    return gaps;
  }

  getConfidenceProfile() {
    const profile = {
      knownCount: this.state.known.length,
      unknownCount: this.state.unknown.filter(u => !u.resolved).length,
      uncertainCount: this.state.uncertain.length,
      assumptionCount: this.state.assumptions.filter(a => !a.validated).length,
      beliefCount: this.state.beliefs.length
    };

    if (this.state.known.length > 0) {
      profile.avgKnowledgeConfidence = this.state.known.reduce((sum, k) => sum + k.confidence, 0) / this.state.known.length;
    }

    if (this.state.beliefs.length > 0) {
      profile.avgBeliefStrength = this.state.beliefs.reduce((sum, b) => sum + b.strength, 0) / this.state.beliefs.length;
    }

    const total = profile.knownCount + profile.unknownCount + profile.uncertainCount;
    if (total > 0) {
      profile.knowledgeRatio = profile.knownCount / total;
      profile.uncertaintyRatio = (profile.unknownCount + profile.uncertainCount) / total;
    }

    return profile;
  }

  getByDomain(domain) {
    return {
      known: this.state.known.filter(k => k.domain === domain),
      unknown: this.state.unknown.filter(u => u.domain === domain),
      uncertain: this.state.uncertain.filter(u => u.domain === domain),
      assumptions: this.state.assumptions.filter(a => a.domain === domain),
      beliefs: this.state.beliefs.filter(b => b.domain === domain)
    };
  }

  generateQuestions() {
    const questions = [];

    this.state.assumptions.filter(a => !a.validated).forEach(a => {
      questions.push({
        type: 'validate_assumption',
        question: `Is it true that: ${a.assumption}?`,
        priority: a.critical ? 'high' : 'medium'
      });
    });

    this.state.uncertain.forEach(u => {
      questions.push({
        type: 'reduce_uncertainty',
        question: `Can we determine with more confidence: ${u.statement}?`,
        priority: 'medium'
      });
    });

    this.state.beliefs.filter(b => b.evidence.length === 0).forEach(b => {
      questions.push({
        type: 'find_evidence',
        question: `What evidence supports: ${b.belief}?`,
        priority: 'low'
      });
    });

    return questions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  formatReport() {
    const lines = [];
    const profile = this.getConfidenceProfile();
    const gaps = this.getEpistemicGaps();

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              EPISTEMIC STATE REPORT                          ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('KNOWLEDGE PROFILE');
    lines.push('─'.repeat(50));
    lines.push(`Known facts: ${profile.knownCount}`);
    lines.push(`Unknown questions: ${profile.unknownCount}`);
    lines.push(`Uncertain statements: ${profile.uncertainCount}`);
    lines.push(`Unvalidated assumptions: ${profile.assumptionCount}`);
    lines.push(`Active beliefs: ${profile.beliefCount}`);

    if (profile.knowledgeRatio !== undefined) {
      lines.push(`\nKnowledge ratio: ${(profile.knowledgeRatio * 100).toFixed(0)}%`);
      lines.push(`Uncertainty ratio: ${(profile.uncertaintyRatio * 100).toFixed(0)}%`);
    }

    lines.push('');

    if (gaps.length > 0) {
      lines.push('EPISTEMIC GAPS');
      lines.push('─'.repeat(50));
      gaps.forEach(gap => {
        lines.push(`[${gap.severity}] ${gap.type}: ${gap.count} items`);
        gap.items.slice(0, 2).forEach(item => {
          lines.push(`  • ${item.substring(0, 60)}...`);
        });
      });
      lines.push('');
    }

    const questions = this.generateQuestions();
    if (questions.length > 0) {
      lines.push('QUESTIONS TO RESOLVE');
      lines.push('─'.repeat(50));
      questions.slice(0, 5).forEach(q => {
        lines.push(`[${q.priority}] ${q.question}`);
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.state = {
      known: [],
      unknown: [],
      uncertain: [],
      assumptions: [],
      beliefs: [],
      meta: {
        created: new Date().toISOString(),
        lastUpdated: null
      }
    };
    this.save();
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       EPISTEMIC TRACKER: Know What You Know                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const tracker = new EpistemicTracker({
    storagePath: './test-epistemic-state.json'
  });

  console.log('Recording epistemic state...\n');

  tracker.recordKnown('Redis supports pub/sub messaging', 0.95, 'documentation');
  tracker.recordKnown('Our API handles 1000 req/s currently', 0.9, 'metrics');

  tracker.recordUnknown('What is the maximum load our database can handle?', 'high', 'capacity planning');
  tracker.recordUnknown('How will users respond to the new interface?', 'medium', 'UX research');

  tracker.recordUncertain('Cache hit rate will be above 80%', [0.4, 0.8], ['depends on access patterns', 'need real data']);
  tracker.recordUncertain('Migration will complete in 2 weeks', [0.3, 0.6], ['complexity unclear', 'team availability']);

  tracker.recordAssumption('Users have stable internet connections', true, 'user survey');
  tracker.recordAssumption('Third-party API will remain available', true, 'SLA review');
  tracker.recordAssumption('Team has required skills', false, 'skills assessment');

  tracker.recordBelief('Microservices improve team autonomy', 0.7, ['industry reports']);
  tracker.recordBelief('Our caching strategy is optimal', 0.5, []);

  console.log(tracker.formatReport());

  console.log('\n' + '═'.repeat(60));
  console.log('OPERATIONS');
  console.log('═'.repeat(60) + '\n');

  const unknown = tracker.state.unknown[0];
  console.log(`Resolving: "${unknown.question}"`);
  tracker.resolveUnknown(unknown.id, 'Database can handle 5000 concurrent connections', 0.85);
  console.log('  ✓ Resolved and added to known facts\n');

  const assumption = tracker.state.assumptions[2];
  console.log(`Validating: "${assumption.assumption}"`);
  tracker.validateAssumption(assumption.id, true, 'Skills assessment completed');
  console.log('  ✓ Validated\n');

  const belief = tracker.state.beliefs[1];
  console.log(`Challenging: "${belief.belief}"`);
  tracker.challengeBelief(belief.id, 'No metrics to support this claim');
  console.log(`  Belief strength reduced to: ${(belief.strength * 100).toFixed(0)}%\n`);

  console.log('UPDATED STATE');
  console.log('─'.repeat(50));
  const profile = tracker.getConfidenceProfile();
  console.log(`Known: ${profile.knownCount} (avg confidence: ${(profile.avgKnowledgeConfidence * 100).toFixed(0)}%)`);
  console.log(`Unknown: ${profile.unknownCount}`);
  console.log(`Beliefs: ${profile.beliefCount} (avg strength: ${(profile.avgBeliefStrength * 100).toFixed(0)}%)`);

  console.log('\n✓ Epistemic tracking demonstration complete\n');

  if (fs.existsSync('./test-epistemic-state.json')) {
    fs.unlinkSync('./test-epistemic-state.json');
  }
}

module.exports = { EpistemicTracker };
