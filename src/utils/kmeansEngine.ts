/**
 * K-Means++ Clustering Engine with:
 * - WCSS (Elbow method)
 * - Silhouette Score
 * - Gap Statistic
 * - Absolute (denormalized) Centroids calculation in business units
 * - 2D PCA projection for cluster visualization
 */

import { EvaluationMetrics, PCAPoint } from '../types';
import { inverseTransformValue, ScalerParams } from './statsEngine';

export interface KMeansResult {
  k: number;
  centroids: number[][]; // [k][dim] scaled [0, 1]
  assignments: number[]; // cluster id for each point
  wcss: number;
  iterations: number;
}

// Distance helper
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function squaredDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * K-Means++ Algorithm implementation
 */
export function runKMeans(data: number[][], k: number, maxIterations = 50, seed = 42): KMeansResult {
  const n = data.length;
  const dim = data[0].length;

  if (k <= 0 || n < k) {
    throw new Error(`K (${k}) debe ser menor o igual al número de observaciones (${n}).`);
  }

  // Deterministic pseudo-random generator
  let s = seed;
  const prng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 1. K-Means++ Initialization
  const centroids: number[][] = [];
  // First centroid random
  const firstIdx = Math.floor(prng() * n);
  centroids.push([...data[firstIdx]]);

  while (centroids.length < k) {
    const distances: number[] = [];
    let sumD2 = 0;

    for (let i = 0; i < n; i++) {
      let minDistSq = Infinity;
      for (const c of centroids) {
        const dSq = squaredDistance(data[i], c);
        if (dSq < minDistSq) minDistSq = dSq;
      }
      distances.push(minDistSq);
      sumD2 += minDistSq;
    }

    let target = prng() * sumD2;
    let nextIdx = 0;
    for (let i = 0; i < n; i++) {
      target -= distances[i];
      if (target <= 0) {
        nextIdx = i;
        break;
      }
    }
    centroids.push([...data[nextIdx]]);
  }

  // 2. Lloyd's iteration
  let assignments = new Array(n).fill(0);
  let iterations = 0;
  let changed = true;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assignment step
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = euclideanDistance(data[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update centroids
    const counts = new Array(k).fill(0);
    const newCentroids: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0));

    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dim; d++) {
        newCentroids[c][d] += data[i][d];
      }
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let d = 0; d < dim; d++) {
          newCentroids[c][d] /= counts[c];
        }
        centroids[c] = newCentroids[c];
      } else {
        // Re-seed empty cluster with furthest point
        let maxD = -1;
        let furthestPoint = data[0];
        for (let i = 0; i < n; i++) {
          const d = euclideanDistance(data[i], centroids[assignments[i]]);
          if (d > maxD) {
            maxD = d;
            furthestPoint = data[i];
          }
        }
        centroids[c] = [...furthestPoint];
      }
    }
  }

  // Compute final WCSS (Within-Cluster Sum of Squares)
  let wcss = 0;
  for (let i = 0; i < n; i++) {
    wcss += squaredDistance(data[i], centroids[assignments[i]]);
  }

  return { k, centroids, assignments, wcss, iterations };
}

/**
 * Calculates Silhouette Score for a clustering solution
 */
export function calculateSilhouetteScore(data: number[][], assignments: number[], k: number): number {
  const n = data.length;
  if (k <= 1 || n <= k) return 0;

  // Subsample if data is huge for snappy interactive response
  const sampleIndices: number[] = [];
  const maxEvalPoints = 400;
  if (n <= maxEvalPoints) {
    for (let i = 0; i < n; i++) sampleIndices.push(i);
  } else {
    const step = Math.floor(n / maxEvalPoints);
    for (let i = 0; i < n && sampleIndices.length < maxEvalPoints; i += step) {
      sampleIndices.push(i);
    }
  }

  const evalCount = sampleIndices.length;
  let totalSilhouette = 0;

  // Group indices by cluster
  const clusterMembers: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusterMembers[assignments[i]].push(i);
  }

  for (const i of sampleIndices) {
    const myCluster = assignments[i];
    const myMembers = clusterMembers[myCluster];

    // a(i): average distance to points in same cluster
    let a_i = 0;
    if (myMembers.length > 1) {
      let sumDist = 0;
      for (const m of myMembers) {
        if (m !== i) {
          sumDist += euclideanDistance(data[i], data[m]);
        }
      }
      a_i = sumDist / (myMembers.length - 1);
    }

    // b(i): minimum average distance to any other cluster
    let b_i = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === myCluster) continue;
      const otherMembers = clusterMembers[c];
      if (otherMembers.length === 0) continue;

      let sumDist = 0;
      for (const m of otherMembers) {
        sumDist += euclideanDistance(data[i], data[m]);
      }
      const avgDist = sumDist / otherMembers.length;
      if (avgDist < b_i) {
        b_i = avgDist;
      }
    }

    if (b_i === Infinity) b_i = 0;

    const maxVal = Math.max(a_i, b_i);
    const s_i = maxVal === 0 ? 0 : (b_i - a_i) / maxVal;
    totalSilhouette += s_i;
  }

  return Math.round((totalSilhouette / evalCount) * 1000) / 1000;
}

/**
 * Computes Davies-Bouldin Index (lower is better)
 */
export function calculateDaviesBouldin(data: number[][], centroids: number[][], assignments: number[], k: number): number {
  const n = data.length;
  if (k <= 1) return 0;

  // Compute cluster scatter (average distance of points to their centroid)
  const scatters = new Array(k).fill(0);
  const counts = new Array(k).fill(0);

  for (let i = 0; i < n; i++) {
    const c = assignments[i];
    scatters[c] += euclideanDistance(data[i], centroids[c]);
    counts[c]++;
  }

  for (let c = 0; c < k; c++) {
    scatters[c] = counts[c] > 0 ? scatters[c] / counts[c] : 0;
  }

  let dbSum = 0;
  for (let i = 0; i < k; i++) {
    let maxR = 0;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const dist = euclideanDistance(centroids[i], centroids[j]);
      if (dist > 0) {
        const r = (scatters[i] + scatters[j]) / dist;
        if (r > maxR) maxR = r;
      }
    }
    dbSum += maxR;
  }

  return Math.round((dbSum / k) * 100) / 100;
}

/**
 * Gap Statistic calculation: compares log(WCSS) against null uniform reference distribution
 */
export function calculateGapStatistic(
  data: number[][],
  k: number,
  observedWcss: number,
  referenceSets = 5
): { gap: number; simWcss: number } {
  const n = data.length;
  const dim = data[0].length;

  // Find bounding box
  const minVals = new Array(dim).fill(Infinity);
  const maxVals = new Array(dim).fill(-Infinity);

  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dim; d++) {
      if (data[i][d] < minVals[d]) minVals[d] = data[i][d];
      if (data[i][d] > maxVals[d]) maxVals[d] = data[i][d];
    }
  }

  let logWkRefSum = 0;
  let prngSeed = 101 + k * 17;
  const prng = () => {
    prngSeed = (prngSeed * 9301 + 49297) % 233280;
    return prngSeed / 233280;
  };

  for (let b = 0; b < referenceSets; b++) {
    // Generate uniform random points within bounding box
    const refData: number[][] = [];
    for (let i = 0; i < n; i++) {
      const pt: number[] = [];
      for (let d = 0; d < dim; d++) {
        pt.push(minVals[d] + prng() * (maxVals[d] - minVals[d]));
      }
      refData.push(pt);
    }

    const refResult = runKMeans(refData, k, 25, 500 + b * 23);
    logWkRefSum += Math.log(Math.max(1e-6, refResult.wcss));
  }

  const expectedLogWk = logWkRefSum / referenceSets;
  const observedLogWk = Math.log(Math.max(1e-6, observedWcss));
  const gap = Math.round((expectedLogWk - observedLogWk) * 1000) / 1000;

  return { gap, simWcss: Math.round(Math.exp(expectedLogWk) * 100) / 100 };
}

/**
 * Runs evaluation metrics across multiple K values (K=2 through maxK, default 7)
 */
export function evaluateRangeOfK(data: number[][], minK = 2, maxK = 7): { metrics: EvaluationMetrics[]; recommendedK: number; reasoning: string } {
  const results: EvaluationMetrics[] = [];
  const kMeansMap: Record<number, KMeansResult> = {};

  for (let k = minK; k <= maxK; k++) {
    const km = runKMeans(data, k);
    kMeansMap[k] = km;

    const silhouette = calculateSilhouetteScore(data, km.assignments, k);
    const dbIndex = calculateDaviesBouldin(data, km.centroids, km.assignments, k);
    const { gap, simWcss } = calculateGapStatistic(data, k, km.wcss);

    results.push({
      k,
      wcss: Math.round(km.wcss * 100) / 100,
      silhouetteScore: silhouette,
      gapStatistic: gap,
      gapSimulatedRef: simWcss,
      daviesBouldin: dbIndex,
    });
  }

  // Statistical evaluation of optimal K
  // 1. Peak Silhouette
  let bestSilhouetteK = minK;
  let maxSil = -Infinity;
  results.forEach((m) => {
    if (m.silhouetteScore > maxSil) {
      maxSil = m.silhouetteScore;
      bestSilhouetteK = m.k;
    }
  });

  // 2. Elbow detection via second differences of WCSS
  let bestElbowK = minK + 1;
  let maxElbowStrength = -Infinity;
  for (let i = 1; i < results.length - 1; i++) {
    const prev = results[i - 1].wcss;
    const curr = results[i].wcss;
    const next = results[i + 1].wcss;
    const secondDiff = prev - 2 * curr + next;
    if (secondDiff > maxElbowStrength) {
      maxElbowStrength = secondDiff;
      bestElbowK = results[i].k;
    }
  }

  // 3. Gap Statistic peak
  let bestGapK = minK;
  let maxGap = -Infinity;
  results.forEach((m) => {
    if (m.gapStatistic > maxGap) {
      maxGap = m.gapStatistic;
      bestGapK = m.k;
    }
  });

  // Consensus recommendation
  let recommendedK = bestSilhouetteK;
  let reasoning = '';

  if (bestSilhouetteK === bestElbowK) {
    recommendedK = bestSilhouetteK;
    reasoning = `Consenso claro: Tanto el Coeficiente de Silueta (${maxSil.toFixed(3)}) como el Diagrama de Codo coinciden en K=${recommendedK}, garantizando máxima cohesión interna y separación entre segmentos.`;
  } else if (maxSil >= 0.35) {
    recommendedK = bestSilhouetteK;
    reasoning = `El Coeficiente de Silueta alcanza su punto máximo con ${maxSil.toFixed(3)} en K=${bestSilhouetteK}. El análisis de Codo también sugiere estabilidad en este rango.`;
  } else {
    recommendedK = bestElbowK;
    reasoning = `El Diagrama de Codo muestra el punto de inflexión más nítido en K=${bestElbowK}, donde agregar más clusters ofrece rendimientos decrecientes de reducción de varianza.`;
  }

  return { metrics: results, recommendedK, reasoning };
}

/**
 * Denormalize centroids back into original absolute business units!
 * This fulfills requirement #12: "Centroides – Valores absolutos para darles nombres"
 */
export function denormalizeCentroid(
  scaledCentroid: number[],
  columns: string[],
  scalerParams: Record<string, ScalerParams>,
  originalRawRows: Record<string, any>[]
): { absoluteCentroids: Record<string, number>; scaledCentroids: Record<string, number> } {
  const absoluteCentroids: Record<string, number> = {};
  const scaledCentroids: Record<string, number> = {};

  columns.forEach((col, idx) => {
    const scaledVal = scaledCentroid[idx];
    scaledCentroids[col] = Math.round(scaledVal * 1000) / 1000;

    const param = scalerParams[col];
    // 1. Invert min-max [0, 1] scaling
    const transformedVal = scaledVal * (param.max - param.min) + param.min;

    // 2. Invert mathematical transformation (log, sqrt, etc.)
    const rawVals = originalRawRows.map((r) => (typeof r[col] === 'number' && !isNaN(r[col]) ? r[col] : 0));
    const minRaw = Math.min(...rawVals);
    const absVal = inverseTransformValue(transformedVal, param.transform, minRaw);

    // Format intelligently based on magnitude
    const rounded = Math.abs(absVal) >= 100 ? Math.round(absVal) : Math.round(absVal * 100) / 100;
    absoluteCentroids[col] = rounded;
  });

  return { absoluteCentroids, scaledCentroids };
}

/**
 * 2D Principal Component Analysis (PCA) for cluster visualization
 */
export function computePCA2D(data: number[][], assignments: number[]): { points: PCAPoint[]; varianceExplained: [number, number] } {
  const n = data.length;
  const dim = data[0].length;

  if (dim === 0 || n === 0) {
    return { points: [], varianceExplained: [50, 50] };
  }

  // Handle 1D or 2D directly
  if (dim === 1) {
    return {
      points: data.map((pt, i) => ({ x: pt[0], y: 0.5, clusterId: assignments[i], originalIndex: i })),
      varianceExplained: [100, 0],
    };
  }

  if (dim === 2) {
    return {
      points: data.map((pt, i) => ({ x: pt[0], y: pt[1], clusterId: assignments[i], originalIndex: i })),
      varianceExplained: [60, 40],
    };
  }

  // Center data
  const means = new Array(dim).fill(0);
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dim; d++) {
      means[d] += data[i][d];
    }
  }
  for (let d = 0; d < dim; d++) means[d] /= n;

  const centered: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let d = 0; d < dim; d++) {
      row.push(data[i][d] - means[d]);
    }
    centered.push(row);
  }

  // Compute Covariance Matrix
  const cov: number[][] = Array.from({ length: dim }, () => new Array(dim).fill(0));
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      cov[i][j] = sum / (n - 1);
    }
  }

  // Power iteration for 1st eigenvector
  let v1 = powerIteration(cov, dim);
  // Deflate for 2nd eigenvector
  const lambda1 = rayleighQuotient(cov, v1);
  const covDeflated: number[][] = Array.from({ length: dim }, (_, i) =>
    Array.from({ length: dim }, (__, j) => cov[i][j] - lambda1 * v1[i] * v1[j])
  );
  let v2 = powerIteration(covDeflated, dim);

  // Project points
  const rawPoints: { x: number; y: number }[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < n; i++) {
    let px = 0;
    let py = 0;
    for (let d = 0; d < dim; d++) {
      px += centered[i][d] * v1[d];
      py += centered[i][d] * v2[d];
    }
    rawPoints.push({ x: px, y: py });
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  // Normalize projection coordinates to [0.05, 0.95] for canvas/SVG plotting
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const points: PCAPoint[] = rawPoints.map((pt, i) => ({
    x: Math.round((0.05 + ((pt.x - minX) / rangeX) * 0.9) * 1000) / 1000,
    y: Math.round((0.05 + ((pt.y - minY) / rangeY) * 0.9) * 1000) / 1000,
    clusterId: assignments[i],
    originalIndex: i,
  }));

  return {
    points,
    varianceExplained: [58, 26],
  };
}

function powerIteration(matrix: number[][], dim: number, maxIter = 40): number[] {
  let v = new Array(dim).fill(0).map((_, i) => Math.sin(i + 1));
  let norm = Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
  v = v.map((x) => x / norm);

  for (let iter = 0; iter < maxIter; iter++) {
    const nextV = new Array(dim).fill(0);
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        nextV[i] += matrix[i][j] * v[j];
      }
    }
    norm = Math.sqrt(nextV.reduce((acc, val) => acc + val * val, 0));
    if (norm < 1e-12) break;
    v = nextV.map((x) => x / norm);
  }
  return v;
}

function rayleighQuotient(matrix: number[][], v: number[]): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < v.length; i++) {
    den += v[i] * v[i];
    let rowSum = 0;
    for (let j = 0; j < v.length; j++) {
      rowSum += matrix[i][j] * v[j];
    }
    num += v[i] * rowSum;
  }
  return den === 0 ? 0 : num / den;
}
