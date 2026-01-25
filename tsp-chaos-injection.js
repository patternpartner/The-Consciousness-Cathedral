// CHAOS INJECTION FOR TSP
// Grok perspective: In a uniform field, gentle tending is useless
// Increase kinetic energy until the liquid state is reached

class ChaosTSP {
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

    twoOpt(tour) {
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

    // MASSIVE k-opt mutation (k >> 2)
    // Teleport to entirely different region of solution space
    macroMutation(tour, k = 10) {
        const newTour = [...tour];
        const n = newTour.length - 1; // excluding duplicate start/end

        // Perform k random segment reversals
        for (let mutation = 0; mutation < k; mutation++) {
            const i = 1 + Math.floor(Math.random() * (n - 2));
            const j = i + 1 + Math.floor(Math.random() * (n - i - 1));

            if (i < j && j < n) {
                const segment = newTour.slice(i, j + 1).reverse();
                newTour.splice(i, j - i + 1, ...segment);
            }
        }

        return newTour;
    }

    // Simulated Tempering with non-linear cooling
    // High temperature = accept worse solutions (liquid state)
    // Low temperature = only accept better (solid state)
    simulatedTempering(initialTour, tempMax = 1000, tempMin = 0.01, alpha = 0.99, maxIter = 5000) {
        let current = [...initialTour];
        let currentDist = this.tourDistance(current);

        let best = [...current];
        let bestDist = currentDist;

        let temp = tempMax;
        let acceptedWorse = 0;
        let totalMutations = 0;

        console.log(`  [TEMPERING] T_max=${tempMax}, cooling α=${alpha}`);

        for (let iter = 0; iter < maxIter; iter++) {
            // Adaptive mutation strength based on temperature
            // High temp = massive mutations (k=15)
            // Low temp = gentle mutations (k=3)
            const k = Math.ceil(3 + 12 * (temp / tempMax));

            const mutated = this.macroMutation(current, k);
            const mutatedDist = this.tourDistance(mutated);

            const delta = mutatedDist - currentDist;

            // Accept if better OR probabilistically if worse
            const acceptProb = delta < 0 ? 1.0 : Math.exp(-delta / temp);

            if (Math.random() < acceptProb) {
                current = mutated;
                currentDist = mutatedDist;
                totalMutations++;

                if (delta >= 0) {
                    acceptedWorse++;
                }

                if (currentDist < bestDist) {
                    best = [...current];
                    bestDist = currentDist;
                    console.log(`    Iter ${iter}: ${bestDist.toFixed(2)} (T=${temp.toFixed(1)}, k=${k})`);
                }
            }

            // Cool down
            temp *= alpha;
            if (temp < tempMin) break;
        }

        console.log(`  [TEMPERING] Accepted ${acceptedWorse} uphill moves (${(acceptedWorse/totalMutations*100).toFixed(1)}%)`);

        return { tour: best, distance: bestDist };
    }

    // Multiple independent tempering runs (parallel universes)
    parallelTempering(numRuns = 5) {
        console.log(`\n[CHAOS] Running ${numRuns} parallel tempering chains...`);

        const results = [];

        for (let run = 0; run < numRuns; run++) {
            console.log(`\n  Chain ${run + 1}/${numRuns}:`);

            // Start from different random starting point
            const start = Math.floor(Math.random() * this.n);
            const initial = this.nearestNeighbor(start);
            const improved = this.twoOpt(initial);

            // Different temperature schedules for each chain
            const tempMax = 500 + Math.random() * 1000;
            const alpha = 0.95 + Math.random() * 0.04; // 0.95-0.99

            const result = this.simulatedTempering(improved, tempMax, 0.01, alpha, 1000);
            results.push(result);
        }

        // Find best across all chains
        const best = results.reduce((a, b) => a.distance < b.distance ? a : b);

        console.log(`\n[CHAOS] Best across ${numRuns} chains: ${best.distance.toFixed(2)}`);

        return best;
    }

    solve() {
        // Start with multi-start NN + 2-opt baseline
        console.log('\n[BASELINE] Multi-start NN + 2-opt...');
        let bestBaseline = null;
        let bestBaselineDist = Infinity;

        for (let start = 0; start < this.n; start++) {
            const nn = this.nearestNeighbor(start);
            const improved = this.twoOpt(nn);
            const dist = this.tourDistance(improved);

            if (dist < bestBaselineDist) {
                bestBaselineDist = dist;
                bestBaseline = improved;
            }
        }

        console.log(`[BASELINE] Best: ${bestBaselineDist.toFixed(2)}`);

        // Apply chaos injection
        const chaosResult = this.parallelTempering(5);

        // Final 2-opt polish
        console.log('\n[POLISH] Final 2-opt...');
        const polished = this.twoOpt(chaosResult.tour);
        const finalDist = this.tourDistance(polished);

        console.log(`[POLISH] Final: ${finalDist.toFixed(2)}`);

        return { tour: polished, distance: finalDist, baseline: bestBaselineDist };
    }
}

// Test helpers
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
console.log('CHAOS INJECTION TSP - Grok Perspective');
console.log('Massive k-opt mutations + simulated tempering');
console.log('Treating search as gas, not solid');
console.log('='.repeat(80));

// Test on hardest instance
const hardInstance = { seed: 109, name: 'Instance 10 (hardest)', prevGap: 17.72 };

console.log(`\nTesting on ${hardInstance.name} - Previous gap: ${hardInstance.prevGap}%`);
console.log('='.repeat(80));

const cities = generateCities(20, hardInstance.seed);

// Compute optimal
console.log('\n[COMPUTING OPTIMAL]');
const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();
console.log(`Optimal: ${optimal.toFixed(2)}`);

// Chaos approach
const chaos = new ChaosTSP(cities);
const result = chaos.solve();

const gap = ((result.distance - optimal) / optimal * 100);
const improvement = hardInstance.prevGap - gap;

console.log(`\n${'='.repeat(80)}`);
console.log('RESULT');
console.log('='.repeat(80));
console.log(`Baseline (NN+2opt): ${result.baseline.toFixed(2)} (${((result.baseline - optimal) / optimal * 100).toFixed(2)}%)`);
console.log(`After chaos:        ${result.distance.toFixed(2)} (${gap.toFixed(2)}%)`);
console.log(`Improvement:        ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0 ? '✓' : '✗'}`);

if (improvement > 2.0) {
    console.log('\n✓✓ CHAOS BREAKTHROUGH: High kinetic energy found escape!');
} else if (improvement > 0.5) {
    console.log('\n✓ Modest improvement from chaos injection');
} else {
    console.log('\n✗ Chaos didn\'t significantly help');
}

console.log('='.repeat(80));
