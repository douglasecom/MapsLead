import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=================================================");
  console.log("🔍 STARING COMPREHENSIVE WEBHOOK SIMULATION TEST");
  console.log("=================================================");

  // 1. Load Firebase Client Settings config
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ firebase-applet-config.json not found!");
    process.exit(1);
  }
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  // 2. Initialize Firebase SDK client
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-07fa01e6-d6a1-4d4e-b05a-262a2373f3d7";
  const db = getFirestore(app, dbId);

  const testEmail = "douglas_teste@adshive.com";
  const testPassword = "AdshiveTestPassword2026!";

  try {
    console.log(`🔑 Authenticating test user: "${testEmail}"...`);
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const userId = userCredential.user.uid;
    console.log(`✅ Authenticated. User Unique ID (UID): "${userId}"`);

    // 3. Capture INITIAL DB state
    console.log("\n📸 Capturing INITIAL states before simulation...");
    
    // User doc
    const userRef = doc(db, "users", userId);
    const userSnapInit = await getDoc(userRef);
    const initialUser = userSnapInit.exists() ? userSnapInit.data() : null;
    console.log(`   - ["users"] -> Plan: "${initialUser?.plan || "N/A"}", Credits: ${initialUser?.credits || 0}, Status: "${initialUser?.subscriptionStatus || "N/A"}"`);

    // Fetch lists from database to compare
    const subsSnapInit = await getDocs(collection(db, "subscriptions"));
    const paymentsSnapInit = await getDocs(collection(db, "payments"));
    const logsSnapInit = await getDocs(collection(db, "activityLogs"));

    const initialSubsCount = subsSnapInit.size;
    const initialPaymentsCount = paymentsSnapInit.size;
    const initialLogsCount = logsSnapInit.size;

    console.log(`   - ["subscriptions"] count: ${initialSubsCount}`);
    console.log(`   - ["payments"] count: ${initialPaymentsCount}`);
    console.log(`   - ["activityLogs"] count: ${initialLogsCount}`);

    // 4. Fire simulation endpoint POST execution
    console.log("\n⚡ Broadcasting simulate request to: [/api/webhooks/asaas/simulate]...");
    const payload = {
      event: "PAYMENT_RECEIVED",
      userId: userId,
      planId: "pro",
      value: 97
    };

    const simResponse = await fetch("http://localhost:3000/api/webhooks/asaas/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const statusHttp = simResponse.status;
    const isOk = simResponse.ok;
    const resultObj = await simResponse.json();

    console.log(`🟢 Simulation HTTP Status returned: ${statusHttp} (${simResponse.statusText})`);
    console.log("📦 Received response payload:", JSON.stringify(resultObj, null, 2));

    if (!isOk) {
      throw new Error(`Server simulation endpoint returned status code ${statusHttp}`);
    }

    // 5. Short sleep delay to support asynchronous Firestore commits
    console.log("\n⏱️  Sleeping for 3 seconds to guarantee background commits write permanently...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Capture FINAL DB state
    console.log("\n📸 Capturing FINAL states after simulation...");
    const userSnapFinal = await getDoc(userRef);
    const finalUser = userSnapFinal.exists() ? userSnapFinal.data() : null;

    const subsSnapFinal = await getDocs(collection(db, "subscriptions"));
    const paymentsSnapFinal = await getDocs(collection(db, "payments"));
    const logsSnapFinal = await getDocs(collection(db, "activityLogs"));

    console.log("-------------------------------------------------");
    console.log("📊 SIMULATION REPORT OUTCOME");
    console.log("-------------------------------------------------");
    console.log(`* Status HTTP retornado: ${statusHttp}`);
    
    console.log("\n* Alterações na coleção [users]:");
    if (initialUser) {
      console.log(`   - Antes:  Plan: "${initialUser.plan}", Credits: ${initialUser.credits}, Status: "${initialUser.subscriptionStatus}"`);
      console.log(`   - Depois: Plan: "${finalUser?.plan}", Credits: ${finalUser?.credits}, Status: "${finalUser?.subscriptionStatus}"`);
    } else {
      console.log(`   - Criado: Plan: "${finalUser?.plan}", Credits: ${finalUser?.credits}, Status: "${finalUser?.subscriptionStatus}"`);
    }

    console.log("\n* Alterações na coleção [subscriptions]:");
    console.log(`   - Registros Anteriormente: ${initialSubsCount} -> Registros Atuais: ${subsSnapFinal.size}`);
    const userSubs = subsSnapFinal.docs.filter(d => d.data().userId === userId);
    console.log(`   - Assinaturas vinculadas a este usuário:`);
    userSubs.forEach(s => {
      console.log(`     👉 ID: "${s.id}", Status: "${s.data().status}", PlanId: "${s.data().planId}", Preço: R$${s.data().price || 0}`);
    });

    console.log("\n* Alterações na coleção [payments]:");
    console.log(`   - Registros Anteriormente: ${initialPaymentsCount} -> Registros Atuais: ${paymentsSnapFinal.size}`);
    const userPayments = paymentsSnapFinal.docs.filter(d => d.data().userId === userId);
    console.log(`   - Histórico de Pagamentos vinculado:`);
    userPayments.forEach(p => {
      console.log(`     👉 ID: "${p.id}", Status: "${p.data().status}", Amount: R$${p.data().amount || 0}, Método: "${p.data().method || "N/A"}"`);
    });

    console.log("\n* Alterações na coleção [activityLogs]:");
    console.log(`   - Registros Anteriormente: ${initialLogsCount} -> Registros Atuais: ${logsSnapFinal.size}`);
    const userLogs = logsSnapFinal.docs
      .filter(d => d.data().userId === userId)
      .map(d => d.data())
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(`   - Logs recentes vinculados (Top 3):`);
    userLogs.slice(0, 3).forEach(l => {
      console.log(`     👉 [${l.createdAt}] Ação: "${l.action}" - Detalhes: "${l.details}"`);
    });

    console.log("\n✅ Test execution completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test crashed due to error:", err.message);
    process.exit(1);
  }
}

main();
