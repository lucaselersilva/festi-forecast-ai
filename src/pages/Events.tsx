import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  TrendingUp,
  Target,
  Lightbulb,
  Music,
  Plus
} from "lucide-react"
import { dataService } from "@/lib/dataService"
import { mlService } from "@/lib/mlService"
import { useEffect, useState } from "react"

const Events = () => {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [briefingText, setBriefingText] = useState("")
  const [suggestedTarget, setSuggestedTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await dataService.getAllEvents()
        setEvents(data)
        if (data.length > 0) {
          setSelectedEvent(data[0])
        }
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  const handleBriefingSubmit = async () => {
    if (!briefingText.trim() || !selectedEvent) return
    
    setLoading(true)
    try {
      const result = await mlService.runTargetAudienceAnalysis({
        eventDescription: briefingText,
        genre: selectedEvent.genre,
        averagePrice: selectedEvent.ticket_price,
        region: selectedEvent.city,
        existingClusters: [
          { id: 'premium', name: 'Premium VIP', size: 1200, characteristics: {} },
          { id: 'universitarios', name: 'Universitários', size: 3500, characteristics: {} }
        ]
      })
      
      setSuggestedTarget({
        filters: [`Gênero: ${selectedEvent.genre}`, `Cidade: ${selectedEvent.city}`, result.idealProfile?.ageRange || "Jovens 18-35 anos"],
        segments: result.recommendations?.map(r => r.sponsor) || ['mainstream_audience'],
        estimatedReach: result.audienceSize?.withinDatabase || 15000,
        confidence: 0.85
      })
    } catch (error) {
      console.error('Error generating target audience:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Events Management</h1>
          <p className="text-muted-foreground mt-1">
            Event analytics, pricing optimization, and audience targeting
          </p>
        </div>
        
        <Button className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Events List */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div 
                key={event.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                  selectedEvent?.id === event.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border/20 bg-accent/10'
                }`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{event.artist} - {event.venue}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}, {event.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.sold_tickets || 0}/{event.capacity}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {event.genre}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">R$ {(event.revenue || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {(((event.sold_tickets || 0) / event.capacity) * 100).toFixed(1)}% sold
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="briefing">Audience Briefing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Artist</p>
                  <p className="font-medium">{selectedEvent?.artist}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Venue</p>
                  <p className="font-medium">
                    {selectedEvent && new Date(selectedEvent.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm">{selectedEvent?.venue}, {selectedEvent?.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{selectedEvent?.capacity?.toLocaleString()} people</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Genre</p>
                  <p className="text-sm">{selectedEvent?.genre}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pricing & Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Price</p>
                    <p className="font-bold text-lg">R$ {selectedEvent?.ticket_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marketing Spend</p>
                    <p className="font-bold text-lg">R$ {selectedEvent?.marketing_spend?.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-bold text-xl">R$ {(selectedEvent?.revenue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{(selectedEvent?.sold_tickets || 0).toLocaleString()}</p>
                    <Badge variant="secondary">
                      {(((selectedEvent?.sold_tickets || 0) / (selectedEvent?.capacity || 1)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Ticket Value</p>
                  <p className="font-bold text-lg">
                    R$ {selectedEvent?.sold_tickets ? Math.floor((selectedEvent.revenue || 0) / selectedEvent.sold_tickets) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue per Seat</p>
                  <p className="font-medium">
                    R$ {selectedEvent?.capacity ? Math.floor((selectedEvent.revenue || 0) / selectedEvent.capacity) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-accent/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((selectedEvent?.sold_tickets || 0) / (selectedEvent?.capacity || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(((selectedEvent?.sold_tickets || 0) / (selectedEvent?.capacity || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Price Simulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Pista Price (R$)</label>
                    <Input 
                      type="number" 
                      defaultValue={selectedEvent?.ticket_price || 0}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Marketing Budget (R$)</label>
                    <Input 
                      type="number" 
                      defaultValue={selectedEvent?.marketing_spend || 0}
                      className="mt-1"
                    />
                  </div>
                  <Button className="w-full bg-gradient-primary hover:bg-gradient-primary/90">
                    Run Price Optimization
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="font-medium text-primary">Optimal Pricing Strategy</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on historical data and demand patterns
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pista (Recommended)</span>
                    <span className="font-bold">R$ 135</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">VIP (Recommended)</span>
                    <span className="font-bold">R$ 285</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Expected outcome:</p>
                    <p className="text-sm">• 95% occupancy rate</p>
                    <p className="text-sm">• R$ 1.2M projected revenue</p>
                    <p className="text-sm">• 15% higher profit margin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="briefing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Event Briefing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Describe your event vision</label>
                  <Textarea 
                    placeholder="Describe the event atmosphere, target audience, music style, and any specific goals..."
                    value={briefingText}
                    onChange={(e) => setBriefingText(e.target.value)}
                    className="mt-1 min-h-32"
                  />
                </div>
                
                <Button 
                  onClick={handleBriefingSubmit}
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  disabled={!briefingText.trim()}
                >
                  Generate Target Audience
                </Button>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  AI Audience Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedTarget ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="font-medium text-success">Target Audience Identified</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Confidence: {(suggestedTarget.confidence * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recommended Filters:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTarget.filters.map((filter: string) => (
                          <Badge key={filter} variant="secondary">
                            {filter}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Matching Segments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTarget.segments.map((segment: string) => (
                          <Badge key={segment} className="bg-primary/10 text-primary hover:bg-primary/20">
                            {segment}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Estimated Reach:</span>
                        <span className="text-lg font-bold">
                          {suggestedTarget.estimatedReach.toLocaleString()} customers
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter your event briefing to get AI-powered audience suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Events