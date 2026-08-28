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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      account_links: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          metadata: Json
          provider: string
          provider_user_id: string
          refreshed_at: string
          user_id: string
          username: string
          verified_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          provider: string
          provider_user_id: string
          refreshed_at?: string
          user_id: string
          username: string
          verified_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_user_id?: string
          refreshed_at?: string
          user_id?: string
          username?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_quotas: {
        Row: {
          created_at: string
          grace_minutes: number
          id: string
          minutes_required: number
          period: string
          roblox_role_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          grace_minutes?: number
          id?: string
          minutes_required: number
          period?: string
          roblox_role_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          grace_minutes?: number
          id?: string
          minutes_required?: number
          period?: string
          roblox_role_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_quotas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          place_id: string | null
          roblox_user_id: string
          roblox_username: string
          server_id: string | null
          source: string
          started_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          place_id?: string | null
          roblox_user_id: string
          roblox_username: string
          server_id?: string | null
          source?: string
          started_at: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          place_id?: string | null
          roblox_user_id?: string
          roblox_username?: string
          server_id?: string | null
          source?: string
          started_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      application_forms: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          opens_at: string | null
          status: string
          target_role_id: string | null
          target_role_name: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          opens_at?: string | null
          status?: string
          target_role_id?: string | null
          target_role_name?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          opens_at?: string | null
          status?: string
          target_role_id?: string | null
          target_role_name?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_forms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      application_submissions: {
        Row: {
          applicant_id: string
          applicant_roblox_user_id: string | null
          form_id: string
          id: string
          responses: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          status: string
          submitted_at: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          applicant_id: string
          applicant_roblox_user_id?: string | null
          form_id: string
          id?: string
          responses?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          applicant_id?: string
          applicant_roblox_user_id?: string | null
          form_id?: string
          id?: string
          responses?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_submissions_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          ip_hash: string | null
          metadata: Json
          request_key: string | null
          summary: string
          target_id: string | null
          target_type: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: never
          ip_hash?: string | null
          metadata?: Json
          request_key?: string | null
          summary: string
          target_id?: string | null
          target_type?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: never
          ip_hash?: string | null
          metadata?: Json
          request_key?: string | null
          summary?: string
          target_id?: string | null
          target_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input: Json
          output: Json | null
          started_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          automation_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json
          output?: Json | null
          started_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          automation_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json
          output?: Json | null
          started_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          created_by: string | null
          definition: Json
          enabled: boolean
          id: string
          name: string
          trigger_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition: Json
          enabled?: boolean
          id?: string
          name: string
          trigger_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          enabled?: boolean
          id?: string
          name?: string
          trigger_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          connected_at: string | null
          connected_by: string | null
          created_at: string
          external_id: string | null
          id: string
          provider: string
          settings: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          provider: string
          settings?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          provider?: string
          settings?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contact_email: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed_at: string | null
          password_set_at: string | null
          plan_key: string
          plan_selected_at: string | null
          roblox_link_deferred_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          password_set_at?: string | null
          plan_key?: string
          plan_selected_at?: string | null
          roblox_link_deferred_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          password_set_at?: string | null
          plan_key?: string
          plan_selected_at?: string | null
          roblox_link_deferred_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rank_actions: {
        Row: {
          completed_at: string | null
          error_code: string | null
          from_role_id: string | null
          from_role_name: string | null
          id: string
          policy_snapshot: Json
          reason: string
          request_key: string
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_roblox_user_id: string
          target_user_id: string | null
          target_username: string
          to_role_id: string
          to_role_name: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          error_code?: string | null
          from_role_id?: string | null
          from_role_name?: string | null
          id?: string
          policy_snapshot?: Json
          reason: string
          request_key?: string
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_roblox_user_id: string
          target_user_id?: string | null
          target_username: string
          to_role_id: string
          to_role_name: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          error_code?: string | null
          from_role_id?: string | null
          from_role_name?: string | null
          id?: string
          policy_snapshot?: Json
          reason?: string
          request_key?: string
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_roblox_user_id?: string
          target_user_id?: string | null
          target_username?: string
          to_role_id?: string
          to_role_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_actions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_actions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_bindings: {
        Row: {
          cooldown_minutes: number
          created_at: string
          discord_role_id: string | null
          discord_role_name: string | null
          id: string
          minimum_activity_minutes: number
          requires_approval: boolean
          roblox_role_id: string
          roblox_role_name: string
          sort_order: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cooldown_minutes?: number
          created_at?: string
          discord_role_id?: string | null
          discord_role_name?: string | null
          id?: string
          minimum_activity_minutes?: number
          requires_approval?: boolean
          roblox_role_id: string
          roblox_role_name: string
          sort_order?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cooldown_minutes?: number
          created_at?: string
          discord_role_id?: string | null
          discord_role_name?: string | null
          id?: string
          minimum_activity_minutes?: number
          requires_approval?: boolean
          roblox_role_id?: string
          roblox_role_name?: string
          sort_order?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_bindings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          plan_key: string
          provider: string
          renews_at: string | null
          status: string
          updated_at: string
          variant_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_key?: string
          provider?: string
          renews_at?: string | null
          status?: string
          updated_at?: string
          variant_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_key?: string
          provider?: string
          renews_at?: string | null
          status?: string
          updated_at?: string
          variant_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string
          id: string
          payload_hash: string
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id: string
          id?: string
          payload_hash: string
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string
          id?: string
          payload_hash?: string
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          discord_guild_id: string | null
          id: string
          name: string
          public_id: string
          roblox_group_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          discord_guild_id?: string | null
          id?: string
          name: string
          public_id?: string
          roblox_group_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          discord_guild_id?: string | null
          id?: string
          name?: string
          public_id?: string
          roblox_group_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: { Args: never; Returns: Json }
      confirm_password_set: { Args: never; Returns: string }
      create_workspace: {
        Args: { workspace_name: string; workspace_slug: string }
        Returns: string
      }
      issue_workspace_api_key: {
        Args: { p_name?: string; p_workspace_id: string }
        Returns: Json
      }
      onboarding_state: { Args: never; Returns: Json }
      revoke_workspace_api_key: {
        Args: { p_key_id: string }
        Returns: undefined
      }
      save_onboarding_profile: {
        Args: {
          p_contact_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: undefined
      }
      select_onboarding_plan: {
        Args: { p_plan_key: string }
        Returns: undefined
      }
      set_roblox_link_deferred: {
        Args: { p_deferred: boolean }
        Returns: undefined
      }
      sync_auth_identities: { Args: never; Returns: string[] }
      sync_discord_identity: { Args: never; Returns: boolean }
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

