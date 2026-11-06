/**
 * Strategy Engine: contextualizes segmentation results into business strategies:
 * - Pricing & elasticity
 * - Product / Service Innovation
 * - Loyalty & Retention
 * - Growth, Upsell, and Cross-sell tactics
 */

import { SectorType, ClusterProfile, StrategyPlan } from '../types';

export const CLUSTER_PALETTE = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export function buildClusterProfiles(
  clustersCentroids: { scaledCentroids: Record<string, number>; absoluteCentroids: Record<string, number> }[],
  assignments: number[],
  columns: string[],
  populationMeans: Record<string, number>,
  sector: SectorType
): ClusterProfile[] {
  const k = clustersCentroids.length;
  const totalCount = assignments.length;

  // Counts
  const counts = new Array(k).fill(0);
  assignments.forEach((c) => counts[c]++);

  return clustersCentroids.map((cent, idx) => {
    const size = counts[idx];
    const percentage = totalCount > 0 ? Math.round((size / totalCount) * 1000) / 10 : 0;

    // Differentiators
    const differentiators = columns.map((col) => {
      const absVal = cent.absoluteCentroids[col] || 0;
      const popMean = populationMeans[col] || 1;
      const deviationPct = Math.round(((absVal - popMean) / (Math.abs(popMean) || 1)) * 100);

      let tag: 'alto' | 'medio' | 'bajo' = 'medio';
      if (deviationPct >= 20) tag = 'alto';
      else if (deviationPct <= -20) tag = 'bajo';

      return {
        variable: col,
        absVal,
        populationMean: popMean,
        deviationPct,
        tag,
      };
    });

    // Auto-generate name and persona based on top differentiators and sector
    const { name, personaSummary, pricing, innovation, loyalty, growthTactics, kpis } = generateSegmentArchetype(
      idx,
      differentiators,
      percentage,
      sector
    );

    return {
      id: idx + 1,
      name,
      color: CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length],
      size,
      percentage,
      scaledCentroids: cent.scaledCentroids,
      absoluteCentroids: cent.absoluteCentroids,
      keyDifferentiators: differentiators,
      personaSummary,
      pricingStrategy: pricing,
      innovationStrategy: innovation,
      loyaltyStrategy: loyalty,
      growthTactics,
      kpisToWatch: kpis,
    };
  });
}

function generateSegmentArchetype(
  clusterIdx: number,
  diffs: { variable: string; absVal: number; populationMean: number; deviationPct: number; tag: 'alto' | 'medio' | 'bajo' }[],
  percentage: number,
  sector: SectorType
) {
  // Sort by highest positive deviation
  const highVars = diffs.filter((d) => d.tag === 'alto').sort((a, b) => b.deviationPct - a.deviationPct);
  const lowVars = diffs.filter((d) => d.tag === 'bajo').sort((a, b) => a.deviationPct - b.deviationPct);

  const primaryHigh = highVars[0]?.variable || 'Volumen';
  const primaryLow = lowVars[0]?.variable || 'Inactividad';

  // Archetype naming rules
  let name = `Segmento ${clusterIdx + 1}: Perfil Estratégico`;
  let personaSummary = '';
  let pricing = '';
  let innovation = '';
  let loyalty = '';
  let growthTactics: string[] = [];
  let kpis: string[] = [];

  const isRetail = sector === 'retail';
  const isBanking = sector === 'banking';
  const isSaaS = sector === 'saas';

  if (highVars.length >= 2 && highVars.some((v) => v.variable.toLowerCase().includes('gasto') || v.variable.toLowerCase().includes('mrr') || v.variable.toLowerCase().includes('saldo') || v.variable.toLowerCase().includes('ingreso'))) {
    // High Value / VIP
    name = isRetail ? 'Campeones VIP (Alto Valor)' : isBanking ? 'Patrimonio Preferente / Private' : isSaaS ? 'Cuentas Enterprise Power' : 'Clientes Clave de Alto Valor';
    personaSummary = `Representan el ${percentage}% de la base con niveles excepcionales de ${primaryHigh}. Tienen baja sensibilidad al precio, valoran la exclusividad, la inmediatez y la atención prioritaria.`;
    pricing = 'Estrategia Premium & Precios Descremados: Eliminar descuentos genéricos. Implementar tarifas por servicios prioritarios y empaquetamiento exclusivo de productos complementarios.';
    innovation = 'Innovación de Servicio Blanco: Acceso beta anticipado a lanzamientos, ejecutivos de cuenta dedicados y personalización a medida sin fricción.';
    loyalty = 'Programa de Lealtad por Niveles (Tiered Black/Platinum): Recompensas experienciales no monetarias (invitaciones VIP, soporte 24/7 sin colas, garantías extendidas).';
    growthTactics = [
      'Venta cruzada de líneas de catálogo premium o módulos empresariales avanzados.',
      'Contratos anuales garantizados con acuerdos de nivel de servicio (SLA) de alta gama.',
      'Programa de embajadores para captar referidos de su mismo perfil socioeconómico.',
    ];
    kpis = ['Valor del Ciclo de Vida (LTV)', 'Tasa de Retención Neta (NDR)', 'NPS de Clientes Clave'];
  } else if (lowVars.some((v) => v.variable.toLowerCase().includes('recencia') || v.variable.toLowerCase().includes('frecuencia') || v.variable.toLowerCase().includes('tickets') || v.variable.toLowerCase().includes('nps'))) {
    // At Risk / Low Engagement
    name = isRetail ? 'Ocasionales en Riesgo de Abandono' : isBanking ? 'Cuentas Pasivas / Baja Transaccionalidad' : isSaaS ? 'Riesgo de Churn / Adopción Crítica' : 'Segmento Latente / Vulnerable';
    personaSummary = `Grupo vulnerable (${percentage}% del total) con alertas notables en ${primaryLow}. Se observa distanciamiento operativo o fricción en la experiencia de servicio.`;
    pricing = 'Precios de Reactivación Condicionados: Cupones de descuento temporal exclusivo sujetos a reenganche o compra antes de 14 días.';
    innovation = 'Simplificación UX y Onboarding Guiado: Tutoriales interactivos paso a paso, encuestas de 1 clic para detectar motivos de inactividad.';
    loyalty = 'Playbook Automatizado Antifuga: Campaña omnicanal de salvamento activada ante inactividad superior al umbral promedio.';
    growthTactics = [
      'Campañas de reactivación directa por WhatsApp / Correo con incentivo de retorno.',
      'Auditoría proactiva de fricciones de pago o soporte técnico no resuelto.',
      'Oferta de versión lite o plan pausado en lugar de la cancelación definitiva.',
    ];
    kpis = ['Tasa de Reactivación', 'Tiempo hasta la Próxima Transacción', 'Tasa de Churn Mensual'];
  } else if (highVars.some((v) => v.variable.toLowerCase().includes('frecuencia') || v.variable.toLowerCase().includes('sesiones') || v.variable.toLowerCase().includes('transacciones'))) {
    // High Frequency / Growth Potential
    name = isRetail ? 'Frecuentes en Expansión (Ticket Medio)' : isBanking ? 'Operativos Cotidianos / Débito Activo' : isSaaS ? 'Scale-Ups en Fuerte Tracción' : 'Usuarios Frecuentes en Crecimiento';
    personaSummary = `Base altamente activa (${percentage}%) con excelente ritmo transaccional pero con capacidad ociosa para expandir su ticket o volumen total.`;
    pricing = 'Estructura de Descuentos por Volumen y Umbrales: Descuento escalonado al superar un umbral de ticket (ej. $X de compra para envío gratis o crédito bonificado).';
    innovation = 'Funcionalidades de Autoconsumo Rápido: Compra en 1 clic, suscripciones periódicas automatizadas y recomendaciones predictivas basadas en hábitos.';
    loyalty = 'Gamificación y Retos Periódicos: "Completa 4 interacciones este mes y desbloquea bonificación en tu siguiente pedido".';
    growthTactics = [
      'Recomendaciones algorítmicas de productos complementarios en el carrito de compra (Cross-sell).',
      'Incentivos de upgrade hacia versiones multi-usuario o paquetes familiares.',
      'Comunicaciones promocionales en los días y horarios pico de mayor conversión.',
    ];
    kpis = ['Ticket Promedio por Transacción', 'Profundidad de Carrito (Unidades/Pedido)', 'Margen Bruto'];
  } else {
    // Pragmatic Core / Standard
    name = `Clientes Esenciales (Núcleo Operativo)`;
    personaSummary = `El corazón transaccional del negocio (${percentage}%). Métricas alineadas con la media de mercado, buscando confiabilidad, precio justo y estabilidad.`;
    pricing = 'Precios de Mercado Transparentes: Promociones 2x1 en temporadas clave y programas de financiamiento accesible.';
    innovation = 'Optimización Continua de Calidad y Tiempos de Entrega: Garantías claras de servicio e inventario disponible.';
    loyalty = 'Puntos Acumulables Directos: Reintegro (Cashback) transparente canjeable en compras habituales.';
    growthTactics = [
      'Campañas de temporada y fechas especiales con recordatorios personalizados.',
      'Venta de combos de productos de alta rotación.',
      'Pruebas A/B de mensajes promocionales en canales digitales.',
    ];
    kpis = ['Costo de Adquisición vs Retención (CAC/LTV)', 'Frecuencia Trimestral', 'Satisfacción CSAT'];
  }

  return { name, personaSummary, pricing, innovation, loyalty, growthTactics, kpis };
}

export function generateExecutiveSummary(profiles: ClusterProfile[], sector: SectorType): StrategyPlan['executiveSummary'] {
  const topValued = [...profiles].sort((a, b) => b.percentage - a.percentage)[0];
  const smallest = [...profiles].sort((a, b) => a.percentage - b.percentage)[0];

  return {
    keyInsights: [
      `Concentración de Valor: El segmento "${topValued?.name || 'Principal'}" agrupa el ${topValued?.percentage}% de la base y sostiene el flujo central de ingresos.`,
      `Oportunidades de Margen: La dispersión entre centroides evidencia una heterogeneidad marcada, lo que confirma que las políticas de precios y promociones masivas destruyen margen frente a estrategias segmentadas.`,
      `Potencial de Retención: El grupo "${smallest?.name || 'Especializado'}" presenta comportamientos singulares que exigen protocolos diferenciados para evitar fugas silenciosas de clientes rentables.`,
    ],
    quickWins: [
      `Día 1 a 10: Suspender descuentos lineales universales y activar el esquema de precios segmentado según sensibilidad detectada.`,
      `Día 11 a 20: Lanzar campaña de reactivación directa para el segmento en riesgo con incentivo condicionado a 14 días.`,
      `Día 21 a 30: Implementar protocolo de atención preferente y venta cruzada para el segmento de alto valor (${topValued?.name}).`,
    ],
    estimatedRevenueImpact:
      'Incremento estimado de +14% a +22% en margen bruto y reducción de un 18% en fuga de clientes durante los primeros 2 trimestres de ejecución sistemática.',
  };
}
