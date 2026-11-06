/**
 * Types for SegmentIQ - Segmentation and Business Strategy Platform
 */

export type SectorType =
  | 'retail'
  | 'banking'
  | 'saas'
  | 'telecom'
  | 'healthcare'
  | 'hospitality'
  | 'cpg'
  | 'other';

export interface SectorInfo {
  id: SectorType;
  name: string;
  iconName: string;
  description: string;
  typicalVariables: string[];
}

export type VariableType = 'continuous_numeric' | 'discrete_numeric' | 'categorical' | 'identifier';

export interface ColumnMetadata {
  name: string;
  type: VariableType;
  isContinuousNumeric: boolean;
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
  totalCount: number;
}

export interface SummaryStats {
  column: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number; // Fisher-Pearson skewness
  skewnessType: 'positive' | 'symmetric' | 'negative';
}

export interface BusinessRuleLimit {
  column: string;
  minRule?: number;
  maxRule?: number;
  action: 'clamp' | 'filter'; // clamp (winsorize) or filter out
}

export type TransformType = 'none' | 'log1p' | 'sqrt';

export interface TransformConfig {
  column: string;
  type: TransformType;
  recommendedType?: TransformType;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
  percentage: number;
}

export interface HistogramData {
  column: string;
  bins: HistogramBin[];
  min: number;
  max: number;
  mean: number;
  median: number;
  skewness: number;
}

export interface EvaluationMetrics {
  k: number;
  wcss: number; // Inercia / Elbow
  silhouetteScore: number; // Coeficiente de silueta
  gapStatistic: number; // GAP statistic
  gapSimulatedRef: number;
  daviesBouldin: number;
}

export interface ClusterAssignment {
  rowIndex: number;
  clusterId: number;
}

export interface ClusterProfile {
  id: number;
  name: string;
  color: string;
  size: number;
  percentage: number;
  // Normalized centroids [0, 1] for radar chart
  scaledCentroids: Record<string, number>;
  // Absolute original centroids in business units
  absoluteCentroids: Record<string, number>;
  keyDifferentiators: {
    variable: string;
    absVal: number;
    populationMean: number;
    deviationPct: number;
    tag: 'alto' | 'medio' | 'bajo';
  }[];
  // Business strategies
  personaSummary: string;
  pricingStrategy: string;
  innovationStrategy: string;
  loyaltyStrategy: string;
  growthTactics: string[];
  kpisToWatch: string[];
}

export interface ExecutiveSummary {
  keyInsights: string[];
  quickWins: string[];
  estimatedRevenueImpact: string;
}

export interface StrategyPlan {
  source: 'heuristic' | 'gemini';
  executiveSummary: ExecutiveSummary;
  clusterProfiles: Record<number, Partial<ClusterProfile>>;
}

export interface PCAPoint {
  x: number;
  y: number;
  clusterId: number;
  originalIndex: number;
  label?: string;
}

export interface StepNavigation {
  currentStep: number;
  maxCompletedStep: number;
}
