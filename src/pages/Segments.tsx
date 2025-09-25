import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  Wine,
  Download,
  Play,
  Eye,
  BarChart3
} from "lucide-react"
import { mockSegments } from "@/lib/mockData"

const Segments = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Customer Segments</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered customer segmentation and insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90">
            <Play className="w-4 h-4" />
            Run Segmentation
          </Button>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {mockSegments.map((segment) => (
          <Card key={segment.id} className="glass border-border/50 hover:border-primary/20 transition-all hover:shadow-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                />
                <Badge variant="secondary" className="text-xs">
                  {segment.size} customers
                </Badge>
              </div>
              <CardTitle className="text-lg">{segment.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {segment.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Avg. LTV
                  </span>
                  <span className="font-semibold">R$ {segment.avgLifetimeValue.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Avg. Age
                  </span>
                  <span className="font-semibold">{segment.avgAge} years</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Top City
                  </span>
                  <span className="font-semibold">{segment.topCity}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preferred Items
                </p>
                <div className="flex flex-wrap gap-1">
                  {segment.preferredItems.slice(0, 2).map((item) => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  {segment.preferredItems.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{segment.preferredItems.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Eye className="w-3 h-3" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Segment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSegments.map((segment) => (
                <div key={segment.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-medium">{segment.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {((segment.size / mockSegments.reduce((acc, s) => acc + s.size, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: segment.color,
                        width: `${(segment.size / mockSegments.reduce((acc, s) => acc + s.size, 0)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wine className="w-4 h-4" />
              Consumption Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSegments.map((segment) => (
                <div key={segment.id} className="p-3 rounded-lg bg-accent/10 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-medium text-sm">{segment.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      R$ {segment.avgLifetimeValue.toLocaleString()} LTV
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {segment.preferredItems.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentation History */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Recent Segmentation Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
              <div>
                <p className="font-medium">ML Segmentation #47</p>
                <p className="text-sm text-muted-foreground">
                  K-means clustering with 4 segments, 1,000 customers processed
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">2 hours ago</p>
                <Badge variant="secondary" className="text-xs">Success</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
              <div>
                <p className="font-medium">ML Segmentation #46</p>
                <p className="text-sm text-muted-foreground">
                  Behavioral clustering with consumption patterns
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">1 day ago</p>
                <Badge variant="secondary" className="text-xs">Success</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
              <div>
                <p className="font-medium">ML Segmentation #45</p>
                <p className="text-sm text-muted-foreground">
                  Demographic + RFM analysis
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">3 days ago</p>
                <Badge variant="secondary" className="text-xs">Success</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Segments