import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ImportValidationProps {
  sessionId: string
  mappings: Record<string, string>
  targetTable: string
  onBack: () => void
  onComplete: () => void
}

interface ValidationResult {
  valid: number
  warnings: number
  errors: number
  errorDetails: Array<{
    row: number
    field: string
    message: string
  }>
}

export function ImportValidation({ 
  sessionId, 
  mappings, 
  targetTable,
  onBack, 
  onComplete 
}: ImportValidationProps) {
  const [isValidating, setIsValidating] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    validateData()
  }, [])

  const validateData = async () => {
    setIsValidating(true)
    try {
      const { data, error } = await supabase.functions.invoke('flexible-import', {
        body: {
          action: 'validate',
          sessionId,
          mappings,
          targetTable
        }
      })

      if (error) throw error

      setValidationResult(data)
    } catch (error) {
      console.error('Validation error:', error)
      toast({
        title: 'Erro na validação',
        description: 'Não foi possível validar os dados. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const groupErrorsByType = (errors: Array<{ row: number; field: string; message: string }>) => {
    const groups = new Map<string, { count: number; rows: number[] }>()
    
    errors.forEach(error => {
      const key = `${error.field}: ${error.message}`
      if (!groups.has(key)) {
        groups.set(key, { count: 0, rows: [] })
      }
      const group = groups.get(key)!
      group.count++
      group.rows.push(error.row)
    })
    
    return Array.from(groups.entries()).map(([key, value]) => ({
      type: key,
      count: value.count,
      rows: value.rows.slice(0, 5) // Apenas primeiras 5 linhas
    }))
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('flexible-import', {
        body: {
          action: 'import',
          sessionId,
          mappings,
          targetTable
        }
      })

      if (error) throw error

      toast({
        title: 'Importação concluída!',
        description: `${data.imported} registros importados com sucesso.`
      })

      onComplete()
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os dados. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h3 className="text-xl font-semibold">Validando dados...</h3>
        <p className="text-muted-foreground">Verificando formatos e campos obrigatórios</p>
      </div>
    )
  }

  if (!validationResult) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar resultados da validação.
        </AlertDescription>
      </Alert>
    )
  }

  const totalRows = validationResult.valid + validationResult.errors
  const validPercentage = (validationResult.valid / totalRows) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validação de Dados</h2>
          <p className="text-muted-foreground">
            Revise os resultados antes de confirmar a importação
          </p>
        </div>
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Validação</CardTitle>
          <CardDescription>
            {totalRows} linhas analisadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Taxa de sucesso</span>
              <span className="font-medium">{validPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={validPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validationResult.valid}</p>
                <p className="text-sm text-muted-foreground">Válidas</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{validationResult.warnings}</p>
                <p className="text-sm text-muted-foreground">Avisos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{validationResult.errors}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>

          {validationResult.errorDetails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Detalhes dos Erros (Agrupados)</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {groupErrorsByType(validationResult.errorDetails).map((errorGroup, idx) => (
                  <Alert key={idx} variant="destructive">
                    <AlertDescription className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{errorGroup.type}</span>
                        <Badge variant="destructive">{errorGroup.count} ocorrências</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Linhas: {errorGroup.rows.join(', ')}
                        {errorGroup.count > 5 && ` ... e mais ${errorGroup.count - 5}`}
                      </p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="space-y-1">
          <p className="font-medium">
            {validationResult.errors > 0 
              ? 'Importar apenas linhas válidas?' 
              : 'Pronto para importar!'}
          </p>
          <p className="text-sm text-muted-foreground">
            {validationResult.valid} registros serão importados
          </p>
        </div>
        <Button 
          size="lg"
          onClick={handleImport}
          disabled={isImporting || validationResult.valid === 0}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            'Confirmar Importação'
          )}
        </Button>
      </div>
    </div>
  )
}
