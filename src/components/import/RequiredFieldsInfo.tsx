import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function RequiredFieldsInfo() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          📋 Campos da Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-sm">
            <strong className="text-red-600 dark:text-red-400">CAMPOS OBRIGATÓRIOS:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li><code className="font-mono text-xs bg-background px-1 py-0.5 rounded">Nome</code> - Nome completo do cliente</li>
              <li><code className="font-mono text-xs bg-background px-1 py-0.5 rounded">Email</code> OU <code className="font-mono text-xs bg-background px-1 py-0.5 rounded">Telefone</code> - Pelo menos um contato</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-sm">
            <strong className="text-green-600 dark:text-green-400">CAMPOS OPCIONAIS (Recomendados):</strong>
            <ul className="mt-2 space-y-1 ml-4 text-xs">
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">CPF</code> - Para evitar duplicatas</li>
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">Aniversário</code> - Data de nascimento (DD/MM/AAAA)</li>
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">Gênero</code> - Masculino/Feminino/Outro</li>
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">Consumo</code> - Valor total gasto (R$)</li>
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">Presenças</code> - Número de visitas</li>
              <li><code className="font-mono bg-background px-1 py-0.5 rounded">Última Visita</code> - Data da última visita</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 <strong>Dica:</strong> O sistema detecta automaticamente as colunas da sua planilha</p>
          <p>🔄 <strong>Formatos aceitos:</strong> CSV, XLSX, JSON</p>
          <p>✅ <strong>Validação:</strong> Todos os dados são validados antes da importação</p>
        </div>
      </CardContent>
    </Card>
  );
}
