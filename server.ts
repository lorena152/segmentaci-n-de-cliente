import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Strategic AI synthesis route
app.post('/api/generate-strategy', async (req, res) => {
  try {
    const { sector, clusters, businessRules, overallStats } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        source: 'heuristic',
        message: 'No GEMINI_API_KEY configured; fallback to internal domain engine.',
        strategies: null,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Eres un Director de Estrategia de Crecimiento y Ciencia de Datos empresarial con 20 años de experiencia.
Analiza la siguiente segmentación de clientes y mercado para el sector: "${sector || 'General / Comercio y Servicios'}".

Contexto del dataset:
${JSON.stringify(overallStats || {}, null, 2)}

Segmentos identificados (con sus centroides en valores absolutos reales y volumen):
${JSON.stringify(clusters || [], null, 2)}

Reglas de negocio / Restricciones:
${businessRules || 'Maximizar rentabilidad, retención y satisfacción del cliente.'}

Genera un plan estratégico exhaustivo y de alto impacto en formato JSON estricto con las siguientes claves para CADA segmento:
- clusterId: número del cluster
- clusterName: nombre comercial persuasivo y memorable (ej. "Campeones de Alto Valor", "Navegadores Ocasionales", "Cazadores de Descuentos", etc.)
- personaSummary: resumen narrativo de este cliente (quién es, qué busca, qué le duele)
- pricingStrategy: recomendación concreta de precios (sensibilidad al precio, elasticidad, esquemas de descuento, umbrales de envío gratis, bundling, paquetes premium)
- innovationStrategy: propuesta de innovación de producto o servicio (nuevas funcionalidades, personalización, servicios adicionales que pagarían con gusto)
- loyaltyStrategy: plan de fidelización y retención (programas de puntos, beneficios exclusivos, triggers automáticos para evitar abandono)
- growthTactics: 3 tácticas operativas directas (campañas de marketing, canales recomendados, metas de aumento de ticket promedio o frecuencia)
- kpisToWatch: 3 KPIs clave a monitorear para este grupo

Además incluye una clave "executiveSummary" con:
- keyInsights: array de 3 hallazgos estratégicos transversales
- quickWins: array de 3 acciones prioritarias inmediatas (los primeros 30 días)
- estimatedRevenueImpact: estimación cualitativa y porcentual del impacto en ventas.

Responde ÚNICAMENTE en JSON válido sin bloques markdown decorativos adicionales.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      parsed = JSON.parse(cleanJson);
    }

    return res.json({
      source: 'gemini',
      data: parsed,
    });
  } catch (err: any) {
    console.warn('Gemini API call skipped or errored; returning graceful fallback:', err?.message || err);
    return res.status(200).json({
      source: 'heuristic',
      message: 'Estrategia generada con el motor estratégico de dominio integrado.',
      data: null,
    });
  }
});

// Setup Vite in development or static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(PORT),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SegmentIQ server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer();
