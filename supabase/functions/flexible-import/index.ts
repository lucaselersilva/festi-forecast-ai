import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Declare EdgeRuntime global
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Listen for function shutdown
addEventListener('beforeunload', (ev: any) => {
  console.log('Function shutdown due to:', ev.detail?.reason)
})

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

    const CHUNK_SIZE = 20 // Process only 20 records per chunk for reliability
    const IMPORT_BATCH_SIZE = 20 // Process all records in batch at once for bulk operations
    const CHUNK_TIMEOUT_MS = 15000 // 15 seconds timeout per chunk
    const STATUS_CHECK_FREQUENCY = 3 // Check job_status every N batches
    const PROGRESS_UPDATE_RECORDS = 50 // Update progress every N records
    const SESSION_EXPIRY_MINUTES = 5 // Consider sessions older than 5 minutes as expired

    const { action, sessionId, mappings, targetTable, startIndex } = await req.json()

    // Clean stuck/old processing sessions BEFORE fetching staging data
    const expiryTime = new Date(Date.now() - SESSION_EXPIRY_MINUTES * 60 * 1000).toISOString()
    console.log(`[${action.toUpperCase()}] Cleaning stuck sessions started before ${expiryTime}`)
    
    const { error: cleanupError } = await supabaseClient
      .from('import_staging')
      .delete()
      .eq('job_status', 'processing')
      .lt('job_started_at', expiryTime)
    
    if (cleanupError) {
      console.error('[CLEANUP] Error cleaning stuck sessions:', cleanupError)
    } else {
      console.log('[CLEANUP] Stuck sessions cleaned successfully')
    }

    // Get staging data
    const { data: staging, error: stagingError } = await supabaseClient
      .from('import_staging')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (stagingError || !staging) {
      console.log(`[ERROR] Staging data not found for session ${sessionId}`)
      return new Response(
        JSON.stringify({ error: 'Dados de staging não encontrados' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If importing, process raw_data directly with mappings
    if (action === 'import') {
      const chunkStartTime = Date.now()
      console.log(`[IMPORT ${new Date().toISOString()}] Starting chunk for session: ${sessionId}, startIndex: ${startIndex || 0}`)

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

      // Process import in chunks - only process CHUNK_SIZE records per call
      try {
        const currentStartIndex = startIndex || 0
        
        console.log(`[IMPORT ${new Date().toISOString()}] Starting chunk import from index ${currentStartIndex} of ${rawData.length} total rows...`)
        
        // Get existing progress from database
        const { data: existingProgress } = await supabaseClient
          .from('import_staging')
          .select('job_result')
          .eq('session_id', sessionId)
          .maybeSingle()
        
        const previousResult = existingProgress?.job_result || { inserted: 0, updated: 0, skipped: 0 }
        let insertedCount = previousResult.inserted || 0
        let updatedCount = previousResult.updated || 0
        let skippedCount = previousResult.skipped || 0
        let batchCounter = 0
        
        // Calculate chunk boundaries
        const chunkEnd = Math.min(currentStartIndex + CHUNK_SIZE, rawData.length)
        const chunk = rawData.slice(currentStartIndex, chunkEnd)
        
        console.log(`[IMPORT ${new Date().toISOString()}] Processing chunk: ${currentStartIndex}-${chunkEnd} (${chunk.length} rows)`)
        
        // Process this chunk in smaller batches for bulk DB operations
        for (let i = 0; i < chunk.length; i += IMPORT_BATCH_SIZE) {
            batchCounter++
            // Check chunk timeout
            const chunkElapsedTime = Date.now() - chunkStartTime
            if (chunkElapsedTime > CHUNK_TIMEOUT_MS) {
              console.error(`[IMPORT] Chunk timeout exceeded: ${chunkElapsedTime}ms`)
              return new Response(
                JSON.stringify({ 
                  error: 'Timeout ao processar chunk. Tente novamente com menos registros.',
                  progress: Math.round((currentStartIndex / rawData.length) * 100),
                  insertedCount,
                  updatedCount,
                  skippedCount
                }),
                { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            const batch = chunk.slice(i, Math.min(i + IMPORT_BATCH_SIZE, chunk.length))
            const absoluteIndex = currentStartIndex + i
            const progress = Math.round((absoluteIndex / rawData.length) * 100)
            
            console.log(`[IMPORT ${new Date().toISOString()}] Processing batch ${batchCounter} at index ${absoluteIndex} - Progress: ${progress}% - Session: ${sessionId}`)
            
            // Check if job was cancelled (only every STATUS_CHECK_FREQUENCY batches to reduce queries)
            if (batchCounter % STATUS_CHECK_FREQUENCY === 0) {
              const { data: jobCheck } = await supabaseClient
                .from('import_staging')
                .select('job_status')
                .eq('session_id', sessionId)
                .single()

              if (!jobCheck || jobCheck.job_status === 'cancelled') {
                console.log('Job cancelled by user, stopping...')
                await supabaseClient
                  .from('import_staging')
                  .update({
                    job_completed_at: new Date().toISOString(),
                    job_error: 'Cancelado pelo usuário'
                  })
                  .eq('session_id', sessionId)
                
                return new Response(
                  JSON.stringify({ 
                    success: false, 
                    message: 'Import cancelled by user' 
                  }),
                  { 
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  }
                )
              }
              
              // Update progress when checking status
              await supabaseClient
                .from('import_staging')
                .update({ job_progress: progress })
                .eq('session_id', sessionId)
            }

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
                
                // Track day of week for ultima_visita
                if (row.ultima_visita && importMappings.ultima_visita) {
                  const rawVisitDate = rawRow[importMappings.ultima_visita as string]
                  const { dayOfWeek } = parseDateTimeWithDayOfWeek(rawVisitDate)
                  
                  if (dayOfWeek !== null) {
                    // Initialize dias_semana_visitas with the day of this visit
                    row.dias_semana_visitas = {
                      "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0,
                      [dayOfWeek.toString()]: 1
                    }
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

            // SIMPLIFIED BULK UPSERT - Let Postgres handle duplicates
            if (processedBatch.length === 0) continue
            
            try {
              // Para valle_clientes: separar registros com CPF dos sem CPF
              // Registros com CPF usam cpf+tenant_id como conflito
              // Registros sem CPF usam telefone+tenant_id
              if (targetTable === 'valle_clientes') {
                const withCpf = processedBatch.filter(row => row.cpf)
                const withoutCpf = processedBatch.filter(row => !row.cpf)
                
                // Upsert registros com CPF
                if (withCpf.length > 0) {
                  const { error: cpfError } = await supabaseClient
                    .from(targetTable)
                    .upsert(withCpf, { 
                      onConflict: 'cpf,tenant_id',
                      ignoreDuplicates: false 
                    })
                  
                  if (cpfError) {
                    console.error('[IMPORT] Error upserting with CPF:', cpfError)
                    throw cpfError
                  }
                  insertedCount += withCpf.length
                }
                
                // Upsert registros sem CPF (usa telefone)
                if (withoutCpf.length > 0) {
                  const { error: phoneError } = await supabaseClient
                    .from(targetTable)
                    .upsert(withoutCpf, { 
                      onConflict: 'telefone,tenant_id',
                      ignoreDuplicates: false 
                    })
                  
                  if (phoneError) {
                    console.error('[IMPORT] Error upserting without CPF:', phoneError)
                    throw phoneError
                  }
                  insertedCount += withoutCpf.length
                }
              } else {
                // Para outras tabelas, usa email+tenant_id
                const { error: upsertError, data: upsertedData } = await supabaseClient
                  .from(targetTable)
                  .upsert(processedBatch, { 
                    onConflict: 'email,tenant_id',
                    ignoreDuplicates: false 
                  })
                  .select('id')
                
                if (upsertError) {
                  console.error('Upsert error:', upsertError)
                  skippedCount += processedBatch.length
                } else {
                  // Count as inserts (new records will have IDs returned)
                  const returnedCount = upsertedData?.length || 0
                  if (returnedCount > 0) {
                    insertedCount += returnedCount
                  } else {
                    // If no IDs returned, assume updates
                    updatedCount += processedBatch.length
                  }
                  console.log(`[UPSERT] Processed: ${processedBatch.length} records`)
                }
              }
              
            } catch (error) {
              console.error(`Error in upsert:`, error)
              skippedCount += processedBatch.length
            }
          }

        const nextIndex = chunkEnd
        const hasMore = nextIndex < rawData.length
        const progress = Math.round((nextIndex / rawData.length) * 100)
        
        // Update job progress in database
        await supabaseClient
          .from('import_staging')
          .update({
            job_status: hasMore ? 'processing' : 'completed',
            job_progress: progress,
            job_completed_at: hasMore ? null : new Date().toISOString(),
            job_result: {
              inserted: insertedCount,
              updated: updatedCount,
              skipped: skippedCount
            }
          })
          .eq('session_id', sessionId)

        const chunkDuration = Date.now() - chunkStartTime
        const recordsPerSecond = (chunk.length / (chunkDuration / 1000)).toFixed(2)
        
        console.log(`[IMPORT ${new Date().toISOString()}] Chunk completed in ${chunkDuration}ms (${recordsPerSecond} records/sec)`)
        console.log(`[IMPORT] Inserted: ${insertedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)
        console.log(`[IMPORT] Has more: ${hasMore}, Next index: ${nextIndex}, Progress: ${progress}%`)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: hasMore ? 'Chunk processed successfully' : 'Import completed successfully',
            insertedCount,
            updatedCount,
            skippedCount,
            hasMore,
            nextIndex,
            progress
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Import job failed:', error)
        await supabaseClient
          .from('import_staging')
          .update({
            job_status: 'failed',
            job_error: error instanceof Error ? error.message : String(error),
            job_completed_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
        
        throw error
      }
    }

    // Check for status requests first
    if (action === 'status') {
      const { data: stagingStatus, error: statusError } = await supabaseClient
        .from('import_staging')
        .select('job_status, job_progress, job_error, job_result, job_started_at, job_completed_at')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (statusError || !stagingStatus) {
        return new Response(
          JSON.stringify({ error: 'Sessão não encontrada ou expirada' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify(stagingStatus),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle cancel requests
    if (action === 'cancel') {
      await supabaseClient
        .from('import_staging')
        .update({ 
          job_status: 'cancelled',
          job_error: 'Cancelado pelo usuário',
          job_completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      return new Response(
        JSON.stringify({ success: true, message: 'Importação cancelada' }),
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
    try {
      return parseDateTime(value)
    } catch (error) {
      console.warn(`Failed to parse optional datetime field ${fieldName}: ${value}`)
      return null
    }
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
  
  // 1. Try DD/MM/YYYY HH:MM:SS (formato completo) - PRIORIDADE MÁXIMA
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
  
  // 4. Detectar se é número (pode ser Excel serial ou timestamp Unix) - ÚLTIMA PRIORIDADE
  if (!parsedDate) {
    const num = parseFloat(str)
    if (!isNaN(num)) {
      // Se número muito grande, pode ser timestamp Unix (milissegundos desde 1970)
      if (num > 1000000000000) {
        parsedDate = new Date(num)
      } else if (num > 1000000000) {
        parsedDate = new Date(num * 1000)
      } else if (num > 0 && num < 100000) {
        const excelEpoch = new Date(1900, 0, 1)
        const days = Math.floor(num) - 2
        const fractionalDay = num - Math.floor(num)
        const milliseconds = fractionalDay * 24 * 60 * 60 * 1000
        parsedDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds)
      }
    }
  }
  
  // Validar se a data está em um intervalo razoável (2020 a hoje + 1 ano)
  if (parsedDate) {
    const minDate = new Date('2020-01-01') // Mudado de 1900 para 2020
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    
    if (parsedDate < minDate || parsedDate > maxDate) {
      console.warn(`Data fora do intervalo válido: ${parsedDate.toISOString()} (original: ${value})`)
      return null
    }
    
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Data inválida após parse: ${value}`)
    }
    
    return parsedDate.toISOString()
  }
  
  throw new Error(`Formato de data/hora inválido: ${value}`)
}

// Helper function to parse datetime and extract day of week
function parseDateTimeWithDayOfWeek(value: any): { date: string | null; dayOfWeek: number | null } {
  const parsedDate = parseDateTime(value)
  if (!parsedDate) return { date: null, dayOfWeek: null }
  
  const dateObj = new Date(parsedDate)
  const dayOfWeek = dateObj.getUTCDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  return { date: parsedDate, dayOfWeek }
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
