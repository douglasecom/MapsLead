import React, { useState, useEffect } from "react";
import { 
  Key, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink, 
  Eye, EyeOff, HelpCircle, HardDrive, Cpu, Settings2, Sparkles, Check, Server
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { getApiUrl } from "../utils/api";

interface ServiceReport {
  status: "OK" | "FAIL" | "LOADING" | "IDLE";
  message: string;
}

interface ValidationReport {
  maps_js: ServiceReport;
  geocoding: ServiceReport;
  places: ServiceReport;
  billing: ServiceReport;
}

const initialReport: ValidationReport = {
  maps_js: { status: "IDLE", message: "Aguardando validação da chave." },
  geocoding: { status: "IDLE", message: "Aguardando validação da chave." },
  places: { status: "IDLE", message: "Aguardando validação da chave." },
  billing: { status: "IDLE", message: "Aguardando faturamento cadastrado." }
};

interface ApiConfigPanelProps {
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
}

export const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({ triggerNotification }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [billingConfig, setBillingConfig] = useState<string>("auto"); // "auto", "active", "inactive"
  
  const [validationReport, setValidationReport] = useState<ValidationReport>(initialReport);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});

  // Helper to persist both config and reports to Firestore (both globally and in the active user\'s document)
  const persistReportToFirestore = async (report: ValidationReport, keyStr: string = apiKey, bConfig: string = billingConfig) => {
    try {
      const cleanKey = keyStr.trim();
      const currentUid = auth.currentUser?.uid;
      
      // 1. Maintain global configuration
      const docRef = doc(db, "settings", "google_maps_config");
      await setDoc(docRef, {
        apiKey: cleanKey,
        billingConfig: bConfig,
        latestValidationReport: report,
        lastValidatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || "Administrador",
      }, { merge: true });

      // 2. Persist directly inside the active user\'s Firestore document (req. user schema requirement)
      if (currentUid) {
        const userRef = doc(db, "users", currentUid);
        await setDoc(userRef, {
          googleMapsConfig: {
            apiKey: cleanKey,
            billingConfig: bConfig,
            validationReport: report,
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser?.email || "Administrador"
          }
        }, { merge: true });
        console.log(`[Firestore Log] Sincronizado com sucesso no documento do usuário: users/${currentUid}`);
      }
    } catch (err) {
      console.error("Erro ao persistir configurações no Firestore:", err);
    }
  };

  // Initialize and load current configuration from Firestore and Server
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoadingConfig(true);
      try {
        let loadedKey = "";
        let loadedBilling = "auto";
        let loadedReport: ValidationReport | null = null;

        // 1. Try to load key & billing config from Firestore settings/google_maps_config
        const docRef = doc(db, "settings", "google_maps_config");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fsData = docSnap.data();
          loadedKey = fsData.apiKey || "";
          loadedBilling = fsData.billingConfig || "auto";
          if (fsData.latestValidationReport) {
            loadedReport = fsData.latestValidationReport;
          }
        }
        
        // 2. Supplement from user\'s personalized profile document
        const currentUid = auth.currentUser?.uid;
        if (currentUid) {
          const userRef = doc(db, "users", currentUid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.googleMapsConfig) {
              const uMaps = userData.googleMapsConfig;
              if (uMaps.apiKey && !loadedKey) {
                loadedKey = uMaps.apiKey;
              }
              if (uMaps.billingConfig && loadedBilling === "auto") {
                loadedBilling = uMaps.billingConfig;
              }
              if (uMaps.validationReport && !loadedReport) {
                loadedReport = uMaps.validationReport;
              }
            }
          }
        }
        
        // 3. Fallback check if the server environment has a live configuration
        const res = await fetch(getApiUrl("/api/config/maps"));
        if (res.ok) {
          const srvData = await res.json();
          if (srvData && srvData.hasKey && !loadedKey) {
            loadedKey = srvData.key || "";
          }
        }

        setBillingConfig(loadedBilling);
        if (loadedKey) {
          setApiKey(loadedKey);
          setHasExistingKey(true);
          setIsSaved(true);
        }
        if (loadedReport) {
          setValidationReport(loadedReport);
          const allOk = 
            loadedReport.maps_js.status === "OK" && 
            loadedReport.geocoding.status === "OK" && 
            loadedReport.places.status === "OK" && 
            loadedReport.billing.status === "OK";
          setValidationSuccess(allOk);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do Google Maps (Firestore/Server):", err);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    // Use active subscription to listen to user state resolves
    const unsubscribe = auth.onAuthStateChanged((user) => {
      loadConfig();
    });
    
    return () => unsubscribe();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      triggerNotification("Insira uma chave Google Maps válida.", "warning");
      return;
    }

    try {
      // 1. Save credentials and billing structure to both Firestore locations
      await persistReportToFirestore(validationReport, apiKey.trim(), billingConfig);

      // 2. Sync to local runtime variables
      const response = await fetch(getApiUrl("/api/config/maps/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey.trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar nas variáveis de ambiente");
      }

      triggerNotification("Chave do Google Maps e faturamento salvos no Firestore e ativados no servidor!", "success");
      setIsSaved(true);
      setHasExistingKey(true);
      
      // Auto-validate immediately after saving
      handleValidateKey(apiKey.trim());
    } catch (err: any) {
      triggerNotification(`Erro ao salvar configurações: ${err.message}`, "warning");
    }
  };

  const handleValidateKey = async (keyToValidate?: string) => {
    const targetKey = keyToValidate || apiKey.trim();
    if (!targetKey) {
      triggerNotification("Insira ou salve uma chave antes de validar.", "warning");
      return;
    }

    setIsValidating(true);
    setValidationSuccess(null);
    setValidationReport({
      maps_js: { status: "LOADING", message: "Conectando ao console do Google Cloud..." },
      geocoding: { status: "LOADING", message: "Conectando ao console do Google Cloud..." },
      places: { status: "LOADING", message: "Conectando ao console do Google Cloud..." },
      billing: { status: "LOADING", message: "Verificando faturamento..." }
    });

    try {
      const res = await fetch(getApiUrl("/api/config/maps/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: targetKey })
      });

      if (!res.ok) {
        throw new Error(`Erro na validação (${res.status})`);
      }

      const data = await res.json();
      if (data && data.report) {
        const adjustedReport = {
          maps_js: data.report.maps_js || { status: "IDLE", message: "Não coletado." },
          geocoding: data.report.geocoding || { status: "IDLE", message: "Não coletado." },
          places: data.report.places || { status: "IDLE", message: "Não coletado." },
          billing: data.report.billing || { status: "IDLE", message: "Não coletado." }
        };

        // If billing config is overridden manually to 'active', force billing status in report
        if (billingConfig === "active") {
          adjustedReport.billing = { status: "OK", message: "Faturamento [FORÇADO ATIVO] habilitado manualmente." };
        } else if (billingConfig === "inactive") {
          adjustedReport.billing = { status: "FAIL", message: "Faturamento [FORÇADO DESATIVADO] simulado como offline." };
        }

        setValidationReport(adjustedReport);
        await persistReportToFirestore(adjustedReport, targetKey, billingConfig);

        const allOk = 
          adjustedReport.maps_js.status === "OK" && 
          adjustedReport.geocoding.status === "OK" && 
          adjustedReport.places.status === "OK" && 
          adjustedReport.billing.status === "OK";
        
        setValidationSuccess(allOk);
        if (allOk) {
          triggerNotification("Chave validada! Todos os microsserviços do Google Maps estão operando normalmente.", "success");
        } else {
          triggerNotification("Validação concluída com avisos/falhas nos microsserviços.", "warning");
        }
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Falha ao comunicar com os endpoints de validação.", "warning");
      const errReport: ValidationReport = {
        maps_js: { status: "FAIL", message: `Erro: ${err.message}` },
        geocoding: { status: "FAIL", message: "Verificação abortada." },
        places: { status: "FAIL", message: "Verificação abortada." },
        billing: { status: "FAIL", message: "Verificação abortada." }
      };
      setValidationReport(errReport);
      await persistReportToFirestore(errReport, targetKey, billingConfig);
      setValidationSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateSingleService = async (service: "maps_js" | "geocoding" | "places" | "billing") => {
    // If billing is configured as force-active or force-inactive, handle instantly without API query
    if (service === "billing" && billingConfig !== "auto") {
      const status = billingConfig === "active" ? "OK" : "FAIL";
      const message = billingConfig === "active" 
        ? "Faturamento [FORÇADO ATIVO] habilitado manualmente no Firestore."
        : "Faturamento [FORÇADO DESATIVADO] simulado como offline.";
      
      setValidationReport(prev => {
        const next = {
          ...prev,
          billing: { status, message }
        };
        persistReportToFirestore(next, apiKey, billingConfig);
        return next;
      });
      triggerNotification(`Serviço BILLING configurado como [FORÇADO]!`, "success");
      return;
    }

    const targetKey = apiKey.trim();
    if (!targetKey) {
      triggerNotification("Insira ou salve uma chave antes de validar.", "warning");
      return;
    }

    setLoadingServices(prev => ({ ...prev, [service]: true }));
    setValidationReport(prev => ({
      ...prev,
      [service]: { status: "LOADING", message: "Conectando ao console do Google Cloud..." }
    }));

    try {
      const res = await fetch(getApiUrl("/api/config/maps/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: targetKey, service })
      });

      if (!res.ok) {
        throw new Error(`Erro na validação do serviço (${res.status})`);
      }

      const data = await res.json();
      if (data && data.report) {
        const rawReport = data.report[service];
        let finalReport = rawReport;

        if (service === "billing" && billingConfig === "active") {
          finalReport = { status: "OK", message: "Faturamento [FORÇADO ATIVO] habilitado manualmente." };
        } else if (service === "billing" && billingConfig === "inactive") {
          finalReport = { status: "FAIL", message: "Faturamento [FORÇADO DESATIVADO] simulado como offline." };
        }

        if (finalReport) {
          setValidationReport(prev => {
            const next = {
              ...prev,
              [service]: finalReport
            };
            persistReportToFirestore(next, targetKey, billingConfig);
            return next;
          });
          
          if (finalReport.status === "OK") {
            triggerNotification(`Serviço ${service.replace("_", " ").toUpperCase()} validado com sucesso!`, "success");
          } else {
            triggerNotification(`Serviço ${service.replace("_", " ").toUpperCase()} falhou ou está inativo no GCP.`, "warning");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setValidationReport(prev => {
        const next = {
          ...prev,
          [service]: { status: "FAIL", message: `Erro ao testar o serviço: ${err.message}` }
        };
        persistReportToFirestore(next, targetKey, billingConfig);
        return next;
      });
      triggerNotification(`Falha ao testar serviço ${service.replace("_", " ").toUpperCase()}: ${err.message}`, "warning");
    } finally {
      setLoadingServices(prev => ({ ...prev, [service]: false }));
    }
  };

  const renderStatusBadge = (status: "OK" | "FAIL" | "LOADING" | "IDLE") => {
    switch (status) {
      case "OK":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Operacional
          </span>
        );
      case "FAIL":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Falhou / Inativo
          </span>
        );
      case "LOADING":
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse shrink-0">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> Verificando...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
            Não testado
          </span>
        );
    }
  };

  return (
    <div id="ApiConfigPanel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-550/10 text-indigo-400 p-1.5 rounded-lg border border-indigo-550/10">
              <Settings2 className="w-5 h-5 text-indigo-400" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Console de Credenciais Google Cloud</h2>
          </div>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Configure, sincronize com o Firestore e audite as chaves de API do Google Maps para os serviços de geomapeamento, pesquisa inteligente de Leads regionais, plotagem de rotas e status do faturamento do Google Cloud.
          </p>
        </div>
        
        <div className="flex gap-2">
          <a 
            href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp-code-assist-ais" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-755 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer"
          >
            Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* API Credentials Input Form Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-870/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Chave de API & Firestore Config
            </h3>

            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Carregando dados unificados do Firestore...
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">
                    Google Maps Platform API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setIsSaved(false);
                      }}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-900 border border-slate-755 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono pr-12 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {hasExistingKey && isSaved && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-emerald-400 font-semibold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Chave ativa registrada e persistida no Firestore.
                    </div>
                  )}
                </div>

                {/* Configuration of Google Cloud Billing Status */}
                <div className="border-t border-slate-800/80 pt-4">
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">
                    Configuração do Status do Faturamento (GCP Billing Status)
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBillingConfig("auto");
                        setIsSaved(false);
                      }}
                      className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        billingConfig === "auto" 
                          ? "bg-slate-800 text-white border-indigo-500 shadow-md"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Automático</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBillingConfig("active");
                        setIsSaved(false);
                      }}
                      className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        billingConfig === "active" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-md"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Forçar Ativo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBillingConfig("inactive");
                        setIsSaved(false);
                      }}
                      className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        billingConfig === "inactive" 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30 (DANGER) shadow-md"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Forçar Off</span>
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    {billingConfig === "auto" && "• Validação inteligente remota: O sistema verifica diretamente nos servidores do Google se a chave possui faturamento ativo."}
                    {billingConfig === "active" && "• Homologação manual ativa: Ignora erros de quota e força o faturamento ativo no Firestore, liberando os canais visuais."}
                    {billingConfig === "inactive" && "• Modo Sandbox Simulador: Intercepta requisições de Leads reais para poupar custos corporativos do Google Cloud."}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={handleSaveKey}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-[0.98]"
                  >
                    Salvar no Firestore & Ativar
                  </button>
                  <button
                    onClick={() => handleValidateKey()}
                    disabled={isValidating || !apiKey}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-300 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
                      </>
                    ) : (
                      <>
                        <Server className="w-3.5 h-3.5 text-indigo-400" /> Testar Todos
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Setup Guide Step-by-Step */}
          <div className="bg-slate-870/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Ativação dos Microsserviços e APIs
            </h3>
            
            <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-300 font-sans block mb-0.5">Vincular Conta de Faturamento (GCP Billing)</strong>
                  O Google exige uma conta de faturamento ativa com cartão de crédito válido. Você ganha <strong className="text-slate-300">U$ 200,00 de bônus mensais</strong> gratuitos, que costumam cobrir até 10.000 buscas geográficas de leads.
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-300 font-sans block mb-0.5">Ativar as APIs de Interesse</strong>
                  Insira a chave obtida no painel GCP. Certifique-se de que os seguintes serviços estão habilitados:
                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-slate-400">
                    <li><strong className="text-slate-300">Maps JavaScript API</strong> (para mapas do dashboard)</li>
                    <li><strong className="text-slate-300">Geocoding API</strong> (conversão de endereços de SDRs/leads)</li>
                    <li><strong className="text-slate-300">Places API (New)</strong> (pesquisa de Leads locais no CRM)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual API services status panel Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-870/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Status de Auditoria dos Microsserviços
            </h3>

            <div className="space-y-3">
              {/* Maps JS api Row */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                    Maps JavaScript API
                    <span className="text-[10px] text-slate-500 font-mono font-medium">(Renderização de Mapas)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {validationReport.maps_js.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {renderStatusBadge(validationReport.maps_js.status)}
                  <button
                    onClick={() => handleValidateSingleService("maps_js")}
                    disabled={isValidating || loadingServices.maps_js || !apiKey}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 rounded px-2.5 py-1 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingServices.maps_js ? "animate-spin" : ""}`} />
                    Testar
                  </button>
                </div>
              </div>

              {/* Geocoding API Row */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                    Geocoding API
                    <span className="text-[10px] text-slate-500 font-mono font-medium">(Endereços & Geolocalização)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {validationReport.geocoding.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {renderStatusBadge(validationReport.geocoding.status)}
                  <button
                    onClick={() => handleValidateSingleService("geocoding")}
                    disabled={isValidating || loadingServices.geocoding || !apiKey}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 rounded px-2.5 py-1 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingServices.geocoding ? "animate-spin" : ""}`} />
                    Testar
                  </button>
                </div>
              </div>

              {/* Places API (New) Row */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                    Places API (New)
                    <span className="text-[10px] text-slate-500 font-mono font-medium">(Captação de Leads Comercias)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {validationReport.places.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {renderStatusBadge(validationReport.places.status)}
                  <button
                    onClick={() => handleValidateSingleService("places")}
                    disabled={isValidating || loadingServices.places || !apiKey}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 rounded px-2.5 py-1 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingServices.places ? "animate-spin" : ""}`} />
                    Testar
                  </button>
                </div>
              </div>

              {/* Billing API Row */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                    Faturamento Google Cloud
                    <span className="text-[10px] text-slate-500 font-mono font-medium">(Ativação & Conta Financeira)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {validationReport.billing.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {renderStatusBadge(validationReport.billing.status)}
                  <button
                    onClick={() => handleValidateSingleService("billing")}
                    disabled={isValidating || loadingServices.billing || !apiKey}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 rounded px-2.5 py-1 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingServices.billing ? "animate-spin" : ""}`} />
                    Testar
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Outcome Banner */}
            {validationSuccess !== null && (
              <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3 ${
                validationSuccess 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/5 border-rose-500/20 text-rose-400"
              }`}>
                {validationSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold font-sans text-emerald-500">Credencial 100% Homologada</h4>
                      <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                        Sua chave de API do Google Maps foi cadastrada com sucesso no Firestore, possui faturamento ativo e todas os serviços estão funcionando perfeitamente em produção.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold font-sans text-rose-500">Ação Corretiva Recomendada</h4>
                      <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                        Um ou mais testes de microsserviços falharam. Certifique-se de que as APIs estejam ativadas individualmente e que o faturamento esteja ativo no console. Você também pode escolher "Forçar Ativo" para superar travas de verificação automatizadas.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Real-time Usage Alert Callout */}
          <div className="bg-slate-850/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <span className="p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <div className="space-y-0.5">
              <h4 className="text-[10px] tracking-wide uppercase font-extrabold text-amber-500">Quota & Limite de Custos</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                As consultas e auditorias geográficas geolocalizadas consomem créditos de requisição do Google Maps. Para blindar seu caixa contra requisições imprevistas, configure limites diários de orçamentos (APIs & Services → Quotas) de no máximo 100 consultas por dia.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
