import React from 'react';
import { EvaluationMetrics } from '../types';
import { EvaluationChart } from './Charts';
import { Scale, CheckCircle2, ArrowRight, ArrowLeft, Lightbulb, TrendingDown, Layers, Award } from 'lucide-react';

interface Step5StandardizationProps {
  scaledMatrix: number[][];
  columns: string[];
  metrics: EvaluationMetrics[];
  recommendedK: number;
  reasoning: string;
  selectedK: number;
  onSelectK: (k: number) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const Step5Standardization: React.FC<Step5StandardizationProps> = ({
  scaledMatrix,
  columns,
  metrics,
  recommendedK,
  reasoning,
  selectedK,
  onSelectK,
  onProceed,
  onBack,
}) => {
  const sampleScaledRows = scaledMatrix.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 9. Header & Standardization 0-1 explanation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Scale className="w-4 h-4" />
            <span>Paso 5 de 7 • Estandarización [0, 1] & Diagnóstico Estadístico</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Estandarización 0 a 1 & Identificación de K (Codo, Silueta, GAP)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
            Para evitar que variables con unidades grandes (ej. Gasto en miles de USD) dominen por completo sobre variables pequeñas (ej. Frecuencia de 1 a 10),
            todas las dimensiones se escalan linealmente al rango estricto <span className="font-semibold text-blue-600 font-mono">[0.00, 1.00]</span> mediante Min-Max Scaling.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Matriz {scaledMatrix.length}×{columns.length} Estandarizada [0, 1]</span>
        </div>
      </div>

      {/* Scaled Data Sample Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>Muestra de Vectores Estandarizados en el Hipercubo Unitario [0, 1]</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400">Min: 0.000 | Max: 1.000</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="p-2.5 text-center font-sans w-12">#</th>
                {columns.map((c) => (
                  <th key={c} className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                    {c} (norm)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sampleScaledRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-2.5 text-center text-slate-400 font-sans font-bold">{rIdx + 1}</td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-blue-900 dark:text-blue-300 font-medium">
                      {val.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. Multi-metric Interactive Chart (Elbow, Silhouette, GAP) */}
      <EvaluationChart
        metrics={metrics}
        selectedK={selectedK}
        recommendedK={recommendedK}
        onSelectK={onSelectK}
      />

      {/* Statistical Verdict & Reasoning Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl p-5 border border-blue-200 dark:border-blue-900 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Award className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100">
              Veredicto Estadístico Automatizado: K = {recommendedK} Clusters Óptimos
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-bold">
              Mayor Estabilidad
            </span>
          </div>
          <p className="text-xs text-blue-900/80 dark:text-blue-200 leading-relaxed">
            {reasoning}
          </p>
        </div>
      </div>

      {/* Comparative Evaluation Metrics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Tabla Comparativa de Rendimiento Estadístico por cada K</span>
          </h3>
          <span className="text-xs text-slate-500">Haz clic en una fila para adoptar ese K</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="p-3 font-semibold font-mono">K (# Clusters)</th>
                <th className="p-3 font-semibold font-mono text-right">Inercia WCSS (Codo)</th>
                <th className="p-3 font-semibold font-mono text-right">Coef. Silueta</th>
                <th className="p-3 font-semibold font-mono text-right">Estadístico GAP</th>
                <th className="p-3 font-semibold font-mono text-right">Davies-Bouldin</th>
                <th className="p-3 font-semibold text-center">Diagnóstico</th>
                <th className="p-3 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {metrics.map((m) => {
                const isRec = m.k === recommendedK;
                const isSelected = m.k === selectedK;

                return (
                  <tr
                    key={m.k}
                    onClick={() => onSelectK(m.k)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">K = {m.k}</span>
                        {isRec && (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                            ★ Recomendado
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                            Seleccionado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right text-blue-700 dark:text-blue-300 font-semibold">
                      {m.wcss.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-semibold ${
                          m.silhouetteScore >= 0.4
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : m.silhouetteScore >= 0.25
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-amber-600'
                        }`}
                      >
                        {m.silhouetteScore.toFixed(3)}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-700 dark:text-purple-300 font-semibold">
                      {m.gapStatistic.toFixed(3)}
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      {m.daviesBouldin.toFixed(2)}
                    </td>
                    <td className="p-3 text-center font-sans text-[11px]">
                      {m.silhouetteScore >= 0.4 ? (
                        <span className="text-emerald-600 font-semibold">Excelente cohesión</span>
                      ) : m.silhouetteScore >= 0.25 ? (
                        <span className="text-blue-600 font-medium">Estructura razonable</span>
                      ) : (
                        <span className="text-amber-600">Clusters solapados</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectK(m.k);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Activo' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Histogramas</span>
        </button>

        <button
          onClick={onProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <span>Avanzar a Selección de K & Centroides Absolutos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
