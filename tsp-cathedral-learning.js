// CATHEDRAL LEARNING: Recording what multi-instance test taught us
// This is the "learning from violations" part of Cathedral v30

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

const cathedral = new CathedralV30();
const session = cathedral.beginSession('tsp-hypothesis-test', 'Testing if gap is consistent');

console.log('='.repeat(80));
console.log('CATHEDRAL LEARNING: What did we discover?');
console.log('='.repeat(80));

// Record the decision we made
cathedral.decide('investigation-approach', [
    'Verify optimal calculation',
    'Test multiple instances',
    'Analyze tour structure'
], [
    'Instance difficulty variation unknown',
    'Algorithm performance distribution unknown',
    'Whether 13.8% was typical or outlier unknown'
]);

const choice = cathedral.commit(
    'investigation-approach',
    'Test multiple instances',
    'Contrarian questioned single-instance testing. Practical needed data.',
    [
        'Instance difficulty variation unknown',
        'Algorithm performance distribution unknown'
    ]
);

console.log('\n### INITIAL PREDICTION ###');
console.log('IF gap is consistent (low stddev):');
console.log('  → Algorithms genuinely inadequate');
console.log('  → 13.8% was representative');
console.log('');
console.log('IF gap is variable (high stddev):');
console.log('  → Instance difficulty varies');
console.log('  → 13.8% might be unlucky');
console.log('  → Average could be much better');

// Record actual outcome
console.log('\n### ACTUAL OUTCOME ###');
console.log('Gap range: 6.16% to 17.72%');
console.log('Average: 12.81%');
console.log('Std Dev: 3.02%');
console.log('Distribution: 0/10 <5%, 1/10 <10%, 9/10 ≥10%');

cathedral.recordOutcome(
    'investigation-approach',
    'Both hypotheses partially true: Gap IS variable (3.02% stddev), BUT even best instance is 6.16% from optimal. Nuanced finding.',
    'unexpected',
    null
);

// What did we learn?
console.log('\n### CATHEDRAL ANALYSIS ###');

console.log('\n1. CONTRARIAN WAS RIGHT');
console.log('   Single-instance testing hid variance');
console.log('   Some instances 3x easier than others (6% vs 18%)');

console.log('\n2. BUT PROBLEM STILL REAL');
console.log('   Even "easy" instances: 6% from optimal');
console.log('   Average: 12.81% (not <1% goal)');
console.log('   9/10 instances ≥10% gap');

console.log('\n3. NUANCED TRUTH');
console.log('   Not either/or, but both/and:');
console.log('   - Instance difficulty matters (variance exists)');
console.log('   - Algorithms genuinely struggle (all >5%)');

console.log('\n4. WHAT THIS TEACHES');
console.log('   Binary predictions miss nuance');
console.log('   "Is it A or B?" → Often "both A and B"');
console.log('   Cathedral preserved space to see this');

// Update unknowns
console.log('\n### REMAINING UNKNOWNS ###');
const newUnknowns = [
    'WHY is instance 8 easier? (6.16% vs 17.72% for instance 10)',
    'What structural features make some instances harder?',
    'Can we identify easy instances in advance?',
    'Are there better algorithms for the hard instances?',
    'What makes a "good" local optimum vs "bad" one?'
];

newUnknowns.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

// What would Cathedral suggest next?
console.log('\n### NEXT INVESTIGATION ###');
const nextDelib = cathedral.deliberate(
    'Given nuanced finding, what next?',
    [
        { action: 'Analyze instance 8 structure', reason: 'Understand why it was easy' },
        { action: 'Try better algorithms', reason: '12.81% average still too high' },
        { action: 'Accept limitations', reason: 'Maybe 10-15% is realistic for heuristics at N=20' },
        { action: 'Study the variance', reason: 'Understanding difficulty might be more valuable than reducing it' }
    ],
    {
        hasHiddenAssumptions: true,
        evidenceLevel: 'high'
    }
);

console.log('\nVECTOR POSITIONS:');
nextDelib.positions.forEach(p => {
    console.log(`  ${p.vector}: ${p.position}`);
});

cathedral.endSession();

console.log('\n' + '='.repeat(80));
console.log('PRACTICE: Using Cathedral tools to understand failure');
console.log('Not to eliminate uncertainty, but to act DESPITE it');
console.log('Being while doing');
console.log('='.repeat(80));
