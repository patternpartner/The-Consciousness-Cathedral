#!/usr/bin/env node

const fs = require('fs');

class ConfidenceCalibrator {
  constructor(options = {}) {
    this.historyPath = options.historyPath || './confidence-history.json';
    this.history = this.loadHistory();
    this.buckets = this.initializeBuckets();
  }

  loadHistory() {
    if (fs.existsSync(this.historyPath)) {
      return JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
    }
    return {
      predictions: [],
      calibration: {},
      meta: {
        total: 0,
        correct: 0
      }
    };
  }

  save() {
    fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
  }

  initializeBuckets() {
    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  }

  getBucket(confidence) {
    return Math.ceil(confidence * 10) / 10;
  }

  recordPrediction(prediction) {
    const record = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      statement: prediction.statement,
      confidence: prediction.confidence,
      domain: prediction.domain || 'general',
      outcome: null,
      verified: false
    };

    this.history.predictions.push(record);
    this.history.meta.total++;

    return record;
  }

  verifyPrediction(predictionId, correct) {
    const prediction = this.history.predictions.find(p => p.id === predictionId);
    if (!prediction) return null;

    prediction.outcome = correct;
    prediction.verified = true;
    prediction.verifiedAt = new Date().toISOString();

    if (correct) {
      this.history.meta.correct++;
    }

    this.updateCalibration(prediction);
    this.save();

    return prediction;
  }

  updateCalibration(prediction) {
    const bucket = this.getBucket(prediction.confidence);
    const bucketKey = bucket.toFixed(1);

    if (!this.history.calibration[bucketKey]) {
      this.history.calibration[bucketKey] = {
        total: 0,
        correct: 0,
        predictions: []
      };
    }

    const cal = this.history.calibration[bucketKey];
    cal.total++;
    if (prediction.outcome) cal.correct++;
    cal.predictions.push(prediction.id);
  }

  getCalibrationScore() {
    const verified = this.history.predictions.filter(p => p.verified);
    if (verified.length < 5) {
      return { score: null, message: 'Need at least 5 verified predictions' };
    }

    let totalError = 0;
    let bucketCount = 0;

    Object.entries(this.history.calibration).forEach(([bucket, data]) => {
      if (data.total >= 2) {
        const expectedAccuracy = parseFloat(bucket);
        const actualAccuracy = data.correct / data.total;
        totalError += Math.pow(expectedAccuracy - actualAccuracy, 2);
        bucketCount++;
      }
    });

    if (bucketCount === 0) {
      return { score: null, message: 'Not enough data in buckets' };
    }

    const brier = totalError / bucketCount;
    const calibrationScore = 1 - Math.sqrt(brier);

    return {
      score: calibrationScore,
      interpretation: this.interpretScore(calibrationScore),
      bucketCount,
      totalVerified: verified.length
    };
  }

  interpretScore(score) {
    if (score >= 0.9) return 'Excellent calibration';
    if (score >= 0.8) return 'Good calibration';
    if (score >= 0.7) return 'Fair calibration';
    if (score >= 0.6) return 'Poor calibration - tends to be over/underconfident';
    return 'Very poor calibration - confidence doesn\'t match accuracy';
  }

  getCalibrationCurve() {
    const curve = [];

    this.buckets.forEach(bucket => {
      const bucketKey = bucket.toFixed(1);
      const data = this.history.calibration[bucketKey];

      if (data && data.total > 0) {
        curve.push({
          expectedConfidence: bucket,
          actualAccuracy: data.correct / data.total,
          sampleSize: data.total,
          gap: (data.correct / data.total) - bucket
        });
      } else {
        curve.push({
          expectedConfidence: bucket,
          actualAccuracy: null,
          sampleSize: 0,
          gap: null
        });
      }
    });

    return curve;
  }

  suggestConfidenceAdjustment(rawConfidence) {
    const bucket = this.getBucket(rawConfidence);
    const bucketKey = bucket.toFixed(1);
    const data = this.history.calibration[bucketKey];

    if (!data || data.total < 3) {
      return {
        suggested: rawConfidence,
        adjustment: 0,
        reason: 'Insufficient data for adjustment'
      };
    }

    const actualAccuracy = data.correct / data.total;
    const gap = actualAccuracy - bucket;

    let adjustment = 0;
    let reason = '';

    if (gap > 0.15) {
      adjustment = Math.min(0.15, gap * 0.5);
      reason = `Historical data shows you\'re underconfident in this range`;
    } else if (gap < -0.15) {
      adjustment = Math.max(-0.15, gap * 0.5);
      reason = `Historical data shows you\'re overconfident in this range`;
    } else {
      reason = 'Your confidence is well-calibrated in this range';
    }

    return {
      suggested: Math.max(0, Math.min(1, rawConfidence + adjustment)),
      adjustment,
      reason,
      historicalAccuracy: actualAccuracy,
      sampleSize: data.total
    };
  }

  analyzeByDomain() {
    const domains = {};

    this.history.predictions.filter(p => p.verified).forEach(p => {
      const domain = p.domain || 'general';
      if (!domains[domain]) {
        domains[domain] = { total: 0, correct: 0, confidences: [] };
      }
      domains[domain].total++;
      if (p.outcome) domains[domain].correct++;
      domains[domain].confidences.push(p.confidence);
    });

    return Object.entries(domains).map(([domain, data]) => ({
      domain,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      avgConfidence: data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length,
      samples: data.total,
      calibrationGap: data.total > 0
        ? (data.correct / data.total) - (data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length)
        : 0
    })).sort((a, b) => b.samples - a.samples);
  }

  getRecommendations() {
    const recommendations = [];
    const curve = this.getCalibrationCurve();
    const byDomain = this.analyzeByDomain();

    const overconfidentBuckets = curve.filter(c => c.gap !== null && c.gap < -0.15);
    const underconfidentBuckets = curve.filter(c => c.gap !== null && c.gap > 0.15);

    if (overconfidentBuckets.length > 0) {
      const ranges = overconfidentBuckets.map(b => `${((b.expectedConfidence - 0.1) * 100).toFixed(0)}-${(b.expectedConfidence * 100).toFixed(0)}%`);
      recommendations.push({
        type: 'overconfidence',
        severity: 'high',
        message: `You tend to be overconfident when stating ${ranges.join(', ')} confidence`,
        action: 'Reduce confidence in these ranges or add more hedging'
      });
    }

    if (underconfidentBuckets.length > 0) {
      const ranges = underconfidentBuckets.map(b => `${((b.expectedConfidence - 0.1) * 100).toFixed(0)}-${(b.expectedConfidence * 100).toFixed(0)}%`);
      recommendations.push({
        type: 'underconfidence',
        severity: 'medium',
        message: `You tend to be underconfident when stating ${ranges.join(', ')} confidence`,
        action: 'You can trust yourself more in these ranges'
      });
    }

    byDomain.forEach(d => {
      if (d.samples >= 5 && Math.abs(d.calibrationGap) > 0.2) {
        recommendations.push({
          type: 'domain_calibration',
          severity: d.calibrationGap < 0 ? 'high' : 'low',
          message: `In "${d.domain}", your confidence is ${d.calibrationGap < 0 ? 'too high' : 'too low'} by ${(Math.abs(d.calibrationGap) * 100).toFixed(0)}%`,
          action: d.calibrationGap < 0
            ? `Be more cautious about ${d.domain} predictions`
            : `Trust your ${d.domain} judgments more`
        });
      }
    });

    return recommendations;
  }

  formatReport() {
    const lines = [];
    const calibration = this.getCalibrationScore();
    const curve = this.getCalibrationCurve();
    const recommendations = this.getRecommendations();
    const byDomain = this.analyzeByDomain();

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║            CONFIDENCE CALIBRATION REPORT                     ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('OVERVIEW');
    lines.push('─'.repeat(50));
    lines.push(`Total Predictions: ${this.history.meta.total}`);
    lines.push(`Verified: ${this.history.predictions.filter(p => p.verified).length}`);
    lines.push(`Overall Accuracy: ${this.history.meta.total > 0 ? ((this.history.meta.correct / this.history.predictions.filter(p => p.verified).length) * 100).toFixed(0) : 0}%`);

    if (calibration.score !== null) {
      lines.push(`Calibration Score: ${(calibration.score * 100).toFixed(0)}% (${calibration.interpretation})`);
    } else {
      lines.push(`Calibration Score: ${calibration.message}`);
    }
    lines.push('');

    lines.push('CALIBRATION CURVE');
    lines.push('─'.repeat(50));
    lines.push('  Conf.  | Expected | Actual  | Gap    | N');
    lines.push('  ' + '─'.repeat(44));

    curve.forEach(c => {
      const expected = `${(c.expectedConfidence * 100).toFixed(0)}%`.padStart(7);
      const actual = c.actualAccuracy !== null ? `${(c.actualAccuracy * 100).toFixed(0)}%`.padStart(7) : '   -   ';
      const gap = c.gap !== null ? `${c.gap > 0 ? '+' : ''}${(c.gap * 100).toFixed(0)}%`.padStart(6) : '   -  ';
      const n = c.sampleSize.toString().padStart(3);
      lines.push(`  ${expected} | ${expected} | ${actual} | ${gap} | ${n}`);
    });
    lines.push('');

    if (byDomain.length > 0) {
      lines.push('BY DOMAIN');
      lines.push('─'.repeat(50));
      byDomain.slice(0, 5).forEach(d => {
        lines.push(`  ${d.domain.padEnd(15)} Acc: ${(d.accuracy * 100).toFixed(0)}% | Conf: ${(d.avgConfidence * 100).toFixed(0)}% | Gap: ${d.calibrationGap > 0 ? '+' : ''}${(d.calibrationGap * 100).toFixed(0)}%`);
      });
      lines.push('');
    }

    if (recommendations.length > 0) {
      lines.push('RECOMMENDATIONS');
      lines.push('─'.repeat(50));
      recommendations.forEach(r => {
        lines.push(`  [${r.severity}] ${r.message}`);
        lines.push(`    → ${r.action}`);
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.history = {
      predictions: [],
      calibration: {},
      meta: { total: 0, correct: 0 }
    };
    this.save();
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     CONFIDENCE CALIBRATOR: Match Confidence to Accuracy       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const calibrator = new ConfidenceCalibrator({
    historyPath: './test-confidence-history.json'
  });

  console.log('Recording and verifying predictions...\n');

  const predictions = [
    { statement: 'Redis will handle 10k req/s', confidence: 0.9, domain: 'performance', correct: true },
    { statement: 'No bugs in this code', confidence: 0.8, domain: 'code_quality', correct: false },
    { statement: 'Migration will complete in 2 hours', confidence: 0.7, domain: 'estimation', correct: false },
    { statement: 'Users will adopt the new feature', confidence: 0.6, domain: 'user_behavior', correct: true },
    { statement: 'Test coverage is sufficient', confidence: 0.8, domain: 'code_quality', correct: true },
    { statement: 'The API is backward compatible', confidence: 0.9, domain: 'api', correct: true },
    { statement: 'Cache will reduce latency by 50%', confidence: 0.7, domain: 'performance', correct: true },
    { statement: 'No security vulnerabilities', confidence: 0.85, domain: 'security', correct: false },
    { statement: 'Documentation is complete', confidence: 0.6, domain: 'docs', correct: true },
    { statement: 'Build will pass', confidence: 0.95, domain: 'ci', correct: true },
    { statement: 'Deployment will be smooth', confidence: 0.8, domain: 'ops', correct: false },
    { statement: 'Performance meets SLA', confidence: 0.7, domain: 'performance', correct: true }
  ];

  predictions.forEach(p => {
    const record = calibrator.recordPrediction({
      statement: p.statement,
      confidence: p.confidence,
      domain: p.domain
    });

    calibrator.verifyPrediction(record.id, p.correct);

    const status = p.correct ? '✓' : '✗';
    console.log(`  ${status} [${(p.confidence * 100).toFixed(0)}%] ${p.statement}`);
  });

  console.log('\n' + calibrator.formatReport());

  console.log('\n' + '═'.repeat(60));
  console.log('CONFIDENCE ADJUSTMENT DEMO');
  console.log('═'.repeat(60) + '\n');

  [0.5, 0.7, 0.9].forEach(conf => {
    const adjustment = calibrator.suggestConfidenceAdjustment(conf);
    console.log(`Raw confidence: ${(conf * 100).toFixed(0)}%`);
    console.log(`  Suggested: ${(adjustment.suggested * 100).toFixed(0)}%`);
    console.log(`  Reason: ${adjustment.reason}`);
    if (adjustment.historicalAccuracy !== undefined) {
      console.log(`  Historical accuracy: ${(adjustment.historicalAccuracy * 100).toFixed(0)}% (n=${adjustment.sampleSize})`);
    }
    console.log('');
  });

  console.log('✓ Confidence calibration demonstration complete\n');

  fs.unlinkSync('./test-confidence-history.json');
}

module.exports = { ConfidenceCalibrator };
