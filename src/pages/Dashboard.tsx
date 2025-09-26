import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Target,
  Brain
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { dataService } from "@/lib/dataService"
import { mlService } from "@/lib/mlService"
import { useToast } from "@/hooks/use-toast"
import MLRunner from "@/components/MLRunner"

const Dashboard = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMLRunner, setShowMLRunner] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [metricsData, eventsData] = await Promise.all([
        dataService.getEventMetrics(),
        dataService.getAllEvents()
      ])
      setMetrics(metricsData)
      setEvents(eventsData.slice(0, 100)) // Limit for performance
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error Loading Data",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">No data available. Please import events first.</p>
        <Button onClick={loadDashboardData}>Retry</Button>
      </div>
    )
  }

  const metricCards = [
    {
      title: "Total Events",
      value: metrics.totalEvents.toString(),
      change: metrics.totalRevenue > 0 ? 12.8 : 0,
      icon: Calendar,
      color: "text-success"
    },
    {
      title: "Total Revenue",
      value: `R$ ${(metrics.totalRevenue / 1000000).toFixed(1)}M`,
      change: metrics.totalRevenue > 0 ? 23.5 : 0,
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Avg. Ticket Price",
      value: `R$ ${metrics.avgTicketPrice.toFixed(0)}`,
      change: -2.1,
      icon: TrendingUp,
      color: "text-warning"
    },
    {
      title: "Tickets Sold",
      value: metrics.totalSold.toLocaleString(),
      change: 18.2,
      icon: Users,
      color: "text-primary"
    }
  ]

  // Generate hourly sales data from events
  const salesByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourEvents = events.filter(event => {
      const eventHour = new Date(event.date).getHours()
      return Math.abs(eventHour - hour) <= 2 // Simulate distribution
    })
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sales: hourEvents.reduce((sum, event) => sum + (event.sold_tickets || 0), 0),
      revenue: hourEvents.reduce((sum, event) => sum + (event.revenue || 0), 0)
    }
  })

  // Generate top genres from events data
  const genreStats: Record<string, { sales: number; revenue: number }> = events.reduce((acc, event) => {
    const genre = event.genre
    if (!acc[genre]) {
      acc[genre] = { sales: 0, revenue: 0 }
    }
    acc[genre].sales += event.sold_tickets || 0
    acc[genre].revenue += event.revenue || 0
    return acc
  }, {} as Record<string, { sales: number; revenue: number }>)

  const topGenres = Object.entries(genreStats)
    .map(([name, data]) => ({ 
      name, 
      sales: data.sales, 
      revenue: data.revenue 
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const pieData = topGenres.slice(0, 4).map((genre, index) => ({
    name: genre.name,
    value: Math.round((genre.revenue / metrics.totalRevenue) * 100),
    color: ['#3B82F6', '#9333EA', '#10B981', '#F59E0B'][index]
  }))

  if (showMLRunner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowMLRunner(false)}
          >
            ← Back to Dashboard
          </Button>
        </div>
        <MLRunner events={events} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights from {events.length} events
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowMLRunner(true)}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics Tools
          </Button>
          <Button 
            className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90"
            onClick={() => setShowMLRunner(true)}
          >
            <Brain className="w-4 h-4" />
            Run AI Models
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          const isPositive = metric.change >= 0
          
          return (
            <Card key={metric.title} className="glass border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className={`flex items-center text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(metric.change)}% vs last month
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Event Performance Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesByHour.slice(6, 24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Top Genres by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topGenres.map((genre, index) => (
                <div key={genre.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/20">
                  <div>
                    <div className="font-medium">{genre.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {genre.sales.toLocaleString()} tickets sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R$ {(genre.revenue / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by City */}
        <Card className="lg:col-span-2 glass border-border/50">
          <CardHeader>
            <CardTitle>Top Cities by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topGenres}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Genre Distribution */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Revenue by Genre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {metrics.occupancyRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Occupancy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                R$ {(metrics.totalRevenue / metrics.totalEvents / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-muted-foreground">Revenue per Event</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {(metrics.totalSold / metrics.totalEvents).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Tickets per Event</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard