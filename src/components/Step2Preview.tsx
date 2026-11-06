import React, { useState } from 'react';
import { ColumnMetadata } from '../types';
import { CheckCircle2, AlertTriangle, Hash, Type, KeyRound, ArrowRight, TableProperties } from 'lucide-react';

interface Step2PreviewProps {
  data: Record<string, any>[];
  fileName: string;
  columns: ColumnMetadata[];
  selectedVariables: string[];
  onToggleVariable: (colName: string) => void;
  onProceed: () => void;
}

export const Step2Preview: React.FC<Step2PreviewProps> = ({
  data,
  fileName,
  columns,
  selectedVariables,
  onToggleVariable,
  onProceed,
}) => {
  const [previewRowCount, setPreviewRowCount] = useState<number>(5);

  const previewRows = data.slice(0, previewRowCount);
  const continuousCols = columns.filter((c) => c.isContinuousNumeric);
  const nonContinuousCols = columns.filter((c) => !c.isContinuousNumeric);

  const isValidSelection = selectedVariables.length >= 2;

  const getTypeBadge = (col: ColumnMetadata) => {
    switch (col.type) {
      case 'continuous_numeric':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Hash className="w-3 h-3" />
            Continua & Numérica (Apta)
          </span>
        );
      case 'discrete_numeric':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Hash className="w-3 h-3" />
            Entera / Discreta
          </span>
        );
      case 'identifier':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <KeyRound className="w-3 h-3" />
            Identificador (ID)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Type className="w-3 h-3" />
            Categórica / Texto
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <TableProperties className="w-4 h-4 text-blue-600" />
            <span>Archivo Activo:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fileName}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Vista Previa de Filas & Tipado de Variables
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Para la segmentación (K-Means), los algoritmos de distancia requieren variables{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">continuas y numéricas</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {data.length.toLocaleString()} filas × {columns.length} columnas
            </div>
            <div className="text-[11px] text-slate-500">
              {continuousCols.length} variables continuas detectadas
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            {[3, 5, 10].map((num) => (
              <button
                key={num}
                onClick={() => setPreviewRowCount(num)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewRowCount === num
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {num} filas
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-5 Rows Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Primeras {previewRowCount} Filas del Dataset</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
              Rows 1 to {previewRowCount}
            </span>
          </h3>
          <div className="text-xs text-slate-400">Desplaza horizontalmente para ver todas las columnas →</div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 font-semibold text-slate-500 w-12 text-center">#</th>
                {columns.map((col) => {
                  const isSelected = selectedVariables.includes(col.name);
                  return (
                    <th key={col.name} className="p-3 font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate font-mono">{col.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <div>{getTypeBadge(col)}</div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {previewRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-slate-400 text-center font-sans font-bold">{rIdx + 1}</td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    const isSelected = selectedVariables.includes(col.name);
                    return (
                      <td
                        key={col.name}
                        className={`p-3 truncate max-w-[200px] ${
                          isSelected ? 'font-medium text-blue-900 dark:text-blue-200 bg-blue-50/30 dark:bg-blue-950/20' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {val !== null && val !== undefined ? String(val) : <span className="text-slate-300 italic">null</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variable Selection Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Selección de Variables para la Segmentación</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 font-mono font-bold">
                {selectedVariables.length} seleccionadas
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marca las variables continuas que definirán las dimensiones geométricas de tus clusters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                continuousCols.forEach((c) => {
                  if (!selectedVariables.includes(c.name)) onToggleVariable(c.name);
                });
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Seleccionar todas las continuas
            </button>
          </div>
        </div>

        {/* Continuous columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {continuousCols.map((col) => {
            const isSelected = selectedVariables.includes(col.name);
            return (
              <div
                key={col.name}
                onClick={() => onToggleVariable(col.name)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white font-mono">
                      {col.name}
                    </span>
                  </div>
                  {getTypeBadge(col)}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>{col.uniqueCount} valores únicos</span>
                  <span>{col.nullCount > 0 ? `${col.nullCount} nulos` : '100% completo'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Non-continuous columns note */}
        {nonContinuousCols.length > 0 && (
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Variables no continuas / IDs:</span>
            <span className="font-mono">
              {nonContinuousCols.map((c) => c.name).join(', ')}
            </span>
            <span className="text-[11px] italic">(se conservan para trazabilidad y exportación final)</span>
          </div>
        )}

        {/* Validation bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {!isValidSelection ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Debes seleccionar al menos 2 variables continuas para calcular distancias multidimensionales.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{selectedVariables.length} variables continuas listas para análisis descriptivo y reglas de negocio.</span>
            </div>
          )}

          <button
            disabled={!isValidSelection}
            onClick={onProceed}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
              isValidSelection
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Avanzar a Análisis Descriptivo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
