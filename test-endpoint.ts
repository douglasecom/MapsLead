import fetch from "node-fetch"; // or standard if node 18+

async function testRoute() {
  const url = "http://localhost:3000/api/leads/generate";
  const payload = {
    niche: "Padaria",
    location: "São Paulo, SP",
    limit: 5
  };

  try {
    console.log("Sending POST to", url, "with payload", payload);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response body:", text);
    
    try {
      const data = JSON.parse(text);
      console.log("Successfully parsed JSON! Leads count:", data.leads ? data.leads.length : "undefined");
    } catch (e) {
      console.log("Could not parse as JSON:", e);
    }
  } catch (err: any) {
    console.error("Fetch request failed:", err);
  }
}

testRoute();
