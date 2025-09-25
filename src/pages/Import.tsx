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

type ImportStatus = 'idle' | 'processing' | 'success' | 'error'

const Import = () => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const { toast } = useToast()

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const simulateImport = async () => {
    if (!selectedFile) return
    
    setImportStatus('processing')
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const success = Math.random() > 0.3 // 70% success rate
    
    if (success) {
      setImportStatus('success')
      toast({
        title: "Import Successful",
        description: `${selectedFile.name} imported successfully with ${Math.floor(Math.random() * 500) + 100} records processed.`,
      })
    } else {
      setImportStatus('error')
      toast({
        title: "Import Error",
        description: "Some validation errors occurred. Check the preview for details.",
        variant: "destructive"
      })
    }
  }

  const importTypes = [
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      description: 'Import customer data with demographics and preferences',
      template: 'customers_template.csv',
      fields: ['email', 'name', 'birthDate', 'gender', 'city', 'phone']
    },
    {
      id: 'tickets',
      title: 'Tickets',
      icon: Calendar,
      description: 'Import ticket sales and event attendance data',
      template: 'tickets_template.csv',
      fields: ['eventId', 'customerId', 'type', 'paidPrice', 'purchaseAt']
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

            {importStatus === 'idle' && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Sample Data Preview:</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">email</th>
                        <th className="text-left p-2">name</th>
                        <th className="text-left p-2">birthDate</th>
                        <th className="text-left p-2">city</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">customer1@example.com</td>
                        <td className="p-2">João Silva</td>
                        <td className="p-2">1985-03-15</td>
                        <td className="p-2">São Paulo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">customer2@example.com</td>
                        <td className="p-2">Maria Santos</td>
                        <td className="p-2">1990-07-22</td>
                        <td className="p-2">Rio de Janeiro</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button 
                  onClick={simulateImport}
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  disabled={importStatus !== 'idle'}
                >
                  Import Data
                </Button>
              </div>
            )}

            {importStatus === 'success' && (
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-medium text-success">Import Completed Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  247 records imported, 3 duplicates skipped
                </p>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="font-medium text-destructive">Import Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  5 validation errors found in rows 12, 24, 35, 47, 58
                </p>
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

      <Tabs defaultValue="customers" className="space-y-6">
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
                    
                    <Button variant="outline" className="w-full gap-2">
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