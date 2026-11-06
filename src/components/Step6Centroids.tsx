import React, { useState } from 'react';
import { ClusterProfile } from '../types';
import { Users, Tag, Check, Sparkles, ArrowRight, ArrowLeft, Briefcase, RefreshCw } from 'lucide-react';

interface Step6CentroidsProps {
  selectedK: number;
  recommendedK: number;
  onSelectK: (k: number) => void;
  columns: string[];
  profiles: ClusterProfile[];
  onUpdateClusterName: (clusterId: number, newName: string) => void;
  populationMeans: Record<string, number>;
  onProceed: () => void;
  onBack: () => void;
}

export const Step6Centroids: React.FC<Step6CentroidsProps> = ({
  selectedK,
  recommendedK,
  onSelectK,
  columns,
  profiles,
  onUpdateClusterName,
  populationMeans,
  onProceed,
  onBack,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const saveEdit = (id: number) => {
    if (tempName.trim()) {
      onUpdateClusterName(id, tempName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 11. Header & Business Rule K Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Paso 6 de 7 • Regla de Negocio & Nombres de Centroides</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Selección de K (Regla de Negocio) & Centroides en Valores Absolutos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
            La estadística sugiere K={recommendedK}, pero la <span className="font-semibold text-slate-800 dark:text-slate-200">viabilidad operativa de tu negocio</span> manda.
            Si tu equipo comercial, fuerza de ventas o plataforma de CRM solo tiene capacidad para ejecutar 3 campañas simultáneas, elige K=3. Si necesitas hiper-personalización, elige 4 o 5.
          </p>
        </div>

        {/* Business Rule K selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2"># Clusters:</span>
          {[2, 3, 4, 5, 6, 7].map((k) => {
            const isSelected = selectedK === k;
            const isRec = recommendedK === k;
            return (
              <button
                key={k}
                onClick={() => onSelectK(k)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                K = {k}
                {isRec && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 12. Absolute Values Centroids Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Centroides en Valores Absolutos Originales (Desnormalizados)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Expresados en las unidades reales de tu negocio ($ USD, cantidad de órdenes, días, score) para comprender cada perfil y asignarle un nombre comercial.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Alto vs Media (+20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Bajo vs Media (-20%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="p-3 font-semibold min-w-[200px]">Segmento / Nombre Asignado</th>
                <th className="p-3 font-semibold text-center font-mono">Volumen & % Base</th>
                {columns.map((col) => (
                  <th key={col} className="p-3 font-semibold font-mono text-right min-w-[120px]">
                    <div className="flex flex-col items-end">
                      <span>{col}</span>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">
                        Media: {populationMeans[col]?.toFixed(1) || '-'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {profiles.map((p) => {
                const isEditing = editingId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: p.color }}
                        />

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                              className="px-2 py-1 text-xs border border-blue-500 rounded-md font-bold focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEdit(p.id)}
                              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEdit(p.id, p.name)}
                            className="group flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </span>
                            <Tag className="w-3 h-3 text-slate-300 group-hover:text-blue-500 shrink-0" />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.size} clientes
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {p.percentage}% del total
                      </div>
                    </td>

                    {columns.map((col) => {
                      const absVal = p.absoluteCentroids[col] ?? 0;
                      const popMean = populationMeans[col] || 1;
                      const devPct = Math.round(((absVal - popMean) / (Math.abs(popMean) || 1)) * 100);

                      const isHigh = devPct >= 20;
                      const isLow = devPct <= -20;

                      return (
                        <td key={col} className="p-3 text-right">
                          <div
                            className={`font-semibold inline-block px-2 py-0.5 rounded-md ${
                              isHigh
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {absVal.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans">
                            {devPct >= 0 ? `+${devPct}%` : `${devPct}%`} vs media
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cluster Naming Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personalizar Nombres Comerciales de los Segmentos</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Los nombres comerciales facilitan que ventas, producto y marketing hablen el mismo lenguaje sobre cada arquetipo de cliente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs font-bold text-slate-500">
                    Segmento #{p.id} ({p.percentage}%)
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={p.name}
                onChange={(e) => onUpdateClusterName(p.id, e.target.value)}
                placeholder="Nombre del segmento..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />

              <div className="text-[11px] text-slate-500 line-clamp-2 italic">
                {p.personaSummary}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Diagnóstico Estadístico</span>
        </button>

        <button
          onClick={onProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <span>Avanzar a Perfiles & Estrategias de Negocio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
