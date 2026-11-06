/**
 * SegmentIQ - Customer & Market Segmentation Studio
 * Full 14-step implementation
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Step1Upload } from './components/Step1Upload';
import { Step2Preview } from './components/Step2Preview';
import { Step3Descriptive } from './components/Step3Descriptive';
import { Step4Histograms } from './components/Step4Histograms';
import { Step5Standardization } from './components/Step5Standardization';
import { Step6Centroids } from './components/Step6Centroids';
import { Step7ProfilesAndStrategy } from './components/Step7ProfilesAndStrategy';

import {
  SectorType,
  ColumnMetadata,
  BusinessRuleLimit,
  TransformType,
  ClusterProfile,
} from './types';
import { analyzeColumns } from './utils/dataParser';
import {
  calculateSummaryStats,
  buildHistogram,
  applyBusinessRules,
  standardizeMinMax,
} from './utils/statsEngine';
import {
  evaluateRangeOfK,
  runKMeans,
  denormalizeCentroid,
  computePCA2D,
} from './utils/kmeansEngine';
import {
  buildClusterProfiles,
  generateExecutiveSummary,
} from './utils/strategyEngine';
import { generateSampleDatasets } from './utils/sampleDatasets';

export default function App() {
  // Navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  // 1 & 5. Sector and Raw Data
  const [sector, setSector] = useState<SectorType>('retail');
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // 2, 3, 4. Columns & Continuous Variable selection
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // 6.a Business Rules Limits (Min and Max)
  const [businessRules, setBusinessRules] = useState<Record<string, BusinessRuleLimit>>({});

  // 8. Transformations (Log1p, Sqrt, None)
  const [transformConfigs, setTransformConfigs] = useState<Record<string, TransformType>>({});

  // 11. Selected K (Business Rule vs Statistics)
  const [selectedK, setSelectedK] = useState<number>(3);

  // Cluster Names custom dictionary
  const [customClusterNames, setCustomClusterNames] = useState<Record<number, string>>({});

  // Load default sample dataset on first mount so the app is instantly rich and operational
  useEffect(() => {
    const samples = generateSampleDatasets();
    const defaultSample = samples[0]; // Retail RFM
    setRawRows(defaultSample.data);
    setFileName(defaultSample.name + '.csv');
    setSector(defaultSample.sector);

    const cols = analyzeColumns(defaultSample.data);
    setColumns(cols);
    setSelectedVariables(defaultSample.recommendedVariables);

    // Initial business rules from sample
    const rules: Record<string, BusinessRuleLimit> = {};
    Object.entries(defaultSample.businessRuleSuggestions).forEach(([col, sug]) => {
      rules[col] = {
        column: col,
        minRule: sug.min,
        maxRule: sug.max,
        action: 'clamp',
      };
    });
    setBusinessRules(rules);

    // Initial transforms: log1p for heavily skewed monetary / recency
    setTransformConfigs({
      Gasto_Anual_USD: 'log1p',
      Recencia_Dias: 'sqrt',
    });
  }, []);

  // Update maxStepReached when advancing
  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxStepReached) {
      setMaxStepReached(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for loaded data
  const handleDataLoaded = (
    data: Record<string, any>[],
    loadedFileName: string,
    chosenSector: SectorType,
    initialVars?: string[]
  ) => {
    setRawRows(data);
    setFileName(loadedFileName);
    setSector(chosenSector);

    const cols = analyzeColumns(data);
    setColumns(cols);

    if (initialVars && initialVars.length > 0) {
      setSelectedVariables(initialVars);
    } else {
      const continuous = cols.filter((c) => c.isContinuousNumeric).map((c) => c.name);
      setSelectedVariables(continuous.slice(0, 5));
    }

    setBusinessRules({});
    setTransformConfigs({});
    setCustomClusterNames({});
    goToStep(2);
  };

  // Toggle variable in selection
  const handleToggleVariable = (colName: string) => {
    if (selectedVariables.includes(colName)) {
      if (selectedVariables.length > 2) {
        setSelectedVariables(selectedVariables.filter((v) => v !== colName));
      }
    } else {
      setSelectedVariables([...selectedVariables, colName]);
    }
  };

  // 6.a Processed rows after Business Rules (Min / Max clamping or filtering)
  const { processedRows, affectedCount, filteredOutCount } = useMemo(() => {
    if (rawRows.length === 0) {
      return { processedRows: [], affectedCount: 0, filteredOutCount: 0 };
    }
    return applyBusinessRules(rawRows, businessRules);
  }, [rawRows, businessRules]);

  // 6. Descriptive summary statistics
  const summaryStats = useMemo(() => {
    if (processedRows.length === 0) return [];
    return selectedVariables.map((col) => {
      const vals = processedRows.map((r) => (typeof r[col] === 'number' && !isNaN(r[col]) ? r[col] : 0));
      return calculateSummaryStats(vals, col);
    });
  }, [processedRows, selectedVariables]);

  const populationMeans = useMemo(() => {
    const map: Record<string, number> = {};
    summaryStats.forEach((s) => {
      map[s.column] = s.mean;
    });
    return map;
  }, [summaryStats]);

  // 7. Original Histograms before transformation
  const originalHistograms = useMemo(() => {
    const map: Record<string, any> = {};
    selectedVariables.forEach((col) => {
      const vals = processedRows.map((r) => (typeof r[col] === 'number' && !isNaN(r[col]) ? r[col] : 0));
      map[col] = buildHistogram(vals, col);
    });
    return map;
  }, [processedRows, selectedVariables]);

  // 8. Transformed Histograms
  const transformedHistograms = useMemo(() => {
    const map: Record<string, any> = {};
    selectedVariables.forEach((col) => {
      const t = transformConfigs[col] || 'none';
      const rawVals = processedRows.map((r) => (typeof r[col] === 'number' && !isNaN(r[col]) ? r[col] : 0));
      const minRaw = Math.min(...rawVals);
      const transformedVals = rawVals.map((v) => {
        if (t === 'log1p') return Math.log1p(Math.max(0, v - (minRaw < 0 ? minRaw : 0)));
        if (t === 'sqrt') return Math.sqrt(Math.max(0, v - (minRaw < 0 ? minRaw : 0)));
        return v;
      });
      map[col] = buildHistogram(transformedVals, col);
    });
    return map;
  }, [processedRows, selectedVariables, transformConfigs]);

  // Auto-apply recommended transforms
  const handleApplyAllRecommended = () => {
    const nextConfigs: Record<string, TransformType> = {};
    selectedVariables.forEach((col) => {
      const hist = originalHistograms[col];
      if (hist && hist.skewness > 1.0) {
        nextConfigs[col] = 'log1p';
      } else if (hist && hist.skewness > 0.5) {
        nextConfigs[col] = 'sqrt';
      } else {
        nextConfigs[col] = 'none';
      }
    });
    setTransformConfigs(nextConfigs);
  };

  // 9. Min-Max Standardization into [0, 1]
  const { scaledMatrix, scalerParams } = useMemo(() => {
    if (processedRows.length === 0 || selectedVariables.length === 0) {
      return { scaledMatrix: [], scalerParams: {}, transformedValuesPerCol: {} };
    }
    return standardizeMinMax(processedRows, selectedVariables, transformConfigs);
  }, [processedRows, selectedVariables, transformConfigs]);

  // 10. Multi-metric evaluation across K = 2 to 7 (WCSS/Codo, Silueta, GAP)
  const evaluationResults = useMemo(() => {
    if (scaledMatrix.length < 4 || selectedVariables.length < 2) {
      return { metrics: [], recommendedK: 3, reasoning: 'Datos insuficientes para análisis de K.' };
    }
    const maxK = Math.min(7, scaledMatrix.length - 1);
    return evaluateRangeOfK(scaledMatrix, 2, maxK);
  }, [scaledMatrix, selectedVariables]);

  // Sync selectedK with recommendedK initially if not touched
  useEffect(() => {
    if (evaluationResults.recommendedK && !selectedK) {
      setSelectedK(evaluationResults.recommendedK);
    }
  }, [evaluationResults.recommendedK]);

  // 11 & 12. Run K-Means with user-selected K and denormalize Centroids into Absolute Business Values
  const kMeansModel = useMemo(() => {
    if (scaledMatrix.length === 0 || selectedVariables.length === 0) {
      return null;
    }
    const safeK = Math.max(2, Math.min(selectedK, scaledMatrix.length - 1));
    const result = runKMeans(scaledMatrix, safeK);

    // Denormalize centroids back into original business units
    const denormalizedCentroids = result.centroids.map((scaledCent) =>
      denormalizeCentroid(scaledCent, selectedVariables, scalerParams, processedRows)
    );

    return {
      k: safeK,
      assignments: result.assignments,
      wcss: result.wcss,
      denormalizedCentroids,
    };
  }, [scaledMatrix, selectedVariables, selectedK, scalerParams, processedRows]);

  // 13. Cluster Profiles & Archetypes
  const clusterProfiles = useMemo(() => {
    if (!kMeansModel) return [];
    const profiles = buildClusterProfiles(
      kMeansModel.denormalizedCentroids,
      kMeansModel.assignments,
      selectedVariables,
      populationMeans,
      sector
    );

    // Apply any user custom names
    return profiles.map((p) => {
      if (customClusterNames[p.id]) {
        return { ...p, name: customClusterNames[p.id] };
      }
      return p;
    });
  }, [kMeansModel, selectedVariables, populationMeans, sector, customClusterNames]);

  // 13. 2D PCA Spatial Projection
  const pcaResults = useMemo(() => {
    if (!kMeansModel || scaledMatrix.length === 0) return { points: [], varianceExplained: [50, 50] as [number, number] };
    return computePCA2D(scaledMatrix, kMeansModel.assignments);
  }, [scaledMatrix, kMeansModel]);

  // 14. Executive Summary
  const executiveSummary = useMemo(() => {
    return generateExecutiveSummary(clusterProfiles, sector);
  }, [clusterProfiles, sector]);

  // Export dataset to CSV with new cluster assignments
  const handleExportCSV = () => {
    if (!kMeansModel || processedRows.length === 0) return;

    const clusterNameLookup: Record<number, string> = {};
    clusterProfiles.forEach((p) => {
      clusterNameLookup[p.id - 1] = p.name;
    });

    const exportRows = processedRows.map((row, idx) => {
      const cId = kMeansModel.assignments[idx];
      return {
        ...row,
        Segmento_ID: cId + 1,
        Nombre_Segmento: clusterNameLookup[cId] || `Segmento ${cId + 1}`,
      };
    });

    const headers = Object.keys(exportRows[0]);
    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel
      [
        headers.join(';'),
        ...exportRows.map((r: Record<string, any>) =>
          headers
            .map((h) => {
              const val = r[h];
              if (val === null || val === undefined) return '';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(';')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SegmentIQ_${sector}_K${selectedK}_Segmentado.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header and Step Navigation */}
      <Header
        currentStep={currentStep}
        maxStepReached={maxStepReached}
        onStepClick={(step) => goToStep(step)}
        fileName={fileName}
        sector={sector}
        totalRows={processedRows.length}
      />

      {/* Main Pipeline Views */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <Step1Upload
            onDataLoaded={handleDataLoaded}
            selectedSector={sector}
            onSectorChange={(sec) => setSector(sec)}
          />
        )}

        {currentStep === 2 && (
          <Step2Preview
            data={rawRows}
            fileName={fileName || 'datos.csv'}
            columns={columns}
            selectedVariables={selectedVariables}
            onToggleVariable={handleToggleVariable}
            onProceed={() => goToStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Descriptive
            stats={summaryStats}
            businessRules={businessRules}
            onUpdateRule={(col, rule) => {
              setBusinessRules((prev) => ({
                ...prev,
                [col]: { ...(prev[col] || { column: col, action: 'clamp' }), ...rule },
              }));
            }}
            onResetRules={() => setBusinessRules({})}
            affectedCount={affectedCount}
            filteredOutCount={filteredOutCount}
            totalRows={rawRows.length}
            sector={sector}
            onProceed={() => goToStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Histograms
            originalHistograms={originalHistograms}
            transformedHistograms={transformedHistograms}
            transformConfigs={transformConfigs}
            onUpdateTransform={(col, type) => {
              setTransformConfigs((prev) => ({ ...prev, [col]: type }));
            }}
            onApplyAllRecommended={handleApplyAllRecommended}
            onProceed={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5Standardization
            scaledMatrix={scaledMatrix}
            columns={selectedVariables}
            metrics={evaluationResults.metrics}
            recommendedK={evaluationResults.recommendedK}
            reasoning={evaluationResults.reasoning}
            selectedK={selectedK}
            onSelectK={(k) => setSelectedK(k)}
            onProceed={() => goToStep(6)}
            onBack={() => goToStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6Centroids
            selectedK={selectedK}
            recommendedK={evaluationResults.recommendedK}
            onSelectK={(k) => setSelectedK(k)}
            columns={selectedVariables}
            profiles={clusterProfiles}
            onUpdateClusterName={(cId, newName) => {
              setCustomClusterNames((prev) => ({ ...prev, [cId]: newName }));
            }}
            populationMeans={populationMeans}
            onProceed={() => goToStep(7)}
            onBack={() => goToStep(5)}
          />
        )}

        {currentStep === 7 && (
          <Step7ProfilesAndStrategy
            profiles={clusterProfiles}
            columns={selectedVariables}
            pcaPoints={pcaResults.points}
            sector={sector}
            executiveSummary={executiveSummary}
            onExportCSV={handleExportCSV}
            onBack={() => goToStep(6)}
            totalObservations={processedRows.length}
          />
        )}
      </main>
    </div>
  );
}
