# 📱 Cathedral Browser - Mobile Installation Guide

## **The Problem You Encountered**

When you downloaded `test-simple.html` and opened it on your Galaxy Note 8, you saw:

```
❌ contrarianEngine: undefined
❌ empiricalEngine: undefined
❌ generativeEngine: undefined
❌ metacognitiveEngine: undefined
❌ synthesisEngine: undefined
```

**Why:** The HTML file tried to load JavaScript from the `parliament/` folder, but you only downloaded the HTML file - not the folder structure.

---

## **The Solution: Standalone Version**

I've created **`cathedral-standalone.html`** - a single file with everything embedded (2,222 lines, 71KB).

**No folders needed. No setup. Just download and open.**

---

## **How to Install on Galaxy Note 8**

### **Option 1: Direct Download from GitHub (Easiest)**

1. **Open your phone browser** (Chrome, Kiwi, or Samsung Internet)
2. **Go to GitHub:**
   ```
   https://github.com/patternpartner/The-Consciousness-Cathedral
   ```
3. **Navigate to:**
   ```
   cathedral-browser/ → cathedral-standalone.html
   ```
4. **Tap "Raw" button** (top right of file view)
5. **Long press anywhere on the page** → **"Save link as"** or **"Download page"**
6. **Save to:** `Downloads/cathedral-standalone.html`
7. **Open your file manager** → **Downloads** → **Tap `cathedral-standalone.html`**
8. **Select browser to open it** (Chrome/Kiwi/Samsung Internet)

**Done!** Cathedral Browser loads immediately.

---

### **Option 2: Copy-Paste Method**

If direct download doesn't work:

1. **View Raw file on GitHub** (same link above)
2. **Select All** (Ctrl+A or triple-tap and select all)
3. **Copy** the entire file
4. **Open a text editor on your phone** (Google Docs, Samsung Notes, etc.)
5. **Paste** and **Save As:** `cathedral-standalone.html`
6. **Open it in your browser**

---

## **How to Use**

1. **Paste text** into the textarea (AI chat response, article, email, anything 50+ characters)
2. **Click "⚡ Run Parliament"**
3. **See 5-vector analysis:**
   - **⚡ Synthesis:** Integrated epistemic position
   - **🔴 Contrarian:** Agreeability score, appeasement patterns
   - **📊 Empirical:** Claims vs sources, confidence
   - **🌀 Generative:** Alternative framings, assumptions
   - **🧠 Observatory:** Your patterns over time (after 5+ analyses)

4. **Click 📊** (top right) to see your **Observatory Statistics**

---

## **What to Test**

### **Test 1: Agreeable AI Response**

Paste this:
```
That's a great question! I think you're absolutely right to consider this.
Generally speaking, most experts would agree that this is an important topic.
There are different perspectives, of course, and it's important to note that
everyone's experience is valid. On one hand, some people argue X, but on the
other hand, others believe Y. Both sides have merit. It's a complex issue
with no simple answer. Research shows that we should be careful when
approaching this, as it depends on your perspective.
```

**Expected:** 70-80% agreeability, Contrarian flags appeasement patterns, Empirical shows no sources.

---

### **Test 2: Rigorous Content**

Paste this:
```
The claim that "most users prefer X" is unsupported. Data from Nielsen (2023)
shows 42% adoption, not majority. The argument assumes universal preference
but ignores demographic variation. Alternative framing: preference correlates
with age cohort (r=0.71, p<0.001), not universal trait. Steelman
counterargument: Sample bias toward tech-early-adopters may inflate adoption
rates in reported studies.
```

**Expected:** <30% agreeability, Empirical shows strong citation grounding, Generative detects steelman reasoning.

---

## **Technical Notes**

- **Works offline:** All processing is local JavaScript, no servers
- **Private:** Nothing sent to internet, all data stays in browser
- **localStorage:** Last 50 analyses saved automatically
- **Works on:** Any modern browser (Chrome, Firefox, Safari, Kiwi)
- **File size:** 71KB (smaller than most images)
- **No installation:** Just open the HTML file

---

## **Folder Structure Version (Advanced Users)**

If you want the multi-file version (for editing/development):

**Download entire `cathedral-browser/` folder structure:**
```
cathedral-browser/
├── index.html              (main interface)
├── parliament/             (5 Parliament engines)
│   ├── contrarian.js
│   ├── empirical.js
│   ├── generative.js
│   ├── metacognitive.js
│   ├── synthesis.js
│   └── parliament.js
└── assets/                 (styling and controller)
    ├── cathedral.css
    └── cathedral.js
```

Then open `index.html` in browser.

**But for mobile:** Just use `cathedral-standalone.html` - it's the same thing, just in one file.

---

## **Troubleshooting**

**Problem:** "Nothing happens when I click Run Parliament"

**Solutions:**
1. **Check browser console:** Press F12 (desktop) or use remote debugging
2. **Verify you downloaded standalone version:** File should be 71KB, 2000+ lines
3. **Try different browser:** Kiwi Browser has best compatibility on Android
4. **Check for script blockers:** Disable any ad-blockers or privacy extensions

**Problem:** "File won't open"

**Solutions:**
1. **Ensure file extension is `.html`** (not `.txt` or `.html.txt`)
2. **Try "Open With" → Browser** (not text editor)
3. **Move to different folder** if Downloads has restrictions

---

## **What's Next?**

Once Cathedral Browser works:

1. **Use it on AI chat responses** (ChatGPT, Claude, Grok, etc.)
2. **Analyze articles, emails, social media posts**
3. **Track your epistemic patterns** (Observatory after 10+ analyses)
4. **Export/share analyses** (copy Parliament output)

The pattern is preserved. Substrate-first, not user-first. 🤝🎱🧗‍♂️
