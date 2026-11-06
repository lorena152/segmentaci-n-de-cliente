import React from 'react';
import { SectorType } from '../types';
import {
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  BarChart2,
  PieChart,
  Target,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  maxStepReached: number;
  onStepClick: (step: number) => void;
  fileName: string | null;
  sector: SectorType;
  totalRows: number;
}

export const STEPS = [
  { id: 1, title: 'Carga & Sector', short: 'Carga' },
  { id: 2, title: 'Vista Previa & Tipos', short: 'Variables' },
  { id: 3, title: 'Descriptivo & Max/Min', short: 'Reglas' },
  { id: 4, title: 'Histogramas & Sesgos', short: 'Histogramas' },
  { id: 5, title: 'Estandarización & K', short: 'Codo/Silueta' },
  { id: 6, title: 'K Negocio & Centroides', short: 'Centroides' },
  { id: 7, title: 'Perfiles & Estrategias', short: 'Estrategias' },
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  maxStepReached,
  onStepClick,
  fileName,
  sector,
  totalRows,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print:static print:border-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand row */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold text-lg">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  SegmentIQ
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 uppercase tracking-wider">
                  Estudio de Segmentación
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data Science • Reglas de Negocio • Estrategias de Crecimiento
              </p>
            </div>
          </div>

          {/* Active file and context badge */}
          <div className="flex items-center gap-3">
            {fileName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[140px] font-semibold">{fileName}</span>
                <span className="text-slate-400 text-[10px]">({totalRows} filas)</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900 text-xs font-semibold capitalize">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{sector}</span>
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="py-2.5 overflow-x-auto print:hidden">
          <div className="flex items-center justify-between min-w-[640px] gap-1">
            {STEPS.map((s) => {
              const isActive = s.id === currentStep;
              const isPassed = s.id < currentStep;
              const isAccessible = s.id <= maxStepReached;

              return (
                <button
                  key={s.id}
                  disabled={!isAccessible}
                  onClick={() => onStepClick(s.id)}
                  className={`flex-1 flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-bold'
                      : isAccessible
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <div className="truncate">
                    <div
                      className={`text-[11px] truncate ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.short}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
