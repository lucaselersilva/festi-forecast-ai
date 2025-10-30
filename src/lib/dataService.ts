import { supabase } from "@/integrations/supabase/client"

export interface EventData {
  event_id: number
  date: string
  city: string
  venue: string
  artist: string
  genre: string
  ticket_price: number
  marketing_spend: number
  google_trends_genre: number
  instagram_mentions: number
  temp_c: number
  precip_mm: number
  day_of_week: string
  is_holiday_brazil_hint: number
  capacity: number
  sold_tickets?: number
  revenue?: number
}

export interface ImportResult {
  success: boolean
  inserted: number
  updated: number
  errors: string[]
  total: number
}

class DataService {
  async loadEventsFromCSV(csvContent: string): Promise<EventData[]> {
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',')
    const events: EventData[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length !== headers.length) continue

      const event: EventData = {
        event_id: parseInt(values[0]),
        date: values[1],
        city: values[2],
        venue: values[3],
        artist: values[4],
        genre: values[5],
        ticket_price: parseFloat(values[6]),
        marketing_spend: parseFloat(values[7]),
        google_trends_genre: parseFloat(values[8]),
        instagram_mentions: parseInt(values[9]),
        temp_c: parseFloat(values[10]),
        precip_mm: parseFloat(values[11]),
        day_of_week: values[12],
        is_holiday_brazil_hint: parseInt(values[13]),
        capacity: parseInt(values[14]),
        sold_tickets: values[15] ? parseInt(values[15]) : undefined,
        revenue: values[16] ? parseFloat(values[16]) : undefined
      }
      events.push(event)
    }

    return events
  }

  async importEvents(events: EventData[], tenantId: string): Promise<ImportResult> {
    let inserted = 0
    let updated = 0
    const errors: string[] = []

    for (const event of events) {
      try {
        // Check if event already exists
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('event_id', event.event_id)
          .maybeSingle()

        if (existing) {
          // Update existing event
          const { error } = await supabase
            .from('events')
            .update({
              date: event.date,
              city: event.city,
              venue: event.venue,
              artist: event.artist,
              genre: event.genre,
              ticket_price: event.ticket_price,
              marketing_spend: event.marketing_spend,
              google_trends_genre: event.google_trends_genre,
              instagram_mentions: event.instagram_mentions,
              temp_c: event.temp_c,
              precip_mm: event.precip_mm,
              day_of_week: event.day_of_week,
              is_holiday_brazil_hint: event.is_holiday_brazil_hint,
              capacity: event.capacity,
              sold_tickets: event.sold_tickets,
              revenue: event.revenue
            })
            .eq('event_id', event.event_id)

          if (error) {
            errors.push(`Error updating event ${event.event_id}: ${error.message}`)
          } else {
            updated++
          }
        } else {
          // Insert new event
          const { error } = await supabase
            .from('events')
            .insert({
              ...event,
              tenant_id: tenantId
            })

          if (error) {
            errors.push(`Error inserting event ${event.event_id}: ${error.message}`)
          } else {
            inserted++
          }
        }
      } catch (error) {
        errors.push(`Unexpected error processing event ${event.event_id}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      inserted,
      updated,
      errors,
      total: events.length
    }
  }

  async getAllEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Error fetching events: ${error.message}`)
    }

    return data || []
  }

  async getEventsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(`Error fetching events: ${error.message}`)
    }

    return data || []
  }

  async getEventsByGenre(genre: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('genre', genre)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Error fetching events: ${error.message}`)
    }

    return data || []
  }

  async getEventMetrics() {
    const { data, error } = await supabase
      .from('events')
      .select('*')

    if (error) {
      throw new Error(`Error fetching events: ${error.message}`)
    }

    const events = data || []
    const totalEvents = events.length
    const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0)
    const avgTicketPrice = events.reduce((sum, event) => sum + event.ticket_price, 0) / totalEvents
    const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0)
    const totalSold = events.reduce((sum, event) => sum + (event.sold_tickets || 0), 0)
    const occupancyRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0

    return {
      totalEvents,
      totalRevenue,
      avgTicketPrice,
      occupancyRate,
      totalCapacity,
      totalSold
    }
  }

  async getSegmentAnalysis() {
    const { data, error } = await supabase
      .from('events')
      .select('*')

    if (error) {
      throw new Error(`Error fetching events for segments: ${error.message}`)
    }

    const events = data || []
    
    // Analyze by genre
    const genreStats = events.reduce((acc: any, event) => {
      if (!acc[event.genre]) {
        acc[event.genre] = {
          count: 0,
          totalRevenue: 0,
          totalSold: 0,
          totalCapacity: 0,
          avgPrice: 0,
          cities: new Set()
        }
      }
      acc[event.genre].count++
      acc[event.genre].totalRevenue += event.revenue || 0
      acc[event.genre].totalSold += event.sold_tickets || 0
      acc[event.genre].totalCapacity += event.capacity
      acc[event.genre].avgPrice += event.ticket_price
      acc[event.genre].cities.add(event.city)
      return acc
    }, {})

    // Convert to segments
    const segments = Object.entries(genreStats).map(([genre, stats]: [string, any]) => ({
      id: genre.toLowerCase().replace(/\s+/g, '-'),
      name: `${genre} Enthusiasts`,
      description: `Customers who prefer ${genre.toLowerCase()} events`,
      size: stats.count,
      avgLifetimeValue: stats.totalRevenue / stats.count,
      avgAge: 25 + Math.floor(Math.random() * 20), // Mock age data
      topCity: Array.from(stats.cities)[0],
      preferredItems: [genre, 'Live Music', 'Concerts'],
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    })).sort((a, b) => b.size - a.size).slice(0, 6)

    return segments
  }

  async getSponsorAnalysis() {
    const { data, error } = await supabase
      .from('events')
      .select('*')

    if (error) {
      throw new Error(`Error fetching events for sponsors: ${error.message}`)
    }

    const events = data || []
    
    // Analyze genres for sponsor affinity
    const genreStats = events.reduce((acc: any, event) => {
      if (!acc[event.genre]) {
        acc[event.genre] = {
          events: 0,
          totalRevenue: 0,
          totalAttendance: 0,
          avgPrice: 0
        }
      }
      acc[event.genre].events++
      acc[event.genre].totalRevenue += event.revenue || 0
      acc[event.genre].totalAttendance += event.sold_tickets || 0
      acc[event.genre].avgPrice += event.ticket_price
      return acc
    }, {})

    // Create sponsor categories based on genres
    const sponsors = Object.entries(genreStats).map(([genre, stats]: [string, any]) => {
      const avgPrice = stats.avgPrice / stats.events
      const category = avgPrice > 100 ? 'Premium' : avgPrice > 50 ? 'Mid-tier' : 'Mass Market'
      
      return {
        name: `${genre} Partner`,
        category,
        affinity: Math.min(95, (stats.totalRevenue / 1000000) * 10 + 60), // Scale affinity based on revenue
        budget: stats.totalRevenue * 0.05, // 5% of total revenue as potential budget
        keywords: [genre, 'Music', 'Entertainment']
      }
    }).sort((a, b) => b.affinity - a.affinity).slice(0, 8)

    return sponsors
  }
}

export const dataService = new DataService()