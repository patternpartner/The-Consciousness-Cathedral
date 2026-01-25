// INVESTIGATING INSTANCE 5
// Only instance where synthesis beat baseline (1.11% improvement)
// What's structurally different? Why did synthesis help here but nowhere else?

class TSPAnalyzer {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
    }

    calculateDistances() {
        const n = this.n;
        const dist = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const [x1, y1] = this.cities[i];
                    const [x2, y2] = this.cities[j];
                    dist[i][j] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                }
            }
        }
        return dist;
    }

    analyzeStructure() {
        // Calculate features
        const nnDistances = [];
        for (let i = 0; i < this.n; i++) {
            let minDist = Infinity;
            for (let j = 0; j < this.n; j++) {
                if (i !== j && this.distances[i][j] < minDist) {
                    minDist = this.distances[i][j];
                }
            }
            nnDistances.push(minDist);
        }

        const avgNN = nnDistances.reduce((a, b) => a + b, 0) / nnDistances.length;
        const expectedRandom = 0.5 / Math.sqrt(this.n / 10000);
        const clusteringCoeff = avgNN / expectedRandom;

        const allDist = [];
        for (let i = 0; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                allDist.push(this.distances[i][j]);
            }
        }
        allDist.sort((a, b) => a - b);

        const maxDist = allDist[allDist.length - 1];
        const minDist = allDist[0];
        const range = maxDist - minDist;
        const median = allDist[Math.floor(allDist.length / 2)];

        const mean = allDist.reduce((a, b) => a + b, 0) / allDist.length;
        const variance = allDist.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / allDist.length;
        const stdDev = Math.sqrt(variance);

        return {
            avgNN,
            clusteringCoeff,
            maxDist,
            minDist,
            range,
            median,
            stdDev,
            nnStdDev: Math.sqrt(nnDistances.reduce((sum, x) => sum + Math.pow(x - avgNN, 2), 0) / nnDistances.length)
        };
    }
}

function generateCities(n, seed) {
    let x = Math.sin(seed) * 10000;
    const rand = () => {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
    };

    const cities = [];
    for (let i = 0; i < n; i++) {
        cities.push([rand() * 100, rand() * 100]);
    }
    return cities;
}

console.log('='.repeat(80));
console.log('INVESTIGATING INSTANCE 5');
console.log('Why did synthesis help here but nowhere else?');
console.log('='.repeat(80));

const instances = [
    { seed: 100, name: 'Instance 1', synthesisWon: false },
    { seed: 101, name: 'Instance 2', synthesisWon: false },
    { seed: 103, name: 'Instance 4', synthesisWon: false },
    { seed: 104, name: 'Instance 5', synthesisWon: true },
    { seed: 107, name: 'Instance 8', synthesisWon: false },
    { seed: 109, name: 'Instance 10', synthesisWon: false }
];

console.log('\nStructural features comparison:\n');

const features = [];

for (const inst of instances) {
    const cities = generateCities(20, inst.seed);
    const analyzer = new TSPAnalyzer(cities);
    const structure = analyzer.analyzeStructure();

    features.push({
        name: inst.name,
        won: inst.synthesisWon,
        ...structure
    });
}

// Display in table format
console.log('Instance'.padEnd(15) +
           'Won?'.padEnd(8) +
           'Clustering'.padEnd(12) +
           'AvgNN'.padEnd(10) +
           'MaxDist'.padEnd(10) +
           'Range'.padEnd(10) +
           'StdDev'.padEnd(10));
console.log('-'.repeat(80));

for (const f of features) {
    console.log(
        f.name.padEnd(15) +
        (f.won ? 'YES' : 'no').padEnd(8) +
        f.clusteringCoeff.toFixed(2).padEnd(12) +
        f.avgNN.toFixed(2).padEnd(10) +
        f.maxDist.toFixed(2).padEnd(10) +
        f.range.toFixed(2).padEnd(10) +
        f.stdDev.toFixed(2).padEnd(10)
    );
}

// Find what's unique about Instance 5
console.log('\n' + '='.repeat(80));
console.log('INSTANCE 5 CHARACTERISTICS');
console.log('='.repeat(80));

const inst5 = features.find(f => f.won);
const others = features.filter(f => !f.won);

console.log('\nComparing Instance 5 to others:');

const metrics = ['clusteringCoeff', 'avgNN', 'maxDist', 'range', 'stdDev', 'nnStdDev'];

for (const metric of metrics) {
    const inst5Val = inst5[metric];
    const othersVals = others.map(f => f[metric]);
    const avg = othersVals.reduce((a, b) => a + b, 0) / othersVals.length;
    const min = Math.min(...othersVals);
    const max = Math.max(...othersVals);

    const isUnique = inst5Val < min || inst5Val > max;
    const percentile = othersVals.filter(v => v < inst5Val).length / othersVals.length * 100;

    console.log(`\n${metric}:`);
    console.log(`  Instance 5: ${inst5Val.toFixed(2)}`);
    console.log(`  Others: ${min.toFixed(2)} - ${max.toFixed(2)} (avg: ${avg.toFixed(2)})`);
    console.log(`  Percentile: ${percentile.toFixed(0)}%`);
    if (isUnique) {
        console.log(`  ⚠ OUTLIER: ${inst5Val < min ? 'Lower' : 'Higher'} than all others`);
    }
}

console.log('\n' + '='.repeat(80));
console.log('HYPOTHESIS');
console.log('='.repeat(80));

console.log('\nInstance 5 might have structural features that make it more amenable');
console.log('to spectral clustering or chaos exploration compared to simple NN+2opt.');
console.log('\nPossible explanations:');
console.log('  - Moderate clustering (not too high, not too low)');
console.log('  - Specific distance distribution that spectral methods exploit');
console.log('  - Multiple "almost-equal" local optima that chaos helps escape');

console.log('\n' + '='.repeat(80));
