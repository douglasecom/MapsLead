import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

async function testFirebase() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.log("No config file found!");
      return;
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-07fa01e6-d6a1-4d4e-b05a-262a2373f3d7";
    const db = getFirestore(fbApp, dbId);
    console.log("Firebase initialized");

    const testRef = doc(db, "aiUsage", "test_id_999");
    console.log("Setting document in aiUsage...");
    await setDoc(testRef, {
      userId: "test_id_999",
      plan: "Gratuito",
      messagesUsed: 2,
      messagesLimit: 20,
      lastResetDate: new Date().toISOString()
    });
    console.log("Document set successfully!");

    console.log("Getting document from aiUsage...");
    const snap = await getDoc(testRef);
    console.log("Document data:", snap.data());
  } catch (err: any) {
    console.error("Firebase operation failed:", err);
  }
}

testFirebase();
