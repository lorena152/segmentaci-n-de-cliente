import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { SectorType, SectorInfo } from '../types';
import { SampleDataset, generateSampleDatasets } from '../utils/sampleDatasets';

interface Step1UploadProps {
  onDataLoaded: (data: Record<string, any>[], fileName: string, sector: SectorType, initialVars?: string[]) => void;
  selectedSector: SectorType;
  onSectorChange: (sector: SectorType) => void;
}

export const SECTORS: SectorInfo[] = [
  {
    id: 'retail',
    name: 'Retail & Comercio Electrónico',
    iconName: 'ShoppingCart',
    description: 'B2C, tiendas online, omnicanalidad, supermercados y marketplaces.',
    typicalVariables: ['Recencia de compra', 'Frecuencia anual', 'Gasto monetario total', 'Ticket promedio'],
  },
  {
    id: 'banking',
    name: 'Banca, Fintech & Finanzas',
    iconName: 'Landmark',
    description: 'Banca comercial, tarjetas de crédito, inversión y neobancos.',
    typicalVariables: ['Ingreso mensual', 'Saldo promedio', 'Uso de tarjeta', 'Score crediticio'],
  },
  {
    id: 'saas',
    name: 'B2B SaaS & Suscripciones',
    iconName: 'Server',
    description: 'Software como servicio, plataformas Cloud y modelos recurrentes.',
    typicalVariables: ['MRR mensual', 'Asientos activos', 'Frecuencia de sesiones', 'NPS'],
  },
  {
    id: 'telecom',
    name: 'Telecomunicaciones & Internet',
    iconName: 'Radio',
    description: 'Operadores móviles, fibra óptica, conectividad y streaming.',
    typicalVariables: ['Consumo de GB', 'ARPU mensual', 'Antigüedad en meses', 'Tickets de avería'],
  },
  {
    id: 'healthcare',
    name: 'Salud, Farmacéutica & Seguros',
    iconName: 'HeartPulse',
    description: 'Clínicas, laboratorios, pólizas de salud y proveedores médicos.',
    typicalVariables: ['Visitas anuales', 'Costo de siniestralidad', 'Edad del asegurado', 'Uso preventivo'],
  },
  {
    id: 'hospitality',
    name: 'Hostelería, Hoteles & Turismo',
    iconName: 'Hotel',
    description: 'Cadenas hoteleras, aerolíneas, restaurantes y agencias de viaje.',
    typicalVariables: ['Noches de estancia', 'Gasto por estadía', 'Anticipación de reserva', 'Tasa de no-show'],
  },
  {
    id: 'other',
    name: 'Otro Sector / Multisectorial',
    iconName: 'Briefcase',
    description: 'Modelos de negocio híbridos, consultoría, logística o manufactura.',
    typicalVariables: ['Volumen transaccional', 'Margen operacional', 'Margen de contribución'],
  },
];

export const Step1Upload: React.FC<Step1UploadProps> = ({
  onDataLoaded,
  selectedSector,
  onSectorChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleDatasets = generateSampleDatasets();

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { parseFile } = await import('../utils/dataParser');
      const { data } = await parseFile(file);
      onDataLoaded(data, file.name, selectedSector);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo. Verifica el formato e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (sample: SampleDataset) => {
    onSectorChange(sample.sector);
    onDataLoaded(sample.data, `${sample.name}.csv`, sample.sector, sample.recommendedVariables);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Sector Selection Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sector de Negocio & Contexto Operativo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecciona la industria para calibrar automáticamente las reglas de negocio, arquetipos y estrategias de crecimiento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {SECTORS.map((s) => {
            const isSelected = selectedSector === s.id;
            return (
              <div
                key={s.id}
                onClick={() => onSectorChange(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    {s.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cargar Archivo de Datos (TXT, CSV, Excel XLSX / XLS)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sube tus datos crudos de clientes o transacciones. Detección automática de delimitadores (, ; \t) y codificación.
            </p>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/50'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            Arrastra tu archivo aquí o haz clic para explorar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            Formatos soportados: <span className="font-semibold text-slate-700 dark:text-slate-300">.xlsx, .xls, .csv, .txt, .tsv</span>.
            Tus datos se procesan localmente en el navegador con máxima privacidad.
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm cursor-pointer shadow-sm transition-all hover:shadow-md">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Seleccionar Archivo Local</span>
            <input
              type="file"
              className="hidden"
              accept=".csv,.txt,.tsv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>

          {loading && (
            <div className="mt-4 text-xs font-semibold text-blue-600 animate-pulse flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Procesando y validando estructura de datos...
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium max-w-md mx-auto">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Instant Sample Datasets */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              ¿No tienes un archivo a mano? Prueba con datasets de prueba calibrados:
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleDatasets.map((sample) => (
              <div
                key={sample.id}
                onClick={() => loadSample(sample)}
                className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1">
                  <span>{sample.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                  {sample.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{sample.rowCount} filas</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-sans">
                    Cargar 1-Clic
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
