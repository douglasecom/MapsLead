/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  Sparkles,
  Settings,
  Flame,
  Plus,
  Minus,
  MessageSquare,
  Copy,
  RotateCcw,
  Edit,
  Trash2,
  Coins,
  Filter,
  Users2,
  Activity,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Phone,
  MapPin,
  Star,
  Globe,
  DollarSign,
  Briefcase,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Sparkle,
  Bookmark,
  Share2,
  FileText,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { initialLeads } from "./initialData";
import { Lead, GeneratedMessage, UserSession } from "./types";
import { generateLeadWebsiteAnalysis } from "./utils/stitchHelper";
import { getApiUrl, logResponseDebug } from "./utils/api";
import { AuthGate } from "./components/AuthGate";
import { LandingPage } from "./components/LandingPage";
import { KanbanCRM } from "./components/KanbanCRM";
import { RadarDigital } from "./components/RadarDigital";
import { ComercialDash } from "./components/ComercialDash";
import { AgendaComercial } from "./components/AgendaComercial";
import { PublicBooking } from "./components/PublicBooking";
import { CopilotoIA } from "./components/CopilotoIA";
import { DocumentGenerator } from "./components/DocumentGenerator";
import { LojaCreditos } from "./components/LojaCreditos";
import { Financeiro } from "./components/Financeiro";
import { AdminCredits } from "./components/AdminCredits";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { SystemHealthDashboard } from "./components/SystemHealthDashboard";
import { collection, getDocs, setDoc, deleteDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  // Authentication & session context
  const [session, setSession] = useState<UserSession | null>(null);

  // Theme states & appearance choice
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  const [appearanceChoice, setAppearanceChoice] = useState<"dark" | "light" | "system">(() => {
    const saved = localStorage.getItem("appearance_choice");
    return (saved === "light" || saved === "dark" || saved === "system") ? saved : "dark";
  });

  // Track system preference or choice updates
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    document.body.classList.remove("theme-light", "theme-dark");

    let resolvedTheme: "dark" | "light" = themeMode;
    if (appearanceChoice === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      resolvedTheme = prefersDark ? "dark" : "light";
    }

    if (resolvedTheme === "light") {
      root.classList.add("theme-light");
      document.body.classList.add("theme-light");
      root.style.backgroundColor = "#F8F9FC";
      document.body.style.backgroundColor = "#F8F9FC";
    } else {
      root.classList.add("theme-dark");
      document.body.classList.add("theme-dark");
      root.style.backgroundColor = "#0B0B0F";
      document.body.style.backgroundColor = "#0B0B0F";
    }
  }, [themeMode, appearanceChoice]);

  const handleAppearanceChange = (choice: "dark" | "light" | "system") => {
    setAppearanceChoice(choice);
    localStorage.setItem("appearance_choice", choice);
    if (choice === "dark") {
      setThemeMode("dark");
      localStorage.setItem("theme", "dark");
    } else if (choice === "light") {
      setThemeMode("light");
      localStorage.setItem("theme", "light");
    } else {
      // System mode
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeMode(prefersDark ? "dark" : "light");
      localStorage.removeItem("theme");
    }
  };

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<"inicio" | "pesquisa" | "leads" | "oportunidades" | "ai_gerador" | "admin" | "crm" | "radar" | "comercial" | "loja_creditos" | "financeiro" | "dashboard-owner" | "agenda" | "system-health">("inicio");

  // Public Booking State for Calendly Integrado
  const [isPublicCalendly, setIsPublicCalendly] = useState(false);
  const [calendlyUserSlug, setCalendlyUserSlug] = useState<string>("");

  useEffect(() => {
    const handleHashAndPath = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.startsWith("#/agendar/") || path.startsWith("/agendar/")) {
        const slug = hash.startsWith("#/agendar/") 
          ? hash.substring(10) 
          : path.substring(9);
        setIsPublicCalendly(true);
        setCalendlyUserSlug(slug);
      } else if (hash === "#agendar-reuniao") {
        setIsPublicCalendly(true);
        setCalendlyUserSlug("leads-sem-site");
      } else if (hash.startsWith("#") && hash.length > 2) {
        const slug = hash.substring(1);
        const landingPageSections = [
          "como-funciona", 
          "diferenciais", 
          "leads-sem-site", 
          "prints-da-plataforma", 
          "calendly-integrado", 
          "comparativo-planos", 
          "perguntas-frequentes", 
          "agenda-e-reunioes"
        ];
        if (!landingPageSections.includes(slug) && !["inicio", "leads", "pesquisa", "agenda", "crm", "comercial", "radar", "admin", "oportunidades", "financeiro", "ai_gerador"].includes(slug)) {
          setIsPublicCalendly(true);
          setCalendlyUserSlug(slug);
        } else {
          setIsPublicCalendly(false);
        }
      } else {
        setIsPublicCalendly(false);
      }
    };
    handleHashAndPath();
    window.addEventListener("hashchange", handleHashAndPath);
    return () => window.removeEventListener("hashchange", handleHashAndPath);
  }, []);

  // Routing/Viewing state for unauthenticated users
  const [unauthView, setUnauthView] = useState<"landing" | "login" | "register">("landing");

  // Sidebar tab active style mapping
  const getSidebarBtnClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    if (isActive) {
      return themeMode === "light"
        ? "bg-purple-50 text-[#8B2EFF] border-l-4 border-[#8B2EFF] font-black"
        : "bg-[#1C1C26] text-[#8B2EFF] border-l-4 border-[#8B2EFF] font-black shadow-inner";
    } else {
      return themeMode === "light"
        ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        : "text-[#B0B3C1] hover:bg-[#1C1C26] hover:text-white";
    }
  };

  // Route listening effect for direct link URL checks and state synchronization
  const tabToPathMap: Record<string, string> = {
    inicio: "/dashboard",
    pesquisa: "/pesquisa-maps",
    leads: "/gestao-de-leads",
    oportunidades: "/oportunidades",
    ai_gerador: "/copiloto-ia",
    agenda: "/agenda-comercial",
    crm: "/crm-kanban",
    radar: "/radar",
    comercial: "/comercial",
    loja_creditos: "/loja-creditos",
    financeiro: "/financeiro",
    "dashboard-owner": "/dashboard-owner",
    "system-health": "/owner/system-health",
    admin: "/admin"
  };

  const pathToTabMap: Record<string, any> = {
    "/dashboard": "inicio",
    "/dasboard": "inicio",
    "/pesquisa-maps": "pesquisa",
    "/gestao-de-leads": "leads",
    "/oportunidades": "oportunidades",
    "/copiloto-ia": "ai_gerador",
    "/agenda-comercial": "agenda",
    "/crm-kanban": "crm",
    "/radar": "radar",
    "/comercial": "comercial",
    "/loja-creditos": "loja_creditos",
    "/financeiro": "financeiro",
    "/dashboard-owner": "dashboard-owner",
    "/owner/system-health": "system-health",
    "/admin": "admin"
  };

  useEffect(() => {
    const handleLocationRouting = () => {
      const pName = window.location.pathname;
      if (!session) {
        if (pName === "/register") {
          setUnauthView("register");
        } else if (pName === "/login") {
          setUnauthView("login");
        } else {
          setUnauthView("landing");
        }
      } else {
        // Authenticated routing
        if (pName === "/owner" || pName === "/admin" || pName === "/dashboard-owner" || pName === "/owner/system-health") {
          if (session.email?.toLowerCase() === "douglasbateriacma@gmail.com") {
            if (pName === "/owner/system-health") {
              setActiveTab("system-health");
            } else {
              setActiveTab("dashboard-owner");
            }
          } else {
            triggerNotification("Acesso negado: essa rota administrativa é exclusiva para o Owner.", "warning");
            setActiveTab("inicio");
            window.history.replaceState({}, "", "/dashboard");
          }
        } else if (pathToTabMap[pName]) {
          setActiveTab(pathToTabMap[pName]);
        } else if (pName === "/" || pName === "" || pName === "/login" || pName === "/register" || pName === "/landing") {
          setActiveTab("inicio");
          window.history.replaceState({}, "", "/dashboard");
        }
      }
    };
    handleLocationRouting();

    window.addEventListener("popstate", handleLocationRouting);
    return () => {
      window.removeEventListener("popstate", handleLocationRouting);
    };
  }, [session]);

  // Keep URL in sync with activeTab when logged in
  useEffect(() => {
    if (session) {
      const currentPath = window.location.pathname;
      const expectedPath = tabToPathMap[activeTab];
      if (expectedPath && currentPath !== expectedPath) {
        window.history.pushState({}, "", expectedPath);
      }
    }
  }, [activeTab, session]);
  
  // Real-time State Lists
  const [leads, setLeads] = useState<Lead[]>([]);

  // Active Manager Config (Admin Dashboard)
  const [managerName, setManagerName] = useState<string>(() => localStorage.getItem("manager_name") || "Douglas CMA");
  const [managerRole, setManagerRole] = useState<string>(() => localStorage.getItem("manager_role") || "Vendedor Sênior");
  const [managerBusiness, setManagerBusiness] = useState<string>(() => localStorage.getItem("manager_company") || "AdsHive Prospect Pro");
  const [managerPhone, setManagerPhone] = useState<string>(() => localStorage.getItem("manager_phone") || "+55 (11) 99876-5432");
  const [managerEmail, setManagerEmail] = useState<string>(() => localStorage.getItem("manager_email") || "douglasbateriacma@gmail.com");
  const [managerSignature, setManagerSignature] = useState<string>(() => localStorage.getItem("manager_signature") || "Douglas - CEO na AdsHive Prospect Consultoria");

  // Pipeline funnel stage counters calculated dynamically
  const countNovo = leads.filter(l => l.status === "novo" || l.status === "contatado").length;
  const countInteressado = leads.filter(l => l.status === "interessado" || l.status === "reuniao" || l.status === "proposta").length;
  const countNegociacao = leads.filter(l => l.status === "negociacao").length;
  const countAntigo = leads.filter(l => l.status === "fechado").length;
  const [credits, setCredits] = useState<number>(1240);
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: "success" | "warning" | "info" }>>([]);
  
  // Google Maps credential config state
  const [mapsConfig, setMapsConfig] = useState<{ hasKey: boolean; key: string }>({ hasKey: false, key: "" });

  useEffect(() => {
    fetch(getApiUrl("/api/config/maps"))
      .then(async res => {
        await logResponseDebug(res);
        if (!res.ok) {
          throw new Error(`Google Maps API server response status not OK: ${res.status}`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Local server initialized with non-JSON format (Vite proxy fallback).");
        }
        return res.json();
      })
      .then(data => {
        if (data && data.hasKey) {
          setMapsConfig(data);
        }
      })
      .catch(err => {
        console.warn("[GOOGLE MAPS CONFIG SANITIZATION DEBUG - BENIGN ON STARTUP]", err.message);
      });
  }, []);
  
  // Freemium pricing blocker configurations
  const [showPremiumBlockerModal, setShowPremiumBlockerModal] = useState<boolean>(false);
  const [adminSubTab, setAdminSubTab] = useState<"perfil" | "creditos">("perfil");

  // Premium feature validator for the FREE/Gratuito plan users
  const isFeaturePremiumRestricted = (featureName: string): boolean => {
    if (session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com') {
      return false; // Unlimited Developer bypass
    }
    const planName = session?.plan || 'Gratuito';
    const isFree = planName.toLowerCase() === 'gratuito' || planName.toLowerCase() === 'free';
    if (isFree) {
      triggerNotification(`O recurso "${featureName}" faz parte dos planos de assinatura paga. Faça seu upgrade!`, "warning");
      setShowPremiumBlockerModal(true);
      return true;
    }
    return false;
  };

  // Centralized Credit Consumption Logic with priority deduction
  const handleCentralConsumeCredit = async (action: 'capture' | 'ai_analysis'): Promise<boolean> => {
    if (!session) {
      triggerNotification("Faça login para continuar.", "warning");
      return false;
    }

    if (session.email?.toLowerCase() === 'douglasbateriacma@gmail.com') {
      // Developer bypass: no credit verification or subtraction
      return true;
    }

    // Load fresh data first to prevent race updates
    const userRef = doc(db, "users", session.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      triggerNotification("Usuário não encontrado na base de dados.", "warning");
      return false;
    }

    const userData = userSnap.data();
    if (userData.email?.toLowerCase() === 'douglasbateriacma@gmail.com') {
      return true;
    }
    let pCredits = userData.planCredits !== undefined ? userData.planCredits : (userData.credits || 0);
    let purCredits = userData.purchasedCredits || 0;
    let bCredits = userData.bonusCredits || 0;
    let remCredits = userData.remainingCredits !== undefined ? userData.remainingCredits : (pCredits + purCredits + bCredits);

    if (remCredits <= 0) {
      setShowPremiumBlockerModal(true);
      triggerNotification("Seu plano está suspenso ou sem créditos recomendados. Recarregue agora.", "warning");
      return false;
    }

    // Deduct total by 1
    remCredits = Math.max(0, remCredits - 1);

    // Deduct priority pools (1st: plan, 2nd: purchased, 3rd: bonus)
    if (pCredits > 0) {
      pCredits--;
    } else if (purCredits > 0) {
      purCredits--;
    } else if (bCredits > 0) {
      bCredits--;
    } else {
      // Security fallback
      triggerNotification("Erro: Sem créditos disponíveis no momento.", "warning");
      return false;
    }

    // Log gamified feedback milestones (at 50%, 80%, & 100% of the Free credits allocation of 10)
    const isFreePlan = (session.plan || "Gratuito").toLowerCase() === 'gratuito' || (session.plan || "Gratuito").toLowerCase() === 'free';
    if (isFreePlan) {
      const initialPool = 10;
      const consumed = initialPool - pCredits;
      if (consumed === 5) {
        triggerNotification("💡 Você consumiu 50% dos seus créditos de teste gratuito do AdsHive Prospect!", "info");
      } else if (consumed === 8) {
        triggerNotification("⚠️ Atenção: Você atingiu 80% do seu limite gratuito mensal! Considere reabastecer créditos avulsos ou assinar.", "warning");
      } else if (consumed === 10) {
        triggerNotification("🚫 Alerta 100%: Você atingiu o limite máximo de prospecção do Plano Gratuito. Adquira mais créditos!", "warning");
      }
    }

    // Update in database
    await setDoc(userRef, {
      planCredits: pCredits,
      purchasedCredits: purCredits,
      bonusCredits: bCredits,
      remainingCredits: remCredits,
      credits: remCredits, // Keep old parameter in sync
      accountStatus: remCredits <= 0 ? 'LIMITED' : 'ACTIVE'
    }, { merge: true });

    return true;
  };
  
  // Lead Search state
  const [searchNiche, setSearchNiche] = useState<string>("Padaria");
  const [searchLocation, setSearchLocation] = useState<string>("São Paulo, SP");
  const [quantity, setQuantity] = useState<number>(50);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchedYet, setSearchedYet] = useState<boolean>(false);
  const [selectedMapPin, setSelectedMapPin] = useState<Lead | null>(null);
  
  // Lead detailed profile modal state
  const [selectedLeadProfile, setSelectedLeadProfile] = useState<Lead | null>(null);
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState<Lead | null>(null);

  // Client-side filtering state for "Leads" tab
  const [leadsFilter, setLeadsFilter] = useState<"todos" | "sem_site" | "quente" | "nicho">("todos");
  const [nicheSearchQuery, setNicheSearchQuery] = useState<string>("");

  const dummyBlankLead: Lead = {
    id: "dummy_blank",
    name: "Nenhum Lead Selecionado",
    niche: "Nenhum",
    location: "Nenhum",
    rating: 0,
    reviews: 0,
    hasWebsite: false,
    hasGmbActive: false,
    hasPhone: false,
    phone: "",
    leadScore: 0,
    status: "novo",
    captured: false,
    gmbAnalysis: "Nenhuma análise disponível. Selecione ou capture um lead para iniciar.",
    avatarColor: "bg-slate-100 text-slate-400"
  };

  // AI copywriting generator state
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<Lead>(dummyBlankLead);
  const [selectedChannel, setSelectedChannel] = useState<"WhatsApp" | "E-mail" | "Instagram" | "LinkedIn">("WhatsApp");
  const [selectedGoal, setSelectedGoal] = useState<string>("SEO Local");
  const [selectedTone, setSelectedTone] = useState<string>("Persuasivo");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [generatedMessageText, setGeneratedMessageText] = useState<string>(`Olá, time da Padaria e Confeitaria Bella Massa! 👋

Notei que vocês estão fazendo um trabalho incrível no setor alimentício, mas ainda há um grande potencial não explorado no Google Maps da região.

Com uma estratégia de SEO Local, podemos colocar a sua padaria no topo das buscas quando alguém procurar por 'pão quentinho' por perto.

Podemos conversar 5 minutos sobre como aumentar seu fluxo de clientes? 🚀`);

  // Map settings
  const [zoom, setZoom] = useState<number>(14);
  const [isBellaMassaExpanded, setIsBellaMassaExpanded] = useState<boolean>(false);

  // AdsHive Global AI dashboard & interactions states
  const [aiUsageStats, setAiUsageStats] = useState({
    messagesUsed: 0,
    messagesLimit: 20,
    plan: "Gratuito",
    lastResetDate: ""
  });
  const [activeAiResource, setActiveAiResource] = useState<"copiloto" | "whatsapp" | "email" | "auditor" | "seo" | "maps" | "concorrentes" | "proposta">("copiloto");
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [showBuyAiPackModal, setShowBuyAiPackModal] = useState<boolean>(false);
  const [isProcessingAiPackPurchase, setIsProcessingAiPackPurchase] = useState<boolean>(false);
  const [isGeneratingAiCustom, setIsGeneratingAiCustom] = useState<boolean>(false);
  const [customAIResponseOutput, setCustomAIResponseOutput] = useState<string>("");

  // Quick notification helper
  const triggerNotification = (text: string, type: "success" | "warning" | "info" = "success") => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  // --- FIREBASE SYNC INTEGRATION ENGINE ---
  const lastSyncLeadsRef = useRef<Lead[]>([]);

  // 1. Initial database fetch & seed
  useEffect(() => {
    if (session) {
      const loadDatabase = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "users", session.id, "leads"));
          const loadedLeads: Lead[] = [];
          querySnapshot.forEach((docSnap) => {
            loadedLeads.push({ id: docSnap.id, ...docSnap.data() } as Lead);
          });
          // Set user's own propected leads
          setLeads(loadedLeads);
          lastSyncLeadsRef.current = loadedLeads;
        } catch (err) {
          console.error("Erro carregando leads do Firestore:", err);
          // Set to empty array for a zeroed slate
          setLeads([]);
          lastSyncLeadsRef.current = [];
        }
      };

      loadDatabase();
    }
  }, [session]);

  // 2. Multi-collection reactive lead mutations replicator
  useEffect(() => {
    if (!session) return;

    const syncChanges = async () => {
      const prevLeads = lastSyncLeadsRef.current;
      
      // Sync added or updated items
      for (const lead of leads) {
        const prevLead = prevLeads.find(p => p.id === lead.id);
        if (!prevLead || JSON.stringify(prevLead) !== JSON.stringify(lead)) {
          try {
            await setDoc(doc(db, "users", session.id, "leads", lead.id), lead);
          } catch (err) {
            console.error(`Erro replicando lead: ${lead.name}`, err);
          }
        }
      }

      // Sync deleted items
      for (const prevLead of prevLeads) {
        const currentLead = leads.find(l => l.id === prevLead.id);
        if (!currentLead) {
          try {
            await deleteDoc(doc(db, "users", session.id, "leads", prevLead.id));
          } catch (err) {
            console.error(`Erro deletando lead do Firestore: ${prevLead.name}`, err);
          }
        }
      }

      lastSyncLeadsRef.current = leads;
    };

    syncChanges();
  }, [leads, session]);

  // 3. Real-Time listener for User Profile (keeps credits, planes, and status live)
  useEffect(() => {
    if (!session) return;

    const userRef = doc(db, "users", session.id);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Dynamic Month Renewal Logic: On new month, reset planCredits to 10 if plan is FREE
        const currentMonthString = new Date().toISOString().substring(0, 7);
        const planStr = (data.plan || "Gratuito").toLowerCase();
        
        if (planStr === "gratuito" || planStr === "free") {
          if (!data.lastMonthlyRenewal || data.lastMonthlyRenewal !== currentMonthString) {
            try {
              const freshPlanCredits = 10;
              const freshPurchased = data.purchasedCredits || 0;
              const freshBonus = data.bonusCredits || 0;
              const freshTotal = freshPlanCredits + freshPurchased + freshBonus;

              await setDoc(userRef, {
                planCredits: freshPlanCredits,
                remainingCredits: freshTotal,
                credits: freshTotal,
                lastMonthlyRenewal: currentMonthString,
                accountStatus: "ACTIVE"
              }, { merge: true });

              triggerNotification("Renovação Mensal: Seus 10 créditos gratuitos foram recarregados com sucesso!", "success");
              return; // next snapshot will update the state with renewed numbers
            } catch (err) {
              console.error("Falha no reset mensal de créditos:", err);
            }
          }
        }

        setSession(prev => prev ? { 
          ...prev, 
          plan: data.plan || prev.plan,
          credits: data.credits !== undefined ? data.credits : prev.credits,
          subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
          remainingCredits: data.remainingCredits !== undefined ? data.remainingCredits : (data.credits || 0),
          bonusCredits: data.bonusCredits || 0,
          planCredits: data.planCredits !== undefined ? data.planCredits : (data.credits || 0),
          purchasedCredits: data.purchasedCredits || 0,
          accountStatus: data.accountStatus || 'ACTIVE'
        } : null);
        
        if (data.credits !== undefined) {
          setCredits(data.credits);
        }
        if (data.name) {
          setManagerName(data.name);
        }
        if (data.role) {
          setManagerRole(data.role);
        }
      }
    }, (err) => {
      console.error("Erro no listener de faturamento do usuario:", err);
    });

    return () => unsubscribe();
  }, [session?.id]);

  // Sync edits to metadata
  useEffect(() => {
    if (!session) return;
    const syncProfileChanges = async () => {
      try {
        await setDoc(doc(db, "users", session.id), {
          id: session.id,
          name: managerName,
          email: managerEmail,
          role: managerRole
        }, { merge: true });
      } catch (err) {
        console.error("Erro sincronizando perfil do SDR:", err);
      }
    };
    syncProfileChanges();
  }, [managerName, managerEmail, managerRole]);
  // --- END FIREBASE INTEGRATION ENGINE ---

  // AdsHive AI Global - State Sync, Extra Package Purchasing, and Interaction Flow
  useEffect(() => {
    if (!session?.id) return;
    
    const usageRef = doc(db, "aiUsage", session.id);
    const unsubscribe = onSnapshot(usageRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAiUsageStats({
          messagesUsed: data.messagesUsed ?? 0,
          messagesLimit: docSnap.id === 'douglasbateriacma@gmail.com' || (session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? 999999 : (data.messagesLimit ?? 20),
          plan: data.plan || session?.plan || "Gratuito",
          lastResetDate: data.lastResetDate || ""
        });
      } else {
        const initUsage = async () => {
          try {
            const resp = await fetch(getApiUrl(`/api/ai/usage/${session.id}?plan=${encodeURIComponent(session?.plan || 'Gratuito')}`));
            await logResponseDebug(resp);
            if (resp.ok) {
              const uData = await resp.json();
              setAiUsageStats({
                messagesUsed: uData.messagesUsed ?? 0,
                messagesLimit: (session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? 999999 : (uData.messagesLimit ?? 20),
                plan: uData.plan || session?.plan || "Gratuito",
                lastResetDate: uData.lastResetDate || ""
              });
            }
          } catch (e) {
            console.error("Failed to seed initial user aiUsage:", e);
          }
        };
        initUsage();
      }
    }, (err) => {
      console.error("Erro escutando aiUsage do Firestore:", err);
    });

    return () => unsubscribe();
  }, [session?.id, session?.plan]);

  const handlePurchaseAiPackage = async (packageId: string) => {
    if (!session?.id) return;
    setIsProcessingAiPackPurchase(true);
    try {
      const response = await fetch(getApiUrl("/api/asaas/buy-ai-package"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.id,
          packageId,
          method: "pix"
        })
      });
      await logResponseDebug(response);
      const data = await response.json();
      if (response.ok && data.status === "success") {
        triggerNotification(data.message, "success");
        setShowBuyAiPackModal(false);
      } else {
        triggerNotification(data.error || "Erro ao processar ativação de pacote de IA.", "warning");
      }
    } catch (err: any) {
      console.error("Error buying package:", err);
      triggerNotification("Falha na rede ao adquirir pacote de IA.", "warning");
    } finally {
      setIsProcessingAiPackPurchase(false);
    }
  };

  const handleRunAdsHiveAIInteract = async () => {
    if (!session?.id) {
      triggerNotification("Faça login para interagir com a IA.", "warning");
      return;
    }

    if (!aiCustomPrompt.trim()) {
      triggerNotification("Descreva por extenso o que deseja analisar ou perguntar.", "info");
      return;
    }

    const isAdmin = (session?.email || '').toLowerCase() === "douglasbateriacma@gmail.com";
    if (!isAdmin && aiUsageStats.messagesUsed >= aiUsageStats.messagesLimit) {
      triggerNotification("Você atingiu o limite de IA do seu plano.", "warning");
      return;
    }

    setIsGeneratingAiCustom(true);
    try {
      const response = await fetch(getApiUrl("/api/ai/interact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.id,
          userPlan: session?.plan || "Gratuito",
          resource: activeAiResource,
          prompt: aiCustomPrompt,
          companyDetails: selectedLeadForAI.id ? {
            name: selectedLeadForAI.name,
            niche: selectedLeadForAI.niche,
            location: selectedLeadForAI.location,
            rating: selectedLeadForAI.rating || null,
            reviews: selectedLeadForAI.reviews || null,
            hasWebsite: selectedLeadForAI.hasWebsite,
            phone: selectedLeadForAI.phone || null,
            gmbAnalysis: selectedLeadForAI.gmbAnalysis || ""
          } : null
        })
      });

      await logResponseDebug(response);
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        let errorMsg = "Ocorreu uma falha ao contatar o AdsHive AI.";
        if (contentType.includes("application/json")) {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } else {
          const textErr = await response.text();
          if (textErr.trim().length > 0) {
            errorMsg = textErr.substring(0, 200);
          }
        }
        triggerNotification(errorMsg, "warning");
        return;
      }

      if (!contentType.includes("application/json")) {
        triggerNotification("Resposta do servidor em formato inválido.", "warning");
        return;
      }

      const data = await response.json();
      setCustomAIResponseOutput(data.text);
      triggerNotification("Resposta estruturada com sucesso pela IA!", "success");
    } catch (err) {
      console.error("AI client execution failed:", err);
      triggerNotification("Erro de conexão ao acessar os servidores de IA.", "warning");
    } finally {
      setIsGeneratingAiCustom(false);
    }
  };

  // Perform Gemini Search for Leads
  const handleSearchLeads = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check SaaS subscriptional status guard
    if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE' || session?.subscriptionStatus === 'PAST_DUE' || session?.subscriptionStatus === 'CANCELED') {
      triggerNotification("Sua assinatura está suspensa ou em atraso. Regularize seu faturamento na aba Financeiro para continuar utilizando a plataforma.", "warning");
      return;
    }

    // Freemium credit and limitation block guard (prevents searching)
    if (session?.accountStatus === 'LIMITED' || (session?.remainingCredits !== undefined && session.remainingCredits <= 0)) {
      setShowPremiumBlockerModal(true);
      triggerNotification("Busca bloqueada. Seu saldo de créditos do plano gratuito acabou. Compre mais créditos ou mude de plano.", "warning");
      return;
    }

    setIsSearching(true);
    setSearchedYet(true);
    
    try {
      const response = await fetch(getApiUrl("/api/leads/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: searchNiche,
          location: searchLocation,
          limit: quantity / 5 // Scale the range input to realistic result lists
        })
      });
      
      await logResponseDebug(response);
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} - Erro de processamento na pesquisa`;
        if (contentType.includes("application/json")) {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } else {
          const textErr = await response.text();
          if (textErr.trim().length > 0) {
            errorMsg = textErr.substring(0, 300);
          }
        }
        throw new Error(errorMsg);
      }

      if (!contentType.includes("application/json")) {
        throw new Error("O servidor retornou um formato de resposta desconhecido (não-JSON). Entre em contato se o problema persistir.");
      }

      const data = await response.json();

      if (data.leads && Array.isArray(data.leads)) {
        // Map elements with IDs and state
        const formattedLeads: Lead[] = data.leads.map((l: any, i: number) => ({
          id: `search_lead_${Date.now()}_${i}`,
          name: l.name,
          niche: searchNiche,
          location: searchLocation,
          rating: l.rating,
          reviews: l.reviews,
          hasWebsite: l.hasWebsite,
          hasGmbActive: l.hasGmbActive,
          hasPhone: l.hasPhone,
          phone: l.phone || "",
          leadScore: l.leadScore,
          status: "novo",
          captured: false,
          gmbAnalysis: l.gmbAnalysis,
          avatarColor: getAvatarColorForNiche(searchNiche),
          isCorporatePriority: l.isCorporatePriority,
          corporateTag: l.corporateTag,
          b2bRecommendation: l.b2bRecommendation
        }));
        
        setSearchResults(formattedLeads);
        if (data.isSandboxFallback) {
          triggerNotification("Simulador Ativo: Exibindo prospecção realista de IA (Sua chave Google Cloud necessita ativar o faturamento).", "info");
        } else {
          triggerNotification(`Encontramos ${formattedLeads.length} novos leads do Google Maps!`, "success");
        }
      } else {
        throw new Error("Formato inválido recebido do servidor: campo 'leads' ausente ou inválido.");
      }
    } catch (err: any) {
      console.error("[CRITICAL GOOGLE MAPS API ERROR DEBUG]", err);
      triggerNotification(`Erro real de integração: ${err?.message || "Conexão mal sucedida"}`, "warning");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getAvatarColorForNiche = (niche: string): string => {
    const n = niche.toLowerCase();
    if (n.includes("padaria") || n.includes("confeitaria") || n.includes("pão")) return "bg-[#FEF3C7] text-[#D97706]";
    if (n.includes("pet") || n.includes("animais")) return "bg-purple-100 text-purple-800";
    if (n.includes("mecanica") || n.includes("carro") || n.includes("oficina")) return "bg-blue-100 text-blue-800";
    if (n.includes("dentista") || n.includes("odonto") || n.includes("dental") || n.includes("clinica")) return "bg-teal-100 text-teal-800";
    if (n.includes("restaurante") || n.includes("pizza") || n.includes("comida")) return "bg-rose-100 text-[#E11D48]";
    return "bg-[#e5eeff] text-[#000000]";
  };

  const getPinPosition = (id: string, index: number, total: number) => {
    const idValue = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const columns = Math.ceil(Math.sqrt(total || 10));
    const row = Math.floor(index / columns);
    const col = index % columns;
    const baseLeft = 12 + (col * (76 / (columns || 1)));
    const baseTop = 15 + (row * (65 / (columns || 1)));
    const noiseLeft = (idValue % 13) - 6;
    const noiseTop = (idValue % 11) - 5;
    const finalLeft = Math.max(8, Math.min(92, baseLeft + noiseLeft));
    const finalTop = Math.max(12, Math.min(88, baseTop + noiseTop));
    return { left: `${finalLeft}%`, top: `${finalTop}%` };
  };

  // Capture Lead and save in list
  const handleCaptureLead = async (lead: Lead) => {
    // Check if copy already captured
    if (leads.find(l => l.name.toLowerCase() === lead.name.toLowerCase() && l.location === lead.location)) {
      triggerNotification("Este lead já está na sua carteira de contatos!", "info");
      return;
    }

    if (session?.accountStatus === 'LIMITED' || (session?.remainingCredits !== undefined && session.remainingCredits <= 0)) {
      setShowPremiumBlockerModal(true);
      triggerNotification("Sua conta está limitada. Compre mais créditos para continuar capturando leads.", "warning");
      return;
    }

    const success = await handleCentralConsumeCredit('capture');
    if (!success) return;

    const updatedLead: Lead = {
      ...lead,
      id: `captured_${Date.now()}`,
      captured: true,
      capturedAt: new Date().toISOString()
    };

    setLeads(prev => [updatedLead, ...prev]);
    setDailyQuotaCount(prev => prev + 1);
    
    // Also, update result lists
    setSearchResults(prev => prev.map(l => l.name === lead.name ? { ...l, captured: true } : l));
    
    triggerNotification(`Lead "${lead.name}" capturado com sucesso! (-1 crédito)`, "success");
  };

  // Generate Approach pitching with Gemini
  const handleGenerateAICopyMessage = async () => {
    // Check SaaS subscriptional status guard
    if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE' || session?.subscriptionStatus === 'PAST_DUE' || session?.subscriptionStatus === 'CANCELED') {
      triggerNotification("Sua assinatura está suspensa ou em atraso. Regularize seu faturamento na aba Financeiro para continuar utilizando a plataforma.", "warning");
      return;
    }

    if (session?.accountStatus === 'LIMITED' || (session?.remainingCredits !== undefined && session.remainingCredits <= 0)) {
      setShowPremiumBlockerModal(true);
      triggerNotification("Sua conta do plano gratuito está sem créditos. Adquira mais créditos para gerar.", "warning");
      return;
    }

    const success = await handleCentralConsumeCredit('ai_analysis');
    if (!success) return;

    setIsGeneratingAI(true);
    triggerNotification("Analisando perfil digital e gerando abordagem inovadora...", "info");

    try {
      const response = await fetch(getApiUrl("/api/message/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: selectedLeadForAI.name,
          niche: selectedLeadForAI.niche,
          location: selectedLeadForAI.location,
          channel: selectedChannel,
          goal: selectedGoal,
          tone: selectedTone,
          gmbAnalysis: selectedLeadForAI.gmbAnalysis
        })
      });

      await logResponseDebug(response);
      const data = await response.json();
      if (data.text) {
        setGeneratedMessageText(data.text);
        triggerNotification("Nova abordagem inteligente gerada com sucesso! (-1 crédito)", "success");
      } else {
        throw new Error("Resposta de cópia vazia.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Utilizando modelo alternativo offline para o script.", "warning");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Copia mensagem para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessageText);
    triggerNotification("Abordagem copiada para a área de transferência!", "success");
  };

  // Envia via WhatsApp (simula ou tenta abrir o link direto)
  const handleSendViaWhatsApp = () => {
    const cleanPhone = selectedLeadForAI.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone === "") {
      triggerNotification("Insira um número de telefone no perfil do lead para o disparo Real.", "warning");
    }
    
    // Open realistic WhatsApp web link with custom Text encoded url
    const messagePart = encodeURIComponent(generatedMessageText);
    const url = `https://wa.me/${cleanPhone ? "55" + cleanPhone : ""}?text=${messagePart}`;
    window.open(url, "_blank");
    triggerNotification("Abrindo simulador de disparo do WhatsApp...", "success");
  };

  // Export Leads list to CSV simulation
  const handleExportCSV = () => {
    // Check SaaS subscriptional status guard
    if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE') {
      triggerNotification("Seu plano está suspenso devido a faturamento pendente no Asaas. Acesse a aba Assinaturas para regularizar seu acesso.", "warning");
      return;
    }

    if (isFeaturePremiumRestricted("Exportação de Banco de Leads")) {
      return;
    }

    triggerNotification("Exportando carteira de Leads qualificados com sucesso (CSV)!", "success");
  };

  // Quick action: switch directly to generator with a specific lead pre-selected
  const startAIWithLead = (lead: Lead) => {
    setSelectedLeadForAI(lead);
    setActiveTab("ai_gerador");
    
    // Generate initial copy text
    const initialText = `Olá, equipe da *${lead.name}*! 👋

Identifiquei a excelente nota de vocês de ${lead.rating} estrelas no Google Maps de ${lead.location}. 

Com nosso método de SEO Local para o nicho de ${lead.niche}, preenchemos a falta de site próprio para aumentar suas vendas e agendamentos diretos em até 60%.

Gostaria de agendar um rápido feedback de 5 minutos ainda essa semana? 🚀`;
    setGeneratedMessageText(initialText);
  };

  // Client side filtering logic
  const filteredLeads = leads.filter(l => {
    if (leadsFilter === "sem_site" && l.hasWebsite) return false;
    if (leadsFilter === "quente" && l.leadScore < 85) return false;
    if (leadsFilter === "nicho" && nicheSearchQuery !== "" && !l.niche.toLowerCase().includes(nicheSearchQuery.toLowerCase())) return false;
    return true;
  });

  if (isPublicCalendly) {
    return (
      <PublicBooking 
        slug={calendlyUserSlug} 
        triggerNotification={triggerNotification} 
      />
    );
  }

  if (!session) {
    return (
      <div id="auth-container" className="min-h-screen bg-slate-950 relative">
        {unauthView === "landing" ? (
          <LandingPage 
            onNavigateToAuth={(step) => {
              setUnauthView(step);
              window.history.pushState({}, "", `/${step}`);
            }}
            onExploreDemo={() => {
              setUnauthView("register");
              window.history.pushState({}, "", "/register");
              triggerNotification("Dando as boas-vindas com 10 Créditos de Leads Grátis!", "success");
            }}
          />
        ) : (
          <AuthGate 
            initialStep={unauthView === "register" ? "register" : "login"}
            onBackToLanding={() => {
              setUnauthView("landing");
              window.history.pushState({}, "", "/");
            }}
            onSignIn={(sess) => {
              setSession(sess);
              setManagerName(sess.name);
              setCredits(sess.credits);
              setManagerRole(sess.role);
              setManagerEmail(sess.email);
              triggerNotification(`Seja bem-vindo de volta, ${sess.name}! Perfil [${sess.role}] ativo com sucesso.`, "success");
              
              const currentPath = window.location.pathname;
              if (currentPath === "/owner" || currentPath === "/admin" || currentPath === "/dashboard-owner" || currentPath === "/owner/system-health") {
                if (sess.email?.toLowerCase() === "douglasbateriacma@gmail.com") {
                  if (currentPath === "/owner/system-health") {
                    setActiveTab("system-health");
                  } else {
                    setActiveTab("dashboard-owner");
                  }
                } else {
                  setActiveTab("inicio");
                  window.history.replaceState({}, "", "/dashboard");
                }
              } else if (pathToTabMap[currentPath]) {
                setActiveTab(pathToTabMap[currentPath]);
              } else {
                setActiveTab("inicio");
                window.history.replaceState({}, "", "/dashboard");
              }
            }} 
          />
        )}
        {/* Toast Notification Container for Auth/Landing screen */}
        <div id="toast-container" className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`shadow-xl rounded-xl p-4 flex items-start gap-3 border transition-all duration-300 pointer-events-auto ${
                n.type === "success" 
                  ? "bg-emerald-950/90 border-emerald-500 text-emerald-200" 
                  : n.type === "warning"
                  ? "bg-amber-950/90 border-amber-500 text-amber-200"
                  : "bg-blue-950/90 border-blue-500 text-blue-200 font-semibold"
              }`}
            >
              <div className="flex-1">
                <p className="text-xs font-bold leading-normal">{n.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="adshive-prospect-app" className={`min-h-screen transition-all duration-300 pb-20 lg:pb-0 flex flex-col font-sans theme-${themeMode} ${themeMode === 'light' ? 'bg-[#F8F9FC] text-[#111827]' : 'bg-[#0B0B0F] text-[#FFFFFF]'}`}>
      
      {/* Toast Notification Container */}
      <div id="toast-container" className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {notifications.map(n => (
          <div
            key={n.id}
            id={`notification-${n.id}`}
            className={`shadow-xl rounded-xl p-4 flex items-start gap-3 border transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-auto ${
              n.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : n.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {n.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {n.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {n.type === "info" && <HelpCircle className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-relaxed">{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Application Header Navbar */}
      <header id="topbar-nav" className={`fixed top-0 left-0 w-full z-50 h-16 flex items-center shadow-sm border-b transition-all duration-300 ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#14141B] border-[#2B2B3A] text-white'}`}>
        <div className="w-full max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#8B2EFF] text-white p-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#9C4DFF] active:scale-95 transition-all shadow-glow-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div id="company-logo" className="font-extrabold text-lg tracking-tight leading-none select-none">
                <span className={themeMode === "light" ? "text-slate-900" : "text-white"}>AdsHive </span>
                <span className="text-[#8B2EFF]">Prospect</span>
              </div>
              <span className={`text-[10px] font-medium tracking-wide mt-0.5 hidden sm:inline ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>Prospecção Inteligente Impulsionada por IA</span>
            </div>
          </div>

          {/* Dynamic Indicator Visual (Permanente no topo) */}
          <div className="hidden lg:flex items-center gap-6 border-l pl-6 border-slate-200 dark:border-[#2B2B3A]">
            {session?.email?.toLowerCase() !== 'douglasbateriacma@gmail.com' && ((session?.plan || 'Gratuito').toLowerCase() === 'gratuito' || (session?.plan || 'Gratuito').toLowerCase() === 'free') && (
              <div id="header-free-alert" className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold px-3 py-1.5 rounded-xl">
                <span className="animate-pulse">⚠️ ALERTA DE LIMITE GRATUITO: {session?.planCredits !== undefined ? session.planCredits : 10}/10 RESTANTES</span>
                <button 
                  id="header-free-upgrade"
                  onClick={() => {
                    setActiveTab("comercial");
                    triggerNotification("Redirecionando para grade de upgrade de planos...", "info");
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-0.5 rounded-lg font-black text-[10px] transition-all uppercase cursor-pointer"
                >
                  Fazer Upgrade
                </button>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-[#7A7D8B] font-bold uppercase tracking-wider">Plano Atual</span>
              <span className={`text-xs font-black flex items-center gap-1 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <span className={`w-2 h-2 rounded-full ${session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'bg-amber-400 animate-pulse' : (session?.plan || 'Gratuito').toLowerCase() === 'gratuito' ? 'bg-zinc-400' : 'bg-[#8B2EFF] animate-pulse'}`}></span>
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'Unlimited Vitalício (Dev)' : (session?.plan || 'Gratuito')}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-[#7A7D8B] font-bold uppercase tracking-wider">Leads Restantes</span>
              <span className={`text-xs font-black ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' 
                  ? '∞ Ilimitado'
                  : (session?.plan || 'Gratuito').toLowerCase() === 'gratuito'
                    ? `${session?.planCredits !== undefined ? session.planCredits : 10} de 10 restantes`
                    : `${session?.planCredits !== undefined ? session.planCredits : 500} de 500 restantes`
                }
              </span>
            </div>

            <div className="flex flex-col font-mono text-xs">
              <span className="text-[10px] text-slate-400 dark:text-[#7A7D8B] font-sans font-bold uppercase tracking-wider">Créditos Comprados</span>
              <span className={`text-xs font-black ${themeMode === 'light' ? 'text-indigo-700' : 'text-[#8B2EFF]'}`}>
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? '∞ Privilégio Dev' : `+${session?.purchasedCredits || 0} adicionais`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Theme Toggle Command Button: 🌙 Escuro / ☀️ Claro */}
            <button
              id="btn-theme-toggle"
              onClick={() => {
                const nextTheme = themeMode === "light" ? "dark" : "light";
                setThemeMode(nextTheme);
                localStorage.setItem("theme", nextTheme);
                setAppearanceChoice(nextTheme);
                localStorage.setItem("appearance_choice", nextTheme);
                triggerNotification(`Visual alterado para Tema ${nextTheme === 'light' ? 'Claro' : 'Escuro'}!`, "info");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                themeMode === "light"
                  ? "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                  : "bg-[#1C1C26] border-[#2B2B3A] hover:bg-[#2B2B3A] text-white"
              }`}
            >
              {themeMode === "light" ? "🌙 Escuro" : "☀️ Claro"}
            </button>

            {/* Credits badge selector */}
            <div id="hdr-credits" className={`hidden sm:flex items-center gap-2 border rounded-full px-4 py-1.5 ${themeMode === 'light' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900' : 'bg-[#1C1C26] border-[#2B2B3A] text-[#B0B3C1]'}`}>
              <span className="w-2 h-2 rounded-full bg-[#8B2EFF] animate-pulse"></span>
              <span className="text-xs font-bold">
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'Créditos Ilimitados' : `${credits} créditos de prospecção`}
              </span>
            </div>

            <div className="flex items-center gap-3 border-l pl-4 border-slate-200 dark:border-[#2B2B3A]">
              {/* User badge */}
              <div 
                onClick={() => setActiveTab("admin")}
                className="flex flex-col text-right hidden md:block cursor-pointer hover:opacity-85"
              >
                <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{managerName}</span>
                <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">{managerBusiness}</span>
              </div>
              <div 
                id="btn-profile" 
                onClick={() => setActiveTab("admin")}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-blue-200 border border-slate-300 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all"
              >
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJqqoXyq6PWwYh0DdwLOD_-2ygOXUeoKsVN28D4A0QKF03LL8iOhhHsLFs4SxMjZV_-qejN1Wqq0_bLTZlTXwNcw5tdjsOW0ED-zAcyvwD6FzOs7V5-8qHrTzDfxWXK2BnxfqGK6CqdQ4x7xhtHMntGBAtX3io6FFOTnpm2j7Z3Qz6sw1XIbLzedR-TcA00Khw7hwSmHQm70EgRuwWpunqhM_0Xgkl4vCXJOGU06hD_zx87UbchNsZCojJcvWi2YJ_s-qBAgjoQ5E" 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16 min-h-[calc(100vh-4rem)]">
        
        {/* Dynamic Sidebar navigation for Desktop users */}
        <aside id="desktop-sidebar-nav" className={`hidden lg:flex fixed left-0 top-16 h-full w-[280px] flex-col py-6 px-4 z-40 border-r transition-all duration-300 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0B0B0F] border-[#2B2B3A] text-white'}`}>
          <div className="px-3 mb-6">
            <div className={`border rounded-xl p-4 shadow-sm transition-all duration-300 ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#1C1C26] border-[#2B2B3A] shadow-glow-purple'}`}>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Plano Atual</p>
              <h4 className={`text-sm font-black ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{managerRole}</h4>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
                <div className="bg-[#8B2EFF] h-full rounded-full transition-all duration-500" style={{ width: "75%" }}></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#B0B3C1] mt-1.5 font-medium">{dailyQuotaCount * 12}/1000 leads obtidos</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <button 
              id="sidebar-tab-inicio"
              onClick={() => setActiveTab("inicio")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("inicio")}`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Visão Geral</span>
            </button>

            <button 
              id="sidebar-tab-pesquisa"
              onClick={() => setActiveTab("pesquisa")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("pesquisa")}`}
            >
              <Search className="w-5 h-5 shrink-0" />
              <span>Pesquisa Maps</span>
            </button>

            <button 
              id="sidebar-tab-leads"
              onClick={() => setActiveTab("leads")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("leads")}`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Gestão de Leads</span>
            </button>

            <button 
              id="sidebar-tab-oportunidades"
              onClick={() => setActiveTab("oportunidades")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("oportunidades")}`}
            >
              <Flame className="w-5 h-5 shrink-0" />
              <span>Oportunidades</span>
            </button>

            <button 
              id="sidebar-tab-crm"
              onClick={() => setActiveTab("crm")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("crm")}`}
            >
              <Users2 className="w-5 h-5 shrink-0" />
              <span className="flex items-center gap-1.5">
                <span>Kanban CRM</span>
                <span className="bg-[#8B2EFF]/20 text-[#8B2EFF] text-[9px] px-1.5 py-0.2 rounded font-black uppercase">Novo</span>
              </span>
            </button>

            <button 
              id="sidebar-tab-agenda"
              onClick={() => setActiveTab("agenda")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("agenda")}`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span>Agenda</span>
            </button>

            <button 
              id="sidebar-tab-radar"
              onClick={() => {
                if (isFeaturePremiumRestricted("Radar Digital Avançado")) return;
                setActiveTab("radar");
              }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("radar")}`}
            >
              <Activity className="w-5 h-5 shrink-0" />
              <span>Radar Digital</span>
            </button>

            <button 
              id="sidebar-tab-comercial"
              onClick={() => setActiveTab("comercial")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("comercial")}`}
            >
              <DollarSign className="w-5 h-5 shrink-0" />
              <span>Painel e Financeiro</span>
            </button>

            <button 
              id="sidebar-tab-ai"
              onClick={() => setActiveTab("ai_gerador")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("ai_gerador")}`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Gerador de Mensagem IA</span>
            </button>

            <button 
              id="sidebar-tab-financeiro"
              onClick={() => setActiveTab("financeiro")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("financeiro")}`}
            >
              <Coins className={`w-5 h-5 shrink-0 ${themeMode === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>Financeiro</span>
            </button>

            <button 
              id="sidebar-tab-admin"
              onClick={() => setActiveTab("admin")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("admin")}`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Configurações Admin</span>
            </button>

            {session?.email?.toLowerCase() === "douglasbateriacma@gmail.com" && (
              <>
                <button 
                  id="sidebar-tab-owner"
                  onClick={() => setActiveTab("dashboard-owner")} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                    activeTab === "dashboard-owner" 
                      ? "bg-[#C93CFF]/10 text-[#C93CFF] border-l-4 border-[#C93CFF] font-black" 
                      : themeMode === "light"
                        ? "text-rose-600 hover:bg-rose-50"
                        : "text-rose-400 hover:bg-[#1C1C26]"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
                  <span>Painel Owner Master</span>
                </button>

                <button 
                  id="sidebar-tab-system-health"
                  onClick={() => setActiveTab("system-health")} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${getSidebarBtnClass("system-health")}`}
                >
                  <Activity className="w-5 h-5 shrink-0 text-purple-500 animate-pulse" />
                  <span>Saúde do Sistema</span>
                </button>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-[#2B2B3A] mt-auto pb-4 px-3 flex justify-between items-center text-[11px] text-slate-400 dark:text-[#7A7D8B] font-medium">
            <span>AdsHive Prospect v1.6.2</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
        </aside>

         {/* Primary Screen Area depending on activeTab context */}
        <main id="main-content-canvas" className="flex-1 lg:ml-[280px] p-4 md:p-8 pb-24 lg:pb-8 transition-all max-w-7xl mx-auto w-full">
          
          {session?.subscriptionStatus === "CANCELED" && (
            <div id="canceled-subscription-banner" className="bg-slate-800 border border-slate-700 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg mb-6 text-left w-full">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#8B2EFF] shrink-0 animate-pulse" />
                <div>
                  <strong className="text-sm uppercase tracking-wide font-black block text-slate-200">Sua Assinatura foi Cancelada</strong>
                  <span className="text-sm text-slate-300 font-medium">
                    Sentimos sua saída. Seu histórico permanece salvo caso deseje retornar.
                  </span>
                </div>
              </div>
              <button 
                id="btn-reactivate-subscription"
                onClick={() => {
                  setActiveTab("comercial");
                  triggerNotification("Redirecionando para nossos planos de assinatura...", "info");
                }}
                className="bg-[#8B2EFF] hover:bg-[#8026eb] text-white font-black text-xs px-5 py-2.5 rounded-xl border-none transition-all shadow-md shrink-0 cursor-pointer"
              >
                Reatividades & Planos
              </button>
            </div>
          )}

          {session?.subscriptionStatus === "PAST_DUE" && activeTab !== "financeiro" && activeTab !== "loja_creditos" && (
            <div id="past-due-notification-banner" className="bg-red-600 border border-red-500 text-white p-5 rounded-2xl flex items-center justify-between gap-4 shadow-lg mb-6 text-left">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-white shrink-0 animate-bounce" />
                <div>
                  <strong className="text-sm uppercase tracking-wide font-black block">Faturamento em Atraso</strong>
                  <span className="text-xs text-red-100 font-medium">
                    Sua assinatura está em atraso. Regularize seu pagamento para continuar utilizando a plataforma.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab("financeiro")}
                className="bg-white text-red-650 font-black text-xs px-4 py-2 rounded-xl border-none hover:bg-red-50 transition-all shadow-sm shrink-0"
              >
                Regularizar Conta
              </button>
            </div>
          )}
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "inicio" && (
            <div id="tab-inicio-view" className="space-y-8 animate-in fade-in duration-300">
              
              {/* Header section panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Visão Geral</h2>
                  <p className="text-slate-500 mt-1">Bem-vindo de volta, aqui estão seus números de hoje.</p>
                </div>
                <button 
                  id="btn-goto-search"
                  onClick={() => setActiveTab("pesquisa")} 
                  className="bg-slate-900 border border-slate-800 text-white rounded-xl px-5 py-3 font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all shadow-md self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Pesquisa</span>
                </button>
              </div>

              {/* Metric Card Bento layout */}
              <div id="metrics-bento-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total de Empresas */}
                <div id="metric-total-empresas" className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Total de Empresas</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{leads.length}</p>
                  </div>
                </div>

                {/* Empresas Sem Site */}
                <div id="metric-sem-site" className="bg-white border-2 border-amber-500 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 py-1 px-3 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-bl-xl shadow-sm">
                    OPORTUNIDADE
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Empresas Sem Site</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{leads.filter(l => !l.hasWebsite).length}</p>
                  </div>
                </div>

                {/* Leads Quentes */}
                <div id="metric-quentes" className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="bg-rose-50 p-3 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6" />
                    </div>
                    <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-bold">Crítico</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Leads Quentes</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{leads.filter(l => l.leadScore >= 85).length}</p>
                  </div>
                </div>

                {/* Clientes Fechados */}
                <div id="metric-fechados" className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <span className="text-slate-400 text-xs font-semibold">Meta Mensal</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Clientes Fechados</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{leads.filter(l => l.status === "fechado").length}</p>
                  </div>
                </div>

              </div>

              {/* Dynamic visual graph & target leads lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Bar Chart section */}
                <div id="digital_presence_chart" className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Distribuição de Presença Digital</h3>
                      <p className="text-xs text-slate-400 font-semibold">Acompanhamento semanal de leads com e sem site na região</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <span className="w-3 h-3 rounded-full bg-slate-900 inline-block"></span>
                        <span>Com Site</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                        <span>Sem Site</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 flex items-end gap-3 sm:gap-6 px-4 pt-4 border-b border-slate-100">
                    {/* Mondays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[75%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[25%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Seg</span>
                    </div>

                    {/* Tuesdays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[85%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[15%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Ter</span>
                    </div>

                    {/* Wednesdays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[60%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[40%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Qua</span>
                    </div>

                    {/* Thursdays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[40%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[60%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Qui</span>
                    </div>

                    {/* Fridays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[90%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[10%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Sex</span>
                    </div>

                    {/* Saturdays */}
                    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-[70%]">
                        <div className="flex-1 bg-slate-900 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[45%]"></div>
                        <div className="flex-1 bg-amber-500 rounded-t-md hover:opacity-85 transition-opacity cursor-pointer duration-200 h-[55%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Sáb</span>
                    </div>
                  </div>
                </div>

                {/* Recent Leads list card */}
                <div id="recent-leads-card" className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Últimos Leads</h3>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Recentes</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[300px]">
                    {leads.slice(0, 4).map((l, index) => (
                      <div 
                        key={l.id} 
                        onClick={() => setSelectedLeadProfile(l)}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-slate-800 ${getAvatarColorForNiche(l.niche)}`}>
                          {(l.name || "").split(" ").slice(0, 2).map(w => w ? w[0] : "").join("") || "LD"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{l.name}</p>
                          <p className="text-xs text-slate-400 font-semibold">{l.hasWebsite ? "Site Ativo" : "Sem site detectado"}</p>
                        </div>
                        <div className="shrink-0 flex items-center">
                          {l.leadScore >= 90 ? (
                            <span className="material-symbols-outlined text-rose-500 text-sm animate-pulse" title="Lead Score Crítico">🔥</span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400 font-bold">{index * 2 + 1}m</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                    <button 
                      onClick={() => setActiveTab("leads")} 
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase hover:underline transition-colors"
                    >
                      Ver Todos os Leads
                    </button>
                  </div>
                </div>

              </div>

              {/* Bento Grid: Sales Funnel Dashboard component */}
              <div id="sales-funnel-bento-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                
                {/* Simplified Funnel Chart (occupies 2 columns) */}
                <div id="funnel-chart-card" className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-800">Funil de Vendas Simplificado</h3>
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Pipeline Ativo</span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mb-6">Acompanhe a distribuição de leads qualificados capturados em sua carteira de clientes</p>
                  </div>

                  {/* Pyro funnel horizontal stacked steps */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center min-h-[240px]">
                    
                    {/* Level 1: Não contatado */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex justify-between items-center px-4 max-w-xl text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                          <span>Não Contatado / Novo</span>
                        </span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">{countNovo} leads</span>
                      </div>
                      <div className="w-full max-w-xl bg-slate-50 border border-slate-100 rounded-lg h-9 overflow-hidden flex items-center justify-center relative shadow-inner">
                        <div 
                          className="bg-blue-500/90 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-white text-xs font-black shadow-sm"
                          style={{ width: `${Math.max((countNovo / (leads.length || 1)) * 100, 15)}%` }}
                        >
                          {((countNovo / (leads.length || 1)) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Funnel separator arrow */}
                    <div className="flex justify-center text-slate-300">
                      <ChevronRight className="w-4 h-4 transform rotate-90 text-slate-400" />
                    </div>

                    {/* Level 2: Interessado */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex justify-between items-center px-4 max-w-[90%] text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                          <span>Interessado / Qualificado</span>
                        </span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">{countInteressado} leads</span>
                      </div>
                      <div className="w-full max-w-[90%] bg-slate-50 border border-slate-100 rounded-lg h-9 overflow-hidden flex items-center justify-center relative shadow-inner">
                        <div 
                          className="bg-indigo-600/90 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-white text-xs font-black shadow-sm"
                          style={{ width: `${Math.max((countInteressado / (leads.length || 1)) * 100, 15)}%` }}
                        >
                          {((countInteressado / (leads.length || 1)) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Funnel separator arrow */}
                    <div className="flex justify-center text-slate-300">
                      <ChevronRight className="w-4 h-4 transform rotate-90 text-slate-400" />
                    </div>

                    {/* Level 3: Negociação */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex justify-between items-center px-4 max-w-[80%] text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>Em Negociação</span>
                        </span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">{countNegociacao} leads</span>
                      </div>
                      <div className="w-full max-w-[80%] bg-slate-50 border border-slate-100 rounded-lg h-9 overflow-hidden flex items-center justify-center relative shadow-inner">
                        <div 
                          className="bg-amber-500/90 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-white text-xs font-black shadow-sm"
                          style={{ width: `${Math.max((countNegociacao / (leads.length || 1)) * 100, 15)}%` }}
                        >
                          {((countNegociacao / (leads.length || 1)) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Funnel separator arrow */}
                    <div className="flex justify-center text-slate-300">
                      <ChevronRight className="w-4 h-4 transform rotate-90 text-slate-400" />
                    </div>

                    {/* Level 4: Antigo / Clientes fechados */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex justify-between items-center px-4 max-w-[70%] text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Clientes Fechados</span>
                        </span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">{countAntigo} fechados</span>
                      </div>
                      <div className="w-full max-w-[70%] bg-slate-50 border border-slate-100 rounded-lg h-9 overflow-hidden flex items-center justify-center relative shadow-inner">
                        <div 
                          className="bg-emerald-650 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-white text-xs font-black shadow-sm bg-emerald-600"
                          style={{ width: `${Math.max((countAntigo / (leads.length || 1)) * 100, 15)}%` }}
                        >
                          {((countAntigo / (leads.length || 1)) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 font-bold">
                    <span>Taxa de Conversão Líquida: {((countAntigo / (leads.length || 1)) * 100).toFixed(1)}%</span>
                    <button 
                      onClick={() => setActiveTab("leads")}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline transition-all cursor-pointer"
                    >
                      <span>Atualizar Status de Leads</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Funnel insights bento sidebar (occupies 1 column) */}
                <div id="funnel-insights-card" className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-500/10 rounded-full blur-xl"></div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-white">Análise de Funil</h3>
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mb-6">Diagnóstico e Insights Comerciais</p>

                    <div className="space-y-4">
                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Gargalo Técnico</p>
                        <p className="text-xs text-slate-200">
                          {countNovo > countInteressado * 2 
                            ? "Alto volume de leads intocados. Utilize o 'Gerador de Mensagem IA' para acelerar sua taxa de primeiro contato."
                            : "Aproveite o engajamento atual. Continue acompanhando leads interessados e agendando apresentações de SEO local."}
                        </p>
                      </div>

                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Insights de Nicho</p>
                        <p className="text-xs text-slate-200">
                          Empresas sem site no Google Maps mostram um aumento de 4x no interesse quanto apresentadas com exemplos visuais reais.
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      <span>Atualizado em Real-time</span>
                    </span>
                    <span className="font-mono text-slate-500">v1.6Active</span>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PESQUISA */}
          {activeTab === "pesquisa" && (
            <div id="tab-pesquisa-view" className="space-y-8 animate-in fade-in duration-300">
              
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pesquisa de Leads</h2>
                <p className="text-slate-500 mt-1">Capture novas oportunidades diretamente do mapa em tempo real.</p>
              </div>

              {/* Advanced search form layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <form onSubmit={handleSearchLeads} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                        {/* Nicho input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Nicho de Atuação</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                              type="text" 
                              value={searchNiche} 
                              onChange={(e) => setSearchNiche(e.target.value)} 
                              list="niche-options"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" 
                              placeholder="Selecione da lista ou digite o nicho de sua escolha..."
                            />
                            <datalist id="niche-options">
                              {["Padaria", "Pet Shop", "Oficina Mecânica", "Dentista", "Restaurante", "Salão de Beleza", "Imobiliária", "Clínica Estética", "Academia", "Advogado", "Contabilidade", "Vidraçaria", "Farmácia", "Sorveteria", "Pizzaria", "Consultório Médico", "Autoescola", "Gráfica", "Arquitetura", "Ar Condicionado", "Fotografia", "Chaveiro", "Barbearia", "Floricultura", "Material de Construção", "Clínica Veterinária", "Escola de Idiomas", "Serralheria", "Bandeirantes"].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </datalist>
                          </div>
                          {/* Quick tags suggestions */}
                          <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                            {["Padaria", "Pet Shop", "Oficina Mecânica", "Dentista", "Restaurante", "Salão de Beleza", "Imobiliária", "Clínica Estética", "Academia", "Advogado", "Contabilidade", "Vidraçaria", "Farmácia", "Sorveteria", "Pizzaria", "Barbearia", "Bandeirantes"].map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setSearchNiche(tag)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                  searchNiche === tag 
                                    ? "bg-blue-600 text-white" 
                                    : "bg-slate-105 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                      {/* Localização input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Localização / Cidade</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input 
                            type="text" 
                            value={searchLocation} 
                            onChange={(e) => setSearchLocation(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" 
                            placeholder="Ex: São Paulo, SP ou Copacabana, RJ"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Results Slider range input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Quantidade de Resultados para Buscar</label>
                        <span className="text-sm font-extrabold text-blue-600 font-mono">{quantity} leads</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="200" 
                        step="10"
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))} 
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[11px] text-slate-450 font-bold">
                        <span>10 leads</span>
                        <span>200 leads max</span>
                      </div>
                    </div>

                    {/* Searching trigger button */}
                    <button 
                      type="submit" 
                      disabled={isSearching}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSearching ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Prospectando no Google Maps via IA...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Buscar Empresas & Gaps Digitais</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* IA Info Card telemetry side board */}
                <div className="lg:col-span-4 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl"></div>
                  
                  <div>
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider inline-block mb-3">CONVERSOR DE MAPAS</span>
                    <h3 className="font-extrabold text-2xl tracking-tight text-white mb-2 leading-tight">Capture mais clientes em menos tempo</h3>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                      Nossos algoritmos analisam o cadastro das empresas e identificam quais não usufruem de site oficial, SEO móvel ou telefone. Aborde estes leads com propostas imbatíveis.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Conversão Média</p>
                      <p className="text-xl font-extrabold text-blue-300 mt-1">32%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Créditos Ativos</p>
                      <p className="text-xl font-extrabold text-amber-400 mt-1">{credits}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Search results area listing */}
              {searchedYet && (
                <div id="search-results-div" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-xl text-slate-800">Resultados da Pesquisa</h3>
                    <span className="text-xs text-slate-400 font-bold">Exibindo {searchResults.length} empresas identificadas</span>
                  </div>

                  {searchResults.length === 0 && !isSearching && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                      <p className="font-bold text-lg">Nenhuma empresa encontrada com estes parâmetros.</p>
                      <p className="text-sm">Tente redefinir o nicho ou cidade para mapear outras áreas.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map(lead => (
                      <div 
                        key={lead.id} 
                        className={`bg-white border p-6 rounded-2xl flex flex-col hover:shadow-lg transition-all transform hover:-translate-y-1 relative group ${
                          lead.hasWebsite ? "border-slate-200" : "border-amber-300"
                        }`}
                      >
                        {/* Score and status pill top */}
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${getAvatarColorForNiche(lead.niche)}`}>
                            <Globe className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            lead.leadScore >= 90 
                              ? "bg-rose-100 text-rose-800" 
                              : lead.leadScore >= 75 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            Score {lead.leadScore} - {lead.leadScore >= 90 ? "Altíssimo 🔥" : lead.leadScore >= 75 ? "Quente ⚡" : "Morno"}
                          </span>
                        </div>

                        {/* Title & Reviews */}
                        <h4 className="text-lg font-extrabold text-slate-800 truncate mb-1">{lead.name}</h4>
                        
                        <div className="flex items-center gap-1.5 mb-4">
                          <div className="flex items-center text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${
                                  i < Math.floor(lead.rating) 
                                    ? "fill-amber-500 text-amber-500" 
                                    : "text-slate-200"
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500 font-bold">({lead.rating}) {lead.reviews} avaliações</span>
                        </div>

                        {/* Badges gap listing */}
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {lead.isCorporatePriority && (
                            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-0.5 shadow-sm">
                              👑 {lead.corporateTag || "PJ Prioritária"}
                            </span>
                          )}
                          {!lead.hasWebsite && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                              Website Missing
                            </span>
                          )}
                          {lead.hasGmbActive && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              GMB Ativo
                            </span>
                          )}
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {lead.location}
                          </span>
                        </div>

                        {/* Opportunity Analysis Box snippet */}
                        <div className="bg-slate-55 text-[11px] text-slate-500 italic p-3 rounded-xl border border-slate-100 mb-6 shrink-0 flex-1">
                          "{lead.gmbAnalysis}"
                        </div>

                        {/* Action Capture Buttons */}
                        {lead.captured ? (
                          <div className="mt-auto w-full bg-slate-50 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Capturado para sua Carteira</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCaptureLead(lead)}
                            className="mt-auto w-full border-2 border-blue-600 text-blue-600 group-hover:bg-blue-600 group-hover:text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Capturar Lead (-10 cr)</span>
                          </button>
                        )}

                      </div>
                    ))}
                  </div>

                  {/* Aesthetic Map section wrapper */}
                  <div id="map-visualization" className="bg-[#12121e] rounded-2xl h-[450px] relative border border-slate-800 shadow-xl overflow-hidden">
                    {mapsConfig.hasKey ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/search?key=${mapsConfig.key}&q=${encodeURIComponent(`${searchNiche || "Padaria"} em ${searchLocation || "São Paulo"}`)}`}
                      ></iframe>
                    ) : (
                      <>
                        {/* SVG map visual accents/grid */}
                        <div className="absolute inset-0 opacity-15">
                          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4F46E5" strokeWidth="1" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                          </svg>
                        </div>

                        {/* Vector simulated city districts */}
                        <div className="absolute inset-x-0 inset-y-0 opacity-40 mix-blend-color-dodge pointer-events-none">
                          <div className="absolute top-[10%] left-[20%] w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl"></div>
                          <div className="absolute bottom-[15%] right-[25%] w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl"></div>
                          <div className="absolute top-[40%] right-[10%] w-40 h-40 rounded-full bg-violet-500/10 blur-2xl"></div>
                        </div>

                        {/* Street maps layout simulation lines */}
                        <div className="absolute inset-y-0 left-[35%] w-[2px] bg-slate-800/80 pointer-events-none"></div>
                        <div className="absolute inset-y-0 left-[68%] w-[2px] bg-slate-800/80 pointer-events-none"></div>
                        <div className="absolute inset-x-0 top-[28%] h-[2px] bg-slate-800/80 pointer-events-none"></div>
                        <div className="absolute inset-x-0 top-[72%] h-[2px] bg-slate-800/80 pointer-events-none"></div>

                        {/* Central radar scanner wave */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-indigo-500/10 rounded-full flex items-center justify-center pointer-events-none">
                          <div className="w-[200px] h-[200px] border border-indigo-500/20 rounded-full flex items-center justify-center">
                            <div className="w-[80px] h-[80px] border border-cyan-500/30 rounded-full animate-ping"></div>
                          </div>
                        </div>

                        {/* Neighborhood tags */}
                        <div className="absolute top-[15%] left-[20%] text-[10px] text-indigo-400 font-mono tracking-widest font-bold uppercase select-none opacity-40">Distrito Centro</div>
                        <div className="absolute top-[45%] left-[72%] text-[10px] text-cyan-400 font-mono tracking-widest font-bold uppercase select-none opacity-40">Região Comercial</div>
                        <div className="absolute bottom-[18%] left-[45%] text-[10px] text-violet-400 font-mono tracking-widest font-bold uppercase select-none opacity-40">Zona Sul</div>

                        {/* Plotted Interactive Pins */}
                        {searchResults.map((lead, i) => {
                          const pos = getPinPosition(lead.id, i, searchResults.length);
                          const isSelected = selectedMapPin?.id === lead.id;
                          const hasNoSite = !lead.hasWebsite;

                          return (
                            <div 
                              key={lead.id}
                              className="absolute transition-all duration-350"
                              style={{ left: pos.left, top: pos.top }}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedMapPin(lead)}
                                className={`relative focus:outline-none flex items-center justify-center cursor-pointer transition-all hover:scale-125 hover:z-50 ${isSelected ? "scale-130 z-40" : "z-20"}`}
                              >
                                {/* Pulsing beacon behind the pin */}
                                <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-40 animate-ping ${hasNoSite ? "bg-amber-500" : "bg-blue-500"}`}></span>

                                {/* Solid visual pin */}
                                <span className={`relative flex items-center justify-center rounded-full border shadow-md p-1.5 ${
                                  isSelected
                                    ? "bg-indigo-600 border-white text-white scale-110" 
                                    : hasNoSite 
                                      ? "bg-amber-500 border-amber-300 text-white" 
                                      : "bg-blue-600 border-blue-300 text-white"
                                }`}>
                                  <MapPin className="w-4 h-4 shrink-0" />
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Selected map tooltips popover card */}
                    {selectedMapPin && (
                      <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white border border-slate-250 p-4 rounded-2xl shadow-2xl z-30 animate-in slide-in-from-bottom duration-250 text-left space-y-3 font-sans">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5 max-w-[80%]">
                            <span className="text-[9px] font-black text-[#5a48ef] uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full inline-block">
                              {selectedMapPin.niche}
                            </span>
                            {selectedMapPin.isCorporatePriority && (
                              <span className="text-[9px] font-black text-purple-705 uppercase tracking-widest bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full inline-block ml-1.5 shadow-sm">
                                👑 {selectedMapPin.corporateTag || "PJ Prioritária"}
                              </span>
                            )}
                            <h5 className="font-extrabold text-xs text-slate-900 leading-tight truncate">{selectedMapPin.name}</h5>
                            <p className="text-[10px] text-slate-400 font-bold truncate">{selectedMapPin.location}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSelectedMapPin(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] border-y py-2 border-slate-100 font-sans">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold block">Nota Google</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <strong className="text-slate-800 text-xs font-semibold">{selectedMapPin.rating.toFixed(1)}</strong>
                              <span className="text-slate-400 font-semibold">({selectedMapPin.reviews})</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-bold block">Gaps Encontrados</span>
                            <div className="flex gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide border uppercase ${
                                selectedMapPin.hasWebsite ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-650"
                              }`}>
                                {selectedMapPin.hasWebsite ? "Site OK" : "Sem Site"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide border uppercase ${
                                selectedMapPin.hasGmbActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                              }`}>
                                {selectedMapPin.hasGmbActive ? "Ficha OK" : "Sem Ficha"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs font-sans">
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed line-clamp-2">
                            {selectedMapPin.gmbAnalysis}
                          </p>
                          <div className="flex justify-between items-center pt-1 gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Score</span>
                              <strong className="bg-[#FEF2F2] border border-[#FEE2E2] text-red-600 px-1.5 py-0.5 rounded-md font-mono font-black text-[10px]">
                                {selectedMapPin.leadScore}%
                              </strong>
                            </div>
                            {leads.find(l => l.name.toLowerCase() === selectedMapPin.name.toLowerCase()) ? (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                <span>Capturado</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleCaptureLead(selectedMapPin);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer max-w-fit uppercase"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Capturar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Floating map legend overlays */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200/85 max-w-xs pointer-events-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Exploração em tempo real</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block animate-ping"></span>
                          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block absolute"></span>
                          <span className="text-xs font-bold text-slate-700">Leads Identificados ({searchResults.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                          <span className="text-xs font-bold text-amber-700">Oportunidades Sem Site ({searchResults.filter(l => !l.hasWebsite).length})</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom zooming buttons */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                      <button 
                        type="button"
                        onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
                        className="w-10 h-10 bg-white shadow-xl hover:bg-slate-50 active:scale-90 rounded-full flex items-center justify-center font-bold text-lg text-slate-800 transition-transform cursor-pointer"
                      >
                        <Plus className="w-5 h-5 pointer-events-none" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setZoom(prev => Math.max(prev - 1, 10))}
                        className="w-10 h-10 bg-white shadow-xl hover:bg-slate-50 active:scale-90 rounded-full flex items-center justify-center font-bold text-lg text-slate-800 transition-transform cursor-pointer"
                      >
                        <Minus className="w-5 h-5 pointer-events-none" />
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: LEADS */}
          {activeTab === "leads" && (
            <div id="tab-leads-view" className="space-y-8 animate-in fade-in duration-300">
              
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão de Leads</h2>
                <p className="text-slate-500 mt-1">Acompanhe, gerencie e converta suas oportunidades em tempo real.</p>
              </div>

              {/* Horizontal filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 hide-scrollbar">
                
                <button 
                  onClick={() => setLeadsFilter("todos")}
                  className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    leadsFilter === "todos" 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Todos ({leads.length})
                </button>

                <button 
                  onClick={() => setLeadsFilter("sem_site")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    leadsFilter === "sem_site" 
                      ? "bg-slate-900 text-white" 
                      : "bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Sem Site ({leads.filter(l => !l.hasWebsite).length})</span>
                </button>

                <button 
                  onClick={() => setLeadsFilter("quente")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    leadsFilter === "quente" 
                      ? "bg-slate-900 text-white" 
                      : "bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Prio Quente ({leads.filter(l => l.leadScore >= 85).length})</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-50 border rounded-full px-3 py-1 ml-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por Nicho..." 
                    value={nicheSearchQuery}
                    onChange={(e) => {
                      setLeadsFilter("nicho");
                      setNicheSearchQuery(e.target.value);
                    }}
                    className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none placeholder-slate-400 max-w-[150px]"
                  />
                </div>

              </div>

              {/* Dynamic captured leads table board */}
              {filteredLeads.length === 0 ? (
                <div id="empty-leads" className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-bold text-slate-600 text-lg">Nenhum lead corresponde ao filtro ativo.</p>
                  <p className="text-sm mt-1">Navegue até a aba de Pesquisa para capturar novos contatos B2B.</p>
                </div>
              ) : (
                <div id="leads-list-grid" className="space-y-4">
                  {filteredLeads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                    >
                      {/* Avatar icon and metadata column */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getAvatarColorForNiche(lead.niche)}`}>
                          <span className="font-extrabold text-[#000000] text-sm">
                            {(lead.name || "").split(" ").slice(0, 2).map(w => w ? w[0] : "").join("") || "LD"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-[16px] text-slate-800 leading-snug">{lead.name}</h3>
                            {lead.leadScore >= 90 && <span className="text-sm">🔥</span>}
                          </div>
                          <p className="text-xs text-slate-450 mt-1 font-semibold flex items-center gap-2">
                            <span>{lead.location}</span>
                            <span className="text-slate-300">•</span>
                            <span>{lead.niche}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status tags and information pillar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {lead.leadScore >= 85 ? (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                            Prioridade Máxima
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                            Qualificado
                          </span>
                        )}

                        {!lead.hasWebsite ? (
                          <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase">
                            Sem Website
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                            Website Ativo
                          </span>
                        )}

                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase font-mono">
                          Score: {lead.leadScore}
                        </span>
                      </div>

                      {/* Immediate conversion triggers */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* WhatsApp generator trigger link */}
                        <button 
                          onClick={() => startAIWithLead(lead)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-[#25D366] text-white hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Mandar WhatsApp</span>
                        </button>

                        <button 
                          onClick={() => setSelectedLeadProfile(lead)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-neutral-800 px-4 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                          <span>Detalhes do Lead</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: MELHORES OPORTUNIDADES */}
          {activeTab === "oportunidades" && (
            <div id="tab-oportunidades-view" className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame className="w-6 h-6 text-rose-500" />
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Melhores Oportunidades</h2>
                  </div>
                  <p className="text-slate-500">Listagem exclusiva de leads com alto potencial de fechamento baseada em gaps digitais e autoridade local.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Exportar Tudo</span>
                  </button>
                </div>
              </div>

              {/* Bento Opportunities matrix */}
              <div id="oportunidades-bento" className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Padaria Bella Massa highlight */}
                <div 
                  onClick={() => setIsBellaMassaExpanded(!isBellaMassaExpanded)}
                  className={`md:col-span-8 bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 cursor-pointer select-none group ${
                    isBellaMassaExpanded ? "border-blue-500 ring-4 ring-blue-50 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow"
                  }`}
                >
                  <div className="absolute top-0 right-0 py-1 px-4 bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl">
                    🔥 RECOMENDADO DA IA
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-700 shrink-0 flex items-center justify-center">
                      <Bookmark className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-800">Padaria e Confeitaria Bella Massa</h3>
                      <p className="text-xs text-slate-400 mt-1 font-bold">Moema, São Paulo • (11) 99876-XXXX</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 group-hover:text-blue-700 font-bold">
                        <span>{isBellaMassaExpanded ? "Recolher análise detalhada" : "Clique para ver a análise técnica completa"}</span>
                        <ChevronRight className={`w-4 h-4 transform transition-transform ${isBellaMassaExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="bg-amber-50 border border-amber-200 text-[#D97706] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      Sem Site Oficial
                    </span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Classificação Alta (4.8)
                    </span>
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      Score: 98
                    </span>
                  </div>

                  <div className="bg-[#f8f9ff] border border-blue-100 p-4 rounded-xl mb-4">
                    <p className="text-[11px] font-bold text-blue-800 uppercase tracking-widest mb-1">ANÁLISE DE OPORTUNIDADE DO MAPS</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      O estabelecimento possui excelente reputação local fundada em 1.200 avaliações de clientes do bairro, sem possuir qualquer portal digital oficial para encomendas. Desenvolva um site básico focado em cardápio digital, convertendo 3x mais contatos rápidos via WhatsApp direto.
                    </p>
                  </div>

                  {/* Expanded hidden content panel */}
                  {isBellaMassaExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-2 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-rose-500" />
                        <span>Relatório de Auditoria Comercial Dedicado</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl">
                          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">🔍 Presença Local & SEO</p>
                          <ul className="text-xs text-slate-600 space-y-2 mt-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span><strong>1.200 avaliações de alta confiança</strong> reais no Google Maps.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">✗</span>
                              <span><strong>Sem site oficial</strong>: Clientes buscam cardápio digital no Maps e não encontram.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">✗</span>
                              <span><strong>Sem indexação</strong>: Não ranqueia organicamente para "padaria Moema delivery".</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50/40 border border-blue-105 p-4 rounded-xl">
                          <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider mb-1">️⚡ Otimização Móvel & Vendas</p>
                          <ul className="text-xs text-slate-600 space-y-2 mt-2 font-medium">
                            <li className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">✗</span>
                              <span><strong>Impostos & Taxas de Delivery</strong>: Depende de apps terceiros que cobram até 27% sobre as vendas.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span><strong>Alto volume semanal</strong>: Potencial de 15 a 45 novos pedidos diretos diários estimulando compras livres de taxas via Whatsapp.</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white p-4 rounded-xl">
                        <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-1">PROPOSTA COMERCIAL SUGERIDA</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Oferecer a criação de um <span className="text-blue-300 font-bold">One-Page Delivery Express</span> customizado para cardápios. Integrar painel simples de carrinho direto para o WhatsApp deles. Valor de configuração inicial estimado em R$ 1.200,00 com suporte preventivo mensal de R$ 150,00.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">Preço estimado do serviço: R$ 1.200</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startAIWithLead(leads[0] || dummyBlankLead);
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 px-4 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gerar Mensagem IA</span>
                    </button>
                  </div>
                </div>

                {/* Sidebar target indicators metrics */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  
                  {/* Quota Funil Card */}
                  <div className="bg-[#1e293b] text-white p-6 rounded-2xl flex-1 flex flex-col justify-between shadow-md relative">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Funil de Atendimento</p>
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-4xl font-extrabold text-white tracking-tight">{dailyQuotaCount}</h4>
                      <p className="text-xs text-slate-300 font-semibold mt-1">Leads qualificados capturados hoje</p>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: "70%" }}></div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-bold">Meta diária: 20 abordagens</p>
                  </div>

                  {/* Canal preferido */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex-1 flex flex-col justify-between">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">CANAL DE MAIOR CONVÊNIO</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center border">
                        <MessageSquare className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">WhatsApp</span>
                        <span className="font-extrabold text-slate-800 text-lg block">82%</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center border">
                        <Globe className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">E-mail</span>
                        <span className="font-extrabold text-slate-800 text-lg block">18%</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Auxiliary recommendations list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* Opportunity cards 2 */}
                {leads.slice(1, 3).map(lead => (
                  <div key={lead.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-extrabold text-lg text-slate-800">{lead.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{lead.location}</p>
                      </div>
                      <span className="bg-amber-100/70 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Score {lead.leadScore}
                      </span>
                    </div>

                    <div className="flex gap-1.5 flex-wrap mb-4">
                      <span className="bg-slate-50 text-slate-500 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded">
                        {lead.niche}
                      </span>
                      <span className="bg-slate-50 text-slate-500 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded">
                        Alta Avaliação ({lead.rating})
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                      {lead.gmbAnalysis}
                    </p>

                    <div className="flex justify-between items-center mt-auto">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white overflow-hidden text-[9px] font-bold flex items-center justify-center">CH</div>
                        <div className="w-7 h-7 rounded-full bg-blue-300 border-2 border-white overflow-hidden text-[9px] font-bold flex items-center justify-center text-blue-800">MP</div>
                      </div>

                      <button 
                        onClick={() => startAIWithLead(lead)}
                        className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 py-1.5 px-3.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>IA Message</span>
                      </button>
                    </div>
                  </div>
                ))}

              </div>

              {/* Bottom informative banner */}
              <div id="ai_comercial_banner" className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg mt-8">
                <div className="absolute -right-16 -top-16 w-52 h-52 bg-blue-600/15 rounded-full blur-2xl"></div>
                
                <div className="z-10 max-w-xl text-center md:text-left">
                  <h3 className="font-extrabold text-2xl tracking-tight text-white mb-2">Acelere sua Atração usando Inteligência de Dados</h3>
                  <p className="text-sm text-slate-350 leading-relaxed font-medium">
                    Abordagens inovadoras personalizadas para cada nicho comercial convertem 3x mais rápido na área do Google Maps. Aproveite as sugestões estruturadas por nossa IA.
                  </p>
                </div>

                <div className="z-10 bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center justify-space outline-none shrink-0 w-full md:w-56 text-center shadow-lg">
                  <div className="bg-blue-600/30 p-3 rounded-full text-blue-300 mb-2">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-sm font-extrabold block text-white">IA Sênior Ativa</span>
                  <span className="text-[11px] text-slate-405 font-bold block mt-0.5">Copywriter B2B Integrado</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: ADSHIVE AI GLOBAL CONSOLE & GENERATOR */}
          {activeTab === "ai_gerador" && (
            <div id="tab-ai-generator-view" className="space-y-8 animate-in fade-in duration-300">
              
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    AdsHive <span className="premium-gradient-text">AI Workspace</span>
                    <span className="bg-gradient-to-r from-[#8B2EFF] to-[#C026FF] text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md shadow-glow-purple leading-none">
                      Gemini Global
                    </span>
                  </h2>
                  <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 text-sm font-semibold">
                    Seu hub inteligente para auditoria, cópias persuasivas e estratégias comerciais de altíssima conversão.
                  </p>
                </div>

                {/* Legacy Mode / Pitch Copy Toggle Button */}
                <button
                  onClick={() => triggerNotification("Você já está na suíte premium! Use os agentes especializados abaixo para máxima conversão comercial.", "info")}
                  className="bg-slate-100 dark:bg-[#1C1C26] border border-slate-200 dark:border-[#2B2B3A] text-slate-700 dark:text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#2B2B3A] transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                >
                  <Briefcase className="w-4 h-4 text-[#8B2EFF]" />
                  <span>SDR Copilot Suite v3.2</span>
                </button>
              </div>

              {/* DYNAMIC AI USAGE CONSUMPTION DASHBOARD CARD */}
              <div className="premium-card-glow p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Metrics */}
                <div className="md:col-span-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#8B2EFF] animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B0B3C1]">Informaçoes de Consumo da Conta</span>
                  </div>

                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Plano Atual: <span className="text-[#C93CFF] uppercase font-black tracking-wider">{aiUsageStats.plan}</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#14141B]/80 border border-[#2B2B3A]/40 p-3 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">ENVIADAS MÊS</span>
                      <span className="text-xl font-black text-white mt-1 block">
                        {aiUsageStats.messagesUsed}
                      </span>
                    </div>

                    <div className="bg-[#14141B]/80 border border-[#2B2B3A]/40 p-3 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500 block">RESTANTES MÊS</span>
                      <span className="text-xl font-black text-[#8B2EFF] mt-1 block">
                        {(session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? "∞" : Math.max(0, aiUsageStats.messagesLimit - aiUsageStats.messagesUsed)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar gauge */}
                <div className="md:col-span-4 flex flex-col justify-center space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#A1A1AA]">
                    <span>Cota Consumida</span>
                    <span>
                      {aiUsageStats.messagesUsed} / { (session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? "Ilimitada" : aiUsageStats.messagesLimit } interações
                    </span>
                  </div>

                  <div className="w-full bg-[#1C1C26] h-3 rounded-full overflow-hidden border border-[#2B2B3A]">
                    <div 
                      className="bg-gradient-to-r from-[#8B2EFF] to-[#C026FF] h-full transition-all duration-700"
                      style={{ 
                        width: `${Math.min(100, (session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? 0.1 : (aiUsageStats.messagesUsed / aiUsageStats.messagesLimit) * 100)}%` 
                      }}
                    ></div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-semibold italic">
                    Período corrente. Reset automático em: {aiUsageStats.lastResetDate ? new Date(aiUsageStats.lastResetDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : "Próximo mês"}
                  </span>
                </div>

                {/* Control Action triggers */}
                <div className="md:col-span-3 flex flex-col gap-2.5">
                  <button
                    onClick={() => setActiveTab("comercial")}
                    className="w-full bg-gradient-to-r from-[#8B2EFF] to-[#C026FF] hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all shadow-glow-purple text-center"
                  >
                    Fazer Upgrade de Plano
                  </button>

                  <button
                    onClick={() => setShowBuyAiPackModal(true)}
                    className="w-full bg-[#1C1C26] hover:bg-[#2B2B3A] border border-[#2B2B3A] text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all text-center"
                  >
                    🚀 Comprar Pacote Extra IA
                  </button>
                </div>
              </div>

              {/* OVERLIMIT UI GATE - CONDITIONAL DISPLAY ON COMPLETION LIMITEXCEEDED */}
              {!((session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com') && aiUsageStats.messagesUsed >= aiUsageStats.messagesLimit ? (
                <div className="bg-rose-500/10 border border-rose-500/25 p-8 rounded-3xl text-center space-y-6 max-w-2xl mx-auto shadow-2xl animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-rose-400">Você atingiu o limite de IA do seu plano.</h3>
                    <p className="text-sm text-[#B0B3C1] max-w-md mx-auto">
                      Sua cota mensal gratuita de <strong>{aiUsageStats.messagesLimit} interações</strong> foi totalmente consumida pelo seu SDR de prospecção.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                      onClick={() => setActiveTab("comercial")}
                      className="bg-white text-slate-900 font-extrabold px-6 py-3 rounded-xl text-xs uppercase hover:bg-slate-50 transition-all cursor-pointer shadow-md"
                    >
                      Ver Planos & Upgrade (Ativação Imediata)
                    </button>

                    <button
                      onClick={() => setShowBuyAiPackModal(true)}
                      className="bg-gradient-to-r from-[#8B2EFF] to-[#C026FF] text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase hover:opacity-90 transition-all cursor-pointer shadow-glow-purple"
                    >
                      Adquirir Cupom Avulso de Prospecção
                    </button>
                  </div>
                </div>
              ) : (
                
                /* CORE CONTAINER - DYNAMIC SPLIT SCREEN */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT: RESOURCES NAVIGATOR MATRIX (8 TOOLS) */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#13111C]/60 border border-slate-200 dark:border-[#2B2B3A]/60 p-6 rounded-2xl shadow-sm space-y-6">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-[#7A7D8B] tracking-wider uppercase block">
                        1. Selecionar Especialidade AI
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] italic">Disponível em tempo de execução para todos</span>
                    </div>

                    {/* The 8 tools buttons grid */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "copiloto", label: "Copiloto Comercial", desc: "Script de vendas, abordagens frias & objeções B2B", icon: "🤖" },
                        { id: "whatsapp", label: "Gerador de WhatsApp", desc: "Copies curtas, persuasivas e ctadas no fecho", icon: "💬" },
                        { id: "email", label: "Gerador de E-mails", desc: "Cold mails refinados com assuntos magnéticos", icon: "✉️" },
                        { id: "auditor", label: "Auditor de Empresa", desc: "Análise geral de GAPs digitais das empresas", icon: "🔍" },
                        { id: "seo", label: "Análise de SEO", desc: "Palavras-chave e orientações de orgânico local", icon: "🚀" },
                        { id: "maps", label: "Análise de Google Maps", desc: "Melhorias de ficha e reputação nos mapas", icon: "📍" },
                        { id: "concorrentes", label: "Análise de Concorrentes", desc: "Comparativos locais de nicho sob a concorrência", icon: "⚔️" },
                        { id: "proposta", label: "Gerador de Propostas", desc: "Escopo comercial formal detalhado de vendas", icon: "📑" }
                      ].map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setActiveAiResource(tool.id as any);
                            // Set high impact standard pre-prompt to facilitate SDR workflow
                            if (tool.id === "copiloto") setAiCustomPrompt("Crie um roteiro comercial inovador para quebrar a objeção de 'Estamos sem orçamento' para esse lead.");
                            else if (tool.id === "whatsapp") setAiCustomPrompt("Gere uma abordagem amigável no WhatsApp de no máximo 3 parágrafos, sugerindo consertar o Maps dele.");
                            else if (tool.id === "email") setAiCustomPrompt("Crie uma cold message fria elegante contendo no assunto uma menção direta ao erro de SEO que encontramos.");
                            else if (tool.id === "auditor") setAiCustomPrompt("Apresente um relatório de auditoria simples de erros técnicos evidenciados no portal.");
                            else if (tool.id === "seo") setAiCustomPrompt("Quais são as 5 principais palavras-chave orgânicas que esse negócio deveria ranquear para dominar a cidade?");
                            else if (tool.id === "maps") setAiCustomPrompt("Como esse lead pode otimizar as fotos e revisões negativas para conseguir mais chamadas no GMB?");
                            else if (tool.id === "concorrentes") setAiCustomPrompt("Como podemos argumentar contra o maior concorrente dele que já tem site estabelecido?");
                            else if (tool.id === "proposta") setAiCustomPrompt("Crie uma estrutura de proposta com escopo de SEO Local no valor de R$800/mês cobrindo 3 meses de serviço.");
                          }}
                          className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-all cursor-pointer ${
                            activeAiResource === tool.id 
                              ? "bg-[#8B2EFF]/10 border-[#8B2EFF] text-slate-900 dark:text-white ring-2 ring-[#8B2EFF]/20" 
                              : "bg-slate-50 dark:bg-[#14141B] border-slate-200 dark:border-[#2B2B3A] text-slate-800 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#1C1C26]"
                          }`}
                        >
                          <span className="text-xl shrink-0 mt-0.5">{tool.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black leading-tight">{tool.label}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{tool.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#2B2B3A] pt-4 space-y-3">
                      
                      {/* COMPANY AUTOMATIC DATA INJECTOR */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-[#7A7D8B] tracking-wider uppercase block">
                          2. Vincular Empresa (Dados Automáticos)
                        </label>
                        
                        <select 
                          value={selectedLeadForAI.id}
                          onChange={(e) => {
                            const nextLead = leads.find(l => l.id === e.target.value);
                            if (nextLead) setSelectedLeadForAI(nextLead);
                          }}
                          className="w-full bg-slate-50 dark:bg-[#14141B] border border-slate-200 dark:border-[#2B2B3A] rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none cursor-pointer transition-all focus:border-[#8B2EFF]"
                        >
                          <option value="">-- Prospecção Genérica (Sem Empresa) --</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.niche})</option>
                          ))}
                        </select>
                      </div>

                      {selectedLeadForAI.id ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/25 p-3 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center gap-1.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>Dados Injetados para Copiloto</span>
                          </div>
                          
                          <div className="text-[10px] text-slate-600 dark:text-[#B0B3C1] leading-relaxed space-y-0.5 font-semibold">
                            <p>🏢 <strong className="text-slate-800 dark:text-white truncate block">{selectedLeadForAI.name}</strong></p>
                            <p>📍 {selectedLeadForAI.location}</p>
                            <p>🌐 Site: {selectedLeadForAI.hasWebsite ? "Sim" : "⚠️ Não Posicionado (GAP!)"}</p>
                            <p>📞 Fone: {selectedLeadForAI.phone || "Nulo"}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-500/5 border border-blue-500/25 p-3 rounded-xl text-[10px] font-semibold text-blue-600 dark:text-[#8B2EFF] leading-normal">
                          💡 Selecione uma empresa acima da sua lista para que o AdsHive AI injete e cruze automaticamente todas as informações comerciais do lead na geração!
                        </div>
                      )}

                    </div>

                  </div>

                  {/* RIGHT: INTERACTIVE GENERATION CONTROLS & RESPONSE WORKSPACE */}
                  <div className="lg:col-span-8 bg-white dark:bg-[#13111C]/60 border border-slate-200 dark:border-[#2B2B3A]/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-5">
                    
                    <div className="space-y-4">
                      
                      {/* Section details */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#14141B] p-3 rounded-xl border border-slate-200 dark:border-[#2B2B3A]">
                        <div>
                          <span className="text-[10px] font-extrabold text-[#8B2EFF] uppercase tracking-widest pl-1 block">
                            Módulo Ativo
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {activeAiResource === "copiloto" && "🤖 Copiloto Comercial B2B"}
                            {activeAiResource === "whatsapp" && "💬 Gerador de Cópias WhatsApp"}
                            {activeAiResource === "email" && "✉️ Gerador de Cold Mail"}
                            {activeAiResource === "auditor" && "🔍 Auditor Digital de Leads"}
                            {activeAiResource === "seo" && "🚀 Consultoria de SEO Local"}
                            {activeAiResource === "maps" && "📍 Otimizador do Google Maps"}
                            {activeAiResource === "concorrentes" && "⚔️ Estrategista de Concorrentes"}
                            {activeAiResource === "proposta" && "📑 Gerador de Propostas Comerciais"}
                          </span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Gemini Flash Ativo
                        </span>
                      </div>

                      {/* Custom prompt input detail */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-[#7A7D8B] tracking-wider uppercase block">
                          3. Defina sua Pergunta ou Instrução Adicional
                        </label>
                        
                        <textarea
                          placeholder="Ex: Crie um pitch de vendas altamente agressivo focado no retorno financeiro rápido para este lead..."
                          value={aiCustomPrompt}
                          onChange={(e) => setAiCustomPrompt(e.target.value)}
                          className="w-full h-24 bg-slate-50 dark:bg-[#14141B] border border-slate-200 dark:border-[#2B2B3A] rounded-xl p-3 font-semibold text-xs leading-relaxed text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#1C1C26] focus:ring-2 focus:ring-[#8B2EFF]/20 focus:border-[#8B2EFF] outline-none resize-none transition-all"
                        />
                      </div>

                      {/* Trigger button */}
                      <button
                        onClick={handleRunAdsHiveAIInteract}
                        disabled={isGeneratingAiCustom}
                        className="w-full bg-gradient-to-r from-[#8B2EFF] to-[#C026FF] hover:opacity-95 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-glow-purple active:scale-95 cursor-pointer disabled:pointer-events-none"
                      >
                        {isGeneratingAiCustom ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Acessando Provedor de IA AdsHive... (Gemini)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span>Executar Análise Inteligente Integrada</span>
                          </>
                        )}
                      </button>

                    </div>

                    {/* RESPONSE VIEWER GLASS PANEL */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-[#14141B] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2B2B3A]">
                        <span className="text-[10px] font-extrabold text-[#A1A1AA] uppercase tracking-widest pl-1">
                          RESULTADO DA GERAÇÃO ADSHIVE AI
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Completo em PT-BR
                        </span>
                      </div>

                      <div className="bg-[#0B0B0F]/90 border border-[#2B2B3A]/80 rounded-2xl p-4 sm:p-5 font-sans min-h-[320px] max-h-[440px] overflow-y-auto text-sm leading-relaxed text-slate-200 relative selection:bg-purple-900 shadow-inner">
                        {customAIResponseOutput ? (
                          <div className="whitespace-pre-line space-y-4 pr-1 text-[#D1D5DB]">
                            {customAIResponseOutput}
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-2">
                            <Sparkles className="w-10 h-10 text-[#8B2EFF]/40 animate-pulse" />
                            <h4 className="text-[#A1A1AA] font-black text-xs uppercase tracking-wide">Workspace Aguardando Processamento</h4>
                            <p className="text-[11px] text-slate-500 max-w-xs font-semibold">
                              Escolha uma das 8 especialidades da IA na lateral, indique seu lead-alvo e clique no botão acima para colher copies de impacto no ato!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Panel Footer Toolbar */}
                      {customAIResponseOutput && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            onClick={() => {
                              const cleanPhone = selectedLeadForAI.phone ? selectedLeadForAI.phone.replace(/[^0-9]/g, "") : "";
                              if (cleanPhone) {
                                const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(customAIResponseOutput.substring(0, 900))}`;
                                window.open(url, "_blank");
                                triggerNotification("Abordagem enviada para o WhatsApp!", "success");
                              } else {
                                triggerNotification("Lead sem telefone cadastrado! Copie o material no botão ao lado.", "warning");
                              }
                            }}
                            className="flex-1 bg-[#25D366] hover:bg-emerald-600 text-white py-3 rounded-xl font-extrabold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span>Mandar abordado pelo WhatsApp</span>
                          </button>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(customAIResponseOutput);
                                triggerNotification("Cópia de conteúdo copiada para sua área de transferência!", "success");
                              }}
                              className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-[#1C1C26] dark:hover:bg-[#2B2B3A] border border-slate-200 dark:border-[#2B2B3A] text-slate-700 dark:text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Copiar Conteúdo</span>
                            </button>

                            <button
                              onClick={handleRunAdsHiveAIInteract}
                              className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-[#1C1C26] dark:hover:bg-[#2B2B3A] border border-slate-200 dark:border-[#2B2B3A] text-slate-700 dark:text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Regerar</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB: OWNER DASHBOARD */}
          {activeTab === "dashboard-owner" && (
            <div id="tab-owner-dashboard-view" className="space-y-8 animate-in fade-in duration-300">
              <OwnerDashboard 
                session={session} 
                triggerNotification={triggerNotification} 
                onClose={() => setActiveTab("inicio")} 
              />
            </div>
          )}

          {/* TAB: OWNER SYSTEM HEALTH */}
          {activeTab === "system-health" && (
            <div id="tab-owner-system-health-view" className="space-y-8 animate-in fade-in duration-300">
              <SystemHealthDashboard 
                triggerNotification={triggerNotification} 
              />
            </div>
          )}

          {/* TAB 6: CONFIGURAÇÕES ADMIN */}
          {activeTab === "admin" && (
            <div id="tab-admin-view" className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <span>Configurações do Gestor</span>
                  </h2>
                  <p className="text-slate-500 mt-1">Configure as credenciais e parâmetros operacionais do profissional usuário do sistema.</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Modo Administrativo Ativo</span>
                </div>
              </div>

              {/* Sub tabs nested in administration */}
              <div className="flex border-b border-slate-200 gap-4">
                <button 
                  onClick={() => setAdminSubTab("perfil")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${adminSubTab === "perfil" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  Perfil Profissional & IA
                </button>
                {session?.email?.toLowerCase() === "douglasbateriacma@gmail.com" && (
                  <button 
                    onClick={() => setAdminSubTab("creditos")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${adminSubTab === "creditos" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                  >
                    Gestão Comercial de Créditos & Métricas
                  </button>
                )}
              </div>

              {adminSubTab === "creditos" && session?.email?.toLowerCase() === "douglasbateriacma@gmail.com" && (
                <AdminCredits session={session} triggerNotification={triggerNotification} />
              )}

              {adminSubTab === "perfil" &&
                /* Bento Grid panels */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Information update card */}
                <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">Perfil Profissional</h3>
                    <p className="text-xs text-slate-400 font-semibold">Estas informações identificam você no cabeçalho do applet e personalizam os fechamentos de prospecção.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      localStorage.setItem("manager_name", managerName);
                      localStorage.setItem("manager_role", managerRole);
                      localStorage.setItem("manager_company", managerBusiness);
                      localStorage.setItem("manager_phone", managerPhone);
                      localStorage.setItem("manager_email", managerEmail);
                      localStorage.setItem("manager_signature", managerSignature);
                      triggerNotification("Perfil profissional do Gestor salvo com sucesso!", "success");
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Nome Completo</label>
                        <input 
                          type="text" 
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Ex: Douglas CMA"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Cargo / Função</label>
                        <input 
                          type="text" 
                          value={managerRole}
                          onChange={(e) => setManagerRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Ex: Consultor de Vendas Sênior"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Razão / Agência</label>
                        <input 
                          type="text" 
                          value={managerBusiness}
                          onChange={(e) => setManagerBusiness(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Ex: AdsHive Prospect Pro"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">WhatsApp Comercial</label>
                        <input 
                          type="text" 
                          value={managerPhone}
                          onChange={(e) => setManagerPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Ex: +55 (11) 99876-5432"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">E-mail Corporativo</label>
                        <input 
                          type="email" 
                          value={managerEmail}
                          onChange={(e) => setManagerEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Ex: gestor@seuprovedor.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Assinatura Dinâmica de Vendas</label>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">Inserida no rodapé do Pitch</span>
                      </div>
                      <input 
                        type="text" 
                        value={managerSignature}
                        onChange={(e) => setManagerSignature(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="Ex: Douglas - Head de Soluções Locais na AdsHive Prospect"
                        required
                      />
                    </div>

                    <div className="pt-4 border-t flex flex-wrap gap-3 justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm("Deseja redefinir os dados para os padrões de sistema?")) {
                            setManagerName("Douglas CMA");
                            setManagerRole("Vendedor Sênior");
                            setManagerBusiness("AdsHive Prospect Pro");
                            setManagerPhone("+55 (11) 99876-5432");
                            setManagerEmail("douglasbateriacma@gmail.com");
                            setManagerSignature("Douglas - CEO na AdsHive Prospect Consultoria");
                            localStorage.removeItem("manager_name");
                            localStorage.removeItem("manager_role");
                            localStorage.removeItem("manager_company");
                            localStorage.removeItem("manager_phone");
                            localStorage.removeItem("manager_email");
                            localStorage.removeItem("manager_signature");
                            triggerNotification("Valores restaurados ao padrão!", "info");
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs active:scale-95 transition-all text-center cursor-pointer"
                      >
                        Restaurar Padrões
                      </button>

                      <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        Salvar Informações Profissionais
                      </button>
                    </div>

                  </form>
                </div>

                {/* System variables simulation and telemetry */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Credit manager simulation balance */}
                  <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-base text-white">Saldo de Créditos</h3>
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mb-6">Ajuste o saldo para simular campanhas de captação de leads em escala.</p>
                      
                      <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-bold">Créditos de prospecção:</span>
                          <span className="font-mono text-lg font-black text-blue-400">{credits}</span>
                        </div>

                        {/* Slide adjusting credits */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400">
                            <span>Mínimos (200)</span>
                            <span>Máximo (5000)</span>
                          </div>
                          <input 
                            type="range" 
                            min="200" 
                            max="5000" 
                            step="50"
                            value={credits} 
                            onChange={(e) => setCredits(parseInt(e.target.value))}
                            className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-bold">Cota recomendada diária:</span>
                          <span className="font-mono text-sm font-black text-amber-400">{dailyQuotaCount} leads</span>
                        </div>

                        {/* Counter Adjuster */}
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setDailyQuotaCount(prev => Math.max(5, prev - 1))}
                            className="flex-1 bg-white/5 hover:bg-white/10 py-2 border border-white/10 rounded-lg text-white font-black active:scale-95 transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDailyQuotaCount(prev => Math.min(50, prev + 1))}
                            className="flex-1 bg-white/5 hover:bg-white/10 py-2 border border-white/10 rounded-lg text-white font-black active:scale-95 transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-6 text-[10px] text-slate-500 font-mono text-center">
                      CRÉDITOS SALVOS EM TEMPO REAL
                    </div>
                  </div>

                  {/* Prospec-stats summary card */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl">
                    <h3 className="font-bold text-[#312E81] text-sm mb-2 uppercase tracking-wide">Fórmula de Conversão</h3>
                    <p className="text-xs text-indigo-900 font-semibold leading-relaxed mb-4">
                      Com as métricas atuais de {credits} créditos e {dailyQuotaCount} capturas de teto, estimamos uma tração comercial semanal de:
                    </p>

                    <div className="space-y-2 font-semibold text-xs text-indigo-950">
                      <div className="bg-white/60 p-2.5 rounded-lg flex justify-between">
                        <span>Primeiras abordagens:</span>
                        <span className="font-bold">{dailyQuotaCount * 7} / semana</span>
                      </div>
                      <div className="bg-white/60 p-2.5 rounded-lg flex justify-between">
                        <span>Reuniões Agendadas:</span>
                        <span className="font-bold">{Math.round((dailyQuotaCount * 7) * 0.28)} (~28%)</span>
                      </div>
                      <div className="bg-white/60 p-2.5 rounded-lg flex justify-between">
                        <span>Contratos Fechados:</span>
                        <span className="font-bold text-emerald-700">{Math.round((dailyQuotaCount * 7) * 0.12)} estimados</span>
                      </div>
                    </div>
                  </div>

                  {/* Aparência do Sistema - Custom Premium Widget */}
                  <div className={`border p-6 rounded-3xl shadow-sm space-y-4 transition-all duration-300 ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1C1C26] border-[#2B2B3A] text-white shadow-glow-purple'}`}>
                    <div>
                      <h3 className={`font-black text-sm flex items-center gap-2 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        <span>🎨</span>
                        <span>Aparência & Interface</span>
                      </h3>
                      <p className={`text-[11px] font-semibold mt-0.5 ${themeMode === 'light' ? 'text-slate-400' : 'text-[#7A7D8B]'}`}>Estilize o seu ambiente AdsHive Prospect para otimizar foco e conforto visual.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange("dark")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          appearanceChoice === "dark" 
                            ? "bg-[#8B2EFF] text-white border-[#8B2EFF] shadow-glow-purple" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#14141B] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/80"
                        }`}
                      >
                        🌙 Escuro
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange("light")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          appearanceChoice === "light" 
                            ? "bg-[#8B2EFF] text-white border-[#8B2EFF] shadow-glow-purple" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#14141B] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/80"
                        }`}
                      >
                        ☀️ Claro
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange("system")}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          appearanceChoice === "system" 
                            ? "bg-[#8B2EFF] text-white border-[#8B2EFF] shadow-glow-purple" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#14141B] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/80"
                        }`}
                      >
                        🖥️ Sistema
                      </button>
                    </div>

                    <div className={`text-[10px] font-medium leading-relaxed p-2.5 rounded-xl border ${themeMode === 'light' ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-[#14141B]/50 border-slate-800 text-[#7A7D8B]'}`}>
                      O modo padrão é o <strong className={themeMode === 'light' ? 'text-black' : 'text-white'}>Dark Mode</strong> premium. Suas preferências de tema são sincronizadas localmente no cache do seu navegador e persistidas instantaneamente no <code className="text-[#8B2EFF] font-black">localStorage.theme</code> para as próximas visitas.
                    </div>
                  </div>

                </div>
              </div>
              }
            </div>
          )}

          {/* TAB 7: KANBAN CRM */}
          {activeTab === "crm" && (
            <div id="tab-crm-view" className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kanban CRM</h2>
                  <p className="text-slate-500 mt-1">Gerencie a evolução das prospecções B2B do time.</p>
                </div>
                <div className="px-3.5 py-1.5 bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Nível de Acesso: {session?.role}
                </div>
              </div>
              <KanbanCRM 
                leads={leads} 
                setLeads={setLeads} 
                currentUserRole={session?.role as any} 
                userRole={session?.role}
                isReadOnly={session?.subscriptionStatus === "PAST_DUE"}
                triggerNotification={triggerNotification} 
              />
            </div>
          )}

          {/* TAB 8: RADAR DIGITAL B2B */}
          {activeTab === "radar" && (
            <div id="tab-radar-view" className="space-y-6 animate-in fade-in duration-300 font-sans">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Radar de Gaps Digitais</h2>
                <p className="text-slate-500 mt-1">Dossiê profundo de falhas de marketing, SEO Local e presença nos Ads.</p>
              </div>
              <RadarDigital leads={leads} triggerNotification={triggerNotification} />
            </div>
          )}

          {/* TAB 9: PAINEL COMERCIAL FINANCEIRO */}
          {activeTab === "comercial" && (
            <div id="tab-comercial-view" className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel e Financeiro</h2>
                <p className="text-slate-500 mt-1">Acompanhe MRR de suporte, funis automáticos de follow-up e assinaturas integradas.</p>
              </div>
              <ComercialDash 
                leads={leads} 
                currentPlan={session?.plan || 'Pro'} 
                onChangePlan={(selectedPlan) => {
                  if (session) {
                    setSession({ ...session, plan: selectedPlan });
                    triggerNotification(`Plano SaaS atualizado com sucesso para o plano ${selectedPlan}!`, "success");
                  }
                }} 
                triggerNotification={triggerNotification} 
                userId={session?.id}
                userRole={session?.role}
              />
            </div>
          )}

          {/* TAB 10: AGENDA COMERCIAL */}
          {activeTab === "agenda" && (
            <div id="tab-agenda-view" className="w-full overflow-hidden space-y-6 animate-in fade-in duration-300">
              <AgendaComercial 
                leads={leads} 
                setLeads={setLeads} 
                triggerNotification={triggerNotification} 
                userId={session?.id}
                userRole={session?.role}
                session={session}
              />
            </div>
          )}

          {/* TAB: FINANCEIRO DO CLIENTE */}
          {(activeTab === "financeiro" || activeTab === "loja_creditos") && (
            <Financeiro 
              session={session}
              triggerNotification={triggerNotification}
              setActiveTab={setActiveTab}
              themeMode={themeMode}
            />
          )}

        </main>
      </div>

      {/* Buy AI Package Modal Overlay */}
      {showBuyAiPackModal && (
        <div id="modal-buy-ai-pack" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#111116] rounded-3xl w-full max-w-lg border border-[#2B2B3A] shadow-2xl overflow-y-auto max-h-[92vh] relative p-6 sm:p-8 text-center space-y-5 my-auto">
            
            <button 
              onClick={() => setShowBuyAiPackModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-[#8B2EFF]/10 border border-[#8B2EFF]/25 text-[#8B2EFF] rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <Sparkles className="w-8 h-8 text-[#C026FF]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest text-[#B0B3C1] uppercase bg-[#8B2EFF]/10 px-2 py-1 rounded">Expansão de AI Inteligente</span>
              <h3 className="text-2xl font-black text-white tracking-tight">Cotas de Abordagem para SDR</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                Selecione um pacote de créditos avulsos temporários de IA. Os créditos são adicionados no ato e não expiram com a mensalidade regular!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left">
              {[
                { id: "ai_100", label: "Pacote Iniciante Pro", limit: "100 interações", price: "R$ 10", desc: "Perfeito para novos nichos regionais" },
                { id: "ai_500", label: "Pacote Equipes Ativas", limit: "500 interações", price: "R$ 40", desc: "Mais vendido entre SDRs digitais" },
                { id: "ai_1000", label: "Pacote Alta Escala", limit: "1000 interações", price: "R$ 70", desc: "Custo-benefício otimizado de prospecção" }
              ].map((pack) => (
                <button
                  key={pack.id}
                  disabled={isProcessingAiPackPurchase}
                  onClick={() => handlePurchaseAiPackage(pack.id)}
                  className="w-full bg-[#14141B]/80 hover:bg-[#1C1C26] border border-[#2B2B3A] hover:border-[#8B2EFF] p-4 rounded-2xl flex items-center justify-between group transition-all duration-200 cursor-pointer disabled:opacity-55"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white group-hover:text-[#C026FF]">{pack.label}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{pack.desc}</p>
                    <span className="inline-block bg-[#8B2EFF]/10 text-[#8B2EFF] text-[10px] uppercase font-black px-2 py-0.5 rounded mt-1">{pack.limit}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold block">Cobrança única</span>
                    <span className="text-lg font-black text-white">{pack.price}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-[9px] text-[#A1A1AA] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 justify-center">
                <span>⚡ Ativação automática no ato após PIX</span>
                <span>•</span>
                <span>Segurança de dados padrão AdsHive</span>
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Premium Lockout Blocker Modal Overlay */}
      {showPremiumBlockerModal && (
        <div id="modal-premium-blocker" className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden relative p-8 text-center space-y-6">
            
            <button 
              onClick={() => setShowPremiumBlockerModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest text-[#8B2EFF] uppercase">Limite Excedido • Plano Gratuito</span>
              <h3 id="modal-title-free-limit" className="text-2xl font-black text-slate-900 tracking-tight">Você utilizou seus 10 leads gratuitos.</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                Seu limite de testes gratuitos do AdsHive Prospect foi atingido. Ative seu plano completo agora ou compre mais créditos avulsos no painel financeiro.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5 text-left text-xs text-slate-600 font-semibold font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Pesquisa de leads ilimitada no Google Maps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Verificação de presença digital, Pixel, site e SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Abordagens ultrarrealistas geradas por nossa Inteligência Artificial</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="modal-btn-buy-credits"
                onClick={() => {
                  setShowPremiumBlockerModal(false);
                  setActiveTab("financeiro");
                  triggerNotification("Redirecionando para compra de créditos no Financeiro...", "info");
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 px-6 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>Comprar Créditos</span>
              </button>
              <button
                id="modal-btn-subscribe"
                onClick={() => {
                  setShowPremiumBlockerModal(false);
                  setActiveTab("comercial");
                  triggerNotification("Redirecionando para nossos planos de assinatura...", "info");
                }}
                className="flex-1 bg-[#8B2EFF] hover:bg-[#7a22ef] text-white font-black py-3.5 px-6 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-glow-purple"
              >
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                <span>Assinar Plano</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Nenhuma fidelidade obrigatória • Cancele quando quiser
            </p>

          </div>
        </div>
      )}

      {/* Dynamic Profile Detailed Modal Overlay Popup */}
      {selectedLeadProfile && (
        <div id="modal-lead-profile" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal top overlay panel banner */}
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 relative shrink-0">
              <button 
                id="btn-close-modal"
                onClick={() => setSelectedLeadProfile(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors active:scale-95 outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="bg-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-3 shadow-md">
                Qualificação {selectedLeadProfile.leadScore}%
              </span>
              <h3 className="font-extrabold text-2xl tracking-tight leading-tight mb-2 truncate pr-10">{selectedLeadProfile.name}</h3>
              <p className="text-slate-300 font-medium text-xs flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedLeadProfile.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{selectedLeadProfile.niche}</span>
              </p>
            </div>

            {/* Modal contents */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Gap Analysis Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Diagnóstico do Perfil de Negócio (Google Gaps)</h4>
                <div className="bg-[#f8f9ff] border p-4 rounded-2xl italic text-slate-600 text-sm leading-relaxed">
                  "{selectedLeadProfile.gmbAnalysis}"
                </div>
              </div>

              {/* Attributes row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Nota Google</span>
                  <div className="flex items-center justify-center gap-1 text-slate-800 font-extrabold">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{selectedLeadProfile.rating}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Avaliações</span>
                  <span className="font-extrabold text-slate-800">{selectedLeadProfile.reviews}</span>
                </div>

                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Website Próprio</span>
                  {selectedLeadProfile.hasWebsite ? (
                    <span className="text-xs font-bold text-slate-600 uppercase flex items-center justify-center gap-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Ativo
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 uppercase">Não</span>
                  )}
                </div>

                <div className="bg-slate-50 border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Telefone Google</span>
                  <span className="text-xs font-medium text-slate-800 truncate block">
                    {selectedLeadProfile.phone !== "" ? selectedLeadProfile.phone : "Não exibe"}
                  </span>
                </div>
              </div>

              {/* Professional Website Analysis & Google Stitch Integration */}
              {(() => {
                const analysis = generateLeadWebsiteAnalysis(selectedLeadProfile);
                return (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Estudo Técnico: Novo Site de Conversão</h4>
                    </div>

                    {/* Strengths vs Competitors Gaps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pontos Fortes do Lead */}
                      <div className="bg-emerald-50/35 border border-emerald-100 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">✓ Pontos Fortes a Explorar</span>
                        <ul className="space-y-1.5 mt-2">
                          {analysis.leadStrengths.map((str, idx) => (
                            <li key={idx} className="text-xs text-slate-600 font-semibold leading-relaxed flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pontos Fracos dos Concorrentes */}
                      <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block mb-1">✗ Fraquezas dos Concorrentes na Região</span>
                        <ul className="space-y-1.5 mt-2">
                          {analysis.competitorWeaknesses.map((weak, idx) => (
                            <li key={idx} className="text-xs text-slate-600 font-semibold leading-relaxed flex items-start gap-1.5">
                              <span className="text-rose-500 font-semibold">✗</span>
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommended Structure Layout */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📐 Arquitetura do Site Ideal</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {analysis.recommendedStructure.map((struct, idx) => (
                          <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                            <span className="text-xs font-extrabold text-slate-800 block mb-1">
                              {idx + 1}. {struct.sectionName}
                            </span>
                            <span className="text-[11px] text-slate-400 leading-normal block font-semibold">
                              {struct.description}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200/60 pt-3 mt-2">
                        <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                          🎨 <strong className="text-slate-800 font-bold">Diretriz Visual recomendável:</strong> {analysis.colorsSuggestion}
                        </div>
                      </div>
                    </div>

                    {/* Google Stitch Integration CTA Container */}
                    {(session?.plan || 'Gratuito').toLowerCase() === 'gratuito' || (session?.plan || 'Gratuito').toLowerCase() === 'free' ? (
                      <div className="bg-gradient-to-tr from-slate-900 via-indigo-950/90 to-slate-900 text-white rounded-3xl p-5 border border-indigo-900 shadow-md relative overflow-hidden text-center min-h-[220px]">
                        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col justify-center items-center p-4 z-10 text-center">
                          <Globe className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
                          <h5 className="font-extrabold text-sm text-amber-400">Google Stitch Bloqueado</h5>
                          <p className="text-[11px] text-zinc-300 max-w-xs mx-auto mt-0.5 leading-relaxed font-semibold">
                            A integração avançada com o Google Stitch para criação automática de sites experimentais está disponível apenas para parceiros comerciais premium.
                          </p>
                          <button 
                            onClick={() => {
                              setSelectedLeadProfile(null);
                              setActiveTab("comercial");
                              setShowPremiumBlockerModal(true);
                            }}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-[10px] uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            Liberar Integrações
                          </button>
                        </div>
                        {/* Dummy background layout */}
                        <div className="opacity-10 pointer-events-none select-none">
                          <h5 className="font-extrabold text-sm text-white">Criar e implantar site experimental</h5>
                          <div className="bg-black/30 rounded-xl p-3 mb-2 text-[11px]">
                            {analysis.stitchPrompt}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-indigo-900 shadow-md relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-550/10 rounded-full blur-lg"></div>
                        
                        <div className="flex items-center gap-2 mb-2 animate-pulse">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Criador de Portais Google Stitch</span>
                        </div>

                        <h5 className="font-extrabold text-sm text-white">Criar e implantar site experimental</h5>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1 font-semibold mb-4">
                          O Google Stitch permite prototipar sites funcionais instantâneos a partir de prompts descritivos estruturados. Copie nosso briefing e envie-o.
                        </p>

                        <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-4 text-[11px] text-slate-300 font-mono select-all max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {analysis.stitchPrompt}
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(analysis.stitchPrompt);
                              triggerNotification("Briefing técnico copiado! Cole-o no editor do Google Stitch.", "success");
                            }}
                            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Briefing</span>
                          </button>

                          <a
                            href="https://stitch.withgoogle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              triggerNotification("Redirecionando para o Stitch! Use o briefing copiado para desenhar a página.", "info");
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-blue-500/15 cursor-pointer active:scale-95 no-underline"
                          >
                            <span>Criar no Google Stitch</span>
                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                          </a>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* Status Modifier dropdown selection for Funnel mapping */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Estágio Comercial no Funil</label>
                <div className="relative">
                  <select
                    value={selectedLeadProfile.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      const transitionItem: any = {
                        id: Math.random().toString(36).substring(2, 9),
                        type: 'status_change',
                        title: 'Estágio do Fluxo Atualizado',
                        description: `Lead alterado de ${selectedLeadProfile.status.toUpperCase()} para: ${newStatus.toUpperCase()}`,
                        createdAt: new Date().toISOString()
                      };
                      setLeads(prev => prev.map(l => {
                        if (l.id === selectedLeadProfile.id) {
                          const updatedTimeline = l.timeline ? [transitionItem, ...l.timeline] : [transitionItem];
                          return { ...l, status: newStatus, timeline: updatedTimeline };
                        }
                        return l;
                      }));
                      setSelectedLeadProfile(prev => {
                        if (!prev) return null;
                        const updatedTimeline = prev.timeline ? [transitionItem, ...prev.timeline] : [transitionItem];
                        return { ...prev, status: newStatus, timeline: updatedTimeline };
                      });
                      triggerNotification(`Estágio do lead "${selectedLeadProfile.name}" atualizado para: ${newStatus.toUpperCase()}`, "success");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="novo">Não Contatado / Novo</option>
                    <option value="interessado">Interessado / Qualificado</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="antigo">Fechado (Contrato Ativo)</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div id="section-recent-activity" className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Histórico de Atividade Recente</h4>
                </div>

                {selectedLeadProfile.timeline && selectedLeadProfile.timeline.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedLeadProfile.timeline.map((act: any) => (
                      <div key={act.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2.5 shadow-sm text-xs">
                        <div className="mt-0.5 shrink-0">
                          {act.type === 'status_change' ? (
                            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          ) : act.type === 'note' ? (
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2 items-start">
                            <span className="font-extrabold text-slate-800 truncate">{act.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {new Date(act.createdAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                            {act.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    Nenhuma atividade registrada para este lead. Mude o estágio acima para iniciar o histórico.
                  </p>
                )}
              </div>

            </div>

            {/* Modal actions footer */}
            <div className="p-6 bg-slate-50 border-t flex flex-wrap justify-end gap-2 shrink-0">
              <button 
                onClick={() => setSelectedLeadProfile(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs active:scale-95 transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button 
                onClick={() => {
                  if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE') {
                    triggerNotification("Seu plano está suspenso devido a faturamento pendente no Asaas. Acesse a aba Assinaturas para regularizar seu acesso.", "warning");
                    return;
                  }
                  setSelectedLeadForDocs(selectedLeadProfile);
                  setSelectedLeadProfile(null);
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 border-none cursor-pointer active:scale-95 shadow-sm"
              >
                <FileText className="w-4 h-4 text-emerald-250 animate-pulse" />
                <span>Emitir Proposta & Contrato (Fase 5)</span>
              </button>

              <button 
                onClick={() => {
                  startAIWithLead(selectedLeadProfile);
                  setSelectedLeadProfile(null);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-1 border-none cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Gerar Abordagem Personalizada</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedLeadForDocs && (
        <DocumentGenerator
          lead={selectedLeadForDocs}
          onClose={() => setSelectedLeadForDocs(null)}
          triggerNotification={triggerNotification}
        />
      )}

      {/* Persistent Bottom Mobile Navigation Bar */}
      <nav id="mobile-bottom-nav" className={`lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 border-t shadow-xl z-50 transition-all duration-300 ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#14141B] border-[#2B2B3A] text-white'}`}>
        
        <button 
          onClick={() => setActiveTab("inicio")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "inicio" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">Início</span>
        </button>
 
        <button 
          onClick={() => setActiveTab("pesquisa")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "pesquisa" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Search className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1 font-sans">Pesquisa</span>
        </button>
 
        <button 
          onClick={() => setActiveTab("leads")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "leads" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Users className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">Leads</span>
        </button>
 
        <button 
          onClick={() => setActiveTab("oportunidades")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "oportunidades" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Flame className="w-5 h-5 shrink-0 animate-pulse" />
          <span className="text-[10px] font-bold mt-1">Oportunidades</span>
        </button>
 
        <button 
          onClick={() => setActiveTab("ai_gerador")} 
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "ai_gerador" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">IA Pitch</span>
        </button>
 
        <button 
          onClick={() => setActiveTab("admin")} 
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "admin" ? "text-[#8B2EFF]" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">Admin</span>
        </button>
 
      </nav>

      {/* Persistent AI Business Advisor Copilot Floating Button Drawer */}
      <CopilotoIA leads={leads} credits={credits} />

    </div>
  );
}
