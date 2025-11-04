import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (eventData: any) => Promise<void>
  event?: any
  genres: string[]
  cities: string[]
}

export function EventDialog({ open, onOpenChange, onSave, event, genres, cities }: EventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    event_id: '',
    artist: '',
    venue: '',
    city: '',
    genre: '',
    date: '',
    day_of_week: '',
    capacity: '',
    ticket_price: '',
    marketing_spend: '',
    google_trends_genre: '50',
    instagram_mentions: '0',
    temp_c: '25',
    precip_mm: '0',
    is_holiday_brazil_hint: '0',
    sold_tickets: '',
    revenue: ''
  })

  useEffect(() => {
    if (event) {
      setFormData({
        event_id: event.event_id?.toString() || '',
        artist: event.artist || '',
        venue: event.venue || '',
        city: event.city || '',
        genre: event.genre || '',
        date: event.date || '',
        day_of_week: event.day_of_week || '',
        capacity: event.capacity?.toString() || '',
        ticket_price: event.ticket_price?.toString() || '',
        marketing_spend: event.marketing_spend?.toString() || '',
        google_trends_genre: event.google_trends_genre?.toString() || '50',
        instagram_mentions: event.instagram_mentions?.toString() || '0',
        temp_c: event.temp_c?.toString() || '25',
        precip_mm: event.precip_mm?.toString() || '0',
        is_holiday_brazil_hint: event.is_holiday_brazil_hint?.toString() || '0',
        sold_tickets: event.sold_tickets?.toString() || '',
        revenue: event.revenue?.toString() || ''
      })
    } else {
      setFormData({
        event_id: Math.floor(Math.random() * 1000000).toString(),
        artist: '',
        venue: '',
        city: '',
        genre: '',
        date: '',
        day_of_week: '',
        capacity: '',
        ticket_price: '',
        marketing_spend: '',
        google_trends_genre: '50',
        instagram_mentions: '0',
        temp_c: '25',
        precip_mm: '0',
        is_holiday_brazil_hint: '0',
        sold_tickets: '',
        revenue: ''
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const eventData = {
        event_id: parseInt(formData.event_id),
        artist: formData.artist,
        venue: formData.venue,
        city: formData.city,
        genre: formData.genre,
        date: formData.date,
        day_of_week: formData.day_of_week,
        capacity: parseInt(formData.capacity),
        ticket_price: parseFloat(formData.ticket_price),
        marketing_spend: parseFloat(formData.marketing_spend),
        google_trends_genre: parseFloat(formData.google_trends_genre),
        instagram_mentions: parseInt(formData.instagram_mentions),
        temp_c: parseFloat(formData.temp_c),
        precip_mm: parseFloat(formData.precip_mm),
        is_holiday_brazil_hint: parseInt(formData.is_holiday_brazil_hint),
        sold_tickets: formData.sold_tickets ? parseInt(formData.sold_tickets) : null,
        revenue: formData.revenue ? parseFloat(formData.revenue) : null
      }
      await onSave(eventData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.date) {
      const date = new Date(formData.date)
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      setFormData(prev => ({ ...prev, day_of_week: days[date.getDay()] }))
    }
  }, [formData.date])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update event details' : 'Add a new event to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_price">Ticket Price (R$) *</Label>
              <Input
                id="ticket_price"
                type="number"
                step="0.01"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketing_spend">Marketing Budget (R$) *</Label>
              <Input
                id="marketing_spend"
                type="number"
                step="0.01"
                value={formData.marketing_spend}
                onChange={(e) => setFormData({ ...formData, marketing_spend: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sold_tickets">Tickets Sold</Label>
              <Input
                id="sold_tickets"
                type="number"
                value={formData.sold_tickets}
                onChange={(e) => setFormData({ ...formData, sold_tickets: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue (R$)</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:bg-gradient-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
