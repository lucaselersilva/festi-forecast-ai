import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ClientData {
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  genero?: string;
  aniversario?: string;
  id_evento?: string;
  aplicativo_ativo?: boolean;
  presencas?: number;
  consumo?: number;
  primeira_entrada?: string;
  ultima_visita?: string;
  primeira_interacao?: string;
  primeira_utilizacao?: boolean;
}

interface UpsertResult {
  inserted: number;
  updated: number;
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

    const { clients } = await req.json();
    if (!Array.isArray(clients)) {
      throw new Error('Clients must be an array');
    }

    const result: UpsertResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const client of clients) {
      try {
        const cpf = client.cpf?.trim();
        const telefone = client.telefone?.trim();
        const nome = client.nome?.trim().toLowerCase();
        
        // Buscar cliente existente por CPF (se tiver) ou telefone+nome
        let existing = null;
        
        if (cpf) {
          const { data } = await supabase
            .from('valle_clientes')
            .select('*')
            .eq('cpf', cpf)
            .eq('tenant_id', tenantId)
            .single();
          existing = data;
        } else if (telefone && nome) {
          // Se não tem CPF, busca por telefone + nome
          const { data } = await supabase
            .from('valle_clientes')
            .select('*')
            .eq('tenant_id', tenantId)
            .ilike('nome', nome)
            .eq('telefone', telefone)
            .single();
          existing = data;
        }

        if (!existing) {
          // Cliente novo - INSERT
          // Usar upsert para evitar conflitos de constraint
          const upsertData = { ...client, tenant_id: tenantId };
          const onConflict = cpf ? 'cpf,tenant_id' : 'telefone,tenant_id';
          
          const { error } = await supabase
            .from('valle_clientes')
            .upsert(upsertData, {
              onConflict: onConflict,
              ignoreDuplicates: false
            });
          
          if (error) throw error;
          result.inserted++;
        } else {
          // Cliente existe - verificar se é mesma visita
          const sameVisit = 
            (client.ultima_visita && existing.ultima_visita && 
             new Date(client.ultima_visita).getTime() === new Date(existing.ultima_visita).getTime()) ||
            (client.id_evento && existing.id_evento && client.id_evento === existing.id_evento);

          if (sameVisit) {
            // Mesma visita/evento - SKIP
            result.skipped++;
            continue;
          }

          // Visita diferente - UPDATE acumulando dados
          const newUltimaVisita = client.ultima_visita && existing.ultima_visita
            ? new Date(client.ultima_visita) > new Date(existing.ultima_visita)
              ? client.ultima_visita
              : existing.ultima_visita
            : client.ultima_visita || existing.ultima_visita;

          const updates: any = {
            presencas: (existing.presencas || 0) + (client.presencas || 1),
            consumo: (existing.consumo || 0) + (client.consumo || 0),
            ultima_visita: newUltimaVisita,
            updated_at: new Date().toISOString()
          };

          // Atualizar contador de dias da semana
          if (client.ultima_visita) {
            const visitDate = new Date(client.ultima_visita);
            const dayOfWeek = visitDate.getUTCDay();
            
            const existingDays = existing.dias_semana_visitas || 
              {"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0};
            
            updates.dias_semana_visitas = {
              ...existingDays,
              [dayOfWeek]: (existingDays[dayOfWeek] || 0) + 1
            };
          }

          // Atualizar email/telefone se mudaram
          if (client.email && client.email !== existing.email) {
            updates.email = client.email;
          }
          if (client.telefone && client.telefone !== existing.telefone) {
            updates.telefone = client.telefone;
          }

          // Se aplicativo_ativo mudar para true, manter true
          if (client.aplicativo_ativo === true && !existing.aplicativo_ativo) {
            updates.aplicativo_ativo = true;
          }

          // Preservar primeira_entrada (não sobrescrever)
          if (client.id_evento && !existing.id_evento) {
            updates.id_evento = client.id_evento;
          }

          const { error } = await supabase
            .from('valle_clientes')
            .update(updates)
            .eq('id', existing.id)
            .eq('tenant_id', tenantId);

          if (error) throw error;
          result.updated++;
        }
      } catch (error: any) {
        result.errors.push(`Erro no cliente ${client.nome}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in valle-smart-upsert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
