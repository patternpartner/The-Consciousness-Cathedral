// EXAMINING FAILURE: Why can't we break through on 20 cities?
// Using Cathedral to understand the problem, not just attack it

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

console.log('='.repeat(80));
console.log('EXAMINING TSP FAILURE - Cathedral Analysis');
console.log('='.repeat(80));

const cathedral = new CathedralV30();
const session = cathedral.beginSession('tsp-failure-analysis', 'Understanding why algorithms fail');

// What we know
console.log('\n### KNOWN FACTS ###');
console.log('✓ 15 cities: 0.55% from optimal (algorithms work)');
console.log('✗ 20 cities: 13.8% from optimal (algorithms fail)');
console.log('✗ Tried: 2-opt, 3-opt, ILS, VNS, Lin-Kernighan');
console.log('✗ Symptom: Stuck in local optima');

// What we don't know
console.log('\n### UNKNOWNS ###');
const unknowns = [
    'What structural difference exists between 15 and 20 city instances?',
    'Why do local optima become more problematic at N=20?',
    'What is the ACTUAL optimal tour structure for our 20-city test case?',
    'Are we measuring the right thing? (Maybe our "optimal" calculation is wrong)',
    'What if the problem isn\'t the algorithms but the test instance?'
];

unknowns.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

// Parliament deliberates
console.log('\n### PARLIAMENT DELIBERATION ###');
const delib = cathedral.deliberate(
    'Why are we stuck at 13.8% gap on 20 cities?',
    [
        {
            hypothesis: 'Algorithms are inadequate',
            action: 'Try more sophisticated algorithms',
            assumption: 'Better algorithms will break through'
        },
        {
            hypothesis: 'Test instance is deceptive',
            action: 'Generate and test multiple instances',
            assumption: 'Single instance might be misleading'
        },
        {
            hypothesis: 'Optimal calculation is wrong',
            action: 'Verify Held-Karp implementation',
            assumption: 'Ground truth might be incorrect'
        },
        {
            hypothesis: 'Local optima structure at N=20',
            action: 'Study the fitness landscape',
            assumption: 'Problem difficulty increases non-linearly'
        }
    ],
    {
        hasHiddenAssumptions: true,
        evidenceLevel: 'medium',
        humanImpact: false
    }
);

console.log('\nVECTOR POSITIONS:');
delib.positions.forEach(p => {
    console.log(`  ${p.vector}: ${p.position}`);
});

// Forced choice despite uncertainty
console.log('\n### FORCED CHOICE ###');
const zone = cathedral.decide(
    'next-investigation',
    [
        'Verify optimal calculation is correct',
        'Test multiple instances to see if 13.8% is consistent',
        'Analyze the specific tour structure we\'re stuck in'
    ],
    unknowns
);

const choice = cathedral.commit(
    'next-investigation',
    'Test multiple instances to see if 13.8% is consistent',
    'Choosing "Test multiple instances" because:\n' +
    '  1. Contrarian vector questions single-instance testing\n' +
    '  2. Practical vector needs data before theory\n' +
    '  3. If 13.8% is consistent, problem is real\n' +
    '  4. If 13.8% varies, our instance is deceptive',
    unknowns
);

console.log(`Choice: ${choice.choice}`);
console.log(`Reasoning:\n${choice.reasoning}`);

// Predict consequences
console.log('\n### PREDICTIONS ###');
console.log('If multiple instances show similar gaps:');
console.log('  → Algorithms genuinely inadequate at N=20');
console.log('  → Need better escape mechanisms');
console.log('');
console.log('If multiple instances show varied gaps:');
console.log('  → Our test instance is particularly hard');
console.log('  → Single instance testing was misleading');
console.log('  → Average performance might be better');

cathedral.endSession();

console.log('\n' + '='.repeat(80));
console.log('NEXT: Actually run multiple instances to test hypothesis');
console.log('='.repeat(80));
