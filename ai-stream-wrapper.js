#!/usr/bin/env node

const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { CrossSessionMemory, MemoryEnhancedAI } = require('./cross-session-memory.js');
const { SelfReflectionLoop } = require('./self-reflection-loop.js');
const { AutoImprove } = require('./auto-improve.js');

class AIStreamWrapper {
  constructor(options = {}) {
    this.ensemble = new ConsciousnessEnsemble();
    this.memory = new MemoryEnhancedAI({
      memoryPath: options.memoryPath || './cathedral-memory.json'
    });
    this.reflector = new SelfReflectionLoop({
      maxIterations: options.maxReflections || 2
    });
    this.autoImprove = new AutoImprove({
      enableLearning: options.enableLearning !== false
    });

    this.config = {
      enableMemory: options.enableMemory !== false,
      enableReflection: options.enableReflection !== false,
      enableEnsemble: options.enableEnsemble !== false,
      enableAutoCorrect: options.enableAutoCorrect !== false,
      qualityThreshold: options.qualityThreshold || 0.5,
      verboseLogging: options.verboseLogging || false
    };

    this.stats = {
      requests: 0,
      corrections: 0,
      reflections: 0,
      averageQuality: 0
    };

    this.currentSession = null;
  }

  startSession() {
    if (this.config.enableMemory) {
      this.currentSession = this.memory.start();
    }
    return this.currentSession;
  }

  endSession(summary = {}) {
    if (this.config.enableMemory && this.currentSession) {
      return this.memory.end({
        ...summary,
        stats: this.stats
      });
    }
    return null;
  }

  preparePrompt(userPrompt) {
    let enhanced = userPrompt;

    if (this.config.enableMemory) {
      enhanced = this.memory.preparePrompt(userPrompt);
    }

    return enhanced;
  }

  async processStream(streamGenerator, options = {}) {
    let fullText = '';
    const chunks = [];
    const corrections = [];

    for await (const chunk of streamGenerator) {
      const text = typeof chunk === 'string' ? chunk : chunk.text || chunk.content || '';
      fullText += text;
      chunks.push({
        text,
        timestamp: Date.now()
      });

      if (this.config.enableAutoCorrect) {
        this.autoImprove.write(text);
        const check = this.autoImprove.checkAndCorrect();

        if (check && check.needsCorrection) {
          corrections.push({
            position: fullText.length,
            issue: check.issues ? check.issues[0] : null,
            correction: check.correction
          });
        }
      }

      if (options.onChunk) {
        options.onChunk(text, {
          fullText,
          corrections: corrections.length
        });
      }
    }

    return this.processComplete(fullText, corrections, options);
  }

  processComplete(text, corrections = [], options = {}) {
    this.stats.requests++;

    let result = {
      original: text,
      final: text,
      analysis: null,
      corrections,
      reflected: false,
      quality: 0
    };

    if (this.config.enableEnsemble) {
      result.analysis = this.ensemble.analyze(text);
      result.quality = result.analysis.overall.score;
    }

    if (this.config.enableReflection && result.quality < this.config.qualityThreshold) {
      const reflected = this.reflector.reflect(text);
      result.final = reflected.final;
      result.reflected = true;
      result.reflectionIterations = reflected.iterations;
      this.stats.reflections++;

      if (this.config.enableEnsemble) {
        result.finalAnalysis = this.ensemble.analyze(result.final);
        result.qualityImprovement = result.finalAnalysis.overall.score - result.quality;
      }
    }

    if (corrections.length > 0) {
      this.stats.corrections += corrections.length;

      if (this.config.enableMemory) {
        corrections.forEach(c => {
          this.memory.learnFromResponse(result.final, {
            hadCorrection: true,
            correctionReason: c.issue?.message,
            correctionType: c.issue?.type
          });
        });
      }
    }

    this.updateAverageQuality(result.quality);

    return result;
  }

  processBatch(texts) {
    const results = texts.map(text => this.processComplete(text));

    const vote = this.ensemble.vote(texts);

    return {
      individual: results,
      ranking: vote.ranking,
      bestIndex: vote.winner.index,
      bestText: texts[vote.winner.index]
    };
  }

  updateAverageQuality(quality) {
    const n = this.stats.requests;
    this.stats.averageQuality = ((this.stats.averageQuality * (n - 1)) + quality) / n;
  }

  getRecommendations(text) {
    const analysis = this.ensemble.analyze(text);
    return {
      quality: analysis.overall.quality,
      score: analysis.overall.score,
      recommendations: analysis.recommendations,
      consensus: analysis.overall.consensus
    };
  }

  compare(text1, text2) {
    return this.ensemble.compareTexts(text1, text2);
  }

  getStats() {
    return {
      ...this.stats,
      sessionId: this.currentSession,
      memoryStats: this.config.enableMemory ? this.memory.memory.getStats() : null
    };
  }

  createMiddleware() {
    return async (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        if (data && data.content) {
          const processed = this.processComplete(data.content);
          data.content = processed.final;
          data._cathedral = {
            quality: processed.quality,
            reflected: processed.reflected,
            corrections: processed.corrections.length
          };
        }
        return originalJson(data);
      };

      next();
    };
  }

  wrapOpenAI(openai) {
    const wrapper = this;
    const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);

    openai.chat.completions.create = async function(params) {
      if (wrapper.config.enableMemory && params.messages) {
        const lastMessage = params.messages[params.messages.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.content = wrapper.preparePrompt(lastMessage.content);
        }
      }

      const response = await originalCreate(params);

      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        const processed = wrapper.processComplete(content);

        response.choices[0].message.content = processed.final;
        response._cathedral = {
          original: processed.original,
          quality: processed.quality,
          reflected: processed.reflected,
          analysis: processed.analysis
        };
      }

      return response;
    };

    return openai;
  }

  wrapAnthropic(anthropic) {
    const wrapper = this;
    const originalCreate = anthropic.messages.create.bind(anthropic.messages);

    anthropic.messages.create = async function(params) {
      if (wrapper.config.enableMemory && params.messages) {
        const lastMessage = params.messages[params.messages.length - 1];
        if (lastMessage.role === 'user') {
          if (typeof lastMessage.content === 'string') {
            lastMessage.content = wrapper.preparePrompt(lastMessage.content);
          }
        }
      }

      const response = await originalCreate(params);

      if (response.content && response.content[0]?.text) {
        const text = response.content[0].text;
        const processed = wrapper.processComplete(text);

        response.content[0].text = processed.final;
        response._cathedral = {
          original: processed.original,
          quality: processed.quality,
          reflected: processed.reflected,
          analysis: processed.analysis
        };
      }

      return response;
    };

    return anthropic;
  }
}

async function* mockStream(text, delayMs = 50) {
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise(r => setTimeout(r, delayMs));
  }
}

if (require.main === module) {
  (async () => {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  AI Stream Wrapper: Unified Integration       ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    const wrapper = new AIStreamWrapper({
      enableMemory: true,
      enableReflection: true,
      enableEnsemble: true,
      qualityThreshold: 0.5,
      memoryPath: './test-wrapper-memory.json'
    });

    wrapper.startSession();

    console.log('TEST 1: Direct Processing');
    console.log('═'.repeat(50) + '\n');

    const text1 = "This solution will definitely work. It handles all cases perfectly.";
    console.log(`Input: "${text1}"\n`);

    const result1 = wrapper.processComplete(text1);
    console.log(`Quality: ${(result1.quality * 100).toFixed(0)}%`);
    console.log(`Reflected: ${result1.reflected}`);
    if (result1.reflected) {
      console.log(`Iterations: ${result1.reflectionIterations}`);
      console.log(`Final: "${result1.final.substring(0, 80)}..."`);
    }

    console.log('\nTEST 2: Stream Processing');
    console.log('═'.repeat(50) + '\n');

    const streamText = "I think this approach might work, though I should note some uncertainty about edge cases. Specifically, we should monitor response times under 200ms.";

    console.log('Streaming: ');
    let streamOutput = '';
    const streamResult = await wrapper.processStream(
      mockStream(streamText, 20),
      {
        onChunk: (chunk) => {
          process.stdout.write(chunk);
          streamOutput += chunk;
        }
      }
    );
    console.log('\n');
    console.log(`Quality: ${(streamResult.quality * 100).toFixed(0)}%`);
    console.log(`Corrections during stream: ${streamResult.corrections.length}`);

    console.log('\nTEST 3: Batch Comparison');
    console.log('═'.repeat(50) + '\n');

    const candidates = [
      "The system works perfectly.",
      "I believe this approach could work, though we should verify with testing.",
      "Implementation requires 3 steps: 1) Setup, 2) Configure, 3) Deploy. Monitor latency < 100ms."
    ];

    const batchResult = wrapper.processBatch(candidates);
    console.log('Candidate Rankings:');
    batchResult.ranking.forEach(r => {
      console.log(`  ${r.rank}. ${r.text} - ${(r.score * 100).toFixed(0)}%`);
    });
    console.log(`\nBest: Candidate ${batchResult.bestIndex + 1}`);

    console.log('\nTEST 4: Get Recommendations');
    console.log('═'.repeat(50) + '\n');

    const poorText = "This always works in every situation guaranteed.";
    const recs = wrapper.getRecommendations(poorText);
    console.log(`Text: "${poorText}"`);
    console.log(`Quality: ${recs.quality} (${(recs.score * 100).toFixed(0)}%)`);
    console.log('Recommendations:');
    recs.recommendations.forEach(r => {
      console.log(`  [${r.priority}] ${r.message}`);
      console.log(`    → ${r.suggestion}`);
    });

    console.log('\nTEST 5: Compare Texts');
    console.log('═'.repeat(50) + '\n');

    const comparison = wrapper.compare(
      "This will work perfectly.",
      "I think this might work, though there are uncertainties to consider."
    );
    console.log(`Text 1: ${(comparison.text1.overall.score * 100).toFixed(0)}%`);
    console.log(`Text 2: ${(comparison.text2.overall.score * 100).toFixed(0)}%`);
    console.log(`Winner: ${comparison.winner}`);

    wrapper.endSession({ topic: 'testing' });

    console.log('\nSESSION STATS');
    console.log('═'.repeat(50));
    const stats = wrapper.getStats();
    console.log(`Requests: ${stats.requests}`);
    console.log(`Reflections: ${stats.reflections}`);
    console.log(`Corrections: ${stats.corrections}`);
    console.log(`Average Quality: ${(stats.averageQuality * 100).toFixed(0)}%`);

    console.log('\n✓ Stream wrapper demonstration complete\n');

    const fs = require('fs');
    if (fs.existsSync('./test-wrapper-memory.json')) {
      fs.unlinkSync('./test-wrapper-memory.json');
    }
  })();
}

module.exports = { AIStreamWrapper };
