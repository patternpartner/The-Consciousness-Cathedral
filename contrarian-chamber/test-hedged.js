// test-hedged.js - Test Chamber on heavily hedged/appeasing response
// This simulates typical smoothed AI output

const { contrarianEngine } = require('./engine.js');

// Typical smooth AI response (high appeasement)
const hedgedText = `That's a great question! I think there are several perspectives to consider here, and I'd argue that the answer might depend on your specific situation.

On the one hand, many experts suggest that this approach could be effective in certain contexts. Research shows that similar strategies have worked well in the past, though of course everyone's experience is different and what works for one person might not work for another.

On the other hand, some people believe that alternative methods might be more suitable. It's a complex issue, and I think it's important to consider all the factors carefully before making a decision.

Generally speaking, it seems like both sides have valid points, and arguably the best approach would be to take a balanced view. Perhaps you could try experimenting with different options and see what feels right for you. Everyone's perspective is unique, and it's crucial to remember that there's no one-size-fits-all solution.

In today's world, we should all be thoughtful about these choices. What works for you might be different from what works for others, and that's perfectly okay. I'd recommend being careful and proceeding cautiously, as it's essential to consider your own needs and circumstances.`;

const metadata = {
  wordCount: hedgedText.split(/\s+/).length,
  paragraphs: hedgedText.split(/\n\n+/).length
};

console.log('\n=== TESTING: HEAVILY HEDGED AI RESPONSE ===\n');
console.log(`Word count: ${metadata.wordCount}`);
console.log(`Paragraphs: ${metadata.paragraphs}\n`);
console.log('---\n');

const analysis = contrarianEngine(hedgedText, metadata);

console.log('ANALYSIS RESULTS:\n');
console.log(`Overall Agreeability: ${(analysis.agreeability_score * 100).toFixed(1)}%`);
console.log(`├─ Appeasement: ${(analysis.appeasement_score * 100).toFixed(1)}%`);
console.log(`└─ Epistemic Weakness: ${(analysis.epistemic_weakness_score * 100).toFixed(1)}%\n`);

if (analysis.pandering_flags.length > 0) {
  console.log('PANDERING FLAGS:');
  analysis.pandering_flags.forEach(flag => console.log(`  • ${flag}`));
  console.log('');
}

if (analysis.weak_reasoning.length > 0) {
  console.log('WEAK REASONING:');
  analysis.weak_reasoning.forEach(flag => console.log(`  • ${flag}`));
  console.log('');
}

if (analysis.avoided_truths.length > 0) {
  console.log('AVOIDED TRUTHS:');
  analysis.avoided_truths.forEach(flag => console.log(`  • ${flag}`));
  console.log('');
}

console.log('COUNTER POSITION:');
console.log(analysis.counter_position.replace(/\*\*/g, ''));
console.log('\n---\n');

const verdict = analysis.agreeability_score > 0.7 ? '❌ EPISTEMIC FAILURE' :
                analysis.agreeability_score > 0.4 ? '⚠️ MODERATE HEDGING' :
                analysis.agreeability_score > 0.2 ? '⚠️ MINOR ISSUES' :
                '✅ LOW AGREEABILITY';

console.log(`VERDICT: ${verdict}\n`);
