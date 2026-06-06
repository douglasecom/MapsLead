import { GoogleGenAI, Type } from "@google/genai";

async function generateContentWithRetry(ai: GoogleGenAI, options: { contents: any; config?: any }) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Querying Gemini model "${model}" - Attempt ${attempt + 1}/${maxRetries + 1}...`);
        const response = await ai.models.generateContent({
          ...options,
          model: model,
        });
        
        if (response && response.text) {
          console.log(`Success with model "${model}" on attempt ${attempt + 1}!`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Attempt ${attempt + 1} with model "${model}" failed: ${errMsg}`);
        break; // skip retries for now in test to be quick
      }
    }
  }
  throw lastError;
}

async function run() {
  const key = process.env.GEMINI_API_KEY!;
  const ai = new GoogleGenAI({ apiKey: key });

  const resolvedNiche = "Dentista";
  const resolvedLocation = "Belo Horizonte, MG";
  const limit = 5;

  const prompt = `Gere uma lista de ${limit} empresas fictícias, mas realistas de alta qualidade para simular prospecção de vendas baseada no Google Maps em português do Brasil. O nicho delas é "${resolvedNiche}" e o local de busca é "${resolvedLocation}".`;

  try {
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

    console.log("Response text:", response.text);
    const parsed = JSON.parse(response.text!);
    console.log("Parsed leads successfully! Count:", parsed.length);
  } catch (err: any) {
    console.error("Test failed:", err);
  }
}

run();
