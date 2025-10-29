export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_runs: {
        Row: {
          constraints_json: Json | null
          created_at: string | null
          event_context_json: Json | null
          event_id: string | null
          goal: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          constraints_json?: Json | null
          created_at?: string | null
          event_context_json?: Json | null
          event_id?: string | null
          goal: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          constraints_json?: Json | null
          created_at?: string | null
          event_context_json?: Json | null
          event_id?: string | null
          goal?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "analysis_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_analogs"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "analysis_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_context"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "analysis_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_perf"
            referencedColumns: ["event_id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: number
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: number
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      birthday_cluster_actions: {
        Row: {
          actions: Json
          cluster_name: string
          cluster_size: number
          created_at: string | null
          id: string
          month: number
          updated_at: string | null
          year: number
        }
        Insert: {
          actions: Json
          cluster_name: string
          cluster_size: number
          created_at?: string | null
          id?: string
          month: number
          updated_at?: string | null
          year?: number
        }
        Update: {
          actions?: Json
          cluster_name?: string
          cluster_size?: number
          created_at?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      consumptions: {
        Row: {
          customerid: number
          eventid: number
          id: number
          item: string
          quantity: number
          timestamp: string
          totalvalue: number
        }
        Insert: {
          customerid: number
          eventid: number
          id?: number
          item: string
          quantity: number
          timestamp?: string
          totalvalue: number
        }
        Update: {
          customerid?: number
          eventid?: number
          id?: number
          item?: string
          quantity?: number
          timestamp?: string
          totalvalue?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "consumptions_customerid_fkey"
            columns: ["customerid"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          birthdate: string
          city: string
          email: string
          gender: string
          id: number
          name: string
          phone: string
        }
        Insert: {
          birthdate: string
          city: string
          email: string
          gender: string
          id?: number
          name: string
          phone: string
        }
        Update: {
          birthdate?: string
          city?: string
          email?: string
          gender?: string
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      data_profiles: {
        Row: {
          created_at: string | null
          id: string
          payload_json: Json
          run_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload_json: Json
          run_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload_json?: Json
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_profiles_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artist: string
          capacity: number
          city: string
          created_at: string
          date: string
          day_of_week: string
          event_id: number
          genre: string
          google_trends_genre: number
          id: string
          instagram_mentions: number
          is_holiday_brazil_hint: number
          marketing_spend: number
          precip_mm: number
          revenue: number | null
          sold_tickets: number | null
          temp_c: number
          ticket_price: number
          updated_at: string
          venue: string
        }
        Insert: {
          artist: string
          capacity: number
          city: string
          created_at?: string
          date: string
          day_of_week: string
          event_id: number
          genre: string
          google_trends_genre: number
          id?: string
          instagram_mentions: number
          is_holiday_brazil_hint?: number
          marketing_spend: number
          precip_mm: number
          revenue?: number | null
          sold_tickets?: number | null
          temp_c: number
          ticket_price: number
          updated_at?: string
          venue: string
        }
        Update: {
          artist?: string
          capacity?: number
          city?: string
          created_at?: string
          date?: string
          day_of_week?: string
          event_id?: number
          genre?: string
          google_trends_genre?: number
          id?: string
          instagram_mentions?: number
          is_holiday_brazil_hint?: number
          marketing_spend?: number
          precip_mm?: number
          revenue?: number | null
          sold_tickets?: number | null
          temp_c?: number
          ticket_price?: number
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      findings: {
        Row: {
          created_at: string | null
          id: string
          payload_json: Json
          run_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload_json: Json
          run_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload_json?: Json
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_staging: {
        Row: {
          created_at: string | null
          file_name: string | null
          id: string
          mapped_data: Json | null
          raw_data: Json
          session_id: string
          source_name: string | null
          status: string | null
          total_rows: number | null
          updated_at: string | null
          validation_results: Json | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          mapped_data?: Json | null
          raw_data: Json
          session_id: string
          source_name?: string | null
          status?: string | null
          total_rows?: number | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          mapped_data?: Json | null
          raw_data?: Json
          session_id?: string
          source_name?: string | null
          status?: string | null
          total_rows?: number | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Relationships: []
      }
      import_templates: {
        Row: {
          column_mappings: Json
          created_at: string | null
          description: string | null
          field_transformations: Json | null
          id: string
          is_default: boolean | null
          name: string
          source_name: string
          updated_at: string | null
        }
        Insert: {
          column_mappings: Json
          created_at?: string | null
          description?: string | null
          field_transformations?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          source_name: string
          updated_at?: string | null
        }
        Update: {
          column_mappings?: Json
          created_at?: string | null
          description?: string | null
          field_transformations?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          source_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          created_at: string
          customer_id: number
          event_id: string | null
          id: string
          interaction_type: string
          item_id: string | null
          metadata: Json | null
          value: number | null
        }
        Insert: {
          created_at?: string
          customer_id: number
          event_id?: string | null
          id?: string
          interaction_type: string
          item_id?: string | null
          metadata?: Json | null
          value?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: number
          event_id?: string | null
          id?: string
          interaction_type?: string
          item_id?: string | null
          metadata?: Json | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_interactions_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_analogs"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_interactions_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_context"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_interactions_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_perf"
            referencedColumns: ["event_id"]
          },
        ]
      }
      marketing_plans: {
        Row: {
          budget: number | null
          capacity: number | null
          cluster_strategies: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_city: string
          event_date: string
          event_genre: string | null
          event_id: string | null
          event_name: string
          event_venue: string | null
          general_strategy: Json | null
          id: string
          marketing_plan: Json
          status: string | null
          target_audience: string | null
          ticket_price: number | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          capacity?: number | null
          cluster_strategies?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_city: string
          event_date: string
          event_genre?: string | null
          event_id?: string | null
          event_name: string
          event_venue?: string | null
          general_strategy?: Json | null
          id?: string
          marketing_plan: Json
          status?: string | null
          target_audience?: string | null
          ticket_price?: number | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          capacity?: number | null
          cluster_strategies?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_city?: string
          event_date?: string
          event_genre?: string | null
          event_id?: string | null
          event_name?: string
          event_venue?: string | null
          general_strategy?: Json | null
          id?: string
          marketing_plan?: Json
          status?: string | null
          target_audience?: string | null
          ticket_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_analogs"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_context"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_perf"
            referencedColumns: ["event_id"]
          },
        ]
      }
      scoring_snapshots: {
        Row: {
          created_at: string
          customer_id: number
          event_id: string | null
          frequency_score: number | null
          id: string
          monetary_value: number | null
          predicted_ltv: number | null
          propensity_score: number
          recency_days: number | null
          segment: string | null
        }
        Insert: {
          created_at?: string
          customer_id: number
          event_id?: string | null
          frequency_score?: number | null
          id?: string
          monetary_value?: number | null
          predicted_ltv?: number | null
          propensity_score: number
          recency_days?: number | null
          segment?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: number
          event_id?: string | null
          frequency_score?: number | null
          id?: string
          monetary_value?: number | null
          predicted_ltv?: number | null
          propensity_score?: number
          recency_days?: number | null
          segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_scoring_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_scoring_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scoring_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_scoring_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_analogs"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_scoring_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_context"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_scoring_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_event_perf"
            referencedColumns: ["event_id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string | null
          id: string
          payload_json: Json
          run_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload_json: Json
          run_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload_json?: Json
          run_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_validations: {
        Row: {
          created_at: string | null
          id: string
          ok: boolean
          reasons_json: Json | null
          strategy_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ok: boolean
          reasons_json?: Json | null
          strategy_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ok?: boolean
          reasons_json?: Json | null
          strategy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_validations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      valle_clientes: {
        Row: {
          aniversario: string | null
          aplicativo_ativo: boolean | null
          consumo: number | null
          cpf: string | null
          created_at: string | null
          email: string | null
          genero: string | null
          id: string
          id_evento: string | null
          nome: string
          presencas: number | null
          primeira_entrada: string | null
          primeira_interacao: string | null
          primeira_utilizacao: boolean | null
          telefone: string | null
          ultima_visita: string | null
          updated_at: string | null
        }
        Insert: {
          aniversario?: string | null
          aplicativo_ativo?: boolean | null
          consumo?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          genero?: string | null
          id?: string
          id_evento?: string | null
          nome: string
          presencas?: number | null
          primeira_entrada?: string | null
          primeira_interacao?: string | null
          primeira_utilizacao?: boolean | null
          telefone?: string | null
          ultima_visita?: string | null
          updated_at?: string | null
        }
        Update: {
          aniversario?: string | null
          aplicativo_ativo?: boolean | null
          consumo?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          genero?: string | null
          id?: string
          id_evento?: string | null
          nome?: string
          presencas?: number | null
          primeira_entrada?: string | null
          primeira_interacao?: string | null
          primeira_utilizacao?: boolean | null
          telefone?: string | null
          ultima_visita?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      valle_reactivation_strategies: {
        Row: {
          cluster_comportamental: string
          created_at: string | null
          expected_conversion_rate: number | null
          id: string
          message_template: string | null
          priority: number | null
          recommended_channel: string | null
          strategy_description: string | null
          strategy_title: string
          updated_at: string | null
        }
        Insert: {
          cluster_comportamental: string
          created_at?: string | null
          expected_conversion_rate?: number | null
          id?: string
          message_template?: string | null
          priority?: number | null
          recommended_channel?: string | null
          strategy_description?: string | null
          strategy_title: string
          updated_at?: string | null
        }
        Update: {
          cluster_comportamental?: string
          created_at?: string | null
          expected_conversion_rate?: number | null
          id?: string
          message_template?: string | null
          priority?: number | null
          recommended_channel?: string | null
          strategy_description?: string | null
          strategy_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_all_customers_birthdays: {
        Row: {
          aniversario: string | null
          aplicativo_ativo: boolean | null
          cluster_comportamental: string | null
          cluster_jornada: string | null
          cluster_valor: string | null
          consumo: number | null
          customer_id: string | null
          email: string | null
          faixa_etaria: string | null
          frequency: number | null
          genero: string | null
          idade: number | null
          monetary: number | null
          nome: string | null
          presencas: number | null
          primeira_entrada: string | null
          propensity_score: number | null
          recency_days: number | null
          source_table: string | null
          telefone: string | null
          ultima_visita: string | null
        }
        Relationships: []
      }
      vw_consumption_profile: {
        Row: {
          consumption_segment: string | null
          customer_id: number | null
          dominant_category_pct: number | null
          total_quantity: number | null
          total_value: number | null
        }
        Relationships: []
      }
      vw_customer_event_features: {
        Row: {
          avg_days_before_event: number | null
          avg_spend_last_90d: number | null
          city_match: number | null
          customer_id: number | null
          days_since_last_event: number | null
          event_id: string | null
          prev_attendance_count: number | null
        }
        Relationships: []
      }
      vw_customer_rfm: {
        Row: {
          customer_id: number | null
          f: number | null
          freq_tx: number | null
          m: number | null
          monetary_bar: number | null
          monetary_tickets: number | null
          monetary_total: number | null
          r: number | null
          recency_days: number | null
          segment: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_demographic_profile: {
        Row: {
          age: number | null
          age_segment: string | null
          city: string | null
          customer_id: number | null
          gender: string | null
          name: string | null
        }
        Insert: {
          age?: never
          age_segment?: never
          city?: string | null
          customer_id?: number | null
          gender?: string | null
          name?: string | null
        }
        Update: {
          age?: never
          age_segment?: never
          city?: string | null
          customer_id?: number | null
          gender?: string | null
          name?: string | null
        }
        Relationships: []
      }
      vw_digital_engagement: {
        Row: {
          avg_days_before_event: number | null
          avg_days_between_purchases: number | null
          avg_purchase_value: number | null
          customer_id: number | null
          engagement_segment: string | null
          total_purchases: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_event_analogs: {
        Row: {
          avg_price: number | null
          capacity: number | null
          city: string | null
          dow: number | null
          event_id: string | null
          genre: string | null
          month_bucket: string | null
          occupancy_rate: number | null
          revenue: number | null
          revenue_per_person: number | null
          sold_tickets: number | null
          venue: string | null
        }
        Insert: {
          avg_price?: number | null
          capacity?: number | null
          city?: string | null
          dow?: never
          event_id?: string | null
          genre?: string | null
          month_bucket?: never
          occupancy_rate?: never
          revenue?: number | null
          revenue_per_person?: never
          sold_tickets?: number | null
          venue?: string | null
        }
        Update: {
          avg_price?: number | null
          capacity?: number | null
          city?: string | null
          dow?: never
          event_id?: string | null
          genre?: string | null
          month_bucket?: never
          occupancy_rate?: never
          revenue?: number | null
          revenue_per_person?: never
          sold_tickets?: number | null
          venue?: string | null
        }
        Relationships: []
      }
      vw_event_context: {
        Row: {
          capacity: number | null
          city: string | null
          dow: number | null
          event_date: string | null
          event_id: string | null
          genre: string | null
          month_bucket: string | null
          revenue: number | null
          sold_tickets: number | null
          venue: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          dow?: never
          event_date?: string | null
          event_id?: string | null
          genre?: string | null
          month_bucket?: never
          revenue?: number | null
          sold_tickets?: number | null
          venue?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          dow?: never
          event_date?: string | null
          event_id?: string | null
          genre?: string | null
          month_bucket?: never
          revenue?: number | null
          sold_tickets?: number | null
          venue?: string | null
        }
        Relationships: []
      }
      vw_event_perf: {
        Row: {
          avg_basket_value: number | null
          avg_ticket_price: number | null
          capacity: number | null
          city: string | null
          conversion_rate: number | null
          date: string | null
          event_id: string | null
          genre: string | null
          revenue: number | null
          sold_tickets: number | null
        }
        Insert: {
          avg_basket_value?: never
          avg_ticket_price?: never
          capacity?: number | null
          city?: string | null
          conversion_rate?: never
          date?: string | null
          event_id?: string | null
          genre?: string | null
          revenue?: number | null
          sold_tickets?: number | null
        }
        Update: {
          avg_basket_value?: never
          avg_ticket_price?: never
          capacity?: number | null
          city?: string | null
          conversion_rate?: never
          date?: string | null
          event_id?: string | null
          genre?: string | null
          revenue?: number | null
          sold_tickets?: number | null
        }
        Relationships: []
      }
      vw_multi_segment: {
        Row: {
          age: number | null
          age_segment: string | null
          avg_days_before_event: number | null
          avg_days_between_purchases: number | null
          city: string | null
          consumption_segment: string | null
          customer_id: number | null
          dominant_category_pct: number | null
          email: string | null
          engagement_segment: string | null
          frequency: number | null
          gender: string | null
          genre_interaction_count: number | null
          monetary_total: number | null
          name: string | null
          preferred_genre: string | null
          recency_days: number | null
          rfm_f: number | null
          rfm_m: number | null
          rfm_r: number | null
          rfm_segment: string | null
          segment_priority_score: number | null
          sponsorship_cluster: string | null
          total_purchases: number | null
        }
        Relationships: []
      }
      vw_musical_preference: {
        Row: {
          customer_id: number | null
          interaction_count: number | null
          preferred_genre: string | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_event_features"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_demographic_profile"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_multi_segment"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_rfm_customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_interactions_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sponsorship_potential"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_rfm_customer: {
        Row: {
          customer_id: number | null
          f: number | null
          frequency_interactions: number | null
          last_interaction_at: string | null
          m: number | null
          monetary_total: number | null
          r: number | null
          recency_days: number | null
          rfm_score: number | null
        }
        Relationships: []
      }
      vw_segment_consumption: {
        Row: {
          avg_bar_spend: number | null
          avg_frequency: number | null
          avg_monetary_total: number | null
          avg_ticket_spend: number | null
          city: string | null
          customers: number | null
          genre: string | null
          segment: string | null
        }
        Relationships: []
      }
      vw_segment_demographics: {
        Row: {
          avg_age: number | null
          cities_reached: number | null
          female_pct: number | null
          male_pct: number | null
          segment: string | null
          total_customers: number | null
        }
        Relationships: []
      }
      vw_segment_forecast: {
        Row: {
          avg_bar_spend: number | null
          avg_monetary_total: number | null
          avg_ticket_spend: number | null
          city: string | null
          customers: number | null
          data_quality_score: number | null
          estimated_conversion_rate: number | null
          expected_spend_per_customer: number | null
          genre: string | null
          segment: string | null
        }
        Relationships: []
      }
      vw_segment_intersections: {
        Row: {
          age_segment: string | null
          avg_frequency: number | null
          avg_monetary: number | null
          avg_priority_score: number | null
          consumption_segment: string | null
          customer_count: number | null
          engagement_segment: string | null
          rfm_segment: string | null
          sponsorship_cluster: string | null
        }
        Relationships: []
      }
      vw_sponsorship_potential: {
        Row: {
          age_segment: string | null
          city: string | null
          consumption_segment: string | null
          customer_id: number | null
          monetary_total: number | null
          name: string | null
          rfm_segment: string | null
          sponsorship_cluster: string | null
        }
        Relationships: []
      }
      vw_valle_cluster_analysis: {
        Row: {
          cluster_comportamental: string | null
          com_app_ativo: number | null
          consumo_medio: number | null
          faixas_etarias: string[] | null
          generos: string[] | null
          presencas_media: number | null
          propensity_media: number | null
          recency_media: number | null
          total_clientes: number | null
        }
        Relationships: []
      }
      vw_valle_rfm: {
        Row: {
          aniversario: string | null
          aplicativo_ativo: boolean | null
          cluster_comportamental: string | null
          cluster_jornada: string | null
          cluster_valor: string | null
          consumo: number | null
          cpf: string | null
          email: string | null
          faixa_etaria: string | null
          frequency: number | null
          genero: string | null
          id: string | null
          idade: number | null
          monetary: number | null
          nome: string | null
          presencas: number | null
          primeira_entrada: string | null
          propensity_score: number | null
          recency_days: number | null
          telefone: string | null
          ultima_visita: string | null
        }
        Insert: {
          aniversario?: string | null
          aplicativo_ativo?: boolean | null
          cluster_comportamental?: never
          cluster_jornada?: never
          cluster_valor?: never
          consumo?: number | null
          cpf?: string | null
          email?: string | null
          faixa_etaria?: never
          frequency?: number | null
          genero?: string | null
          id?: string | null
          idade?: never
          monetary?: number | null
          nome?: string | null
          presencas?: number | null
          primeira_entrada?: string | null
          propensity_score?: never
          recency_days?: never
          telefone?: string | null
          ultima_visita?: string | null
        }
        Update: {
          aniversario?: string | null
          aplicativo_ativo?: boolean | null
          cluster_comportamental?: never
          cluster_jornada?: never
          cluster_valor?: never
          consumo?: number | null
          cpf?: string | null
          email?: string | null
          faixa_etaria?: never
          frequency?: number | null
          genero?: string | null
          id?: string | null
          idade?: never
          monetary?: number | null
          nome?: string | null
          presencas?: number | null
          primeira_entrada?: string | null
          propensity_score?: never
          recency_days?: never
          telefone?: string | null
          ultima_visita?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_birthday_customers: {
        Args: {
          age_range_filter?: string[]
          cluster_filter?: string[]
          target_month: number
        }
        Returns: {
          aniversario: string
          aplicativo_ativo: boolean
          cluster_comportamental: string
          cluster_jornada: string
          cluster_valor: string
          consumo: number
          cpf: string
          email: string
          faixa_etaria: string
          frequency: number
          genero: string
          id: string
          idade: number
          monetary: number
          nome: string
          presencas: number
          primeira_entrada: string
          propensity_score: number
          recency_days: number
          telefone: string
          ultima_visita: string
        }[]
      }
      get_birthday_customers_unified: {
        Args: {
          age_range_filter?: string[]
          cluster_filter?: string[]
          target_month: number
        }
        Returns: {
          aniversario: string
          aplicativo_ativo: boolean
          cluster_comportamental: string
          cluster_jornada: string
          cluster_valor: string
          consumo: number
          customer_id: string
          email: string
          faixa_etaria: string
          frequency: number
          genero: string
          idade: number
          monetary: number
          nome: string
          presencas: number
          primeira_entrada: string
          propensity_score: number
          recency_days: number
          source_table: string
          telefone: string
          ultima_visita: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
