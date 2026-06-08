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
    const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-07fa01e6-d6a1-4d4e-b05a-262a2373f3d7";
    const db = getFirestore(fbApp, dbId);
    const auth = getAuth(fbApp);

    const serverEmail = "douglas_teste@adshive.com";
    const serverPassword = "AdshiveTestPassword2026!";

    console.log("Signing in backend...");
    const userCredential = await signInWithEmailAndPassword(auth, serverEmail, serverPassword);
    const uid = userCredential.user.uid;
    console.log("Logged in as:", userCredential.user.email, "UID:", uid);

    const userRef = doc(db, "users", uid);
    console.log("Fetching user record for", uid);
    const userSnap = await getDoc(userRef);
    console.log("User document exists:", userSnap.exists());
    if (userSnap.exists()) {
      console.log("User data:", userSnap.data());
    } else {
      console.log("User data not found. Creating user document...");
      await setDoc(userRef, {
        id: uid,
        name: "Douglas CMA Teste",
        email: serverEmail,
        role: "Administrador",
        plan: "Pro",
        credits: 999999
      });
      console.log("User document created successfully!");
    }
  } catch (err: any) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

runTest();
