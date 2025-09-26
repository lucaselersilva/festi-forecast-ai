import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Brain,
  Filter,
  RefreshCw,
  MapPin,
  Music,
  Ticket,
  TrendingDown,
  Eye,
  EyeOff
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
  Cell,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
  ComposedChart,
  Tooltip,
  Legend
} from "recharts"
import { dataService } from "@/lib/dataService"
import { useToast } from "@/hooks/use-toast"
import MLRunner from "@/components/MLRunner"

interface FilterState {
  dateRange: { from: Date | undefined, to: Date | undefined }
  genres: string[]
  cities: string[]
  minPrice: number | null
  maxPrice: number | null
  minCapacity: number | null
  maxCapacity: number | null
}

interface ChartVisibility {
  timeline: boolean
  genres: boolean
  cities: boolean
  scatterPlot: boolean
  occupancy: boolean
  crossAnalysis: boolean
}

const Dashboard = () => {
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMLRunner, setShowMLRunner] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const { toast } = useToast()

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    genres: [],
    cities: [],
    minPrice: null,
    maxPrice: null,
    minCapacity: null,
    maxCapacity: null
  })

  // Chart visibility
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>({
    timeline: true,
    genres: true,
    cities: true,
    scatterPlot: true,
    occupancy: true,
    crossAnalysis: true
  })

  // Available options for filters
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, allEvents])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const eventsData = await dataService.getAllEvents()
      
      setAllEvents(eventsData)
      
      // Extract unique values for filters
      const genres = [...new Set(eventsData.map(e => e.genre))].filter(Boolean)
      const cities = [...new Set(eventsData.map(e => e.city))].filter(Boolean)
      
      setAvailableGenres(genres)
      setAvailableCities(cities)
      
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

  const applyFilters = () => {
    let filtered = [...allEvents]

    // Date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= filters.dateRange.from! && eventDate <= filters.dateRange.to!
      })
    }

    // Genre filter
    if (filters.genres.length > 0) {
      filtered = filtered.filter(event => filters.genres.includes(event.genre))
    }

    // City filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(event => filters.cities.includes(event.city))
    }

    // Price filters
    if (filters.minPrice !== null) {
      filtered = filtered.filter(event => event.ticket_price >= filters.minPrice!)
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(event => event.ticket_price <= filters.maxPrice!)
    }

    // Capacity filters
    if (filters.minCapacity !== null) {
      filtered = filtered.filter(event => event.capacity >= filters.minCapacity!)
    }
    if (filters.maxCapacity !== null) {
      filtered = filtered.filter(event => event.capacity <= filters.maxCapacity!)
    }

    setFilteredEvents(filtered)
    
    // Calculate metrics for filtered data
    calculateMetrics(filtered)
  }

  const calculateMetrics = (events: any[]) => {
    if (events.length === 0) {
      setMetrics(null)
      return
    }

    const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0)
    const totalSold = events.reduce((sum, event) => sum + (event.sold_tickets || 0), 0)
    const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 0), 0)
    const avgTicketPrice = events.reduce((sum, event) => sum + (event.ticket_price || 0), 0) / events.length
    const occupancyRate = (totalSold / totalCapacity) * 100

    setMetrics({
      totalEvents: events.length,
      totalRevenue,
      totalSold,
      avgTicketPrice,
      occupancyRate: isNaN(occupancyRate) ? 0 : occupancyRate,
      avgRevenuePerEvent: totalRevenue / events.length,
      avgTicketsPerEvent: totalSold / events.length
    })
  }

  const toggleGenreFilter = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const toggleCityFilter = (city: string) => {
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }))
  }

  const clearFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      genres: [],
      cities: [],
      minPrice: null,
      maxPrice: null,
      minCapacity: null,
      maxCapacity: null
    })
  }

  const toggleChart = (chartName: keyof ChartVisibility) => {
    setChartVisibility(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }))
  }

  // Data processing for charts
  const getTimelineData = () => {
    const monthlyData: Record<string, { events: number, revenue: number, tickets: number }> = {}
    
    filteredEvents.forEach(event => {
      const month = new Date(event.date).toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { events: 0, revenue: 0, tickets: 0 }
      }
      monthlyData[month].events += 1
      monthlyData[month].revenue += event.revenue || 0
      monthlyData[month].tickets += event.sold_tickets || 0
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        events: data.events,
        revenue: data.revenue,
        tickets: data.tickets
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
  }

  const getGenreData = () => {
    const genreStats: Record<string, { events: number, revenue: number, tickets: number, avgPrice: number }> = {}
    
    filteredEvents.forEach(event => {
      const genre = event.genre
      if (!genreStats[genre]) {
        genreStats[genre] = { events: 0, revenue: 0, tickets: 0, avgPrice: 0 }
      }
      genreStats[genre].events += 1
      genreStats[genre].revenue += event.revenue || 0
      genreStats[genre].tickets += event.sold_tickets || 0
    })

    return Object.entries(genreStats)
      .map(([name, data]) => ({
        name,
        events: data.events,
        revenue: data.revenue,
        tickets: data.tickets,
        avgPrice: data.revenue / data.tickets || 0
      }))
      .sort((a, b) => (b[selectedMetric as keyof typeof a] as number) - (a[selectedMetric as keyof typeof a] as number))
      .slice(0, 8)
  }

  const getCityData = () => {
    const cityStats: Record<string, { events: number, revenue: number, tickets: number }> = {}
    
    filteredEvents.forEach(event => {
      const city = event.city
      if (!cityStats[city]) {
        cityStats[city] = { events: 0, revenue: 0, tickets: 0 }
      }
      cityStats[city].events += 1
      cityStats[city].revenue += event.revenue || 0
      cityStats[city].tickets += event.sold_tickets || 0
    })

    return Object.entries(cityStats)
      .map(([name, data]) => ({
        name,
        events: data.events,
        revenue: data.revenue,
        tickets: data.tickets
      }))
      .sort((a, b) => (b[selectedMetric as keyof typeof a] as number) - (a[selectedMetric as keyof typeof a] as number))
      .slice(0, 10)
  }

  const getScatterData = () => {
    return filteredEvents.map(event => ({
      x: event.ticket_price || 0,
      y: (event.sold_tickets || 0) / (event.capacity || 1) * 100, // Occupancy %
      z: event.revenue || 0,
      genre: event.genre,
      city: event.city,
      name: `${event.artist} - ${event.venue}`
    }))
  }

  const getCrossAnalysisData = () => {
    const analysis: Record<string, Record<string, { events: number, revenue: number }>> = {}
    
    filteredEvents.forEach(event => {
      const genre = event.genre
      const city = event.city
      
      if (!analysis[genre]) analysis[genre] = {}
      if (!analysis[genre][city]) analysis[genre][city] = { events: 0, revenue: 0 }
      
      analysis[genre][city].events += 1
      analysis[genre][city].revenue += event.revenue || 0
    })

    const result = []
    Object.entries(analysis).forEach(([genre, cities]) => {
      Object.entries(cities).forEach(([city, data]) => {
        result.push({
          genre,
          city,
          combination: `${genre} em ${city}`,
          events: data.events,
          revenue: data.revenue,
          avgRevenue: data.revenue / data.events
        })
      })
    })

    return result.sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
        <MLRunner events={filteredEvents} />
      </div>
    )
  }

  const metricCards = [
    {
      title: "Eventos Filtrados",
      value: filteredEvents.length.toString(),
      change: ((filteredEvents.length / allEvents.length) * 100).toFixed(1),
      icon: Calendar,
      color: "text-primary",
      suffix: "%"
    },
    {
      title: "Receita Total",
      value: `R$ ${((metrics?.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      change: metrics ? ((metrics.totalRevenue / 1000000) / (filteredEvents.length / 1000)).toFixed(1) : "0",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Taxa de Ocupação",
      value: `${(metrics?.occupancyRate || 0).toFixed(1)}%`,
      change: (metrics?.occupancyRate || 0) > 75 ? "Excelente" : (metrics?.occupancyRate || 0) > 50 ? "Bom" : "Baixo",
      icon: Users,
      color: "text-warning"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${(metrics?.avgTicketPrice || 0).toFixed(0)}`,
      change: `${(metrics?.avgRevenuePerEvent || 0) / 1000}K por evento`,
      icon: Ticket,
      color: "text-info"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard Interativo</h1>
          <p className="text-muted-foreground mt-1">
            Navegue e explore {allEvents.length} eventos • {filteredEvents.length} filtrados
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={loadDashboardData}
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button 
            className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90"
            onClick={() => setShowMLRunner(true)}
          >
            <Brain className="w-4 h-4" />
            AI & ML Analysis
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analysis">Análise Cruzada</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="filters">Filtros Avançados</TabsTrigger>
        </TabsList>

        {/* Filters Bar */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-4 h-4" />
                Filtros Rápidos
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar
                </Button>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="events">Nº Eventos</SelectItem>
                    <SelectItem value="tickets">Ingressos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gêneros</Label>
                <div className="flex flex-wrap gap-1">
                  {availableGenres.slice(0, 6).map(genre => (
                    <Badge 
                      key={genre}
                      variant={filters.genres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleGenreFilter(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cidades</Label>
                <div className="flex flex-wrap gap-1">
                  {availableCities.slice(0, 6).map(city => (
                    <Badge 
                      key={city}
                      variant={filters.cities.includes(city) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleCityFilter(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Faixa de Preço</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) || null }))}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) || null }))}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Chart Toggles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visualizações</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(chartVisibility).slice(0, 4).map(([key, visible]) => (
                    <Badge 
                      key={key}
                      variant={visible ? "default" : "outline"}
                      className="cursor-pointer text-xs gap-1"
                      onClick={() => toggleChart(key as keyof ChartVisibility)}
                    >
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricCards.map((metric) => {
              const Icon = metric.icon
              
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
                    <div className="text-sm text-muted-foreground">
                      {metric.change}{metric.suffix || ''}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartVisibility.timeline && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Tendência Temporal - {selectedMetric}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getTimelineData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey={selectedMetric} 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {chartVisibility.genres && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Por Gênero - {selectedMetric}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getGenreData()}>
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
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar 
                          dataKey={selectedMetric} 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartVisibility.scatterPlot && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Preço vs Ocupação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={getScatterData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number"
                          dataKey="x" 
                          name="Preço"
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                        />
                        <YAxis 
                          type="number"
                          dataKey="y" 
                          name="Ocupação %"
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-sm">Preço: R$ {data.x}</p>
                                  <p className="text-sm">Ocupação: {data.y.toFixed(1)}%</p>
                                  <p className="text-sm">Receita: R$ {data.z?.toLocaleString()}</p>
                                  <p className="text-sm text-muted-foreground">{data.genre} • {data.city}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Scatter dataKey="y" fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {chartVisibility.crossAnalysis && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Análise Cruzada: Gênero x Cidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {getCrossAnalysisData().map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                        <div>
                          <div className="font-medium text-sm">{item.combination}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.events} eventos • R$ {item.avgRevenue.toFixed(0)} médio
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">R$ {(item.revenue / 1000).toFixed(0)}K</div>
                          <div className="text-xs text-muted-foreground">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {chartVisibility.cities && (
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Performance por Cidade - {selectedMetric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getCityData()}>
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
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey={selectedMetric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Line 
                        type="monotone" 
                        dataKey="events" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Trends content - would need more specific trend analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Tendências de Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="font-medium">Eletrônica</span>
                    </div>
                    <span className="text-success font-bold">+23%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-warning" />
                      <span className="font-medium">Rock</span>
                    </div>
                    <span className="text-warning font-bold">+12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="font-medium">Sertanejo</span>
                    </div>
                    <span className="text-destructive font-bold">-8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Oportunidades Identificadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <h4 className="font-medium text-primary">Expansion São Paulo</h4>
                    <p className="text-sm text-muted-foreground">
                      Ocupação média de 85% sugere demanda reprimida
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-success/20 bg-success/5">
                    <h4 className="font-medium text-success">Premium Pricing</h4>
                    <p className="text-sm text-muted-foreground">
                      Eventos eletrônicos podem suportar preços 30% maiores
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-warning/20 bg-warning/5">
                    <h4 className="font-medium text-warning">Marketing Digital</h4>
                    <p className="text-sm text-muted-foreground">
                      ROI 40% maior em campanhas online vs offline
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Filtros Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Capacidade Mínima</Label>
                  <Input
                    type="number"
                    value={filters.minCapacity || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minCapacity: Number(e.target.value) || null }))}
                    placeholder="Ex: 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidade Máxima</Label>
                  <Input
                    type="number"
                    value={filters.maxCapacity || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxCapacity: Number(e.target.value) || null }))}
                    placeholder="Ex: 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Controles de Visualização</Label>
                  <div className="space-y-2">
                    {Object.entries(chartVisibility).map(([key, visible]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={visible}
                          onCheckedChange={() => toggleChart(key as keyof ChartVisibility)}
                        />
                        <Label htmlFor={key} className="text-sm">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard