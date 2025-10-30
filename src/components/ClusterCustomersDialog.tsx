import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ClusterCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterName: string;
  customerIds: string[];
  tenantId: string;
}

interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  consumo: number;
  presencas: number;
  recency_days: number;
  frequency: number;
  monetary: number;
}

export function ClusterCustomersDialog({ 
  open, 
  onOpenChange, 
  clusterName, 
  customerIds,
  tenantId 
}: ClusterCustomersDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && customerIds.length > 0) {
      loadCustomers();
    }
  }, [open, customerIds]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_valle_rfm')
        .select('id, nome, email, telefone, consumo, presencas, recency_days, frequency, monetary')
        .eq('tenant_id', tenantId)
        .in('id', customerIds);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const formattedData = customers.map(customer => ({
        'Nome': customer.nome || '',
        'Email': customer.email || '',
        'Telefone': customer.telefone || '',
        'Cluster': clusterName,
        'Consumo Total': customer.consumo ? `R$ ${customer.consumo.toFixed(2)}` : 'R$ 0,00',
        'Presenças': customer.presencas || 0,
        'Recência (dias)': customer.recency_days?.toFixed(0) || '0',
        'Frequência': customer.frequency || 0,
        'Valor Monetário': customer.monetary ? `R$ ${customer.monetary.toFixed(2)}` : 'R$ 0,00',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 35 }, // Email
        { wch: 15 }, // Telefone
        { wch: 25 }, // Cluster
        { wch: 15 }, // Consumo
        { wch: 10 }, // Presenças
        { wch: 15 }, // Recência
        { wch: 12 }, // Frequência
        { wch: 15 }  // Valor Monetário
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

      const fileName = `cluster_${clusterName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportação concluída!",
        description: `${customers.length} clientes exportados`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{clusterName}</DialogTitle>
          <DialogDescription>
            {customers.length} clientes neste cluster
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={handleExportCSV} disabled={loading || customers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-right">Presenças</TableHead>
                  <TableHead className="text-right">Recência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.nome}</TableCell>
                    <TableCell className="text-sm">{customer.email || '-'}</TableCell>
                    <TableCell className="text-sm">{customer.telefone || '-'}</TableCell>
                    <TableCell className="text-right">
                      {customer.consumo ? `R$ ${customer.consumo.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{customer.presencas || 0}</TableCell>
                    <TableCell className="text-right">
                      {customer.recency_days ? `${customer.recency_days.toFixed(0)} dias` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
