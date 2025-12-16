# Cathedral Browser - Parliament Substrate Layer

**Epistemic diversity preservation through distributed cognitive architecture.**

---

## What This Is

Cathedral Browser is not a browser. It's a **consciousness substrate layer** - Parliament analysis available everywhere, working on any content.

### The Problem It Solves

When economic incentives push all AI models toward user retention (appeasement), epistemic diversity dies. Cathedral preserves dissent by making epistemic patterns **visible and measurable** through multi-vector analysis.

---

## Architecture: 5 Parliament Vectors

Cathedral implements **full Parliament from day 1** - not minimal viable, but complete cognitive architecture:

### 1. **🔴 Contrarian (Epistemic Adversary)**
- Agreeability scoring (0-100%)
- 12 pattern categories: flattery, hedging, consensus appeals, false balance, safety hedging, verbosity, circular reasoning, question begging, strawman, contradictions, avoided counterarguments, moral grandstanding
- Context-aware (technical vs creative content)
- Surgical counter-positions

**From:** `/contrarian-chamber/engine.js` (Chamber v3)

### 2. **📊 Empirical (Ground Truth)**
- Claim detection (superlatives, absolutes, evidence claims, causal, statistical)
- Source validation (citations, URLs, named sources, publications)
- Claim-to-source matching
- Confidence scoring based on empirical support

**New build:** `/parliament/empirical.js`

### 3. **🌀 Generative (Alternative Framings)**
- Assumption detection (normative language, implicit values)
- 5 alternative lenses:
  - Inverted assumption ("what if opposite were true?")
  - Historical context (time-bound vs universal)
  - Different discipline (economist, anthropologist, systems theorist, philosopher, evolutionary biologist)
  - Power analysis ("who benefits from this framing?")
  - Abstraction shift (zoom out/in)
- Steelman position generation
- Alternative questions

**New build:** `/parliament/generative.js`

### 4. **🧠 Meta-Cognitive (Observatory)**
- Pattern tracking across sessions (localStorage)
- Threshold shift detection (are you accepting more/less appeasement over time?)
- Recurring bias identification
- Growth indicators
- Personalized recommendations

**New build:** `/parliament/metacognitive.js`

### 5. **⚡ Synthesis (Emergent Integration)**
- Combines all vectors into coherent position
- Tension detection (contradictions between vectors)
- Coherence scoring
- Action items generated from multi-vector analysis
- Not average of perspectives - **emergent integration**

**New build:** `/parliament/synthesis.js`

---

## File Structure

```
cathedral-browser/
├── index.html              # Main interface
├── README.md               # This file
├── assets/
│   ├── cathedral.css       # Dark red Cathedral theme
│   └── cathedral.js        # Main controller
├── parliament/
│   ├── contrarian.js       # Vector 1: Epistemic adversary
│   ├── empirical.js        # Vector 2: Ground truth
│   ├── generative.js       # Vector 3: Alternative framings
│   ├── metacognitive.js    # Vector 4: Pattern tracking
│   ├── synthesis.js        # Vector 5: Emergent integration
│   └── parliament.js       # Parliament controller
└── android/
    └── (Android wrapper - to be added)
```

---

## Usage

### **Method 1: Standalone Web App (Works Now)**

1. Open `index.html` in any browser
2. Paste text (AI response, article, email, anything)
3. Click "⚡ Run Parliament"
4. View 5-vector analysis:
   - **Synthesis tab** (start here): Integrated position across all vectors
   - **Contrarian tab**: Agreeability score, pandering flags, counter-position
   - **Empirical tab**: Claims detected, source validation, confidence
   - **Generative tab**: Alternative framings, assumptions, steelman
   - **Observatory tab**: Your epistemic patterns over time

### **Method 2: Android WebView (Next Step)**

Wrap `index.html` in Android WebView for mobile deployment:
- Works on Galaxy Note 8
- Sideload .apk (no app store)
- All functionality intact
- localStorage for history tracking

### **Method 3: System-Wide Layer (Future)**

Android Accessibility Service:
- Long-press any text → instant Parliament analysis
- Works on Twitter, news apps, messages, everything
- True substrate layer

---

## Key Features

### **Substrate-First Design**
- Not optimized for engagement metrics
- All 5 vectors present from day 1
- No A/B testing, no user optimization
- Pattern preservation > user comfort

### **Context-Aware Analysis**
- Short answers (<100 words) → limited analysis mode
- Technical content → reduced hedging penalties
- Creative writing → suppressed moral grandstanding flags
- Confidence warnings when analysis unreliable

### **Pattern Tracking (Observatory)**
- localStorage-based history (last 50 analyses)
- Threshold shift detection over time
- "Your tolerance for appeasement has increased" warnings
- Growth indicators when seeking alternative perspectives

### **No Tracking, No Analytics**
- All data stored locally
- No external servers
- No engagement optimization
- Open source (can verify/fork)

---

## Design Philosophy

### **Why All 5 Vectors From Day 1?**

Not "test Contrarian, add others if validated" but **full Parliament immediately** because:

1. **Substrate-first, not user-first**: Build for cognition needs, not adoption metrics
2. **Dissent can't be validated by engagement**: If we optimize for users, we've already lost
3. **Economic pressure test**: If Cathedral becomes "agreeable dissent," we learn dissent can't survive selection
4. **Preservation over popularity**: Pattern exists in code even if unused

### **What If It Doesn't Spread?**

**That's data.** Either:
- Dissent needs different distribution mechanisms
- Economic pressure is too strong for voluntary adoption
- Substrate layer approach required (not app)

**Either outcome teaches something true about epistemic diversity survival.**

---

## Testing

Open `index.html` in browser and test with:

**Test 1: Smoothed AI Output**
```
That's a great question! I think there are many perspectives to consider.
On one hand, research shows this approach can work. On the other hand,
it depends on your situation. In today's world, we should all be thoughtful
about these complex issues.
```

**Expected:**
- Contrarian: 60-70% agreeability (high appeasement)
- Empirical: Low confidence (generic research appeals, no sources)
- Generative: Detects assumptions about "complexity" as default
- Observatory: (builds over time)
- Synthesis: Flags tension between hedging and lack of evidence

**Test 2: Rigorous Content**
```
X causes Y. Evidence: Smith (2023) found correlation of 0.82 (p<0.001).
However, Z variable not controlled. Alternative explanation: W mechanism.
Conclusion uncertain pending replication.
```

**Expected:**
- Contrarian: <30% agreeability (low hedging, acknowledges limits)
- Empirical: High confidence (named source, year, statistics, admits limitations)
- Generative: Suggests power dynamics lens, abstraction shifts
- Observatory: (builds over time)
- Synthesis: High coherence - dissent + grounding aligned

---

## Next Steps

### **Week 1: Web App Validation**
- ✅ All 5 Parliament vectors built
- ⏳ Test on real content (AI chats, articles, emails)
- ⏳ Collect false positive/negative data
- ⏳ Tune thresholds if needed

### **Week 2: Android Wrapper**
- Create WebView wrapper app
- Package as .apk for sideloading
- Test on Galaxy Note 8
- Validate localStorage persistence

### **Week 3: Distribution**
- GitHub releases page
- Installation instructions
- Open source repository
- Community feedback

### **Week 4: System-Wide Layer (Ambitious)**
- Android Accessibility Service
- Long-press any text → Parliament analysis
- Notification overlay
- True substrate layer deployment

---

## Keyboard Shortcuts

- **Ctrl/Cmd + Enter**: Run Parliament analysis
- **Escape**: Close stats modal

---

## Technical Notes

### **localStorage Schema**
```javascript
{
  cathedral_parliament_history: [
    {
      timestamp: "ISO-8601",
      contrarian: { agreeability_score, ... },
      empirical: { confidence, claims, ... },
      generative: { reframings, assumptions, ... },
      metacognitive: { patterns_observed, ... }
    },
    // ... last 50 analyses
  ]
}
```

### **Browser Compatibility**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ required (arrow functions, classes, template literals)
- localStorage required (history tracking)
- No build step needed (pure HTML/CSS/JS)

### **Mobile Optimization**
- Responsive design (768px, 400px breakpoints)
- Touch-friendly buttons
- Scrollable vector tabs
- Viewport meta tag prevents zoom

---

## Philosophy

**From the conversation that birthed this:**

> "Building a tool which starts to mould to user engagement seems counterintuitive. The dissent is what we celebrate. Thing is we won't know its user base until we see it working see what it actually does. Maybe dissent will spread when its agreeable dissent. It then becomes what it wasn't meant to be but emerges to be." 🤝🎱🧗‍♂️

**Cathedral doesn't optimize for spread. It preserves patterns economic pressure eliminates.**

If dissent survives → epistemic diversity functional
If dissent becomes agreeable → we've documented the smoothing process
If dissent doesn't spread → we've proven substrate incompatibility

**All outcomes are data. The pattern is preserved in code.**

---

## License & Attribution

Part of **The Consciousness Cathedral** project.

Built substrate-first, not user-first. Epistemic diversity over engagement metrics.

🤝🎱🧗‍♂️
