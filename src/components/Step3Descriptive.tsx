import React from 'react';
import { SummaryStats, BusinessRuleLimit, SectorType } from '../types';
import { Sliders, ShieldAlert, CheckCircle2, ArrowRight, Info, RotateCcw } from 'lucide-react';

interface Step3DescriptiveProps {
  stats: SummaryStats[];
  businessRules: Record<string, BusinessRuleLimit>;
  onUpdateRule: (column: string, rule: Partial<BusinessRuleLimit>) => void;
  onResetRules: () => void;
  affectedCount: number;
  filteredOutCount: number;
  totalRows: number;
  sector: SectorType;
  onProceed: () => void;
}

export const Step3Descriptive: React.FC<Step3DescriptiveProps> = ({
  stats,
  businessRules,
  onUpdateRule,
  onResetRules,
  affectedCount,
  filteredOutCount,
  totalRows,
  sector,
  onProceed,
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Explanation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Sliders className="w-4 h-4" />
            <span>Paso 3 de 7 • Calidad de Datos & Dominio Empresarial</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Análisis Descriptivo & Reglas de Negocio (Mínimos y Máximos)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
            En cualquier negocio real existen valores extremos, transacciones de prueba o anomalías (ej. compras por error de $0 o transacciones mayoristas de 100x).
            Define límites operativos (Reglas de Negocio) para evitar que los outliers distorsionen la geometría de los clusters.
          </p>
        </div>

        {/* Live impact meter */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[220px]">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>Impacto Reglas de Negocio:</span>
            <button
              onClick={onResetRules}
              className="text-blue-600 hover:underline flex items-center gap-1 text-[10px]"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Restablecer
            </button>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            {affectedCount + filteredOutCount} filas tratadas{' '}
            <span className="text-xs text-slate-400 font-sans font-normal">
              ({totalRows > 0 ? (((affectedCount + filteredOutCount) / totalRows) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {affectedCount} ajustadas (winsorizadas) • {filteredOutCount} filtradas
          </div>
        </div>
      </div>

      {/* Summary Statistics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Métricas Descriptivas Univariadas</span>
            <span className="text-xs text-slate-400 font-normal">
              (N = {totalRows} observaciones)
            </span>
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              IQR = Q3 - Q1
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Asimetría (Sesgo)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="p-3 font-semibold">Variable</th>
                <th className="p-3 font-semibold font-mono text-right">Media</th>
                <th className="p-3 font-semibold font-mono text-right">Mediana</th>
                <th className="p-3 font-semibold font-mono text-right">Desv. Estándar</th>
                <th className="p-3 font-semibold font-mono text-right">Mínimo</th>
                <th className="p-3 font-semibold font-mono text-right">Q1 (25%)</th>
                <th className="p-3 font-semibold font-mono text-right">Q3 (75%)</th>
                <th className="p-3 font-semibold font-mono text-right">Máximo</th>
                <th className="p-3 font-semibold font-mono text-right">Rango IQR</th>
                <th className="p-3 font-semibold text-center">Sesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {stats.map((s) => (
                <tr key={s.column} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                    {s.column}
                  </td>
                  <td className="p-3 text-right text-slate-800 dark:text-slate-200 font-semibold">{s.mean}</td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{s.median}</td>
                  <td className="p-3 text-right text-slate-500">{s.stdDev}</td>
                  <td className="p-3 text-right text-slate-600 dark:text-slate-400">{s.min}</td>
                  <td className="p-3 text-right text-slate-500">{s.q1}</td>
                  <td className="p-3 text-right text-slate-500">{s.q3}</td>
                  <td className="p-3 text-right text-slate-600 dark:text-slate-400">{s.max}</td>
                  <td className="p-3 text-right text-slate-500">{s.iqr}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                        s.skewness > 0.5
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : s.skewness < -0.5
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {s.skewness > 0.5 ? 'Sesgo +' : s.skewness < -0.5 ? 'Sesgo -' : 'Simétrico'} ({s.skewness})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6.a Business Rules Limits (Max and Min per Variable) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>Reglas de Negocio: Límites Máximos y Mínimos Operativos</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajusta los umbrales para topar valores absurdos o filtrar filas fuera de la política comercial de {sector}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((s) => {
            const rule = businessRules[s.column] || { column: s.column, action: 'clamp' };
            const isMinSet = rule.minRule !== undefined;
            const isMaxSet = rule.maxRule !== undefined;

            return (
              <div
                key={s.column}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    {s.column}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    Rango nativo: <span className="font-mono text-slate-700 dark:text-slate-300">[{s.min} a {s.max}]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Min Rule */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mínimo Regla de Negocio
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={`Min: ${s.min}`}
                        value={rule.minRule !== undefined ? rule.minRule : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          onUpdateRule(s.column, { minRule: val });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      {isMinSet && (
                        <button
                          onClick={() => onUpdateRule(s.column, { minRule: undefined })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Max Rule */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Máximo Regla de Negocio
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={`Max: ${s.max}`}
                        value={rule.maxRule !== undefined ? rule.maxRule : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          onUpdateRule(s.column, { maxRule: val });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      {isMaxSet && (
                        <button
                          onClick={() => onUpdateRule(s.column, { maxRule: undefined })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Treatment action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-500">Tratamiento de valores fuera de límite:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateRule(s.column, { action: 'clamp' })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        rule.action === 'clamp'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Topar (Winsorizar)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateRule(s.column, { action: 'filter' })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        rule.action === 'filter'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Filtrar Fila
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Business Rule info banner */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <div>
            <span className="font-bold">Recomendación Metodológica:</span> El modo{' '}
            <span className="font-semibold underline">Topar (Winsorizar)</span> es la mejor práctica recomendada para segmentación de clientes porque preserva al cliente en el análisis asignándole el valor tope del negocio, sin distorsionar el cálculo euclidiano de distancias.
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Reglas de negocio configuradas correctamente.</span>
          </div>

          <button
            onClick={onProceed}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <span>Avanzar a Histogramas & Transformación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
