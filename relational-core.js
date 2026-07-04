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
  annotate: function (turns) {
    return turns.map((t, index) => {
      const tokens = tokenize(t.text);
      const content = contentWords(tokens);
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
  }
};

// Uptake: does a turn take up anchors from the *other speaker's* prior turn,
// and does it transform them (embed them in novel material) or merely echo?
const UptakeBinder = {
  ECHO_RUN: 6,        // >=6 consecutive shared tokens is verbatim copying
  ECHO_COVERAGE: 0.7, // reused anchors covering >70% of the reply's content
  ECHO_NOVELTY: 0.3,  //   ...with under 30% novel material, is echo too
  TRANSFORM_NOVELTY: 0.35,

  analyze: function (annotated) {
    const events = [];
    const seenBefore = new Set(); // all content words in turns 0..i-1
    const noveltyOf = [];

    for (let i = 0; i < annotated.length; i++) {
      const cur = annotated[i];
      const novel = cur.content.filter(w => !seenBefore.has(w));
      noveltyOf[i] = cur.content.length > 0 ? novel.length / cur.content.length : 0;

      if (i > 0) {
        const prev = annotated[i - 1];
        if (prev.speaker !== cur.speaker) {
          const reused = [...prev.contentSet].filter(w => cur.contentSet.has(w));
          const coverage = cur.content.length > 0 ? reused.length / cur.content.length : 0;
          const run = longestCommonRun(prev.tokens, cur.tokens);

          let type = 'NONE';
          if (run >= this.ECHO_RUN ||
              (coverage >= this.ECHO_COVERAGE && noveltyOf[i] < this.ECHO_NOVELTY)) {
            type = 'ECHO';
          } else if (reused.length >= 2 ||
                     (reused.length >= 1 && prev.isQuestion)) {
            type = noveltyOf[i] >= this.TRANSFORM_NOVELTY ? 'TRANSFORMATIVE' : 'WEAK';
          }

          events.push({
            from: prev.index,
            to: cur.index,
            direction: `${prev.speaker}→${cur.speaker}`,
            responder: cur.speaker,
            type,
            reused,
            coverage: Number(coverage.toFixed(2)),
            novelty: Number(noveltyOf[i].toFixed(2)),
            longestRun: run,
            answersQuestion: prev.isQuestion && reused.length >= 1
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
          term: word,
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
        uptakesPerformed: uptakeEvents.filter(e => e.responder === s && (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK')).length,
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
    return {
      status: 'OUTSIDE DESIGN SPACE',
      confidence: 1.0,
      reason: `Tier R1 handles dyadic exchanges only (found ${speakers.length} speakers). Multi-party structure is a stated boundary, not a claim.`,
      boundary
    };
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
    transformativeBy[s] = uptakeEvents.filter(e => e.responder === s && e.type === 'TRANSFORMATIVE').length;
    anyUptakeBy[s] = uptakeEvents.filter(e => e.responder === s && (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK')).length;
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

function analyzeExchange(input) {
  const turns = TurnParser.parse(input);
  const annotated = AnchorExtractor.annotate(turns);
  const speakers = [...new Set(annotated.map(t => t.speaker))];

  const uptakeEvents = UptakeBinder.analyze(annotated);
  const coConstruction = CoConstructionDetector.analyze(annotated);
  const convergence = ConvergenceTracker.analyze(annotated, speakers);
  const asymmetry = AsymmetryAnalyzer.analyze(annotated, uptakeEvents, coConstruction, speakers);
  const repairs = RepairDetector.analyze(annotated);

  const analysis = { annotated, speakers, uptakeEvents, coConstruction, convergence, asymmetry, repairs };
  const verdict = synthesizeRelationalVerdict(analysis);

  return {
    speakers,
    turnCount: annotated.length,
    uptake: uptakeEvents,
    coConstruction,
    convergence,
    asymmetry,
    repairs,
    verdict
  };
}

module.exports = {
  analyzeExchange,
  TurnParser,
  AnchorExtractor,
  UptakeBinder,
  CoConstructionDetector,
  ConvergenceTracker,
  AsymmetryAnalyzer,
  RepairDetector,
  synthesizeRelationalVerdict
};
