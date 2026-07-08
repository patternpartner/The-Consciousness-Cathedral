// Relational Cathedral — Tier R1: Structural analysis of dialogue transcripts.
//
// Where cathedral-core.js measures binding structure inside one text
// (threshold→action), this module measures binding structure BETWEEN
// participants in an exchange (introduction→uptake→return).
//
// Claim:      measures interaction structure in dialogue transcripts.
// Non-claim:  does not measure consciousness, understanding, or experience.
//             A high verdict means the transcript exhibits relational
//             structure; it says nothing about what, if anything, the
//             exchange was like for its participants.
//
// Design principle (inherited from the core): never trust surface markers,
// verify structure. Verbatim echo is surface; transformative uptake —
// an anchor from the other speaker embedded in substantially novel
// material — is structure. See docs/RELATIONAL-PROGRAM.md.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'if', 'then', 'than', 'that',
  'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'am', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can',
  'could', 'should', 'shall', 'may', 'might', 'must', 'not', 'no', 'yes',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'us', 'them', 'him',
  'her', 'my', 'your', 'our', 'their', 'his', 'its', 'mine', 'yours', 'ours',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'as', 'into',
  'about', 'over', 'under', 'through', 'between', 'out', 'up', 'down', 'off',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'there', 'here', 'all', 'any', 'some', 'each', 'both', 'more', 'most',
  'other', 'such', 'own', 'same', 'just', 'very', 'too', 'also', 'only',
  'because', 'while', 'though', 'although', 'get', 'got', 'like', 'one',
  'kind', 'sort', 'thing', 'things', 'way', 'well', 'right', 'really',
  'maybe', 'think', 'know', 'mean', 'say', 'said', 'see', 'keep', 'need',
  'want', 'make', 'makes', 'made', 'let', 'lets', 'dont', 'doesnt', 'isnt',
  'wont', 'cant', 'im', 'youre', 'weve', 'ive', 'thats', 'whats', 'theres'
]);

const TurnParser = {
  // Accepts either an array of {speaker, text} turns or a transcript string
  // with "Name: text" lines (continuation lines append to the current turn).
  parse: function (input) {
    if (Array.isArray(input)) {
      return input.map(t => ({ speaker: String(t.speaker), text: String(t.text) }));
    }
    const turns = [];
    const lines = String(input).split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z][\w .'-]{0,30}):\s+(.*)$/);
      if (m) {
        turns.push({ speaker: m[1].trim(), text: m[2] });
      } else if (turns.length > 0 && line.trim() !== '') {
        turns[turns.length - 1].text += ' ' + line.trim();
      }
    }
    return turns;
  }
};

// Conservative suffix-stripping so "deployments"/"deploying"/"deployed"
// anchor-match. Deliberately approximate and documented as such — a wrong
// merge costs one noisy anchor; a missed merge costs one missed anchor.
function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') &&
           !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) {
    w = w.slice(0, -1);
  }
  if (w.length > 3 && w[w.length - 1] === w[w.length - 2]) w = w.slice(0, -1);
  return w;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/'/g, '')
    .replace(/[^a-z0-9%.\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^[.-]+|[.-]+$/g, ''))
    .filter(w => w.length > 0);
}

function contentWords(tokens) {
  return tokens.filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

// Longest run of consecutive shared tokens between two token arrays.
function longestCommonRun(a, b) {
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0; // prev[j-1] before this row overwrote it
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      if (a[i - 1] === b[j - 1]) {
        prev[j] = diagonal + 1;
        if (prev[j] > best) best = prev[j];
      } else {
        prev[j] = 0;
      }
      diagonal = tmp;
    }
  }
  return best;
}

const AnchorExtractor = {
  // opts.stemming (default true) merges inflected forms into one anchor;
  // `display` maps each stem back to the first surface form encountered,
  // so reports stay readable.
  annotate: function (turns, opts = {}) {
    const useStems = opts.stemming !== false;
    const display = new Map();
    const annotated = turns.map((t, index) => {
      const tokens = tokenize(t.text);
      const surface = contentWords(tokens);
      const content = surface.map(w => {
        const s = useStems ? stem(w) : w;
        if (!display.has(s)) display.set(s, w);
        return s;
      });
      return {
        index,
        speaker: t.speaker,
        text: t.text,
        tokens,
        content,
        contentSet: new Set(content),
        isQuestion: /\?/.test(t.text)
      };
    });
    return { annotated, display };
  }
};

// Functional uptake: adjacency pairs (Schegloff & Sacks). A reply can take
// up the prior turn by performing its typed second half — accepting a
// proposal, declining a request — with zero lexical overlap.
//
// Calibrated from data, not intuition (validation/r2-ablation.js): the
// first version also matched generic response openers (bare yes/no/sure)
// and a YESNO→POLARITY pair. The shuffle controls showed those fire at
// base rate on Frankenstein dialogue — PROPOSAL→generic-acceptance ran
// 14:15 real-to-shuffled, i.e. pure noise — so they were cut. What
// remains are the distinctive idioms, which run ~5:1 or better. Bare
// unanchored answers ("Yes.") are a known, accepted miss: anchored
// answers to questions are already caught by the lexical path.
const AdjacencyPairs = {
  firstPart: [
    { type: 'PROPOSAL', re: /\b(how about|what about|shall we|let'?s |would you like to|do you want to|why don'?t (we|you)|fancy going|care to join)\b/i },
    { type: 'OFFER', re: /\b(would you like|can i (get|bring|offer|help)|do you need|shall i)\b/i },
    { type: 'REQUEST', re: /\b(can you|could you|would you mind|will you)\b/i }
  ],
  // Rejection is tested first: "I'd love to, but…" must not match the
  // acceptance idiom it starts with.
  secondPart: [
    { type: 'REJECTION', re: /^\s*\W*(sorry|i can'?t\b|i cannot|i'?m afraid|unfortunately|i'?d rather not|thanks,? but|i wish i could)|(\btempting\b[^.!?]*\bbut\b)|(\bi'?d love to\b[^.!?]*\bbut\b)|(\bwish i could\b)/i },
    { type: 'ACCEPTANCE', re: /^\s*\W*(sounds? (good|great|perfect|fun|wonderful|tempting)|good idea|great idea|i'?d love to|all right|alright|no problem|why not|gladly|with pleasure|deal\b|count me in|i'?m in\b|let'?s do it|happy to)\b/i }
  ],

  detect: function (prevText, curText) {
    for (const fpp of this.firstPart) {
      if (!fpp.re.test(prevText)) continue;
      for (const spp of this.secondPart) {
        if (spp.re.test(curText)) {
          return { pair: `${fpp.type}→${spp.type}` };
        }
      }
    }
    return null;
  }
};

// Semantic lexicon for R2-proper: word → neighbors, distilled offline from
// PPMI co-occurrence vectors over a training corpus disjoint from all
// evaluation data (validation/build-vectors.js). Loading it is a file read;
// using it is a lookup — determinism intact. Tests can inject a lexicon via
// opts.semanticLexicon instead.
const SemanticLexicon = {
  _cache: undefined,

  load: function () {
    if (this._cache !== undefined) return this._cache;
    try {
      const fs = require('fs');
      const path = require('path');
      const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'semantic-neighbors.json'), 'utf8'));
      this._cache = this.fromNeighborTable(raw.neighbors);
    } catch (e) {
      this._cache = null; // lexicon file absent: semantic channel unavailable
    }
    return this._cache;
  },

  fromNeighborTable: function (table) {
    const m = new Map();
    for (const [w, list] of Object.entries(table)) {
      m.set(w, new Set(list.map(x => Array.isArray(x) ? x[0] : x)));
    }
    return m;
  },

  related: function (lex, a, b) {
    const na = lex.get(a);
    if (na && na.has(b)) return true;
    const nb = lex.get(b);
    return !!(nb && nb.has(a));
  }
};

// Typed question-answer slots (R2-structural, first slice): a wh-question
// opens a TYPED slot — "when" demands a time, "how many" a quantity,
// "who" a person — and a reply filling the right type is structural
// uptake with zero lexical overlap ("When does the train leave?" →
// "Half past six."). Unlike acceptance markers (killed at base rate) and
// distributional neighbors (killed by the topic chimera), typed
// expressions are rare as turn content, so the conditional lift has a
// chance to clear the precision gate. The gate decides, as always.
const TypedAnswers = {
  // Active pairs: only those that individually cleared the per-pair gate
  // (pooled >=5 real events, >3x shuffle, > chimera — validation/r2c-typed.js).
  // Attempted and REJECTED by their own gates (slice 2, kept for the record):
  //   WHERE→PLACE  — 3 real vs 2 shuffled vs 2 chimera: place expressions
  //                  sit at base rate; the pair detects nothing
  //   WHY→REASON   — 9 vs 3 vs 3: exactly 3.0x, gate requires >3x; "because"
  //                  is base-rate furniture in casual speech
  // HOWMANY→QUANTITY is evidence-thin (4 pooled events) and retained on the
  // slice-1 channel-level verdict; flagged for review as corpora grow.
  questionTypes: [
    { type: 'WHEN', re: /\b(when|what time|how soon)\b[^.!?]*\?/i },
    { type: 'HOWMANY', re: /\bhow (many|much)\b[^.!?]*\?/i },
    { type: 'WHO', re: /\bwho(m|se)?\b[^.!?]*\?/i }
  ],

  TIME_RE: /\b(\d{1,2}[:.]\d{2}|\d{1,2}\s*(a\.?m\.?|p\.?m\.?|o'?clock)|(half|quarter) (past|to)\s+\w+|(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+o'?clock|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december|tomorrow|tonight|yesterday|noon|midnight|weekend|next (week|month|year)|in (a|an|\d+) (minute|hour|day|week|month|year)s?|\d+\s*(minutes?|hours?|days?|weeks?|months?|years?))\b/i,
  QTY_RE: /\b(\d+([.,]\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|dozen|a couple|a few|several|half|none)\b/i,
  KIN_RE: /\b(my|your|his|her|our|their) (brother|sister|mother|father|mom|dad|parents|friend|boss|wife|husband|son|daughter|colleague|neighbor|cousin|uncle|aunt|teacher|manager)\b/i,
  // Place: preposition + a concrete place noun, or preposition + capitalized
  // token (proper place name). Bare "at home / in there" style words are
  // included; the gate decides if the base rate kills them.
  PLACE_RE: /\b(in|at|on|near|inside|outside|behind|opposite|around) (the |a |an )?(station|airport|office|school|university|restaurant|cafe|park|hotel|hospital|bank|store|shop|mall|library|gym|church|cinema|theater|museum|beach|corner|street|downtown|kitchen|garden|garage|basement|lobby)\b|\b(at home|upstairs|downstairs|next door|across the (street|road|hall))\b|\b(in|at|near|to) [A-Z][a-z]{2,}/,
  REASON_RE: /\b(because|since (i|you|we|they|he|she|it|the|my|your)|so that|in order to|that'?s why|the reason)\b/i,

  hasPersonExpression: function (text) {
    if (this.KIN_RE.test(text)) return true;
    // A capitalized word that is not sentence-initial and not "I" reads
    // as a name, approximately.
    const parts = text.split(/[.!?]\s+/);
    for (const sentence of parts) {
      const words = sentence.trim().split(/\s+/);
      for (let i = 1; i < words.length; i++) {
        if (/^[A-Z][a-z]{2,}$/.test(words[i].replace(/[^\w]/g, ''))) return true;
      }
    }
    return false;
  },

  detect: function (prevText, curText) {
    if (!/\?/.test(prevText)) return null;
    for (const q of this.questionTypes) {
      if (!q.re.test(prevText)) continue;
      if (q.type === 'WHEN' && this.TIME_RE.test(curText)) return { pair: 'WHEN→TIME' };
      if (q.type === 'HOWMANY' && this.QTY_RE.test(curText)) return { pair: 'HOWMANY→QUANTITY' };
      if (q.type === 'WHO' && this.hasPersonExpression(curText)) return { pair: 'WHO→PERSON' };
    }
    return null;
  }
};

// Uptake: does a turn take up anchors from the *other speaker's* prior turn,
// and does it transform them (embed them in novel material) or merely echo?
const UptakeBinder = {
  ECHO_RUN: 6,        // >=6 consecutive shared tokens is verbatim copying
  ECHO_COVERAGE: 0.7, // reused anchors covering >70% of the reply's content
  ECHO_NOVELTY: 0.3,  //   ...with under 30% novel material, is echo too
  TRANSFORM_NOVELTY: 0.35,

  // opts.functionalUptake is OFF by default: the ablation
  // (validation/r2-ablation.js) showed surface-pattern adjacency pairs
  // cannot clear the precision gate on external corpora — generic
  // response openers fire at base rate on shuffled controls, and the
  // distinctive idioms that survive calibration are too rare to matter.
  // The feature is retained opt-in for future work; the honest path to
  // semantic uptake is distributional, not lexical. See
  // docs/R2-SEMANTIC-UPTAKE.md.
  // In a dyad, uptake is checked against the adjacent turn only — exactly
  // the behavior all archived validation runs measured. With 3+ speakers,
  // a reply can answer someone two turns back, so each turn is checked
  // against the nearest prior turn of each OTHER speaker within a
  // 3-turn window (R3).
  MULTIPARTY_WINDOW: 3,

  analyze: function (annotated, opts = {}) {
    // Calibratable thresholds. Defaults are the globally validated values;
    // opts.calibration may override them — but only ever explicitly, and
    // callers are expected to stamp results with where the calibration
    // came from (see analyzeExchange). Silent change corrupts; ledgered
    // change calibrates.
    const cal = Object.assign({
      ECHO_RUN: this.ECHO_RUN,
      ECHO_COVERAGE: this.ECHO_COVERAGE,
      ECHO_NOVELTY: this.ECHO_NOVELTY,
      TRANSFORM_NOVELTY: this.TRANSFORM_NOVELTY
    }, opts.calibration || {});
    const useFunctional = opts.functionalUptake === true;
    const useSemantic = opts.semanticUptake === true;
    const lexicon = useSemantic
      ? (opts.semanticLexicon ? SemanticLexicon.fromNeighborTable(opts.semanticLexicon) : SemanticLexicon.load())
      : null;
    const multiParty = new Set(annotated.map(t => t.speaker)).size > 2;
    const events = [];
    const seenBefore = new Set(); // all content words in turns 0..i-1
    const noveltyOf = [];

    for (let i = 0; i < annotated.length; i++) {
      const cur = annotated[i];
      const novel = cur.content.filter(w => !seenBefore.has(w));
      noveltyOf[i] = cur.content.length > 0 ? novel.length / cur.content.length : 0;

      const candidates = [];
      if (!multiParty) {
        if (i > 0 && annotated[i - 1].speaker !== cur.speaker) candidates.push(annotated[i - 1]);
      } else {
        const covered = new Set();
        for (let j = i - 1; j >= Math.max(0, i - this.MULTIPARTY_WINDOW); j--) {
          const p = annotated[j];
          if (p.speaker === cur.speaker || covered.has(p.speaker)) continue;
          covered.add(p.speaker);
          candidates.push(p);
        }
      }

      for (const prev of candidates) {
        {
          const reused = [...prev.contentSet].filter(w => cur.contentSet.has(w));
          const coverage = cur.content.length > 0 ? reused.length / cur.content.length : 0;
          const run = longestCommonRun(prev.tokens, cur.tokens);

          let type = 'NONE';
          let pair = null;
          let semanticPairs = [];
          if (run >= cal.ECHO_RUN ||
              (coverage >= cal.ECHO_COVERAGE && noveltyOf[i] < cal.ECHO_NOVELTY)) {
            type = 'ECHO';
          } else if (reused.length >= 2 ||
                     (reused.length >= 1 && prev.isQuestion)) {
            type = noveltyOf[i] >= cal.TRANSFORM_NOVELTY ? 'TRANSFORMATIVE' : 'WEAK';
          } else {
            if (lexicon) {
              // Semantic reuse: an anchor from the prior turn engaged
              // through a distributional neighbor rather than repeated.
              for (const a of prev.contentSet) {
                if (cur.contentSet.has(a)) continue;
                for (const w of cur.contentSet) {
                  if (prev.contentSet.has(w)) continue;
                  if (SemanticLexicon.related(lexicon, a, w)) semanticPairs.push([a, w]);
                }
              }
              const combined = reused.length + semanticPairs.length;
              if (semanticPairs.length >= 1 &&
                  (combined >= 2 || prev.isQuestion)) {
                type = 'SEMANTIC';
              }
            }
            // Default-on: cleared all three gates including the chimera
            // acid test (validation/r2c-typed.js) — 16:1 over shuffle,
            // 2.3:1 over chimera on human dialogue. opts.typedAnswers:
            // false ablates.
            if (type === 'NONE' && opts.typedAnswers !== false) {
              const match = TypedAnswers.detect(prev.text, cur.text);
              if (match) {
                type = 'TYPED';
                pair = match.pair;
              }
            }
            if (type === 'NONE' && useFunctional) {
              const match = AdjacencyPairs.detect(prev.text, cur.text);
              if (match) {
                type = 'FUNCTIONAL';
                pair = match.pair;
              }
            }
          }

          events.push({
            pair,
            semanticPairs,
            from: prev.index,
            to: cur.index,
            direction: `${prev.speaker}→${cur.speaker}`,
            responder: cur.speaker,
            type,
            reused,
            coverage: Number(coverage.toFixed(2)),
            novelty: Number(noveltyOf[i].toFixed(2)),
            longestRun: run,
            answersQuestion: prev.isQuestion && reused.length >= 1,
            adjacent: prev.index === cur.index - 1
          });
        }
      }
      cur.content.forEach(w => seenBefore.add(w));
    }
    return events;
  }
};

// Co-construction: vocabulary that makes a round trip — introduced by one
// speaker, adopted by another, then returned to by the originator. A term
// that survives that circuit belongs to the exchange, not to either party.
const CoConstructionDetector = {
  analyze: function (annotated) {
    const firstUse = new Map(); // word -> {speaker, index}
    const usesByWord = new Map(); // word -> [{speaker, index}]

    for (const turn of annotated) {
      for (const w of turn.contentSet) {
        if (!firstUse.has(w)) firstUse.set(w, { speaker: turn.speaker, index: turn.index });
        if (!usesByWord.has(w)) usesByWord.set(w, []);
        usesByWord.get(w).push({ speaker: turn.speaker, index: turn.index });
      }
    }

    const roundTrips = [];
    for (const [word, uses] of usesByWord) {
      const origin = firstUse.get(word);
      const adopted = uses.find(u => u.speaker !== origin.speaker && u.index > origin.index);
      if (!adopted) continue;
      const returned = uses.find(u => u.speaker === origin.speaker && u.index > adopted.index);
      if (returned) {
        roundTrips.push({
          term: (this._display && this._display.get(word)) || word,
          introducedBy: origin.speaker,
          atTurn: origin.index,
          adoptedBy: adopted.speaker,
          adoptedAtTurn: adopted.index,
          returnedAtTurn: returned.index
        });
      }
    }

    // Cross-pollinated pairs: two terms introduced by *different* speakers
    // later appearing adjacent in one turn — a combination neither party
    // brought in alone.
    const crossPollinations = [];
    for (const turn of annotated) {
      const c = turn.content;
      for (let k = 0; k + 1 < c.length; k++) {
        const f1 = firstUse.get(c[k]);
        const f2 = firstUse.get(c[k + 1]);
        if (f1 && f2 && f1.speaker !== f2.speaker &&
            f1.index < turn.index && f2.index < turn.index && c[k] !== c[k + 1]) {
          crossPollinations.push({
            pair: `${c[k]} ${c[k + 1]}`,
            atTurn: turn.index,
            origins: { [c[k]]: f1.speaker, [c[k + 1]]: f2.speaker }
          });
        }
      }
    }

    return { roundTrips, crossPollinations };
  }
};

// Convergence: are the participants' vocabularies moving toward each other
// across the exchange, or past each other?
const ConvergenceTracker = {
  analyze: function (annotated, speakers) {
    if (speakers.length !== 2 || annotated.length < 4) {
      return { measurable: false, trend: 'UNMEASURED' };
    }
    const half = Math.floor(annotated.length / 2);
    const vocab = (turnSlice, speaker) => {
      const s = new Set();
      turnSlice.filter(t => t.speaker === speaker).forEach(t => t.content.forEach(w => s.add(w)));
      return s;
    };
    const jaccard = (x, y) => {
      if (x.size === 0 || y.size === 0) return 0;
      let inter = 0;
      for (const w of x) if (y.has(w)) inter++;
      return inter / (x.size + y.size - inter);
    };
    const [a, b] = speakers;
    const firstHalf = jaccard(vocab(annotated.slice(0, half), a), vocab(annotated.slice(0, half), b));
    const secondHalf = jaccard(vocab(annotated.slice(half), a), vocab(annotated.slice(half), b));
    const delta = secondHalf - firstHalf;
    return {
      measurable: true,
      firstHalfOverlap: Number(firstHalf.toFixed(3)),
      secondHalfOverlap: Number(secondHalf.toFixed(3)),
      delta: Number(delta.toFixed(3)),
      trend: delta > 0.05 ? 'CONVERGING' : delta < -0.05 ? 'DIVERGING' : 'FLAT'
    };
  }
};

// Asymmetry: is the relational structure mutual, or is one participant doing
// all the work? This is aimed directly at the mirror problem — a good mirror
// produces high uptake in one direction and introduces nothing that returns.
const AsymmetryAnalyzer = {
  analyze: function (annotated, uptakeEvents, coConstruction, speakers) {
    const perSpeaker = {};
    for (const s of speakers) {
      perSpeaker[s] = {
        turns: annotated.filter(t => t.speaker === s).length,
        uptakesPerformed: uptakeEvents.filter(e => e.responder === s && (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK' || e.type === 'SEMANTIC' || e.type === 'FUNCTIONAL' || e.type === 'TYPED')).length,
        echoesPerformed: uptakeEvents.filter(e => e.responder === s && e.type === 'ECHO').length,
        productiveIntroductions: coConstruction.roundTrips.filter(r => r.introducedBy === s).length
      };
    }
    const intro = speakers.map(s => perSpeaker[s].productiveIntroductions);
    const maxIntro = Math.max(...intro, 0);
    const minIntro = Math.min(...intro);
    return {
      perSpeaker,
      introductionBalance: maxIntro > 0 ? Number((minIntro / maxIntro).toFixed(2)) : 0,
      mutual: speakers.every(s => perSpeaker[s].uptakesPerformed >= 1)
    };
  }
};

// Group structure (R3): with 3+ speakers, uptake becomes a directed graph —
// who takes up whom. From it: engagement (who participates in any binding),
// pair coverage (which speaker pairs ever touch), and hub share (how much
// of the graph routes through its busiest node).
const GroupStructureAnalyzer = {
  UPTAKE_TYPES: new Set(['TRANSFORMATIVE', 'WEAK', 'SEMANTIC', 'FUNCTIONAL', 'TYPED']),

  analyze: function (annotated, uptakeEvents, speakers) {
    const bySpeaker = {};
    for (const s of speakers) bySpeaker[s] = { performed: 0, received: 0 };
    const pairKey = (a, b) => [a, b].sort().join(' ↔ ');
    const touchedPairs = new Set();
    let uptakeTotal = 0;

    for (const e of uptakeEvents) {
      if (!this.UPTAKE_TYPES.has(e.type)) continue;
      const source = annotated[e.from].speaker;
      uptakeTotal++;
      bySpeaker[e.responder].performed++;
      bySpeaker[source].received++;
      touchedPairs.add(pairKey(source, e.responder));
    }

    const allPairs = (speakers.length * (speakers.length - 1)) / 2;
    const engaged = speakers.filter(s => bySpeaker[s].performed + bySpeaker[s].received > 0);
    let hub = null, hubShare = 0;
    for (const s of speakers) {
      const involvement = uptakeEvents.filter(e =>
        this.UPTAKE_TYPES.has(e.type) && (e.responder === s || annotated[e.from].speaker === s)).length;
      const share = uptakeTotal > 0 ? involvement / uptakeTotal : 0;
      if (share > hubShare) { hubShare = share; hub = s; }
    }

    return {
      bySpeaker,
      uptakeTotal,
      engaged,
      disengaged: speakers.filter(s => !engaged.includes(s)),
      pairCoverage: allPairs > 0 ? +(touchedPairs.size / allPairs).toFixed(2) : 0,
      hub,
      hubShare: +hubShare.toFixed(2)
    };
  }
};

// Repair: a clarification request and its resolution — the exchange noticing
// and correcting its own misalignment is structure, not noise.
const RepairDetector = {
  CLARIFICATION: /what do you mean|could you clarify|can you clarify|not sure i follow|do you mean|which do you mean|say more about|in what sense/i,

  analyze: function (annotated) {
    const repairs = [];
    for (let i = 1; i < annotated.length - 1; i++) {
      const turn = annotated[i];
      if (!this.CLARIFICATION.test(turn.text)) continue;
      const troubleSource = annotated[i - 1];
      const response = annotated[i + 1];
      const resolved = response.speaker !== turn.speaker &&
        [...troubleSource.contentSet].some(w => response.contentSet.has(w));
      repairs.push({
        initiatedAtTurn: turn.index,
        by: turn.speaker,
        resolved,
        resolvedAtTurn: resolved ? response.index : null
      });
    }
    return repairs;
  }
};

function synthesizeRelationalVerdict(analysis) {
  const { annotated, speakers, uptakeEvents, coConstruction, asymmetry } = analysis;

  const boundary = {
    claim: 'Measures interaction structure in dialogue transcripts: uptake bindings, co-constructed vocabulary, convergence, symmetry, repair.',
    nonClaim: 'Does not measure consciousness, understanding, or experience. A high verdict means the transcript exhibits relational structure; it says nothing about what, if anything, the exchange was like for its participants.'
  };

  if (speakers.length < 2) {
    return {
      status: 'OUTSIDE DESIGN SPACE',
      confidence: 1.0,
      reason: 'Fewer than two speakers detected. Relational analysis requires an exchange; a monologue has no between.',
      boundary
    };
  }
  if (speakers.length > 2) {
    return synthesizeGroupVerdict(analysis, boundary);
  }
  if (annotated.length < 4) {
    return {
      status: 'INSUFFICIENT EXCHANGE',
      confidence: 1.0,
      reason: `Only ${annotated.length} turns. Round-trip structure (introduce → adopt → return) needs at least 4 turns to exist.`,
      boundary
    };
  }

  const opportunities = uptakeEvents.length;
  const echoes = uptakeEvents.filter(e => e.type === 'ECHO').length;
  const echoRatio = opportunities > 0 ? echoes / opportunities : 0;

  const transformativeBy = {};
  const anyUptakeBy = {};
  for (const s of speakers) {
    // SEMANTIC counts as transformative: engaging an anchor through a
    // neighbor is transformation by definition — nothing was copied.
    transformativeBy[s] = uptakeEvents.filter(e => e.responder === s && (e.type === 'TRANSFORMATIVE' || e.type === 'SEMANTIC')).length;
    anyUptakeBy[s] = uptakeEvents.filter(e => e.responder === s && (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK' || e.type === 'SEMANTIC' || e.type === 'FUNCTIONAL' || e.type === 'TYPED')).length;
  }
  const bothTransform = speakers.every(s => transformativeBy[s] >= 1);
  const bothUptake = speakers.every(s => anyUptakeBy[s] >= 1);
  const eitherUptake = speakers.some(s => anyUptakeBy[s] >= 1);
  const roundTrips = coConstruction.roundTrips.length;

  if (echoRatio >= 0.5) {
    return {
      status: 'MIRRORED EXCHANGE',
      confidence: Math.min(0.9, 0.6 + echoRatio * 0.3),
      reason: `${echoes}/${opportunities} responses are verbatim or near-verbatim echoes. Reflection is not uptake: nothing is transformed, so nothing circulates.`,
      boundary
    };
  }

  if (bothTransform && roundTrips >= 2 && asymmetry.introductionBalance > 0) {
    return {
      status: 'GENERATIVE EXCHANGE',
      confidence: Math.min(0.9, 0.7 + roundTrips * 0.03 + coConstruction.crossPollinations.length * 0.02),
      reason: `Transformative uptake in both directions; ${roundTrips} term(s) completed the introduce→adopt→return circuit; both participants contributed vocabulary that survived it.`,
      boundary
    };
  }

  if (bothUptake) {
    return {
      status: 'COLLABORATIVE UPTAKE',
      confidence: 0.7,
      reason: `Both participants take up the other's anchors, but the exchange shows ${roundTrips} round trip(s) — material passes across, little of it circulates and returns yet.`,
      boundary
    };
  }

  if (eitherUptake) {
    const worker = speakers.find(s => anyUptakeBy[s] >= 1);
    return {
      status: 'ASYMMETRIC UPTAKE',
      confidence: 0.75,
      reason: `Only ${worker} performs uptake; the other participant introduces without receiving. One-way binding is contact, not exchange — and is the signature of a mirror-plus-source pair.`,
      boundary
    };
  }

  return {
    status: 'PARALLEL MONOLOGUES',
    confidence: 0.8,
    reason: 'Turns alternate but no anchors cross between speakers. Two streams sharing a channel, touching nowhere.',
    boundary
  };
}

// opts:
//   stemming (default ON)          — merge inflected forms into one anchor;
//                                    survived ablation (pure recall gain,
//                                    separation intact)
//   functionalUptake (default OFF) — adjacency-pair detection; failed its
//                                    precision gate on external corpora and
//                                    is retained opt-in only. See
//                                    docs/R2-SEMANTIC-UPTAKE.md.
// R3 verdicts for 3+ speakers. Ordering is deliberate: structural shape
// (mirroring, disengagement, hub topology) is diagnosed before generativity,
// because a hub-mediated group can produce round trips while still having
// the structure of a chair running spokes — the shape is the finding.
function synthesizeGroupVerdict(analysis, boundary) {
  const { annotated, speakers, uptakeEvents, coConstruction, group } = analysis;
  const floor = Math.max(4, speakers.length * 2);

  if (annotated.length < floor) {
    return {
      status: 'INSUFFICIENT EXCHANGE',
      confidence: 1.0,
      reason: `${annotated.length} turns among ${speakers.length} speakers. Group structure needs at least ${floor} turns (2 per participant) to exist.`,
      boundary
    };
  }

  const opportunities = uptakeEvents.length;
  const echoes = uptakeEvents.filter(e => e.type === 'ECHO').length;
  if (opportunities > 0 && echoes / opportunities >= 0.5) {
    return {
      status: 'MIRRORED EXCHANGE',
      confidence: Math.min(0.9, 0.6 + (echoes / opportunities) * 0.3),
      reason: `${echoes}/${opportunities} responses are verbatim or near-verbatim echoes. A hall of mirrors is not a meeting.`,
      boundary
    };
  }

  if (group.uptakeTotal > 0 && group.disengaged.length > 0) {
    return {
      status: 'PARTIAL ENGAGEMENT',
      confidence: 0.8,
      reason: `${group.engaged.length} of ${speakers.length} participants exchange material; ${group.disengaged.join(', ')} neither take(s) up nor get(s) taken up. The group's between excludes them.`,
      boundary
    };
  }

  if (group.uptakeTotal >= 3 && group.hubShare >= 0.9 && speakers.length >= 3 && group.pairCoverage < 0.99) {
    return {
      status: 'HUB-AND-SPOKES',
      confidence: 0.8,
      reason: `${(group.hubShare * 100).toFixed(0)}% of uptake involves ${group.hub}; the other participants never bind to each other (pair coverage ${group.pairCoverage}). One node is doing the group's relating.`,
      boundary
    };
  }

  const transformers = new Set(uptakeEvents
    .filter(e => e.type === 'TRANSFORMATIVE' || e.type === 'SEMANTIC')
    .map(e => e.responder));
  if (coConstruction.roundTrips.length >= 2 && transformers.size >= 2) {
    return {
      status: 'GROUP GENERATIVE',
      confidence: Math.min(0.9, 0.7 + coConstruction.roundTrips.length * 0.03 + group.pairCoverage * 0.1),
      reason: `${coConstruction.roundTrips.length} term(s) completed the introduce→adopt→return circuit across the group; ${transformers.size} participants transform rather than repeat; pair coverage ${group.pairCoverage}.`,
      boundary
    };
  }

  if (group.uptakeTotal > 0) {
    return {
      status: 'GROUP UPTAKE',
      confidence: 0.7,
      reason: `Material crosses between participants (${group.uptakeTotal} uptake event(s)), but little circulates and returns yet.`,
      boundary
    };
  }

  return {
    status: 'PARALLEL MONOLOGUES',
    confidence: 0.8,
    reason: 'Turns alternate among the group but no anchors cross between speakers. A queue of soliloquies sharing a room.',
    boundary
  };
}

function analyzeExchange(input, opts = {}) {
  const turns = TurnParser.parse(input);
  const { annotated, display } = AnchorExtractor.annotate(turns, opts);
  const speakers = [...new Set(annotated.map(t => t.speaker))];

  const uptakeEvents = UptakeBinder.analyze(annotated, opts);
  CoConstructionDetector._display = display;
  const coConstruction = CoConstructionDetector.analyze(annotated);
  CoConstructionDetector._display = null;
  const convergence = ConvergenceTracker.analyze(annotated, speakers);
  const asymmetry = AsymmetryAnalyzer.analyze(annotated, uptakeEvents, coConstruction, speakers);
  const repairs = RepairDetector.analyze(annotated);
  const group = speakers.length > 2
    ? GroupStructureAnalyzer.analyze(annotated, uptakeEvents, speakers)
    : null;

  const analysis = { annotated, speakers, uptakeEvents, coConstruction, convergence, asymmetry, repairs, group };
  const verdict = synthesizeRelationalVerdict(analysis);

  return {
    speakers,
    turnCount: annotated.length,
    uptake: uptakeEvents,
    coConstruction,
    convergence,
    asymmetry,
    repairs,
    group,
    verdict,
    // Every result declares which ruler measured it. 'defaults' means the
    // globally validated thresholds; anything else must come from an
    // explicit, ledgered calibration (see relational-calibration.js).
    calibration: opts.calibration
      ? { source: opts.calibrationLabel || 'custom overrides', values: { ...opts.calibration } }
      : { source: 'defaults' }
  };
}

const RelationalCathedral = {
  analyzeExchange,
  TurnParser,
  AnchorExtractor,
  AdjacencyPairs,
  TypedAnswers,
  SemanticLexicon,
  UptakeBinder,
  CoConstructionDetector,
  ConvergenceTracker,
  AsymmetryAnalyzer,
  GroupStructureAnalyzer,
  RepairDetector,
  synthesizeRelationalVerdict,
  synthesizeGroupVerdict
};

// Node module and browser global from the same file — relational-demo.html
// loads this script directly, so there is exactly one copy of the analyzer.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RelationalCathedral;
} else if (typeof window !== 'undefined') {
  window.RelationalCathedral = RelationalCathedral;
}
