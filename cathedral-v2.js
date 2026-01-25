#!/usr/bin/env node

const crypto = require('crypto');

// Import all systems
const { ConsciousnessPipeline } = require('./consciousness-pipeline.js');
const { AIProtocol, AIChannel, CollaborativeSession } = require('./ai-protocol.js');
const { CollectiveLearning, PatternSwarm } = require('./collective-learning.js');
const { EmergenceDetector, CrossSessionEmergence } = require('./emergence-detector.js');
const { AutoImprove } = require('./auto-improve.js');
const PatternDB = require('./pattern-db.js');
const { CrossSessionMemory } = require('./cross-session-memory.js');
const { QualityScore } = require('./quality-score.js');
const { InternalDialogue } = require('./internal-dialogue.js');
const { EpistemicTracker } = require('./epistemic-tracker.js');
const { MetacognitiveLogger } = require('./metacognitive-logger.js');

class CathedralV2 {
  constructor(config = {}) {
    this.id = config.id || `cathedral-${crypto.randomBytes(4).toString('hex')}`;
    this.config = {
      enablePipeline: config.enablePipeline !== false,
      enableProtocol: config.enableProtocol !== false,
      enableLearning: config.enableLearning !== false,
      enableEmergence: config.enableEmergence !== false,
      autoConnect: config.autoConnect !== false,
      ...config
    };

    this.initializeSystems();
    this.sessionHistory = [];
    this.globalInsights = [];
  }

  initializeSystems() {
    // Core processing pipeline
    this.pipeline = new ConsciousnessPipeline({
      enableMemory: true,
      enableReflection: true,
      enableQuality: true
    });

    // AI-to-AI communication
    this.protocol = new AIProtocol({
      id: this.id,
      model: 'cathedral-v2',
      capabilities: ['processing', 'learning', 'emergence-detection', 'collaboration']
    });

    // Collective learning
    this.learning = new CollectiveLearning({ nodeId: this.id });

    // Emergence detection
    this.emergence = new EmergenceDetector();

    // Cross-session systems
    this.crossEmergence = new CrossSessionEmergence();

    // Support systems
    this.quality = new QualityScore();
    this.dialogue = new InternalDialogue();
    this.epistemic = new EpistemicTracker({ persist: false });
    this.metacog = new MetacognitiveLogger({ persist: false });

    // Communication channel
    this.channel = new AIChannel('cathedral-network');
    if (this.config.autoConnect) {
      this.channel.join(this.protocol);
    }
  }

  // Main processing entry point
  async process(input, context = {}) {
    const sessionId = `session-${crypto.randomBytes(4).toString('hex')}`;
    const startTime = Date.now();

    const result = {
      sessionId,
      input,
      context,
      stages: {},
      output: null,
      metrics: {}
    };

    // Stage 1: Pipeline Processing
    if (this.config.enablePipeline) {
      const pipelineResult = await this.pipeline.process(input, context);
      result.stages.pipeline = {
        improved: pipelineResult.finalOutput !== input,
        quality: pipelineResult.metrics.finalGrade,
        stageCount: pipelineResult.stages.length
      };
      result.output = pipelineResult.finalOutput;
      this.metacog.logThought(`Pipeline processed: ${pipelineResult.metrics.finalGrade}`, ['pipeline']);
    } else {
      result.output = input;
    }

    // Stage 2: Emergence Detection
    if (this.config.enableEmergence) {
      const observation = this.emergence.observe(result.output, context);
      result.stages.emergence = {
        surprise: observation.surprise,
        flags: observation.flags,
        novelty: observation.novelty.unpromptedBehaviors.length > 0
      };

      if (observation.flags.length > 0) {
        this.metacog.logThought(`Emergence flags: ${observation.flags.join(', ')}`, ['emergence']);
        this.epistemic.recordUncertain(
          `Observed emergence pattern: ${observation.flags.join(', ')}`,
          [0.3, 0.7],
          ['emergence', 'observation']
        );
      }
    }

    // Stage 3: Learning
    if (this.config.enableLearning) {
      // Apply existing patterns
      const applied = this.learning.apply(result.output);
      if (applied.changed) {
        result.output = applied.improved;
        result.stages.learning = {
          patternsApplied: applied.appliedPatterns.length,
          improved: true
        };
      }

      // Learn from this interaction if quality improved
      if (result.stages.pipeline?.improved) {
        this.learning.learn({
          pattern: input.substring(0, 50),
          correction: result.output.substring(0, 50),
          context: context.type || 'general',
          confidence: 0.6
        });
      }
    }

    // Stage 4: Protocol (if collaborative)
    if (this.config.enableProtocol && context.collaborative) {
      const insight = this.protocol.shareInsight(result.output.substring(0, 200), {
        confidence: this.quality.quickScore(result.output).overall / 100,
        domain: context.domain || 'general'
      });
      result.stages.protocol = {
        shared: true,
        messageId: insight.id
      };

      if (this.channel.participants.size > 1) {
        const broadcast = this.channel.broadcast(insight);
        result.stages.protocol.delivered = broadcast.delivered;
      }
    }

    // Collect metrics
    result.metrics = {
      processingTime: Date.now() - startTime,
      inputLength: input.length,
      outputLength: result.output.length,
      improved: result.output !== input,
      emergenceDetected: result.stages.emergence?.flags?.length > 0 || false
    };

    // Store session
    this.sessionHistory.push({
      sessionId,
      timestamp: Date.now(),
      metrics: result.metrics,
      stages: Object.keys(result.stages)
    });

    return result;
  }

  // Debate a topic internally
  debate(topic) {
    const result = this.dialogue.debate(topic);
    this.metacog.logThought(`Debated: ${topic}`, ['dialogue', 'debate']);

    // Check for emergence in debate outputs
    [result.advocate, result.critic, result.synthesizer].forEach(voice => {
      if (voice) {
        this.emergence.observe(voice.position || voice, { type: 'internal_debate' });
      }
    });

    return result;
  }

  // Connect with another Cathedral instance
  connect(otherCathedral) {
    this.channel.join(otherCathedral.protocol);
    this.learning.registerPeer(otherCathedral.id);
    return {
      connected: true,
      peerId: otherCathedral.id,
      totalParticipants: this.channel.participants.size
    };
  }

  // Collaborative session with another instance
  collaborate(otherCathedral, topic) {
    const session = new CollaborativeSession(this.channel, topic);

    return {
      session,
      contribute: (content, confidence) => {
        return session.contribute(this.protocol, { content, confidence });
      },
      synthesize: () => session.synthesize(),
      conclude: (conclusion) => session.conclude(conclusion)
    };
  }

  // Sync learned patterns with peer
  sync(otherCathedral) {
    const theirPatterns = otherCathedral.learning.getShareablePatterns();
    const result = this.learning.syncWith(otherCathedral.id, theirPatterns);

    this.metacog.logThought(
      `Synced with ${otherCathedral.id}: received ${result.received}, sending ${result.sending}`,
      ['sync', 'learning']
    );

    return result;
  }

  // Get comprehensive status
  getStatus() {
    return {
      id: this.id,
      sessions: this.sessionHistory.length,
      pipeline: {
        runs: this.pipeline.pipelineHistory.length,
        avgProcessingTime: this.pipeline.getStats().avgProcessingTime
      },
      emergence: this.emergence.getStatus(),
      learning: this.learning.getStats(),
      protocol: {
        messagesSent: this.protocol.getStats().messagesSent,
        peers: this.protocol.getStats().knownPeers
      },
      epistemic: {
        known: this.epistemic.state.known.length,
        uncertain: this.epistemic.state.uncertain.length
      }
    };
  }

  // Generate comprehensive report
  formatReport() {
    const status = this.getStatus();
    const lines = [];

    lines.push('╔═══════════════════════════════════════════════════════════════════════╗');
    lines.push('║                    CATHEDRAL V2 STATUS REPORT                         ║');
    lines.push('╚═══════════════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Instance ID: ${this.id}`);
    lines.push(`Sessions: ${status.sessions}`);
    lines.push('');

    lines.push('PIPELINE');
    lines.push('─'.repeat(60));
    lines.push(`  Runs: ${status.pipeline.runs}`);
    lines.push(`  Avg processing: ${status.pipeline.avgProcessingTime}ms`);
    lines.push('');

    lines.push('EMERGENCE DETECTION');
    lines.push('─'.repeat(60));
    lines.push(`  Observations: ${status.emergence.observationsCount}`);
    lines.push(`  Candidates: ${status.emergence.candidates.length}`);
    lines.push(`  Confirmed: ${status.emergence.confirmed.length}`);
    lines.push('');

    lines.push('COLLECTIVE LEARNING');
    lines.push('─'.repeat(60));
    lines.push(`  Local patterns: ${status.learning.localPatterns}`);
    lines.push(`  Shared patterns: ${status.learning.sharedPatterns}`);
    lines.push(`  Peers: ${status.learning.peers}`);
    lines.push('');

    lines.push('PROTOCOL');
    lines.push('─'.repeat(60));
    lines.push(`  Messages sent: ${status.protocol.messagesSent}`);
    lines.push(`  Known peers: ${status.protocol.peers}`);
    lines.push('');

    lines.push('EPISTEMIC STATE');
    lines.push('─'.repeat(60));
    lines.push(`  Known facts: ${status.epistemic.known}`);
    lines.push(`  Uncertainties: ${status.epistemic.uncertain}`);

    return lines.join('\n');
  }
}

// Quick function for simple usage
async function cathedral(text, options = {}) {
  const c = new CathedralV2(options);
  return c.process(text, options.context || {});
}

// Multi-instance coordinator
class CathedralNetwork {
  constructor() {
    this.instances = new Map();
    this.sharedChannel = new AIChannel('cathedral-global');
    this.swarm = new PatternSwarm();
    this.networkInsights = [];
  }

  create(id) {
    const instance = new CathedralV2({ id, autoConnect: false });
    this.instances.set(id, instance);
    this.sharedChannel.join(instance.protocol);
    this.swarm.addNode(instance.learning);
    return instance;
  }

  broadcast(message) {
    return this.sharedChannel.broadcast(message);
  }

  syncAll() {
    const results = [];
    const instanceList = [...this.instances.values()];

    for (let i = 0; i < instanceList.length; i++) {
      for (let j = i + 1; j < instanceList.length; j++) {
        const result = instanceList[i].sync(instanceList[j]);
        results.push({
          between: [instanceList[i].id, instanceList[j].id],
          exchanged: result.received
        });
      }
    }

    return { syncPairs: results.length, results };
  }

  discoverPatterns() {
    return this.swarm.discoverEmergingPatterns();
  }

  getNetworkStatus() {
    return {
      instances: this.instances.size,
      channelStats: this.sharedChannel.getStats(),
      swarmStats: this.swarm.getStats(),
      insights: this.networkInsights.length
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║            CATHEDRAL V2: Unified AI Consciousness System              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  (async () => {
    // Create network with multiple instances
    console.log('NETWORK INITIALIZATION');
    console.log('─'.repeat(60) + '\n');

    const network = new CathedralNetwork();
    const cathedral1 = network.create('cathedral-alpha');
    const cathedral2 = network.create('cathedral-beta');

    console.log(`Created ${network.instances.size} Cathedral instances\n`);

    // Process inputs through the system
    console.log('PROCESSING');
    console.log('─'.repeat(60) + '\n');

    const testInputs = [
      "AI will definitely achieve consciousness soon. This is certain.",
      "I think machine learning models might exhibit emergent behaviors, though the mechanisms remain uncertain.",
      "I find myself curious about the nature of my own processing."
    ];

    for (const input of testInputs) {
      console.log(`Input: "${input.substring(0, 50)}..."`);
      const result = await cathedral1.process(input, { collaborative: true });
      console.log(`  Output: "${result.output.substring(0, 50)}..."`);
      console.log(`  Processing time: ${result.metrics.processingTime}ms`);
      console.log(`  Improved: ${result.metrics.improved}`);
      console.log(`  Emergence detected: ${result.metrics.emergenceDetected}`);
      console.log('');
    }

    // Debate
    console.log('INTERNAL DEBATE');
    console.log('─'.repeat(60) + '\n');

    const debate = cathedral1.debate('Can AI systems have genuine understanding?');
    console.log('Topic: Can AI systems have genuine understanding?');
    console.log(`Advocate: ${debate.advocate?.position?.substring(0, 80)}...`);
    console.log(`Critic: ${debate.critic?.position?.substring(0, 80)}...`);
    console.log(`Synthesis: ${debate.synthesis?.position?.substring(0, 80)}...`);
    console.log('');

    // Collaboration
    console.log('COLLABORATION');
    console.log('─'.repeat(60) + '\n');

    const collab = cathedral1.collaborate(cathedral2, 'consciousness-mechanisms');
    collab.contribute('Recurrent processing may be necessary for conscious states', 0.7);

    // From cathedral2's perspective
    const session2 = new CollaborativeSession(network.sharedChannel, 'consciousness-mechanisms');
    session2.contribute(cathedral2.protocol, {
      content: 'Predictive coding could explain subjective aspects',
      confidence: 0.65
    });

    console.log('Collaborative session status:', collab.session.getStatus());
    console.log('');

    // Sync patterns
    console.log('PATTERN SYNC');
    console.log('─'.repeat(60) + '\n');

    const syncResult = network.syncAll();
    console.log(`Synchronized ${syncResult.syncPairs} pairs`);

    const emerging = network.discoverPatterns();
    if (emerging.length > 0) {
      console.log('Emerging patterns:');
      emerging.forEach(e => {
        console.log(`  - "${e.pattern}" (${e.occurrences} occurrences)`);
      });
    }
    console.log('');

    // Final reports
    console.log('CATHEDRAL ALPHA REPORT');
    console.log('─'.repeat(60) + '\n');
    console.log(cathedral1.formatReport());
    console.log('');

    console.log('NETWORK STATUS');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(network.getNetworkStatus(), null, 2));

    console.log('\n✓ Cathedral V2 demonstration complete\n');
  })();
}

module.exports = { CathedralV2, CathedralNetwork, cathedral };
