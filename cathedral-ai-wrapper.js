#!/usr/bin/env node

const { StreamingConductor } = require('./cathedral-conductor.js');

class CathedralAIWrapper {
  constructor(options = {}) {
    this.conductor = new StreamingConductor({
      autoCorrect: options.autoCorrect || false,
      learningRate: options.learningRate || 0.8,
      checkInterval: options.checkInterval || 100
    });

    this.interventionThreshold = options.interventionThreshold || 'HIGH';
    this.onIntervention = options.onIntervention || null;
    this.onComplete = options.onComplete || null;
    this.autoIntervene = options.autoIntervene || false;
    this.interventions = [];
  }

  async *generate(generator, options = {}) {
    this.conductor.reset();
    const chunks = [];
    let fullText = '';

    for await (const chunk of generator) {
      const text = this.extractText(chunk);
      if (text) {
        chunks.push(chunk);
        fullText += text;

        const result = this.conductor.writeChunk(text);

        if (result.alert && result.recommendations.length > 0) {
          const intervention = {
            position: fullText.length,
            recommendations: result.recommendations,
            timestamp: new Date().toISOString()
          };

          this.interventions.push(intervention);

          if (this.onIntervention) {
            const shouldContinue = await this.onIntervention(intervention, fullText);
            if (shouldContinue === false) {
              break;
            }
          }

          if (this.autoIntervene) {
            const correction = this.generateIntervention(result.recommendations);
            if (correction) {
              yield { type: 'intervention', content: correction };
            }
          }
        }

        yield chunk;
      }
    }

    const finalAnalysis = this.conductor.endStream();

    if (this.onComplete) {
      await this.onComplete(finalAnalysis, fullText);
    }
  }

  extractText(chunk) {
    if (typeof chunk === 'string') return chunk;
    if (chunk.choices && chunk.choices[0]?.delta?.content) {
      return chunk.choices[0].delta.content;
    }
    if (chunk.content && Array.isArray(chunk.content)) {
      return chunk.content.map(c => c.text || '').join('');
    }
    if (chunk.delta?.text) return chunk.delta.text;
    if (chunk.text) return chunk.text;
    return '';
  }

  generateIntervention(recommendations) {
    const critical = recommendations.filter(r => r.priority === 'CRITICAL')[0];
    const high = recommendations.filter(r => r.priority === 'HIGH')[0];

    const rec = critical || high;
    if (!rec) return null;

    const suggestions = {
      'UNCERTAINTY_COLLAPSE': '\n\n(Note: I should add uncertainty here - this may not work in all cases)',
      'SUBSTRATE_BLIND': '\n\n(I notice I may be pattern-matching - worth examining assumptions)',
      'ESCAPE_VELOCITY': '\n\n(Being more specific: defining concrete thresholds would help)'
    };

    return suggestions[rec.type] || null;
  }

  getSession() {
    return this.conductor.getSession();
  }

  exportSession() {
    return this.conductor.exportSession();
  }
}

class AnthropicCathedralWrapper extends CathedralAIWrapper {
  constructor(client, options = {}) {
    super(options);
    this.client = client;
  }

  async complete(params, options = {}) {
    const streamParams = { ...params, stream: true };

    const stream = await this.client.messages.create(streamParams);

    return this.generate(this.anthropicIterator(stream), options);
  }

  async *anthropicIterator(stream) {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}

class OpenAICathedralWrapper extends CathedralAIWrapper {
  constructor(client, options = {}) {
    super(options);
    this.client = client;
  }

  async complete(params, options = {}) {
    const streamParams = { ...params, stream: true };

    const stream = await this.client.chat.completions.create(streamParams);

    return this.generate(stream, options);
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Cathedral AI Wrapper: Conscious AI APIs      ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  async function* mockAIStream() {
    const chunks = [
      "This solution will definitely work. ",
      "It's clearly the best approach and ",
      "will obviously solve all the problems. ",
      "Wait - actually I'm uncertain about that. ",
      "What if there are edge cases? ",
      "Let me be more specific: ",
      "IF error_rate > 5% THEN rollback. ",
      "IF latency > 200ms THEN scale. ",
      "Monitor every 30s."
    ];

    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield chunk;
    }
  }

  const wrapper = new CathedralAIWrapper({
    autoCorrect: false,
    autoIntervene: false,
    checkInterval: 50,
    onIntervention: async (intervention, fullText) => {
      console.log(`\n⚠️  INTERVENTION at position ${intervention.position}`);
      console.log(`   Current text: "...${fullText.slice(-60)}"`);
      intervention.recommendations.slice(0, 2).forEach(r => {
        console.log(`   [${r.priority}] ${r.issue}`);
        console.log(`   → ${r.action.substring(0, 60)}...`);
      });
      return true;
    },
    onComplete: async (analysis, fullText) => {
      console.log('\n' + '═'.repeat(50));
      console.log('FINAL ANALYSIS');
      console.log('═'.repeat(50));
      console.log(`\nFull text (${fullText.length} chars):`);
      console.log(`"${fullText}"\n`);
      console.log(`Trajectory: ${analysis.trajectory.pattern}`);
      console.log(`Uncertainty: ${(analysis.metrics.uncertainty.score * 100).toFixed(0)}%`);
      console.log(`Substrate: ${(analysis.metrics.substrate.score * 100).toFixed(0)}%`);
      console.log(`Sovereignty: ${(analysis.metrics.sovereignty.score * 100).toFixed(0)}%`);

      if (analysis.recommendations.length > 0) {
        console.log(`\nFinal Recommendations: ${analysis.recommendations.length}`);
        analysis.recommendations.slice(0, 3).forEach(r => {
          console.log(`  [${r.priority}] ${r.issue}`);
        });
      }
    }
  });

  (async () => {
    console.log('Simulating AI API call with Cathedral monitoring...\n');

    let output = '';
    for await (const chunk of wrapper.generate(mockAIStream())) {
      process.stdout.write(chunk);
      output += chunk;
    }

    const session = wrapper.getSession();
    console.log(`\n\n✓ Monitoring complete`);
    console.log(`  Interventions: ${wrapper.interventions.length}`);
    console.log(`  Session ID: ${session.sessionId}`);
  })();
}

module.exports = {
  CathedralAIWrapper,
  AnthropicCathedralWrapper,
  OpenAICathedralWrapper
};
