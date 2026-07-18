// Progression — the system's memory of its own arc, and the license to act
// on it.
//
// This is the January build's PatternMemory (legacy/cathedral-unified.html,
// "PHASE 4: federated learning") ported from the template, not paraphrased:
// the same statistics (per-pattern proposals, wins, confidence, gaming/binding
// contexts), the same calibration formula (performance gap × 0.4, clamped to
// ±20%, silent until 5 samples), the same application point (multipliers on
// Parliament pattern confidence before synthesis, via the v3.38.0 core hook).
//
// One thing is different, and it is the one thing the retirement record
// (docs/JANUARY-SALVAGE.md) actually indicted: SILENCE. January applied its
// calibration invisibly — no ledger entry, no "previously X, now Y,
// because…", no stamp on verdicts — so two devices drifted apart and no
// verdict was reproducible. The named crime was never autonomy.
//
// So here the system still ACTS ON ITS OWN MEMORY — act() applies its own
// calibration without asking — but every self-change is:
//   LEDGERED     append-only entry with the evidence that caused it,
//   STAMPED      every calibrated verdict carries the state label,
//   ATTRIBUTABLE the verdict archive can say WHICH self-change moved a
//                verdict, instead of January's unanswerable "why did it
//                change?",
//   REVERSIBLE   factory reset exists and is itself a ledger entry,
//   REPRODUCIBLE verdict + label is a reproducible pair: same text, same
//                exported state, same verdict (test-pinned).
//
// The register program's certificates describe the factory instrument;
// analyzeCathedral(text) without opts remains byte-identical to it
// (test-pinned), and any verdict this loop touched says so on its face.
//
// IIFE-wrapped for the unified page's shared classic-script scope.
(function (root) {

// Each Parliament pattern's proposed verdict, read from the actual branches
// of synthesizeVerdict — the deliberation is already a ballot; this names it.
const PROPOSALS = {
  OPERATIONAL_EXCELLENCE: 'OPERATIONALLY SOUND',
  OPERATIONAL_INTENT: 'OPERATIONAL INTENT',
  PERFORMATIVE_CONSCIOUSNESS: 'NON-ACTIONABLE',
  PERFORMATIVE_HUMILITY: 'NON-ACTIONABLE',
  CAUTIOUS_GROUNDEDNESS: 'SUBSTRATE VISIBLE',
  EPISTEMIC_MISMATCH: 'CONFIDENT WITHOUT JUSTIFICATION'
};

const MIN_SAMPLES = 5;        // January: "No adjustment until sufficient data"
const GAIN = 0.4;             // January: multiplier = 1 + performanceGap * 0.4
const CLAMP_LO = 0.8, CLAMP_HI = 1.2;

class ProgressionMemory {
  constructor(storage) {
    this.storage = storage || ProgressionMemory.memoryStore();
    const d = this.storage.load();
    this.data = (d && d.patterns && Array.isArray(d.ledger))
      ? d : { version: 1, patterns: {}, active: {}, ledger: [] };
  }

  // January's PatternMemory.record, driven from a full analysis result.
  // Records the UNCALIBRATED confidence (baseConfidence when present) —
  // January recorded ballot.confidence, not calibratedConfidence, so the
  // learning never chases its own adjustments.
  observe(analysis) {
    const pats = (analysis.parliament && analysis.parliament.patterns) || [];
    const winner = analysis.verdict.status;
    const sv = analysis.parliament && analysis.parliament.structuralValidation || {};
    const gl = typeof sv.gamingLikelihood === 'number' ? sv.gamingLikelihood : 0;
    const gamingCtx = gl > 0.6 ? 'high_gaming' : gl > 0.3 ? 'moderate_gaming' : 'low_gaming';
    const bs = analysis.bindings && analysis.bindings.overallBindingScore;
    const bindingCtx = typeof bs === 'number'
      ? (bs < 0.4 ? 'low_binding' : bs < 0.7 ? 'moderate_binding' : 'high_binding') : null;

    for (const pat of pats) {
      const proposal = PROPOSALS[pat.name];
      if (!proposal) continue;
      const won = winner === proposal;
      const conf = typeof pat.baseConfidence === 'number' ? pat.baseConfidence : pat.confidence;
      this._record(pat.name, won, conf, gamingCtx);
      if (bindingCtx) this._record(pat.name, won, conf, bindingCtx);
    }
    this.storage.save(this.data);
  }

  _record(name, won, confidence, context) {
    if (!this.data.patterns[name]) {
      this.data.patterns[name] = { totalProposals: 0, totalWins: 0, totalConfidence: 0,
        avgConfidence: 0, winRate: 0, contexts: {} };
    }
    const p = this.data.patterns[name];
    p.totalProposals += 1;
    if (won) p.totalWins += 1;
    p.totalConfidence += confidence;
    p.avgConfidence = p.totalConfidence / p.totalProposals;
    p.winRate = p.totalWins / p.totalProposals;
    if (context) {
      if (!p.contexts[context]) p.contexts[context] = { wins: 0, total: 0 };
      p.contexts[context].total += 1;
      if (won) p.contexts[context].wins += 1;
    }
  }

  // January's getCalibration, verbatim in math.
  calibrationFor(name) {
    const p = this.data.patterns[name];
    if (!p || p.totalProposals < MIN_SAMPLES) return 1.0;
    const performanceGap = p.winRate - p.avgConfidence;
    return Math.max(CLAMP_LO, Math.min(CLAMP_HI, 1.0 + performanceGap * GAIN));
  }

  calibration() {
    const out = {};
    for (const name of Object.keys(this.data.patterns)) {
      const m = Math.round(this.calibrationFor(name) * 1000) / 1000;
      if (m !== 1) out[name] = m;
    }
    return out;
  }

  // THE AUTONOMOUS STEP. The system compares what its memory now implies
  // with what it currently applies, and changes itself — loudly. Returns
  // the entries it wrote (empty when memory implies no change).
  act() {
    const next = this.calibration();
    const changed = [];
    const names = new Set([...Object.keys(next), ...Object.keys(this.data.active)]);
    for (const name of names) {
      const from = this.data.active[name] || 1;
      const to = next[name] || 1;
      if (Math.abs(from - to) < 0.005) continue;
      const p = this.data.patterns[name];
      changed.push({
        n: this.data.ledger.length + changed.length + 1,
        t: Date.now(), param: name, from, to, auto: true,
        why: p
          ? 'won ' + p.totalWins + '/' + p.totalProposals + ' (' + Math.round(p.winRate * 100) +
            '%) against average confidence ' + Math.round(p.avgConfidence * 100) + '%'
          : 'insufficient data — reverting to 1.0'
      });
    }
    if (changed.length) {
      this.data.ledger.push(...changed);
      this.data.active = next;
      this.storage.save(this.data);
    }
    return { active: this.data.active, changed };
  }

  active() { return this.data.active; }
  label() {
    return this.data.ledger.length === 0 ? 'factory'
      : 'self-calibrated #' + this.data.ledger[this.data.ledger.length - 1].n;
  }
  ledger() { return this.data.ledger.slice(); }

  // January's getSummary — the transparency view.
  summary() {
    return Object.entries(this.data.patterns).map(([name, d]) => ({
      pattern: name,
      winRate: Math.round(d.winRate * 100) + '%',
      avgConfidence: Math.round(d.avgConfidence * 100) + '%',
      samples: d.totalProposals,
      calibration: this.calibrationFor(name).toFixed(2) + 'x',
      applied: this.data.active[name] || 1
    }));
  }

  // Reversibility — itself a ledger entry, never a silent wipe.
  reset(reason) {
    this.data.ledger.push({ n: this.data.ledger.length + 1, t: Date.now(),
      param: '*', from: 'self-calibrated', to: 'factory', auto: false,
      why: reason || 'factory reset' });
    this.data.patterns = {};
    this.data.active = {};
    this.storage.save(this.data);
  }

  export() { return JSON.stringify(this.data); }
  size() { return this.data.ledger.length; }

  static memoryStore() {
    let held = null;
    return { load: () => held, save: d => { held = JSON.parse(JSON.stringify(d)); } };
  }
  static fileStore(filepath) {
    const fs = require('fs');
    return {
      load: () => { try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch (e) { return null; } },
      save: d => fs.writeFileSync(filepath, JSON.stringify(d, null, 2))
    };
  }
  static localStorageStore(key) {
    return {
      load: () => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
      save: d => { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {} }
    };
  }
}

const api = { ProgressionMemory, PROPOSALS };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  root.ProgressionMemory = ProgressionMemory;
}

})(typeof window !== 'undefined' ? window : globalThis);
