import React, { useState, useEffect, useMemo } from 'react';
import { Lead, Meeting, CRMTask, TimelineItem } from '../types';
import { 
  db, auth 
} from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, addDoc
} from 'firebase/firestore';

let cachedGoogleCalendarToken: string | null = null;

import { 
  Calendar, Plus, Clock, Video, Phone, MessageSquare, MapPin, 
  User, CheckCircle2, AlertTriangle, Play, Sparkles, Filter, 
  Trash2, Edit, ChevronLeft, ChevronRight, FileText, Check, 
  Share2, ExternalLink, Settings, Shield, Bell, Award, ArrowUpRight, CheckCircle, TrendingUp, DollarSign, ListOrdered, CalendarDays,
  Search, X
} from 'lucide-react';

interface AgendaComercialProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  userId?: string;
  userRole?: string;
  session?: any;
}

export const AgendaComercial: React.FC<AgendaComercialProps> = ({
  leads,
  setLeads,
  triggerNotification,
  userId,
  userRole,
  session
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMeetings = useMemo(() => {
    if (!searchTerm.trim()) return meetings;
    const term = searchTerm.toLowerCase();
    return meetings.filter(m => 
      (m.company && m.company.toLowerCase().includes(term)) || 
      (m.title && m.title.toLowerCase().includes(term))
    );
  }, [meetings, searchTerm]);
  const [activeTab, setActiveTab2] = useState<'calendario' | 'followup' | 'performance' | 'owner_panel' | 'config_calendly'>('calendario');
  const [calendarView, setCalendarView] = useState<'dia' | 'semana' | 'mes' | 'lista'>('mes');
  
  // Selected date for calendar views (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Meeting form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Google Calendar Integration states
  const [googleToken, setGoogleToken] = useState<string | null>(cachedGoogleCalendarToken);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [importingEventId, setImportingEventId] = useState<string | null>(null);

  const fetchGoogleEvents = async (token: string) => {
    setFetchingEvents(true);
    try {
      const timeMin = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&orderBy=startTime&singleEvents=true`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setGoogleToken(null);
          cachedGoogleCalendarToken = null;
          throw new Error('Sessão do Google expirada. Conecte novamente.');
        }
        throw new Error('Erro ao buscar eventos do Google Calendar.');
      }
      
      const data = await response.json();
      setGoogleEvents(data.items || []);
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || 'Falha ao buscar eventos do Google.', 'error');
    } finally {
      setFetchingEvents(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('Não foi possível obter o token de acesso do Google.');
      }
      
      cachedGoogleCalendarToken = token;
      setGoogleToken(token);
      triggerNotification('Google Calendar conectado com sucesso!', 'success');
      fetchGoogleEvents(token);
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || 'Falha na conexão com Google.', 'error');
    }
  };

  const handleImportGoogleEvent = async (event: any, matchedLeadId: string) => {
    setImportingEventId(event.id);
    try {
      const eventStart = event.start?.dateTime || event.start?.date || '';
      
      let datePart = '';
      let timePart = '';
      if (eventStart) {
        const dObj = new Date(eventStart);
        datePart = dObj.toISOString().substring(0, 10);
        timePart = dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      
      const linkedLead = leads.find(l => l.id === matchedLeadId);
      const companyName = linkedLead ? linkedLead.name : (event.summary || 'Empresa Sem Nome');
      const clientEmail = linkedLead ? linkedLead.email : '';
      const clientPhone = linkedLead ? linkedLead.phone : '';
      
      const newMeetId = `meet-imported-${Math.random().toString(36).substring(2, 9)}`;
      
      const meetingObj: Meeting = {
        id: newMeetId,
        title: event.summary || 'Reunião Importada',
        company: companyName,
        responsible: session?.name || 'Douglas Silva',
        date: datePart || new Date().toISOString().substring(0, 10),
        time: timePart || '12:00',
        type: event.hangoutLink ? 'Google Meet' : 'Google Meet',
        observations: event.description || 'Importado automaticamente do Google Calendar.',
        status: 'Agendado',
        leadId: matchedLeadId || undefined,
        meetLink: event.hangoutLink || undefined,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
        whatsapp: clientPhone || undefined,
        createdAt: new Date().toISOString()
      };
      
      // Save directly to Firebase
      await setDoc(doc(db, 'meetings', newMeetId), meetingObj);
      
      // Update local state meetings list
      setMeetings(prev => [meetingObj, ...prev]);

      // Add timeline entry to the lead if present
      if (matchedLeadId && linkedLead) {
        const timelineItem: TimelineItem = {
          id: `time-${Math.random().toString(36).substring(2, 9)}`,
          type: 'note',
          title: 'Compromisso Importado',
          description: `Reunião importada do Google Calendar: "${event.summary || 'Sem título'}" agendada para ${datePart} às ${timePart}.`,
          createdAt: new Date().toISOString()
        };
        
        const updatedLeads = leads.map(l => {
          if (l.id === matchedLeadId) {
            const currentTimeline = l.timeline || [];
            return {
              ...l,
              timeline: [timelineItem, ...currentTimeline]
            };
          }
          return l;
        });
        setLeads(updatedLeads);
      }
      
      triggerNotification('Reunião importada com sucesso para o AdsHive Prospect!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || 'Falha ao importar compromisso.', 'error');
    } finally {
      setImportingEventId(null);
    }
  };

  useEffect(() => {
    if (googleToken) {
      fetchGoogleEvents(googleToken);
    }
  }, [googleToken]);
  
  // Meeting Form Data
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    responsible: session?.name || 'Douglas',
    date: '',
    time: '',
    type: 'Google Meet' as 'Presencial' | 'Telefone' | 'WhatsApp' | 'Google Meet',
    observations: '',
    status: 'Agendado' as 'Agendado' | 'Confirmado' | 'Realizado' | 'Cancelado' | 'Reagendado',
    leadId: '',
    phone: '',
    email: '',
    whatsapp: '',
    city: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Users public Calendly Settings state
  const [calendlyConfig, setCalendlyConfig] = useState({
    slug: session?.name?.toLowerCase().replace(/\s+/g, '-') || 'douglas',
    nome: session?.name || 'Douglas',
    empresa: 'AdsHive',
    cargo: session?.role || 'SDR / Closer',
    descricao: 'Reserve um horário na minha agenda comercial para apresentar as auditorias de presença digital e planejar a estratégia de anúncios!',
    avatarUrl: session?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    duration: 30
  });

  const currentUserId = userId || auth.currentUser?.uid || 'demo_user';
  const isAdmin = userRole === 'Administrador' || session?.role === 'Administrador';

  // Seed default meetings if none exist in firestore
  useEffect(() => {
    async function fetchMeetings() {
      try {
        setLoading(true);
        const q = collection(db, 'meetings');
        const snap = await getDocs(q);
        const list: Meeting[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Meeting);
        });
        
        if (list.length === 0) {
          // Generate beautiful default meetings
          const todayStr = new Date().toISOString().substring(0, 10);
          const tomorrowStr = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
          const parsedYesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
          
          const defaultList: Meeting[] = [
            {
              id: 'med-1',
              title: 'Reunião de Diagnóstico de Anúncios',
              company: 'Odonto Pró Clínicas',
              responsible: session?.name || 'Douglas Silva',
              date: todayStr,
              time: '14:30',
              type: 'Google Meet',
              status: 'Confirmado',
              observations: 'Apresentar planilha de CTR e CTR sugerido do Google Ads.',
              leadId: leads[0]?.id || '',
              meetLink: 'https://meet.google.com/abc-defg-hij',
              email: 'diretor@odontopro.com.br',
              phone: '11999998888',
              whatsapp: '11999998888',
              city: 'São Paulo',
              createdAt: new Date().toISOString()
            },
            {
              id: 'med-2',
              title: 'Apresentação de Proposta Comercial',
              company: 'Franquia Bella Estética',
              responsible: session?.name || 'Douglas Silva',
              date: tomorrowStr,
              time: '10:00',
              type: 'WhatsApp',
              status: 'Agendado',
              observations: 'O cliente solicitou reunião focada em retorno financeiro e custos.',
              leadId: leads[1]?.id || '',
              email: 'estetica@bellaestetica.com',
              phone: '11988887777',
              whatsapp: '11988887777',
              city: 'Rio de Janeiro',
              createdAt: new Date().toISOString()
            },
            {
              id: 'med-3',
              title: 'Alinhamento de Escopo e Fechamento',
              company: 'Pizzaria Margherita',
              responsible: session?.name || 'Douglas Silva',
              date: parsedYesterday,
              time: '16:00',
              type: 'Google Meet',
              status: 'Realizado',
              observations: 'Demonstração de campanhas locais no Google Maps.',
              leadId: leads[2]?.id || '',
              meetLink: 'https://meet.google.com/xyz-uvwx-yza',
              email: 'contato@pizzariamargherita.com',
              phone: '21977776666',
              whatsapp: '21977776666',
              city: 'Niterói',
              createdAt: new Date().toISOString()
            }
          ];
          
          // Save them locally in our state for preview
          setMeetings(defaultList);
          
          // Attempt saving them to Firestore if auth is active to enrich the DB
          if (auth.currentUser) {
            for (const d of defaultList) {
              await setDoc(doc(db, 'meetings', d.id), d);
            }
          }
        } else {
          setMeetings(list);
        }
      } catch (err) {
        console.error("Erro ao puxar reuniões:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMeetings();
  }, [leads, session]);

  // Load user profile details or custom Calendly configurations from localStorage fallback
  useEffect(() => {
    const saved = localStorage.getItem(`calendly_${currentUserId}`);
    if (saved) {
      try {
        setCalendlyConfig(JSON.parse(saved));
      } catch (e) {}
    } else {
      setCalendlyConfig({
        slug: session?.name?.toLowerCase().replace(/\s+/g, '-') || 'douglas',
        nome: session?.name || 'Douglas',
        empresa: 'AdsHive',
        cargo: session?.role || 'SDR / Closer',
        descricao: 'Reserve um horário na minha agenda comercial para apresentar as auditorias de presença digital e planejar a estratégia de anúncios!',
        avatarUrl: session?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        duration: 30
      });
    }
  }, [session, currentUserId]);

  // Save new or edited meeting
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const matchLead = leads.find(l => l.id === formData.leadId);
      
      const newMeetId = editingMeeting ? editingMeeting.id : `meet-${Math.random().toString(36).substring(2, 9)}`;
      
      let generatedMeetLink = editingMeeting?.meetLink || '';
      if (formData.type === 'Google Meet' && !generatedMeetLink) {
        generatedMeetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      }

      const meetingObj: Meeting = {
        id: newMeetId,
        title: formData.title,
        company: matchLead ? matchLead.name : formData.company,
        responsible: formData.responsible,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        observations: formData.observations,
        status: formData.status,
        leadId: formData.leadId || undefined,
        meetLink: generatedMeetLink || undefined,
        phone: matchLead ? matchLead.phone : formData.phone,
        email: matchLead ? matchLead.email : formData.email,
        whatsapp: matchLead ? matchLead.phone : formData.whatsapp,
        city: matchLead ? matchLead.location.split(',')[0] : formData.city,
        createdAt: editingMeeting ? editingMeeting.createdAt : new Date().toISOString()
      };

      // 1. Save to Database
      await setDoc(doc(db, 'meetings', newMeetId), meetingObj);
      
      // Update state
      setMeetings(prev => {
        const index = prev.findIndex(m => m.id === newMeetId);
        if (index > -1) {
          const c = [...prev];
          c[index] = meetingObj;
          return c;
        }
        return [meetingObj, ...prev];
      });

      // 2. Integration with CRM Lead Timeline & Pipeline Auto Moves
      if (formData.leadId) {
        const cleanMeetTime = `${new Date(formData.date).toLocaleDateString('pt-BR')} às ${formData.time}`;
        
        // Define new status
        let targetStatus: 'reuniao' | 'negociacao' | 'proposta' | 'novo' = 'reuniao';
        if (formData.status === 'Realizado') {
          targetStatus = 'negociacao';
        }

        const timeline: TimelineItem = {
          id: Math.random().toString(36).substring(2, 11),
          type: 'task',
          title: `Reunião ${formData.status}: ${formData.title}`,
          description: `Canal: ${formData.type}. Link/Fone: ${generatedMeetLink || formData.phone || 'N/A'}. Responsável: ${formData.responsible}`,
          createdAt: new Date().toISOString()
        };

        const taskItem: CRMTask = {
          id: Math.random().toString(36).substring(2, 11),
          title: `Reunião: ${formData.title}`,
          dueDate: formData.date,
          status: formData.status === 'Realizado' ? 'concluido' : 'pendente',
          category: 'reuniao'
        };

        // Update the Lead in database
        setLeads(prev => prev.map(l => {
          if (l.id === formData.leadId) {
            const up: Lead = {
              ...l,
              status: targetStatus,
              meetingTime: cleanMeetTime,
              meetingTitle: formData.title,
              meetLink: generatedMeetLink || undefined,
              timeline: l.timeline ? [timeline, ...l.timeline] : [timeline],
              tasks: l.tasks ? [...l.tasks, taskItem] : [taskItem]
            };
            
            // Sync with backend
            updateDoc(doc(db, 'leads', l.id), {
              status: targetStatus,
              meetingTime: cleanMeetTime,
              meetingTitle: formData.title,
              meetLink: generatedMeetLink || null
            }).catch(err => console.error("Falha ao salvar no CRM:", err));

            return up;
          }
          return l;
        }));
      }

      // 3. Dispatch Automatic Notification Alert
      triggerNotification(
        editingMeeting ? `Compromisso comercial atualizado com sucesso!` : `Novo compromisso agendado para ${meetingObj.company}!`,
        'success'
      );

      setIsModalOpen(false);
      setEditingMeeting(null);
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Erro ao salvar compromisso: ${err.message || 'Erro inesperado'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Click handler to open form for a new meeting
  const openNewMeetingModal = (initialDateStr?: string) => {
    setEditingMeeting(null);
    setFormData({
      title: 'Apresentação Comercial AdsHive',
      company: '',
      responsible: session?.name || 'Douglas Silva',
      date: initialDateStr || new Date().toISOString().substring(0, 10),
      time: '14:00',
      type: 'Google Meet',
      observations: 'Reunião estratégica para apresentar funil de captação de clientes locais.',
      status: 'Agendado',
      leadId: '',
      phone: '',
      email: '',
      whatsapp: '',
      city: ''
    });
    setIsModalOpen(true);
  };

  // Open modal to edit existing meeting
  const openEditMeetingModal = (m: Meeting) => {
    setEditingMeeting(m);
    setFormData({
      title: m.title,
      company: m.company,
      responsible: m.responsible,
      date: m.date,
      time: m.time,
      type: m.type,
      observations: m.observations || '',
      status: m.status,
      leadId: m.leadId || '',
      phone: m.phone || '',
      email: m.email || '',
      whatsapp: m.whatsapp || '',
      city: m.city || ''
    });
    setIsModalOpen(true);
  };

  // Delete appointment
  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm("Deseja realmente cancelar e excluir este compromisso?")) {
      try {
        await deleteDoc(doc(db, 'meetings', id));
        setMeetings(prev => prev.filter(m => m.id !== id));
        triggerNotification("Compromisso cancelado e removido do banco com sucesso.", "info");
      } catch (err: any) {
        triggerNotification(`Falha de exclusão: ${err.message}`, "error");
      }
    }
  };

  // Quick status update for appointment
  const handleUpdateMeetingStatus = async (meetingId: string, newStatus: 'Agendado' | 'Confirmado' | 'Realizado' | 'Cancelado' | 'Reagendado') => {
    try {
      const matchMeeting = meetings.find(m => m.id === meetingId);
      if (!matchMeeting) return;
      
      const updatedMeeting: Meeting = { 
        ...matchMeeting, 
        status: newStatus 
      };
      
      await setDoc(doc(db, 'meetings', meetingId), updatedMeeting);
      
      setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));
      
      // Update the Lead inside CRM if applicable
      if (matchMeeting.leadId) {
        let targetStatus: 'reuniao' | 'negociacao' | 'proposta' | 'novo' = 'reuniao';
        if (newStatus === 'Realizado') {
          targetStatus = 'negociacao';
        }

        const timeline: TimelineItem = {
          id: Math.random().toString(36).substring(2, 11),
          type: 'status_change',
          title: `Status da Reunião: ${newStatus}`,
          description: `Compromisso "${matchMeeting.title}" marcado como ${newStatus} por ação rápida.`,
          createdAt: new Date().toISOString()
        };

        setLeads(prev => prev.map(l => {
          if (l.id === matchMeeting.leadId) {
            const up: Lead = {
              ...l,
              status: targetStatus,
              timeline: l.timeline ? [timeline, ...l.timeline] : [timeline]
            };
            
            updateDoc(doc(db, 'leads', l.id), {
              status: targetStatus
            }).catch(err => console.error("Falha ao salvar no CRM:", err));

            return up;
          }
          return l;
        }));
      }

      triggerNotification(`Status do compromisso atualizado para ${newStatus} com sucesso!`, 'success');
    } catch (err: any) {
      triggerNotification(`Erro ao atualizar status: ${err.message}`, 'error');
    }
  };

  // Calendly profile setup save
  const handleSaveCalendly = () => {
    localStorage.setItem(`calendly_${currentUserId}`, JSON.stringify(calendlyConfig));
    triggerNotification("Configurações do Calendly Interno salvas com sucesso!", "success");
  };

  // Compute stats of the CRM for current user
  const meetingsStats = useMemo(() => {
    const total = meetings.length;
    const realizados = meetings.filter(m => m.status === 'Realizado').length;
    const agendados = meetings.filter(m => m.status === 'Agendado' || m.status === 'Confirmado' || m.status === 'Reagendado').length;
    const cancelados = meetings.filter(m => m.status === 'Cancelado').length;
    
    // Attendance rate
    const totalConcluidoOuFalta = realizados + meetings.filter(m => m.status === 'Cancelado').length; // simple division
    const comparecimentoRate = totalConcluidoOuFalta > 0 
      ? Math.round((realizados / (realizados + meetings.filter(m => m.status === 'Cancelado').length)) * 100)
      : 85; // default fallback metric
    
    // Convert to conversion/closed
    // Filter through leads to count 'fechado' ones that have meeting
    const closedMeetingsLeads = leads.filter(l => l.status === 'fechado' && l.meetingTime);
    const convertedRate = realizados > 0 
      ? Math.round((closedMeetingsLeads.length / realizados) * 100) 
      : 35; // default fallback conversion

    // Revenue generated
    const revenue = closedMeetingsLeads.length * 2500; // Average value R$ 2.500,00 single signup

    return { total, realizados, agendados, cancelados, comparecimentoRate, convertedRate, revenue, proposalsSent: leads.filter(l => l.status === 'proposta').length };
  }, [meetings, leads]);

  // AI Follow-up suggestions engine
  const followUpLeads = useMemo(() => {
    const list: Array<{ lead: Lead; r_desc: string; type: 'abandonado' | 'proposta_sem_resposta' | 'sem_contato' }> = [];
    
    leads.forEach(l => {
      // 1. Leads without contact for 5 days
      if (l.status === 'novo' && l.capturedAt) {
        const days = Math.floor((Date.now() - new Date(l.capturedAt).getTime()) / 86450000);
        if (days >= 5) {
          list.push({
            lead: l,
            r_desc: `Este lead está cadastrado há ${days} dias sem receber nenhum contato inicial.`,
            type: 'sem_contato'
          });
        }
      }
      
      // 2. Proposal sent and unresponded for 3+ days
      if (l.status === 'proposta' && l.enrichedAt) {
        const days = Math.floor((Date.now() - new Date(l.enrichedAt).getTime()) / 86450000);
        if (days >= 3) {
          list.push({
            lead: l,
             r_desc: `Uma proposta comercial de anúncios foi enviada há ${days} dias, mas ainda está sem retorno.`,
            type: 'proposta_sem_resposta'
          });
        }
      }

      // 3. Abandoned leads (no update for 7 days)
      if (l.capturedAt) {
        const days = Math.floor((Date.now() - new Date(l.capturedAt).getTime()) / 86450000);
        if (days >= 7 && l.status !== 'fechado' && l.status !== 'perdido' && l.status !== 'novo') {
          list.push({
            lead: l,
            r_desc: `Lead estacionado na etapa "${l.status.toUpperCase()}" há mais de 7 dias sem novas interações no CRM.`,
            type: 'abandonado'
          });
        }
      }
    });

    return list.slice(0, 6); // Top 6 recommendations
  }, [leads]);

  // Calendar dates helpers
  const currentMonthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // sun = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month filler days
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month filler days to complete 42 grid cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [selectedDate]);

  // Filter meetings active for each calendar cell day
  const getDayMeetings = (d: Date) => {
    const formatted = d.toISOString().substring(0, 10);
    return filteredMeetings.filter(m => m.date === formatted);
  };

  const getWeekDays = useMemo(() => {
    // Get the sun -> sat days of current selectedDate week
    const currentDay = selectedDate.getDay();
    const sundayDate = new Date(selectedDate);
    sundayDate.setDate(selectedDate.getDate() - currentDay);
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sundayDate);
      day.setDate(sundayDate.getDate() + i);
      week.push(day);
    }
    return week;
  }, [selectedDate]);

  const changeMonth = (offset: number) => {
    const copy = new Date(selectedDate);
    copy.setMonth(selectedDate.getMonth() + offset);
    setSelectedDate(copy);
  };

  const changeDay = (offset: number) => {
    const copy = new Date(selectedDate);
    copy.setDate(selectedDate.getDate() + offset);
    setSelectedDate(copy);
  };

  // AI-Generated WhatsApp script for follow-ups
  const handleGenerateAIScript = (lead: Lead, channel: 'whatsapp' | 'email') => {
    const contextStr = `Olá ${lead.name}! Sou o ${session?.name || 'Douglas'} da AdsHive. Analisamos sua presença digital e preparamos um plano focado em anúncios locais. Gostaria de agendar 15 minutos esta semana?`;
    navigator.clipboard.writeText(contextStr);
    triggerNotification(`Roteiro IA copiado para a área de transferência!`, 'success');
  };

  // Generated AI proposals generator
  const [generatingProposalFor, setGeneratingProposalFor] = useState<Meeting | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<any | null>(null);

  const handleGenerateProposalWithIA = (m: Meeting) => {
    setGeneratingProposalFor(m);
    // Simulate Gemini generating proposal
    setTimeout(() => {
      setGeneratedProposal({
        company: m.company,
        escopo: "Gestão completa de Tráfego Pago no Google Ads e Meta Ads (Instagram/Facebook) + Otimização SEO local do Google Meu Negócio.",
        valor: "R$ 1.850,00 / mensal + verba direta nos canais",
        beneficios: [
          "Aumento imediato de ligações e mensagens no WhatsApp comercial em até 40%",
          "Posicionamento nas 3 primeiras posições do Maps local para buscas na região",
          "Relatórios mensais interativos e suporte prioritário via WhatsApp"
        ],
        cronograma: "Fase 1: Configuração e Pixel (Semana 1) | Fase 2: Criação de Anúncios e Launch (Semana 2) | Fase 3: Monitoramento e Otimização Semanal (Contínuo)",
        pdfUrl: "link-para-download-proposta-comercial.pdf"
      });
    }, 1500);
  };

  // System alert counts for meeting dashboard
  const activeAlerts = useMemo(() => {
    const alerts: Array<{ text: string; type: 'warning' | 'error' | 'info' }> = [];
    
    // Check if any meeting is today 
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayMeets = meetings.filter(m => m.date === todayStr);
    
    todayMeets.forEach(m => {
      alerts.push({
        text: `Reunião marcada Hoje às ${m.time}: Apresentação com ${m.company}`,
        type: 'info'
      });
    });

    // Forgotten leads
    const forgotten = leads.filter(l => {
      if (l.status === 'novo' && l.capturedAt) {
        const days = Math.floor((Date.now() - new Date(l.capturedAt).getTime()) / 86450000);
        return days >= 5;
      }
      return false;
    }).length;

    if (forgotten > 0) {
      alerts.push({
        text: `Existem ${forgotten} leads capturados há mais de 5 dias sem retorno!`,
        type: 'warning'
      });
    }

    // Unresponded proposals
    const proposalsNoAns = leads.filter(l => l.status === 'proposta').length;
    if (proposalsNoAns > 0) {
      alerts.push({
        text: `${proposalsNoAns} propostas comerciais ativas no CRM aguardando retorno dos leads.`,
        type: 'warning'
      });
    }

    return alerts;
  }, [meetings, leads]);

  return (
    <div className="text-slate-100 bg-[#0A0A0F] rounded-3xl overflow-hidden border border-[#2A2A3A] shadow-lg " id="agenda-comercial-module">
      
      {/* 🔔 Central de Notificações / Alertas Dropdown Bar */}
      {activeAlerts.length > 0 && (
        <div className="bg-[#151525] border-b border-[#2A2A3A] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-[#D946EF] animate-swing" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {activeAlerts.length}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-extrabold text-[#D946EF]">Lembrete da Sales AI: </span>
              <span>{activeAlerts[0].text}</span>
            </div>
          </div>
          <button 
            onClick={() => triggerNotification(`Todos os ${activeAlerts.length} alertas foram processados pela Inteligência Comercial.`, 'info')}
            className="text-[10px] text-slate-400 hover:text-white font-extrabold uppercase transition-colors"
          >
            Marcar lidos
          </button>
        </div>
      )}

      {/* Internal Navigation Sub-header Bar */}
      <div className="p-6 bg-[#0E0E18] border-b border-[#2A2A3A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-[#8A2BE2]" />
            <span>Agenda Comercial</span>
            <span className="bg-[#B026FF]/20 text-[#B026FF] text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Módulo Pro</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Reuniões integradas, follow-ups de alta conversão, geração de propostas IA e agendador tipo Calendly.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openNewMeetingModal()}
            className="bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:from-[#7c26cc] hover:to-[#9f1fef] text-white py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 shadow-glow-purple"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Compromisso</span>
          </button>
        </div>
      </div>

      {/* Internal Tab selectors */}
      <div className="flex border-b border-[#2A2A3A] bg-[#0E0E18]/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab2('calendario')}
          className={`px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'calendario'
              ? 'border-[#8A2BE2] text-white bg-[#151520]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Agenda & Calendário</span>
        </button>

        <button
          onClick={() => setActiveTab2('followup')}
          className={`px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'followup'
              ? 'border-[#8A2BE2] text-white bg-[#151520]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-[#D946EF]" />
          <span>Follow-up Inteligente</span>
        </button>

        <button
          onClick={() => setActiveTab2('performance')}
          className={`px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'border-[#8A2BE2] text-white bg-[#151520]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Performance & Fechamento</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab2('owner_panel')}
            className={`px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'owner_panel'
                ? 'border-[#8A2BE2] text-white bg-[#151520]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Painel Owner</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab2('config_calendly')}
          className={`px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'config_calendly'
              ? 'border-[#8A2BE2] text-white bg-[#151520]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Calendly Interno</span>
        </button>
      </div>

      <div className="p-6">
        
        {/* =============== SUB VIEW: 1) AGENDA & CALENDÁRIO =============== */}
        {activeTab === 'calendario' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side: main Calendário (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
            
              {/* Real-time search bar */}
              <div id="agenda-search-bar" className="bg-[#151520] p-4 rounded-2xl border border-[#2A2A3A] flex items-center gap-3 shadow-lg relative group transition-all duration-300 focus-within:border-[#8A2BE2] focus-within:shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#B026FF] transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Busca rápida de compromissos por empresa ou evento..."
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500 font-medium"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="bg-[#2A2A3A]/60 hover:bg-[#34344A] text-slate-400 hover:text-white p-1 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            
            {/* Header filters and controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#151520] p-4 rounded-2xl border border-[#2A2A3A]">
              
              {/* Date navigator */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => calendarView === 'mes' ? changeMonth(-1) : calendarView === 'dia' ? changeDay(-1) : setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))}
                  className="bg-[#2A2A3A] hover:bg-[#34344A] p-2 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <h3 className="font-extrabold text-[#E5E7EB] text-sm uppercase tracking-wide min-w-[140px] text-center">
                  {calendarView === 'mes' && selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  {calendarView === 'dia' && selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {calendarView === 'semana' && `Semana de ${getWeekDays[0].getDate()}/${getWeekDays[0].getMonth() + 1}`}
                  {calendarView === 'lista' && "Compromissos Recentes"}
                </h3>
                <button 
                  onClick={() => calendarView === 'mes' ? changeMonth(1) : calendarView === 'dia' ? changeDay(1) : setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))}
                  className="bg-[#2A2A3A] hover:bg-[#34344A] p-2 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs text-[#8A2BE2] hover:underline font-extrabold bg-[#8A2BE2]/5 px-2.5 py-1.5 rounded-lg border border-[#8A2BE2]/10"
                >
                  Hoje
                </button>
              </div>

              {/* View selectors */}
              <div className="flex gap-1 bg-[#0E0E18] p-1 rounded-xl border border-[#2A2A3A]">
                {(['dia', 'semana', 'mes', 'lista'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                      calendarView === v
                        ? 'bg-[#8A2BE2] text-white'
                        : 'text-slate-450 hover:bg-[#151520]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

            </div>

            {/* MONTH VIEW CALENDAR GRID */}
            {calendarView === 'mes' && (
              <div className="border border-[#2A2A3A] rounded-2xl bg-[#12121A] overflow-hidden overflow-x-auto">
                <div className="min-w-[700px] lg:min-w-0">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 text-center bg-[#151522] py-2 border-b border-[#2A2A3A] text-[10px] font-black uppercase text-slate-400">
                    <div>Dom</div>
                    <div>Seg</div>
                    <div>Ter</div>
                    <div>Qua</div>
                    <div>Qui</div>
                    <div>Sex</div>
                    <div>Sáb</div>
                  </div>

                  {/* Days grid cells using gap border technique */}
                  <div className="grid grid-cols-7 gap-[1px] bg-[#2A2A3A] text-xs">
                    {currentMonthDays.map((cell, idx) => {
                      const cellMeets = getDayMeetings(cell.date);
                      const isToday = cell.date.toDateString() === new Date().toDateString();

                      return (
                        <div 
                          key={idx} 
                          className={`min-h-[100px] p-2 flex flex-col justify-between transition-all group hover:bg-[#181825]/60 ${
                            cell.isCurrentMonth ? 'text-slate-100 bg-[#12121A]' : 'text-slate-500 bg-[#0E0E14]/30'
                          } ${isToday ? 'ring-1 ring-[#8A2BE2] bg-[#8A2BE2]/5 z-[1]' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-black rounded p-1 ${
                              isToday ? 'bg-[#8A2BE2] text-white w-6 h-6 flex items-center justify-center rounded-full text-[11px]' : ''
                            }`}>
                              {cell.date.getDate()}
                            </span>
                            <button 
                              onClick={() => openNewMeetingModal(cell.date.toISOString().substring(0, 10))}
                              className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Agendar neste dia"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* List meetings inside cell */}
                          <div className="space-y-1 mt-2">
                             {cellMeets.slice(0, 3).map(m => (
                               <div 
                                 key={m.id}
                                 onClick={() => openEditMeetingModal(m)}
                                 className={`p-1 px-1.5 rounded-md text-[10px] font-bold line-clamp-1 truncate cursor-pointer transition-colors ${
                                   m.status === 'Realizado' 
                                     ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                                     : m.status === 'Cancelado'
                                       ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                                       : m.status === 'Confirmado'
                                         ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10'
                                         : m.status === 'Reagendado'
                                           ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/10'
                                           : 'bg-[#8A2BE2]/10 border border-[#8A2BE2]/25 text-[#B026FF] hover:bg-[#8A2BE2]/20'
                                 }`}
                               >
                                 {m.time} {m.company}
                               </div>
                             ))}
                            {cellMeets.length > 3 && (
                              <div className="text-[9px] text-[#D946EF] font-black pl-1">
                                +{cellMeets.length - 3} mais
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* WEEK VIEW GRID */}
            {calendarView === 'semana' && (
              <div className="border border-[#2A2A3A] rounded-2xl bg-[#12121A] overflow-hidden overflow-x-auto divide-y divide-[#2A2A3A]">
                <div className="min-w-[700px] lg:min-w-0 divide-y divide-[#2A2A3A]">
                  <div className="grid grid-cols-7 text-center bg-[#151522] py-3 text-xs font-black uppercase text-slate-400">
                    {getWeekDays.map((day, idx) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={idx} className={`${isToday ? 'text-[#8A2BE2]' : ''}`}>
                          <div>{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                          <div className="text-lg font-black mt-1">{day.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-7 gap-[1px] bg-[#2A2A3A] min-h-[400px]">
                    {getWeekDays.map((day, idx) => {
                      const cellMeets = getDayMeetings(day);
                      return (
                        <div key={idx} className="p-3 space-y-3 bg-[#12121A] hover:bg-[#151522]/40 transition-all">
                          {cellMeets.map(m => (
                            <div
                              key={m.id}
                              onClick={() => openEditMeetingModal(m)}
                              className="bg-[#1C1C29] border border-[#2A2A3A] hover:border-[#8A2BE2] p-2.5 rounded-xl transition-all cursor-pointer space-y-2 group/card"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-extrabold font-mono text-[#D946EF]">{m.time}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                                  m.status === 'Realizado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  m.status === 'Cancelado' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                  m.status === 'Confirmado' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                                  m.status === 'Reagendado' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>{m.status}</span>
                              </div>
                              <h4 className="font-extrabold text-white text-xs line-clamp-1">{m.title}</h4>
                              <p className="text-[10px] text-slate-400 font-bold">{m.company}</p>
                              
                              {/* Quick status action buttons on hover / card bottom */}
                              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#2A2A3A]/65 mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                {m.status !== 'Confirmado' && m.status !== 'Realizado' && (
                                  <button 
                                    onClick={() => handleUpdateMeetingStatus(m.id, 'Confirmado')}
                                    className="text-[8px] font-black text-indigo-400 hover:text-white bg-[#151522] hover:bg-indigo-500/35 border border-indigo-500/20 px-1 py-0.5 rounded transition-all"
                                    title="Confirmar Compromisso"
                                  >
                                    Confirmar
                                  </button>
                                )}
                                {m.status !== 'Realizado' && (
                                  <button 
                                    onClick={() => handleUpdateMeetingStatus(m.id, 'Realizado')}
                                    className="text-[8px] font-black text-emerald-400 hover:text-white bg-[#151522] hover:bg-emerald-500/35 border border-emerald-500/20 px-1 py-0.5 rounded transition-all"
                                    title="Marcar como Realizado"
                                  >
                                    Realizar
                                  </button>
                                )}
                                {m.status !== 'Cancelado' && (
                                  <button 
                                    onClick={() => handleUpdateMeetingStatus(m.id, 'Cancelado')}
                                    className="text-[8px] font-black text-rose-400 hover:text-white bg-[#151522] hover:bg-rose-500/35 border border-rose-500/20 px-1 py-0.5 rounded transition-all"
                                    title="Cancelar Compromisso"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {cellMeets.length === 0 && (
                            <div className="text-[10px] text-slate-600 italic text-center pt-8">Sem reuniões</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DAY VIEW GRID */}
            {calendarView === 'dia' && (
              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center bg-[#151522] p-4 rounded-xl border border-[#2A2A3A]">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#8A2BE2]" />
                    <span>Compromissos para {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </h4>
                  <button
                    onClick={() => openNewMeetingModal(selectedDate.toISOString().substring(0, 10))}
                    className="bg-[#8A2BE2]/10 hover:bg-[#8A2BE2]/20 border border-[#8A2BE2]/20 text-[#B026FF] py-1.5 px-3 rounded-lg text-xs font-bold"
                  >
                    Novo Compromisso
                  </button>
                </div>

                <div className="divide-y divide-[#2A2A3A]">
                  {getDayMeetings(selectedDate).length === 0 ? (
                    <div className="text-center py-16 text-slate-500 italic text-xs font-semibold">
                      Nenhum compromisso comercial agendado para este dia.
                    </div>
                  ) : (
                    getDayMeetings(selectedDate).map(m => (
                      <div key={m.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="w-16 text-center shrink-0">
                            <span className="block text-lg font-black text-[#D946EF] font-mono">{m.time}</span>
                            <span className="text-[10px] text-slate-450 uppercase font-bold">{m.type}</span>
                          </div>
                          <div>
                            <h5 className="font-extrabold text-white text-sm hover:text-[#B026FF] cursor-pointer" onClick={() => openEditMeetingModal(m)}>{m.title}</h5>
                            <p className="text-xs text-slate-350 font-bold mt-1">Lead: <span className="text-[#B026FF]">{m.company}</span> | Resp: {m.responsible}</p>
                            {m.observations && <p className="text-[11px] text-slate-450 mt-1.5 italic">" {m.observations} "</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {m.type === 'Google Meet' && m.meetLink && (
                            <a
                              href={m.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-4.5 h-4.5" />
                              <span>Entrar no Meet</span>
                            </a>
                          )}
                          <div className="flex items-center gap-1.5 bg-[#171725]/60 p-1 rounded-xl border border-[#2A2A3A]/80">
                            {m.status !== 'Confirmado' && m.status !== 'Realizado' && (
                              <button
                                onClick={() => handleUpdateMeetingStatus(m.id, 'Confirmado')}
                                className="text-[10px] font-black text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-lg transition-all"
                                title="Confirmar Compromisso"
                              >
                                Confirmar
                              </button>
                            )}
                            {m.status !== 'Realizado' && (
                              <button
                                onClick={() => handleUpdateMeetingStatus(m.id, 'Realizado')}
                                className="text-[10px] font-black text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition-all"
                                title="Marcar como Realizado"
                              >
                                Realizar
                              </button>
                            )}
                            {m.status !== 'Cancelado' && (
                              <button
                                onClick={() => handleUpdateMeetingStatus(m.id, 'Cancelado')}
                                className="text-[10px] font-black text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg transition-all"
                                title="Cancelar Compromisso"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-black uppercase ${
                            m.status === 'Realizado' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : m.status === 'Cancelado' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : m.status === 'Confirmado' 
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : m.status === 'Reagendado' 
                                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                    : 'bg-[#8A2BE2]/10 text-[#B026FF] border border-[#8A2BE2]/20'
                          }`}>
                            {m.status}
                          </span>
                          <button onClick={() => openEditMeetingModal(m)} className="text-slate-450 hover:text-white transition-all p-1 hover:bg-[#2A2A3A] rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* LIST DETAILED COMPROMISSOS */}
            {calendarView === 'lista' && (
              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151522] border-b border-[#2A2A3A] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Empresa / Compromisso</th>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A3A] text-xs">
                    {filteredMeetings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 italic">Nenhum compromisso comercial na agenda.</td>
                      </tr>
                    ) : (
                      filteredMeetings.map(m => (
                        <tr key={m.id} className="hover:bg-[#151525]/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-white text-sm">{m.company}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{m.title}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-200">{new Date(m.date).toLocaleDateString('pt-BR')}</div>
                            <div className="text-[11px] text-slate-450 font-mono font-bold mt-0.5">{m.time}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-bold">{m.responsible}</td>
                          <td className="py-3.5 px-4">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              {m.type === 'Google Meet' && <Video className="w-3.5 h-3.5 text-emerald-400" />}
                              {m.type === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                              {m.type === 'Telefone' && <Phone className="w-3.5 h-3.5 text-sky-400" />}
                              {m.type === 'Presencial' && <MapPin className="w-3.5 h-3.5 text-red-400" />}
                              <span>{m.type}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              m.status === 'Realizado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                              m.status === 'Cancelado' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                              m.status === 'Confirmado' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                              m.status === 'Reagendado' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20' :
                              'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick Status actions */}
                              {m.status !== 'Confirmado' && m.status !== 'Realizado' && (
                                <button
                                  onClick={() => handleUpdateMeetingStatus(m.id, 'Confirmado')}
                                  className="text-[10px] font-black text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1.5 rounded-lg transition-all border border-indigo-500/20"
                                  title="Confirmar"
                                >
                                  Confirmar
                                </button>
                              )}
                              {m.status !== 'Realizado' && (
                                <button
                                  onClick={() => handleUpdateMeetingStatus(m.id, 'Realizado')}
                                  className="text-[10px] font-black text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-lg transition-all border border-emerald-500/20"
                                  title="Concluir"
                                >
                                  Realizar
                                </button>
                              )}
                              {m.status !== 'Cancelado' && (
                                <button
                                  onClick={() => handleUpdateMeetingStatus(m.id, 'Cancelado')}
                                  className="text-[10px] font-black text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1.5 rounded-lg transition-all border border-rose-500/20"
                                  title="Cancelar"
                                >
                                  Cancelar
                                </button>
                              )}

                              {m.status === 'Realizado' && (
                                <button
                                  onClick={() => handleGenerateProposalWithIA(m)}
                                  className="bg-gradient-to-r from-[#8A2BE2]/20 to-[#B026FF]/20 text-[#D946EF] px-2.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 hover:brightness-125 border border-[#B026FF]/25"
                                  title="Minuta Inteligente com Inteligência Artificial"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#D946EF]" />
                                  <span>Proposta IA</span>
                                </button>
                              )}
                              <button onClick={() => openEditMeetingModal(m)} className="text-slate-400 hover:text-white p-1 hover:bg-[#2A2A3A] rounded-lg transition-all" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMeeting(m.id)} className="text-slate-400 hover:text-rose-500 p-1 hover:bg-[#2A2A3A] rounded-lg transition-all" title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Generated Proposal Overlay */}
            {generatingProposalFor && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#12121A] border border-[#2A2A3A] rounded-3xl w-full max-w-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#D946EF] animate-pulse" />
                      <span>Proposta Comercial Gerada com IA</span>
                    </h4>
                    <button 
                      onClick={() => { setGeneratingProposalFor(null); setGeneratedProposal(null); }}
                      className="text-slate-400 hover:text-white font-extrabold text-sm"
                    >
                      Fechar
                    </button>
                  </div>

                  {!generatedProposal ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-10 h-10 border-4 border-t-transparent border-[#8A2BE2] rounded-full animate-spin mx-auto"></div>
                      <p className="text-slate-450 text-xs font-bold">Consultando dados da empresa e estruturando proposta comercial com Gemini AI...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="bg-[#151520] p-4 rounded-xl border border-[#2A2A3A] space-y-3">
                        <p className="text-[#D946EF] font-black uppercase text-[10px]">Cliente: {generatedProposal.company}</p>
                        <div>
                          <strong className="text-white block font-extrabold text-sm mb-1">🎯 Escopo do Serviço</strong>
                          <span className="text-slate-300 leading-relaxed font-medium">{generatedProposal.escopo}</span>
                        </div>
                        <div>
                          <strong className="text-white block font-extrabold text-sm mb-1">💰 Investimento Proposto</strong>
                          <span className="text-[#22C55E] text-base font-black font-mono">{generatedProposal.valor}</span>
                        </div>
                        <div>
                          <strong className="text-white block font-extrabold text-sm mb-1">📈 Benefícios Exclusivos</strong>
                          <ul className="list-disc pl-5 text-slate-350 space-y-1 mt-1 font-medium">
                            {generatedProposal.beneficios.map((b: string, i: number) => <li key={i}>{b}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-white block font-extrabold text-sm mb-1">📅 Cronograma de Implementação</strong>
                          <span className="text-slate-400 italic font-semibold">{generatedProposal.cronograma}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <button
                          onClick={() => {
                            const textProps = `PROPOSTA COMERCIAL - ${generatedProposal.company}\n\nEscopo:\n${generatedProposal.escopo}\n\nValor: ${generatedProposal.valor}\n\nBenefícios:\n${generatedProposal.beneficios.join('\n')}`;
                            navigator.clipboard.writeText(textProps);
                            triggerNotification("Texto da proposta copiado!", 'success');
                          }}
                          className="bg-slate-900 border border-[#2A2A3A] hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-xl"
                        >
                          Copiar Texto
                        </button>
                        <button
                          onClick={() => {
                            triggerNotification("Download do PDF simulado iniciado!", "success");
                            window.open("https://ads-hive-mock-proposals.pdf", "_blank");
                          }}
                          className="bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:opacity-95 text-white font-extrabold py-2  px-4 rounded-xl shadow-glow-purple flex items-center gap-1.5"
                        >
                          <FileText className="w-4.5 h-4.5" />
                          <span>Gerar & Baixar PDF</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            </div> {/* End of Left side (lg:col-span-8) */}

            {/* Right side: Google Calendar Sync Panel (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-6 shadow-sm">
                
                {/* Header */}
                <div className="space-y-1.5 pb-4 border-b border-[#2A2A3A]/45">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Google Calendar Sync
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed text-left">
                    Conecte sua conta do Google para ver seus eventos e importá-los para a agenda da plataforma.
                  </p>
                </div>

                {/* Connection Controls */}
                {!googleToken ? (
                  <div className="bg-[#151520] border border-[#2A2A3A] p-5 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 bg-[#8A2BE2]/10 border border-[#8A2BE2]/20 rounded-2xl flex items-center justify-center mx-auto">
                      <CalendarDays className="w-6 h-6 text-[#8A2BE2]" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-white uppercase">Calendário Desconectado</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        Sincronize reuniões e otimize seu fluxo de vendas.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleConnectGoogleCalendar}
                      className="w-full bg-[#1A1A26] hover:bg-[#202030] text-white border border-[#2A2A3A] hover:border-slate-800 transition-all py-2.5 px-4 rounded-xl flex items-center justify-center gap-2.5 text-xs font-black tracking-wide cursor-pointer text-center font-sans border-solid outline-none"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Conectar Google Calendar</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Connection Badge */}
                    <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-2xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider text-left">Conta Google Ativa</p>
                          <p className="text-xs text-white font-black truncate text-left">{auth.currentUser?.email || session?.email || "Google Conectado"}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleToken(null);
                          cachedGoogleCalendarToken = null;
                          setGoogleEvents([]);
                          triggerNotification('Google Calendar desconectado.', 'info');
                        }}
                        className="text-[10px] uppercase font-black text-rose-400 hover:text-rose-500 transition-colors shrink-0 outline-none border-none bg-none cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>

                    {/* Refresh controller */}
                    <div className="flex items-center justify-between pb-1 border-b border-[#2A2A3A]/40">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Eventos do Google</span>
                      <button
                        type="button"
                        onClick={() => fetchGoogleEvents(googleToken)}
                        className="text-[10px] text-[#8A2BE2] hover:underline font-black uppercase tracking-wider bg-none border-none cursor-pointer outline-none"
                      >
                        {fetchingEvents ? 'Sincronizando...' : 'Atualizar'}
                      </button>
                    </div>

                    {/* Events list */}
                    {fetchingEvents ? (
                      <div className="space-y-2.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="bg-[#151520] p-4 rounded-xl border border-[#2A2A3A] animate-pulse space-y-2">
                            <div className="h-3 bg-[#2A2A3A] rounded w-2/3"></div>
                            <div className="h-2.5 bg-[#2A2A3A] rounded w-5/12"></div>
                          </div>
                        ))}
                      </div>
                    ) : googleEvents.length === 0 ? (
                      <div className="bg-[#151520]/80 p-6 rounded-2xl text-center border border-[#2A2A3A]/40">
                        <p className="text-xs text-slate-400 font-bold font-sans">Nenhum evento futuro encontrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {googleEvents.map((evt) => {
                          const evStart = evt.start?.dateTime || evt.start?.date || '';
                          let formattedTime = 'Dia Inteiro';
                          let formattedDate = 'Sem Data';
                          
                          if (evStart) {
                            const dateObj = new Date(evStart);
                            formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                            if (evt.start?.dateTime) {
                              formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            }
                          }

                          return (
                            <div key={evt.id} className="bg-[#151520] border border-[#2A2A3A] p-4 rounded-2xl space-y-3 transition-all hover:bg-[#191928]">
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-white leading-snug line-clamp-2 text-left">{evt.summary || '(Sem título)'}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold font-mono">
                                  <span>📅 {formattedDate}</span>
                                  <span>•</span>
                                  <span>⏰ {formattedTime}</span>
                                </div>
                              </div>

                              {/* Lead Selector & Import Exec */}
                              <div className="pt-2 border-t border-[#2A2A3A]/40 flex flex-col gap-2">
                                <label className="text-[9px] text-[#A1A1AA] uppercase font-black tracking-wider block text-left">Vincular a um Lead Ativo</label>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    id={`lead-select-${evt.id}`}
                                    className="flex-1 bg-[#0E0E18] border border-[#2A2A3A] hover:border-slate-700 text-[11px] text-slate-300 rounded-lg py-1.5 px-2 outline-none font-medium"
                                  >
                                    <option value="">-- Criar Avulso --</option>
                                    {leads.map(l => (
                                      <option key={l.id} value={l.id}>{l.name} ({l.niche})</option>
                                    ))}
                                  </select>
                                  
                                  <button
                                    type="button"
                                    disabled={importingEventId === evt.id}
                                    onClick={() => {
                                      const sel = document.getElementById(`lead-select-${evt.id}`) as HTMLSelectElement;
                                      const leadVal = sel ? sel.value : '';
                                      handleImportGoogleEvent(evt, leadVal);
                                    }}
                                    className="bg-[#8A2BE2]/10 border border-[#8A2BE2]/20 hover:bg-[#8A2BE2] hover:text-white text-xs font-black uppercase text-[#8A2BE2] py-1.5 px-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer outline-none"
                                  >
                                    {importingEventId === evt.id ? (
                                      <span>...</span>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>Importar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* =============== SUB VIEW: 2) FOLLOW-UP INTELIGENTE =============== */}
        {activeTab === 'followup' && (
          <div className="space-y-6">
            <div className="bg-[#151520] p-5 rounded-2xl border border-[#2A2A3A] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D946EF] animate-pulse" />
                  <span>Sugerido pela Sales AI: Prospecção Ativa</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed font-medium">
                  A inteligência comercial monitora a inatividade de seus leads e gera recomendações automatizadas para maximizar os fechamentos.
                </p>
              </div>
              <div className="px-4 py-2 bg-[#8A2BE2]/10 border border-[#8A2BE2]/20 rounded-xl">
                <span className="text-[10px] text-[#B026FF] uppercase font-mono font-black">Score de Engajamento: <strong className="text-emerald-400">92%</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followUpLeads.length === 0 ? (
                <div className="col-span-full bg-[#12121A] border border-[#2A2A3A] p-12 text-center text-slate-500 italic text-xs font-semibold">
                  Nenhuma recomendação pendente! Parabéns, toda a sua base de leads está engajada.
                </div>
              ) : (
                followUpLeads.map((f, i) => (
                  <div key={i} className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 shadow-inner hover:border-[#8A2BE2]/40 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-white text-sm line-clamp-1">{f.lead.name}</h4>
                          <span className="text-[10px] font-bold text-slate-450 uppercase">{f.lead.niche}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          f.type === 'sem_contato' ? 'bg-rose-500/20 text-rose-400 border border-rose-550/20' :
                          f.type === 'proposta_sem_resposta' ? 'bg-amber-500/20 text-amber-500 border border-amber-550/20' :
                          'bg-sky-500/20 text-sky-400 border border-sky-550/20'
                        }`}>
                          {f.type === 'sem_contato' ? 'Sem Contato' : f.type === 'proposta_sem_resposta' ? 'Proposta Fria' : 'Lead Esquecido'}
                        </span>
                      </div>

                      <p className="text-slate-350 text-xs leading-relaxed font-semibold italic">
                        "{f.r_desc}"
                      </p>
                      
                      <p className="text-[10px] text-slate-450 font-bold">
                        Recomendação: <span className="text-[#D946EF]">Tentar reaquecimento via whatsapp estruturado.</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-[#2A2A3A]">
                      <button 
                        onClick={() => handleGenerateAIScript(f.lead, 'whatsapp')}
                        className="py-1.5 px-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg transition-colors cursor-pointer uppercase"
                      >
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => handleGenerateAIScript(f.lead, 'email')}
                        className="py-1.5 px-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-450 text-[10px] font-black rounded-lg transition-colors cursor-pointer uppercase"
                      >
                        Enviar E-mail
                      </button>
                      <button 
                        onClick={() => {
                          openNewMeetingModal();
                          setFormData(p => ({ ...p, leadId: f.lead.id, company: f.lead.name }));
                        }}
                        className="py-1.5 px-1 bg-[#8A2BE2]/15 hover:bg-[#8A2BE2]/25 border border-[#8A2BE2]/30 text-[#B026FF] text-[10px] font-black rounded-lg transition-all cursor-pointer uppercase"
                      >
                        Agendar Lig.
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AdsHive Sales AI Conversational Block */}
            <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-[#8A2BE2] to-[#D946EF] p-2.5 rounded-xl shadow-glow-purple">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Assistente Comercial Inteligente de Vendas</h4>
                  <p className="text-slate-450 text-xs font-semibold">Previsões inteligentes de oportunidades lucrativas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#151520] p-4 rounded-xl border border-[#2A2A3A] space-y-2">
                  <span className="text-[10px] text-[#B026FF] uppercase font-black tracking-wider block">Horário Nobre Sugerido</span>
                  <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    Com base no nicho dos seus leads (Estética, Odonto, Clínicas), verificamos que o melhor horário para agendamento de chamadas é de <strong className="text-white">Segunda a Quinta das 14h às 16:30h</strong>. Taxa de resposta de WhatsApp 4x maior.
                  </p>
                </div>

                <div className="bg-[#151520] p-4 rounded-xl border border-[#2A2A3A] space-y-2">
                  <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">Previsão de Fechamento</span>
                  <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    Sua taxa atual de conversão de reunião para negociação de propostas é de <strong className="text-emerald-400">{meetingsStats.convertedRate}%</strong>. Com 3 reuniões ativas na fila, prevemos um incremento comercial de aproximadamente <strong className="text-white">R$ 5.000,00 recorrentes</strong> nas próximas 2 semanas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============== SUB VIEW: 3) PERFORMANCE & FECHAMENTO =============== */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Reuniões Agendadas</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{meetingsStats.total}</span>
                  <span className="text-xs text-slate-450">ativas</span>
                </div>
                <div className="w-full bg-[#151520] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#8A2BE2] h-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Reuniões Realizadas</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{meetingsStats.realizados}</span>
                  <span className="text-xs text-slate-450">concluídas</span>
                </div>
                <div className="w-full bg-[#151520] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#B026FF] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Taxa de Comparecimento</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{meetingsStats.comparecimentoRate}%</span>
                  <span className="text-xs text-slate-450">média</span>
                </div>
                <div className="w-full bg-[#151520] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${meetingsStats.comparecimentoRate}%` }}></div>
                </div>
              </div>

              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] text-[#D946EF] font-black uppercase tracking-wider block">Receita Gerada de Reuniões</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">R$ {meetingsStats.revenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-[#151520] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#8A2BE2] to-[#D946EF] h-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            {/* In-depth commercial pipeline tracker */}
            <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-5 flex items-center gap-1.5">
                <Award className="text-[#8A2BE2] w-5 h-5" />
                <span>Métricas Básicas de Funil & Vendas</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs divide-y md:divide-y-0 md:divide-x divide-[#2A2A3A]">
                <div className="space-y-3 pt-4 md:pt-0">
                  <span className="text-[10px] text-[#B026FF] uppercase font-black block tracking-wider">Envios de Propostas</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{meetingsStats.proposalsSent}</span>
                    <span className="text-slate-400 font-bold">Documentos enviados hoje</span>
                  </div>
                  <p className="text-slate-400 font-semibold leading-relaxed">Taxa de aceitação de orçamentos e fechamentos: <strong className="text-white">{meetingsStats.convertedRate}%</strong> de alta qualificação.</p>
                </div>

                <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                  <span className="text-[10px] text-emerald-400 uppercase font-black block tracking-wider">Tempo Médio de Fechamento</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">6 dias</span>
                    <span className="text-slate-400 font-bold">do Lead até a Assinatura</span>
                  </div>
                  <p className="text-slate-400 font-semibold leading-relaxed">Ciclo de vendas extremamente rápido proporcionado pelo envio rápido do link do Google Meet e propostas por Whatsapp.</p>
                </div>

                <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                  <span className="text-[10px] text-[#D946EF] uppercase font-black block tracking-wider">Top Canal de Contato</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">Google Meet</span>
                    <span className="text-slate-400 font-bold">85% preferência</span>
                  </div>
                  <p className="text-slate-400 font-semibold leading-relaxed">As chamadas por vídeo possuem engajamento 3.5x superior às reuniões via ligação convencional no fechamento de anúncios locais.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============== SUB VIEW: 4) OWNER PANEL =============== */}
        {activeTab === 'owner_panel' && (
          <div className="space-y-6">
            <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
                <Shield className="w-5 h-5 text-amber-500" />
                <span>Painel de Resultados de Vendas Gerais (Administrador / Owner)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs border border-[#2A2A3A] bg-[#151520]/40 p-5 rounded-2xl mb-6">
                <div>
                  <span className="text-slate-400 font-black block text-[10px] uppercase">Total de Reuniões Criadas</span>
                  <strong className="text-3xl font-black text-white mt-1 block">152</strong>
                  <p className="text-slate-500 font-serif font-semibold mt-1">Este mês</p>
                </div>
                <div>
                  <span className="text-slate-400 font-black block text-[10px] uppercase">Usuários Ativos</span>
                  <strong className="text-3xl font-black text-white mt-1 block">12 usuários</strong>
                  <p className="text-slate-500 font-serif font-semibold mt-1">SDRs e Closers agendando</p>
                </div>
                <div>
                  <span className="text-slate-400 font-black block text-[10px] uppercase">Receita Total de Reuniões</span>
                  <strong className="text-3xl font-extrabold text-[#D946EF] mt-1 block font-mono">R$ 57.500,00</strong>
                  <p className="text-slate-500 font-serif font-semibold mt-1">Lançamento faturado</p>
                </div>
              </div>

              {/* Top active commercial users rank */}
              <div className="space-y-3">
                <span className="text-slate-350 text-xs font-black uppercase block tracking-wider">Top Closers e Agendamentos</span>
                <div className="border border-[#2A2A3A] rounded-2xl overflow-hidden bg-[#151520]/20 text-xs divide-y divide-[#2A2A3A]">
                  <div className="p-4 grid grid-cols-5 text-slate-400 font-black uppercase text-[9px] bg-[#151522]">
                    <div className="col-span-2">Usuário</div>
                    <div className="text-center">Total de Agendamentos</div>
                    <div className="text-center">Comparecimento</div>
                    <div className="text-right">Conversão</div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-5 items-center font-semibold text-slate-200">
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#8A2BE2]/10 rounded-full flex items-center justify-center text-[#B026FF] font-black">D</div>
                      <div>
                        <div className="font-extrabold">Douglas Silva</div>
                        <span className="text-[10px] text-slate-450 font-bold uppercase">SDR Master</span>
                      </div>
                    </div>
                    <div className="text-center font-bold">24</div>
                    <div className="text-center text-emerald-400 font-bold">88%</div>
                    <div className="text-right text-[#D946EF] font-bold">42%</div>
                  </div>

                  <div className="p-4 grid grid-cols-5 items-center font-semibold text-slate-200">
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-black">M</div>
                      <div>
                        <div className="font-extrabold">Mariane Costa</div>
                        <span className="text-[10px] text-slate-450 font-bold uppercase">Closer Sênior</span>
                      </div>
                    </div>
                    <div className="text-center font-bold">18</div>
                    <div className="text-center text-emerald-400 font-bold">85%</div>
                    <div className="text-right text-[#D946EF] font-bold">38%</div>
                  </div>

                  <div className="p-4 grid grid-cols-5 items-center font-semibold text-slate-200">
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 font-black">F</div>
                      <div>
                        <div className="font-extrabold">Felipe Santos</div>
                        <span className="text-[10px] text-slate-450 font-bold uppercase">SDR Júnior</span>
                      </div>
                    </div>
                    <div className="text-center font-bold">12</div>
                    <div className="text-center text-rose-450 font-bold">75%</div>
                    <div className="text-right text-[#D946EF] font-bold">20%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============== SUB VIEW: 5) CALENDLY CONFIG INTERNO =============== */}
        {activeTab === 'config_calendly' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Configuration panel form */}
              <div className="lg:col-span-7 bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Settings className="w-4.5 h-4.5 text-[#8A2BE2]" />
                  <span>Configurações da Página Pública de Agendamento</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Custom ID / Slug de Link</label>
                      <div className="flex bg-[#151520] border border-[#2A2A3A] rounded-xl pr-3 overflow-hidden">
                        <span className="bg-[#212130] text-slate-450 px-3 py-2.5 font-bold shrink-0">@</span>
                        <input
                          type="text"
                          value={calendlyConfig.slug}
                          onChange={(e) => setCalendlyConfig({ ...calendlyConfig, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          placeholder="douglas"
                          className="w-full bg-transparent py-2 px-2 text-xs text-white outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Nome do Profissional</label>
                      <input
                        type="text"
                        value={calendlyConfig.nome}
                        onChange={(e) => setCalendlyConfig({ ...calendlyConfig, nome: e.target.value })}
                        className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl py-2.5 px-3.5 text-xs text-white font-bold outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cargo</label>
                      <input
                        type="text"
                        value={calendlyConfig.cargo}
                        onChange={(e) => setCalendlyConfig({ ...calendlyConfig, cargo: e.target.value })}
                        className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl py-2.5 px-3.5 text-xs text-white font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Empresa</label>
                      <input
                        type="text"
                        value={calendlyConfig.empresa}
                        onChange={(e) => setCalendlyConfig({ ...calendlyConfig, empresa: e.target.value })}
                        className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl py-2.5 px-3.5 text-xs text-white font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Url da Imagem de Perfil / Foto</label>
                    <input
                      type="text"
                      value={calendlyConfig.avatarUrl}
                      onChange={(e) => setCalendlyConfig({ ...calendlyConfig, avatarUrl: e.target.value })}
                      className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl py-2 px-3 text-xs text-slate-350 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Descrição comercial rápida</label>
                    <textarea
                      value={calendlyConfig.descricao}
                      onChange={(e) => setCalendlyConfig({ ...calendlyConfig, descricao: e.target.value })}
                      placeholder="Fale um pouco sobre o objetivo do agendamento..."
                      className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl p-3.5 text-xs text-white outline-none min-h-[90px] resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveCalendly}
                      className="bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:from-[#7b23cf] hover:to-[#a21fed] py-2.5 px-5 rounded-xl font-black text-white uppercase text-[11px] tracking-wide active:scale-95 transition-all shadow-glow-purple cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>

              {/* Public link preview look-alike */}
              <div className="lg:col-span-5 bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4 text-center">
                <span className="text-[10px] text-[#D946EF] font-black uppercase tracking-wider block">Visualização Prévia do Link Ativo</span>
                
                <div className="bg-[#151520] border border-[#2A2A3A] p-6 rounded-2xl space-y-3 inline-block w-full">
                  <img
                    src={calendlyConfig.avatarUrl}
                    alt={calendlyConfig.nome} 
                    className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#8A2BE2]/50 shadow-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
                    }}
                  />
                  <div>
                    <h5 className="font-extrabold text-white text-base">{calendlyConfig.nome}</h5>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">{calendlyConfig.cargo} @ {calendlyConfig.empresa}</p>
                  </div>
                  
                  <p className="text-slate-350 text-[11px] leading-relaxed italic border-t border-[#2A2A3A]/40 pt-3">
                    "{calendlyConfig.descricao}"
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-450 block font-bold">Link de Compartilhamento do Calendly</span>
                  
                  <div className="bg-[#151520] border border-[#2A2A3A] px-3.5 py-2.5 rounded-xl text-slate-300 font-bold text-xs select-all text-center flex items-center justify-between font-mono gap-2 overflow-hidden">
                    <span className="truncate">prospect.adshive.online/agendar/{calendlyConfig.slug}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://prospect.adshive.online/agendar/${calendlyConfig.slug}`);
                        triggerNotification("Link comercial do Calendly copiado!", "success");
                      }}
                      className="text-[#B026FF] hover:text-[#D946EF]"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  {/* Preview public experience trigger */}
                  <button
                    onClick={() => {
                      // Navigate directly within our hash or path router mechanism!
                      window.location.hash = `#/agendar/${calendlyConfig.slug}`;
                      triggerNotification("Entrando em modo de visualização de cliente!", "info");
                    }}
                    className="w-full bg-[#151520] hover:bg-[#1f1f2e] border border-[#2A2A3A] py-3 rounded-xl text-slate-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-[#D946EF]" />
                    <span>Abrir Página de Agendamento</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL DE AGENDAMENTO / FORM DETAILED ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-3xl w-full max-w-xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {editingMeeting ? 'Editar Compromisso Comercial' : 'Agendar Novo Compromisso'}
              </h4>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingMeeting(null); }}
                className="text-slate-400 hover:text-white font-extrabold text-sm"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Título da Reunião</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-white font-bold outline-none"
                    placeholder="Ex: Demonstração de Resultados"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Vincular a Lead do CRM</label>
                  <select
                    value={formData.leadId}
                    onChange={(e) => {
                      const selectedLead = leads.find(l => l.id === e.target.value);
                      if (selectedLead) {
                        setFormData({
                          ...formData,
                          leadId: selectedLead.id,
                          company: selectedLead.name,
                          phone: selectedLead.phone || '',
                          email: selectedLead.email || '',
                          city: selectedLead.location.split(',')[0] || ''
                        });
                      } else {
                        setFormData({ ...formData, leadId: e.target.value });
                      }
                    }}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-slate-300 font-bold outline-none"
                  >
                    <option value="">-- Cadastrar de forma avulsa --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.niche})</option>
                    ))}
                  </select>
                </div>
              </div>

              {!formData.leadId && (
                <div className="border border-[#2C2C3F] bg-[#151522]/30 p-3.5 rounded-xl space-y-3">
                  <span className="text-[10px] text-amber-500 font-black uppercase block">Dados do Cliente Avulso</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Empresa"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-[#151520] border border-[#2A2A3A] py-1.5 px-3 rounded-lg text-white"
                      required={!formData.leadId}
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-[#151520] border border-[#2A2A3A] py-1.5 px-3 rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="WhatsApp / Telefone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[#151520] border border-[#2A2A3A] py-1.5 px-3 rounded-lg text-white"
                    />
                    <input
                      type="email"
                      placeholder="E-mail principal"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#151520] border border-[#2A2A3A] py-1.5 px-3 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Hora</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Responsável</label>
                  <input
                    type="text"
                    required
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tipo de Reunião</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-slate-350 outline-none font-bold"
                  >
                    <option value="Google Meet">Google Meet (Link Automático)</option>
                    <option value="Telefone">Ligação Telefônica</option>
                    <option value="WhatsApp">Sala do WhatsApp</option>
                    <option value="Presencial">Reunião Presencial</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Status do Agendamento</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2 px-3 rounded-xl text-slate-350 outline-none"
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado pelo Cliente</option>
                    <option value="Realizado">Realizado / Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Reagendado">Reagendado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Observações / Plano de Pauta</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Instruções para a chamada comercial ou pauta..."
                  className="w-full bg-[#151520] border border-[#2A2A3A] rounded-xl p-3 text-white outline-none min-h-[60px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingMeeting(null); }}
                  className="bg-slate-900 hover:bg-[#1F1F2F] text-slate-300 px-4 py-2 rounded-xl h-fit cursor-pointer font-extrabold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] text-white px-5 py-2 rounded-xl h-fit shadow-glow-purple font-black uppercase tracking-wide cursor-pointer flex items-center gap-1"
                >
                  {isSaving && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                  <span>{editingMeeting ? 'Salvar Edição' : 'Feito, Agendar'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
