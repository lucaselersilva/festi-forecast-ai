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
  Plus,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react"
import { dataService } from "@/lib/dataService"
import { mlService } from "@/lib/mlService"
import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useTenant } from "@/hooks/useTenant"
import { useToast } from "@/hooks/use-toast"
import { EventDialog } from "@/components/events/EventDialog"
import { EventFilters } from "@/components/events/EventFilters"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const Events = () => {
  const { tenantId } = useTenant()
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [briefingText, setBriefingText] = useState("")
  const [suggestedTarget, setSuggestedTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedCity, setSelectedCity] = useState("all")
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingResult, setPricingResult] = useState<any>(null)
  const [priceInputs, setPriceInputs] = useState({
    pista: '',
    marketing: ''
  })

  useEffect(() => {
    if (tenantId) {
      loadEvents()
    }
  }, [tenantId])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })

      if (error) throw error

      setEvents(data || [])
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0])
      }
    } catch (error: any) {
      console.error('Error loading events:', error)
      toast({
        title: "Error loading events",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const genres = useMemo(() => 
    Array.from(new Set(events.map(e => e.genre))).sort(),
    [events]
  )

  const cities = useMemo(() => 
    Array.from(new Set(events.map(e => e.city))).sort(),
    [events]
  )

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === "" || 
        event.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === "all" || event.genre === selectedGenre
      const matchesCity = selectedCity === "all" || event.city === selectedCity
      return matchesSearch && matchesGenre && matchesCity
    })
  }, [events, searchTerm, selectedGenre, selectedCity])

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id)
          .eq('tenant_id', tenantId)

        if (error) throw error

        toast({
          title: "Event updated",
          description: "Event has been updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('events')
          .insert({ ...eventData, tenant_id: tenantId })

        if (error) throw error

        toast({
          title: "Event created",
          description: "Event has been created successfully"
        })
      }
      
      await loadEvents()
      setEditingEvent(null)
    } catch (error: any) {
      console.error('Error saving event:', error)
      toast({
        title: "Error saving event",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully"
      })

      if (selectedEvent?.id === eventToDelete.id) {
        setSelectedEvent(null)
      }

      await loadEvents()
      setEventToDelete(null)
      setDeleteDialogOpen(false)
    } catch (error: any) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleBriefingSubmit = async () => {
    if (!briefingText.trim() || !selectedEvent) return
    
    setLoading(true)
    try {
      const result = await mlService.runTargetAudienceAnalysis({
        eventDescription: briefingText,
        genre: selectedEvent.genre,
        averagePrice: selectedEvent.ticket_price,
        region: selectedEvent.city,
        existingClusters: []
      })
      
      setSuggestedTarget({
        filters: [`Gênero: ${selectedEvent.genre}`, `Cidade: ${selectedEvent.city}`, result.idealProfile?.ageRange || "Jovens 18-35 anos"],
        segments: result.recommendations?.map(r => r.sponsor) || ['mainstream_audience'],
        estimatedReach: result.audienceSize?.withinDatabase || 15000,
        confidence: 0.85
      })

      toast({
        title: "Analysis complete",
        description: "Target audience suggestions generated successfully"
      })
    } catch (error: any) {
      console.error('Error generating target audience:', error)
      toast({
        title: "Error generating analysis",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePricingOptimization = async () => {
    if (!selectedEvent) return

    setPricingLoading(true)
    try {
      const result = await mlService.runPricing({
        event: {
          genre: selectedEvent.genre,
          city: selectedEvent.city,
          venue: selectedEvent.venue,
          capacity: selectedEvent.capacity,
          date: selectedEvent.date,
          dayOfWeek: selectedEvent.day_of_week,
          weather: {
            temp: selectedEvent.temp_c,
            precipitation: selectedEvent.precip_mm
          }
        },
        historicalSales: []
      })

      setPricingResult(result)
      toast({
        title: "Pricing optimization complete",
        description: `Optimal price: R$ ${result.recommendedPrices.pista.optimal}`
      })
    } catch (error: any) {
      console.error('Error running pricing optimization:', error)
      toast({
        title: "Error running optimization",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setPricingLoading(false)
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
        
        <Button 
          className="gap-2 bg-gradient-primary hover:bg-gradient-primary/90"
          onClick={() => {
            setEditingEvent(null)
            setEventDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      <EventFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        genres={genres}
        cities={cities}
      />

      {/* Events List */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Upcoming Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingEvent(null)
                  setEventDialogOpen(true)
                }}
              >
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
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
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-lg font-bold">R$ {(event.revenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {(((event.sold_tickets || 0) / event.capacity) * 100).toFixed(1)}% sold
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingEvent(event)
                        setEventDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEventToDelete(event)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
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
                    <label className="text-sm font-medium">Current Pista Price (R$)</label>
                    <Input 
                      type="number" 
                      value={priceInputs.pista || selectedEvent?.ticket_price || 0}
                      onChange={(e) => setPriceInputs({...priceInputs, pista: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Marketing Budget (R$)</label>
                    <Input 
                      type="number" 
                      value={priceInputs.marketing || selectedEvent?.marketing_spend || 0}
                      onChange={(e) => setPriceInputs({...priceInputs, marketing: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                    onClick={handlePricingOptimization}
                    disabled={pricingLoading || !selectedEvent}
                  >
                    {pricingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                {pricingResult ? (
                  <>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-medium text-primary">Optimal Pricing Strategy</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Confidence: {pricingResult.confidence} - Based on {pricingResult.dataUsed?.length || 0} data sources
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pista (Recommended)</span>
                        <span className="font-bold">R$ {pricingResult.recommendedPrices.pista.optimal}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Range</span>
                        <span>R$ {pricingResult.recommendedPrices.pista.min} - R$ {pricingResult.recommendedPrices.pista.max}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">VIP (Recommended)</span>
                        <span className="font-bold">R$ {pricingResult.recommendedPrices.vip.optimal}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-2">Key Factors:</p>
                        {pricingResult.analysis?.map((factor: any, idx: number) => (
                          <div key={idx} className="text-sm mb-2">
                            <span className="font-medium">{factor.factor}:</span>
                            <span className="text-muted-foreground ml-1">{factor.impact}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-2">Recommendations:</p>
                        {pricingResult.recommendations?.map((rec: string, idx: number) => (
                          <p key={idx} className="text-sm text-muted-foreground">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Run pricing optimization to see AI recommendations</p>
                  </div>
                )}
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

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSave={handleSaveEvent}
        event={editingEvent}
        genres={genres}
        cities={cities}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.artist} - {eventToDelete?.venue}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Events