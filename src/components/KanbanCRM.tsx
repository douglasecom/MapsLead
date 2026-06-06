import React, { useState } from 'react';
import { Lead, CRMTask, TimelineItem } from '../types';
import { 
  Users, MessageSquare, ClipboardList, Clock, 
  Trash2, Plus, CheckCircle, AlertCircle, ChevronLeft, 
  ChevronRight, StickyNote, CalendarClock, Shield, 
  Sparkles, FileSpreadsheet 
} from 'lucide-react';

interface KanbanCRMProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onOpenDetails?: (lead: Lead) => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  userRole?: string;
  currentUserRole?: string;
  isReadOnly?: boolean;
}

const STAGES: { key: Lead['status']; label: string; bg: string; text: string; border: string }[] = [
  { key: 'novo', label: 'Novo Lead', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-150' },
  { key: 'contatado', label: 'Contatado', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-150' },
  { key: 'interessado', label: 'Interessado', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-150' },
  { key: 'reuniao', label: 'Agendado', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-150' },
  { key: 'proposta', label: 'Proposta', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-150' },
  { key: 'negociacao', label: 'Negociação', bg: 'bg-orange-50', text: 'text-orange-850', border: 'border-orange-150' },
  { key: 'fechado', label: 'Fechado/Ganho', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-150' },
  { key: 'perdido', label: 'Perdido', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-150' },
];

export const KanbanCRM: React.FC<KanbanCRMProps> = ({ 
  leads, 
  setLeads, 
  onOpenDetails, 
  triggerNotification,
  userRole,
  currentUserRole,
  isReadOnly = false
}) => {
  const [selectedLeadForPanel, setSelectedLeadForPanel] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCategory, setTaskCategory] = useState<'ligacao' | 'email' | 'proposta' | 'reuniao'>('ligacao');

  const moveLead = (leadId: string, direction: 'prev' | 'next') => {
    if (isReadOnly) {
      triggerNotification('CRM em Modo Somente Leitura devido à inadimplência. Regularize o faturamento na aba Financeiro.', 'error');
      return;
    }
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const currentIdx = STAGES.findIndex(s => s.key === lead.status);
    let nextIdx = currentIdx + (direction === 'next' ? 1 : -1);

    if (nextIdx >= 0 && nextIdx < STAGES.length) {
      const nextStatus = STAGES[nextIdx].key;
      updateLeadStatus(leadId, nextStatus);
    }
  };

  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    if (isReadOnly) {
      triggerNotification('CRM em Modo Somente Leitura devido à inadimplência. Regularize o faturamento na aba Financeiro.', 'error');
      return;
    }
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const item: TimelineItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'status_change',
          title: 'Estágio do Fluxo Atualizado',
          description: `Lead remapeado para a etapa comercial: ${status.toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
        const updatedTimeline = l.timeline ? [item, ...l.timeline] : [item];
        return { ...l, status, timeline: updatedTimeline };
      }
      return l;
    }));
    triggerNotification(`Lead encaminhado para: ${status.toUpperCase()}`, 'success');
  };

  const handleAddNote = (e: React.FormEvent, leadId: string) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerNotification('CRM em Modo Somente Leitura devido à inadimplência. Regularize o faturamento na aba Financeiro.', 'error');
      return;
    }
    if (!newNote.trim()) return;

    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const newItem: TimelineItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'note',
          title: 'Anotação Comercial Registrada',
          description: newNote,
          createdAt: new Date().toISOString(),
        };
        const updatedTimeline = l.timeline ? [newItem, ...l.timeline] : [newItem];
        const updatedNotes = l.notes ? [...l.notes, newNote] : [newNote];
        return {
          ...l,
          notes: updatedNotes,
          timeline: updatedTimeline,
        };
      }
      return l;
    }));

    // Update active panel reference too
    const matchedLead = leads.find(l => l.id === leadId);
    if (matchedLead) {
      setSelectedLeadForPanel(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: prev.notes ? [...prev.notes, newNote] : [newNote],
          timeline: prev.timeline ? [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'note',
            title: 'Anotação Comercial Registrada',
            description: newNote,
            createdAt: new Date().toISOString(),
          }, ...prev.timeline] : [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'note',
            title: 'Anotação Comercial Registrada',
            description: newNote,
            createdAt: new Date().toISOString(),
          }]
        };
      });
    }

    setNewNote('');
    triggerNotification('Sua anotação foi inserida na timeline!', 'success');
  };

  const handleAddTask = (e: React.FormEvent, leadId: string) => {
    e.preventDefault();
    if (isReadOnly) {
      triggerNotification('CRM em Modo Somente Leitura devido à inadimplência. Regularize o faturamento na aba Financeiro.', 'error');
      return;
    }
    if (!taskTitle.trim() || !taskDueDate) {
      triggerNotification('Preencha título e data de entrega para criar a tarefa.', 'error');
      return;
    }

    const newTask: CRMTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskTitle,
      dueDate: taskDueDate,
      status: 'pendente',
      category: taskCategory,
    };

    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const timelineItem: TimelineItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'task',
          title: 'Tarefa de Follow-up Agendada',
          description: `Nova pendência criada: "${taskTitle}" com vencimento em ${taskDueDate}`,
          createdAt: new Date().toISOString(),
        };
        const updatedTasks = l.tasks ? [...l.tasks, newTask] : [newTask];
        const updatedTimeline = l.timeline ? [timelineItem, ...l.timeline] : [timelineItem];
        return { ...l, tasks: updatedTasks, timeline: updatedTimeline };
      }
      return l;
    }));

    setSelectedLeadForPanel(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks ? [...prev.tasks, newTask] : [newTask],
        timeline: prev.timeline ? [{
          id: Math.random().toString(36).substr(2, 9),
          type: 'task',
          title: 'Tarefa de Follow-up Agendada',
          description: `Nova pendência criada: "${taskTitle}" com vencimento em ${taskDueDate}`,
          createdAt: new Date().toISOString(),
        }, ...prev.timeline] : [{
          id: Math.random().toString(36).substr(2, 9),
          type: 'task',
          title: 'Tarefa de Follow-up Agendada',
          description: `Nova pendência criada: "${taskTitle}" com vencimento em ${taskDueDate}`,
          createdAt: new Date().toISOString(),
        }]
      };
    });

    setTaskTitle('');
    setTaskDueDate('');
    triggerNotification('Tarefa agendada! Você receberá alertas no painel.', 'success');
  };

  const toggleTaskStatus = (leadId: string, taskId: string) => {
    if (isReadOnly) {
      triggerNotification('CRM em Modo Somente Leitura devido à inadimplência. Regularize o faturamento na aba Financeiro.', 'error');
      return;
    }
    setLeads(prev => prev.map(l => {
      if (l.id === leadId && l.tasks) {
        const updatedTasks = l.tasks.map(t => {
          if (t.id === taskId) {
            const nextStatus = t.status === 'pendente' ? 'concluido' : 'pendente';
            return { ...t, status: nextStatus };
          }
          return t;
        });
        return { ...l, tasks: updatedTasks };
      }
      return l;
    }));

    setSelectedLeadForPanel(prev => {
      if (!prev || !prev.tasks) return null;
      const updatedTasks = prev.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: t.status === 'pendente' ? 'concluido' : 'pendente' } as CRMTask;
        }
        return t;
      });
      return { ...prev, tasks: updatedTasks };
    });

    triggerNotification('Status da tarefa operacional atualizado.', 'info');
  };

  const getSDRrestrictedWarning = () => {
    if (userRole === 'SDR') return "Perfil SDR Ativo: Você possui acesso de visualização ao CRM Kanban. Fluxos de fechamento e propostas são gerenciados por Closers.";
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats summary Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            <span>Fluxo CRM Kanban</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Acompanhe funis, agende reuniões de demonstração e registre notas de conversão local.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="bg-blue-50 text-blue-800 text-[11px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Total CRM: {leads.filter(l => l.captured).length} Leads</span>
          </div>

          <div className="bg-emerald-55 border border-emerald-200 text-emerald-800 text-[11px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ganhos: {leads.filter(l => l.status === 'fechado').length} contratos</span>
          </div>
        </div>
      </div>

      {getSDRrestrictedWarning() && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-2 font-bold animate-pulse">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{getSDRrestrictedWarning()}</span>
        </div>
      )}

      {/* Kanban Scrollable Board Column Grid */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1400px]">
          
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.captured && l.status === stage.key);
            
            return (
              <div 
                key={stage.key}
                className="w-72 bg-slate-50 border rounded-2xl flex flex-col p-4 shrink-0 h-[600px] overflow-hidden"
              >
                {/* Column header */}
                <div className={`flex justify-between items-center pb-2.5 mb-3 border-b ${stage.border}`}>
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-1 ${stage.bg} ${stage.text} border rounded-full`}>
                    {stage.label}
                  </span>
                  <span className="font-mono text-xs text-slate-450 font-black">({stageLeads.length})</span>
                </div>

                {/* Column items wrapper */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 pad-y-1">
                  
                  {stageLeads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                      <p className="text-xs font-semibold">Sem leads nesta etapa</p>
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div 
                        key={lead.id}
                        className="bg-white border hover:border-blue-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col gap-2 relative"
                        onClick={() => setSelectedLeadForPanel(lead)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold tracking-widest px-1.5 py-0.5 rounded uppercase">
                              {lead.niche}
                            </span>
                            <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight mt-1 group-hover:text-blue-600 truncate max-w-[180px]">
                              {lead.name}
                            </h4>
                          </div>
                          <span className="text-[10px] font-black text-rose-600 font-mono">
                            {lead.leadScore}%
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-450 leading-relaxed font-medium line-clamp-2">
                          {lead.gmbAnalysis}
                        </p>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold font-sans">
                            {lead.location.split(',')[0]}
                          </span>
                          
                          {/* Movement triggers */}
                          <div className="flex bg-slate-50 border rounded-lg overflow-hidden shrink-0" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => moveLead(lead.id, 'prev')}
                              disabled={stage.key === STAGES[0].key || userRole === 'SDR'}
                              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 active:scale-90 disabled:opacity-30 cursor-pointer"
                              title="Recuar etapa"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => moveLead(lead.id, 'next')}
                              disabled={stage.key === STAGES[STAGES.length - 1].key || userRole === 'SDR'}
                              className="px-1.5 py-1 text-slate-500 border-l hover:bg-slate-100 active:scale-90 disabled:opacity-30 cursor-pointer"
                              title="Avançar etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}

                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Detail Slideout Side-Panel block for editing Lead Notes, Timelines, and booking CRM tasks */}
      {selectedLeadForPanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-end animate-in fade-in duration-250">
          <div className="bg-white w-full max-w-lg shadow-2xl relative h-full flex flex-col border-l animate-in slide-in-from-right duration-300">
            
            {/* Slide Header */}
            <div className="bg-[#0f172a] text-white p-6">
              <button 
                onClick={() => setSelectedLeadForPanel(null)}
                className="absolute top-4 right-4 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all outline-none cursor-pointer"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-rose-500 text-white text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  CRM TIMELINE
                </span>
                <span className="bg-blue-500 text-white text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase font-mono">
                  Score: {selectedLeadForPanel.leadScore}%
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white leading-tight truncate pr-12">{selectedLeadForPanel.name}</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">{selectedLeadForPanel.location} • {selectedLeadForPanel.niche}</p>
            </div>

            {/* Slide body scrolling contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Quick change pipeline status tags selectors */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Navegação Rápida do Funil</h4>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button 
                      key={s.key}
                      onClick={() => {
                        updateLeadStatus(selectedLeadForPanel.id, s.key);
                        setSelectedLeadForPanel(prev => prev ? { ...prev, status: s.key } : null);
                      }}
                      disabled={userRole === 'SDR'}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase border text-center transition-all cursor-pointer ${
                        selectedLeadForPanel.status === s.key 
                          ? `${s.bg} ${s.text} border-transparent scale-102 shadow-sm font-extrabold` 
                          : "bg-white hover:bg-slate-50 text-slate-505"
                      }`}
                    >
                      {s.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anotações rapidas logger block */}
              <div className="bg-slate-50 border p-4 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-blue-500" />
                  <span>Registrar Anotação Interna</span>
                </h4>
                
                <form onSubmit={(e) => handleAddNote(e, selectedLeadForPanel.id)} className="space-y-2">
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ex: Liguei para o gerente, mostrou grande interesse nas taxas zeradas do WhatsApp mas quer falar no final do dia."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 min-h-[70px] resize-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="bg-slate-900 border text-white font-bold py-2 px-4 rounded-xl text-xs active:scale-95 hover:bg-slate-800 cursor-pointer"
                    >
                      Salvar Anotação B2B
                    </button>
                  </div>
                </form>
              </div>

              {/* Agendar Compromisso operacional follow-up task */}
              <div className="border border-slate-200/85 p-4 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <span>Tarefa / Follow-up Operacional</span>
                </h4>

                <form onSubmit={(e) => handleAddTask(e, selectedLeadForPanel.id)} className="space-y-3">
                  <div className="space-y-1">
                    <input 
                      type="text"
                      placeholder="Ex: Retornar ligação ou Enviar Orçamento"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select 
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-xs text-slate-700 font-bold"
                      >
                        <option value="ligacao">📞 Telefonar</option>
                        <option value="email">✉ Enviar E-mail</option>
                        <option value="proposta">📋 Elaborar Proposta</option>
                        <option value="reuniao">🤝 Agendar Web-reunião</option>
                      </select>
                    </div>

                    <div>
                      <input 
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    Agendar Compromisso
                  </button>
                </form>

                {/* Listing of pending tasks */}
                {selectedLeadForPanel.tasks && selectedLeadForPanel.tasks.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-450 block uppercase">Próximos Compromissos listados</span>
                    <div className="space-y-1.5">
                      {selectedLeadForPanel.tasks.map(t => (
                        <div key={t.id} className="bg-slate-50 p-2.5 rounded-lg border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              checked={t.status === 'concluido'}
                              onChange={() => toggleTaskStatus(selectedLeadForPanel.id, t.id)}
                              className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
                            />
                            <div>
                              <span className={`text-xs font-semibold block leading-tight ${t.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {t.title}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono">
                                Vence em: {t.dueDate}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">
                            {t.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CRM Audit Timeline Log list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Histórico do Atendimento & Audits</h4>
                
                <div className="space-y-4 relative pl-3 border-l-2 border-slate-200 ml-1">
                  
                  {/* Default Captured Event */}
                  <div className="relative">
                    <span className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white"></span>
                    <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>Lead Capturado no Sistema</span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                      </span>
                      <span className="text-[10px] text-slate-450 font-medium leading-relaxed">
                        Contato capturado na pesquisa de leads com saldo de créditos e catalogado em nosso banco em nuvem de forma direta.
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">
                        {selectedLeadForPanel.capturedAt ? new Date(selectedLeadForPanel.capturedAt).toLocaleDateString() : '04/06/2026'}
                      </span>
                    </div>
                  </div>

                  {selectedLeadForPanel.timeline && selectedLeadForPanel.timeline.map((item, index) => (
                    <div key={item.id || index} className="relative transition-all">
                      <span className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                      <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <span className="text-xs font-bold text-slate-800">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-450 font-medium leading-relaxed">
                          {item.description}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>

            {/* Slide bottom controls */}
            <div className="p-4 bg-slate-50 border-t flex justify-between gap-2.5">
              <button 
                onClick={() => {
                  onOpenDetails(selectedLeadForPanel);
                  setSelectedLeadForPanel(null);
                }}
                className="flex-1 bg-[#1e293b] text-white hover:bg-slate-900 font-extrabold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Estudo e Auditoria Digital</span>
              </button>

              <button 
                onClick={() => setSelectedLeadForPanel(null)}
                className="bg-slate-200 text-slate-705 font-bold py-2.5 px-5 rounded-xl text-xs hover:bg-slate-300 cursor-pointer"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
