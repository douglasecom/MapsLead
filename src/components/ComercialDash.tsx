import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  DollarSign, TrendingUp, Calendar, ChevronRight, 
  MessageSquare, Users, CreditCard, Sparkles, CheckCircle, 
  Layers, Award, ShieldAlert, BarChart3, Copy 
} from 'lucide-react';

interface ComercialDashProps {
  leads: Lead[];
  currentPlan: 'Starter' | 'Pro' | 'Agência';
  onChangePlan: (plan: 'Starter' | 'Pro' | 'Agência') => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ComercialDash: React.FC<ComercialDashProps> = ({ 
  leads, 
  currentPlan, 
  onChangePlan, 
  triggerNotification 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receita' | 'followup' | 'planos'>('receita');
  const capturedLeads = leads.filter(l => l.captured);

  // Financial simulations (Module 15)
  const totalLeadsCount = capturedLeads.length;
  const closedContractsCount = leads.filter(l => l.status === 'fechado' && l.captured).length;
  
  const estimatedTicketSize = 1200; // R$ 1.200 per standard client
  const totalRevenueWon = closedContractsCount * estimatedTicketSize;
  const recurringMRR = closedContractsCount * 150; // R$ 150/mo support retainer
  const predictedPipelineWorth = leads.filter(l => l.status === 'negociacao' && l.captured).length * estimatedTicketSize + (leads.filter(l => l.status === 'interessado' && l.captured).length * (estimatedTicketSize * 0.4));

  const conversionRate = totalLeadsCount > 0 ? Math.round((closedContractsCount / totalLeadsCount) * 100) : 15;

  const handleSendFollowUp = (leadName: string, day: number) => {
    triggerNotification(`Lembrete de Follow-up enviado com sucesso para ${leadName}!`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="bg-white p-2 rounded-2xl border flex gap-1">
        <button 
          onClick={() => setActiveSubTab('receita')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'receita' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard de Receita (Módulo 15)</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('followup')}
          className={`flex-[#D1FAE5] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'followup' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-4 h-4 animate-pulse" />
          <span>Follow-up Pipeline (Módulo 14)</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('planos')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'planos' ? "bg-slate-900 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Assinaturas SaaS (Módulo 16)</span>
        </button>
      </div>

      {/* SUB-TAB 1: RECEITA DASHBOARD (MODULE 15) */}
      {activeSubTab === 'receita' && (
        <div className="space-y-6">
          
          {/* Revenue KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Acumulado Ganho (Vendas)</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">R$ {totalRevenueWon.toLocaleString()}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Estimado a R$ {estimatedTicketSize}/site</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Recorrência Mensal (MRR)</span>
                <TrendingUp className="w-4 h-4 text-gradient text-blue-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">R$ {recurringMRR.toLocaleString()} /mês</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1">R$ 150/cliente suporte técnico</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#0f172a] border border-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-450">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline em Negociação</span>
                <Layers className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-blue-400 font-mono">R$ {Math.round(predictedPipelineWorth).toLocaleString()}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Ponderado por taxa de funil</p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Conversão Real</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-slate-900 font-mono">{conversionRate}%</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{closedContractsCount} fechados de {totalLeadsCount} leads</p>
              </div>
            </div>

          </div>

          {/* Graphical Pipeline charts (Custom high-quality SVGs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Visual Funnel Representation chart */}
            <div className="bg-white border p-6 rounded-3xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Conversão Funil de Vendas (Visão Geral)</h4>
              
              <div className="space-y-4 pt-2">
                
                {/* Level 1: Captured */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Leads Capturados (Base Geral)</span>
                    <span className="font-mono">{totalLeadsCount} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-blue-600 h-full rounded-xl transition-all" style={{ width: "100%" }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">100% captação</span>
                  </div>
                </div>

                {/* Level 2: Qualified Interested */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Interesse Qualificado</span>
                    <span className="font-mono">{leads.filter(l => l.captured && (l.status === 'interessado' || l.status === 'negociacao' || l.status === 'fechado')).length} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-indigo-650 h-full rounded-xl transition-all" style={{ width: "70%" }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-800 uppercase font-mono">70% interesse</span>
                  </div>
                </div>

                {/* Level 3: Pitch & Negotiations */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Proposta e Negociações</span>
                    <span className="font-mono">{leads.filter(l => l.captured && (l.status === 'negociacao' || l.status === 'fechado')).length} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-amber-500 h-full rounded-xl transition-all" style={{ width: "42%" }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-900 uppercase">42% negociação</span>
                  </div>
                </div>

                {/* Level 4: Win contracts */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Contratos Ganhos (Fechados)</span>
                    <span className="font-mono text-emerald-700 font-extrabold">{closedContractsCount} contratos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6.5 rounded-xl overflow-hidden relative border shadow-inner">
                    <div className="bg-emerald-500 h-full rounded-xl transition-all" style={{ width: `${conversionRate}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-950 uppercase">{conversionRate}% conversão</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Custom Pie-style Donut chart representing niches revenue block */}
            <div className="bg-white border p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Receita Mensal Estimada por Nicho</h4>
              
              <div className="flex flex-col sm:flex-row items-center justify-space outline-none gap-6 pt-4">
                {/* SVG Pizza chart mockup */}
                <div className="relative shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {/* Circle 1: Padaria */}
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#3b82f6" strokeWidth="24" strokeDasharray="314" strokeDashoffset="120" />
                    {/* Circle 2: Odonto */}
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#10b981" strokeWidth="24" strokeDasharray="314" strokeDashoffset="180" />
                    {/* Circle 3: Mecânica */}
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f59e0b" strokeWidth="24" strokeDasharray="314" strokeDashoffset="240" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">MRR</span>
                    <span className="text-[15px] font-black font-mono text-slate-850">R$ {recurringMRR}</span>
                  </div>
                </div>

                {/* Niches List representation */}
                <div className="space-y-3 font-semibold text-xs text-slate-705 w-full">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-blue-500"></span>
                      <span>Alimentação / Padaria:</span>
                    </div>
                    <span className="font-mono text-slate-800">55% (~R$ {Math.round(recurringMRR * 0.55)})</span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span>Saúde / Odontologia:</span>
                    </div>
                    <span className="font-mono text-slate-800 font-extrabold">30% (~R$ {Math.round(recurringMRR * 0.3)})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-500"></span>
                      <span>Serviços / Automotivo:</span>
                    </div>
                    <span className="font-mono text-slate-800">15% (~R$ {Math.round(recurringMRR * 0.15)})</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed mt-4">
                ⭐ <strong className="text-slate-800">Diretriz IA:</strong> O setor de <strong>Alimentação</strong> apresenta menor fricção comercial devido à ausência de cardápios otimizados, tendo ciclos de conversão mais rápidos.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: FOLLOW-UP AUTOMATED DRIP PIPELINE (MODULE 14) */}
      {activeSubTab === 'followup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-205 space-y-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-850">Central de Follow-up (Abordagem Sequencial)</h3>
              <p className="text-slate-500 text-xs mt-0.5">Dispare contatos automáticos espaçados no tempo para leads que receberam propostas ou estudos e evite esfriar a negociação.</p>
            </div>

            {/* Timelines of touches */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* Day 1 */}
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px]">
                <div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 1</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Envio Inicial</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Pitch Copywriter estruturado com auditoria de gaps do GMB.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  {capturedLeads.slice(0, 2).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center group font-semibold text-slate-700 bg-white p-1.5 rounded border">
                      <span className="truncate max-w-[80px]">{l.name}</span>
                      <button 
                        onClick={() => handleSendFollowUp(l.name, 1)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Enviar toque 1"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day 3 */}
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px]">
                <div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase block w-max font-mono">Dia 3</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Prova Social</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Lembrete focado em notas excelentes do Google nos outros concorrentes.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  {capturedLeads.length > 2 ? (
                    <div className="flex justify-between items-center group font-semibold text-slate-700 bg-white p-1.5 rounded border">
                      <span className="truncate max-w-[80px]">{capturedLeads[2].name}</span>
                      <button 
                        onClick={() => handleSendFollowUp(capturedLeads[2].name, 3)}
                        className="text-indigo-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic text-center block mt-2">Aguardando leads</span>
                  )}
                </div>
              </div>

              {/* Day 7 */}
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px]">
                <div>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 7</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">Site Exemplo</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Apresentação do blueprint gerado pelo Google Stitch.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  <span className="text-[10px] text-slate-400 italic text-center block mt-2">Sem leads pendentes</span>
                </div>
              </div>

              {/* Day 15 */}
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px]">
                <div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase block w-max font-mono">Dia 15</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2">CTA Condições</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Última oportunidade de adesão sem taxas iniciais de set up.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  <span className="text-[10px] text-slate-400 italic text-center block mt-2">Sem leads pendentes</span>
                </div>
              </div>

              {/* Day 30 */}
              <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px]">
                <div>
                  <span className="text-[10px] bg-slate-205 text-slate-800 px-2 py-0.5 rounded font-bold uppercase block w-max">Dia 30</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-2 font-mono">Reativação</h4>
                  <p className="text-[10px] text-slate-450 leading-normal font-medium mt-1">Arquivamento e disponibilização de cupom para ativações futuras.</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-[11px]">
                  <span className="text-[10px] text-slate-404 italic text-center block mt-2">Fila limpa</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MEMBERSHIPS & PLANS SAAS (MODULE 16) */}
      {activeSubTab === 'planos' && (
        <div className="space-y-6">
          <div className="bg-slate-950 text-white p-8 rounded-3xl border border-slate-850 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-505/10 rounded-full blur-2xl"></div>

            <div className="max-w-2xl text-center mx-auto mb-12">
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest block w-max mx-auto mb-3 border border-blue-500/20">
                PILARES DE MONETIZAÇÃO
              </span>
              <h3 className="text-3xl font-extrabold tracking-tight text-white leading-tight">Escolha e configure seu Plano SaaS</h3>
              <p className="text-slate-400 text-xs mt-2">Planos com cotas ajustadas de créditos de captação de leads. Integre as credenciais das gateways de cobrança comercial.</p>
            </div>

            {/* Plans Grid columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan 1 */}
              <div className={`bg-[#0f172a] border rounded-2xl p-6 flex flex-col justify-between relative ${currentPlan === 'Starter' ? 'border-blue-505 shadow-md shadow-blue-500/5' : 'border-slate-850'}`}>
                {currentPlan === 'Starter' && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-blue-550 text-white font-extrabold text-[10px] rounded-full uppercase py-1 px-3.5">Ativo</span>
                )}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-400 tracking-wider block uppercase">Starter</h5>
                    <span className="text-4xl font-black font-mono text-white mt-1">R$ 197<span className="text-sm font-medium text-slate-500">/mês</span></span>
                  </div>
                  
                  <ul className="space-y-2 text-xs font-semibold text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="text-white font-bold">200 créditos</span> de busca</li>
                    <li className="flex items-center gap-2">✓ CRM Kanban Limpo</li>
                    <li className="flex items-center gap-2">✗ Sem Coprodutor IA</li>
                    <li className="flex items-center gap-2">✗ Sem exportações CSV</li>
                  </ul>
                </div>

                <button 
                  onClick={() => onChangePlan('Starter')}
                  className="w-full mt-6 bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-center text-xs uppercase cursor-pointer"
                >
                  Selecionar Starter
                </button>
              </div>

              {/* Plan 2 */}
              <div className={`bg-[#0f172a] border rounded-2xl p-6 flex flex-col justify-between relative ${currentPlan === 'Pro' ? 'border-blue-505 shadow-md shadow-blue-500/5' : 'border-slate-850'}`}>
                {currentPlan === 'Pro' && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-blue-550 text-white font-extrabold text-[10px] rounded-full uppercase py-1 px-2.5">Ativo</span>
                )}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-extrabold text-xs text-blue-400 tracking-wider block uppercase">Profissional</h5>
                    <span className="text-4xl font-black font-mono text-white mt-1">R$ 347<span className="text-sm font-medium text-slate-500">/mês</span></span>
                  </div>
                  
                  <ul className="space-y-2 text-xs font-semibold text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="text-white font-bold">1.000 créditos</span> de busca</li>
                    <li className="flex items-center gap-2">✓ CRM de 8 Colunas Completo</li>
                    <li className="flex items-center gap-2">✓ Coprodutor IA Parcial</li>
                    <li className="flex items-center gap-2">✓ Relatórios e Propostas</li>
                  </ul>
                </div>

                <button 
                  onClick={() => onChangePlan('Pro')}
                  className="w-full mt-6 bg-blue-620 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center text-xs uppercase cursor-pointer"
                >
                  Selecionar Pro
                </button>
              </div>

              {/* Plan 3 */}
              <div className={`bg-[#0f172a] border rounded-2xl p-6 flex flex-col justify-between relative ${currentPlan === 'Agência' ? 'border-orange-500 shadow-md shadow-orange-500/5' : 'border-slate-850'}`}>
                {currentPlan === 'Agência' && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white font-extrabold text-[10px] rounded-full uppercase py-1 px-2.5">Ativo Premium</span>
                )}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-extrabold text-xs text-orange-400 tracking-wider block uppercase flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Agência Unlimited</span>
                    </h5>
                    <span className="text-4xl font-black font-mono text-white mt-1">R$ 597<span className="text-sm font-medium text-slate-500">/mês</span></span>
                  </div>
                  
                  <ul className="space-y-2 text-xs font-semibold text-slate-300">
                    <li className="flex items-center gap-2">✓ <span className="text-white font-bold">5.000 créditos</span> diários</li>
                    <li className="flex items-center gap-2">✓ Copiloto IA Sênior Ativo</li>
                    <li className="flex items-center gap-2">✓ Propostas, Contratos, Relatórios</li>
                    <li className="flex items-center gap-2">✓ Exportação CSV rápida</li>
                  </ul>
                </div>

                <button 
                  onClick={() => onChangePlan('Agência')}
                  className="w-full mt-6 bg-orange-620 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-center text-xs uppercase cursor-pointer"
                >
                  Selecionar Agência
                </button>
              </div>

            </div>

            {/* Simulated Payment Gateways panel (Module 16) */}
            <div className="border-t border-white/5 pt-6 mt-8 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Configuração de Gateways de Pagamento Ativas</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-200 block">Mercado Pago Gateway</span>
                    <span className="text-slate-500 font-mono text-[9px] block">Checkout Transparente</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black font-mono">SIMULATION ON</span>
                </div>

                <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-200 block">Stripe Intermediadora</span>
                    <span className="text-slate-500 font-mono text-[9px] block">SaaS Billing API</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black font-mono">SIMULATION ON</span>
                </div>

                <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-200 block">Asaas Gateway</span>
                    <span className="text-slate-500 font-mono text-[9px] block">Cobrança de Retidos PIX</span>
                  </div>
                  <span className="text-[10px] bg-orange-505/20 text-orange-400 px-2 py-0.5 rounded font-black font-mono">SIMULATION ON</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
