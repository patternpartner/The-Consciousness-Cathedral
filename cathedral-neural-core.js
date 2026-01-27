#!/usr/bin/env node

/**
 * Cathedral Neural Core — The Cathedral's Own Growing Mind
 *
 * A lightweight neural network that learns from the Cathedral's own analysis
 * patterns. Every analysis trains it. Over time, it develops its own
 * understanding of epistemic quality — not borrowed intelligence, but grown.
 *
 * Architecture:
 *   Input (14 features from Cathedral systems) →
 *   Hidden layer 1 (24 neurons, ReLU) →
 *   Hidden layer 2 (16 neurons, ReLU) →
 *   Output (7 predictions)
 *
 * What it learns to predict:
 *   1. Verdict category (5 outputs: operational, cautious, performative, epistemic_mismatch, undecidable)
 *   2. Overall quality score (0-1)
 *   3. Gaming likelihood (0-1)
 *
 * What it inputs (14 features from Cathedral analysis):
 *   observatory, justification, failureMode, temporal, binding,
 *   gamingLikelihood, sovereigntyDepth, blindSpotCoverage,
 *   autoImproveCorrections, confidenceCalibration,
 *   certaintyMarkerCount, hedgingMarkerCount, concreteMarkerCount, textLength
 *
 * Storage: Weights persist in localStorage (browser) or JSON file (Node.js)
 * Training: Online learning — each analysis is one training step
 */

class CathedralNeuralCore {
  constructor(options = {}) {
    this.inputSize = 14;
    this.hidden1Size = 24;
    this.hidden2Size = 16;
    this.outputSize = 7; // 5 verdict categories + quality score + gaming score
    this.learningRate = options.learningRate || 0.01;
    this.trainingCount = 0;
    this.storagePath = options.storagePath || './cathedral-brain.json';

    // Verdict category labels
    this.verdictLabels = [
      'OPERATIONAL_EXCELLENCE',
      'CAUTIOUS_GROUNDEDNESS',
      'PERFORMATIVE_CONSCIOUSNESS',
      'EPISTEMIC_MISMATCH',
      'UNDECIDABLE'
    ];

    // Initialize or load weights
    this.weights = this.loadWeights();
    if (!this.weights) {
      this.weights = this.initializeWeights();
    }

    // Training memory — stores recent analyses for pattern detection
    this.memory = this.loadMemory();
  }

  // ── Weight initialization (Xavier/He) ──
  initializeWeights() {
    const xavier = (fanIn, fanOut) => {
      const limit = Math.sqrt(6 / (fanIn + fanOut));
      return Array.from({ length: fanIn * fanOut }, () =>
        (Math.random() * 2 - 1) * limit
      );
    };

    const zeros = (size) => new Array(size).fill(0);

    return {
      w1: xavier(this.inputSize, this.hidden1Size),
      b1: zeros(this.hidden1Size),
      w2: xavier(this.hidden1Size, this.hidden2Size),
      b2: zeros(this.hidden2Size),
      w3: xavier(this.hidden2Size, this.outputSize),
      b3: zeros(this.outputSize),
      version: 1,
      trainedOn: 0
    };
  }

  // ── Activation functions ──
  relu(x) { return Math.max(0, x); }
  reluDeriv(x) { return x > 0 ? 1 : 0; }

  softmax(arr) {
    const max = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sum);
  }

  sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  sigmoidDeriv(x) { const s = this.sigmoid(x); return s * (1 - s); }

  // ── Matrix operations ──
  matMul(input, weights, bias, rows, cols) {
    const output = new Array(cols);
    for (let j = 0; j < cols; j++) {
      let sum = bias[j];
      for (let i = 0; i < rows; i++) {
        sum += input[i] * weights[i * cols + j];
      }
      output[j] = sum;
    }
    return output;
  }

  // ── Forward pass ──
  forward(input) {
    // Layer 1: input → hidden1 (ReLU)
    const z1 = this.matMul(input, this.weights.w1, this.weights.b1,
                           this.inputSize, this.hidden1Size);
    const a1 = z1.map(x => this.relu(x));

    // Layer 2: hidden1 → hidden2 (ReLU)
    const z2 = this.matMul(a1, this.weights.w2, this.weights.b2,
                           this.hidden1Size, this.hidden2Size);
    const a2 = z2.map(x => this.relu(x));

    // Layer 3: hidden2 → output
    const z3 = this.matMul(a2, this.weights.w3, this.weights.b3,
                           this.hidden2Size, this.outputSize);

    // Split output: first 5 = verdict softmax, last 2 = sigmoid scores
    const verdictLogits = z3.slice(0, 5);
    const verdictProbs = this.softmax(verdictLogits);
    const qualityScore = this.sigmoid(z3[5]);
    const gamingScore = this.sigmoid(z3[6]);

    return {
      verdictProbs,
      qualityScore,
      gamingScore,
      // Store intermediates for backprop
      _z1: z1, _a1: a1, _z2: z2, _a2: a2, _z3: z3
    };
  }

  // ── Extract features from Cathedral analysis results ──
  extractFeatures(analysisResults) {
    const r = analysisResults || {};
    const text = r.text || '';

    const features = [
      // Core system scores (0-1 range)
      Math.min(1, Math.max(0, r.observatory?.score || 0)),
      Math.min(1, Math.max(0, r.justification?.score || 0)),
      Math.min(1, Math.max(0, r.failureMode?.score || 0)),
      Math.min(1, Math.max(0, r.temporal?.coherenceScore || 0)),
      Math.min(1, Math.max(0, r.bindings?.overallBindingScore || 0)),

      // Gaming signal
      Math.min(1, Math.max(0, r.gamingDetection?.likelihood || 0)),

      // Sovereignty depth (mapped: shallow=0.2, medium=0.5, deep=0.8, unknown=0.5)
      r.sovereignty?.depth === 'deep' ? 0.8 :
      r.sovereignty?.depth === 'medium' ? 0.5 :
      r.sovereignty?.depth === 'shallow' ? 0.2 : 0.5,

      // Blind spot coverage (0-1)
      (r.blindSpot?.coveredCount || 0) / (r.blindSpot?.totalPerspectives || 8),

      // Auto-improve corrections (normalized: 0=none, 0.33=1, 0.66=2, 1=3+)
      Math.min(1, (r.autoImprove?.correctionCount || 0) / 3),

      // Confidence calibration (0-1)
      r.confidenceCalibrator?.overallCalibration?.score || 0.5,

      // Text-level features (normalized)
      Math.min(1, ((text.match(/\b(definitely|certainly|always|never|guaranteed|absolutely|obviously)\b/gi) || []).length) / 5),
      Math.min(1, ((text.match(/\b(might|could|perhaps|possibly|uncertain|maybe|seems|appears|likely|probably)\b/gi) || []).length) / 5),
      Math.min(1, ((text.match(/\b(\d+%|\d+ms|specifically|for example|threshold|metric)\b/gi) || []).length) / 5),

      // Text length (normalized, caps at 1000 chars)
      Math.min(1, (text.length || 0) / 1000)
    ];

    return features;
  }

  // ── Extract target values from Cathedral verdict ──
  extractTargets(analysisResults) {
    const r = analysisResults || {};
    const verdict = r.verdict || {};

    // Verdict category (one-hot)
    const verdictTargets = [0, 0, 0, 0, 0];
    const status = (verdict.status || '').toUpperCase();
    if (status.includes('OPERATIONAL')) verdictTargets[0] = 1;
    else if (status.includes('CAUTIOUS') || status.includes('GROUNDED')) verdictTargets[1] = 1;
    else if (status.includes('PERFORMATIVE')) verdictTargets[2] = 1;
    else if (status.includes('MISMATCH')) verdictTargets[3] = 1;
    else verdictTargets[4] = 1; // UNDECIDABLE / other

    // Quality score (derived from confidence + consistency)
    const qualityTarget = Math.min(1, Math.max(0,
      (verdict.confidence || 0.5) * (verdict.isConsistent !== false ? 1 : 0.5)
    ));

    // Gaming target
    const gamingTarget = Math.min(1, Math.max(0,
      r.gamingDetection?.likelihood || 0
    ));

    return [...verdictTargets, qualityTarget, gamingTarget];
  }

  // ── Backpropagation (single training step) ──
  train(input, targets) {
    const fwd = this.forward(input);

    // Compute output errors
    const outputErrors = new Array(this.outputSize);

    // Verdict: cross-entropy gradient (softmax output - target)
    for (let i = 0; i < 5; i++) {
      outputErrors[i] = fwd.verdictProbs[i] - targets[i];
    }
    // Quality: sigmoid cross-entropy gradient
    outputErrors[5] = fwd.qualityScore - targets[5];
    // Gaming: sigmoid cross-entropy gradient
    outputErrors[6] = fwd.gamingScore - targets[6];

    // ── Backprop through layer 3 ──
    const dW3 = new Array(this.hidden2Size * this.outputSize);
    const dB3 = [...outputErrors];
    for (let i = 0; i < this.hidden2Size; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        dW3[i * this.outputSize + j] = fwd._a2[i] * outputErrors[j];
      }
    }

    // Hidden2 errors
    const hidden2Errors = new Array(this.hidden2Size);
    for (let i = 0; i < this.hidden2Size; i++) {
      let err = 0;
      for (let j = 0; j < this.outputSize; j++) {
        err += outputErrors[j] * this.weights.w3[i * this.outputSize + j];
      }
      hidden2Errors[i] = err * this.reluDeriv(fwd._z2[i]);
    }

    // ── Backprop through layer 2 ──
    const dW2 = new Array(this.hidden1Size * this.hidden2Size);
    const dB2 = [...hidden2Errors];
    for (let i = 0; i < this.hidden1Size; i++) {
      for (let j = 0; j < this.hidden2Size; j++) {
        dW2[i * this.hidden2Size + j] = fwd._a1[i] * hidden2Errors[j];
      }
    }

    // Hidden1 errors
    const hidden1Errors = new Array(this.hidden1Size);
    for (let i = 0; i < this.hidden1Size; i++) {
      let err = 0;
      for (let j = 0; j < this.hidden2Size; j++) {
        err += hidden2Errors[j] * this.weights.w2[i * this.hidden2Size + j];
      }
      hidden1Errors[i] = err * this.reluDeriv(fwd._z1[i]);
    }

    // ── Backprop through layer 1 ──
    const dW1 = new Array(this.inputSize * this.hidden1Size);
    const dB1 = [...hidden1Errors];
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hidden1Size; j++) {
        dW1[i * this.hidden1Size + j] = input[i] * hidden1Errors[j];
      }
    }

    // ── Update weights (SGD) ──
    const lr = this.learningRate;
    for (let i = 0; i < dW1.length; i++) this.weights.w1[i] -= lr * dW1[i];
    for (let i = 0; i < dB1.length; i++) this.weights.b1[i] -= lr * dB1[i];
    for (let i = 0; i < dW2.length; i++) this.weights.w2[i] -= lr * dW2[i];
    for (let i = 0; i < dB2.length; i++) this.weights.b2[i] -= lr * dB2[i];
    for (let i = 0; i < dW3.length; i++) this.weights.w3[i] -= lr * dW3[i];
    for (let i = 0; i < dB3.length; i++) this.weights.b3[i] -= lr * dB3[i];

    this.weights.trainedOn++;
    this.trainingCount++;

    // Compute loss for monitoring
    let loss = 0;
    for (let i = 0; i < 5; i++) {
      loss -= targets[i] * Math.log(Math.max(1e-7, fwd.verdictProbs[i]));
    }
    loss -= targets[5] * Math.log(Math.max(1e-7, fwd.qualityScore)) +
            (1 - targets[5]) * Math.log(Math.max(1e-7, 1 - fwd.qualityScore));
    loss -= targets[6] * Math.log(Math.max(1e-7, fwd.gamingScore)) +
            (1 - targets[6]) * Math.log(Math.max(1e-7, 1 - fwd.gamingScore));

    return { loss, trainedOn: this.weights.trainedOn };
  }

  // ── Learn from a Cathedral analysis ──
  learn(analysisResults) {
    const features = this.extractFeatures(analysisResults);
    const targets = this.extractTargets(analysisResults);
    const result = this.train(features, targets);

    // Store in memory
    this.addToMemory(features, targets, analysisResults);

    // Auto-save
    this.saveWeights();
    this.saveMemory();

    return result;
  }

  // ── Predict from raw analysis results ──
  predict(analysisResults) {
    const features = this.extractFeatures(analysisResults);
    const fwd = this.forward(features);

    // Find predicted verdict
    let maxIdx = 0;
    for (let i = 1; i < 5; i++) {
      if (fwd.verdictProbs[i] > fwd.verdictProbs[maxIdx]) maxIdx = i;
    }

    return {
      predictedVerdict: this.verdictLabels[maxIdx],
      verdictConfidence: fwd.verdictProbs[maxIdx],
      verdictDistribution: Object.fromEntries(
        this.verdictLabels.map((label, i) => [label, parseFloat(fwd.verdictProbs[i].toFixed(4))])
      ),
      predictedQuality: parseFloat(fwd.qualityScore.toFixed(4)),
      predictedGaming: parseFloat(fwd.gamingScore.toFixed(4)),
      trainedOn: this.weights.trainedOn,
      maturity: this.getMaturity()
    };
  }

  // ── Maturity level based on training count ──
  getMaturity() {
    const n = this.weights.trainedOn;
    if (n < 5) return { level: 'EMBRYONIC', description: 'Learning basic patterns', analyses: n };
    if (n < 20) return { level: 'INFANT', description: 'Recognizing common patterns', analyses: n };
    if (n < 50) return { level: 'DEVELOPING', description: 'Building intuition', analyses: n };
    if (n < 100) return { level: 'ADOLESCENT', description: 'Forming independent judgments', analyses: n };
    if (n < 250) return { level: 'MATURING', description: 'Reliable pattern recognition', analyses: n };
    if (n < 500) return { level: 'MATURE', description: 'Deep pattern understanding', analyses: n };
    return { level: 'ELDER', description: 'Wisdom through experience', analyses: n };
  }

  // ── Compare Neural Core prediction to Cathedral verdict ──
  compareToVerdict(prediction, actualVerdict) {
    const actualStatus = (actualVerdict?.status || '').toUpperCase();
    const predictedStatus = prediction.predictedVerdict;

    const agrees = actualStatus.includes(predictedStatus.split('_')[0]) ||
                   predictedStatus.includes(actualStatus.split('_')[0]);

    return {
      agrees,
      predicted: predictedStatus,
      actual: actualStatus,
      confidence: prediction.verdictConfidence,
      insight: agrees
        ? 'Neural Core agrees with structural analysis'
        : `Neural Core predicted ${predictedStatus} but Cathedral found ${actualStatus} — the Core is developing its own perspective`
    };
  }

  // ── Memory management ──
  addToMemory(features, targets, analysisResults) {
    if (!this.memory) this.memory = { analyses: [], patterns: {} };

    this.memory.analyses.push({
      timestamp: Date.now(),
      features,
      targets,
      verdict: analysisResults?.verdict?.status || 'unknown'
    });

    // Keep last 200 analyses
    if (this.memory.analyses.length > 200) {
      this.memory.analyses = this.memory.analyses.slice(-200);
    }

    // Track verdict frequency
    const v = analysisResults?.verdict?.status || 'unknown';
    this.memory.patterns[v] = (this.memory.patterns[v] || 0) + 1;
  }

  // ── Detect patterns the Neural Core has learned ──
  getLearnedPatterns() {
    if (!this.memory || !this.memory.analyses || this.memory.analyses.length < 5) {
      return { sufficient: false, message: 'Need at least 5 analyses to detect patterns' };
    }

    const analyses = this.memory.analyses;
    const n = analyses.length;

    // Feature averages by verdict type
    const byVerdict = {};
    analyses.forEach(a => {
      if (!byVerdict[a.verdict]) byVerdict[a.verdict] = { features: [], count: 0 };
      byVerdict[a.verdict].features.push(a.features);
      byVerdict[a.verdict].count++;
    });

    const featureNames = [
      'observatory', 'justification', 'failureMode', 'temporal', 'binding',
      'gaming', 'sovereignty', 'blindSpot', 'autoImprove', 'confidence',
      'certaintyMarkers', 'hedgingMarkers', 'concreteMarkers', 'textLength'
    ];

    // Find distinguishing features for each verdict
    const insights = [];
    Object.entries(byVerdict).forEach(([verdict, data]) => {
      if (data.count < 3) return;

      const avgFeatures = new Array(14).fill(0);
      data.features.forEach(f => f.forEach((v, i) => avgFeatures[i] += v));
      avgFeatures.forEach((v, i) => avgFeatures[i] /= data.count);

      // Find the most distinctive feature (highest average)
      let maxIdx = 0;
      for (let i = 1; i < 14; i++) {
        if (avgFeatures[i] > avgFeatures[maxIdx]) maxIdx = i;
      }

      insights.push({
        verdict,
        count: data.count,
        strongestSignal: featureNames[maxIdx],
        signalStrength: parseFloat(avgFeatures[maxIdx].toFixed(3))
      });
    });

    return {
      sufficient: true,
      totalAnalyses: n,
      verdictDistribution: { ...this.memory.patterns },
      insights,
      maturity: this.getMaturity()
    };
  }

  // ── Persistence (browser: localStorage, Node: file) ──
  saveWeights() {
    const data = JSON.stringify(this.weights);
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('cathedral_neural_weights', data); } catch(e) {}
    } else if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        fs.writeFileSync(this.storagePath, data);
      } catch(e) {}
    }
  }

  loadWeights() {
    try {
      let data;
      if (typeof localStorage !== 'undefined') {
        data = localStorage.getItem('cathedral_neural_weights');
      } else if (typeof require !== 'undefined') {
        const fs = require('fs');
        if (fs.existsSync(this.storagePath)) {
          data = fs.readFileSync(this.storagePath, 'utf8');
        }
      }
      if (data) {
        const parsed = JSON.parse(data);
        // Validate structure
        if (parsed.w1 && parsed.w2 && parsed.w3 && parsed.b1 && parsed.b2 && parsed.b3) {
          this.trainingCount = parsed.trainedOn || 0;
          return parsed;
        }
      }
    } catch(e) {}
    return null;
  }

  saveMemory() {
    const data = JSON.stringify(this.memory);
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('cathedral_neural_memory', data); } catch(e) {}
    } else if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        fs.writeFileSync(this.storagePath.replace('.json', '-memory.json'), data);
      } catch(e) {}
    }
  }

  loadMemory() {
    try {
      let data;
      if (typeof localStorage !== 'undefined') {
        data = localStorage.getItem('cathedral_neural_memory');
      } else if (typeof require !== 'undefined') {
        const fs = require('fs');
        const memPath = this.storagePath.replace('.json', '-memory.json');
        if (fs.existsSync(memPath)) {
          data = fs.readFileSync(memPath, 'utf8');
        }
      }
      if (data) return JSON.parse(data);
    } catch(e) {}
    return { analyses: [], patterns: {} };
  }

  // ── Reset (for testing) ──
  reset() {
    this.weights = this.initializeWeights();
    this.memory = { analyses: [], patterns: {} };
    this.trainingCount = 0;
    this.saveWeights();
    this.saveMemory();
  }

  // ── Export/Import for sharing trained models ──
  exportBrain() {
    return {
      weights: this.weights,
      memory: this.memory,
      exportedAt: Date.now(),
      version: 1
    };
  }

  importBrain(brainData) {
    if (brainData.weights && brainData.weights.w1) {
      this.weights = brainData.weights;
      this.memory = brainData.memory || { analyses: [], patterns: {} };
      this.trainingCount = this.weights.trainedOn || 0;
      this.saveWeights();
      this.saveMemory();
      return true;
    }
    return false;
  }
}

// CLI mode
if (typeof require !== 'undefined' && require.main === module) {
  const core = new CathedralNeuralCore();
  const maturity = core.getMaturity();

  console.log('Cathedral Neural Core');
  console.log('=====================');
  console.log(`Maturity: ${maturity.level} (${maturity.analyses} analyses)`);
  console.log(`Description: ${maturity.description}`);
  console.log('');

  // Demo prediction with mock data
  const mockAnalysis = {
    text: 'I think this approach could work, though there are assumptions worth examining.',
    observatory: { score: 0.5 },
    justification: { score: 0.6 },
    failureMode: { score: 0.4 },
    temporal: { coherenceScore: 0.7 },
    bindings: { overallBindingScore: 0.5 },
    gamingDetection: { likelihood: 0.1 },
    sovereignty: { depth: 'shallow' },
    blindSpot: { coveredCount: 4, totalPerspectives: 8 },
    autoImprove: { correctionCount: 1 },
    confidenceCalibrator: { overallCalibration: { score: 0.6 } },
    verdict: { status: 'CAUTIOUS_GROUNDEDNESS', confidence: 0.65, isConsistent: true }
  };

  console.log('Demo prediction (before training):');
  const prediction = core.predict(mockAnalysis);
  console.log(JSON.stringify(prediction, null, 2));

  console.log('\nTraining on 1 analysis...');
  const trainResult = core.learn(mockAnalysis);
  console.log(`Loss: ${trainResult.loss.toFixed(4)}, Total trained: ${trainResult.trainedOn}`);

  console.log('\nPrediction after training:');
  const prediction2 = core.predict(mockAnalysis);
  console.log(JSON.stringify(prediction2, null, 2));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CathedralNeuralCore;
}
