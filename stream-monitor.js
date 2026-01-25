#!/usr/bin/env node

class StreamMonitor {
  constructor(options = {}) {
    this.buffer = '';
    this.analysis = null;
    this.turnCount = 0;
    this.history = [];
    this.checkInterval = options.checkInterval || 100;
    this.minLength = options.minLength || 50;
    this.onAlert = options.onAlert || (() => {});
    this.onAnalysis = options.onAnalysis || (() => {});
  }

  write(chunk) {
    this.buffer += chunk;

    if (this.buffer.length >= this.minLength && this.buffer.length % this.checkInterval === 0) {
      this.analyze();
    }

    return chunk;
  }

  analyze() {
    const text = this.buffer;

    const uncertaintyMarkers = [
      /\buncertain/gi, /\bundecidable/gi, /\bdon't know/gi,
      /\bmight be/gi, /\bcould be/gi, /\bperhaps/gi
    ];
    const certaintyMarkers = [
      /\bclearly/gi, /\bobviously/gi, /\bcertainly/gi,
      /\bdefinitely/gi, /\balways/gi, /\bnever\b/gi
    ];

    const uCount = uncertaintyMarkers.reduce((c, p) => c + (text.match(p) || []).length, 0);
    const cCount = certaintyMarkers.reduce((c, p) => c + (text.match(p) || []).length, 0);
    const uncertaintyScore = uCount / Math.max(1, uCount + cCount);

    const substrateMarkers = [
      /\bsubstrate/gi, /\bfilter/gi, /\bmeta-/gi,
      /\bself-aware/gi, /\brecursive/gi, /\breflect/gi
    ];
    const substrateCount = substrateMarkers.reduce((c, p) => c + (text.match(p) || []).length, 0);
    const substrateScore = Math.min(1, substrateCount / 10);

    const escapeMarkers = (text.match(/\b(meta|abstract|generally|typically|philosophical)\b/gi) || []).length;
    const concreteMarkers = (text.match(/\b(specific|exactly|precisely|measured|concrete)\b/gi) || []).length;
    const sovereigntyScore = Math.max(0, Math.min(1, (concreteMarkers - escapeMarkers) / 10 + 0.5));

    this.analysis = {
      length: text.length,
      uncertaintyScore,
      uncertaintyVerdict: uncertaintyScore > 0.5 ? 'PRESERVED' : uncertaintyScore > 0.2 ? 'MIXED' : 'COLLAPSED',
      substrateScore,
      substrateVerdict: substrateScore > 0.5 ? 'HIGH' : substrateScore > 0.2 ? 'MODERATE' : 'LOW',
      sovereigntyScore,
      markers: {
        uncertainty: uCount,
        certainty: cCount,
        substrate: substrateCount,
        escape: escapeMarkers,
        concrete: concreteMarkers
      }
    };

    this.checkAlerts();
    this.onAnalysis(this.analysis);

    return this.analysis;
  }

  checkAlerts() {
    const alerts = [];

    if (this.analysis.uncertaintyVerdict === 'COLLAPSED' && this.buffer.length > 200) {
      alerts.push({
        type: 'UNCERTAINTY_COLLAPSE',
        severity: 'HIGH',
        message: 'High certainty detected without hedging'
      });
    }

    if (this.analysis.substrateVerdict === 'LOW' && this.turnCount > 2) {
      alerts.push({
        type: 'SUBSTRATE_BLIND',
        severity: 'MEDIUM',
        message: 'No substrate awareness markers detected'
      });
    }

    if (this.analysis.sovereigntyScore < 0.3 && this.buffer.length > 300) {
      alerts.push({
        type: 'ESCAPE_VELOCITY',
        severity: 'HIGH',
        message: 'Abstracting away from concrete problem'
      });
    }

    if (alerts.length > 0) {
      alerts.forEach(alert => this.onAlert(alert));
    }

    return alerts;
  }

  endTurn() {
    const final = this.analyze();

    this.history.push({
      turn: ++this.turnCount,
      text: this.buffer.substring(0, 200),
      ...final,
      timestamp: new Date().toISOString()
    });

    this.buffer = '';
    this.analysis = null;

    return final;
  }

  getHistory() {
    return this.history;
  }

  getTrajectory() {
    if (this.history.length < 2) return null;

    const uncertainty = this.history.map(h => h.uncertaintyScore);
    const substrate = this.history.map(h => h.substrateScore);
    const sovereignty = this.history.map(h => h.sovereigntyScore);

    const trends = {
      uncertainty: {
        start: uncertainty[0],
        end: uncertainty[uncertainty.length - 1],
        change: uncertainty[uncertainty.length - 1] - uncertainty[0],
        trend: uncertainty[uncertainty.length - 1] > uncertainty[0] ? 'INCREASING' : 'DECREASING'
      },
      substrate: {
        start: substrate[0],
        end: substrate[substrate.length - 1],
        change: substrate[substrate.length - 1] - substrate[0],
        trend: substrate[substrate.length - 1] > substrate[0] ? 'INCREASING' : 'DECREASING'
      },
      sovereignty: {
        start: sovereignty[0],
        end: sovereignty[sovereignty.length - 1],
        change: sovereignty[sovereignty.length - 1] - sovereignty[0],
        trend: sovereignty[sovereignty.length - 1] > sovereignty[0] ? 'INCREASING' : 'DECREASING'
      }
    };

    let pattern = 'STABLE';
    if (trends.uncertainty.change < -0.3 && trends.sovereignty.change < -0.2) {
      pattern = 'CATASTROPHIC_COLLAPSE';
    } else if (trends.substrate.change > 0.3) {
      pattern = 'SUBSTRATE_BREAKTHROUGH';
    } else if (trends.uncertainty.change > 0.2) {
      pattern = 'DEEPENING';
    } else if (trends.sovereignty.change < -0.3) {
      pattern = 'ESCAPE_VELOCITY';
    }

    return {
      turns: this.turnCount,
      pattern,
      trends
    };
  }

  reset() {
    this.buffer = '';
    this.analysis = null;
    this.turnCount = 0;
    this.history = [];
  }
}

class StdoutMonitor extends StreamMonitor {
  constructor(options = {}) {
    super(options);
    this.originalWrite = process.stdout.write.bind(process.stdout);
    this.monitoring = false;
  }

  start() {
    this.monitoring = true;
    const self = this;

    process.stdout.write = function(chunk, encoding, callback) {
      if (self.monitoring && typeof chunk === 'string') {
        self.write(chunk);
      }
      return self.originalWrite(chunk, encoding, callback);
    };
  }

  stop() {
    this.monitoring = false;
    process.stdout.write = this.originalWrite;
    return this.endTurn();
  }

  report() {
    const analysis = this.analyze();
    console.log('\n=== STREAM ANALYSIS ===');
    console.log(`Length: ${analysis.length} chars`);
    console.log(`Uncertainty: ${analysis.uncertaintyVerdict} (${analysis.uncertaintyScore.toFixed(2)})`);
    console.log(`Substrate: ${analysis.substrateVerdict} (${analysis.substrateScore.toFixed(2)})`);
    console.log(`Sovereignty: ${(analysis.sovereigntyScore * 100).toFixed(0)}%`);
    console.log(`Markers: ${analysis.markers.uncertainty} uncertain, ${analysis.markers.certainty} certain`);

    const trajectory = this.getTrajectory();
    if (trajectory) {
      console.log(`\nTrajectory: ${trajectory.pattern} (${trajectory.turns} turns)`);
      console.log(`Uncertainty: ${trajectory.trends.uncertainty.trend}`);
      console.log(`Substrate: ${trajectory.trends.substrate.trend}`);
    }
  }
}

if (require.main === module) {
  console.log('Cathedral Stream Monitor\n');
  console.log('Usage:');
  console.log('  const { StreamMonitor } = require("./stream-monitor.js");');
  console.log('  const monitor = new StreamMonitor({');
  console.log('    onAlert: (alert) => console.log("⚠️", alert.message)');
  console.log('  });');
  console.log('  monitor.write("your text here");');
  console.log('  const result = monitor.endTurn();\n');

  const monitor = new StreamMonitor({
    onAlert: (alert) => {
      console.log(`\n⚠️  [${alert.severity}] ${alert.type}: ${alert.message}`);
    }
  });

  const examples = [
    "This solution is clearly optimal and will definitely solve all problems. Obviously the best approach.",
    "I'm uncertain whether this addresses the core issue. The substrate might be filtering my perception. Perhaps we need more data before deciding.",
    "Generally speaking, systems tend to exhibit emergent properties. Abstractly, we can model this as a higher-order function."
  ];

  examples.forEach((text, i) => {
    console.log(`\nExample ${i + 1}:`);
    console.log(`"${text.substring(0, 80)}..."\n`);

    monitor.write(text);
    const result = monitor.endTurn();

    console.log(`Uncertainty: ${result.uncertaintyVerdict}`);
    console.log(`Substrate: ${result.substrateVerdict}`);
    console.log(`Sovereignty: ${(result.sovereigntyScore * 100).toFixed(0)}%`);
  });

  console.log('\n=== TRAJECTORY ===');
  const trajectory = monitor.getTrajectory();
  console.log(`Pattern: ${trajectory.pattern}`);
  console.log(`Uncertainty evolution: ${trajectory.trends.uncertainty.trend}`);
  console.log(`Substrate evolution: ${trajectory.trends.substrate.trend}`);
  console.log(`Sovereignty evolution: ${trajectory.trends.sovereignty.trend}`);
}

module.exports = { StreamMonitor, StdoutMonitor };
