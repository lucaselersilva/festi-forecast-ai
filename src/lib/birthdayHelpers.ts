import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export interface BirthdayCustomer {
  customer_id: string;
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
  aplicativo_ativo: boolean;
  frequency: number;
  monetary: number;
}

export interface BirthdayMetrics {
  totalCelebrantes: number;
  consumoMedio: number;
  recenciaMedia: number;
  taxaPresencaMedia: number;
}

export interface BirthdayFilters {
  month: number;
  clusters?: string[];
  ageRanges?: string[];
  weeks?: number[];
  presencasRanges?: string[];
}

export async function getMonthBirthdays(filters: BirthdayFilters): Promise<BirthdayCustomer[]> {
  const { data, error } = await supabase.rpc('get_birthday_customers' as any, {
    target_month: filters.month,
    cluster_filter: filters.clusters && filters.clusters.length > 0 ? filters.clusters : null,
    age_range_filter: filters.ageRanges && filters.ageRanges.length > 0 ? filters.ageRanges : null,
  } as any);

  if (error) {
    throw new Error(`Erro ao buscar aniversariantes: ${error.message}`);
  }

  return (data || []).map((c: any) => ({
    ...c,
    customer_id: c.id || c.customer_id
  })) as BirthdayCustomer[];
}

export async function getBirthdayCustomers(month: number, clusters?: string[], ageRanges?: string[]): Promise<BirthdayCustomer[]> {
  const { data, error } = await supabase.rpc('get_birthday_customers_unified' as any, {
    target_month: month,
    cluster_filter: clusters && clusters.length > 0 ? clusters : null,
    age_range_filter: ageRanges && ageRanges.length > 0 ? ageRanges : null,
  } as any);

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

export async function exportBirthdayList(customers: BirthdayCustomer[], month: number) {
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
  const fileName = `aniversariantes_${monthNames[month - 1]}_${new Date().getFullYear()}.xlsx`;

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

export async function generateClusterActions(month: number, year: number) {
  const { data, error } = await supabase.functions.invoke('birthday-cluster-actions', {
    body: { month, year }
  });

  if (error) {
    throw new Error(`Erro ao gerar ações: ${error.message}`);
  }

  return data;
}

export async function getClusterActions(month: number, year: number) {
  const { data, error } = await supabase
    .from('birthday_cluster_actions')
    .select('*')
    .eq('month', month)
    .eq('year', year);

  if (error) {
    throw new Error(`Erro ao buscar ações: ${error.message}`);
  }

  return data || [];
}

export function exportClusterPlan(cluster: any, customers: BirthdayCustomer[], month?: number) {

  const exportData = [
    { Section: 'PLANO DE ANIVERSARIANTES', Value: '' },
    { Section: 'Cluster', Value: cluster.name },
    { Section: 'Tamanho', Value: cluster.size },
    { Section: 'Consumo Médio', Value: `R$ ${cluster.avgSpending?.toFixed(2) || '0.00'}` },
    { Section: 'Recência Média', Value: `${cluster.avgRecency?.toFixed(0) || '0'} dias` },
    { Section: '', Value: '' },
    { Section: 'VISÃO GERAL', Value: cluster.overview || '' },
    { Section: '', Value: '' },
    { Section: 'AÇÕES RECOMENDADAS', Value: '' },
  ];

  if (cluster.actions) {
    cluster.actions.forEach((action: any, i: number) => {
      exportData.push(
        { Section: `Ação ${i + 1}`, Value: action.title },
        { Section: 'Canal', Value: action.channel },
        { Section: 'Timing', Value: action.timing },
        { Section: 'Descrição', Value: action.description },
        { Section: 'Mensagem', Value: action.message_template },
        { Section: 'Oferta', Value: action.offer || '' },
        { Section: 'Conversão Esperada', Value: `${action.expected_conversion}%` },
        { Section: '', Value: '' }
      );
    });
  }

  exportData.push(
    { Section: 'LISTA DE CLIENTES', Value: '' },
    { Section: '', Value: '' }
  );

  const customerData = customers.map(c => ({
    Nome: c.nome,
    Email: c.email || '',
    Telefone: c.telefone || '',
    Aniversário: c.aniversario ? new Date(c.aniversario).toLocaleDateString('pt-BR') : '',
    Idade: c.idade || '',
    Consumo: `R$ ${c.consumo?.toFixed(2) || '0.00'}`,
  }));

  const ws1 = XLSX.utils.json_to_sheet(exportData);
  const ws2 = XLSX.utils.json_to_sheet(customerData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Plano');
  XLSX.utils.book_append_sheet(wb, ws2, 'Clientes');

  const fileName = `plano_${cluster.name.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}