import fetch from "node-fetch";

async function testInteract() {
  const url = "http://localhost:3000/api/ai/interact";
  const payload = {
    userId: "test_user_id_123",
    resource: "copiloto",
    prompt: "Crie um roteiro de vendas",
    companyDetails: {
      name: "Padaria Bella Mooca",
      niche: "Padaria",
      location: "São Paulo, SP"
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Interact endpoints status:", response.status);
    const data = await response.json();
    console.log("Interact response text:", data.text);
  } catch (err: any) {
    console.error("Fetch failed:", err);
  }
}

async function testMsg() {
  const url = "http://localhost:3000/api/message/generate";
  const payload = {
    leadName: "Padaria Bella Mooca",
    niche: "Padaria",
    location: "São Paulo, SP"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Msg endpoint status:", response.status);
    const data = await response.json();
    console.log("Msg response text:", data.text);
  } catch (err: any) {
    console.error("Fetch failed:", err);
  }
}

async function main() {
  await testInteract();
  await testMsg();
}

main();
