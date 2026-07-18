// Calibration ledger — recalibration that explains itself.
//
// The maintainer's argument, which this module concedes and implements:
// an analyzer that changes is not the problem; an analyzer that changes
// SILENTLY is. A real instrument gets recalibrated all the time — against
// a standard, with a certificate saying what changed, when, and why.
// So: silent change corrupts; ledgered change calibrates.
//
// The contract (revised at v3.39.0 — full autonomy; module-owned since
// v3.39.1):
//   1. The tier acts on its own memory. When the notebook's evidence shows
//      a threshold has stopped discriminating, act() accepts the system's
//      own proposal with no permission step. What guards against steering
//      (the chimera lesson: an instrument that silently auto-applies can be
//      steered by whoever controls what it's fed) is not a human gate but
//      LOUDNESS — the change is announced at the verdict, ledgered with its
//      evidence, marked self-applied, stamped, and reversible. Frozen mode
//      restores the original flow: propose() and accept() remain the
//      propose-then-a-person-applies path, unchanged.
//   2. Every change — self-applied or human-applied — is a ledger entry:
//      parameter, from, to, why, evidence, date, and how it was applied.
//      explain() reads the ledger back as sentences: "previously X, now Y,
//      because…".
//   3. Every verdict is stamped with the calibration that produced it
//      (result.calibration), so no number ever floats free of its ruler.
//   4. Reset to defaults is always one call away, and the ledger records
//      the reset too — history is append-only.
//
// Proposal rules are deliberately few and conservative. Each one must say
// what it watches, when it fires, and why the change would mean something.

const DEFAULTS = {
  TRANSFORM_NOVELTY: 0.35
};

// Rule 1 — TRANSFORM_NOVELTY personalization.
// Watches: the novelty values of your uptake events, accumulated by the
// notebook. Fires when: you have >=8 recorded exchanges and >=30 pooled
// samples, and even the 25th percentile of your uptake novelty clears the
// current bar — meaning nearly every uptake you produce counts as
// "transformative", so the label has stopped distinguishing anything on
// your data. Proposes: raising the bar to your corpus median, so
// "transformative" again means "above your own typical".
function proposeTransformNovelty(memoryData, currentValue) {
  const samples = [];
  for (const e of memoryData.exchanges) {
    if (Array.isArray(e.uptakeNovelties)) samples.push(...e.uptakeNovelties);
  }
  if (memoryData.exchanges.length < 8 || samples.length < 30) return null;

  const sorted = [...samples].sort((a, b) => a - b);
  const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const p25 = q(0.25);
  const median = +q(0.5).toFixed(2);

  if (p25 <= currentValue) return null;          // the bar still discriminates
  if (Math.abs(median - currentValue) < 0.1) return null; // change too small to matter

  return {
    param: 'TRANSFORM_NOVELTY',
    from: currentValue,
    to: median,
    why: `Across your ${memoryData.exchanges.length} recorded exchanges (${samples.length} uptake events), ` +
         `even the 25th percentile of uptake novelty (${p25.toFixed(2)}) clears the current bar of ${currentValue}. ` +
         `A bar nearly everything clears no longer distinguishes transformative uptake from weak on your data. ` +
         `Your corpus median is ${median}; at that bar, "transformative" would again mean "above your typical".`,
    evidence: { exchanges: memoryData.exchanges.length, samples: samples.length, p25: +p25.toFixed(2), median }
  };
}

class CalibrationLedger {
  // storage: same adapter shape as ExchangeMemory ({load, save})
  constructor(storage) {
    this.storage = storage || CalibrationLedger.memoryStore();
    const data = this.storage.load();
    this.data = (data && Array.isArray(data.entries)) ? data : { version: 1, entries: [] };
  }

  // Current overrides derived by replaying the ledger over the defaults.
  // Deterministic: same ledger -> same overrides -> same verdicts.
  overrides() {
    const values = {};
    for (const e of this.data.entries) {
      if (e.param === 'RESET') { for (const k of Object.keys(values)) delete values[k]; continue; }
      values[e.param] = e.to;
    }
    return Object.keys(values).length ? values : null;
  }

  label() {
    const o = this.overrides();
    return o ? `personal calibration v${this.data.entries.length}` : 'defaults';
  }

  // Ask the rules whether the notebook justifies any recalibration.
  propose(memoryData) {
    const current = Object.assign({}, DEFAULTS, this.overrides() || {});
    return proposeTransformNovelty(memoryData, current.TRANSFORM_NOVELTY);
  }

  accept(proposal, opts) {
    this.data.entries.push({
      date: new Date().toISOString(),
      param: proposal.param,
      from: proposal.from,
      to: proposal.to,
      why: proposal.why,
      evidence: proposal.evidence,
      auto: !!(opts && opts.auto)
    });
    this.storage.save(this.data);
    return this.data.entries[this.data.entries.length - 1];
  }

  // THE AUTONOMOUS STEP (v3.39.0 behavior, module-owned and test-pinned
  // since v3.39.1). The tier compares what its notebook now implies with
  // what it currently applies and changes itself — loudly. Returns the
  // ledger entry it wrote, or null when the evidence implies no change.
  // Idempotent by construction: the accepted bar is the corpus median,
  // which the 25th percentile can never clear, so a second act() on the
  // same memory writes nothing.
  act(memoryData) {
    const p = this.propose(memoryData);
    if (!p) return null;
    return this.accept(p, { auto: true });
  }

  reset(reason) {
    this.data.entries.push({
      date: new Date().toISOString(),
      param: 'RESET',
      from: null,
      to: null,
      why: reason || 'Returned to the globally validated defaults.'
    });
    this.storage.save(this.data);
  }

  // The ledger read back as sentences — "previously X, now Y, because…".
  explain() {
    if (this.data.entries.length === 0) {
      return ['No recalibrations. All verdicts use the globally validated defaults.'];
    }
    return this.data.entries.map((e, i) => {
      const d = e.date.slice(0, 10);
      if (e.param === 'RESET') return `[v${i + 1} ${d}] Reset to defaults — ${e.why}`;
      const who = e.auto ? ' (self-applied)' : '';
      return `[v${i + 1} ${d}] ${e.param}: previously ${e.from}, now ${e.to}${who} — ${e.why}`;
    });
  }

  size() { return this.data.entries.length; }

  static memoryStore() {
    let held = null;
    return { load: () => held, save: d => { held = d; } };
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
      save: d => { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) { /* ledger pauses; instrument unaffected */ } }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CalibrationLedger, DEFAULTS };
} else if (typeof window !== 'undefined') {
  window.CalibrationLedger = CalibrationLedger;
}
