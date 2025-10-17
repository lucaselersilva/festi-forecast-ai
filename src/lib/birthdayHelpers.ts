import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export interface BirthdayCustomer {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  aniversario: string;
  idade: number | null;
  consumo: number;
  presencas: number;
  recency_days: number;
  ultima_visita: string | null;
  primeira_entrada: string | null;
  cluster_comportamental: string;
  cluster_valor: string | null;
  faixa_etaria: string | null;
  propensity_score: number;
  genero: string | null;
}

export interface BirthdayMetrics {
  totalCelebrantes: number;
  consumoMedio: number;
  recenciaMedia: number;
  taxaPresencaMedia: number;
}

export interface BirthdayFilters {
  month: number;
  year: number;
  clusters?: string[];
  ageRanges?: string[];
}

export async function getMonthBirthdays(filters: BirthdayFilters): Promise<BirthdayCustomer[]> {
  let query = supabase
    .from('vw_valle_rfm')
    .select('*')
    .not('aniversario', 'is', null);

  // Filtro de mês
  query = query.gte('aniversario', `${filters.year}-${String(filters.month).padStart(2, '0')}-01`);
  query = query.lt('aniversario', `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-01`);

  // Filtro de clusters
  if (filters.clusters && filters.clusters.length > 0) {
    query = query.in('cluster_comportamental', filters.clusters);
  }

  // Filtro de faixa etária
  if (filters.ageRanges && filters.ageRanges.length > 0) {
    query = query.in('faixa_etaria', filters.ageRanges);
  }

  const { data, error } = await query.order('aniversario', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar aniversariantes: ${error.message}`);
  }

  return (data || []) as BirthdayCustomer[];
}

export function calculateBirthdayMetrics(customers: BirthdayCustomer[]): BirthdayMetrics {
  if (customers.length === 0) {
    return {
      totalCelebrantes: 0,
      consumoMedio: 0,
      recenciaMedia: 0,
      taxaPresencaMedia: 0,
    };
  }

  const totalConsumo = customers.reduce((sum, c) => sum + (c.consumo || 0), 0);
  const totalRecencia = customers.reduce((sum, c) => sum + (c.recency_days || 0), 0);
  const totalPresencas = customers.reduce((sum, c) => sum + (c.presencas || 0), 0);

  return {
    totalCelebrantes: customers.length,
    consumoMedio: totalConsumo / customers.length,
    recenciaMedia: totalRecencia / customers.length,
    taxaPresencaMedia: totalPresencas / customers.length,
  };
}

export async function exportBirthdayList(customers: BirthdayCustomer[], month: number, year: number) {
  const exportData = customers.map(customer => ({
    Nome: customer.nome,
    Email: customer.email || '',
    Telefone: customer.telefone || '',
    Aniversário: customer.aniversario ? new Date(customer.aniversario).toLocaleDateString('pt-BR') : '',
    Idade: customer.idade || '',
    Consumo: `R$ ${customer.consumo?.toFixed(2) || '0.00'}`,
    Presencas: customer.presencas,
    'Última Visita': customer.ultima_visita ? new Date(customer.ultima_visita).toLocaleDateString('pt-BR') : 'Nunca',
    'Dias desde última visita': customer.recency_days,
    Cluster: customer.cluster_comportamental,
    'Propensity Score': customer.propensity_score?.toFixed(2) || '0.00',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aniversariantes');

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fileName = `aniversariantes_${monthNames[month - 1]}_${year}.xlsx`;

  XLSX.writeFile(wb, fileName);

  return { count: customers.length, fileName };
}

export function formatBirthdayDate(dateString: string | null): string {
  if (!dateString) return 'Não informado';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

export function getRecencyBadgeColor(days: number): string {
  if (days <= 30) return 'bg-green-500/10 text-green-700 dark:text-green-400';
  if (days <= 90) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  return 'bg-red-500/10 text-red-700 dark:text-red-400';
}

export function getRecencyLabel(days: number): string {
  if (days <= 30) return 'Ativo';
  if (days <= 90) return 'Morno';
  return 'Frio';
}

export async function copyContactToClipboard(customer: BirthdayCustomer): Promise<void> {
  const contact = customer.telefone || customer.email || '';
  
  if (!contact) {
    throw new Error('Cliente sem contato disponível');
  }

  await navigator.clipboard.writeText(contact);
}