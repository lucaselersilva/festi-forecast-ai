import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Search, 
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from "lucide-react"

const AdminLogs = () => {
  const logs = [
    {
      id: 'log_1',
      timestamp: '2024-01-15 14:32:15',
      type: 'ML_SEGMENTATION',
      status: 'success',
      duration: '2.4s',
      message: 'K-means clustering completed successfully with 4 segments',
      details: 'Processed 1,000 customers, generated 4 clusters with silhouette score: 0.78'
    },
    {
      id: 'log_2', 
      timestamp: '2024-01-15 14:28:42',
      type: 'PRICING_OPTIMIZATION',
      status: 'success',
      duration: '1.8s',
      message: 'Dynamic pricing model executed for Event #23',
      details: 'Recommended prices: Pista R$135, VIP R$285. Expected occupancy: 95%'
    },
    {
      id: 'log_3',
      timestamp: '2024-01-15 14:25:01',
      type: 'DATA_IMPORT',
      status: 'warning',
      duration: '4.2s',
      message: 'Customer import completed with validation warnings',
      details: '247 records imported, 5 rows with missing email addresses, 3 duplicates merged'
    },
    {
      id: 'log_4',
      timestamp: '2024-01-15 13:45:33',
      type: 'CHURN_PREDICTION',
      status: 'success',
      duration: '3.1s',
      message: 'Churn prediction model updated',
      details: 'Identified 127 at-risk customers, model accuracy: 87.3%'
    },
    {
      id: 'log_5',
      timestamp: '2024-01-15 12:15:22',
      type: 'RECOMMENDATION',
      status: 'error',
      duration: '0.5s',
      message: 'Event recommendation service failed',
      details: 'Insufficient historical data for customer #456. Fallback to content-based filtering.'
    },
    {
      id: 'log_6',
      timestamp: '2024-01-15 11:30:18',
      type: 'BRIEFING_TARGET',
      status: 'success',
      duration: '2.8s',
      message: 'Target audience analysis completed for Electronic Festival',
      details: 'Identified 1,247 matching customers, confidence score: 85%'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      processing: 'bg-primary/10 text-primary border-primary/20'
    }
    
    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants] || variants.processing}
      >
        {status}
      </Badge>
    )
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'ML_SEGMENTATION': 'text-primary',
      'PRICING_OPTIMIZATION': 'text-success',
      'DATA_IMPORT': 'text-warning',
      'CHURN_PREDICTION': 'text-purple-500',
      'RECOMMENDATION': 'text-blue-500',
      'BRIEFING_TARGET': 'text-pink-500'
    }
    
    return colors[type as keyof typeof colors] || 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor ML jobs, imports, and system operations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs by message, type, or details..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">94.2%</p>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold mt-1">2.4s</p>
            <p className="text-xs text-muted-foreground">All operations</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Warnings</span>
            </div>
            <p className="text-2xl font-bold mt-1">3</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Errors</span>
            </div>
            <p className="text-2xl font-bold mt-1">1</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Recent Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/20 bg-accent/5 hover:bg-accent/10 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-mono font-medium ${getTypeColor(log.type)}`}>
                      {log.type}
                    </span>
                    {getStatusBadge(log.status)}
                    <span className="text-xs text-muted-foreground">
                      {log.duration}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-1">
                    {log.message}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {log.details}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.timestamp}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ML Model Status */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>ML Models Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-sm font-medium">Segmentation</span>
              </div>
              <p className="text-xs text-muted-foreground">Last run: 32 min ago</p>
              <p className="text-xs text-success">Healthy</p>
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-sm font-medium">Pricing</span>
              </div>
              <p className="text-xs text-muted-foreground">Last run: 28 min ago</p>
              <p className="text-xs text-success">Healthy</p>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                <span className="text-sm font-medium">Recommendations</span>
              </div>
              <p className="text-xs text-muted-foreground">Last run: 2 hours ago</p>
              <p className="text-xs text-warning">Degraded</p>
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-sm font-medium">Churn Prediction</span>
              </div>
              <p className="text-xs text-muted-foreground">Last run: 45 min ago</p>
              <p className="text-xs text-success">Healthy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogs