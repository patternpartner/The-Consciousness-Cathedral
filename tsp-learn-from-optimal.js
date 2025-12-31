// LEARNING FROM OPTIMAL TOURS
// Stop deflecting. Actually look at what optimal tours do differently.
// What patterns exist in optimal solutions that heuristics are missing?

class OptimalTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.memo = new Map();
        this.optimalPath = null;
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

        // Reconstruct optimal path
        this.optimalPath = this.reconstructPath(start, bestLast, withoutStart);

        return { distance: minDist, tour: this.optimalPath };
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

    analyzeTourStructure(tour) {
        const analysis = {
            edgeLengths: [],
            edgeAngles: [],
            crossings: 0,
            longestEdge: 0,
            shortestEdge: Infinity,
            avgEdgeLength: 0
        };

        // Analyze edge lengths
        for (let i = 0; i < tour.length - 1; i++) {
            const dist = this.distances[tour[i]][tour[i + 1]];
            analysis.edgeLengths.push(dist);
            analysis.longestEdge = Math.max(analysis.longestEdge, dist);
            analysis.shortestEdge = Math.min(analysis.shortestEdge, dist);
        }

        analysis.avgEdgeLength = analysis.edgeLengths.reduce((a, b) => a + b, 0) / analysis.edgeLengths.length;

        // Count crossings
        for (let i = 0; i < tour.length - 2; i++) {
            for (let j = i + 2; j < tour.length - 1; j++) {
                if (this.edgesCross(tour[i], tour[i + 1], tour[j], tour[j + 1])) {
                    analysis.crossings++;
                }
            }
        }

        // Analyze turn angles
        for (let i = 1; i < tour.length - 2; i++) {
            const angle = this.turnAngle(
                this.cities[tour[i - 1]],
                this.cities[tour[i]],
                this.cities[tour[i + 1]]
            );
            analysis.edgeAngles.push(angle);
        }

        return analysis;
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

    turnAngle(p1, p2, p3) {
        const v1 = [p2[0] - p1[0], p2[1] - p1[1]];
        const v2 = [p3[0] - p2[0], p3[1] - p2[1]];

        const dot = v1[0] * v2[0] + v1[1] * v2[1];
        const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

        return Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI;
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
console.log('LEARNING FROM OPTIMAL TOURS');
console.log('What do optimal tours do that heuristics miss?');
console.log('='.repeat(80));

const seed = 109; // Instance 10 (hardest)
const cities = generateCities(20, seed);

console.log('\n[COMPUTING OPTIMAL]');
const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();

console.log(`Optimal distance: ${optimal.distance.toFixed(2)}`);
console.log(`Optimal tour: ${optimal.tour.join(' → ')}`);

console.log('\n[COMPUTING HEURISTIC]');
const heuristic = new HeuristicTSP(cities);
const heuristicTour = heuristic.solve();
const heuristicDist = heuristic.tourDistance(heuristicTour);

console.log(`Heuristic distance: ${heuristicDist.toFixed(2)}`);
console.log(`Heuristic tour: ${heuristicTour.join(' → ')}`);

const gap = ((heuristicDist - optimal.distance) / optimal.distance * 100);
console.log(`\nGap: ${gap.toFixed(2)}%`);

// Analyze both tours
console.log('\n' + '='.repeat(80));
console.log('STRUCTURAL COMPARISON');
console.log('='.repeat(80));

const optimalAnalysis = optimalSolver.analyzeTourStructure(optimal.tour);
const heuristicAnalysis = optimalSolver.analyzeTourStructure(heuristicTour);

console.log('\n                        OPTIMAL      HEURISTIC    Difference');
console.log('-'.repeat(80));
console.log(`Crossings:              ${optimalAnalysis.crossings.toString().padStart(7)}  ${heuristicAnalysis.crossings.toString().padStart(12)}  ${(heuristicAnalysis.crossings - optimalAnalysis.crossings > 0 ? '+' : '')}${(heuristicAnalysis.crossings - optimalAnalysis.crossings).toString()}`);
console.log(`Longest edge:           ${optimalAnalysis.longestEdge.toFixed(2).padStart(7)}  ${heuristicAnalysis.longestEdge.toFixed(2).padStart(12)}  ${(heuristicAnalysis.longestEdge > optimalAnalysis.longestEdge ? '+' : '')}${(heuristicAnalysis.longestEdge - optimalAnalysis.longestEdge).toFixed(2)}`);
console.log(`Shortest edge:          ${optimalAnalysis.shortestEdge.toFixed(2).padStart(7)}  ${heuristicAnalysis.shortestEdge.toFixed(2).padStart(12)}  ${(heuristicAnalysis.shortestEdge > optimalAnalysis.shortestEdge ? '+' : '')}${(heuristicAnalysis.shortestEdge - optimalAnalysis.shortestEdge).toFixed(2)}`);
console.log(`Avg edge length:        ${optimalAnalysis.avgEdgeLength.toFixed(2).padStart(7)}  ${heuristicAnalysis.avgEdgeLength.toFixed(2).padStart(12)}  ${(heuristicAnalysis.avgEdgeLength > optimalAnalysis.avgEdgeLength ? '+' : '')}${(heuristicAnalysis.avgEdgeLength - optimalAnalysis.avgEdgeLength).toFixed(2)}`);

console.log('\n' + '='.repeat(80));
console.log('KEY DIFFERENCES');
console.log('='.repeat(80));

if (optimalAnalysis.crossings < heuristicAnalysis.crossings) {
    console.log(`\n✓ OPTIMAL has ${heuristicAnalysis.crossings - optimalAnalysis.crossings} fewer crossings`);
}

if (optimalAnalysis.longestEdge < heuristicAnalysis.longestEdge) {
    console.log(`✓ OPTIMAL avoids longest edges better (${(heuristicAnalysis.longestEdge - optimalAnalysis.longestEdge).toFixed(2)} shorter max)`);
}

console.log('\nOPTIMAL tour characteristics:');
console.log(`- ${optimalAnalysis.crossings} crossings ${optimalAnalysis.crossings === 0 ? '(PLANAR!)' : ''}`);
console.log(`- Edge range: ${optimalAnalysis.shortestEdge.toFixed(2)} - ${optimalAnalysis.longestEdge.toFixed(2)}`);
console.log(`- Avg edge: ${optimalAnalysis.avgEdgeLength.toFixed(2)}`);

console.log('\nHEURISTIC tour characteristics:');
console.log(`- ${heuristicAnalysis.crossings} crossings ${heuristicAnalysis.crossings === 0 ? '(PLANAR!)' : ''}`);
console.log(`- Edge range: ${heuristicAnalysis.shortestEdge.toFixed(2)} - ${heuristicAnalysis.longestEdge.toFixed(2)}`);
console.log(`- Avg edge: ${heuristicAnalysis.avgEdgeLength.toFixed(2)}`);

console.log('\n' + '='.repeat(80));
console.log('What can we learn from this?');
console.log('='.repeat(80));

console.log('\nOptimal tours tend to:');
console.log('  1. Minimize edge crossings (planar when possible)');
console.log('  2. Avoid very long edges');
console.log('  3. Have more balanced edge lengths');

console.log('\nHeuristics fail when they:');
console.log('  1. Get stuck with crossings that 2-opt can\'t remove');
console.log('  2. Lock in long edges early (greedy nearest neighbor)');
console.log('  3. Can\'t escape local minima with unbalanced edge distribution');

console.log('\n' + '='.repeat(80));
console.log('Next: Use these insights to improve heuristics');
console.log('='.repeat(80));
