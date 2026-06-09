import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MapPin, 
  Search, 
  Globe, 
  Phone, 
  MessageSquare, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  CheckCircle2, 
  Check, 
  Flame, 
  Database, 
  Play, 
  ShieldCheck, 
  Target, 
  LineChart, 
  Grid, 
  Users, 
  Settings, 
  HelpCircle, 
  Mail, 
  FileText, 
  ArrowUpRight, 
  DollarSign, 
  LayoutDashboard, 
  Zap, 
  Layers,
  Send,
  Terminal,
  Code,
  BookOpen,
  X,
  Lock,
  Calendar,
  Video,
  Bell,
  Clock,
  Link2
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
  // Frequently Asked Questions toggles
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Platform features showcased dynamically (interactive mockups)
  const [activePrintTab, setActivePrintTab] = useState<string>("dashboard");

  // Simulated Prospecção Console
  const [simNiche, setSimNiche] = useState<string>("Padaria");
  const [simCity, setSimCity] = useState<string>("Belo Horizonte, MG");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulatedLeads, setSimulatedLeads] = useState<any[]>([]);

  // Credits Calculator Pricing
  const [creditAmount, setCreditAmount] = useState<number>(500);

  // Legal, Transparência & Suporte Dashboard Modal States
  const [activeLegalTab, setActiveLegalTab] = useState<string | null>(null);
  
  // States for Help Center search & toggles
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [activeHelpArticle, setActiveHelpArticle] = useState<number | null>(null);

  // States for Commercial Contact simulated form
  const [commercialForm, setCommercialForm] = useState({ name: "", email: "", company: "", whatsapp: "", message: "" });
  const [isSubmittingCommercial, setIsSubmittingCommercial] = useState(false);
  const [commercialSubmitted, setCommercialSubmitted] = useState(false);

  // States for Technical Support simulated ticket & chat
  const [supportCategory, setSupportCategory] = useState("Scraper");
  const [supportDescription, setSupportDescription] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportChatMessages, setSupportChatMessages] = useState<any[]>([]);
  const [isSupportActive, setIsSupportActive] = useState(false);
  const [supportReplyText, setSupportReplyText] = useState("");

  // States for Sandbox Asaas Gateway simulator
  const [asaasSimAmount, setAsaasSimAmount] = useState("170.00");
  const [asaasSimStatus, setAsaasSimStatus] = useState("APPROVED");
  const [asaasLogs, setAsaasLogs] = useState<any[]>(() => [
    { timestamp: new Date(Date.now() - 60000 * 5).toLocaleTimeString(), type: "info", text: "Sandbox iniciado. Sincronizado com o Firebase do AdsHive." }
  ]);
  const [isSimulatingAsaas, setIsSimulatingAsaas] = useState(false);

  const addAsaasLog = (type: "info" | "success" | "warning" | "error" | "incoming", text: string) => {
    setAsaasLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), type, text }]);
  };

  const handleCommercialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commercialForm.name || !commercialForm.email || !commercialForm.whatsapp) return;
    setIsSubmittingCommercial(true);
    setTimeout(() => {
      setIsSubmittingCommercial(false);
      setCommercialSubmitted(true);
    }, 1500);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportDescription) return;
    setIsSubmittingSupport(true);
    setTimeout(() => {
      setIsSubmittingSupport(false);
      setIsSupportActive(true);
      setSupportChatMessages([
        {
          sender: "user",
          text: `[Categoria: ${supportCategory}] ${supportDescription}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: "system",
          text: `Ticket #${Math.floor(Math.random() * 9000 + 1000)} aberto com sucesso. Prioridade: Alta. SLA: 15 min.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      setTimeout(() => {
        setSupportChatMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "Olá! Sou o Guto Bernardo do Suporte Técnico AdsHive. Analisei sua dúvida sobre " + 
                  (supportCategory === "Scraper" ? "limites operacionais de extração e status do Maps" : 
                   supportCategory === "Billing" ? "valores, recargas e sincronização via gateway Asaas" : "configurações das chaves da plataforma") + 
                  ". Como posso te ajudar detalhadamente agora?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 2000);
    }, 1200);
  };

  const handleSendSupportReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim()) return;
    
    const userMsg = {
      sender: "user",
      text: supportReplyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setSupportChatMessages((prev) => [...prev, userMsg]);
    setSupportReplyText("");

    setTimeout(() => {
      setSupportChatMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Excelente! Registramos essa informação. Nosso simulador e integrador já validaram o status da sua API. Tudo está operando perfeitamente agora.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1800);
  };

  const handleSimulateAsaas = () => {
    setIsSimulatingAsaas(true);
    addAsaasLog("info", `POST [Sandbox] https://api.asaas.com/v3/payments - Valor: R$ ${asaasSimAmount}`);
    
    setTimeout(() => {
      addAsaasLog("success", `Gateway: Cobrança criada. ID: pay_sim_${Math.random().toString(36).substring(7)}`);
    }, 1000);

    setTimeout(() => {
      addAsaasLog("incoming", `WEBHOOK: Disparando retorno do Asaas com status [${asaasSimStatus}]`);
    }, 2000);

    setTimeout(() => {
      if (asaasSimStatus === "APPROVED") {
        addAsaasLog("success", `PROCESSO: Pagamento Aprovado! 100% dos créditos aplicados no Firebase.`);
      } else if (asaasSimStatus === "PENDING") {
        addAsaasLog("warning", `PROCESSO: Aguardando pagamento PIX/Boleto pelo usuário.`);
      } else {
        addAsaasLog("error", `PROCESSO: Pagamento Recusado/Reembolsado.`);
      }
      setIsSimulatingAsaas(false);
    }, 3200);
  };

  const helpArticles = [
    {
      id: 1,
      title: "Como extrair leads sem site e vender LPs?",
      category: "Prospecção",
      content: "Muitos negócios no Google Maps possuem cadastro sem website associado. Com o AdsHive Prospect, ao buscar um nicho, filtramos as empresas marcadas como 'Sem site'. Você pode oferecer o serviço de criação de Landing Page ou Site Institucional de forma direcionada. Como diferencial, use nosso Copiloto IA ou Gerador de Relatório para criar uma proposta personalizada contendo dados reais.",
      tags: ["site", "maps", "leads", "lp"]
    },
    {
      id: 2,
      title: "O que é o Lead Score (Pontuação do Lead)?",
      category: "Inteligência",
      content: "O Lead Score é uma pontuação de 0 a 100 gerada pela nossa inteligência artificial para avaliar a propensão de compra e maturidade digital de um lead. Calculamos com base em múltiplos fatores: se a empresa possui site consolidado, se o domínio possui certificado SSL seguro, se tem perfil de Instagram ativo, se está rodando criativos de tráfego pago (Facebook/Instagram Ads) e presença de pixel de rastreamento.",
      tags: ["score", "pontuação", "ia", "pixel"]
    },
    {
      id: 3,
      title: "Como funciona o consumo e recarga de créditos?",
      category: "Financeiro",
      content: "Cada lead válido e verificado extraído com telefone real consome 1 crédito do seu saldo de conta. As pesquisas e visualizações preliminares não consomem créditos. Se o lead não possuir telefone válido, o crédito não é debitado de seu saldo. Você pode comprar recargas avulsas em nossa Loja com descontos progressivos.",
      tags: ["créditos", "planos", "recarga", "cobrança"]
    },
    {
      id: 4,
      title: "Qual a precisão dos dados do Google Maps?",
      category: "Tecnologia",
      content: "Os dados são extraídos em tempo real a partir de listagens públicas oficiais do Google Maps Brasil. Nossa IA cruza e valida estes dados em menos de 5 segundos, verificando se o site está online, o telefone possui WhatsApp ativo, o pixel do Meta está instalado e se existem campanhas ativas no momento.",
      tags: ["maps", "precisão", "segurança", "dados"]
    },
    {
      id: 5,
      title: "Segurança de dados e conformidade do Asaas?",
      category: "Financeiro",
      content: "Utilizamos o gateway oficial do Asaas em ambiente seguro para toda a liquidação de PIX e Cartões de Crédito. Seus dados de cartão são tokenizados diretamente e nunca passam por nossos servidores locais. As liberações ocorrem em termos de milissegundos via Webhooks automáticos do gateway de sandbox e produção.",
      tags: ["asaas", "pagamento", "sandbox", "pix", "cartão"]
    },
    {
      id: 6,
      title: "Como exportar leads e integrar com meu CRM?",
      category: "CRM & Exportação",
      content: "Ao acessar sua área restrita de trabalho, você pode exportar listas de leads diretamente para arquivos estruturados nos formatos .CSV ou Excel, ou enviá-los em um clique para o nosso painel Kanban CRM integrado, onde você pode arrastar os leads por colunas de prospecção e manter históricos de chamadas.",
      tags: ["crm", "exportar", "csv", "excel", "kanban"]
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Como Vender Sites de R$ 3.000 para Negócios do Google Maps",
      author: "Douglas Bateria (CEO)",
      date: "05 Junho, 2026",
      readingTime: "5 min de leitura",
      category: "Vendas",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
      excerpt: "Neste artigo, revelamos o roteiro operacional para identificar as melhores oportunidades de desenvolvimento web que não possuem site e fechar seus primeiros contratos lucrativos hoje mesmo.",
      content: `Prospectar empresas sem presença digital é a forma mais rápida de fechar projetos de criação de sites. No AdsHive, você conta com um filtro específico que aponta exatamente quais listagens do Google Maps não têm um domínio registrado.

## Passo a Passo para Vender Seu Primeiro Site:
1. **Identifique o Alvo Ideal**: Filtre por clínicas médicas, escritórios de advocacia, academias de crossfit ou marmorarias. Evite negócios muito pequenos que não têm faturamento para investir.
2. **Faça um Diagnóstico Rápido**: Clique no lead no AdsHive. Nossa inteligência gera um relatório em PDF mostrando que o cliente está perdendo em média 45% de conversões orgânicas apenas por não ter um site bem otimizado em SEO.
3. **Aborde com Valor, Não com Venda**: Envie uma mensagem pelo WhatsApp (preparada pelo nosso Copiloto IA) dizendo: "Olá! Notei que vocês são uma das mais conceituadas marmorarias de Campinas, mas as pessoas que buscam no Google hoje acabam caindo nos seus concorrentes porque sua ficha do Maps não tem um botão de site para orçamento rápido..."
4. **Feche com Escopo Claro**: Apresente uma proposta de Landing Page otimizada para mobile por R$ 2.900, com entrega em 10 dias. O design e o mapeamento fornecidos pelo AdsHive ajudam a justificar este valor desde o primeiro segundo.`
    },
    {
      id: 2,
      title: "Roteiro de WhatsApp de Alto Impacto para Prospecção Ativa",
      author: "Douglas Bateria (CEO)",
      date: "01 Junho, 2026",
      readingTime: "4 min de leitura",
      category: "Copywriting",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
      excerpt: "Chega de mensagens robóticas ignoradas. Aprenda a escrever mensagens de abordagem altamente personalizadas que geram respostas positivas em minutos.",
      content: `Se você envia textos longos oferecendo seus serviços de marketing na primeira mensagem, pare imediatamente. Ninguém gosta de receber panfletos de vendas no WhatsApp privado.

## A Estrutura da Abordagem Perfeita:
- **O Gancho**: Mencione algo real e específico sobre o negócio deles. Exemplo: "Olá, vi sua pizzaria no Google Maps..."
- **A Validação**: Elogie a reputação (estrelas, comentários) para abaixar as defesas do lead. Exemplo: "...e vi que vocês têm excelentes comentários de clientes."
- **O Problema Visualizado**: Aponte a falha técnica encontrada pelo AdsHive. Exemplo: "Notei que o Pixel do Facebook que vocês têm instalado no site está desconfigurado e gerando erros, o que faz seus anúncios de tráfego pago jogarem dinheiro fora."
- **O Solução Gratuita**: Ofereça uma dica sem cobrar nada. Exemplo: "Gravei um vídeo de 1 minuto mostrando como ajustar isso. Posso te enviar por aqui?"

Essa abordagem tem taxa de resposta média de 43%, pois ativa o gatilho de reciprocidade e autoridade comercial!`
    },
    {
      id: 3,
      title: "Entenda a LGPD e a Prospecção B2B de Fichas do Google Maps",
      author: "Depto Legal AdsHive",
      date: "28 Maio, 2026",
      readingTime: "6 min de leitura",
      category: "Transparência",
      image: "https://images.unsplash.com/photo-1505664194779-8bebcb95c557?w=600&auto=format&fit=crop&q=60",
      excerpt: "Descubra como permanecer 100% em conformidade com as leis gerais de proteção de dados no Brasil enquanto prospecta de forma ética e profissional.",
      content: `Existe muita dúvida se a prospecção ativa via telefone ou WhatsApp fere as regras da LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018). Reunimos o parecer do nosso conselho jurídico para tranquilizar as suas operações.

## 1. Dados Pessoais vs. Dados de Pessoas Jurídicas
A LGPD protege os dados de pessoas físicas identificadas ou identificáveis. As fichas públicas do Google Maps pertencem a pessoas jurídicas (B2B) e contêm dados de contato comercial de abrangência pública inseridos voluntariamente pelas próprias empresas para atendimento ao público em geral.

## 2. O Legítimo Interesse (Artigo 7º, IX)
A oferta de serviços de otimização comercial, criação de sites e tráfego pago baseia-se na base legal do **Legítimo Interesse** do controlador dos dados, visto que visa o fomento de faturamento e correção de perigos de segurança tecnológica da própria empresa do prospectado.`
    }
  ];

  // SEO tags and dynamic title rendering
  useEffect(() => {
    document.title = "AdsHive Prospect | Encontre Clientes com Inteligência Artificial";
    
    // Create keywords meta tag if missing or update it
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement("meta");
      descMeta.setAttribute("name", "description");
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute("content", "Descubra empresas, encontre leads qualificados, analise concorrentes, identifique quem anuncia e gere oportunidades usando IA. Ganhe 10 Leads Grátis ao criar sua conta.");

    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement("meta");
      keywordsMeta.setAttribute("name", "keywords");
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute("content", "leads, google maps, prospecção de clientes, empresas sem site, leads b2b, crm, inteligência artificial, google maps leads, prospecção automática, marketing digital, tráfego pago, seo local, empresas anunciando, meta ads, gestão comercial, agenda comercial, agendamento online, crm com agenda, google meet integrado, calendly alternativo, agenda para vendas, software de prospecção, crm para agências, crm para gestores de tráfego, crm para vendedores");
  }, []);

  const handleStartSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationStep(1);
    setSimulatedLeads([]);

    // Step 1: radar sweeping
    setTimeout(() => {
      setSimulationStep(2); // Examining Meta tags + SEO
    }, 1200);

    // Step 2: results rendering
    setTimeout(() => {
      setSimulationStep(3); // Displaying high target local leads
      setSimulatedLeads([
        {
          name: `${simNiche} Central de ${simCity.split(",")[0]}`,
          rating: 4.6,
          reviews: 94,
          hasWebsite: false,
          phone: "(31) 98845-6611",
          leadScore: 95,
          problem: "Sem site ou domínio registrado. Grande oportunidade de venda de Landing Page e Google Ads!"
        },
        {
          name: `${simNiche} Gourmet ${simCity.split(",")[0]}`,
          rating: 3.8,
          reviews: 24,
          hasWebsite: true,
          phone: "(31) 97711-2299",
          leadScore: 84,
          problem: "Site lento e sem pixel de anúncios do Meta/Facebook ativo. Chave para Gestão de Tráfego!"
        },
        {
          name: `Império do(a) ${simNiche}`,
          rating: 4.8,
          reviews: 132,
          hasWebsite: false,
          phone: "(31) 3411-8800",
          leadScore: 91,
          problem: "Altas avaliações orgânicas, mas perfil do Google Maps incompleto e sem site. Perda de clientes garantida."
        }
      ]);
    }, 2800);
  };

  const faqItems = [
    {
      q: "Como o AdsHive Prospect funciona?",
      a: "Nossa tecnologia se conecta aos canais públicos do Google Maps e algoritmos de auditoria sob demanda para escanear a região e o segmento escolhido. Identificamos as fraquezas comerciais exatas de cada empresa (ausência de site, falta de pixel de anúncios, redes inativas) para fornecer uma lista higienizada de leads prontos para receber propostas inteligentes."
    },
    {
      q: "Preciso de cartão de crédito?",
      a: "Não! O cadastro inicial é 100% gratuito e não exige nenhuma inserção de formas de pagamento. Você ganha 10 créditos de leads grátis imeditamente ao registrar sua conta para testar o potencial com liberação imediata."
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim. Nossos planos não possuem fidelidade ou multas de cancelamento. Você pode fazer alterações, cancelamentos ou downgrades de forma autônoma diretamente pelo seu painel financeiro a qualquer momento."
    },
    {
      q: "As empresas são reais?",
      a: "Sim, os leads são buscados e higienizados em tempo real diretamente de fontes ativas do Google Maps, garantindo telefones válidos, canais de contato reais e informações precisas para evitar desperdício de tempo e spam."
    },
    {
      q: "Posso pesquisar qualquer cidade?",
      a: "Com certeza! Nosso banco de cobertura nacional mapeia todos os 5.570 municípios do Brasil, desde grandes capitais metropolitanas até pequenas cidades e povoados do interior de cada estado."
    },
    {
      q: "Funciona para agências?",
      a: "Sim, é a ferramenta perfeita para agências de marketing digital, gestores de tráfego pago, assessores de vendas, freelancers e desenvolvedores. Ao apontar o erro digital exato de um negócio, você multiplica sua taxa de resposta de prospecção."
    },
    {
      q: "Posso vender sites usando a plataforma?",
      a: "Sim! Ao filtrar por 'Empresas sem site', você obtém empresas da sua região que faturam mas não têm presença digital. Oferecer criação de sites acompanhado de relatórios de auditoria gera o gancho perfeito para fechar vendas."
    },
    {
      q: "Posso vender tráfego pago?",
      a: "Sim. Nossa plataforma analisa em tempo real se os leads possuem pixel de rastreamento do Meta instalado ou se estão anunciando ativamente. Você foca seus esforços em empresas que já investem ou naquelas que precisam começar a investir."
    },
    {
      q: "Como funcionam os créditos?",
      a: "Cada lead desbloqueado consome um crédito. Você pode obter créditos mensais através da sua assinatura ou comprar pacotes avulsos de recarga sob demanda na nossa loja conforme sua equipe expande a prospecção."
    }
  ];

  const printsData: { [key: string]: { title: string; desc: string; mockContent: React.ReactNode } } = {
    dashboard: {
      title: "Dashboard Principal",
      desc: "Visão executiva de conversões, consumo de créditos, faturamento SaaS, gráficos de metas e progresso comercial consolidado.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-4 text-xs font-mono select-none">
          <div className="flex justify-between items-center bg-[#181822] p-2.5 rounded-lg border border-indigo-500/20">
            <span className="text-white font-bold flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4 text-indigo-400" /> Executive Dashboard</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">ONLINE</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#12121c] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Leads Hoje</span>
              <strong className="text-white text-sm">+247</strong>
            </div>
            <div className="bg-[#12121c] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Conversão</span>
              <strong className="text-indigo-400 text-sm">24.8%</strong>
            </div>
            <div className="bg-[#12121c] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Faturamento SaaS</span>
              <strong className="text-emerald-400 text-sm">R$ 14,890</strong>
            </div>
          </div>
          <div className="space-y-1 bg-[#12121c] p-2.5 rounded border border-slate-850">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>CRÉDITOS NA REDE</span>
              <span className="text-amber-400">82% USADO</span>
            </div>
            <div className="w-full bg-[#1e1e2d] h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[82%]"></div>
            </div>
          </div>
        </div>
      )
    },
    leads: {
      title: "Pesquisa de Leads",
      desc: "Audite e crie listas avançadas de qualquer cidade. Use tags para descobrir canais de WhatsApp, redes e ausência de domínios.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono select-none">
          <div className="flex gap-2">
            <div className="flex-1 bg-[#12121c] p-2 rounded border border-slate-750 text-slate-400 text-[10px] flex items-center justify-between">
              <span>Filtro: Odontologia em Curitiba, PR</span>
              <Search className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <button className="bg-indigo-600 text-white px-3.5 rounded text-[10px] font-bold">Buscar</button>
          </div>
          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            <div className="bg-[#12121c] p-2 rounded border border-slate-850 space-y-1">
              <div className="flex justify-between font-bold text-white text-[11px]">
                <span>Clínica Sorriso Curitiba</span>
                <span className="text-red-400 text-[9px] bg-red-400/10 px-1 rounded">Sem Site ⚠️</span>
              </div>
              <p className="text-[9px] text-slate-450">(41) 99912-3401 • Av. Getúlio Vargas</p>
            </div>
            <div className="bg-[#12121c] p-2 rounded border border-slate-850 space-y-1">
              <div className="flex justify-between font-bold text-white text-[11px]">
                <span>Implantes & Arte Dental</span>
                <span className="text-amber-400 text-[9px] bg-amber-400/10 px-1 rounded">Pixel Ausente ⚡</span>
              </div>
              <p className="text-[9px] text-slate-450">(41) 3224-8800 • Centro Civico</p>
            </div>
          </div>
        </div>
      )
    },
    analise: {
      title: "Análise Completa",
      desc: "Audite presença digital, avalie scores de SEO, teste velocidade de carregamento, e valide pixels de rastreamento de anúncios.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs font-mono select-none">
          <div className="border-b border-indigo-950 pb-2">
            <h5 className="font-bold text-indigo-400 text-[11px]">RELATÓRIO DE AUDITORIA DIGITAL</h5>
            <span className="text-slate-400 text-[10px]">Restaurante Sabor Mineiro Ltda</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#12121c] p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">SEO Score:</span>
              <strong className="text-rose-400">FALHO (35%)</strong>
            </div>
            <div className="bg-[#12121c] p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Meta Pixel:</span>
              <strong className="text-red-400">NÃO INSTALADO</strong>
            </div>
            <div className="bg-[#12121c] p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Velocidade:</span>
              <strong className="text-amber-400">LENTO (4.1s)</strong>
            </div>
            <div className="bg-[#12121c] p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">SSL Cripto:</span>
              <strong className="text-emerald-400">SEGURO</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 bg-indigo-500/10 p-2 rounded border border-indigo-500/20 italic">
            "Este negócio perde cerca de 45 de leads diários por tempo de carregamento lento no mobile."
          </p>
        </div>
      )
    },
    crm: {
      title: "CRM Kanban",
      desc: "Arrastar, soltar, classificar e agendar follow-up com clientes locais facilmente através de quadros comerciais ágeis.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono select-none">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <span className="text-[9px] bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold block text-center">SEM CONTATO</span>
              <div className="bg-[#12121c] p-1.5 rounded border border-slate-850 text-[10px] text-slate-300">
                <p className="font-bold text-white truncate">Churrasc. Sul</p>
                <span className="text-amber-400 block text-[8px]">Sem site</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold block text-center font-mono">PROPOSTA</span>
              <div className="bg-[#12121c] p-1.5 rounded border border-slate-850 text-[10px] text-slate-300">
                <p className="font-bold text-white truncate">Clínica Dr. Marcos</p>
                <span className="text-indigo-400 block text-[8px]">WhatsApp Copy</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold block text-center">FECHADO 🎉</span>
              <div className="bg-[#12121c] p-1.5 rounded border border-slate-850 text-[10px] text-slate-300 border-emerald-500/30">
                <p className="font-bold text-white truncate">Pizzaria Bella</p>
                <span className="text-emerald-400 block text-[8px]">Contrato Assinado</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    ai: {
      title: "AdsHive AI",
      desc: "Gere modelos poderosos de abordagem comercial contextualizados e copys validadas de alta resposta no WhatsApp.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-[11px] text-white font-bold border-b border-slate-850 pb-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> Co-piloto Comercial AdsHive AI
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase block">Modelo de Copy Copiado:</span>
            <div className="bg-[#12121c] p-2.5 rounded border border-slate-850 text-[10px] text-slate-300 leading-normal max-h-[100px] overflow-y-auto">
              Olá, Douglas! Vi sua ficha em Belo Horizonte com excelentes avaliações orgânicas. Notei que você ainda não tem um link de site integrado no Maps, o que faz os concorrentes captarem cerca de 15 chamadas a mais por dia de clientes que precisam urgente de Serralherias... Podemos falar rápido?
            </div>
          </div>
        </div>
      )
    },
    financeiro: {
      title: "Painel Financeiro",
      desc: "Visualize notas, boletos, histórico de transações de planos e conciliação de faturas do Asaas e Stripe em tempo real.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono select-none">
          <div className="flex justify-between items-center text-[10px] border-b border-slate-850 pb-2">
            <span className="font-bold text-indigo-400">FINANCIAL ANALYTICS</span>
            <span className="text-slate-400">Recorrente Mensal</span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between py-1 border-b border-slate-850/60">
              <span className="text-slate-400">Plano Starter (Id: e47)</span>
              <span className="text-emerald-400 font-bold">R$ 47.00 RECEIVED</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850/60">
              <span className="text-slate-400">Recarga 500 Leads</span>
              <span className="text-emerald-400 font-bold">R$ 90.00 CONFIRMED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Assinatura Premium Pro</span>
              <span className="text-emerald-400 font-bold">R$ 97.00 RECEIVED</span>
            </div>
          </div>
        </div>
      )
    },
    owner: {
      title: "Painel Owner System",
      desc: "Configurações avançadas do administrador do sistema, logs de telemetria, exclusão de usuários internos e backup do Firebase.",
      mockContent: (
        <div className="bg-[#0f0f16] border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs font-mono select-none">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <span className="font-bold text-rose-400">ADMINISTRADOR MASTER UNIFICADO</span>
            <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded">SISTEMA</span>
          </div>
          <div className="bg-[#12121c] p-2.5 rounded border border-slate-850 text-[10px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Filtro de Emails Internos:</span>
              <span className="text-indigo-400 font-bold">douglasbateri...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Logs do DB:</span>
              <span className="text-white">1,489 registros</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Firebase Backup:</span>
              <span className="text-emerald-400">SAUDÁVEL (Merge OK)</span>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div id="landing-root" className="min-h-screen bg-[#0A0A0F] text-slate-100 font-sans selection:bg-[#8B2DFF] selection:text-white overflow-x-hidden relative">
      
      {/* Dynamic Radar lines and background glow gradients of visual identity */}
      <div id="glow-bg-header" className="absolute top-0 inset-x-0 h-[650px] bg-gradient-to-b from-[#8B2DFF]/15 via-transparent to-transparent pointer-events-none"></div>
      <div id="glow-bg-sphere" className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#8B2DFF]/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Background Neon Accent grids */}
      <div className="absolute inset-x-0 top-0 h-[1000px] opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B2DFF" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>

      {/* STICKY HEADER NAVIGATION BAR */}
      <header id="landing-navigation" className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div id="landing-logo-block" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] flex items-center justify-center shadow-lg shadow-[#8B2DFF]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-white uppercase">
                AdsHive <span className="text-[#8B2DFF]">Prospect</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#A1A1AA] mt-0.5">INTELIGÊNCIA DE VENDAS</span>
            </div>
          </div>

          {/* Desktop Anchor navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-[#A1A1AA] tracking-wide select-none">
            <a href="#como-funciona" className="hover:text-white transition-colors cursor-pointer">Como Funciona</a>
            <a href="#diferenciais" className="hover:text-white transition-colors cursor-pointer">Diferenciais</a>
            <a href="#leads-sem-site" className="hover:text-white transition-colors cursor-pointer">Sem Website</a>
            <a href="#prints-da-plataforma" className="hover:text-white transition-colors cursor-pointer">Mockups</a>
            <a href="#agendar-reuniao" className="text-[#8B2DFF] hover:text-white transition-all font-extrabold flex items-center gap-1.5 cursor-pointer bg-[#8B2DFF]/10 px-2.5 py-1 rounded-lg border border-[#8B2DFF]/25">📅 Agende uma Reunião Empresarial!</a>
            <a href="#comparativo-planos" className="hover:text-white transition-colors cursor-pointer">Planos</a>
            <a href="#perguntas-frequentes" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">Dúvidas</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button 
              id="landing-btn-login"
              onClick={() => onNavigateToAuth('login')}
              className="text-xs font-extrabold text-slate-300 hover:text-white transition-all px-3 py-2 cursor-pointer"
            >
              Entrar
            </button>
            <button 
              id="landing-btn-register-top"
              onClick={() => onNavigateToAuth('register')}
              className="bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#8B2DFF]/25 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer uppercase tracking-tight"
            >
              Ganhar 10 Leads Grátis
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION DE ALTA CONVERSÃO */}
      <section id="landing-hero" className="relative max-w-7xl mx-auto pt-14 pb-20 md:pt-24 md:pb-28 px-4 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: value proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#8B2DFF]/15 border border-[#8B2DFF]/25 rounded-full text-xs font-black text-[#C026FF] tracking-wide animate-pulse">
                <span>⚡</span>
                <span className="uppercase">GANHE 10 LEADS GRÁTIS</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Encontre Clientes <br />
              <span className="bg-gradient-to-r from-[#8B2DFF] via-[#C026FF] to-white bg-clip-text text-transparent">
                Prontos Para Comprar
              </span> <br />
              em Qualquer Cidade do Brasil
            </h1>

            <p className="text-[#A1A1AA] text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              Descubra empresas, encontre negócios sem site, identifique quem anuncia no Google e Meta, analise concorrentes e gere oportunidades usando Inteligência Artificial.
            </p>

            {/* Direct CTA controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                id="hero-primary-cta"
                onClick={() => onNavigateToAuth('register')}
                className="w-full sm:w-auto bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white font-black text-sm px-8 py-4 rounded-xl shadow-xl shadow-[#8B2DFF]/30 hover:scale-[1.04] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group border-none"
              >
                <span>🚀 Ganhar 10 Leads Grátis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button 
                id="hero-secondary-cta"
                onClick={() => {
                  if (onExploreDemo) {
                    onExploreDemo();
                  } else {
                    document.getElementById("como-funciona")?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm px-7 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-300" />
                <span>▶ Ver Demonstração</span>
              </button>
            </div>

            {/* Observations / Proof indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-semibold text-[#A1A1AA] max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Check className="w-4 h-4 text-[#8B2DFF]" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Check className="w-4 h-4 text-[#8B2DFF]" />
                <span>Cadastro gratuito</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Check className="w-4 h-4 text-[#8B2DFF]" />
                <span>Liberação imediata</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Check className="w-4 h-4 text-[#8B2DFF]" />
                <span>10 Leads grátis integrados</span>
              </div>
            </div>
          </div>

          {/* Right Block: Live Simulator of Leads Extraction */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] opacity-25 blur-xl pointer-events-none"></div>
            
            <div className="relative bg-[#13131A] border border-slate-800 rounded-2xl p-5 space-y-4 text-left shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase font-bold tracking-wider">Mecanismo de IA AdsHive Simulator</span>
                </div>
                <span className="text-[9px] font-mono bg-[#8B2DFF]/10 text-[#C026FF] border border-[#8B2DFF]/20 px-2 py-0.5 rounded">V1.5 Live</span>
              </div>

              {/* Console parameter form */}
              <form onSubmit={handleStartSimulation} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Segmento</label>
                    <select 
                      value={simNiche}
                      onChange={(e) => setSimNiche(e.target.value)}
                      disabled={isSimulating}
                      className="w-full bg-[#0A0A0F] border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#8B2DFF] focus:outline-none focus:ring-1 focus:ring-[#8B2DFF]"
                    >
                      <option value="Dentista">🦷 Dentistas</option>
                      <option value="Advogado">⚖️ Advogados</option>
                      <option value="Padaria">🥖 Padarias</option>
                      <option value="Academia">💪 Academias</option>
                      <option value="Hamburgueria">🍔 Hamburguerias</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Cidade do Brasil</label>
                    <select 
                      value={simCity}
                      onChange={(e) => setSimCity(e.target.value)}
                      disabled={isSimulating}
                      className="w-full bg-[#0A0A0F] border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-[#8B2DFF] focus:outline-none focus:ring-1 focus:ring-[#8B2DFF]"
                    >
                      <option value="Campinas, SP">Campinas, SP</option>
                      <option value="Curitiba, PR">Curitiba, PR</option>
                      <option value="Belo Horizonte, MG">Belo Horizonte, MG</option>
                      <option value="Goiânia, GO">Goiânia, GO</option>
                      <option value="São Paulo, SP">São Paulo, SP</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-[#8B2DFF] hover:bg-[#5B21B6] disabled:bg-slate-800/80 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Extrair Oportunidades Grátis</span>
                </button>
              </form>

              {/* Console execution log terminal mockup */}
              <div className="min-h-[130px] bg-[#0A0A0F] border border-slate-850 p-4 rounded-xl flex flex-col justify-center relative font-mono text-[11px]">
                <AnimatePresence mode="wait">
                  {simulationStep === 0 && (
                    <div className="text-center text-[#A1A1AA] py-3 space-y-1">
                      <HelpCircle className="w-7 h-7 mx-auto text-slate-600 animate-pulse stroke-[1.5]" />
                      <p className="font-semibold text-xs">Configure o nicho e região acima e dispare o auditor em tempo real!</p>
                    </div>
                  )}

                  {simulationStep === 1 && (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-8 h-8 border-2 border-[#8B2DFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="font-bold text-slate-300">Buscando listagens ativas no Google Maps...</p>
                      <span className="text-[9px] text-[#A1A1AA] block">GET /maps/v2/prospect?niche={simNiche}</span>
                    </div>
                  )}

                  {simulationStep === 2 && (
                    <div className="text-center py-4 space-y-2">
                      <Globe className="w-7 h-7 text-[#C026FF] mx-auto animate-pulse" />
                      <p className="font-bold text-[#8B2DFF]">Auditando Website, SEO e tags de Meta Ads...</p>
                      <span className="text-[9px] text-slate-600 block">Parsing DNS records & Pixel tracers...</span>
                    </div>
                  )}

                  {simulationStep === 3 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[9px] font-extrabold text-[#C026FF] border-b border-slate-900 pb-1.5">
                        <span>3 NEGÓCIOS DE ALTO RETORNO MAPEADOS</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-mono">OK</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {simulatedLeads.map((lead, idx) => (
                          <div key={idx} className="bg-[#13131A] p-2.5 rounded-lg border border-slate-800 text-[10.5px] leading-tight flex justify-between items-start gap-2">
                            <div className="space-y-1 max-w-[75%]">
                              <h5 className="font-bold text-slate-100 truncate">{lead.name}</h5>
                              <p className="text-[9px] text-[#C026FF] font-semibold leading-relaxed">{lead.problem}</p>
                              <span className="text-slate-500 block text-[9px] font-mono">{lead.phone}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-amber-500 font-bold block">★ {lead.rating}</span>
                              <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded inline-block font-bold mt-1">SCORE: {lead.leadScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToAuth('register')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-none font-sans font-black mt-1.5 animate-pulse"
                      >
                        <span>Exportar estes Leads no Cadastro</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PROVA SOCIAL COM CONTADORES EXCELENTES */}
      <section id="landing-social-proof" className="bg-[#13131A] border-y border-slate-950 py-12 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-black tracking-widest text-[#8B2DFF] uppercase text-center mb-8 font-mono">
            Estatísticas operacionais e escala de dados no Brasil
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            {/* Counter 1 */}
            <div className="space-y-1">
              <strong className="block text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                +100.000
              </strong>
              <span className="text-xs font-bold text-slate-300 block">Empresas Analisadas</span>
              <p className="text-[10px] text-slate-500">Mapeamento dinâmico de tráfego</p>
            </div>

            {/* Counter 2 */}
            <div className="space-y-1">
              <strong className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] bg-clip-text text-transparent tracking-tight">
                +50.000
              </strong>
              <span className="text-xs font-bold text-slate-300 block">Leads Encontrados</span>
              <p className="text-[10px] text-slate-500">Prontos para contato imediato</p>
            </div>

            {/* Counter 3 */}
            <div className="space-y-1">
              <strong className="block text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                +5.570
              </strong>
              <span className="text-xs font-bold text-slate-300 block">Cidades Brasileiras</span>
              <p className="text-[10px] text-slate-500">100% dos municípios do Brasil</p>
            </div>

            {/* Counter 4 */}
            <div className="space-y-1">
              <strong className="block text-3xl sm:text-4xl font-extrabold text-[#C026FF] tracking-tight">
                +1.000.000
              </strong>
              <span className="text-xs font-bold text-slate-300 block">Pesquisas Realizadas</span>
              <p className="text-[10px] text-slate-500">Consultas de inteligência executadas</p>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO "COMO FUNCIONA" */}
      <section id="como-funciona" className="py-20 md:py-24 px-4 max-w-7xl mx-auto text-center space-y-14">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            PASSO A PASSO DA CONVERSÃO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Como Encontrar Clientes Prontos em Três Passos
          </h2>
          <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
            Nossa plataforma descomplica a mineração de dados comerciais, realizando auditorias automatizadas e entregando conexões ricas em segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 group hover:border-[#8B2DFF]/30 transition-all text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B2DFF]/10 text-[#C026FF] flex items-center justify-center border border-[#8B2DFF]/20 font-bold text-sm">
                01
              </div>
              <h4 className="text-base font-extrabold text-white uppercase tracking-wide">Passo 1: Escolha Cidade e Segmento</h4>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Insira qualquer atividade de negócio e o local desejado no Brasil para começar o mapeamento no Google Maps.
              </p>
            </div>
            
            <div className="bg-[#0A0A0F] p-3 rounded-lg border border-slate-900 space-y-1.5 font-mono text-[10px]">
              <span className="text-slate-500 uppercase tracking-widest block font-bold">Exemplos Populares:</span>
              <div className="space-y-1 text-slate-350 font-bold">
                <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#8B2DFF] rounded-full"></span> Dentistas em Campinas</p>
                <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#8B2DFF] rounded-full"></span> Advogados em Curitiba</p>
                <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#8B2DFF] rounded-full"></span> Padarias em Belo Horizonte</p>
                <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#8B2DFF] rounded-full"></span> Academias em Goiânia</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 group hover:border-[#8B2DFF]/30 transition-all text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B2DFF]/10 text-[#C026FF] flex items-center justify-center border border-[#8B2DFF]/20 font-bold text-sm">
                02
              </div>
              <h4 className="text-base font-extrabold text-white uppercase tracking-wide">Passo 2: A IA Analisa Automaticamente</h4>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Varremos e auditamos os detalhes de contato das listagens encontradas em busca de pontos fracos de marketing e vendas.
              </p>
            </div>

            <div className="bg-[#0A0A0F] p-3 rounded-lg border border-slate-900 space-y-1.5 text-[10px]">
              <span className="text-[#8B2DFF] uppercase tracking-widest block font-extrabold font-mono">Canais Investigados:</span>
              <div className="grid grid-cols-2 gap-1.5 text-slate-300 font-semibold font-sans">
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Google Maps</div>
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Website</div>
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Canal SEO</div>
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Redes Sociais</div>
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Concorrência</div>
                <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#C026FF]" /> Meta Ads</div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 group hover:border-[#8B2DFF]/30 transition-all text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B2DFF]/10 text-[#C026FF] flex items-center justify-center border border-[#8B2DFF]/20 font-bold text-sm">
                03
              </div>
              <h4 className="text-base font-extrabold text-white uppercase tracking-wide">Passo 3: Receba Oportunidades Reais</h4>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Obtenha o relatório consolidado higienizado acompanhado de copys de WhatsApp baseadas nos problemas identificados.
              </p>
            </div>

            <div className="bg-[#0A0A0F] p-3 rounded-lg border border-slate-900 space-y-1.5 text-[10px]">
              <span className="text-slate-500 uppercase tracking-widest block font-bold font-mono">Campos Entregues:</span>
              <div className="grid grid-cols-3 gap-1 text-[9.5px] text-slate-300 font-semibold font-sans">
                <span>📞 Telefone</span>
                <span>💬 WhatsApp</span>
                <span>🌐 Website</span>
                <span>📸 Instagram</span>
                <span>👥 Facebook</span>
                <span>🎯 Score</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO "DIFERENCIAIS" (8 cards modernos) */}
      <section id="diferenciais" className="py-20 bg-[#13131A]/30 border-y border-slate-950 px-4">
        <div className="max-w-7xl mx-auto space-y-14">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
              TECNOLOGIA DE PONTA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Os Diferenciais Para Você Escalar Sua Operação
            </h2>
            <p className="text-[#A1A1AA] text-xs sm:text-sm">
              Criamos uma suíte completa de prospecção munida com tudo o que há de mais moderno para encurtar seu funil e reter mais clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Diff 1 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <MapPin className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">Google Maps Inteligente</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Encontre empresas qualificadas em qualquer cidade ou microrregião do território brasileiro de forma minuciosa.
              </p>
            </div>

            {/* Diff 2 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <Sparkles className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">IA Comercial</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Nossos modelos de inteligência redigem abordagens de WhatsApp personalizadas focando na falha do lead.
              </p>
            </div>

            {/* Diff 3 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <LineChart className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">Análise de Concorrentes</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Extraia relatórios de posicionamento da concorrência direta do lead para enriquecer sua proposta.
              </p>
            </div>

            {/* Diff 4 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <Flame className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">Meta Ads Library</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Identifique em tempo real quem está veiculando campanhas pagas para focar em empresas ativas.
              </p>
            </div>

            {/* Diff 5 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <Database className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">CRM Integrado</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Gerencie todo o fluxo de prospecção do contato pós-filtro até o fechamento com quadros Kanban.
              </p>
            </div>

            {/* Diff 6 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <Globe className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">SEO Local</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Audite e identifique empresas que têm excelente tráfego local potencial, mas pecam no alcance orgânico.
              </p>
            </div>

            {/* Diff 7 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <ShieldCheck className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">Empresas Sem Site</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Filtre em dois cliques todos os estabelecimentos que carecem de uma página institucional profissional.
              </p>
            </div>

            {/* Diff 8 */}
            <div className="bg-[#13131A] p-5 rounded-xl border border-slate-900 hover:border-[#8B2DFF]/30 transition-all text-left space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#8B2DFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#8B2DFF]/10 transition-all"></div>
              <Target className="w-6 h-6 text-[#8B2DFF]" />
              <h5 className="font-bold text-white text-sm uppercase">Automação Comercial</h5>
              <p className="text-xs text-[#A1A1AA] font-semibold leading-relaxed">
                Integre filtros avançados e extração instantânea economizando horas de pesquisa manual diária da equipe.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO "EMPRESAS SEM SITE" (Symmetric Highlight Box) */}
      <section id="leads-sem-site" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#13131A] to-[#1a1a24] p-8 md:p-12 rounded-3xl border border-slate-850 relative overflow-hidden">
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#8B2DFF]/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <span className="text-[10px] font-black text-[#C026FF] bg-[#8B2DFF]/15 px-3 py-1 rounded font-mono uppercase tracking-widest inline-block">Mapeador de Gargalos Digitais</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Empresas Perdendo Clientes Todos os Dias</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Identifique negócios ativos na região da sua escolha que ainda não possuem um website profissional publicado. Esta é a brecha comercial perfeita para oferecer desenvolvimento de páginas, Landing Pages exclusivas, consultorias de SEO, tráfego ou inbound digital com taxa de fechamento recorde.
              </p>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('register')}
                  className="bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-[#8B2DFF]/20 hover:scale-103 active:scale-97 cursor-pointer uppercase transition-all border-none"
                >
                  Quero Encontrar Empresas Sem Site
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0A0A0F]/50 p-5 rounded-2xl border border-slate-800 text-left font-mono text-[11px] space-y-3 relative">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Simulador G Gás Curitiba</span>
              <div className="p-2.5 bg-red-400/5 rounded border border-red-500/10 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>Serralheria Primos</span>
                  <span className="text-red-400 text-[8px] bg-red-400/10 px-1 rounded">Sem Website ⚠️</span>
                </div>
                <p className="text-slate-400 text-[10px]">Identificado: Cadastro ativo no maps, faturamento médio e 1k visualizações mensais, porém sem site de destino.</p>
              </div>
              <div className="p-2.5 bg-emerald-500/5 rounded border border-emerald-500/10 space-y-1">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Advocacia Souza S/A</span>
                  <span className="text-emerald-400 text-[8px] bg-emerald-500/10 px-1 rounded">Website Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO "META ADS AUDIT" */}
      <section id="meta-ads-audit" className="py-20 bg-[#13131A]/20 border-y border-slate-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 bg-[#13131A] p-5 rounded-3xl border border-slate-900 space-y-3 text-left font-mono relative">
              <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#C026FF]/5 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                <div className="w-8 h-8 rounded-full bg-[#8B2DFF]/15 text-[#C026FF] flex items-center justify-center font-bold text-xs font-mono">X</div>
                <div>
                  <h6 className="text-[10px] uppercase font-bold text-white">Auditor Meta Ads Active</h6>
                  <span className="text-[8px] text-[#A1A1AA] tracking-widest block uppercase">Verificação em tempo real</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px]">
                <div className="p-2 bg-[#0A0A0F] rounded border border-indigo-950/40 flex justify-between items-center">
                  <span className="text-slate-300">Clínica Estética Campinas</span>
                  <span className="text-[#8B2DFF] font-bold">12 CAMPANHAS ATIVAS 🔥</span>
                </div>
                <div className="p-2 bg-[#0A0A0F] rounded border border-indigo-950/40 flex justify-between items-center">
                  <span className="text-slate-400">Pizzaria Napolitana Centro</span>
                  <span className="text-rose-400">PIXEL NÃO INSTALADO ⚠️</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5 text-left">
              <span className="text-[10px] font-black text-[#C026FF] bg-[#8B2DFF]/15 px-3 py-1 rounded font-mono uppercase tracking-widest inline-block">Anunciantes & Pixel Tracker</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Descubra Quem Está Investindo em Marketing</h2>
              <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed font-semibold">
                Veja de forma transparente quais empresas locais possuem campanhas ativas estruturadas no Meta Ads ou Google, e quais estão ignorando canais de aquisição paga. Ofereça serviços de tráfego precisos, auditando o pixel de rastreamento do site delas.
              </p>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('register')}
                  className="bg-transparent border-2 border-[#8B2DFF] text-[#C026FF] hover:bg-[#8B2DFF] hover:text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  Encontrar Empresas Anunciando
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO PRINTS DA PLATAFORMA (STUNNING INTERACTIVE MOCKUPS) */}
      <section id="prints-da-plataforma" className="py-20 max-w-7xl mx-auto px-4 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            EXPERIÊNCIA INTERNA DO USUÁRIO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore Por Dentro do Nosso Ecossistema
          </h2>
          <p className="text-[#A1A1AA] text-xs sm:text-sm">
            Clique nas abas abaixo para simular as telas e funcionalidades chave que você acessará logo após criar seu cadastro grátis.
          </p>
        </div>

        {/* Dynamic Mockup Tabs List */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-[#13131A] p-2 rounded-2xl border border-slate-900 max-w-4xl mx-auto relative z-10 overflow-x-auto">
          {Object.keys(printsData).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActivePrintTab(tabKey)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activePrintTab === tabKey 
                  ? "bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white shadow-md shadow-[#8B2DFF]/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40"
              }`}
            >
              {printsData[tabKey].title}
            </button>
          ))}
        </div>

        {/* Dynamic Display Board Frame */}
        <div className="max-w-4xl mx-auto relative bg-[#13131A] border border-slate-850 p-6 md:p-8 rounded-3xl space-y-6 text-left shadow-2xl overflow-hidden transition-all duration-300">
          <div className="absolute top-[-80px] left-[-80px] w-64 h-64 bg-[#8B2DFF]/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-1 flex-1">
              <span className="text-[9.5px] uppercase font-bold text-[#8B2DFF] tracking-wider font-mono">Recurso do Painel Principal</span>
              <h4 className="text-lg font-black text-white uppercase">{printsData[activePrintTab].title}</h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed font-semibold">{printsData[activePrintTab].desc}</p>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 bg-[#0A0A0F] border border-slate-850 px-2.5 py-1 rounded-lg font-mono text-[9px] text-slate-400">
              <div className="w-1.5 h-1.5 bg-[#8B2DFF] rounded-full animate-pulse"></div>
              <span>SIMULADOR ATIVO</span>
            </div>
          </div>

          {/* Interactive display render of mockup panel mockup */}
          <div className="bg-[#0A0A0F] rounded-2xl p-4 md:p-6 border border-slate-900 relative">
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full opacity-60"></span>
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full opacity-60"></span>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full opacity-60"></span>
            </div>
            <div className="mt-4">
              {printsData[activePrintTab].mockContent}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO "ADSHIVE AI COPILOT" */}
      <section id="adshive-ai-copilot" className="py-20 bg-[#13131A]/35 border-y border-slate-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Copy left */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-[10px] font-black text-[#C026FF] bg-[#8B2DFF]/15 px-3 py-1 rounded font-mono uppercase tracking-widest inline-block">Mecanismo de IA integrada</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Seu Copiloto Comercial com Inteligência Artificial</h2>
              <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed font-semibold">
                Nossos robôs comerciais não apenas buscam os dados, mas escrevem as abordagens para você focar no que importa: fechar e receber. Geramos roteiros precisos com apelo emocional e técnico baseados exatamente nas falhas encontradas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 text-xs text-slate-300 font-bold">
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Geração de Scripts WhatsApp</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Geração de E-mails</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Análise de Concorrentes</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Análise de Sites</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Análise de SEO</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4" /> Gerador de Propostas</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900 col-span-1 sm:col-span-2"><Check className="text-[#8B2DFF] w-4 h-4" /> Consultor Comercial IA Especialista</div>
              </div>
            </div>

            {/* Simulated IA interaction output */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] opacity-15 blur-2xl pointer-events-none"></div>
              <div className="relative bg-[#13131A] p-6 rounded-3xl border border-slate-850 space-y-4 text-left font-mono text-xs">
                
                <div className="flex justify-between items-center bg-[#0A0A0F] p-2.5 rounded border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">AdsHive AI v3.0 Engine</span>
                  <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[8px] px-1 rounded animate-pulse">PRONTO</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-[#0A0A0F] rounded-xl border border-slate-850 space-y-1">
                    <span className="text-[9px] text-[#A1A1AA] uppercase">Input: Solicitação do Usuário</span>
                    <p className="text-white text-[10.5px]">"Escreva um script de vendas de urgência focado para academia sem site em Goiânia."</p>
                  </div>

                  <div className="p-3 bg-[#8B2DFF]/10 rounded-xl border border-[#8B2DFF]/25 space-y-1">
                    <span className="text-[9.5px] text-[#C026FF] font-bold uppercase">Output da IA (WhatsApp Copy):</span>
                    <p className="text-slate-300 text-[10.5px] leading-relaxed">
                      "Olá, Equipe! Notei que vocês são a academia mais buscada na região leste, mas quando novos moradores buscam por 'WhatsApp Academias', acabam clicando no link direto do concorrente por falta de uma página rápida de matrículas e link de grade horária... Conseguimos alinhar uma correção grátis?"
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO "NUNCA MAIS ESQUEÇA UM LEAD" */}
      <section id="agenda-e-reunioes" className="py-20 max-w-7xl mx-auto px-4 text-center space-y-14">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            ORGANIZAÇÃO COMERCIAL COMPLETA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Nunca Mais Esqueça Um Lead
          </h2>
          <p className="text-[#A1A1AA] text-xs sm:text-sm">
            Gerencie contatos, reuniões, follow-ups e oportunidades em um único lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Card 1: Agenda Comercial */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 hover:border-slate-850 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#8B2DFF]/10 border border-[#8B2DFF]/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#8B2DFF]" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">📅</span> Agenda Comercial
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Organize reuniões, ligações e compromissos com seus prospects.
            </p>
          </div>

          {/* Card 2: Reuniões Integradas */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 hover:border-slate-850 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#C026FF]/10 border border-[#C026FF]/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-[#C026FF]" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">📹</span> Reuniões Integradas
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Crie e participe de reuniões por vídeo diretamente na plataforma.
            </p>
          </div>

          {/* Card 3: Lembretes Inteligentes */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 hover:border-slate-850 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🔔</span> Lembretes Inteligentes
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Receba alertas automáticos para follow-ups e negociações.
            </p>
          </div>

          {/* Card 4: IA Comercial */}
          <div className="bg-[#13131A] p-6 rounded-2xl border border-slate-900 hover:border-slate-850 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🤖</span> IA Comercial
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              A IA identifica oportunidades e sugere os próximos passos.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO "PÁGINA INICIAL PARA TESTE" */}
      <section id="calendly-integrado" className="py-20 bg-[#13131A]/35 border-y border-slate-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Block */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-[10px] font-black text-[#C026FF] bg-[#8B2DFF]/15 px-3 py-1 rounded font-mono uppercase tracking-widest inline-block">Plataforma Interativa</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Página Inicial para Testes de Prospecção</h2>
              <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed font-semibold">
                Nossos cadastros são direcionados exclusivamente a empresas PJ estruturadas. Para que você possa validar todas as nossas ferramentas de inteligência, disponibilizamos uma simulação da nossa tela inicial com créditos fictícios de teste.
              </p>

              <div className="bg-[#0A0A0F] p-4 rounded-xl border border-slate-850 flex items-center justify-between font-sans">
                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
                  <Play className="w-4 h-4 text-[#8B2DFF]" />
                  <span className="text-slate-400">ambiente-sandbox.adshive.online/</span>
                  <span className="text-white font-extrabold">test-drive-pj</span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">Liberado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 text-xs text-slate-350 font-bold">
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4 shrink-0" /> Simulador de Busca Ativo</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4 shrink-0" /> Visualização de Extratos de Custos</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4 shrink-0" /> Copiloto IA Liberado de Imediato</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900"><Check className="text-[#8B2DFF] w-4 h-4 shrink-0" /> Exportações e CRM Ativos</div>
                <div className="flex items-center gap-2 bg-[#13131A] p-2.5 rounded-lg border border-slate-900 col-span-1 sm:col-span-2"><Check className="text-[#8B2DFF] w-4 h-4 shrink-0" /> Dashboard Gerencial Completo</div>
              </div>
            </div>

            {/* Right Block */}
            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] opacity-15 blur-2xl pointer-events-none"></div>
              <div className="relative bg-[#0F0F16] p-5 rounded-3xl border border-slate-800 space-y-4 text-left font-sans">
                
                {/* Header Mockup */}
                <div className="flex justify-between items-center bg-[#13131F] p-3 rounded-2xl border border-indigo-950/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">PJ</div>
                    <div>
                      <h4 className="text-xs font-black text-white font-sans">AdsHive Prospect B2B</h4>
                      <p className="text-[9px] text-[#A1A1AA] font-semibold flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        Ambiente de Teste Comercial Autenticado
                      </p>
                    </div>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[8.5px] px-2.5 py-1 rounded-lg border border-indigo-500/15">
                    10 CRÉDITOS FREE
                  </span>
                </div>

                {/* Dashboard Stats Cards Mockup */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#12121C] p-3 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[8.5px] font-black text-slate-500 uppercase block tracking-wider font-mono">Leads Prospectados</span>
                    <strong className="text-base text-white block font-mono">1.340 <span className="text-[10px] text-emerald-400 font-normal font-sans">+18%</span></strong>
                    <div className="w-full bg-[#1A1A26] h-1 rounded-full overflow-hidden">
                      <div className="bg-[#8B2DFF] h-full w-[65%]"></div>
                    </div>
                  </div>

                  <div className="bg-[#12121C] p-3 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[8.5px] font-black text-slate-500 uppercase block tracking-wider font-mono">Mensagens Enviadas</span>
                    <strong className="text-base text-white block font-mono">482 <span className="text-[10px] text-indigo-400 font-normal font-sans">SDR IA</span></strong>
                    <div className="w-full bg-[#1A1A26] h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[80%]"></div>
                    </div>
                  </div>

                  <div className="bg-[#12121C] p-3 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[8.5px] font-black text-slate-500 uppercase block tracking-wider font-mono">Pesquisas Disponíveis</span>
                    <strong className="text-base text-emerald-400 block font-mono">Ilimitado</strong>
                    <span className="text-[8px] text-slate-400 font-sans">Google Maps Ativo</span>
                  </div>

                  <div className="bg-[#12121C] p-3 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[8.5px] font-black text-slate-500 uppercase block tracking-wider font-mono">Taxa de Conversão</span>
                    <strong className="text-base text-amber-400 block font-mono">24.6%</strong>
                    <span className="text-[8px] text-slate-400 font-sans">Lembretes Automáticos</span>
                  </div>
                </div>

                {/* Quick Action Mockup Input */}
                <div className="bg-[#13131F] p-3 rounded-2xl border border-slate-900 space-y-2">
                  <span className="text-[9px] font-black text-[#C026FF] uppercase tracking-wider block font-mono">⚡ Teste Rápido de Prospecção</span>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#0A0A0F] py-2 px-3 rounded-xl border border-slate-900 text-slate-400 text-[10px] flex items-center justify-between font-mono">
                      <span>Ex: Contabilidade em São Paulo</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => onNavigateToAuth("register")}
                      className="bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white font-extrabold text-[10px] px-3.5 rounded-xl cursor-pointer hover:shadow-md hover:shadow-[#8B2DFF]/20 transition-all border-none"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {/* Call To Action button on mockup to run the demo */}
                <button
                  type="button"
                  onClick={() => onNavigateToAuth("register")}
                  className="w-full bg-[#1A1A2B] hover:bg-[#25253D] text-white font-extrabold text-[11px] py-2.5 rounded-xl text-center cursor-pointer transition-all border border-[#8B2DFF]/20 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 inline" />
                  <span>Cadastrar Empresa e Iniciar Teste Grátis</span>
                </button>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PLANOS SAAS RECORRENTE COMPARATIVOS */}
      <section id="comparativo-planos" className="py-20 max-w-7xl mx-auto px-4 text-center space-y-14">
        
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            PLANOS EXCLUSIVOS ADSHIVE PROSPECT
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Escolha o Plano Perfeito Para o Seu Faturamento
          </h2>
          <p className="text-[#A1A1AA] text-xs sm:text-sm">
            Temos planos sob medida para desenvolvedores iniciantes, freelancers, agências digitais e grandes empresas comerciais.
          </p>
        </div>

        {/* Pricing Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 text-left">
          
          {/* Plan 1: Free */}
          <div className="bg-[#13131A] p-5 rounded-2xl border border-slate-900 space-y-5 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#A1A1AA] tracking-widest block font-mono">Iniciante</span>
                <h4 className="text-base font-extrabold text-white uppercase mt-1">Plano Free</h4>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-400">R$</span>
                <span className="text-4xl font-black text-white tracking-tight">0</span>
              </div>

              <ul className="text-xs text-slate-350 space-y-2.5 font-semibold font-sans border-t border-slate-905 pt-4">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 10 Leads por mês</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Pesquisa básica</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> CRM básico</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 20 mensagens IA/mês</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full bg-[#0A0A0F] border border-slate-855 text-slate-350 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-all cursor-pointer border-none font-sans"
            >
              Começar Grátis
            </button>
          </div>

          {/* Plan 2: Starter */}
          <div className="bg-[#13131A] p-5 rounded-2xl border border-slate-900 space-y-5 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block font-mono font-bold">Profissional</span>
                <h4 className="text-base font-extrabold text-white mt-1 uppercase">Starter</h4>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#A1A1AA]">R$</span>
                <span className="text-4xl font-black text-white tracking-tight">47</span>
                <span className="text-slate-400 text-xs font-bold">/mês</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-2.5 font-semibold font-sans border-t border-slate-905 pt-4">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 100 Leads por mês</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> CRM completo</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Agenda Comercial</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Lembretes automáticos</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 200 mensagens IA/mês</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer font-sans"
            >
              Assinar Starter
            </button>
          </div>

          {/* Plan 3: Pro (Highlighted Glow Card) */}
          <div className="bg-[#13131A] p-5 rounded-2xl border-2 border-[#8B2DFF] space-y-5 flex flex-col justify-between relative shadow-2xl shadow-[#8B2DFF]/15">
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap shadow flex items-center gap-1">
              <span>⭐</span> MAIS POPULAR
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#C026FF] tracking-widest block font-mono font-bold">Crescimento</span>
                <h4 className="text-base font-extrabold text-white mt-1 uppercase">Plano Pro</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-tight mt-1.5">
                  Ideal para agências, gestores de tráfego, web designers e consultores.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#C026FF]">R$</span>
                <span className="text-4xl font-black text-white tracking-tight">97</span>
                <span className="text-slate-400 text-xs font-bold">/mês</span>
              </div>

              <ul className="text-xs text-slate-200 space-y-2.5 font-bold font-sans border-t border-[#8B2DFF]/20 pt-4">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 500 Leads por mês</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Agenda Comercial</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Google Meet integrado</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Calendário avançado</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Follow-up inteligente</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> CRM avançado</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 1.000 mensagens IA/mês</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white text-xs font-black py-3 rounded-xl hover:opacity-90 transition-all cursor-pointer border-none shadow-md shadow-[#8B2DFF]/20 font-sans"
            >
              Assinar Pro
            </button>
          </div>

          {/* Plan 4: Agency */}
          <div className="bg-[#13131A] p-5 rounded-2xl border border-slate-900 space-y-5 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-450 tracking-widest block font-mono">Corporativo</span>
                <h4 className="text-base font-extrabold text-white mt-1 uppercase">Agency</h4>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#A1A1AA]">R$</span>
                <span className="text-4xl font-black text-white tracking-tight">197</span>
                <span className="text-slate-400 text-xs font-bold">/mês</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-2.5 font-semibold font-sans border-t border-slate-900 pt-4">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 2.000 Leads por mês</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Calendly interno</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Equipe multiusuário</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Automações avançadas</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> CRM completo</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> 5.000 mensagens IA/mês</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer font-sans"
            >
              Assinar Agency
            </button>
          </div>

          {/* Plan 5: Enterprise */}
          <div className="bg-[#13131A] p-5 rounded-2xl border border-slate-900 space-y-5 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-450 tracking-widest block font-mono">Customizado</span>
                <h4 className="text-base font-extrabold text-white mt-1 uppercase">Enterprise</h4>
              </div>

              <div className="py-2.5">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent block tracking-wide uppercase font-black">Sob Consulta</span>
              </div>

              <ul className="text-xs text-slate-300 space-y-2.5 font-semibold font-sans border-t border-slate-900 pt-4">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Usuários ilimitados</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Leads personalizados</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Calendly interno</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> API exclusiva</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> IA personalizada</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#8B2DFF] shrink-0" /> Suporte prioritário</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full bg-[#0A0A0F] border border-slate-800 text-[#8B2DFF] text-xs font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-all cursor-pointer font-sans"
            >
              Falar com Especialista
            </button>
          </div>

        </div>
      </section>

      {/* SEÇÃO "COMPRA DE CRÉDITOS AVULSO" */}
      <section id="compra-creditos" className="py-20 bg-[#13131A]/30 border-y border-slate-950 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-3">
            <span className="text-[#C026FF] uppercase font-mono text-[10px] tracking-widest font-black block">RECARGAS ADICIONAIS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Precisa de Mais Leads?</h2>
            <p className="text-[#A1A1AA] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Você pode recarregar seus créditos de leads a qualquer hora diretamente na nossa loja avulsa sem taxas adicionais de assinatura.
            </p>
          </div>

          {/* Interactive Calculator Slider slider or display list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            
            {/* Combo 1 */}
            <button 
              type="button" 
              onClick={() => setCreditAmount(100)}
              className={`p-5 rounded-2xl border text-left space-y-3.5 transition-all cursor-pointer relative ${
                creditAmount === 100 ? "border-[#8B2DFF] bg-[#8B2DFF]/5 shadow-lg shadow-[#8B2DFF]/10" : "border-slate-850 bg-[#13131A]"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-extrabold text-sm uppercase">100 Leads</span>
                <span className="text-[#A1A1AA] text-[10px] font-mono">Básico</span>
              </div>
              <strong className="text-2xl font-black text-white block">R$ 20</strong>
              <span className="text-[10px] text-slate-500 block font-sans">Preço Unitário: R$ 0,20 / Lead</span>
            </button>

            {/* Combo 2 */}
            <button 
              type="button" 
              onClick={() => setCreditAmount(500)}
              className={`p-5 rounded-2xl border text-left space-y-3.5 transition-all cursor-pointer relative ${
                creditAmount === 500 ? "border-[#8B2DFF] bg-[#8B2DFF]/5 shadow-lg shadow-[#8B2DFF]/10" : "border-slate-850 bg-[#13131A]"
              }`}
            >
              <div className="absolute top-2 right-2 bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white text-[7.5px] font-black px-2 py-0.5 rounded-full">POPULAR</div>
              <div className="flex justify-between items-center">
                <span className="text-white font-extrabold text-sm uppercase">500 Leads</span>
                <span className="text-[#8B2DFF] text-[10px] font-mono font-bold">Mais Vendido</span>
              </div>
              <strong className="text-2xl font-black text-white block">R$ 90</strong>
              <span className="text-[10px] text-slate-550 block font-sans">Preço Unitário: R$ 0,18 / Lead</span>
            </button>

            {/* Combo 3 */}
            <button 
              type="button" 
              onClick={() => setCreditAmount(1000)}
              className={`p-5 rounded-2xl border text-left space-y-3.5 transition-all cursor-pointer relative ${
                creditAmount === 1000 ? "border-[#8B2DFF] bg-[#8B2DFF]/5 shadow-lg shadow-[#8B2DFF]/10" : "border-slate-850 bg-[#13131A]"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-extrabold text-sm uppercase">1.000 Leads</span>
                <span className="text-emerald-400 text-[10px] font-mono">Melhor Custo</span>
              </div>
              <strong className="text-2xl font-black text-white block">R$ 170</strong>
              <span className="text-[10px] text-slate-500 block font-sans">Preço Unitário: R$ 0,17 / Lead</span>
            </button>

          </div>

          <div className="flex items-center justify-center pt-2">
            <button 
              type="button"
              onClick={() => onNavigateToAuth('register')}
              className="bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white text-xs font-black px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:scale-103 active:scale-97 cursor-pointer uppercase border-none"
            >
              Comprar Recarga de {creditAmount} Leads
            </button>
          </div>
        </div>
      </section>

      {/* COMPACT PERGUNTAS FREQUENTES (FAQ ACCORDIONS) */}
      <section id="perguntas-frequentes" className="py-20 max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            CENTRAL DE AJUDA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-[#A1A1AA] text-xs sm:text-sm">
            Tire suas principais dúvidas sobre o funcionamento, créditos, extração e segurança do AdsHive Prospect.
          </p>
        </div>

        {/* FAQs list accordion layout */}
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div 
              key={idx} 
              id={`faq-item-${idx}`} 
              className="bg-[#13131A] border border-slate-900 rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 text-left text-[#A1A1AA] hover:text-white font-semibold text-xs sm:text-sm cursor-pointer border-none bg-transparent"
              >
                <span className="font-bold">{item.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform text-[#8B2DFF] shrink-0 ${openFaqIndex === idx ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {openFaqIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-950 font-sans"
                  >
                    <p className="p-4 text-xs text-slate-405 leading-relaxed text-slate-400 font-medium">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER FINAL */}
      <section id="cta-banner-final" className="py-20 px-4 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-[#13131A] via-[#1a1a24] to-[#13131A] p-8 md:p-12 rounded-3xl border-2 border-[#8B2DFF] text-center space-y-6 relative overflow-hidden shadow-2xl shadow-[#8B2DFF]/15">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B2DFF]/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Prospecte, Agende e Feche Clientes Sem Sair da Plataforma</h2>
            <p className="text-[#A1A1AA] text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              Encontre empresas, organize seu funil, agende reuniões e feche mais contratos usando inteligência artificial.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="w-full sm:w-auto bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white font-black text-sm px-10 py-4.5 rounded-xl shadow-xl shadow-[#8B2DFF]/35 hover:scale-104 active:scale-97 cursor-pointer transition-all uppercase tracking-wider border-none text-center font-sans font-bold"
            >
              🚀 Ganhar 10 Leads Grátis
            </button>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest font-mono">
              Sem cartão de crédito • liberação imediata ao cadastrar
            </span>
          </div>
        </div>
      </section>

      {/* PIXEL COMPLIANT FOOTER */}
      <footer id="landing-footer" className="bg-[#0A0A0F]/85 border-t border-slate-900 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] flex items-center justify-center font-bold text-white text-xs">A</div>
              <strong className="text-slate-100 uppercase tracking-tight text-sm font-black text-white">AdsHive Prospect</strong>
            </div>
            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              A melhor e mais veloz inteligência SaaS de prospecção e mineração comercial ativa de negócios do Brasil. Mapeie e converta leads locais com facilidade usando IA.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <h6 className="font-extrabold text-white text-[11px] uppercase tracking-wider font-mono">Produto</h6>
            <div className="flex flex-col gap-2 text-slate-400 font-semibold font-sans">
              <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
              <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
              <a href="#comparativo-planos" className="hover:text-white transition-colors">Planos de Acesso</a>
              <a href="#compra-creditos" className="hover:text-white transition-colors">Recargas de Leads</a>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <h6 className="font-extrabold text-[#8B2DFF] text-[11px] uppercase tracking-wider font-mono">Legal & Transparência</h6>
            <div className="flex flex-col gap-2 text-[#A1A1AA] font-semibold font-sans">
              <button type="button" onClick={() => setActiveLegalTab('terms')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Termos de Uso</button>
              <button type="button" onClick={() => setActiveLegalTab('privacy')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Política de Privacidade</button>
              <button type="button" onClick={() => setActiveLegalTab('security')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Segurança dos Dados</button>
              <button type="button" onClick={() => setActiveLegalTab('asaas')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Sandbox Asaas Gateway</button>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <h6 className="font-extrabold text-[#C026FF] text-[11px] uppercase tracking-wider font-mono">Contato & Suporte</h6>
            <div className="flex flex-col gap-2 text-[#A1A1AA] font-semibold font-sans">
              <button type="button" onClick={() => setActiveLegalTab('contact')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Contato Comercial</button>
              <button type="button" onClick={() => setActiveLegalTab('support')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Suporte Técnico</button>
              <button type="button" onClick={() => setActiveLegalTab('help')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Central de Ajuda</button>
              <button type="button" onClick={() => setActiveLegalTab('blog')} className="text-left bg-transparent border-none text-[#A1A1AA] hover:text-white transition-all p-0 cursor-pointer text-xs font-semibold">Blog Oficial AdsHive</button>
            </div>
          </div>

        </div>

      </footer>

      {/* DETAILED LEGAL, TRANSPARENCY & SUPPORT MODAL OVERLAY */}
      <AnimatePresence>
        {activeLegalTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/90 backdrop-blur-sm p-3 sm:p-5 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0B0B0F] border border-slate-900 w-full max-w-6xl h-[92vh] sm:h-[85vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
            >
              {/* Close Button Mobile/Desktop */}
              <button
                type="button"
                onClick={() => {
                  setActiveLegalTab(null);
                  setActiveHelpArticle(null);
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800 p-2 rounded-xl transition-all cursor-pointer z-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Sidebar Navigation */}
              <div className="w-full md:w-72 bg-[#0E0E14] border-b md:border-b-0 md:border-r border-slate-900/80 p-5 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
                <div className="space-y-6">
                  {/* Branding in Modal Header */}
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-900">
                    <div className="w-6 h-6 rounded-lg bg-[#8B2DFF] flex items-center justify-center font-bold text-white text-[10px]">A</div>
                    <div>
                      <strong className="text-white text-xs uppercase block font-black">AdsHive Prospect</strong>
                      <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-widest font-mono">Central de Transparência</span>
                    </div>
                  </div>

                  {/* Group 1: Legal & Transparência */}
                  <div className="space-y-2">
                    <h5 className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest font-mono pl-1">Legal & Transparência</h5>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("terms"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "terms" ? "bg-[#8B2DFF]/15 text-[#C026FF] border-[#8B2DFF]/25" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Termos de Uso</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("privacy"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "privacy" ? "bg-[#8B2DFF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Política de Privacidade</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("security"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "security" ? "bg-[#8B2DFF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Segurança dos Dados</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("asaas"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "asaas" ? "bg-[#8B2DFF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sandbox Asaas Gateway</span>
                      </button>
                    </div>
                  </div>

                  {/* Group 2: Contato & Suporte */}
                  <div className="space-y-2">
                    <h5 className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest font-mono pl-1">Contato & Suporte</h5>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("contact"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "contact" ? "bg-[#C026FF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Contato Comercial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("support"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "support" ? "bg-[#C026FF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Suporte Técnico</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("help"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "help" ? "bg-[#C026FF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Central de Ajuda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setActiveLegalTab("blog"); setActiveHelpArticle(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-all text-left border-none cursor-pointer ${
                          activeLegalTab === "blog" ? "bg-[#C026FF]/15 text-[#C026FF]" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Blog Oficial AdsHive</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar footer information */}
                <div className="hidden md:block pt-4 border-t border-slate-900 text-[10px] text-slate-500 font-bold space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Firebase Firestore Conectado</span>
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600 pl-3">SLA global: 99.98%</p>
                </div>
              </div>

              {/* Main Scrollable Content Panel */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0B0B0F] relative flex flex-col justify-between">
                
                {/* Scroll body content based on active legal tab */}
                <div className="space-y-6">

                  {/* 1. TERMOS DE USO CONTENT */}
                  {activeLegalTab === "terms" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#8B2DFF]/10 text-[#C026FF] border border-[#8B2DFF]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          DOCUMENTO LEGAL OFICIAL
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Termos de Uso do Serviço</h2>
                        <p className="text-xs text-slate-500 font-mono font-bold">Última atualização: 06 de Junho de 2026</p>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed font-semibold">
                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">1. Objeto do Serviço</h4>
                          <p>
                            O AdsHive Prospect ("Plataforma") é um software de inteligência comercial focado na agregação, higienização, auditoria sob demanda e formatação de listagens públicas brasileiras disponibilizadas abertamente no ecossistema Google Maps. Os serviços visam conectar empresas de marketing local a clientes potenciais corporativos (B2B) de forma ágil e otimizada.
                          </p>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">2. Uso Permitido e LGPD</h4>
                          <p>
                            Como a Plataforma opera exclusivamente com dados empresariais de caráter público e comercial (pessoas jurídicas), as atividades de prospecção sustentam-se no Artigo 7º, inciso IX, da Lei Geral de Proteção de Dados (Legítimo Interesse do Controlador). É expressamente proibida a utilização de quaisquer dados extraídos na plataforma para atos criminosos, assédios, ameaças online ou envio em massa de spam abusivo que infrinja os canais dos destinatários.
                          </p>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">3. Sistema de Créditos e Cobrança</h4>
                          <p>
                            A Plataforma funciona sob modelo de assinatura mensal cumulada com recargas avulsas opcionais de créditos de leads. Cada crédito equivale a um lead qualificado revelado com os respectivos dados válidos de contato de WhatsApp/telefone. Leads marcados como inoperantes tecnologicamente pelo nosso sistema não debitam de seu saldo operacional de conta comercial.
                          </p>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">4. Sandbox de Segurança Integrada</h4>
                          <p>
                            Para fins de testes transparentes de faturamento operados pela agência usuária, disponibilizamos um ambiente transparente de Sandbox do Asaas Gateway. Toda a comunicação do gateway ocorre por criptografia simétrica com conformidade às diretrizes de privacidade locais.
                          </p>
                        </section>
                      </div>
                    </div>
                  )}

                  {/* 2. POLÍTICA DE PRIVACIDADE CONTENT */}
                  {activeLegalTab === "privacy" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#8B2DFF]/10 text-[#C026FF] border border-[#8B2DFF]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          GARANTIA DE PRIVACIDADE
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Política de Privacidade</h2>
                        <p className="text-xs text-slate-500 font-mono font-bold">Vigência a partir de: Junho de 2026</p>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed font-semibold">
                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">1. Coleta e Finalidade de Dados Do Usuário</h4>
                          <p>
                            Coletamos seu nome profissional, endereço de e-mail e dados de contato para fins exclusivos de criação da sua conta no AdsHive, liberação segura do painel administrativo de prospecção e envio de comunicados transacionais essenciais (como faturamento ou relatórios automatizados). 
                          </p>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">2. Não Comercialização de Informações</h4>
                          <p>
                            O AdsHive Prospect assume o compromisso irrevogável de nunca revender, compartilhar, alugar ou dispersar dados confidenciais dos usuários que prospectam, bem como seus cadastros e notas internas do CRM para terceiros não autorizados. Seus dados cadastrais permanecem seguros em nosso banco estruturado no Firebase.
                          </p>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-white text-sm font-black uppercase tracking-wide">3. Segurança Financeira e Protocolos Gateway</h4>
                          <p>
                            As transações financeiras, sejam cartões ou PIX, são processadas integralmente nos servidores do Asaas Gateway, em conformidade estrita com os padrões mais robustos do PCI Compliance. Nossos repositórios não retêm números e códigos de tokens de segurança bancária.
                          </p>
                        </section>
                      </div>
                    </div>
                  )}

                  {/* 3. SEGURANÇA DOS DADOS CONTENT */}
                  {activeLegalTab === "security" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          INFRAESTRUTURA BLINDADA
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Segurança dos Dados & Conformidade</h2>
                        <p className="text-xs text-slate-500 font-mono font-bold">Relatórios técnicos integrados com o ecossistema Google Cloud</p>
                      </div>

                      <div className="space-y-5">
                        <p className="text-xs leading-relaxed font-semibold">
                          No AdsHive, mitigamos qualquer risco de vazamentos digitais utilizando o estado-da-arte em engenharia de infraestrutura de nuvem moderna brasileira.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-[#13131A] p-4 rounded-xl border border-slate-900 space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5 text-indigo-400">
                              <span>🛡️</span> Criptografia de Ponta a Ponta
                            </h4>
                            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                              Toda troca de pacotes de dados de sua conta comercial do Maps é protegida utilizando o protocolo TLS 1.3 em trânsito e criptografada com chaves padrão AES-256 em repouso no Firebase Firestore.
                            </p>
                          </div>

                          <div className="bg-[#13131A] p-4 rounded-xl border border-slate-900 space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5 text-indigo-400">
                              <span>🔄</span> Backup Cloud Automatizado
                            </h4>
                            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                              Nossa arquitetura executa snapshots completos de segurança incremental a cada 12 horas. Garantindo recuperação ágil sem risco de perda de contatos de CRM salvos.
                            </p>
                          </div>

                          <div className="bg-[#13131A] p-4 rounded-xl border border-slate-900 space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5 text-[#C026FF]">
                              <span>🔐</span> Tokenização Financeira Asaas
                            </h4>
                            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                              Zero armazenamento de credenciais financeiras confidenciais locais. Todos os fluxos bancários convertem-se diretamente em tokens criptográficos de Sandbox ou Produção do Asaas.
                            </p>
                          </div>

                          <div className="bg-[#13131A] p-4 rounded-xl border border-slate-900 space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5 text-[#C026FF]">
                              <span>🤖</span> Auditorias Periódicas Inteligentes
                            </h4>
                            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                              Executamos auditorias de rotatividade de portas e chaves de segurança interna de inteligência de vendas para garantir total blindagem contra acessos robotizados mal-intencionados.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. SANDBOX ASAAS GATEWAY INSTANT PLAYGROUND */}
                  {activeLegalTab === "asaas" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          PLAYGROUND DE TRANSPARÊNCIA
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Sandbox do Asaas Gateway</h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Experimente em tempo real como nosso ecossistema de Webhooks do Asaas valida faturamentos e libera créditos automáticos no Firebase.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Simulation controls panel */}
                        <div className="lg:col-span-5 bg-[#13131A] p-5 rounded-xl border border-slate-900 space-y-4">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide font-mono">Parâmetros da Transação</h4>
                          <hr className="border-slate-900" />
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 block font-mono">Valor Simulado (R$)</label>
                            <input
                              type="text"
                              value={asaasSimAmount}
                              onChange={(e) => setAsaasSimAmount(e.target.value)}
                              className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2 px-3 rounded-lg focus:outline-none focus:border-[#8B2DFF] text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 block font-mono">Status do Processamento</label>
                            <select
                              value={asaasSimStatus}
                              onChange={(e) => setAsaasSimStatus(e.target.value)}
                              className="w-full bg-[#0A0A0F] border border-slate-800 text-[11px] py-2 px-2 rounded-lg focus:outline-none focus:border-[#8B2DFF] text-white font-bold"
                            >
                              <option value="APPROVED">PAGO (APPROVED - Liberar Créditos)</option>
                              <option value="PENDING">AGUARDANDO PAGAMENTO (PENDING)</option>
                              <option value="REFUNDED">REEMBOLSADO/ESTORNADO (REFUNDED)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleSimulateAsaas}
                            disabled={isSimulatingAsaas}
                            className={`w-full bg-gradient-to-r from-[#8B2DFF] to-[#C026FF] text-white text-xs font-black py-2.5 rounded-xl transition-all uppercase tracking-wide cursor-pointer ${
                              isSimulatingAsaas ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:shadow-[#8B2DFF]/20"
                            }`}
                          >
                            {isSimulatingAsaas ? "Disparando Webhook..." : "Disparar Webhook de Sandbox"}
                          </button>
                        </div>

                        {/* Interactive Terminal log viewer */}
                        <div className="lg:col-span-7 bg-black/90 rounded-xl border border-slate-900 p-4 font-mono text-[10.5px] space-y-3 shadow-inner">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-slate-500 font-bold flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Webhook Receiver Stream_</span>
                            <span className="text-[8px] bg-[#8B2DFF]/20 text-[#C026FF] px-1.5 py-0.5 rounded uppercase font-black">LOCAL SANDBOX</span>
                          </div>

                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto font-mono scrollbar-none">
                            {asaasLogs.map((log, lIdx) => (
                              <div key={lIdx} className="leading-relaxed font-semibold">
                                <span className="text-slate-600">[{log.timestamp}]</span>{" "}
                                <span className={
                                  log.type === "success" ? "text-emerald-400 font-bold" :
                                  log.type === "error" ? "text-red-400 font-bold" :
                                  log.type === "warning" ? "text-amber-500 font-bold" :
                                  log.type === "incoming" ? "text-[#C026FF] font-bold" : "text-sky-300"
                                }>
                                  {log.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* 5. CONTATO COMERCIAL FORM */}
                  {activeLegalTab === "contact" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#C026FF]/10 text-[#C026FF] border border-[#C026FF]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          CONTATO CORPORATIVO (B2B)
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Canal Comercial & Franquias</h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Quer contratar planos integrados corporativos acima de 10.000 leads, parcerias de White-Label ou agendar reunião de vendas?
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {!commercialSubmitted ? (
                          <motion.form
                            key="comm-form"
                            onSubmit={handleCommercialSubmit}
                            className="bg-[#13131A] p-5 rounded-xl border border-slate-900 space-y-4 text-xs font-semibold"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-black font-mono">Seu Nome *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Digite seu nome completo"
                                  value={commercialForm.name}
                                  onChange={(e) => setCommercialForm({ ...commercialForm, name: e.target.value })}
                                  className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#C026FF]"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-black font-mono">Email Corporativo *</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Ex: douglas@agencia.com.br"
                                  value={commercialForm.email}
                                  onChange={(e) => setCommercialForm({ ...commercialForm, email: e.target.value })}
                                  className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#C026FF]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-black font-mono">WhatsApp para Contato *</label>
                                <input
                                  type="tel"
                                  required
                                  placeholder="Ex: (11) 99999-8888"
                                  value={commercialForm.whatsapp}
                                  onChange={(e) => setCommercialForm({ ...commercialForm, whatsapp: e.target.value })}
                                  className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#C026FF]"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-black font-mono">Tamanho da Agência / Equipe</label>
                                <select
                                  value={commercialForm.company}
                                  onChange={(e) => setCommercialForm({ ...commercialForm, company: e.target.value })}
                                  className="w-full bg-[#0A0A0F] border border-slate-800 text-[11px] py-2.5 px-2 rounded-lg text-white"
                                >
                                  <option value="">Selecione uma opção...</option>
                                  <option value="freelancer">Apenas Eu (Solo Freelancer)</option>
                                  <option value="small">2 a 5 pessoas (Agência Digital Boutique)</option>
                                  <option value="medium">6 a 20 pessoas (Agência em Expansão)</option>
                                  <option value="large">Mais de 20 pessoas (Corporativo / S.A.)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 uppercase font-black font-mono">Como podemos te ajudar?</label>
                              <textarea
                                rows={3}
                                placeholder="Conte mais sobre o volume de prospecção da sua agência..."
                                value={commercialForm.message}
                                onChange={(e) => setCommercialForm({ ...commercialForm, message: e.target.value })}
                                className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#C026FF] resize-none"
                              ></textarea>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingCommercial}
                              className={`w-full bg-gradient-to-r from-[#C216FF] to-[#8B2DFF] text-white py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSubmittingCommercial ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                              }`}
                            >
                              {isSubmittingCommercial ? "Enviando Proposta Comercial..." : "Enviar Proposta Comercial"}
                            </button>
                          </motion.form>
                        ) : (
                          <motion.div
                            key="comm-submitted"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-950/20 border border-emerald-900 p-8 rounded-xl text-center space-y-4"
                          >
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/35">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-extrabold text-white">Proposta Comercial Recebida com Sucesso!</h4>
                              <p className="text-xs text-slate-450 text-slate-400 font-semibold leading-relaxed">
                                Douglas Bateria (CEO do AdsHive) ou nossa equipe executiva de parcerias entrará em contato comercial diretamente com você via WhatsApp <span className="font-mono text-emerald-300">{commercialForm.whatsapp}</span> e email corporativo <span className="text-semibold text-white">{commercialForm.email}</span> em menos de 2 horas em horário comercial brasileiro.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCommercialSubmitted(false);
                                setCommercialForm({ name: "", email: "", company: "", whatsapp: "", message: "" });
                              }}
                              className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-lg cursor-pointer"
                            >
                              Enviar Outra Proposta
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* 6. SUPORTE TÉCNICO INTERACTIVE TICKET & CHAT */}
                  {activeLegalTab === "support" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#C026FF]/10 text-[#C026FF] border border-[#C026FF]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          SUPORTE TÉCNICO PRIORITÁRIO
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Central de Atendimento ao Cliente</h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Abra um ticket priorizado e fale imediatamente com um desenvolvedor ou consultor técnico do AdsHive Prospect.
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {!isSupportActive ? (
                          <motion.form
                            key="support-form"
                            onSubmit={handleSupportSubmit}
                            className="bg-[#13131A] p-5 rounded-xl border border-slate-900 space-y-4 text-xs font-semibold"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-black font-mono">Qual a Categoria do Problema? *</label>
                                <select
                                  value={supportCategory}
                                  onChange={(e) => setSupportCategory(e.target.value)}
                                  className="w-full bg-[#0A0A0F] border border-slate-800 text-[11px] py-2.5 px-2 rounded-lg text-white"
                                >
                                  <option value="Scraper">Instabilidade na Extração (Google Maps Scraper)</option>
                                  <option value="Billing">Sincronização / Cobrança de Créditos (Gateway Asaas)</option>
                                  <option value="Account">Acesso ao Painel / Redefinição de Senha</option>
                                  <option value="Other">Outras Dúvidas Gerais de Tecnologia</option>
                                </select>
                              </div>

                              <div className="space-y-1.5 flex flex-col justify-end">
                                <div className="text-[10px] bg-[#8B2DFF]/10 text-slate-200 p-2 rounded border border-[#8B2DFF]/15">
                                  SLA Operacional em vigor: <span className="font-black text-[#C026FF]">Suporte em menos de 15 minutos</span> com especialistas brasileiros.
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 uppercase font-black font-mono font-mono">Descreva os Detalhes da sua Solicitação *</label>
                              <textarea
                                required
                                rows={4}
                                placeholder="Copie logs de console, detalhe o nicho e a cidade que estava pesquisando ou o ID de transação..."
                                value={supportDescription}
                                onChange={(e) => setSupportDescription(e.target.value)}
                                className="w-full bg-[#0A0A0F] border border-slate-800 text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#C026FF] resize-none"
                              ></textarea>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingSupport}
                              className={`w-full bg-gradient-to-r from-[#C216FF] to-[#8B2DFF] text-white py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSubmittingSupport ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                              }`}
                            >
                              {isSubmittingSupport ? "Enviando Ticket Técnico..." : "Abrir Ticket Técnico Prioritário"}
                            </button>
                          </motion.form>
                        ) : (
                          <motion.div
                            key="support-chat"
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-[#13131A] rounded-xl border border-slate-900 flex flex-col h-[340px] overflow-hidden"
                          >
                            {/* Chat Header */}
                            <div className="bg-[#181822] p-3 border-b border-slate-950 flex justify-between items-center shrink-0">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-black text-white text-[11px] font-mono">GB</div>
                                <div>
                                  <strong className="text-xs text-white block">Guto Bernardo (Suporte AdsHive)</strong>
                                  <span className="text-[8.5px] text-emerald-400 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    ONLINE • RESPONDE IMEDIATAMENTE
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSupportActive(false);
                                  setSupportDescription("");
                                }}
                                className="text-[9.5px] bg-[#0A0A0F] text-slate-500 hover:text-white px-2.5 py-1 rounded border border-slate-800 font-bold cursor-pointer"
                              >
                                Encerrar Ticket
                              </button>
                            </div>

                            {/* Chat messages body */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-semibold text-xs leading-relaxed max-h-[220px]">
                              {supportChatMessages.map((msg, mIdx) => (
                                <div
                                  key={mIdx}
                                  className={`flex flex-col max-w-[85%] ${
                                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                                  }`}
                                >
                                  <div className={`p-2.5 rounded-xl ${
                                    msg.sender === "user" ? "bg-purple-600 text-white rounded-tr-none" :
                                    msg.sender === "system" ? "bg-slate-900 text-[#C026FF] border border-[#C026FF]/30 rounded-tl-none font-mono text-[10px]" :
                                    "bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-tl-none"
                                  }`}>
                                    <p>{msg.text}</p>
                                  </div>
                                  <span className="text-[8.5px] text-slate-500 mt-1 block font-mono font-bold">{msg.time}</span>
                                </div>
                              ))}
                            </div>

                            {/* Send chat message reply bar */}
                            <form onSubmit={handleSendSupportReply} className="p-2 border-t border-slate-950 bg-[#0A0A0F] flex gap-2 shrink-0">
                              <input
                                type="text"
                                placeholder="Digite sua resposta tecnica..."
                                value={supportReplyText}
                                onChange={(e) => setSupportReplyText(e.target.value)}
                                className="flex-1 bg-[#13131A] text-xs py-2 px-3 focus:outline-none focus:border-purple-600 rounded-lg text-white font-medium border border-slate-800"
                              />
                              <button
                                type="submit"
                                className="bg-[#8B2DFF] hover:bg-[#C026FF] text-white p-2.5 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* 7. CENTRAL DE AJUDA ARTICLES SEARCH GUIDE */}
                  {activeLegalTab === "help" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#8B2DFF]/15 text-[#C026FF] border border-[#8B2DFF]/25 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          DOCUMENTAÇÃO DE BASE DE CONHECIMENTO
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Central de Ajuda & Tutoriais</h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Pesquise tutoriais passo a passo sobre como usufruir ao máximo da inteligência comercial AdsHive.
                        </p>
                      </div>

                      {/* Search Bar filter */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B2DFF]" />
                        <input
                          type="text"
                          placeholder="Buscar dúvidas operacionais: ex: site, créditos, asaas..."
                          value={faqSearchQuery}
                          onChange={(e) => setFaqSearchQuery(e.target.value)}
                          className="w-full bg-[#13131A] border border-slate-900 text-xs py-3.5 pl-10 pr-4 focus:outline-none focus:border-[#C026FF] rounded-xl text-white font-bold"
                        />
                      </div>

                      <div className="space-y-3">
                        {helpArticles
                          .filter((art) => {
                            if (!faqSearchQuery) return true;
                            const query = faqSearchQuery.toLowerCase();
                            return (
                              art.title.toLowerCase().includes(query) ||
                              art.content.toLowerCase().includes(query) ||
                              art.tags.some((t) => t.includes(query))
                            );
                          })
                          .map((art) => (
                            <div key={art.id} className="bg-[#13131A] border border-slate-900 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setActiveHelpArticle(activeHelpArticle === art.id ? null : art.id)}
                                className="w-full flex justify-between items-center p-4 text-left text-slate-300 hover:text-white font-black text-xs sm:text-sm cursor-pointer border-none bg-transparent"
                              >
                                <span>{art.title}</span>
                                <ChevronRight className={`w-4 h-4 text-[#8B2DFF] transition-transform ${activeHelpArticle === art.id ? "rotate-90" : ""}`} />
                              </button>

                              <AnimatePresence>
                                {activeHelpArticle === art.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-950 p-4 bg-black/30 bg-opacity-40"
                                  >
                                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                                      {art.content}
                                    </p>
                                    <div className="flex gap-1.5 mt-3 select-none">
                                      {art.tags.map((t, idx) => (
                                        <span key={idx} className="bg-slate-900 text-slate-500 font-mono text-[8.5px] font-black px-2 py-0.5 rounded uppercase">#{t}</span>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 8. BLOG OFICIAL ADSHIVE RICH ARTICLES INTERACTION */}
                  {activeLegalTab === "blog" && (
                    <div className="space-y-5 text-slate-300 font-sans">
                      <div className="space-y-1.5 border-b border-slate-900 pb-4">
                        <span className="bg-[#C026FF]/10 text-[#C026FF] border border-[#C026FF]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                          VENDAS E ACELERAMENTO DIGITAL
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">Blog Oficial AdsHive</h2>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Aprenda os roteiros exatos e macetes táticos de prospecção para faturar alto com serviços digitais locais no Maps.
                        </p>
                      </div>

                      {activeHelpArticle !== null ? (
                        <div className="space-y-4">
                          <button
                            type="button"
                            onClick={() => setActiveHelpArticle(null)}
                            className="bg-transparent border-none text-[11px] font-black text-[#C026FF] flex items-center gap-1 cursor-pointer hover:underline mb-2"
                          >
                            <span>← Voltar para todos os artigos</span>
                          </button>

                          {blogPosts
                            .filter((post) => post.id === activeHelpArticle)
                            .map((post) => (
                              <motion.article key={post.id} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="h-44 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-900 relative">
                                  <img src={post.image} alt={post.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-80" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                  <span className="absolute bottom-3 left-3 bg-purple-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{post.category}</span>
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold font-mono pl-0.5">
                                  <span>👤 {post.author}</span>
                                  <span>•</span>
                                  <span>🗓️ {post.date}</span>
                                  <span>•</span>
                                  <span>⏱️ {post.readingTime}</span>
                                </div>

                                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{post.title}</h3>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-350 leading-relaxed pl-0.5 whitespace-pre-wrap font-sans">
                                  {post.content}
                                </div>
                              </motion.article>
                            ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {blogPosts.map((post) => (
                            <div key={post.id} className="bg-[#13131A] rounded-xl border border-slate-900 overflow-hidden flex flex-col justify-between group">
                              <div>
                                <div className="h-32 w-full overflow-hidden relative">
                                  <img src={post.image} alt={post.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-70 group-hover:scale-103 transition-transform" />
                                  <span className="absolute bottom-2 left-2 bg-slate-950/80 text-purple-400 font-mono text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{post.category}</span>
                                </div>
                                <div className="p-4 space-y-2">
                                  <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold font-mono">
                                    <span>🗓️ {post.date}</span>
                                    <span>⏱️ {post.readingTime}</span>
                                  </div>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug group-hover:text-[#C026FF] transition-colors">{post.title}</h4>
                                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed line-clamp-3">{post.excerpt}</p>
                                </div>
                              </div>

                              <div className="p-4 pt-1.5 border-t border-slate-950 flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 font-mono">Por {post.author.split(" ")[0]}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveHelpArticle(post.id)}
                                  className="text-[#C026FF] bg-transparent border-none hover:underline cursor-pointer flex items-center gap-1 font-extrabold"
                                >
                                  Ler Artigo →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer overlay warning message */}
                <div className="pt-6 mt-8 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-600 font-bold font-mono select-none">
                  <span>AdsHive B2B Inteligência Ltda • CNPJ 41.503.220/0001-90</span>
                  <span className="text-indigo-900 font-semibold font-sans hidden sm:inline">Ambiente Criptográfico em Conformidade Securizada</span>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
