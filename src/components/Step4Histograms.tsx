import React from 'react';
import { HistogramData, TransformType } from '../types';
import { HistogramChart } from './Charts';
import { BarChart3, Wand2, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

interface Step4HistogramsProps {
  originalHistograms: Record<string, HistogramData>;
  transformedHistograms: Record<string, HistogramData>;
  transformConfigs: Record<string, TransformType>;
  onUpdateTransform: (column: string, type: TransformType) => void;
  onApplyAllRecommended: () => void;
  onProceed: () => void;
  onBack: () => void;
}

export const Step4Histograms: React.FC<Step4HistogramsProps> = ({
  originalHistograms,
  transformedHistograms,
  transformConfigs,
  onUpdateTransform,
  onApplyAllRecommended,
  onProceed,
  onBack,
}) => {
  const columnNames = Object.keys(originalHistograms);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Explanation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Paso 4 de 7 • Validación de Distribución & Normalización</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Histogramas para Validar Sesgos & Transformación de Datos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
            El algoritmo K-Means asume clusters de forma esférica. Variables con fuerte sesgo a la derecha (asimetría &gt; 0.5 típica en ingresos o transacciones) concentran los puntos en un rincón y crean clusters artificiales.
            Aplica una transformación matemática (como <span className="font-semibold text-blue-600">Log1p</span> o <span className="font-semibold text-blue-600">Raíz Cuadrada</span>) para simetrizar la curva.
          </p>
        </div>

        <button
          onClick={onApplyAllRecommended}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Aplicar Transformaciones Óptimas Automáticas</span>
        </button>
      </div>

      {/* Histograms & Transformation Matrix */}
      <div className="space-y-6">
        {columnNames.map((col) => {
          const origH = originalHistograms[col];
          const transH = transformedHistograms[col] || origH;
          const currentTransform = transformConfigs[col] || 'none';

          const isSkewed = Math.abs(origH.skewness) > 0.5;
          const recommended: TransformType = origH.skewness > 1.0 ? 'log1p' : origH.skewness > 0.5 ? 'sqrt' : 'none';

          return (
            <div
              key={col}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <span>{col}</span>
                    {isSkewed ? (
                      <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Sesgo Significativo (Asimetría: {origH.skewness})
                      </span>
                    ) : (
                      <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Distribución Aceptable (Asimetría: {origH.skewness})
                      </span>
                    )}
                  </h3>
                </div>

                {/* Transform selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Transformación Matemática:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                    <button
                      onClick={() => onUpdateTransform(col, 'none')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        currentTransform === 'none'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Ninguna (Crudo)
                    </button>
                    <button
                      onClick={() => onUpdateTransform(col, 'log1p')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        currentTransform === 'log1p'
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Logarítmica (log(x+1))
                    </button>
                    <button
                      onClick={() => onUpdateTransform(col, 'sqrt')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        currentTransform === 'sqrt'
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Raíz Cuadrada (√x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Side by side comparison: Original vs Transformed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                    <span>1. Distribución Original (Cruda)</span>
                    <span className="font-mono">Sesgo: {origH.skewness}</span>
                  </div>
                  <HistogramChart data={origH} color="#64748B" />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                    <span>
                      2. Distribución Tras Transformación ({currentTransform.toUpperCase()})
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        Math.abs(transH.skewness) < Math.abs(origH.skewness)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      Nuevo Sesgo: {transH.skewness} (
                      {Math.abs(transH.skewness) < Math.abs(origH.skewness) ? 'Mejora de simetría' : 'Sin cambios'})
                    </span>
                  </div>
                  <HistogramChart data={transH} color="#2563EB" />
                </div>
              </div>

              {/* Recommendation footnote */}
              {recommended !== 'none' && currentTransform !== recommended && (
                <div className="text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  <span>
                    💡 Sugerencia: Esta variable tiene fuerte sesgo a la derecha ({origH.skewness}). La transformación{' '}
                    <strong className="underline">{recommended.toUpperCase()}</strong> estabilizará la varianza.
                  </span>
                  <button
                    onClick={() => onUpdateTransform(col, recommended)}
                    className="px-2 py-1 bg-amber-600 text-white text-[11px] font-bold rounded-md hover:bg-amber-700 transition-colors shrink-0"
                  >
                    Aplicar {recommended}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Análisis Descriptivo</span>
        </button>

        <button
          onClick={onProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <span>Avanzar a Estandarización [0, 1] & Codo/Silueta</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
