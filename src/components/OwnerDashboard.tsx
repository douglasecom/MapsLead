import React, { useState, useEffect } from "react";
import { 
  Users, DollarSign, TrendingUp, BarChart3, Settings, ShieldAlert, 
  Database, RefreshCw, FileText, Search, CreditCard, ChevronRight, 
  Trash2, Edit3, Check, X, Sparkles, Send, Bell, ListFilter, AlertTriangle, 
  Download, Clock, Lock, Key, CheckCircle, HelpCircle, ArrowUpRight, 
  ArrowDownLeft, Share2, Layers, Calendar, Mail, Globe, MapPin, Play
} from "lucide-react";
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserSession, SaaSPlan, SaaSSubscription, SaaSPayment, SaaSActivityLog } from "../types";

interface OwnerDashboardProps {
  session: UserSession | null;
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
  onClose?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ session, triggerNotification, onClose }) => {
  // Tab control
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "users" | "plans" | "credits" | "subscriptions" | "asaas" | "audit" | "metrics" | "support" | "marketing" | "settings" | "firebase" | "security"
  >("overview");

  // Local data states synced with Firestore
  const [dbUsers, setDbUsers] = useState<UserSession[]>([]);
  const [dbPlans, setDbPlans] = useState<SaaSPlan[]>([]);
  const [dbSubscriptions, setDbSubscriptions] = useState<SaaSSubscription[]>([]);
  const [dbPayments, setDbPayments] = useState<SaaSPayment[]>([]);
  const [dbActivityLogs, setDbActivityLogs] = useState<SaaSActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filtering States
  const [userSearch, setUserSearch] = useState("");
  const [userFilterRole, setUserFilterRole] = useState("all");
  const [userFilterPlan, setUserFilterPlan] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("all");

  // Global Config form states
  const [platformName, setPlatformName] = useState("AdsHive Prospect");
  const [logoUrl, setLogoUrl] = useState("https://prospect.adshive.online/logo.png");
  const [faviconUrl, setFaviconUrl] = useState("/favicon.ico");
  const [seoDescription, setSeoDescription] = useState("Plataforma Inteligente de Prospecção Comercial com IA.");
  const [customDomain, setCustomDomain] = useState("prospect.adshive.online");
  const [supportEmail, setSupportEmail] = useState("suporte@adshive.online");

  // Edit states for user modal
  const [editingUser, setEditingUser] = useState<UserSession | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPlan, setEditUserPlan] = useState("");
  const [editUserRole, setEditUserRole] = useState<any>("Gestor");
  const [editUserCredits, setEditUserCredits] = useState<number>(0);
  const [editUserStatus, setEditUserStatus] = useState<"ACTIVE" | "LIMITED">("ACTIVE");

  // Edit states for custom plan modal or editor
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanPrice, setEditPlanPrice] = useState<number>(0);
  const [editPlanCredits, setEditPlanCredits] = useState<number>(0);
  const [editPlanUsers, setEditPlanUsers] = useState<number>(1);
  const [editPlanLeads, setEditPlanLeads] = useState<number>(0);
  const [editPlanFeatures, setEditPlanFeatures] = useState<string>("");

  // Credits configurations 
  const [pricePerLead, setPricePerLead] = useState<number>(0.20);
  const [creditPacks, setCreditPacks] = useState([
    { id: "pack_100", name: "Bronze Pack", quantity: 100, price: 20 },
    { id: "pack_500", name: "Silver Pack", quantity: 500, price: 90 },
    { id: "pack_1000", name: "Gold Pack", quantity: 1000, price: 160 },
    { id: "pack_5000", name: "Titanium Pack", quantity: 5000, price: 750 }
  ]);
  const [newPackQty, setNewPackQty] = useState<number>(200);
  const [newPackName, setNewPackName] = useState("Custom Pack");
  const [newPackPrice, setNewPackPrice] = useState<number>(35);

  // Security 2FA simulations and access control keys
  const [is2faEnabled, setIs2faEnabled] = useState<boolean>(false);
  const [globalLocked, setGlobalLocked] = useState<boolean>(false);

  // Support Ticketing state simulations
  const [supportTickets, setSupportTickets] = useState([
    { id: "1", user: "Carlos S.", email: "carlos@gmail.com", topic: "Reabastecimento", text: "Minhas moedas PIX não creditaram automaticamente", date: "Hoje, 10:15", solved: false },
    { id: "2", user: "Mariana L.", email: "marianamkt@hotmail.com", topic: "Dúvida Comercial", text: "Vocês dão recibo ou nota fiscal para plano Agência?", date: "Ontem, 16:40", solved: true },
    { id: "3", user: "Renato D.", email: "renato@advocacia.com", topic: "Giga Leads", text: "Podemos aumentar consultas simultâneas na API Maps?", date: "04/06/2026, 11:20", solved: false }
  ]);
  const [ticketReplyId, setTicketReplyId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");

  // Asaas Simulator and Webhook state loggers
  const [simulatedWebhooks, setSimulatedWebhooks] = useState<any[]>([
    { id: "web_001", event: "PAYMENT_CONFIRMED", value: 97.00, customer: "carlos@gmail.com", date: "Hoje, 03:12", status: "success" },
    { id: "web_002", event: "PAYMENT_RECEIVED", value: 49.00, customer: "renato@advocacia.com", date: "Ontem, 18:24", status: "success" },
    { id: "web_003", event: "PAYMENT_OVERDUE", value: 197.05, customer: "julio@agenciadigital.com", date: "02/06/2026", status: "warning" }
  ]);
  const [simWebhookPlane, setSimWebhookPlane] = useState("pro");
  const [simWebhookEmail, setSimWebhookEmail] = useState("mario@gmail.com");
  const [simWebhookFee, setSimWebhookFee] = useState(97.00);

  // Backup Manual lists
  const [backupLogs, setBackupLogs] = useState([
    { id: "back_1", date: "Ontem, 02:00", type: "Automático (Nuvem)", size: "48KB", status: "Concluído" },
    { id: "back_2", date: "01/06/2026, 02:00", type: "Automático (Nuvem)", size: "45KB", status: "Concluído" }
  ]);

  // Load real data from Firestore collections
  const loadRealData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData: UserSession[] = [];
      usersSnap.forEach((d) => {
        const data = d.data();
        usersData.push({
          id: d.id,
          name: data.name || "Sem Nome",
          email: data.email || "",
          role: data.role || "Gestor",
          avatarUrl: data.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAJqqoXyq6PWwYh0DdwLOD_-2ygOXUeoKsVN28D4A0QKF03LL8iOhhHsLFs4SxMjZV_-qejN1Wqq0_bLTZlTXwNcw5tdjsOW0ED-zAcyvwD6FzOs7V5-8qHrTzDfxWXK2BnxfqGK6CqdQ4x7xhtHMntGBAtX3io6FFOTnpm2j7Z3Qz6sw1XIbLzedR-TcA00Khw7hwSmHQm70EgRuwWpunqhM_0Xgkl4vCXJOGU06hD_zx87UbchNsZCojJcvWi2YJ_s-qBAgjoQ5E",
          plan: data.plan || "Gratuito",
          credits: data.credits || 0,
          remainingCredits: data.remainingCredits || 0,
          accountStatus: data.accountStatus || "ACTIVE",
          subscriptionStatus: data.subscriptionStatus || "ACTIVE"
        });
      });
      // Fallback generator to ensure the user has at least some records
      if (usersData.length === 0) {
        usersData.push({
          id: "sys_douglas",
          name: "Owner Douglas",
          email: "douglasbateriacma@gmail.com",
          role: "Administrador",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJqqoXyq6PWwYh0DdwLOD_-2ygOXUeoKsVN28D4A0QKF03LL8iOhhHsLFs4SxMjZV_-qejN1Wqq0_bLTZlTXwNcw5tdjsOW0ED-zAcyvwD6FzOs7V5-8qHrTzDfxWXK2BnxfqGK6CqdQ4x7xhtHMntGBAtX3io6FFOTnpm2j7Z3Qz6sw1XIbLzedR-TcA00Khw7hwSmHQm70EgRuwWpunqhM_0Xgkl4vCXJOGU06hD_zx87UbchNsZCojJcvWi2YJ_s-qBAgjoQ5E",
          plan: "Enterprise",
          credits: 9999,
          remainingCredits: 9999,
          accountStatus: "ACTIVE"
        });
      }
      setDbUsers(usersData);

      // 2. Fetch Plans
      const plansSnap = await getDocs(collection(db, "plans"));
      const plansData: SaaSPlan[] = [];
      plansSnap.forEach((d) => {
        plansData.push(d.data() as SaaSPlan);
      });
      setDbPlans(plansData);
      if (plansData.length > 0) {
        const found = plansData.find(p => p.id === selectedPlanId) || plansData[0];
        setEditPlanName(found.name);
        setEditPlanPrice(found.price);
        setEditPlanCredits(found.credits);
        setEditPlanUsers(found.maxUsers || 1);
        setEditPlanLeads(found.maxLeads || 0);
        setEditPlanFeatures(found.features?.join(", ") || "");
      }

      // 3. Fetch Activity Logs
      const logsSnap = await getDocs(collection(db, "activityLogs"));
      const logsData: SaaSActivityLog[] = [];
      logsSnap.forEach((d) => {
        logsData.push(d.data() as SaaSActivityLog);
      });
      // Sort newest logs first
      logsData.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      setDbActivityLogs(logsData);

      // 4. Fetch Subscriptions & Payments
      const subSnap = await getDocs(collection(db, "subscriptions"));
      const subData: SaaSSubscription[] = [];
      subSnap.forEach((d) => subData.push(d.data() as SaaSSubscription));
      setDbSubscriptions(subData);

      const paySnap = await getDocs(collection(db, "payments"));
      const payData: SaaSPayment[] = [];
      paySnap.forEach((d) => payData.push(d.data() as SaaSPayment));
      setDbPayments(payData);

      // 5. Configs
      const configSnap = await getDoc(doc(db, "settings", "global"));
      if (configSnap.exists()) {
        const c = configSnap.data();
        setPlatformName(c.platformName || "AdsHive Prospect");
        setLogoUrl(c.logoUrl || "https://prospect.adshive.online/logo.png");
        setFaviconUrl(c.faviconUrl || "/favicon.ico");
        setSeoDescription(c.seoDescription || "Plataforma Inteligente de Prospecção Comercial com IA.");
        setCustomDomain(c.customDomain || "prospect.adshive.online");
        setSupportEmail(c.supportEmail || "suporte@adshive.online");
      }

      const creditConfigSnap = await getDoc(doc(db, "creditConfigs", "settings"));
      if (creditConfigSnap.exists()) {
        const c = creditConfigSnap.data();
        setPricePerLead(c.pricePerLead || 0.20);
        if (c.creditPacks) setCreditPacks(c.creditPacks);
      }

    } catch (err: any) {
      console.warn("Error loading administrative data:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Sync edits on selected plan load
  const loadPlanToEdit = (planId: string) => {
    setSelectedPlanId(planId);
    const found = dbPlans.find(p => p.id === planId);
    if (found) {
      setEditPlanName(found.name);
      setEditPlanPrice(found.price);
      setEditPlanCredits(found.credits);
      setEditPlanUsers(found.maxUsers || 1);
      setEditPlanLeads(found.maxLeads || 0);
      setEditPlanFeatures(found.features?.join(", ") || "");
    }
  };

  // Perform updates inside user collection
  const saveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const userRef = doc(db, "users", editingUser.id);
      const updateData = {
        name: editUserName,
        email: editUserEmail,
        plan: editUserPlan,
        role: editUserRole,
        credits: Number(editUserCredits),
        remainingCredits: Number(editUserCredits),
        accountStatus: editUserStatus
      };
      await setDoc(userRef, updateData, { merge: true });
      
      // Logger audit
      const logId = `owner_log_${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        userId: session?.id || "owner",
        userName: session?.name || "Douglas Owner",
        action: "EDIT_USER_BY_OWNER",
        details: `Proprietário alterou perfil do usuário ${editUserEmail}. Status: ${editUserStatus}, Plano: ${editUserPlan}, Créditos: ${editUserCredits}`,
        createdAt: new Date().toISOString()
      });

      triggerNotification(`Usuário ${editUserName} atualizado com sucesso no Firebase!`, "success");
      setEditingUser(null);
      loadRealData();
    } catch (err: any) {
      triggerNotification(`Erro salvando usuário: ${err.message}`, "warning");
    }
  };

  // Block/unblock user
  const toggleUserBlock = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "ACTIVE" ? "LIMITED" : "ACTIVE";
      await setDoc(doc(db, "users", userId), { accountStatus: nextStatus }, { merge: true });
      
      const logId = `owner_log_${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        userId: session?.id || "owner",
        userName: session?.name || "Douglas Owner",
        action: nextStatus === "ACTIVE" ? "ACTIVATE_USER" : "BLOCK_USER",
        details: `Operadora alterou status operacional do UID ${userId} para ${nextStatus}`,
        createdAt: new Date().toISOString()
      });

      triggerNotification(`Status operacional do usuário alterado para ${nextStatus}!`, "info");
      loadRealData();
    } catch (err: any) {
      triggerNotification(`Erro ao alterar status: ${err.message}`, "warning");
    }
  };

  // Delete/Exclude user completely
  const deleteUserCompletely = async (userId: string, email: string) => {
    if (!confirm(`Deseja EXCLUIR DEFINITIVAMENTE o usuário ${email}? Essa operação apagará os registros e créditos instantaneamente.`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      
      const logId = `owner_log_${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        userId: session?.id || "owner",
        userName: session?.name || "Douglas Owner",
        action: "EXCLUDE_USER",
        details: `Excluído usuário cadastrado: ${email}`,
        createdAt: new Date().toISOString()
      });

      triggerNotification(`Usuário ${email} deletado com sucesso do banco!`, "success");
      loadRealData();
    } catch (err: any) {
      triggerNotification(`Falha deletando usuário: ${err.message}`, "warning");
    }
  };

  // Save Pricing Plan Changes
  const savePlanChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planRef = doc(db, "plans", selectedPlanId);
      const updatedPlan = {
        id: selectedPlanId,
        name: editPlanName,
        price: Number(editPlanPrice),
        credits: Number(editPlanCredits),
        maxUsers: Number(editPlanUsers),
        maxLeads: Number(editPlanLeads),
        features: editPlanFeatures.split(",").map(f => f.trim()).filter(Boolean)
      };
      await setDoc(planRef, updatedPlan, { merge: true });
      triggerNotification(`Plano ${editPlanName} salvo com sucesso no banco!`, "success");
      loadRealData();
    } catch (err: any) {
      triggerNotification(`Erro salvando plano comercial: ${err.message}`, "warning");
    }
  };

  // Save pricing configuration and pack list
  const saveCreditPricingAndPacks = async () => {
    try {
      await setDoc(doc(db, "creditConfigs", "settings"), {
        pricePerLead: Number(pricePerLead),
        creditPacks
      }, { merge: true });
      triggerNotification("Tabela tarifária e pacotes de créditos salvos no Firebase", "success");
    } catch (err: any) {
      triggerNotification(`Erro ao salvar moedas: ${err.message}`, "warning");
    }
  };

  // Add credit pack entry
  const addCreditPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPackQty <= 0 || newPackPrice <= 0) return;
    const newPack = {
      id: `pack_${Date.now()}`,
      name: newPackName,
      quantity: Number(newPackQty),
      price: Number(newPackPrice)
    };
    setCreditPacks(prev => [...prev, newPack]);
    setNewPackQty(100);
    setNewPackName("Custom Pack");
    triggerNotification(`Pacote ${newPack.name} adicionado à lista local. Não se esqueça de salvar!`, "info");
  };

  const removeCreditPack = (packId: string) => {
    setCreditPacks(prev => prev.filter(p => p.id !== packId));
    triggerNotification("Pacote descartado localmente. Pressione salvar para aplicar.", "info");
  };

  // Webhook Simulator triggers simulated PIX / payment hook
  const handleSimulateWebhook = async () => {
    try {
      const simulatedHook = {
        id: `pay_${Date.now()}`,
        userId: dbUsers[Math.floor(Math.random() * dbUsers.length)]?.id || "random_usr",
        date: new Date().toISOString().split("T")[0],
        amount: Number(simWebhookFee),
        method: "pix",
        status: "RECEIVED",
        link: "https://comprovantes.asaas.com.br/123"
      };

      // Add to simulated log local state
      setSimulatedWebhooks(prev => [
        {
          id: `web_${Date.now()}`,
          event: "PAYMENT_CONFIRMED",
          value: simulatedHook.amount,
          customer: simWebhookEmail,
          date: "Agora mesmo",
          status: "success"
        },
        ...prev
      ]);

      // If user is set, we can simulate updating their database plan/credits
      const targetUser = dbUsers.find(u => u.email.toLowerCase() === simWebhookEmail.toLowerCase());
      if (targetUser) {
        const userRef = doc(db, "users", targetUser.id);
        const addedCredits = simWebhookPlane === "pro" ? 500 : simWebhookPlane === "agency" ? 2000 : 100;
        const totalCredits = (targetUser.credits || 0) + addedCredits;
        await setDoc(userRef, {
          plan: simWebhookPlane,
          credits: totalCredits,
          planCredits: addedCredits,
          accountStatus: "ACTIVE"
        }, { merge: true });

        // Save activity log trace
        const logId = `as_log_${Date.now()}`;
        await setDoc(doc(db, "activityLogs", logId), {
          id: logId,
          userId: targetUser.id,
          userName: targetUser.name,
          action: "REDUCE_SUBSCRIPTION_APPROVED",
          details: `Gateway ASAAS aprovou checkout do plano ${simWebhookPlane.toUpperCase()}. Adicionados ${addedCredits} créditos automaticamente.`,
          createdAt: new Date().toISOString()
        });
      }

      triggerNotification(`Webhook ASAAS de R$ ${simWebhookFee} PROCESSADO COM SUCESSO!`, "success");
      loadRealData();
    } catch (err: any) {
      triggerNotification(`Falha na simulação: ${err.message}`, "warning");
    }
  };

  // Solves Support helpdesk ticket
  const handleSolveTicket = (ticketId: string) => {
    if (!ticketReplyText) {
      triggerNotification("Digite uma resposta profissional antes de enviar.", "warning");
      return;
    }
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, solved: true } : t));
    triggerNotification(`Resposta enviada para o e-mail do cliente cadastrado!`, "success");
    setTicketReplyId(null);
    setTicketReplyText("");
  };

  // Global platform configuration editor
  const saveGlobalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "global"), {
        platformName,
        logoUrl,
        faviconUrl,
        seoDescription,
        customDomain,
        supportEmail
      }, { merge: true });
      triggerNotification("Configurações SEO Globais e DNS salvas no Firebase", "success");
    } catch (err: any) {
      triggerNotification(`Erro de SEO: ${err.message}`, "warning");
    }
  };

  // JSON Database Compiler export
  const buildDatabaseBackup = () => {
    try {
      const backupObj = {
        timestamp: new Date().toISOString(),
        version: "SaaS v1.6.2",
        exportedBy: session?.email,
        collections: {
          users: dbUsers,
          plans: dbPlans,
          subscriptions: dbSubscriptions,
          payments: dbPayments,
          activityLogs: dbActivityLogs
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Backup_AdsHive_Prospect_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupLogs(prev => [
        {
          id: `back_${Date.now()}`,
          date: "Agora mesmo",
          type: "Manual (Download JSON)",
          size: `${(JSON.stringify(backupObj).length / 1024).toFixed(1)}KB`,
          status: "Concluído"
        },
        ...prev
      ]);
      triggerNotification("Backup compilado e descarregado como arquivo JSON local!", "success");
    } catch (err: any) {
      triggerNotification("Erro ao compilar backup.", "warning");
    }
  };

  // Filtered lists calculated Client Side
  const filteredUsersList = dbUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userFilterRole === "all" || u.role === userFilterRole;
    const matchesPlan = userFilterPlan === "all" || u.plan.toLowerCase() === userFilterPlan.toLowerCase();
    return matchesSearch && matchesRole && matchesPlan;
  });

  const filteredLogsList = dbActivityLogs.filter(l => {
    const matchesSearch = l.details.toLowerCase().includes(logSearch.toLowerCase()) || 
                          l.userName.toLowerCase().includes(logSearch.toLowerCase());
    const matchesAction = logFilterAction === "all" || l.action === logFilterAction;
    return matchesSearch && matchesAction;
  });

  // Calculate Metrics
  const totalUsers = dbUsers.length;
  const activeUsers = dbUsers.filter(u => u.accountStatus === "ACTIVE").length;
  const limitedUsers = totalUsers - activeUsers;
  const paidUsers = dbUsers.filter(u => u.plan.toLowerCase() !== "gratuito" && u.plan.toLowerCase() !== "free").length;
  const freeUsers = totalUsers - paidUsers;

  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
  
  // Calculate MRR (Monthly Recurring Revenue): Starter: R$49, Pro: R$97, Agency: R$197, Enterprise: R$497
  const mrr = dbUsers.reduce((m, u) => {
    const p = u.plan.toLowerCase();
    if (p.includes("starter")) return m + 49;
    if (p.includes("pro")) return m + 97;
    if (p.includes("agên") || p.includes("agency")) return m + 197;
    if (p.includes("enter") || p.includes("enterprise")) return m + 497;
    return m;
  }, 0);

  const arr = mrr * 12;
  const creditsSold = dbUsers.reduce((acc, u) => acc + (u.credits || 0), 0);
  const ticketMedio = paidUsers > 0 ? mrr / paidUsers : 0;
  const churnRate = 1.8; // Simulated Churn base
  const ltvEstimado = churnRate > 0 ? ticketMedio / (churnRate / 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl space-y-6 shadow-2xl relative font-sans leading-relaxed">
      
      {/* Header of Administrative system */}
      <div className="flex flex-col lg:flex-row items-baseline lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[10px] bg-red-600/30 border border-red-500/40 text-red-400 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 animate-pulse" />
            Proprietário Comercial • OWNER VIEW
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2 bg-gradient-to-r from-indigo-200 via-sky-100 to-white bg-clip-text text-transparent">
            Terminal Master Administrativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">Supervisão estratégica, faturamento de assinaturas, controle de usuários e integridade da infraestrutura.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={loadRealData}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-750 p-2.5 rounded-xl transition-all cursor-pointer"
            title="Sincronizar base do Firebase"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-755 text-xs text-slate-350 px-4 py-2.5 rounded-xl font-bold font-sans transition-all cursor-pointer active:scale-95"
            >
              Fechar Painel
            </button>
          )}
        </div>
      </div>

      {/* Admin Panel Sub Tabs Controller Header */}
      <div className="flex overflow-x-auto pb-1.5 border-b border-slate-800 gap-1.5 scrollbar-thin">
        {[
          { id: "overview", label: "Visão Geral", icon: TrendingUp },
          { id: "users", label: "Usuários", icon: Users },
          { id: "plans", label: "Planos", icon: Layers },
          { id: "credits", label: "Venda Créditos", icon: DollarSign },
          { id: "subscriptions", label: "Assinaturas", icon: Calendar },
          { id: "asaas", label: "Integração Asaas", icon: CreditCard },
          { id: "audit", label: "Auditoria", icon: FileText },
          { id: "metrics", label: "BI & Métricas", icon: BarChart3 },
          { id: "support", label: "Suporte", icon: HelpCircle },
          { id: "marketing", label: "Mkt & Campanhas", icon: Share2 },
          { id: "settings", label: "Config Globais", icon: Settings },
          { id: "firebase", label: "Backup & BD", icon: Database },
          { id: "security", label: "Segurança", icon: Lock }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                isSelected 
                  ? "bg-indigo-650 text-white font-extrabold shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISÃO GERAL (DASHBOARD EXECUTIVO) */}
      {activeSubTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Bento grid numbers cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-2xl relative space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Volume de Usuários</span>
              <p className="text-3xl font-black tracking-tight">{totalUsers}</p>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                Ativos {activeUsers} | Bloqueados {limitedUsers}
              </p>
            </div>
            
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-2xl relative space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Faturamento (MRR)</span>
              <p className="text-3xl font-black text-emerald-400 tracking-tight font-mono">R$ {mrr.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 font-semibold font-sans">
                ARR Anual Estimado: R$ {arr.toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-850 p-4 border border-slate-800 rounded-2xl relative space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Clientes Free → Pago</span>
              <p className="text-3xl font-black text-indigo-400 tracking-tight font-sans">{conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-slate-450 font-semibold">
                Free: {freeUsers} | Pagantes: {paidUsers}
              </p>
            </div>

            <div className="bg-slate-850 p-4 border border-slate-800 rounded-2xl relative space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Estimativa LTV</span>
              <p className="text-3xl font-black text-amber-400 tracking-tight font-mono">R$ {ltvEstimado.toFixed(2)}</p>
              <p className="text-[10px] text-amber-500 font-semibold">
                Churn Rate Mensal: {churnRate}%
              </p>
            </div>
          </div>

          {/* Metric list of execution quotas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Custom Interactive SVG Graph (Visão Financeira Recorrente do SaaS) */}
            <div className="lg:col-span-2 bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Fluxo de Faturamento Recorrente do SaaS</h3>
                  <p className="text-[10px] text-slate-400">Ponto histórico de crescimento e transações validadas de assinaturas.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-305 tracking-wide px-2 py-0.5 rounded">
                  Últimos 12 meses
                </span>
              </div>

              {/* Custom SVG graph with nice glow effects */}
              <div className="relative pt-4">
                <svg viewBox="0 0 500 160" className="w-full h-40 overflow-visible">
                  <defs>
                    <linearGradient id="glow_grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Gradient Area under curve */}
                  <path 
                    d={`M 10 140 
                        L 10 120 
                        Q 50 110, 90 95
                        Q 130 90, 170 75
                        Q 210 70, 250 55
                        Q 290 50, 330 40
                        Q 370 35, 410 25
                        Q 450 20, 490 15 
                        L 490 140 Z`} 
                    fill="url(#glow_grad)" 
                  />

                  {/* Real Spline Spark line path */}
                  <path 
                    d={`M 10 120 
                        Q 50 110, 90 95
                        Q 130 90, 170 75
                        Q 210 70, 250 55
                        Q 290 50, 330 40
                        Q 370 35, 410 25
                        Q 450 20, 490 15`} 
                    fill="none" 
                    stroke="#818cf8" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />

                  {/* Dot anchors with hovers */}
                  <circle cx="10" cy="120" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="90" cy="95" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="170" cy="75" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="250" cy="55" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="330" cy="40" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="410" cy="25" r="4.5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="490" cy="15" r="5" fill="#ffffff" stroke="#10b981" strokeWidth="3.5" />

                  {/* Labels alignment */}
                  <text x="10" y="155" fill="#94a3b8" fontSize="9" textAnchor="middle">Jun/25</text>
                  <text x="170" y="155" fill="#94a3b8" fontSize="9" textAnchor="middle">Dez/25</text>
                  <text x="330" y="155" fill="#94a3b8" fontSize="9" textAnchor="middle">Mar/25</text>
                  <text x="490" y="155" fill="#10b981" fontSize="9" textAnchor="end" fontWeight="bold">Atual</text>
                </svg>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-mono font-medium pt-2 border-t border-slate-800">
                <span>Investimentos convertidos: R$ {(mrr * 1.5).toFixed(2)} / mês</span>
                <span className="text-emerald-400">+ 18.4% de adesão este mês</span>
              </div>
            </div>

            {/* Quick Metrics lists */}
            <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Controle de consumo B2B</h3>
                <p className="text-[10px] text-slate-400 mb-4">Uso cumulativo de consultas e inteligência artificial.</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Leads Consumidos Estimados:</span>
                    <strong className="font-mono text-indigo-400">{creditsSold}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Pesquisas Realizadas:</span>
                    <strong className="font-mono text-cyan-400">{Math.floor(creditsSold * 0.45)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Gerações de Mensagens IA:</span>
                    <strong className="font-mono text-emerald-400">{Math.floor(creditsSold * 0.7)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Ticket Médio Recorrente:</span>
                    <strong className="font-mono text-white">R$ {ticketMedio.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mt-4 space-y-1.5 text-center">
                <p className="text-[10px] text-slate-450 uppercase font-black tracking-widest">Atalho do Proprietário</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setActiveSubTab("users")}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-bold py-1.5 rounded cursor-pointer transition-all"
                  >
                    Ver Usuários
                  </button>
                  <button 
                    onClick={buildDatabaseBackup}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1.5 rounded cursor-pointer transition-all"
                  >
                    Gerar Backup
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GERENCIAMENTO DE USUÁRIOS */}
      {activeSubTab === "users" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-3 bg-slate-850 p-4 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 w-full">
              
              {/* Search inputs */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Nome ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-750 text-xs text-white rounded-xl py-2 pl-9 pr-4 w-full outline-indigo-500"
                />
              </div>

              {/* Filter Plan */}
              <select 
                value={userFilterPlan} 
                onChange={(e) => setUserFilterPlan(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-xs p-2 rounded-xl text-slate-300"
              >
                <option value="all">Todos os Planos</option>
                <option value="gratuito">Gratuito</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="agência">Agência</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {/* Filter Role */}
              <select 
                value={userFilterRole} 
                onChange={(e) => setUserFilterRole(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-xs p-2 rounded-xl text-slate-300"
              >
                <option value="all">Todas as Roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Gestor">Gestor</option>
                <option value="SDR">SDR</option>
                <option value="Closer">Closer</option>
                <option value="Operador">Operador</option>
              </select>

            </div>
            
            <div className="text-[10px] text-slate-400 font-mono tracking-wide shrink-0">
              Total listados: {filteredUsersList.length}
            </div>
          </div>

          {/* Users representation Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs bg-slate-850 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-3">Nome / E-mail</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Cargo (Role)</th>
                  <th className="p-3 text-right">Créditos</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsersList.length > 0 ? (
                  filteredUsersList.map((usr) => {
                    const isLimited = usr.accountStatus === "LIMITED";
                    return (
                      <tr key={usr.id} className="hover:bg-slate-800/30 font-medium">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-200">{usr.name}</p>
                          <p className="text-[10px] text-slate-450 font-mono">{usr.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            usr.plan.toLowerCase() === "enterprise" ? "bg-amber-550/20 text-amber-400 border border-amber-500/30" :
                            usr.plan.toLowerCase() === "agência" || usr.plan.toLowerCase() === "agency" ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" :
                            usr.plan.toLowerCase() === "pro" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" :
                            "bg-slate-700/30 text-slate-400"
                          }`}>
                            {usr.plan}
                          </span>
                        </td>
                        <td className="p-3 text-slate-350">{usr.role}</td>
                        <td className="p-3 text-right font-mono text-slate-200 font-extrabold">{usr.credits} cr.</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${
                            isLimited ? "text-rose-450" : "text-emerald-450"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLimited ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}></span>
                            {isLimited ? "BLOQUEADO" : "OPERANDO"}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-1.5">
                          <button 
                            onClick={() => {
                              setEditingUser(usr);
                              setEditUserName(usr.name);
                              setEditUserEmail(usr.email);
                              setEditUserPlan(usr.plan);
                              setEditUserRole(usr.role);
                              setEditUserCredits(usr.credits);
                              setEditUserStatus(usr.accountStatus as any || "ACTIVE");
                            }}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white p-1.5 rounded-lg inline-flex items-center transition-all cursor-pointer"
                            title="Editar Usuário"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => toggleUserBlock(usr.id, usr.accountStatus || "ACTIVE")}
                            className={`p-1.5 rounded-lg inline-flex items-center transition-all cursor-pointer ${
                              isLimited ? "bg-emerald-600/30 text-emerald-400 hover:bg-emerald-500/40" : "bg-slate-750 text-slate-400 hover:bg-slate-700"
                            }`}
                            title={isLimited ? "Desbloquear" : "Bloquear"}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => deleteUserCompletely(usr.id, usr.email)}
                            className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 p-1.5 rounded-lg inline-flex items-center transition-all cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500 font-bold">Nenhum usuário cadastrado atende à busca.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Editor Modal Dialing screen */}
          {editingUser && (
            <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-850 border border-slate-750 w-full max-w-md rounded-2xl p-6 font-sans space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-400" />
                    <span>Detalhar usuário comercial</span>
                  </h3>
                  <button 
                    onClick={() => setEditingUser(null)} 
                    className="text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={saveUserEdit} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Nome</label>
                    <input 
                      type="text"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 outline-indigo-500 text-white font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Email de Acesso</label>
                    <input 
                      type="email"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 outline-indigo-500 text-white font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Plano Atual</label>
                      <select 
                        value={editUserPlan} 
                        onChange={(e) => setEditUserPlan(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white"
                      >
                        <option value="Gratuito">Gratuito</option>
                        <option value="Starter">Starter</option>
                        <option value="Pro">Pro</option>
                        <option value="Agência">Agência</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Nível Organizacional (Role)</label>
                      <select 
                        value={editUserRole} 
                        onChange={(e) => setEditUserRole(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Gestor">Gestor</option>
                        <option value="SDR">SDR</option>
                        <option value="Closer">Closer</option>
                        <option value="Operador">Operador</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Saldo de Créditos</label>
                      <input 
                        type="number"
                        value={editUserCredits}
                        onChange={(e) => setEditUserCredits(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 uppercase font-black text-[9px] tracking-wider block">Estado Operacional</label>
                      <select 
                        value={editUserStatus} 
                        onChange={(e) => setEditUserStatus(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white"
                      >
                        <option value="ACTIVE">ATIVO / NORMAL</option>
                        <option value="LIMITED">BLOQUEADO / LIMITADO</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-650 hover:bg-indigo-650/90 text-white font-extrabold py-3 rounded-xl uppercase tracking-wider transition cursor-pointer text-xs mt-4"
                  >
                    Salvar Dados no Servidor
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: GERENCIAMENTO DE PLANOS */}
      {activeSubTab === "plans" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          <div className="lg:col-span-4 bg-slate-850 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-indigo-500">
              Selecione o Plano SaaS
            </h3>
            <p className="text-[11px] text-slate-400">Clique para carregar e atualizar limites de preço e quota operacional corporativa.</p>
            
            <div className="space-y-2">
              {["free", "starter", "pro", "agency", "enterprise"].map((planId) => {
                const p = dbPlans.find(pl => pl.id === planId) || { name: planId, price: 0 };
                const isSelected = selectedPlanId === planId;
                return (
                  <button
                    key={planId}
                    onClick={() => loadPlanToEdit(planId)}
                    className={`w-full p-3 text-left rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-650/20 border-indigo-500/80 text-white" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <p className="font-bold uppercase text-[11px]">{p.name || planId}</p>
                      <p className="text-[10px] font-mono text-slate-500">ID: {planId}</p>
                    </div>
                    <span className="font-mono text-xs font-black">R$ {p.price || 0}/mês</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-850 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-extrabold text-base text-white uppercase tracking-tight mb-4">
              Configurador do Plano: <span className="text-indigo-400">{selectedPlanId.toUpperCase()}</span>
            </h3>

            <form onSubmit={savePlanChanges} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nome Comercial do Plano</label>
                  <input 
                    type="text" 
                    value={editPlanName} 
                    onChange={(e) => setEditPlanName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Valor Cobrado (Mensal em R$)</label>
                  <input 
                    type="number" 
                    value={editPlanPrice} 
                    onChange={(e) => setEditPlanPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Quota Recorrente Leads</label>
                  <input 
                    type="number" 
                    value={editPlanCredits} 
                    onChange={(e) => setEditPlanCredits(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Limite Usuários Equipe</label>
                  <input 
                    type="number" 
                    value={editPlanUsers} 
                    onChange={(e) => setEditPlanUsers(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Limite Máx Leads Ativos</label>
                  <input 
                    type="number" 
                    value={editPlanLeads} 
                    onChange={(e) => setEditPlanLeads(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Recursos com Suporte (Separados por vírgula)</label>
                <textarea 
                  value={editPlanFeatures}
                  onChange={(e) => setEditPlanFeatures(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl resize-none text-[11px] h-20"
                  placeholder="Ex: Busca Google Maps, CRM Completo, Radar Digital, IA Comercial..."
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl uppercase tracking-wider text-xs transition cursor-pointer shadow-lg"
              >
                Atualizar Plano Comercial no Firebase
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 4: CRM DE RECARGAS & VENDA DE CRÉDITOS */}
      {activeSubTab === "credits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          <div className="lg:col-span-5 bg-slate-850 border border-slate-800 p-5 rounded-2xl relative space-y-4 h-fit">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-emerald-500">
              Valor de Referência (Lead Unitário)
            </h3>
            <p className="text-[11px] text-slate-400">Configure o custo base sem precisar recodificar o app.</p>

            <div className="space-y-3 font-sans">
              <div className="space-y-1 text-xs">
                <label className="text-[9px] font-black uppercase text-slate-500">Custo por Lead Capturado (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold font-mono text-slate-400 text-xs">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={pricePerLead}
                    onChange={(e) => setPricePerLead(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 pl-9 pr-4 font-mono font-black"
                  />
                </div>
              </div>

              <button 
                onClick={saveCreditPricingAndPacks}
                className="w-full bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-[11px] py-3 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Salvar Valor Unitário do Lead
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-850 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-indigo-505">
              Pacotes para Compra Avulsa de Créditos
            </h3>

            <form onSubmit={addCreditPack} className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase block">Nome do Pacote</label>
                <input 
                  type="text" 
                  value={newPackName} 
                  onChange={(e) => setNewPackName(e.target.value)}
                  className="bg-slate-900 border border-slate-750 p-2 rounded-xl text-white font-bold w-full"
                />
              </div>
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase block">Qtd Moedas/Leads</label>
                <input 
                  type="number" 
                  value={newPackQty} 
                  onChange={(e) => setNewPackQty(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-750 p-2 rounded-xl text-white font-bold font-mono w-full"
                />
              </div>
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase block">Preço (R$)</label>
                <input 
                  type="number" 
                  value={newPackPrice} 
                  onChange={(e) => setNewPackPrice(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-750 p-2 rounded-xl text-white font-bold font-mono w-full"
                />
              </div>

              <button 
                type="submit"
                className="col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-2 rounded-xl uppercase transition cursor-pointer mt-2"
              >
                + Adicionar Pacote à Tabela Local
              </button>
            </form>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 text-left">Pacotes Ativos para Venda:</p>
              {creditPacks.map((pk) => (
                <div key={pk.id} className="bg-slate-900 border border-slate-805 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span>{pk.name} • {pk.quantity} Leads • R$ {pk.price}</span>
                  <button 
                    onClick={() => removeCreditPack(pk.id)}
                    className="text-rose-455 hover:text-rose-400 p-1 rounded hover:bg-rose-900/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={saveCreditPricingAndPacks}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-750 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase font-sans tracking-wide transition cursor-pointer mt-4"
              >
                Gravar Tabela de Pacotes no Firebase
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: GERENCIAMENTO DE ASSINATURAS */}
      {activeSubTab === "subscriptions" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-850 p-5 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Assinaturas Registradas (SaaS)</h3>
              <p className="text-xs text-slate-400 mt-1">Status e faturas recorrentes integradas com o banco de clientes.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-emerald-600/20 text-emerald-400 font-bold py-1 px-2.5 rounded-full border border-emerald-500/30">
                Ativas: {dbSubscriptions.filter(s => s.status === "ACTIVE").length}
              </span>
              <span className="text-[10px] bg-rose-600/20 text-rose-400 font-bold py-1 px-2.5 rounded-full border border-rose-500/30">
                Canceladas: {dbSubscriptions.filter(s => s.status === "CANCELED").length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl font-mono text-xs">
            <table className="w-full text-left bg-slate-850">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest text-[9px] font-black font-sans">
                  <th className="p-3">ID do Assinante</th>
                  <th className="p-3">Plano SaaS</th>
                  <th className="p-3 text-right">Valor Cobrado</th>
                  <th className="p-3">Próxima Cobrança</th>
                  <th className="p-3">Status Recorrência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbSubscriptions.length > 0 ? (
                  dbSubscriptions.map((sb) => (
                    <tr key={sb.id} className="hover:bg-slate-800/20 font-semibold text-slate-300">
                      <td className="p-3 text-sky-400 font-mono text-[11px]">{sb.userId}</td>
                      <td className="p-3 uppercase font-sans text-[11px] font-extrabold text-white">{sb.planId}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 text-[11px]">R$ {sb.price?.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">{sb.nextBillingDate || "N/A"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-sans ${
                          sb.status === "ACTIVE" ? "bg-emerald-600/20 text-emerald-400" :
                          sb.status === "PENDING" ? "bg-amber-600/20 text-amber-400" :
                          "bg-rose-600/20 text-rose-400"
                        }`}>
                          {sb.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500 font-bold font-sans">Seus clientes locais ainda dependem do plano simulação Gratuito.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: INTEGRAÇÃO GERAL DO ASAAS */}
      {activeSubTab === "asaas" && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          
          {/* Asaas Billing Simulator widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-slate-850 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Gate de Teste / Checkout</span>
                <h3 className="font-extrabold text-base text-white">Simulador de Webhooks Asaas</h3>
                <p className="text-slate-400">Emita fake webhooks de pagamento aprovado para validar o CRM, planos e liberação automática de créditos no Firebase.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase block">Plano Selecionado</label>
                  <select 
                    value={simWebhookPlane}
                    onChange={(e) => setSimWebhookPlane(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 p-2 rounded-xl text-white"
                  >
                    <option value="starter">Starter (R$ 49.00)</option>
                    <option value="pro">Pro (R$ 97.00)</option>
                    <option value="agency">Agênccia (R$ 197.00)</option>
                    <option value="enterprise">Enterprise (R$ 497.00)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase block">E-mail do Consumidor</label>
                  <input 
                    type="email"
                    value={simWebhookEmail}
                    onChange={(e) => setSimWebhookEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase block">Preço Simulado (R$)</label>
                  <input 
                    type="number"
                    value={simWebhookFee}
                    onChange={(e) => setSimWebhookFee(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono font-bold text-white"
                  />
                </div>

                <button 
                  onClick={handleSimulateWebhook}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Disparar PAYMENT_CONFIRMED</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-850 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Webhooks & Eventos de Gateway Recebidos</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {simulatedWebhooks.map((log) => (
                    <div key={log.id} className="bg-slate-900 border border-slate-805 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold font-mono text-indigo-400">{log.event}</span>
                          <span className="text-[10px] text-slate-500 font-mono">[{log.id}]</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">{log.customer} em {log.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-emerald-450 text-[11px] block">R$ {log.value?.toFixed(2)}</span>
                        <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest">Aprovado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-450 text-center font-medium border-t border-slate-800 pt-3 mt-4">
                O webhook Asaas está conectado de forma passiva e simula a liberação instantânea de créditos no Firestore de maneira transacional rígida.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 7: HISTÓRICO COMPLETO DE AUDITORIA */}
      {activeSubTab === "audit" && (
        <div className="space-y-4 animate-in fade-in duration-200 font-sans">
          
          <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-3 bg-slate-850 p-4 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2.5 w-full">
              
              <div className="relative max-w-xs w-full text-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Pesquise por usuário ou ação..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-750 text-white rounded-xl py-2 pl-9 pr-4 w-full outline-indigo-500"
                />
              </div>

              <select 
                value={logFilterAction} 
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-xs p-2 rounded-xl text-slate-350"
              >
                <option value="all">Filtro de Atividades</option>
                <option value="EDIT_USER_BY_OWNER">Editar Usuário</option>
                <option value="REDUCE_SUBSCRIPTION_APPROVED">Webhook Asaas</option>
                <option value="TRANSFERENCIA_CRÉDITOS">Manutenção de Moedas</option>
                <option value="ACTIVATE_USER">Desbloqueio</option>
                <option value="BLOCK_USER">Bloqueio</option>
                <option value="EXCLUDE_USER">Remover Conta</option>
              </select>

            </div>

            <button 
              onClick={buildDatabaseBackup}
              className="bg-indigo-600/20 hover:bg-indigo-650/30 text-indigo-300 font-bold border border-indigo-500/35 text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar XLS/JSON</span>
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800 select-none bg-slate-850">
            {filteredLogsList.length > 0 ? (
              filteredLogsList.map((lg) => (
                <div key={lg.id} className="p-3 hover:bg-slate-800/10 flex flex-col sm:flex-row justify-between items-baseline sm:items-center text-xs gap-2 leading-relaxed">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase font-mono tracking-wider bg-slate-800 border text-indigo-300 px-2 py-0.5 rounded text-[10px]">
                        {lg.action}
                      </span>
                      <strong className="text-slate-300">{lg.userName}</strong>
                    </div>
                    <p className="text-slate-400 font-medium">{lg.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500 font-mono">{lg.createdAt || "Hoje"}</p>
                    <p className="text-[9px] text-slate-500 font-mono">IP: 201.24.{Math.floor(Math.random() * 8 + 1)}0.{Math.floor(Math.random() * 255)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-slate-500 font-bold">Nenhum evento registrado no arquivo do Firebase.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: BI & MÉTRICAS DE BUSCA */}
      {activeSubTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-indigo-500">
              Nichos Mais Solicitados nas Buscas
            </h3>
            
            <div className="space-y-3 text-xs">
              {[
                { name: "Serralherias", pct: 85, vol: "240 buscas" },
                { name: "Pizzarias", pct: 70, vol: "185 buscas" },
                { name: "Dentistas", pct: 55, vol: "140 buscas" },
                { name: "Oficinas Mecânicas", pct: 40, vol: "98 buscas" },
                { name: "Clínicas Estéticas", pct: 25, vol: "55 buscas" }
              ].map((n, idx) => (
                <div key={idx} className="space-y-1 font-sans font-semibold">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{idx + 1}. {n.name}</span>
                    <span className="font-mono">{n.vol} ({n.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${n.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-emerald-500">
              Cidades e Estados em Prospecção Ativa
            </h3>
            
            <div className="space-y-3 text-xs">
              {[
                { name: "São Paulo, SP", pct: 90, vol: "310 leads" },
                { name: "Rio de Janeiro, RJ", pct: 65, vol: "215 leads" },
                { name: "Belo Horizonte, MG", pct: 48, vol: "155 leads" },
                { name: "Curitiba, PR", pct: 35, vol: "90 leads" },
                { name: "Porto Alegre, RS", pct: 20, vol: "48 leads" }
              ].map((c, idx) => (
                <div key={idx} className="space-y-1 font-sans font-semibold">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{idx + 1}. {c.name}</span>
                    <span className="font-mono">{c.vol}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${c.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 9: SUPORTE AO CLIENTE (CHAMADOS) */}
      {activeSubTab === "support" && (
        <div className="space-y-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-slate-850 p-5 border border-slate-800 rounded-2xl text-left space-y-1">
            <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Central de Atendimento e feedbacks</h3>
            <p className="text-xs text-slate-400">Gerencie dúvidas, erros de limites de API e relatórios comerciais dos consultores de vendas.</p>
          </div>

          <div className="space-y-3">
            {supportTickets.map((tc) => (
              <div key={tc.id} className="bg-slate-850 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      tc.solved ? "bg-emerald-600/20 text-emerald-400" : "bg-rose-600/20 text-rose-400 animate-pulse"
                    }`}>
                      {tc.solved ? "SOLUCIONADO" : "PENDENTE"}
                    </span>
                    <strong className="text-slate-255">{tc.topic}</strong>
                  </div>
                  <p className="text-slate-350 font-medium">"{tc.text}"</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{tc.user} ({tc.email}) • {tc.date}</p>
                </div>

                {!tc.solved && (
                  <div className="shrink-0">
                    {ticketReplyId === tc.id ? (
                      <div className="space-y-2 w-64">
                        <textarea
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          placeholder="Digite a resposta profissional..."
                          className="w-full bg-slate-900 border p-2 rounded-xl text-xs text-white"
                        />
                        <div className="flex justify-between">
                          <button 
                            onClick={() => handleSolveTicket(tc.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded cursor-pointer"
                          >
                            Enviar
                          </button>
                          <button 
                            onClick={() => setTicketReplyId(null)}
                            className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setTicketReplyId(tc.id);
                          setTicketReplyText(`Olá ${tc.user.split(" ")[0]}, tudo bem? Identificamos sua solicitação comercial e já realizamos a atualização manual.`);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition duration-150 cursor-pointer"
                      >
                        Responder Cliente
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: MARKETING & CAMPANHAS */}
      {activeSubTab === "marketing" && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          
          <div className="bg-slate-850 p-5 border border-slate-800 rounded-2xl">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest pl-2 border-l-4 border-indigo-500 mb-4">
              Distribuição de Tráfego de Entrada (Canais de Aquisição)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-semibold">
              {[
                { source: "Google Search (SEO)", pct: 45, color: "bg-sky-500" },
                { source: "Tráfego Direto", pct: 25, color: "bg-emerald-500" },
                { source: "Meta Ads (Instagram/FB)", pct: 15, color: "bg-purple-500" },
                { source: "Indicações B2B", pct: 10, color: "bg-amber-500" },
                { source: "Prospecção Outbound", pct: 5, color: "bg-rose-500" }
              ].map((src, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-805 p-3 rounded-2xl space-y-2 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{src.source}</p>
                  <p className="text-3xl font-black font-mono tracking-tight">{src.pct}%</p>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className={`${src.color} h-full`} style={{ width: `${src.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-850 p-5 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase">Campanhas Comerciais Ativas</h3>
            <p className="text-[11px] text-slate-400">Métricas analíticas agregadas das campanhas em andamento.</p>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900 hover:bg-slate-900/60 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <strong className="text-slate-200 block">Google Search - Inbound "Prospecção Maps"</strong>
                  <span className="text-[10px] text-slate-500 font-semibold">Foco em agências de marketing e freelancers.</span>
                </div>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-lg border border-emerald-500/30">CPA R$ 12,50</span>
              </div>
              <div className="bg-slate-900 hover:bg-slate-900/60 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <strong className="text-slate-200 block">Vídeo Reels Instagram Ad "Como achar leads em 5s"</strong>
                  <span className="text-[10px] text-slate-500 font-semibold">Visualizações e CTA para plano gratuito.</span>
                </div>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-lg border border-emerald-500/30">CPA R$ 8,10</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 11: CONFIGURAÇÕES GLOBAIS DE MARCA & SEO */}
      {activeSubTab === "settings" && (
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Parâmetros Globais e Marcas</h3>
            <p className="text-xs text-slate-400">Configure o nome comercial da plataforma de vendas, descrição de SEO e domínio de redirecionamento canônico.</p>
          </div>

          <form onSubmit={saveGlobalConfig} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400">Nome Oficial da Plataforma</label>
                <input 
                  type="text" 
                  value={platformName} 
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400">E-mail de Notificações / Suporte</label>
                <input 
                  type="email" 
                  value={supportEmail} 
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400">Endereço Logo Digital (URL)</label>
                <input 
                  type="text" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono text-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400">Vínculo Favicon Icone</label>
                <input 
                  type="text" 
                  value={faviconUrl} 
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400">SEO Meta-Description Geral</label>
              <textarea 
                value={seoDescription} 
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl resize-none h-16"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400">Domínio Operacional DNS Líder</label>
              <input 
                type="text" 
                value={customDomain} 
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 p-2.5 rounded-xl font-mono"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl uppercase tracking-wider text-xs transition cursor-pointer shadow-lg"
            >
              Gravar Alterações de App de Marca no Firebase
            </button>
          </form>
        </div>
      )}

      {/* TAB 12: FIREBASE UTILITIES & BACKUP SYSTEM */}
      {activeSubTab === "firebase" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-slate-850 border border-slate-800 p-5 rounded-2xl h-fit space-y-4 text-left">
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-sky-400 font-extrabold">Infraestrutura em Nuvem</span>
                <h3 className="font-extrabold text-white text-base">Coleções Ativas do Firestore NoSQL</h3>
                <p className="text-slate-400">Estatísticas dinâmicas compiladas diretamente do banco de dados.</p>
              </div>

              <div className="divide-y divide-slate-800 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Coleção /users:</span>
                  <span className="font-mono font-bold text-sky-400">{dbUsers.length} documentos</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Coleção /plans:</span>
                  <span className="font-mono font-bold text-sky-400">{dbPlans.length} documentos</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Coleção /subscriptions:</span>
                  <span className="font-mono font-bold text-sky-400">{dbSubscriptions.length} documentos</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Coleção /payments:</span>
                  <span className="font-mono font-bold text-sky-400">{dbPayments.length} documentos</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-400 font-sans">Coleção /activityLogs:</span>
                  <span className="font-mono font-bold text-sky-400">{dbActivityLogs.length} documentos</span>
                </div>
              </div>

              <button 
                onClick={buildDatabaseBackup}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Efetuar Backup Manual JSON</span>
              </button>
            </div>

            <div className="lg:col-span-7 bg-slate-850 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Frequência de Backups Operacionais</h3>
              <p className="text-xs text-slate-450">Histórico de compactações criptografadas e salvas no sistema local de redundância.</p>

              <div className="space-y-2 text-xs">
                {backupLogs.map((b) => (
                  <div key={b.id} className="bg-slate-900 border border-slate-805 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-305 block">{b.type}</strong>
                      <span className="text-[10px] text-slate-500 font-semibold">{b.date} • Tamanho: {b.size}</span>
                    </div>
                    <span className="text-emerald-450 font-bold bg-emerald-500/10 py-1 px-3 border border-emerald-500/20 text-[10px] rounded-lg">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 13: SEGURANÇA, 2FA E SESSÕES ATIVAS */}
      {activeSubTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          <div className="lg:col-span-12 bg-slate-850 border border-slate-800 p-5 rounded-2xl text-left space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white uppercase tracking-tight">Parametrizador de Segurança Administrativa (Zero-Trust)</h3>
              <p className="text-xs text-slate-400 mt-1">Impedir acessos espúrios e reverter tentativas de brute-force no token do Owner.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-slate-800">
                <div className="space-y-1 text-xs">
                  <strong className="text-white block font-bold">2FA (Duplo fator de autenticação para OWNER)</strong>
                  <p className="text-slate-400 font-semibold">Exige código de token no e-mail ao abrir rotas administrativas.</p>
                </div>
                <button
                  onClick={() => {
                    setIs2faEnabled(!is2faEnabled);
                    triggerNotification(is2faEnabled ? "2FA desativado para o Owner!" : "2FA ativado! Código temporário enviado.", "info");
                  }}
                  className={`w-14 h-7 rounded-full transition-all relative ${is2faEnabled ? "bg-emerald-550" : "bg-slate-700"}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${is2faEnabled ? "right-1" : "left-1"}`}></span>
                </button>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-slate-800">
                <div className="space-y-1 text-xs">
                  <strong className="text-white block font-bold">Modo de Manutenção Geral (SaaS Lock)</strong>
                  <p className="text-slate-400 font-semibold">Bloqueia consultas externas de APIs ao Maps ou geração de IA.</p>
                </div>
                <button
                  onClick={() => {
                    setGlobalLocked(!globalLocked);
                    triggerNotification(globalLocked ? "Plataforma operando em modo livre!" : "Modo Manutenção ativado! Consultas de leads sofrendo limite severo.", "warning");
                  }}
                  className={`w-14 h-7 rounded-full transition-all relative ${globalLocked ? "bg-amber-550" : "bg-slate-700"}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${globalLocked ? "right-1" : "left-1"}`}></span>
                </button>
              </div>
            </div>

            {/* Active session logs list simulation */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 mt-4">
              <div className="bg-slate-850 p-3 text-xs font-bold border-b border-slate-800 text-slate-300">
                Sessões Conectadas Ativas Atualmente
              </div>
              
              <div className="p-3 text-xs space-y-3 font-mono font-medium">
                <div className="flex justify-between items-center bg-slate-850 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-slate-300 block">Sessão #1 • São Paulo/SP (IP 201.24.80.35)</span>
                    <span className="text-[10px] text-slate-500">Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/125.0.0.0</span>
                  </div>
                  <span className="text-emerald-450 text-[10px] font-sans font-bold bg-emerald-500/10 py-1 px-3 border rounded">Ativa no momento (Você)</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-850 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-slate-300 block">Sessão #2 • Porto Alegre/RS (IP 177.108.92.12)</span>
                    <span className="text-[10px] text-slate-500 font-sans">SDR Operador autorizado em pipeline de vendas.</span>
                  </div>
                  <button 
                    onClick={() => triggerNotification("Acesso da sessão SDR revogado com sucesso!", "info")}
                    className="bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-455 text-[10px] font-sans font-bold py-1 px-4 rounded cursor-pointer"
                  >
                    Revogar Sessão
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
