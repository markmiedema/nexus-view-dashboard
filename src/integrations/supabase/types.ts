export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis_metadata: {
        Row: {
          analysis_date: string
          created_at: string | null
          file_hash: string | null
          id: string
          license_key_id: string | null
          processing_time_ms: number | null
          session_id: string
          states_analyzed: number | null
          total_rows_processed: number | null
        }
        Insert: {
          analysis_date: string
          created_at?: string | null
          file_hash?: string | null
          id?: string
          license_key_id?: string | null
          processing_time_ms?: number | null
          session_id: string
          states_analyzed?: number | null
          total_rows_processed?: number | null
        }
        Update: {
          analysis_date?: string
          created_at?: string | null
          file_hash?: string | null
          id?: string
          license_key_id?: string | null
          processing_time_ms?: number | null
          session_id?: string
          states_analyzed?: number | null
          total_rows_processed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_analysis_license"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          license_key_id: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          session_id: string | null
          severity: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          license_key_id?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      license_keys: {
        Row: {
          activation_date: string | null
          allowed_ip_addresses: unknown[] | null
          created_at: string | null
          created_by: string | null
          customer_company: string | null
          customer_email: string | null
          customer_name: string
          id: string
          key_hash: string
          key_value: string
          last_used_at: string | null
          max_analyses_per_month: number | null
          max_rows_per_analysis: number | null
          max_states_per_analysis: number | null
          notes: string | null
          status: string
          tier: string
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          activation_date?: string | null
          allowed_ip_addresses?: unknown[] | null
          created_at?: string | null
          created_by?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name: string
          id?: string
          key_hash: string
          key_value: string
          last_used_at?: string | null
          max_analyses_per_month?: number | null
          max_rows_per_analysis?: number | null
          max_states_per_analysis?: number | null
          notes?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          activation_date?: string | null
          allowed_ip_addresses?: unknown[] | null
          created_at?: string | null
          created_by?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name?: string
          id?: string
          key_hash?: string
          key_value?: string
          last_used_at?: string | null
          max_analyses_per_month?: number | null
          max_rows_per_analysis?: number | null
          max_states_per_analysis?: number | null
          notes?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      license_usage: {
        Row: {
          action_type: string
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          license_key_id: string
          metadata: Json | null
          processing_time_ms: number | null
          row_count: number | null
          session_id: string | null
          states_analyzed: number | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          license_key_id: string
          metadata?: Json | null
          processing_time_ms?: number | null
          row_count?: number | null
          session_id?: string | null
          states_analyzed?: number | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          license_key_id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          row_count?: number | null
          session_id?: string | null
          states_analyzed?: number | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_usage_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_end_date: string | null
          effective_start_date: string
          evaluation_period_type: string
          id: string
          includes_exempt_sales: boolean | null
          includes_marketplace_sales: boolean | null
          notes: string | null
          revenue_threshold: number | null
          rule_details: Json | null
          source_document: string | null
          source_url: string | null
          state_id: string
          transaction_threshold: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_end_date?: string | null
          effective_start_date: string
          evaluation_period_type: string
          id?: string
          includes_exempt_sales?: boolean | null
          includes_marketplace_sales?: boolean | null
          notes?: string | null
          revenue_threshold?: number | null
          rule_details?: Json | null
          source_document?: string | null
          source_url?: string | null
          state_id: string
          transaction_threshold?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_end_date?: string | null
          effective_start_date?: string
          evaluation_period_type?: string
          id?: string
          includes_exempt_sales?: boolean | null
          includes_marketplace_sales?: boolean | null
          notes?: string | null
          revenue_threshold?: number | null
          rule_details?: Json | null
          source_document?: string | null
          source_url?: string | null
          state_id?: string
          transaction_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_rules_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_types: {
        Row: {
          code: string
          common_keywords: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_digital: boolean | null
          is_service: boolean | null
          is_tangible: boolean | null
          name: string
          parent_type_id: string | null
        }
        Insert: {
          code: string
          common_keywords?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_digital?: boolean | null
          is_service?: boolean | null
          is_tangible?: boolean | null
          name: string
          parent_type_id?: string | null
        }
        Update: {
          code?: string
          common_keywords?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_digital?: boolean | null
          is_service?: boolean | null
          is_tangible?: boolean | null
          name?: string
          parent_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_types_parent_type_id_fkey"
            columns: ["parent_type_id"]
            isOneToOne: false
            referencedRelation: "revenue_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_change_log: {
        Row: {
          change_reason: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          change_reason?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      state_revenue_rules: {
        Row: {
          counts_toward_threshold: boolean
          created_at: string | null
          effective_end_date: string | null
          effective_start_date: string
          id: string
          notes: string | null
          revenue_type_id: string
          special_conditions: Json | null
          state_id: string
        }
        Insert: {
          counts_toward_threshold?: boolean
          created_at?: string | null
          effective_end_date?: string | null
          effective_start_date: string
          id?: string
          notes?: string | null
          revenue_type_id: string
          special_conditions?: Json | null
          state_id: string
        }
        Update: {
          counts_toward_threshold?: boolean
          created_at?: string | null
          effective_end_date?: string | null
          effective_start_date?: string
          id?: string
          notes?: string | null
          revenue_type_id?: string
          special_conditions?: Json | null
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_revenue_rules_revenue_type_id_fkey"
            columns: ["revenue_type_id"]
            isOneToOne: false
            referencedRelation: "revenue_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_revenue_rules_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          code: string
          created_at: string | null
          has_economic_nexus: boolean | null
          id: string
          marketplace_facilitator_rules: boolean | null
          name: string
          notes: string | null
          region: string | null
          special_rules: Json | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          has_economic_nexus?: boolean | null
          id?: string
          marketplace_facilitator_rules?: boolean | null
          name: string
          notes?: string | null
          region?: string | null
          special_rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          has_economic_nexus?: boolean | null
          id?: string
          marketplace_facilitator_rules?: boolean | null
          name?: string
          notes?: string | null
          region?: string | null
          special_rules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      monthly_license_usage: {
        Row: {
          analysis_count: number | null
          avg_processing_time_ms: number | null
          export_count: number | null
          last_activity: string | null
          license_key_id: string | null
          month: string | null
          report_count: number | null
          total_rows_processed: number | null
          total_states_analyzed: number | null
          unique_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "license_usage_license_key_id_fkey"
            columns: ["license_key_id"]
            isOneToOne: false
            referencedRelation: "license_keys"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_license_usage_limit: {
        Args: { p_license_key_hash: string; p_action_type: string }
        Returns: {
          allowed: boolean
          reason: string
          current_usage: number
          limit_value: number
        }[]
      }
      current_license_key_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      generate_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_current_nexus_rules: {
        Args: { p_as_of_date?: string }
        Returns: {
          state_code: string
          state_name: string
          revenue_threshold: number
          transaction_threshold: number
          evaluation_period_type: string
          includes_marketplace_sales: boolean
          includes_exempt_sales: boolean
          effective_start_date: string
        }[]
      }
      get_current_nexus_rules: {
        Args: { p_state_code: string; p_as_of_date?: string }
        Returns: {
          state_code: string
          state_name: string
          revenue_threshold: number
          transaction_threshold: number
          evaluation_period_type: string
          includes_marketplace_sales: boolean
          includes_exempt_sales: boolean
          rule_details: Json
          effective_start_date: string
          source_url: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
