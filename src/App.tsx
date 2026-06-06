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
  FileText
} from "lucide-react";
import { initialLeads } from "./initialData";
import { Lead, GeneratedMessage, UserSession } from "./types";
import { generateLeadWebsiteAnalysis } from "./utils/stitchHelper";
import { AuthGate } from "./components/AuthGate";
import { KanbanCRM } from "./components/KanbanCRM";
import { RadarDigital } from "./components/RadarDigital";
import { ComercialDash } from "./components/ComercialDash";
import { CopilotoIA } from "./components/CopilotoIA";
import { DocumentGenerator } from "./components/DocumentGenerator";
import { LojaCreditos } from "./components/LojaCreditos";
import { AdminCredits } from "./components/AdminCredits";
import { collection, getDocs, setDoc, deleteDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  // Authentication & session context
  const [session, setSession] = useState<UserSession | null>(null);

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<"inicio" | "pesquisa" | "leads" | "oportunidades" | "ai_gerador" | "admin" | "crm" | "radar" | "comercial">("inicio");
  
  // Real-time State Lists
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  // Active Manager Config (Admin Dashboard)
  const [managerName, setManagerName] = useState<string>(() => localStorage.getItem("manager_name") || "Douglas CMA");
  const [managerRole, setManagerRole] = useState<string>(() => localStorage.getItem("manager_role") || "Vendedor Sênior");
  const [managerBusiness, setManagerBusiness] = useState<string>(() => localStorage.getItem("manager_company") || "MapsLeads Pro");
  const [managerPhone, setManagerPhone] = useState<string>(() => localStorage.getItem("manager_phone") || "+55 (11) 99876-5432");
  const [managerEmail, setManagerEmail] = useState<string>(() => localStorage.getItem("manager_email") || "douglasbateriacma@gmail.com");
  const [managerSignature, setManagerSignature] = useState<string>(() => localStorage.getItem("manager_signature") || "Douglas - CEO na MapsLeads Consultoria");

  // Pipeline funnel stage counters calculated dynamically
  const countNovo = leads.filter(l => l.status === "novo").length;
  const countInteressado = leads.filter(l => l.status === "interessado").length;
  const countNegociacao = leads.filter(l => l.status === "negociacao").length;
  const countAntigo = leads.filter(l => l.status === "antigo").length;
  const [credits, setCredits] = useState<number>(1240);
  const [dailyQuotaCount, setDailyQuotaCount] = useState<number>(14);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: "success" | "warning" | "info" }>>([]);
  
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
        triggerNotification("💡 Você consumiu 50% dos seus créditos de teste gratuito do MapsLeads!", "info");
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
  
  // Lead detailed profile modal state
  const [selectedLeadProfile, setSelectedLeadProfile] = useState<Lead | null>(null);
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState<Lead | null>(null);

  // Client-side filtering state for "Leads" tab
  const [leadsFilter, setLeadsFilter] = useState<"todos" | "sem_site" | "quente" | "nicho">("todos");
  const [nicheSearchQuery, setNicheSearchQuery] = useState<string>("");

  // AI copywriting generator state
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<Lead>(initialLeads[0]);
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
          const querySnapshot = await getDocs(collection(db, "leads"));
          if (!querySnapshot.empty) {
            const loadedLeads: Lead[] = [];
            querySnapshot.forEach((docSnap) => {
              loadedLeads.push({ id: docSnap.id, ...docSnap.data() } as Lead);
            });
            // Preserving state and seeding ref
            setLeads(loadedLeads);
            lastSyncLeadsRef.current = loadedLeads;
          } else {
            // First run: Seed from initialLeads so a warm CRM welcomes the user
            for (const item of initialLeads) {
              await setDoc(doc(db, "leads", item.id), item);
            }
            setLeads(initialLeads);
            lastSyncLeadsRef.current = initialLeads;
          }
        } catch (err) {
          console.error("Erro carregando leads do Firestore:", err);
          // Safe robust fallback in case of latency or offline state
          setLeads(initialLeads);
          lastSyncLeadsRef.current = initialLeads;
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
            await setDoc(doc(db, "leads", lead.id), lead);
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
            await deleteDoc(doc(db, "leads", prevLead.id));
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

  // Perform Gemini Search for Leads
  const handleSearchLeads = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check SaaS subscriptional status guard
    if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE') {
      triggerNotification("Seu plano está suspenso devido a faturamento pendente no Asaas. Acesse a aba Assinaturas para regularizar seu acesso.", "warning");
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
      const response = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: searchNiche,
          location: searchLocation,
          limit: quantity / 5 // Scale the range input to realistic result lists
        })
      });
      
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
          avatarColor: getAvatarColorForNiche(searchNiche)
        }));
        
        setSearchResults(formattedLeads);
        triggerNotification(`Encontramos ${formattedLeads.length} novos leads do Google Maps!`, "success");
      } else {
        throw new Error("Formato inválido recebido do servidor.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Falha na busca em tempo real. Usando dados offline simulados.", "warning");
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
    if (session?.subscriptionStatus === 'PENDING' || session?.subscriptionStatus === 'OVERDUE') {
      triggerNotification("Seu plano está suspenso devido a faturamento pendente no Asaas. Acesse a aba Assinaturas para regularizar seu acesso.", "warning");
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
      const response = await fetch("/api/message/generate", {
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

  if (!session) {
    return (
      <div id="auth-container" className="min-h-screen bg-slate-950">
        <AuthGate 
          onSignIn={(sess) => {
            setSession(sess);
            setManagerName(sess.name);
            setCredits(sess.credits);
            setManagerRole(sess.role);
            setManagerEmail(sess.email);
            triggerNotification(`Seja bem-vindo de volta, ${sess.name}! Perfil [${sess.role}] ativo com sucesso.`, "success");
            setActiveTab("inicio");
          }} 
        />
        {/* Toast Notification Container for Auth screen */}
        <div id="toast-container" className="fixed top-6 right-6 z-[110] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
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
    <div id="mapsleads-app" className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans transition-all duration-300 pb-20 lg:pb-0">
      
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
      <header id="topbar-nav" className="fixed top-0 left-0 w-full z-50 bg-white border-b border-slate-200 h-16 flex items-center shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 active:scale-95 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-900 bg-clip-text text-transparent">MapsLeads</span>
          </div>

          {/* Dynamic Indicator Visual (Permanente no topo) */}
          <div className="hidden lg:flex items-center gap-6 border-l pl-6 border-slate-200">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plano Atual</span>
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'bg-amber-400 animate-pulse' : (session?.plan || 'Gratuito').toLowerCase() === 'gratuito' ? 'bg-zinc-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'Unlimited Vitalício (Dev)' : (session?.plan || 'Gratuito')}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leads Restantes</span>
              <span className="text-xs font-black text-slate-800">
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' 
                  ? '∞ Ilimitado'
                  : (session?.plan || 'Gratuito').toLowerCase() === 'gratuito'
                    ? `${session?.planCredits !== undefined ? session.planCredits : 10} de 10 restantes`
                    : `${session?.planCredits !== undefined ? session.planCredits : 500} de 500 restantes`
                }
              </span>
            </div>

            <div className="flex flex-col font-mono text-xs">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">Créditos Comprados</span>
              <span className="text-xs font-black text-blue-700">
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? '∞ Privilégio Dev' : `+${session?.purchasedCredits || 0} adicionais`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Credits badge selector */}
            <div id="hdr-credits" className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-semibold text-blue-800">
                {session?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' ? 'Créditos Ilimitados' : `${credits} créditos de prospecção`}
              </span>
            </div>

            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              {/* User badge */}
              <div 
                onClick={() => setActiveTab("admin")}
                className="flex flex-col text-right hidden md:block cursor-pointer hover:opacity-85"
              >
                <span className="text-sm font-bold text-slate-800">{managerName}</span>
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
        <aside id="desktop-sidebar-nav" className="hidden lg:flex fixed left-0 top-16 h-full w-[280px] bg-slate-50 border-r border-slate-200 flex-col py-6 px-4 z-40">
          <div className="px-3 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Plano Atual</p>
              <h4 className="text-sm font-bold text-slate-800">{managerRole}</h4>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: "75%" }}></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{dailyQuotaCount * 12}/1000 leads obtidos</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <button 
              id="sidebar-tab-inicio"
              onClick={() => setActiveTab("inicio")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "inicio" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>Visão Geral</span>
            </button>

            <button 
              id="sidebar-tab-pesquisa"
              onClick={() => setActiveTab("pesquisa")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "pesquisa" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Search className="w-5 h-5 shrink-0" />
              <span>Pesquisa Maps</span>
            </button>

            <button 
              id="sidebar-tab-leads"
              onClick={() => setActiveTab("leads")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "leads" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Gestão de Leads</span>
            </button>

            <button 
              id="sidebar-tab-oportunidades"
              onClick={() => setActiveTab("oportunidades")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "oportunidades" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Flame className="w-5 h-5 shrink-0" />
              <span>Oportunidades</span>
            </button>

            <button 
              id="sidebar-tab-crm"
              onClick={() => setActiveTab("crm")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "crm" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-extrabold" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users2 className="w-5 h-5 shrink-0" />
              <span className="flex items-center gap-1.5">
                <span>Kanban CRM</span>
                <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">Novo</span>
              </span>
            </button>

            <button 
              id="sidebar-tab-radar"
              onClick={() => {
                if (isFeaturePremiumRestricted("Radar Digital Avançado")) return;
                setActiveTab("radar");
              }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "radar" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-extrabold" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-5 h-5 shrink-0" />
              <span>Radar Digital</span>
            </button>

            <button 
              id="sidebar-tab-comercial"
              onClick={() => setActiveTab("comercial")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "comercial" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-extrabold" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <DollarSign className="w-5 h-5 shrink-0" />
              <span>Painel Comercial</span>
            </button>

            <button 
              id="sidebar-tab-ai"
              onClick={() => setActiveTab("ai_gerador")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "ai_gerador" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Gerador de Mensagem IA</span>
            </button>

            <button 
              id="sidebar-tab-loja-creditos"
              onClick={() => setActiveTab("loja_creditos")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "loja_creditos" 
                  ? "bg-amber-50 text-amber-700 border-l-4 border-amber-500 font-extrabold" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Coins className="w-5 h-5 shrink-0 text-amber-500 animate-pulse" />
              <span className="flex items-center gap-1.5">
                <span>Comprar Créditos</span>
                <span className="bg-amber-100 text-amber-850 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Promo</span>
              </span>
            </button>

            <button 
              id="sidebar-tab-admin"
              onClick={() => setActiveTab("admin")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all text-left ${
                activeTab === "admin" 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Configurações Admin</span>
            </button>
          </nav>

          <div className="pt-4 border-t border-slate-200 mt-auto pb-4 px-3 flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <span>MapsLeads v1.6.2</span>
            <span>Premium Server Active</span>
          </div>
        </aside>

        {/* Primary Screen Area depending on activeTab context */}
        <main id="main-content-canvas" className="flex-1 lg:ml-[280px] p-4 md:p-8 pb-24 lg:pb-8 transition-all max-w-7xl mx-auto w-full">
          
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
                    <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold font-mono">+12%</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Total de Empresas</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">12.480</p>
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
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">3.120</p>
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
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">142</p>
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
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">84</p>
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
                          {l.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" 
                            placeholder="Ex: Adega, Pet Shop, Dentista, Informática, Oficina..."
                          />
                        </div>
                        {/* Quick tags suggestions */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["Padaria", "Pet Shop", "Oficina Mecânica", "Dentista", "Restaurante"].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSearchNiche(tag)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                                searchNiche === tag 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                  <div id="map-visualization" className="bg-slate-200 rounded-2xl overflow-hidden h-[450px] relative border border-slate-300 shadow-inner">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuGD6A-MGLQu2vbe8aygva-GX4GMBvC-UXyIA2XTrYpvvMwBHxEGdLMENIqX5PEYzYs33SL27W8HrQ3KYSlfbQSIg_c_Xeit5QJG9WpHwqMpvBdkQZiHzsY6P6OCHKQ3W3WqdiX1ys2JSsFutDk_8uRCIxVtt8LEm2WS2cA11AU7_BLl7O3rWSJACOtEspP6F4cS4wtY0VO67obxXwTe1i-GqwdYrwEl1oCyA0pPSyRJ6hEjTh0G7ZJk-9AYlg3KZtRAQ51oY8jvw" 
                      alt="Mapa de Leads" 
                      className="w-full h-full object-cover grayscale opacity-70"
                    />

                    {/* Floating map legend overlays */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 max-w-xs">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exploração em tempo real</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block animate-ping"></span>
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block absolute"></span>
                          <span className="text-xs font-bold text-slate-700">Leads Identificados ({searchResults.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                          <span className="text-xs font-bold text-slate-700">Oportunidades Sem Site ({searchResults.filter(l => !l.hasWebsite).length})</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom zooming buttons */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
                        className="w-10 h-10 bg-white shadow-xl hover:bg-slate-50 active:scale-90 rounded-full flex items-center justify-center font-bold text-lg text-slate-800 transition-transform cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setZoom(prev => Math.max(prev - 1, 10))}
                        className="w-10 h-10 bg-white shadow-xl hover:bg-slate-50 active:scale-90 rounded-full flex items-center justify-center font-bold text-lg text-slate-800 transition-transform cursor-pointer"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative text-center">
                        <div className="w-4 h-4 bg-blue-600 rounded-full absolute -top-20 left-12 animate-pulse"></div>
                        <div className="w-4 h-4 bg-amber-500 rounded-full absolute -top-8 -left-20 animate-pulse"></div>
                        <div className="w-4 h-4 bg-blue-600 rounded-full absolute top-16 left-32 animate-pulse"></div>
                        <div className="w-4 h-4 bg-amber-500 rounded-full absolute top-24 -left-16 animate-pulse"></div>
                      </div>
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
                            {lead.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
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
                        startAIWithLead(initialLeads[0]);
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

          {/* TAB 5: AI MESSAGE GENERATOR */}
          {activeTab === "ai_gerador" && (
            <div id="tab-ai-generator-view" className="space-y-8 animate-in fade-in duration-300">
              
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Criar Nova Mensagem</h2>
                <p className="text-slate-500 mt-1">Gere abordagens de vendas personalizadas e persuasivas para seus leads qualificados usando Inteligência Artificial (Gemini).</p>
              </div>

              {/* Control panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Params selectors drawer */}
                <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                  
                  {/* Lead selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Selecionar Lead Alvo</label>
                    <select 
                      value={selectedLeadForAI.id}
                      onChange={(e) => {
                        const nextLead = leads.find(l => l.id === e.target.value);
                        if (nextLead) setSelectedLeadForAI(nextLead);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    >
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.niche})</option>
                      ))}
                    </select>
                  </div>

                  {/* Channel selectors row */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Canal de Contato</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["WhatsApp", "E-mail", "Instagram", "LinkedIn"].map((channel) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setSelectedChannel(channel as any)}
                          className={`flex items-center gap-1.5 justify-center py-2 px-3 rounded-lg font-bold text-xs transition-all pointer cursor-pointer ${
                            selectedChannel === channel 
                              ? "bg-slate-950 text-white" 
                              : "bg-slate-50 border hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          {channel === "WhatsApp" && <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                          {channel === "E-mail" && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                          <span>{channel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal and Tone select inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Foco do Serviço (Objetivo)</label>
                      <select 
                        value={selectedGoal}
                        onChange={(e) => setSelectedGoal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="SEO Local">SEO Local (Maps)</option>
                        <option value="Venda de Site">Desenvolvimento de Site</option>
                        <option value="Tráfego Pago">Anúncios Patrocinados (Google Ads)</option>
                        <option value="Gestão de Redes">Gestão de Redes Sociais</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Tom de Voz</label>
                      <select 
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="Persuasivo">Persuasivo & Comercial</option>
                        <option value="Profissional">Profissional & Técnico</option>
                        <option value="Casual">Casual & Amigável</option>
                        <option value="Autoritário">Autoritário & Consultivo</option>
                      </select>
                    </div>
                  </div>

                  {/* Generation Trigger button */}
                  <button 
                    onClick={handleGenerateAICopyMessage}
                    disabled={isGeneratingAI}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Pesquisando Gaps & Criando Copy...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Gerar Coprodução Inteligente</span>
                      </>
                    )}
                  </button>

                </div>

                {/* Text preview copy block */}
                <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">PRÉVIA DA MENSAGEM DO MARKETING</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">IA Ativa</span>
                    </div>

                    <textarea
                      id="ai-pitch-output"
                      value={generatedMessageText}
                      onChange={(e) => setGeneratedMessageText(e.target.value)}
                      className="w-full h-80 bg-[#f8f9ff]/50 border border-slate-200 rounded-xl p-4 font-mono text-sm leading-relaxed text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-105 outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <button 
                      onClick={handleSendViaWhatsApp}
                      className="flex-1 bg-[#25D366] hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Mandar WhatsApp</span>
                    </button>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={copyToClipboard}
                        className="flex-1 sm:flex-none bg-slate-100 border hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Material</span>
                      </button>

                      <button 
                        onClick={handleGenerateAICopyMessage}
                        className="flex-1 sm:flex-none bg-slate-100 border hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Regerar</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>              

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
                <button 
                  onClick={() => setAdminSubTab("creditos")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${adminSubTab === "creditos" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  Gestão Comercial de Créditos & Métricas
                </button>
              </div>

              {adminSubTab === "creditos" && (
                <AdminCredits triggerNotification={triggerNotification} />
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
                          placeholder="Ex: MapsLeads Pro"
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
                        placeholder="Ex: Douglas - Head de Soluções Locais na MapsLeads"
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
                            setManagerBusiness("MapsLeads Pro");
                            setManagerPhone("+55 (11) 99876-5432");
                            setManagerEmail("douglasbateriacma@gmail.com");
                            setManagerSignature("Douglas - CEO na MapsLeads Consultoria");
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
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel Comercial & Monetização</h2>
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

          {/* TAB: LOJA DE CRÉDITOS AVULSOS */}
          {activeTab === "loja_creditos" && (
            <div id="tab-loja-creditos-view" className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Loja de Créditos</h2>
                <p className="text-slate-500 mt-1">Reabasteça seus créditos para continuar decolando sua prospecção de leads e análises inteligentes.</p>
              </div>
              <LojaCreditos 
                userId={session?.id || ''}
                triggerNotification={triggerNotification}
              />
            </div>
          )}

        </main>
      </div>

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
              <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">Limite Atingido • Plano Gratuito</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Liberte o Potencial do MapsLeads!</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                Seu saldo de testes acabou. Faça o upgrade de seu plano comercial ou compre créditos avulsos para continuar extraindo leads e gerando mensagens com inteligência artificial.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5 text-left text-xs text-slate-600 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Pesquisa de leads ilimitada em todo o Brasil</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Auditoria de SSL, Pixel e SEO completos no Radar Digital</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Exportação completa em segundos para planilhas CSV/XLS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Criação ilimitada de pitches ultra-persuasivos com IA</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPremiumBlockerModal(false);
                  setActiveTab("loja_creditos");
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Coins className="w-4 h-4 text-white" />
                <span>Recarregar Créditos</span>
              </button>
              <button
                onClick={() => {
                  setShowPremiumBlockerModal(false);
                  setActiveTab("comercial");
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <DollarSign className="w-4 h-4 text-white" />
                <span>Assinar Plano Mensal</span>
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
        <div id="modal-lead-profile" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Modal top overlay panel banner */}
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 relative">
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
            <div className="p-6 space-y-6">
              
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
            <div className="p-6 bg-slate-50 border-t flex flex-wrap justify-end gap-2">
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
      <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-white border-t border-slate-200 shadow-xl z-50">
        
        <button 
          onClick={() => setActiveTab("inicio")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "inicio" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">Início</span>
        </button>

        <button 
          onClick={() => setActiveTab("pesquisa")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "pesquisa" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Search className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1 font-sans">Pesquisa</span>
        </button>

        <button 
          onClick={() => setActiveTab("leads")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "leads" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">Leads</span>
        </button>

        <button 
          onClick={() => setActiveTab("oportunidades")} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "oportunidades" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Flame className="w-5 h-5 shrink-0 animate-pulse" />
          <span className="text-[10px] font-bold mt-1">Oportunidades</span>
        </button>

        <button 
          onClick={() => setActiveTab("ai_gerador")} 
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "ai_gerador" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold mt-1">IA Pitch</span>
        </button>

        <button 
          onClick={() => setActiveTab("admin")} 
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "admin" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
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
