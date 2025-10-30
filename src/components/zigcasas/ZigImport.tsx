import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/hooks/useTenant";

interface ZigImportProps {
  onImportComplete?: () => void;
}

export function ZigImport({ onImportComplete }: ZigImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  const parseExcelDate = (excelDate: any): string | null => {
    if (!excelDate) return null;
    
    try {
      // Se já for uma data do JavaScript
      if (excelDate instanceof Date) {
        return excelDate.toISOString();
      }
      
      // Se for um número (serial date do Excel)
      if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      
      // Se for string no formato DD/MM/YYYY HH:MM:SS
      const excelDateStr = excelDate.toString().trim();
      const parts = excelDateStr.split(' ');
      if (parts.length === 0) return null;
      
      const dateParts = parts[0].split('/');
      if (dateParts.length !== 3) return null;
      
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      const timePart = parts[1] || '00:00:00';
      
      // Validar intervalos
      if (year < 1900 || year > 2100) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${timePart}`;
      const testDate = new Date(dateStr);
      
      // Verificar se a data é válida
      if (isNaN(testDate.getTime())) return null;
      
      return dateStr;
    } catch (error) {
      console.error('Erro ao parsear data:', excelDate, error);
      return null;
    }
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo Excel",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const totalRows = jsonData.length;
      let processed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        
        const clientsData = batch.map((row: any) => ({
          nome: row['Nome'] || '',
          cpf: row['CPF']?.toString().replace(/\D/g, '') || null,
          email: row['E-mail'] || null,
          genero: row['Gênero'] || null,
          telefone: row['Telefone'] || null,
          aniversario: row['Aniversário'] ? parseExcelDate(row['Aniversário'].toString().split(' ')[0] + ' 00:00:00') : null,
          aplicativo_ativo: row['Aplicativo ativo'] === 'Sim',
          presencas: parseInt(row['Presenças']) || 0,
          primeira_entrada: parseExcelDate(row['Primeira entrada no local']),
          ultima_visita: parseExcelDate(row['Última visita']),
          consumo: parseCurrency(row['Consumo']),
          id_evento: row['ID do evento'] || null,
          primeira_interacao: parseExcelDate(row['Primeira interação']),
          primeira_utilizacao: row['É a primeira utilização?'] === 'true' || row['É a primeira utilização?'] === true,
          tenant_id: tenantId,
        }));

        const { data: result, error } = await supabase.functions.invoke('valle-smart-upsert', {
          body: { clients: clientsData }
        });

        if (error) throw error;

        totalInserted += result.inserted || 0;
        totalUpdated += result.updated || 0;
        totalSkipped += result.skipped || 0;

        processed += batch.length;
        setProgress((processed / totalRows) * 100);
      }

      toast({
        title: "Importação concluída!",
        description: `${totalInserted} novos, ${totalUpdated} atualizados, ${totalSkipped} ignorados.`,
      });

      onImportComplete?.();
      setFile(null);
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Clientes Valle
        </CardTitle>
        <CardDescription>
          Faça upload da planilha Excel com os dados dos clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A planilha deve conter as colunas: Nome, CPF, E-mail, Gênero, Telefone, 
            Aniversário, Aplicativo ativo, Presenças, Primeira entrada no local, 
            Última visita, Consumo, ID do evento, Primeira interação, É a primeira utilização?
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Arquivo selecionado: {file.name}
              </p>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importando... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importando...' : 'Importar Dados'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
