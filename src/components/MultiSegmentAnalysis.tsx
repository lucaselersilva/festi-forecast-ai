import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Beer, 
  Zap, 
  Calendar, 
  Music, 
  Award,
  TrendingUp,
  Target,
  DollarSign
} from "lucide-react"

interface MultiSegmentAnalysisProps {
  segments: any[]
}

export function MultiSegmentAnalysis({ segments }: MultiSegmentAnalysisProps) {
  if (!segments || segments.length === 0) {
    return null
  }

  // Calculate aggregate statistics
  const totalCustomers = segments.reduce((sum, s) => sum + s.size, 0)
  
  const consumptionStats = segments.reduce((acc, s) => {
    Object.entries(s.multiDimensional?.consumption || {}).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + (value as number)
    })
    return acc
  }, {} as Record<string, number>)

  const ageStats = segments.reduce((acc, s) => {
    Object.entries(s.multiDimensional?.age || {}).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + (value as number)
    })
    return acc
  }, {} as Record<string, number>)

  const engagementStats = segments.reduce((acc, s) => {
    Object.entries(s.multiDimensional?.engagement || {}).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + (value as number)
    })
    return acc
  }, {} as Record<string, number>)

  const sponsorshipStats = segments.reduce((acc, s) => {
    Object.entries(s.multiDimensional?.sponsorship || {}).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + (value as number)
    })
    return acc
  }, {} as Record<string, number>)

  const genreStats = segments.reduce((acc, s) => {
    Object.entries(s.multiDimensional?.genre || {}).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + (value as number)
    })
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="consumption">
            <Beer className="w-4 h-4 mr-2" />
            Consumo
          </TabsTrigger>
          <TabsTrigger value="age">
            <Users className="w-4 h-4 mr-2" />
            Demografia
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Calendar className="w-4 h-4 mr-2" />
            Engajamento
          </TabsTrigger>
          <TabsTrigger value="genre">
            <Music className="w-4 h-4 mr-2" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="sponsorship">
            <Award className="w-4 h-4 mr-2" />
            Patrocínio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(consumptionStats)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1)
                const icon = type === 'Beer Lovers' ? Beer : type === 'Energy Seekers' ? Zap : DollarSign
                const IconComponent = icon
                
                return (
                  <Card key={type}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{type}</CardTitle>
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% do total
                      </p>
                      <div className="mt-2">
                        <Badge variant="secondary">{getConsumptionInsight(type)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="age" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(ageStats)
              .sort(([, a], [, b]) => b - a)
              .map(([age, count]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1)
                
                return (
                  <Card key={age}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Faixa {age}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% do total
                      </p>
                      <div className="mt-2">
                        <Badge variant="secondary">{getAgeInsight(age)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(engagementStats)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1)
                
                return (
                  <Card key={type}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{type}</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% do total
                      </p>
                      <div className="mt-2">
                        <Badge variant="secondary">{getEngagementInsight(type)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="genre" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(genreStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([genre, count]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1)
                
                return (
                  <Card key={genre}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{genre}</CardTitle>
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% preferem este gênero
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="sponsorship" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(sponsorshipStats)
              .sort(([, a], [, b]) => b - a)
              .map(([cluster, count]) => {
                const percentage = ((count / totalCustomers) * 100).toFixed(1)
                
                return (
                  <Card key={cluster}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{cluster}</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% do total
                      </p>
                      <div className="mt-2">
                        <Badge variant="secondary">{getSponsorshipInsight(cluster)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Intersection Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Análise de Interseções
          </CardTitle>
          <CardDescription>
            Combinações de segmentos para targeting preciso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getTopIntersections(segments).map((intersection, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{intersection.rfm}</Badge>
                    <Badge variant="outline">{intersection.consumption}</Badge>
                    <Badge variant="outline">{intersection.age}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {intersection.customers} clientes • Ticket médio: R$ {intersection.avgValue.toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{intersection.potential}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getConsumptionInsight(type: string): string {
  const insights: Record<string, string> = {
    'Beer Lovers': 'Cervejarias',
    'Drinkers': 'Destilados Premium',
    'Energy Seekers': 'Red Bull / Monster',
    'Soft/Low Alcohol': 'Marcas Wellness',
    'Mixed': 'Varejo Diverso'
  }
  return insights[type] || 'Geral'
}

function getAgeInsight(age: string): string {
  const insights: Record<string, string> = {
    '18-24': 'Universitário',
    '25-34': 'Profissional',
    '35+': 'Premium'
  }
  return insights[age] || 'Geral'
}

function getEngagementInsight(type: string): string {
  const insights: Record<string, string> = {
    'Early Buyers': 'Pré-venda VIP',
    'Late Buyers': 'Urgência',
    'Promoters': 'Afiliados',
    'Silent Audience': 'Reativação'
  }
  return insights[type] || 'Regular'
}

function getSponsorshipInsight(cluster: string): string {
  const insights: Record<string, string> = {
    'Energy Cluster': 'Energéticos',
    'Beer Cluster': 'Cervejarias',
    'Luxury Cluster': 'Premium Brands',
    'Student Cluster': 'Fintechs / Apps',
    'Fashion Cluster': 'Streetwear',
    'General Cluster': 'Marcas Gerais'
  }
  return insights[cluster] || 'Geral'
}

function getTopIntersections(segments: any[]) {
  const intersections: any[] = []
  
  segments.forEach(segment => {
    const consumption = segment.characteristics?.topConsumptionProfile || 'Unknown'
    const age = segment.characteristics?.topAgeGroup || 'Unknown'
    
    if (consumption !== 'Unknown' && age !== 'Unknown') {
      intersections.push({
        rfm: segment.name,
        consumption,
        age,
        customers: segment.size,
        avgValue: segment.value,
        potential: segment.growthPotential === 'high' ? 'Alto' : 
                   segment.growthPotential === 'medium' ? 'Médio' : 'Baixo'
      })
    }
  })
  
  return intersections
    .sort((a, b) => b.avgValue - a.avgValue)
    .slice(0, 5)
}
