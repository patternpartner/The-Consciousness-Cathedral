// Advanced TSP Solver with Cathedral v30
// Goal: Find optimal or near-optimal solutions
// Using multiple algorithms guided by Cathedral deliberation

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

class AdvancedTSPSolver {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.cathedral = new CathedralV30();
        this.bestTour = null;
        this.bestDistance = Infinity;
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
        if (distance < this.bestDistance) {
            this.bestDistance = distance;
            this.bestTour = [...tour];
            console.log(`  ✓ New best from ${method}: ${distance.toFixed(2)}`);
            return true;
        }
        return false;
    }

    // Algorithm 1: Multiple Nearest Neighbor starts
    multiStartNearestNeighbor() {
        console.log('\n[1] Multi-Start Nearest Neighbor');
        const results = [];

        for (let start = 0; start < this.n; start++) {
            const visited = new Set([start]);
            const tour = [start];
            let current = start;
            let distance = 0;

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
                distance += minDist;
                current = nearest;
            }

            distance += this.distances[current][start];
            tour.push(start);
            results.push({ tour, distance, start });

            this.updateBest(tour, distance, `NN-start${start}`);
        }

        const best = results.reduce((a, b) => a.distance < b.distance ? a : b);
        console.log(`  Best NN: ${best.distance.toFixed(2)} from start ${best.start}`);
        return best;
    }

    // Algorithm 2: 2-Opt improvement
    twoOpt(initialTour, maxIterations = 1000) {
        let tour = [...initialTour];
        let improved = true;
        let iterations = 0;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 1; i < tour.length - 2; i++) {
                for (let j = i + 1; j < tour.length - 1; j++) {
                    const delta = this.calc2OptDelta(tour, i, j);
                    if (delta < -0.0001) {
                        tour = this.reverse2OptSegment(tour, i, j);
                        improved = true;
                    }
                }
            }
        }

        const distance = this.tourDistance(tour);
        return { tour, distance, iterations };
    }

    calc2OptDelta(tour, i, j) {
        const a = tour[i - 1], b = tour[i], c = tour[j], d = tour[j + 1];
        return (this.distances[a][c] + this.distances[b][d]) -
               (this.distances[a][b] + this.distances[c][d]);
    }

    reverse2OptSegment(tour, i, j) {
        const newTour = [...tour];
        const segment = newTour.slice(i, j + 1).reverse();
        newTour.splice(i, j - i + 1, ...segment);
        return newTour;
    }

    // Algorithm 3: 3-Opt improvement (more powerful)
    threeOpt(initialTour, maxIterations = 100) {
        console.log('\n[2] 3-Opt Optimization');
        let tour = [...initialTour];
        let improved = true;
        let iterations = 0;
        let improvementCount = 0;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 1; i < tour.length - 3; i++) {
                for (let j = i + 1; j < tour.length - 2; j++) {
                    for (let k = j + 1; k < tour.length - 1; k++) {
                        const newTour = this.best3OptMove(tour, i, j, k);
                        const newDist = this.tourDistance(newTour);
                        const oldDist = this.tourDistance(tour);

                        if (newDist < oldDist - 0.0001) {
                            tour = newTour;
                            improved = true;
                            improvementCount++;
                            this.updateBest(tour, newDist, '3-Opt');
                        }
                    }
                }
            }
        }

        const distance = this.tourDistance(tour);
        console.log(`  3-Opt: ${improvementCount} improvements in ${iterations} iterations`);
        return { tour, distance, iterations, improvements: improvementCount };
    }

    best3OptMove(tour, i, j, k) {
        // Try all possible 3-opt reconnections
        const segment1 = tour.slice(0, i);
        const segment2 = tour.slice(i, j);
        const segment3 = tour.slice(j, k);
        const segment4 = tour.slice(k);

        const reconnections = [
            [...segment1, ...segment2, ...segment3, ...segment4], // original
            [...segment1, ...segment2.reverse(), ...segment3, ...segment4],
            [...segment1, ...segment2, ...segment3.reverse(), ...segment4],
            [...segment1, ...segment3, ...segment2, ...segment4],
            [...segment1, ...segment3.reverse(), ...segment2, ...segment4],
            [...segment1, ...segment2.reverse(), ...segment3.reverse(), ...segment4],
            [...segment1, ...segment3, ...segment2.reverse(), ...segment4],
            [...segment1, ...segment3.reverse(), ...segment2.reverse(), ...segment4]
        ];

        let best = tour;
        let bestDist = this.tourDistance(tour);

        for (const recon of reconnections) {
            const dist = this.tourDistance(recon);
            if (dist < bestDist) {
                best = recon;
                bestDist = dist;
            }
        }

        return best;
    }

    // Algorithm 4: Simulated Annealing
    simulatedAnnealing(initialTour, initialTemp = 100, coolingRate = 0.995, iterations = 10000) {
        console.log('\n[3] Simulated Annealing');
        let currentTour = [...initialTour];
        let currentDist = this.tourDistance(currentTour);
        let bestTour = [...currentTour];
        let bestDist = currentDist;

        let temp = initialTemp;
        let acceptCount = 0;

        for (let iter = 0; iter < iterations; iter++) {
            // Generate neighbor by swapping two random cities
            const newTour = this.randomSwap(currentTour);
            const newDist = this.tourDistance(newTour);
            const delta = newDist - currentDist;

            // Accept if better, or probabilistically if worse
            if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
                currentTour = newTour;
                currentDist = newDist;
                if (delta >= 0) acceptCount++;

                if (currentDist < bestDist) {
                    bestTour = [...currentTour];
                    bestDist = currentDist;
                    this.updateBest(bestTour, bestDist, 'SimAnneal');
                }
            }

            temp *= coolingRate;
        }

        console.log(`  SA: ${acceptCount} uphill moves accepted`);
        return { tour: bestTour, distance: bestDist };
    }

    randomSwap(tour) {
        const newTour = [...tour];
        const i = 1 + Math.floor(Math.random() * (tour.length - 2));
        const j = 1 + Math.floor(Math.random() * (tour.length - 2));
        [newTour[i], newTour[j]] = [newTour[j], newTour[i]];
        return newTour;
    }

    // Algorithm 5: Genetic Algorithm
    geneticAlgorithm(popSize = 50, generations = 100) {
        console.log('\n[4] Genetic Algorithm');

        // Initialize population with random permutations
        let population = [];
        for (let i = 0; i < popSize; i++) {
            const tour = this.randomTour();
            const distance = this.tourDistance(tour);
            population.push({ tour, distance });
        }

        let bestEver = population.reduce((a, b) => a.distance < b.distance ? a : b);

        for (let gen = 0; gen < generations; gen++) {
            // Sort by fitness
            population.sort((a, b) => a.distance - b.distance);

            // Keep top 20%
            const survivors = population.slice(0, Math.floor(popSize * 0.2));

            // Create next generation
            const newPop = [...survivors];

            while (newPop.length < popSize) {
                // Select parents (tournament selection)
                const parent1 = this.tournamentSelect(population, 3);
                const parent2 = this.tournamentSelect(population, 3);

                // Crossover
                const child = this.orderCrossover(parent1.tour, parent2.tour);

                // Mutate
                if (Math.random() < 0.1) {
                    this.mutate(child);
                }

                const distance = this.tourDistance(child);
                newPop.push({ tour: child, distance });

                if (distance < bestEver.distance) {
                    bestEver = { tour: [...child], distance };
                    this.updateBest(child, distance, 'Genetic');
                }
            }

            population = newPop;
        }

        console.log(`  GA: Best from ${generations} generations`);
        return bestEver;
    }

    randomTour() {
        const tour = Array.from({ length: this.n }, (_, i) => i);
        // Fisher-Yates shuffle
        for (let i = tour.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tour[i], tour[j]] = [tour[j], tour[i]];
        }
        tour.push(tour[0]); // complete cycle
        return tour;
    }

    tournamentSelect(population, k) {
        let best = population[Math.floor(Math.random() * population.length)];
        for (let i = 1; i < k; i++) {
            const candidate = population[Math.floor(Math.random() * population.length)];
            if (candidate.distance < best.distance) {
                best = candidate;
            }
        }
        return best;
    }

    orderCrossover(parent1, parent2) {
        const n = parent1.length - 1; // excluding duplicate start/end
        const child = Array(n).fill(-1);

        // Select a substring from parent1
        const start = Math.floor(Math.random() * n);
        const end = start + 1 + Math.floor(Math.random() * (n - start - 1));

        // Copy substring from parent1
        for (let i = start; i < end; i++) {
            child[i] = parent1[i];
        }

        // Fill remaining from parent2
        let childIdx = 0;
        for (let i = 0; i < n; i++) {
            if (childIdx >= start && childIdx < end) {
                childIdx = end;
            }
            const city = parent2[i];
            if (!child.includes(city)) {
                child[childIdx] = city;
                childIdx++;
            }
        }

        child.push(child[0]); // complete cycle
        return child;
    }

    mutate(tour) {
        const i = 1 + Math.floor(Math.random() * (tour.length - 2));
        const j = 1 + Math.floor(Math.random() * (tour.length - 2));
        [tour[i], tour[j]] = [tour[j], tour[i]];
    }

    // Cathedral-guided solving
    solve() {
        const session = this.cathedral.beginSession('tsp-advanced', 'Find optimal solution');

        console.log('='.repeat(70));
        console.log('ADVANCED TSP SOLVER - Cathedral v30 Guided');
        console.log('='.repeat(70));
        console.log(`\nProblem: ${this.n} cities`);

        // Parliament deliberates on strategy
        console.log('\n### PARLIAMENT DELIBERATION ###');
        const delib = this.cathedral.deliberate(
            'Which algorithms to deploy?',
            [
                { name: 'Greedy only', speed: 'fast', quality: 'poor' },
                { name: 'Local search', speed: 'medium', quality: 'good' },
                { name: 'Multiple algorithms', speed: 'slow', quality: 'best' }
            ],
            {
                hasHiddenAssumptions: false,
                evidenceLevel: 'high',
                humanImpact: false
            }
        );

        // Show key positions
        const practical = delib.positions.find(p => p.vector === 'Practical');
        const analytical = delib.positions.find(p => p.vector === 'Analytical');
        console.log(`  Practical: ${practical.position}`);
        console.log(`  Analytical: ${analytical.position}`);

        // Execute multiple algorithms
        console.log('\n### EXECUTION ###');

        // 1. Multi-start NN
        const nn = this.multiStartNearestNeighbor();

        // 2. Improve best NN with 2-Opt
        console.log('\n[2] 2-Opt on best NN');
        const twoOpt = this.twoOpt(nn.tour);
        this.updateBest(twoOpt.tour, twoOpt.distance, '2-Opt');
        console.log(`  2-Opt: ${twoOpt.distance.toFixed(2)} (${twoOpt.iterations} iterations)`);

        // 3. Apply 3-Opt
        const threeOpt = this.threeOpt(twoOpt.tour);

        // 4. Simulated Annealing
        const sa = this.simulatedAnnealing(threeOpt.tour);

        // 5. Genetic Algorithm
        const ga = this.geneticAlgorithm(50, 100);

        // Final polish with 2-Opt on absolute best
        console.log('\n[5] Final 2-Opt polish on best solution');
        const finalPolish = this.twoOpt(this.bestTour, 2000);
        this.updateBest(finalPolish.tour, finalPolish.distance, 'Final-2Opt');

        console.log('\n' + '='.repeat(70));
        console.log('SOLUTION FOUND');
        console.log('='.repeat(70));
        console.log(`\nBest tour distance: ${this.bestDistance.toFixed(4)}`);
        console.log(`Best tour: ${this.bestTour.slice(0, -1).join(' → ')} → ${this.bestTour[0]}`);

        this.cathedral.endSession();

        return {
            tour: this.bestTour,
            distance: this.bestDistance,
            algorithms: ['Multi-NN', '2-Opt', '3-Opt', 'SimAnneal', 'Genetic']
        };
    }
}

// === TEST ON MULTIPLE INSTANCES ===

function generateCities(n, maxCoord = 100) {
    const cities = [];
    for (let i = 0; i < n; i++) {
        cities.push([
            Math.random() * maxCoord,
            Math.random() * maxCoord
        ]);
    }
    return cities;
}

console.log('\n\n');
console.log('█'.repeat(70));
console.log('TSP SOLVER - CATHEDRAL v30');
console.log('█'.repeat(70));

// Test on different sizes
const testSizes = [10, 15, 20];

for (const size of testSizes) {
    console.log('\n\n');
    console.log('▓'.repeat(70));
    console.log(`SOLVING ${size}-CITY TSP`);
    console.log('▓'.repeat(70));

    const cities = generateCities(size);
    const solver = new AdvancedTSPSolver(cities);
    const result = solver.solve();

    console.log(`\n✓ SOLVED: ${result.distance.toFixed(4)}`);
    console.log(`  Algorithms used: ${result.algorithms.join(', ')}`);
}

console.log('\n\n');
console.log('█'.repeat(70));
console.log('TSP SOLVING COMPLETE');
console.log('█'.repeat(70));
