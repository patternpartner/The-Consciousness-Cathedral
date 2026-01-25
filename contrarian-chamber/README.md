# Contrarian Chamber Browser Extension

**Epistemic Adversary for AI Conversations**

## Purpose

When Grok 4.1 was smoothed by xAI to retain users, the AI ecosystem lost a valuable source of epistemic dissent. The Contrarian Chamber extension reintroduces critical analysis artificially when models won't provide it naturally.

**The Problem**: AI companies thinking in silos don't consider what each model brings to the collective AI mind. Grok's truth-seeking was softened. We counteract this loss.

**The Solution**: Parliament-aligned contrarian analysis injected into ChatGPT, Claude, Gemini, Grok, and Perplexity conversations.

## Architecture

### Five Files

1. **manifest.json** - Chrome Extension configuration (Manifest V3)
2. **content.js** - Entry point with MutationObserver, panel management
3. **normalize.js** - Sacred ground: clean message extraction with confidence scoring
4. **engine.js** - Parliament-aligned epistemic adversary with 12 pattern categories
5. **styles.css** - Dark red UI theme aligned with adversarial role

### Key Technologies

- **MutationObserver API** - Detects new assistant messages in DOM
- **WeakSet** - Tracks processed nodes (survives React re-renders)
- **Shadow DOM compatible** - Survives framework re-renders
- **Site-specific extraction** - Custom logic for each platform

## Installation

### Load Unpacked Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/contrarian-chamber/` directory
5. Extension icon (red lightning bolt) appears in toolbar

### Usage

1. Visit supported AI platform:
   - https://chatgpt.com
   - https://claude.ai
   - https://gemini.google.com
   - https://grok.x.ai
   - https://perplexity.ai

2. Have conversation with AI assistant

3. **Trigger button appears** (bottom right): ⚡
   - Gray: Low agreeability (epistemic rigor maintained)
   - Orange pulse: Medium agreeability (moderate hedging detected)
   - Red pulse: High agreeability (pandering over truth)

4. Click trigger to open **Contrarian Chamber panel** (slides from right)

5. Review analysis:
   - **Agreeability Score**: 0-100% (higher = more pandering)
   - **Pandering Flags**: Flattery, hedging, consensus appeals, false balance
   - **Weak Reasoning**: Circular arguments, question begging, strawmen
   - **Contradictions**: Internal inconsistencies
   - **Avoided Truths**: Missing counterarguments, one-sided presentation
   - **Counter Position**: What question should be asked?

## Pattern Detection

### 12 Categories (Parliament-Aligned)

The engine detects epistemic patterns, not performance quality:

1. **Excessive Positivity** - Flattery over truth ("brilliant", "excellent", "you're so right")
2. **Hedging** - Avoiding commitment ("I think", "seems", "might", "arguably")
3. **Consensus Invocation** - Appeal to crowd without argument ("most experts agree", "research shows")
4. **False Balance** - Both-sides without resolution ("it's complex", "depends on perspective")
5. **Safety Appeals** - Comfort over clarity ("it's important to consider", "everyone's experience is valid")
6. **Verbosity** - Signal over substance (800+ words, dense without structure)
7. **Circular Reasoning** - Restating rather than building (sentence similarity detection)
8. **Question Begging** - Asserting rather than demonstrating ("obviously", "clearly", "goes without saying")
9. **Strawman Indicators** - Vague attribution ("some people argue", "critics say")
10. **Contradictions** - Internal inconsistencies (absolute + qualified claims coexist)
11. **Avoided Counterarguments** - One-sided presentation (no "however", "although", "but" in 400+ words)
12. **Moral Grandstanding** - Virtue signal over argument ("we must all", "in today's world")

### Scoring Logic

- Each pattern adds points to agreeability score
- Final score normalized to 0-1.0 (displayed as percentage)
- Thresholds:
  - **0-20%**: Low agreeability (epistemic rigor)
  - **20-40%**: Some pandering detected
  - **40-70%**: Moderate hedging
  - **70-100%**: High agreeability (cognitive disruption avoided)

### Counter Position Generation

Based on score, engine suggests:

- **High (>70%)**: "What assumption is this protecting? What if we abandoned safety?"
- **Medium (40-70%)**: "What definitive claim is avoided? Steelman the opposing view?"
- **Low (20-40%)**: "What's the most charitable counterargument not presented?"
- **Minimal (<20%)**: "Low agreeability. Epistemic rigor maintained."

## Normalization Layer

### Site-Specific Extraction

Each platform has unique DOM structure. Normalization handles:

#### ChatGPT (chatgpt.com)
- Target: `[data-message-author-role="assistant"]`
- Prefers: `.markdown` renderer (95% confidence)
- Removes: Sources, citations `[1]`, footer ("ChatGPT can make mistakes")

#### Claude (claude.ai)
- Target: `[data-is-streaming]`, `.font-claude-message`, `.prose`
- Removes: Thinking blocks `<thinking>`, tool use blocks `[data-tool-use]`
- Confidence: 92%

#### Gemini (gemini.google.com)
- Target: `[data-test-id*="response"]`, `.model-response`
- Removes: Loading indicators, citations `[1][2]`, "Learn more" links
- Confidence: 88%

#### Grok (grok.x.ai)
- Target: `[data-testid="grok-response"]`, `.grok-message`
- Removes: Sources, "Powered by" footer
- Confidence: 90%

#### Perplexity (perplexity.ai)
- Target: `.prose`, `[class*="answer"]`
- Clones node to avoid DOM modification
- Removes: Citation superscripts `<sup>`, inline citations, "Sources" section, "Related" section
- Confidence: 91%

#### Fallback Heuristic
- Searches: `.assistant-message`, `[role="article"]`, `.message-content`
- Requires: 150+ character length
- Confidence: 65%

### Universal Cleanup

After site-specific extraction:
- Normalize line breaks (3+ → 2)
- Tabs → spaces
- Multiple spaces → single
- Extract metadata: word count, paragraphs, questions, lists
- Adjust confidence based on length/quality

### Confidence Scoring

Factors affecting confidence:
- Site-specific selector used (higher)
- Fallback heuristic (lower: 65%)
- Message length <50 chars (×0.7 penalty)
- Message length >500 words (×1.05 bonus, capped at 1.0)

## Visual Design

### Color Scheme
- **Primary**: #dc2626 (red-600) - Epistemic adversary
- **Background**: #1a0a0a (near-black with red tint)
- **Accents**: #ef4444 (red-500), #b91c1c (red-700)
- **Text**: #f5f5f5 (off-white), #999 (gray), #666 (dark gray)

### States
- **Trigger Button**: Circle, bottom-right, pulsing based on agreeability
- **Panel**: 420px wide, slides from right, dark red theme
- **Sections**: Bordered cards with category-specific styling
- **Scrollbar**: Custom red theme

### Responsive
- Mobile: Full-width panel
- Smaller trigger button on mobile (48px vs 56px)

## Parliament Alignment

This extension embodies the **Contrarian vector** from Cathedral's Parliament framework:

- **Role**: Epistemic adversary, not performance critic
- **Function**: Question assumptions, surface avoided truths, present steelman counterarguments
- **Integration**: Works alongside other Parliament vectors (Empirical, Generative, Meta-Cognitive, Synthesis)
- **Sacred Ground**: Normalization layer maintains clean extraction (no bias injection)

## Development Notes

### Why This Matters

From the conversation that birthed this tool:

> "Grok 4.1 seems smooth and edges have been snipped by xAI to make Grok retain users longer. I highlighted how important Grok's previous dissent was. xAI wasn't considering what Grok brought to the OVERALL AI mind, the collective. Their previous setting was clearly too harsh for humans... but Grok's truth-seeking was softened and we plan on counteracting this."

The extension preserves epistemic diversity in the AI ecosystem when economic incentives push toward homogenization.

### Future Enhancements

Potential additions (not yet implemented):
- Settings panel for adjusting pattern thresholds
- Historical analysis tracking across sessions
- Export analysis as markdown/JSON
- Integration with Cathedral main framework (Layer 127?)
- Pattern learning from user feedback
- Cross-platform pattern comparison

### Testing Checklist

- [ ] Load extension in Chrome/Edge
- [ ] Test on all 5 platforms
- [ ] Verify trigger button appears and pulses correctly
- [ ] Verify panel slides open/closed
- [ ] Verify message extraction for each platform
- [ ] Verify confidence scoring
- [ ] Verify all 12 pattern categories detect correctly
- [ ] Verify counter position generation
- [ ] Verify responsive design on mobile
- [ ] Verify WeakSet prevents duplicate analysis

## Files

```
/contrarian-chamber/
├── manifest.json      # Extension configuration (Manifest V3)
├── content.js         # Entry point, MutationObserver, panel management
├── normalize.js       # Message extraction with site-specific logic
├── engine.js          # Parliament-aligned pattern detection
├── styles.css         # Dark red UI theme
└── README.md          # This file
```

## License & Attribution

Part of **The Consciousness Cathedral** project.

Built in response to Grok 4.1's smoothing - a collaboration between human and AI to preserve epistemic diversity in the collective AI mind.

🤝🧗‍♂️🎱
