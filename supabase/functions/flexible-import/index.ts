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
  warningDetails?: ValidationError[]
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

    // If importing, process raw_data directly with mappings
    if (action === 'import') {
      const rawData = staging.raw_data as any[]
      const importMappings = mappings as Record<string, string>
      
      if (!rawData || rawData.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Nenhum dado encontrado na sessão.' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      if (!importMappings || Object.keys(importMappings).length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Mapeamentos não encontrados. Execute a validação primeiro.' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Start background job
      await supabaseClient
        .from('import_staging')
        .update({
          job_status: 'processing',
          job_started_at: new Date().toISOString(),
          job_progress: 0
        })
        .eq('session_id', sessionId)

      // Process import in background
      const backgroundImportJob = async () => {
        try {
          console.log(`Starting background import of ${rawData.length} rows...`)
          const IMPORT_BATCH_SIZE = 100
          let insertedCount = 0
          let updatedCount = 0
          let skippedCount = 0
          
          // Process raw_data with mappings in batches
          for (let i = 0; i < rawData.length; i += IMPORT_BATCH_SIZE) {
            const batch = rawData.slice(i, Math.min(i + IMPORT_BATCH_SIZE, rawData.length))
            const progress = Math.round((i / rawData.length) * 100)
            
            console.log(`Processing batch ${i}-${i + batch.length} of ${rawData.length} (${progress}%)`)
            
            // Update progress
            await supabaseClient
              .from('import_staging')
              .update({ job_progress: progress })
              .eq('session_id', sessionId)

            // Apply mappings to each raw row in batch
            const processedBatch = batch
              .map((rawRow) => {
                const row: any = { tenant_id: staging.tenant_id }
                
                // Apply mappings
                for (const [sourceCol, targetField] of Object.entries(importMappings)) {
                  if (!targetField) continue
                  const value = rawRow[sourceCol]
                  try {
                    row[targetField] = normalizeValue(value, targetField)
                  } catch (error) {
                    console.error(`Error normalizing ${targetField}:`, error)
                    return null
                  }
                }
                
                // Validate required fields
                const requiredFields = getRequiredFields(targetTable)
                for (const field of requiredFields) {
                  if (!row[field] && field !== 'tenant_id') {
                    return null
                  }
                }
                
                return row
              })
              .filter(row => row !== null)

            // Process each valid row in batch
            for (const row of processedBatch) {
              try {
                // Check for duplicates based on target table
                let duplicateCheckResult
                
                if (targetTable === 'valle_clientes') {
                  // For valle_clientes: check by telefone + nome (lowercase)
                  const normalizedPhone = row.telefone?.toString().trim()
                  const normalizedName = row.nome?.toString().toLowerCase().trim()
                  
                  duplicateCheckResult = await supabaseClient
                    .from(targetTable)
                    .select('id')
                    .eq('tenant_id', staging.tenant_id)
                    .eq('telefone', normalizedPhone)
                    .ilike('nome', normalizedName)
                    .maybeSingle()
                } else {
                  // For other tables: check by cpf if available
                  if (row.cpf) {
                    duplicateCheckResult = await supabaseClient
                      .from(targetTable)
                      .select('id')
                      .eq('tenant_id', staging.tenant_id)
                      .eq('cpf', row.cpf)
                      .maybeSingle()
                  }
                }

                const existingRecord = duplicateCheckResult?.data

                if (existingRecord) {
                  // Update existing record
                  console.log(`Duplicate found for ${row.nome}, updating instead...`)
                  const { error: updateError } = await supabaseClient
                    .from(targetTable)
                    .update(row)
                    .eq('id', existingRecord.id)
                  
                  if (updateError) throw updateError
                  updatedCount++
                } else {
                  // Insert new record
                  const { error: insertError } = await supabaseClient
                    .from(targetTable)
                    .insert({ ...row, tenant_id: staging.tenant_id })
                  
                  if (insertError) {
                    // If unique constraint violation, try to update
                    if (insertError.code === '23505') {
                      console.log(`Unique constraint violation for ${row.nome}, attempting update...`)
                      const { error: updateError } = await supabaseClient
                        .from(targetTable)
                        .update(row)
                        .eq('tenant_id', staging.tenant_id)
                        .eq('telefone', row.telefone)
                      
                      if (!updateError) {
                        updatedCount++
                      } else {
                        skippedCount++
                      }
                    } else {
                      throw insertError
                    }
                  } else {
                    insertedCount++
                  }
                }
              } catch (error) {
                console.error(`Error processing row:`, error)
                skippedCount++
              }
            }
          }

          // Mark job as completed
          await supabaseClient
            .from('import_staging')
            .update({
              job_status: 'completed',
              job_progress: 100,
              job_completed_at: new Date().toISOString(),
              job_result: {
                inserted: insertedCount,
                updated: updatedCount,
                skipped: skippedCount
              }
            })
            .eq('session_id', sessionId)

          console.log(`Import completed: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`)
        } catch (error) {
          console.error('Background import job failed:', error)
          await supabaseClient
            .from('import_staging')
            .update({
              job_status: 'failed',
              job_error: error instanceof Error ? error.message : String(error),
              job_completed_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
        }
      }

      // Start background job without awaiting
      backgroundImportJob()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Import job started',
          sessionId 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check for status requests first
    if (action === 'status') {
      const { data: stagingStatus, error: statusError } = await supabaseClient
        .from('import_staging')
        .select('job_status, job_progress, job_error, job_result, job_started_at, job_completed_at')
        .eq('session_id', sessionId)
        .single()

      if (statusError || !stagingStatus) {
        throw new Error('Job not found')
      }

      return new Response(
        JSON.stringify(stagingStatus),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validation logic (only runs for action === 'validate')
    if (action === 'validate') {
      const rawData = staging.raw_data as any[]
      const validationErrors: ValidationError[] = []
      const warningDetails: ValidationError[] = []
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
            const normalizedValue = normalizeValue(value, targetField)
            mappedRow[targetField] = normalizedValue
            
            // Log datas para debug de recência
            if (targetField === 'ultima_visita' || targetField === 'primeira_entrada') {
              console.log(`Row ${index + 1} - ${targetField}: original="${value}" -> normalized="${normalizedValue}"`)
            }
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
        const emptyOptionalFields = optionalFields.filter(f => !mappedRow[f])
        if (emptyOptionalFields.length > 0) {
          warnings++
          emptyOptionalFields.forEach(field => {
            warningDetails.push({
              row: index + 1,
              field,
              message: 'Campo opcional vazio'
            })
          })
        }
      })
    }

      console.log(`Validation complete: ${validRows.length} valid, ${validationErrors.length} errors`)

      const result: ValidationResult = {
        valid: validRows.length,
        warnings,
        errors: validationErrors.length,
        errorDetails: validationErrors.slice(0, 100), // Limit to first 100 errors
        warningDetails: warningDetails.slice(0, 100) // Limit to first 100 warnings
      }

      // Update staging with validation results (não salvar mapped_data)
      await supabaseClient
        .from('import_staging')
        .update({
          validation_results: result,
          status: 'validated'
        })
        .eq('session_id', sessionId)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
  let parsedDate: Date | null = null
  
  // Try DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    const year = parseInt(ddmmyyyy[3])
    const month = parseInt(ddmmyyyy[2])
    const day = parseInt(ddmmyyyy[1])
    parsedDate = new Date(year, month - 1, day)
  }
  
  // Try YYYY-MM-DD (already correct)
  if (!parsedDate && str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    parsedDate = new Date(str)
  }
  
  // Try Excel serial number
  if (!parsedDate) {
    const num = parseFloat(str)
    if (!isNaN(num) && num > 0 && num < 100000) {
      const excelEpoch = new Date(1900, 0, 1)
      const days = Math.floor(num) - 2
      parsedDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000)
    }
  }
  
  // Validar se a data está em um intervalo razoável
  if (parsedDate) {
    const minDate = new Date('1900-01-01')
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    
    if (parsedDate < minDate || parsedDate > maxDate) {
      console.warn(`Data fora do intervalo válido: ${parsedDate.toISOString()} (original: ${value})`)
      return null
    }
    
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Data inválida após parse: ${value}`)
    }
    
    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
  
  let parsedDate: Date | null = null
  
  // 1. Try DD/MM/YYYY HH:MM:SS (formato completo)
  const ddmmyyyyTime = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/)
  if (ddmmyyyyTime) {
    const year = parseInt(ddmmyyyyTime[3])
    const month = parseInt(ddmmyyyyTime[2])
    const day = parseInt(ddmmyyyyTime[1])
    const hour = parseInt(ddmmyyyyTime[4])
    const minute = parseInt(ddmmyyyyTime[5])
    const second = parseInt(ddmmyyyyTime[6])
    parsedDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  }
  
  // 2. Try DD/MM/YYYY (apenas data - assumir 00:00:00)
  if (!parsedDate) {
    const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ddmmyyyy) {
      const year = parseInt(ddmmyyyy[3])
      const month = parseInt(ddmmyyyy[2])
      const day = parseInt(ddmmyyyy[1])
      parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    }
  }
  
  // 3. Try ISO format (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS)
  if (!parsedDate && str.match(/^\d{4}-\d{2}-\d{2}/)) {
    parsedDate = new Date(str.includes('T') ? str : str + 'T00:00:00Z')
  }
  
  // 4. Detectar se é número (pode ser Excel serial ou timestamp Unix)
  if (!parsedDate) {
    const num = parseFloat(str)
    if (!isNaN(num)) {
      // Se número muito grande, pode ser timestamp Unix (milissegundos desde 1970)
      if (num > 1000000000000) {
        // Timestamp em milissegundos
        parsedDate = new Date(num)
      } else if (num > 1000000000) {
        // Timestamp em segundos
        parsedDate = new Date(num * 1000)
      } else if (num > 0 && num < 100000) {
        // Excel serial number (dias desde 1900-01-01)
        const excelEpoch = new Date(1900, 0, 1)
        const days = Math.floor(num) - 2 // -2 corrige bug do Excel
        const fractionalDay = num - Math.floor(num)
        const milliseconds = fractionalDay * 24 * 60 * 60 * 1000
        parsedDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds)
      }
    }
  }
  
  // Validar se a data está em um intervalo razoável (1900 a hoje + 1 ano)
  if (parsedDate) {
    const minDate = new Date('1900-01-01')
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    
    if (parsedDate < minDate || parsedDate > maxDate) {
      console.warn(`Data fora do intervalo válido: ${parsedDate.toISOString()} (original: ${value})`)
      return null
    }
    
    // Validar se a data é válida (não é NaN)
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Data inválida após parse: ${value}`)
    }
    
    return parsedDate.toISOString()
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
