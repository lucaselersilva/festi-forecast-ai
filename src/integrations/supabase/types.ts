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
        ]
      }
    }
    Views: {
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
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
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
