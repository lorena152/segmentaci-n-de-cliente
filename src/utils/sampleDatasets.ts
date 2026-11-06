/**
 * Pre-configured realistic datasets for Retail, Banking, and SaaS
 */

export interface SampleDataset {
  id: string;
  name: string;
  sector: 'retail' | 'banking' | 'saas';
  description: string;
  rowCount: number;
  data: Record<string, any>[];
  recommendedVariables: string[];
  businessRuleSuggestions: Record<string, { min?: number; max?: number; reason: string }>;
}

// Deterministic pseudo-random helper for consistent sample generation
function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleDatasets(): SampleDataset[] {
  // 1. Retail & E-commerce Dataset (120 customers)
  const retailPRNG = createPRNG(42);
  const retailData: Record<string, any>[] = [];
  const archetypes = [
    // VIP / Whales (15%)
    { weight: 0.15, recency: [1, 20], frequency: [15, 45], monetary: [2500, 6500], basketSize: [4, 9], returnRate: [0.02, 0.08] },
    // Regular Loyal (35%)
    { weight: 0.35, recency: [15, 60], frequency: [6, 18], monetary: [800, 2200], basketSize: [2.5, 5], returnRate: [0.05, 0.15] },
    // Deal Hunters (30%)
    { weight: 0.30, recency: [30, 120], frequency: [2, 6], monetary: [200, 600], basketSize: [1.5, 3], returnRate: [0.15, 0.35] },
    // Dormant / At Risk (20%)
    { weight: 0.20, recency: [120, 360], frequency: [1, 3], monetary: [80, 350], basketSize: [1, 2.5], returnRate: [0.10, 0.25] },
  ];

  for (let i = 1; i <= 150; i++) {
    const roll = retailPRNG();
    let selected = archetypes[0];
    let accum = 0;
    for (const arch of archetypes) {
      accum += arch.weight;
      if (roll <= accum) {
        selected = arch;
        break;
      }
    }
    const recency = Math.round(selected.recency[0] + retailPRNG() * (selected.recency[1] - selected.recency[0]));
    const frequency = Math.round(selected.frequency[0] + retailPRNG() * (selected.frequency[1] - selected.frequency[0]));
    const monetary = Math.round((selected.monetary[0] + retailPRNG() * (selected.monetary[1] - selected.monetary[0])) * 100) / 100;
    const basketSize = Math.round((selected.basketSize[0] + retailPRNG() * (selected.basketSize[1] - selected.basketSize[0])) * 10) / 10;
    const returnRate = Math.round((selected.returnRate[0] + retailPRNG() * (selected.returnRate[1] - selected.returnRate[0])) * 1000) / 10; // as %

    retailData.push({
      ID_Cliente: `CLI-${String(i).padStart(4, '0')}`,
      Recencia_Dias: recency,
      Frecuencia_Compras: frequency,
      Gasto_Anual_USD: monetary,
      Ticket_Promedio_Items: basketSize,
      Tasa_Devolucion_Pct: returnRate,
    });
  }

  // Inject a couple of outliers to demonstrate business rules
  retailData[10].Gasto_Anual_USD = 18500; // Wholesaler outlier
  retailData[45].Recencia_Dias = 450; // Deep dormant

  // 2. Banking & Fintech Dataset (140 clients)
  const bankPRNG = createPRNG(99);
  const bankData: Record<string, any>[] = [];
  const bankArchetypes = [
    // Premium Affluent (20%)
    { weight: 0.20, income: [6000, 14000], balance: [15000, 55000], cardTxCount: [25, 60], creditScore: [760, 840], tenureMonths: [24, 96] },
    // Active Middle Class (45%)
    { weight: 0.45, income: [2200, 5200], balance: [3000, 14000], cardTxCount: [15, 35], creditScore: [660, 750], tenureMonths: [12, 60] },
    // Credit Seekers / Overdrafts (20%)
    { weight: 0.20, income: [1400, 3000], balance: [300, 2500], cardTxCount: [8, 22], creditScore: [580, 650], tenureMonths: [6, 36] },
    // Digital Savers / Passive (15%)
    { weight: 0.15, income: [2800, 7000], balance: [8000, 28000], cardTxCount: [3, 10], creditScore: [700, 790], tenureMonths: [18, 72] },
  ];

  for (let i = 1; i <= 140; i++) {
    const roll = bankPRNG();
    let selected = bankArchetypes[0];
    let accum = 0;
    for (const arch of bankArchetypes) {
      accum += arch.weight;
      if (roll <= accum) {
        selected = arch;
        break;
      }
    }
    const income = Math.round(selected.income[0] + bankPRNG() * (selected.income[1] - selected.income[0]));
    const balance = Math.round(selected.balance[0] + bankPRNG() * (selected.balance[1] - selected.balance[0]));
    const txCount = Math.round(selected.cardTxCount[0] + bankPRNG() * (selected.cardTxCount[1] - selected.cardTxCount[0]));
    const creditScore = Math.round(selected.creditScore[0] + bankPRNG() * (selected.creditScore[1] - selected.creditScore[0]));
    const tenureMonths = Math.round(selected.tenureMonths[0] + bankPRNG() * (selected.tenureMonths[1] - selected.tenureMonths[0]));

    bankData.push({
      ID_Cuenta: `BNK-${String(i).padStart(4, '0')}`,
      Ingreso_Mensual_USD: income,
      Saldo_Promedio_USD: balance,
      Transacciones_Tarjeta_Mes: txCount,
      Score_Crediticio: creditScore,
      Antiguedad_Meses: tenureMonths,
    });
  }

  // 3. B2B SaaS Subscriptions (120 accounts)
  const saasPRNG = createPRNG(1234);
  const saasData: Record<string, any>[] = [];
  const saasArchetypes = [
    // Enterprise Power Users
    { weight: 0.20, mrr: [1800, 4800], activeUsers: [40, 150], weeklyLogins: [350, 1200], supportTickets: [2, 6], npsScore: [8, 10] },
    // Growth Scale-ups
    { weight: 0.35, mrr: [500, 1600], activeUsers: [15, 45], weeklyLogins: [120, 380], supportTickets: [4, 12], npsScore: [7, 9] },
    // Self-serve Low-touch
    { weight: 0.30, mrr: [99, 450], activeUsers: [3, 12], weeklyLogins: [20, 110], supportTickets: [1, 4], npsScore: [6, 9] },
    // Churn Risk / Low adoption
    { weight: 0.15, mrr: [250, 1200], activeUsers: [1, 5], weeklyLogins: [2, 25], supportTickets: [8, 20], npsScore: [2, 5] },
  ];

  for (let i = 1; i <= 130; i++) {
    const roll = saasPRNG();
    let selected = saasArchetypes[0];
    let accum = 0;
    for (const arch of saasArchetypes) {
      accum += arch.weight;
      if (roll <= accum) {
        selected = arch;
        break;
      }
    }
    const mrr = Math.round(selected.mrr[0] + saasPRNG() * (selected.mrr[1] - selected.mrr[0]));
    const activeUsers = Math.round(selected.activeUsers[0] + saasPRNG() * (selected.activeUsers[1] - selected.activeUsers[0]));
    const logins = Math.round(selected.weeklyLogins[0] + saasPRNG() * (selected.weeklyLogins[1] - selected.weeklyLogins[0]));
    const tickets = Math.round(selected.supportTickets[0] + saasPRNG() * (selected.supportTickets[1] - selected.supportTickets[0]));
    const nps = Math.round(selected.npsScore[0] + saasPRNG() * (selected.npsScore[1] - selected.npsScore[0]));

    saasData.push({
      ID_Empresa: `CORP-${String(i).padStart(4, '0')}`,
      MRR_Mensual_USD: mrr,
      Usuarios_Activos_Asientos: activeUsers,
      Sesiones_Semanales: logins,
      Tickets_Soporte_Trimestre: tickets,
      Satisfaccion_NPS: nps,
    });
  }

  return [
    {
      id: 'retail_rfm',
      name: 'Retail & Comercio Electrónico (RFM + Margen)',
      sector: 'retail',
      description: '150 clientes de e-commerce con métricas de Recencia, Frecuencia, Gasto Anual, Ticket Promedio y Devoluciones.',
      rowCount: retailData.length,
      data: retailData,
      recommendedVariables: ['Recencia_Dias', 'Frecuencia_Compras', 'Gasto_Anual_USD', 'Ticket_Promedio_Items', 'Tasa_Devolucion_Pct'],
      businessRuleSuggestions: {
        Gasto_Anual_USD: { max: 12000, reason: 'Excluir compras mayoristas institucionales b2b atípicas' },
        Recencia_Dias: { max: 365, reason: 'Topar inactividad mayor a 1 año' },
      },
    },
    {
      id: 'banking_wealth',
      name: 'Banca y Fintech (Patrimonio & Crédito)',
      sector: 'banking',
      description: '140 clientes bancarios evaluados por Ingreso, Saldo promedio, Transacciones de tarjeta, Score crediticio y Antigüedad.',
      rowCount: bankData.length,
      data: bankData,
      recommendedVariables: ['Ingreso_Mensual_USD', 'Saldo_Promedio_USD', 'Transacciones_Tarjeta_Mes', 'Score_Crediticio', 'Antiguedad_Meses'],
      businessRuleSuggestions: {
        Ingreso_Mensual_USD: { max: 20000, reason: 'Topar ingresos extremos de banca privada' },
      },
    },
    {
      id: 'saas_product',
      name: 'B2B SaaS y Suscripción (Adopción de Producto)',
      sector: 'saas',
      description: '130 empresas cliente con métricas de MRR, Asientos activos, Sesiones semanales, Tickets de soporte y NPS.',
      rowCount: saasData.length,
      data: saasData,
      recommendedVariables: ['MRR_Mensual_USD', 'Usuarios_Activos_Asientos', 'Sesiones_Semanales', 'Tickets_Soporte_Trimestre', 'Satisfaccion_NPS'],
      businessRuleSuggestions: {
        Tickets_Soporte_Trimestre: { max: 18, reason: 'Limitar anomalías operativas de soporte' },
      },
    },
  ];
}
