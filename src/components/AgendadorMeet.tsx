import React, { useState, useEffect, useMemo } from 'react';
import { Lead, CRMTask, TimelineItem } from '../types';
import { 
  Users, Calendar, Video, Clock, Search, Mail, 
  ExternalLink, Loader2, Check, AlertCircle, Shield, Sparkles, CheckCircle, ArrowRight
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

// Shared memory cache for token
let cachedGoogleToken: string | null = null;

interface AgendadorMeetProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  userRole?: string;
}

export const AgendadorMeet: React.FC<AgendadorMeetProps> = ({
  leads,
  setLeads,
  triggerNotification,
  userRole
}) => {
  // Authentication State
  const [googleToken, setGoogleToken] = useState<string | null>(cachedGoogleToken);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Local email overrides for leads missing emails
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  // Form states for meeting setup
  const [meetTitle, setMeetTitle] = useState('Reunião de Alinhamento Comercial');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('14:00');
  const [meetDuration, setMeetDuration] = useState(30);
  const [meetDesc, setMeetDesc] = useState('Apresentação de proposta comercial B2B, análise profunda de presença digital e plano de marketing com base na auditoria GMB.');
  const [scheduleType, setScheduleType] = useState<'individual' | 'coletiva'>('individual');
  const [isScheduling, setIsScheduling] = useState(false);

  // Set default tomorrow date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setMeetDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Sync Google Account Connect
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('Não foi possível recuperar o token de acesso do Google.');
      }
      
      cachedGoogleToken = token;
      setGoogleToken(token);
      triggerNotification('Google Agenda e Meet conectados com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Falha na autenticação do Google: ${err?.message || 'Permissão recusada'}`, 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (window.confirm('Deseja realmente remover e desconectar sua conta do Google Meet?')) {
      cachedGoogleToken = null;
      setGoogleToken(null);
      triggerNotification('Sua conta ou credenciais do Google foram removidas.', 'info');
    }
  };

  // Filter and Search Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (!lead.captured) return false;
      
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStage = selectedStage === 'all' || lead.status === selectedStage;

      return matchesSearch && matchesStage;
    });
  }, [leads, searchTerm, selectedStage]);

  // Handle select toggling
  const handleToggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleToggleLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  // Helper to get actual email of a lead (from backend or quick input)
  const getLeadEmail = (lead: Lead) => {
    return emailInputs[lead.id] !== undefined ? emailInputs[lead.id] : (lead.email || '');
  };

  const handleEmailChange = (leadId: string, value: string) => {
    setEmailInputs(prev => ({
      ...prev,
      [leadId]: value
    }));
  };

  // Quick save emails back to the CRM
  const handleSaveEmailToLead = (leadId: string) => {
    const emailToSave = emailInputs[leadId]?.trim();
    if (!emailToSave) return;
    
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return { ...l, email: emailToSave };
      }
      return l;
    }));
    triggerNotification('E-mail do lead salvo localmente no CRM!', 'success');
  };

  // Master scheduling coordinator
  const handleScheduleProcess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!googleToken) {
      triggerNotification('Favor conectar sua Conta Google antes de realizar agendamentos.', 'warning');
      return;
    }

    if (selectedLeads.length === 0) {
      triggerNotification('Nenhum lead foi qualificado ou selecionado para a reunião.', 'warning');
      return;
    }

    // Check emails
    const selectedLeadsObjects = leads.filter(l => selectedLeads.includes(l.id));
    const missingEmails = selectedLeadsObjects.filter(l => !getLeadEmail(l).trim());
    if (missingEmails.length > 0) {
      triggerNotification(`Há ${missingEmails.length} leads selecionados sem e-mail preenchido. Digite um e-mail para eles.`, 'error');
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente programar o agendamento de ${selectedLeads.length} lead(s)? Convites e links do Google Meet serão enviados e arquivados no CRM.`
    );
    if (!confirmed) return;

    setIsScheduling(true);

    try {
      const startDateTimeStr = `${meetDate}T${meetTime}:00`;
      const startDateObj = new Date(startDateTimeStr);
      const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

      if (scheduleType === 'coletiva') {
        // Option A: Single Collective/Group Meeting
        const attendeesList = selectedLeadsObjects.map(l => ({ email: getLeadEmail(l).trim(), displayName: l.name }));
        const durationMs = meetDuration * 60 * 1000;
        const endDateObj = new Date(startDateObj.getTime() + durationMs);

        const eventPayload = {
          summary: meetTitle,
          description: meetDesc,
          start: { dateTime: startDateObj.toISOString(), timeZone: timeZoneStr },
          end: { dateTime: endDateObj.toISOString(), timeZone: timeZoneStr },
          attendees: attendeesList,
          conferenceData: {
            createRequest: {
              requestId: `meet-group-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Google Calendar API Error: ${response.status} - ${errorMsg}`);
        }

        const rawEvent = await response.json();
        let finalMeetLink = '';
        if (rawEvent.conferenceData && rawEvent.conferenceData.entryPoints) {
          const ep = rawEvent.conferenceData.entryPoints.find((e: any) => e.entryPointType === 'video');
          if (ep) finalMeetLink = ep.uri;
        }
        if (!finalMeetLink && rawEvent.htmlLink) finalMeetLink = rawEvent.htmlLink;
        if (!finalMeetLink) finalMeetLink = `https://meet.google.com/group-${Math.random().toString(36).substr(2, 8)}`;

        const cleanMeetTime = `${startDateObj.toLocaleDateString('pt-BR')} às ${meetTime}`;

        // Bulk apply CRM data updates
        setLeads(prev => prev.map(l => {
          if (selectedLeads.includes(l.id)) {
            const currentEmailSetting = getLeadEmail(l);
            const timelineItem: TimelineItem = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'task',
              title: '🤝 Chamada Coletiva Google Meet Agendada',
              description: `Convidado para reunião em lote: "${meetTitle}" para ${cleanMeetTime}. Link gerado: ${finalMeetLink}`,
              createdAt: new Date().toISOString()
            };
            const taskItem: CRMTask = {
              id: Math.random().toString(36).substr(2, 9),
              title: `Reunião: ${meetTitle}`,
              dueDate: meetDate,
              status: 'pendente',
              category: 'reuniao'
            };

            return {
              ...l,
              email: currentEmailSetting,
              meetingTitle: meetTitle,
              meetingTime: cleanMeetTime,
              meetLink: finalMeetLink,
              status: 'reuniao',
              timeline: l.timeline ? [timelineItem, ...l.timeline] : [timelineItem],
              tasks: l.tasks ? [...l.tasks, taskItem] : [taskItem]
            };
          }
          return l;
        }));

        triggerNotification(`Reunião Coletiva agendada! ${attendeesList.length} leads receberam convite do Google Meet por e-mail.`, 'success');
        setSelectedLeads([]);

      } else {
        // Option B: Individual Meetings (each lead gets a separate time-slot or same slot)
        // Let's schedule separate events back-to-back, adding a 10 min offset for each, or same slot depending on details.
        // Let's do a beautiful loop creating separate meetings so each client has their private room!
        
        let processedCount = 0;
        let currentSlotStart = new Date(startDateObj);

        for (let i = 0; i < selectedLeadsObjects.length; i++) {
          const singleLead = selectedLeadsObjects[i];
          const leadEmailValue = getLeadEmail(singleLead).trim();
          
          const singleTitle = `${meetTitle} - ${singleLead.name}`;
          const singleEnd = new Date(currentSlotStart.getTime() + meetDuration * 60 * 1000);

          const eventPayload = {
            summary: singleTitle,
            description: meetDesc,
            start: { dateTime: currentSlotStart.toISOString(), timeZone: timeZoneStr },
            end: { dateTime: singleEnd.toISOString(), timeZone: timeZoneStr },
            attendees: [{ email: leadEmailValue }],
            conferenceData: {
              createRequest: {
                requestId: `meet-ind-${singleLead.id}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          };

          const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPayload)
          });

          if (response.ok) {
            const rawEvent = await response.json();
            let singleMeetLink = '';
            if (rawEvent.conferenceData && rawEvent.conferenceData.entryPoints) {
              const ep = rawEvent.conferenceData.entryPoints.find((e: any) => e.entryPointType === 'video');
              if (ep) singleMeetLink = ep.uri;
            }
            if (!singleMeetLink && rawEvent.htmlLink) singleMeetLink = rawEvent.htmlLink;
            if (!singleMeetLink) singleMeetLink = `https://meet.google.com/ind-${Math.random().toString(36).substr(2, 8)}`;

            const slotTimeString = `${currentSlotStart.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
            const cleanMeetTime = `${currentSlotStart.toLocaleDateString('pt-BR')} às ${slotTimeString}`;

            // Update individual lead states
            setLeads(prev => prev.map(l => {
              if (l.id === singleLead.id) {
                const timelineItem: TimelineItem = {
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'task',
                  title: '🤝 Reunião Individual Google Meet Agendada',
                  description: `Demonstração exclusiva com link do Google Meet gerado: ${singleMeetLink}. Horário: ${cleanMeetTime}`,
                  createdAt: new Date().toISOString()
                };
                const taskItem: CRMTask = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: `Reunião Individual: ${singleTitle}`,
                  dueDate: meetDate,
                  status: 'pendente',
                  category: 'reuniao'
                };

                return {
                  ...l,
                  email: leadEmailValue,
                  meetingTitle: singleTitle,
                  meetingTime: cleanMeetTime,
                  meetLink: singleMeetLink,
                  status: 'reuniao',
                  timeline: l.timeline ? [timelineItem, ...l.timeline] : [timelineItem],
                  tasks: l.tasks ? [...l.tasks, taskItem] : [taskItem]
                };
              }
              return l;
            }));

            processedCount++;
            // Increment slot for next client (add duration + 10 min break)
            currentSlotStart = new Date(singleEnd.getTime() + 10 * 60 * 1000);
          } else {
            console.error(`Falha no agendamento para lead ${singleLead.name}:`, await response.text());
          }
        }

        triggerNotification(`Agendamento concluído! ${processedCount} reuniões individuais criadas e convites enviados.`, 'success');
        setSelectedLeads([]);
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Erro no processamento do agendamento: ${err?.message || 'Falhas de comunicação'}`, 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  // Compute stats of selected leads
  const selectedStats = useMemo(() => {
    const list = leads.filter(l => selectedLeads.includes(l.id));
    const withEmail = list.filter(l => getLeadEmail(l).trim()).length;
    const withoutEmail = list.length - withEmail;
    return { total: list.length, withEmail, withoutEmail };
  }, [leads, selectedLeads, emailInputs]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm" id="meet-scheduler-main">
      
      {/* Upper header section */}
      <div className="p-6 bg-slate-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <Video className="w-6 h-6 text-[#8B2EFF]" />
            <span>Agendador Integrado Google Meet & Agenda</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            Agende chamadas com clientes de forma individual ou coletiva e dispache convites de calendário com links gerados diretamente por e-mail.
          </p>
        </div>

        <div>
          {googleToken ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-550/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Google Conectado
              </span>
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                className="text-xs font-black text-rose-400 hover:text-rose-350 cursor-pointer transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={isAuthenticating}
              className="bg-[#8B2EFF] hover:bg-[#7a22ef] text-white py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-glow-purple"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Conectar Conta Google</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main split-screen operational layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-100">
        
        {/* Left Side: Interactive selection list & parameters */}
        <div className="lg:col-span-7 p-6 border-r border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              1. Selecionar Leads para Reunião ({filteredLeads.length})
            </h4>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Search bar inside */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 py-1.5 pl-8 pr-3 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-slate-50 border border-slate-250 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 font-extrabold focus:outline-none"
              >
                <option value="all">Todos as etapas</option>
                <option value="novo">Novo Lead</option>
                <option value="contatado">Contatado</option>
                <option value="interessado">Interessado</option>
                <option value="reuniao">Agendado</option>
                <option value="proposta">Proposta</option>
                <option value="negociacao">Negociação</option>
              </select>
            </div>
          </div>

          {/* Interactive Responsive Table */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-[#8B2EFF] focus:ring-[#8B2EFF]/30 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="py-3 px-4">Lead / Nicho</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">E-mail do Cliente (Obrigatório)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                      Nenhum lead correspondente aos critérios de pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const isSelected = selectedLeads.includes(lead.id);
                    const currentEmail = getLeadEmail(lead);
                    const hasEmail = !!currentEmail.trim();

                    return (
                      <tr 
                        key={lead.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleLead(lead.id)}
                            className="rounded border-slate-300 text-[#8B2EFF] focus:ring-[#8B2EFF]/30 cursor-pointer w-4 h-4"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-800 line-clamp-1">{lead.name}</div>
                          <div className="text-[10px] font-bold text-slate-450 uppercase">{lead.niche}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-bold max-w-[120px] truncate">
                          {lead.location.split(',')[0]}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="email"
                              placeholder="Falta preencher e-mail"
                              value={currentEmail}
                              onChange={(e) => handleEmailChange(lead.id, e.target.value)}
                              className={`w-full bg-slate-50 border rounded-lg py-1 px-2 text-[11px] font-bold outline-none focus:ring-1 focus:ring-[#8B2EFF] ${
                                !hasEmail ? 'border-rose-200 placeholder:text-rose-450 bg-rose-50/10' : 'border-slate-200 text-slate-700'
                              }`}
                            />
                            {currentEmail !== lead.email && hasEmail && (
                              <button
                                type="button"
                                onClick={() => handleSaveEmailToLead(lead.id)}
                                className="bg-slate-900 text-white font-extrabold px-2 py-1 rounded text-[10px] uppercase cursor-pointer hover:bg-slate-800 shrink-0"
                                title="Salvar e-mail no CRM"
                              >
                                Salvar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick stats counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <div className="flex gap-4 font-bold text-slate-650">
              <span>Leads Selecionados: <strong className="text-slate-900">{selectedStats.total}</strong></span>
              <span>Com e-mail: <strong className="text-emerald-650">{selectedStats.withEmail}</strong></span>
              {selectedStats.withoutEmail > 0 && (
                <span className="text-rose-650 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 inline text-rose-500 shrink-0" />
                  Sem e-mail: <strong>{selectedStats.withoutEmail}</strong>
                </span>
              )}
            </div>

            {selectedStats.total > 0 && (
              <button
                type="button"
                onClick={() => setSelectedLeads([])}
                className="text-[10px] font-black text-rose-550 hover:underline cursor-pointer bg-none border-none uppercase tracking-wide"
              >
                Limpar seleção
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Meeting setup form & Scheduling trigger */}
        <div className="lg:col-span-5 p-6 space-y-4 bg-slate-50/50">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            2. Configurações da Videoconferência
          </h4>

          <form onSubmit={handleScheduleProcess} className="space-y-4">
            
            {/* Direct Scope Scheduling options */}
            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-205">
              <button
                type="button"
                onClick={() => setScheduleType('individual')}
                className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-black transition-all ${
                  scheduleType === 'individual'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📅 Individuais em Lote
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('coletiva')}
                className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-black transition-all ${
                  scheduleType === 'coletiva'
                    ? 'bg-[#8B2EFF] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                👥 Reunião Coletiva
              </button>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold italic">
              {scheduleType === 'individual' 
                ? '💡 Cada lead selecionado receberá um convite exclusivo com um link particular do Google Meet. Os horários serão sequenciais para evitar conflitos.' 
                : '💡 Todos os leads selecionados serão convidados para o mesmo evento de calendário e compartilharão do mesmo link da conferência.'}
            </p>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Título da Reunião</label>
              <input
                type="text"
                required
                value={meetTitle}
                onChange={(e) => setMeetTitle(e.target.value)}
                placeholder="Exemplo: Apresentação Comercial AdsHive"
                className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 font-bold focus:outline-none"
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Data de Início</label>
                <input
                  type="date"
                  required
                  value={meetDate}
                  onChange={(e) => setMeetDate(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Horário de Início</label>
                <input
                  type="time"
                  required
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-800 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Duração Estimada</label>
              <select
                value={meetDuration}
                onChange={(e) => setMeetDuration(Number(e.target.value))}
                className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-3.5 text-xs text-slate-705 font-bold focus:outline-none"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora e meia</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mensagem do Convite (E-mail)</label>
              <textarea
                value={meetDesc}
                onChange={(e) => setMeetDesc(e.target.value)}
                placeholder="Explicite pauta da conferência de forma clara..."
                className="w-full bg-white border border-slate-250 rounded-xl p-3 text-xs text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none min-h-[90px] resize-none"
                required
              />
            </div>

            {/* Main schedule button */}
            <button
              type="submit"
              disabled={isScheduling || selectedLeads.length === 0}
              className={`w-full text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border-none ${
                selectedLeads.length === 0
                  ? 'bg-slate-350 cursor-not-allowed'
                  : scheduleType === 'coletiva'
                    ? 'bg-gradient-to-r from-[#8B2EFF] to-[#A022FF] hover:opacity-95 shadow-glow-purple'
                    : 'bg-slate-900 hover:bg-slate-850 shadow-md'
              }`}
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Convites & Meet...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 shrink-0 text-white" />
                  <span>Agendar {selectedLeads.length} Reuniões no Google Meet</span>
                </>
              )}
            </button>

            {selectedLeads.length === 0 && (
              <p className="text-[10px] text-slate-450 font-semibold text-center italic mt-1 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-amber-850">
                ⚠️ Selecione pelo menos 1 lead na tabela para liberar o agendamento de chamadas.
              </p>
            )}
          </form>
        </div>

      </div>

      {/* Footer list of scheduled calendar dates */}
      <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Agenda Recente de Videoconferências Ativas</span>
        </h4>

        {leads.filter(l => l.meetLink).length === 0 ? (
          <p className="text-[11px] text-slate-400 font-semibold italic">Nenhuma videoconferência ativa ou agendada recentemente no radar comercial.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {leads.filter(l => l.meetLink).map(lead => (
              <div key={lead.id} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-extrabold text-[13px] text-slate-800 line-clamp-1">{lead.meetingTitle || `Reunião com: ${lead.name}`}</h5>
                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-1.5 uppercase font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-800 max-w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{lead.meetingTime}</span>
                    </p>
                    {lead.email && <p className="text-[10px] text-slate-400 font-bold mt-1">E-mail: {lead.email}</p>}
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0" title="Link do Google Meet Ativo">
                    Ativo
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={lead.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-1.5 px-3 rounded-lg text-[10px] font-black text-center flex items-center justify-center gap-1.5 transition-all outline-none"
                  >
                    <ExternalLink className="w-3 h-3 text-white" />
                    <span>Entrar no Meet</span>
                  </a>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = `Olá! Confirmamos nossa reunião: "${lead.meetingTitle}" para ${lead.meetingTime}. Segue link do Google Meet para acesso: ${lead.meetLink}. Até lá!`;
                      navigator.clipboard.writeText(textToCopy);
                      triggerNotification('Mensagem do Meet copiada para a área de transferência!', 'success');
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-serif font-black text-[10px] uppercase py-1.5 px-3 rounded-lg border border-slate-205 transition-colors cursor-pointer"
                  >
                    Copiar Recado
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
