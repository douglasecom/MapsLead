import React, { useState, useEffect } from "react";
import { DollarSign, Trash2, Award, Zap, TrendingUp, AlertTriangle, Users, BarChart3, HelpCircle, Save, Coins, Search, CheckCircle } from "lucide-react";
import { UserSession } from "../types";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface AdminCreditsProps {
  session: UserSession | null;
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  planCredits?: number;
  purchasedCredits?: number;
  bonusCredits?: number;
  accountStatus?: string;
}

export const AdminCredits: React.FC<AdminCreditsProps> = ({ session, triggerNotification }) => {
  // Config state
  const [pricePerLead, setPricePerLead] = useState<number>(0.20);
  const [freeQuantity, setFreeQuantity] = useState<number>(10);
  const [activePromo, setActivePromo] = useState<boolean>(true);
  
  // Custom packages state
  const [customPackages, setCustomPackages] = useState<Array<{ id: string; name: string; credits: number; price: number }>>([
    { id: "p1", name: "PACOTE COMPACTO", credits: 25, price: 5.90 },
    { id: "p2", name: "PACOTE CORPORATIVO", credits: 300, price: 49.00 }
  ]);
  
  // Package form state
  const [newPackName, setNewPackName] = useState("");
  const [newPackCredits, setNewPackCredits] = useState<number>(50);
  const [newPackPrice, setNewPackPrice] = useState<number>(10);

  // Manual grant user search state
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [grantPlanType, setGrantPlanType] = useState<"planCredits" | "purchasedCredits" | "bonusCredits">("purchasedCredits");
  const [grantAmount, setGrantAmount] = useState<number>(100);
  const [isGranting, setIsGranting] = useState<boolean>(false);

  // Load configs & users
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch custom settings document if present
        const configRef = doc(db, "creditConfigs", "settings");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const cData = configSnap.data();
          setPricePerLead(cData.pricePerLead || 0.20);
          setFreeQuantity(cData.freeQuantity || 10);
          setActivePromo(cData.activePromo !== undefined ? cData.activePromo : true);
          if (cData.customPackages) {
            setCustomPackages(cData.customPackages);
          }
        }

        // Fetch users to populate lists
        const usersSnap = await getDocs(collection(db, "users"));
        const tempUsers: UserListItem[] = [];
        usersSnap.forEach((docSnap) => {
          const uData = docSnap.data();
          tempUsers.push({
            id: docSnap.id,
            name: uData.name || "Sem Nome",
            email: uData.email || "",
            plan: uData.plan || "Gratuito",
            credits: uData.credits !== undefined ? uData.credits : 0,
            planCredits: uData.planCredits || 0,
            purchasedCredits: uData.purchasedCredits || 0,
            bonusCredits: uData.bonusCredits || 0,
            accountStatus: uData.accountStatus || "ACTIVE"
          });
        });
        setUsersList(tempUsers);
      } catch (err: any) {
        console.warn("Falha buscando parâmetros administrativos reais:", err.message);
      }
    };
    fetchAdminData();
  }, []);

  // Filter lists based on search
  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(searchEmail.toLowerCase()) || 
    u.name.toLowerCase().includes(searchEmail.toLowerCase())
  );

  // Save Settings to Firestore
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "creditConfigs", "settings"), {
        pricePerLead,
        freeQuantity,
        activePromo,
        customPackages
      }, { merge: true });
      triggerNotification("Configurações monetárias de créditos salvas com sucesso!", "success");
    } catch (err: any) {
      triggerNotification("Falha salvando configurações no Firestore.", "warning");
    }
  };

  // Add Custom package 
  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName || newPackCredits <= 0 || newPackPrice <= 0) {
      triggerNotification("Por favor preencha todos os campos do pacote avulso.", "warning");
      return;
    }
    const newPack = {
      id: `custom_${Date.now()}`,
      name: newPackName.toUpperCase(),
      credits: Number(newPackCredits),
      price: Number(newPackPrice)
    };
    setCustomPackages(prev => [...prev, newPack]);
    setNewPackName("");
    setNewPackCredits(50);
    setNewPackPrice(10);
    triggerNotification(`Pacote "${newPack.name}" adicionado à pré-visualização! Lembre-se de salvar as configurações.`, "info");
  };

  // Remove package
  const handleRemovePackage = (id: string) => {
    setCustomPackages(prev => prev.filter(p => p.id !== id));
    triggerNotification("Pacote removido. Clique em salvar para confirmar no servidor.", "info");
  };

  // Grant credits manually to selected user
  const handleGrantCredits = async () => {
    if (!selectedUser) {
      triggerNotification("Selecione um usuário para conceder os créditos.", "warning");
      return;
    }

    if (grantAmount <= 0) {
      triggerNotification("Quantidade inválida de créditos.", "warning");
      return;
    }

    setIsGranting(true);
    try {
      const userRef = doc(db, "users", selectedUser.id);
      const userSnap = await getDoc(userRef);

      let currentPlanCredits = selectedUser.planCredits || 0;
      let currentPurchasedCredits = selectedUser.purchasedCredits || 0;
      let currentBonusCredits = selectedUser.bonusCredits || 0;
      
      if (userSnap.exists()) {
        const freshData = userSnap.data();
        currentPlanCredits = freshData.planCredits !== undefined ? freshData.planCredits : (freshData.credits || 0);
        currentPurchasedCredits = freshData.purchasedCredits || 0;
        currentBonusCredits = freshData.bonusCredits || 0;
      }

      // Add corresponding credits
      if (grantPlanType === "planCredits") {
        currentPlanCredits += grantAmount;
      } else if (grantPlanType === "purchasedCredits") {
        currentPurchasedCredits += grantAmount;
      } else {
        currentBonusCredits += grantAmount;
      }

      const totalCredits = currentPlanCredits + currentPurchasedCredits + currentBonusCredits;

      await setDoc(userRef, {
        planCredits: currentPlanCredits,
        purchasedCredits: currentPurchasedCredits,
        bonusCredits: currentBonusCredits,
        remainingCredits: totalCredits,
        credits: totalCredits, // sync compatibility
        accountStatus: "ACTIVE" // manually re-enable user instantly
      }, { merge: true });

      // Add trace logging
      const logId = `log_grant_${Date.now()}`;
      await setDoc(doc(db, "activityLogs", logId), {
        id: logId,
        userId: session?.id || "admin",
        userName: session?.name || "Administrador",
        action: "TRANSFERENCIA_CRÉDITOS",
        details: `Concedeu ${grantAmount} créditos (${grantPlanType.toUpperCase()}) manualmente para ${selectedUser.name} (${selectedUser.email}).`,
        createdAt: new Date().toISOString()
      });

      // Update state local mapping immediately
      setUsersList(prev => prev.map(u => u.id === selectedUser.id ? {
        ...u,
        credits: totalCredits,
        planCredits: currentPlanCredits,
        purchasedCredits: currentPurchasedCredits,
        bonusCredits: currentBonusCredits,
        accountStatus: "ACTIVE"
      } : u));

      // Refresh selection display
      setSelectedUser(prev => prev ? {
        ...prev,
        credits: totalCredits,
        planCredits: currentPlanCredits,
        purchasedCredits: currentPurchasedCredits,
        bonusCredits: currentBonusCredits,
        accountStatus: "ACTIVE"
      } : null);

      setIsGranting(false);
      triggerNotification(`Concedidos ${grantAmount} créditos adicionais para ${selectedUser.name} com sucesso!`, "success");
    } catch (err: any) {
      console.error(err);
      triggerNotification("Falha concedendo créditos adicionais: " + err.message, "warning");
      setIsGranting(false);
    }
  };

  // Compute live calculations for metric statistics based on users database snapshot
  const freeUsersCount = usersList.filter(u => u.plan.toLowerCase() === "gratuito" || u.plan.toLowerCase() === "free").length;
  const paidUsersCount = usersList.length - freeUsersCount;
  const totalPurchasedCredits = usersList.reduce((acc, current) => acc + (current.purchasedCredits || 0), 0);
  
  // Commercial conversions metrics
  const conversionRate = usersList.length > 0 ? (paidUsersCount / usersList.length) * 100 : 0;
  const estimatedCreditRevenue = totalPurchasedCredits * 0.20; // R$ 0.20 por lead vendido avulso
  const estimatedRecurrentMRR = usersList.reduce((acc, u) => {
    const pl = u.plan.toLowerCase();
    if (pl.includes("starter")) return acc + 49;
    if (pl.includes("pro")) return acc + 97;
    if (pl.includes("agência") || pl.includes("agency")) return acc + 197;
    if (pl.includes("enterprise")) return acc + 497;
    return acc;
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Metrics board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Aquisição Free</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{freeUsersCount}</span>
            <span className="text-xs font-semibold text-slate-505">Usuários</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-semibold">Iniciaram sem cartão de crédito</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Usuários Pagantes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{paidUsersCount}</span>
            <span className="text-xs font-semibold text-slate-505">Ativos</span>
          </div>
          <p className="text-[10.5px] text-emerald-600 font-semibold">Conversão de {conversionRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Faturamento Avulso</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700 font-mono">R$ {estimatedCreditRevenue.toFixed(2)}</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-semibold">{totalPurchasedCredits} créditos avulsos vendidos</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Recorrente Mensal (MRR)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">R$ {estimatedRecurrentMRR.toFixed(2)}</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-semibold">Crescimento constante do SaaS</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configurations Forms column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600" />
              <span>Parâmetros Tarifários & Limitadores</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preço de Referência do Lead (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={pricePerLead} 
                    onChange={(e) => setPricePerLead(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Créditos Gratuitos do Plano FREE (Mensal)</label>
                  <input 
                    type="number" 
                    value={freeQuantity} 
                    onChange={(e) => setFreeQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input 
                    type="checkbox" 
                    id="promo_switch"
                    checked={activePromo} 
                    onChange={(e) => setActivePromo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="promo_switch" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    Garantir Bônus de 10% automático em compras Pix
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Salvar Configurações Monetárias</span>
              </button>
            </form>
          </div>

          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-lg text-slate-800">Criar Novos Pacotes Avulsos</h3>
            
            <form onSubmit={handleAddPackage} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Pacote</label>
                  <input 
                    type="text" 
                    placeholder="Ex: PACOTE MEGAPACK"
                    value={newPackName}
                    onChange={(e) => setNewPackName(e.target.value)}
                    className="w-full bg-slate-50 border py-2.5 px-3.5 rounded-lg focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor do Pacote (R$)</label>
                  <input 
                    type="number" 
                    value={newPackPrice}
                    onChange={(e) => setNewPackPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border py-2.5 px-3.5 rounded-lg focus:bg-white outline-none font-bold"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Créditos a conceder</label>
                  <input 
                    type="number" 
                    value={newPackCredits}
                    onChange={(e) => setNewPackCredits(Number(e.target.value))}
                    className="w-full bg-slate-50 border py-2.5 px-3.5 rounded-lg focus:bg-white outline-none font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-3 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
              >
                + Adicionar Pacote à Lista
              </button>
            </form>

            <div className="space-y-2 mt-4 pt-4 border-t">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Pacotes Adicionados Ativos</p>
              {customPackages.map((p) => (
                <div key={p.id} className="bg-slate-50 border p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span>{p.name} ({p.credits} cr.) - R$ {p.price.toFixed(2)}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemovePackage(p.id)}
                    className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Grant credits section */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Conceder Créditos Manualmente</span>
            </h3>

            <div className="space-y-4">
              
              {/* User search box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Pesquise por Nome ou E-mail do usuário..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 py-2.5 pl-10 pr-4 rounded-xl text-xs outline-none focus:bg-white"
                />
              </div>

              {/* List candidates */}
              <div className="max-h-[160px] overflow-y-auto border rounded-xl divide-y text-xs select-none">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <div 
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-3 cursor-pointer flex justify-between items-center transition-all ${
                          isSelected ? "bg-indigo-50 font-bold text-indigo-800" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div>
                          <p>{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{u.credits} cr. totais</p>
                          <p className="text-[9px] uppercase tracking-wider">{u.plan}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="p-4 text-center text-slate-400 font-semibold">Nenhum usuário encontrado na busca.</p>
                )}
              </div>

              {selectedUser && (
                <div className="bg-slate-50 border p-4 rounded-2xl text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                    <span>Concedendo créditos para <strong className="text-slate-800">{selectedUser.name}</strong></span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saldo do Bloco</label>
                      <select 
                        value={grantPlanType} 
                        onChange={(e) => setGrantPlanType(e.target.value as any)}
                        className="w-full bg-white border rounded-lg py-1.5 px-2 text-xs"
                      >
                        <option value="planCredits">Créditos do Plano</option>
                        <option value="purchasedCredits">Créditos Comprados</option>
                        <option value="bonusCredits">Créditos Promocionais</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Quantidade</label>
                      <input 
                        type="number"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(Number(e.target.value))}
                        className="w-full bg-white border rounded-lg py-1 px-2 text-xs"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleGrantCredits}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Confirmar Abatimento / Transferência
                  </button>
                  
                  <div className="border-t pt-2 text-[10px] text-slate-400 font-semibold">
                    Atividades e saldos serão salvos de forma consistente e auditada na base do Firebase.
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
