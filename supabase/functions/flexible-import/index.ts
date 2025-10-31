import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ValidationResult {
  valid: number
  warnings: number
  errors: number
  errorDetails: ValidationError[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, sessionId, mappings, targetTable } = await req.json()

    // Get staging data
    const { data: staging, error: stagingError } = await supabaseClient
      .from('import_staging')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (stagingError || !staging) {
      throw new Error('Dados de staging não encontrados')
    }

    const rawData = staging.raw_data as any[]
    const validationErrors: ValidationError[] = []
    const validRows: any[] = []
    let warnings = 0

    console.log(`Processing ${rawData.length} rows in batches...`)
    const BATCH_SIZE = 500

    // Process in batches to avoid CPU timeout
    for (let batchStart = 0; batchStart < rawData.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, rawData.length)
      const batch = rawData.slice(batchStart, batchEnd)
      
      console.log(`Processing batch ${batchStart}-${batchEnd} of ${rawData.length}`)

      // Apply mappings and validate
      batch.forEach((row, batchIndex) => {
        const index = batchStart + batchIndex
        const mappedRow: any = { tenant_id: staging.tenant_id }
        let hasError = false

        // Apply column mappings
        for (const [sourceCol, targetField] of Object.entries(mappings as Record<string, string>)) {
          if (!targetField) continue // Ignored column

          const value = row[sourceCol]
          
          // Type conversion and validation
          try {
            mappedRow[targetField] = normalizeValue(value, targetField)
          } catch (error) {
            console.error(`Row ${index + 1} - ${targetField} error:`, error)
            validationErrors.push({
              row: index + 1,
              field: targetField,
              message: error instanceof Error ? error.message : 'Erro desconhecido'
            })
            hasError = true
          }
        }

        // Required field validation (basic)
        const requiredFields = getRequiredFields(targetTable)
        for (const field of requiredFields) {
          if (!mappedRow[field] && field !== 'tenant_id') {
            validationErrors.push({
              row: index + 1,
              field,
              message: 'Campo obrigatório não preenchido'
            })
            hasError = true
          }
        }

        if (!hasError) {
          validRows.push(mappedRow)
        }

        // Count warnings (optional fields empty)
        const optionalFields = Object.keys(mappedRow).filter(k => !requiredFields.includes(k))
        if (optionalFields.some(f => !mappedRow[f])) {
          warnings++
        }
      })
    }

    console.log(`Validation complete: ${validRows.length} valid, ${validationErrors.length} errors`)

    const result: ValidationResult = {
      valid: validRows.length,
      warnings,
      errors: validationErrors.length,
      errorDetails: validationErrors.slice(0, 100) // Limit to first 100 errors
    }

    if (action === 'validate') {
      // Update staging with validation results
      await supabaseClient
        .from('import_staging')
        .update({
          mapped_data: validRows,
          validation_results: result,
          status: 'validated'
        })
        .eq('session_id', sessionId)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'import') {
      console.log(`Importing ${validRows.length} rows in batches...`)
      const IMPORT_BATCH_SIZE = 500
      let importedCount = 0
      
      // Insert valid rows into target table in batches
      for (let i = 0; i < validRows.length; i += IMPORT_BATCH_SIZE) {
        const batch = validRows.slice(i, Math.min(i + IMPORT_BATCH_SIZE, validRows.length))
        console.log(`Importing batch ${i}-${i + batch.length} of ${validRows.length}`)
        
        const { error: insertError } = await supabaseClient
          .from(targetTable)
          .insert(batch)

        if (insertError) {
          console.error(`Error importing batch ${i}:`, insertError)
          throw insertError
        }
        
        importedCount += batch.length
      }

      console.log(`Import complete: ${importedCount} rows imported`)

      // Update staging status
      await supabaseClient
        .from('import_staging')
        .update({ status: 'imported' })
        .eq('session_id', sessionId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importedCount 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    throw new Error('Ação inválida')

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function normalizeValue(value: any, fieldName: string): any {
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Date fields
  if (fieldName.includes('date') || fieldName === 'aniversario') {
    return parseDate(value)
  }

  // DateTime fields - usar endsWith() para ser mais específico
  if (fieldName.includes('timestamp') || 
      fieldName.endsWith('_entrada') || 
      fieldName.endsWith('_visita') || 
      fieldName.endsWith('_interacao')) {
    return parseDateTime(value)
  }

  // Number fields
  if (fieldName.includes('consumo') || fieldName.includes('presencas') || fieldName.includes('_id') || fieldName.includes('price') || fieldName.includes('spend') || fieldName.includes('value') || fieldName.includes('quantity')) {
    return parseNumber(value)
  }

  // Boolean fields
  if (fieldName.includes('ativo') || fieldName.includes('active') || fieldName.includes('utilizacao')) {
    return parseBoolean(value)
  }

  // CPF - remove non-digits
  if (fieldName === 'cpf') {
    return String(value).replace(/\D/g, '')
  }

  // Phone - remove non-digits
  if (fieldName.includes('telefone') || fieldName.includes('phone')) {
    return String(value).replace(/\D/g, '')
  }

  // Default: string
  return String(value).trim()
}

function parseDate(value: any): string | null {
  if (!value) return null
  
  const str = String(value).trim()
  
  // Try DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
  }
  
  // Try YYYY-MM-DD (already correct)
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return str
  }
  
  throw new Error(`Formato de data inválido: ${value}`)
}

function parseDateTime(value: any): string | null {
  if (!value) return null
  
  const str = String(value).trim()
  
  // 0. Tratar valores textuais que indicam ausência de data
  if (str.toLowerCase() === 'nunca' || str.toLowerCase() === 'never' || str === '-' || str === 'n/a') {
    return null
  }
  
  // 1. Try DD/MM/YYYY HH:MM:SS (formato completo)
  const ddmmyyyyTime = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/)
  if (ddmmyyyyTime) {
    return `${ddmmyyyyTime[3]}-${ddmmyyyyTime[2].padStart(2, '0')}-${ddmmyyyyTime[1].padStart(2, '0')}T${ddmmyyyyTime[4].padStart(2, '0')}:${ddmmyyyyTime[5].padStart(2, '0')}:${ddmmyyyyTime[6].padStart(2, '0')}Z`
  }
  
  // 2. Try DD/MM/YYYY (apenas data - assumir 00:00:00)
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}T00:00:00Z`
  }
  
  // 3. Try ISO format (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS)
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    if (str.includes('T')) {
      return str.endsWith('Z') ? str : str + 'Z'
    }
    return str + 'T00:00:00Z'
  }
  
  // 4. Try Excel serial number (números como 45287 = dias desde 1900-01-01)
  const num = parseFloat(str)
  if (!isNaN(num) && num > 0 && num < 100000) {
    // Excel serial date: days since 1900-01-01 (with bug: 1900 was not a leap year)
    const excelEpoch = new Date(1900, 0, 1)
    const days = Math.floor(num) - 2 // -2 corrige bug do Excel (1900 não foi ano bissexto)
    const fractionalDay = num - Math.floor(num)
    const milliseconds = fractionalDay * 24 * 60 * 60 * 1000
    
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds)
    
    return date.toISOString()
  }
  
  throw new Error(`Formato de data/hora inválido: ${value}`)
}

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  // Remove currency symbols, spaces, and convert comma to dot
  const cleaned = String(value)
    .replace(/[R$\s]/g, '')
    .replace(',', '.')
  
  const num = parseFloat(cleaned)
  if (isNaN(num)) {
    throw new Error(`Número inválido: ${value}`)
  }
  
  return num
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  
  const str = String(value).toLowerCase().trim()
  return ['true', 'yes', 'sim', '1', 'ativo', 'active'].includes(str)
}

function getRequiredFields(tableName: string): string[] {
  const schemas: Record<string, string[]> = {
    'valle_clientes': ['tenant_id', 'nome'],
    'customers': ['tenant_id', 'name', 'email', 'phone', 'birthdate', 'city', 'gender'],
    'events': ['tenant_id', 'event_id', 'date', 'city', 'venue', 'artist', 'genre', 'ticket_price', 'capacity'],
    'consumptions': ['tenant_id', 'customerid', 'eventid', 'item', 'quantity', 'totalvalue', 'timestamp']
  }
  
  return schemas[tableName] || ['tenant_id']
}
