import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      throw new Error('Tenant not found');
    }

    console.log('Starting migration for tenant:', tenantId);

    // Buscar clientes com dias_semana_visitas zerados usando paginação
    let allClientes: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: clientesPage, error: fetchError } = await supabase
        .from('valle_clientes')
        .select('id, ultima_visita, primeira_entrada, presencas')
        .eq('tenant_id', tenantId)
        .eq('dias_semana_visitas', '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}')
        .range(from, to);

      if (fetchError) {
        throw new Error(`Error fetching clients: ${fetchError.message}`);
      }

      if (!clientesPage || clientesPage.length === 0) {
        hasMore = false;
      } else {
        allClientes = allClientes.concat(clientesPage);
        console.log(`Fetched page ${page + 1}, total clients so far: ${allClientes.length}`);
        
        if (clientesPage.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    const clientes = allClientes;

    const result: MigrationResult = {
      migrated: 0,
      skipped: 0,
      errors: []
    };

    if (!clientes || clientes.length === 0) {
      console.log('No clients to migrate');
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${clientes.length} clients to migrate`);

    // Processar em batches de 100
    const batchSize = 100;
    for (let i = 0; i < clientes.length; i += batchSize) {
      const batch = clientes.slice(i, i + batchSize);
      
      for (const cliente of batch) {
        try {
          const visitDate = cliente.ultima_visita || cliente.primeira_entrada;
          
          if (!visitDate) {
            result.skipped++;
            continue;
          }

          // Calcular dia da semana (0-6) usando timezone local
          const dayOfWeek = new Date(visitDate).getDay();
          const visitCount = cliente.presencas || 1;

          // Criar objeto com o contador no dia correto
          const diasSemanaVisitas: Record<string, number> = {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
            "6": 0
          };
          diasSemanaVisitas[dayOfWeek.toString()] = visitCount;

          // Atualizar cliente
          const { error: updateError } = await supabase
            .from('valle_clientes')
            .update({ dias_semana_visitas: diasSemanaVisitas })
            .eq('id', cliente.id)
            .eq('tenant_id', tenantId);

          if (updateError) {
            result.errors.push(`Error updating client ${cliente.id}: ${updateError.message}`);
          } else {
            result.migrated++;
          }
        } catch (error: any) {
          result.errors.push(`Error processing client ${cliente.id}: ${error.message}`);
        }
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(clientes.length / batchSize)}`);
    }

    console.log('Migration completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in valle-migrate-days:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
