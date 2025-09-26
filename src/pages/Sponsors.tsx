import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  BarChart3,
  Clock,
  MapPin,
  Heart
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
const mockSponsors = [
  {
    id: '1',
    name: 'Brahma',
    category: 'Bebidas',
    affinity: 85,
    budget: 50000,
    brandKeywords: ['Cerveja', 'Premium', 'Festa']
  },
  {
    id: '2', 
    name: 'Red Bull',
    category: 'Energético',
    affinity: 78,
    budget: 35000,
    brandKeywords: ['Energia', 'Adrenalina', 'Jovem']
  },
  {
    id: '3',
    name: 'Nubank',
    category: 'Fintech', 
    affinity: 72,
    budget: 40000,
    brandKeywords: ['Digital', 'Moderno', 'Inovação']
  }
]

const Sponsors = () => {
  const affinityData = [
    { category: 'Cerveja Premium', affinity: 85, reach: 450 },
    { category: 'Energético', affinity: 78, reach: 380 },
    { category: 'Fintech', affinity: 62, reach: 720 },
    { category: 'Streaming', affinity: 71, reach: 650 },
  ]

  const demographicData = [
    { ageGroup: '18-24', value: 35 },
    { ageGroup: '25-30', value: 40 },
    { ageGroup: '31-35', value: 20 },
    { ageGroup: '36+', value: 5 }
  ]

  const peakHours = [
    { hour: '20:00', engagement: 15 },
    { hour: '21:00', engagement: 35 },
    { hour: '22:00', engagement: 65 },
    { hour: '23:00', engagement: 85 },
    { hour: '00:00', engagement: 100 },
    { hour: '01:00', engagement: 80 },
    { hour: '02:00', engagement: 45 }
  ]

  const radarData = [
    { subject: 'Engagement', A: 120, B: 110, fullMark: 150 },
    { subject: 'Reach', A: 98, B: 130, fullMark: 150 },
    { subject: 'Conversion', A: 86, B: 100, fullMark: 150 },
    { subject: 'Retention', A: 99, B: 85, fullMark: 150 },
    { subject: 'Brand Fit', A: 85, B: 90, fullMark: 150 },
    { subject: 'ROI', A: 65, B: 85, fullMark: 150 }
  ]

  const colors = ['#9333EA', '#3B82F6', '#10B981', '#F59E0B']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Sponsor Portal</h1>
          <p className="text-muted-foreground mt-1">
            Audience insights and brand affinity analytics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90">
            <Target className="w-4 h-4" />
            Campaign Builder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="affinity">Brand Affinity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Sponsors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockSponsors.map((sponsor) => (
              <Card key={sponsor.id} className="glass border-border/50 hover:border-primary/20 transition-all hover:shadow-glow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <Badge variant="secondary">{sponsor.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Heart className="w-3 h-3" />
                      Brand Affinity
                    </span>
                    <span className="font-semibold">{sponsor.affinity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      Target Match
                    </span>
                    <span className="font-semibold">
                      {Math.floor(Math.random() * 500 + 200)} customers
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Budget
                    </span>
                    <span className="font-semibold">R$ {sponsor.budget.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Keywords
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sponsor.brandKeywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full bg-accent/20 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sponsor.affinity}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Total Reach</span>
                </div>
                <p className="text-2xl font-bold mt-2">1,247</p>
                <p className="text-sm text-muted-foreground">Unique customers</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Avg. Engagement</span>
                </div>
                <p className="text-2xl font-bold mt-2">78%</p>
                <p className="text-sm text-muted-foreground">Brand interaction</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Match Score</span>
                </div>
                <p className="text-2xl font-bold mt-2">85%</p>
                <p className="text-sm text-muted-foreground">Audience fit</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">ROI Potential</span>
                </div>
                <p className="text-2xl font-bold mt-2">3.2x</p>
                <p className="text-sm text-muted-foreground">Expected return</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ ageGroup, value }) => `${ageGroup}: ${value}%`}
                      >
                        {demographicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Peak Engagement Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Bar 
                        dataKey="engagement" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">São Paulo</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Rio de Janeiro</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Belo Horizonte</span>
                    <span className="text-sm font-medium">18%</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Outros</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <div className="w-full bg-accent/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affinity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Brand Affinity by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={affinityData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={100}
                      />
                      <Bar 
                        dataKey="affinity" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar
                        name="Current"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Benchmark"
                        dataKey="B"
                        stroke="hsl(var(--muted-foreground))"
                        fill="hsl(var(--muted-foreground))"
                        fillOpacity={0.05}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Affinity Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affinityData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.reach} matching customers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{item.affinity}%</p>
                      <p className="text-xs text-muted-foreground">affinity score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Campaign Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold text-success">78.5%</p>
                    <p className="text-xs text-success">+12% vs industry avg</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold text-primary">15.3%</p>
                    <p className="text-xs text-primary">+8% vs last campaign</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm text-muted-foreground">Cost per Acquisition</p>
                    <p className="text-2xl font-bold text-warning">R$ 24</p>
                    <p className="text-xs text-warning">-15% vs target</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Focus on 23-28 age group for higher engagement rates</p>
                    <p>• Peak activation hours: 10pm - 1am</p>
                    <p>• São Paulo market shows 40% higher conversion potential</p>
                    <p>• Consider premium drink partnerships for VIP segments</p>
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

export default Sponsors