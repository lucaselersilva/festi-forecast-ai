import { supabase } from "@/integrations/supabase/client";

export interface MarketingPlan {
  general_strategy: {
    overview: string;
    key_messages: string[];
    channels: string[];
    budget_allocation: { [key: string]: number };
  };
  phases: Array<{
    phase_number: number;
    phase_name: string;
    start_date: string;
    end_date: string;
    objective: string;
    actions: Array<{
      action: string;
      channel: string;
      message: string;
      timing: string;
      kpi: string;
    }>;
  }>;
  cluster_strategies?: Array<{
    cluster_name: string;
    cluster_size: number;
    personalized_messages: string[];
    recommended_channels: string[];
    emotional_triggers: string[];
    expected_conversion: number;
  }>;
}

export function calculateDaysUntil(eventDate: string): number {
  const event = new Date(eventDate);
  const today = new Date();
  const diffTime = event.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    return false;
  }
}

export function generatePlanText(plan: MarketingPlan, eventName: string): string {
  let text = `PLANO DE MARKETING - ${eventName}\n\n`;
  
  text += `=== ESTRATÉGIA GERAL ===\n\n`;
  text += `${plan.general_strategy.overview}\n\n`;
  
  text += `MENSAGENS-CHAVE:\n`;
  plan.general_strategy.key_messages.forEach((msg, i) => {
    text += `${i + 1}. ${msg}\n`;
  });
  
  text += `\nCANAIS: ${plan.general_strategy.channels.join(', ')}\n\n`;
  
  text += `\n=== FASES DO PLANO ===\n\n`;
  plan.phases.forEach(phase => {
    text += `FASE ${phase.phase_number}: ${phase.phase_name}\n`;
    text += `Período: ${formatEventDate(phase.start_date)} - ${formatEventDate(phase.end_date)}\n`;
    text += `Objetivo: ${phase.objective}\n\n`;
    
    text += `Ações:\n`;
    phase.actions.forEach((action, i) => {
      text += `${i + 1}. ${action.action}\n`;
      text += `   Canal: ${action.channel}\n`;
      text += `   Mensagem: ${action.message}\n`;
      text += `   Timing: ${action.timing}\n`;
      text += `   KPI: ${action.kpi}\n\n`;
    });
    text += `\n`;
  });
  
  if (plan.cluster_strategies && plan.cluster_strategies.length > 0) {
    text += `\n=== ESTRATÉGIAS POR CLUSTER ===\n\n`;
    plan.cluster_strategies.forEach(cluster => {
      text += `${cluster.cluster_name} (${cluster.cluster_size} clientes)\n`;
      text += `Taxa de conversão esperada: ${cluster.expected_conversion}%\n\n`;
      text += `Mensagens personalizadas:\n`;
      cluster.personalized_messages.forEach((msg, i) => {
        text += `${i + 1}. ${msg}\n`;
      });
      text += `\nCanais: ${cluster.recommended_channels.join(', ')}\n`;
      text += `Gatilhos: ${cluster.emotional_triggers.join(', ')}\n\n`;
    });
  }
  
  return text;
}

export async function searchCities(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  const { data, error } = await supabase
    .from('events')
    .select('city')
    .ilike('city', `%${query}%`)
    .limit(10);
  
  if (error || !data) return [];
  
  const uniqueCities = Array.from(new Set(data.map(e => e.city)));
  return uniqueCities;
}

export async function getGenres(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('genre')
    .not('genre', 'is', null);
  
  if (error || !data) {
    // Retornar gêneros padrão em caso de erro
    return ["Sertanejo", "Eletrônico", "Rock", "Pop", "Funk", "Hip Hop", "MPB", "Jazz", "Forró", "Pagode", "Reggae", "Gospel", "Samba", "Axé", "Outro"];
  }
  
  // Gêneros da base de dados
  const dbGenres = Array.from(new Set(data.map(e => e.genre).filter(Boolean)));
  
  // Gêneros padrão brasileiros
  const defaultGenres = ["Sertanejo", "Eletrônico", "Rock", "Pop", "Funk", "Hip Hop", "MPB", "Jazz", "Forró", "Pagode", "Reggae", "Gospel", "Samba", "Axé", "Outro"];
  
  // Combinar e remover duplicados
  const allGenres = Array.from(new Set([...dbGenres, ...defaultGenres]));
  
  return allGenres.sort();
}

export interface SearchParams {
  type: 'name' | 'city' | 'status' | 'all';
  value: string;
}

export function parseSearchCommand(input: string): SearchParams {
  const lower = input.toLowerCase();
  
  if (lower.includes('evento') || lower.includes('plano do')) {
    const match = input.match(/evento\s+(.+)|plano do\s+(.+)/i);
    if (match) {
      return { type: 'name', value: match[1] || match[2] };
    }
  }
  
  if (lower.includes('cidade') || lower.includes('em ')) {
    const match = input.match(/cidade\s+(.+)|em\s+(.+)/i);
    if (match) {
      return { type: 'city', value: match[1] || match[2] };
    }
  }
  
  if (lower.includes('ativo') || lower.includes('concluído') || lower.includes('rascunho')) {
    if (lower.includes('ativo')) return { type: 'status', value: 'active' };
    if (lower.includes('concluído')) return { type: 'status', value: 'completed' };
    if (lower.includes('rascunho')) return { type: 'status', value: 'draft' };
  }
  
  return { type: 'all', value: input };
}
