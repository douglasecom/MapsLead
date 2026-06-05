import { Lead } from "../types";

export interface WebsiteAnalysis {
  leadStrengths: string[];
  competitorWeaknesses: string[];
  recommendedStructure: {
    sectionName: string;
    description: string;
  }[];
  colorsSuggestion: string;
  stitchPrompt: string;
}

export function generateLeadWebsiteAnalysis(lead: Lead): WebsiteAnalysis {
  const isPadaria = lead.niche.toLowerCase().includes("padar") || lead.niche.toLowerCase().includes("doc") || lead.niche.toLowerCase().includes("confe");
  const isSaude = lead.niche.toLowerCase().includes("clín") || lead.niche.toLowerCase().includes("dent") || lead.niche.toLowerCase().includes("saúd") || lead.niche.toLowerCase().includes("medic") || lead.niche.toLowerCase().includes("estét");
  const isLawyer = lead.niche.toLowerCase().includes("advog") || lead.niche.toLowerCase().includes("juríd");
  const isAutomotive = lead.niche.toLowerCase().includes("ofi") || lead.niche.toLowerCase().includes("aut");
  
  const strengths: string[] = [
    `Excelente reputação local com nota máxima ou expressiva de ${lead.rating}★ no Google Maps.`,
    `Autoridade acumulada com mais de ${lead.reviews} avaliações espontâneas de clientes satisfeitos no bairro.`,
    `Presença física já reconhecida na comunidade de ${lead.location}, gerando tráfego orgânico recorrente.`,
    lead.phone ? `Acesso de contato ágil diretamente estabelecido via telefone (${lead.phone}).` : `Excelente aderência de canais telefônicos e contatos locais.`
  ];

  const weaknesses: string[] = [
    `Sites concorrentes na região de ${lead.location} usam templates estáticos, rígidos, de carregamento lento no celular.`,
    `Os concorrentes cobram fretes e taxas de intermediação altíssimos nos aplicativos de entrega e agendamento.`,
    `Sistemas da concorrência exigem fluxos de cliques excessivos ou cadastros extensos que afastam o usuário final.`,
    `Inexistência de conectividade direta com o WhatsApp para pedidos rápidos ou agendamento sob demanda.`
  ];

  let structure = [
    {
      sectionName: "Seção Hero de Alta Conversão",
      description: `Headline direcionada à conveniência local ("A melhor experiência de ${lead.niche} em ${lead.location}") acompanhada de um botão de CTA imersivo para WhatsApp.`
    },
    {
      sectionName: "Destaques e Serviços Principais",
      description: `Vitrine em grid para celular mostrando as especialidades do estabelecimento com carregamento ultra veloz.`
    },
    {
      sectionName: "Super Prova Social do Maps",
      description: `Selo dinâmico destacando as ${lead.reviews} estrelas douradas conquistadas no Google para reter a atenção do lead.`
    },
    {
      sectionName: "Footer Direto (Mapa & WhatsApp)",
      description: `Seção de rodapé focada em usabilidade imediata, com direções no GPS e botão de atendimento flutuante.`
    }
  ];

  let colors = "Tons de preto carvão e cinza minimalista acentuados com azul cobalto e ouro para transmitir relevância e alto profissionalismo.";
  
  if (isPadaria) {
    structure = [
      {
        sectionName: "Hero 'Pão Quentinho'",
        description: `Chamada irresistível: "Os pães artesanais, doces finos e encomendas que você ama, agora a um clique." Botão verde em realce "Fazer Encomenda Rápida via WhatsApp".`
      },
      {
        sectionName: "Cardápio do Dia",
        description: "Galeria mobile categorizada (Pães, Confeitaria, Salgados e Combos) com preços transparentes e botões diretos de adição ao carrinho."
      },
      {
        sectionName: "Orgulho de Moema (Apoio Local)",
        description: `Seção heráldica exibindo que a padaria é avaliada com ${lead.rating}★ por mais de ${lead.reviews} famílias que prezam pelo sabor autêntico.`
      },
      {
        sectionName: "Clique e Retire (Econômico)",
        description: `Exposição do benefício de fugir de taxas de entrega altas de apps parceiros com canais integrados para contato direto.`
      }
    ];
    colors = "Terracota suave, creme quente e toques de verde oliva para estimular aconchego doméstico e alta culinária.";
  } else if (isSaude) {
    structure = [
      {
        sectionName: "Hero de Segurança & Acolhimento",
        description: `Mensagem de prestígio ("Agende seus procedimentos e consultas de forma rápida e segura"). CTA centralizado "Fale Conosco pelo WhatsApp".`
      },
      {
        sectionName: "Especialidades Médicas",
        description: "Sua gama de cuidados especiais dividida de forma limpa, com ícones funcionais e textos em linguagem acessível e ética."
      },
      {
        sectionName: "Corpo Clínico & Selo de Confiança",
        description: `Destaque para a nota de excelência ${lead.rating}★ avaliada por ${lead.reviews} pacientes que elogiam o atendimento humanizado.`
      },
      {
        sectionName: "Contato Simplificado & Endereço",
        description: `Agenda rápida com mapa e um clique direto para calcular rota até ${lead.location}.`
      }
    ];
    colors = "Verde floresta medicinal refinado, branco linho de alta pureza e tons de ardósia para estabilidade e assepsia visual.";
  }

  // Generate Stitch Prompt
  const stitchPrompt = `Crie um site profissional, mobile-first e de altíssima conversão para a empresa "${lead.name}", que atua no setor de ${lead.niche} em ${lead.location}.
O local já possui enorme reputação no Maps com nota ${lead.rating} estrelas baseada em ${lead.reviews} avaliações.

O site deve conter:
1. Seção Hero: Título chamativo focado na essência de hospitalidade/conversão rápida, subtítulo explicando as soluções locais e um botão de Ação Principal (CTA) apontando para o WhatsApp comercial.
2. Galeria de Serviços/Produtos: Apresentação interativa dos serviços oferecidos, de modo flexível e elegante.
3. Seção depoimentos dinâmicos de alta reputação, destacando o orgulho da nota ${lead.rating}★ em ${lead.reviews} avaliações locais.
4. Rodapé inteligente de conversão com detalhes de contato, telefone (${lead.phone || "a combinar"}), endereço em ${lead.location} e link Google Maps.

Diretriz de Design: Layout limpo, minimalista, carregamento ultra rápido, focado nas cores: ${colors}.`;

  return {
    leadStrengths: strengths,
    competitorWeaknesses: weaknesses,
    recommendedStructure: structure,
    colorsSuggestion: colors,
    stitchPrompt
  };
}
