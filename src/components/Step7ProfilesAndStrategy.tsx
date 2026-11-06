import React, { useState } from 'react';
import { ClusterProfile, PCAPoint, SectorType, StrategyPlan } from '../types';
import { RadarChart, ScatterPlot2D } from './Charts';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  Lightbulb,
  HeartHandshake,
  TrendingUp,
  Download,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronUp,
  Target,
  Rocket,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeft,
  Bot,
} from 'lucide-react';

interface Step7ProfilesAndStrategyProps {
  profiles: ClusterProfile[];
  columns: string[];
  pcaPoints: PCAPoint[];
  sector: SectorType;
  executiveSummary: StrategyPlan['executiveSummary'];
  onExportCSV: () => void;
  onBack: () => void;
  totalObservations: number;
}

export const Step7ProfilesAndStrategy: React.FC<Step7ProfilesAndStrategyProps> = ({
  profiles,
  columns,
  pcaPoints,
  sector,
  executiveSummary: initialSummary,
  onExportCSV,
  onBack,
  totalObservations,
}) => {
  const [activeClusterId, setActiveClusterId] = useState<number | null>(profiles[0]?.id || 1);
  const [executiveSummary, setExecutiveSummary] = useState(initialSummary);
  const [customProfiles, setCustomProfiles] = useState<ClusterProfile[]>(profiles);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<'heuristic' | 'gemini'>('heuristic');
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const clusterNamesMap: Record<number, string> = {};
  customProfiles.forEach((p) => {
    clusterNamesMap[p.id - 1] = p.name;
  });

  const selectedProfile = customProfiles.find((p) => p.id === activeClusterId) || customProfiles[0];

  // AI Generation via server.ts /api/generate-strategy
  const handleGenerateWithAI = async () => {
    setAiLoading(true);
    setAiMessage(null);
    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          clusters: customProfiles.map((p) => ({
            id: p.id,
            name: p.name,
            size: p.size,
            percentage: p.percentage,
            centroids: p.absoluteCentroids,
            topDifferentiators: p.keyDifferentiators.map((d) => `${d.variable}: ${d.absVal} (${d.tag})`),
          })),
          businessRules: 'Optimizar ingresos, evitar canibalización de precios y reducir rotación de clientes.',
          overallStats: { totalCustomers: totalObservations, variablesCount: columns.length },
        }),
      });

      const resData = await response.json();

      if (resData.source === 'gemini' && resData.data) {
        setAiSource('gemini');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

        // Update executive summary if present
        if (resData.data.executiveSummary) {
          setExecutiveSummary(resData.data.executiveSummary);
        }

        // Merge updated strategies into custom profiles
        if (Array.isArray(resData.data)) {
          const updated = customProfiles.map((p, idx) => {
            const aiCluster = resData.data.find((c: any) => c.clusterId === p.id || c.clusterId === idx + 1);
            if (!aiCluster) return p;
            return {
              ...p,
              name: aiCluster.clusterName || p.name,
              personaSummary: aiCluster.personaSummary || p.personaSummary,
              pricingStrategy: aiCluster.pricingStrategy || p.pricingStrategy,
              innovationStrategy: aiCluster.innovationStrategy || p.innovationStrategy,
              loyaltyStrategy: aiCluster.loyaltyStrategy || p.loyaltyStrategy,
              growthTactics: Array.isArray(aiCluster.growthTactics) ? aiCluster.growthTactics : p.growthTactics,
              kpisToWatch: Array.isArray(aiCluster.kpisToWatch) ? aiCluster.kpisToWatch : p.kpisToWatch,
            };
          });
          setCustomProfiles(updated);
        }
        setAiMessage('¡Estrategia potenciada con éxito mediante Inteligencia Artificial Gemini!');
      } else {
        setAiMessage('El motor heurístico estratégico ya está optimizado con las mejores prácticas del sector.');
      }
    } catch (err: any) {
      console.warn('AI fallback invoked:', err);
      setAiMessage('Estrategias generadas con el motor analítico de dominio integrado.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto print:max-w-none print:m-0 print:space-y-4">
      {/* 13 & 14 Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 print:border-none">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Target className="w-4 h-4" />
            <span>Paso 7 de 7 • Definición de Perfiles & Estrategias Accionables</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Estrategias de Precios, Innovación, Fidelización & Crecimiento
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Playbook comercial y analítico completo por cada segmento para acelerar el crecimiento del negocio en el sector{' '}
            <strong className="text-slate-800 dark:text-slate-200 uppercase">{sector}</strong>.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleGenerateWithAI}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiLoading ? 'Generando con IA...' : 'Potenciar con Gemini AI'}</span>
          </button>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV Segmentado</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            <span>{aiMessage}</span>
          </div>
          {aiSource === 'gemini' && (
            <span className="px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold text-[10px]">
              Gemini 2.5 Pro Powered
            </span>
          )}
        </div>
      )}

      {/* Visual Profiling: Radar Chart & 2D PCA Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        <RadarChart
          variables={columns}
          profiles={customProfiles}
          activeClusterId={activeClusterId}
        />
        <ScatterPlot2D
          points={pcaPoints}
          clusterNames={clusterNamesMap}
          activeClusterId={activeClusterId}
          onSelectCluster={(id) => setActiveClusterId(id)}
        />
      </div>

      {/* Executive Summary Cards */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">Resumen Ejecutivo & Plan de Acción</h3>
          </div>
          <span className="text-xs font-mono text-amber-300 font-bold bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/60">
            {executiveSummary.estimatedRevenueImpact}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <span>★ Hallazgos Estratégicos Clave (Insights)</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
              {executiveSummary.keyInsights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚡ Quick Wins Prioritarios (Primeros 30 Días)</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
              {executiveSummary.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cluster Archetype Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
        {customProfiles.map((p) => {
          const isSelected = p.id === activeClusterId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveClusterId(p.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? '#FFFFFF' : p.color }}
              />
              <span>{p.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {p.percentage}% ({p.size})
              </span>
            </button>
          );
        })}
      </div>

      {/* Deep Segment Strategy Dossier (Active Segment) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
              style={{ backgroundColor: selectedProfile.color }}
            >
              C{selectedProfile.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedProfile.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                  {selectedProfile.size} clientes ({selectedProfile.percentage}% de la base)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {selectedProfile.personaSummary}
              </p>
            </div>
          </div>

          {/* Absolute Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {columns.map((col) => (
              <div
                key={col}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
              >
                <span className="text-slate-400 mr-1">{col}:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedProfile.absoluteCentroids[col]?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Pillars of Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pillar 1: Precios */}
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span>1. Estrategia de Precios & Elasticidad</span>
            </div>
            <p className="text-xs text-blue-950/80 dark:text-blue-200 leading-relaxed font-sans">
              {selectedProfile.pricingStrategy}
            </p>
          </div>

          {/* Pillar 2: Innovación */}
          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span>2. Innovación en Producto & Servicio</span>
            </div>
            <p className="text-xs text-amber-950/80 dark:text-amber-200 leading-relaxed font-sans">
              {selectedProfile.innovationStrategy}
            </p>
          </div>

          {/* Pillar 3: Fidelización */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span>3. Fidelización, Retención & Lealtad</span>
            </div>
            <p className="text-xs text-emerald-950/80 dark:text-emerald-200 leading-relaxed font-sans">
              {selectedProfile.loyaltyStrategy}
            </p>
          </div>

          {/* Pillar 4: Crecimiento & Growth */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>4. Tácticas de Crecimiento (Growth & Upsell)</span>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-950/80 dark:text-indigo-200">
              {selectedProfile.growthTactics.map((tactic, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-600 shrink-0 mt-0.5">•</span>
                  <span>{tactic}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* KPIs bar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            KPIs Clave a Monitorear para este Segmento:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {selectedProfile.kpisToWatch.map((kpi, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]"
              >
                {kpi}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation and Export Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modificar Regla de Negocio / K</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Base Completa con Segmentos (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
