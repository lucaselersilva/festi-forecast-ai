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
  customerIds: number[];
  tenantId: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  consumo: number;
  presencas: number;
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
    if (open) {
      console.log('🔍 Dialog opened with:', {
        clusterName,
        customerIdsCount: customerIds.length,
        tenantId,
        sampleIds: customerIds.slice(0, 3)
      });
      
      if (customerIds.length > 0) {
        loadCustomers();
      } else {
        console.warn('⚠️ No customer IDs provided to dialog');
        setCustomers([]);
      }
    }
  }, [open, customerIds]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching customers:', { customerIds: customerIds.slice(0, 5), tenantId });
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, consumo, presencas')
        .eq('tenant_id', tenantId)
        .in('id', customerIds);

      if (error) throw error;
      
      console.log('✅ Loaded customers:', data?.length || 0);
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
        'Nome': customer.name || '',
        'Email': customer.email || '',
        'Telefone': customer.phone || '',
        'Cluster': clusterName,
        'Consumo Total': customer.consumo ? `R$ ${customer.consumo.toFixed(2)}` : 'R$ 0,00',
        'Presenças': customer.presencas || 0,
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-sm">{customer.email || '-'}</TableCell>
                    <TableCell className="text-sm">{customer.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      {customer.consumo ? `R$ ${customer.consumo.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{customer.presencas || 0}</TableCell>
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
