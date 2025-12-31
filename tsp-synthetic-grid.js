// SYNTHETIC GRID FOR TSP
// Claude perspective: When structure is absent, impose arbitrary frames
// Create artificial hierarchy by forcing grid decomposition

class SyntheticGridTSP {
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

    // Impose arbitrary grid on cities
    createGrid(gridSize = 4) {
        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [x, y] of this.cities) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        // Create grid cells
        const cellWidth = (maxX - minX) / gridSize;
        const cellHeight = (maxY - minY) / gridSize;

        // Assign cities to cells
        const grid = Array(gridSize).fill(0).map(() =>
            Array(gridSize).fill(0).map(() => [])
        );

        for (let i = 0; i < this.n; i++) {
            const [x, y] = this.cities[i];
            const cellX = Math.min(Math.floor((x - minX) / cellWidth), gridSize - 1);
            const cellY = Math.min(Math.floor((y - minY) / cellHeight), gridSize - 1);

            grid[cellY][cellX].push(i);
        }

        return grid;
    }

    // Solve TSP using synthetic grid
    solveWithSyntheticGrid(gridSize = 4) {
        console.log(`\n[GRID] Creating ${gridSize}×${gridSize} synthetic grid...`);

        const grid = this.createGrid(gridSize);

        // Show grid occupancy
        console.log('\n[GRID] Cell occupancy:');
        for (let y = 0; y < gridSize; y++) {
            const row = grid[y].map(cell => cell.length.toString().padStart(2)).join(' ');
            console.log(`  Row ${y}: [${row}]`);
        }

        // Solve each non-empty cell
        const cellTours = [];
        const cellCoords = [];

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (grid[y][x].length > 0) {
                    const tour = this.solveCell(grid[y][x]);
                    cellTours.push(tour);
                    cellCoords.push({ x, y, size: grid[y][x].length });
                }
            }
        }

        console.log(`\n[GRID] ${cellTours.length} non-empty cells`);

        // Connect cells using nearest-neighbor on cell centroids
        const fullTour = this.connectCells(cellTours, cellCoords);

        // 2-opt polish
        const polished = this.twoOpt(fullTour);

        return polished;
    }

    solveCell(cityIndices) {
        if (cityIndices.length === 0) return [];
        if (cityIndices.length === 1) return cityIndices;

        // NN within cell
        const visited = new Set([cityIndices[0]]);
        const tour = [cityIndices[0]];
        let current = cityIndices[0];

        while (visited.size < cityIndices.length) {
            let nearest = -1;
            let minDist = Infinity;

            for (const city of cityIndices) {
                if (!visited.has(city) && this.distances[current][city] < minDist) {
                    minDist = this.distances[current][city];
                    nearest = city;
                }
            }

            visited.add(nearest);
            tour.push(nearest);
            current = nearest;
        }

        return tour;
    }

    connectCells(cellTours, cellCoords) {
        if (cellTours.length === 0) return [];
        if (cellTours.length === 1) return [...cellTours[0], cellTours[0][0]];

        // Greedy nearest cell connection
        const remaining = new Set(cellTours.map((_, i) => i));
        const order = [0];
        remaining.delete(0);

        while (remaining.size > 0) {
            const current = order[order.length - 1];
            const currentEnd = cellTours[current][cellTours[current].length - 1];

            let nearest = -1;
            let minDist = Infinity;

            for (const next of remaining) {
                const nextStart = cellTours[next][0];
                if (this.distances[currentEnd][nextStart] < minDist) {
                    minDist = this.distances[currentEnd][nextStart];
                    nearest = next;
                }
            }

            order.push(nearest);
            remaining.delete(nearest);
        }

        // Build full tour
        const tour = [];
        for (const cellIdx of order) {
            tour.push(...cellTours[cellIdx]);
        }
        tour.push(tour[0]); // Complete cycle

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

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }

    // Try multiple grid sizes and rotations
    multiGridSearch() {
        console.log('\n[MULTI-GRID] Trying multiple grid configurations...');

        const results = [];

        // Different grid sizes
        for (const size of [3, 4, 5, 6]) {
            const tour = this.solveWithSyntheticGrid(size);
            const dist = this.tourDistance(tour);
            results.push({ size, tour, distance: dist });
            console.log(`  Grid ${size}×${size}: ${dist.toFixed(2)}`);
        }

        // Find best
        const best = results.reduce((a, b) => a.distance < b.distance ? a : b);

        console.log(`\n[MULTI-GRID] Best: ${best.size}×${best.size} grid at ${best.distance.toFixed(2)}`);

        return best;
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
console.log('SYNTHETIC GRID TSP - Claude Perspective');
console.log('Impose arbitrary grid to create artificial hierarchy');
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

// Synthetic grid approach
const gridSolver = new SyntheticGridTSP(cities);
const result = gridSolver.multiGridSearch();

const gap = ((result.distance - optimal) / optimal * 100);
const improvement = hardInstance.prevGap - gap;

console.log(`\n${'='.repeat(80)}`);
console.log('RESULT');
console.log('='.repeat(80));
console.log(`Synthetic grid result: ${result.distance.toFixed(2)}`);
console.log(`Gap: ${gap.toFixed(2)}%`);
console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0 ? '✓' : '✗'}`);

if (improvement > 2.0) {
    console.log('\n✓✓ GRID BREAKTHROUGH: Artificial seams found escape!');
} else if (improvement > 0.5) {
    console.log('\n✓ Modest improvement from synthetic grid');
} else {
    console.log('\n✗ Synthetic grid didn\'t significantly help');
}

console.log('='.repeat(80));
