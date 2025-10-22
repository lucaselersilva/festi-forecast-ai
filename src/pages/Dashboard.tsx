import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Label } from "@/components/ui/label"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Brain,
  RefreshCw,
  Ticket,
  BarChart3,
  Music2
} from "lucide-react"
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  Legend
} from "recharts"
import { dataService } from "@/lib/dataService"
import { useToast } from "@/hooks/use-toast"
import MLRunner from "@/components/MLRunner"
import SmartInsightsCard from "@/components/dashboard/SmartInsightsCard"
import AdvancedAnalysis from "@/components/dashboard/AdvancedAnalysis"

interface FilterState {
  dateRange?: DateRange
  genres: string[]
  cities: string[]
  minPrice: number | null
  maxPrice: number | null
}

const Dashboard = () => {
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMLRunner, setShowMLRunner] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [breakdownView, setBreakdownView] = useState<'genre' | 'city'>('genre')
  const { toast } = useToast()

  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    genres: [],
    cities: [],
    minPrice: null,
    maxPrice: null
  })

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
      
      const genres = [...new Set(eventsData.map(e => e.genre))].filter(Boolean)
      const cities = [...new Set(eventsData.map(e => e.city))].filter(Boolean)
      
      setAvailableGenres(genres)
      setAvailableCities(cities)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Erro ao Carregar",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allEvents]

    if (filters.dateRange?.from && filters.dateRange?.to) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= filters.dateRange!.from! && eventDate <= filters.dateRange!.to!
      })
    }

    if (filters.genres.length > 0) {
      filtered = filtered.filter(event => filters.genres.includes(event.genre))
    }

    if (filters.cities.length > 0) {
      filtered = filtered.filter(event => filters.cities.includes(event.city))
    }

    if (filters.minPrice !== null) {
      filtered = filtered.filter(event => event.ticket_price >= filters.minPrice!)
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(event => event.ticket_price <= filters.maxPrice!)
    }

    setFilteredEvents(filtered)
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
      dateRange: undefined,
      genres: [],
      cities: [],
      minPrice: null,
      maxPrice: null
    })
  }

  const getTimelineData = () => {
    const monthlyData: Record<string, { events: number, revenue: number, tickets: number }> = {}
    
    filteredEvents.forEach(event => {
      const month = new Date(event.date).toISOString().substring(0, 7)
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
      .slice(-12)
  }

  const getBreakdownData = () => {
    const stats: Record<string, { events: number, revenue: number, tickets: number }> = {}
    
    filteredEvents.forEach(event => {
      const key = breakdownView === 'genre' ? event.genre : event.city
      if (!stats[key]) {
        stats[key] = { events: 0, revenue: 0, tickets: 0 }
      }
      stats[key].events += 1
      stats[key].revenue += event.revenue || 0
      stats[key].tickets += event.sold_tickets || 0
    })

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        events: data.events,
        revenue: data.revenue,
        tickets: data.tickets
      }))
      .sort((a, b) => (b[selectedMetric as keyof typeof a] as number) - (a[selectedMetric as keyof typeof a] as number))
      .slice(0, 10)
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
        <Button 
          variant="outline" 
          onClick={() => setShowMLRunner(false)}
        >
          ← Voltar ao Dashboard
        </Button>
        <MLRunner events={filteredEvents} />
      </div>
    )
  }

  const metricCards = [
    {
      title: "Eventos",
      value: filteredEvents.length.toString(),
      subtitle: `${((filteredEvents.length / allEvents.length) * 100).toFixed(0)}% do total`,
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Receita Total",
      value: `R$ ${((metrics?.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      subtitle: `Média R$ ${((metrics?.avgRevenuePerEvent || 0) / 1000).toFixed(0)}K/evento`,
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Taxa de Ocupação",
      value: `${(metrics?.occupancyRate || 0).toFixed(1)}%`,
      subtitle: (metrics?.occupancyRate || 0) > 75 ? "Excelente" : (metrics?.occupancyRate || 0) > 50 ? "Bom" : "Baixo",
      icon: Users,
      color: "text-warning"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${(metrics?.avgTicketPrice || 0).toFixed(0)}`,
      subtitle: `${(metrics?.totalSold || 0).toLocaleString()} ingressos`,
      icon: Ticket,
      color: "text-info"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {allEvents.length} eventos • {filteredEvents.length} filtrados
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
            AI & ML
          </Button>
        </div>
      </div>

      {/* Filtros em uma linha */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="events">Eventos</SelectItem>
                  <SelectItem value="tickets">Ingressos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => setFilters({ ...filters, dateRange: range })}
              />
              
              <div className="flex flex-wrap gap-1">
                <Label className="text-xs text-muted-foreground w-full mb-1">Gêneros:</Label>
                {availableGenres.slice(0, 8).map(genre => (
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
              
              <div className="flex flex-wrap gap-1">
                <Label className="text-xs text-muted-foreground w-full mb-1">Cidades:</Label>
                {availableCities.slice(0, 8).map(city => (
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
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="glass border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução Temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getTimelineData()}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
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
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance por {breakdownView === 'genre' ? 'Gênero' : 'Cidade'}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={breakdownView === 'genre' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBreakdownView('genre')}
                >
                  <Music2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={breakdownView === 'city' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBreakdownView('city')}
                >
                  Cidades
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getBreakdownData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey={selectedMetric} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <SmartInsightsCard events={filteredEvents} metrics={metrics} />

      {/* Análises Avançadas (Accordion) */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Análises Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedAnalysis events={filteredEvents} />
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
