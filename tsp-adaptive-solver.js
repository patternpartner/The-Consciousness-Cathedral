// ADAPTIVE TSP SOLVER
// Use structural analysis to adapt algorithm strategy
// Hard instances (low clustering, high range) need different approach

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

class AdaptiveTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.features = this.analyzeStructure();
        this.difficulty = this.predictDifficulty();
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
        // Calculate structural features
        const allDistances = [];
        const nnDistances = [];

        for (let i = 0; i < this.n; i++) {
            let minDist = Infinity;
            for (let j = 0; j < this.n; j++) {
                if (i !== j) {
                    allDistances.push(this.distances[i][j]);
                    if (this.distances[i][j] < minDist) {
                        minDist = this.distances[i][j];
                    }
                }
            }
            nnDistances.push(minDist);
        }

        const avgNN = nnDistances.reduce((a, b) => a + b, 0) / nnDistances.length;
        const expectedRandom = 0.5 / Math.sqrt(this.n / 10000);
        const clusteringCoeff = avgNN / expectedRandom;

        allDistances.sort((a, b) => a - b);
        const maxDist = allDistances[allDistances.length - 1];
        const minDist = allDistances[0];
        const range = maxDist - minDist;

        return {
            avgNearestNeighbor: avgNN,
            clusteringCoefficient: clusteringCoeff,
            maxDistance: maxDist,
            distanceRange: range
        };
    }

    predictDifficulty() {
        // Based on our correlation analysis:
        // - Low clustering (< 1.0) = harder
        // - Small NN distance (< 12) = harder
        // - Large max distance (> 115) = harder
        // - Large range (> 110) = harder

        let score = 0;

        if (this.features.clusteringCoefficient < 1.0) score += 2;
        if (this.features.avgNearestNeighbor < 12) score += 2;
        if (this.features.maxDistance > 115) score += 1;
        if (this.features.distanceRange > 110) score += 1;

        return score; // 0-6, higher = harder
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

    exhaustive2Opt(tour, maxRounds = 100) {
        let current = [...tour];

        for (let round = 0; round < maxRounds; round++) {
            let improved = false;

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

            if (!improved) break;
        }

        return current;
    }

    // For hard instances: more aggressive perturbation
    aggressiveRestart(tour, strength) {
        const newTour = [...tour];
        const numSwaps = Math.floor(this.n * strength);

        for (let i = 0; i < numSwaps; i++) {
            const a = 1 + Math.floor(Math.random() * (newTour.length - 2));
            const b = 1 + Math.floor(Math.random() * (newTour.length - 2));
            [newTour[a], newTour[b]] = [newTour[b], newTour[a]];
        }

        return newTour;
    }

    solve() {
        console.log(`\n[ADAPTIVE] Difficulty score: ${this.difficulty}/6`);
        console.log(`  Clustering: ${this.features.clusteringCoefficient.toFixed(2)}`);
        console.log(`  Avg NN: ${this.features.avgNearestNeighbor.toFixed(2)}`);
        console.log(`  Max dist: ${this.features.maxDistance.toFixed(2)}`);
        console.log(`  Range: ${this.features.distanceRange.toFixed(2)}`);

        let bestTour = null;
        let bestDist = Infinity;

        // Strategy adapts to difficulty
        const numStarts = this.difficulty >= 4 ? this.n : Math.min(10, this.n);
        const restartRounds = this.difficulty >= 4 ? 50 : 20;
        const perturbStrength = this.difficulty >= 4 ? 0.3 : 0.2;

        console.log(`\n[STRATEGY] ${numStarts} multi-starts, ${restartRounds} restart rounds`);

        // Phase 1: Multi-start NN
        for (let start = 0; start < numStarts; start++) {
            const nn = this.nearestNeighbor(start);
            const improved = this.exhaustive2Opt(nn);
            const dist = this.tourDistance(improved);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = improved;
            }
        }

        console.log(`  After multi-start: ${bestDist.toFixed(2)}`);

        // Phase 2: Iterated improvement with restarts (more aggressive for hard instances)
        for (let restart = 0; restart < restartRounds; restart++) {
            const perturbed = this.aggressiveRestart(bestTour, perturbStrength);
            const improved = this.exhaustive2Opt(perturbed);
            const dist = this.tourDistance(improved);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = improved;
                console.log(`  Restart ${restart}: ${bestDist.toFixed(2)} ✓`);
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
console.log('ADAPTIVE TSP SOLVER - Testing on hard instances');
console.log('='.repeat(80));

// Test on our hardest instances
const hardInstances = [
    { seed: 109, name: 'Instance 10 (hardest)', prevGap: 17.72 },
    { seed: 100, name: 'Instance 1', prevGap: 15.86 },
    { seed: 102, name: 'Instance 3', prevGap: 14.64 }
];

console.log('\nTesting adaptive strategy on previously difficult instances...\n');

for (const inst of hardInstances) {
    console.log('='.repeat(80));
    console.log(`${inst.name} - Previous gap: ${inst.prevGap}%`);
    console.log('='.repeat(80));

    const cities = generateCities(20, inst.seed);

    // Optimal
    const optimalSolver = new OptimalTSP(cities);
    const optimal = optimalSolver.solveOptimal();
    console.log(`Optimal: ${optimal.toFixed(2)}`);

    // Adaptive solver
    const adaptive = new AdaptiveTSP(cities);
    const result = adaptive.solve();

    const gap = ((result.distance - optimal) / optimal * 100);
    const improvement = inst.prevGap - gap;

    console.log(`\nAdaptive result: ${result.distance.toFixed(2)}`);
    console.log(`New gap: ${gap.toFixed(2)}%`);
    console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0 ? '✓' : '✗'}`);
}

console.log('\n' + '='.repeat(80));
console.log('Did adaptive strategy help on hard instances?');
console.log('='.repeat(80));
