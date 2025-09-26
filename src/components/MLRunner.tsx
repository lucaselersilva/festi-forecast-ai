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
      const input = {
        events: events.map(event => ({
          event_id: event.event_id,
          genre: event.genre,
          ticket_price: event.ticket_price,
          marketing_spend: event.marketing_spend,
          sold_tickets: event.sold_tickets,
          revenue: event.revenue,
          capacity: event.capacity,
          city: event.city
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
          marketing_spend: sampleEvent.marketing_spend
        },
        historicalData: events.filter(e => e.sold_tickets && e.revenue).map(e => ({
          ticket_price: e.ticket_price,
          sold_tickets: e.sold_tickets,
          revenue: e.revenue,
          genre: e.genre,
          city: e.city,
          capacity: e.capacity
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

  const runBriefingAnalysis = () => {
    runTask('briefing', async () => {
      const input = {
        eventDescription: 'Festival de música eletrônica com DJs internacionais, experiência premium com open bar',
        genre: 'Eletrônica',
        city: 'São Paulo',
        targetAudience: 'Jovens 18-35 anos',
        budget: 100000
      }
      return await mlService.runBriefingAnalysis(input)
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
          description="Identify distinct customer groups based on behavior patterns"
          icon={Users}
          onRun={runSegmentation}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Found {result.segments?.length || 0} segments:</p>
              {result.segments?.slice(0, 3).map((segment: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline">{segment.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {segment.size} customers
                  </span>
                </div>
              ))}
            </div>
          )}
        />

        <TaskCard
          taskId="pricing"
          title="Dynamic Pricing"
          description="Optimize ticket prices based on demand and market conditions"
          icon={DollarSign}
          onRun={runPricing}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Suggested Prices:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Basic: R$ {result.suggestedPrices?.basic}</div>
                <div>Premium: R$ {result.suggestedPrices?.premium}</div>
                <div>VIP: R$ {result.suggestedPrices?.vip}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Expected sales: {result.demandForecast?.expectedSales} tickets
              </p>
            </div>
          )}
        />

        <TaskCard
          taskId="churn"
          title="Churn Prediction"
          description="Identify customers at risk of not returning"
          icon={TrendingDown}
          onRun={runChurnPrediction}
          resultComponent={(result) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={result.riskLevel === 'high' ? 'destructive' : 
                          result.riskLevel === 'medium' ? 'secondary' : 'outline'}
                >
                  {result.riskLevel?.toUpperCase()} RISK
                </Badge>
                <span className="text-sm">
                  {(result.churnProbability * 100).toFixed(1)}% probability
                </span>
              </div>
            </div>
          )}
        />

        <TaskCard
          taskId="briefing"
          title="Target Audience"
          description="Analyze event briefing to suggest optimal target segments"
          icon={Target}
          onRun={runBriefingAnalysis}
          resultComponent={(result) => (
            <div className="space-y-2">
              <p className="font-medium">Target Segments:</p>
              <div className="flex flex-wrap gap-1">
                {result.targetSegments?.map((segment: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {segment.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated reach: {result.estimatedReach?.toLocaleString()} people
              </p>
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default MLRunner