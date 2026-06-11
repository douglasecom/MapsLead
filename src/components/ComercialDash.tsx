import React, { useState, useEffect } from 'react';
import { Lead, UserSession, SaaSPlan, SaaSPayment, SaasTeam, SaaSActivityLog } from '../types';
import { getApiUrl, logResponseDebug } from '../utils/api';
import { 
  db, auth 
} from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, query, where, updateDoc 
} from 'firebase/firestore';
import { 
  DollarSign, TrendingUp, Calendar, ChevronRight, 
  MessageSquare, Users, CreditCard, Sparkles, CheckCircle, 
  Layers, Award, ShieldAlert, BarChart3, Copy, UserPlus, Trash2, Edit3, Check
} from 'lucide-react';

interface ComercialDashProps {
  leads: Lead[];
  currentPlan: string;
  onChangePlan: (plan: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
  userId?: string;
  userRole?: string;
}

export const ComercialDash: React.FC<ComercialDashProps> = ({ 
  leads, 
  currentPlan, 
  onChangePlan, 
  triggerNotification,
  userId,
  userRole
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receita' | 'followup' | 'planos' | 'equipe' | 'webhook'>('receita');
  
  // Real Firestore States
  const [dbPlans, setDbPlans] = useState<SaaSPlan[]>([]);
  const [payments, setPayments] = useState<SaaSPayment[]>([]);
  const [team, setTeam] = useState<SaasTeam | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // checkout state
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<SaaSPlan | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [checkoutProcessing, setCheckoutProcessing] = useState<boolean>(false);
  const [pixCodeGenerated, setPixCodeGenerated] = useState<string | null>(null);
  const [pixQrUrl, setPixQrUrl] = useState<string | null>(null);

  // admin editing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanPrice, setEditPlanPrice] = useState<number>(0);
  const [editPlanCredits, setEditPlanCredits] = useState<number>(0);
  const [editPlanMaxUsers, setEditPlanMaxUsers] = useState<number>(0);

  // team members invitation state
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'Gestor' | 'SDR' | 'Closer' | 'Operador'>('SDR');

  // webhook simulation state
  const [simWebhookEvent, setSimWebhookEvent] = useState<string>('PAYMENT_RECEIVED');
  const [simProcessing, setSimProcessing] = useState<boolean>(false);

  // Asaas Config Server Info
  const [asaasConfig, setAsaasConfig] = useState<{
    activeGateway: string;
    asaasConfigured: boolean;
    walletId: string;
    maskedKey: string;
  }>({
    activeGateway: 'Asaas',
    asaasConfigured: false,
    walletId: 'Não configurado',
    maskedKey: 'Não configurado'
  });

  const activeUserId = userId || auth.currentUser?.uid || 'demo_user';
  const isAdminUser = userRole === 'Administrador' || userProfile?.role === 'Administrador';

  // Load SaaS dynamic configurations and persistent entities from Firestore
  useEffect(() => {
    async function loadSaaSData() {
      try {
        setLoading(true);

        // A. Load gateway info
        const configReq = await fetch(getApiUrl('/api/config/payment'));
        await logResponseDebug(configReq);
        if (configReq.ok) {
          const cfg = await configReq.json();
          setAsaasConfig(cfg);
        }

        // B. Load Plans from Firestore plans collection
        const plansSnap = await getDocs(collection(db, 'plans'));
        const loadedPlans: SaaSPlan[] = [];
        plansSnap.forEach(d => {
          loadedPlans.push({ id: d.id, ...d.data() } as SaaSPlan);
        });

        // Fallback plans if empty or offline
        if (loadedPlans.length === 0) {
          const fallbackList: SaaSPlan[] = [
            { id: 'starter', name: "Starter", price: 49, credits: 100, maxUsers: 1, maxReports: 20, maxLeads: 100, features: ["Busca Google Maps", "CRM Básico", "Geração de Pitch IA"] },
            { id: 'pro', name: "Pro", price: 97, credits: 505, maxUsers: 3, maxReports: 100, maxLeads: 500, features: ["Busca Google Maps", "CRM Completo", "Radar Digital", "IA de Prospecção"] },
            { id: 'agency', name: "Agência", price: 197, credits: 2000, maxUsers: 10, maxReports: 1000, maxLeads: 2000, features: ["White Label", "Equipe Multiusuário", "Propostas Automáticas", "Destaque IA"] },
            { id: 'enterprise', name: "Enterprise", price: 497, credits: 10000, maxUsers: 50, maxReports: 99999, maxLeads: 10000, features: ["Consultoria Dedicada", "API Exclusiva", "Usuários Customizados", "Suporte 24h"] }
          ];
          setDbPlans(fallbackList);
        } else {
          // Sort plans by price ASC
          loadedPlans.sort((a,b) => a.price - b.price);
          setDbPlans(loadedPlans);
        }

        // C. Fetch current User profile database record
        const userRef = doc(db, 'users', activeUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }

        // D. Fetch payment records
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        const loadedPayments: SaaSPayment[] = [];
        paymentsSnap.forEach(px => {
          const data = px.data();
          if (data.userId === activeUserId) {
            loadedPayments.push({ id: px.id, ...data } as SaaSPayment);
          }
        });
        setPayments(loadedPayments);

        // E. Fetch Team setup
        const teamSnap = await getDocs(collection(db, 'teams'));
        let userTeam: any = null;
        teamSnap.forEach(t => {
          const dat = t.data();
          if (dat.ownerId === activeUserId || (dat.members && dat.members.some((m: any) => m.userId === activeUserId))) {
            userTeam = { id: t.id, ...dat };
          }
        });

        if (!userTeam) {
          // Auto bootstrap team for user
          const newTeamId = `team_${activeUserId}`;
          const initialTeam: SaasTeam = {
            id: newTeamId,
            name: `Time de ${userProfile?.name || auth.currentUser?.email || 'Membro'}`,
            ownerId: activeUserId,
            members: [{ userId: activeUserId, name: userProfile?.name || 'Proprietário', email: auth.currentUser?.email || '', role: 'Administrador' }],
            maxMembers: (currentPlan || '').toLowerCase() === 'starter' ? 1 : (currentPlan || '').toLowerCase() === 'pro' ? 3 : (currentPlan || '').toLowerCase() === 'agência' ? 10 : 50
          };
          await setDoc(doc(db, 'teams', newTeamId), initialTeam);
          setTeam(initialTeam);
        } else {
          setTeam(userTeam);
        }

      } catch (err) {
        console.error("Erro ao carregar dados SaaS:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSaaSData();
  }, [activeUserId, currentPlan, userProfile?.name]);

  // Handle active SaaS pricing checkout submission
  const handleInitiateSaaSCheckout = async (plan: SaaSPlan) => {
    setSelectedCheckoutPlan(plan);
    setPixCodeGenerated(null);
    setPixQrUrl(null);
  };

  // Submit secure asaas simulator payment API
  const handleConfirmAsaasPayment = async () => {
    if (!selectedCheckoutPlan) return;
    setCheckoutProcessing(true);

    try {
      const response = await fetch(getApiUrl('/api/asaas/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          planId: selectedCheckoutPlan.id,
          method: checkoutMethod
        })
      });

      await logResponseDebug(response);
      if (response.ok) {
        const result = await response.json();
        
        if (checkoutMethod === 'pix') {
          // Display Pix details first!
          setPixCodeGenerated(result.pixCode);
          setPixQrUrl(result.qrCodeUrl);
          triggerNotification("Gabarito de pagamento PIX gerado via Asaas. Efetue o escaneamento para liberar os créditos.", "info");
        } else {
          // Instant active transition for credit card or boleto
          onChangePlan(selectedCheckoutPlan.name);
          triggerNotification(`Assinatura ativa realizada via Asaas! Plano alterado para ${selectedCheckoutPlan.name}.`, "success");
          setSelectedCheckoutPlan(null);
          
          // Re-load dataset immediately
          window.location.reload();
        }
      } else {
        triggerNotification("Falha ao comunicar com o servidor de faturamento Asaas.", "error");
      }
    } catch (err: any) {
      triggerNotification("Falha no checkout de faturamento: " + err.message, "error");
    } finally {
      if (checkoutMethod !== 'pix') {
        setCheckoutProcessing(false);
      } else {
        // Keeps processing off to let user scan QR Code
        setCheckoutProcessing(false);
      }
    }
  };

  // Confirm simulated Payment of generated Pix
  const handleConfirmPixSimulatedScan = () => {
    if (!selectedCheckoutPlan) return;
    onChangePlan(selectedCheckoutPlan.name);
    triggerNotification(`Faturamento compensado com sucesso! Plano alterado para ${selectedCheckoutPlan.name}.`, "success");
    setSelectedCheckoutPlan(null);
    window.location.reload();
  };

  // Force cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm("Deseja realmente cancelar sua renovação recorrente do SaaS AdsHive Prospect? Seu plano continuará ativo em modo limitado.")) return;
    
    try {
      const userRef = doc(db, 'users', activeUserId);
      await updateDoc(userRef, {
        subscriptionStatus: 'CANCELED'
      });
      triggerNotification("Sua recorrência foi descontinuada com êxito.", "info");
      window.location.reload();
    } catch (err) {
      triggerNotification("Erro ao cancelar recorrência.", "error");
    }
  };

  // Administrator editing prices/credits/limits in Firestore plans collection
  const handleAdminSavePlanAltered = async (pId: string) => {
    try {
      const pRef = doc(db, 'plans', pId);
      await setDoc(pRef, {
        price: Number(editPlanPrice),
        credits: Number(editPlanCredits),
        maxUsers: Number(editPlanMaxUsers)
      }, { merge: true });

      triggerNotification(`Plano ${pId.toUpperCase()} atualizado na nuvem com sucesso!`, "success");
      setEditingPlanId(null);
      
      // Reload plans
      const plansSnap = await getDocs(collection(db, 'plans'));
      const loaded: SaaSPlan[] = [];
      plansSnap.forEach(d => {
        loaded.push({ id: d.id, ...d.data() } as SaaSPlan);
      });
      loaded.sort((a,b) => a.price - b.price);
      setDbPlans(loaded);
    } catch (err) {
      triggerNotification("Erro ao atualizar parâmetros comerciais.", "error");
    }
  };

  // Team controls: invite users under seat constraint limit
  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    if (!team) {
      triggerNotification("Time indisponível.", "error");
      return;
    }

    // Identify limit per plan:
    const activeLimitObj = dbPlans.find(p => (p.name || '').toLowerCase() === (currentPlan || '').toLowerCase()) || { maxUsers: 3 };
    const maxSeats = activeLimitObj.maxUsers;

    if (team.members.length >= maxSeats) {
      triggerNotification(`Seu time atingiu o limite de ${maxSeats} usuário(s) para o plano ${currentPlan}. Por favor, faça Upgrade no painel de assinaturas.`, "error");
      return;
    }

    try {
      const updatedMembers = [
        ...team.members,
        {
          userId: `colab_${Date.now().toString(36)}`,
          name: inviteName,
          email: inviteEmail,
          role: inviteRole
        }
      ];

      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, {
        members: updatedMembers
      });

      triggerNotification(`Membro ${inviteName} convidado com sucesso em tempo real!`, "success");
      setTeam({ ...team, members: updatedMembers });
      setInviteName('');
      setInviteEmail('');

      // Reg activity
      const logId = `log_${Date.now()}`;
      await setDoc(doc(db, 'activityLogs', logId), {
        id: logId,
        userId: activeUserId,
        userName: userProfile?.name || 'Gestor',
        action: 'EQUIPE_CONVITE',
        details: `Convidou ${inviteName} (${inviteRole}) para integrar a plataforma.`,
        createdAt: new Date().toISOString()
      });

    } catch (err: any) {
      triggerNotification("Não foi possível persistir convite de colaborador.", "error");
    }
  };

  // Remove member from team
  const handleRemoveTeamMember = async (targetColabId: string) => {
    if (!team) return;
    if (targetColabId === activeUserId) {
      triggerNotification("Não é possível remover você mesmo do painel corporativo.", "error");
      return;
    }

    try {
      const updatedMembers = team.members.filter((m: any) => m.userId !== targetColabId);
      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, {
        members: updatedMembers
      });

      triggerNotification("Membro removido do time comercial com sucesso.", "success");
      setTeam({ ...team, members: updatedMembers });
    } catch (err) {
      triggerNotification("Erro ao atualizar equipe.", "error");
    }
  };

  // Simulate Webhook Event trigger through internal POST requests on server
  const handleTriggerSimulatedWebhook = async () => {
    setSimProcessing(true);
    try {
      const res = await fetch(getApiUrl('/api/webhooks/asaas/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: simWebhookEvent,
          userId: activeUserId,
          planId: 'pro',
          value: 97
        })
      });

      await logResponseDebug(res);
      if (res.ok) {
        const reply = await res.json();
        triggerNotification(`Webhook de teste enviado! Evento processado: ${simWebhookEvent}`, "success");
        
        // Refresh databases data
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        triggerNotification("Erro ao despachar webhook no simulador local.", "error");
      }
    } catch (err: any) {
      triggerNotification("Erro no simulador: " + err.message, "error");
    } finally {
      setSimProcessing(false);
    }
  };

  // Calculations for dashboards
  const capturedLeads = leads.filter(l => l.captured);
  const totalLeadsCount = capturedLeads.length;
  const closedContractsCount = leads.filter(l => l.status === 'fechado' && l.captured).length;
  const estimatedTicketSize = 1200;
  const totalRevenueWon = closedContractsCount * estimatedTicketSize;
  const recurringMRR = closedContractsCount * 150;
  const predictedPipelineWorth = leads.filter(l => l.status === 'negociacao' && l.captured).length * estimatedTicketSize + (leads.filter(l => l.status === 'interessado' && l.captured).length * (estimatedTicketSize * 0.4));
  const conversionRate = totalLeadsCount > 0 ? Math.round((closedContractsCount / totalLeadsCount) * 100) : 15;

  const handleSendFollowUp = (leadName: string, day: number) => {
    triggerNotification(`Lembrete de Follow-up enviado com sucesso para ${leadName}!`, 'success');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <strong className="text-slate-600 font-bold text-xs">Sincronizando faturamento e assinaturas com Firestore...</strong>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="bg-white p-2 rounded-2xl border flex flex-wrap gap-1">
        <button 
          onClick={() => setActiveSubTab('receita')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'receita' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('followup')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'followup' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Follow-up Pipeline</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('planos')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'planos' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Meu Plano</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('equipe')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'equipe' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão da Equipe</span>
        </button>

        {userProfile?.email?.toLowerCase() === 'douglasbateriacma@gmail.com' && (
          <button 
            onClick={() => setActiveSubTab('webhook')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'webhook' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Webhooks Simulator</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: RECEITA DASHBOARD (MODULE 15) */}
      {activeSubTab === 'receita' && (
        <div className="space-y-6">
          
          {/* Revenue KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Acumulado Ganho</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">R$ {totalRevenueWon.toLocaleString()}</h4>
                <p className="text-[10px] text-slate-450 font-bold mt-1">Estimado a R$ {estimatedTicketSize}/site</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Recorrência Mensal (MRR)</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">R$ {recurringMRR.toLocaleString()} /mês</h4>
                <p className="text-[10px] text-slate-450 font-bold mt-1">R$ 150/cliente suporte técnico</p>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline em Negociação</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-blue-400 font-mono">R$ {Math.round(predictedPipelineWorth).toLocaleString()}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Ponderado por taxa de funil</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Conversão Real</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">{conversionRate}%</h4>
                <p className="text-[10px] text-slate-455 font-bold mt-1">{closedContractsCount} fechados de {totalLeadsCount} leads</p>
              </div>
            </div>

          </div>

          {/* Graphical Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border p-6 rounded-3xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Conversão Funil de Vendas</h4>
              
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Leads Capturados (Base Geral)</span>
                    <span className="font-mono">{totalLeadsCount} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-blue-600 h-full rounded-xl" style={{ width: "100%" }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">100% captação</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Interesse Qualificado</span>
                    <span className="font-mono">{leads.filter(l => l.captured && (l.status === 'interessado' || l.status === 'negociacao' || l.status === 'fechado')).length} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-indigo-600 h-full rounded-xl" style={{ width: "70%" }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono">70% interesse</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-55 bg-white border p-6 rounded-3xl shadow-sm text-center flex flex-col justify-center items-center">
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full mb-3">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-base text-slate-850">Geração Automática Ativa</h4>
              <p className="text-slate-450 text-xs mt-1 max-w-sm">Use o funil e envie propostas customizadas para elevar o seu MRR real!</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FOLLOWUP PIPELINE */}
      {activeSubTab === 'followup' && (
        <div className="space-y-6">
          <div className="bg-white border p-6 rounded-3xl shadow-sm space-y-6 text-left">
            <div>
              <h3 className="font-black text-lg text-slate-900">Régua de Follow-up Inteligente</h3>
              <p className="text-xs text-slate-450">Acompanhe contatos diários de forma automatizada de acordo com o funil.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[225px]">
                <div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 1</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Envio Inicial</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1 font-sans">Pitch Copywriter estruturado com gaps GMB.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  {capturedLeads.slice(0, 2).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center group font-semibold text-slate-700 bg-white p-1.5 rounded border">
                      <span className="truncate max-w-[80px]">{l.name}</span>
                      <button onClick={() => handleSendFollowUp(l.name, 1)} className="text-blue-600 hover:text-blue-850"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-5 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[225px] bg-slate-50">
                <div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 3</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Prova Social</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1 font-mono text-left">Foco em depoimentos e avaliações.</p>
                </div>
                <div className="border-t pt-3 text-[11px]">
                  {capturedLeads.length > 2 ? (
                    <div className="flex justify-between items-center group font-semibold text-slate-700 bg-white p-1.5 rounded border">
                      <span className="truncate max-w-[80px] font-sans">{capturedLeads[2].name}</span>
                      <button onClick={() => handleSendFollowUp(capturedLeads[2].name, 3)} className="text-indigo-600"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Disponível em breve</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[225px]">
                <div>
                  <span className="text-[10px] bg-teal-100 text-teal-850 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 7</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Amostra Grátis</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1 block">Apresentação do blueprint preliminar.</p>
                </div>
                <div className="border-t pt-3 text-[10px] text-slate-400 italic text-center">Fila limpa</div>
              </div>

              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[225px]">
                <div>
                  <span className="text-[10px] bg-amber-100 text-amber-850 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 15</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Chamada Telefônica</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1 font-medium">Oferecer gatilho de urgência final sem custo de set-up.</p>
                </div>
                <div className="border-t pt-3 text-[10px] text-slate-400 italic text-center">Fila limpa</div>
              </div>

              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[225px]">
                <div>
                  <span className="text-[10px] bg-red-100 text-red-850 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 30</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Arquivamento</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Envio de cupom para prospecções futuras.</p>
                </div>
                <div className="border-t pt-3 text-[10px] text-slate-400 italic text-center">Sem pendentes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ASSINATURAS SaaS (PLAN TABLE + CURRENT SUB STATUS) */}
      {activeSubTab === 'planos' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-left">
          
          {/* Active subscription summary */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">PLANO GERAL CONTRATADO</span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-black text-slate-900 font-sans">{currentPlan}</h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                    userProfile?.subscriptionStatus === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : userProfile?.subscriptionStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-slate-100 text-slate-650'
                  }`}>
                    {userProfile?.subscriptionStatus === 'ACTIVE' ? 'ATIVO' : userProfile?.subscriptionStatus === 'PENDING' ? 'PROVIMENTO PENDENTE' : 'INATIVO'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  Créditos disponíveis na conta: <strong className="text-indigo-600 font-bold">{userProfile?.credits ?? 500}</strong> tokens.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveSubTab('equipe')}
                  className="bg-slate-150 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all border"
                >
                  Convidar Equipe
                </button>
                {currentPlan !== 'Starter' && (
                  <button 
                    onClick={handleCancelSubscription}
                    className="bg-red-50 hover:bg-red-100 text-red-650 px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                  >
                    Cancelar Assinatura
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 text-white p-8 rounded-3xl border border-slate-850 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>

            <div className="max-w-xl text-left mb-8">
              <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider block w-max mb-2">
                MEU PLANO
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">Catálogo de Planos Comerciais</h3>
              <p className="text-slate-400 text-xs mt-1">Planos integrados de forma transparente com o Asaas. Obtenha limites estendidos e mais assentos de SDR/Operador.</p>
            </div>

            {/* General dynamic Firestore plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbPlans.map((plan) => {
                const isActive = (currentPlan || '').toLowerCase() === (plan.name || '').toLowerCase();
                const isEditing = editingPlanId === plan.id;

                return (
                  <div 
                    key={plan.id}
                    className={`bg-[#0f172a] border rounded-2xl p-5 flex flex-col justify-between relative transition-all ${
                      isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-850'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[9px] rounded-full uppercase py-0.5 px-3">Plano Ativo</span>
                    )}

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-100">{plan.name}</h4>
                          <span className="text-2xl font-mono text-white font-black block mt-1">R$ {plan.price}/mês</span>
                        </div>

                        {/* Admin Inline Plan Settings Trigger */}
                        {isAdminUser && (
                          <button 
                            onClick={() => {
                              if (isEditing) {
                                handleAdminSavePlanAltered(plan.id);
                              } else {
                                setEditingPlanId(plan.id);
                                setEditPlanPrice(plan.price);
                                setEditPlanCredits(plan.credits);
                                setEditPlanMaxUsers(plan.maxUsers);
                              }
                            }}
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors border-none"
                            title="Editar parâmetros do plano"
                          >
                            {isEditing ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit3 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* Display / Editable parameter inputs under administrative roles */}
                      {isEditing ? (
                        <div className="space-y-2 p-2 bg-slate-900 rounded-xl text-xs space-y-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase block">Preço (R$)</label>
                            <input 
                              type="number" 
                              value={editPlanPrice} 
                              onChange={(e) => setEditPlanPrice(Number(e.target.value))} 
                              className="w-full bg-slate-800 text-white border-0 text-[10px] rounded p-1" 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase block">Créditos</label>
                            <input 
                              type="number" 
                              value={editPlanCredits} 
                              onChange={(e) => setEditPlanCredits(Number(e.target.value))} 
                              className="w-full bg-slate-800 text-white border-0 text-[10px] rounded p-1" 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase block">Limite Usuários</label>
                            <input 
                              type="number" 
                              value={editPlanMaxUsers} 
                              onChange={(e) => setEditPlanMaxUsers(Number(e.target.value))} 
                              className="w-full bg-slate-800 text-white border-0 text-[10px] rounded p-1" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 block py-1 bg-slate-900/30 rounded-lg p-2">
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Créditos inclusos:</span>
                            <span className="font-mono text-white font-bold">{plan.credits}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Limite de Usuários:</span>
                            <span className="font-mono text-white font-bold">{plan.maxUsers} seat(s)</span>
                          </div>
                        </div>
                      )}

                      <ul className="space-y-1.5 text-[11px] text-slate-400 text-left font-medium">
                        {(plan.features || []).slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 leading-normal">
                            <span className="text-blue-500 select-none">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!isEditing && (
                      <button 
                        onClick={() => handleInitiateSaaSCheckout(plan)}
                        className={`w-full mt-5 py-2.5 rounded-xl text-center text-xs font-black uppercase cursor-pointer border-none transition-all ${
                          isActive 
                            ? "bg-slate-800 text-slate-400 cursor-default" 
                            : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                        }`}
                        disabled={isActive}
                      >
                        {isActive ? "Plano Ativo" : "Contratar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>



          </div>

          {/* Secure interactive receipts list */}
          {payments.length > 0 && (
            <div className="bg-white border p-6 rounded-3xl shadow-sm text-left space-y-4">
              <div>
                <h4 className="font-extrabold text-base text-slate-800">Histórico de Mensalidades (Asaas)</h4>
                <p className="text-slate-450 text-xs">Acessos e recibos gerados automaticamente pelo webhook de pagamento.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-450 font-bold text-[10px] uppercase">
                      <th className="pb-3 text-left">ID Transação</th>
                      <th className="pb-3 text-center">Data</th>
                      <th className="pb-3 text-center">Valor</th>
                      <th className="pb-3 text-center">Método</th>
                      <th className="pb-3 text-right">Comprovante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b font-semibold text-slate-700 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-3 text-left font-mono text-[10px] text-indigo-650">{p.id}</td>
                        <td className="py-3 text-center">
                          {(() => {
                            if (!p.date) return "-";
                            try {
                              const d = new Date(p.date);
                              return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('pt-BR');
                            } catch (err) {
                              return "-";
                            }
                          })()}
                        </td>
                        <td className="py-3 text-center font-mono text-slate-900 font-bold">R$ {(p.amount || 0).toFixed(2)}</td>
                        <td className="py-3 text-center uppercase text-[10px]"><span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-bold">{p.method || "PIX"}</span></td>
                        <td className="py-3 text-right"><a href={p.link || "#"} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">Download PDF</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 4: GESTÃO DA EQUIPE (TEAM MEMBERS SEAT LIMIT ENFORCEMENT) */}
      {activeSubTab === 'equipe' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Invite Form */}
            <div className="bg-white border p-6 rounded-3xl shadow-sm text-left space-y-4 lg:col-span-1">
              <div>
                <h3 className="font-black text-base text-slate-800">Convidar Colaborador</h3>
                <p className="text-slate-450 text-[11px]">Submeta o convite contanto com o limite de assentos do plano {currentPlan}.</p>
              </div>

              <form onSubmit={handleInviteTeamMember} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Colaborador</label>
                  <input 
                    type="text" 
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: Pedro SDR" 
                    required 
                    className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white outline-indigo-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail do Colaborador</label>
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="EX: pedro@adshive.online" 
                    required 
                    className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white outline-indigo-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Cargo / Escopo</label>
                  <select 
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white outline-indigo-500"
                  >
                    <option value="Gestor">Gestor Comercial</option>
                    <option value="SDR">SDR (Pré-Vendedor)</option>
                    <option value="Closer">Closer (Fechador)</option>
                    <option value="Operador">Operador Técnico</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 outline-none cursor-pointer border-none shadow-sm active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar no Time</span>
                </button>
              </form>
            </div>

            {/* Right Column: Listing users */}
            <div className="bg-white border p-6 rounded-3xl shadow-sm text-left space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Membros Conectados</h3>
                  <p className="text-slate-450 text-[11px]">Gestores e SDRs operando concorrentemente em tempo real no Firestore.</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl font-bold font-mono">
                  {team?.members?.length || 1} / {dbPlans.find(p => (p.name || '').toLowerCase() === (currentPlan || '').toLowerCase())?.maxUsers || 1} Assentos
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {team?.members?.map((member: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border hover:bg-slate-100/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-900 border text-white flex items-center justify-center font-black text-xs rounded-full uppercase">
                        {(member.name || 'MB').slice(0, 2)}
                      </div>
                      <div className="text-xs">
                        <strong className="text-slate-850 text-sm font-bold block">{member.name || 'Membro'}</strong>
                        <span className="text-slate-450 font-semibold block">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded font-black font-semibold font-mono uppercase">
                        {member.role || 'SDR'}
                      </span>
                      {member.userId !== activeUserId && (
                        <button 
                          onClick={() => handleRemoveTeamMember(member.userId)} 
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-xl transition-colors border-none cursor-pointer"
                          title="Remover do Time"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 5: DEVELOPER WEBHOOK SIMULATOR */}
      {activeSubTab === 'webhook' && (
        <div className="space-y-6 animate-in fade-in duration-300 text-left">
          
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-left space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Simulador de Webhook Asaas</h3>
              <p className="text-slate-455 text-xs max-w-2xl leading-normal mt-1">
                Conectividade automatizada de ponta-a-ponta. Escolha o evento abaixo para disparar e verifique em tempo real as mudanças cadastrais do Firestore.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Escolher evento do webhook de pagamentos Asaas</label>
                <select 
                  value={simWebhookEvent} 
                  onChange={(e) => setSimWebhookEvent(e.target.value)}
                  className="w-full bg-white border rounded-xl py-3 px-4 font-bold text-xs text-slate-800 outline-none"
                >
                  <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED (Compensação e adição de créditos ao plano)</option>
                  <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED (Aprovação de recorrência de mensalidades)</option>
                  <option value="PAYMENT_OVERDUE">PAYMENT_OVERDUE (Inadimplência - Bloqueio temporário de ações)</option>
                  <option value="PAYMENT_DELETED">PAYMENT_DELETED (Cobrança eliminada no painel Asaas)</option>
                  <option value="SUBSCRIPTION_DELETED">SUBSCRIPTION_DELETED (Desativação e impedimento definitivo no SaaS)</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <button 
                  onClick={handleTriggerSimulatedWebhook} 
                  disabled={simProcessing}
                  className="w-full bg-slate-900 text-white font-extrabold py-3.5 rounded-xl text-xs active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {simProcessing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Despachar Webhook Asaas</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1 font-medium">
                <strong className="block text-amber-900">Efeitos Ativos no Sistema:</strong>
                <p>● Ao compensar <code className="bg-white px-1 py-0.5 rounded text-indigo-700">PAYMENT_RECEIVED</code>, a assinatura se torna <code className="bg-white px-1 font-mono">ACTIVE</code> e créditos adicionais são adicionados instantaneamente no banco de dados.</p>
                <p>● Ao acionar <code className="bg-white px-1 py-0.5 rounded text-indigo-700">PAYMENT_OVERDUE</code>, o Firestore muda para <code className="bg-white px-1 font-mono">PENDING</code> bloqueando buscas, enriquecimento e geração de textos operacionais.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ASAAS SECURE CHECKOUT POPUP WINDOW SELECTOR */}
      {selectedCheckoutPlan && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col text-slate-800">
            
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative text-left">
              <div>
                <span className="bg-blue-500/20 text-blue-400 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1">
                  ASAAS SECURE CHECKOUT
                </span>
                <h4 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5 font-sans">
                  <span>Assinar Plano:</span>
                  <span className="text-indigo-400 underline font-mono">{selectedCheckoutPlan.name}</span>
                </h4>
              </div>
              <span className="font-black text-white text-base font-mono shrink-0">R$ {selectedCheckoutPlan.price},00</span>
              
              <button 
                onClick={() => setSelectedCheckoutPlan(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-1 rounded-full text-xs transition-colors border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Checkout Method Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border">
                <button 
                  onClick={() => setCheckoutMethod('pix')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none ${
                    checkoutMethod === 'pix' ? "bg-white text-indigo-650 shadow-sm font-black" : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  ⚡ Pagar via PIX
                </button>
                <button 
                  onClick={() => setCheckoutMethod('card')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none ${
                    checkoutMethod === 'card' ? "bg-white text-indigo-650 shadow-sm font-black" : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  💳 Cartão de Crédito
                </button>
                <button 
                  onClick={() => setCheckoutMethod('boleto')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none ${
                    checkoutMethod === 'boleto' ? "bg-white text-indigo-650 shadow-sm font-black" : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  📄 Boleto
                </button>
              </div>

              {checkoutProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <strong className="text-xs font-bold text-slate-800">Processando Transação via Asaas API...</strong>
                  <p className="text-[10px] text-slate-405">Verificando carteira e registrando cobrador recorrente seguro.</p>
                </div>
              ) : pixCodeGenerated ? (
                <div className="space-y-4 text-center">
                  <div className="bg-[#f8f9ff] p-4 rounded-xl flex flex-col items-center justify-center border border-dashed text-slate-500">
                    <div className="w-32 h-32 bg-white border p-2 rounded-lg flex items-center justify-center text-slate-900">
                      <img src={pixQrUrl || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=simulate"} alt="Pix Qr Code" className="w-full h-full" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-2 font-semibold">Escaneie o QR Code emitido pelo Asaas</span>
                  </div>

                  <div className="space-y-1 text-xs text-left">
                    <strong className="text-[10px] text-slate-500 block uppercase font-bold">Chave Copia e Cola Pix</strong>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixCodeGenerated}
                        className="flex-1 border p-2 rounded-lg text-[9px] font-mono text-slate-550 bg-slate-50 focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixCodeGenerated);
                          triggerNotification("Chave PIX copiada!", "success");
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg border-none cursor-pointer text-xs font-bold"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleConfirmPixSimulatedScan}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1 border-none cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    <span>Simular Pagamento Compensado</span>
                  </button>
                </div>
              ) : checkoutMethod === 'pix' ? (
                <div className="py-4 space-y-4 text-center">
                  <p className="text-slate-500 text-xs">Pague via Pix de forma imediata e tenha os créditos liberados no ato.</p>
                  <button 
                    onClick={handleConfirmAsaasPayment}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-xl text-xs border-none cursor-pointer active:scale-95 transition-all"
                  >
                    Gerar Chave e QR Code Pix Asaas plano {selectedCheckoutPlan.name}
                  </button>
                </div>
              ) : checkoutMethod === 'boleto' ? (
                <div className="py-4 space-y-4 text-center">
                  <p className="text-slate-500 text-xs">O boleto será compensado no próximo dia útil bancário.</p>
                  <button 
                    onClick={handleConfirmAsaasPayment}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-xl text-xs border-none cursor-pointer active:scale-95 transition-all"
                  >
                    Gerar Boleto de Cobrança {selectedCheckoutPlan.name}
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmAsaasPayment();
                  }}
                  className="space-y-3 text-left"
                >
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-450 font-extrabold uppercase">Titular do Cartão</label>
                    <input type="text" placeholder="Nome igual impresso" required className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:outline-blue-500" />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-455 font-extrabold uppercase">Número do Cartão</label>
                    <div className="relative">
                      <input type="text" maxLength={19} placeholder="4532 0214 9876 5432" required className="w-full border p-2.5 rounded-xl text-xs font-mono focus:outline-blue-500 pl-8" />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[10px] text-slate-450 font-extrabold uppercase">Validade</label>
                      <input type="text" placeholder="MM/AA" maxLength={5} required className="w-full border p-2.5 rounded-xl text-xs text-center font-mono focus:outline-blue-500" />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] text-slate-450 font-extrabold uppercase">Código CVV</label>
                      <input type="text" placeholder="123" maxLength={4} required className="w-full border p-2.5 rounded-xl text-xs text-center font-mono focus:outline-blue-500" />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1 border-none cursor-pointer mt-4 active:scale-95 transition-all shadow-md"
                  >
                    <span>Efetuar Assinatura Segura</span>
                  </button>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
