/**
 * Statistical engine for univariate analysis, business rules,
 * skewness detection, histogram binning, transformation, and [0, 1] standardization.
 */

import {
  SummaryStats,
  HistogramData,
  HistogramBin,
  TransformType,
  BusinessRuleLimit,
} from '../types';

export function calculateSummaryStats(values: number[], column: string): SummaryStats {
  const clean = values.filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  const n = clean.length;

  if (n === 0) {
    return {
      column,
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      skewness: 0,
      skewnessType: 'symmetric',
    };
  }

  const sum = clean.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (clean[mid - 1] + clean[mid]) / 2 : clean[mid];

  // Quantiles
  const q1 = getQuantile(clean, 0.25);
  const q3 = getQuantile(clean, 0.75);
  const iqr = q3 - q1;

  // Min and Max
  const min = clean[0];
  const max = clean[n - 1];

  // Variance and StdDev
  const variance = clean.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // Fisher-Pearson Skewness
  let skewness = 0;
  if (n > 2 && stdDev > 0) {
    const m3 = clean.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    skewness = (n / ((n - 1) * (n - 2))) * m3;
  }

  let skewnessType: 'positive' | 'symmetric' | 'negative' = 'symmetric';
  if (skewness > 0.5) skewnessType = 'positive';
  else if (skewness < -0.5) skewnessType = 'negative';

  return {
    column,
    count: n,
    mean: round(mean, 2),
    median: round(median, 2),
    stdDev: round(stdDev, 2),
    min: round(min, 2),
    max: round(max, 2),
    q1: round(q1, 2),
    q3: round(q3, 2),
    iqr: round(iqr, 2),
    skewness: round(skewness, 2),
    skewnessType,
  };
}

function getQuantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

export function buildHistogram(values: number[], column: string, binCount = 12): HistogramData {
  const clean = values.filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  const n = clean.length;

  if (n === 0) {
    return {
      column,
      bins: [],
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      skewness: 0,
    };
  }

  const min = clean[0];
  const max = clean[n - 1];
  const range = max - min;
  const stats = calculateSummaryStats(clean, column);

  if (range === 0) {
    return {
      column,
      bins: [{ x0: min, x1: max, count: n, percentage: 100 }],
      min,
      max,
      mean: stats.mean,
      median: stats.median,
      skewness: stats.skewness,
    };
  }

  const step = range / binCount;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const x0 = min + i * step;
    const x1 = i === binCount - 1 ? max : min + (i + 1) * step;
    bins.push({
      x0: round(x0, 2),
      x1: round(x1, 2),
      count: 0,
      percentage: 0,
    });
  }

  for (const v of clean) {
    let placed = false;
    for (let i = 0; i < binCount; i++) {
      const isLast = i === binCount - 1;
      if ((v >= bins[i].x0 && v < bins[i].x1) || (isLast && v <= bins[i].x1)) {
        bins[i].count++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins[binCount - 1].count++;
    }
  }

  bins.forEach((b) => {
    b.percentage = round((b.count / n) * 100, 1);
  });

  return {
    column,
    bins,
    min: stats.min,
    max: stats.max,
    mean: stats.mean,
    median: stats.median,
    skewness: stats.skewness,
  };
}

/**
 * Applies Business Rules (Max and Min constraints).
 * Mode: 'clamp' (winsorize) keeps all rows by setting boundaries.
 * Mode: 'filter' discards rows out of range.
 */
export function applyBusinessRules(
  rows: Record<string, any>[],
  rules: Record<string, BusinessRuleLimit>
): { processedRows: Record<string, any>[]; affectedCount: number; filteredOutCount: number } {
  let affectedCount = 0;
  let filteredOutCount = 0;

  const ruleKeys = Object.keys(rules);
  if (ruleKeys.length === 0) {
    return { processedRows: [...rows], affectedCount: 0, filteredOutCount: 0 };
  }

  const result: Record<string, any>[] = [];

  for (const row of rows) {
    let keepRow = true;
    let modified = false;
    const clonedRow = { ...row };

    for (const key of ruleKeys) {
      const rule = rules[key];
      const val = clonedRow[key];
      if (typeof val !== 'number' || isNaN(val)) continue;

      const hasMinViolation = rule.minRule !== undefined && val < rule.minRule;
      const hasMaxViolation = rule.maxRule !== undefined && val > rule.maxRule;

      if (hasMinViolation || hasMaxViolation) {
        if (rule.action === 'filter') {
          keepRow = false;
          filteredOutCount++;
          break;
        } else {
          // Clamp / Winsorize
          if (hasMinViolation && rule.minRule !== undefined) {
            clonedRow[key] = rule.minRule;
            modified = true;
          }
          if (hasMaxViolation && rule.maxRule !== undefined) {
            clonedRow[key] = rule.maxRule;
            modified = true;
          }
        }
      }
    }

    if (keepRow) {
      if (modified) affectedCount++;
      result.push(clonedRow);
    }
  }

  return { processedRows: result, affectedCount, filteredOutCount };
}

/**
 * Mathematical transformations to correct skewness
 */
export function transformValue(val: number, type: TransformType, minInCol = 0): number {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  if (type === 'none') return val;

  if (type === 'log1p') {
    // If val is negative or has min < 0, shift so all values are >= 0
    const shift = minInCol < 0 ? Math.abs(minInCol) : 0;
    const adjusted = Math.max(0, val + shift);
    return Math.log1p(adjusted);
  }

  if (type === 'sqrt') {
    const shift = minInCol < 0 ? Math.abs(minInCol) : 0;
    return Math.sqrt(Math.max(0, val + shift));
  }

  return val;
}

/**
 * Inverse transformation to recover original business units for centroids
 */
export function inverseTransformValue(val: number, type: TransformType, minInCol = 0): number {
  if (type === 'none') return val;
  const shift = minInCol < 0 ? Math.abs(minInCol) : 0;

  if (type === 'log1p') {
    return Math.expm1(val) - shift;
  }

  if (type === 'sqrt') {
    return Math.pow(val, 2) - shift;
  }

  return val;
}

/**
 * Standardization to [0, 1] (Min-Max Scaling)
 */
export interface ScalerParams {
  column: string;
  min: number;
  max: number;
  transform: TransformType;
}

export function standardizeMinMax(
  rows: Record<string, any>[],
  columns: string[],
  transforms: Record<string, TransformType>
): {
  scaledMatrix: number[][];
  scalerParams: Record<string, ScalerParams>;
  transformedValuesPerCol: Record<string, number[]>;
} {
  const scalerParams: Record<string, ScalerParams> = {};
  const transformedValuesPerCol: Record<string, number[]> = {};

  // 1. Transform columns first
  for (const col of columns) {
    const transform = transforms[col] || 'none';
    const rawVals = rows.map((r) => (typeof r[col] === 'number' && !isNaN(r[col]) ? r[col] : 0));
    const minRaw = Math.min(...rawVals);

    const transformed = rawVals.map((v) => transformValue(v, transform, minRaw));
    transformedValuesPerCol[col] = transformed;

    const tMin = Math.min(...transformed);
    const tMax = Math.max(...transformed);

    scalerParams[col] = {
      column: col,
      min: tMin,
      max: tMax,
      transform,
    };
  }

  // 2. Scale each row to [0, 1]
  const scaledMatrix: number[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const vector: number[] = [];
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const param = scalerParams[col];
      const tVal = transformedValuesPerCol[col][r];
      const denom = param.max - param.min;
      const scaled = denom === 0 ? 0.5 : (tVal - param.min) / denom;
      // Clamp strictly between 0 and 1
      vector.push(Math.max(0, Math.min(1, scaled)));
    }
    scaledMatrix.push(vector);
  }

  return { scaledMatrix, scalerParams, transformedValuesPerCol };
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
