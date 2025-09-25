// Mock data for EventVision Analytics

export interface Customer {
  id: string
  email: string
  name: string
  birthDate: string
  gender: string
  city: string
  state: string
  lifetimeValue: number
  visitsCount: number
  avgTicketBar: number
  favoriteDrink: string
  marketingConsent: boolean
  segment?: string
}

export interface Event {
  id: string
  name: string
  date: string
  venue: string
  city: string
  capacity: number
  description: string
  genreTags: string[]
  basePrice: number
  vipBasePrice: number
  soldTickets: number
  revenue: number
}

export interface Segment {
  id: string
  name: string
  description: string
  size: number
  avgLifetimeValue: number
  avgAge: number
  topCity: string
  preferredItems: string[]
  color: string
}

export interface Sponsor {
  id: string
  name: string
  category: string
  brandKeywords: string[]
  targetAudience: string
  budget: number
  affinity: number
}

// Generate mock customers
export const mockCustomers: Customer[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `customer_${i + 1}`,
  email: `user${i + 1}@example.com`,
  name: `Customer ${i + 1}`,
  birthDate: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  gender: Math.random() > 0.5 ? 'M' : 'F',
  city: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador'][Math.floor(Math.random() * 5)],
  state: 'SP',
  lifetimeValue: Math.floor(Math.random() * 5000) + 200,
  visitsCount: Math.floor(Math.random() * 20) + 1,
  avgTicketBar: Math.floor(Math.random() * 200) + 50,
  favoriteDrink: ['Cerveja', 'Drink', 'Energético', 'Água'][Math.floor(Math.random() * 4)],
  marketingConsent: Math.random() > 0.3,
}))

// Generate mock events
export const mockEvents: Event[] = [
  {
    id: 'event_1',
    name: 'Festa Eletrônica Summer',
    date: '2024-01-15',
    venue: 'Arena Festival',
    city: 'São Paulo',
    capacity: 5000,
    description: 'Grande festival de música eletrônica com DJs internacionais',
    genreTags: ['eletrônica', 'festival'],
    basePrice: 120,
    vipBasePrice: 300,
    soldTickets: 4200,
    revenue: 980000
  },
  {
    id: 'event_2',
    name: 'Show Sertanejo Raiz',
    date: '2024-02-20',
    venue: 'Estádio Municipal',
    city: 'Goiânia',
    capacity: 8000,
    description: 'Show tradicional de sertanejo raiz com grandes artistas',
    genreTags: ['sertanejo', 'tradicional'],
    basePrice: 80,
    vipBasePrice: 200,
    soldTickets: 7500,
    revenue: 1200000
  },
  {
    id: 'event_3',
    name: 'Rock in Concert',
    date: '2024-03-10',
    venue: 'Casa de Shows Rock',
    city: 'Rio de Janeiro',
    capacity: 3000,
    description: 'Noite especial de rock nacional e internacional',
    genreTags: ['rock', 'nacional'],
    basePrice: 100,
    vipBasePrice: 250,
    soldTickets: 2800,
    revenue: 520000
  }
]

// Mock segments
export const mockSegments: Segment[] = [
  {
    id: 'seg_1',
    name: 'VIP Spenders',
    description: 'Clientes de alto valor com preferência por experiências premium',
    size: 150,
    avgLifetimeValue: 3200,
    avgAge: 32,
    topCity: 'São Paulo',
    preferredItems: ['Drink Premium', 'Champagne', 'Whisky'],
    color: '#9333EA'
  },
  {
    id: 'seg_2',
    name: 'Party Goers',
    description: 'Jovens frequentadores de festas com alta socialização',
    size: 380,
    avgLifetimeValue: 1200,
    avgAge: 24,
    topCity: 'Rio de Janeiro',
    preferredItems: ['Cerveja', 'Energético', 'Shots'],
    color: '#3B82F6'
  },
  {
    id: 'seg_3',
    name: 'Weekend Warriors',
    description: 'Profissionais que frequentam eventos nos fins de semana',
    size: 280,
    avgLifetimeValue: 1800,
    avgAge: 29,
    topCity: 'Belo Horizonte',
    preferredItems: ['Cerveja Premium', 'Drink', 'Petiscos'],
    color: '#10B981'
  },
  {
    id: 'seg_4',
    name: 'Casual Visitors',
    description: 'Visitantes ocasionais com consumo moderado',
    size: 190,
    avgLifetimeValue: 450,
    avgAge: 27,
    topCity: 'Brasília',
    preferredItems: ['Cerveja', 'Água', 'Refrigerante'],
    color: '#F59E0B'
  }
]

// Mock sponsors
export const mockSponsors: Sponsor[] = [
  {
    id: 'sponsor_1',
    name: 'Cervejaria Premium',
    category: 'Cerveja',
    brandKeywords: ['lager', 'premium', 'artesanal'],
    targetAudience: 'Adultos 25-40 anos',
    budget: 500000,
    affinity: 85
  },
  {
    id: 'sponsor_2',
    name: 'Energy Plus',
    category: 'Energético',
    brandKeywords: ['energia', 'noite', 'festa'],
    targetAudience: 'Jovens 18-30 anos',
    budget: 300000,
    affinity: 78
  },
  {
    id: 'sponsor_3',
    name: 'Banco Digital',
    category: 'Fintech',
    brandKeywords: ['cartão', 'sem anuidade', 'cashback'],
    targetAudience: 'Jovens profissionais',
    budget: 750000,
    affinity: 62
  }
]

// Analytics data for dashboard
export const dashboardMetrics = {
  totalRevenue: 2700000,
  totalCustomers: 1000,
  avgTicketValue: 165,
  totalEvents: 15,
  revenueGrowth: 23.5,
  customerGrowth: 18.2,
  ticketGrowth: -2.1,
  eventGrowth: 12.8
}

// Sales by hour data
export const salesByHour = Array.from({ length: 24 }, (_, hour) => ({
  hour: `${hour.toString().padStart(2, '0')}:00`,
  sales: Math.floor(Math.random() * 100) + 10,
  revenue: Math.floor(Math.random() * 50000) + 5000
}))

// Top items consumption
export const topItems = [
  { name: 'Cerveja Long Neck', sales: 2847, revenue: 34164 },
  { name: 'Drink Gin Tônica', sales: 1923, revenue: 57690 },
  { name: 'Energético', sales: 1456, revenue: 21840 },
  { name: 'Whisky Dose', sales: 892, revenue: 35680 },
  { name: 'Água 500ml', sales: 2341, revenue: 9364 }
]