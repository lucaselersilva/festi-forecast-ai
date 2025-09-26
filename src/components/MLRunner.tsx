import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  DollarSign, 
  Users, 
  TrendingDown,
  Target,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { mlService } from "@/lib/mlService"
import { apiService } from "@/lib/apiService"

interface MLRunnerProps {
  events: any[]
  onResults?: (results: any) => void
}

const MLRunner = ({ events, onResults }: MLRunnerProps) => {
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const runTask = async (taskId: string, taskFn: () => Promise<any>) => {
    setRunningTasks(prev => new Set(prev).add(taskId))
    setErrors(prev => ({ ...prev, [taskId]: '' }))

    try {
      const result = await taskFn()
      setResults(prev => ({ ...prev, [taskId]: result }))
      onResults?.(result)
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        [taskId]: error instanceof Error ? error.message : 'Unknown error occurred' 
      }))
    } finally {
      setRunningTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const runSegmentation = () => {
    runTask('segmentation', async () => {
      // Mock customer data based on events for demo
      const input = {
        customerData: events.slice(0, 1000).map((event, index) => ({
          customerId: `customer_${index}`,
          age: Math.floor(Math.random() * 40) + 18,
          gender: Math.random() > 0.5 ? 'F' : 'M',
          city: event.city,
          state: event.city === 'São Paulo' ? 'SP' : event.city === 'Rio de Janeiro' ? 'RJ' : 'BA',
          previousVisits: Math.floor(Math.random() * 10) + 1,
          lifetimeValue: Math.floor(Math.random() * 2000) + 200,
          avgBarTicket: Math.floor(Math.random() * 200) + 50,
          favoriteDrinks: ['Cerveja', 'Caipirinha', 'Gin'].slice(Math.floor(Math.random() * 2)),
          checkInHistory: [{ eventId: event.event_id.toString(), date: event.date }],
          totalEventsAttended: Math.floor(Math.random() * 20) + 1
        }))
      }
      return await mlService.runSegmentation(input)
    })
  }

  const runPricing = () => {
    runTask('pricing', async () => {
      const sampleEvent = events[0]
      if (!sampleEvent) throw new Error('No events available for pricing analysis')

      const input = {
        event: {
          genre: sampleEvent.genre,
          city: sampleEvent.city,
          venue: sampleEvent.venue,
          capacity: sampleEvent.capacity,
          date: sampleEvent.date,
          dayOfWeek: sampleEvent.day_of_week,
          weather: { temp: sampleEvent.temp_c || 25, precipitation: sampleEvent.precip_mm || 0 }
        },
        historicalSales: events.slice(0, 100).map(e => ({
          ticketType: (Math.random() > 0.7 ? 'vip' : Math.random() > 0.3 ? 'pista' : 'camarote') as 'pista' | 'vip' | 'camarote',
          price: Number(e.ticket_price),
          soldTickets: Number(e.sold_tickets) || Math.floor(e.capacity * 0.8),
          demandCurve: [
            { price: Number(e.ticket_price) * 0.8, demand: e.capacity * 0.95 },
            { price: Number(e.ticket_price), demand: e.capacity * 0.75 },
            { price: Number(e.ticket_price) * 1.2, demand: e.capacity * 0.50 }
          ],
          date: e.date,
          dayOfWeek: e.day_of_week
        }))
      }
      return await mlService.runPricing(input)
    })
  }

  const runChurnPrediction = () => {
    runTask('churn', async () => {
      // Mock customer data for demo
      const input = {
        customerId: 'demo_customer_1',
        lastEventDate: '2024-06-01',
        totalEvents: 5,
        avgTicketPrice: 120,
        totalSpent: 600
      }
      return await mlService.runChurnPrediction(input)
    })
  }

  const runTargetAudienceAnalysis = () => {
    runTask('targetaudience', async () => {
      const sampleEvent = events[0] || { genre: 'Eletrônica', city: 'São Paulo', ticket_price: 120 }
      const input = {
        eventDescription: 'Festival de música eletrônica com DJs internacionais, experiência premium com open bar',
        genre: sampleEvent.genre,
        averagePrice: sampleEvent.ticket_price,
        region: sampleEvent.city,
        existingClusters: [
          { id: 'premium', name: 'Premium VIP', size: 1200, characteristics: {} },
          { id: 'universitarios', name: 'Universitários', size: 3500, characteristics: {} }
        ]
      }
      return await mlService.runTargetAudienceAnalysis(input)
    })
  }

  const runRecommendationEngine = () => {
    runTask('recommendations', async () => {
      const input = {
        customerId: 'demo_customer_1',
        eventHistory: events.slice(0, 5).map(e => ({
          eventId: e.event_id.toString(),
          genre: e.genre,
          date: e.date,
          ticketType: 'pista',
          spent: e.ticket_price + Math.floor(Math.random() * 100)
        })),
        consumptionHistory: [
          { product: 'Cerveja Long Neck', category: 'Bebidas', quantity: 3, value: 45, date: '2024-01-15' },
          { product: 'Gin Tônica', category: 'Drinks', quantity: 2, value: 60, date: '2024-01-15' }
        ],
        navigationHistory: [
          { page: '/eventos/rock-festival', eventViewed: 'rock_fest_2024', timeSpent: 120, date: '2024-01-20' },
          { page: '/eventos/eletronica-night', eventViewed: 'eletro_night', timeSpent: 85, date: '2024-01-22' }
        ]
      }
      return await mlService.runRecommendationEngine(input)
    })
  }

  const TaskCard = ({ 
    taskId, 
    title, 
    description, 
    icon: Icon, 
    onRun, 
    resultComponent 
  }: {
    taskId: string
    title: string
    description: string
    icon: any
    onRun: () => void
    resultComponent?: (result: any) => React.ReactNode
  }) => {
    const isRunning = runningTasks.has(taskId)
    const result = results[taskId]
    const error = errors[taskId]

    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={onRun}
            disabled={isRunning || events.length === 0}
            className="w-full"
            variant={result ? "outline" : "default"}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : result ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Again
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && resultComponent && (
            <div className="mt-4">
              {resultComponent(result)}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          No events data available. Please import event data first to run ML analysis.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">AI & ML Analysis</h2>
        <p className="text-muted-foreground">
          Run advanced analytics and predictions on your event data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskCard
          taskId="segmentation"
          title="Customer Segmentation"
          description="Criar segmentos baseados em dados demográficos, socioeconômicos e comportamentais"
          icon={Users}
          onRun={runSegmentation}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Encontrados {result.segments?.length || 0} segmentos:</p>
              {result.segments?.map((segment: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{segment.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {segment.size} clientes ({segment.percentage}%)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gasto médio: R$ {segment.dominantCharacteristics?.avgSpending}
                  </p>
                </div>
              ))}
            </div>
          )}
        />

        <TaskCard
          taskId="pricing"
          title="Dynamic Pricing" 
          description="Sugerir ajustes de preço para maximizar receita e ocupação"
          icon={DollarSign}
          onRun={runPricing}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Preços Recomendados:</p>
              <div className="space-y-1 text-sm">
                <div>Pista: R$ {result.recommendedPrices?.pista?.optimal}</div>
                <div>VIP: R$ {result.recommendedPrices?.vip?.optimal}</div>
                <div>Camarote: R$ {result.recommendedPrices?.camarote?.optimal}</div>
              </div>
              <Badge variant={result.confidence === 'alta' ? 'default' : result.confidence === 'média' ? 'secondary' : 'outline'}>
                Confiança {result.confidence}
              </Badge>
            </div>
          )}
        />

        <TaskCard
          taskId="churn"
          title="Churn Prediction"
          description="Identificar clientes com risco de não retornar"
          icon={TrendingDown}
          onRun={runChurnPrediction}
          resultComponent={(result) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={result.riskLevel === 'high' ? 'destructive' : 
                          result.riskLevel === 'medium' ? 'secondary' : 'outline'}
                >
                  RISCO {result.riskLevel?.toUpperCase()}
                </Badge>
                <span className="text-sm">
                  {(result.churnProbability * 100).toFixed(1)}% probabilidade
                </span>
              </div>
            </div>
          )}
        />

        <TaskCard
          taskId="targetaudience"
          title="Target Audience"
          description="Recomendar público para campanhas e patrocínios"
          icon={Target}
          onRun={runTargetAudienceAnalysis}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Perfil Ideal:</p>
              <div className="text-sm space-y-1">
                <div>{result.idealProfile?.ageRange} - {result.idealProfile?.gender}</div>
                <div>Bebida: {result.idealProfile?.favoriteDrink}</div>
                <div>Audiência: {result.audienceSize?.withinDatabase?.toLocaleString()} pessoas</div>
              </div>
            </div>
          )}
        />

        <TaskCard
          taskId="recommendations"
          title="Recommendation Engine"
          description="Recomendar eventos, produtos e bebidas baseado no histórico"
          icon={ShoppingCart}
          onRun={runRecommendationEngine}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Recomendações:</p>
              {result.eventRecommendations?.slice(0, 2).map((rec: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline">{rec.title}</Badge>
                  <Badge 
                    variant={rec.conversionProbability === 'alta' ? 'default' : 
                            rec.conversionProbability === 'média' ? 'secondary' : 'outline'}
                  >
                    {rec.conversionProbability}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default MLRunner