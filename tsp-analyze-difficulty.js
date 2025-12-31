// ANALYZING INSTANCE DIFFICULTY
// Why was instance 8 so much easier than instance 10?
// Can we identify structural features that predict difficulty?

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

    // Measure spatial structure
    analyzeStructure() {
        const features = {};

        // 1. Clustering: Are cities clustered or spread out?
        features.avgNearestNeighborDist = this.avgNearestNeighbor();
        features.clusteringCoefficient = this.clusteringCoefficient();

        // 2. Convexity: Are cities in convex hull or scattered inside?
        features.convexHullRatio = this.convexHullRatio();

        // 3. Distance distribution
        const allDistances = [];
        for (let i = 0; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                allDistances.push(this.distances[i][j]);
            }
        }
        allDistances.sort((a, b) => a - b);

        features.minDistance = allDistances[0];
        features.maxDistance = allDistances[allDistances.length - 1];
        features.medianDistance = allDistances[Math.floor(allDistances.length / 2)];
        features.distanceRange = features.maxDistance - features.minDistance;
        features.distanceStdDev = this.stdDev(allDistances);

        // 4. Regularity: How regular is the spacing?
        features.spacingRegularity = this.spacingRegularity();

        // 5. Crossings potential: How many edge crossings likely?
        features.crossingDensity = this.estimateCrossingDensity();

        return features;
    }

    avgNearestNeighbor() {
        let sum = 0;
        for (let i = 0; i < this.n; i++) {
            let minDist = Infinity;
            for (let j = 0; j < this.n; j++) {
                if (i !== j && this.distances[i][j] < minDist) {
                    minDist = this.distances[i][j];
                }
            }
            sum += minDist;
        }
        return sum / this.n;
    }

    clusteringCoefficient() {
        // How clustered are the points?
        // Compare actual distances to random uniform distribution
        const actualAvg = this.avgNearestNeighbor();
        const expectedRandom = 0.5 / Math.sqrt(this.n / 10000); // for 100x100 area
        return actualAvg / expectedRandom;
    }

    convexHullRatio() {
        // Ratio of cities on convex hull to total cities
        const hull = this.convexHull();
        return hull.length / this.n;
    }

    convexHull() {
        // Simple gift wrapping algorithm
        const points = this.cities.map((c, i) => ({ x: c[0], y: c[1], index: i }));

        // Find leftmost point
        let leftmost = points[0];
        for (const p of points) {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) {
                leftmost = p;
            }
        }

        const hull = [];
        let current = leftmost;

        do {
            hull.push(current);
            let next = points[0];

            for (const p of points) {
                if (p === current) continue;

                const cross = (next.x - current.x) * (p.y - current.y) -
                             (next.y - current.y) * (p.x - current.x);

                if (next === current || cross < 0 ||
                    (cross === 0 && this.dist2d(current, p) > this.dist2d(current, next))) {
                    next = p;
                }
            }

            current = next;
        } while (current !== leftmost && hull.length < this.n);

        return hull;
    }

    dist2d(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    spacingRegularity() {
        // How regular is the spacing between cities?
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

        const mean = nnDistances.reduce((a, b) => a + b, 0) / nnDistances.length;
        const stdDev = this.stdDev(nnDistances);

        // Lower coefficient of variation = more regular
        return stdDev / mean;
    }

    estimateCrossingDensity() {
        // Sample some edges and estimate crossing density
        let crossings = 0;
        let samples = 0;

        for (let i = 0; i < Math.min(this.n, 10); i++) {
            for (let j = i + 1; j < Math.min(this.n, 10); j++) {
                for (let k = 0; k < Math.min(this.n, 10); k++) {
                    for (let l = k + 1; l < Math.min(this.n, 10); l++) {
                        if (this.edgesCross(i, j, k, l)) {
                            crossings++;
                        }
                        samples++;
                    }
                }
            }
        }

        return crossings / samples;
    }

    edgesCross(i, j, k, l) {
        const p1 = this.cities[i];
        const p2 = this.cities[j];
        const p3 = this.cities[k];
        const p4 = this.cities[l];

        const ccw = (A, B, C) => {
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
        };

        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
               ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }

    stdDev(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
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
console.log('ANALYZING INSTANCE DIFFICULTY');
console.log('Why is instance 8 easier than instance 10?');
console.log('='.repeat(80));

// Analyze all instances from our test
const instanceData = [
    { seed: 100, gap: 15.86, name: 'Instance 1' },
    { seed: 101, gap: 13.83, name: 'Instance 2' },
    { seed: 102, gap: 14.64, name: 'Instance 3' },
    { seed: 103, gap: 12.18, name: 'Instance 4' },
    { seed: 104, gap: 10.70, name: 'Instance 5' },
    { seed: 105, gap: 13.08, name: 'Instance 6' },
    { seed: 106, gap: 10.76, name: 'Instance 7' },
    { seed: 107, gap: 6.16, name: 'Instance 8 (EASIEST)' },
    { seed: 108, gap: 13.21, name: 'Instance 9' },
    { seed: 109, gap: 17.72, name: 'Instance 10 (HARDEST)' }
];

console.log('\nAnalyzing structural features of all instances...\n');

const results = [];

for (const inst of instanceData) {
    const cities = generateCities(20, inst.seed);
    const analyzer = new TSPAnalyzer(cities);
    const features = analyzer.analyzeStructure();

    results.push({
        ...inst,
        ...features
    });
}

// Print comparison
console.log('EASIEST vs HARDEST Instance Features:');
console.log('='.repeat(80));

const easiest = results.find(r => r.gap === 6.16);
const hardest = results.find(r => r.gap === 17.72);

console.log('\n                              EASIEST (6.16%)    HARDEST (17.72%)    Ratio');
console.log('-'.repeat(80));

const metrics = [
    'avgNearestNeighborDist',
    'clusteringCoefficient',
    'convexHullRatio',
    'minDistance',
    'maxDistance',
    'medianDistance',
    'distanceRange',
    'distanceStdDev',
    'spacingRegularity',
    'crossingDensity'
];

for (const metric of metrics) {
    const easyVal = easiest[metric];
    const hardVal = hardest[metric];
    const ratio = (easyVal / hardVal).toFixed(2);

    console.log(`${metric.padEnd(28)} ${easyVal.toFixed(2).padStart(10)}    ${hardVal.toFixed(2).padStart(10)}    ${ratio.padStart(6)}`);
}

// Correlation analysis
console.log('\n\n='.repeat(80));
console.log('CORRELATION: Feature vs Difficulty (gap)');
console.log('='.repeat(80));

const correlations = [];

for (const metric of metrics) {
    const gaps = results.map(r => r.gap);
    const values = results.map(r => r[metric]);

    const corr = pearsonCorrelation(gaps, values);
    correlations.push({ metric, correlation: corr });
}

correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

console.log('\nFeature                       Correlation    Interpretation');
console.log('-'.repeat(80));

for (const { metric, correlation } of correlations) {
    const sign = correlation > 0 ? '+' : '';
    const strength = Math.abs(correlation) > 0.7 ? 'STRONG' :
                     Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
    const direction = correlation > 0 ? 'harder' : 'easier';

    console.log(`${metric.padEnd(28)} ${(sign + correlation.toFixed(3)).padStart(10)}    ${strength} - higher = ${direction}`);
}

function pearsonCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return numerator / denominator;
}

console.log('\n\n='.repeat(80));
console.log('INSIGHTS');
console.log('='.repeat(80));

const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.5);

if (strongCorrelations.length > 0) {
    console.log('\nStrong predictors of difficulty found:');
    for (const { metric, correlation } of strongCorrelations) {
        const direction = correlation > 0 ? 'increases' : 'decreases';
        console.log(`  • ${metric}: ${direction} difficulty (r=${correlation.toFixed(3)})`);
    }
} else {
    console.log('\nNo strong correlations found.');
    console.log('Difficulty may be emergent from complex interaction of features.');
}

console.log('\n' + '='.repeat(80));
