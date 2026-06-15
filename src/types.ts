/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CRMTask {
  id: string;
  title: string;
  dueDate: string;
  status: 'pendente' | 'concluido';
  category: 'ligacao' | 'email' | 'proposta' | 'reuniao';
}

export interface Meeting {
  id: string;
  title: string;
  company: string;
  responsible: string;
  date: string;
  time: string;
  type: 'Presencial' | 'Telefone' | 'WhatsApp' | 'Google Meet';
  observations?: string;
  status: 'Agendado' | 'Confirmado' | 'Realizado' | 'Cancelado' | 'Reagendado';
  leadId?: string;
  meetLink?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  type: 'capture' | 'status_change' | 'note' | 'task' | 'proposal' | 'contract';
  title: string;
  description: string;
  createdAt: string;
}

export interface EnrichmentData {
  hasSSL: boolean;
  hasPixel: boolean;
  hasGoogleAds: boolean;
  hasFacebookLink: boolean;
  hasInstagramLink: boolean;
  hasContactForm: boolean;
  pagesCount: number;
  serverLocation: string;
  loadSpeedSeconds: number;
}

export interface Lead {
  id: string;
  name: string;
  niche: string;
  location: string;
  rating: number;
  reviews: number;
  hasWebsite: boolean;
  hasGmbActive: boolean;
  hasPhone: boolean;
  phone: string;
  leadScore: number;
  status: 'novo' | 'contatado' | 'interessado' | 'reuniao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';
  captured: boolean;
  capturedAt?: string;
  gmbAnalysis: string;
  avatarColor?: string;
  notes?: string[];
  timeline?: TimelineItem[];
  tasks?: CRMTask[];
  enrichment?: EnrichmentData;
  enrichedAt?: string;
  isEnriching?: boolean;
  email?: string;
  meetingTime?: string;
  meetingTitle?: string;
  meetLink?: string;
  isCorporatePriority?: boolean;
  corporateTag?: string;
  b2bRecommendation?: string;
}

export interface GeneratedMessage {
  leadId: string;
  leadName: string;
  channel: string;
  goal: string;
  tone: string;
  content: string;
  generatedAt: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Gestor' | 'SDR' | 'Closer' | 'Operador';
  avatarUrl: string;
  plan: string;
  credits: number;
  teamId?: string;
  subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'CANCELED';
  asaasCustomerId?: string;
  remainingCredits?: number;
  bonusCredits?: number;
  planCredits?: number;
  purchasedCredits?: number;
  accountStatus?: 'ACTIVE' | 'LIMITED';
  initialNiche?: string;
  initialLocation?: string;
}

export interface SaaSPlan {
  id: string; // 'starter' | 'pro' | 'agency' | 'enterprise'
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  maxReports: number;
  maxLeads: number;
  features: string[];
}

export interface SaaSSubscription {
  id: string;
  userId: string;
  teamId: string;
  status: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'CANCELED';
  planId: string;
  price: number;
  nextBillingDate: string;
  asaasSubscriptionId?: string;
}

export interface SaaSPayment {
  id: string;
  userId: string;
  teamId: string;
  date: string;
  amount: number;
  method: 'pix' | 'card' | 'boleto';
  status: 'RECEIVED' | 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'DELETED';
  link?: string;
}

export interface SaasTeam {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: string;
  }>;
  maxMembers: number;
}

export interface SaaSActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}
