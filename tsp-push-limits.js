// PUSHING THE LIMITS
// Focus: Get 20 cities under 1% from optimal
// Strategy: More sophisticated algorithms, longer runtime

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

class TSPLimitPusher {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.bestEver = { tour: null, distance: Infinity };
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

    updateBest(tour, distance, method) {
        if (distance < this.bestEver.distance) {
            const improvement = this.bestEver.distance === Infinity ? 0 :
                ((this.bestEver.distance - distance) / this.bestEver.distance * 100);

            this.bestEver = { tour: [...tour], distance };

            if (improvement > 0) {
                console.log(`  ✓ ${distance.toFixed(4)} from ${method} (↓${improvement.toFixed(2)}%)`);
            } else {
                console.log(`  ✓ ${distance.toFixed(4)} from ${method}`);
            }
            return true;
        }
        return false;
    }

    // Exhaustive 2-opt (don't stop at local optimum)
    exhaustive2Opt(tour) {
        let current = [...tour];
        let totalIterations = 0;
        let totalSwaps = 0;

        for (let round = 0; round < 100; round++) {
            let swaps = 0;

            for (let i = 1; i < current.length - 2; i++) {
                for (let j = i + 1; j < current.length - 1; j++) {
                    const a = current[i - 1], b = current[i];
                    const c = current[j], d = current[j + 1];

                    const oldDist = this.distances[a][b] + this.distances[c][d];
                    const newDist = this.distances[a][c] + this.distances[b][d];

                    if (newDist < oldDist - 0.0001) {
                        // Reverse segment
                        const segment = current.slice(i, j + 1).reverse();
                        current.splice(i, j - i + 1, ...segment);
                        swaps++;
                    }
                }
            }

            totalIterations++;
            totalSwaps += swaps;

            if (swaps === 0) break; // No more improvements
        }

        return { tour: current, distance: this.tourDistance(current), totalIterations, totalSwaps };
    }

    // Aggressive 3-opt
    aggressive3Opt(tour, maxIterations = 500) {
        let current = [...tour];
        let totalSwaps = 0;

        for (let iter = 0; iter < maxIterations; iter++) {
            let improved = false;

            for (let i = 1; i < current.length - 3; i++) {
                for (let j = i + 1; j < current.length - 2; j++) {
                    for (let k = j + 1; k < current.length - 1; k++) {
                        const s1 = current.slice(0, i);
                        const s2 = current.slice(i, j);
                        const s3 = current.slice(j, k);
                        const s4 = current.slice(k);

                        const options = [
                            [...s1, ...s2, ...s3, ...s4],
                            [...s1, ...s2.reverse(), ...s3, ...s4],
                            [...s1, ...s2, ...s3.reverse(), ...s4],
                            [...s1, ...s3, ...s2, ...s4],
                            [...s1, ...s3.reverse(), ...s2, ...s4],
                            [...s1, ...s2.reverse(), ...s3.reverse(), ...s4],
                            [...s1, ...s3, ...s2.reverse(), ...s4],
                            [...s1, ...s3.reverse(), ...s2.reverse(), ...s4]
                        ];

                        const currentDist = this.tourDistance(current);
                        let bestOpt = current;
                        let bestDist = currentDist;

                        for (const opt of options) {
                            const dist = this.tourDistance(opt);
                            if (dist < bestDist - 0.0001) {
                                bestDist = dist;
                                bestOpt = opt;
                            }
                        }

                        if (bestDist < currentDist - 0.0001) {
                            current = bestOpt;
                            improved = true;
                            totalSwaps++;
                        }
                    }
                }
            }

            if (!improved) break;
        }

        return { tour: current, distance: this.tourDistance(current), totalSwaps };
    }

    // Iterated Local Search: escape local optima by perturbation
    iteratedLocalSearch(initialTour, iterations = 50) {
        console.log(`  [ILS] Iterated Local Search (${iterations} iterations)...`);

        let bestTour = [...initialTour];
        let bestDist = this.tourDistance(bestTour);
        let current = [...initialTour];
        let improvements = 0;

        for (let iter = 0; iter < iterations; iter++) {
            // Local search
            const ls = this.exhaustive2Opt(current);
            current = ls.tour;
            const currentDist = this.tourDistance(current);

            // Update best
            if (currentDist < bestDist) {
                bestTour = [...current];
                bestDist = currentDist;
                improvements++;
            }

            // Perturbation: random 4-opt kick
            current = this.perturb(current, 4);
        }

        console.log(`  [ILS] ${improvements} improvements found`);
        return { tour: bestTour, distance: bestDist };
    }

    perturb(tour, strength = 4) {
        const newTour = [...tour];

        // Random 4-exchange
        for (let i = 0; i < strength; i++) {
            const a = 1 + Math.floor(Math.random() * (newTour.length - 2));
            const b = 1 + Math.floor(Math.random() * (newTour.length - 2));
            [newTour[a], newTour[b]] = [newTour[b], newTour[a]];
        }

        return newTour;
    }

    // Variable Neighborhood Search
    variableNeighborhoodSearch(initialTour) {
        console.log(`  [VNS] Variable Neighborhood Search...`);

        let current = [...initialTour];
        let improvements = 0;

        for (let k = 2; k <= 4; k++) {
            let improved = true;

            while (improved) {
                improved = false;

                if (k === 2) {
                    const result = this.exhaustive2Opt(current);
                    if (result.distance < this.tourDistance(current) - 0.001) {
                        current = result.tour;
                        improved = true;
                        improvements++;
                    }
                } else if (k === 3) {
                    const result = this.aggressive3Opt(current, 100);
                    if (result.distance < this.tourDistance(current) - 0.001) {
                        current = result.tour;
                        improved = true;
                        improvements++;
                    }
                } else if (k === 4) {
                    // Random kick + 2-opt
                    const perturbed = this.perturb(current, 3);
                    const result = this.exhaustive2Opt(perturbed);
                    if (result.distance < this.tourDistance(current) - 0.001) {
                        current = result.tour;
                        improved = true;
                        improvements++;
                    }
                }
            }
        }

        console.log(`  [VNS] ${improvements} total improvements`);
        return { tour: current, distance: this.tourDistance(current) };
    }

    solve() {
        console.log('='.repeat(80));
        console.log('PUSHING THE LIMITS');
        console.log(`${this.n} cities - Goal: <1% from optimal`);
        console.log('='.repeat(80));

        const startTime = Date.now();

        // Phase 1: Best construction heuristic
        console.log('\n[1] Best Initial Solution');
        for (let start = 0; start < this.n; start++) {
            const tour = this.nearestNeighbor(start);
            this.updateBest(tour, this.tourDistance(tour), `NN-${start}`);
        }

        // Phase 2: Exhaustive 2-opt
        console.log('\n[2] Exhaustive 2-Opt');
        const twoOpt = this.exhaustive2Opt(this.bestEver.tour);
        this.updateBest(twoOpt.tour, twoOpt.distance, `2-Opt (${twoOpt.totalSwaps} swaps)`);

        // Phase 3: Aggressive 3-opt
        console.log('\n[3] Aggressive 3-Opt');
        const threeOpt = this.aggressive3Opt(this.bestEver.tour, 500);
        this.updateBest(threeOpt.tour, threeOpt.distance, `3-Opt (${threeOpt.totalSwaps} swaps)`);

        // Phase 4: Iterated Local Search
        console.log('\n[4] Iterated Local Search');
        const ils = this.iteratedLocalSearch(this.bestEver.tour, 100);
        this.updateBest(ils.tour, ils.distance, 'ILS');

        // Phase 5: Variable Neighborhood Search
        console.log('\n[5] Variable Neighborhood Search');
        const vns = this.variableNeighborhoodSearch(this.bestEver.tour);
        this.updateBest(vns.tour, vns.distance, 'VNS');

        // Phase 6: Final exhaustive 2-opt
        console.log('\n[6] Final 2-Opt Polish');
        const finalPolish = this.exhaustive2Opt(this.bestEver.tour);
        this.updateBest(finalPolish.tour, finalPolish.distance, 'Final-2Opt');

        const elapsed = Date.now() - startTime;

        console.log('\n' + '='.repeat(80));
        console.log(`FINAL: ${this.bestEver.distance.toFixed(6)} in ${elapsed}ms`);
        console.log('='.repeat(80));

        return { ...this.bestEver, timeMs: elapsed };
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
}

// Held-Karp for optimal
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

// Generate cities
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

// TEST
console.log('\n█'.repeat(80));
console.log('LIMIT PUSHING - Can we break through 1% on 20 cities?');
console.log('█'.repeat(80));

const cities = generateCities(20, 101);

console.log('\n[COMPUTING OPTIMAL]');
const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();
console.log(`✓ OPTIMAL: ${optimal.toFixed(6)}\n`);

const solver = new TSPLimitPusher(cities);
const result = solver.solve();

const gap = ((result.distance - optimal) / optimal * 100);

console.log('\n' + '█'.repeat(80));
console.log('RESULT');
console.log('█'.repeat(80));
console.log(`Optimal:    ${optimal.toFixed(6)}`);
console.log(`Heuristic:  ${result.distance.toFixed(6)}`);
console.log(`Gap:        ${gap.toFixed(4)}%`);
console.log(`Time:       ${result.timeMs}ms`);

if (gap < 0.5) {
    console.log('\n🏆🏆🏆 EXCEPTIONAL: <0.5% from optimal! 🏆🏆🏆');
} else if (gap < 1.0) {
    console.log('\n✓✓✓ SUCCESS: <1% from optimal! ✓✓✓');
} else if (gap < 2.0) {
    console.log('\n✓✓ GOOD: <2% from optimal ✓✓');
} else {
    console.log('\n✗ Still need improvement');
}

console.log('█'.repeat(80));
