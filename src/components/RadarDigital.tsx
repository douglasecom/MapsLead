import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  Radar, Flame, CheckCircle, AlertTriangle, 
  MapPin, ShieldAlert, Sparkles, TrendingUp, 
  Globe, PlayCircle, Eye, RefreshCw, Layers 
} from 'lucide-react';

interface RadarDigitalProps {
  leads: Lead[];
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const RadarDigital: React.FC<RadarDigitalProps> = ({ leads, triggerNotification }) => {
  const capturedLeads = leads.filter(l => l.captured);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(capturedLeads[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeLead = leads.find(l => l.id === selectedLeadId) || capturedLeads[0];

  const handleRunAuditSweep = () => {
    setIsAnalyzing(true);
    triggerNotification('Gerando varredura profunda no Google Maps e Meta Ads Library...', 'info');
    setTimeout(() => {
      setIsAnalyzing(false);
      triggerNotification('Varredura concluída! Score de Oportunidade atualizado com sucesso.', 'success');
    }, 2000);
  };

  if (!activeLead) {
    return (
      <div className="bg-white border rounded-3xl p-16 text-center text-slate-400">
        <Radar className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-spin" />
        <p className="font-bold text-slate-600">Nenhum lead capturado para auditoria digital.</p>
        <p className="text-xs text-slate-450 mt-1">Busque e capture contatos para liberar o estudo do Radar B2B.</p>
      </div>
    );
  }

  // Calculate customized details based on the current lead profile
  const isPadaria = activeLead.niche.toLowerCase().includes("padar") || activeLead.niche.toLowerCase().includes("doc") || activeLead.niche.toLowerCase().includes("confe");
  const isDentist = activeLead.niche.toLowerCase().includes("dent") || activeLead.niche.toLowerCase().includes("sorr") || activeLead.niche.toLowerCase().includes("odonto");

  // Mock score breakdown formulas based on GMB details (Module 8)
  const noSiteScore = !activeLead.hasWebsite ? 30 : 5;
  const lowReviewsScore = activeLead.reviews < 100 ? 15 : 5;
  const lowRatingScore = activeLead.rating < 4.5 ? 15 : 0;
  const noPhoneScore = !activeLead.phone ? 20 : 0;
  const inactiveGmbScore = !activeLead.hasGmbActive ? 20 : 0;
  const noMetaPixelScore = !activeLead.hasWebsite ? 20 : 15; // site with no pixel is common

  const totalScoreMath = noSiteScore + lowReviewsScore + lowRatingScore + noPhoneScore + inactiveGmbScore + noMetaPixelScore;
  const maxScore = 120;
  const formattedScore = Math.min(100, Math.round((totalScoreMath / maxScore) * 100));

  // Determine Ads Library category (Module 6)
  const getAdsStatus = () => {
    if (activeLead.leadScore >= 90) return { label: 'SEM ANÚNCIOS ATIVOS', badgeClassName: 'bg-rose-50 border-rose-200 text-rose-800' };
    if (activeLead.leadScore >= 75) return { label: 'ANÚNCIOS LIMITADOS', badgeClassName: 'bg-amber-50 border-amber-200 text-amber-800' };
    return { label: 'ANUNCIANTE ATIVO', badgeClassName: 'bg-emerald-50 border-emerald-250 text-emerald-800' };
  };

  const adsStatus = getAdsStatus();

  return (
    <div className="space-y-6">
      
      {/* Selector and Scan triggers bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-1/2 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Selecionar Estabelecimento para Auditoria</label>
          <select 
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-800 focus:outline-none"
          >
            {capturedLeads.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.niche})</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleRunAuditSweep}
          disabled={isAnalyzing}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Verificando SSL, Pixel & SEO...</span>
            </>
          ) : (
            <>
              <Radar className="w-4 h-4 text-white animate-pulse" />
              <span>Forçar Redetecção de Gaps</span>
            </>
          )}
        </button>
      </div>

      {/* Main Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Score de Oportunidade card (MODULE 8) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-850 text-white p-6 rounded-3xl flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Índice de Oportunidade B2B</span>
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>

            <div className="text-center py-6">
              <span className="text-6xl font-black text-rose-500 font-mono tracking-tight">{formattedScore}%</span>
              <span className="text-xs text-slate-400 block font-semibold mt-2">Grau de Urgência de Expansão</span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase block tracking-wider">Cálculo de Relevância Comercial:</span>
              
              <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                  <span>Sem Site Oficial:</span>
                  <span className={activeLead.hasWebsite ? "text-slate-500" : "text-amber-400 font-bold"}>
                    {activeLead.hasWebsite ? "+5 XP" : "+30 XP"}
                  </span>
                </div>

                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                  <span>Reviews ({activeLead.reviews} aval.):</span>
                  <span className={activeLead.reviews < 100 ? "text-amber-400 font-bold" : "text-slate-550"}>
                    {activeLead.reviews < 100 ? "+15 XP" : "+5 XP"}
                  </span>
                </div>

                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                  <span>Avaliação Google Google ({activeLead.rating}★):</span>
                  <span className={activeLead.rating < 4.5 ? "text-amber-400 font-bold" : "text-slate-555"}>
                    {activeLead.rating < 4.5 ? "+15 XP" : "+0 XP"}
                  </span>
                </div>

                <div className="flex justify-between bg-white/5 p-2 rounded-lg">
                  <span>Meta Ads Pixel:</span>
                  <span className="text-rose-455 font-bold">+20 XP</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest border-t border-white/5 pt-4 mt-6">
            MÓDULO 8: ALGORITMO INTEGRADO
          </p>
        </div>

        {/* Audit reports analysis details (MODULE 5 & 6) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-3xl space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">{activeLead.name}</h3>
              <p className="text-slate-500 text-xs mt-0.5">Visão do radar de erros digitais e canais sociais.</p>
            </div>
            
            <div className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] uppercase tracking-wider ${adsStatus.badgeClassName}`}>
              {adsStatus.label}
            </div>
          </div>

          {/* Audit parameters table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* SSL Site check */}
            <div className="bg-slate-50 border p-4 rounded-2xl flex items-start gap-3">
              {activeLead.hasWebsite ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Certificado SSL Seguro</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">O site atual opera sob protocolo seguro HTTPS e possui criptografia habilitada.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Inexistência de Domínio SSL</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">Empresas sem site expõem vulnerabilidade de busca e não possuem proteção de domínio B2B.</p>
                  </div>
                </>
              )}
            </div>

            {/* Pixels and Google Tags checks */}
            <div className="bg-slate-50 border p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Tags de Tráfego e Meta Pixel</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">Não detectamos códigos do Meta Pixel ou Google Tag Manager ativos na rede do lead. Impossibilita Campanhas de Remarketing.</p>
              </div>
            </div>

            {/* Search Engine Optimization */}
            <div className="bg-slate-50 border p-4 rounded-2xl flex items-start gap-3">
              {activeLead.hasWebsite ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Erros Críticos de SEO Mobile</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">O site atual demora {isPadaria ? '5.8s' : '4.2s'} para carregar em celulares de média performance, perdendo até 45% do tráfego.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Presença do Google Maps Sem Tráfego</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">O cadastro do GMB está ativo, porém sem otimização de palavras-chave locais cruciais no SEO.</p>
                  </div>
                </>
              )}
            </div>

            {/* GMB Completeness state */}
            <div className="bg-slate-50 border p-4 rounded-2xl flex items-start gap-3">
              {activeLead.hasGmbActive ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">reivindicado no GMB</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">O estabelecimento administrou suas informações de horário comercial e avaliações.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">GMB Não Reivindicado</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">Alto risco! O painel Google do estabelecimento está suscetível a alterações de terceiros sem autorização.</p>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Simulated Meta Ads creatively rendering (MODULE 6) */}
          <div className="border border-slate-200/90 p-4 rounded-2xl bg-[#f8f9ff]/50 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Biblioteca de Criativos Ativos: Meta Ads</span>
              <span className="text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">ADS ARCHIVE</span>
            </div>

            {activeLead.leadScore >= 90 ? (
              <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 space-y-2">
                <PlayCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 uppercase">Nenhum anúncio localizado na Meta Library</p>
                <p className="text-[11px] text-slate-405 font-medium">Oferecer pacotes de tráfego pago baseados nos diferenciais locais é um gancho de prospecção infalível para este lead.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white rounded-xl border shadow-sm p-4 text-xs space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[10px] text-slate-500 uppercase">ANÚNCIO ATIVO • ID: meta_39294</span>
                  </div>
                  <p className="font-semibold text-slate-600 italic">"Venha saborear os melhores serviços. Atendimento rápido e cardápio de dar água na boca. Clique comercial abaixo para chamar no WhatsApp."</p>
                  <div className="bg-slate-100 p-2 text-center rounded text-[10px] font-bold text-blue-600">
                    SAIBA MAIS ({activeLead.phone || "Fale conosco"})
                  </div>
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-4 text-xs space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-bold text-[10px] text-slate-500 uppercase">LIMITADO • ID: instagram_024</span>
                  </div>
                  <p className="font-semibold text-slate-600 italic">"Quer comodidade? Peça orçamentos pelo Whats sem pegar filas. Clique e aproveite nossos descontos no bairro de {activeLead.location.split(',')[0]}."</p>
                  <div className="bg-slate-100 p-2 text-center rounded text-[10px] font-bold text-blue-600">
                    CHAMAR WHATSAPP
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Benchmarking Comparison with Top 3 Local Competitors (MODULE 7) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <div>
          <h3 className="font-extrabold text-[16px] text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Módulo 7: Benchmarking Comparativo da Região</span>
          </h3>
          <p className="text-slate-550 text-xs mt-0.5">Analise o posicionamento do seu lead comparado com os 3 concorrentes locais com páginas indexadas.</p>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Nome Comercial</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Audit Level (Gaps)</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Nota Google</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Avaliações</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Website B2B</th>
                <th className="py-3 px-4 font-bold text-slate-500 uppercase">Ads Library</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              
              {/* Active Lead */}
              <tr className="bg-blue-50/50">
                <td className="py-3 px-4 font-extrabold text-blue-800">📍 {activeLead.name} (Este Lead)</td>
                <td className="py-3 px-4">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">CRÍTICO ({formattedScore}%)</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{activeLead.rating}★</td>
                <td className="py-3 px-4 font-mono">{activeLead.reviews}</td>
                <td className="py-3 px-4">{activeLead.hasWebsite ? '✓ Ativo' : '✗ Sem Site'}</td>
                <td className="py-3 px-4 text-rose-600">{activeLead.leadScore >= 95 ? 'Inativo' : 'Inativo'}</td>
              </tr>

              {/* Competitor 1 */}
              <tr>
                <td className="py-3 px-4 text-slate-800">Concorrente Gold: {isPadaria ? 'Padaria Colonial Moema' : isDentist ? 'Sorriso Perfeito Pinheiros' : 'Premium Serviços B2B'}</td>
                <td className="py-3 px-4">
                  <span className="bg-[#f0fdf4] text-[#15803d] text-[10px] font-semibold px-2 py-0.5 rounded uppercase">ESTÁVEL (15%)</span>
                </td>
                <td className="py-3 px-4 font-mono">4.9★</td>
                <td className="py-3 px-4 font-mono">1.820</td>
                <td className="py-3 px-4 text-[#15803d]">✓ Ativo (SSL)</td>
                <td className="py-3 px-4 text-[#15803d]">Ativo (Meta Ads)</td>
              </tr>

              {/* Competitor 2 */}
              <tr>
                <td className="py-3 px-4 text-slate-800">Concorrente Silver: {isPadaria ? 'Boulangerie D’Oro' : isDentist ? 'Odontologia Especialista SP' : 'Doutor Soluções Integradas'}</td>
                <td className="py-3 px-4">
                  <span className="bg-[#fef3c7] text-[#b45309] text-[10px] font-semibold px-2 py-0.5 rounded uppercase">MÉDIO (45%)</span>
                </td>
                <td className="py-3 px-4 font-mono">4.5★</td>
                <td className="py-3 px-4 font-mono">410</td>
                <td className="py-3 px-4 text-slate-500">✓ Ativo</td>
                <td className="py-3 px-4 text-slate-500">Inativo</td>
              </tr>

              {/* Competitor 3 */}
              <tr>
                <td className="py-3 px-4 text-slate-800">{isPadaria ? 'Panificadora Pão da Vida' : isDentist ? 'Clínica Pró-Dente' : 'Suporte Serviços Rápido'}</td>
                <td className="py-3 px-4">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">CRÍTICO (85%)</span>
                </td>
                <td className="py-3 px-4 font-mono">3.8★</td>
                <td className="py-3 px-4 font-mono">92</td>
                <td className="py-3 px-4 text-rose-500">✗ Inexistente</td>
                <td className="py-3 px-4 text-slate-500">Inativo</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
