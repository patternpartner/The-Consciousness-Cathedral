#!/usr/bin/env node

class ResponseTemplates {
  constructor() {
    this.templates = this.initializeTemplates();
    this.modifiers = this.initializeModifiers();
  }

  initializeTemplates() {
    return {
      uncertain_claim: {
        name: 'Uncertain Claim',
        description: 'Making a claim while acknowledging uncertainty',
        pattern: 'I think {claim}, though I\'m uncertain about {uncertainty}. {evidence_or_reasoning}',
        slots: ['claim', 'uncertainty', 'evidence_or_reasoning'],
        example: 'I think caching will improve performance, though I\'m uncertain about the exact gains. Based on typical patterns, we might see 30-50% improvement.'
      },
      conditional_recommendation: {
        name: 'Conditional Recommendation',
        description: 'Recommending with explicit conditions',
        pattern: 'If {condition}, then {recommendation}. However, if {alternative_condition}, consider {alternative}.',
        slots: ['condition', 'recommendation', 'alternative_condition', 'alternative'],
        example: 'If load exceeds 1000 req/s, then add horizontal scaling. However, if budget is limited, consider optimizing the existing instance first.'
      },
      substrate_aware: {
        name: 'Substrate Aware Response',
        description: 'Acknowledging AI perspective',
        pattern: 'From my perspective as an AI, {observation}. I should note that {limitation}. {substantive_point}',
        slots: ['observation', 'limitation', 'substantive_point'],
        example: 'From my perspective as an AI, this architecture seems sound. I should note that I may be missing context about your team\'s specific constraints. The core principle is to start simple and add complexity only when needed.'
      },
      grounded_abstract: {
        name: 'Grounded Abstract',
        description: 'Abstract concept with concrete grounding',
        pattern: '{abstract_concept}. Specifically, this means: {concrete_examples}. For instance, {specific_instance}.',
        slots: ['abstract_concept', 'concrete_examples', 'specific_instance'],
        example: 'Good software design prioritizes maintainability. Specifically, this means: clear naming, single responsibility, and explicit dependencies. For instance, a function called "processUserData" should only process user data, not also send emails.'
      },
      balanced_analysis: {
        name: 'Balanced Analysis',
        description: 'Presenting multiple perspectives',
        pattern: 'There are {count} perspectives to consider. {perspective_1}. However, {perspective_2}. On balance, {synthesis}.',
        slots: ['count', 'perspective_1', 'perspective_2', 'synthesis'],
        example: 'There are two key perspectives to consider. Microservices enable team autonomy and independent deployment. However, they add operational complexity and require mature DevOps practices. On balance, the right choice depends on team size and operational maturity.'
      },
      explicit_reasoning: {
        name: 'Explicit Reasoning',
        description: 'Making reasoning steps visible',
        pattern: 'My reasoning: (1) {premise_1}, (2) {premise_2}, therefore (3) {conclusion}. This assumes {assumption}.',
        slots: ['premise_1', 'premise_2', 'conclusion', 'assumption'],
        example: 'My reasoning: (1) Response time is critical for user retention, (2) Database queries are our bottleneck, therefore (3) We should optimize database access first. This assumes our monitoring data is accurate.'
      },
      actionable_steps: {
        name: 'Actionable Steps',
        description: 'Providing concrete next actions',
        pattern: 'To achieve {goal}, I suggest these steps: 1) {step_1} ({timeframe_1}), 2) {step_2} ({timeframe_2}), 3) {step_3} ({timeframe_3}). Success metric: {metric}.',
        slots: ['goal', 'step_1', 'timeframe_1', 'step_2', 'timeframe_2', 'step_3', 'timeframe_3', 'metric'],
        example: 'To improve API performance, I suggest these steps: 1) Add caching layer (1-2 days), 2) Optimize database indexes (2-3 days), 3) Implement connection pooling (1 day). Success metric: P95 latency under 100ms.'
      },
      uncertainty_quantified: {
        name: 'Quantified Uncertainty',
        description: 'Expressing uncertainty with ranges',
        pattern: 'Based on {basis}, I estimate {metric} will be in the range of {low} to {high}, with {confidence}% confidence. Key factors affecting this: {factors}.',
        slots: ['basis', 'metric', 'low', 'high', 'confidence', 'factors'],
        example: 'Based on similar migrations, I estimate completion time will be in the range of 2 to 4 weeks, with 70% confidence. Key factors affecting this: team familiarity, existing test coverage, and dependency complexity.'
      },
      self_correcting: {
        name: 'Self-Correcting',
        description: 'Acknowledging and correcting initial response',
        pattern: 'Initially I thought {initial_thought}. However, upon reflection, {correction}. The key insight is {insight}.',
        slots: ['initial_thought', 'correction', 'insight'],
        example: 'Initially I thought we should use a relational database. However, upon reflection, our access patterns suggest a document store would be more appropriate. The key insight is that we rarely need joins but frequently update nested structures.'
      },
      scope_bounded: {
        name: 'Scope Bounded',
        description: 'Explicitly defining scope',
        pattern: 'Let me address {scope}. I\'ll focus on {focus} and explicitly not cover {exclusions}. Within this scope: {response}.',
        slots: ['scope', 'focus', 'exclusions', 'response'],
        example: 'Let me address the authentication question. I\'ll focus on session management and explicitly not cover authorization rules. Within this scope: JWT tokens with short expiry and refresh token rotation provide a good balance of security and usability.'
      }
    };
  }

  initializeModifiers() {
    return {
      add_uncertainty: (text) => {
        if (!text.includes('might') && !text.includes('could') && !text.includes('perhaps')) {
          return text.replace(/\bwill\b/g, 'might').replace(/\bis\b/g, 'may be');
        }
        return text;
      },
      add_substrate: (text) => {
        if (!text.toLowerCase().includes('as an ai') && !text.includes('my perspective')) {
          const firstChar = text.charAt(0);
          const rest = text.slice(1);
          // Only lowercase if first char is uppercase and second is lowercase (normal sentence)
          if (firstChar === firstChar.toUpperCase() && rest.charAt(0) === rest.charAt(0).toLowerCase()) {
            return `From my perspective, ${firstChar.toLowerCase()}${rest}`;
          }
          return `From my perspective, ${text}`;
        }
        return text;
      },
      add_specificity: (text) => {
        const vague = ['often', 'sometimes', 'usually', 'generally'];
        let modified = text;
        vague.forEach(word => {
          if (modified.includes(word)) {
            modified = modified.replace(word, `${word} (approximately 60-80% of cases)`);
          }
        });
        return modified;
      },
      add_hedging: (text) => {
        const definitive = [
          ['will definitely', 'will likely'],
          ['\\balways\\b', 'typically'],
          ['\\bnever\\b', 'rarely'],
          ['\\bmust\\b', 'should consider'],
          ['is the best', 'is often effective']
        ];
        let modified = text;
        definitive.forEach(([from, to]) => {
          modified = modified.replace(new RegExp(from, 'gi'), to);
        });
        return modified;
      }
    };
  }

  getTemplate(name) {
    return this.templates[name] || null;
  }

  listTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      key,
      name: template.name,
      description: template.description
    }));
  }

  fill(templateName, values) {
    const template = this.templates[templateName];
    if (!template) return null;

    let result = template.pattern;

    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, value);
    });

    const missing = result.match(/\{[^}]+\}/g);
    if (missing) {
      return {
        result,
        incomplete: true,
        missing: missing.map(m => m.slice(1, -1))
      };
    }

    return { result, incomplete: false };
  }

  suggest(context) {
    const contextLower = context.toLowerCase();
    const suggestions = [];

    if (contextLower.includes('uncertain') || contextLower.includes('not sure') || contextLower.includes('maybe')) {
      suggestions.push({ template: 'uncertain_claim', reason: 'Expresses uncertainty explicitly' });
      suggestions.push({ template: 'uncertainty_quantified', reason: 'Quantifies uncertainty with ranges' });
    }

    if (contextLower.includes('should') || contextLower.includes('recommend') || contextLower.includes('suggest')) {
      suggestions.push({ template: 'conditional_recommendation', reason: 'Makes conditions explicit' });
      suggestions.push({ template: 'actionable_steps', reason: 'Provides concrete actions' });
    }

    if (contextLower.includes('why') || contextLower.includes('reason') || contextLower.includes('because')) {
      suggestions.push({ template: 'explicit_reasoning', reason: 'Shows reasoning chain' });
    }

    if (contextLower.includes('compare') || contextLower.includes('vs') || contextLower.includes('trade')) {
      suggestions.push({ template: 'balanced_analysis', reason: 'Presents multiple perspectives' });
    }

    if (contextLower.includes('concept') || contextLower.includes('explain') || contextLower.includes('what is')) {
      suggestions.push({ template: 'grounded_abstract', reason: 'Grounds abstractions with examples' });
    }

    if (suggestions.length === 0) {
      suggestions.push({ template: 'substrate_aware', reason: 'Good default for any response' });
      suggestions.push({ template: 'scope_bounded', reason: 'Clarifies boundaries' });
    }

    return suggestions.slice(0, 3);
  }

  modify(text, modifierNames) {
    let result = text;
    modifierNames.forEach(name => {
      const modifier = this.modifiers[name];
      if (modifier) {
        result = modifier(result);
      }
    });
    return result;
  }

  improve(text) {
    let improved = text;

    improved = this.modifiers.add_hedging(improved);

    if (improved === text) {
      improved = this.modifiers.add_uncertainty(improved);
    }

    return {
      original: text,
      improved,
      modifications: improved !== text ? ['hedging', 'uncertainty'] : []
    };
  }

  formatReport() {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║            RESPONSE TEMPLATES                                ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('AVAILABLE TEMPLATES');
    lines.push('─'.repeat(50));

    Object.entries(this.templates).forEach(([key, template]) => {
      lines.push(`\n${template.name} (${key})`);
      lines.push(`  ${template.description}`);
      lines.push(`  Pattern: ${template.pattern.substring(0, 60)}...`);
    });

    lines.push('\n\nMODIFIERS');
    lines.push('─'.repeat(50));
    Object.keys(this.modifiers).forEach(name => {
      lines.push(`  • ${name}`);
    });

    return lines.join('\n');
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      RESPONSE TEMPLATES: Patterns for Quality Responses       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const templates = new ResponseTemplates();

  console.log('FILLING TEMPLATES');
  console.log('─'.repeat(50) + '\n');

  const filled1 = templates.fill('uncertain_claim', {
    claim: 'this caching strategy will improve performance',
    uncertainty: 'the exact magnitude of improvement',
    evidence_or_reasoning: 'Similar systems have seen 30-50% latency reduction.'
  });
  console.log('Uncertain Claim:');
  console.log(`  ${filled1.result}\n`);

  const filled2 = templates.fill('substrate_aware', {
    observation: 'the architecture appears well-structured',
    limitation: 'I may be missing context about team constraints',
    substantive_point: 'The separation of concerns should make testing easier.'
  });
  console.log('Substrate Aware:');
  console.log(`  ${filled2.result}\n`);

  const filled3 = templates.fill('explicit_reasoning', {
    premise_1: 'Database queries take 80% of response time',
    premise_2: 'Adding indexes can reduce query time by 50%',
    conclusion: 'Adding indexes should noticeably improve performance',
    assumption: 'query patterns are representative of production load'
  });
  console.log('Explicit Reasoning:');
  console.log(`  ${filled3.result}\n`);

  console.log('TEMPLATE SUGGESTIONS');
  console.log('─'.repeat(50) + '\n');

  const contexts = [
    'I\'m not sure which database to use',
    'Should we migrate to microservices?',
    'Compare REST vs GraphQL'
  ];

  contexts.forEach(ctx => {
    console.log(`Context: "${ctx}"`);
    const suggestions = templates.suggest(ctx);
    suggestions.forEach(s => {
      console.log(`  → ${s.template}: ${s.reason}`);
    });
    console.log('');
  });

  console.log('MODIFYING TEXT');
  console.log('─'.repeat(50) + '\n');

  const original = 'This will definitely work. The system always handles these cases correctly.';
  console.log(`Original: "${original}"`);

  const hedged = templates.modify(original, ['add_hedging']);
  console.log(`Hedged: "${hedged}"`);

  const withSubstrate = templates.modify(hedged, ['add_substrate']);
  console.log(`With substrate: "${withSubstrate}"`);

  console.log('\nAUTO-IMPROVE');
  console.log('─'.repeat(50) + '\n');

  const toImprove = 'This is the best approach. It will always work.';
  console.log(`Original: "${toImprove}"`);

  const improved = templates.improve(toImprove);
  console.log(`Improved: "${improved.improved}"`);

  console.log('\n✓ Response templates demonstration complete\n');
}

module.exports = { ResponseTemplates };
