import { useState } from "react"
import { Upload, CheckCircle, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ColumnMapper } from "@/components/import/ColumnMapper"
import { ImportValidation } from "@/components/import/ImportValidation"
import { dataService, RawFileData } from "@/lib/dataService"
import { useToast } from "@/hooks/use-toast"
import { useTenant } from "@/hooks/useTenant"
import { getSchemaByName } from "@/lib/schemas/import-targets"

type ImportStep = 'upload' | 'mapping' | 'validation' | 'complete'

export default function Import() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<RawFileData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const { toast } = useToast()
  const { tenantId } = useTenant()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setSelectedFile(file)
      const parsed = await dataService.parseFileRaw(file)
      setRawData(parsed)
      
      toast({
        title: "Arquivo carregado",
        description: `${parsed.totalRows} linhas detectadas`
      })
    } catch (error) {
      console.error('Error parsing file:', error)
      toast({
        title: "Erro",
        description: "Não foi possível ler o arquivo",
        variant: "destructive",
      })
    }
  }

  const handleContinueToMapping = async () => {
    if (!selectedFile || !tenantId || !rawData) return

    try {
      const id = await dataService.uploadToStaging({
        file: selectedFile,
        tenantId,
        sourceName: 'valle_clientes' as any
      })
      
      setSessionId(id)
      setCurrentStep('mapping')
    } catch (error) {
      console.error('Error uploading to staging:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados",
        variant: "destructive",
      })
    }
  }

  const handleMappingComplete = (newMappings: Record<string, string>) => {
    setMappings(newMappings)
    setCurrentStep('validation')
  }

  const handleValidationComplete = () => {
    setCurrentStep('complete')
    toast({
      title: "Importação concluída!",
      description: "Os dados foram importados com sucesso"
    })
  }

  const handleReset = () => {
    setSelectedFile(null)
    setRawData(null)
    setSessionId(null)
    setMappings({})
    setCurrentStep('upload')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const importType = {
    id: "valle_clientes",
    title: "Importação de Clientes",
    icon: Users,
    description: "Importar dados de clientes",
    schema: getSchemaByName('valle_clientes')!
  }

  const currentImportType = importType

  // File upload zone component
  const FileUploadZone = ({ 
    isDragging, 
    onDragOver, 
    onDragLeave, 
    onDrop, 
    onChange 
  }: {
    isDragging: boolean
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }) => (
    <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="text-center space-y-4"
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drop your CSV/Excel files here
            </p>
            <p className="text-sm text-muted-foreground">
              Supports .csv, .xlsx, and .xls formats
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse your computer
            </p>
          </div>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onChange}
            className="max-w-xs mx-auto cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  )

  if (currentStep === 'mapping' && rawData && sessionId) {
    return (
      <div className="container mx-auto py-8">
        <ColumnMapper
          columns={rawData.columns}
          sampleData={rawData.sampleData}
          targetSchema={importType.schema}
          sessionId={sessionId}
          onMappingComplete={handleMappingComplete}
          onBack={() => setCurrentStep('upload')}
        />
      </div>
    )
  }

  if (currentStep === 'validation' && sessionId) {
    return (
      <div className="container mx-auto py-8">
        <ImportValidation
          sessionId={sessionId}
          mappings={mappings}
          targetTable={importType.schema.tableName}
          onBack={() => setCurrentStep('mapping')}
          onComplete={handleValidationComplete}
        />
      </div>
    )
  }

  if (currentStep === 'complete') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div>
                <CardTitle>Importação Concluída!</CardTitle>
                <CardDescription>Os dados foram importados com sucesso</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReset}>Nova Importação</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-10 w-10 text-primary" />
          {importType.title}
        </h1>
        <p className="text-muted-foreground">
          {importType.description} a partir de arquivos CSV ou Excel
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FileUploadZone
            isDragging={isDragging}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onChange={handleFileChange}
          />
          
          {rawData && selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Preview dos Dados</CardTitle>
                <CardDescription>
                  {selectedFile.name} - {rawData.totalRows} linhas detectadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {rawData.columns.map(col => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.sampleData.map((row, idx) => (
                        <TableRow key={idx}>
                          {rawData.columns.map(col => (
                            <TableCell key={col} className="max-w-[200px] truncate">
                              {String(row[col] || '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {rawData.sampleData.length < rawData.totalRows && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Mostrando {rawData.sampleData.length} de {rawData.totalRows} linhas
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleContinueToMapping} className="w-full">
                  Continuar para Mapeamento
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Importação</CardTitle>
              <CardDescription>{importType.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">Campos obrigatórios:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importType.schema.fields
                    .filter(f => f.required)
                    .map(f => (
                      <li key={f.name}>{f.label}</li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
