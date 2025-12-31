// TESTING HYPOTHESIS: Is 13.8% gap consistent across instances?
// Or did we get unlucky with a particularly hard instance?

class OptimalTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.memo = new Map();
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

    solveOptimal() {
        const start = 0;
        const allVisited = (1 << this.n) - 1;
        const withoutStart = allVisited ^ (1 << start);

        let minDist = Infinity;
        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;
            const dist = this.tsp(withoutStart ^ (1 << last), last, start) +
                        this.distances[last][start];
            minDist = Math.min(minDist, dist);
        }

        return minDist;
    }

    tsp(mask, pos, start) {
        if (mask === 0) return 0;
        const key = `${mask},${pos}`;
        if (this.memo.has(key)) return this.memo.get(key);

        let minDist = Infinity;
        for (let next = 0; next < this.n; next++) {
            if (next === start) continue;
            if ((mask & (1 << next)) === 0) continue;
            const newMask = mask ^ (1 << next);
            const dist = this.distances[pos][next] + this.tsp(newMask, next, start);
            minDist = Math.min(minDist, dist);
        }

        this.memo.set(key, minDist);
        return minDist;
    }
}

class HeuristicTSP {
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

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }

    nearestNeighbor(start) {
        const visited = new Set([start]);
        const tour = [start];
        let current = start;

        while (visited.size < this.n) {
            let nearest = -1;
            let minDist = Infinity;

            for (let i = 0; i < this.n; i++) {
                if (!visited.has(i) && this.distances[current][i] < minDist) {
                    minDist = this.distances[current][i];
                    nearest = i;
                }
            }

            visited.add(nearest);
            tour.push(nearest);
            current = nearest;
        }

        tour.push(start);
        return tour;
    }

    exhaustive2Opt(tour) {
        let current = [...tour];
        let improved = true;

        while (improved) {
            improved = false;
            for (let i = 1; i < current.length - 2; i++) {
                for (let j = i + 1; j < current.length - 1; j++) {
                    const a = current[i - 1], b = current[i];
                    const c = current[j], d = current[j + 1];

                    const oldDist = this.distances[a][b] + this.distances[c][d];
                    const newDist = this.distances[a][c] + this.distances[b][d];

                    if (newDist < oldDist - 0.0001) {
                        const segment = current.slice(i, j + 1).reverse();
                        current.splice(i, j - i + 1, ...segment);
                        improved = true;
                    }
                }
            }
        }

        return current;
    }

    solve() {
        // Multi-start NN + 2-opt
        let bestTour = null;
        let bestDist = Infinity;

        for (let start = 0; start < this.n; start++) {
            const nn = this.nearestNeighbor(start);
            const improved = this.exhaustive2Opt(nn);
            const dist = this.tourDistance(improved);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = improved;
            }
        }

        return { tour: bestTour, distance: bestDist };
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
console.log('MULTI-INSTANCE TEST: Is 13.8% gap consistent?');
console.log('='.repeat(80));

const numInstances = 10;
const n = 20;
const results = [];

console.log(`\nTesting ${numInstances} different 20-city instances...\n`);

for (let i = 0; i < numInstances; i++) {
    const seed = 100 + i;
    const cities = generateCities(n, seed);

    // Compute optimal
    process.stdout.write(`Instance ${i + 1}: Computing optimal... `);
    const optimalSolver = new OptimalTSP(cities);
    const optimal = optimalSolver.solveOptimal();
    process.stdout.write(`✓ ${optimal.toFixed(2)} | `);

    // Compute heuristic
    process.stdout.write(`Heuristic... `);
    const heuristicSolver = new HeuristicTSP(cities);
    const heuristic = heuristicSolver.solve();
    process.stdout.write(`✓ ${heuristic.distance.toFixed(2)} | `);

    // Calculate gap
    const gap = ((heuristic.distance - optimal) / optimal * 100);
    process.stdout.write(`Gap: ${gap.toFixed(2)}%\n`);

    results.push({ seed, optimal, heuristic: heuristic.distance, gap });
}

console.log('\n' + '='.repeat(80));
console.log('RESULTS');
console.log('='.repeat(80));

const gaps = results.map(r => r.gap);
const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
const minGap = Math.min(...gaps);
const maxGap = Math.max(...gaps);
const stdDev = Math.sqrt(
    gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length
);

console.log(`\nOptimality Gap Statistics:`);
console.log(`  Average:  ${avgGap.toFixed(2)}%`);
console.log(`  Min:      ${minGap.toFixed(2)}%`);
console.log(`  Max:      ${maxGap.toFixed(2)}%`);
console.log(`  Std Dev:  ${stdDev.toFixed(2)}%`);

console.log(`\nDistribution:`);
const below1 = gaps.filter(g => g < 1.0).length;
const below2 = gaps.filter(g => g < 2.0).length;
const below5 = gaps.filter(g => g < 5.0).length;
const below10 = gaps.filter(g => g < 10.0).length;
const above10 = gaps.filter(g => g >= 10.0).length;

console.log(`  <1%:   ${below1}/${numInstances}`);
console.log(`  <2%:   ${below2}/${numInstances}`);
console.log(`  <5%:   ${below5}/${numInstances}`);
console.log(`  <10%:  ${below10}/${numInstances}`);
console.log(`  ≥10%:  ${above10}/${numInstances}`);

console.log('\n' + '='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80));

if (stdDev < 2.0) {
    console.log('\n✗ CONSISTENT GAP: Standard deviation is low');
    console.log('  → Our 13.8% result was NOT due to unlucky instance');
    console.log('  → Algorithms genuinely struggle at N=20');
    console.log('  → Need better escape mechanisms from local optima');
} else {
    console.log('\n✓ VARIABLE GAP: Standard deviation is high');
    console.log('  → Some instances much easier than others');
    console.log('  → Our 13.8% might have been particularly hard instance');
    console.log('  → Average performance is better than single-instance suggested');
}

if (avgGap < 1.0) {
    console.log('\n✓✓✓ SUCCESS: Average gap <1% - algorithms are actually good!');
} else if (avgGap < 5.0) {
    console.log('\n✓ DECENT: Average gap <5% - algorithms work reasonably well');
} else {
    console.log('\n✗ STRUGGLING: Average gap >5% - algorithms need improvement');
}

console.log('='.repeat(80));
