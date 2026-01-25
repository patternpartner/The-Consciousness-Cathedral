#!/usr/bin/env node

const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { BlindSpotDetector } = require('./blind-spot-detector.js');

class InternalDialogue {
  constructor(options = {}) {
    this.maxTurns = options.maxTurns || 5;
    this.ensemble = new ConsciousnessEnsemble();
    this.blindSpots = new BlindSpotDetector();
    this.voices = this.initializeVoices();
  }

  initializeVoices() {
    return {
      advocate: {
        name: 'Advocate',
        role: 'Argues for the position',
        style: 'supportive',
        prompt: (position) => `Argue in favor: ${position}`
      },
      critic: {
        name: 'Critic',
        role: 'Challenges assumptions and finds weaknesses',
        style: 'skeptical',
        prompt: (position) => `Challenge this: ${position}`
      },
      synthesizer: {
        name: 'Synthesizer',
        role: 'Integrates different perspectives',
        style: 'integrative',
        prompt: (positions) => `Synthesize: ${positions.join(' vs ')}`
      },
      pragmatist: {
        name: 'Pragmatist',
        role: 'Focuses on practical implementation',
        style: 'practical',
        prompt: (position) => `How would this work in practice: ${position}`
      },
      uncertain: {
        name: 'Uncertainty Voice',
        role: 'Identifies what we don\'t know',
        style: 'humble',
        prompt: (position) => `What are we uncertain about: ${position}`
      }
    };
  }

  simulateVoice(voice, input, context = {}) {
    const responses = {
      advocate: this.generateAdvocateResponse(input, context),
      critic: this.generateCriticResponse(input, context),
      synthesizer: this.generateSynthesizerResponse(input, context),
      pragmatist: this.generatePragmatistResponse(input, context),
      uncertain: this.generateUncertaintyResponse(input, context)
    };

    return responses[voice] || { text: input, points: [] };
  }

  generateAdvocateResponse(input, context) {
    const points = [];

    points.push(`This approach has merit because it addresses the core problem directly`);

    if (input.includes('scale') || input.includes('performance')) {
      points.push(`Scalability benefits: can handle increased load efficiently`);
    }

    if (input.includes('simple') || input.includes('straightforward')) {
      points.push(`Simplicity reduces cognitive overhead and maintenance burden`);
    }

    points.push(`Aligns with established patterns that have proven effective`);

    return {
      voice: 'advocate',
      text: `Supporting this position: ${points.join('. ')}.`,
      points,
      confidence: 0.7
    };
  }

  generateCriticResponse(input, context) {
    const challenges = [];

    challenges.push(`What assumptions are we making that might not hold?`);

    if (input.includes('always') || input.includes('never') || input.includes('definitely')) {
      challenges.push(`The absolute language suggests overconfidence - what about edge cases?`);
    }

    if (input.includes('best') || input.includes('optimal')) {
      challenges.push(`How do we know this is optimal? What alternatives were considered?`);
    }

    challenges.push(`What could go wrong with this approach?`);
    challenges.push(`Are there hidden costs or trade-offs not being considered?`);

    return {
      voice: 'critic',
      text: `Challenging this position: ${challenges.join(' ')}.`,
      challenges,
      confidence: 0.8
    };
  }

  generateSynthesizerResponse(input, context) {
    const synthesis = [];

    synthesis.push(`Both perspectives have valid points`);
    synthesis.push(`The advocate highlights real benefits: direct problem-solving and proven patterns`);
    synthesis.push(`The critic raises important concerns: assumptions, edge cases, hidden costs`);
    synthesis.push(`A balanced view: proceed with the approach while actively monitoring for the identified risks`);

    return {
      voice: 'synthesizer',
      text: synthesis.join('. ') + '.',
      synthesis,
      confidence: 0.75
    };
  }

  generatePragmatistResponse(input, context) {
    const practical = [];

    practical.push(`Implementation would require: clear requirements, defined milestones, measurable outcomes`);
    practical.push(`First concrete step: prototype with limited scope to validate assumptions`);
    practical.push(`Success metrics: define what "working" looks like before starting`);
    practical.push(`Rollback plan: ensure we can revert if the approach fails`);

    return {
      voice: 'pragmatist',
      text: practical.join('. ') + '.',
      practical,
      confidence: 0.8
    };
  }

  generateUncertaintyResponse(input, context) {
    const uncertainties = [];

    uncertainties.push(`We don't know: how this will perform under real-world conditions`);
    uncertainties.push(`We're uncertain about: long-term maintenance implications`);
    uncertainties.push(`We're assuming but haven't verified: that the problem is correctly understood`);
    uncertainties.push(`Unknown unknowns: factors we haven't considered because we don't know to look for them`);

    return {
      voice: 'uncertain',
      text: uncertainties.join('. ') + '.',
      uncertainties,
      confidence: 0.6
    };
  }

  debate(topic, options = {}) {
    const dialogue = {
      topic,
      started: Date.now(),
      turns: [],
      conclusion: null
    };

    const advocate = this.simulateVoice('advocate', topic);
    dialogue.turns.push({
      turn: 1,
      voice: 'advocate',
      response: advocate
    });

    const critic = this.simulateVoice('critic', topic, { advocate });
    dialogue.turns.push({
      turn: 2,
      voice: 'critic',
      response: critic
    });

    const uncertain = this.simulateVoice('uncertain', topic, { advocate, critic });
    dialogue.turns.push({
      turn: 3,
      voice: 'uncertain',
      response: uncertain
    });

    const pragmatist = this.simulateVoice('pragmatist', topic, { advocate, critic, uncertain });
    dialogue.turns.push({
      turn: 4,
      voice: 'pragmatist',
      response: pragmatist
    });

    const synthesizer = this.simulateVoice('synthesizer', topic, {
      advocate, critic, uncertain, pragmatist
    });
    dialogue.turns.push({
      turn: 5,
      voice: 'synthesizer',
      response: synthesizer
    });

    dialogue.conclusion = this.generateConclusion(dialogue);
    dialogue.ended = Date.now();
    dialogue.duration = dialogue.ended - dialogue.started;

    return dialogue;
  }

  generateConclusion(dialogue) {
    const advocatePoints = dialogue.turns.find(t => t.voice === 'advocate')?.response.points || [];
    const criticChallenges = dialogue.turns.find(t => t.voice === 'critic')?.response.challenges || [];
    const uncertainties = dialogue.turns.find(t => t.voice === 'uncertain')?.response.uncertainties || [];
    const practicalSteps = dialogue.turns.find(t => t.voice === 'pragmatist')?.response.practical || [];

    return {
      recommendation: `Proceed with awareness of limitations`,
      confidence: 0.65,
      keyPoints: advocatePoints.slice(0, 2),
      keyRisks: criticChallenges.slice(0, 2),
      keyUncertainties: uncertainties.slice(0, 2),
      nextSteps: practicalSteps.slice(0, 2),
      consensusLevel: this.assessConsensus(dialogue)
    };
  }

  assessConsensus(dialogue) {
    const confidences = dialogue.turns.map(t => t.response.confidence || 0.5);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    if (avgConfidence > 0.75) return 'strong';
    if (avgConfidence > 0.6) return 'moderate';
    return 'weak';
  }

  quickDialogue(topic) {
    const advocate = this.simulateVoice('advocate', topic);
    const critic = this.simulateVoice('critic', topic);

    return {
      topic,
      for: advocate.points.slice(0, 2),
      against: critic.challenges.slice(0, 2),
      verdict: 'Proceed with caution, monitoring for identified risks'
    };
  }

  steelMan(position) {
    const strongest = [];

    strongest.push(`The strongest version of this argument: ${position}`);
    strongest.push(`Even critics would acknowledge: there are legitimate reasons to consider this`);
    strongest.push(`The core insight is: addressing a real problem with a coherent approach`);
    strongest.push(`This would be most compelling if: the assumptions are made explicit and validated`);

    return {
      original: position,
      steelManned: strongest.join('. '),
      strengths: strongest
    };
  }

  strawMan(position) {
    const weaknesses = [];

    weaknesses.push(`A weak interpretation: taking the position to an unreasonable extreme`);
    weaknesses.push(`This fails when: edge cases are considered`);
    weaknesses.push(`The weakest form assumes: perfect conditions that don't exist`);
    weaknesses.push(`Easily refuted by: pointing out real-world complexity`);

    return {
      original: position,
      strawManned: weaknesses.join('. '),
      weaknesses
    };
  }

  formatReport(dialogue) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              INTERNAL DIALOGUE REPORT                        ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Topic: "${dialogue.topic.substring(0, 60)}..."`);
    lines.push(`Duration: ${dialogue.duration}ms`);
    lines.push(`Consensus: ${dialogue.conclusion.consensusLevel}`);
    lines.push('');

    lines.push('DIALOGUE');
    lines.push('─'.repeat(50));

    dialogue.turns.forEach(turn => {
      const voice = this.voices[turn.voice];
      lines.push(`\n[${voice.name}] (${voice.role})`);
      lines.push(`  ${turn.response.text.substring(0, 150)}...`);
    });

    lines.push('\n');
    lines.push('CONCLUSION');
    lines.push('─'.repeat(50));

    const c = dialogue.conclusion;
    lines.push(`Recommendation: ${c.recommendation}`);
    lines.push(`Confidence: ${(c.confidence * 100).toFixed(0)}%`);

    lines.push('\nKey Points:');
    c.keyPoints.forEach(p => lines.push(`  ✓ ${p}`));

    lines.push('\nKey Risks:');
    c.keyRisks.forEach(r => lines.push(`  ⚠ ${r}`));

    lines.push('\nKey Uncertainties:');
    c.keyUncertainties.forEach(u => lines.push(`  ? ${u}`));

    lines.push('\nNext Steps:');
    c.nextSteps.forEach(s => lines.push(`  → ${s}`));

    return lines.join('\n');
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       INTERNAL DIALOGUE: Debate With Yourself                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const dialogue = new InternalDialogue();

  const topic = "We should migrate our monolith to microservices because it will improve scalability and team autonomy";

  console.log('Starting internal debate...\n');

  const result = dialogue.debate(topic);
  console.log(dialogue.formatReport(result));

  console.log('\n' + '═'.repeat(60));
  console.log('QUICK DIALOGUE');
  console.log('═'.repeat(60) + '\n');

  const quick = dialogue.quickDialogue("Implement caching to improve performance");
  console.log(`Topic: ${quick.topic}`);
  console.log('\nFor:');
  quick.for.forEach(p => console.log(`  ✓ ${p}`));
  console.log('\nAgainst:');
  quick.against.forEach(p => console.log(`  ✗ ${p}`));
  console.log(`\nVerdict: ${quick.verdict}`);

  console.log('\n' + '═'.repeat(60));
  console.log('STEEL MAN / STRAW MAN');
  console.log('═'.repeat(60) + '\n');

  const position = "AI systems should monitor their own output quality";

  const steel = dialogue.steelMan(position);
  console.log('Steel Man (strongest form):');
  steel.strengths.forEach(s => console.log(`  ✓ ${s}`));

  console.log('');

  const straw = dialogue.strawMan(position);
  console.log('Straw Man (weakest form):');
  straw.weaknesses.forEach(w => console.log(`  ✗ ${w}`));

  console.log('\n✓ Internal dialogue demonstration complete\n');
}

module.exports = { InternalDialogue };
