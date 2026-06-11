import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { 
  FileText, ShieldCheck, Globe, Printer, Copy, Check, 
  ExternalLink, Smartphone, ShoppingCart, Calendar, 
  MapPin, Phone, Star, Send, ShieldAlert, Award, Sliders, RefreshCw
} from 'lucide-react';

interface DocumentGeneratorProps {
  lead: Lead;
  onClose: () => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ 
  lead, 
  onClose, 
  triggerNotification 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'proposta' | 'contrato' | 'stitch'>('proposta');
  const [copied, setCopied] = useState(false);
  const [stitchFormSubmitted, setStitchFormSubmitted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // INput states for customization:
  const [empresa, setEmpresa] = useState(lead.name || '');
  const [cidade, setCidade] = useState(lead.location || 'São Paulo, SP');
  const [segmento, setSegmento] = useState(lead.niche || 'Serviços');
  
  // Custom diagnostic scores
  const [mapsScore, setMapsScore] = useState(lead.rating >= 4.5 ? 85 : 55);
  const [siteScore, setSiteScore] = useState(lead.hasWebsite ? 85 : 25);
  const [seoScore, setSeoScore] = useState(lead.hasWebsite ? 75 : 15);
  const [instagramScore, setInstagramScore] = useState(lead.enrichment?.hasInstagramLink ? 85 : 0);
  const [facebookScore, setFacebookScore] = useState(lead.enrichment?.hasFacebookLink ? 80 : 0);
  const [gbpScore, setGbpScore] = useState(lead.hasGmbActive ? 85 : 40);
  const [currentRating, setCurrentRating] = useState(lead.rating || 4.5);
  const [currentReviews, setCurrentReviews] = useState(lead.reviews || 8);
  const [announcedMeta, setAnnouncedMeta] = useState(lead.enrichment?.hasFacebookLink ? true : false);
  const [companySize, setCompanySize] = useState<'Pequena' | 'Média' | 'Grande'>(
    lead.reviews > 400 ? 'Grande' : (lead.reviews > 110 ? 'Média' : 'Pequena')
  );

  // AI proposal state
  const [proposalData, setProposalData] = useState<any>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [setupPriceOverride, setSetupPriceOverride] = useState<number>(997);
  const [monthlyPriceOverride, setMonthlyPriceOverride] = useState<number>(497);

  // Currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const fetchProposal = async (isRegen = false) => {
    setIsLoadingProposal(true);
    try {
      const response = await fetch("/api/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa,
          cidade,
          segmento,
          maps_score: mapsScore,
          site_score: siteScore,
          seo_score: seoScore,
          instagram_score: instagramScore,
          facebook_score: facebookScore,
          gbp_score: gbpScore,
          rating: currentRating,
          reviews: currentReviews,
          announcedMeta,
          companySize
        })
      });
      if (!response.ok) throw new Error("Erro na rede do servidor");
      const data = await response.json();
      setProposalData(data);
      setSetupPriceOverride(data.totalSetup || 0);
      setMonthlyPriceOverride(data.totalMonthly || 0);
      if (isRegen) {
        triggerNotification("Sua Proposta Comercial foi gerada e atualizada com sucesso pela IA!", "success");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Erro ao conectar com servidor de propostas. Exibindo proposta tática local.", "info");
      
      // Local fallback calculation if server fails or is cold
      const estLeads = companySize === "Grande" ? "+150 a +350" : companySize === "Média" ? "+60 a +150" : "+25 a +60";
      const estMeetings = companySize === "Grande" ? "+40 a +90" : companySize === "Média" ? "+15 a +40" : "+8 a +18";
      const dummySetup = siteScore < 70 ? (companySize === "Grande" ? 3497 : companySize === "Média" ? 1997 : 997) : 0;
      const dummyMonthly = (seoScore < 70 ? (companySize === "Grande" ? 1497 : companySize === "Média" ? 997 : 497) : 497) + (instagramScore === 0 ? 797 : 0);

      const dummyObj = {
        relatorioExecutivo: `Análise de posicionamento desenvolvida com exclusividade para a empresa ${empresa}. Identificamos um prestígio considerável em ${cidade}, consolidado pela média de ${currentRating}★ com base em ${currentReviews} avaliações voluntárias. No entanto, sua presença web apresenta gaps que limitam a captura continuada de clientes.`,
        diagnostico: `PONTOS FORTES:\n- Excelente avaliação média local com destaque em satisfação do público (${currentRating}★).\n- Fidelização de marca comprovada por ${currentReviews} avaliações autênticas.\n\nOPORTUNIDADES DETALHADAS:\n${siteScore < 70 ? "- Ausência de canal institucional express de carregamento rápido (Landing Page).\n" : ""}${seoScore < 40 ? "- Baixo ranqueamento regional para termos orgânicos chaves.\n" : ""}- Ausência de automação de pré-agendamento e CRM de vendas.`,
        impactoFinanceiro: `Considerando o fluxo de pesquisa mensal do segmento de ${segmento} na região de ${cidade}, estima-se que a empresa perca de 30% a 55% das intenções reais de compra devido à falta de botões de conversão e página otimizada. Isso representa um desvio financeiro estimado entre R$ 3.000,00 e R$ 12.000,00 por mês.`,
        planoDeAcao: {
          curtoPrazo: "Higienização completa da ficha do Maps, atualização do FAQ e geração de QR Codes para incentivar novas avaliações no balcão.",
          medioPrazo: "Criação e indexação de Landing Page de alto rendimento configurada para celulares e integrada diretamente ao WhatsApp comercial.",
          longoPrazo: "Ativação de tráfego pago geolocalizado e implementação de automação de CRM AdsHive para rastrear todos os contatos sem perdas."
        },
        investimentos: [
          { servico: "SITE STARTER (Express Mobile-First)", tipo: "Setup", valor: dummySetup || 997 },
          { servico: "SEO LOCAL START & Monitoramento", tipo: "Mensal", valor: dummyMonthly || 497 }
        ],
        totalSetup: dummySetup || 997,
        totalMonthly: dummyMonthly || 497,
        projecaoResultados: `- Incremento de cliques locais aproximado de 40% em 60 dias.\n- Captação esperada de ${estLeads} leads mensais via WhatsApp.\n- Fechamento imediato de ${estMeetings} novos agendamentos e vendas.`,
        cronograma: {
          semana1: "Planejamento estrutural, redação técnica da copy e briefing de fotos e logo.",
          semana2: "Criação de design, testes de velocidade de página e setup do Google Maps.",
          semana3: "Integração final do funil de conversão e botões diretos de atendimento.",
          semana4: "Treinamento breve do time de atendimento, indexação e ativação comercial."
        },
        fechamento: "Estamos inteiramente prontos para implantar sua esteira comercial e alavancar seus agendamentos no primeiro dia útil útil."
      };

      setProposalData(dummyObj);
      setSetupPriceOverride(dummyObj.totalSetup);
      setMonthlyPriceOverride(dummyObj.totalMonthly);
    } finally {
      setIsLoadingProposal(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [lead]);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-document-area');
    if (!printContent) {
      triggerNotification("Falha ao localizar área de impressão", "error");
      return;
    }
    window.print();
    triggerNotification("Folha de impressão enviada!", "success");
  };

  const handleCopyText = () => {
    if (!proposalData) return;
    const summaryText = `Proposta Comercial Premium - ${empresa}
- Consultoria: AdsHive Prospect (Slogan: INTELIGÊNCIA DE VENDAS)
- Cidade: ${cidade}
- Investimento Único Implantação: ${formatCurrency(setupPriceOverride)}
- Recorrência Mensal Suporte/SEO: ${formatCurrency(monthlyPriceOverride)}

Plano de Ação Sugerido:
1. Curto Prazo: ${proposalData.planoDeAcao?.curtoPrazo}
2. Médio Prazo: ${proposalData.planoDeAcao?.medioPrazo}
3. Longo Prazo: ${proposalData.planoDeAcao?.longoPrazo}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    triggerNotification("Copiado com sucesso para a área de transferência!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColorClass = (val: number) => {
    if (val >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const normalizedNiche = segmento.toLowerCase();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl border shadow-2xl relative overflow-hidden flex flex-col h-[92vh]">
        
        {/* Header Banner - Navigation tabs */}
        <div className="bg-gradient-to-tr from-slate-950 to-indigo-950 text-white p-5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5">
          <div>
            <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block border border-amber-500/20 mb-1.5">
              FASE 5 — FECHAMENTO COMERCIAL PREMIUM
            </span>
            <h3 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              <span className="opacity-70 font-medium">Ativo Diagnóstico:</span>
              <span className="text-amber-400 font-bold truncate max-w-[250px]">{empresa}</span>
            </h3>
          </div>

          {/* Sub Tab Switches */}
          <div className="flex bg-slate-900 p-1 rounded-xl gap-0.5 border border-white/5">
            <button 
              onClick={() => setActiveSubTab('proposta')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'proposta' ? "bg-amber-500 text-slate-950 shadow-md font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Proposta Comercial</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('contrato')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'contrato' ? "bg-indigo-600 text-white shadow-md font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. Contrato B2B</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('stitch')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'stitch' ? "bg-emerald-500 text-white shadow-md font-extrabold animate-pulse" : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Demo Google Stitch Mock</span>
            </button>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Working Content Area */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50 flex flex-col lg:flex-row gap-6 h-full">
          
          {/* Main Document Body */}
          <div className="flex-1 bg-white border rounded-2xl shadow-sm p-6 overflow-y-auto max-h-full print:p-0 print:shadow-none print:border-none" id="printable-document-area">
            
            {/* SUBTAB 1 — PROPOSTA IA COMERCIAL */}
            {activeSubTab === 'proposta' && (
              <div className="space-y-6 text-slate-800 text-xs text-left leading-relaxed max-w-3xl mx-auto">
                
                {/* Proposal Header Document Sheet */}
                <div className="border-b-2 border-amber-500 pb-4 text-center sm:text-left flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Proposta de Consultoria & Posicionamento Local</h1>
                    <p className="text-slate-450 font-mono text-[9px] mt-1">Ref Presença Google Maps: {empresa} • Diagnóstico AdsHive</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-600 uppercase block font-mono text-sm leading-tight">AdsHive Prospect</span>
                    <span className="text-slate-400 font-semibold block text-[10px] italic">INTELIGÊNCIA DE VENDAS</span>
                  </div>
                </div>

                {/* Cliente / Destinatário */}
                <div className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Proposta Elaborada para:</span>
                    <strong className="text-slate-800 text-sm block mt-1">{empresa}</strong>
                    <span className="text-slate-500 font-medium block mt-0.5">{cidade}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block font-mono">Status Digital atual:</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold">
                      <span className="text-slate-800 font-mono text-xs">{currentRating}★ ({currentReviews} avaliações)</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase">Porte: {companySize}</span>
                    </div>
                  </div>
                </div>

                {isLoadingProposal ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-slate-500 font-bold text-xs animate-pulse">Personalizando e gerando proposta comercial premium estruturada por IA...</p>
                    <p className="text-slate-400 text-[10px]">Analisando as diretrizes e catálogo de serviços da consultoria</p>
                  </div>
                ) : proposalData ? (
                  <>
                    {/* 1. Relatório Executivo */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">1. Relatório Executivo</h3>
                      <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {proposalData.relatorioExecutivo}
                      </p>
                    </div>

                    {/* 2. Diagnóstico de Gaps */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">2. Diagnóstico Detalhado</h3>
                      <div className="bg-slate-50 border p-3 rounded-lg text-slate-600 font-semibold text-[11px] whitespace-pre-wrap leading-relaxed">
                        {proposalData.diagnostico}
                      </div>
                    </div>

                    {/* 3. Oportunidades Encontradas (Impacto Financeiro) */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-amber-800 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">3. Oportunidades & Análise de Clientes Perdidos</h3>
                      <p className="text-slate-600 font-semibold whitespace-pre-wrap leading-relaxed bg-amber-50/30 p-3 rounded-lg border border-amber-100 italic">
                        {proposalData.impactoFinanceiro}
                      </p>
                    </div>

                    {/* 4. Plano de Ação Recomendado */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">4. Plano de Ação Recomendado</h3>
                      
                      <div className="grid grid-cols-1 gap-2 mt-1">
                        <div className="border p-3 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                          <strong className="text-amber-600 text-xs block font-bold">⚡ Curto Prazo (Primeiros 7 Dias)</strong>
                          <p className="text-slate-650 font-semibold leading-relaxed">{proposalData.planoDeAcao?.curtoPrazo}</p>
                        </div>

                        <div className="border p-3 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                          <strong className="text-indigo-600 text-xs block font-bold">📆 Médio Prazo (8 a 21 Dias)</strong>
                          <p className="text-slate-650 font-semibold leading-relaxed">{proposalData.planoDeAcao?.medioPrazo}</p>
                        </div>

                        <div className="border p-3 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                          <strong className="text-emerald-600 text-xs block font-bold">🚀 Longo Prazo (Escala e Recorrência)</strong>
                          <p className="text-slate-650 font-semibold leading-relaxed">{proposalData.planoDeAcao?.longoPrazo}</p>
                        </div>
                      </div>
                    </div>

                    {/* 5. Valores e Investimento */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">5. Investimento Sugerido</h3>
                      <p className="text-slate-500 font-bold">Abaixo estão sugeridos única e exclusivamente os serviços condizentes com a auditoria:</p>
                      
                      <div className="border rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[10px]">
                              <th className="p-2.5">Serviço Recomendado</th>
                              <th className="p-2.5">Modelo</th>
                              <th className="p-2.5 text-right">Valor Comercial</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposalData.investimentos?.map((inv: any, idx: number) => {
                              const isSetupItem = inv.tipo === 'Setup';
                              const displayVal = isSetupItem ? setupPriceOverride : monthlyPriceOverride;
                              return (
                                <tr key={idx} className="border-b hover:bg-slate-50 text-[11px]">
                                  <td className="p-2.5 font-bold text-slate-900">{inv.servico}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      inv.tipo === 'Setup' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {inv.tipo || "Mensal"}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                                    {formatCurrency(displayVal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-[#fcfcff] border-2 border-amber-100 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="text-slate-400 font-bold block uppercase text-[9px]">Taxa de Implantação Básica (Setup Único)</span>
                          <span className="text-xl font-black text-slate-900 font-mono block mt-0.5">
                            {formatCurrency(setupPriceOverride)}
                          </span>
                          <p className="text-slate-450 block text-[9px] mt-0.5">Pagamento facilitado em boleto ou cartão</p>
                        </div>
                        <div className="border-t sm:border-y-0 sm:border-l sm:pt-0 pt-4 sm:pl-4">
                          <span className="text-indigo-600 font-bold block uppercase text-[9px]">Acompanhamento Local Recorrente (Mensal)</span>
                          <span className="text-lg font-black text-indigo-650 font-mono block mt-0.5">
                            {formatCurrency(monthlyPriceOverride)} <span className="text-xs font-semibold text-slate-400">/mês</span>
                          </span>
                          <p className="text-slate-450 block text-[9px] mt-0.5">Hospedagem, suporte técnico ativo e monitoramento de SEO</p>
                        </div>
                      </div>
                    </div>

                    {/* 6. Projeção de Resultados (ROI Estimado) */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">6. ROI Estimado & Projeção de Resultados</h3>
                      <div className="bg-slate-50 border p-3 rounded-lg text-slate-600 font-semibold text-[11px] whitespace-pre-wrap leading-relaxed">
                        {proposalData.projecaoResultados}
                      </div>
                    </div>

                    {/* 7. Cronograma */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-slate-900 border-l-4 border-amber-500 pl-2 uppercase tracking-wide">7. Cronograma de Implantação</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="bg-slate-50 p-2.5 rounded-lg border">
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-black tracking-wide uppercase font-mono">Semana 1</span>
                          <p className="text-slate-650 leading-relaxed mt-1 font-semibold">{proposalData.cronograma?.semana1}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border">
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-black tracking-wide uppercase font-mono">Semana 2</span>
                          <p className="text-slate-650 leading-relaxed mt-1 font-semibold">{proposalData.cronograma?.semana2}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border">
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-black tracking-wide uppercase font-mono">Semana 3</span>
                          <p className="text-slate-650 leading-relaxed mt-1 font-semibold">{proposalData.cronograma?.semana3}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border">
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-black tracking-wide uppercase font-mono">Semana 4</span>
                          <p className="text-slate-650 leading-relaxed mt-1 font-semibold">{proposalData.cronograma?.semana4}</p>
                        </div>
                      </div>
                    </div>

                    {/* 8. Fechamento Comercial Completo */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <h3 className="text-xs font-black text-slate-900 uppercase">8. Proposta Comercial Completa</h3>
                      <p className="text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">
                        {proposalData.fechamento}
                      </p>
                      
                      <div className="pt-6 border-t border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 p-4 rounded-xl">
                        <div className="text-center sm:text-left mb-4 sm:mb-0">
                          <p className="text-[9px] text-slate-400 font-black tracking-wider uppercase">Proponente Sênior:</p>
                          <p className="text-base font-black text-slate-900 mt-0.5">Douglas Pereira</p>
                          <p className="text-xs font-bold text-amber-600">Consultor de Crescimento Digital • AdsHive Prospect</p>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className="border-2 border-slate-800 px-3 py-1.5 rounded-lg font-black text-slate-800 uppercase tracking-widest text-[9px] inline-block">
                            INTELIGÊNCIA DE VENDAS
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-rose-500 font-bold">Não foi possível carregar a proposta de vendas.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2 — CONTRATO COMERCIAL */}
            {activeSubTab === 'contrato' && (
              <div className="space-y-6 text-slate-800 text-xs text-left leading-relaxed max-w-3xl mx-auto font-serif">
                
                <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                  <h1 className="text-base font-bold text-slate-900 uppercase">Instrumento Particular de Prestação de Serviços Digitais</h1>
                  <p className="text-slate-400 font-mono text-[9px]">CONTRATO DE ADESÃO DIGITAL - MODELO PADRÃO</p>
                </div>

                {/* Partes */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase relative">1. DAS PARTES CONTRATANTES</strong>
                  <p className="text-slate-650 leading-normal font-semibold">
                    <strong>CONTRATADA (Consultoria):</strong> ADSHIVE PROSPECT SOLUÇÕES DIGITAIS, doravante denominada simplesmente CONTRATADA, operadora do sistema comercial integrado AdsHive.
                  </p>
                  <p className="text-slate-650 leading-normal font-semibold">
                    <strong>CONTRATANTE (Estabelecimento):</strong> {empresa}, estabelecida comercialmente na localidade de <strong>{cidade}</strong>, doravante denominada simplemente CONTRATANTE.
                  </p>
                </div>

                {/* Cláusula Primeira: Objeto */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Primeira — Do Objeto</strong>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed border font-sans text-[11px]">
                    O presente instrumento rege a prestação de serviços de ativação digital comercial, compreendendo desenvolvimento de Website Mobile-First One-Page Premium, higienização estratégica e otimização de posicionamento de palavras-chave locais do Google Maps (SEO Local), conforme alinhamentos da Proposta Comercial.
                  </p>
                </div>

                {/* Cláusula Segunda: Prazos */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Segunda — Dos Prazos</strong>
                  <p className="text-slate-650 leading-normal font-medium">
                    O desenvolvimento estrutural, testes corporativos e a consolidação do redirecionamento de WhatsApp serão implementados em até 07 (sete) dias úteis, contados a partir da validação mútua dos ativos básicos de layout.
                  </p>
                </div>

                {/* Cláusula Terceira: Valores */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Terceira — Dos Valores e Cobrança</strong>
                  <p className="text-slate-650 leading-normal font-medium">
                    Como contraprestação pelos serviços exclusivos de implantação, a CONTRATANTE investirá a taxa única de <strong>{formatCurrency(setupPriceOverride)}</strong>. As ações de acompanhamento, monitoramento de métricas locais de GMB e manutenção ativa de suporte de WhatsApp possuirão mensalidade no valor de <strong>{formatCurrency(monthlyPriceOverride)} /mês</strong>, faturada de maneira recorrente via PIX ou Boleto no primeiro dia do ciclo do serviço.
                  </p>
                </div>

                {/* Cláusula Quarta: Rescisão */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Quarta — Do Modelo de Rescisão Sem Multas</strong>
                  <p className="text-slate-650 leading-normal font-medium">
                    As partes reiteram que o acompanhamento continuado mensal opera em regime de confiança sem fidelização forçada. A CONTRATANTE poderá solicitar a pausa ou rescisão técnica do suporte técnico a qualquer instante mediante notificação de 15 dias de antecedência, sem penalidades ou fricção adicional.
                  </p>
                </div>

                {/* Signatures Panel */}
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-slate-500 font-sans text-[11px]">
                  <div className="border-t border-slate-300 pt-4 space-y-1">
                    <div className="h-10"></div>
                    <span className="font-extrabold text-slate-400 block pb-1">________________________________________</span>
                    <span className="text-slate-800 text-xs font-bold block">ADSHIVE PROSPECT SOLUÇÕES</span>
                    <span className="text-[10px] block">Consultoria de Vendas Sênior</span>
                  </div>

                  <div className="border-t border-slate-300 pt-4 space-y-1">
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold font-mono">EMITIDO COM CERTIFICAÇÃO DIGITAL</span>
                    </div>
                    <span className="font-extrabold text-slate-400 block pb-1">________________________________________</span>
                    <span className="text-slate-800 text-xs font-bold block">{empresa}</span>
                    <span className="text-[10px] block">REPRESENTANTE CONTRATANTE</span>
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 3 — DEMO GOOGLE STITCH MOCK (WEBSITE SIMULATION VIEWPORT) */}
            {activeSubTab === 'stitch' && (
              <div className="flex flex-col items-center justify-center py-6">
                
                {/* Simulated Smartphone Device Wrapper */}
                <div className="w-80 md:w-96 min-h-[580px] bg-slate-950 border-[10px] border-slate-900 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col pt-6 pb-4">
                  {/* Speaker dot top notch */}
                  <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-14 h-4 bg-slate-900 rounded-full flex justify-between px-3 items-center">
                    <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                  </div>

                  {/* Browser simulated top header bar inside phone */}
                  <div className="bg-slate-900 py-2 px-4 flex items-center justify-between text-slate-400 font-mono text-[9px] border-b border-slate-850">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="truncate">stitch.google.com/{empresa.toLowerCase().replace(/\s+/g, '-')}</span>
                    </div>
                    <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded font-black font-mono">SSL ATIVO</span>
                  </div>

                  {/* STITCH RENDER - ADAPTIVE BY LEAD NICHE */}
                  <div className="flex-1 bg-white overflow-y-auto max-h-[460px] text-slate-800 text-left font-sans text-xs">
                    
                    {/* NICHE: BAKERY / FOOD */}
                    {normalizedNiche.includes('padaria') || normalizedNiche.includes('confeitaria') || normalizedNiche.includes('pão') || normalizedNiche.includes('restaurante') || normalizedNiche.includes('comida') || normalizedNiche.includes('pizza') || normalizedNiche.includes('doce') ? (
                      <div className="space-y-0 text-[11px]">
                        {/* Food Hero Banner */}
                        <div className="bg-gradient-to-tr from-amber-600 to-amber-700 text-white p-6 text-center space-y-2 relative">
                          <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">PADARIA PREMIUM</span>
                          <h2 className="text-lg font-black leading-tight">{empresa}</h2>
                          <p className="text-[10px] text-amber-100 font-medium leading-relaxed">Tradição, sabor e entrega ágil para você e sua família em {cidade}! Faça seu agendamento/pedido.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-200 mt-2">
                            <span className="font-extrabold text-[#FEF3C7]">{currentRating}★</span>
                            <span className="text-[9px]">({currentReviews} avaliações do Maps)</span>
                          </div>
                        </div>

                        {/* Order Catalog Section */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-amber-950 uppercase block font-black border-b pb-1">🛒 Cardápio de Pedidos Direto (WhatsApp)</strong>
                          
                          <div className="space-y-2">
                            <div className="flex gap-2.5 items-center justify-between border-b pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">Pão de Queijo Artesanal Especial</span>
                                <span className="text-[10px] text-slate-450 block leading-normal">Receita artesanal mineira com casca de parmesão ralado na hora.</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-amber-700 font-mono block text-xs">R$ 18,90</span>
                                <button 
                                  onClick={() => {
                                    setCartCount(prev => prev + 1);
                                    triggerNotification("Produto adicionado ao carrinho de demonstração!", "success");
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg border-none mt-1 active:scale-95 transition-all cursor-pointer"
                                >
                                  + Adicionar
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2.5 items-center justify-between border-b pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">Combo Café Expresso & Pão na Chapa</span>
                                <span className="text-[10px] text-slate-450 block leading-normal">Combinação clássica com requeijão na chapa com crocância de padaria sênior.</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-amber-700 font-mono block text-xs">R$ 12,50</span>
                                <button 
                                  onClick={() => {
                                    setCartCount(prev => prev + 1);
                                    triggerNotification("Produto adicionado ao carrinho de demonstração!", "success");
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg border-none mt-1 active:scale-95 transition-all cursor-pointer"
                                >
                                  + Adicionar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Float Cart Drawer */}
                        {cartCount > 0 && (
                          <div className="sticky bottom-0 left-0 w-full bg-emerald-600 text-white p-3 flex justify-between items-center px-4 animate-in slide-in-from-bottom-5 z-20">
                            <div className="text-[10px] font-bold flex items-center gap-1.5">
                              <ShoppingCart className="w-3.5 h-3.5 animate-bounce" />
                              <span>{cartCount} item(s) selecionado(s)</span>
                            </div>
                            <button
                              onClick={() => {
                                triggerNotification("Sua página envia o pedido formatado com endereço direto para o WhatsApp do atendimento físico!", "info");
                                if (!stitchFormSubmitted) setStitchFormSubmitted(true);
                              }}
                              className="bg-white text-emerald-800 text-[9px] font-black uppercase py-1 px-3 rounded-full border-none cursor-pointer"
                            >
                              Finalizar no WhatsApp ➔
                            </button>
                          </div>
                        )}

                        {/* Testimonials block */}
                        <div className="p-4 bg-[#fdfaf5] space-y-2">
                          <strong className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">Como avaliam no Google Maps:</strong>
                          <div className="bg-white p-3 rounded-xl border border-amber-100 italic text-[10px] text-slate-500 leading-normal">
                            "A melhor escolha do bairro de longe! Atendimento perfeito e agora aceitando pedidos de celular com carinho ficou impecável."
                          </div>
                        </div>
                      </div>
                    ) : normalizedNiche.includes('dentista') || normalizedNiche.includes('odonto') || normalizedNiche.includes('dental') || normalizedNiche.includes('clinica') || normalizedNiche.includes('saude') || normalizedNiche.includes('médico') || normalizedNiche.includes('psicolog') ? (
                      /* HEALTH / DENTIST CLINIC */
                      <div className="space-y-0 text-[11px]">
                        <div className="bg-gradient-to-tr from-teal-600 to-cyan-700 text-white p-6 text-center space-y-2">
                          <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">CLÍNICA MÉDICA DE EXCELÊNCIA</span>
                          <h2 className="text-base font-black leading-tight">{empresa}</h2>
                          <p className="text-[10px] text-teal-100 font-semibold leading-relaxed">Cuidado profissional, agendamentos rápidos e atendimento diferenciado em {cidade}.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-teal-200 mt-2">
                            <span>{currentRating}★</span>
                            <span>({currentReviews} avaliações Maps)</span>
                          </div>
                        </div>

                        {/* Appointment form block */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-teal-950 uppercase block font-black border-b pb-1">⚙️ Pré-Agendamento Rápido de Consulta</strong>
                          
                          {stitchFormSubmitted ? (
                            <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-xl p-4 text-center space-y-1 animate-in zoom-in-95">
                              <span className="text-sm">📅</span>
                              <strong className="text-xs font-bold block">Solicitação de Consulta Cadastrada!</strong>
                              <p className="text-[10px] leading-relaxed">Sua solicitação de pré-agendamento para {empresa} foi enviada com sucesso para nossa triagem operacional no WhatsApp.</p>
                            </div>
                          ) : (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                setStitchFormSubmitted(true);
                                triggerNotification("Pré-agendamento enviado com sucesso!", "success");
                              }}
                              className="space-y-2.5 text-left"
                            >
                              <div className="space-y-0.5 text-xs text-slate-650">
                                <label className="text-[9px] text-slate-450 font-extrabold block uppercase tracking-wider">Seu Nome Completo:</label>
                                <input type="text" placeholder="Ex: Douglas Bateria" required className="w-full border p-2 rounded-lg text-[10px] focus:outline-teal-500 font-semibold" />
                              </div>
                              <div className="space-y-0.5 text-xs text-slate-650">
                                <label className="text-[9px] text-slate-450 font-extrabold block uppercase tracking-wider">Período Desejado do Dia:</label>
                                <select required className="w-full border p-2 rounded-lg font-bold text-[10px] focus:outline-teal-500 bg-white">
                                  <option value="manha">Período da Manhã (09:00 - 12:00)</option>
                                  <option value="tarde bg-white">Período da Tarde (14:00 - 17:00)</option>
                                </select>
                              </div>
                              <button 
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border-none cursor-pointer active:scale-95"
                              >
                                <span>Solicitar Avaliação Gratuita</span>
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Testimonials block */}
                        <div className="p-4 bg-slate-50 space-y-2">
                          <strong className="text-[10px] text-teal-800 font-bold block uppercase tracking-wider">Avaliações do Perfil do GMB:</strong>
                          <div className="bg-white p-3 rounded-xl border italic text-[10px] text-slate-500 leading-normal">
                            "Excelentes profissionais. Atendimento de alta qualidade e infraestrutura perfeita. Muito feliz de agora poder agendar online!"
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* UNIVERSAL AUTOMOTIVE WORKSHOP OR DEFAULT COMPANY */
                      <div className="space-y-0 text-[11px]">
                        {/* Technical Hero Banner */}
                        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 text-center space-y-2">
                          <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-2.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider inline-block">INDÚSTRIA E SERVIÇOS B2B</span>
                          <h2 className="text-base font-black leading-tight">{empresa}</h2>
                          <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">Os melhores serviços especializados em {segmento} na região de {cidade}. Solução ágil e imediata.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 mt-2">
                            <span>{currentRating}★</span>
                            <span>({currentReviews} avaliações espontâneas)</span>
                          </div>
                        </div>

                        {/* Services List and CTA */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-slate-950 uppercase block font-black border-b pb-1">⚙️ Diferenciais & Serviços Únicos</strong>
                          
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-3 bg-slate-50 min-h-[100px] hover:bg-slate-100 flex flex-col justify-between rounded-xl border">
                              <span className="text-sm block">⚡</span>
                              <strong className="text-[10px] text-slate-800 block">Atendimento Prime</strong>
                              <span className="text-[9px] text-slate-450 block leading-tight">Orçamento com conformidade técnica rápida.</span>
                            </div>

                            <div className="p-3 bg-slate-50 min-h-[100px] hover:bg-slate-100 flex flex-col justify-between rounded-xl border col-span-1">
                              <span className="text-sm block">💎</span>
                              <strong className="text-[10px] text-slate-800 block">Garantia Integrada</strong>
                              <span className="text-[9px] text-slate-450 block leading-tight font-medium">Equipe certificada localmente.</span>
                            </div>
                          </div>

                          {/* Contact quick actions */}
                          <div className="space-y-2 pt-2">
                            <h4 className="text-[9px] text-slate-400 font-extrabold uppercase text-left">Peça já o seu orçamento:</h4>
                            <div className="flex gap-2">
                              {lead.phone !== "" ? (
                                <a href={`tel:${lead.phone}`} className="flex-1 text-center bg-indigo-650 hover:bg-indigo-700 font-extrabold text-[#fff] rounded-xl py-2 px-2.5 text-[9px] block no-underline border border-transparent">
                                  Ligar: {lead.phone}
                                </a>
                              ) : (
                                <span className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-[9px] text-center">Via Chat do Maps</span>
                              )}
                              <button 
                                onClick={() => {
                                  setStitchFormSubmitted(true);
                                  triggerNotification("Abordagem simulada iniciada no WhatsApp!", "success");
                                }}
                                className="flex-1 bg-[#10b981] hover:bg-emerald-600 font-extrabold text-[#fff] rounded-xl py-2 px-2.5 text-[9px] border-none active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>WhatsApp Direto</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Testimonials block */}
                        <div className="p-4 bg-slate-50 space-y-2">
                          <strong className="text-[10px] text-slate-800 font-bold block uppercase tracking-wider">O que dizem os clientes no Google:</strong>
                          <div className="bg-white p-3 rounded-xl border italic text-[10px] text-slate-500 leading-normal">
                            "Melhor atendimento da região pelo setor de {segmento}. Sendo possível entrar em contato de forma rápida ficou 10/10."
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Integrated Footing */}
                    <div className="bg-[#0f172a] text-slate-400 p-4 text-center text-[9px] space-y-1 relative pb-10 mt-auto rounded-b-[2.5rem]">
                      <span className="text-white font-extrabold block">© {empresa} - {cidade}</span>
                      <span className="text-slate-500 block leading-normal">Desenvolvido em conformidade para otimização de presença digital AdsHive Prospect</span>
                      {/* Simulated Home Indicators Bar of modern smartphones */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full"></div>
                    </div>

                  </div>
                </div>

                {/* Subtitle explaining Google Stitch Simulation tool */}
                <div className="mt-4 bg-[#f1f3ff] text-indigo-700 p-3 rounded-xl text-[10px] font-semibold text-center leading-relaxed max-w-sm">
                  💡 <strong className="text-slate-800">Visualização Interativa:</strong> Versão mobile-first gerada em tempo real com dados locais para o lead experimentar a transformação.
                </div>

              </div>
            )}

          </div>

          {/* Lateral Control Board Settings Panel (no-print) */}
          <div className="w-full lg:w-80 shrink-0 space-y-4 no-print overflow-y-auto max-h-full pr-1">
            
            {/* SUBTAB-SPECIFIC PANELS */}
            {activeSubTab === 'proposta' ? (
              <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b pb-2 text-indigo-700">
                  <Sliders className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Painel de Diagnóstico Comercial</span>
                </div>

                <div className="space-y-3 text-xs text-left">
                  {/* Empresa Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase">Nome Comercial:</label>
                    <input 
                      type="text" 
                      value={empresa} 
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="w-full border p-2 rounded-lg font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Cidade */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase">Localização / Cidade:</label>
                    <input 
                      type="text" 
                      value={cidade} 
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full border p-2 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Segmento */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase">Segmento / Nicho:</label>
                    <input 
                      type="text" 
                      value={segmento} 
                      onChange={(e) => setSegmento(e.target.value)}
                      className="w-full border p-2 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase">Porte Estimado:</label>
                    <select 
                      value={companySize} 
                      onChange={(e: any) => setCompanySize(e.target.value)}
                      className="w-full border p-2 rounded-lg text-slate-700 font-bold text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="Pequena">Pequena Empresa (ME/EPP)</option>
                      <option value="Média">Média Empresa (Ltda)</option>
                      <option value="Grande">Grande Empresa (S/A Corporativo)</option>
                    </select>
                  </div>

                  {/* Custom System Price Override Section */}
                  <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl space-y-3 text-left shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1">
                        💰 Ajustar Valores Comerciais
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase">
                        Editável
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Valor de Implantação */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-wide block">
                          Valor de Implantação:
                        </label>
                        <div className="relative rounded-lg shadow-sm">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                            R$
                          </span>
                          <input 
                            type="number" 
                            min="0"
                            value={setupPriceOverride} 
                            onChange={(e) => setSetupPriceOverride(Number(e.target.value))}
                            className="w-full border border-slate-200 p-2 pl-8 rounded-lg font-mono font-black text-sm text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                            placeholder="0,00"
                          />
                        </div>
                      </div>

                      {/* Valor Mensal */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-wide block">
                          Valor Mensal:
                        </label>
                        <div className="relative rounded-lg shadow-sm">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                            R$
                          </span>
                          <input 
                            type="number" 
                            min="0"
                            value={monthlyPriceOverride} 
                            onChange={(e) => setMonthlyPriceOverride(Number(e.target.value))}
                            className="w-full border border-slate-200 p-2 pl-8 rounded-lg font-mono font-black text-sm text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                      Ao modificar estes campos, os valores sugeridos pela IA são atualizados instantaneamente na <strong className="text-slate-750">Proposta Comercial</strong> e no <strong className="text-slate-750">Contrato B2B</strong>.
                    </p>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Pontuações de Auditoria (0 a 100):</span>
                    
                    {/* Site Score Slider */}
                    <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>Nota do Site Oficial:</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono border ${scoreColorClass(siteScore)}`}>{siteScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={siteScore} 
                        onChange={(e) => setSiteScore(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* SEO Local Slider */}
                    <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>Otimização SEO Local:</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono border ${scoreColorClass(seoScore)}`}>{seoScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={seoScore} 
                        onChange={(e) => setSeoScore(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Google Maps (GBP) Slider */}
                    <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>Pontuação Google Maps:</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono border ${scoreColorClass(gbpScore)}`}>{gbpScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={gbpScore} 
                        onChange={(e) => setGbpScore(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Instagram Slider */}
                    <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>Presença Instagram:</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono border ${scoreColorClass(instagramScore)}`}>{instagramScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={instagramScore} 
                        onChange={(e) => setInstagramScore(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Rating & Reviews */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Nota Média:</span>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1" 
                          max="5"
                          value={currentRating} 
                          onChange={(e) => setCurrentRating(Number(e.target.value))}
                          className="w-full border p-1 rounded font-bold text-center text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Avaliações:</span>
                        <input 
                          type="number" 
                          min="0" 
                          value={currentReviews} 
                          onChange={(e) => setCurrentReviews(Number(e.target.value))}
                          className="w-full border p-1 rounded font-mono font-bold text-center text-xs"
                        />
                      </div>
                    </div>

                    {/* Meta Ads checkpoint */}
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border">
                      <input 
                        type="checkbox" 
                        id="announcedMeta" 
                        checked={announcedMeta} 
                        onChange={(e) => setAnnouncedMeta(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-slate-300"
                      />
                      <label htmlFor="announcedMeta" className="text-[10px] font-bold text-slate-700 cursor-pointer block select-none">
                        Já anuncia ou deseja anunciar no Meta/Google Ads
                      </label>
                    </div>

                  </div>
                </div>

                <button
                  onClick={() => fetchProposal(true)}
                  disabled={isLoadingProposal}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingProposal ? 'animate-spin' : ''}`} />
                  <span>{isLoadingProposal ? "Processando..." : "Atualizar Proposta (IA)"}</span>
                </button>
              </div>
            ) : (
              /* Guide Info Card for contract / stitch */
              <div className="bg-[#0f172a] text-white p-5 rounded-2xl border border-slate-800 relative overflow-hidden space-y-3">
                <div className="flex items-center gap-1.5 animate-pulse text-amber-400">
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Ações de Fechamento</span>
                </div>
                
                <h4 className="text-xs font-extrabold">Otimize a Prospecção B2B</h4>
                <p className="text-slate-400 leading-normal text-[11px] font-medium">
                  Use os ativos gerados para convencer seu lead. Apresente as dores e soluções no relatório de IA, mostre os valores no Contrato B2B e deixe que testem o site na simulação Stitch.
                </p>

                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] leading-relaxed text-slate-350">
                  ⭐ <strong className="text-white">Dica:</strong> Propostas personalizadas de acordo com o porte do cliente possuem uma taxa de conversão até 3.5x maior de fechamento!
                </div>
              </div>
            )}

            {/* Print and Export Buttons Box */}
            <div className="bg-white border rounded-2xl p-5 space-y-3 shadow-sm">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Documentações Física / Digital</span>
              
              <button
                onClick={handlePrint}
                className="w-full bg-slate-900 border hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300 pointer-events-none" />
                <span>Emitir PDF / Imprimir</span>
              </button>

              <button
                onClick={handleCopyText}
                disabled={!proposalData}
                className="w-full bg-[#f8f9ff] border hover:bg-indigo-50 text-slate-800 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Copiado!" : "Copiar Resumo Comercial"}</span>
              </button>
            </div>

            {/* Diagnostic stats side block */}
            <div className="bg-white border rounded-2xl p-5 space-y-2.5 shadow-sm">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Viabilidades de Faturamento</span>
              
              <div className="flex justify-between items-center text-xs font-semibold border-b pb-2">
                <span className="text-slate-500">Taxa Implantação (Setup):</span>
                <span className="text-slate-950 font-mono font-bold">
                  {formatCurrency(setupPriceOverride)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold border-b pb-2">
                <span className="text-slate-500">Recorrência (Retainer):</span>
                <span className="text-indigo-600 font-mono font-bold">
                  {formatCurrency(monthlyPriceOverride)} <span className="text-[10px] text-slate-400">/mês</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-slate-500 font-bold">Garantia Técnica:</span>
                <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wide">Sem Fidelidade Básica</span>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Actions footer panel */}
        <div className="bg-slate-50 border-t p-5 flex justify-end gap-2.5 shrink-0 no-print">
          <button 
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl tracking-wide active:scale-95 transition-all cursor-pointer border-none"
          >
            Fechar Gerador
          </button>
        </div>

      </div>
    </div>
  );
};
