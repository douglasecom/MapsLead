import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MapPin, 
  Search, 
  Globe, 
  Phone, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  CheckCircle2, 
  Check,
  Flame,
  Volume2,
  Database,
  Briefcase,
  Play,
  ShieldCheck,
  Target,
  LineChart,
  Grid,
  Users,
  Settings,
  HelpCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  onNavigateToAuth: (step: 'login' | 'register') => void;
  onExploreDemo?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigateToAuth,
  onExploreDemo
}) => {
  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Platform features / Tab showcase
  const [activeTab, setActiveTab] = useState<string>("pesquisa");

  // Interactive Simulator State
  const [simNiche, setSimNiche] = useState<string>("Padaria");
  const [simCity, setSimCity] = useState<string>("Belo Horizonte, MG");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulatedLeads, setSimulatedLeads] = useState<any[]>([]);

  // Update document title and meta description for SEO
  useEffect(() => {
    document.title = "AdsHive Prospect | Encontre Clientes com Inteligência Artificial";
    
    // Attempt to update meta description if found
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Descubra empresas, encontre leads qualificados, analise concorrentes e gere oportunidades usando IA. Ganhe 10 leads grátis ao criar sua conta.");
    }
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Run simulated search
  const handleStartSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationStep(1);
    setSimulatedLeads([]);

    // Step-by-step radar animation simulation
    setTimeout(() => {
      setSimulationStep(2); // Analyzing Website, GMB, Presence
    }, 1200);

    setTimeout(() => {
      setSimulationStep(3); // Unveiling opportunities
      setSimulatedLeads([
        {
          name: `${simNiche} Central de ${simCity.split(",")[0]}`,
          rating: 4.6,
          reviews: 84,
          hasWebsite: false,
          hasGmbActive: true,
          phone: "(31) 98877-6655",
          leadScore: 94,
          reason: "Sem site oficial configurado no Google. Alto potencial para agenciamento de Landing Pages!"
        },
        {
          name: `${simNiche} Gourmet & Cia`,
          rating: 3.9,
          reviews: 19,
          hasWebsite: true,
          hasGmbActive: false,
          phone: "(31) 97755-4433",
          leadScore: 82,
          reason: "Ficha do Google Maps não reivindicada (Sem dono). Perigo de sequestro de ficha."
        },
        {
          name: `Supermercado & ${simNiche} Imperial`,
          rating: 4.8,
          reviews: 112,
          hasWebsite: false,
          hasGmbActive: true,
          phone: "(31) 3456-7890",
          leadScore: 88,
          reason: "Classificação excelente, mas ausência total de presença web. Ótimo lead de Google Ads Local."
        }
      ]);
    }, 2800);
  };

  const faqItems = [
    {
      q: "Como o AdsHive Prospect funciona?",
      a: "Nossa plataforma se conecta em tempo real aos dados públicos do Google Maps e algoritmos de análise proprietários para varrer cidades e nichos desejados. Identificamos lacunas de presença online (empresas sem sites, fichas mal otimizadas ou não reivindicadas) e geramos listagens higienizadas com e-mails, telefones, canais sociais e score de vendas pronto para abordagem."
    },
    {
      q: "Preciso cadastrar cartão de crédito para ganhar os 10 leads?",
      a: "Não! O cadastro é 100% gratuito e não exige nenhuma inserção de formas de pagamento ou cartão de crédito. Você cria a conta em segundos e seus 10 primeiros créditos de captação de leads de alta conversão já estarão disponíveis imediatamente no painel."
    },
    {
      q: "Posso cancelar minha assinatura quando quiser?",
      a: "Com certeza. Nossos planos premium Pro e adicionais avulsos de créditos não possuem contratos de fidelidade. Você pode fazer o downgrade ou cancelar sua renovação por boleto, cartão ou PIX diretamente no seu painel de faturamento seguro do Asaas a qualquer momento."
    },
    {
      q: "As informações das empresas e leads são reais?",
      a: "Sim, os leads são capturados em tempo real, garantindo dados telefônicos e cadastrais atualizados diretamente das listagens públicas ativas desse exato momento. Isso evita listas estáticas velhas e obsoletas que têm taxas de conversão de mensagens de spam."
    },
    {
      q: "Posso pesquisar qualquer nicho em qualquer cidade?",
      a: "Sim! Mapeamos todos os 5.570 municípios do território nacional brasileiro. Você pode buscar desde 'Pizzarias em São Paulo' até 'Oficinas Mecânicas' ou 'Consultórios de Odontologia' em cidades do interior."
    },
    {
      q: "O sistema serve para agências de marketing e freelancers?",
      a: "Perfeito para agências de tráfego, agências de SEO, desenvolvedores freelancers de sites e consultores comerciais. A funcionalidade de identificar empresas sem tag de pixel ativo ou sem site permite oferecer serviços de alta urgência já sabendo o ponto de dor exato."
    },
    {
      q: "Posso usar a IA para vender criação de sites?",
      a: "Sim! O AdsHive Prospect possui um gerador de abordagens de vendas baseado no modelo Gemini da Google que monta copys de emails e mensagens de WhatsApp contextualizadas para agências. O script de IA foca precisamente nas falhas de presença digital que a plataforma identificou."
    }
  ];

  return (
    <div id="landing-root" className="min-h-screen bg-[#07070a] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white overflow-x-hidden relative">
      
      {/* Dynamic Radar lines and decorative gradients behind the layout */}
      <div className="absolute top-0 inset-x-0 h-[650px] bg-gradient-to-b from-indigo-950/20 via-indigo-900/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-[150px] left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Ambient Grid Accent */}
      <div className="absolute inset-x-0 top-0 h-[1000px] opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4F46E5" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>

      {/* HEADER NAVBAR */}
      <header id="landing-nav" className="sticky top-0 z-50 bg-slate-950/75 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-white">
                AdsHive <span className="text-indigo-400">Prospect</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Prospecção de Alta Conversão</span>
            </div>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-350 tracking-wide select-none">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
            <a href="#gargalos" className="hover:text-white transition-colors">Prospecção Ativa</a>
            <a href="#prints" className="hover:text-white transition-colors">A Plataforma</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
          </nav>

          {/* Entrance buttons */}
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => onNavigateToAuth('login')}
              className="text-xs font-extrabold text-slate-300 hover:text-white transition-all px-3 py-2 cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => onNavigateToAuth('register')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer uppercase tracking-tight"
            >
              Ganhar 10 Leads Grátis
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero-sec" className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Promo Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-black text-indigo-300 tracking-wide">
              <span>🚀</span>
              <span className="uppercase">Inteligência Artificial & Prospecção</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-white">
              Encontre Clientes <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Prontos Para Comprar
              </span> <br />
              em Qualquer Cidade
            </h1>

            <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Descubra dezenas de empresas em menos de 10 segundos. Analise concorrentes, identifique negócios sem site, descubra quem está investindo em anúncios e crie propostas hiper-personalizadas usando Inteligência Artificial.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => onNavigateToAuth('register')}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm px-7 py-4 rounded-xl shadow-xl shadow-indigo-600/35 transition-all hover:scale-[1.04] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Ganhar 10 Leads Grátis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => {
                  if (onExploreDemo) {
                    onExploreDemo();
                  } else {
                    document.getElementById("como-funciona")?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-300" />
                <span>Ver Demonstração</span>
              </button>
            </div>

            {/* Micro proof */}
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-2 text-xs font-semibold text-slate-400 text-left">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Cadastro imediato e grátis</span>
              </div>
            </div>
          </div>

          {/* Interactive Floating / Simulated Prospecting Widget */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-800 opacity-20 blur-xl"></div>
            
            <div className="relative bg-[#0d0d15] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 text-left">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <strong className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Live Simulator: Extração de Oportunidades
                  </strong>
                </div>
                <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  Sandbox v1.2
                </span>
              </div>

              {/* Simulation input form */}
              <form onSubmit={handleStartSimulation} className="space-y-3">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Escolha o Nicho</label>
                    <select 
                      value={simNiche} 
                      onChange={(e) => setSimNiche(e.target.value)}
                      disabled={isSimulating}
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Padaria">🥖 Padarias</option>
                      <option value="Dentista">🦷 Dentistas</option>
                      <option value="Advocacia">⚖️ Advogados</option>
                      <option value="Clínica Estética">💅 Clínicas Estéticas</option>
                      <option value="Restaurante">🍔 Hamburguerias</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Escolha a Região</label>
                    <select 
                      value={simCity} 
                      onChange={(e) => setSimCity(e.target.value)}
                      disabled={isSimulating}
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Belo Horizonte, MG">Belo Horizonte, MG</option>
                      <option value="Campinas, SP">Campinas, SP</option>
                      <option value="Curitiba, PR">Curitiba, PR</option>
                      <option value="Fortaleza, CE">Fortaleza, CE</option>
                      <option value="Porto Alegre, RS">Porto Alegre, RS</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Simular Pesquisa Grátis</span>
                </button>
              </form>

              {/* Simulation Result Stream Box */}
              <div className="min-h-[140px] bg-[#07070a] border border-slate-850 p-4 rounded-xl flex flex-col justify-center relative">
                <AnimatePresence mode="wait">
                  {simulationStep === 0 && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-slate-500 space-y-1.5 py-3"
                    >
                      <HelpCircle className="w-8 h-8 mx-auto stroke-[1.5] text-slate-600 animate-bounce" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Selecione um nicho, cidade e clique no botão acima para rodar a IA em tempo real.
                      </p>
                    </motion.div>
                  )}

                  {simulationStep === 1 && (
                    <motion.div 
                      key="scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-4 space-y-3"
                    >
                      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs font-bold text-slate-300">
                        Buscando locais ativos no Google Maps para "{simNiche}"...
                      </p>
                      <div className="text-[9px] font-mono text-slate-550 truncate">
                        GET /v1/places/search?niche={simNiche}&city={simCity.split(",")[0]}
                      </div>
                    </motion.div>
                  )}

                  {simulationStep === 2 && (
                    <motion.div 
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-4 space-y-3"
                    >
                      <Globe className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-indigo-300">
                        Analisando presença digital, domínio, DNS e marcas de Ads ativo...
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Testando tags de rastreamento de anúncios (Meta & Google Pixel)
                      </p>
                    </motion.div>
                  )}

                  {simulationStep === 3 && (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between text-[10px] font-black text-indigo-400 border-b border-indigo-950 pb-1.5">
                        <span>3 OPORTUNIDADES ENCONTRADAS</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 rounded">Mapeamento OK</span>
                      </div>

                      <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                        {simulatedLeads.map((lead, idx) => (
                          <div key={idx} className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[11px] leading-tight flex justify-between gap-2.5">
                            <div className="space-y-1 max-w-[70%]">
                              <h5 className="font-extrabold text-white truncate">{lead.name}</h5>
                              <p className="text-[9px] text-indigo-300 font-semibold">{lead.reason}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{lead.phone}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center justify-end text-[10px] font-black text-amber-500 font-mono">
                                <span>{lead.rating}★</span>
                              </div>
                              <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md inline-block font-bold mt-1 uppercase font-mono">
                                SCORE {lead.leadScore}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        type="button"
                        onClick={() => onNavigateToAuth('register')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none mt-1 animate-pulse"
                      >
                        <span>Exportar estes Leads com Cadastro</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SOCIAL PROOF / METRIC COUNTERS */}
      <section id="prova-social" className="bg-[#0b0c13] border-y border-slate-900 py-12 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-black tracking-widest text-[#8b2eff] uppercase text-center mb-8 font-mono">
            ESTATÍSTICAS DA NOSSA REDE NACIONAL
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            {/* Metric 1 */}
            <div className="space-y-1.5 p-4 rounded-xl hover:bg-slate-900/10 transition-colors">
              <strong className="block text-4xl sm:text-5xl font-black text-white tracking-tight">
                +100.000
              </strong>
              <span className="text-sm font-bold text-slate-300 block">
                Empresas Analisadas
              </span>
              <p className="text-xs text-slate-500 font-semibold">
                Análise automática de website, Google Maps e pontuação de anúncios.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1.5 p-4 rounded-xl hover:bg-slate-900/10 transition-colors border-y md:border-y-0 md:border-x border-slate-900">
              <strong className="block text-4xl sm:text-5xl font-black text-indigo-400 tracking-tight">
                +50.000
              </strong>
              <span className="text-sm font-bold text-slate-300 block">
                Leads Gerados
              </span>
              <p className="text-xs text-slate-500 font-semibold">
                Contatos qualificados exportados por agências, consultores e assessores.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1.5 p-4 rounded-xl hover:bg-slate-900/10 transition-colors">
              <strong className="block text-4xl sm:text-5xl font-black text-white tracking-tight">
                +5.570
              </strong>
              <span className="text-sm font-bold text-slate-300 block">
                Cidades Brasileiras
              </span>
              <p className="text-xs text-slate-500 font-semibold">
                Mapeamento completo de todos os municípios, capitais e regiões metropolitanas.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 md:py-28 px-4 max-w-7xl mx-auto text-center space-y-16">
        <div className="space-y-3.5 max-w-3xl mx-auto">
          <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono">
            PASSO A PASSO DA CONVERSÃO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Como Encontrar Clientes Prontos em Três Passos
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Nossa arquitetura de software faz o trabalho complexo de mineração e análise de dados para você fechar contratos comerciais rapidamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="bg-[#0b0c13] border border-slate-900 rounded-3xl p-8 relative flex flex-col justify-between text-left space-y-6 hover:border-indigo-500/30 transition-all duration-300 group">
            <span className="absolute top-4 right-6 text-7xl font-sans font-black text-indigo-500/[0.04] select-none">
              01
            </span>
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>

              <h4 className="text-lg font-black text-white">1. Escolha Cidade e Nicho</h4>
              
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Escolha qualquer atividade comercial e qualquer localização do Brasil. Busque nichos com alto ticket e margem.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2 text-[10.5px]">
              <div className="text-slate-450 font-bold block uppercase tracking-wide">Exemplos populares:</div>
              <ul className="text-slate-300 font-semibold space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                  <span>Padarias em Belo Horizonte</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                  <span>Dentistas em Campinas</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                  <span>Advogados em Curitiba</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0b0c13] border border-slate-900 rounded-3xl p-8 relative flex flex-col justify-between text-left space-y-6 hover:border-indigo-500/30 transition-all duration-300 group">
            <span className="absolute top-4 right-6 text-7xl font-sans font-black text-indigo-500/[0.04] select-none">
              02
            </span>
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>

              <h4 className="text-lg font-black text-white">2. A IA analisa os negócios</h4>
              
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Nossos agentes examinam minuciosamente dezenas de canais públicos para identificar falhas graves de captação e marketing.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2 text-[11px]">
              <span className="text-[10px] text-slate-450 font-black block uppercase tracking-wider">Métricas de Auditoria:</span>
              <div className="grid grid-cols-2 gap-1 px-1 text-slate-350">
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Website & DNS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Google Maps</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Presença Digital</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Meta Ads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0b0c13] border border-slate-900 rounded-3xl p-8 relative flex flex-col justify-between text-left space-y-6 hover:border-indigo-500/30 transition-all duration-300 group">
            <span className="absolute top-4 right-6 text-7xl font-sans font-black text-indigo-500/[0.04] select-none">
              03
            </span>
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>

              <h4 className="text-lg font-black text-white">3. Receba leads qualificados</h4>
              
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Acesse listas ricas com telefones, emails validados, contatos de WhatsApp, redes sociais e um Score Comercial unificado.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2 text-[11px]">
              <span className="text-[10px] text-slate-450 font-black block uppercase tracking-wider text-indigo-400">Inteligência Integrada:</span>
              <p className="text-[10.5px] text-slate-400 font-semibold italic">
                Abordagem personalizada pronta para WhatsApp, gerada com Inteligência Artificial para cada lead em um clique.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* DIFERENCIAIS CARDS BENTO STYLE */}
      <section id="diferenciais" className="py-20 md:py-28 bg-[#0b0c13]/55 border-y border-slate-900 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3.5 max-w-3xl mx-auto">
            <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono">
              POR QUE ADSHIVE PROSPECT?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              A Tecnologia Mais Inteligente de Prospecção do Brasil
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
              Reunimos em um único painel ágil tudo o que sua equipe precisa para fechar novos contratos recorrentes de marketing, desenvolvimento ou tráfego.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Diff 1 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">Google Maps Inteligente</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Varredura profunda por cidades inteiras e filtros inteligentes para separar os leads mais quentes.
              </p>
            </div>

            {/* Diff 2 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">IA Comercial (Gemini)</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Gere copys de WhatsApp baseando-se exatamente nos problemas encontrados de SEO, anúncios ou infraestrutura de cada empresa.
              </p>
            </div>

            {/* Diff 3 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <LineChart className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">Análise de Concorrentes</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Examine o ranking orgânico e erros comuns cometidos pelos concorrentes para usar como argumento comercial de impacto.
              </p>
            </div>

            {/* Diff 4 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">Meta Ads Library</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Monitore em segundos se a empresa possui tags e anúncios ativos em andamento no ecossistema do Meta Ads.
              </p>
            </div>

            {/* Diff 5 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">CRM Integrado</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Um pipeline de Kanban intuitivo para arrastar leads de novos contatos até contratos assinados sem perder nenhum follow-up.
              </p>
            </div>

            {/* Diff 6 */}
            <div className="bg-slate-950/40 border border-slate-905 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white">SEO Local Intensivo</h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Mapeie oportunidades com alto volume de tráfego orgânico negligenciado pelo comércio e conquiste clientes por autoridade.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO "ENCONTRE EMPRESAS SEM SITE" (EM FOCO) */}
      <section id="gargalos" className="py-20 md:py-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
              OPORTUNIDADE DE OURO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Empresas Perdendo Clientes Todos os Dias (Sem Sites)
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Sabia que mais de <strong>40% dos pequenos e médios negócios</strong> com perfis de Maps ativos no Brasil não possuem um site institucional ou página oficial no ar? Eles dependem apenas de comentários e mídias terceiras.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Descubra negócios que ainda não possuem website profissional cadastrado e ofereça seus serviços de desenvolvimento, SEO local ou assessoria de tráfego pago de forma estruturada, com provas claras da fraqueza digital.
            </p>
            
            <div className="pt-2">
              <button
                onClick={() => onNavigateToAuth('register')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-transform hover:scale-103 active:scale-97 cursor-pointer uppercase tracking-wider"
              >
                Buscar Negócios Sem Site Agora
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl relative overflow-hidden text-left space-y-4">
              <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white block">Auditores de Domínio AdsHive</h5>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Varredura de website automática</span>
                </div>
              </div>

              {/* Mock visual comparison check */}
              <div className="space-y-3">
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-white">Churrascaria Gourmet - Centro</span>
                    <span className="text-[9px] bg-red-500/10 text-red-400 font-bold px-1.5 rounded uppercase font-mono">Gargalo Crítico</span>
                  </div>
                  <div className="py-1 flex gap-4 text-[10px] text-slate-400 font-semibold font-mono">
                    <span>Maps: ATIVO</span>
                    <span className="text-red-400">Site: NÃO ENCONTRADO (404) ⚠️</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Possui 142 avaliações (4.4★). Excelente reputação, mas perde mais de 230 agendamentos mensais pela ausência total de página com link de reserva.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-350">Clínica Sorriso Feliz - Campinas</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 rounded uppercase font-mono">Análise OK</span>
                  </div>
                  <div className="py-1 flex gap-4 text-[10px] text-slate-500 font-semibold font-mono">
                    <span>Maps: Reivindicado</span>
                    <span className="text-emerald-400">Site: Conectado</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO "VEJA QUEM ESTÁ ANUNCIANDO" */}
      <section id="anunciantes" className="py-20 md:py-28 bg-[#0b0c13]/35 border-y border-slate-900 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 lg:order-2 space-y-6 text-left">
              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                BIBLIOTECA META ADS LIBRARY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Descubra Empresas Ativas Investindo em Marketing
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Identifique instantaneamente quais empresas na região escolhida já possuem campanhas publicitárias ativas e quais estão totalmente invisíveis nas buscas sociais.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Ofereça otimização de campanhas, auditoria de público-alvo ou migração de marketing para as empresas que já possuem verba de mídia, ou mostre para as empresas que não anunciam qie a concorrência delas está conquistando todos os cliques no Facebook Ads.
              </p>
              
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToAuth('register')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-transform hover:scale-103 active:scale-97 cursor-pointer uppercase tracking-wider"
                >
                  Identificar Anunciantes Agora
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 lg:order-1">
              <div className="bg-[#0b0c13] border border-slate-900 p-6 rounded-3xl relative overflow-hidden text-left space-y-4">
                
                {/* Meta ADS Visual representation cards */}
                <div className="space-y-3.5">
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/30 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1877f2]/10 text-[#1877f2] flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-200">Campanha Ativa Mapeada</strong>
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 rounded uppercase font-black tracking-wide font-mono">Facebook Ads</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold italic">"Fale conosco pelo WhatsApp e agende sua avaliação imediata neste sábado!"</p>
                      <div className="flex gap-4 pt-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>Cliques: 3.200/mês</span>
                        <span className="text-indigo-400">Pixel Instalado</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-red-900/20 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-400">Inativo em Campanhas</strong>
                        <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase tracking-wide font-bold">Sem Anúncios</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Este estabelecimento comercial nunca ativou nenhuma campanha de marketing digital ou pixel.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE SHOWCASE OF APP SCREENSHOTS / WORKFLOW */}
      <section id="prints" className="py-20 md:py-28 px-4 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3.5 max-w-3xl mx-auto">
          <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono">
            ECOSSISTEMA COMPLETO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Veja a Plataforma em Ação
          </h2>
          <p className="text-slate-450 text-sm leading-relaxed max-w-2xl mx-auto">
            Explore as telas reais e de alta performance integradas e prontas para tracionar sua operação comercial em minutos.
          </p>
        </div>

        {/* Tab selection links */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto border-b border-slate-900 pb-3">
          {[
            { id: "pesquisa", label: "Pesquisa de Leads" },
            { id: "analise", label: "Análise de Empresa" },
            { id: "crm", label: "Pipeline CRM" },
            { id: "dashboard", label: "Dashboard Comercial" },
            { id: "admin", label: "Painel de Administrador" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-900/50 border-slate-850 hover:border-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simulated Interfaces / Screenshots Box */}
        <div className="bg-[#0b0c13] border border-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* PESQUISA TAB */}
            {activeTab === "pesquisa" && (
              <motion.div 
                key="pesquisa" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
              >
                <div className="md:col-span-4 space-y-4 pr-4">
                  <h4 className="text-lg font-black text-white">Pesquisa Geográfica em Tempo Real</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Nossa ferramenta de mapa local integrada plota cada oportunidade identificada na cidade selecionada.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Você pode arrastar, aproximar o zoom e clicar em pins laranjas (empresas sem sites) ou pins azuis para ler o diagnóstico comercial do robô AdsHive.
                  </p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">Score Médio Prontidão:</span>
                    <strong className="text-red-450 font-black tracking-wide">88% (Urgência Alta)</strong>
                  </div>
                </div>
                <div className="md:col-span-8 bg-slate-950/80 rounded-2xl border border-slate-850 overflow-hidden min-h-[300px] flex flex-col justify-between p-4 relative">
                  {/* Mock map visual element */}
                  <div className="absolute inset-0 bg-[#0d0d15] opacity-20 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="map-mock" width="30" height="30" patternUnits="userSpaceOnUse">
                          <circle cx="1" cy="1" r="1.5" fill="#4F46E5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#map-mock)" />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center z-10">
                    <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-2 py-0.5 rounded text-[10px] font-bold">MAPA INTEGRATIVO DE CURITIBA, PR</span>
                    <span className="text-[10px] text-slate-500 font-mono">Zoom: 14x</span>
                  </div>

                  <div className="my-[40px] z-10 flex flex-wrap gap-4 items-center justify-center">
                    <div className="bg-slate-900 border border-indigo-900/60 p-3 rounded-xl shadow-lg flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
                      <div className="text-[11px]">
                        <strong className="text-slate-200 block font-bold leading-tight">Clínica Veterinária Patas</strong>
                        <span className="text-slate-500 font-mono text-[9px]">Rua das Orquídeas, 102</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-amber-500/50 p-3 rounded-xl shadow-lg flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                      <div className="text-[11px]">
                        <strong className="text-slate-200 block font-bold leading-tight">Auto Peças Federal (Sem Site)</strong>
                        <span className="text-amber-400 font-mono text-[9px]">Gargalo de conversão detectado ⚠️</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-slate-400 leading-relaxed font-semibold block z-10 text-left">
                    🧠 <strong>Dica Comercial:</strong> Leads identificados sem site possuem uma taxa de agendamento de primeira reunião 3.1x superior quando abordados via WhatsApp rápido.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ANALISE TAB */}
            {activeTab === "analise" && (
              <motion.div 
                key="analise" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
              >
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-lg font-black text-white">Análise de Empresa Avançada</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Nosso robô inteligente examina todos os quesitos cruciais de SEO Local, velocidade, validações e tags.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Você descobre se a empresa possui Meta Pixel de anúncios configurado, tag de Google Analytics ativas e se seu Google Meu Negócio está corretamente verificado.
                  </p>
                </div>
                <div className="md:col-span-8 bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-900">
                    <strong className="text-xs text-slate-200 block">CHECKLIST DE PRESENÇA DIGITAL</strong>
                    <span className="text-[10px] bg-red-550/15 text-red-400 border border-red-500/25 px-1.5 rounded font-black font-mono">CONVERTENDO 48%</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="font-bold">Validação de DNS e Registro de Domínio</span>
                      <span className="text-red-400 font-black uppercase tracking-wider text-[9px] font-mono">❌ Sem site associado</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="font-bold">Presença no Google Maps (GMB)</span>
                      <span className="text-emerald-400 font-black uppercase tracking-wider text-[9px] font-mono">✔️ Ativo (84 avaliações)</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="font-bold">Tags de Rastreamento (Meta Pixel, Google Tag)</span>
                      <span className="text-red-400 font-black uppercase tracking-wider text-[9px] font-mono">❌ Nenhuma tag instalada</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="font-bold">Presença em Redes Sociais</span>
                      <span className="text-indigo-400 font-black uppercase tracking-wider text-[9px] font-mono">⚠️ Parcial (Apenas Instagram)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CRM TAB */}
            {activeTab === "crm" && (
              <motion.div 
                key="crm" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
              >
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-lg font-black text-white">Pipeline de Vendas CRM Integrado</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Não perca nenhum contrato comercial na mesa do seu escritório de vendas.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Nosso quadro estilo Kanban permite que você arraste os leads qualificados e controle as etapas de negociação, reuniões marcadas, envio de propostas e fechamentos.
                  </p>
                </div>
                <div className="md:col-span-8 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* CRM Col 1 */}
                    <div className="space-y-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-left min-h-[220px]">
                      <span className="text-[9px] font-black tracking-widest text-[#8b2eff] uppercase block">Contatos (2)</span>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 space-y-1 text-[11px]">
                        <strong className="text-white block font-bold leading-tight">Clínica Dr. Bruno</strong>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase">Sem Site</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 space-y-1 text-[11px]">
                        <strong className="text-white block font-bold leading-tight">Padaria Silva</strong>
                        <span className="text-[10px] text-slate-400 font-bold">Aguardando Retorno</span>
                      </div>
                    </div>

                    {/* CRM Col 2 */}
                    <div className="space-y-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-left min-h-[220px]">
                      <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block">Proposta (1)</span>
                      <div className="bg-slate-[#13131b] p-2 rounded-lg border border-indigo-900/30 shadow-indigo-950/20 shadow-md space-y-1 text-[11px]">
                        <strong className="text-white block font-bold leading-tight">Hamburgueria Rock</strong>
                        <span className="text-[10px] text-[#C93CFF] font-black block">Faturamento: R$ 1.500/mês</span>
                      </div>
                    </div>

                    {/* CRM Col 3 */}
                    <div className="space-y-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-left min-h-[220px]">
                      <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase block">Fechado 🚀</span>
                      <div className="bg-emerald-950/15 border border-emerald-500/20 p-2 rounded-lg space-y-1 text-[11px]">
                        <strong className="text-emerald-300 block font-black leading-tight">Escritório Advocacia M</strong>
                        <span className="text-[9px] font-mono text-emerald-400">CONTRATO ATIVO</span>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
              >
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-lg font-black text-white">Dashboard Comercial Completo</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Acompanhe de forma unificada os resultados, relatórios das prospecções e metas do seu time de vendas.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Painel intuitivo com taxa de ganho e faturamento gerado para você ter controle absoluto da sua escala.
                  </p>
                </div>
                <div className="md:col-span-8 bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-[9px] text-[#7A7D8B] font-bold block uppercase tracking-wider">Leads Totais</span>
                      <strong className="text-white text-lg font-black">2.410</strong>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-[9px] text-[#7A7D8B] font-bold block uppercase tracking-wider">Conversão</span>
                      <strong className="text-emerald-400 text-lg font-black">12.8%</strong>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-[9px] text-[#7A7D8B] font-bold block uppercase tracking-wider">Receita</span>
                      <strong className="text-white text-lg font-black">R$ 14.800</strong>
                    </div>
                  </div>

                  <div className="bg-[#12121e] rounded-xl p-3.5 border border-slate-850 text-[11px] leading-relaxed text-slate-400 flex justify-between items-center">
                    <div>
                      <strong className="text-slate-200 font-bold block mb-0.5">Metas do mês: 20 novos contratos</strong>
                      <span>Seu time já atingiu 65% da meta comercial estipulada para este período!</span>
                    </div>
                    <span className="text-xs font-black text-indigo-400">13 / 20</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ADMIN TAB */}
            {activeTab === "admin" && (
              <motion.div 
                key="admin" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
              >
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-lg font-black text-white">Painel da Equipe e Faturamento Master</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Gerencie contas adicionais de funcionários, atribua cotas de créditos mensais e configure webhooks com facilidade.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Ideal para donos de agência gerenciarem a equipe de SDRs e representantes comerciais e acompanharem cobranças emitidas.
                  </p>
                </div>
                <div className="md:col-span-8 bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-3.5 text-xs text-left">
                  <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                    <strong className="text-[11px] text-[#8b2eff] font-black uppercase">Faturamento Integrado Sandbox Asaas</strong>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded font-bold text-[9px]">API Sandbox CONECTADA</span>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-white font-bold block leading-none">Webhook de Integração WhatsApp</strong>
                        <span className="text-[9px] font-mono text-slate-500 mt-1 block select-all">https://api.adshiveprospect.com/v1/webhook</span>
                      </div>
                      <span className="text-emerald-400 font-black text-[9px] bg-emerald-550/15 border border-emerald-500/35 px-1.5 py-0.5 rounded font-mono">ATIVO</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-white font-bold block leading-none">Eduardo SDR (Funcionário)</strong>
                        <span className="text-[9px] text-slate-500">Cota mensal de créditos: 250 / mês</span>
                      </div>
                      <span className="text-indigo-400 font-bold text-[10px]">Restam: 114</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* SEÇÃO PLANOS */}
      <section id="planos" className="py-20 md:py-28 bg-[#0b0c13] border-y border-slate-900 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3.5 max-w-3xl mx-auto">
            <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono">
              VALORES TRANSPARENTES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Acesso Sob Medida para Qualquer Tamanho de Negócio
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
              Ganhe 10 leads grátis ao se cadastrar e faça o upgrade para o plano profissional quando precisar de mais capacidade de extração e pesquisa de mapa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            
            {/* Free Plan */}
            <div className="bg-slate-950/70 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between text-left hover:border-slate-800 transition-all duration-300 relative">
              <div className="space-y-6">
                <div>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider block w-max mb-3">
                    Plano Gratuito
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-3xl sm:text-4xl font-black text-white leading-none">R$ 0</strong>
                    <span className="text-xs text-slate-500 font-semibold">/ grátis para sempre</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Ideal para testar o potencial das buscas e auditar seus primeiros 10 clientes de forma imediata e sem riscos.
                </p>

                <div className="border-t border-slate-900/60 pt-6 space-y-3.5">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Recursos Inclusos:</span>
                  <ul className="text-xs text-slate-300 font-semibold space-y-3">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>10 leads por mês</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Acesso básico às pesquisas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Auditor de velocidade e tags</span>
                    </li>
                    <li className="flex items-center gap-2.5 opacity-40">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Sem automações do Asaas integradas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => onNavigateToAuth('register')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-extrabold text-xs py-3.5 rounded-xl border border-slate-800 transition-all tracking-wide shadow-inner mt-8 cursor-pointer uppercase"
              >
                Começar Grátis
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-950/80 border-2 border-indigo-600 rounded-3xl p-8 flex flex-col justify-between text-left hover:border-indigo-500 transition-all duration-300 relative shadow-2xl shadow-indigo-950/50">
              {/* Highlight ribbon */}
              <span className="absolute top-4 right-6 bg-indigo-650 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider block w-max border border-indigo-500/30">
                Recomendado
              </span>
              
              <div className="space-y-6">
                <div>
                  <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider block w-max mb-3">
                    Plano Pro
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-3xl sm:text-4xl font-black text-white leading-none">R$ 149</strong>
                    <span className="text-xs text-slate-500 font-semibold">/ mês (Via Asaas)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-350 font-semibold leading-relaxed">
                  Perfeito para agências de marketing, SDRs focados e profissionais de venda ativa que buscam escala.
                </p>

                <div className="border-t border-[#1C1C26] pt-6 space-y-3.5">
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-wider block">Recursos Ilimitados:</span>
                  <ul className="text-xs text-slate-200 font-semibold space-y-3">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mais Leads adicionais integrados</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mais pesquisas diárias permitidas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Automações avançadas de inteligência</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Suporte prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => onNavigateToAuth('register')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-indigo-600/20 mt-8 cursor-pointer uppercase border-none"
              >
                Assinar Agora
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO FAQ (PERGUNTAS RECORRENTES) ACCORDION */}
      <section id="faq" className="py-20 md:py-28 px-4 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3.5">
          <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono">
            DÚVIDAS FREQUENTES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Perguntas & Respostas Frequentes
          </h2>
          <p className="text-slate-450 text-sm leading-relaxed">
            Seja bem-vindo ao suporte pré-vendas. Se houver alguma outra dúvida comercial, fale com nosso suporte.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className="bg-slate-950/60 border border-slate-900 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 flex justify-between items-center text-left hover:bg-slate-900/40 cursor-pointer border-none transition-colors"
                >
                  <strong className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {item.q}
                  </strong>
                  <ChevronDown className={`w-4 h-4 text-slate-450 shrink-0 transition-transform duration-350 ${isOpen ? "rotate-180 text-indigo-400" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs text-slate-350 leading-relaxed font-semibold border-t border-slate-900/40">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA FINAL DE CADASTRO */}
      <section id="cta-final" className="py-20 md:py-24 px-4 relative max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-slate-850 p-8 sm:p-12 md:p-16 text-center space-y-8 bg-[#090910]">
          
          {/* Radial Mesh backgrounds for high conversions style */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="space-y-3.5 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Comece Agora Gratuitamente
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-semibold">
              Receba 10 Leads Gratuitos e descubra como encontrar clientes antes da concorrência. Nenhuma surpresa, nenhum contrato assinado, nenhuma exigência de cartão.
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => onNavigateToAuth('register')}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-2xl shadow-indigo-600/35 transition-all hover:scale-[1.04] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2 border-none uppercase"
            >
              <span>Ganhar 10 Leads Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-450">
            <span>🛡️ Sandbox Segurança Asaas</span>
            <span>🤝 Sem Cartão de Crédito</span>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer id="landing-footer" className="bg-[#040406] border-t border-slate-900 py-12 px-4 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <strong className="text-base font-black text-white tracking-tight">AdsHive Prospect</strong>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-normal font-semibold">
              O software número 1 de inteligência em vendas para agências de tráfego, SEO, desenvolvedores freelancers de sites e consultores locais.
            </p>
          </div>

          <div className="space-y-3">
            <strong className="text-xs text-white uppercase tracking-wider block font-bold">Produto</strong>
            <ul className="text-xs text-slate-400 space-y-2 font-semibold">
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a></li>
              <li><a href="#prints" className="hover:text-white transition-colors">A Plataforma</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Grade de Planos</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <strong className="text-xs text-white uppercase tracking-wider block font-bold">Legal & Transparência</strong>
            <ul className="text-xs text-slate-400 space-y-2 font-semibold">
              <li><span className="hover:text-white transition-colors cursor-pointer">Termos de Uso</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Política de Privacidade</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Segurança dos Dados</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Sandbox Asaas Gateway</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <strong className="text-xs text-white uppercase tracking-wider block font-bold">Contato & Suporte</strong>
            <ul className="text-xs text-slate-400 space-y-2 font-semibold">
              <li><span className="hover:text-white transition-colors cursor-pointer">Contato Comercial</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Suporte Técnico</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Central de Ajuda</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Blog Oficial AdsHive</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-slate-500 text-center sm:text-left">
          <span>
            © {new Date().getFullYear()} AdsHive Prospect. Todos os direitos reservados.
          </span>
          <div className="flex gap-4">
            <span className="hover:text-slate-450 transition-colors">Termos</span>
            <span className="hover:text-slate-450 transition-colors">Privacidade</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
