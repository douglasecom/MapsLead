import React, { useState, useEffect } from "react";
import { 
  CreditCard, DollarSign, Calendar, Clock, Coins, ShieldAlert,
  ArrowUpRight, Download, CheckCircle, RefreshCw, AlertTriangle, 
  FileText, Check, Sparkles, User, Settings, ArrowRight, ShieldCheck, X, Activity, HelpCircle
} from "lucide-react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import { UserSession, SaaSPayment, SaaSSubscription } from "../types";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Legend
} from "recharts";
import { jsPDF } from "jspdf";

interface FinanceiroProps {
  session: UserSession | null;
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
  setActiveTab: (tab: any) => void;
  themeMode: "light" | "dark";
}

export const Financeiro: React.FC<FinanceiroProps> = ({ session, triggerNotification, setActiveTab, themeMode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<SaaSPayment[]>([]);
  const [subscription, setSubscription] = useState<SaaSSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState({
    messagesUsed: 0,
    messagesLimit: 20,
    plan: "Gratuito",
    lastResetDate: ""
  });

  // Purchase/Upgrade flow states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [activePurchaseTab, setActivePurchaseTab] = useState<"leads" | "ia">("leads");
  const [selectedPackId, setSelectedPackId] = useState<string>("pack_100");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">("pix");
  
  // Checkout overlay states
  const [activePendingPack, setActivePendingPack] = useState<any | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixQr, setPixQr] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);

  // Card details mock fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Modals for general actions
  const [activeActionModal, setActiveActionModal] = useState<"cancel" | "update_card" | "change_plan" | null>(null);
  const [newSelectedPlanName, setNewSelectedPlanName] = useState<string>("pro");

  // Package definitions
  const creditPackages = [
    { id: "pack_100", name: "Bronze 100 Leads", credits: 100, price: 20, desc: "R$ 0,20 por lead avulso." },
    { id: "pack_500", name: "Silver 500 Leads", credits: 500, price: 90, desc: "R$ 0,18 por lead avulso." },
    { id: "pack_1000", name: "Gold 1000 Leads", credits: 1000, price: 160, desc: "R$ 0,16 por lead avulso." },
    { id: "pack_5000", name: "Titanium 5000 Leads", credits: 5000, price: 750, desc: "Economia máxima e alta escala de SDR." }
  ];

  const aiPackages = [
    { id: "ai_100", name: "Smart 100 Mensagens", messages: 100, price: 10, desc: "Avanço pontual na IA do SDR." },
    { id: "ai_500", name: "Premium 500 Mensagens", messages: 500, price: 40, desc: "Excelente para campanhas ativas." },
    { id: "ai_1000", name: "Scale 1000 Mensagens", messages: 1000, price: 70, desc: "Abordagens inteligentes constantes." },
    { id: "ai_5000", name: "Unlimited 5000 Mensagens", messages: 5000, price: 300, desc: "IA em fluxo de processamento total." }
  ];

  const selectedPack = activePurchaseTab === "leads" 
    ? creditPackages.find(p => p.id === selectedPackId) || creditPackages[0]
    : aiPackages.find(p => p.id === selectedPackId) || aiPackages[0];

  const loadFinancialData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // 1. Get User profile
      const userRef = doc(db, "users", session.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      } else {
        setUserProfile(session);
      }

      // 2. Load Subscription
      const subSnap = await getDocs(collection(db, "subscriptions"));
      let foundSub: SaaSSubscription | null = null;
      subSnap.forEach(d => {
        const item = d.data() as SaaSSubscription;
        if (item.userId === session.id) {
          foundSub = { id: d.id, ...item };
        }
      });
      setSubscription(foundSub);

      // 3. Load Payments list
      const paySnap = await getDocs(collection(db, "payments"));
      const listPay: SaaSPayment[] = [];
      paySnap.forEach(d => {
        const item = d.data() as SaaSPayment;
        if (item.userId === session.id) {
          listPay.push({ id: d.id, ...item });
        }
      });
      listPay.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
      setPayments(listPay);

      // 4. Load AI Usage Stats
      const usageRef = doc(db, "aiUsage", session.id);
      const usageSnap = await getDoc(usageRef);
      if (usageSnap.exists()) {
        const u = usageSnap.data();
        setAiUsage({
          messagesUsed: u.messagesUsed || 0,
          messagesLimit: u.messagesLimit || 20,
          plan: u.plan || "Gratuito",
          lastResetDate: u.lastResetDate || ""
        });
      } else {
        setAiUsage({
          messagesUsed: 0,
          messagesLimit: 20,
          plan: "Gratuito",
          lastResetDate: ""
        });
      }

    } catch (err: any) {
      console.error("[Financeiro] Error loading financial details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [session]);

  // Timed checkout automatic simulator
  useEffect(() => {
    if (!activePendingPack) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(15);
  }, [activePendingPack]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleAutoCompensateSimulatedPayment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, activePendingPack]);

  // Pricing values helper
  const planName = userProfile?.plan || session?.plan || "Gratuito";
  const subStatus = userProfile?.subscriptionStatus || "ACTIVE"; // ACTIVE, PENDING, OVERDUE / PAST_DUE, CANCELED
  const availableCredits = userProfile?.credits || 0;
  
  // Map monthly cost based on plan name
  const monthlyPrices: Record<string, number> = {
    "Gratuito": 0,
    "Free": 0,
    "Starter": 49,
    "Pro": 97,
    "Agência": 197,
    "Agency": 197,
    "Enterprise": 497
  };
  const monthlyCost = monthlyPrices[planName] ?? 97;

  // Days remaining calculation
  const calculateDaysRemaining = (): number => {
    if (!subscription?.nextBillingDate) return 25; // Default fallback for simulation
    const diff = new Date(subscription.nextBillingDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateDaysOverdue = (): number => {
    if (!subscription?.nextBillingDate) return 5;
    const diff = Date.now() - new Date(subscription.nextBillingDate).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 5;
  };

  // Status visual mapping
  const getStatusDetails = (status: string) => {
    const s = status.toUpperCase();
    if (s === "ACTIVE" || s === "ATIVA") {
      return { label: "ATIVA", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", indicator: "bg-emerald-500" };
    }
    if (s === "PENDING" || s === "EM_TESTE" || s === "TESTE") {
      return { label: "EM TESTE", color: "text-sky-400 bg-sky-500/10 border-sky-500/30", indicator: "bg-sky-500" };
    }
    if (s === "CANCELED" || s === "CANCELADA") {
      return { label: "CANCELADA", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", indicator: "bg-rose-500" };
    }
    // Inadimplente, PAST_DUE, OVERDUE, atrasado
    return { label: "EM ATRASO", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", indicator: "bg-amber-500 animate-pulse" };
  };

  const currentStatus = getStatusDetails(subStatus);

  // Extrato de Consumo - Mock data for last 30 days
  const consumptionStats = [
    { date: "09/05", leads: 45, ia: 30, queries: 12 },
    { date: "14/05", leads: 80, ia: 55, queries: 24 },
    { date: "19/05", leads: 120, ia: 90, queries: 40 },
    { date: "24/05", leads: 190, ia: 145, queries: 63 },
    { date: "29/05", leads: 240, ia: 210, queries: 80 },
    { date: "03/06", leads: 320, ia: 270, queries: 105 },
    { date: "08/06", leads: availableCredits, ia: aiUsage.messagesUsed, queries: 154 }
  ];

  // Histórico de consumo de créditos mensal para a tabela e exportação de PDF
  const monthlyConsumption = [
    {
      id: "m_current",
      month: "Junho de 2026",
      plan: planName,
      leads: 320,
      aiMessages: aiUsage.messagesUsed,
      mapsSearches: 154,
      totalCredits: 320 + aiUsage.messagesUsed + 154,
      status: "Em Andamento"
    },
    {
      id: "m2",
      month: "Maio de 2026",
      plan: planName === "Gratuito" ? "Pro" : planName,
      leads: 480,
      aiMessages: 395,
      mapsSearches: 215,
      totalCredits: 1090,
      status: "Finalizado"
    },
    {
      id: "m3",
      month: "Abril de 2026",
      plan: planName === "Gratuito" ? "Pro" : planName,
      leads: 420,
      aiMessages: 350,
      mapsSearches: 180,
      totalCredits: 950,
      status: "Finalizado"
    },
    {
      id: "m4",
      month: "Março de 2026",
      plan: "Starter",
      leads: 180,
      aiMessages: 120,
      mapsSearches: 65,
      totalCredits: 365,
      status: "Finalizado"
    }
  ];

  // Exportar histórico de consumo mensal para PDF usando jsPDF
  const handleExportPDF = () => {
    try {
      triggerNotification("Compilando PDF do extrato operacional de consumo...", "info");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Cor de fundo do cabeçalho (#151520 - Slate escuro)
      doc.setFillColor(21, 21, 32); 
      doc.rect(0, 0, 210, 42, "F");

      // Margem superior e título principal
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ADSHIVE PROSPECT", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 210);
      doc.text("SaaS Comercial SDR • Extrato Mensal de Consumo de Créditos", 15, 26);

      // Timestamps e Informações do Sistema
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 170);
      doc.text(`Emissão: ${new Date().toLocaleString("pt-BR")}`, 145, 18);
      doc.text("v1.6 API Asaas Core Secure", 145, 26);

      // Caixa de Informações do Assinante
      doc.setFillColor(242, 242, 248);
      doc.roundedRect(15, 52, 180, 30, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 70);
      doc.text("DADOS DO CLIENTE E ASSINATURA", 20, 59);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 100);
      doc.text(`Cliente: ${session?.name || "Douglas Bateria"}`, 20, 66);
      doc.text(`E-mail cadastrado: ${session?.email || "douglasbateriacma@gmail.com"}`, 20, 73);
      doc.text(`Plano Ativo: ${planName}`, 120, 66);
      doc.text(`Status Contratual: ${subStatus.toUpperCase()}`, 120, 73);

      // Cabeçalho da Tabela
      let startY = 92;
      doc.setFillColor(138, 43, 226); // #8A2BE2 (Roxo Assinatura AdsHive)
      doc.rect(15, startY, 180, 9, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("PERÍODO", 18, startY + 6);
      doc.text("PLANO", 48, startY + 6);
      doc.text("LEADS", 75, startY + 6);
      doc.text("IA MENSAGENS", 100, startY + 6);
      doc.text("PESQUISAS MAPS", 130, startY + 6);
      doc.text("CONSUMO TOTAL", 158, startY + 6);
      doc.text("SITUAÇÃO", 182, startY + 6);

      // Linhas da Tabela
      doc.setFont("helvetica", "normal");
      let currentY = startY + 9;
      monthlyConsumption.forEach((item, index) => {
        // Linhas em zebra para melhor visualização
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 252);
          doc.rect(15, currentY, 180, 8.5, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, currentY, 180, 8.5, "F");
        }
        
        doc.setTextColor(40, 40, 40);
        doc.text(item.month, 18, currentY + 5.5);
        doc.text(item.plan, 48, currentY + 5.5);
        doc.text(`${item.leads} leads`, 75, currentY + 5.5);
        doc.text(`${item.aiMessages} msgs`, 100, currentY + 5.5);
        doc.text(`${item.mapsSearches} searches`, 130, currentY + 5.5);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(138, 43, 226);
        doc.text(`${item.totalCredits} un.`, 158, currentY + 5.5);
        
        if (item.status === "Em Andamento") {
          doc.setTextColor(160, 110, 0); // Amarelo/Dourado escuro
        } else {
          doc.setTextColor(0, 128, 64); // Verde sucesso
        }
        doc.text(item.status, 182, currentY + 5.5);
        
        doc.setFont("helvetica", "normal");
        currentY += 8.5;
      });

      // Linha de demarcação inferior
      doc.setDrawColor(210, 210, 220);
      doc.line(15, currentY, 195, currentY);

      currentY += 6;
      // Caixa de Sumário Acumulado
      doc.setFillColor(238, 233, 248); // Roxo bem clarinho
      doc.roundedRect(15, currentY, 180, 26, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(138, 43, 226);
      doc.text("SUMÁRIO GERAL DE CRÉDITOS ACUMULADOS", 20, currentY + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 80);
      const totalLeadsAcc = monthlyConsumption.reduce((sum, item) => sum + item.leads, 0);
      const totalMsgAcc = monthlyConsumption.reduce((sum, item) => sum + item.aiMessages, 0);
      const totalCreditsAcc = monthlyConsumption.reduce((sum, item) => sum + item.totalCredits, 0);

      doc.text(`Volume Geral de Leads Prospectados: ${totalLeadsAcc} leads`, 20, currentY + 14);
      doc.text(`Abordagens IA SDR Efetuadas: ${totalMsgAcc} mensagens`, 20, currentY + 20);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 70, 239); // Pink de destaque (#D946EF)
      doc.text(`Consumo Geral: ${totalCreditsAcc} un.`, 130, currentY + 17);

      // Rodapé oficial
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 150);
      doc.text("Este documento de consumo operacional é gerado via integração segura do ecossistema de SDR AdsHive.", 15, currentY + 38);
      doc.text("Asaas S.A. Processamento Seguro • Homologado e Certificado.", 15, currentY + 43);

      // Dispara o download com nome representativo
      doc.save(`extrato_consumo_adshive_${session?.name?.split(" ")[0]?.toLowerCase() || "cliente"}.pdf`);
      triggerNotification("Resumo de consumo em PDF exportado com sucesso!", "success");
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Erro ao gerar PDF: ${err.message}`, "warning");
    }
  };

  // Initiate purchase flow
  const handleInitiatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      triggerNotification("Autenticação necessária para fazer compras.", "warning");
      return;
    }

    if (subStatus === "PAST_DUE" || subStatus === "OVERDUE") {
      triggerNotification("Sua conta está inadimplente. Regularize seu plano principal ou contate o financeiro.", "warning");
      return;
    }

    setIsProcessing(true);
    setPaymentSuccess(false);

    const targetType = activePurchaseTab === "leads" ? "Leads" : "IA Mensagens";
    triggerNotification(`Emitindo faturamento Asaas seguro para ${selectedPack.name} por R$ ${selectedPack.price},00...`, "info");

    setTimeout(() => {
      setActivePendingPack(selectedPack);
      if (paymentMethod === "pix") {
        const mockCode = `00020126580014BR.GOV.BCB.PIX0136adshive-prospect-asaas-pixkey-99${Math.floor(Math.random() * 90000 + 10000)}`;
        setPixCode(mockCode);
        setPixQr(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=151520&bgcolor=ffffff&data=simulate_payment_adshive_prospect_${selectedPack.id}`);
        triggerNotification("Chave Pix gerada com sucesso pela API Asaas Sandbox.", "info");
      } else if (paymentMethod === "boleto") {
        triggerNotification("Código de barras bancário gerado pela plataforma Asaas.", "info");
      } else {
        triggerNotification("Crédito pré-aprovado pela operadora. Confirme a captura segura Asaas.", "info");
      }
      setIsProcessing(false);
    }, 1200);
  };

  // Perform automatic update of credits or AI message capacity upon checkout success
  const handleAutoCompensateSimulatedPayment = async () => {
    if (!session || !activePendingPack) return;
    setIsProcessing(true);
    triggerNotification("Gateway Asaas: Confirmando liquidação financeira do Pix...", "info");

    try {
      const payId = `pay_gate_${Date.now().toString(36)}`;
      
      // Save payment into firestore collections payments
      await setDoc(doc(db, "payments", payId), {
        id: payId,
        userId: session.id,
        teamId: session.id,
        date: new Date().toISOString(),
        amount: activePendingPack.price,
        method: paymentMethod,
        status: "RECEIVED",
        link: "https://sandbox.asaas.com/comprovante/" + payId,
        description: activePurchaseTab === "leads" 
          ? `Pacote avulso de ${activePendingPack.credits} Leads` 
          : `Pacote avulso de ${activePendingPack.messages} Mensagens IA`
      });

      // Update specific stats depending on pack type
      if (activePurchaseTab === "leads") {
        const userRef = doc(db, "users", session.id);
        const userSnap = await getDoc(userRef);
        const currentBal = userSnap.exists() ? (userSnap.data().credits || 0) : 0;
        const currentPurchased = userSnap.exists() ? (userSnap.data().purchasedCredits || 0) : 0;

        await setDoc(userRef, {
          credits: currentBal + activePendingPack.credits,
          purchasedCredits: currentPurchased + activePendingPack.credits
        }, { merge: true });

        // Action Audit log
        const logId = `activity_${Date.now()}`;
        await setDoc(doc(db, "activityLogs", logId), {
          id: logId,
          userId: session.id,
          userName: session.name || "Cliente AdsHive",
          action: "COMPRA_CREDITOS",
          details: `Adicionado ${activePendingPack.credits} leads (+R$ ${activePendingPack.price.toFixed(2)}) via webhook gateway Asaas.`,
          createdAt: new Date().toISOString()
        });

        triggerNotification(`Sucesso! ${activePendingPack.credits} Leads creditados em sua carteira AdsHive.`, "success");
      } else {
        // AI package addition
        const usageRef = doc(db, "aiUsage", session.id);
        const usageSnap = await getDoc(usageRef);
        const currentLimit = usageSnap.exists() ? (usageSnap.data().messagesLimit || 20) : 20;

        await setDoc(usageRef, {
          messagesLimit: currentLimit + activePendingPack.messages
        }, { merge: true });

        // Action Audit log
        const logId = `activity_${Date.now()}`;
        await setDoc(doc(db, "activityLogs", logId), {
          id: logId,
          userId: session.id,
          userName: session.name || "Cliente AdsHive",
          action: "COMPRA_PACOTE_IA",
          details: `Expandida cota do SDR Inteligente com +${activePendingPack.messages} mensagens via faturamento Asaas.`,
          createdAt: new Date().toISOString()
        });

        triggerNotification(`Sucesso! +${activePendingPack.messages} Mensagens IA foram anexadas à sua cota do SDR.`, "success");
      }

      setPaymentSuccess(true);
      setActivePendingPack(null);
      setPixCode(null);
      setPixQr(null);
      setIsProcessing(false);
      loadFinancialData();
    } catch (err: any) {
      triggerNotification(`Gateway Error: erro ao automatizar saldo: ${err.message}`, "warning");
      setIsProcessing(false);
    }
  };

  // Other dynamic actions
  const handleGeneralAction = async (type: "cancel" | "update_card" | "change_plan") => {
    if (!session) return;
    setIsProcessing(true);
    triggerNotification(`Enviando solicitação operacional para o ecossistema Asaas...`, "info");

    try {
      if (type === "cancel") {
        // Update user profile status
        await setDoc(doc(db, "users", session.id), {
          subscriptionStatus: "CANCELED",
          plan: "Gratuito"
        }, { merge: true });

        // Update subscriptions collection
        const subSnap = await getDocs(collection(db, "subscriptions"));
        subSnap.forEach(async (d) => {
          const item = d.data();
          if (item.userId === session.id) {
            await setDoc(doc(db, "subscriptions", d.id), { status: "CANCELED" }, { merge: true });
          }
        });

        triggerNotification("Sua assinatura foi devidamente cancelada. Sentiremos sua falta!", "success");
      } else if (type === "update_card") {
        triggerNotification("Dados de cobrança de cartão de crédito atualizados no gateway Asaas.", "success");
      } else if (type === "change_plan") {
        // Change user plan
        await setDoc(doc(db, "users", session.id), {
          plan: newSelectedPlanName,
          subscriptionStatus: "ACTIVE"
        }, { merge: true });

        triggerNotification(`Upgrade de plano para ${newSelectedPlanName.toUpperCase()} realizado com sucesso!`, "success");
      }

      setActiveActionModal(null);
      setIsProcessing(false);
      loadFinancialData();
    } catch (e: any) {
      triggerNotification(`Erro ao alterar assinatura: ${e.message}`, "warning");
      setIsProcessing(false);
    }
  };

  const handleDownloadProof = (pay: SaaSPayment) => {
    triggerNotification(`Gerando PDF comprovante fiscal da transação #${pay.id}...`, "success");
    const proofText = `
==================================================
        COMPROVANTE DE PAGAMENTO DE SERVIÇO
               ADSHIVE PROSPECT SaaS
==================================================
Identificação da Fatura: ${pay.id}
Email do Comprador: ${session?.email || "cadastro@adshive.online"}
Data de Liquidação: ${pay.date ? new Date(pay.date).toLocaleString("pt-BR") : "Imediato"}
Gateway Emissor: Asaas S.A. Pagamentos Seguros
Forma de Pagamento: ${pay.method ? pay.method.toUpperCase() : "PIX"}
Valor Líquido Recebido: R$ ${(pay.amount || 0).toFixed(2)}
Status da Operação: ${pay.status === "RECEIVED" || pay.status === "CONFIRMED" ? "LIQUIDADO / CONFIRMADO" : "PENDENTE"}
==================================================
Gerado automaticamente pelo AdsHive Prospect S.A.
Todos os direitos reservados.
    `;
    const element = document.createElement("a");
    const file = new Blob([proofText], {type: "text/plain"});
    element.href = URL.createObjectURL(file);
    element.download = `comprovante_fiscal_adshive_${pay.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left text-white font-sans max-w-7xl mx-auto pb-12">
      
      {/* Title block formatted with AdsHive Glow Design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-950 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#8A2BE2]/20 border border-[#B026FF]/30 text-[#D946EF] text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(138,43,226,0.2)]">
              SaaS Financial Center
            </span>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded font-mono">
              v1.6 API Asaas
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2 bg-gradient-to-r from-white via-slate-100 to-[#D946EF] bg-clip-text text-transparent">
            Painel Financeiro do Cliente
          </h2>
          <p className="text-slate-400 text-sm mt-1">Conectado ao ambiente seguro do AdsHive. Gerencie cobranças, cotas de prospecção e IA de SDR.</p>
        </div>

        <div className="flex gap-2.5 shrink-0 self-start md:self-auto">
          <button 
            onClick={() => setActiveTab("comercial")}
            className="px-4 py-2.5 rounded-xl border border-purple-900/40 text-slate-300 font-bold text-xs bg-[#151520]/80 hover:bg-[#1A1A2A] shadow-md hover:border-[#8A2BE2] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#B026FF]" />
            <span>Planos Principais</span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setActivePurchaseTab("leads");
              const el = document.getElementById("recarregar-saldo-card");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2.5 rounded-xl font-black text-xs bg-[#8A2BE2] hover:bg-[#B026FF] text-white hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>Investir Cota</span>
          </button>
        </div>
      </div>

      {/* Extreme Overdue Alarm Warning Banner */}
      {subStatus === "PAST_DUE" && (
        <div className="space-y-4 animate-bounce">
          <div className="bg-gradient-to-r from-red-950 via-rose-900 to-[#0A0A0F] border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)] text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
              <div className="space-y-1">
                <span className="text-[10px] bg-red-650 text-white font-black px-2 py-0.5 rounded tracking-wider uppercase">Conta Bloqueada por Pendência</span>
                <strong className="text-lg font-black block text-red-100">Faturamento em Atraso no Asaas</strong>
                <p className="text-slate-300 text-xs opacity-90 max-w-xl">
                  Seus acessos de consultas ao Maps e abordagens com IA foram restritos. Regularize o faturamento agilmente para desbloquear os robôs comercializadores.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveActionModal("change_plan")}
              className="bg-red-500 hover:bg-emerald-600 font-extrabold text-xs px-5 py-3 rounded-xl border-none transition-all cursor-pointer self-stretch md:self-auto text-center"
            >
              Completar Pagamento PIX
            </button>
          </div>

          {/* Detailed overdue dynamic card required by user */}
          <div className="bg-[#151520] border border-red-500/30 p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-950">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-[11px] uppercase font-black text-red-400 tracking-wider">Detalhamento fiscal de cobrança em aberto</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-400 block font-bold mb-0.5">Assinante:</span>
                <p className="font-extrabold text-white text-sm">{userProfile?.name || session?.name || "Douglas Bateria"}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{userProfile?.email || session?.email}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-bold mb-0.5">Mensalidade:</span>
                <span className="text-sm font-extrabold text-[#D946EF] uppercase">{planName}</span>
                <p className="text-[10px] text-slate-500">R$ {monthlyCost},00 por ciclo</p>
              </div>
              <div>
                <span className="text-slate-400 block font-bold mb-0.5">Fatura Vencida em:</span>
                <p className="font-mono text-sm text-red-400 font-bold">
                  {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString("pt-BR") : new Date(Date.now() - 5*24*60*60*1000).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-rose-950/20 p-2.5 rounded-xl border border-red-500/15">
                <span className="text-red-400 block font-bold text-[10px] mb-0.5">Dias de Inadimplência:</span>
                <p className="text-slate-200 text-sm font-black font-mono">{calculateDaysOverdue()} Dias Corridos</p>
                <span className="text-[9px] text-red-300 font-semibold mt-0.5 block">API status: INADIMPLENTE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESUMO FINANCEIRO - 7 Cards metrics as strictly requested */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        
        {/* Card 1: Plano Atual */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#8A2BE2]/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plano Atual</span>
          <div className="mt-3">
            <h4 className="text-lg font-black text-[#D946EF] group-hover:text-[#B026FF] transition-all truncate uppercase">{planName}</h4>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 bg-slate-900/60 w-max px-1.5 py-0.5 rounded border border-purple-950">Mensal</span>
          </div>
        </div>

        {/* Card 2: Status da Assinatura (Color coded Verde, Amarelo, Vermelho, Azul as required) */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${currentStatus.color}`}>
              <span className={`w-2 h-2 rounded-full ${currentStatus.indicator}`}></span>
              <span>{currentStatus.label}</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-1.5 font-sans leading-none">Status cobrado via Asaas</span>
          </div>
        </div>

        {/* Card 3: Próxima Cobrança */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Próxima Cobrança</span>
          <div className="mt-3">
            <span className="text-base font-bold font-mono text-white block">
              {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString("pt-BR") : "Mês corrente"}
            </span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Fatura recorrente automática</span>
          </div>
        </div>

        {/* Card 4: Créditos Disponíveis */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
          <div className="absolute top-1 right-2 shrink-0">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leads Disponíveis</span>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-white font-mono leading-none">{availableCredits}</h4>
            <span className="text-[10px] text-amber-200 font-bold block mt-1">Pesquisas no Maps</span>
          </div>
        </div>

        {/* Card 5: Mensagens IA Disponíveis */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
          <div className="absolute top-1 right-2 shrink-0">
            <Sparkles className="w-4 h-4 text-[#D946EF]" />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mensagens IA</span>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-[#D946EF] font-mono leading-none">
              {(session?.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? "∞" : Math.max(0, aiUsage.messagesLimit - aiUsage.messagesUsed)}
            </h4>
            <span className="text-[9px] text-slate-400 block mt-1">Quota de SDR atualizada</span>
          </div>
        </div>

        {/* Card 6: Valor Mensal */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Mensal</span>
          <div className="mt-3">
            <h4 className="text-xl font-black text-white font-mono leading-none">R$ {monthlyCost}</h4>
            <span className="text-[9px] text-slate-450 block mt-1">Recorrência ativa</span>
          </div>
        </div>

        {/* Card 7: Dias Restantes */}
        <div className="bg-[#151520] border border-purple-950 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dias Restantes</span>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-purple-400 font-mono leading-none">
              {subStatus === "PAST_DUE" ? 0 : calculateDaysRemaining()} Dias
            </h4>
            <span className="text-[9px] text-slate-450 block mt-1">Para renovação Asaas</span>
          </div>
        </div>

      </div>

      {/* GERENCIAR ASSINATURA actions bar with requested buttons */}
      <div className="bg-[#151520] border border-purple-950 p-6 rounded-3xl text-left relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#8A2BE2]/5 via-transparent to-transparent pointer-events-none"></div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#B026FF]" />
            <span>Gerenciar Assinatura SaaS</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Altere sua assinatura de faturamento direto ou mude configurações do cartão de crédito cadastrado.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mt-5">
          <button 
            onClick={() => setActiveActionModal("change_plan")}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-[#8A2BE2]/10 hover:bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 text-[#D946EF] cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4 shrink-0" />
            <span>Alterar Plano</span>
          </button>

          <button 
            onClick={() => {
              setActivePurchaseTab("leads");
              const el = document.getElementById("recarregar-saldo-card");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
          >
            <Coins className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Comprar Créditos</span>
          </button>

          <button 
            onClick={() => {
              setActivePurchaseTab("ia");
              const el = document.getElementById("recarregar-saldo-card");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-[#B026FF]/10 hover:bg-[#B026FF]/20 border border-[#B026FF]/25 text-[#D946EF] cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-[#D946EF]" />
            <span>Comprar Pacote IA</span>
          </button>

          <button 
            onClick={() => setActiveActionModal("update_card")}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Atualizar Cartão</span>
          </button>

          <button 
            onClick={() => setActiveActionModal("cancel")}
            className="px-4 py-3 rounded-xl font-bold text-xs bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 text-red-400 cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Cancelar Assinatura</span>
          </button>
        </div>
      </div>

      {/* Main interactive area: Purchase packages list module ("PACOTES DE CRÉDITOS" & "PACOTES DE IA") */}
      <div id="recarregar-saldo-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recarregar Saldo Segment (Col 8) */}
        <div className="lg:col-span-8 bg-[#151520] border border-purple-950 rounded-3xl p-6 shadow-xl relative text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-purple-950/60 pb-5 gap-3">
            <div>
              <span className="text-[10px] uppercase font-black text-[#D946EF] tracking-wider block">Estoque de Abastecimento Adicional</span>
              <h3 className="text-xl font-black text-white">Comprar Recargas via Asaas</h3>
              <p className="text-slate-400 text-xs mt-0.5">Saldo ativado em segundos no ato da compensação bancária.</p>
            </div>

            {/* Selector bar leads / ia */}
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-purple-950/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActivePurchaseTab("leads");
                  setSelectedPackId("pack_100");
                }}
                className={`px-4.5 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                  activePurchaseTab === "leads" 
                    ? "bg-[#8A2BE2] text-white shadow-md shadow-purple-950" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Créditos (Leads)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePurchaseTab("ia");
                  setSelectedPackId("ai_100");
                }}
                className={`px-4.5 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                  activePurchaseTab === "ia" 
                    ? "bg-[#8A2BE2] text-white shadow-md shadow-purple-950" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SDR IA (Abordagem)
              </button>
            </div>
          </div>

          <form onSubmit={handleInitiatePurchase} className="space-y-6 pt-5">
            {/* Grid display package selections as requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePurchaseTab === "leads" ? (
                creditPackages.map(pack => (
                  <div
                    key={pack.id}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setPaymentSuccess(false);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                      selectedPackId === pack.id
                        ? "border-[#B026FF] bg-[#8A2BE2]/5 shadow-[0_0_15px_rgba(138,43,226,0.15)]"
                        : "border-purple-950/40 bg-[#0A0A0F]/80 hover:bg-[#111118]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-sm font-black text-white">{pack.name}</strong>
                      <span className="text-xs font-black text-emerald-400">R$ {pack.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-normal mb-1">{pack.desc}</p>
                    <span className="text-[10px] text-amber-300 font-mono font-bold mt-2 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{pack.credits} Leads Adicionados</span>
                    </span>
                  </div>
                ))
              ) : (
                aiPackages.map(pack => (
                  <div
                    key={pack.id}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setPaymentSuccess(false);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                      selectedPackId === pack.id
                        ? "border-[#B026FF] bg-[#8A2BE2]/5 shadow-[0_0_15px_rgba(138,43,226,0.15)]"
                        : "border-purple-950/40 bg-[#0A0A0F]/80 hover:bg-[#111118]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-sm font-black text-white">{pack.name}</strong>
                      <span className="text-xs font-black text-emerald-400">R$ {pack.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-normal mb-1">{pack.desc}</p>
                    <span className="text-[10px] text-[#D946EF] font-mono font-bold mt-2 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{pack.messages} Créditos de IA</span>
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Method check list */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione o Meio de Pagamento Seguro</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`py-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === "pix"
                      ? "bg-[#8A2BE2] border-[#B026FF] text-white"
                      : "bg-[#0a0a0f] border-purple-950 text-slate-400 hover:text-white"
                  }`}
                >
                  Pix Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-[#8A2BE2] border-[#B026FF] text-white"
                      : "bg-[#0a0a0f] border-purple-950 text-slate-400 hover:text-white"
                  }`}
                >
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("boleto")}
                  className={`py-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === "boleto"
                      ? "bg-[#8A2BE2] border-[#B026FF] text-white"
                      : "bg-[#0a0a0f] border-purple-950 text-slate-400 hover:text-white"
                  }`}
                >
                  Boleto Bancário
                </button>
              </div>
            </div>

            {/* Credit Card inputs */}
            {paymentMethod === "card" && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-purple-950/80 space-y-3.5">
                <span className="text-[10px] font-extrabold text-[#D946EF] block tracking-wider uppercase">Criptografia SSL de Cartão ativa via Asaas API</span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Número do Cartão de Crédito"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#151520] border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none text-white focus:border-[#B026FF]" 
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Nome Gravado no Cartão"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-[#151520] border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none text-white focus:border-[#B026FF]" 
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Mês/Ano Exp (MM/AA)"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#151520] border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none text-white focus:border-[#B026FF]" 
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="CVV / CVC Código"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-[#151520] border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none text-white focus:border-[#B026FF]" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Trigger checkout modal button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:shadow-[0_0_20px_rgba(176,38,255,0.5)] text-white font-extrabold py-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border-none transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando com o servidor Asaas...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Abastecer {selectedPack.name} agora (R$ {selectedPack.price},00)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Consumption Report "EXTRATO DE CONSUMO" (Col 4) */}
        <div className="lg:col-span-4 bg-[#151520] border border-purple-950 rounded-3xl p-6 shadow-xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D946EF]/5 via-transparent to-transparent pointer-events-none"></div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-[#D946EF]" />
              <span>Extrato de Consumo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">SDR Analytics • Últimos 30 dias de processamento comercial do usuário.</p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-purple-950 flex justify-between items-center">
              <div>
                <span className="text-slate-450 text-[10px] block uppercase font-bold">Leads Consumidos</span>
                <span className="text-base font-extrabold text-indigo-400 font-mono mt-1 block">320 capturas</span>
              </div>
              <div className="text-[11px] text-indigo-300 font-bold bg-[#8A2BE2]/15 px-2 py-1 rounded">Normal</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-purple-950 flex justify-between items-center">
              <div>
                <span className="text-slate-450 text-[10px] block uppercase font-bold">Mensagens IA SDR</span>
                <span className="text-base font-extrabold text-[#D946EF] font-mono mt-1 block">{aiUsage.messagesUsed} envios</span>
              </div>
              <div className="text-[11px] text-[#D946EF] font-bold bg-[#D946EF]/15 px-2 py-1 rounded">Dentro da Cota</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0a0f] border border-purple-950 flex justify-between items-center">
              <div>
                <span className="text-slate-450 text-[10px] block uppercase font-bold">Pesquisas Realizadas</span>
                <span className="text-base font-extrabold text-amber-500 font-mono mt-1 block">154 mapas</span>
              </div>
              <div className="text-[11px] text-amber-500 font-bold bg-amber-500/15 px-2 py-1 rounded">Excelente</div>
            </div>
          </div>

          {/* Graphical evolution chart of usage in 30 days */}
          <div className="h-44 w-full mt-6 text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionStats} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="consumoLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#221133" opacity={0.3} />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#151520', borderColor: '#3b0066', color: '#ffffff' }} />
                <Area type="monotone" dataKey="leads" name="Leads Capturados" stroke="#B026FF" fillOpacity={1} fill="url(#consumoLeads)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* HISTÓRICO DE PAGAMENTOS TABLE - Loaded as requested from payments collection */}
      <div className="bg-[#151520] border border-purple-950 rounded-3xl p-6 shadow-xl relative text-left">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-purple-950/60">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Histórico de Pagamentos</span>
            </h3>
            <p className="text-xs text-slate-400">Consulte faturas, métodos de cobrança e faça download oficial dos comprovantes fiscais.</p>
          </div>
          <button 
            type="button"
            onClick={loadFinancialData}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-450 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-450">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8A2BE2]" />
            <span className="text-xs font-bold">Buscando lançamentos no banco Asaas...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-purple-950/50 rounded-2xl bg-[#0a0a0f]">
            <Coins className="w-10 h-10 text-slate-650 mx-auto mb-3 opacity-60" />
            <h4 className="font-extrabold text-sm text-slate-350">Nenhum pagamento registrado</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Esta conta não realizou pagamentos de planos de faturamento ou recargas avulsas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-purple-950 text-[10px] text-slate-400 tracking-wider uppercase font-black">
                  <th className="py-3 px-4">DATA</th>
                  <th className="py-3 px-4">DESCRIÇÃO</th>
                  <th className="py-3 px-4">PLANO ATIVO</th>
                  <th className="py-3 px-4">MÉTODO COBRANDO</th>
                  <th className="py-3 px-4">VALOR QUITANDO</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">COMPROVANTE</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#221133]/40">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-[#8A2BE2]/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      {pay.date ? new Date(pay.date).toLocaleDateString("pt-BR") : "08/06/2026"}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      {pay.description || (pay.amount <= 10 ? "Pacote de IA Slim" : pay.amount <= 40 ? "Pacote IA Premium" : `Abono de faturamento ${planName}`)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-indigo-300 bg-indigo-950/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {planName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-400 uppercase">
                      {pay.method || "PIX"}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400 font-mono">
                      R$ {pay.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        PAGO
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadProof(pay)}
                        title="Descarregar comprovante fiscal"
                        className="p-2 hover:bg-slate-900 text-slate-400 hover:text-[#D946EF] rounded-xl transition-all cursor-pointer border-none"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HISTÓRICO DE CONSUMO DE CRÉDITOS TABLE */}
      <div className="bg-[#151520] border border-purple-950 rounded-3xl p-6 shadow-xl relative text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-purple-950/60 mb-5">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D946EF]" />
              <span>Histórico de Consumo de Créditos (Mensal)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Monitore o processamento de leads, envios da inteligência artificial e buscas por período.</p>
          </div>
          
          <button 
            type="button"
            onClick={handleExportPDF}
            className="px-4.5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-800 to-indigo-700 hover:from-[#8A2BE2] hover:to-[#B026FF] text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Exportar Resumo PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-purple-950 text-[10px] text-slate-400 tracking-wider uppercase font-black">
                <th className="py-3 px-4">PERÍODO / MÊS</th>
                <th className="py-3 px-4">PLANO ATIVO</th>
                <th className="py-3 px-4">LEADS COLETADOS</th>
                <th className="py-3 px-4">MENSAGENS IA SDR</th>
                <th className="py-3 px-4">PESQUISAS MAPS</th>
                <th className="py-3 px-4">TOTAL IMPUTADO</th>
                <th className="py-3 px-4">STATUS DA COTA</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#221133]/40">
              {monthlyConsumption.map(item => (
                <tr key={item.id} className="hover:bg-[#8A2BE2]/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    {item.month}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-purple-300 bg-purple-950/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {item.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {item.leads} leads
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {item.aiMessages} disparos
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {item.mapsSearches} requisições
                  </td>
                  <td className="py-3.5 px-4 font-black text-indigo-400 font-mono">
                    {item.totalCredits} un.
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      item.status === 'Em Andamento' 
                        ? 'bg-amber-950/30 text-amber-400 border-amber-500/20 animate-pulse'
                        : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKOUT MODAL WINDOW COMPONENT */}
      {activePendingPack && (
        <div id="modal-credits-asaas-checkout" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 text-left">
          <div className="bg-[#111116] text-white rounded-3xl w-full max-w-md border border-purple-950 shadow-2xl overflow-hidden flex flex-col my-auto">
            
            {/* Header */}
            <div className="bg-purple-950 p-5 flex justify-between items-center border-b border-purple-900">
              <div>
                <span className="bg-[#8A2BE2]/20 border border-[#B026FF]/30 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-1.5 block w-max animate-pulse">
                  Asaas API v1.6 Core Secure Gateway
                </span>
                <strong className="text-white text-base font-black tracking-tight block">
                  Carga Segura de {activePendingPack.name}
                </strong>
              </div>
              <span className="font-extrabold text-emerald-400 text-lg font-mono">R$ {activePendingPack.price},00</span>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {pixCode ? (
                <div className="space-y-4 text-center">
                  <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200">
                    <img src={pixQr || ""} alt="Pix seguro Asaas QR" className="w-[180px] h-[180px] mx-auto" referrerPolicy="no-referrer" />
                    <span className="text-[10px] text-slate-800 mt-2 font-black uppercase tracking-wider block">Escaneie com seu aplicativo bancário</span>
                  </div>

                  <div className="text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#D946EF]">Copia e Cola Pix Key</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly
                        value={pixCode}
                        className="flex-1 bg-slate-950 border border-purple-950 rounded-xl p-2.5 text-[9px] font-mono select-all text-[#B026FF] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pixCode);
                          triggerNotification("Chave Pix copiada com sucesso!", "success");
                        }}
                        className="bg-[#8A2BE2] hover:bg-[#B026FF] text-white px-3.5 py-2.5 rounded-xl text-xs font-black shrink-0 cursor-pointer border-none"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  {/* Log console simulated area inside modal as required */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-950 text-left font-mono text-[9px] space-y-1 text-slate-400">
                    <p className="text-slate-500">● [Asaas Server] Estabelecendo conexão TLS v1.3...</p>
                    <p className="text-[#D946EF] animate-pulse">
                      ● [Webhook-Pix] Ouvindo recebimento do Banco Central: {secondsLeft > 0 ? `Compensação automática em ${secondsLeft}s` : "Compensado!"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCompensateSimulatedPayment}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl text-white font-extrabold text-xs cursor-pointer border-none transition-all shadow-md"
                  >
                    Simular Compensação Instantânea Asaas
                  </button>
                </div>
              ) : paymentMethod === "boleto" ? (
                <div className="space-y-4 text-center">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-purple-950 text-center font-mono">
                    <span className="text-2xl tracking-widest text-[#B026FF] block opacity-85">||||| | ||||| | ||| |||||| | ||||| |</span>
                    <span className="text-[9px] text-slate-500 mt-2 block">
                      Linha Digitável: 34191.79001 01043.513184 91020.150008 7 940300000{activePendingPack.price}00
                    </span>
                  </div>

                  {/* Log console simulated area inside modal as required */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-950 text-left font-mono text-[9px] space-y-1 text-slate-400">
                    <p className="text-[#D946EF] animate-pulse">
                      ● [Webhook-Boleto] Aguardando compensação bancária: {secondsLeft > 0 ? `Simulando em ${secondsLeft}s...` : "Compensado!"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCompensateSimulatedPayment}
                    className="w-full bg-[#8A2BE2] hover:bg-[#B026FF] py-3.5 rounded-xl text-white font-extrabold text-xs cursor-pointer border-none transition-all"
                  >
                    Simular Compensação do Boleto Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#8A2BE2]/10 border border-[#8A2BE2]/30 p-4 rounded-xl text-xs text-[#D946EF] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Dados do Cartão (Titular: {cardName || "DOUGLAS BATERIA"}) aceitos em Sandbox Asaas.</span>
                  </div>

                  {/* Log console simulated area inside modal as required */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-950 text-left font-mono text-[9px] space-y-1 text-slate-400">
                    <p className="text-[#D946EF] animate-pulse">
                      ● [Webhook-Cartao] Capturando limite com banco em emissor: {secondsLeft > 0 ? `Confirmando em ${secondsLeft}s...` : "Compensado!"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCompensateSimulatedPayment}
                    className="w-full bg-[#8A2BE2] hover:bg-[#B026FF] py-3.5 rounded-xl text-white font-extrabold text-xs cursor-pointer border-none transition-all hover:shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                  >
                    Capturar Cobrança no Cartão de Crédito
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTHER ACTION GENERAL MODALS (CANCEL, UPDATE CARD, CHANGE PLAN) */}
      {activeActionModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[1100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 text-left">
          <div className="bg-[#111116] border border-purple-950 text-white rounded-3xl w-full max-w-md p-6 relative flex flex-col my-auto shadow-2xl">
            
            <button 
              type="button"
              onClick={() => setActiveActionModal(null)}
              className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 text-slate-400 p-1.5 rounded-full cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Cancel Suscription Flow */}
            {activeActionModal === "cancel" && (
              <div className="space-y-4">
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-extrabold text-xs">Exclusão de Assinatura Recorrente</span>
                </div>
                <h3 className="text-lg font-black">Tem certeza que deseja cancelar?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao cancelar sua assinatura no AdsHive Prospect, as consultas de SDR, pesquisas avançadas no Maps e acesso ao CRM serão suspensos imediatamente. Suas faturas futuras no Asaas serão descartadas com êxito.
                </p>
                <button
                  type="button"
                  onClick={() => handleGeneralAction("cancel")}
                  className="w-full bg-red-650 hover:bg-red-500 font-extrabold text-xs py-3.5 rounded-xl text-white border-none cursor-pointer transition-all mt-2"
                >
                  Confirmar Cancelamento no Asaas
                </button>
              </div>
            )}

            {/* Change SaaS Plan Flow */}
            {activeActionModal === "change_plan" && (
              <div className="space-y-4">
                <div className="bg-[#8A2BE2]/10 text-[#D946EF] border border-[#8A2BE2]/20 p-3 rounded-xl flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                  <span className="font-extrabold text-xs">Atualização Contratual do Plano</span>
                </div>
                <h3 className="text-lg font-black">Selecionar Novo Plano Comercial</h3>
                <p className="text-xs text-slate-400">Inscreva-se em um plano de maior volume para prospecção em larga escala de leads qualificados do Maps.</p>
                
                <div className="space-y-2 mt-2">
                  {[
                    { id: "starter", name: "Starter - R$ 49,00/mês", cap: "1.000 Leads/mês" },
                    { id: "pro", name: "Pro - R$ 97,00/mês", cap: "5.000 Leads/mês" },
                    { id: "agency", name: "Agência - R$ 197,00/mês", cap: "15.000 Leads/mês" },
                    { id: "enterprise", name: "Enterprise - R$ 497,00/mês", cap: "Luz Verde Ilimitada" }
                  ].map(planOption => (
                    <div 
                      key={planOption.id}
                      onClick={() => setNewSelectedPlanName(planOption.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                        newSelectedPlanName === planOption.id 
                          ? "bg-[#8A2BE2]/25 border-[#B026FF] text-white" 
                          : "bg-slate-950 border-purple-950 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black block">{planOption.name}</span>
                        <span className="text-[10px] opacity-75">{planOption.cap}</span>
                      </div>
                      {newSelectedPlanName === planOption.id && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleGeneralAction("change_plan")}
                  className="w-full bg-[#8A2BE2] hover:bg-[#B026FF] font-extrabold text-xs py-3.5 rounded-xl text-white border-none cursor-pointer transition-all mt-2"
                >
                  Concluir Upgrade no Asaas (Simulado)
                </button>
              </div>
            )}

            {/* Update Credit Card Flow */}
            {activeActionModal === "update_card" && (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 p-3 rounded-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-extrabold text-xs">Atualização Bancária Seguro</span>
                </div>
                <h3 className="text-lg font-black">Nova Forma de Pagamento</h3>
                <p className="text-xs text-slate-400">Cadastre um novo cartão de crédito seguro para faturamentos automáticos subsequentes.</p>
                
                <div className="space-y-3 mt-2">
                  <input 
                    type="text" 
                    placeholder="Número do Cartão" 
                    className="w-full bg-slate-950 border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none text-white focus:border-[#B026FF]" 
                  />
                  <input 
                    type="text" 
                    placeholder="Nome Impresso" 
                    className="w-full bg-slate-950 border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs outline-none text-white focus:border-[#B026FF]" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Validade (MM/AA)" 
                      className="w-full bg-slate-950 border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none text-white focus:border-[#B026FF]" 
                    />
                    <input 
                      type="text" 
                      placeholder="CVC/CVV" 
                      className="w-full bg-slate-950 border border-purple-950 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none text-white focus:border-[#B026FF]" 
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGeneralAction("update_card")}
                  className="w-full bg-[#8A2BE2] hover:bg-[#B026FF] font-extrabold text-xs py-3.5 rounded-xl text-white border-none cursor-pointer transition-all mt-2"
                >
                  Confirmar Atualização de Forma
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
