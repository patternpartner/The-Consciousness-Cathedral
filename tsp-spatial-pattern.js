// SPATIAL PATTERN ANALYSIS
// Does optimal tour follow detectable geometric pattern?
// Spiral? Sweep? Cluster traversal?

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
}

function analyzeSpatialPattern(cities, tour) {
    const n = cities.length;

    // Calculate centroid
    let cx = 0, cy = 0;
    for (const [x, y] of cities) {
        cx += x;
        cy += y;
    }
    cx /= n;
    cy /= n;

    // For each step in tour, calculate:
    // - Angle from centroid
    // - Distance from centroid
    // - Change in angle (is it spiraling?)
    // - Change in radius (is it moving in/out?)

    const tourAnalysis = [];
    for (let i = 0; i < tour.length - 1; i++) {
        const idx = tour[i];
        const [x, y] = cities[idx];

        const dx = x - cx;
        const dy = y - cy;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI; // -180 to 180
        const radius = Math.sqrt(dx * dx + dy * dy);

        tourAnalysis.push({ idx, x, y, angle, radius });
    }

    // Analyze angular progression
    const angleDeltas = [];
    for (let i = 1; i < tourAnalysis.length; i++) {
        let delta = tourAnalysis[i].angle - tourAnalysis[i - 1].angle;

        // Normalize to -180 to 180
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;

        angleDeltas.push(delta);
    }

    const avgAngleDelta = angleDeltas.reduce((a, b) => a + b, 0) / angleDeltas.length;
    const absAngleDeltas = angleDeltas.map(Math.abs);
    const avgAbsAngleDelta = absAngleDeltas.reduce((a, b) => a + b, 0) / absAngleDeltas.length;

    // Count direction changes
    let directionChanges = 0;
    for (let i = 1; i < angleDeltas.length; i++) {
        if (Math.sign(angleDeltas[i]) !== Math.sign(angleDeltas[i - 1])) {
            directionChanges++;
        }
    }

    // Analyze radial progression
    const radiusDeltas = [];
    for (let i = 1; i < tourAnalysis.length; i++) {
        radiusDeltas.push(tourAnalysis[i].radius - tourAnalysis[i - 1].radius);
    }

    const avgRadiusDelta = radiusDeltas.reduce((a, b) => a + b, 0) / radiusDeltas.length;

    // Count radial oscillations
    let radialOscillations = 0;
    for (let i = 1; i < radiusDeltas.length; i++) {
        if (Math.sign(radiusDeltas[i]) !== Math.sign(radiusDeltas[i - 1])) {
            radialOscillations++;
        }
    }

    return {
        tourAnalysis,
        avgAngleDelta,
        avgAbsAngleDelta,
        directionChanges,
        avgRadiusDelta,
        radialOscillations,
        totalAngleChange: angleDeltas.reduce((a, b) => a + b, 0)
    };
}

// Classify tour type based on spatial pattern
function classifyTour(pattern) {
    const { avgAngleDelta, avgAbsAngleDelta, directionChanges, radialOscillations, totalAngleChange } = pattern;

    // Spiral: consistent angular progression, low direction changes
    const isSpiral = avgAbsAngleDelta > 10 && directionChanges < 5;

    // Sweep: large consistent angle delta in one direction
    const isSweep = Math.abs(avgAngleDelta) > 15 && directionChanges < 8;

    // Perimeter: visits cities roughly by angle, oscillates in radius
    const isPerimeter = avgAbsAngleDelta > 5 && radialOscillations > 10;

    // Clustered: frequent direction changes, low avg angle delta
    const isClustered = avgAbsAngleDelta < 15 && directionChanges > 10;

    return {
        isSpiral,
        isSweep,
        isPerimeter,
        isClustered,
        description: isSpiral ? 'SPIRAL' :
                     isSweep ? 'SWEEP' :
                     isPerimeter ? 'PERIMETER' :
                     isClustered ? 'CLUSTERED' :
                     'COMPLEX'
    };
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
console.log('SPATIAL PATTERN ANALYSIS');
console.log('Does optimal tour follow geometric pattern?');
console.log('='.repeat(80));

const seed = 109;
const cities = generateCities(20, seed);

const solver = new OptimalTSP(cities);
const { distance, tour } = solver.solveOptimal();

console.log(`\nOptimal tour distance: ${distance.toFixed(2)}`);
console.log(`\nTour sequence: ${tour.slice(0, -1).join(' → ')} → ${tour[tour.length - 1]}`);

const pattern = analyzeSpatialPattern(cities, tour);
const classification = classifyTour(pattern);

console.log('\n' + '='.repeat(80));
console.log('SPATIAL METRICS');
console.log('='.repeat(80));

console.log(`\nAverage angle change:     ${pattern.avgAngleDelta.toFixed(2)}°`);
console.log(`Average |angle change|:   ${pattern.avgAbsAngleDelta.toFixed(2)}°`);
console.log(`Direction changes:        ${pattern.directionChanges}/${pattern.tourAnalysis.length - 1}`);
console.log(`Total angle traversed:    ${pattern.totalAngleChange.toFixed(2)}°`);
console.log(`Average radius change:    ${pattern.avgRadiusDelta.toFixed(2)}`);
console.log(`Radial oscillations:      ${pattern.radialOscillations}/${pattern.tourAnalysis.length - 1}`);

console.log('\n' + '='.repeat(80));
console.log('PATTERN CLASSIFICATION');
console.log('='.repeat(80));

console.log(`\nPattern type: ${classification.description}`);
console.log(`  Spiral:     ${classification.isSpiral ? 'YES' : 'no'}`);
console.log(`  Sweep:      ${classification.isSweep ? 'YES' : 'no'}`);
console.log(`  Perimeter:  ${classification.isPerimeter ? 'YES' : 'no'}`);
console.log(`  Clustered:  ${classification.isClustered ? 'YES' : 'no'}`);

console.log('\n' + '='.repeat(80));
console.log('TOUR COORDINATE SEQUENCE');
console.log('='.repeat(80));

console.log('\nStep  City  X      Y      Angle    Radius  ΔAngle  ΔRadius');
console.log('-'.repeat(75));

for (let i = 0; i < pattern.tourAnalysis.length; i++) {
    const p = pattern.tourAnalysis[i];
    const deltaAngle = i > 0 ?
        (() => {
            let d = p.angle - pattern.tourAnalysis[i - 1].angle;
            while (d > 180) d -= 360;
            while (d < -180) d += 360;
            return d;
        })() : 0;
    const deltaRadius = i > 0 ? p.radius - pattern.tourAnalysis[i - 1].radius : 0;

    console.log(
        `${i.toString().padStart(2)}    ` +
        `${p.idx.toString().padStart(2)}    ` +
        `${p.x.toFixed(1).padStart(5)}  ` +
        `${p.y.toFixed(1).padStart(5)}  ` +
        `${p.angle.toFixed(1).padStart(6)}°  ` +
        `${p.radius.toFixed(1).padStart(5)}  ` +
        `${(i > 0 ? deltaAngle.toFixed(1) + '°' : '-').padStart(7)}  ` +
        `${(i > 0 ? (deltaRadius >= 0 ? '+' : '') + deltaRadius.toFixed(1) : '-').padStart(7)}`
    );
}

console.log('\n' + '='.repeat(80));
console.log('INSIGHT');
console.log('='.repeat(80));

if (classification.description !== 'COMPLEX') {
    console.log(`\n✓ Optimal tour follows ${classification.description} pattern`);
    console.log('This pattern could be used to guide construction heuristic');
} else {
    console.log('\n✗ No clear geometric pattern detected');
    console.log('Optimal tour structure may be instance-specific');
}

console.log('\n' + '='.repeat(80));
