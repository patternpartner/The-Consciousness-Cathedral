// Progression — bounded runtime self-calibration for the operational tier.
//
// Scale, stated plainly: this is a confidence-weight multiplier clamped to
// ±20%. "Acts on its own" below means "applied automatically without a
// confirmation dialog" — not agency. The value of the module is not the
// adjustment (which is small and, on real data, nearly inert — see
// docs/AUTONOMY-PROGRAM.md) but the audit trail around it.
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
// Frozen mode (v3.39.2) gates self-change, never learning: observe() keeps
// accumulating (observation is not self-change — test-pinned), pending()
// previews exactly what act() would commit, and applyImplied() is the same
// change applied by a person, marked human-applied. The applied state is
// the ledgered instrument either way; returning to factory is a ledgered
// reset, never a switch side-effect.
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

// Sample-interval hysteresis (v3.43.0). January gates a pattern's FIRST
// calibration on MIN_SAMPLES; this gates each RE-calibration on another
// MIN_SAMPLES of fresh evidence for that pattern — symmetric re-eligibility.
// It changes WHEN a computed multiplier commits, never WHAT the value is
// (calibrationFor is untouched): between commits the applied multiplier holds,
// so a running win-rate's per-document jitter stops writing partly-revoking
// ledger entries, while a sustained drift still commits at the next interval.
// Chosen a priori, NOT tuned to any corpus (docs/AUTONOMY-CHATTER-PREREG.md).
const HYSTERESIS_INTERVAL = MIN_SAMPLES;

class ProgressionMemory {
  constructor(storage) {
    this.storage = storage || ProgressionMemory.memoryStore();
    const d = this.storage.load();
    this.data = (d && d.patterns && Array.isArray(d.ledger))
      ? d : { version: 1, patterns: {}, active: {}, ledger: [] };
    // Back-compatible: stored state from before v3.43.0 has no lastAct.
    if (!this.data.lastAct) this.data.lastAct = {};
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

  // What the memory now implies but the applied state doesn't yet reflect —
  // the exact diff act() would commit, previewable without committing
  // anything. This is the frozen-mode proposal: same numbers, same evidence
  // sentences, no writes. The hysteresis gate is evaluated here too, so a
  // preview never shows a change the commit would hold back.
  pending() { return this._implied().changed; }

  // The shared computation behind pending() and _commit(): the gated diff,
  // the active map it would produce, and the hysteresis marks it would set.
  // Pure — it writes nothing, so previewing costs the ledger nothing.
  _implied() {
    const next = this.calibration();
    const changed = [];
    const newActive = Object.assign({}, this.data.active);
    const lastAct = {};
    const names = new Set([...Object.keys(next), ...Object.keys(this.data.active)]);
    for (const name of names) {
      const from = this.data.active[name] || 1;
      const to = next[name] || 1;
      if (Math.abs(from - to) < 0.005) continue;
      // Hysteresis: a pattern needs HYSTERESIS_INTERVAL fresh samples since its
      // last commit before it may commit again. The value committed is still
      // the exact current target (next[name]) — only the timing is gated.
      const p = this.data.patterns[name];
      const samples = (p && p.totalProposals) || 0;
      if (samples - (this.data.lastAct[name] || 0) < HYSTERESIS_INTERVAL) continue;
      changed.push({
        param: name, from, to,
        why: p
          ? 'won ' + p.totalWins + '/' + p.totalProposals + ' (' + Math.round(p.winRate * 100) +
            '%) against average confidence ' + Math.round(p.avgConfidence * 100) + '%'
          : 'insufficient data — reverting to 1.0'
      });
      if (to === 1) delete newActive[name]; else newActive[name] = to;
      lastAct[name] = samples;
    }
    return { changed, newActive, lastAct };
  }

  // The single commit path behind both the autonomous and the human-applied
  // step. `validator` is the exogenous check (Decision 3): a function the
  // loop does not own, called with the candidate active map before it is
  // applied. If the validator refuses — e.g. the anchor's pinned verdicts
  // would flip — the change is NOT applied, and the refusal itself becomes
  // an append-only ledger entry carrying the evidence. No human in the loop
  // either way; the difference is a standard the loop cannot author. It
  // gates applyImplied() too: the anchor pins verdicts against the
  // instrument, so who applies a change cannot change what it would break.
  //
  // The candidate checked is the hysteresis-gated map that would actually
  // be applied (_implied().newActive), not the raw target — the anchor must
  // judge the instrument the system would really run.
  _commit(auto, validator) {
    const implied = this._implied();
    if (!implied.changed.length) {
      return { active: this.data.active, changed: [], rejected: null };
    }

    if (typeof validator === 'function') {
      let check;
      try { check = validator(implied.newActive); }
      catch (e) { check = { ok: false, failures: [{ name: 'validator error', expected: '—', got: e.message }] }; }
      if (!check.ok) {
        const rejection = {
          n: this.data.ledger.length + 1, t: Date.now(), param: '*',
          from: 'candidate', to: 'rejected', auto, rejected: true,
          candidate: implied.newActive,
          why: 'self-recalibration rejected by the anchor: ' +
            (check.failures || []).map(f => '"' + f.name + '" would read ' + f.got +
              ' (pinned: ' + f.expected + ')').join('; ') + ' — change not applied'
        };
        this.data.ledger.push(rejection);
        this.storage.save(this.data);
        return { active: this.data.active, changed: [], rejected: rejection };
      }
    }

    const changed = implied.changed.map((c, i) => ({
      n: this.data.ledger.length + i + 1,
      t: Date.now(), param: c.param, from: c.from, to: c.to, auto,
      why: c.why
    }));
    this.data.ledger.push(...changed);
    this.data.active = implied.newActive;
    Object.assign(this.data.lastAct, implied.lastAct);
    this.storage.save(this.data);
    return { active: this.data.active, changed, rejected: null };
  }

  // THE AUTONOMOUS STEP. The system compares what its memory now implies
  // with what it currently applies, and changes itself — loudly. Returns
  // the entries it wrote (empty when memory implies no change).
  act(validator) { return this._commit(true, validator); }

  // THE FROZEN-MODE STEP (v3.39.2). The same change, applied by a person:
  // frozen mode gates self-change, it does not disable learning — the
  // memory keeps implying, pending() shows the implication with its
  // evidence, and this commits it with the entry marked human-applied
  // (auto: false). Identical end state to act() on the same memory.
  applyImplied(validator) { return this._commit(false, validator); }

  active() { return this.data.active; }
  // The stamp says who applied the state it describes: "self-calibrated"
  // only when the system did it (auto), "calibrated" when a person did.
  label() {
    // A rejection and a ledgered reset are both ledger entries that leave
    // nothing self-applied, so the stamp is read back from the last entry
    // that actually changed the instrument — and it names who applied it.
    if (Object.keys(this.data.active).length === 0) return 'factory';
    for (let i = this.data.ledger.length - 1; i >= 0; i--) {
      const e = this.data.ledger[i];
      if (e.rejected || e.param === '*') continue;
      return (e.auto ? 'self-calibrated #' : 'calibrated #') + e.n;
    }
    return 'factory';
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
    this.data.lastAct = {};
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

const api = { ProgressionMemory, PROPOSALS, HYSTERESIS_INTERVAL };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  root.ProgressionMemory = ProgressionMemory;
}

})(typeof window !== 'undefined' ? window : globalThis);
