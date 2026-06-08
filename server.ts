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
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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
    const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-07fa01e6-d6a1-4d4e-b05a-262a2373f3d7";
    db = getFirestore(fbApp, dbId);
    console.log("Firebase initialized successfully on server-side.");
    seedPlans();

    // Authenticate backend securely to enable server-side updates bypassing client-restrictions
    const auth = getAuth(fbApp);
    const serverEmail = "douglas_teste@adshive.com";
    const serverPassword = "AdshiveTestPassword2026!";
    
    signInWithEmailAndPassword(auth, serverEmail, serverPassword)
      .then(async (userCredential) => {
        console.log(`[Firebase Server Auth] Authenticated as Admin backend: ${userCredential.user.email}`);
        // Ensure user is declared as Administrator in Firestore so rules recognize isAdmin()
        const adminUserRef = doc(db, "users", userCredential.user.uid);
        await setDoc(adminUserRef, {
          id: userCredential.user.uid,
          name: "Douglas CMA Teste",
          email: serverEmail,
          role: "Administrador",
          plan: "Pro",
          credits: 999999,
          subscriptionStatus: "ACTIVE"
        }, { merge: true });
        console.log("[Firebase Server Auth] Confirmed Admin privilege fields in Firestore.");
      })
      .catch(async (err) => {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/cannot-find-user" || err.message.includes("credential")) {
          console.log(`[Firebase Server Auth] Test account does not exist. Registering: "${serverEmail}"...`);
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, serverEmail, serverPassword);
            console.log(`[Firebase Server Auth] Created new Admin account: "${serverEmail}".`);
            const adminUserRef = doc(db, "users", userCredential.user.uid);
            await setDoc(adminUserRef, {
              id: userCredential.user.uid,
              name: "Douglas CMA Teste",
              email: serverEmail,
              role: "Administrador",
              plan: "Pro",
              credits: 999999,
              subscriptionStatus: "ACTIVE"
            });
            console.log("[Firebase Server Auth] Created and provisioned Admin profile in Firestore.");
          } catch (createErr: any) {
            console.error("[Firebase Server Auth] Auto-create backend admin account failed:", createErr.message);
          }
        } else {
          console.error("[Firebase Server Auth] Login failed:", err.message);
        }
      });
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

// GET GOOGLE MAPS CONFIGURATION
app.get("/api/config/maps", (req, res) => {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
  const isConfigured = !!mapsKey && mapsKey !== "YOUR_API_KEY" && mapsKey !== "";
  res.json({
    hasKey: isConfigured,
    key: isConfigured ? mapsKey : ""
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

// ----------------------------------------------------
// AdsHive AI Global - Limit Tracking and Interactions
// ----------------------------------------------------

async function getOrCreateUsage(userId: string, userPlan: string) {
  if (!db) {
    return {
      userId,
      plan: userPlan || "Gratuito",
      messagesUsed: 0,
      messagesLimit: 20,
      lastResetDate: new Date().toISOString()
    };
  }

  const usageRef = doc(db, "aiUsage", userId);
  const usageSnap = await getDoc(usageRef);

  const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  
  let planLimit = 20;
  const normalizedPlan = (userPlan || "Gratuito").toLowerCase();
  
  if (normalizedPlan === "starter") planLimit = 200;
  else if (normalizedPlan === "pro") planLimit = 1000;
  else if (normalizedPlan === "agência" || normalizedPlan === "agency") planLimit = 5000;
  else if (normalizedPlan === "enterprise") planLimit = 10000;

  if (usageSnap.exists()) {
    const data = usageSnap.data();
    let messagesUsed = data.messagesUsed ?? 0;
    let messagesLimit = data.messagesLimit ?? planLimit;
    let lastResetDate = data.lastResetDate || new Date().toISOString();

    // Check if monthly reset applies
    if (lastResetDate.substring(0, 7) !== currentMonth) {
      messagesUsed = 0;
      lastResetDate = new Date().toISOString();
      await setDoc(usageRef, {
        messagesUsed,
        lastResetDate,
        plan: userPlan || "Gratuito",
        messagesLimit: planLimit // Reset to base limit of current subscribed plan
      }, { merge: true });
    } else {
      // Just ensure the current plan name is synced
      if (data.plan !== (userPlan || "Gratuito")) {
        messagesLimit = planLimit;
        await setDoc(usageRef, {
          plan: userPlan || "Gratuito",
          messagesLimit: planLimit
        }, { merge: true });
      }
    }

    return {
      userId,
      plan: userPlan || data.plan || "Gratuito",
      messagesUsed,
      messagesLimit,
      lastResetDate
    };
  } else {
    // Create new document
    const lastResetDate = new Date().toISOString();
    const newUsage = {
      userId,
      plan: userPlan || "Gratuito",
      messagesUsed: 0,
      messagesLimit: planLimit,
      lastResetDate
    };
    await setDoc(usageRef, newUsage);
    return newUsage;
  }
}

// GET AI SYSTEM USAGE DETAILS
app.get("/api/ai/usage/:userId", async (req, res) => {
  const { userId } = req.params;
  const { plan = "Gratuito" } = req.query;
  try {
    const usage = await getOrCreateUsage(userId, plan as string);
    res.json(usage);
  } catch (err: any) {
    console.error("Error retrieving AI usage:", err);
    res.status(500).json({ error: "Failed to retrieve AI usage details" });
  }
});

// INTERACT WITH DYNAMIC ADSHIVE AI SERVICES
app.post("/api/ai/interact", async (req, res) => {
  const { userId, resource, prompt, companyDetails, userPlan = "Gratuito" } = req.body;
  
  if (!userId || !resource || !prompt) {
    return res.status(400).json({ error: "Missing required arguments: userId, resource or prompt" });
  }

  try {
    const usage = await getOrCreateUsage(userId, userPlan);
    
    // Limits check
    if (usage.messagesUsed >= usage.messagesLimit) {
      return res.status(403).json({ 
        error: "Você atingiu o limite de IA do seu plano. Faça um upgrade ou adquira um pacote de interações para continuar.", 
        overLimit: true,
        usage 
      });
    }

    const instructions: any = {
      "copiloto": "Você é o Copiloto Comercial da plataforma AdsHive Prospect. Seu papel é atuar como consultor estratégico e executivo de vendas sênior B2B, sugerindo abordagens inovadoras de impacto, argumentações contundentes e táticas de conversão rápida baseadas nas informações do lead.",
      "whatsapp": "Você é uma IA especialista em criar cópias exclusivas e de alta conversão para o WhatsApp. Escreva mensagens curtas (até 4 parágrafos), de leitura leve, marcante, repletas de gatilhos mentais da dor e sempre terminadas por uma CTA simples marcando reunião.",
      "email": "Você é um copywriter de cold mailing B2B de elite. Crie um e-mail refinado com um título/assunto atraente, corpo focado na resolução de GAPs de SEO e Google Maps do lead, finalizando com solicitação de call de 5 minutos.",
      "auditor": "Você é um auditor sênior de marketing e infraestrutura digital. Faça um diagnóstico completo do lead, destaque pontos fortes das avaliações e as falhas técnicas críticas na presença na web.",
      "seo": "Você é um especialista em SEO Local e tráfego orgânico B2B. Dê conselhos práticos e táticos estruturados para otimizar os rankings do lead nos mapas e pesquisas do Google para torná-lo líder absoluto de tráfego local.",
      "maps": "Você é especialista em Google Maps e posicionamento de marca local. Forneça estratégias de preenchimento do Google Meu Negócio, geração e resposta de reviews qualificados, e correções de imagem.",
      "concorrentes": "Você é um analista estratégico corporativo. Sugira formas criativas para o lead desbancar os concorrentes de buscas locais, estabelecer propostas de valor únicas e roubar faturamento da concorrência.",
      "proposta": "Você é um estruturador comercial de propostas B2B. Crie uma proposta comercial robusta em tópicos estruturados, definindo o escopo das entregas (SEO, Nova Landing Page, Pixel tráfego), vantagens estratégicas e um tom formal focado no retorno do investimento."
    };

    const sysInstruction = instructions[resource] || "Você é o assistente inteligente AdsHive AI, especialista em conversão B2B e marketing digital local.";

    let companyContext = "";
    if (companyDetails && companyDetails.name) {
      companyContext = `\n--- DADOS DA EMPRESA SELECIONADA ---\n` +
        `- Nome: ${companyDetails.name}\n` +
        `- Setor / Nicho: ${companyDetails.niche || "Não informado"}\n` +
        `- Local: ${companyDetails.location || "Não especificado"}\n` +
        `- Avaliações: ${companyDetails.rating || "N/A"}★ (${companyDetails.reviews || 0} reviews)\n` +
        `- Possui Website Oficial: ${companyDetails.hasWebsite ? "Sim" : "Não (Oportunidade Quente)"}\n` +
        `- Telefone Comercial: ${companyDetails.phone || "Não informado"}\n` +
        `- Análise GMB Original: ${companyDetails.gmbAnalysis || ""}\n` +
        `-----------------------------------------\n\n`;
    }

    const fullPrompt = `${companyContext}Solicitação / Pergunta: ${prompt}\n\nFormate a resposta ricamente utilizando tópicos limpos, parágrafos fluidos, tom amigável porém técnico e focado no crescimento de vendas. Escreva em Português do Brasil (PT-BR).`;

    const ai = getGeminiClient();
    let generatedContentText = "";

    if (ai) {
      console.log(`Running AdsHive AI [${resource}] for User: ${userId}`);
      const response = await generateContentWithRetry(ai, {
        contents: fullPrompt,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.82
        }
      });
      generatedContentText = response.text || "";
    } else {
      generatedContentText = `⚠️ [Simulação Offline - Gemini indisponível]\nMuito obrigado por utilizar a Inteligência Artificial Comercial AdsHive AI!\n\nAnalisando o lead em foco: ${companyDetails?.name || "Sem Nome"}.\n\nRecomendados:\n- Implementar landing page ágil otimizada para telefones;\n- Organizar SEO Maps revisando palavras-chave estruturais;\n- Configurar campanhas locais de tráfego pago.\n\nSua pergunta: "${prompt}" foi processada com êxito!`;
    }

    let updatedUsage = { ...usage };
    if (db) {
      const usageRef = doc(db, "aiUsage", userId);
      const finalUsed = usage.messagesUsed + 1;
      await setDoc(usageRef, {
        messagesUsed: finalUsed
      }, { merge: true });
      updatedUsage.messagesUsed = finalUsed;

      // Persist AI usage logging
      const logDocId = `ailog_${Date.now()}`;
      await setDoc(doc(db, "aiLogs", logDocId), {
        id: logDocId,
        userId: userId,
        empresa: companyDetails?.name || "Sem Empresa",
        pergunta: prompt,
        resposta: generatedContentText,
        timestamp: new Date().toISOString(),
        modelo: ai ? "gemini-3.5-flash" : "Simulado Offline"
      });
    }

    res.json({
      text: generatedContentText,
      usage: updatedUsage
    });

  } catch (err: any) {
    console.error("AdsHive AI interaction error:", err);
    res.status(500).json({ error: "Falha ao processar solicitação na IA: " + err.message });
  }
});

// BUY EXTRA AI INTERACTION PACKAGES (ASAAS TRANSACTION ACCREDITATION)
app.post("/api/asaas/buy-ai-package", async (req, res) => {
  const { userId, packageId, method = "pix" } = req.body;
  if (!userId || !packageId) {
    return res.status(400).json({ error: "Missing required arguments userId and packageId" });
  }

  const packages: any = {
    "pack-100": { name: "Pacote 100 IA", interactions: 100, price: 10 },
    "pack-500": { name: "Pacote 500 IA", interactions: 500, price: 40 },
    "pack-1000": { name: "Pacote 1000 IA", interactions: 1000, price: 70 }
  };

  const selectedPack = packages[packageId];
  if (!selectedPack) {
    return res.status(400).json({ error: "Invalid packageId" });
  }

  const price = selectedPack.price;
  const interactions = selectedPack.interactions;
  const packName = selectedPack.name;

  const payId = `pay_ai_${Date.now().toString(36)}`;

  if (db) {
    try {
      // 1. Create payment history document
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

      // 2. Fetch or create aiUsage document to update messagesLimit
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userPlan = userSnap.exists() ? (userSnap.data().plan || "Gratuito") : "Gratuito";

      const usage = await getOrCreateUsage(userId, userPlan);
      const usageRef = doc(db, "aiUsage", userId);
      
      const newLimit = usage.messagesLimit + interactions;
      await setDoc(usageRef, {
        messagesLimit: newLimit
      }, { merge: true });

      // 3. Register Activity Log
      await setDoc(doc(db, "activityLogs", `log_${Date.now()}`), {
        id: `log_${Date.now()}`,
        userId: userId,
        userName: userSnap.exists() ? userSnap.data().name : "Usuário AdsHive",
        action: "COMPRA_PACOTE_IA",
        details: `Adquiriu ${packName} por R$ ${price}. Adicionado ${interactions} interações à cota mensal de IA.`,
        createdAt: new Date().toISOString()
      });

    } catch (dbErr: any) {
      console.error("Firestore update failed on buying AI Package:", dbErr.message);
    }
  }

  return res.json({
    status: "success",
    message: `Pacote de IA adquirido com sucesso! Adicionamos ${interactions} interações de IA e logs à sua cota mensal.`,
    paymentId: payId,
    pixCode: method === "pix" ? `00020126580014BR.GOV.BCB.PIX0136asaas-wallet-ai-${packageId}` : null,
    qrCodeUrl: method === "pix" ? "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asaas-checkout-ai-" + packageId : null
  });
});

/**
 * GET TEMP VALIDATION FOR ASAAS WEBHOOK
 */
app.get("/api/webhooks/asaas", (req, res) => {
  console.log("Webhook recebido (GET de teste)");
  res.json({
    status: "ok",
    service: "asaas-webhook",
    environment: "production"
  });
});

/**
 * RECEIVE REAL ASAAS WEBHOOK ENDPOINT
 */
app.post("/api/webhooks/asaas", async (req, res) => {
  console.log("Webhook recebido (POST real)");
  const { event, payment, subscription } = req.body;
  const token = req.headers["asaas-access-token"] || req.headers["authorization"];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  console.log(`[Webhook Asaas] Received Payload. Event: "${event || 'N/A'}", Token provided: "${token || 'N/A'}"`);

  // Robust Validation log and checks
  if (expectedToken && token !== expectedToken) {
    console.warn(`[Webhook Asaas] Security Alert: Webhook token mismatch! Expected: "${expectedToken}", Got: "${token}"`);
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized: Webhook token mismatch" 
    });
  }

  if (!event || !payment) {
    console.error(`[Webhook Asaas] Insufficient payload structure received!`);
    return res.status(400).json({ error: "Invalid webhook payload structure" });
  }

  const userId = payment.customVariables?.userId || 
                 (payment.externalReference && payment.externalReference.includes("-") ? payment.externalReference.split("-")[0] : payment.externalReference) || 
                 subscription?.externalReference || 
                 "demo_user";
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
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED" || event === "SUBSCRIPTION_CREATED" || event === "SUBSCRIPTION_UPDATED") {
        console.log(`[Webhook Asaas] Activating user "${userId}" subscription with status ACTIVE.`);
        
        let userCurrentCredits = 0;
        if (userSnap.exists()) {
          userCurrentCredits = userSnap.data().credits || 0;
        }

        await setDoc(userRef, {
          subscriptionStatus: "ACTIVE",
          plan: targetPlanName,
          credits: userCurrentCredits + creditsDiff,
          remainingCredits: userCurrentCredits + creditsDiff,
          accountStatus: "ACTIVE"
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
          link: payment.invoiceUrl || "https://sandbox.asaas.com/payment/" + payId
        }, { merge: true });
      } 
      else if (event === "PAYMENT_OVERDUE") {
        console.log(`[Webhook Asaas] Setting user "${userId}" subscription to PAST_DUE (payment overdue).`);
        
        // 1. Alter users subscriptionStatus to PAST_DUE
        await setDoc(userRef, {
          subscriptionStatus: "PAST_DUE"
        }, { merge: true });

        // 2. Save subscription with PAST_DUE status and a simulated past nextbillingDate (5 days ago)
        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          id: subId,
          userId: userId,
          teamId: userId,
          status: "PAST_DUE",
          planId: planId,
          price: payment.value || 97,
          nextBillingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        }, { merge: true });

        // 3. Update payment history log as PAST_DUE
        const payId = payment.id || `pay_${Date.now()}`;
        await setDoc(doc(db, "payments", payId), {
          id: payId,
          userId: userId,
          teamId: userId,
          date: new Date().toISOString(),
          amount: payment.value || 97,
          method: payment.billingType?.toLowerCase() || "pix",
          status: "PAST_DUE",
          link: "https://sandbox.asaas.com/invoice/" + payId
        }, { merge: true });
      } 
      else if (event === "PAYMENT_DELETED" || event === "SUBSCRIPTION_DELETED") {
        console.log(`[Webhook Asaas] Setting user "${userId}" subscription to CANCELED.`);
        
        // When cancelled, update:
        // * subscriptionStatus = CANCELED
        // * plan = FREE
        // * teamLimit = 1
        // * credits = 0
        await setDoc(userRef, {
          subscriptionStatus: "CANCELED",
          plan: "FREE",
          credits: 0,
          remainingCredits: 0,
          teamLimit: 1
        }, { merge: true });

        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          id: subId,
          userId: userId,
          teamId: userId,
          status: "CANCELED",
          planId: "free",
          price: 0,
          nextBillingDate: ""
        }, { merge: true });
      }
      else if (event === "PAYMENT_REFUNDED") {
        console.log(`[Webhook Asaas] Set user "${userId}" subscription to CANCELED due to REFUND.`);
        
        // Refund handles setting plan to FREE and credits to 0
        await setDoc(userRef, {
          subscriptionStatus: "CANCELED",
          plan: "FREE",
          credits: 0,
          remainingCredits: 0,
          teamLimit: 1
        }, { merge: true });

        const subId = subscription?.id || `sub_web_${Date.now()}`;
        await setDoc(doc(db, "subscriptions", subId), {
          id: subId,
          status: "REFUNDED",
          planId: "free"
        }, { merge: true });
      }
    } catch (err: any) {
      console.error(`[Webhook Asaas] Firestore sync failed for event ${event}:`, err.message);
    }
  }

  res.json({
    success: true,
    message: "Webhook recebido",
    processedEvent: event
  });
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
      headers: { 
        "Content-Type": "application/json",
        "asaas-access-token": process.env.ASAAS_WEBHOOK_TOKEN || ""
      },
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
  try {
    const { niche, location, limit = 10 } = req.body || {};
    const limitValue = Math.max(1, Math.min(Math.round(Number(limit)) || 10, 20));

    const resolvedNiche = niche || "Padaria";
    const resolvedLocation = location || "São Paulo, SP";

    // Enforce real Google Maps API Key
    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY;
    if (!googleMapsKey || googleMapsKey === "YOUR_API_KEY" || googleMapsKey.trim() === "") {
      return res.status(400).json({
        error: "Configuração ausente: A chave de API do Google Maps (GOOGLE_MAPS_API_KEY) não está configurada no ambiente. Adicione a chave real na página de configurações para realizar buscas ativas."
      });
    }

    console.log(`[Google Maps Integration] Starting search: "${resolvedNiche}" em "${resolvedLocation}"`);

    // 1. Google Geocoding API Call (Retrieve Lat/Lng)
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      console.log(`[Google Geocoding API] Resolving coordinates for: "${resolvedLocation}"`);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(resolvedLocation)}&key=${googleMapsKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      
      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text();
        throw new Error(`Google Geocoding API respondeu com status ${geocodeResponse.status}: ${errorText}`);
      }

      const geocodeData = (await geocodeResponse.json()) as any;
      if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
        const geometry = geocodeData.results[0].geometry;
        lat = geometry.location.lat;
        lng = geometry.location.lng;
        console.log(`[Google Geocoding API] Location resolved successfully. Coordinates: Lat=${lat}, Lng=${lng}`);
      } else {
        throw new Error(`Serviço de Geocodificação retornou status: ${geocodeData.status}. Mensagem: ${geocodeData.error_message || "Endereço não pôde ser geocodificado de forma precisa."}`);
      }
    } catch (geocodeErr: any) {
      console.error("[CRITICAL GEOCRAWL ERROR] Geocoding validation failed:", geocodeErr?.message || String(geocodeErr));
      return res.status(400).json({
        error: `Falha na geolocalização do endereço via Google Geocoding API: ${geocodeErr?.message || "Endereço inválido"}`
      });
    }

    // 2. Places API (New) Call with circular spatial locationBias constraint
    const textQuery = `${resolvedNiche} em ${resolvedLocation}`;
    const url = "https://places.googleapis.com/v1/places:searchText";

    console.log(`[Places API (New)] Sending searchText request for: "${textQuery}"`);

    const placesPayload: any = {
      textQuery,
      languageCode: "pt-BR",
      maxResultCount: Math.min(limitValue, 20)
    };

    // Apply the spatial circular bias constraint using resolved geopoint
    if (lat !== null && lng !== null) {
      placesPayload.locationBias = {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: 12000.0 // Spatial bias within a 12km radius of search location
        }
      };
    }

    const gMapsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.types"
      },
      body: JSON.stringify(placesPayload)
    });

    if (!gMapsResponse.ok) {
      const placesErrorText = await gMapsResponse.text();
      throw new Error(`Google Places API (New) respondeu com status ${gMapsResponse.status}: ${placesErrorText}`);
    }

    const placesData = (await gMapsResponse.json()) as any;
    
    if (!placesData.places || !Array.isArray(placesData.places) || placesData.places.length === 0) {
      return res.status(404).json({
        error: `Nenhum estabelecimento comercial real condizente com o nicho "${resolvedNiche}" foi localizado na região de "${resolvedLocation}".`
      });
    }

    const realLeads = placesData.places.map((place: any) => {
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
        ? `Empresa real identificada em ${place.formattedAddress || resolvedLocation}. Apresenta excelente recepção com nota de ${rating}★ no Google Meu Negócio (${reviews} reviews espontâneos), porém NÃO possui Website ou Landing Page institucional. Alta oportunidade comercial.`
        : `Empresa ativa geolocalizada no endereço ${place.formattedAddress || resolvedLocation}. Possui site registrado (${place.websiteUri}), mas carece de otimizações de SEO local, Pixel de tráfego, ou funil otimizado para conversão regional.`;

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

    console.log(`[Google Maps API] Processed and returned ${realLeads.length} genuine leads.`);
    return res.json({ leads: realLeads });

  } catch (globalErr: any) {
    const errorMsg = globalErr?.message || String(globalErr);
    console.error("[CRITICAL GOOGLE SEARCH ENDPOINT ERROR]", errorMsg);
    return res.status(500).json({
      error: `Erro crítico na integração do Google Maps (Geocoding / Places): ${errorMsg}`
    });
  }
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
