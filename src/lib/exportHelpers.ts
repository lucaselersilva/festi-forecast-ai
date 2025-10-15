import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

export async function downloadClusterCustomers(clusterName: string) {
  try {
    const { data, error } = await supabase
      .from('vw_valle_rfm')
      .select('nome, email, telefone, cluster_comportamental, propensity_score, consumo, presencas')
      .eq('cluster_comportamental', clusterName);

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('Nenhum cliente encontrado para este cluster');
    }

    // Formatar dados para o Excel
    const formattedData = data.map(customer => ({
      'Nome': customer.nome || '',
      'Email': customer.email || '',
      'Telefone': customer.telefone || '',
      'Cluster': customer.cluster_comportamental || '',
      'Score de Propensão': customer.propensity_score ? (customer.propensity_score * 100).toFixed(1) + '%' : '',
      'Consumo Total': customer.consumo ? `R$ ${customer.consumo.toFixed(2)}` : '',
      'Presenças': customer.presencas || 0
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 35 }, // Email
      { wch: 15 }, // Telefone
      { wch: 25 }, // Cluster
      { wch: 18 }, // Score
      { wch: 15 }, // Consumo
      { wch: 10 }  // Presenças
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Download do arquivo
    const fileName = `clientes_${clusterName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return { success: true, count: data.length };
  } catch (error) {
    console.error('Error downloading customers:', error);
    throw error;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
