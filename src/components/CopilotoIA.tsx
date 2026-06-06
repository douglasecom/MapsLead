import React, { useState } from 'react';
import { Lead } from '../types';
import { Sparkles, MessageSquare, Bot, ArrowRight, User, ShieldCheck } from 'lucide-react';

interface CopilotoIAProps {
  leads: Lead[];
  credits: number;
}

export const CopilotoIA: React.FC<CopilotoIAProps> = ({ leads, credits }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { 
      sender: 'assistant', 
      text: 'Olá! Sou o seu Copiloto de IA Comercial AdsHive Prospect. Posso ler sua base de dados atual de leads e te dar as melhores estratégias de prospecção e fechamento B2B. O que gostaria de analisar agora?' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const SUGGESTED_QUERIES = [
    { label: '🔥 Priorizar Leads', desc: 'Metodologia de pontuação de oportunidade' },
    { label: '🍞 Pitch Padaria Bella Massa', desc: 'Preparo de pacote comercial otimizado' },
    { label: '🦷 Contornar Objeções de Dentistas', desc: 'Objeção do "Já temos anúncios/site"' },
    { label: '💼 Script para Reunião de Fechamento', desc: 'Agilizar o fechamento de contratos' }
  ];

  const handleQuerySelect = (query: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { sender: 'user', text: query }]);

    setTimeout(() => {
      let reply = '';
      if (query.includes('Priorizar')) {
        const topLead = leads.find(l => l.leadScore >= 95);
        reply = `Analisando sua base de leads atual... 
        
🔥 **Recomendação Prioritária:** O lead comercial **"${topLead?.name || 'Padaria Bella Massa'}"** é seu alvo de maior conversão hoje (Score: ${topLead?.leadScore || 98}%).
        
**Por que focar nele:**
1. Possui excelente prova social (nota ${topLead?.rating || 4.8}★ Baseada em ${topLead?.reviews || 1200} avaliações espontâneas no Google Maps). Isso significa que as famílias locais já amam e confiam no serviço.
2. Não possui qualquer site oficial ou presença unificada em anúncios. Eles perdem cerca de 30% a 45% de novos pedidos diretos pela concorrência que possui sites otimizados.
        
**Ação Recomendada:** Use o nosso Gerador de Pitches na aba "IA Pitch" focando em "Cardápio Digital no WhatsApp".`;
      } else if (query.includes('Bella Massa')) {
        reply = `🍞 **Estratégia de Fechamento: Padaria e Confeitaria Bella Massa**

**Pacote Comercial Recomendado:** "One-Page Delivery Express"
*   **O que oferecer:** Um site mobile-first moderno, carregamento ultra veloz, exibindo o cardápio de panificação e doces com botão de pedidos via carrinho integrado diretamente para o WhatsApp comercial deles.
*   **Preço Inicial Sugerido:** Taxa de implantação de R$ 1.200,00 + suporte técnico por R$ 150,00 mensal (MRR).
*   **Ganho de Prospecção principal:** Mostrar que eles vão fugir das comissões abusivas (de até 27%) cobradas pelos aplicativos parceiros de delivery.`;
      } else if (query.includes('Objeções')) {
        reply = `🦷 **Contornando Objeções de Clínicas Odontológicas**

Quando o dentista disser: *"Já temos site ou já anunciamos"*...

**Quebre a objeção usando nosso Radar Digital:**
1.  **Dica de Abordagem:** *"Doutor, verifiquei que seu site atual não possui o Meta Pixel instalado. Isso significa que todo o tráfego que chega na sua página vai embora e você não consegue fazer remarketing para eles no Instagram. Você está perdendo até 40% do seu orçamento de marketing."*
2.  **Solução Proposta:** Ofereça uma auditoria rápida de Gaps de SEO Local e instalação gratuita do Pixel na contratação dos pacotes de Site ou Tráfego Pago.`;
      } else {
        reply = `🤝 **Script de Fechamento de Reuniões (Método Acelerador)**

Use este roteiro para fechar o contrato de R$ 1.200 em menos de 20 minutos de web-conferência:

1.  **Imersão nos Gaps:** *"Doutor/Gestor, seu negócio já tem 5 estrelas no Maps, mas repare que os clientes buscam seu cardápio/reserva online e acabam comprando do seu concorrente porque ele facilita o clique."*
2.  **O Contraste Visual:** Apresente o briefing desenhado no Google Stitch. Exiba o poder da usabilidade.
3.  **Fechamento Segurado:** *"Geralmente cobramos R$ 1.500 pela estrutura de funil, mas para os novos parceiros do bairro mapeados pelo AdsHive Prospect hoje, faremos por R$ 1.200 com a primeira mensalidade de suporte apenas após o site estar no ar."*`;
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText;
    setInputText('');
    handleQuerySelect(query);
  };

  return (
    <>
      {/* Floating Toggle Round Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-95 text-white shadow-2xl rounded-full z-120 flex items-center justify-center transition-all cursor-pointer border border-blue-400/20"
        title="Falar com Copiloto IA Comercial"
      >
        <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
      </button>

      {/* Floating Sidebar Chat Box Slider */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-[#0f172a] border border-slate-800 rounded-3xl z-120 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Box Header */}
          <div className="bg-[#1e293b] p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">Copiloto IA Comercial</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Consuloria Ativa ({credits} cr.)</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white font-extrabold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 shadow-inner">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded bg-indigo-500/10 border flex items-center justify-center shrink-0">
                    <span className="text-[10px]">🤖</span>
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed font-semibold shadow-sm whitespace-pre-wrap ${
                  m.sender === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-[#1e293b] text-slate-200 rounded-tl-none border border-slate-805"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded bg-indigo-500/10 border flex items-center justify-center shrink-0">
                  <span className="text-[10px]">🤖</span>
                </div>
                <div className="bg-[#1e293b] text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs font-bold flex gap-1 items-center border">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts Grid */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-900 border-t border-slate-850 grid grid-cols-2 gap-2">
              {SUGGESTED_QUERIES.map((q, idx) => (
                <button
                  key={idx} 
                  onClick={() => handleQuerySelect(q.label)}
                  className="bg-[#1e293b]/70 border hover:bg-slate-800 text-slate-300 rounded-xl p-2.5 text-left active:scale-95 transition-all outline-none cursor-pointer"
                >
                  <span className="font-extrabold text-[10px] text-white block truncate">{q.label}</span>
                  <span className="text-[9px] text-slate-500 block truncate leading-tight">{q.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Form input bottom bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#1e293b] border-t border-slate-800 flex gap-2">
            <input 
              type="text" 
              placeholder="Digite sua dúvida de vendas..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#0f172a] border border-slate-750 text-xs text-white rounded-xl py-2 px-3 focus:outline-none focus:border-blue-500 font-semibold"
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-2 cursor-pointer flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
