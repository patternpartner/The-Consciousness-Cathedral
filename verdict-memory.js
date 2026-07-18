// Verdict memory — the lab notebook for the OPERATIONAL instrument.
//
// Lineage: the January build (legacy/cathedral-unified.html) had three pieces
// of genuine trajectory awareness the tested line never rebuilt —
// VerdictArchive (per-text verdict history with drift detection),
// ObservatoryHistory (score volatility across analyses), and PatternMemory's
// win-rate bookkeeping. What got it retired was the wiring, not the ideas:
// PatternMemory fed its statistics BACK into Parliament votes silently, so
// two devices drifted apart and no verdict was reproducible.
//
// This module is those three ideas with the wiring reversed, under the same
// contract as relational-memory.js:
//
//   THE INSTRUMENT STAYS FIXED. THE NOTEBOOK ACCUMULATES.
//
// The analyzer never reads this memory — memory reads the analyzer
// (run-verdict-memory-tests.js pins it: a verdict is byte-identical with the
// notebook empty or full). What memory adds is CONTEXT around a verdict:
//
//  - DRIFT: you analyzed this exact text before and the verdict changed.
//    Because the analyzer is deterministic, a changed verdict for an
//    identical text can mean only one thing — the INSTRUMENT changed
//    between analyses. January invented this check; the tested line went
//    seven months without it, and the README's own front-page example
//    drifted unnoticed in exactly the way this detects (v3.36.0).
//  - VOLATILITY: whether your recent analyses' scores are swinging or
//    stable (ObservatoryHistory's idea, computed strictly for display).
//  - PATTERN EVIDENCE: which Parliament patterns fire and with what
//    verdicts — the raw material PatternMemory auto-applied. Here it is
//    evidence for a human reading the ledger room, never a weight.
//
// The store is plain JSON on the device; nothing leaves the page.
//
// Wrapped in an IIFE deliberately: the unified page inlines every module as
// a classic script in one shared global scope, and top-level declarations
// here (MAX_ENTRIES, summarize) would collide with relational-memory.js —
// the exact class of silent cross-module interference this repo exists to
// prevent.
(function (root) {

const MAX_ENTRIES = 200;

// January's text hash, ported verbatim in spirit: stable, fast, good enough
// to recognize "the same text again" without storing the text itself.
function hashText(text) {
  let hash = 0;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return 'h' + (hash >>> 0).toString(36) + ':' + s.length;
}

function summarize(text, analysis) {
  return {
    hash: hashText(text),
    status: analysis.verdict.status,
    confidence: typeof analysis.verdict.confidence === 'number'
      ? Math.round(analysis.verdict.confidence * 1000) / 1000 : null,
    observatoryScore: analysis.observatory && typeof analysis.observatory.score === 'number'
      ? Math.round(analysis.observatory.score * 1000) / 1000 : null,
    gaming: analysis.gamingDetection ? analysis.gamingDetection.assessment : null,
    cal: analysis.verdict.calibrationLabel || 'factory',
    patterns: (analysis.parliament && analysis.parliament.patterns || [])
      .map(p => p.name).filter(Boolean),
    t: Date.now()
  };
}

class VerdictMemory {
  constructor(storage) {
    this.storage = storage || VerdictMemory.memoryStore();
    const data = this.storage.load();
    this.data = (data && Array.isArray(data.verdicts)) ? data : { version: 1, verdicts: [] };
  }

  // Context strictly against the PAST — call before record(), like the
  // relational notebook. Never consulted by the analyzer.
  context(text, analysis) {
    const hash = hashText(text);
    const prior = this.data.verdicts;
    const sameText = prior.filter(v => v.hash === hash);
    const out = { n: prior.length, seenBefore: sameText.length, drift: null, volatility: null, trajectory: [] };

    if (sameText.length > 0) {
      const last = sameText[sameText.length - 1];
      const statusChanged = last.status !== analysis.verdict.status;
      const confNow = typeof analysis.verdict.confidence === 'number' ? analysis.verdict.confidence : null;
      const confShift = (confNow !== null && last.confidence !== null)
        ? Math.round((confNow - last.confidence) * 1000) / 1000 : null;
      out.drift = {
        drifted: statusChanged || (confShift !== null && Math.abs(confShift) > 0.3),
        statusChanged,
        previousStatus: last.status,
        previousConfidence: last.confidence,
        confidenceShift: confShift,
        lastSeen: last.t,
        // The deterministic core makes this inference exact: same bytes in,
        // different verdict out ⇒ the instrument changed between the runs.
        // With the progression loop live there are two attributable causes,
        // and the calibration stamp tells them apart — the question January
        // could never answer ("why did the verdict change?") now has an
        // address.
        meaning: statusChanged
          ? (((last.cal || 'factory') !== (analysis.verdict.calibrationLabel || 'factory'))
              ? 'Identical text, different verdict — the system recalibrated itself between these runs (' +
                (last.cal || 'factory') + ' → ' + (analysis.verdict.calibrationLabel || 'factory') +
                '); the progression ledger has the entry.'
              : 'Identical text, different verdict — the instrument changed between these analyses.')
          : null
      };
    }

    // Volatility over the recent score trail (ObservatoryHistory's check).
    const recent = prior.slice(-10).map(v => v.observatoryScore).filter(s => s !== null);
    if (recent.length >= 3) {
      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      const sd = Math.sqrt(recent.reduce((a, b) => a + (b - mean) * (b - mean), 0) / recent.length);
      out.volatility = { sd: Math.round(sd * 1000) / 1000, assessment: sd > 0.2 ? 'VOLATILE' : 'STABLE', n: recent.length };
    }
    out.trajectory = prior.slice(-20).map(v => ({ status: v.status, confidence: v.confidence, t: v.t }));
    return out;
  }

  record(text, analysis) {
    const entry = summarize(text, analysis);
    this.data.verdicts.push(entry);
    if (this.data.verdicts.length > MAX_ENTRIES) {
      this.data.verdicts = this.data.verdicts.slice(-MAX_ENTRIES);
    }
    this.storage.save(this.data);
    return entry;
  }

  // Evidence tables for the ledger room — PatternMemory's bookkeeping as
  // display. No weight is derived from this anywhere; the core exposes no
  // calibration hooks, and that is a feature: changing the operational
  // instrument goes through source + the regression suite, not a notebook.
  stats() {
    const verdicts = {};
    const patterns = {};
    for (const v of this.data.verdicts) {
      verdicts[v.status] = (verdicts[v.status] || 0) + 1;
      for (const p of v.patterns) {
        if (!patterns[p]) patterns[p] = { fired: 0, withVerdict: {} };
        patterns[p].fired++;
        patterns[p].withVerdict[v.status] = (patterns[p].withVerdict[v.status] || 0) + 1;
      }
    }
    return { n: this.data.verdicts.length, verdicts, patterns };
  }

  size() { return this.data.verdicts.length; }
  clear() { this.data = { version: 1, verdicts: [] }; this.storage.save(this.data); }

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

const VerdictMemoryModule = { VerdictMemory, hashText, summarize };

// Node module and browser global from the same file, matching the other
// modules — cathedral-unified-2.html loads this script directly.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VerdictMemoryModule;
} else {
  root.VerdictMemory = VerdictMemory;
}

})(typeof window !== 'undefined' ? window : globalThis);
