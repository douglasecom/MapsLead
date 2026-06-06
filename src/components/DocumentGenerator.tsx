import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  FileText, ShieldCheck, Globe, Printer, Copy, Check, 
  ExternalLink, Smartphone, ShoppingCart, Calendar, 
  MapPin, Phone, Star, Send, ShieldAlert, Award
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

  // Dynamic values calculated based on lead parameters
  const score = lead.leadScore || 85;
  const rating = lead.rating || 4.2;
  const reviewsCount = lead.reviews || 88;
  const targetLocation = lead.location || "São Paulo, SP";
  const normalizedNiche = lead.niche.toLowerCase();

  const handlePrint = () => {
    const printContent = document.getElementById('printable-document-area');
    if (!printContent) {
      triggerNotification("Falha ao localizar área de impressão", "error");
      return;
    }
    
    // Create professional print container
    const originalContent = document.body.innerHTML;
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { bg-color: white; color: black; font-family: sans-serif; padding: 2cm; }
        .no-print { display: none !important; }
        .print-shadow-none { box-shadow: none !important; border: none !important; }
        .page-break { page-break-before: always; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    triggerNotification("Folha de impressão enviada!", "success");
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerNotification("Copiado com sucesso para a área de transferência!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl border shadow-2xl relative overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header Banner - Navigation tabs */}
        <div className="bg-gradient-to-tr from-slate-950 to-indigo-950 text-white p-5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5">
          <div>
            <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block border border-blue-500/20 mb-1.5">
              FASE 5 — FECHAMENTO COMERCIAL INTEGRADO
            </span>
            <h3 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <span>Gerador de Ativos Real:</span>
              <span className="text-blue-400 font-medium text-base truncate max-w-[250px]">{lead.name}</span>
            </h3>
          </div>

          {/* Sub Tab Switches */}
          <div className="flex bg-slate-900 p-1 rounded-xl gap-0.5 border border-white/5">
            <button 
              onClick={() => setActiveSubTab('proposta')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'proposta' ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Proposta Comercial</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('contrato')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'contrato' ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. Contrato B2B</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('stitch')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'stitch' ? "bg-orange-500 text-white shadow-md font-extrabold animate-pulse" : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Demo Google Stitch Mock</span>
            </button>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Working Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col md:flex-row gap-6">
          
          {/* Main Document Body */}
          <div className="flex-1 bg-white border rounded-2xl shadow-sm p-6 overflow-y-auto max-h-full" id="printable-document-area">
            
            {/* SUBTAB 1 — PROPOSTA IA COMERCIAL */}
            {activeSubTab === 'proposta' && (
              <div className="space-y-6 text-slate-800 text-xs text-left leading-relaxed max-w-3xl mx-auto">
                
                {/* Proposal Header Document Sheet */}
                <div className="border-b-2 border-indigo-600 pb-4 text-center sm:text-left flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">Proposta de Consultoria & Posicionamento Local</h1>
                    <p className="text-slate-500 font-mono text-[10px] mt-1">Ref Presença Google Maps: {lead.name} • Código #{Math.floor(Math.random() * 900000 + 100000)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-indigo-600 uppercase block font-mono text-sm">MapsLeads Hub</span>
                    <span className="text-slate-400 block text-[10px]">contato@mapsleadshub.com.br</span>
                  </div>
                </div>

                {/* Cliente / Destinatário */}
                <div className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Proposta Elaborada para:</span>
                    <strong className="text-slate-800 text-sm block mt-1">{lead.name}</strong>
                    <span className="text-slate-500 block mt-0.5">{targetLocation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block font-mono">Status Digital atual:</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold">
                      <span className="text-slate-800 font-mono text-sm">{rating}★ ({reviewsCount} avaliações)</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full">Score Oportunidade: {score}%</span>
                    </div>
                  </div>
                </div>

                {/* 1. Diagnóstico de Gaps */}
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 border-l-4 border-indigo-600 pl-2 uppercase">1. Auditoria e Diagnóstico de Solução</h3>
                  <p className="text-slate-600 font-medium">
                    Durante nossa auditoria ativa no ecossistema do Google Maps em {targetLocation}, identificamos que a <strong>{lead.name}</strong> possui excelente aceitabilidade do público (classificação {rating}★), porém sofre com o seguinte limitador comercial:
                  </p>
                  <blockquote className="border-l-4 border-slate-300 bg-slate-50 p-3 italic text-slate-500 leading-relaxed rounded-r-xl">
                    "{lead.gmbAnalysis || 'A ausência de canal de conversão online impede novos contatos diretos e impulsiona potenciais clientes da região a fecharem pedidos com marcas concorrentes estruturadas no local.'}"
                  </blockquote>
                </div>

                {/* 2. Serviços Recomendados */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 border-l-4 border-indigo-600 pl-2 uppercase">2. Plano de Ação & Escopo Técnico</h3>
                  <p className="text-slate-600 font-medium">Recomendamos uma estratégia dividida em 3 pilares de rápida implantação:</p>
                  
                  <div className="space-y-3 mt-2">
                    <div className="border p-4 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                      <strong className="text-indigo-600 text-xs block">🛡️ Implantação de Canal Próprio (Site Mobile-First Express)</strong>
                      <p className="text-slate-600 font-semibold">Desenvolvimento de uma One-Page ultra-veloz, adaptada para celular, com cardápio ou portfólio de serviços interativo e integração direta de pedidos e agendamentos para o WhatsApp comercial da empresa.</p>
                    </div>

                    <div className="border p-4 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                      <strong className="text-indigo-600 text-xs block">📍 SEO Local & Reivindicação Premium de GMB</strong>
                      <p className="text-slate-600 font-semibold">Otimização completa das palavras-chave locais no Google Business, preenchimento de FAQs corporativos e ativação do funil de retenção de estrelas por QR Code de mesas / atendimento.</p>
                    </div>

                    <div className="border p-4 rounded-xl space-y-1 bg-white hover:border-slate-300 transition-all">
                      <strong className="text-indigo-600 text-xs block">🔗 Rastreamento Conectado (Pixel Meta & Google)</strong>
                      <p className="text-slate-600 font-semibold font-mono">Adição do Pixel do Facebook e Google Analytics na Landing Page para permitir remarketing segmentado nas redes sociais a todos os visitantes do bairro que não fecharam de primeira.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Cronograma */}
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 border-l-4 border-indigo-600 pl-2 uppercase">3. Cronograma de Lançamento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <span className="text-[10px] bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">Etapa 1: Dia 1 a 3</span>
                      <strong className="text-slate-800 block mt-1.5">Estrutura Visual</strong>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1">Design do mockup funcional no Google Stitch e validação do fluxo.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <span className="text-[10px] bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">Etapa 2: Dia 4 a 6</span>
                      <strong className="text-slate-800 block mt-1.5">SEO & Integrações</strong>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1">Conexão final do botão WhatsApp, pixel, e preenchimento de palavras-chave.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border col-span-1">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">Etapa 3: Dia 7</span>
                      <strong className="text-slate-1000 block mt-1.5">Go Live Comercial</strong>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1">Entrega, treinamento rápido e indexação orgânica imediata no Google.</p>
                    </div>
                  </div>
                </div>

                {/* 4. Valores e Investimento */}
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 border-l-4 border-indigo-600 pl-2 uppercase">4. Viabilidade Financeira & Investimento</h3>
                  <p className="text-slate-600 font-medium">Preparamos uma oferta comercial de adesão simplificada para parceiros identificados via MapsLeads:</p>
                  
                  <div className="bg-[#f8f9ff] border-2 border-indigo-100 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Taxa de Implantação Única (Setup)</span>
                      <span className="text-3xl font-black text-slate-900 font-mono block mt-1">R$ 1.200,00</span>
                      <p className="text-slate-400 block text-[10px] mt-0.5">Pagável em até 3x sem juros no cartão de crédito</p>
                    </div>
                    <div className="border-t sm:border-y-0 sm:border-l sm:pt-0 pt-4 sm:pl-4">
                      <span className="text-indigo-600 font-bold block uppercase text-[10px]">Suporte Mensal & Hospedagem Retainer (MRR)</span>
                      <span className="text-2xl font-black text-indigo-600 font-mono block mt-1">R$ 150,00 <span className="text-xs font-semibold text-slate-400">/mês</span></span>
                      <p className="text-slate-400 block text-[10px] mt-0.5">Suporte técnico, modificações de cardápio e segurança SSL</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 2 — CONTRATO COMERCIAL */}
            {activeSubTab === 'contrato' && (
              <div className="space-y-6 text-slate-800 text-xs text-left leading-relaxed max-w-3xl mx-auto font-serif">
                
                <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                  <h1 className="text-lg font-bold text-slate-900 uppercase">Instrumento Particular de Prestação de Serviços Digitais</h1>
                  <p className="text-slate-500 font-mono text-[10px]">CONTRATO DE ADESÃO DIGITAL - MODELO PADRÃO</p>
                </div>

                {/* Partes */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase relative">1. DAS PARTES CONTRATANTES</strong>
                  <p className="text-slate-650 font-semibold leading-normal">
                    <strong>CONTRATADA:</strong> MAPSLEADS HUB SOLUÇÕES DIGITAIS, pessoa jurídica de direito privado fictícia integrada ao workspace, doravante denominada simplesmente CONTRATADA.
                  </p>
                  <p className="text-slate-650 font-semibold leading-normal">
                    <strong>CONTRATANTE:</strong> {lead.name}, já identificada e qualificada através do banco de dados comercial local em <strong>{targetLocation}</strong>, doravante denominada simplesmente CONTRATANTE.
                  </p>
                </div>

                {/* Cláusula Primeira: Objeto */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Primeira — Do Objeto</strong>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed border font-sans text-[11px]">
                    O presente instrumento tem como objeto a prestação de serviços de desenvolvimento de Website Mobile-First One-Page Express, otimização de Perfil de Negócios do Google Maps (SEO Local), bem como hospedagem do referido site sob domínio temporário com segurança criptografada SSL ativa.
                  </p>
                </div>

                {/* Cláusula Segunda: Prazos */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Segunda — Dos Prazos</strong>
                  <p className="text-slate-650 leading-normal">
                    O desenvolvimento, homologação técnica e publicação oficial da estrutura web ocorrerá no prazo máximo e improrrogável de 07 (sete) dias úteis, contados a partir da assinatura do presente termo e envio das credenciais iniciais da empresa.
                  </p>
                </div>

                {/* Cláusula Terceira: Valores */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Terceira — Dos Valores e Cobrança</strong>
                  <p className="text-slate-650 leading-normal">
                    Como contraprestação pelos serviços de implantação descritos, a CONTRATANTE desembolsará o valor total único de <strong>R$ 1.200,00 (mil e duzentos reais)</strong>. O suporte e hospedagem terão vigência mensal, cobrados de forma recorrente por boleto bancário ou PIX no montante de <strong>R$ 150,00 (cento e cinquenta reais)</strong> mensais.
                  </p>
                </div>

                {/* Cláusula Quarta: Rescisão */}
                <div className="space-y-2">
                  <strong className="text-slate-900 block uppercase">Cláusula Quarta — Da Rescisão de Hospedagem</strong>
                  <p className="text-slate-650 leading-normal">
                    As partes pactuam que o serviço de suporte e hospedagem poderá ser descontinuado formalmente a qualquer momento, mediante solicitação escrita via WhatsApp ou e-mail com antecedência mínima de 15 dias, sem qualquer multa rescisória, garantindo total liberdade ao cliente.
                  </p>
                </div>

                {/* Signatures Panel */}
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-slate-500 font-sans text-[11px]">
                  <div className="border-t border-slate-350 pt-4 space-y-1">
                    <div className="h-10"></div>
                    <span className="font-extrabold text-slate-700 block">________________________________________</span>
                    <span className="text-slate-800 text-xs font-bold block">MAPSLEADS HUB</span>
                    <span className="text-[10px] block">Consultoria Comercial Autonoma</span>
                  </div>

                  <div className="border-t border-slate-350 pt-4 space-y-1">
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold font-mono">ASSINADO E CERTIFICADO VIA FIREBASE API</span>
                    </div>
                    <span className="font-extrabold text-slate-700 block">________________________________________</span>
                    <span className="text-slate-800 text-xs font-bold block">{lead.name}</span>
                    <span className="text-[10px] block">CONTRATANTE</span>
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
                      <span className="truncate">stitch.google.com/{lead.name.toLowerCase().replace(/\s+/g, '-')}</span>
                    </div>
                    <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded font-black font-mono">SSL ATIVO</span>
                  </div>

                  {/* STITCH RENDER - ADAPTIVE BY LEAD NICHE */}
                  <div className="flex-1 bg-white overflow-y-auto max-h-[460px] text-slate-800 text-left font-sans text-xs">
                    
                    {/* NICHE: BAKERY / ALIMENTAÇÃO */}
                    {normalizedNiche.includes('padaria') || normalizedNiche.includes('confeitaria') || normalizedNiche.includes('pão') || normalizedNiche.includes('restaurante') || normalizedNiche.includes('comida') || normalizedNiche.includes('pizza') ? (
                      <div className="space-y-0">
                        {/* Food Hero Banner */}
                        <div className="bg-gradient-to-tr from-amber-600 to-amber-700 text-white p-6 text-center space-y-2 relative">
                          <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">PADARIA PREMIUM</span>
                          <h2 className="text-lg font-black">{lead.name}</h2>
                          <p className="text-[10px] text-amber-100 font-medium leading-relaxed">Tradição, pão quentinho e receitas de família em {targetLocation}! Faça seu pedido online.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-200 mt-2">
                            <span className="font-extrabold text-[#FEF3C7]">{rating}★</span>
                            <span className="text-[9px]">({reviewsCount} avaliações)</span>
                          </div>
                        </div>

                        {/* Order Catalog Section */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-amber-950 uppercase block font-black border-b pb-1">🛒 Cardápio para Peça Direta (WhatsApp)</strong>
                          
                          <div className="space-y-2">
                            <div className="flex gap-2.5 items-center justify-between border-b pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">Pão de Queijo Artesanal (Porção)</span>
                                <span className="text-[10px] text-slate-450 block leading-normal">Massa mineira real com queijo canastra curado.</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-amber-700 font-mono block">R$ 18,90</span>
                                <button 
                                  onClick={() => {
                                    setCartCount(prev => prev + 1);
                                    triggerNotification("Produto adicionado ao carrinho simulado!", "success");
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg border-none mt-1 active:scale-95 transition-all cursor-pointer"
                                >
                                  + Adicionar
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2.5 items-center justify-between border-b pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight font-sans">Café Coado & Pão na Chapa</span>
                                <span className="text-[10px] text-slate-450 block leading-normal font-medium">Clássico paulistano com requeijão tostado na medida.</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-amber-700 font-mono block">R$ 12,50</span>
                                <button 
                                  onClick={() => {
                                    setCartCount(prev => prev + 1);
                                    triggerNotification("Produto adicionado ao carrinho simulado!", "success");
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
                          <div className="sticky bottom-14 left-0 w-full bg-emerald-600 text-white p-3 flex justify-between items-center px-4 animate-in slide-in-from-bottom-5">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <ShoppingCart className="w-4 h-4 animate-bounce" />
                              <span>{cartCount} item(s) selecionado(s)</span>
                            </div>
                            <button
                              onClick={() => {
                                triggerNotification("Aparência Real: os clientes clicam e o pedido chega detalhado de forma linda e legível no WhatsApp de seu lead!", "info");
                                stitchFormSubmitted ? null : setStitchFormSubmitted(true);
                              }}
                              className="bg-white text-emerald-800 text-[10px] font-black uppercase py-1 px-3.5 rounded-full border-none cursor-pointer"
                            >
                              Finalizar Pedido !
                            </button>
                          </div>
                        )}

                        {/* Testimonials block */}
                        <div className="p-4 bg-[#fdfaf5] space-y-2">
                          <strong className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">O que dizem os clientes no Google Maps:</strong>
                          <div className="bg-white p-3 rounded-xl border border-amber-100 italic text-[10px] text-slate-500 leading-normal">
                            "A melhor escolha do bairro. O atendimento é primoroso e tudo é sempre fresquinho. Agora que aceitam pedidos fáceis ficou perfeito!"
                          </div>
                        </div>
                      </div>
                    ) : normalizedNiche.includes('dentista') || normalizedNiche.includes('odonto') || normalizedNiche.includes('dental') || normalizedNiche.includes('clinica') || normalizedNiche.includes('saude') ? (
                      /* HEALTH / DENTIST CLINIC */
                      <div className="space-y-0">
                        <div className="bg-gradient-to-tr from-teal-600 to-cyan-700 text-white p-6 text-center space-y-2">
                          <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">CLÍNICA MÉDICA ESPECIALIZADA</span>
                          <h2 className="text-lg font-black">{lead.name}</h2>
                          <p className="text-[10px] text-teal-100 font-semibold leading-relaxed">Cuidado, profissionalismo e tecnologia para sua saúde e bem-estar em {targetLocation}.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-teal-200 mt-2">
                            <span>{rating}★</span>
                            <span>({reviewsCount} avaliações)</span>
                          </div>
                        </div>

                        {/* Appointment form block */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-teal-950 uppercase block font-black border-b pb-1">⚙️ Pré-Agendamento Rápido de Consulta</strong>
                          
                          {stitchFormSubmitted ? (
                            <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-xl p-4 text-center space-y-1 animate-in zoom-in-95">
                              <span className="text-sm">📅</span>
                              <strong className="text-xs font-bold block">Solicitação Cadastrada !</strong>
                              <p className="text-[10px] leading-relaxed">Sua consulta de avaliação gratuita para {lead.name} foi disparada e confirmada.</p>
                            </div>
                          ) : (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                setStitchFormSubmitted(true);
                                triggerNotification("Pré-agendamento de consulta enviado!", "success");
                              }}
                              className="space-y-2 text-left"
                            >
                              <div className="space-y-0.5 text-xs text-slate-650">
                                <label className="text-[10px] text-slate-400 font-extrabold block">Seu Nome Comercial:</label>
                                <input type="text" placeholder="Ex: Douglas Bateria" required className="w-full border p-2 rounded-lg text-[10px] focus:outline-teal-500 font-semibold" />
                              </div>
                              <div className="space-y-0.5 text-xs text-slate-650">
                                <label className="text-[10px] text-slate-400 font-extrabold block">Seletor de Horários do Bairro:</label>
                                <select required className="w-full border p-2 rounded-lg font-bold text-[10px] focus:outline-teal-500">
                                  <option value="manha">Período da Manhã (09:00 - 12:00)</option>
                                  <option value="tarde">Período da Tarde (14:00 - 17:00)</option>
                                </select>
                              </div>
                              <button 
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border-none cursor-pointer active:scale-95"
                              >
                                <span>Agendar Consulta Ativa</span>
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Testimonials block */}
                        <div className="p-4 bg-slate-50 space-y-2">
                          <strong className="text-[10px] text-teal-800 font-bold block uppercase tracking-wider">Avaliações do Google Maps:</strong>
                          <div className="bg-white p-3 rounded-xl border italic text-[10px] text-slate-500 leading-normal">
                            "Excelentes profissionais. Atendimento de alta qualidade e infraestrutura perfeita. Muito feliz de agora poder pré-agendar online."
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* UNIVERSAL AUTOMATIVE WORKSHOP OR DEFAULT COMPANY */
                      <div className="space-y-0">
                        {/* Technical Hero Banner */}
                        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 text-center space-y-2">
                          <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider inline-block">INDÚSTRIA E SERVIÇOS B2B</span>
                          <h2 className="text-lg font-black">{lead.name}</h2>
                          <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">Os melhores especialistas em {lead.niche} na região de {targetLocation}. Sua solução definitiva.</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 mt-2">
                            <span>{rating}★</span>
                            <span>({reviewsCount} avaliações espontâneas)</span>
                          </div>
                        </div>

                        {/* Services List and CTA */}
                        <div className="p-4 space-y-3">
                          <strong className="text-xs text-slate-950 uppercase block font-black border-b pb-1">⚙️ Nossos Serviços Especializados</strong>
                          
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-3 bg-slate-50 min-h-[100px] hover:bg-slate-100 flex flex-col justify-between rounded-xl border">
                              <span className="text-sm block">⚡</span>
                              <strong className="text-[10px] text-slate-800 block">Atendimento Rápido</strong>
                              <span className="text-[9px] text-slate-450 block leading-tight">Orçamento sem compromisso em 15 minutos.</span>
                            </div>

                            <div className="p-3 bg-slate-50 min-h-[100px] hover:bg-slate-100 flex flex-col justify-between rounded-xl border col-span-1">
                              <span className="text-sm block">💎</span>
                              <strong className="text-[10px] text-slate-800 block">Qualidade Garantida</strong>
                              <span className="text-[9px] text-slate-450 block leading-tight font-medium">As melhores peças e insumos do país.</span>
                            </div>
                          </div>

                          {/* Contact quick actions */}
                          <div className="space-y-2 pt-2">
                            <h4 className="text-[10px] text-slate-400 font-extrabold uppercase text-left">Fale Diretamente Conosco:</h4>
                            <div className="flex gap-2">
                              {lead.phone !== "" ? (
                                <a href={`tel:${lead.phone}`} className="flex-1 text-center bg-indigo-650 hover:bg-indigo-700 font-extrabold text-[#fff] rounded-xl py-2 px-2.5 text-[10px] block no-underline">
                                  Ligar: {lead.phone}
                                </a>
                              ) : (
                                <span className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-[10px]">Sem fone direto</span>
                              )}
                              <button 
                                onClick={() => {
                                  setStitchFormSubmitted(true);
                                  triggerNotification("Abordagem iniciada via WhatsApp!", "success");
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-[#fff] rounded-xl py-2 px-2.5 text-[10px] border-none active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>WhatsApp Direto</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Testimonials block */}
                        <div className="p-4 bg-slate-50 space-y-2">
                          <strong className="text-[10px] text-slate-800 font-bold block uppercase tracking-wider">O que dizem os clientes no Google Maps:</strong>
                          <div className="bg-white p-3 rounded-xl border italic text-[10px] text-slate-500 leading-normal">
                            "Excelente trabalho, equipe educada, ágil e atenciosa. Recomendo muito!"
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Integrated Footing */}
                    <div className="bg-slate-900 text-slate-450 p-4 text-center text-[9px] space-y-1 relative pb-10">
                      <span className="text-white font-extrabold block">© {lead.name} - {targetLocation}</span>
                      <span className="text-slate-500 block leading-normal">Desenvolvido em conformidade de SEO com a plataforma MapsLeads Hub</span>
                      {/* Simulated Home Indicators Bar of modern smartphones */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-slate-650 rounded-full"></div>
                    </div>

                  </div>
                </div>

                {/* Subtitle explaining Google Stitch Simulation tool */}
                <div className="mt-4 bg-[#f8f9ff] text-slate-500 p-3 rounded-2xl text-[10px] font-semibold text-center leading-relaxed max-w-sm">
                  💡 <strong className="text-slate-800">Visualização de Conversão:</strong> Site mobile-first adaptado gerado em tempo real com dados de Maps. Os clientes do lead conseguem testar e rodar o design em menos de 10 segundos!
                </div>

              </div>
            )}

          </div>

          {/* Lateral Control Board Settings Panel (no-print) */}
          <div className="w-full md:w-80 shrink-0 space-y-4 no-print">
            
            {/* Guide Info Card */}
            <div className="bg-[#0f172a] text-white p-5 rounded-2xl border border-slate-800 relative overflow-hidden space-y-3">
              <div className="flex items-center gap-1.5 animate-pulse text-amber-400">
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span className="text-[9px] font-black uppercase tracking-wider">Ações de Fechamento</span>
              </div>
              
              <h4 className="text-xs font-extrabold">Otimize a Prospecção B2B</h4>
              <p className="text-slate-400 leading-normal text-[11px] font-medium">
                Siga o roteiro passo-a-passo comercial: apresente a Proposta Comercial de R$ 1.200, firme o Contrato B2B em PDF e envie a Demo visual automatizada do Google Stitch.
              </p>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] leading-relaxed text-slate-350">
                ⭐ <strong className="text-white">Dica Comercial:</strong> Leads com notas muito altas já possuem validação de público espontâneo. O site é o empurrão que falta para canais próprios de venda.
              </div>
            </div>

            {/* Print and Export Buttons Box */}
            <div className="bg-white border rounded-2xl p-5 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Documento & Área Física</span>
              
              <button
                onClick={handlePrint}
                className="w-full bg-slate-900 border hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300 pointer-events-none" />
                <span>Emitir PDF / Imprimir</span>
              </button>

              <button
                onClick={() => {
                  const queryText = activeSubTab === 'proposta' 
                    ? `Proposta de Serviços Digitais para ${lead.name} no valor de R$ 1.200,00 reais à vista e suporte MRR de R$ 150,00` 
                    : `Contrato de desenvolvimento de site One-Page em conformidade com as regras GMB de ${lead.name}`;
                  handleCopyText(queryText);
                }}
                className="w-full bg-[#f8f9ff] border-2 hover:bg-slate-100 text-slate-800 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Copiado!" : "Copiar Resumo Texto"}</span>
              </button>
            </div>

            {/* Diagnostic stats side block */}
            <div className="bg-white border rounded-2xl p-5 space-y-2.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Metas Comercial Alcançáveis</span>
              
              <div className="flex justify-between items-center text-xs font-semibold leading-none border-b pb-2">
                <span className="text-slate-500">Ticket Desenvolvido:</span>
                <span className="text-slate-800 font-mono font-bold">R$ 1.200,00</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold leading-none border-b pb-2">
                <span className="text-slate-500">Recorrência Mensal (MRR):</span>
                <span className="text-indigo-650 font-mono font-bold">R$ 150,00 /mês</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold leading-none">
                <span className="text-slate-500">Indexação Google:</span>
                <span className="text-emerald-600 font-bold uppercase">72 horas Úteis</span>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Actions footer panel */}
        <div className="bg-slate-50 border-t p-5 flex justify-end gap-2.5 shrink-0 no-print">
          <button 
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl tracking-wide active:scale-95 transition-all cursor-pointer"
          >
            Fechar Gerador
          </button>
        </div>

      </div>
    </div>
  );
};
