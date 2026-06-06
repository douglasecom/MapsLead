import { GoogleGenAI } from "@google/genai";

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY is present:", !!key);
  console.log("GEMINI_API_KEY length:", key ? key.length : 0);
  console.log("GEMINI_API_KEY value (first 3 chars):", key ? key.substring(0, 3) : "None");
  
  if (!key) {
    console.log("No Gemini API key found in process.env");
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  try {
    console.log("Calling gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond with the word 'OK' if you can read this.",
    });
    console.log("Success! Response text:", response.text);
  } catch (err: any) {
    console.error("Gemini call failed with error:", err);
  }
}

test();
