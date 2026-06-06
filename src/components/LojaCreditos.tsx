import React, { useState } from "react";
import { CreditCard, QrCode, ClipboardList, Sparkles, Check, Gift, ShoppingBag, ShieldCheck, HeartHandshake } from "lucide-react";
import { UserSession } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

interface LojaCreditosProps {
  session: UserSession | null;
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
}

export const LojaCreditos: React.FC<LojaCreditosProps> = ({ session, triggerNotification }) => {
  const [selectedPackage, setSelectedPackage] = useState<string>("scale");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "boleto">("pix");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSimulated, setPaymentSimulated] = useState<boolean>(false);
  
  // Credit card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const packages = [
    {
      id: "start",
      name: "PACOTE START",
      credits: 50,
      price: 10.00,
      description: "Ideal para testar pequenos nichos específicos.",
      tag: null,
      color: "from-blue-500 to-indigo-500"
    },
    {
      id: "pro",
      name: "PACOTE PRO",
      credits: 100,
      price: 18.00,
      description: "Economia ideal para SDRs individuais.",
      tag: "Mais Vendido",
      color: "from-indigo-600 to-blue-600"
    },
    {
      id: "business",
      name: "PACOTE BUSINESS",
      credits: 250,
      price: 40.00,
      description: "Custo excelente para prospecção acelerada.",
      tag: "Recomendado",
      color: "from-blue-600 to-indigo-700"
    },
    {
      id: "agency",
      name: "PACOTE AGÊNCIA",
      credits: 500,
      price: 70.00,
      description: "Perfeito para agências de marketing locais.",
      tag: "Melhor Margem",
      color: "from-violet-600 to-indigo-800"
    },
    {
      id: "scale",
      name: "PACOTE ESCALA",
      credits: 1000,
      price: 120.00,
      description: "Máxima economia para captação massiva.",
      tag: "MELHOR CUSTO BENEFÍCIO",
      color: "from-amber-500 to-orange-500"
    }
  ];

  const currentPack = packages.find(p => p.id === selectedPackage) || packages[4];

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      triggerNotification("Faça login para realizar compras.", "warning");
      return;
    }

    setIsProcessing(true);
    triggerNotification("Processando pagamento via gateway seguro Asaas...", "info");

    setTimeout(async () => {
      try {
        // Fetch current profile to get latest values
        const userRef = doc(db, "users", session.id);
        const userSnap = await getDoc(userRef);
        
        let currentPlan = "Gratuito";
        let planCredits = 10;
        let purchasedCredits = 0;
        let bonusCredits = 0;
        let remainingCredits = 10;

        if (userSnap.exists()) {
          const uData = userSnap.data();
          currentPlan = uData.plan || "Gratuito";
          planCredits = uData.planCredits !== undefined ? uData.planCredits : (uData.credits || 0);
          purchasedCredits = uData.purchasedCredits || 0;
          bonusCredits = uData.bonusCredits || 0;
        }

        // Add additional credits as purchased
        const addedCredits = currentPack.credits;
        const newPurchased = purchasedCredits + addedCredits;
        const newTotal = planCredits + newPurchased + bonusCredits;

        // Perform Firestore update
        await setDoc(userRef, {
          purchasedCredits: newPurchased,
          remainingCredits: newTotal,
          credits: newTotal, // keep old in sync
          accountStatus: "ACTIVE" // remove limitation block immediately
        }, { merge: true });

        // Save simulated payment history in collections
        const orderId = `order_${Date.now().toString(36)}`;
        await setDoc(doc(db, "payments", orderId), {
          id: orderId,
          userId: session.id,
          date: new Date().toISOString(),
          amount: currentPack.price,
          method: paymentMethod,
          status: "RECEIVED",
          link: "https://sandbox.asaas.com/payment/" + orderId,
          creditsPurchase: addedCredits
        });

        // Add logging 
        await setDoc(doc(db, "activityLogs", `log_${Date.now()}`), {
          id: `log_${Date.now()}`,
          userId: session.id,
          userName: session.name,
          action: "COMPRA_CREDITOS",
          details: `Comprou ${addedCredits} créditos avulsos via Asaas (${paymentMethod.toUpperCase()}) por R$ ${currentPack.price.toFixed(2)}.`,
          createdAt: new Date().toISOString()
        });

        setIsProcessing(false);
        setPaymentSimulated(true);
        triggerNotification("Créditos adicionados com sucesso.", "success");
      } catch (err: any) {
        console.error("Erro na transação de créditos:", err);
        triggerNotification("Erro gravando transação no banco de dados.", "warning");
        setIsProcessing(false);
      }
    }, 1500);
  };

  const resetStore = () => {
    setPaymentSimulated(false);
    setCardName("");
    setCardExpiry("");
    setCardNumber("");
    setCardCvv("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Decorative intro panel */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Vendas por Consumo e Sob Medida
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Loja de Créditos MapsLeads</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Acabe com a barreira dos planos fixos. Adquira créditos sob demanda por apenas <strong className="text-white">R$ 0,20 por lead</strong>. 
            Sem data de expiração para os créditos comprados e com liberação instantânea.
          </p>
        </div>
      </div>

      {paymentSimulated ? (
        <div className="bg-white border border-emerald-200 p-8 rounded-3xl text-center space-y-6 shadow-sm max-w-xl mx-auto my-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Transação Concluída!</h3>
            <p className="text-sm text-slate-500">
              O gateway inteligente <strong className="text-slate-700">Asaas</strong> confirmou o recebimento da transação nível <strong className="text-emerald-600">PAYMENT_RECEIVED</strong>.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl max-w-md mx-auto text-left text-xs text-emerald-800 space-y-2 font-medium">
            <div className="flex justify-between">
              <span>Pacote Ativo:</span>
              <span className="font-extrabold">{currentPack.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Créditos Injetados:</span>
              <span className="font-extrabold">+{currentPack.credits} leads</span>
            </div>
            <div className="flex justify-between">
              <span>Valor do Pix/Cartão:</span>
              <span className="font-extrabold">R$ {currentPack.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status faturamento:</span>
              <span className="font-bold underline">COMPLETO</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-semibold">"Créditos adicionados com sucesso." Seu saldo de capturas foi corrigido em tempo real.</p>
          <button 
            onClick={resetStore}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider block mx-auto"
          >
            Comprar Mais Créditos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Packaging choices column */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <span>1. Escolha seu Pacote de Leads</span>
            </h3>

            <div className="space-y-3">
              {packages.map((pack) => {
                const isSelected = selectedPackage === pack.id;
                const costPerLead = pack.price / pack.credits;
                const isBestValue = pack.id === "scale";

                return (
                  <div 
                    key={pack.id}
                    onClick={() => setSelectedPackage(pack.id)}
                    className={`border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col md:flex-row justify-between md:items-center relative gap-4 ${
                      isSelected 
                        ? "bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-100" 
                        : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                    }`}
                  >
                    {pack.tag && (
                      <span className={`absolute -top-2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide shadow-sm ${
                        isBestValue ? "bg-amber-500 text-white" : "bg-indigo-600 text-white"
                      }`}>
                        {pack.tag}
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800">{pack.name}</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          R$ {costPerLead.toFixed(2)} / lead
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">{pack.description}</p>
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quantidade</p>
                        <p className="text-lg font-black text-slate-900">{pack.credits} Créditos</p>
                      </div>
                      <div className="bg-slate-50 border px-3 py-2 rounded-xl text-center min-w-[80px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Preço</p>
                        <p className="text-sm font-black text-slate-900">R$ {pack.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout & Asaas payment processor column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>2. Checkout Seguro Asaas Gateway</span>
            </h3>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Payment Summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Resumo do Pedido</span>
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>{currentPack.name} ({currentPack.credits} cr.)</span>
                  <span>R$ {currentPack.price.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-black text-sm text-slate-950">
                  <span>Total Geral</span>
                  <span>R$ {currentPack.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === "pix"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>PIX</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Cartão</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod("boleto")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === "boleto"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>Boleto</span>
                </button>
              </div>

              {/* Dynamic form based on method selection */}
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                
                {paymentMethod === "pix" && (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                    <div className="w-[120px] h-[120px] bg-white border rounded-xl mx-auto flex items-center justify-center p-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asaaspix-${currentPack.id}-amount-${currentPack.price}`} 
                        alt="PIX QR" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Escaneie o QR Code ou Use o Pix Copia e Cola</p>
                    <div className="bg-white rounded-lg border p-2 text-[10px] text-slate-500 font-mono flex items-center justify-between select-all leading-normal text-left max-w-sm mx-auto">
                      <span className="truncate mr-4">00020126580014BR.GOV.BCB.PIX0136asaaspix-{currentPack.id}-value-{currentPack.price}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136asaaspix-${currentPack.id}-value-${currentPack.price}`);
                          triggerNotification("Copia e cola do PIX copiado!", "success");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 p-1 rounded font-sans font-bold cursor-pointer text-slate-800"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === "boleto" && (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                    <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Código de Barras do Boleto Bancário</p>
                    <div className="bg-white rounded-lg border p-2 text-[10px] text-slate-550 font-mono flex items-center justify-between select-all leading-normal text-left">
                      <span className="truncate mr-4">34191.79001 01043.513184 91020.150008 7 98200000012000</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("34191.79001 01043.513184 91020.150008 7 98200000012000");
                          triggerNotification("Código do boleto copiado!", "success");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 p-1 rounded font-sans font-bold cursor-pointer text-slate-800"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal">O pagamento será creditado instantaneamente após a confirmação simulada.</p>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1 bg-slate-900 border text-white p-4 rounded-xl relative shadow-md overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full rotate-45 transform translate-x-12 -translate-y-8"></div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cartão de Crédito Simulador</p>
                      <h4 className="text-sm font-bold tracking-widest mt-3 truncate">{cardNumber || "•••• •••• •••• ••••"}</h4>
                      <div className="flex justify-between items-center mt-4 text-[10px] text-slate-300 font-medium uppercase font-mono">
                        <span className="truncate pr-4">{cardName || "Douglas Bateria CMA"}</span>
                        <span>{cardExpiry || "12/28"}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número do Cartão</label>
                        <input 
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4444 5555 6666 7777"
                          required
                          className="w-full bg-slate-50 border border-slate-250 py-2.5 px-3.5 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Titular do Cartão</label>
                        <input 
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Ex: Douglas Bateria CMA"
                          required
                          className="w-full bg-slate-50 border border-slate-250 py-2.5 px-3.5 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validade</label>
                          <input 
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            required
                            className="w-full bg-slate-50 border border-slate-250 py-2.5 px-3.5 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CVV</label>
                          <input 
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            required
                            className="w-full bg-slate-50 border border-slate-250 py-2.5 px-3.5 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Processando no Asaas...</span>
                    </>
                  ) : (
                    <span>Confirmar Pagamento</span>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-150 flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-emerald-500" />
                <span>Garantia de Reembolso Asaas Integrado</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
