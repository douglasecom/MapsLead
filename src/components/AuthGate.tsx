import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  KeyRound, 
  Compass, 
  MapPin, 
  Globe, 
  Search, 
  Building2, 
  Flame, 
  Users, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  Monitor, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  LineChart,
  Target
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthGateProps {
  onSignIn: (session: UserSession) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSignIn }) => {
  // Navigation states: 'login' | 'register' | 'recovery' | 'onboarding'
  const [currentStep, setCurrentStep] = useState<'login' | 'register' | 'recovery' | 'onboarding'>('login');
  
  // Onboarding stream sub-steps: 1 (Segment) | 2 (Objective) | 3 (Congratulations)
  const [onboardingSubStep, setOnboardingSubStep] = useState<1 | 2 | 3>(1);
  const [onboardingSegment, setOnboardingSegment] = useState<string>('');
  const [onboardingObjective, setOnboardingObjective] = useState<string>('');
  const [tempUserSession, setTempUserSession] = useState<UserSession | null>(null);

  // Form Field states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Status indicators
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Theme Sync inside AuthGate (saves to localStorage and updates body class)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    // Update HTML/Body document classes to align with light or dark mode
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    document.body.classList.remove('theme-light', 'theme-dark');

    if (themeMode === 'light') {
      root.classList.add('theme-light');
      document.body.classList.add('theme-light');
      root.style.backgroundColor = '#F8F9FC';
      document.body.style.backgroundColor = '#F8F9FC';
    } else {
      root.classList.add('theme-dark');
      document.body.classList.add('theme-dark');
      root.style.backgroundColor = '#0B0B0F';
      document.body.style.backgroundColor = '#0B0B0F';
    }
    // Update SEO details
    document.title = "Login | AdsHive Prospect";
  }, [themeMode]);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('theme', nextTheme);
    localStorage.setItem('appearance_choice', nextTheme);
  };

  const notifyUser = (text: string) => {
    // Falls back to simple visual console indicators or trigger simple temporary alert message
    console.log("[AuthGate Message]", text);
  };

  // Google Login Auth Integration
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check user record
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let userSession: UserSession;
      const isDeveloper = (user.email || '').toLowerCase() === 'douglasbateriacma@gmail.com';

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        userSession = {
          id: user.uid,
          name: profileData.name || user.displayName || 'Usuário AdsHive',
          email: user.email || profileData.email || '',
          role: isDeveloper ? 'Administrador' : (profileData.role || 'Gestor'),
          avatarUrl: profileData.avatarUrl || user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          plan: isDeveloper ? 'Unlimited' : (profileData.plan || 'Pro'),
          credits: isDeveloper ? 999999 : (profileData.credits !== undefined ? profileData.credits : 1000),
          subscriptionStatus: profileData.subscriptionStatus || 'ACTIVE'
        };
        onSignIn(userSession);
      } else {
        // Since Google Login is an absolute sign up for brand new user, route to Onboarding first!
        const initialSession: UserSession = {
          id: user.uid,
          name: isDeveloper ? 'Douglas CMA' : (user.displayName || 'Usuário AdsHive'),
          email: user.email || '',
          role: isDeveloper ? 'Administrador' : 'Gestor',
          avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          plan: isDeveloper ? 'Unlimited' : 'Pro',
          credits: isDeveloper ? 999999 : 10, // 10 free credits for initial trial
          subscriptionStatus: 'ACTIVE',
          planCredits: isDeveloper ? 999999 : 10,
          purchasedCredits: 0,
          bonusCredits: 0,
          remainingCredits: isDeveloper ? 999999 : 10,
          accountStatus: 'ACTIVE'
        };

        setTempUserSession(initialSession);
        setCurrentStep('onboarding');
        setOnboardingSubStep(1);
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err?.message || 'Ocorreu um erro ao conectar com o Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Microsoft Login Auth Mock Integration (Redirects safely or alerts)
  const handleMicrosoftSignIn = () => {
    setErrorMsg('A integração nativa com o Microsoft Sign-In está aguardando as permissões do Azure Active Directory no Console do Administrador.');
    notifyUser('Sign-in Microsoft em análise');
  };

  // Email / Password Form handle for standard sign-in and sign-up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentStep === 'login') {
      if (!email || !password) {
        setErrorMsg('Insira o seu e-mail e sua senha de acesso.');
        return;
      }

      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch User Profile Document in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        let userSession: UserSession;
        const isDeveloper = email.toLowerCase() === 'douglasbateriacma@gmail.com';

        if (userSnap.exists()) {
          const profileData = userSnap.data();
          userSession = {
            id: user.uid,
            name: profileData.name || 'Membro da Equipe',
            email: user.email || email,
            role: isDeveloper ? 'Administrador' : (profileData.role || 'Gestor'),
            avatarUrl: profileData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            plan: isDeveloper ? 'Unlimited' : (profileData.plan || 'Pro'),
            credits: isDeveloper ? 999999 : (profileData.credits !== undefined ? profileData.credits : 1000),
            subscriptionStatus: profileData.subscriptionStatus || 'ACTIVE'
          };
        } else {
          userSession = {
            id: user.uid,
            name: isDeveloper ? 'Douglas CMA' : 'Membro da Equipe',
            email: user.email || email,
            role: isDeveloper ? 'Administrador' : 'Gestor',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            plan: isDeveloper ? 'Unlimited' : 'Pro',
            credits: isDeveloper ? 999999 : 10,
            subscriptionStatus: 'ACTIVE'
          };
          await setDoc(userRef, userSession);
        }

        onSignIn(userSession);
      } catch (err: any) {
        console.error('Email login error:', err);
        const code = err?.code || '';
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setErrorMsg('E-mail ou senha incorreta. Verifique os dados e tente novamente.');
        } else if (code === 'auth/user-not-found') {
          setErrorMsg('Usuário não encontrado. Crie uma conta para começar.');
        } else {
          setErrorMsg(err?.message || 'Falha ao autenticar sua senha ou e-mail.');
        }
      } finally {
        setIsLoading(false);
      }

    } else if (currentStep === 'register') {
      if (!name || !email || !password || !confirmPassword) {
        setErrorMsg('Preencha todos os campos para prosseguir.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Por segurança, a senha de segurança deve conter no mínimo 6 caracteres.');
        return;
      }

      if (!acceptTerms) {
        setErrorMsg('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
        return;
      }

      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const isDeveloper = email.toLowerCase() === 'douglasbateriacma@gmail.com';

        // 10 free leads allotment standard for visual conversions
        const initialCredits = isDeveloper ? 999999 : 10;

        const newSession: UserSession = {
          id: user.uid,
          name: isDeveloper ? 'Douglas CMA' : name,
          email: user.email || email,
          role: isDeveloper ? 'Administrador' : 'Gestor',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          plan: isDeveloper ? 'Unlimited' : 'Pro',
          credits: initialCredits,
          subscriptionStatus: 'ACTIVE',
          planCredits: initialCredits,
          purchasedCredits: 0,
          bonusCredits: 0,
          remainingCredits: initialCredits,
          accountStatus: 'ACTIVE',
          teamId: businessName || 'Minha Empresa'
        };

        // Store temporary session state before completing user onboarding questions
        setTempUserSession(newSession);
        setCurrentStep('onboarding');
        setOnboardingSubStep(1);
      } catch (err: any) {
        console.error('Email register error:', err);
        const code = err?.code || '';
        if (code === 'auth/email-already-in-use') {
          setErrorMsg('Este e-mail já está sendo utilizado por outra conta ativa.');
        } else {
          setErrorMsg(err?.message || 'Não foi possível concluir o registro da sua conta.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Password Recovery submission helper
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setErrorMsg('Por favor, indique o seu endereço de e-mail.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await sendPasswordResetEmail(auth, recoveryEmail);
      setRecoverySuccess(true);
    } catch (err: any) {
      console.error('Password reset failure:', err);
      setErrorMsg('Não foi possível enviar o link de verificação. Verifique se o endereço é válido.');
    } finally {
      setIsLoading(false);
    }
  };

  // Onboarding action flow steps
  const finishOnboarding = async () => {
    if (!tempUserSession) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', tempUserSession.id);
      
      const configuredSession = {
        ...tempUserSession,
        onboardingSegment: onboardingSegment || 'Outro',
        onboardingObjective: onboardingObjective || 'Encontrar clientes',
        credits: (tempUserSession.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? 999999 : 10,
        remainingCredits: (tempUserSession.email || '').toLowerCase() === 'douglasbateriacma@gmail.com' ? 999999 : 10,
      };

      // Save user profile with onboarding tags directly to Firestore
      await setDoc(userRef, configuredSession);
      
      onSignIn(configuredSession);
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      // Fallback onSignIn anyway
      onSignIn(tempUserSession);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between selection:bg-[#8B2EFF] selection:text-white transition-all duration-300 ${
      themeMode === 'light' ? 'bg-[#F8F9FC] text-[#111827]' : 'bg-[#0B0B0F] text-[#FFFFFF]'
    }`}>
      
      {/* Absolute top navbar tools */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            themeMode === 'light' 
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              : 'bg-[#1C1C26] border-[#2B2B3A] text-white hover:bg-[#2B2B3A] shadow-glow-purple'
          }`}
        >
          {themeMode === 'light' ? '🌙 Escuro' : '☀️ Claro'}
        </button>
      </div>

      {/* Main Container - Split Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Column: Interactive Visual Identity, SaaS presentation, Stats & Benefits */}
        <div className={`lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-6 sm:p-12 md:p-16 overflow-hidden border-r transition-all duration-300 ${
          themeMode === 'light' 
            ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200/60' 
            : 'bg-gradient-to-br from-[#0B0B0F] via-[#0B0B0F] to-[#14141B] border-[#2B2B3A]'
        }`}>
          
          {/* Decorative Floaters with Animated/Styled purple glow */}
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#8B2EFF]/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] bg-[#C93CFF]/8 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/3 right-10 w-24 h-24 bg-[#8B2EFF]/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Logo element */}
          <div className="z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B2EFF] flex items-center justify-center shadow-glow-purple transition-transform duration-300 hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-black tracking-tight leading-none ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                AdsHive <span className="text-[#8B2EFF]">Prospect</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B0B3C1]-600 mt-1 opacity-70">Inteligente & Conversão</span>
            </div>
          </div>

          {/* Hero text & Benefits Body */}
          <div className="z-10 my-10 md:my-auto max-w-xl space-y-8">
            
            {/* Promo Neon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8B2EFF]/10 border border-[#8B2EFF]/20 rounded-full text-xs font-black text-[#C93CFF]-400 tracking-wide text-[#C93CFF]">
              <span className="animate-bounce">🎁</span>
              <span>Ganhe 10 Leads Grátis ao Criar sua Conta</span>
            </div>

            {/* Principal Title */}
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              Encontre Clientes <br className="hidden sm:inline" /> 
              Antes da <span className="premium-gradient-text">Concorrência</span>
            </h2>

            {/* Description */}
            <p className={`text-sm sm:text-base leading-relaxed ${
              themeMode === 'light' ? 'text-slate-600' : 'text-[#B0B3C1]'
            }`}>
              Descubra ferramentas avançadas de prospecção comercial. Mapeie empresas sem site, explore redes ativas, gere abordagens impulsionadas por IA e monte listas de leads qualificadas em segundos com máxima conversão de vendas.
            </p>

            {/* Benefits Bento / Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                { label: 'Google Maps Inteligente', desc: 'Extração instantânea e filtrada' },
                { label: 'Empresas sem Site', desc: 'Oportunidades quentes de desenvolvimento' },
                { label: 'Meta Ads Library', desc: 'Monitore campanhas e anúncios ativos' },
                { label: 'CRM Integrado', desc: 'Linha do tempo e tarefas automatizadas' },
                { label: 'IA para Prospecção', desc: 'Modelos de mensagens adaptativos' },
                { label: 'Análise de Concorrência', desc: 'Relatórios de SEO e performance técnica' }
              ].map((b, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border transition-all duration-300 ${
                  themeMode === 'light' 
                    ? 'bg-white border-slate-200/70 hover:border-slate-300' 
                    : 'bg-[#1C1C26]/60 border-[#2B2B3A]/60 hover:border-[#8B2EFF]/40'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#8B2EFF]/10 text-[#8B2EFF] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                      {b.label}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1 pl-7 ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* Footer Statistics */}
          <div className="z-10 pt-6 border-t border-slate-200/40 dark:border-[#2B2B3A]/50">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
              themeMode === 'light' ? 'text-slate-400' : 'text-[#7A7D8B]'
            }`}>
              Performance Operacional Estimada
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="block text-lg sm:text-xl font-black text-[#8B2EFF] leading-none">+5.570</span>
                <span className={`text-[10px] font-semibold tracking-tight block mt-1 ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>cidades mapeadas</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-[#2B2B3A] pl-4">
                <span className="block text-lg sm:text-xl font-black text-[#C93CFF] leading-none">+100k</span>
                <span className={`text-[10px] font-semibold tracking-tight block mt-1 ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>empresas analisadas</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-[#2B2B3A] pl-4">
                <span className="block text-lg sm:text-xl font-black text-[#8B2EFF] leading-none">+50k</span>
                <span className={`text-[10px] font-semibold tracking-tight block mt-1 ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>leads gerados</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Form Stream Card (Login / Register / Recovery / Onboarding) */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-4 sm:p-8 md:p-12 bg-transparent z-10">
          
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: LOGIN MODE */}
              {currentStep === 'login' && (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="premium-card-glow p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center sm:text-left space-y-1.5">
                    <h3 className={`text-2xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Bem-vindo de volta
                    </h3>
                    <p className={`text-xs ${themeMode === 'light' ? 'text-[#6B7280]' : 'text-[#B0B3C1]'}`}>
                      Entre para acessar sua central de prospecção inteligente.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold leading-normal">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                        Endereço de E-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#B0B3C1]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Digite seu e-mail"
                          className={`w-full text-xs font-semibold rounded-xl py-3 pl-11 pr-4 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className={themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}>Senha</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep('recovery');
                            setErrorMsg('');
                          }}
                          className="text-[#8B2EFF] hover:underline cursor-pointer"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#B0B3C1]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha"
                          className={`w-full text-xs font-semibold rounded-xl py-3 pl-11 pr-11 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Remember me */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                          className="w-4 h-4 rounded text-[#8B2EFF] border-slate-300 dark:border-[#2B2B3A] focus:ring-[#8B2EFF]"
                        />
                        <span className={`text-[11px] font-semibold ${themeMode === 'light' ? 'text-slate-600' : 'text-[#B0B3C1]'}`}>
                          Lembrar acesso no dispositivo
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-premium-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-extrabold tracking-wide uppercase cursor-pointer"
                    >
                      {isLoading ? 'Autenticando...' : 'Entrar na Plataforma'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200/50 dark:border-[#2B2B3A]/80"></div>
                    <span className={`flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest ${
                      themeMode === 'light' ? 'text-slate-400' : 'text-[#7A7D8B]'
                    }`}>
                      Ou continue com
                    </span>
                    <div className="flex-grow border-t border-slate-200/50 dark:border-[#2B2B3A]/80"></div>
                  </div>

                  {/* Social Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black cursor-pointer transition-all w-full ${
                        themeMode === 'light'
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          : 'bg-[#14141B] border-[#2B2B3A] hover:bg-[#1C1C26] text-white shadow-sm'
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.5-4.53-4.19-4.53z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      Continuar com o Google
                    </button>
                  </div>

                  {/* Switch Card Footer */}
                  <div className="pt-2 text-center border-t border-slate-100 dark:border-[#2B2B3A]/40">
                    <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>
                      Não possui conta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep('register');
                          setErrorMsg('');
                        }}
                        className="text-[#8B2EFF] font-black hover:underline cursor-pointer"
                      >
                        Criar Conta Gratuitamente
                      </button>
                    </p>
                  </div>

                </motion.div>
              )}

              {/* STEP 2: REGISTRATION MODE */}
              {currentStep === 'register' && (
                <motion.div
                  key="register-step"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="premium-card-glow p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center sm:text-left space-y-1.5">
                    <h3 className={`text-2xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Crie sua Conta Gratuita
                    </h3>
                    <p className={`text-xs ${themeMode === 'light' ? 'text-[#6B7280]' : 'text-[#B0B3C1]'}`}>
                      Receba 10 Leads Grátis e descubra empresas prontas para comprar.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Row: Name and Business */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Douglas"
                          className={`w-full text-xs font-semibold rounded-xl py-3 px-4 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                          Agência ou Empresa
                        </label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Média e Grande"
                          className={`w-full text-xs font-semibold rounded-xl py-3 px-4 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                        Melhor E-mail
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="douglasbateriacma@gmail.com"
                        className={`w-full text-xs font-semibold rounded-xl py-3 px-4 focus:outline-none transition-all ${
                          themeMode === 'light'
                            ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                            : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                        }`}
                      />
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                          Criar Senha
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 dig"
                          className={`w-full text-xs font-semibold rounded-xl py-3 px-4 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                          Confirmar Senha
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className={`w-full text-xs font-semibold rounded-xl py-3 px-4 focus:outline-none transition-all ${
                            themeMode === 'light'
                              ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                              : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Checkbox Accept */}
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={() => setAcceptTerms(!acceptTerms)}
                        className="mt-0.5 w-4.5 h-4.5 rounded text-[#8B2EFF] border-slate-300 dark:border-[#2B2B3A] focus:ring-[#8B2EFF]"
                      />
                      <span className={`text-[11px] leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-[#B0B3C1]'}`}>
                        Declaro que aceito as diretrizes operacionais dos <strong>Termos de Uso</strong> e as garantias de privacidade do AdsHive Prospect.
                      </span>
                    </label>

                    {/* Submit Register */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-premium-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-extrabold tracking-wide uppercase cursor-pointer"
                    >
                      {isLoading ? 'Configurando...' : 'Criar Minha Conta Grátis'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                  </form>

                  {/* Switch Card Footer */}
                  <div className="pt-2 text-center border-t border-slate-100 dark:border-[#2B2B3A]/40">
                    <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>
                      Já tem uma conta operacional?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep('login');
                          setErrorMsg('');
                        }}
                        className="text-[#8B2EFF] font-black hover:underline cursor-pointer"
                      >
                        Acessar Minha Conta
                      </button>
                    </p>
                  </div>

                </motion.div>
              )}

              {/* STEP 3: RECOVERY MODE */}
              {currentStep === 'recovery' && (
                <motion.div
                  key="recovery-step"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="premium-card-glow p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center sm:text-left space-y-1.5">
                    <h3 className={`text-2xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Recuperação de Senha
                    </h3>
                    <p className={`text-xs ${themeMode === 'light' ? 'text-[#6B7280]' : 'text-[#B0B3C1]'}`}>
                      Insira o seu e-mail cadastrado e enviaremos um link de suporte.
                    </p>
                  </div>

                  {recoverySuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs space-y-3">
                      <p className="font-bold">Solicitação processada!</p>
                      <p className="leading-relaxed font-semibold">Um link seguro e temporário foi enviado para <strong className="text-white">{recoveryEmail}</strong> contendo as instruções para criar uma nova senha.</p>
                      <button 
                        onClick={() => {
                          setCurrentStep('login');
                          setRecoverySuccess(false);
                          setRecoveryEmail('');
                        }}
                        className="w-full mt-2 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-center hover:bg-emerald-700 cursor-pointer text-xs uppercase"
                      >
                        Voltar para o Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                      {errorMsg && (
                        <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3 rounded-xl text-xs font-bold">
                          {errorMsg}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ${themeMode === 'light' ? 'text-slate-500' : 'text-[#7A7D8B]'}`}>
                          E-mail de Cadastro
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#B0B3C1]" />
                          <input
                            type="email"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="Ex: douglasbateriacma@gmail.com"
                            className={`w-full text-xs font-semibold rounded-xl py-3 pl-11 pr-4 focus:outline-none transition-all ${
                              themeMode === 'light'
                                ? 'bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-[#8B2EFF] text-slate-900'
                                : 'bg-[#14141B] border border-[#2B2B3A] focus:border-[#8B2EFF] focus:bg-[#1C1C26] text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-premium-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-extrabold tracking-wide uppercase cursor-pointer"
                      >
                        {isLoading ? 'Enviando...' : 'Enviar Token de Suporte'}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep('login');
                            setErrorMsg('');
                          }}
                          className={`text-xs font-bold hover:underline cursor-pointer ${
                            themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'
                          }`}
                        >
                          Voltar para Entrada Segura
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* STEP 4: ONBOARDING FLOW MODE */}
              {currentStep === 'onboarding' && (
                <motion.div
                  key="onboarding-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="premium-card-glow p-6 sm:p-8 space-y-6 relative"
                >
                  
                  {/* Progress Indicator Dots */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8B2EFF]">Onboarding Inteligente</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${onboardingSubStep >= 1 ? 'bg-[#8B2EFF]' : 'bg-slate-850'}`}></span>
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${onboardingSubStep >= 2 ? 'bg-[#8B2EFF]' : 'bg-slate-850'}`}></span>
                      <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${onboardingSubStep >= 3 ? 'bg-[#8B2EFF]' : 'bg-slate-850'}`}></span>
                    </div>
                  </div>

                  {/* SUB-STEP 1: QUAL SEU SEGMENTO? */}
                  {onboardingSubStep === 1 && (
                    <motion.div
                      key="onb-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="space-y-1">
                        <h4 className={`text-xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-950' : 'text-white'}`}>
                          Qual o seu segmento profissional?
                        </h4>
                        <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>
                          Personalizaremos as ferramentas de captação para o seu nicho estrutural.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { value: 'Agência', label: '🚀 Agência' },
                          { value: 'Gestor de Tráfego', label: '💼 Gestor de Tráfego' },
                          { value: 'Designer', label: '🎨 Designer' },
                          { value: 'Social Media', label: '✨ Social Media' },
                          { value: 'Vendas', label: '🤝 Vendas/SDR' },
                          { value: 'Outro', label: '⚙️ Outro nicho' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setOnboardingSegment(opt.value);
                              setOnboardingSubStep(2);
                            }}
                            className={`p-3.5 rounded-xl border text-xs font-black tracking-tight text-left transition-all duration-200 cursor-pointer ${
                              onboardingSegment === opt.value
                                ? 'bg-[#8B2EFF]/10 border-[#8B2EFF] text-[#8B2EFF]'
                                : themeMode === 'light'
                                  ? 'bg-slate-100 hover:bg-slate-200/60 border-slate-200 text-slate-800'
                                  : 'bg-[#14141B] border-[#2B2B3A] hover:border-[#8B2EFF]/40 hover:bg-[#1C1C26] text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          disabled={!onboardingSegment}
                          onClick={() => setOnboardingSubStep(2)}
                          className="px-5 py-2.5 rounded-xl bg-[#8B2EFF] hover:bg-[#9C4DFF] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          Continuar
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB-STEP 2: QUAL SEU OBJETIVO PRINCIPAL? */}
                  {onboardingSubStep === 2 && (
                    <motion.div
                      key="onb-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="space-y-1">
                        <h4 className={`text-xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-950' : 'text-white'}`}>
                          Qual o seu principal objetivo estratégico?
                        </h4>
                        <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-[#B0B3C1]'}`}>
                          Iremos priorizar os relatórios e inteligência com foco nesta conversão.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { value: 'Encontrar clientes', label: '🎯 Encontrar clientes e empresas qualificadas' },
                          { value: 'Vender sites', label: '💻 Vender sites e serviços de desenvolvimento web' },
                          { value: 'Vender tráfego pago', label: '📈 Vender tráfego pago e gestão de mídia social' },
                          { value: 'SEO', label: '🌐 Otimizar SEO e ranqueamento de concorrentes localizados' },
                          { value: 'Consultoria', label: '📊 Prestar consultoria comercial com dados avançados' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setOnboardingObjective(opt.value);
                              setOnboardingSubStep(3);
                            }}
                            className={`w-full p-4 rounded-xl border text-xs font-bold text-left transition-all duration-250 cursor-pointer ${
                              onboardingObjective === opt.value
                                ? 'bg-[#8B2EFF]/10 border-[#8B2EFF] text-[#8B2EFF]'
                                : themeMode === 'light'
                                  ? 'bg-slate-100 hover:bg-slate-200/60 border-slate-200 text-slate-800'
                                  : 'bg-[#14141B] border-[#2B2B3A] hover:border-[#8B2EFF]/40 hover:bg-[#1C1C26] text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => setOnboardingSubStep(1)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-350 dark:border-[#2B2B3A] cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button
                          disabled={!onboardingObjective}
                          onClick={() => setOnboardingSubStep(3)}
                          className="px-5 py-2.5 rounded-xl bg-[#8B2EFF] hover:bg-[#9C4DFF] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          Continuar
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB-STEP 3: CONGRATULATIONS */}
                  {onboardingSubStep === 3 && (
                    <motion.div
                      key="onb-3"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-6"
                    >
                      <div className="w-20 h-20 rounded-full bg-indigo-500/10 text-[#8B2EFF] flex items-center justify-center mx-auto shadow-glow-purple">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>

                      <div className="space-y-2">
                        <h4 className={`text-2xl font-black tracking-tight ${themeMode === 'light' ? 'text-slate-950' : 'text-white'}`}>
                          Parabéns!
                        </h4>
                        <p className={`text-xs px-2 ${themeMode === 'light' ? 'text-slate-650' : 'text-[#B0B3C1]'}`}>
                          Sua conta operacional foi ativada com sucesso para o segmento de <strong className="text-[#8B2EFF]">{onboardingSegment}</strong>.
                        </p>
                      </div>

                      {/* Celebration Card details */}
                      <div className={`p-4 rounded-2xl border ${
                        themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#14141B] border-[#2B2B3A]'
                      }`}>
                        <span className="text-2xl block mb-1">🎁</span>
                        <h5 className={`text-xs font-black ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                          Bônus de Boas-Vindas Liberado
                        </h5>
                        <p className="text-[10px] text-emerald-500 font-extrabold mt-0.5">
                          +10 Créditos de Prospecção adicionados na sua conta!
                        </p>
                      </div>

                      <button
                        onClick={finishOnboarding}
                        disabled={isLoading}
                        className="btn-premium-primary w-full py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {isLoading ? 'Inicializando...' : 'Ir para Plataforma'}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                    </motion.div>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Persistent Bottom Legal Credits Notice footer */}
      <footer className={`py-4 text-center text-[10px] border-t transition-all duration-300 ${
        themeMode === 'light' ? 'bg-white border-slate-200/60 text-slate-400' : 'bg-[#0B0B0F] border-[#2B2B3A]/60 text-[#7A7D8B]'
      }`}>
        <p>AdsHive Prospect © {new Date().getFullYear()} • Plataforma SaaS Premium Integrada com IA de Alta Performance • Todos os Direitos Reservados</p>
      </footer>

    </div>
  );
};
