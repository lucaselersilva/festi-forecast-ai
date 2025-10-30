import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileSpreadsheet, 
  Download,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  ShoppingCart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { dataService, ImportResult } from "@/lib/dataService"
import { RequiredFieldsInfo } from "@/components/import/RequiredFieldsInfo"
import { useTenant } from "@/hooks/useTenant"

type ImportStatus = 'idle' | 'processing' | 'success' | 'error'

const Import = () => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const { toast } = useToast()
  const { tenantId } = useTenant()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      await generatePreview(file)
    }
  }

  const generatePreview = async (file: File) => {
    try {
      const content = await file.text()
      const events = await dataService.loadEventsFromCSV(content)
      setPreviewData(events.slice(0, 5)) // Show first 5 rows for preview
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: "Preview Error",
        description: "Could not generate preview. Please check file format.",
        variant: "destructive"
      })
    }
  }

  const performImport = async () => {
    if (!selectedFile) return
    
    setImportStatus('processing')
    setImportResult(null)
    
    try {
      const content = await selectedFile.text()
      const events = await dataService.loadEventsFromCSV(content)
      const result = await dataService.importEvents(events, tenantId!)
      
      setImportResult(result)
      
      if (result.success) {
        setImportStatus('success')
        toast({
          title: "Import Successful",
          description: `${result.inserted} new events imported, ${result.updated} events updated.`,
        })
      } else {
        setImportStatus('error')
        toast({
          title: "Import Completed with Errors",
          description: `${result.errors.length} errors occurred. Check details below.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setImportStatus('error')
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive"
      })
    }
  }

  const importTypes = [
    {
      id: 'events',
      title: 'Events',
      icon: Calendar,
      description: 'Import event data with sales and marketing metrics',
      template: 'events_template.csv',
      fields: ['event_id', 'date', 'city', 'venue', 'artist', 'genre', 'ticket_price', 'marketing_spend', 'capacity', 'sold_tickets', 'revenue']
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      description: 'Import customer data with demographics and preferences',
      template: 'customers_template.csv',
      fields: ['email', 'name', 'birthDate', 'gender', 'city', 'phone']
    },
    {
      id: 'consumption',
      title: 'Consumption',
      icon: ShoppingCart,
      description: 'Import bar and concession consumption data',
      template: 'consumption_template.csv',
      fields: ['eventId', 'customerId', 'item', 'quantity', 'totalValue', 'timestamp']
    }
  ]

  const FileUploadZone = () => (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <div className="space-y-2">
        <p className="text-lg font-medium">
          Drop your CSV/JSON files here
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse your computer
        </p>
      </div>
      <Input
        type="file"
        className="hidden"
        accept=".csv,.json,.xlsx"
        onChange={handleFileChange}
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button variant="outline" className="mt-4" asChild>
          <span className="cursor-pointer">Browse Files</span>
        </Button>
      </label>
    </div>
  )

  const ImportPreview = () => (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {importStatus === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
          {importStatus === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
          {importStatus === 'processing' && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          Import Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {importStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
            </div>

            {importStatus === 'idle' && previewData.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Data Preview:</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1">Event ID</th>
                        <th className="text-left p-1">Date</th>
                        <th className="text-left p-1">City</th>
                        <th className="text-left p-1">Artist</th>
                        <th className="text-left p-1">Genre</th>
                        <th className="text-left p-1">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-1">{row.event_id}</td>
                          <td className="p-1">{row.date}</td>
                          <td className="p-1">{row.city}</td>
                          <td className="p-1">{row.artist}</td>
                          <td className="p-1">{row.genre}</td>
                          <td className="p-1">R$ {row.ticket_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  onClick={performImport}
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  disabled={importStatus !== 'idle'}
                >
                  Import Data
                </Button>
              </div>
            )}

            {importStatus === 'idle' && previewData.length === 0 && selectedFile && (
              <div className="text-center py-4 text-muted-foreground">
                Processing file preview...
              </div>
            )}

            {importStatus === 'success' && importResult && (
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-medium text-success">Import Completed Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.inserted} new records imported, {importResult.updated} records updated
                </p>
              </div>
            )}

            {importStatus === 'error' && importResult && (
              <div className="space-y-3">
                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium text-destructive">Import Completed with Errors</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {importResult.errors.length} errors found
                  </p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-muted/20 p-2 rounded text-xs">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-destructive mb-1">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select a file to see the preview
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Data Import</h1>
        <p className="text-muted-foreground mt-1">
          Import your customer, ticket, and consumption data
        </p>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {importTypes.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {type.title}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {importTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <type.icon className="w-5 h-5" />
                      Import {type.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FileUploadZone />
                  </CardContent>
                </Card>

                <ImportPreview />
              </div>

              <div className="space-y-6">
                <RequiredFieldsInfo />
                
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle>Template & Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Required Fields:</h4>
                      <div className="space-y-1">
                        {type.fields.map((field) => (
                          <div key={field} className="text-sm font-mono bg-accent/20 px-2 py-1 rounded">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = `/templates/${type.template}`
                        link.download = type.template
                        link.click()
                      }}
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Supported formats: CSV, JSON, XLSX</p>
                      <p>• Maximum file size: 50MB</p>
                      <p>• Date format: YYYY-MM-DD</p>
                      <p>• Encoding: UTF-8</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle>Recent Imports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>customers_dec.csv</span>
                        <span className="ml-auto text-muted-foreground">2h ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>tickets_nov.xlsx</span>
                        <span className="ml-auto text-muted-foreground">1d ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span>consumption.json</span>
                        <span className="ml-auto text-muted-foreground">2d ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default Import