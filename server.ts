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

// CORS headers configuration to enable seamless integrations on custom domains
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, asaas-access-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
        await seedPlans();
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
            await seedPlans();
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

// INTEGRATION HEALTH DIAGNOSTIC REPORT FOR THE SYSTEM-HEALTH PAGE
app.get("/api/health/integrations", async (req, res) => {
  const report: any = {
    firebase: { status: "LOADING", message: "Aguardando verificação." },
    gemini: { status: "LOADING", message: "Aguardando verificação." },
    asaas: { status: "LOADING", message: "Aguardando verificação." }
  };

  // 1. Check Firebase / Firestore
  try {
    if (!db) {
      report.firebase = { status: "FAIL", message: "Banco de dados Firestore (db) não inicializado no servidor." };
    } else {
      const docRef = doc(db, "settings", "google_maps_config");
      await getDoc(docRef);
      report.firebase = { status: "OK", message: "Conexão ativa com o Firebase Firestore estabilizada." };
    }
  } catch (err: any) {
    report.firebase = { status: "FAIL", message: `Falha de conexão com Firestore: ${err.message}` };
  }

  // 2. Check Gemini API
  try {
    const ai = getGeminiClient();
    if (!ai) {
      report.gemini = { status: "FAIL", message: "Serviço Gemini inativo: GEMINI_API_KEY não configurada ou inválida." };
    } else {
      // Small real request with short timeout and low tokens
      const testPromise = ai.models.generateContent({
        contents: "Responder apenas com 'OK'.",
        model: "gemini-1.5-flash",
        config: { maxOutputTokens: 5 }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout de 4 segundos ao consultar Gemini API.")), 4000)
      );

      await Promise.race([testPromise, timeoutPromise]);
      report.gemini = { status: "OK", message: "Conexão ativa. Credenciais Gemini operacionais e homologadas." };
    }
  } catch (err: any) {
    const isNoKey = !process.env.GEMINI_API_KEY;
    report.gemini = { 
      status: "FAIL", 
      message: isNoKey 
        ? "GEMINI_API_KEY não definida no ambiente (.env)." 
        : `Erro na autenticação com Gemini: ${err.message}` 
    };
  }

  // 3. Check Asaas Gateway
  try {
    const asaasKey = process.env.ASAAS_API_KEY;
    if (!asaasKey || asaasKey.trim() === "") {
      report.asaas = { status: "FAIL", message: "ASAAS_API_KEY não encontrada no ambiente (.env)." };
    } else {
      const isSandbox = !asaasKey.startsWith("$o");
      const baseUrl = isSandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
      
      const testPromise = fetch(`${baseUrl}/customers?limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": asaasKey
        }
      });

      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout de 4 segundos na rede com Asaas.")), 4000)
      );

      const response = await Promise.race([testPromise, timeoutPromise]);
      
      if (response.ok) {
        report.asaas = { 
          status: "OK", 
          message: `Conexão ativa com Gateway de Pagamentos Asaas (${isSandbox ? "Sandbox/Homologação" : "Produção"}).` 
        };
      } else {
        const bodyTxt = await response.text().catch(() => "");
        report.asaas = { 
          status: "FAIL", 
          message: `Asaas rejeitou requisição (${response.status}): ${bodyTxt || "Chave inválida ou suspensa."}` 
        };
      }
    }
  } catch (err: any) {
    report.asaas = { status: "FAIL", message: `Falha de rede ao conectar com Asaas: ${err.message}` };
  }

  res.json({ report });
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

// SAVE GOOGLE MAPS CONFIGURATION
app.post("/api/config/maps/save", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: "Chave não fornecida" });
    }

    // Set in-memory env variables
    process.env.GOOGLE_MAPS_API_KEY = key;
    process.env.GOOGLE_MAPS_PLATFORM_KEY = key;

    // Persist to .env
    const fs = await import("fs/promises");
    const path = await import("path");
    const envPath = path.join(process.cwd(), ".env");

    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch {
      // ignore
    }

    if (envContent.includes("GOOGLE_MAPS_PLATFORM_KEY=")) {
      envContent = envContent.replace(/GOOGLE_MAPS_PLATFORM_KEY=.*/, `GOOGLE_MAPS_PLATFORM_KEY=${key}`);
    } else {
      envContent += `\nGOOGLE_MAPS_PLATFORM_KEY=${key}`;
    }

    if (envContent.includes("GOOGLE_MAPS_API_KEY=")) {
      envContent = envContent.replace(/GOOGLE_MAPS_API_KEY=.*/, `GOOGLE_MAPS_API_KEY=${key}`);
    } else {
      envContent += `\nGOOGLE_MAPS_API_KEY=${key}`;
    }

    await fs.writeFile(envPath, envContent.trim() + "\n", "utf-8");

    res.json({ success: true, message: "Chave do Google Maps salva com sucesso!" });
  } catch (err: any) {
    console.error("[Save Maps Key Error]", err);
    res.status(500).json({ error: `Erro ao salvar chave: ${err.message}` });
  }
});

// VALIDATE GOOGLE MAPS API SERVICES INDIVIDUALLY
app.post("/api/config/maps/validate", async (req, res) => {
  try {
    const { key, service } = req.body;
    if (!key) {
      return res.status(400).json({ error: "Chave não fornecida para validação" });
    }

    const report: any = {};

    // 0. Maps JavaScript API Test
    if (!service || service === "maps_js" || service === "billing") {
      try {
        const jsUrl = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
        const jsRes = await fetch(jsUrl);
        const jsText = await jsRes.text();
        
        if (jsRes.ok && !jsText.includes("API key is invalid") && !jsText.includes("ApiNotActivatedMapError") && !jsText.includes("InvalidKeyMapError")) {
          report.maps_js = { status: "OK", message: "Serviço Maps JavaScript API ativo e pronto para renderização nos canais visuais." };
        } else {
          let detail = "Não habilitado ou sem faturamento.";
          if (jsText.includes("API key is invalid") || jsText.includes("InvalidKeyMapError")) {
            detail = "Chave de API inválida.";
          } else if (jsText.includes("ApiNotActivatedMapError")) {
            detail = "Serviço Maps JS API não está ativado no painel GCP.";
          }
          report.maps_js = { status: "FAIL", message: `Falha na ativação do Maps JS: ${detail}` };
        }
      } catch (err: any) {
        report.maps_js = { status: "FAIL", message: `Erro de rede/timeout: ${err.message}` };
      }
    }

    // 1. Geocoding API Test
    if (!service || service === "geocoding" || service === "billing") {
      try {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Googleplex&key=${encodeURIComponent(key)}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (geoData.status === "OK") {
          report.geocoding = { status: "OK", message: "Serviço ativo e respondendo normalmente." };
        } else if (geoData.status === "ZERO_RESULTS") {
          report.geocoding = { status: "OK", message: "Conectado com sucesso (nenhum resultado retornado)." };
        } else {
          report.geocoding = { 
            status: "FAIL", 
            message: geoData.error_message || geoData.status || "Erro desconhecido." 
          };
        }
      } catch (err: any) {
        report.geocoding = { status: "FAIL", message: `Erro de rede/timeout: ${err.message}` };
      }
    }

    // 2. Places API (New) Test
    if (!service || service === "places" || service === "billing") {
      try {
        const placesUrl = `https://places.googleapis.com/v1/places:searchByText?key=${encodeURIComponent(key)}`;
        const placesRes = await fetch(placesUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "places.id,places.displayName"
          },
          body: JSON.stringify({ textQuery: "Googleplex" })
        });
        const placesData = await placesRes.json();

        if (placesRes.ok && placesData.places) {
          report.places = { status: "OK", message: "Serviço ativo (Places API New respondendo)." };
        } else {
          const errMsg = placesData?.error?.message || placesData?.error?.status || "Erro na consulta.";
          report.places = { status: "FAIL", message: errMsg };
        }
      } catch (err: any) {
        report.places = { status: "FAIL", message: `Erro de rede/timeout: ${err.message}` };
      }
    }

    // 3. Directions / Routes API Test
    if (!service || service === "routes" || service === "billing") {
      try {
        const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${encodeURIComponent(key)}`;
        const routesRes = await fetch(routesUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
          },
          body: JSON.stringify({
            origin: { address: "São Paulo, SP" },
            destination: { address: "Campinas, SP" },
            travelMode: "DRIVING"
          })
        });
        const routesData = await routesRes.json();

        if (routesRes.ok && routesData.routes) {
          report.routes = { status: "OK", message: "Serviço ativo (Routes API respondendo)." };
        } else {
          const errMsg = routesData?.error?.message || routesData?.error?.status || "Erro ao computar rota.";
          report.routes = { status: "FAIL", message: errMsg };
        }
      } catch (err: any) {
        report.routes = { status: "FAIL", message: `Erro de rede/timeout: ${err.message}` };
      }
    }

    // 4. Verify Billing Status based on response issues
    if (!service || service === "billing") {
      const allMessagesAndStatus = [
        JSON.stringify(report.maps_js || {}),
        JSON.stringify(report.geocoding || {}),
        JSON.stringify(report.places || {}),
        JSON.stringify(report.routes || {})
      ].join(" ").toLowerCase();

      const bilNotEnabled = allMessagesAndStatus.includes("billingnotenabled") || 
                            allMessagesAndStatus.includes("billing is not enabled") ||
                            allMessagesAndStatus.includes("enable billing") ||
                            allMessagesAndStatus.includes("billing_not_enabled");

      const keyInvalid = allMessagesAndStatus.includes("api key is invalid") || 
                         allMessagesAndStatus.includes("invalid key") ||
                         allMessagesAndStatus.includes("keyinvalid") ||
                         allMessagesAndStatus.includes("api key not authorized");

      if (keyInvalid) {
        report.billing = { status: "FAIL", message: "Impossível validar faturamento pois a chave inserida é inválida." };
      } else if (bilNotEnabled) {
        report.billing = { status: "FAIL", message: "Conta de faturamento (Billing) desativada ou não vinculada a este projeto." };
      } else if (
        (report.geocoding && report.geocoding.status === "OK") || 
        (report.places && report.places.status === "OK") || 
        (report.maps_js && report.maps_js.status === "OK")
      ) {
        report.billing = { status: "OK", message: "Faturamento ativo. Conta de faturamento ativa e vinculada no Google Cloud." };
      } else {
        report.billing = { status: "FAIL", message: "Faturamento inativo ou pendente devido a falha nos serviços." };
      }
    }

    res.json({
      valid: (!service && (report.geocoding?.status === "OK" || report.places?.status === "OK")) || 
             (service && report[service]?.status === "OK"),
      report
    });
  } catch (err: any) {
    console.error("[Validate Maps Key Global Error]", err);
    res.status(500).json({ error: `Erro no processo de validação: ${err.message}` });
  }
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
  else if (normalizedPlan === "unlimited" || normalizedPlan === "ilimitado") planLimit = 999999;

  // Granular check to ensure douglasbateriacma@gmail.com or Administrator role are given unlimited (999999) limit on server
  let isDevOrAdmin = userId === "douglasbateriacma@gmail.com";
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const uData = userSnap.data();
      const email = (uData.email || "").toLowerCase();
      const role = (uData.role || "").toLowerCase();
      const planName = (uData.plan || "").toLowerCase();
      if (
        email === "douglasbateriacma@gmail.com" || 
        role === "administrador" ||
        role === "admin" ||
        planName === "unlimited" || 
        planName === "ilimitado"
      ) {
        isDevOrAdmin = true;
      }
    }
  } catch (err) {
    console.warn("Could not load user profile in limit check:", err);
  }

  if (isDevOrAdmin) {
    planLimit = 999999;
  }

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

    // Robust sandbox prediction engine using Gemini when Google Maps credentials or billing is deficient:
    const runGeminiFallback = async () => {
      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("Cliente de IA Gemini não pôde ser inicializado.");
      }

      console.log(`[Sandbox Fallback] Gerando leads comerciais simulados de alta qualidade via Gemini para "${resolvedNiche}" em "${resolvedLocation}"...`);

      const systemInstruction = `Você é um robô de Inteligência de Prospecção Comercial Avançada B2B do AdsHive. Sua função é gerar resultados de pesquisa regional de alta qualidade e extrema fidelidade em português (PT-BR) para empresas do nicho de "${resolvedNiche}" na região de "${resolvedLocation}".`;

      const promptTemplate = `Gere uma lista de ${limitValue} empresas comerciais realistas para o nicho de "${resolvedNiche}" na região/bairro de "${resolvedLocation}".
Retorne dados consistentes em formato JSON com o seguinte formato exato de objeto:
{
  "places": [
    {
      "name": "Nome da empresa realista regional (sem aspas)",
      "formattedAddress": "Endereço completo estruturado com rua, número, bairro real de ${resolvedLocation}, cidade - UF, CEP",
      "rating": 4.5, // nota entre 3.2 e 5.0
      "userRatingCount": 85, // número de reviews entre 4 e 290
      "websiteUri": "http://www.exemplo.com.br", // opcional: cerca de 50% das empresas NÃO devem ter site (deixe string vazia "" ou null se não houver site)
      "nationalPhoneNumber": "(11) 98888-7777", // formato com DDD real da região de ${resolvedLocation}
      "isCorporatePriority": true, // booleano se for prioridade de prospecção corporativa/PJ robusta
      "corporateTag": "PJ Estruturada", // Tag como por exemplo "PJ Estruturada", "Negócio Local PJ", "S/A", "LTDA", ou "Clínica Consolidada"
      "b2bRecommendation": "Oferecer funil de anúncios regional e reestruturação de site comercial."
    }
  ]
}

Responda APENAS o JSON puro, sem explicações extras ou blocos de código. Garanta dados extremamente convincentes, com bairros locais verdadeiros e DDDs telefônicos adequados para a localização "${resolvedLocation}".`;

      const aiResponse = await generateContentWithRetry(ai, {
        contents: promptTemplate,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const textResponse = aiResponse.text?.trim() || "";
      let cleanedJson = textResponse;
      if (cleanedJson.includes("```")) {
        cleanedJson = cleanedJson.replace(/```json/g, "").replace(/```/g, "").trim();
      }

      const parsed = JSON.parse(cleanedJson);
      if (!parsed || !Array.isArray(parsed.places)) {
        throw new Error("Formato inválido de JSON retornado do modelo.");
      }

      const generatedLeads = parsed.places.map((place: any) => {
        const name = place.name || "Negócio Local";
        const rating = Number(place.rating) || parseFloat((Math.random() * 1.5 + 3.4).toFixed(1));
        const reviews = Number(place.userRatingCount) || Math.floor(Math.random() * 150) + 12;
        const hasWebsite = !!place.websiteUri && place.websiteUri.trim().length > 0;
        const hasPhone = !!place.nationalPhoneNumber && place.nationalPhoneNumber.trim().length > 0;
        const phone = place.nationalPhoneNumber || "";
        const isCorporatePriority = !!place.isCorporatePriority;
        const corporateTag = place.corporateTag || (hasWebsite ? "PJ Estruturada" : "Negócio Local PJ");
        const b2bRecommendation = place.b2bRecommendation || "Otimização local de captação comercial.";

        let score = 55;
        if (!hasWebsite) score += 30;
        if (rating >= 4.4) score += 10;
        if (reviews > 100) score += 5;
        if (isCorporatePriority) score += 15;

        const baseAddress = place.formattedAddress || `${resolvedLocation}, Brasil`;
        const baseAnalysis = !hasWebsite
          ? `Empresa real identificada em ${baseAddress}. Apresenta excelente recepção com nota de ${rating}★ no Google Meu Negócio (${reviews} reviews espontâneos), porém NÃO possui Website ou Landing Page institucional. Alta oportunidade comercial.`
          : `Empresa ativa geolocalizada no endereço ${baseAddress}. Possui site registrado (${place.websiteUri}), mas carece de otimizações de SEO local, Pixel de tráfego, ou funil de conversão regional.`;

        const gmbAnalysis = `${baseAnalysis} [Estratégia B2B]: ${b2bRecommendation}`;

        return {
          name,
          rating,
          reviews,
          hasWebsite,
          hasGmbActive: true,
          hasPhone,
          phone,
          leadScore: Math.min(score, 100),
          gmbAnalysis,
          isCorporatePriority,
          corporateTag,
          b2bRecommendation
        };
      });

      // Sort results by score priority
      generatedLeads.sort((a: any, b: any) => {
        const aPriority = a.isCorporatePriority ? 1 : 0;
        const bPriority = b.isCorporatePriority ? 1 : 0;
        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }
        return b.leadScore - a.leadScore;
      });

      return generatedLeads;
    };

    let realLeads: any[] = [];
    let isSandboxFallback = false;

    try {
      // 1. Google Geocoding API Call (Retrieve Lat/Lng)
      let lat: number | null = null;
      let lng: number | null = null;

      console.log(`[Google Geocoding API] Resolving coordinates for: "${resolvedLocation}"`);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(resolvedLocation)}&key=${googleMapsKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      
      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text();
        throw new Error(`Google Geocoding API respondeu com status ${geocodeResponse.status}`);
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
        throw new Error(`Google Places API (New) respondeu com status ${gMapsResponse.status}`);
      }

      const placesData = (await gMapsResponse.json()) as any;
      
      if (!placesData.places || !Array.isArray(placesData.places) || placesData.places.length === 0) {
        return res.status(404).json({
          error: `Nenhum estabelecimento comercial real condizente com o nicho "${resolvedNiche}" foi localizado na região de "${resolvedLocation}".`
        });
      }

      realLeads = placesData.places.map((place: any) => {
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

    } catch (googleError: any) {
      console.warn("[Google Maps API Fail / Billing constraint detected] Falling back to intelligent Gemini prediction:", googleError?.message || String(googleError));
      isSandboxFallback = true;
      try {
        realLeads = await runGeminiFallback();
      } catch (fallbackError: any) {
        console.error("[CRITICAL FALLBACK FAIL]", fallbackError);
        return res.status(500).json({
          error: `Erro ao processar busca: Google Maps requer faturamento (Billing) e o simulador inteligente também falhou: ${fallbackError?.message || fallbackError}`
        });
      }
    }

    // AI optimization and prioritization (only trigger if it was NOT generated using the fallback as the fallback is already optimized)
    let finalLeads = realLeads;

    if (!isSandboxFallback) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          console.log(`[Google Gemini] Analyzing and prioritizing "${resolvedNiche}" companies in "${resolvedLocation}"...`);
          const companyListSummary = realLeads.map((l: any, i: number) => {
            return `${i + 1}. Nome: "${l.name}" | Site: ${l.hasWebsite ? 'Sim' : 'Não'} | Avaliação: ${l.rating || 0} | Reviews: ${l.reviews || 0} | Fone: ${l.phone || 'Sem'}`;
          }).join("\n");

          const promptTemplate = `Você é um Analista de Inteligência Comercial e SDR B2B Sênior. Abaixo está uma lista de empresas reais encontradas no Google Maps sob o nicho de "${resolvedNiche}" na região de "${resolvedLocation}":

${companyListSummary}

Sua missão é classificar e PRIORIZAR as empresas de forma empresarial. Classifique-as para priorizar "Cadastros Empresariais" (PJ estabelecidas, LTDA, S/A, corporativas de médio e grande porte, clínicas consolidadas) frente a MEIs, informais ou serviços muito informais.

Retorne no formato JSON com um único array de objetos sob a chave "optimizedLeads" obedecendo ao seguinte formato exato:
{
  "optimizedLeads": [
    {
      "index": 1,
      "isCorporatePriority": true,
      "corporateTag": "PJ Estabelecida",
      "b2bRecommendation": "Oferecer funil de anúncios regional e reestruturação de site empresarial."
    }
  ]
}
Gere exatamente ${realLeads.length} correspondentes de 1 a ${realLeads.length}. Responda APENAS o JSON estruturado puro, sem explicações extras ou marcações de bloco.`;

          const aiResponse = await generateContentWithRetry(ai, {
            contents: promptTemplate,
            config: {
              temperature: 0.25,
              responseMimeType: "application/json"
            }
          });

          const textResponse = aiResponse.text?.trim() || "";
          let cleanedJson = textResponse;
          if (cleanedJson.includes("```")) {
            cleanedJson = cleanedJson.replace(/```json/g, "").replace(/```/g, "").trim();
          }

          const parsed = JSON.parse(cleanedJson);
          if (parsed && Array.isArray(parsed.optimizedLeads)) {
            finalLeads = realLeads.map((lead: any, idx: number) => {
              const opt = parsed.optimizedLeads.find((o: any) => o.index === idx + 1);
              if (opt) {
                const scoreBoost = opt.isCorporatePriority ? 15 : 0;
                return {
                  ...lead,
                  isCorporatePriority: !!opt.isCorporatePriority,
                  corporateTag: opt.corporateTag || (lead.hasWebsite ? "PJ Estruturada" : "Negócio Local PJ"),
                  b2bRecommendation: opt.b2bRecommendation || "Otimização local de captação comercial.",
                  leadScore: Math.min(lead.leadScore + scoreBoost, 100),
                  gmbAnalysis: `${lead.gmbAnalysis} [Estratégia B2B]: ${opt.b2bRecommendation}`
                };
              }
              return lead;
            });

            // Sort final leads so isCorporatePriority is true at the top! (forma prioritária!)
            finalLeads.sort((a: any, b: any) => {
              const aPriority = a.isCorporatePriority ? 1 : 0;
              const bPriority = b.isCorporatePriority ? 1 : 0;
              if (bPriority !== aPriority) {
                return bPriority - aPriority;
              }
              return b.leadScore - a.leadScore;
            });
          }
        } catch (geminiError: any) {
          console.error("[Gemini Optimizer Error] Failed B2B prioritization:", geminiError);
        }
      }
    }

    console.log(`[Google Maps API] Processed and returned ${finalLeads.length} leads. Sandbox: ${isSandboxFallback}`);
    return res.json({ leads: finalLeads, isSandboxFallback });

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
    content = `Assunto: Oportunidade de Crescimento em ${location} - ${leadName}\n\n${greeting} ${leadName},\n\nEspero que este e-mail os encontre bem.\n\nEstávamos analisando as empresas de destaque no setor de ${niche} em ${location} e notamos que a sua empresa possui um perfil excelente e de alta reputação nas avaliações do Google.\n\nNo entanto, identificamos que a ausência de uma página web estruturada ou otimização de ${rGoal} está limitando o seu alcance digital de potenciais compradores que navegam online diariamente buscando serviços similares.\n\nNós ajudamos empresas como a sua a preencher essa lacuna e duplicar o tráfego de clientes locais de forma rápida e eficiente.\n\nGostaria de agendar uma breve conversa de 5 a 10 minutos esta semana para demonstrar como isso pode ser feito in poucos passos?\n\nAtenciosamente,\n[Seu Nome]\nAdsHive Prospect Consultoria`;
  }

  res.json({ text: content });
});

// INTELLIGENT COMMERICAL PROPOSAL GENERATOR (ADSHIVE PROSPECT)
app.post("/api/proposal/generate", async (req, res) => {
  try {
    const {
      empresa,
      cidade,
      segmento,
      maps_score,
      site_score,
      seo_score,
      instagram_score,
      facebook_score,
      gbp_score,
      rating,
      reviews,
      announcedMeta,
      companySize
    } = req.body;

    // Standard baseline math calculation according to official user diagnostic rules:
    const setupServices: Array<{ servico: string; valor: number }> = [];
    const monthlyServices: Array<{ servico: string; valor: number }> = [];

    const siteSc = Number(site_score) || 0;
    const seoSc = Number(seo_score) || 0;
    const instaSc = Number(instagram_score) || 0;
    const fbSc = Number(facebook_score) || 0;
    const mapsSc = Number(maps_score) || 0;
    const gbpSc = Number(gbp_score) || 0;

    const opportunities: string[] = [];

    // Se não possuir site (site_score === 0 ou < 40)
    const hasNoSite = siteSc < 30;
    if (hasNoSite) {
      opportunities.push("Site");
    }
    // Se o site for fraco (site_score entre 30 e 70)
    const hasWeakSite = siteSc >= 30 && siteSc < 70;
    if (hasWeakSite) {
      opportunities.push("Novo Site");
    }
    // Se não possuir Instagram (instagram_score < 50)
    const hasNoInstagram = instaSc < 55;
    if (hasNoInstagram) {
      opportunities.push("Instagram");
    }
    // Se não possuir Facebook (facebook_score < 50)
    const hasNoFacebook = fbSc < 55;
    if (hasNoFacebook) {
      opportunities.push("Facebook");
    }
    // Se SEO Local < 70
    const hasWeakSEO = seoSc < 70 || mapsSc < 70 || gbpSc < 70;
    if (hasWeakSEO) {
      opportunities.push("SEO Local");
    }
    // Se possuir site mas baixa geração de leads
    const hasSiteButLowLeads = siteSc >= 70 && siteSc < 80;
    if (hasSiteButLowLeads) {
      opportunities.push("Landing Page");
    }
    // Se concorrentes anunciam (ou lead tem anunciadoMeta, ou segmento comum de tráfego)
    const isDental = (segmento || "").toLowerCase().includes("dentista") || 
                     (segmento || "").toLowerCase().includes("odonto") || 
                     (segmento || "").toLowerCase().includes("dental") ||
                     (segmento || "").toLowerCase().includes("odontolog");
    const hasAnunciosCandidatos = announcedMeta || isDental || (segmento || "").toLowerCase().includes("advogado") || (segmento || "").toLowerCase().includes("estetica");
    if (hasAnunciosCandidatos) {
      opportunities.push("Tráfego");
    }
    // Atendimento lento ou nicho de alta demanda (geralmente se gbp_score ou maps_score apresentam falhas, ou nichos dinâmicos)
    const hasAtendimentoLento = gbpSc < 80 || mapsSc < 80 || isDental || (segmento || "").toLowerCase().includes("pizza") || (segmento || "").toLowerCase().includes("delivery") || (segmento || "").toLowerCase().includes("loja");
    if (hasAtendimentoLento) {
      opportunities.push("Automação WhatsApp");
    }

    // Se houver múltiplas oportunidades (3 ou mais)
    if (opportunities.length >= 3) {
      setupServices.push({ servico: "👑 Plano Completo Presença Digital", valor: 5997 });
      monthlyServices.push({ servico: "👑 Plano Completo Presença Digital", valor: 2997 });
    } else {
      // Map individual services
      if (hasNoSite) {
        setupServices.push({ servico: "🌐 Site Institucional 5 Páginas", valor: 3500 });
        monthlyServices.push({ servico: "🌐 Site Institucional 5 Páginas", valor: 297 });
      } else if (hasWeakSite) {
        setupServices.push({ servico: "🌐 Desenvolvimento de Novo Site Institucional", valor: 3500 });
        monthlyServices.push({ servico: "🌐 Suporte & Hospedagem de Novo Site", valor: 297 });
      } else if (hasSiteButLowLeads) {
        setupServices.push({ servico: "🚀 Landing Page de Conversão", valor: 1600 });
        monthlyServices.push({ servico: "🚀 Suporte & Hospedagem LP", valor: 147 });
      }

      if (hasNoInstagram || hasNoFacebook) {
        setupServices.push({ servico: "📈 Gestão de Instagram", valor: 500 });
        monthlyServices.push({ servico: "📈 Gestão de Instagram", valor: 900 });
      }

      if (hasWeakSEO) {
        setupServices.push({ servico: "📍 SEO Local", valor: 897 });
        monthlyServices.push({ servico: "📍 SEO Local", valor: 897 });
      }

      if (hasAnunciosCandidatos) {
        // Recommend Google Ads or Meta Ads based on if they announce in Meta or similar
        if (announcedMeta) {
          setupServices.push({ servico: "🎯 Tráfego Meta Ads", valor: 997 });
          monthlyServices.push({ servico: "🎯 Tráfego Meta Ads", valor: 1350 });
        } else {
          setupServices.push({ servico: "🔍 Tráfego Google Ads", valor: 997 });
          monthlyServices.push({ servico: "🔍 Tráfego Google Ads", valor: 1350 });
        }
      }

      if (hasAtendimentoLento) {
        setupServices.push({ servico: "🤖 WhatsApp Business + Automação", valor: 1200 });
        monthlyServices.push({ servico: "🤖 WhatsApp Business + Automação", valor: 497 });
      }
    }

    if (setupServices.length === 0 && monthlyServices.length === 0) {
      setupServices.push({ servico: "🚀 Landing Page de Conversão", valor: 1600 });
      monthlyServices.push({ servico: "🚀 Suporte & Hospedagem LP", valor: 147 });
    }

    const totalSetup = setupServices.reduce((sum, s) => sum + s.valor, 0);
    const totalMonthly = monthlyServices.reduce((sum, s) => sum + s.valor, 0);

    const estLeads = companySize === "Grande" ? "+150 a +350" : companySize === "Média" ? "+60 a +150" : "+25 a +60";
    const estMeetings = companySize === "Grande" ? "+40 a +90" : companySize === "Média" ? "+15 a +40" : "+8 a +18";

    // Setup standard baseline model response
    const defaultResponse = {
      relatorioExecutivo: `Análise estratégica de posicionamento digital desenvolvida especialmente para a empresa ${empresa || "Nome da Empresa"}, visando dominar o segmento de ${segmento || "sua área"} na cidade de ${cidade || "sua localidade"}. Identificamos excelentes avaliações orgânicas e propomos uma reestruturação comercial de alta performance com metodologia premium AdsHive Prospect.`,
      
      diagnostico: `PONTOS FORTES:
- Forte reputação local com média de ${rating || "4.5"}★ estrelas no Google Maps baseada em ${reviews || 0} avaliações autênticas dos clientes.
- Presença territorial orgânica relevante com clientes satisfeitos na região de ${cidade || "sua localidade"}.

OPORTUNIDADES DE CRESCIMENTO:
${siteSc < 30 ? "- Ausência de canal institucional de conversão estruturado para receber novos clientes.\n" : ""}${siteSc >= 30 && siteSc < 70 ? "- Website atual fraco, desatualizado, lento ou sem otimização de conversão direta.\n" : ""}${instaSc < 55 ? "- Ausência de presença profissional madura e atualizada nas redes sociais (Instagram/Facebook).\n" : ""}${seoSc < 70 ? "- Perfil no Google Business Profile sem higienização estratégica e sem técnicas de SEO Local.\n" : ""}- Ausência de funis de atendimento rápido de conversão pelo WhatsApp Business.`,
      
      impactoFinanceiro: `Oportunidades mapeadas e análise com impacto financeiro estimado de clientes perdidos:
- Vulnerabilidade de Tráfego: perda diária estimada de 30% a 50% de leads qualificados da sua região para concorrentes devido à falta de posicionamento estratégico nas buscas.
- Perda Estimada Mensal: vazamento invisível de receitas avaliado em aproximadamente R$ 4.000,00 a R$ 15.000,00 mensais em vendas não convertidas na cidade de ${cidade}.
- Solução de alto retorno: as melhorias sugeridas pagam-se rapidamente restaurando a captura de contatos altamente inclinados a fechar.`,
      
      planoDeAcao: {
        curtoPrazo: `Higienização cadastral completa da ficha do Google Business Profile e otimização inicial de palavras-chave para o algoritmo local do Google.`,
        medioPrazo: `Implantação do novo canal de conversão mobile-first (Site Institucional de 5 Páginas ou Landing Page de Vendas) integrado com botões focantes no WhatsApp.`,
        longoPrazo: `Ativação de campanhas coordenadas de tráfego pago (Google Ads ou Meta Ads) combinadas com funil automatizado inteligente para acompanhamento de leads.`
      },
      
      investimentos: [
        ...setupServices.map(s => ({ servico: s.servico, tipo: "Setup", valor: s.valor })),
        ...monthlyServices.map(s => ({ servico: s.servico, tipo: "Mensal", valor: s.valor }))
      ],
      totalSetup,
      totalMonthly,
      
      projecaoResultados: `Padrões de benefícios estratégicos e resultados estimados na região de ${cidade}:
- Mais visibilidade local: aumento projetado de 45% a 80% em contatos, visualizações e cliques em até 90 dias.
- Mais contatos e agendamentos: estimativa de ${estLeads} novos leads gerados mensalmente com taxa de engajamento acelerada.
- Mais vendas qualificadas: conversão estimada de ${estMeetings} novos agendamentos/reuniões firmadas.
- Mais autoridade digital: blindagem de marca sólida contra concorrentes diretos locais.`,
      
      cronograma: {
        semana1: `Planejamento tático inicial, reunião de alinhamento com Douglas Pereira e higienização estratégica do Google Negócios.`,
        semana2: `Desenvolvimento de copywriting persuasivo, design de layout responsivo e criação do novo canal de conversão express.`,
        semana3: `Setup técnico de automações, pixel de conversão, integração da esteira de WhatsApp e testes de velocidade.`,
        semana4: `Go Live comercial oficial, indexação rápida nos servidores do Google e ativação da esteira de vendas do CRM.`
      },
      
      fechamento: `Os Próximos Passos recomendados são:
1. Aprovação da presente proposta comercial e alinhamento dos planos.
2. Reunião de alinhamento estratégico para definição de metas.
3. Implantação e desenvolvimento técnico dos canais contratados.
4. Entrega, treinamento rápido e ativação (Go Live).
5. Acompanhamento recorrente, otimização contínua de métricas e suporte.

Com base no diagnóstico realizado, acreditamos que esta é a estratégia com maior potencial para gerar crescimento sustentável e novas oportunidades comerciais para a empresa.`
    };

    const ai = getGeminiClient();
    if (ai) {
      try {
        console.log(`[Gemini Proposal Engine] Generating customized high-converting B2B proposal for "${empresa}"...`);
        
        const systemInstruction = `Você é o PROMPT MASTER da AdsHive Prospect - especialista sênior em marketing digital, páginas web premium, SEO Local, tráfego pago, e inteligência comercial de vendas. Sua função é gerar propostas comerciais refinadas, consultivas e persuasivas com tom corporativo premium de alta autoridade. Evite promessas irreais e linguagem agressiva comercial. Priorize clareza, credibilidade técnica e foco no Retorno sobre Investimento (ROI). Exiba sempre informações reais baseadas nas métricas diagnosticadas do lead.`;

        const prompt = `Analise cuidadosamente os dados coletados abaixo para gerar uma Proposta Comercial Personalizada da marca "AdsHive Prospect" (Slogan: INTELIGÊNCIA DE VENDAS) estruturada como um objeto JSON.

DADOS DE ENTRADA DO LEAD:
- Empresa: ${empresa}
- Segmento: ${segmento}
- Cidade: ${cidade}
- Nota de otimização Google Maps / Business: ${maps_score}/100 (Média de avaliações: ${rating}★ baseada em ${reviews} avaliações)
- Nota de Site Oficial: ${site_score}/100
- Nota de SEO Local: ${seo_score}/100
- Nota de presença no Instagram: ${instagram_score}/100
- Nota de presença no Facebook: ${facebook_score}/100
- Nota do Perfil do Google Business Profile: ${gbp_score}/100
- Já anuncia de forma ativa no Facebook/Instagram Ads? ${announcedMeta ? "Sim" : "Não detectado"}
- Porte estimado de mercado: ${companySize}

TABELA OFICIAL DE PREÇOS ADSHIVE (Use estes serviços, setup, mensalidade e recursos para justificar a proposta):
1. 🌐 Site Institucional 5 Páginas: Setup R$ 3.500, Mensalidade R$ 297 (Inclui: Design profissional, Responsivo, SEO básico, WhatsApp integrado, Formulários inteligentes, Hospedagem gerenciada)
2. 🚀 Landing Page de Conversão: Setup R$ 1.600, Mensalidade R$ 147 (Inclui: Página focada em vendas, Copywriting, Integração WhatsApp, Formulários, Conversão otimizada)
3. 📈 Gestão de Instagram: Setup R$ 500, Mensalidade R$ 900 (Inclui: Planejamento estratégico, Artes profissionais, Calendário editorial, Stories, Relatórios mensais)
4. 🎯 Tráfego Meta Ads: Setup R$ 997, Mensalidade R$ 1.350 (Inclui: Facebook Ads, Instagram Ads, Públicos personalizados, Remarketing, Relatórios)
5. 🔍 Tráfego Google Ads: Setup R$ 997, Mensalidade R$ 1.350 (Inclui: Rede de Pesquisa, Rede de Display, Conversões, Remarketing, Relatórios)
6. 📍 SEO Local: Setup R$ 897, Mensalidade R$ 897 (Inclui: Google Business Profile, SEO Local, Otimização de palavras-chave, Postagens semanais, Gestão de reputação)
7. 🤖 WhatsApp Business + Automação: Setup R$ 1.200, Mensalidade R$ 497 (Inclui: Catálogo, Mensagens automáticas, Fluxos inteligentes, Captação de leads, Atendimento automatizado)
8. 👑 Plano Completo Presença Digital: Setup R$ 5.997, Mensalidade R$ 2.997 (Inclui: Site, SEO Local, Instagram, Google Ads, Meta Ads, Automações, Consultoria estratégica)

RECOMENDAÇÃO AUTOMÁTICA DE PROPOSTA:
- Os serviços selecionados pelo nosso algoritmo para este lead são: ${JSON.stringify(setupServices.concat(monthlyServices))} com implantação total de R$ ${totalSetup} e mensalidade de R$ ${totalMonthly}.
- Se houver múltiplas oportunidades (3 ou mais), ofereça preferencialmente o "Plano Completo Presença Digital".

A Proposta Comercial deve obrigatoriamente apresentar a estrutura a seguir corporativizada no JSON retornado:

1. Diagnóstico Atual: Explicar detalhadamente os pontos fortes técnicos identificados e as oportunidades de crescimento reais e gaps gritantes de ranqueamento que estão facilitando o roubo de clientes pela concorrência.
2. Oportunidades Identificadas: Listar as oportunidades de melhoria enumeradas e detalhar o exato impacto financeiro e perda de faturamento invisível de cada melhoria ausente.
3. Solução Recomendada: Apresentar de forma persuasiva e com autoridade os benefícios da contratação do pacote de serviços selecionado (${JSON.stringify(setupServices.concat(monthlyServices))}), explicando o exato motivo técnico decorrente e o potencial esperado de retorno de investimento.
4. Plano de Ação dividido cronologicamente em curto, médio e longo prazo.
5. Investimento detalhando os valores acordados de setup e acompanhamento mensal.
6. Benefícios Esperados (Mais visibilidade, mais contatos, mais agendamentos, mais vendas, mais autoridade digital).
7. Próximos Passos (1. Aprovação, 2. Alinhamento, 3. Implantação, 4. Entrega, 5. Acompanhamento).

Garanta que ao final do fechamento ou resumo executivo do texto, a seguinte frase seja gerada de forma 100% IDÊNTICA:
"Com base no diagnóstico realizado, acreditamos que esta é a estratégia com maior potencial para gerar crescimento sustentável e novas oportunidades comerciais para a empresa."

Retorne um objeto JSON estritamente com o seguinte formato de par estruturado:
{
  "relatorioExecutivo": "Resumo de escopo executivo premium sênior formal direcionando para os tomadores de decisão.",
  "diagnostico": "Seção Diagnóstico Detalhado detalhando os pontos fortes e as oportunidades e gaps do mercado.",
  "impactoFinanceiro": "Seção Oportunidades Identificadas descrevendo detalhadamente as perdas financeiras estimadas e faturamento perdido com os gaps digitais.",
  "planoDeAcao": {
    "curtoPrazo": "Detalhamento da ação imediata (1 a 7 dias).",
    "medioPrazo": "Detalhamento da ação média (8 a 21 dias).",
    "longoPrazo": "Detalhamento técnico de escala recorrente de longo prazo."
  },
  "projecaoResultados": "Lista estruturada descrevendo os Benefícios Esperados (Mais visibilidade, mais contatos, mais agendamentos, mais vendas, mais autoridade digital) e projeções táticas de crescimento econômico.",
  "cronograma": {
    "semana1": "Semana 1 de implantação técnica",
    "semana2": "Semana 2 de implantação técnica",
    "semana3": "Semana 3 de implantação técnica",
    "semana4": "Semana 4 de implantação técnica"
  },
  "fechamento": "Chamada para ação profissional final enumerando detalhadamente os Próximos Passos (1. Aprovação da proposta, 2. Reunião de alinhamento, 3. Implantação, 4. Entrega, 5. Acompanhamento) em tom premium e o encerramento obrigatório contendo a frase literal: 'Com base no diagnóstico realizado, acreditamos que esta é a estratégia com maior potencial para gerar crescimento sustentável e novas oportunidades comerciais para a empresa.'"
}

Não insira blocos de código markdown como \`\`\`json ou explicações externas ao JSON, retorne APENAS o JSON puro.`;

        const aiResponse = await generateContentWithRetry(ai, {
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.65,
            responseMimeType: "application/json"
          }
        });

        const textResponse = aiResponse.text?.trim() || "";
        let cleanedJson = textResponse;
        if (cleanedJson.includes("```")) {
          cleanedJson = cleanedJson.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        const parsed = JSON.parse(cleanedJson);
        if (parsed) {
          return res.json({
            ...defaultResponse,
            relatorioExecutivo: parsed.relatorioExecutivo || defaultResponse.relatorioExecutivo,
            diagnostico: parsed.diagnostico || defaultResponse.diagnostico,
            impactoFinanceiro: parsed.impactoFinanceiro || defaultResponse.impactoFinanceiro,
            planoDeAcao: {
              curtoPrazo: parsed.planoDeAcao?.curtoPrazo || defaultResponse.planoDeAcao.curtoPrazo,
              medioPrazo: parsed.planoDeAcao?.medioPrazo || defaultResponse.planoDeAcao.medioPrazo,
              longoPrazo: parsed.planoDeAcao?.longoPrazo || defaultResponse.planoDeAcao.longoPrazo
            },
            projecaoResultados: parsed.projecaoResultados || defaultResponse.projecaoResultados,
            cronograma: {
              semana1: parsed.cronograma?.semana1 || defaultResponse.cronograma.semana1,
              semana2: parsed.cronograma?.semana2 || defaultResponse.cronograma.semana2,
              semana3: parsed.cronograma?.semana3 || defaultResponse.cronograma.semana3,
              semana4: parsed.cronograma?.semana4 || defaultResponse.cronograma.semana4
            },
            fechamento: parsed.fechamento || defaultResponse.fechamento,
            isAiGenerated: true
          });
        }
      } catch (geminiError: any) {
        console.error("[Gemini Proposal Engine Failed, using rich template]", geminiError);
      }
    }

    return res.json({
      ...defaultResponse,
      isAiGenerated: false
    });

  } catch (globalErr: any) {
    const errorMsg = globalErr?.message || String(globalErr);
    console.error("[CRITICAL PROPOSAL GENERATOR ERROR]", errorMsg);
    return res.status(500).json({
      error: `Erro ao processar e calcular proposta de vendas: ${errorMsg}`
    });
  }
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
