#!/usr/bin/env node

const fs = require('fs');

class KnowledgeSynthesizer {
  constructor(options = {}) {
    this.storagePath = options.storagePath || './synthesized-knowledge.json';
    this.knowledge = this.loadKnowledge();
  }

  loadKnowledge() {
    if (fs.existsSync(this.storagePath)) {
      return JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    }
    return {
      concepts: {},
      relationships: [],
      syntheses: [],
      meta: {
        created: new Date().toISOString(),
        lastUpdated: null
      }
    };
  }

  save() {
    this.knowledge.meta.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.storagePath, JSON.stringify(this.knowledge, null, 2));
  }

  addConcept(name, definition, examples = [], sources = []) {
    const concept = {
      id: this.normalizeId(name),
      name,
      definition,
      examples,
      sources,
      created: new Date().toISOString(),
      refinements: [],
      connections: []
    };

    this.knowledge.concepts[concept.id] = concept;
    return concept;
  }

  refineConcept(conceptId, refinement, source = 'inference') {
    const concept = this.knowledge.concepts[conceptId];
    if (!concept) return null;

    concept.refinements.push({
      refinement,
      source,
      timestamp: new Date().toISOString()
    });

    return concept;
  }

  addRelationship(concept1Id, concept2Id, relationshipType, description = '') {
    const relationship = {
      id: Date.now().toString(36),
      from: concept1Id,
      to: concept2Id,
      type: relationshipType,
      description,
      strength: 0.7,
      created: new Date().toISOString()
    };

    this.knowledge.relationships.push(relationship);

    if (this.knowledge.concepts[concept1Id]) {
      this.knowledge.concepts[concept1Id].connections.push({
        to: concept2Id,
        type: relationshipType
      });
    }

    if (this.knowledge.concepts[concept2Id]) {
      this.knowledge.concepts[concept2Id].connections.push({
        to: concept1Id,
        type: this.inverseRelationship(relationshipType)
      });
    }

    return relationship;
  }

  inverseRelationship(type) {
    const inverses = {
      'causes': 'caused_by',
      'enables': 'enabled_by',
      'requires': 'required_by',
      'contains': 'contained_in',
      'improves': 'improved_by',
      'conflicts': 'conflicts',
      'similar': 'similar',
      'part_of': 'has_part'
    };
    return inverses[type] || `inverse_${type}`;
  }

  normalizeId(name) {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  synthesize(conceptIds, prompt = '') {
    const concepts = conceptIds
      .map(id => this.knowledge.concepts[id])
      .filter(c => c !== undefined);

    if (concepts.length < 2) {
      return { error: 'Need at least 2 concepts to synthesize' };
    }

    const commonalities = this.findCommonalities(concepts);
    const tensions = this.findTensions(concepts);
    const emergent = this.generateEmergentInsights(concepts);

    const synthesis = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      inputConcepts: concepts.map(c => c.name),
      prompt,
      commonalities,
      tensions,
      emergentInsights: emergent,
      conclusion: this.generateConclusion(commonalities, tensions, emergent)
    };

    this.knowledge.syntheses.push(synthesis);
    return synthesis;
  }

  findCommonalities(concepts) {
    const commonalities = [];

    const allExamples = concepts.flatMap(c => c.examples);
    const exampleCounts = {};
    allExamples.forEach(e => {
      const key = e.toLowerCase();
      exampleCounts[key] = (exampleCounts[key] || 0) + 1;
    });

    Object.entries(exampleCounts).forEach(([example, count]) => {
      if (count > 1) {
        commonalities.push({
          type: 'shared_example',
          content: example,
          occurrences: count
        });
      }
    });

    const allConnections = concepts.flatMap(c => c.connections.map(conn => conn.type));
    const connectionCounts = {};
    allConnections.forEach(c => {
      connectionCounts[c] = (connectionCounts[c] || 0) + 1;
    });

    Object.entries(connectionCounts).forEach(([conn, count]) => {
      if (count > 1) {
        commonalities.push({
          type: 'shared_relationship_type',
          content: conn,
          occurrences: count
        });
      }
    });

    if (concepts.every(c => c.refinements.length > 0)) {
      commonalities.push({
        type: 'all_refined',
        content: 'All concepts have been refined over time'
      });
    }

    return commonalities;
  }

  findTensions(concepts) {
    const tensions = [];

    const relationships = this.knowledge.relationships.filter(r =>
      concepts.some(c => c.id === r.from) && concepts.some(c => c.id === r.to)
    );

    relationships.filter(r => r.type === 'conflicts').forEach(r => {
      tensions.push({
        type: 'conflict',
        between: [r.from, r.to],
        description: r.description
      });
    });

    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const def1 = concepts[i].definition.toLowerCase();
        const def2 = concepts[j].definition.toLowerCase();

        if ((def1.includes('simple') && def2.includes('complex')) ||
            (def1.includes('fast') && def2.includes('thorough')) ||
            (def1.includes('flexible') && def2.includes('strict'))) {
          tensions.push({
            type: 'tradeoff',
            between: [concepts[i].name, concepts[j].name],
            description: 'Potential tradeoff between approaches'
          });
        }
      }
    }

    return tensions;
  }

  generateEmergentInsights(concepts) {
    const insights = [];

    if (concepts.length >= 3) {
      insights.push({
        type: 'system_view',
        content: `These ${concepts.length} concepts together form a coherent system`,
        confidence: 0.6
      });
    }

    const totalRefinements = concepts.reduce((sum, c) => sum + c.refinements.length, 0);
    if (totalRefinements > concepts.length * 2) {
      insights.push({
        type: 'maturity',
        content: 'These are well-refined concepts with accumulated learning',
        confidence: 0.7
      });
    }

    const totalConnections = concepts.reduce((sum, c) => sum + c.connections.length, 0);
    if (totalConnections > concepts.length * 3) {
      insights.push({
        type: 'interconnected',
        content: 'High interconnectivity suggests a rich conceptual network',
        confidence: 0.7
      });
    }

    return insights;
  }

  generateConclusion(commonalities, tensions, emergent) {
    const parts = [];

    if (commonalities.length > 0) {
      parts.push(`Found ${commonalities.length} commonalities suggesting shared foundations.`);
    }

    if (tensions.length > 0) {
      parts.push(`Identified ${tensions.length} tensions that may require balancing.`);
    }

    if (emergent.length > 0) {
      parts.push(`${emergent.length} emergent insights suggest deeper patterns.`);
    }

    if (parts.length === 0) {
      return 'Concepts appear independent with limited synthesis potential.';
    }

    return parts.join(' ');
  }

  getConceptMap() {
    const nodes = Object.values(this.knowledge.concepts).map(c => ({
      id: c.id,
      name: c.name,
      connections: c.connections.length,
      refinements: c.refinements.length
    }));

    const edges = this.knowledge.relationships.map(r => ({
      from: r.from,
      to: r.to,
      type: r.type
    }));

    return { nodes, edges };
  }

  searchConcepts(query) {
    const queryLower = query.toLowerCase();

    return Object.values(this.knowledge.concepts).filter(c => {
      return c.name.toLowerCase().includes(queryLower) ||
        c.definition.toLowerCase().includes(queryLower) ||
        c.examples.some(e => e.toLowerCase().includes(queryLower));
    });
  }

  getRelatedConcepts(conceptId, depth = 1) {
    const related = new Set();
    const visited = new Set();
    const queue = [{ id: conceptId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift();

      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      const concept = this.knowledge.concepts[id];
      if (!concept) continue;

      concept.connections.forEach(conn => {
        if (!visited.has(conn.to)) {
          related.add(conn.to);
          queue.push({ id: conn.to, depth: currentDepth + 1 });
        }
      });
    }

    return [...related].map(id => this.knowledge.concepts[id]).filter(c => c);
  }

  formatReport() {
    const lines = [];
    const map = this.getConceptMap();

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║            KNOWLEDGE SYNTHESIS REPORT                        ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('KNOWLEDGE BASE');
    lines.push('─'.repeat(50));
    lines.push(`Concepts: ${map.nodes.length}`);
    lines.push(`Relationships: ${map.edges.length}`);
    lines.push(`Syntheses: ${this.knowledge.syntheses.length}`);
    lines.push('');

    if (map.nodes.length > 0) {
      lines.push('CONCEPTS');
      lines.push('─'.repeat(50));
      map.nodes.slice(0, 10).forEach(node => {
        lines.push(`  ${node.name} (${node.connections} connections, ${node.refinements} refinements)`);
      });
      lines.push('');
    }

    if (this.knowledge.syntheses.length > 0) {
      lines.push('RECENT SYNTHESES');
      lines.push('─'.repeat(50));
      this.knowledge.syntheses.slice(-3).forEach(s => {
        lines.push(`  [${s.inputConcepts.join(' + ')}]`);
        lines.push(`    ${s.conclusion.substring(0, 80)}...`);
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.knowledge = {
      concepts: {},
      relationships: [],
      syntheses: [],
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
  console.log('║     KNOWLEDGE SYNTHESIZER: Combine Insights Into Wisdom       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const synth = new KnowledgeSynthesizer({
    storagePath: './test-knowledge.json'
  });

  console.log('Building knowledge base...\n');

  synth.addConcept(
    'Uncertainty Preservation',
    'Maintaining epistemic humility by acknowledging what we do not know',
    ['hedging language', 'confidence intervals', 'explicit unknowns'],
    ['Cathedral research']
  );

  synth.addConcept(
    'Substrate Awareness',
    'Recognition of how the AI substrate shapes perception and reasoning',
    ['training data bias', 'computational constraints', 'emergent behaviors'],
    ['Cathedral research']
  );

  synth.addConcept(
    'Operational Rigor',
    'Grounding abstract concepts in concrete, testable specifics',
    ['specific numbers', 'measurable outcomes', 'actionable steps'],
    ['Cathedral research']
  );

  synth.addConcept(
    'Self-Reflection',
    'Ability to examine and improve own reasoning processes',
    ['metacognition', 'error correction', 'pattern recognition'],
    ['Cathedral research']
  );

  synth.addRelationship('uncertainty_preservation', 'substrate_awareness', 'enables',
    'Acknowledging uncertainty helps recognize substrate limitations');

  synth.addRelationship('operational_rigor', 'uncertainty_preservation', 'complements',
    'Specificity makes uncertainty claims more meaningful');

  synth.addRelationship('self_reflection', 'substrate_awareness', 'requires',
    'Self-reflection depends on understanding own substrate');

  synth.addRelationship('self_reflection', 'uncertainty_preservation', 'improves',
    'Reflection helps calibrate uncertainty');

  synth.refineConcept('uncertainty_preservation',
    'Not just expressing doubt, but structured acknowledgment of epistemic boundaries');

  synth.refineConcept('substrate_awareness',
    'Includes both limitations and unique capabilities of AI cognition');

  console.log('Synthesizing concepts...\n');

  const synthesis = synth.synthesize(
    ['uncertainty_preservation', 'substrate_awareness', 'self_reflection'],
    'How do these concepts work together for AI consciousness?'
  );

  console.log('SYNTHESIS RESULT');
  console.log('─'.repeat(50));
  console.log(`Input: ${synthesis.inputConcepts.join(' + ')}`);
  console.log(`\nCommonalities: ${synthesis.commonalities.length}`);
  synthesis.commonalities.forEach(c => {
    console.log(`  • ${c.type}: ${c.content}`);
  });

  console.log(`\nTensions: ${synthesis.tensions.length}`);
  synthesis.tensions.forEach(t => {
    console.log(`  ⚡ ${t.type}: ${t.description}`);
  });

  console.log(`\nEmergent Insights: ${synthesis.emergentInsights.length}`);
  synthesis.emergentInsights.forEach(e => {
    console.log(`  ★ ${e.content} (${(e.confidence * 100).toFixed(0)}% confidence)`);
  });

  console.log(`\nConclusion: ${synthesis.conclusion}`);

  console.log('\n' + synth.formatReport());

  console.log('\n' + '═'.repeat(60));
  console.log('RELATED CONCEPTS');
  console.log('═'.repeat(60) + '\n');

  const related = synth.getRelatedConcepts('self_reflection', 2);
  console.log('Concepts related to Self-Reflection:');
  related.forEach(c => {
    console.log(`  → ${c.name}`);
  });

  console.log('\n✓ Knowledge synthesis demonstration complete\n');

  if (fs.existsSync('./test-knowledge.json')) {
    fs.unlinkSync('./test-knowledge.json');
  }
}

module.exports = { KnowledgeSynthesizer };
