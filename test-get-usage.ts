import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

async function runTest() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initializeApp(firebaseConfig);
    const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    const auth = getAuth(fbApp);

    const serverEmail = "douglas_teste@adshive.com";
    const serverPassword = "AdshiveTestPassword2026!";

    console.log("Signing in backend...");
    const userCredential = await signInWithEmailAndPassword(auth, serverEmail, serverPassword);
    console.log("Logged in as:", userCredential.user.email);

    // Call getOrCreateUsage logic
    const userId = "test_user_id_123";
    const userPlan = "Gratuito";

    const usageRef = doc(db, "aiUsage", userId);
    console.log("Fetching usage record for", userId);
    const usageSnap = await getDoc(usageRef);
    console.log("Document exists:", usageSnap.exists());
    
    let planLimit = 20;
    if (usageSnap.exists()) {
      console.log("Data:", usageSnap.data());
    } else {
      console.log("Usage not found. Creating a new setDoc...");
      const lastResetDate = new Date().toISOString();
      await setDoc(usageRef, {
        userId,
        plan: userPlan || "Gratuito",
        messagesUsed: 0,
        messagesLimit: planLimit,
        lastResetDate
      });
      console.log("Created successfully!");
    }
  } catch (err: any) {
    console.error("Test error:", err);
  } finally {
    console.log("Done. Exiting process.");
    process.exit(0);
  }
}

runTest();
