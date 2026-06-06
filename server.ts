/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, addDoc } from "firebase/firestore";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Firebase SDK for server-side updates
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initializeApp(firebaseConfig);
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully on server-side.");
    seedPlans();
  } else {
    console.warn("firebase-applet-config.json not found. Database features will fallback to server memory simulation.");
  }
} catch (error) {
  console.error("Firebase startup initialization failed:", error);
}

// ----------------------------------------------------
// SEED DEFAULT SaaS PLANS IN THE FIRESTORE DATABASE
// ----------------------------------------------------
async function seedPlans() {
  if (!db) return;
  const defaultPlans = [
    {
      id: "free",
      name: "Gratuito",
      price: 0,
      credits: 10,
      monthlyCredits: 10,
      maxUsers: 1,
      maxLeads: 10,
      maxReports: 2,
      status: "ACTIVE",
      features: [
        "Busca Google Maps",
        "CRM Básico",
        "Geração de Pitch IA",
        "Dashboard"
      ]
    },
    {
      id: "starter",
      name: "Starter",
      price: 49,
      credits: 100,
      maxUsers: 1,
      maxReports: 20,
      maxLeads: 100,
      features: [
        "Busca Google Maps",
        "CRM Básico",
        "Geração de Pitch IA",
        "Dashboard"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 97,
      credits: 500,
      maxUsers: 3,
      maxReports: 100,
      maxLeads: 500,
      features: [
        "Busca Google Maps",
        "CRM Completo",
        "Radar Digital",
        "Meta Ads Library",
        "Google Stitch",
        "IA Comercial",
        "Relatórios PDF"
      ]
    },
    {
      id: "agency",
      name: "Agência",
      price: 197,
      credits: 2000,
      maxUsers: 10,
      maxReports: 1000,
      maxLeads: 2000,
      features: [
        "Tudo do Plano Pro",
        "Equipe Multiusuário",
        "White Label",
        "Dashboard Avançado",
        "Propostas Automáticas",
        "Contratos Automáticos",
        "Exportação Completa",
        "Prioridade IA"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 497,
      credits: 10000,
      maxUsers: 50,
      maxReports: 99999,
      maxLeads: 10000,
      features: [
        "Tudo do Plano Agência",
        "Usuários ilimitados configuráveis",
        "Suporte prioritário",
        "Consultoria dedicada",
        "API exclusiva",
        "Integrações personalizadas",
        "Servidor dedicado"
      ]
    }
  ];

  try {
    for (const plan of defaultPlans) {
      await setDoc(doc(db, "plans", plan.id), plan);
    }
    console.log("SaaS plans successfully seeded in Firestore database.");
  } catch (err: any) {
    console.warn("Auto seeding of static SaaS plans failed:", err.message);
  }
}

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

// GET ASAAS/PAYMENT GATEWAY CONFIGURATION
app.get("/api/config/payment", (req, res) => {
  const asaasKey = process.env.ASAAS_API_KEY || "";
  const walletId = process.env.ASAAS_WALLET_ID || "";
  
  res.json({
    activeGateway: "Asaas",
    asaasConfigured: !!asaasKey,
    walletId: walletId || "Não configurado",
    maskedKey: asaasKey ? `${asaasKey.slice(0, 10)}...${asaasKey.slice(-10)}` : "Não configurado"
  });
});

// ----------------------------------------------------
// ASAAS INTEGRATED BILLING & WEBHOOK ENGINE
// ----------------------------------------------------

/**
 * Handle checkout simulator and potential real Asaas API payments
 */
app.post("/api/asaas/checkout", async (req, res) => {
  const { userId, planId, method = "pix", creditCardInfo } = req.body;
  if (!userId || !planId) {
    return res.status(400).json({ error: "Missing required arguments userId and planId" });
  }

  const planCredits: any = { starter: 100, pro: 500, agency: 2000, enterprise: 10000 };
  const planPrices: any = { starter: 49, pro: 97, agency: 197, enterprise: 497 };
  const planNames: any = { starter: "Starter", pro: "Pro", agency: "Agência", enterprise: "Enterprise" };

  const price = planPrices[planId] || 97;
  const credits = planCredits[planId] || 500;
  const planName = planNames[planId] || "Pro";

  // Simulated subscription metadata
  const subId = `sub_${Date.now().toString(36)}`;
  const payId = `pay_${Date.now().toString(36)}`;
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  if (db) {
    try {
      // 1. Create or update subscription collection record
      await setDoc(doc(db, "subscriptions", subId), {
        id: subId,
        userId: userId,
        teamId: userId, // Default personal team
        status: "ACTIVE",
        planId: planId,
        price: price,
        nextBillingDate: nextBilling.toISOString().split("T")[0],
        asaasSubscriptionId: `asaas_rec_${Date.now().toString(16)}`
      });

      // 2. Add payment history record
      await setDoc(doc(db, "payments", payId), {
        id: payId,
        userId: userId,
        teamId: userId,
        date: new Date().toISOString(),
        amount: price,
        method: method,
        status: "CONFIRMED",
        link: "https://sandbox.asaas.com/comprovante/" + payId
      });

      // 3. Update user profile's plan and credits in Firestore
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      let currentCredits = 0;
      if (userSnap.exists()) {
        currentCredits = userSnap.data().credits || 0;
      }
      await setDoc(userRef, {
        plan: planName,
        credits: currentCredits + credits,
        subscriptionStatus: "ACTIVE"
      }, { merge: true });

      // 4. Log activity
      await setDoc(doc(db, "activityLogs", `log_${Date.now()}`), {
        id: `log_${Date.now()}`,
        userId: userId,
        userName: userSnap.exists() ? userSnap.data().name : "Usuário",
        action: "ASSINATURA_SaaS",
        details: `Iniciou plano ${planName} via checkout (${method.toUpperCase()}). Adicionado ${credits} créditos.`,
        createdAt: new Date().toISOString()
      });

    } catch (dbErr: any) {
      console.error("Firestore database update failed on checkout:", dbErr.message);
    }
  }

  return res.json({
    status: "success",
    message: `Checkout processado com sucesso para o plano ${planName}!`,
    subscriptionId: subId,
    paymentId: payId,
    pixCode: method === "pix" ? `00020126580014BR.GOV.BCB.PIX0136asaas-wallet-78333e16-${planId}` : null,
    qrCodeUrl: method === "pix" ? "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asaas-checkout-" + planId : null
  });
});

/**
 * RECEIVE REAL ASAAS WEBHOOK ENDPOINT
 */
app.post("/api/webhooks/asaas", async (req, res) => {
  const { event, payment, subscription } = req.body;
  const token = req.headers["asaas-access-token"] || req.headers["authorization"];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  console.log(`[Webhook Asaas] Received Event: "${event}"`);

  if (expectedToken && token !== expectedToken) {
    console.warn(`[Webhook Asaas] Warning: Webhook authorize token mismatch. Expected: ${expectedToken}, Got: ${token}`);
  }

  if (!event || !payment) {
    return res.status(400).json({ error: "Invalid webhook payload structure" });
  }

  const userId = payment.customVariables?.userId || payment.externalReference || subscription?.externalReference || "demo_user";
  const planId = payment.customVariables?.planId || payment.externalReference?.split("-")[1] || "pro";

  const planCredits: any = { starter: 100, pro: 500, agency: 2000, enterprise: 10000 };
  const planNames: any = { starter: "Starter", pro: "Pro", agency: "Agência", enterprise: "Enterprise" };
  const creditsDiff = planCredits[planId] || 500;
  const targetPlanName = planNames[planId] || "Pro";

  if (db) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      // Log receipt
      const logId = `log_webhook_${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        userId: userId,
        userName: userSnap.exists() ? userSnap.data().name : "Usuário Webhook",
        action: `WEBHOOK_${event}`,
        details: `Processamento do evento ${event} recebido via gateway de pagamentos Asaas.`,
        createdAt: new Date().toISOString()
      });

      // Handle Event Type Transitions
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        console.log(`[Webhook Asaas] Activating user "${userId}" subscription with status ACTIVE.`);
        
        let userCurrentCredits = 0;
        if (userSnap.exists()) {
          userCurrentCredits = userSnap.data().credits || 0;
        }

        await setDoc(userRef, {
          subscriptionStatus: "ACTIVE",
          plan: targetPlanName,
          credits: userCurrentCredits + creditsDiff
        }, { merge: true });

        // Update Subscription status to ACTIVE
        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          id: subId,
          userId: userId,
          teamId: userId,
          status: "ACTIVE",
          planId: planId,
          price: payment.value || 97,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        }, { merge: true });

        // Save incoming payment log
        const payId = payment.id || `pay_${Date.now()}`;
        await setDoc(doc(db, "payments", payId), {
          id: payId,
          userId: userId,
          teamId: userId,
          date: new Date().toISOString(),
          amount: payment.value || 97,
          method: payment.billingType?.toLowerCase() || "pix",
          status: "RECEIVED",
          link: payment.invoiceUrl || ""
        }, { merge: true });
      } 
      else if (event === "PAYMENT_OVERDUE") {
        console.log(`[Webhook Asaas] Restricting user "${userId}" subscription to PENDING (payment overdue).`);
        await setDoc(userRef, {
          subscriptionStatus: "PENDING"
        }, { merge: true });

        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          status: "PENDING"
        }, { merge: true });
      } 
      else if (event === "PAYMENT_DELETED" || event === "SUBSCRIPTION_DELETED") {
        console.log(`[Webhook Asaas] Setting user "${userId}" subscription to CANCELED.`);
        await setDoc(userRef, {
          subscriptionStatus: "CANCELED"
        }, { merge: true });

        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          status: "CANCELED"
        }, { merge: true });
      }
    } catch (err: any) {
      console.error(`[Webhook Asaas] Firestore sync failed for event ${event}:`, err.message);
    }
  }

  res.json({ success: true, processedEvent: event });
});

/**
 * EXPLICIT DEVELOPER TESTING METHOD: SIMULATE ASAAS WEBHOOK TRIGGER
 */
app.post("/api/webhooks/asaas/simulate", async (req, res) => {
  const { event, userId, planId, value } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const payload = {
    event: event || "PAYMENT_RECEIVED",
    payment: {
      id: `pay_sim_${Math.random().toString(36).substring(3, 9)}`,
      value: value || 97,
      billingType: "PIX",
      externalReference: `${userId}-${planId || "pro"}`
    },
    subscription: {
      id: `sub_sim_${Math.random().toString(36).substring(3, 9)}`,
      externalReference: userId
    }
  };

  try {
    const url = `http://localhost:3000/api/webhooks/asaas`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, payloadSent: payload, result: data });
    } else {
      throw new Error(`Server returned status code ${response.status}`);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Webhook simulation trigger failed: " + err.message });
  }
});

// GENERATE MATCHING LEADS DYNAMICALLY
app.post("/api/leads/generate", async (req, res) => {
  const { niche, location, limit = 10 } = req.body;

  const resolvedNiche = niche || "Padaria";
  const resolvedLocation = location || "São Paulo, SP";

  // Check if real Google Maps API Key is provisioned to fetch real live B2B businesses
  const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY;
  if (googleMapsKey && googleMapsKey !== "YOUR_API_KEY" && googleMapsKey !== "") {
    try {
      console.log(`[Google Maps API] Fetching real places for: "${resolvedNiche} em ${resolvedLocation}"`);
      const textQuery = `${resolvedNiche} em ${resolvedLocation}`;
      const url = "https://places.googleapis.com/v1/places:searchText";
      
      const gMapsResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleMapsKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.types"
        },
        body: JSON.stringify({
          textQuery,
          languageCode: "pt-BR",
          maxResultCount: Math.min(Number(limit) || 10, 20)
        })
      });

      if (gMapsResponse.ok) {
        const data = (await gMapsResponse.json()) as any;
        if (data.places && Array.isArray(data.places) && data.places.length > 0) {
          const realLeads = data.places.map((place: any) => {
            const name = place.displayName?.text || "Negócio sem Nome";
            const rating = place.rating || parseFloat((Math.random() * 1.5 + 3.4).toFixed(1));
            const reviews = place.userRatingCount || Math.floor(Math.random() * 180) + 12;
            const hasWebsite = !!place.websiteUri;
            const hasPhone = !!place.nationalPhoneNumber;
            const phone = place.nationalPhoneNumber || "";

            // Custom score formula: lack of website increases opportunity score!
            let score = 55;
            if (!hasWebsite) score += 30;
            if (rating >= 4.4) score += 10;
            if (reviews > 100) score += 5;

            const gmbAnalysis = !hasWebsite
              ? `Empresa real localizada em ${place.formattedAddress || resolvedLocation}. Possui excelente aprovação local (${rating}★ com ${reviews} avaliações espontâneas), mas NÃO possui Website próprio. Perde faturamento por falta de funil próprio.`
              : `Empresa real localizada em ${place.formattedAddress || resolvedLocation}. Possui site ativo (${place.websiteUri}), mas carece de otimizações técnicas de tráfego, SEO local e Pixel do Meta instalado.`;

            return {
              name,
              rating,
              reviews,
              hasWebsite,
              hasGmbActive: true,
              hasPhone,
              phone,
              leadScore: Math.min(score, 100),
              gmbAnalysis
            };
          });

          console.log(`[Google Maps API] Successfully synchronized ${realLeads.length} real locations.`);
          return res.json({ leads: realLeads });
        } else {
          console.log("[Google Maps API] Empty results, fallback to Gemini AI generation.");
        }
      } else {
        console.warn(`[Google Maps API] Non-2xx response: ${gMapsResponse.status}. Skipping.`);
      }
    } catch (placeErr: any) {
      console.error("[Google Maps API] Error during request:", placeErr.message);
    }
  }

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
    content = `Assunto: Oportunidade de Crescimento em ${location} - ${leadName}\n\n${greeting} ${leadName},\n\nEspero que este e-mail os encontre bem.\n\nEstávamos analisando as empresas de destaque no setor de ${niche} em ${location} e notamos que a sua empresa possui um perfil excelente e de alta reputação nas avaliações do Google.\n\nNo entanto, identificamos que a ausência de uma página web estruturada ou otimização de ${rGoal} está limitando o seu alcance digital de potenciais compradores que navegam online diariamente buscando serviços similares.\n\nNós ajudamos empresas como a sua a preencher essa lacuna e duplicar o tráfego de clientes locais de forma rápida e eficiente.\n\nGostaria de agendar uma breve conversa de 5 a 10 minutos esta semana para demonstrar como isso pode ser feito em poucos passos?\n\nAtenciosamente,\n[Seu Nome]\nAdsHive Prospect Consultoria`;
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
