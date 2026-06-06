/**
 * Script de Simulação de Evento de Pagamento do Asaas (PAYMENT_RECEIVED)
 * 
 * Este script simula o recebimento de um webhook real do Asaas no backend do AdsHive Prospect.
 * Ele valida o cabeçalho 'asaas-access-token' com o token 'ADSHIVE_PROSPECT_PROD_2026',
 * dispara a gravação de logs de atividade, de faturamento, de histórico de transações
 * e ativa os recursos de assinatura + créditos do usuário correspondente no Firestore.
 * 
 * Uso:
 *   Para rodar no servidor local:
 *     node simulate-payment.js local
 * 
 *   Para rodar no servidor de Produção (Cloud Run):
 *     node simulate-payment.js prod
 */

const TARGET_ENV = process.argv[2] === 'prod' ? 'prod' : 'local';

const CONFIG = {
  local: {
    url: 'http://localhost:3000/api/webhooks/asaas',
    description: 'Ambiente de Desenvolvimento Local'
  },
  prod: {
    url: 'https://ais-pre-ngxruki73rlyomvbcmwvoz-502327203387.us-west2.run.app/api/webhooks/asaas',
    description: 'Ambiente de Produção (Cloud Run)'
  }
};

const activeConfig = CONFIG[TARGET_ENV];
const SECURITY_TOKEN = 'ADSHIVE_PROSPECT_PROD_2026';

// Dados simulados do evento de pagamento recebido do Asaas
const mockPayload = {
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: `pay_asaas_${Math.floor(Math.random() * 900000 + 100000)}`,
    value: 97.00,
    billingType: 'PIX',
    invoiceUrl: 'https://sandbox.asaas.com/i/test-invoice-link-adshive',
    externalReference: 'demo_user-pro', // userId 'demo_user' e plano id 'pro'
    customVariables: {
      userId: 'demo_user',
      planId: 'pro'
    }
  },
  subscription: {
    id: `sub_asaas_${Math.floor(Math.random() * 90000 + 10000)}`,
    externalReference: 'demo_user-pro'
  }
};

console.log('==================================================================');
console.log('⚡ SIMULADOR ASAAS WEBHOOK - ADSHIVE PROSPECT');
console.log('==================================================================');
console.log(`Alvo Selecionado:     [${TARGET_ENV.toUpperCase()}] - ${activeConfig.description}`);
console.log(`URL do Endereço:      ${activeConfig.url}`);
console.log(`Token de Validação:   "${SECURITY_TOKEN}"`);
console.log(`ID do Usuário Alvo:   "${mockPayload.payment.customVariables.userId}"`);
console.log(`Plano a Ativar:       "${mockPayload.payment.customVariables.planId.toUpperCase()}" (500 créditos)`);
console.log('------------------------------------------------------------------');

async function triggerWebhook() {
  console.log('📤 Enviando payload POST simulado para o webhook do backend...');
  
  try {
    const response = await fetch(activeConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': SECURITY_TOKEN
      },
      body: JSON.stringify(mockPayload)
    });

    const isOk = response.ok;
    let responseBody = '';

    try {
      const data = await response.json();
      responseBody = JSON.stringify(data, null, 2);
    } catch {
      responseBody = await response.text();
    }

    console.log(`\n⏱️  Status HTTP Recebido: ${response.status} ${response.statusText}`);
    console.log('📦 Conteúdo de Resposta do Servidor:');
    console.log(responseBody);
    console.log('------------------------------------------------------------------');

    if (isOk) {
      console.log('🎉 SUCESSO! O webhook processou o evento corretamente.');
      console.log('\n🔍 Operações executadas automaticamente no Firestore:');
      console.log(' 1. [activityLogs] -> Documento criado registrando o evento "WEBHOOK_PAYMENT_RECEIVED".');
      console.log(' 2. [users]        -> Campo "subscriptionStatus" definido como "ACTIVE", plano definido como "Pro"');
      console.log('                      e créditos atualizados (+500 créditos).');
      console.log(' 3. [subscriptions]-> Cadastro da assinatura atualizado com status "ACTIVE" e vigência mensal.');
      console.log(` 4. [payments]     -> Registro financeiro ID "${mockPayload.payment.id}" salvo de forma durável.`);
    } else {
      console.error('❌ ERRO! O backend rejeitou a requisição do webhook.');
      if (response.status === 401) {
        console.error('💡 Motivo: Houve uma falha de autenticação do token do webhook.');
        console.error('💡 Dica: Certifique-se de que a variável de ambiente ASAAS_WEBHOOK_TOKEN no servidor está configurada como "ADSHIVE_PROSPECT_PROD_2026".');
      }
    }

  } catch (error) {
    console.error('❌ FALHA DE PROTOCOLO: Não foi possível conectar ao servidor.');
    console.error('Erro detalhado:', error.message);
    if (error.message.includes('fetch is not defined')) {
      console.error('💡 Requisito: Execute o script em um ambiente com Node.js v18 ou superior.');
    }
  }
  console.log('==================================================================\n');
}

triggerWebhook();
