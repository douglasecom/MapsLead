import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { 
  Calendar, Clock, User, Phone, Mail, Building, MapPin, 
  Video, CheckCircle2, Copy, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { Meeting } from '../types';

interface PublicBookingProps {
  slug: string;
  triggerNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PublicBooking: React.FC<PublicBookingProps> = ({ slug, triggerNotification }) => {
  const [profile, setProfile] = useState({
    slug: slug,
    nome: 'Douglas Silva',
    empresa: 'AdsHive',
    cargo: 'SDR Master / Closer',
    descricao: 'Reserve um horário na minha agenda comercial para apresentar as auditorias de presença digital e planejar a estratégia de anúncios!',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    duration: 30
  });

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorCity, setVisitorCity] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [bookedMeeting, setBookedMeeting] = useState<Meeting | null>(null);

  // Available slots logic
  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'];

  useEffect(() => {
    // Attempt loading custom config from localStorage fallback first (since this corresponds to locally edited session users)
    // In production we would query `/users` or `/settings`
    const localSaved = localStorage.getItem('calendly_demo_user');
    if (localSaved) {
      try {
        setProfile(JSON.parse(localSaved));
      } catch (e) {}
    } else {
      // Find matches in active storage files or preset
      if (slug.toLowerCase() !== 'douglas') {
        setProfile(prev => ({
          ...prev,
          nome: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
          slug: slug
        }));
      }
    }
  }, [slug]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert("Por favor selecione uma data e horário!");
      return;
    }

    setLoading(true);

    try {
      const newId = `pub-${Math.random().toString(36).substring(2, 9)}`;
      const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      
      const meetingObj: Meeting = {
        id: newId,
        title: `Reunião Comercial AdsHive: ${visitorCompany}`,
        company: visitorCompany,
        responsible: profile.nome,
        date: selectedDate,
        time: selectedTime,
        type: 'Google Meet',
        status: 'Agendado',
        meetLink: meetLink,
        phone: visitorPhone,
        email: visitorEmail,
        whatsapp: visitorPhone,
        city: visitorCity,
        observations: 'Agendamento externo realizado de forma autônoma pelo Calendly Público.',
        createdAt: new Date().toISOString()
      };

      // 1. Write the Meeting to firestore
      await setDoc(doc(db, 'meetings', newId), meetingObj);

      // 2. Write a placeholder lead in database so the CRM also gains this lead beautifully!
      const leadId = `lead-${Math.random().toString(36).substring(2, 9)}`;
      const newLead = {
        id: leadId,
        name: visitorName,
        phone: visitorPhone,
        email: visitorEmail,
        location: `${visitorCity}, Brasil`,
        niche: 'Agendamento Calendly',
        hasWebsite: false,
        leadScore: 80,
        status: 'reuniao',
        meetingTime: `${new Date(selectedDate).toLocaleDateString('pt-BR')} às ${selectedTime}`,
        meetingTitle: `Calendly: ${visitorCompany}`,
        meetLink,
        capturedAt: new Date().toISOString(),
        timeline: [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'capture',
            title: 'Lead capturado via Calendly Interno',
            description: `Contato autônomo agendado por ${visitorName} para ${new Date(selectedDate).toLocaleDateString('pt-BR')} às ${selectedTime}.`,
            createdAt: new Date().toISOString()
          }
        ],
        tasks: []
      };
      await setDoc(doc(db, 'leads', leadId), newLead);

      setBookedMeeting(meetingObj);
      if (triggerNotification) {
        triggerNotification(`Agendamento realizado para dia ${new Date(selectedDate).toLocaleDateString('pt-BR')}!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao agendar reunião: ${err.message || 'Tente outro horário'}`);
    } finally {
      setLoading(false);
    }
  };

  if (bookedMeeting) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex items-center justify-center p-4" id="booked-success-screen">
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-3xl w-full max-w-lg p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Neon purple decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#8A2BE2]/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Agendamento Realizado!</h2>
            <p className="text-slate-400 text-xs font-semibold">
              Um convite de reunião comercial foi registrado e vinculado ao CRM da <strong className="text-white">AdsHive</strong>.
            </p>
          </div>

          <div className="bg-[#151520] border border-[#2A2A3A] p-5 rounded-2xl text-left text-xs space-y-3.5">
            <div>
              <span className="text-[10px] text-slate-450 block uppercase font-black">Data e Hora</span>
              <strong className="text-white font-mono text-base">{new Date(bookedMeeting.date).toLocaleDateString('pt-BR')} às {bookedMeeting.time}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-450 block uppercase font-black">Consultor Comercial</span>
              <strong className="text-white">{profile.nome}</strong>
              <span className="text-slate-450 text-[11px] block font-medium mt-0.5">{profile.cargo} @ {profile.empresa}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-450 block uppercase font-black">Link da Videochamada (Google Meet)</span>
              <div className="flex items-center justify-between bg-[#12121A] border border-[#2A2A3A] p-2.5 rounded-xl mt-1.5 gap-2 overflow-hidden">
                <span className="text-[#8A2BE2] font-semibold truncate font-mono text-[11px]">{bookedMeeting.meetLink}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bookedMeeting.meetLink || '');
                    alert("Link do Google Meet copiado!");
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <a
              href={bookedMeeting.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-glow-purple flex items-center justify-center gap-2 text-xs"
            >
              <Video className="w-4.5 h-4.5" />
              <span>Entrar na Reunião Google Meet</span>
            </a>
            <button
              onClick={() => {
                setBookedMeeting(null);
                setVisitorName('');
                setVisitorCompany('');
                setVisitorEmail('');
                setVisitorPhone('');
                setSelectedDate('');
                setSelectedTime('');
              }}
              className="w-full bg-[#151520] hover:bg-[#1f1f2e] border border-[#2A2A3A] text-slate-350 font-bold py-3 rounded-xl text-xs transition-colors"
            >
              Agendar Outro Horário
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 p-4 md:p-8 flex items-center justify-center" id="calendly-public-screen">
      <div className="bg-[#12121A] border border-[#2A2A3A] rounded-3xl w-full max-w-4xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glowing visual decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8A2BE2]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#2A2A3A]">
          
          {/* LEFT: Profissional profile presentationcard */}
          <div className="md:col-span-5 space-y-6 pb-6 md:pb-0 md:pr-6">
            <div className="flex md:flex-col items-center md:items-start gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.nome}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#8A2BE2]/40 shadow-inner"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
                }}
              />
              <div className="space-y-1">
                <span className="text-[10px] bg-[#8A2BE2]/10 border border-[#8A2BE2]/25 text-[#B026FF] px-2.5 py-0.5 rounded font-black uppercase tracking-wider">Agendamento de Reunião</span>
                <h1 className="text-xl font-black text-white mt-1.5">{profile.nome}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase">{profile.cargo} @ {profile.empresa}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 font-bold">
                <Clock className="w-4.5 h-4.5 text-[#B026FF]" />
                <span>{profile.duration} minutos de duração</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-slate-300 font-bold">
                <Video className="w-4.5 h-4.5 text-[#B026FF]" />
                <span>Videochamada via Google Meet (Link gerado no CRM)</span>
              </div>

              <div className="text-slate-350 leading-relaxed font-semibold italic border-t border-[#2A2A3A]/45 pt-4">
                "{profile.descricao}"
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Scheduler Slot form and inputs */}
          <div className="md:col-span-7 pt-6 md:pt-0 md:pl-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Selecione Data e Horário</span>
            </h2>

            <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date selection field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A2BE2]" />
                    <span>Data da Reunião</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().substring(0, 10)}
                    className="w-full bg-[#151520] border border-[#2A2A3A] py-2.5 px-3 rounded-xl text-white outline-none font-bold font-mono focus:border-[#8A2BE2] transition-colors"
                  />
                </div>

                {/* Slots selectors list */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8A2BE2]" />
                    <span>Horários Disponíveis</span>
                  </label>
                  
                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-1.5 text-center font-bold font-mono rounded-lg transition-all ${
                            selectedTime === time
                              ? 'bg-indigo-600 text-white border border-indigo-550 shadow-md scale-95'
                              : 'bg-[#151520] border border-[#2A2A3A] hover:bg-[#1E1E2F] text-slate-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#151520] border border-[#2A2A3A]/40 text-slate-500 rounded-xl p-3 text-center leading-relaxed font-semibold">
                      Escolha uma data primeiro para checar horários.
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Visitor contact information details */}
              {selectedDate && selectedTime && (
                <div className="space-y-3.5 border-t border-[#2A2A3A] pt-5 animate-in fade-in slide-in-from-top-3 duration-300">
                  <span className="text-[10px] text-[#D946EF] font-black uppercase tracking-wider block">Insira seus Dados Profissionais</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-black uppercase">Seu Nome Completo</label>
                      <div className="flex items-center bg-[#151520] border border-[#2A2A3A] rounded-xl px-3 mt-1 focus-within:border-[#8A2BE2]">
                        <User className="w-4 h-4 text-slate-500 mr-2" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: Douglas Silva"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          className="w-full bg-transparent py-2.5 outline-none text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-black uppercase">Nome da sua Empresa</label>
                      <div className="flex items-center bg-[#151520] border border-[#2A2A3A] rounded-xl px-3 mt-1 focus-within:border-[#8A2BE2]">
                        <Building className="w-4 h-4 text-slate-500 mr-2" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: Clínica Sorriso"
                          value={visitorCompany}
                          onChange={(e) => setVisitorCompany(e.target.value)}
                          className="w-full bg-transparent py-2.5 outline-none text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] text-slate-400 font-black uppercase">E-mail Comercial</label>
                      <div className="flex items-center bg-[#151520] border border-[#2A2A3A] rounded-xl px-3 mt-1 focus-within:border-[#8A2BE2]">
                        <Mail className="w-4 h-4 text-slate-500 mr-2" />
                        <input
                          type="email"
                          required
                          placeholder="exemplo@empresa.com"
                          value={visitorEmail}
                          onChange={(e) => setVisitorEmail(e.target.value)}
                          className="w-full bg-transparent py-2.5 outline-none text-white font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-black uppercase">WhatsApp / Fone</label>
                      <div className="flex items-center bg-[#151520] border border-[#2A2A3A] rounded-xl px-3 mt-1 focus-within:border-[#8A2BE2]">
                        <Phone className="w-4 h-4 text-slate-500 mr-2" />
                        <input
                          type="text"
                          required
                          placeholder="11999998888"
                          value={visitorPhone}
                          onChange={(e) => setVisitorPhone(e.target.value)}
                          className="w-full bg-transparent py-2.5 outline-none text-white font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-black uppercase">Sua Cidade / UF</label>
                    <div className="flex items-center bg-[#151520] border border-[#2A2A3A] rounded-xl px-3 mt-1 focus-within:border-[#8A2BE2]">
                      <MapPin className="w-4 h-4 text-slate-500 mr-2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo - SP"
                        value={visitorCity}
                        onChange={(e) => setVisitorCity(e.target.value)}
                        className="w-full bg-transparent py-2.5 outline-none text-slate-300 font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#B026FF] hover:brightness-110 active:scale-95 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-glow-purple flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                      <span>Confirmar Reunião Comercial</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

        </div>

        {/* Brand backlink marker */}
        <div className="text-center pt-8 border-t border-[#2A2A3A]/45 mt-8 text-[10px] text-slate-550 font-bold">
          Página de agendamentos autorizada e assegurada pelo sistema CRM <strong className="text-white hover:text-[#B026FF]">AdsHive Prospect</strong>.
        </div>

      </div>
    </div>
  );
};
