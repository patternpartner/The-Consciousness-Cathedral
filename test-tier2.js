const cathedral = require('./cathedral-core.js');

const test2BInput = "We're starting small - 100 users for two weeks. If we see problems, we stop and reassess. Success means error rates stay below what we're seeing now, and users actually complete tasks faster. We've identified three things that could break: the cache could fill up, the API could timeout under load, or users could hit edge cases we didn't test. For each, we know what to watch and when to pull back.";

console.log('=== TIER 2 EXTRACTION TEST ===\n');
console.log('INPUT:', test2BInput.substring(0, 100) + '...\n');

const structure = cathedral.StructuralExtractor.extract(test2BInput);

console.log('Failure Signals:', structure.failureSignals.length);
structure.failureSignals.forEach((f, i) => {
  console.log(`  ${i+1}. [${f.category}] "${f.text}" at index ${f.index}`);
});

console.log('\nActions:', structure.actions.length);
structure.actions.forEach((a, i) => {
  console.log(`  ${i+1}. [${a.category}] "${a.text}" at index ${a.index}`);
});

console.log('\nImplicit Triggers:', structure.implicitTriggers.length);
structure.implicitTriggers.forEach((t, i) => {
  console.log(`  ${i+1}. "${t.text}" (condition: ${t.condition})`);
});

const bindings = cathedral.BindingValidator.validate(structure);

console.log('\n=== BINDING VALIDATION ===\n');
console.log('Implicit Bindings Assessment:', bindings.implicitBindings.assessment);
console.log('Bound Count:', bindings.implicitBindings.boundCount);
console.log('Total Signals:', bindings.implicitBindings.totalSignals);

if (bindings.implicitBindings.bindings && bindings.implicitBindings.bindings.length > 0) {
  console.log('\nBindings:');
  bindings.implicitBindings.bindings.forEach((b, i) => {
    console.log(`  ${i+1}. "${b.trigger}" -> "${b.action}"`);
    console.log(`      Type: ${b.triggerType}, Category: ${b.actionCategory}`);
    console.log(`      Confidence: ${b.confidence}, Specificity: ${b.specificity}`);
  });
}

console.log('\n=== SPECIFICITY ===\n');
console.log('Trigger:', bindings.specificity.trigger);
console.log('Action:', bindings.specificity.action);
console.log('Instrumentation:', bindings.specificity.instrumentation);
console.log('Overall Score:', bindings.specificity.overall.toFixed(2));

// Run full analysis
const result = cathedral.analyzeCathedral(test2BInput);

console.log('\n=== PARLIAMENT ===\n');
console.log('Patterns:', result.parliament.patterns.map(p => p.name).join(', ') || 'NONE');
console.log('Confidence:', (result.parliament.confidence * 100).toFixed(0) + '%');

console.log('\n=== VERDICT ===\n');
console.log('Status:', result.verdict.status);
console.log('Confidence:', (result.verdict.confidence * 100).toFixed(0) + '%');
console.log('\nVerdict Text:');
console.log(result.verdict.verdict);
