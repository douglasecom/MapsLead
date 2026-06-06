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
    const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
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
