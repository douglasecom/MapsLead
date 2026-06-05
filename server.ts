/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API client initialized successfully.");
    } else {
      console.warn("No valid GEMINI_API_KEY found. Running in simulated fallback mode.");
    }
  }
  return aiClient;
}

// Robust retry wrapper with model fallback to handle 503 Overloaded or rate limit issues gracefully
async function generateContentWithRetry(ai: GoogleGenAI, options: { contents: any; config?: any }) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000; // start with 1000ms delay
    const maxRetries = 2; // total of 3 attempts per model

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Querying Gemini model "${model}" - Attempt ${attempt + 1}/${maxRetries + 1}...`);
        const response = await ai.models.generateContent({
          ...options,
          model: model, // explicitly set/override model
        });
        
        if (response && response.text) {
          console.log(`Success with model "${model}" on attempt ${attempt + 1}!`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Attempt ${attempt + 1} with model "${model}" failed: ${errMsg}`);
        
        // Always retry for typical transient server overloads or rate limits
        const isTransient = errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.includes("RESOURCE_EXHAUSTED") || 
                            errMsg.includes("rate limit") || 
                            errMsg.includes("busy") || 
                            errMsg.includes("high demand") ||
                            errMsg.includes("overload");

        if (!isTransient) {
          // Structural error within the config representation, schema, or text formatting - change model immediately
          break;
        }

        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5; // Backoff scaling
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all retries and model fallbacks.");
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", usingGemini: !!process.env.GEMINI_API_KEY });
});

// GENERATE MATCHING LEADS DYNAMICALLY
app.post("/api/leads/generate", async (req, res) => {
  const { niche, location, limit = 10 } = req.body;

  const resolvedNiche = niche || "Padaria";
  const resolvedLocation = location || "São Paulo, SP";

  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log(`Generating leads for ${resolvedNiche} in ${resolvedLocation}...`);
      const prompt = `Gere uma lista de ${limit} empresas fictícias, mas realistas de alta qualidade para simular prospecção de vendas baseada no Google Maps em português do Brasil. O nicho delas é "${resolvedNiche}" e o local de busca é "${resolvedLocation}".`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Você é um gerador inteligente de dados B2B realistas e profissionais em formato JSON. Garanta que todas as descrições de análise GMB sejam atrativas comerciais e escritas em português.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nome comercial focado em negócios brasileiros legítimos (ex: Padaria Santa Tereza, Adega do Sol, Clínica Sorria Mais)" },
                rating: { type: Type.NUMBER, description: "Avaliação do Google de 1.0 a 5.0" },
                reviews: { type: Type.INTEGER, description: "Quantidade de avaliações, de 5 a 2000" },
                hasWebsite: { type: Type.BOOLEAN, description: "Se tem site próprio (dê preferência para 'false' para simular oportunidades de venda de sites!)" },
                hasGmbActive: { type: Type.BOOLEAN, description: "Se tem o perfil GMB reivindicado" },
                hasPhone: { type: Type.BOOLEAN, description: "Se exibe telefone na listagem" },
                phone: { type: Type.STRING, description: "DDD e telefone de exemplo no formato (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX" },
                leadScore: { type: Type.INTEGER, description: "Pontuação do Lead (0-100), onde a falta de site + avaliações altas elevam o score próximo a 100!" },
                gmbAnalysis: { type: Type.STRING, description: "Uma análise inteligente em PT-BR destacando por que esta empresa precisa melhorar na presença digital (ex: 'Possui classificação de 4.8 estrelas no Google com 450 avaliações mas sem site próprio. Perde clientes famintos por falta de canal próprio.')" }
              },
              required: ["name", "rating", "reviews", "hasWebsite", "hasGmbActive", "hasPhone", "phone", "leadScore", "gmbAnalysis"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsedLeads = JSON.parse(text);
        return res.json({ leads: parsedLeads });
      }
    } catch (err: any) {
      console.error("Gemini lead generation failed, using fallback simulator:", err.message);
    }
  }

  // Fallback realistic simulation in case Gemini is off or fails
  console.log("Generating simulated fallback leads...");
  const simulatedLeads = [];
  const ptSuffixes = ["Ltda", "ME", "e Filhos", "Premium", "do Bairro", "Express", "Gourmet", "Central"];
  
  for (let i = 0; i < limit; i++) {
    const isNoSite = Math.random() > 0.3; // Give high opportunity density
    const score = isNoSite ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 40) + 40;
    const rating = parseFloat((Math.random() * 1.8 + 3.2).toFixed(1));
    const reviews = Math.floor(Math.random() * 300) + 15;
    
    simulatedLeads.push({
      name: `${resolvedNiche} ${ptSuffixes[i % ptSuffixes.length]} ${String.fromCharCode(65 + i)}`,
      rating,
      reviews,
      hasWebsite: !isNoSite,
      hasGmbActive: Math.random() > 0.2,
      hasPhone: Math.random() > 0.1,
      phone: `(11) 9${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      leadScore: score,
      gmbAnalysis: isNoSite 
        ? `Possui ótimas avaliações (${rating} estrelas) com ${reviews} feedbacks, mas carece de um Website oficial para receber conversões diretas de clientes da região.`
        : `Apesar de ter um site ativo, o design não é otimizado e carece de carregamento rápido. Oportunidade de SEO e reestruturação de tráfego.`
    });
  }

  res.json({ leads: simulatedLeads });
});

// GENERATE APPROACH COPY USING GEMINI
app.post("/api/message/generate", async (req, res) => {
  const { leadName, niche, location, channel, goal, tone, gmbAnalysis } = req.body;

  const rChannel = channel || "WhatsApp";
  const rGoal = goal || "SEO Local";
  const rTone = tone || "Persuasivo";

  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log(`Generating pitch copywriting via Gemini for ${leadName}...`);
      const systemInstruction = `Você é um assessor sênior de Marketing Digital altamente experiente no mercado B2B brasileiro (especialista em prospecção fria e consultoria). Você escreve abordagens extremamente naturais, focadas em gerar curiosidade e agendar uma rápida ligação ou conversa, sem soar robótico, artificial ou vendedor insistente de infoprodutos. Use parágrafos curtos, espaçados e emojis de maneira sábia e humana. Escreva em português (PT-BR).`;

      const prompt = `Gere uma abordagem de vendas comercial personalizada profissional para a empresa "${leadName}" do nicho de "${niche}" localizada em "${location}".
      - Canal de Envio: ${rChannel}
      - Objetivo Comercial: ${rGoal}
      - Tom de voz: ${rTone}
      - Contexto e Oportunidade identificada: ${gmbAnalysis || 'Empresa excelente no Google Maps mas sem site oficial ou otimização digital.'}

      Siga rigorosamente as diretrizes abaixo:
      1. Se o canal for WhatsApp, a abordagem deve ser curta (máximo 4 parágrafos pequenos), objetiva, direta ao ponto e terminar com uma pergunta/chamada para ação amigável.
      2. Se for E-mail, use uma linha de Assunto atraente e personalize com uma introdução formal curta e focada no valor sobre a presença deles no Maps.
      3. Use placeholders como "[Nome]" ou "[Seu Nome]" para que o usuário finalize a edição.
      4. Evite saudações excessivas ou falsos elogios robóticos. Seja focado em resultados tangíveis da região.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.85
        }
      });

      const messageContent = response.text;
      if (messageContent) {
        return res.json({ text: messageContent.trim() });
      }
    } catch (err: any) {
      console.error("Gemini copy generation failed, using fallback generator:", err.message);
    }
  }

  // Fallback approach simulation
  const greeting = rChannel === "WhatsApp" ? "Olá," : "Prezada equipe da";
  let content = "";

  if (rChannel === "WhatsApp") {
    content = `${greeting} *${leadName}*! Tudo bem? 👋

Vi a excelente reputação de vocês no Google Maps com ótimas avaliações de clientes aqui na região de ${location}. Notamos um grande potencial não explorado para atrair mais clientes diretamente para seu estabelecimento físico.

Como vocês ainda não possuem um site oficial visível na pesquisa, muitos clientes da região acabam escolhendo concorrentes estruturados. Desenvolvemos soluções em *${rGoal}* focadas especificamente em resolver isso e colocar vocês no topo absoluto.

Teria 5 minutos para batermos um papo rápido e apresentar como podemos impulsionar suas vendas este mês com nossa assessoria integrada? 🚀`;
  } else {
    content = `Assunto: Oportunidade de Crescimento em ${location} - ${leadName}\n\n${greeting} ${leadName},\n\nEspero que este e-mail os encontre bem.\n\nEstávamos analisando as empresas de destaque no setor de ${niche} em ${location} e notamos que a sua empresa possui um perfil excelente e de alta reputação nas avaliações do Google.\n\nNo entanto, identificamos que a ausência de uma página web estruturada ou otimização de ${rGoal} está limitando o seu alcance digital de potenciais compradores que navegam online diariamente buscando serviços similares.\n\nNós ajudamos empresas como a sua a preencher essa lacuna e duplicar o tráfego de clientes locais de forma rápida e eficiente.\n\nGostaria de agendar uma breve conversa de 5 a 10 minutos esta semana para demonstrar como isso pode ser feito em poucos passos?\n\nAtenciosamente,\n[Seu Nome]\nMapsLeads Consultoria`;
  }

  res.json({ text: content });
});

// ----------------------------------------------------
// Serve Frontend Assets
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
