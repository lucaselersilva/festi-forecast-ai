import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, XCircle, Loader2, UserPlus, RefreshCw, ChevronRight } from 'lucide-react'
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
  warningDetails?: Array<{
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
  const [importProgress, setImportProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<{
    inserted: number
    updated: number
    skipped: number
    total: number
  } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
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

  const groupMessagesByType = (messages: Array<{ row: number; field: string; message: string }>) => {
    const groups = new Map<string, { count: number; rows: number[] }>()
    
    messages.forEach(msg => {
      const key = `${msg.field}: ${msg.message}`
      if (!groups.has(key)) {
        groups.set(key, { count: 0, rows: [] })
      }
      const group = groups.get(key)!
      group.count++
      group.rows.push(msg.row)
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
      // Start the import job
      const { data: startData, error: startError } = await supabase.functions.invoke('flexible-import', {
        body: {
          action: 'import',
          sessionId,
          mappings,
          targetTable
        }
      })

      if (startError) throw startError

      toast({
        title: 'Importação iniciada',
        description: 'Processando dados em segundo plano...'
      })

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('flexible-import', {
            body: {
              action: 'status',
              sessionId
            }
          })

          if (statusError) {
            clearInterval(pollInterval)
            throw statusError
          }

          console.log('Job status:', statusData)

          // Update progress
          setImportProgress(statusData.job_progress || 0)

          if (statusData.job_status === 'completed') {
            clearInterval(pollInterval)
            setIsImporting(false)
            setImportProgress(100)
            
            setImportResult({
              inserted: statusData.job_result?.inserted || 0,
              updated: statusData.job_result?.updated || 0,
              skipped: statusData.job_result?.skipped || 0,
              total: statusData.job_result?.total || 0
            })

            toast({
              title: 'Importação concluída',
              description: `${statusData.job_result?.inserted || 0} novos, ${statusData.job_result?.updated || 0} atualizados`
            })
          } else if (statusData.job_status === 'failed') {
            clearInterval(pollInterval)
            setIsImporting(false)
            
            toast({
              title: 'Erro na importação',
              description: statusData.job_error || 'Erro desconhecido',
              variant: 'destructive'
            })
          }
        } catch (pollError) {
          console.error('Status poll error:', pollError)
          clearInterval(pollInterval)
          setIsImporting(false)
          
          toast({
            title: 'Erro ao verificar status',
            description: 'Não foi possível verificar o progresso da importação.',
            variant: 'destructive'
          })
        }
      }, 3000) // Poll every 3 seconds

    } catch (error) {
      console.error('Import error:', error)
      setIsImporting(false)
      toast({
        title: 'Erro ao iniciar importação',
        description: 'Não foi possível iniciar a importação. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  if (importResult) {
    const successRate = importResult.total > 0 
      ? ((importResult.inserted + importResult.updated) / importResult.total * 100).toFixed(1)
      : '0'

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Importação Concluída
            </CardTitle>
            <CardDescription>
              Processo finalizado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-3xl font-bold text-green-700">{importResult.inserted}</p>
                      <p className="text-sm text-green-600">Novos Clientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-3xl font-bold text-blue-700">{importResult.updated}</p>
                      <p className="text-sm text-blue-600">Atualizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-gray-600" />
                    <div>
                      <p className="text-3xl font-bold text-gray-700">{importResult.skipped}</p>
                      <p className="text-sm text-gray-600">Ignorados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
              <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </Button>

            {showDetails && (
              <Card className="bg-muted">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Processado:</span>
                    <span className="font-semibold">{importResult.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Sucesso:</span>
                    <span className="font-semibold text-green-600">{successRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tabela:</span>
                    <span className="font-mono text-xs">{targetTable}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={onComplete} className="w-full" size="lg">
              Concluir
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

  if (isImporting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Importando dados...</h3>
          <p className="text-muted-foreground">Processando em segundo plano</p>
        </div>
        <div className="w-full max-w-md space-y-2">
          <Progress value={importProgress} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">{importProgress}% concluído</p>
        </div>
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

          {validationResult.warnings > 0 && validationResult.warningDetails && (
            <div className="space-y-2">
              <h4 className="font-semibold">Avisos (Agrupados)</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {groupMessagesByType(validationResult.warningDetails).map((warningGroup, idx) => (
                  <Alert key={idx} className="border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          {warningGroup.count} linhas com aviso de {warningGroup.type}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {validationResult.errorDetails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Erros (Agrupados)</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {groupMessagesByType(validationResult.errorDetails).map((errorGroup, idx) => (
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
