/**
 * Test script for Asaas Webhook validation and integration
 * Run locally with: node test-webhook.js
 */

const dns = require('dns');

// Configuration
const LOCAL_URL = 'http://localhost:3000/api/webhooks/asaas';
const PROD_URL = 'https://ais-pre-ngxruki73rlyomvbcmwvoz-502327203387.us-west2.run.app/api/webhooks/asaas';

// Determine default URL state (defaults to LOCAL_URL unless directed)
const targetUrl = process.argv[2] === 'prod' ? PROD_URL : LOCAL_URL;

// Provided tokens
const TOKEN_ASAAS_WEBHOOK = 'whsec_UNbiXujFFJJISYTtGRoC_EZqzcCod';
const TOKEN_ADSHIVE_PROD = 'ADSHIVE_PROSPECT_PROD_2026';
const envToken = process.env.ASAAS_WEBHOOK_TOKEN;

console.log('====================================================');
console.log('🚀 ASAAS WEBHOOK - INTEGRATION TEST SUITE');
console.log('====================================================');
console.log(`Target URL:        ${targetUrl}`);
console.log(`Token Candidates:  1. "${TOKEN_ASAAS_WEBHOOK}" (Standard Webhook Token)`);
console.log(`                   2. "${TOKEN_ADSHIVE_PROD}" (Prod Token Environment Config)`);
if (envToken) {
  console.log(`                   3. "${envToken}" (Loaded from local Environment variable)`);
}
console.log('----------------------------------------------------');

const mockPaymentPayload = {
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: `pay_test_${Math.floor(Math.random() * 900000 + 100000)}`,
    value: 97.00,
    billingType: 'PIX',
    invoiceUrl: 'https://sandbox.asaas.com/i/test-invoice-link',
    externalReference: 'demo_user-pro', // mimics userId 'demo_user' and plan 'pro'
    customVariables: {
      userId: 'demo_user',
      planId: 'pro'
    }
  },
  subscription: {
    id: 'sub_test_9999',
    externalReference: 'demo_user-pro'
  }
};

async function runTest(caseName, { method = 'POST', headers = {}, body = null }) {
  console.log(`📝 Running: ${caseName}...`);
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }

    const start = Date.now();
    const response = await fetch(targetUrl, opts);
    const duration = Date.now() - start;
    const isOk = response.ok;
    
    let responseText = '';
    try {
      const data = await response.json();
      responseText = JSON.stringify(data, null, 2);
    } catch {
      responseText = await response.text();
    }

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🟢 Status:   ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`);
    console.log(responseText);
    console.log('----------------------------------------------------');
    return { status: response.status, ok: isOk };
  } catch (error) {
    console.error(`❌ Test Request Failed for ${caseName}:`, error.message);
    if (error.message.includes('fetch is not defined')) {
      console.error('👉 Requirement: This script requires Node.js v18 or standard modern package manager setup.');
    }
    console.log('----------------------------------------------------');
    return { status: 0, ok: false };
  }
}

async function main() {
  // Test case 1: GET Validation Endpoint
  await runTest('Test Case 1: GET Health Check Validation Endpoint', {
    method: 'GET'
  });

  // Test case 2: POST Webhook with No Token
  await runTest('Test Case 2: POST Event - Missing Access Token Header', {
    method: 'POST',
    body: mockPaymentPayload
  });

  // Test case 3: POST Webhook with Wrong Token
  await runTest('Test Case 3: POST Event - Invalid/Mismatching Access Token', {
    method: 'POST',
    headers: {
      'asaas-access-token': 'wrong_token_signature'
    },
    body: mockPaymentPayload
  });

  // Test case 4A: POST Webhook with whsec_ Standard Webhook Access Token
  await runTest('Test Case 4A: POST Event - Valid Payload & whsec_ Token Candidate', {
    method: 'POST',
    headers: {
      'asaas-access-token': TOKEN_ASAAS_WEBHOOK
    },
    body: mockPaymentPayload
  });

  // Test case 4B: POST Webhook with ADSHIVE_PROSPECT_PROD_2026 Prod Token
  await runTest('Test Case 4B: POST Event - Valid Payload & ADSHIVE_PROSPECT_PROD_2026 Candidate', {
    method: 'POST',
    headers: {
      'asaas-access-token': TOKEN_ADSHIVE_PROD
    },
    body: mockPaymentPayload
  });

  if (envToken && envToken !== TOKEN_ASAAS_WEBHOOK && envToken !== TOKEN_ADSHIVE_PROD) {
    // Test case 4C: POST Webhook with current environment loaded token (if different)
    await runTest('Test Case 4C: POST Event - Valid Payload & Process Environment Token', {
      method: 'POST',
      headers: {
        'asaas-access-token': envToken
      },
      body: mockPaymentPayload
    });
  }

  // Test case 5: POST Webhook with Malformed Payload
  await runTest('Test Case 5: POST Event - Malformed/Empty Payload Structure', {
    method: 'POST',
    headers: {
      'asaas-access-token': envToken || TOKEN_ASAAS_WEBHOOK
    },
    body: {
      event: 'PAYMENT_RECEIVED'
      // missing payment field
    }
  });

  console.log('✅ Webhook Test Suite finished.');
  console.log('💡 Tip: For Local Testing, start the server (`npm run dev`) first in another terminal.');
  console.log('💡 Tip: For Production Cloud Run Testing, execute: `node test-webhook.js prod`');
  console.log('====================================================');
}

main();
