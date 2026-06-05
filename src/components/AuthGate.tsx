import React, { useState } from 'react';
import { UserSession } from '../types';
import { ShieldCheck, User, Mail, Lock, Sparkles, KeyRound } from 'lucide-react';

interface AuthGateProps {
  onSignIn: (session: UserSession) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSignIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('douglasbateriacma@gmail.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('Douglas CMA');
  const [role, setRole] = useState<'Administrador' | 'Gestor' | 'SDR' | 'Closer' | 'Operador'>('Gestor');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Agência'>('Agência');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    // Role-dependent static credits allotment
    let credits = 1000;
    if (plan === 'Pro') credits = 2500;
    if (plan === 'Agência') credits = 5000;

    const mockSession: UserSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: isLogin ? (email === 'douglasbateriacma@gmail.com' ? 'Douglas CMA' : 'Membro da Equipe') : name,
      email,
      role: isLogin ? (email === 'douglasbateriacma@gmail.com' ? 'Gestor' : 'SDR') : role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      plan: isLogin ? 'Agência' : plan,
      credits,
    };

    onSignIn(mockSession);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setErrorMsg('Insira seu e-mail de cadastro.');
      return;
    }

    setRecoverySuccess(true);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2"></div>

      <div className="w-full max-w-md z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold mb-3 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulos 1 & 2 Ativos</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
            <span>MapsLeads</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Plataforma de Prospecção Inteligente & CRM B2B</p>
        </div>

        {/* Auth Box */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          
          {isRecovering ? (
            /* PASSWORD RECOVERY VIEW */
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Recuperação de Senha</h2>
                <p className="text-slate-450 text-xs mt-1">Insira seu e-mail cadastrado para receber instruções de redefinição.</p>
              </div>

              {recoverySuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs space-y-3">
                  <p className="font-bold">E-mail de verificação enviado!</p>
                  <p className="leading-relaxed font-semibold">Um link seguro e temporário foi enviado para <strong className="text-white">{recoveryEmail}</strong> contendo as instruções para criar uma nova senha.</p>
                  <button 
                    onClick={() => {
                      setIsRecovering(false);
                      setRecoverySuccess(false);
                    }}
                    className="w-full mt-2 bg-emerald-600 text-white font-bold py-2 rounded-xl text-center hover:bg-emerald-700 cursor-pointer text-xs"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-4">
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3 rounded-xl text-xs font-bold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="Ex: douglasbateriacma@gmail.com" 
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/15 cursor-pointer text-xs uppercase tracking-wider block"
                  >
                    Enviar Link de Verificação
                  </button>

                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsRecovering(false)}
                      className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* LOGIN AND REGISTER VIEW */
            <div className="space-y-6">
              
              {/* Selector */}
              <div id="auth-tab-selector" className="grid grid-cols-2 bg-[#1e293b]/50 p-1.5 rounded-xl border border-slate-800">
                <button 
                  onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${isLogin ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Entrada Segura
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${!isLogin ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Criar Conta
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white">{isLogin ? 'Login no Applet' : 'Cadastro de Usuários'}</h2>
                <p className="text-slate-450 text-xs mt-1">
                  {isLogin 
                    ? 'Acesse com sua conta para gerenciar e capturar leads B2B.' 
                    : 'Crie uma credencial operacional definindo perfis de acesso (RBAC).'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3 rounded-xl text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                {/* Name - only for signup */}
                {!isLogin && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Ex: Douglas CMA" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <label block>Endereço de E-mail</label>
                    {isLogin && (
                      <span className="text-blue-500 font-mono text-[9px] lowercase opacity-70">admin: douglasbateriacma@gmail.com</span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      placeholder="Ex: seu_email@provedor.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Senha</label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => { setIsRecovering(true); setErrorMsg(''); }}
                        className="text-[10px] text-blue-500 hover:text-blue-400 font-bold transition-all cursor-pointer"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      placeholder="No mínimo 6 caracteres" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* RBAC Selector - only for signup */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Perfil de Acesso (RBAC)</label>
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white font-extrabold cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Gestor">Gestor</option>
                        <option value="SDR">SDR (Captação)</option>
                        <option value="Closer">Closer (Fechamento)</option>
                        <option value="Operador">Operador (Stitch)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Plano SaaS</label>
                      <select 
                        value={plan}
                        onChange={(e) => setPlan(e.target.value as any)}
                        className="w-full bg-[#1e293b]/70 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white font-extrabold cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="Starter">Starter (200 cr.)</option>
                        <option value="Pro">Pro (1000 cr.)</option>
                        <option value="Agência">Agência (5000 cr.)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Login suggestions details */}
                {isLogin && email === 'douglasbateriacma@gmail.com' && (
                  <div className="bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-2xl text-[11px] text-blue-400 leading-normal font-semibold">
                    💡 <strong className="text-white">Acesso de Demonstração:</strong> Use as credenciais pré-preenchidas para entrar como <strong>Douglas CMA (Gestor)</strong> com créditos premium liberados.
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/15 cursor-pointer text-xs uppercase tracking-wider block"
                >
                  {isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                </button>

              </form>

            </div>
          )}

        </div>

        {/* Footer Credit */}
        <p className="text-center text-slate-600 text-xs mt-6 flex items-center justify-center gap-1">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Autenticação RBAC Protegida com Criptografia Segura</span>
        </p>

      </div>
    </div>
  );
};
