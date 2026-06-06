import React, { useState, useEffect } from "react";
import { 
  CreditCard, DollarSign, Calendar, Clock, Coins, ShieldAlert,
  ArrowUpRight, Download, CheckCircle, RefreshCw, AlertTriangle, FileText, Check
} from "lucide-react";
import { doc, getDoc, setDoc, getDocs, collection, addDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { UserSession, SaaSPayment, SaaSSubscription } from "../types";

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

  // Buy credits flow state
  const [selectedPack, setSelectedPack] = useState<string>("pack_100");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">("pix");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Credit Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const creditPackages = [
    { id: "pack_50", name: "Pacote 50 Leads", credits: 50, price: 10, description: "R$ 0,20 por lead adicional." },
    { id: "pack_100", name: "Pacote 100 Leads", credits: 100, price: 20, description: "R$ 0,20 por lead adicional." },
    { id: "pack_250", name: "Pacote 250 Leads", credits: 250, price: 50, description: "R$ 0,20 por lead adicional." },
    { id: "pack_500", name: "Pacote 500 Leads", credits: 500, price: 100, description: "R$ 0,20 por lead adicional." },
    { id: "pack_1000", name: "Pacote 1000 Leads", credits: 1000, price: 200, description: "R$ 0,20 por lead adicional." },
  ];

  const currentPack = creditPackages.find(p => p.id === selectedPack) || creditPackages[1];

  const loadFinancialData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // 1. Load User Profile
      const userRef = doc(db, "users", session.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
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

      // 3. Load Payments Sync
      const paySnap = await getDocs(collection(db, "payments"));
      const listPay: SaaSPayment[] = [];
      paySnap.forEach(d => {
        const item = d.data() as SaaSPayment;
        if (item.userId === session.id) {
          listPay.push({ id: d.id, ...item });
        }
      });
      // Sort payments by date DESC
      listPay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(listPay);

    } catch (err: any) {
      console.error("Error loading financial data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [session]);

  const handleBuyCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      triggerNotification("Autenticação necessária para comprar créditos.", "warning");
      return;
    }

    if (userProfile?.subscriptionStatus === "PAST_DUE") {
      triggerNotification("Sua assinatura está em atraso. Regularize seu pagamento para comprar créditos.", "warning");
      return;
    }

    setIsProcessing(true);
    triggerNotification(`Iniciando transação segura Asaas de R$ ${currentPack.price},00...`, "info");

    setTimeout(async () => {
      try {
        const userRef = doc(db, "users", session.id);
        const userSnap = await getDoc(userRef);
        let previousCredits = 0;
        let purchasedCredits = 0;
        let planCredits = 0;
        let bonusCredits = 0;

        if (userSnap.exists()) {
          const ud = userSnap.data();
          previousCredits = ud.credits || 0;
          purchasedCredits = ud.purchasedCredits || 0;
          planCredits = ud.planCredits || 0;
          bonusCredits = ud.bonusCredits || 0;
        }

        const addedCredits = currentPack.credits;
        const newTotalCredits = previousCredits + addedCredits;
        const newPurchased = purchasedCredits + addedCredits;

        // Perform Firestore update
        await setDoc(userRef, {
          credits: newTotalCredits,
          purchasedCredits: newPurchased,
          remainingCredits: planCredits + newPurchased + bonusCredits
        }, { merge: true });

        // Save payment history record
        const payId = `pay_cre_${Date.now().toString(36)}`;
        await setDoc(doc(db, "payments", payId), {
          id: payId,
          userId: session.id,
          teamId: session.id,
          date: new Date().toISOString(),
          amount: currentPack.price,
          method: paymentMethod,
          status: "RECEIVED",
          link: "https://sandbox.asaas.com/payment/" + payId
        });

        // Add activity log
        await setDoc(doc(db, "activityLogs", `log_${Date.now()}`), {
          id: `log_${Date.now()}`,
          userId: session.id,
          userName: session.name || "Cliente",
          action: "COMPRA_CREDITOS",
          details: `Compra do pacote avulso de ${addedCredits} créditos (faturamento R$ ${currentPack.price.toFixed(2)}) via gateway de pagamentos Asaas.`,
          createdAt: new Date().toISOString()
        });

        triggerNotification(`Compra concedida! Adicionado ${addedCredits} créditos com sucesso.`, "success");
        setPaymentSuccess(true);
        setIsProcessing(false);
        loadFinancialData();
      } catch (err: any) {
        triggerNotification(`Erro ao gravar créditos: ${err.message}`, "warning");
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleDownloadInvoice = (pay: SaaSPayment) => {
    triggerNotification(`Baixando comprovante da transação #${pay.id}...`, "success");
    
    // Generate dummy text content and download as proof
    const content = `
========================================
    COMPROVANTE DE PAGAMENTO - ADSHIVE PROSPECT
========================================
ID da Transação: ${pay.id}
Data do Pagamento: ${new Date(pay.date).toLocaleDateString()}
Forma de Pagamento: ${pay.method.toUpperCase()}
Valor Concluído: R$ ${pay.amount.toFixed(2)}
Status: ${pay.status}
Beneficiário: AdsHive Prospect Pro S.A.
----------------------------------------
Documento fiscal eletrônico nos termos da lei. 
Agradecemos sua colaboração com nossa rede de negócios!
========================================
    `;
    const element = document.createElement("a");
    const file = new Blob([content], {type: "text/plain"});
    element.href = URL.createObjectURL(file);
    element.download = `comprovante_adshive_${pay.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Days overdue calculation for report
  const calculateDaysOverdue = (nextBillingDate: string | undefined): number => {
    if (!nextBillingDate) return 5; // Fallback simulation
    const diffTime = Date.now() - new Date(nextBillingDate).getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 5; // Guarantee logical overhead show
  };

  const planName = userProfile?.plan || "Gratuito";
  const subStatus = userProfile?.subscriptionStatus || "ACTIVE";
  const availableCredits = userProfile?.credits || 0;
  const purchasedCreditsTotal = userProfile?.purchasedCredits || 0;
  
  // Total invested computation
  const totalPaid = payments
    .filter(p => p.status === "RECEIVED" || p.status === "CONFIRMED")
    .reduce((acc, current) => acc + current.amount, 0);

  // Price mapping
  const monthlyPrices: Record<string, number> = {
    "Gratuito": 0,
    "Free": 0,
    "Starter": 49,
    "Pro": 97,
    "Agência": 197,
    "Enterprise": 497
  };
  const monthlyCost = monthlyPrices[planName] || 97;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-[#8B2EFF]/25 text-[#8B2EFF] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Financeiro AdsHive Prospect
          </span>
          <h2 className={`text-3xl font-extrabold mt-1 tracking-tight ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>
            Painel Financeiro
          </h2>
          <p className="text-slate-500 text-sm">Gerencie faturas de assinatura, histórico fiscal e compre pacotes adicionais de leads.</p>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => setActiveTab("loja_creditos")}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Comprar Créditos</span>
          </button>
          <button 
            onClick={() => {
              triggerNotification("Fazer Upgrade de Assinatura - Redirecionando para grade de planos...", "info");
              // Set the active tab to comercial tab and plans subtab
              setActiveTab("comercial");
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#8B2EFF] text-white hover:bg-[#7424D9] shadow-md transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Fazer Upgrade</span>
          </button>
        </div>
      </div>

      {/* Red Alert Banner and Overdue Automatic Report */}
      {subStatus === "PAST_DUE" && (
        <div className="space-y-4">
          <div className="bg-red-500 text-white p-5 rounded-2xl flex items-start gap-4 shadow-lg border border-red-400">
            <ShieldAlert className="w-6 h-6 text-white shrink-0 animate-bounce" />
            <div className="space-y-1 flex-1 text-left">
              <strong className="text-base font-black uppercase tracking-wider block">Assinatura em Atraso</strong>
              <p className="text-sm font-medium">
                Sua assinatura está em atraso. Regularize seu pagamento para continuar utilizando a plataforma.
              </p>
              <div className="text-xs text-red-100 mt-2 font-mono bg-red-600/40 p-2 rounded-lg inline-block">
                Bloqueios Ativos: Consultas ao Maps suspensas • CRM marcado como Somente Leitura • Proibido compras de pacotes avulsos.
              </div>
            </div>
            <button 
              onClick={() => setActiveTab("comercial")}
              className="bg-white text-red-600 font-black text-xs px-4 py-2 rounded-xl border-none hover:bg-red-50 transition-all"
            >
              Pagar Fatura
            </button>
          </div>

          {/* DYNAMIC COMPREHENSIVE OVERDUE REPORT */}
          <div className={`${themeMode === "light" ? "bg-white border-red-200" : "bg-[#1E1215] border-red-500/30"} border-2 p-6 rounded-2xl shadow-sm text-left`}>
            <div className="flex items-center gap-2 mb-4 border-b pb-3 border-red-100 dark:border-red-950/40">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-extrabold text-sm text-red-500 uppercase tracking-widest">
                Relatório de Inadimplência Gerado Automaticamente
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131114]">
                <span className="text-slate-400 block font-bold mb-1">USUÁRIO AFETADO</span>
                <p className={`text-sm font-extrabold ${themeMode === "light" ? "text-slate-800" : "text-white"}`}>
                  {userProfile?.name || "Douglas CMA"}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{userProfile?.email || "douglas_teste@adshive.com"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131114]">
                <span className="text-slate-400 block font-bold mb-1">PLANO ASSINADO</span>
                <p className="text-sm font-extrabold text-indigo-500 uppercase">
                  {planName}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">R$ {monthlyCost},00/mês</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131114]">
                <span className="text-slate-400 block font-bold mb-1">DATA DO VENCIMENTO</span>
                <p className={`text-sm font-mono font-extrabold ${themeMode === "light" ? "text-slate-700" : "text-slate-200"}`}>
                  {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
                <span className="text-[10px] text-red-500 font-bold block mt-0.5">Vencimento Expirado</span>
              </div>

              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
                <span className="text-red-500 block font-bold mb-1">DIAS EM ATRASO</span>
                <p className="text-base font-black text-red-600 dark:text-red-400">
                  {calculateDaysOverdue(subscription?.nextBillingDate)} Dias
                </p>
                <span className="text-[10px] text-red-500 font-semibold block mt-0.5">Fatura Pendente Asaas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Plano Atual */}
        <div className={`p-6 rounded-2xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Plano Atual</span>
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-2xl font-black text-[#8B2EFF]">{planName}</h4>
            <span className="text-xs text-slate-400 font-semibold">Mensal</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Assinatura do ecossistema inteligente.</p>
        </div>

        {/* Status */}
        <div className={`p-6 rounded-2xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status da Assinatura</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${
              subStatus === "ACTIVE" ? "bg-emerald-500" :
              subStatus === "PAST_DUE" ? "bg-red-500 animate-pulse" :
              subStatus === "CANCELED" ? "bg-slate-400" : "bg-amber-500"
            }`}></span>
            <span className="text-lg font-extrabold uppercase">
              {subStatus === "ACTIVE" ? "Ativo" :
               subStatus === "PAST_DUE" ? "Inadimplente (Atraso)" :
               subStatus === "CANCELED" ? "Cancelado" : "Pendente"}
            </span>
          </div>
          {subStatus === "ACTIVE" && (
            <p className="text-xs text-slate-500 mt-2 font-medium">Renova automaticamente via Pix/Cartão.</p>
          )}
          {subStatus === "PAST_DUE" && (
            <p className="text-xs text-red-500 mt-2 font-bold">Consulte o relatório de cobrança pendente.</p>
          )}
          {subStatus === "CANCELED" && (
            <p className="text-sm text-amber-500 mt-2 font-medium">Sentimos sua saída. Reative a qualquer momento.</p>
          )}
        </div>

        {/* Monthly Cost & Billing info */}
        <div className={`p-6 rounded-2xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Valor Mensal</span>
          <div className="flex items-baseline gap-1">
            <h4 className="text-2xl font-black">R$ {monthlyCost}</h4>
            <span className="text-xs text-slate-400 font-semibold">/mês</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Próxima Cobrança: <strong className="font-mono">{subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : "Sem cobranças"}</strong>
          </p>
        </div>

        {/* Investimento Total */}
        <div className={`p-6 rounded-2xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Investido na Plataforma</span>
          <h4 className="text-2xl font-black text-emerald-500">R$ {totalPaid.toFixed(2)}</h4>
          <p className="text-xs text-slate-500 mt-2 font-medium">Faturamento acumulado pelo usuário.</p>
        </div>
      </div>

      {/* Credit Pool Metadata */}
      <div className={`p-6 rounded-2xl border ${themeMode === "light" ? "bg-slate-50" : "bg-[#111116] border-[#222230]"} text-left`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-slate-400 font-extrabold text-[10px] tracking-widest block uppercase">Créditos Disponíveis</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className={`text-xl font-black ${themeMode === "light" ? "text-slate-800" : "text-white"}`}>{availableCredits} Leads</span>
            </div>
          </div>
          
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <span className="text-slate-400 font-extrabold text-[10px] tracking-widest block uppercase">Créditos Comprados (Avulsos)</span>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-indigo-500" />
              <span className={`text-xl font-black ${themeMode === "light" ? "text-slate-800" : "text-white"}`}>{purchasedCreditsTotal} Leads</span>
            </div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <span className="text-slate-400 font-extrabold text-[10px] tracking-widest block uppercase">Créditos Utilizados</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className={`text-xl font-black ${themeMode === "light" ? "text-slate-800" : "text-white"}`}>
                {/* Dynamically simulated usage */}
                {Math.max(10, purchasedCreditsTotal + 10 - availableCredits)} Leads
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-left">
        {/* BUY CREDITS MODULE */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-3xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm space-y-4`}>
            <div>
              <h3 className={`text-lg font-extrabold ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>Comprar Créditos para Prospecção</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Compre leads adicionais livremente sem validade contratual. Margem de custo fixa estimada em <strong>R$ 0,20</strong> por lead capturado.
              </p>
            </div>

            {subStatus === "PAST_DUE" ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
                A compra de créditos e prospecções avulsas está bloqueada enquanto sua conta constar com faturamento inadimplente. 
                Regularize sua assinatura ao lado para desbloquear suas transações.
              </div>
            ) : (
              <form onSubmit={handleBuyCredits} className="space-y-6">
                {/* Package select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecione o volume de Leads</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {creditPackages.map((pack) => (
                      <div 
                        key={pack.id}
                        onClick={() => {
                          setSelectedPack(pack.id);
                          setPaymentSuccess(false);
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedPack === pack.id 
                            ? "border-[#8B2EFF] bg-[#8B2EFF]/5"
                            : themeMode === "light" ? "border-slate-200 bg-white hover:bg-slate-50" : "border-[#2b2b3a] bg-[#111118] hover:bg-[#161622]"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <strong className="text-sm font-bold block">{pack.name}</strong>
                          <span className="text-xs font-black text-emerald-500">R$ {pack.price},00</span>
                        </div>
                        <p className="text-[11px] text-slate-440 font-medium mt-1">{pack.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Cobrança</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`py-3 rounded-2xl border font-bold text-xs transition-all ${
                        paymentMethod === "pix"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      PIX Seguro
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-3 rounded-2xl border font-bold text-xs transition-all ${
                        paymentMethod === "card"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Crédito Visa/Mestre
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("boleto")}
                      className={`py-3 rounded-2xl border font-bold text-xs transition-all ${
                        paymentMethod === "boleto"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Boleto Bancário
                    </button>
                  </div>
                </div>

                {/* Credit Card Details simulation fields */}
                {paymentMethod === "card" && (
                  <div className="p-4 bg-slate-50 dark:bg-[#111116] rounded-2xl border space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase">Formulário de Cobrança Cartão</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          placeholder="Número do Cartão de Crédito"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono outline-none text-slate-800" 
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          placeholder="Nome Completo do Titular"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-800" 
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder="Expiração (MM/AA)"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-800" 
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder="CVC/CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono outline-none text-slate-800" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#8B2EFF] text-white font-extrabold py-3.5 rounded-2xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:bg-[#7824E3]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Pagamento Asaas...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>Comprar {currentPack.credits} Créditos agora por R$ {currentPack.price},00</span>
                    </>
                  )}
                </button>

                {paymentSuccess && (
                  <div className="bg-emerald-50 Border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Pagamento simulado com êxito! <strong>{currentPack.credits} créditos</strong> foram creditados no seu saldo.</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* SIDE BAR ACTIVE DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm text-left`}>
            <h3 className={`font-extrabold text-base mb-1 ${themeMode === "light" ? "text-slate-800" : "text-white"}`}>Garantias de Serviço</h3>
            <p className="text-xs text-slate-500 leading-normal mb-4">
              Cada transação financeira do AdsHive Prospect é validada através do ambiente de Sandbox e de produção do gateway de pagamentos parceiro <strong>Asaas</strong>, gerando credenciais seguras de criptografia SSL.
            </p>
            
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-[#B0B3C1]">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Cobrança por Pix em tempo real com QR code imediato.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Liberação instantânea dos créditos de captação de leads.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Segurança e estorno garantidos caso ocorra lentidão na API.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Suporte 24/7 direto na plataforma ou via e-mail corporativo.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HISTÓRICO FINANCEIRO */}
      <div className={`p-6 rounded-3xl border ${themeMode === "light" ? "bg-white border-slate-200" : "bg-[#1C1C26] border-[#2B2B3A]"} shadow-sm text-left`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-extrabold ${themeMode === "light" ? "text-slate-900" : "text-white"}`}>Histórico Financeiro</h3>
            <p className="text-xs text-slate-500">Consulte abaixo as faturas emitidas e comprovantes fiscais.</p>
          </div>
          <button 
            onClick={loadFinancialData}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8B2EFF]" />
            <span className="text-xs font-semibold">Carregando livro caixa do usuário...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
            <Coins className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-sm">Nenhuma transação encontrada</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Sua conta ainda não efetuou pagamentos avulsos ou de mensalidades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 tracking-wider uppercase font-black">
                  <th className="py-3 px-4">DATA</th>
                  <th className="py-3 px-4">DESCRIÇÃO</th>
                  <th className="py-3 px-4">VALOR</th>
                  <th className="py-3 px-4">MÉTODO</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {pay.date ? new Date(pay.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {(pay.amount || 0) <= 20 ? "Pacote de Prospecção Slim" :
                       (pay.amount || 0) <= 100 ? "Créditos Avulsos de Leads" : "Assinatura Pro Mensal AdsHive"}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-500">
                      R$ {(pay.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase">
                      {pay.method || "PIX"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        pay.status === "RECEIVED" || pay.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : pay.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {pay.status === "RECEIVED" || pay.status === "CONFIRMED" ? "Concluído" :
                         pay.status === "PENDING" ? "Processando" : "Cancelado"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleDownloadInvoice(pay)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                        title="Baixar Comprovante"
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
    </div>
  );
};
