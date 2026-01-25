// DECODE OPTIMAL PATTERN
// What order does the optimal tour visit cities?
// Can we learn the pattern and replicate it?

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
        let bestLast = -1;

        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;
            const dist = this.tsp(withoutStart ^ (1 << last), last, start) +
                        this.distances[last][start];
            if (dist < minDist) {
                minDist = dist;
                bestLast = last;
            }
        }

        const tour = this.reconstructPath(start, bestLast, withoutStart);
        return { distance: minDist, tour };
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

    reconstructPath(start, lastCity, mask) {
        const path = [start];
        let current = lastCity;
        let remainingMask = mask ^ (1 << lastCity);

        while (remainingMask !== 0) {
            path.push(current);

            let bestNext = -1;
            let bestDist = Infinity;

            for (let next = 0; next < this.n; next++) {
                if (next === start) continue;
                if ((remainingMask & (1 << next)) === 0) continue;

                const newMask = remainingMask ^ (1 << next);
                const memoKey = `${newMask},${next}`;
                const futureCost = this.memo.get(memoKey) || 0;
                const dist = this.distances[current][next] + futureCost;

                if (dist < bestDist) {
                    bestDist = dist;
                    bestNext = next;
                }
            }

            if (bestNext === -1) break;
            remainingMask ^= (1 << bestNext);
            current = bestNext;
        }

        if (current !== start) {
            path.push(current);
        }
        path.push(start);
        return path;
    }

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
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

    solve() {
        let bestTour = null;
        let bestDist = Infinity;

        for (let start = 0; start < this.n; start++) {
            const nn = this.nearestNeighbor(start);
            const improved = this.twoOpt(nn);
            const dist = this.tourDistance(improved);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = improved;
            }
        }

        return bestTour;
    }

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }
}

function analyzeTourPattern(cities, tour, distances) {
    const n = cities.length;

    // At each step, what were the alternatives?
    // Why did it choose THIS city over others?
    const decisions = [];

    for (let i = 0; i < tour.length - 2; i++) {
        const current = tour[i];
        const chosen = tour[i + 1];
        const visited = new Set(tour.slice(0, i + 1));

        // What were the unvisited alternatives?
        const alternatives = [];
        for (let j = 0; j < n; j++) {
            if (!visited.has(j) && j !== chosen) {
                alternatives.push({
                    city: j,
                    distance: distances[current][j]
                });
            }
        }

        alternatives.sort((a, b) => a.distance - b.distance);

        const chosenDist = distances[current][chosen];
        const nearestDist = alternatives.length > 0 ? alternatives[0].distance : null;
        const nearestCity = alternatives.length > 0 ? alternatives[0].city : null;

        // Rank of chosen among alternatives
        let rank = 1;
        for (const alt of alternatives) {
            if (alt.distance < chosenDist) rank++;
        }

        decisions.push({
            step: i,
            from: current,
            chosen,
            chosenDist,
            nearestCity,
            nearestDist,
            rank,
            totalAlternatives: alternatives.length + 1,
            wasNearest: rank === 1,
            deviation: nearestDist ? chosenDist - nearestDist : 0
        });
    }

    return decisions;
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
console.log('DECODE OPTIMAL PATTERN');
console.log('What decisions does optimal tour make vs heuristic?');
console.log('='.repeat(80));

const seed = 109;
const cities = generateCities(20, seed);

const optimalSolver = new OptimalTSP(cities);
const { distance: optimalDist, tour: optimalTour } = optimalSolver.solveOptimal();

const heuristic = new HeuristicTSP(cities);
const heuristicTour = heuristic.solve();
const heuristicDist = heuristic.tourDistance(heuristicTour);

console.log(`\nOptimal:   ${optimalDist.toFixed(2)}`);
console.log(`Heuristic: ${heuristicDist.toFixed(2)}`);
console.log(`Gap:       ${((heuristicDist - optimalDist) / optimalDist * 100).toFixed(2)}%`);

// Analyze both tours
console.log('\n' + '='.repeat(80));
console.log('OPTIMAL TOUR DECISIONS');
console.log('='.repeat(80));

const optimalDecisions = analyzeTourPattern(cities, optimalTour, optimalSolver.distances);

console.log('\nStep  From→Chosen  Distance  Nearest  NearDist  Rank  Greedy?');
console.log('-'.repeat(70));

for (const d of optimalDecisions) {
    const greedyMark = d.wasNearest ? '✓' : '✗';
    console.log(
        `${d.step.toString().padStart(2)}    ` +
        `${d.from}→${d.chosen}`.padEnd(10) +
        d.chosenDist.toFixed(2).padEnd(10) +
        `${d.nearestCity}`.padEnd(9) +
        (d.nearestDist ? d.nearestDist.toFixed(2) : 'N/A').padEnd(10) +
        `${d.rank}/${d.totalAlternatives}`.padEnd(6) +
        greedyMark
    );
}

const greedyCount = optimalDecisions.filter(d => d.wasNearest).length;
const nonGreedyCount = optimalDecisions.length - greedyCount;

console.log('\n' + '='.repeat(80));
console.log('OPTIMAL TOUR STATISTICS');
console.log('='.repeat(80));

console.log(`\nGreedy choices (chose nearest):     ${greedyCount}/${optimalDecisions.length} (${(greedyCount/optimalDecisions.length*100).toFixed(1)}%)`);
console.log(`Non-greedy choices:                 ${nonGreedyCount}/${optimalDecisions.length} (${(nonGreedyCount/optimalDecisions.length*100).toFixed(1)}%)`);

// Average deviation from nearest
const avgDeviation = optimalDecisions
    .filter(d => !d.wasNearest)
    .reduce((sum, d) => sum + d.deviation, 0) / nonGreedyCount;

console.log(`Average deviation (non-greedy):     ${avgDeviation.toFixed(2)}`);

// Which steps were non-greedy?
const nonGreedySteps = optimalDecisions
    .filter(d => !d.wasNearest)
    .map(d => ({
        step: d.step,
        from: d.from,
        chosen: d.chosen,
        skipped: d.nearestCity,
        rank: d.rank,
        deviation: d.deviation
    }));

console.log('\n' + '='.repeat(80));
console.log('NON-GREEDY DECISIONS IN OPTIMAL TOUR');
console.log('='.repeat(80));

console.log('\nStep  From→Chosen  Skipped  Rank  Deviation');
console.log('-'.repeat(60));

for (const d of nonGreedySteps) {
    console.log(
        `${d.step.toString().padStart(2)}    ` +
        `${d.from}→${d.chosen}`.padEnd(13) +
        d.skipped.toString().padEnd(9) +
        `${d.rank}`.padEnd(6) +
        `+${d.deviation.toFixed(2)}`
    );
}

console.log('\n' + '='.repeat(80));
console.log('HEURISTIC TOUR DECISIONS');
console.log('='.repeat(80));

const heuristicDecisions = analyzeTourPattern(cities, heuristicTour, heuristic.distances);

const hGreedy = heuristicDecisions.filter(d => d.wasNearest).length;
const hNonGreedy = heuristicDecisions.length - hGreedy;

console.log(`\nGreedy choices: ${hGreedy}/${heuristicDecisions.length} (${(hGreedy/heuristicDecisions.length*100).toFixed(1)}%)`);
console.log(`Non-greedy:     ${hNonGreedy}/${heuristicDecisions.length} (${(hNonGreedy/heuristicDecisions.length*100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(80));
console.log('KEY FINDING');
console.log('='.repeat(80));

console.log('\nOptimal tour is NOT purely greedy.');
console.log(`It makes ${nonGreedyCount} non-greedy choices where it skips the nearest city.`);
console.log('These strategic deviations enable shorter overall path.');
console.log('\nNearest neighbor heuristic FORCES greedy choice at every step.');
console.log('2-opt can only rearrange, not undo the greedy construction.');

console.log('\n' + '='.repeat(80));
