import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, ArrowRight } from 'lucide-react'
import { ImportTargetSchema, suggestFieldMapping } from '@/lib/schemas/import-targets'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ColumnMapperProps {
  columns: string[]
  sampleData: any[]
  targetSchema: ImportTargetSchema
  sessionId: string
  onMappingComplete: (mappings: Record<string, string>) => void
  onBack: () => void
}

export function ColumnMapper({ columns, sampleData, targetSchema, sessionId, onMappingComplete, onBack }: ColumnMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    // Auto-suggest mappings
    const initial: Record<string, string> = {}
    columns.forEach(col => {
      const suggestion = suggestFieldMapping(col, targetSchema)
      if (suggestion) {
        initial[col] = suggestion
      }
    })
    return initial
  })

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings(prev => ({
      ...prev,
      [sourceColumn]: targetField
    }))
  }

  const getMappedFields = () => {
    return Object.values(mappings).filter(Boolean)
  }

  const getUnmappedRequiredFields = () => {
    const mappedFields = getMappedFields()
    return targetSchema.fields
      .filter(f => f.required && !mappedFields.includes(f.name))
  }

  const canProceed = () => {
    return getUnmappedRequiredFields().length === 0
  }

  const handleContinue = () => {
    onMappingComplete(mappings)
  }

  const usedTargetFields = new Set(Object.values(mappings).filter(Boolean))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapear Colunas</h2>
          <p className="text-muted-foreground">
            Conecte as colunas do seu arquivo aos campos de destino
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      {getUnmappedRequiredFields().length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Os seguintes campos obrigatórios ainda não foram mapeados:{' '}
            <strong>{getUnmappedRequiredFields().map(f => f.label).join(', ')}</strong>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Preview dos Dados (3 primeiras linhas)</CardTitle>
          <CardDescription>
            Verifique se os dados estão sendo lidos corretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.slice(0, 3).map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map(col => (
                      <TableCell key={col} className="max-w-[200px] truncate">
                        {String(row[col] || '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destino: {targetSchema.label}</CardTitle>
          <CardDescription>
            Selecione o campo de destino para cada coluna do arquivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {columns.map(sourceColumn => {
            const targetField = mappings[sourceColumn]
            const fieldDef = targetSchema.fields.find(f => f.name === targetField)
            
            return (
              <div key={sourceColumn} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">{sourceColumn}</Label>
                  {targetField && fieldDef && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {fieldDef.description}
                    </p>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground" />

                <div className="flex-1">
                  <Select
                    value={mappings[sourceColumn] || ''}
                    onValueChange={(value) => handleMappingChange(sourceColumn, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ignorar esta coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ignorar esta coluna</SelectItem>
                      {targetSchema.fields.map(field => {
                        const isUsed = usedTargetFields.has(field.name) && mappings[sourceColumn] !== field.name
                        return (
                          <SelectItem 
                            key={field.name} 
                            value={field.name}
                            disabled={isUsed}
                          >
                            <div className="flex items-center gap-2">
                              {field.label}
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                              {isUsed && (
                                <Badge variant="secondary" className="text-xs">
                                  Já mapeado
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {targetField && fieldDef && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="space-y-1">
          <p className="font-medium">
            {getMappedFields().length} de {targetSchema.fields.filter(f => f.required).length} campos obrigatórios mapeados
          </p>
          <p className="text-sm text-muted-foreground">
            {targetSchema.fields.filter(f => !f.required).length} campos opcionais disponíveis
          </p>
        </div>
        <Button 
          size="lg"
          onClick={handleContinue}
          disabled={!canProceed()}
        >
          Continuar para Validação
        </Button>
      </div>
    </div>
  )
}
