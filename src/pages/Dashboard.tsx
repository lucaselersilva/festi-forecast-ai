import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Brain,
  RefreshCw,
  BarChart3,
  Music2,
  Table as TableIcon
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
  Tooltip
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useTenant } from "@/hooks/useTenant"
import ClientsTable from "@/components/ClientsTable"

interface FilterState {
  genres: string[]
  month: string | null
  daysOfWeek: number[]
}

const Dashboard = () => {
  const [valleClientes, setValleClientes] = useState<any[]>([])
  const [filteredClientes, setFilteredClientes] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>({
    totalClientes: 0,
    consumoMedio: 0,
    presencaMedia: 0,
    taxaAppAtivo: 0,
    recenciaMedia: 0,
    consumoTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('consumo')
  const { toast } = useToast()
  const { tenantId } = useTenant()

  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    month: null,
    daysOfWeek: []
  })
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  useEffect(() => {
    if (tenantId) {
      loadValleClientesData()
    }
  }, [tenantId])

  useEffect(() => {
    if (valleClientes.length > 0) {
      applyValleClientesFilters()
    }
  }, [filters, valleClientes])


  const loadValleClientesData = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true)
      let allData: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('valle_clientes')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('primeira_entrada', { ascending: false })
          .range(from, from + pageSize - 1)
        
        if (error) throw error
        
        if (data && data.length > 0) {
          allData = [...allData, ...data]
          from += pageSize
          console.log(`📦 Carregados ${allData.length} clientes até agora...`)
          
          // Se retornou menos que pageSize, chegamos ao fim
          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }
      
      console.log('✅ Total de clientes carregados:', allData.length)
      setValleClientes(allData)
      
      const generos = [...new Set(allData.map(c => c.genero).filter(Boolean))]
      const months = [...new Set(allData.map(c => {
        if (!c.primeira_entrada) return null
        const date = new Date(c.primeira_entrada)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }).filter(Boolean))].sort().reverse()
      
      setAvailableGenres(generos)
      setAvailableMonths(months as string[])
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading valle clientes:', error)
      toast({
        title: "Erro ao Carregar",
        description: "Falha ao carregar dados de clientes",
        variant: "destructive"
      })
      setLoading(false)
    }
  }


  const applyValleClientesFilters = () => {
    if (valleClientes.length === 0) {
      console.log('⚠️ ValleClientes ainda vazio, aguardando...')
      return
    }
    
    console.log('🔍 Aplicando filtros. ValleClientes:', valleClientes.length)
    let filtered = [...valleClientes]

    if (filters.month) {
      filtered = filtered.filter(cliente => {
        if (!cliente.primeira_entrada) return false
        const clienteDate = new Date(cliente.primeira_entrada)
        const clienteMonth = `${clienteDate.getFullYear()}-${String(clienteDate.getMonth() + 1).padStart(2, '0')}`
        return clienteMonth === filters.month
      })
    }

    if (filters.genres.length > 0) {
      filtered = filtered.filter(cliente => filters.genres.includes(cliente.genero))
    }

    if (filters.daysOfWeek.length > 0) {
      filtered = filtered.filter(cliente => {
        if (!cliente.dias_semana_visitas) return false;
        const preferredDay = getPreferredDay(cliente.dias_semana_visitas);
        if (!preferredDay) return false;
        return filters.daysOfWeek.includes(preferredDay.day);
      });
    }

    console.log('✅ Clientes filtrados:', filtered.length)
    setFilteredClientes(filtered)
    calculateValleClientesMetrics(filtered)
  }

  const getPreferredDay = (diasSemana: Record<string, number> | null): { day: number; count: number } | null => {
    if (!diasSemana) return null;
    
    const entries = Object.entries(diasSemana).map(([day, count]) => ({
      day: parseInt(day),
      count: count as number
    }));
    
    const maxEntry = entries.reduce((max, curr) => curr.count > max.count ? curr : max, entries[0]);
    
    // Se não houver nenhuma visita registrada, retornar null
    if (maxEntry.count === 0) return null;
    
    return maxEntry;
  };

const calculateValleClientesMetrics = (clientes: any[]) => {
    if (!clientes || clientes.length === 0) {
      console.log('⚠️ Nenhum cliente para calcular métricas')
      setMetrics({
        totalClientes: 0,
        consumoMedio: 0,
        presencaMedia: 0,
        taxaAppAtivo: 0,
        recenciaMedia: 0,
        consumoTotal: 0
      })
      return
    }

    console.log('📊 Calculando métricas para', clientes.length, 'clientes')
    
    const totalConsumo = clientes.reduce((sum, c) => sum + (c.consumo || 0), 0)
    const totalPresencas = clientes.reduce((sum, c) => sum + (c.presencas || 0), 0)
    const comAppAtivo = clientes.filter(c => c.aplicativo_ativo).length
    
    const now = new Date()
    const recencyDays = clientes
      .filter(c => c.ultima_visita)
      .map(c => {
        return Math.floor((now.getTime() - new Date(c.ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
      })
    const avgRecency = recencyDays.length > 0 
      ? recencyDays.reduce((a, b) => a + b, 0) / recencyDays.length 
      : 0

    const calculatedMetrics = {
      totalClientes: clientes.length,
      consumoMedio: totalConsumo / clientes.length,
      presencaMedia: totalPresencas / clientes.length,
      taxaAppAtivo: (comAppAtivo / clientes.length) * 100,
      recenciaMedia: avgRecency,
      consumoTotal: totalConsumo
    }
    
    console.log('✅ Métricas calculadas:', calculatedMetrics)
    setMetrics(calculatedMetrics)
  }

  const toggleGenreFilter = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const toggleDayFilter = (day: number) => {
    setFilters(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }))
  }

  const clearFilters = () => {
    setFilters({
      genres: [],
      month: null,
      daysOfWeek: []
    })
  }

  const getTimelineData = () => {
    const monthlyData: Record<string, { clientes: number, consumo: number, presencas: number }> = {}
    
    filteredClientes.forEach(cliente => {
      if (!cliente.primeira_entrada) return
      const month = new Date(cliente.primeira_entrada).toISOString().substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { clientes: 0, consumo: 0, presencas: 0 }
      }
      monthlyData[month].clientes += 1
      monthlyData[month].consumo += cliente.consumo || 0
      monthlyData[month].presencas += cliente.presencas || 0
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        clientes: data.clientes,
        consumo: data.consumo,
        presencas: data.presencas
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
  }

  const getBreakdownData = () => {
    const stats: Record<string, { clientes: number, consumo: number, presencas: number }> = {}
    
    filteredClientes.forEach(cliente => {
      const key = cliente.genero || 'Não informado'
      if (!stats[key]) {
        stats[key] = { clientes: 0, consumo: 0, presencas: 0 }
      }
      stats[key].clientes += 1
      stats[key].consumo += cliente.consumo || 0
      stats[key].presencas += cliente.presencas || 0
    })

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        clientes: data.clientes,
        consumo: data.consumo,
        presencas: data.presencas
      }))
      .sort((a, b) => (b[selectedMetric as keyof typeof a] as number) - (a[selectedMetric as keyof typeof a] as number))
      .slice(0, 10)
  }

  const getDayOfWeekData = () => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const dayStats: Record<number, { clientes: number, visitas: number }> = {
      0: { clientes: 0, visitas: 0 },
      1: { clientes: 0, visitas: 0 },
      2: { clientes: 0, visitas: 0 },
      3: { clientes: 0, visitas: 0 },
      4: { clientes: 0, visitas: 0 },
      5: { clientes: 0, visitas: 0 },
      6: { clientes: 0, visitas: 0 }
    }
    
    filteredClientes.forEach(cliente => {
      if (!cliente.dias_semana_visitas) return
      Object.entries(cliente.dias_semana_visitas).forEach(([day, count]) => {
        const dayNum = parseInt(day)
        const countNum = typeof count === 'number' ? count : 0
        dayStats[dayNum].visitas += countNum
        if (countNum > 0) dayStats[dayNum].clientes += 1
      })
    })

    return dayNames.map((name, index) => ({
      name,
      visitas: dayStats[index].visitas,
      clientes: dayStats[index].clientes
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const metricCards = [
    {
      title: "Total Clientes",
      value: filteredClientes.length.toString(),
      subtitle: `${((filteredClientes.length / (valleClientes.length || 1)) * 100).toFixed(0)}% do total`,
      icon: Users,
      color: "text-primary"
    },
  {
    title: "Consumo Médio",
    value: `R$ ${(metrics?.consumoMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    subtitle: `Total R$ ${(metrics?.consumoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    icon: DollarSign,
    color: "text-success"
  },
    {
      title: "Taxa App Ativo",
      value: `${(metrics?.taxaAppAtivo || 0).toFixed(1)}%`,
      subtitle: (metrics?.taxaAppAtivo || 0) > 50 ? "Excelente" : "Baixo",
      icon: Brain,
      color: "text-warning"
    },
    {
      title: "Presença Média",
      value: (metrics?.presencaMedia || 0).toFixed(1),
      subtitle: `Recência ${(metrics?.recenciaMedia || 0).toFixed(0)} dias`,
      icon: Calendar,
      color: "text-info"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? (
              "Carregando dados..."
            ) : (
              `${valleClientes.length} clientes • ${filteredClientes.length} filtrados`
            )}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={loadValleClientesData}
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <TableIcon className="w-4 h-4" />
            Banco de Dados de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

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
                  <SelectItem value="consumo">Consumo</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="presencas">Presenças</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filtro de Mês */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Mês:</Label>
                <Select value={filters.month || 'all'} onValueChange={(value) => setFilters({ ...filters, month: value === 'all' ? null : value })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {availableMonths.map(month => {
                      const [year, monthNum] = month.split('-')
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                      return (
                        <SelectItem key={month} value={month}>
                          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

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
                <Label className="text-xs text-muted-foreground w-full mb-1">Dia da Semana Preferido:</Label>
                {[
                  { value: 0, label: 'Dom' },
                  { value: 1, label: 'Seg' },
                  { value: 2, label: 'Ter' },
                  { value: 3, label: 'Qua' },
                  { value: 4, label: 'Qui' },
                  { value: 5, label: 'Sex' },
                  { value: 6, label: 'Sáb' }
                ].map(day => (
                  <Badge 
                    key={day.value}
                    variant={filters.daysOfWeek.includes(day.value) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleDayFilter(day.value)}
                  >
                    {day.label}
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
            Evolução do Consumo Médio
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
                formatter={(value: any, name: string) => {
                  if (name === 'consumo') return [`R$ ${(value / 1000).toFixed(1)}K`, 'Consumo']
                  if (name === 'clientes') return [value.toLocaleString(), 'Clientes']
                  if (name === 'presencas') return [value, 'Presenças']
                  return [value, name]
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
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Distribuição por Gênero
          </CardTitle>
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
                formatter={(value: any, name: string) => {
                  if (name === 'consumo') return [`R$ ${(value / 1000).toFixed(1)}K`, 'Consumo']
                  if (name === 'clientes') return [value.toLocaleString(), 'Clientes']
                  if (name === 'presencas') return [value, 'Presenças']
                  return [value, name]
                }}
              />
                <Bar dataKey={selectedMetric} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Dia da Semana */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Distribuição por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getDayOfWeekData()}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'visitas') return [value, 'Total de Visitas']
                  if (name === 'clientes') return [value, 'Clientes']
                  return [value, name]
                }}
              />
              <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="database">
          <ClientsTable 
            clients={valleClientes} 
            onRefresh={loadValleClientesData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard
