export interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'email' | 'phone' | 'cpf'
  required: boolean
  description?: string
}

export interface ImportTargetSchema {
  name: string
  label: string
  tableName: string
  fields: FieldDefinition[]
}

export const VALLE_CLIENTES_SCHEMA: ImportTargetSchema = {
  name: 'valle_clientes',
  label: 'Valle Clientes',
  tableName: 'valle_clientes',
  fields: [
    { name: 'nome', label: 'Nome', type: 'text', required: true, description: 'Nome completo do cliente' },
    { name: 'cpf', label: 'CPF', type: 'cpf', required: false, description: 'CPF do cliente (apenas números)' },
    { name: 'email', label: 'E-mail', type: 'email', required: false, description: 'E-mail do cliente' },
    { name: 'telefone', label: 'Telefone', type: 'phone', required: false, description: 'Telefone do cliente' },
    { name: 'genero', label: 'Gênero', type: 'text', required: false, description: 'M para Masculino, F para Feminino' },
    { name: 'aniversario', label: 'Aniversário', type: 'date', required: false, description: 'Data de nascimento' },
    { name: 'aplicativo_ativo', label: 'Aplicativo Ativo', type: 'boolean', required: false, description: 'Se o cliente tem o app ativo' },
    { name: 'presencas', label: 'Presenças', type: 'number', required: false, description: 'Número de presenças' },
    { name: 'consumo', label: 'Consumo', type: 'number', required: false, description: 'Valor total de consumo' },
    { name: 'primeira_entrada', label: 'Primeira Entrada', type: 'datetime', required: false, description: 'Data da primeira visita' },
    { name: 'ultima_visita', label: 'Última Visita', type: 'datetime', required: false, description: 'Data da última visita' },
    { name: 'primeira_interacao', label: 'Primeira Interação', type: 'datetime', required: false, description: 'Data da primeira interação' },
    { name: 'primeira_utilizacao', label: 'Primeira Utilização', type: 'boolean', required: false, description: 'Se é a primeira utilização' },
    { name: 'id_evento', label: 'ID Evento', type: 'text', required: false, description: 'ID do evento relacionado' },
  ]
}

export const CUSTOMERS_SCHEMA: ImportTargetSchema = {
  name: 'customers',
  label: 'Customers',
  tableName: 'customers',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, description: 'Customer full name' },
    { name: 'email', label: 'Email', type: 'email', required: true, description: 'Customer email address' },
    { name: 'phone', label: 'Phone', type: 'phone', required: true, description: 'Customer phone number' },
    { name: 'birthdate', label: 'Birthdate', type: 'date', required: true, description: 'Date of birth' },
    { name: 'city', label: 'City', type: 'text', required: true, description: 'Customer city' },
    { name: 'gender', label: 'Gender', type: 'text', required: true, description: 'Customer gender' },
  ]
}

export const EVENTS_SCHEMA: ImportTargetSchema = {
  name: 'events',
  label: 'Events',
  tableName: 'events',
  fields: [
    { name: 'event_id', label: 'Event ID', type: 'number', required: true, description: 'Unique event identifier' },
    { name: 'date', label: 'Date', type: 'date', required: true, description: 'Event date' },
    { name: 'city', label: 'City', type: 'text', required: true, description: 'Event city' },
    { name: 'venue', label: 'Venue', type: 'text', required: true, description: 'Event venue' },
    { name: 'artist', label: 'Artist', type: 'text', required: true, description: 'Artist name' },
    { name: 'genre', label: 'Genre', type: 'text', required: true, description: 'Music genre' },
    { name: 'ticket_price', label: 'Ticket Price', type: 'number', required: true, description: 'Ticket price' },
    { name: 'capacity', label: 'Capacity', type: 'number', required: true, description: 'Venue capacity' },
    { name: 'marketing_spend', label: 'Marketing Spend', type: 'number', required: false, description: 'Marketing budget' },
    { name: 'google_trends_genre', label: 'Google Trends', type: 'number', required: false, description: 'Google Trends score' },
    { name: 'instagram_mentions', label: 'Instagram Mentions', type: 'number', required: false, description: 'Instagram mentions count' },
    { name: 'temp_c', label: 'Temperature (°C)', type: 'number', required: false, description: 'Temperature in Celsius' },
    { name: 'precip_mm', label: 'Precipitation (mm)', type: 'number', required: false, description: 'Precipitation in mm' },
    { name: 'day_of_week', label: 'Day of Week', type: 'text', required: false, description: 'Day of the week' },
    { name: 'is_holiday_brazil_hint', label: 'Is Holiday', type: 'number', required: false, description: '1 if holiday, 0 otherwise' },
    { name: 'sold_tickets', label: 'Sold Tickets', type: 'number', required: false, description: 'Number of tickets sold' },
    { name: 'revenue', label: 'Revenue', type: 'number', required: false, description: 'Total revenue' },
  ]
}

export const CONSUMPTIONS_SCHEMA: ImportTargetSchema = {
  name: 'consumptions',
  label: 'Consumptions',
  tableName: 'consumptions',
  fields: [
    { name: 'customerid', label: 'Customer ID', type: 'number', required: true, description: 'Customer identifier' },
    { name: 'eventid', label: 'Event ID', type: 'number', required: true, description: 'Event identifier' },
    { name: 'item', label: 'Item', type: 'text', required: true, description: 'Item name' },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Item quantity' },
    { name: 'totalvalue', label: 'Total Value', type: 'number', required: true, description: 'Total value' },
    { name: 'timestamp', label: 'Timestamp', type: 'datetime', required: true, description: 'Purchase timestamp' },
  ]
}

export const IMPORT_SCHEMAS: ImportTargetSchema[] = [
  VALLE_CLIENTES_SCHEMA,
  CUSTOMERS_SCHEMA,
  EVENTS_SCHEMA,
  CONSUMPTIONS_SCHEMA
]

export function getSchemaByName(name: string): ImportTargetSchema | undefined {
  return IMPORT_SCHEMAS.find(s => s.name === name)
}

// Helper function to suggest field mapping based on column name similarity
export function suggestFieldMapping(columnName: string, schema: ImportTargetSchema): string | null {
  const normalized = columnName.toLowerCase().trim()
  
  const synonyms: Record<string, string[]> = {
    nome: ['name', 'nome', 'customer name', 'full name', 'fullname'],
    cpf: ['cpf', 'document', 'tax id', 'taxid'],
    email: ['email', 'e-mail', 'mail', 'electronic mail'],
    telefone: ['phone', 'telefone', 'tel', 'telephone', 'cellphone', 'mobile'],
    genero: ['gender', 'genero', 'gênero', 'sex', 'sexo'],
    aniversario: ['birthday', 'birthdate', 'aniversario', 'aniversário', 'date of birth', 'dob', 'nascimento'],
    aplicativo_ativo: ['app active', 'aplicativo ativo', 'active app', 'has app'],
    presencas: ['presencas', 'presenças', 'attendance', 'visits', 'checkins'],
    consumo: ['consumo', 'consumption', 'spend', 'total spend', 'spending'],
    primeira_entrada: ['primeira entrada', 'first entry', 'first visit', 'first checkin'],
    ultima_visita: ['ultima visita', 'última visita', 'last visit', 'last checkin'],
    event_id: ['event id', 'eventid', 'event_id', 'event code', 'codigo evento'],
    date: ['date', 'data', 'event date', 'data evento'],
    city: ['city', 'cidade', 'location', 'local'],
    venue: ['venue', 'local', 'place', 'casa'],
    artist: ['artist', 'artista', 'band', 'banda'],
    genre: ['genre', 'genero musical', 'style', 'estilo'],
    capacity: ['capacity', 'capacidade', 'max capacity'],
    sold_tickets: ['sold tickets', 'tickets sold', 'ingressos vendidos'],
    revenue: ['revenue', 'receita', 'faturamento'],
  }
  
  for (const [fieldName, synonymList] of Object.entries(synonyms)) {
    if (synonymList.some(syn => normalized.includes(syn) || syn.includes(normalized))) {
      if (schema.fields.find(f => f.name === fieldName)) {
        return fieldName
      }
    }
  }
  
  return null
}
