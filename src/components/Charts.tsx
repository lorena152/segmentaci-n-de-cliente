import React, { useState } from 'react';
import { HistogramData, EvaluationMetrics, PCAPoint } from '../types';
import { CLUSTER_PALETTE } from '../utils/strategyEngine';

// ==========================================
// 1. HISTOGRAM CHART (SVG)
// ==========================================
interface HistogramChartProps {
  data: HistogramData;
  title?: string;
  color?: string;
  showStats?: boolean;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  data,
  title,
  color = '#3B82F6',
  showStats = true,
}) => {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);

  const width = 480;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 40, left: 45 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const maxCount = Math.max(...data.bins.map((b) => b.count), 1);
  const binCount = data.bins.length;
  const barWidth = binCount > 0 ? innerW / binCount : 0;

  // X position scale
  const range = data.max - data.min || 1;
  const getX = (val: number) => {
    return margin.left + ((val - data.min) / range) * innerW;
  };

  const meanX = getX(data.mean);
  const medianX = getX(data.median);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>{title || data.column}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              data.skewness > 0.5
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : data.skewness < -0.5
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            Sesgo: {data.skewness > 0.5 ? 'Derecha' : data.skewness < -0.5 ? 'Izquierda' : 'Simétrico'} (
            {data.skewness.toFixed(2)})
          </span>
        </h4>

        {hoveredBin !== null && data.bins[hoveredBin] && (
          <div className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded-sm">
            [{data.bins[hoveredBin].x0} - {data.bins[hoveredBin].x1}]: {data.bins[hoveredBin].count} filas (
            {data.bins[hoveredBin].percentage}%)
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = margin.top + innerH * (1 - pct);
          const val = Math.round(maxCount * pct);
          return (
            <g key={i}>
              <line
                x1={margin.left}
                y1={y}
                x2={width - margin.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800 stroke-1"
                strokeDasharray={i === 0 ? undefined : '3,3'}
              />
              <text
                x={margin.left - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Histogram Bars */}
        {data.bins.map((bin, i) => {
          const barH = (bin.count / maxCount) * innerH;
          const x = margin.left + i * barWidth;
          const y = margin.top + innerH - barH;
          const isHovered = hoveredBin === i;

          return (
            <rect
              key={i}
              x={x + 1}
              y={y}
              width={Math.max(1, barWidth - 2)}
              height={Math.max(1, barH)}
              fill={isHovered ? '#1D4ED8' : color}
              opacity={isHovered ? 1 : 0.85}
              rx={2}
              className="transition-colors cursor-pointer"
              onMouseEnter={() => setHoveredBin(i)}
              onMouseLeave={() => setHoveredBin(null)}
            />
          );
        })}

        {/* Mean & Median vertical guide lines */}
        {showStats && !isNaN(meanX) && meanX >= margin.left && meanX <= width - margin.right && (
          <g>
            <line
              x1={meanX}
              y1={margin.top}
              x2={meanX}
              y2={height - margin.bottom}
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
            <text x={meanX} y={margin.top - 4} textAnchor="middle" className="text-[9px] fill-rose-600 font-bold">
              Media: {data.mean}
            </text>
          </g>
        )}

        {showStats && !isNaN(medianX) && medianX >= margin.left && medianX <= width - margin.right && (
          <g>
            <line
              x1={medianX}
              y1={margin.top + 8}
              x2={medianX}
              y2={height - margin.bottom}
              stroke="#10B981"
              strokeWidth={1.5}
            />
            <text x={medianX} y={margin.top + 6} textAnchor="middle" className="text-[9px] fill-emerald-600 font-bold">
              Mediana: {data.median}
            </text>
          </g>
        )}

        {/* X axis ticks */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={width - margin.right}
          y2={height - margin.bottom}
          stroke="currentColor"
          className="text-slate-400 stroke-1"
        />
        <text
          x={margin.left}
          y={height - margin.bottom + 14}
          textAnchor="start"
          className="text-[10px] fill-slate-500 font-mono"
        >
          Min: {data.min}
        </text>
        <text
          x={width - margin.right}
          y={height - margin.bottom + 14}
          textAnchor="end"
          className="text-[10px] fill-slate-500 font-mono"
        >
          Max: {data.max}
        </text>
      </svg>
    </div>
  );
};

// ==========================================
// 2. ELBOW & SILHOUETTE & GAP MULTI-CHART
// ==========================================
interface EvaluationChartProps {
  metrics: EvaluationMetrics[];
  selectedK: number;
  recommendedK: number;
  onSelectK?: (k: number) => void;
}

export const EvaluationChart: React.FC<EvaluationChartProps> = ({
  metrics,
  selectedK,
  recommendedK,
  onSelectK,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'elbow' | 'silhouette' | 'gap'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{ k: number; metric: string; val: number } | null>(null);

  if (metrics.length === 0) return null;

  const width = 640;
  const height = 280;
  const margin = { top: 25, right: 30, bottom: 45, left: 55 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const minK = metrics[0].k;
  const maxK = metrics[metrics.length - 1].k;
  const kRange = maxK - minK || 1;

  const getX = (k: number) => margin.left + ((k - minK) / kRange) * innerW;

  // Scales for WCSS
  const maxWcss = Math.max(...metrics.map((m) => m.wcss), 1);
  const minWcss = Math.min(...metrics.map((m) => m.wcss), 0);
  const getY_wcss = (val: number) => {
    const norm = (val - minWcss) / (maxWcss - minWcss || 1);
    return margin.top + innerH * (1 - norm);
  };

  // Scales for Silhouette (-0.1 to 1)
  const maxSil = Math.max(...metrics.map((m) => m.silhouetteScore), 0.5);
  const minSil = Math.min(...metrics.map((m) => m.silhouetteScore), 0);
  const getY_sil = (val: number) => {
    const norm = (val - minSil) / (maxSil - minSil || 1);
    return margin.top + innerH * (1 - norm);
  };

  // Scales for Gap
  const maxGap = Math.max(...metrics.map((m) => m.gapStatistic), 0.5);
  const minGap = Math.min(...metrics.map((m) => m.gapStatistic), 0);
  const getY_gap = (val: number) => {
    const norm = (val - minGap) / (maxGap - minGap || 1);
    return margin.top + innerH * (1 - norm);
  };

  // Generate SVG path strings
  const wcssPath = metrics.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY_wcss(m.wcss)}`).join(' ');
  const silPath = metrics.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY_sil(m.silhouetteScore)}`).join(' ');
  const gapPath = metrics.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY_gap(m.gapStatistic)}`).join(' ');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Diagnóstico de Número Óptimo de Clusters (K)
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
              Óptimo Estadístico: K={recommendedK}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparativa simultánea de Método del Codo (Inercia WCSS), Coeficiente de Silueta y Estadístico GAP.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos (Normalizado)
          </button>
          <button
            onClick={() => setActiveTab('elbow')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'elbow'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            1. Codo (Inercia)
          </button>
          <button
            onClick={() => setActiveTab('silhouette')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'silhouette'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            2. Silueta
          </button>
          <button
            onClick={() => setActiveTab('gap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'gap'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            3. GAP Statistic
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Horizontal grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = margin.top + innerH * (1 - pct);
            return (
              <line
                key={i}
                x1={margin.left}
                y1={y}
                x2={width - margin.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800 stroke-1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Vertical K grid & labels */}
          {metrics.map((m) => {
            const x = getX(m.k);
            const isRec = m.k === recommendedK;
            const isSel = m.k === selectedK;

            return (
              <g key={m.k}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="currentColor"
                  className={
                    isSel
                      ? 'text-blue-500 dark:text-blue-400 stroke-2'
                      : isRec
                      ? 'text-amber-400 dark:text-amber-500 stroke-1'
                      : 'text-slate-100 dark:text-slate-800 stroke-1'
                  }
                  strokeDasharray={isSel ? undefined : '2,2'}
                />

                {/* Clickable K column selector */}
                <rect
                  x={x - 20}
                  y={margin.top}
                  width={40}
                  height={innerH + 30}
                  fill="transparent"
                  className="cursor-pointer hover:fill-blue-50/20"
                  onClick={() => onSelectK?.(m.k)}
                />

                {/* K label on bottom */}
                <text
                  x={x}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  className={`text-xs font-mono font-bold cursor-pointer ${
                    isSel
                      ? 'fill-blue-600 dark:fill-blue-400 font-extrabold text-sm'
                      : 'fill-slate-600 dark:fill-slate-400'
                  }`}
                  onClick={() => onSelectK?.(m.k)}
                >
                  K = {m.k}
                </text>

                {isRec && (
                  <text
                    x={x}
                    y={height - margin.bottom + 32}
                    textAnchor="middle"
                    className="text-[9px] fill-amber-600 dark:fill-amber-400 font-bold"
                  >
                    ★ Óptimo
                  </text>
                )}
              </g>
            );
          })}

          {/* 1. Elbow Line (WCSS) */}
          {(activeTab === 'all' || activeTab === 'elbow') && (
            <g>
              <path d={wcssPath} fill="none" stroke="#2563EB" strokeWidth={3} className="transition-all" />
              {metrics.map((m) => {
                const cx = getX(m.k);
                const cy = getY_wcss(m.wcss);
                return (
                  <circle
                    key={m.k}
                    cx={cx}
                    cy={cy}
                    r={m.k === selectedK ? 7 : 4.5}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="cursor-pointer hover:r-8 transition-all"
                    onMouseEnter={() => setHoveredPoint({ k: m.k, metric: 'Inercia WCSS (Codo)', val: m.wcss })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onSelectK?.(m.k)}
                  />
                );
              })}
            </g>
          )}

          {/* 2. Silhouette Line */}
          {(activeTab === 'all' || activeTab === 'silhouette') && (
            <g>
              <path d={silPath} fill="none" stroke="#10B981" strokeWidth={3} className="transition-all" />
              {metrics.map((m) => {
                const cx = getX(m.k);
                const cy = getY_sil(m.silhouetteScore);
                return (
                  <circle
                    key={m.k}
                    cx={cx}
                    cy={cy}
                    r={m.k === selectedK ? 7 : 4.5}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="cursor-pointer hover:r-8 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ k: m.k, metric: 'Coef. de Silueta', val: m.silhouetteScore })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onSelectK?.(m.k)}
                  />
                );
              })}
            </g>
          )}

          {/* 3. Gap Statistic Line */}
          {(activeTab === 'all' || activeTab === 'gap') && (
            <g>
              <path d={gapPath} fill="none" stroke="#8B5CF6" strokeWidth={2.5} strokeDasharray="5,3" />
              {metrics.map((m) => {
                const cx = getX(m.k);
                const cy = getY_gap(m.gapStatistic);
                return (
                  <polygon
                    key={m.k}
                    points={`${cx},${cy - 5} ${cx + 5},${cy + 4} ${cx - 5},${cy + 4}`}
                    fill="#8B5CF6"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    className="cursor-pointer hover:scale-125 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ k: m.k, metric: 'Estadístico GAP', val: m.gapStatistic })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onSelectK?.(m.k)}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none flex items-center gap-2 border border-slate-700">
            <span className="font-semibold">{hoveredPoint.metric}:</span>
            <span className="font-mono">{hoveredPoint.val}</span>
            <span className="text-slate-400">(K = {hoveredPoint.k})</span>
          </div>
        )}
      </div>

      {/* Legend & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span>Inercia / Codo (WCSS - menor es mejor)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Silueta (mayor es mejor, max = 1.0)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
            <span className="w-3 h-3 bg-purple-600 inline-block rotate-45" />
            <span>GAP (mayor distancia vs nulo)</span>
          </div>
        </div>

        <div className="text-slate-500 dark:text-slate-400">
          Haz clic en cualquier punto o etiqueta <span className="font-mono font-bold text-slate-800 dark:text-slate-200">K=#</span> para seleccionarlo como regla de negocio.
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. RADAR CHART (SPIDER / PERFILES)
// ==========================================
interface RadarChartProps {
  variables: string[];
  profiles: {
    id: number;
    name: string;
    color: string;
    scaledCentroids: Record<string, number>;
  }[];
  activeClusterId?: number | null;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  variables,
  profiles,
  activeClusterId,
}) => {
  const size = 380;
  const center = size / 2;
  const radius = size * 0.38;
  const numVars = variables.length;

  if (numVars < 2) return null;

  // Angles for each variable
  const angleStep = (2 * Math.PI) / numVars;

  const getCoordinates = (normValue: number, varIdx: number) => {
    const angle = varIdx * angleStep - Math.PI / 2;
    const r = normValue * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Radar Multidimensional de Perfiles
        </h4>
        <span className="text-xs text-slate-500">Escala Normalizada [0, 1]</span>
      </div>

      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px] h-auto overflow-visible select-none">
        {/* Concentric spider rings */}
        {[0.25, 0.5, 0.75, 1.0].map((ring) => (
          <g key={ring}>
            <polygon
              points={variables
                .map((_, i) => {
                  const pt = getCoordinates(ring, i);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth={1}
            />
            <text
              x={center + 4}
              y={center - ring * radius + 10}
              className="text-[8px] fill-slate-400 font-mono"
            >
              {Math.round(ring * 100)}%
            </text>
          </g>
        ))}

        {/* Axis spokes & labels */}
        {variables.map((col, i) => {
          const outerPt = getCoordinates(1.0, i);
          const labelPt = getCoordinates(1.18, i);

          return (
            <g key={col}>
              <line
                x1={center}
                y1={center}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeWidth={1}
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-semibold fill-slate-700 dark:fill-slate-300 max-w-[70px]"
              >
                {col.length > 14 ? col.slice(0, 12) + '…' : col}
              </text>
            </g>
          );
        })}

        {/* Polygons for each cluster profile */}
        {profiles.map((p) => {
          const isFaded = activeClusterId && activeClusterId !== p.id;
          const isHighlighted = activeClusterId === p.id;

          const pointsStr = variables
            .map((col, idx) => {
              const val = Math.max(0.05, Math.min(1, p.scaledCentroids[col] ?? 0.5));
              const pt = getCoordinates(val, idx);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');

          return (
            <g key={p.id} className="transition-opacity duration-200" opacity={isFaded ? 0.2 : 1}>
              <polygon
                points={pointsStr}
                fill={p.color}
                fillOpacity={isHighlighted ? 0.45 : 0.2}
                stroke={p.color}
                strokeWidth={isHighlighted ? 3 : 2}
              />
              {/* Vertex dots */}
              {variables.map((col, idx) => {
                const val = Math.max(0.05, Math.min(1, p.scaledCentroids[col] ?? 0.5));
                const pt = getCoordinates(val, idx);
                return (
                  <circle
                    key={col}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHighlighted ? 4.5 : 3}
                    fill={p.color}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 4. 2D PCA CLUSTER SCATTER PLOT
// ==========================================
interface ScatterPlotProps {
  points: PCAPoint[];
  clusterNames: Record<number, string>;
  activeClusterId?: number | null;
  onSelectCluster?: (id: number) => void;
}

export const ScatterPlot2D: React.FC<ScatterPlotProps> = ({
  points,
  clusterNames,
  activeClusterId,
  onSelectCluster,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PCAPoint | null>(null);

  const width = 480;
  const height = 300;
  const padding = 25;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Proyección Espacial 2D (PCA)
          </h4>
          <p className="text-xs text-slate-500">
            Distribución y separación geométrica real de los clientes en 2 dimensiones clave.
          </p>
        </div>

        {hoveredPoint && (
          <div className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md shadow-md">
            Fila #{hoveredPoint.originalIndex + 1}: {clusterNames[hoveredPoint.clusterId] || `C${hoveredPoint.clusterId + 1}`}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Background grid */}
        <rect
          x={padding}
          y={padding}
          width={width - 2 * padding}
          height={height - 2 * padding}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={1}
          rx={6}
        />

        {/* Center axes */}
        <line
          x1={width / 2}
          y1={padding}
          x2={width / 2}
          y2={height - padding}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeDasharray="3,3"
        />
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeDasharray="3,3"
        />

        {/* Data points */}
        {points.map((pt, i) => {
          const cx = padding + pt.x * (width - 2 * padding);
          const cy = padding + (1 - pt.y) * (height - 2 * padding);
          const clusterColor = CLUSTER_PALETTE[pt.clusterId % CLUSTER_PALETTE.length];
          const isFaded = activeClusterId !== undefined && activeClusterId !== null && activeClusterId !== pt.clusterId + 1;
          const isSelected = activeClusterId === pt.clusterId + 1;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isSelected ? 5.5 : 3.5}
              fill={clusterColor}
              opacity={isFaded ? 0.2 : 0.85}
              stroke="#FFFFFF"
              strokeWidth={isSelected ? 1.5 : 0.8}
              className="cursor-pointer transition-all hover:scale-150"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => onSelectCluster?.(pt.clusterId + 1)}
            />
          );
        })}
      </svg>
    </div>
  );
};
