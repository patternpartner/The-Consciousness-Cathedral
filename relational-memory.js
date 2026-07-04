// Exchange memory — the lab notebook for the relational instrument.
//
// The design resolves a real tension. A static analyzer learns nothing from
// what it's fed; an analyzer that silently recalibrates loses the property
// that makes its verdicts trustworthy (same input → same answer). This
// layer takes the third road, the one a scientist takes:
//
//   THE INSTRUMENT STAYS FIXED. THE NOTEBOOK ACCUMULATES.
//
// The analyzer never reads memory — memory reads the analyzer. A verdict is
// identical with or without history. What history adds is CONTEXT around
// the verdict: where this exchange sits among everything you've measured
// (percentiles), which vocabulary keeps returning across your
// conversations (your recurring lexicon), and how your verdict mix has
// looked over time. The store is plain JSON you can read, edit, or delete;
// nothing leaves the device it's on.
//
// Lineage note: the maintainer's original experimental modules
// (experimental/cross-session-memory.js, pattern-db.js) reached for
// exactly this. This is that instinct, attached to the validated core.

const MAX_ENTRIES = 500;

function summarize(result) {
  const uptakeTypes = new Set(['TRANSFORMATIVE', 'WEAK', 'SEMANTIC', 'FUNCTIONAL', 'TYPED']);
  const opp = result.uptake.length;
  const echo = result.uptake.filter(e => e.type === 'ECHO').length;
  const uptake = result.uptake.filter(e => uptakeTypes.has(e.type)).length;

  // "What this exchange was about", relationally: the anchors that actually
  // crossed between speakers (shared content in uptake events) plus any
  // round-trip terms. Derived purely from the deterministic result — this
  // is what makes recurring vocabulary across conversations visible, and it
  // is far richer than round trips alone (which are rare in short chats).
  const terms = new Set(result.coConstruction.roundTrips.map(t => t.term));
  for (const e of result.uptake) {
    if (Array.isArray(e.reused)) for (const w of e.reused) terms.add(w);
  }

  return {
    date: new Date().toISOString(),
    speakers: result.speakers.length,
    turnCount: result.turnCount,
    verdict: result.verdict.status,
    echoRate: opp > 0 ? +(echo / opp).toFixed(3) : 0,
    uptakeRate: opp > 0 ? +(uptake / opp).toFixed(3) : 0,
    roundTrips: result.coConstruction.roundTrips.length,
    terms: [...terms].slice(0, 25)
  };
}

// Percentile as "strictly below" share — deterministic given the store.
function percentile(values, x) {
  if (values.length === 0) return null;
  const below = values.filter(v => v < x).length;
  return Math.round((below / values.length) * 100);
}

class ExchangeMemory {
  // storage: { load: () => object|null, save: (object) => void }
  // Defaults to a volatile in-memory store (useful for tests).
  constructor(storage) {
    this.storage = storage || ExchangeMemory.memoryStore();
    const data = this.storage.load();
    this.data = (data && Array.isArray(data.exchanges)) ? data : { version: 1, exchanges: [] };
  }

  // Record an analyzeExchange() result into the notebook. Explicit — the
  // caller decides what history is made of. Refusal verdicts are not
  // recorded (there was no exchange to remember).
  record(result) {
    const s = result.verdict.status;
    if (s === 'OUTSIDE DESIGN SPACE' || s === 'INSUFFICIENT EXCHANGE') return null;
    const entry = summarize(result);
    this.data.exchanges.push(entry);
    if (this.data.exchanges.length > MAX_ENTRIES) {
      this.data.exchanges = this.data.exchanges.slice(-MAX_ENTRIES);
    }
    this.storage.save(this.data);
    return entry;
  }

  // Context for a result against everything recorded so far (excluding
  // the result itself if it was just recorded — pass prior=true after
  // record() to compare against history INCLUDING this entry, or compute
  // context before recording for a strict "against the past" reading).
  context(result) {
    const cur = summarize(result);
    const past = this.data.exchanges;
    const n = past.length;
    const verdictCounts = {};
    for (const e of past) verdictCounts[e.verdict] = (verdictCounts[e.verdict] || 0) + 1;

    // Terms that appear in >=2 distinct recorded exchanges — vocabulary
    // that keeps returning across conversations.
    const termSeenIn = {};
    for (const e of past) for (const t of new Set(e.terms)) termSeenIn[t] = (termSeenIn[t] || 0) + 1;
    const recurringLexicon = Object.entries(termSeenIn)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, 15)
      .map(([term, count]) => ({ term, exchanges: count }));
    const returningNow = cur.terms.filter(t => termSeenIn[t] >= 1);

    return {
      n,
      percentiles: n >= 3 ? {
        uptakeRate: percentile(past.map(e => e.uptakeRate), cur.uptakeRate),
        echoRate: percentile(past.map(e => e.echoRate), cur.echoRate),
        roundTrips: percentile(past.map(e => e.roundTrips), cur.roundTrips)
      } : null,
      verdictCounts,
      recurringLexicon,
      returningNow,
      note: 'Context only. The verdict above is identical with or without this history.'
    };
  }

  clear() {
    this.data = { version: 1, exchanges: [] };
    this.storage.save(this.data);
  }

  size() { return this.data.exchanges.length; }

  static memoryStore() {
    let held = null;
    return { load: () => held, save: d => { held = d; } };
  }

  static fileStore(filepath) {
    const fs = require('fs');
    return {
      load: () => {
        try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); }
        catch (e) { return null; }
      },
      save: d => fs.writeFileSync(filepath, JSON.stringify(d, null, 2))
    };
  }

  static localStorageStore(key) {
    return {
      load: () => {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch (e) { return null; }
      },
      save: d => { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) { /* storage full or blocked: notebook pauses, instrument unaffected */ } }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExchangeMemory, summarize };
} else if (typeof window !== 'undefined') {
  window.ExchangeMemory = ExchangeMemory;
}
