import React, { useState, useEffect } from "react";
import { 
  Activity, Database, Bot, CreditCard, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, Sparkles, Terminal, FileCode, Check, Send
} from "lucide-react";
import { ApiConfigPanel } from "./ApiConfigPanel";
import { getApiUrl } from "../utils/api";

interface IntegrationStatus {
  status: "OK" | "FAIL" | "LOADING" | "IDLE";
  message: string;
}

interface IntegrationsReport {
  firebase: IntegrationStatus;
  gemini: IntegrationStatus;
  asaas: IntegrationStatus;
}

interface SystemHealthDashboardProps {
  triggerNotification: (text: string, type: "success" | "warning" | "info") => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ triggerNotification }) => {
  const [report, setReport] = useState<IntegrationsReport>({
    firebase: { status: "IDLE", message: "Conectando ao microsserviço..." },
    gemini: { status: "IDLE", message: "Conectando ao microsserviço..." },
    asaas: { status: "IDLE", message: "Conectando ao microsserviço..." }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const fetchIntegrationsHealth = async (isManual = false) => {
    setIsLoading(true);
    setReport({
      firebase: { status: "LOADING", message: "Avaliando leitura/escrita..." },
      gemini: { status: "LOADING", message: "Consultando modelo..." },
      asaas: { status: "LOADING", message: "Verificando limites de quota..." }
    });

    try {
      const response = await fetch(getApiUrl("/api/health/integrations"));
      if (!response.ok) {
        throw new Error(`Erro na rota de diagnósticos (${response.status})`);
      }
      
      const data = await response.json();
      if (data && data.report) {
        setReport(data.report);
        
        // Populate debug/warning log streams if any service failed
        const newLogs: string[] = [];
        const dateStr = new Date().toLocaleTimeString();
        
        if (data.report.firebase.status === "FAIL") {
          newLogs.push(`[${dateStr}] [FIREBASE_FAIL] ${data.report.firebase.message}`);
        }
        if (data.report.gemini.status === "FAIL") {
          newLogs.push(`[${dateStr}] [GEMINI_FAIL] ${data.report.gemini.message}`);
        }
        if (data.report.asaas.status === "FAIL") {
          newLogs.push(`[${dateStr}] [ASAAS_FAIL] ${data.report.asaas.message}`);
        }
        
        if (newLogs.length === 0) {
          newLogs.push(`[${dateStr}] [HEALTH_OK] Todos os servidores de integração estão respondendo normalmente.`);
        }
        
        setErrorLogs(prev => [...newLogs, ...prev].slice(0, 15));
        
        if (isManual) {
          const allOk = 
            data.report.firebase.status === "OK" && 
            data.report.gemini.status === "OK" && 
            data.report.asaas.status === "OK";
            
          if (allOk) {
            triggerNotification("Diagnósticos saudáveis! Todas as integrações estão prontas.", "success");
          } else {
            triggerNotification("Problemas auditados. Verifique as falhas nos cartões de status.", "warning");
          }
        }
      }
    } catch (err: any) {
      console.error("Erro ao rodar diagnóstico de saúde:", err);
      const failState: IntegrationStatus = { 
        status: "FAIL", 
        message: `Servidor indisponível ou erro inesperado de rede: ${err.message}` 
      };
      setReport({
        firebase: failState,
        gemini: failState,
        asaas: failState
      });
      setErrorLogs(prev => [`[${new Date().toLocaleTimeString()}] [SYSTEM_ERROR] ${err.message}`, ...prev]);
      if (isManual) {
        triggerNotification(`Falha de comunicação com o servidor de saúde: ${err.message}`, "warning");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsHealth();
  }, []);

  const renderStatusIndicator = (status: "OK" | "FAIL" | "LOADING" | "IDLE") => {
    switch (status) {
      case "OK":
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>OPERACIONAL</span>
          </div>
        );
      case "FAIL":
        return (
          <div className="flex items-center gap-1.5 text-rose-450 text-xs font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-550/20">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>FALHA DETECTADA</span>
          </div>
        );
      case "LOADING":
        return (
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 animate-pulse">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>TESTANDO...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <span>AGUARDANDO</span>
          </div>
        );
    }
  };

  return (
    <div id="SystemHealthDashboard" className="space-y-8 font-sans">
      
      {/* Upper Status Row with Quick Statistics */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <div className="bg-purple-600/10 text-purple-400 p-3.5 rounded-2xl border border-purple-550/20 shrink-0">
            <Activity className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Status do Ecossistema SaaS
              <span className="bg-red-500/10 text-red-400 text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border border-red-500/20">
                Acesso Owner
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mt-0.5">
              Console de diagnóstico em tempo real que analisa APIs, credenciais e gateways externos para evitar instabilidades ou 404s operacionais.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchIntegrationsHealth(true)}
          disabled={isLoading}
          className="w-full md:w-auto bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-205 font-bold text-xs px-5 py-3 rounded-xl border border-slate-705 transition-all flex items-center justify-center gap-2 shadow-md hover:text-white cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          <span>Forçar Recarga Total</span>
        </button>
      </div>

      {/* Grid of integration diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Firebase Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/10">
                <Database className="w-6 h-6 text-orange-500" />
              </span>
              {renderStatusIndicator(report.firebase.status)}
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-slate-100 font-sans">Firebase Firestore</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-1">
                Serviço de persistência durável no ecossistema de nuvem. Armazena as assinaturas, leads capturados, SDRs, regras do CRM e credenciais de forma segura em tempo real.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1">MÉTRICA DOS DISPOSITIVOS</span>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              {report.firebase.message}
            </p>
          </div>
        </div>

        {/* Gemini Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                <Bot className="w-6 h-6 text-indigo-400" />
              </span>
              {renderStatusIndicator(report.gemini.status)}
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-slate-100 font-sans">Google Gemini AI</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-1">
                Motor de linguagem generativa que organiza B2B pitches, constrói e personaliza propostas automatizadas baseadas no nicho comercial do cliente.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1">AUDITORIA DE MODELO</span>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              {report.gemini.message}
            </p>
          </div>
        </div>

        {/* Asaas Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </span>
              {renderStatusIndicator(report.asaas.status)}
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-slate-100 font-sans">Asaas API Gateway</h3>
              <p className="text-slate-400 text-xs leading-relaxed mt-1">
                Portal transacional de recebimento de Pix e assinatura recorrente dos planos no AdsHive. Responsável por liberar e atualizar saldos de créditos de Leads no banco.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4 mt-6 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1">DADOS DE INFRAESTRUTURA</span>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              {report.asaas.message}
            </p>
          </div>
        </div>

      </div>

      {/* Embedded Google Maps Credential Management Panel */}
      <div id="google-maps-setup-section" className="space-y-4">
        <div className="flex items-center gap-2 text-left px-1">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-md uppercase font-black text-slate-200 tracking-wider">Habilitar & Ajustar Chaves do Google Maps</h2>
        </div>
        <ApiConfigPanel triggerNotification={triggerNotification} />
      </div>

      {/* Live Error Logs Stream Terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-slate-805 text-slate-400 border border-slate-800">
              <Terminal className="w-4 h-4 text-purple-400" />
            </span>
            <div className="text-left">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-205">Terminal Técnico de Logger & Erros</h3>
              <p className="text-[10.5px] text-slate-400">Linha cronológica das últimas consultas e respostas da plataforma local.</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-[10px] uppercase tracking-wider text-purple-400 hover:text-purple-300 font-bold bg-purple-500/5 hover:bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/15 transition-all cursor-pointer"
          >
            {showLogs ? "Esconder Histórico" : "Mostrar Histórico"}
          </button>
        </div>

        {showLogs && (
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 border border-slate-850 max-h-60 overflow-y-auto text-left leading-relaxed">
            {errorLogs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-4">
                Nenhum evento registrado no logger local. Execute uma validação acima para alimentar o log.
              </div>
            ) : (
              errorLogs.map((log, index) => {
                let colorClass = "text-slate-400";
                if (log.includes("[FAIL]") || log.includes("[SYSTEM_ERROR]")) {
                  colorClass = "text-rose-405 font-bold";
                } else if (log.includes("[HEALTH_OK]")) {
                  colorClass = "text-emerald-400 font-semibold";
                }
                return (
                  <div key={index} className={`border-b border-slate-900/40 pb-1 ${colorClass}`}>
                    &gt; {log}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
};
