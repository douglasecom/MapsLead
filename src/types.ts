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
  plan: 'Starter' | 'Pro' | 'Agência';
  credits: number;
}
