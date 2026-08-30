export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      account_links: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          metadata: Json;
          provider: string;
          provider_user_id: string;
          refreshed_at: string;
          user_id: string;
          username: string;
          verified_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          metadata?: Json;
          provider: string;
          provider_user_id: string;
          refreshed_at?: string;
          user_id: string;
          username: string;
          verified_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          metadata?: Json;
          provider?: string;
          provider_user_id?: string;
          refreshed_at?: string;
          user_id?: string;
          username?: string;
          verified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_quotas: {
        Row: {
          created_at: string;
          grace_minutes: number;
          id: string;
          minutes_required: number;
          period: string;
          roblox_role_id: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          grace_minutes?: number;
          id?: string;
          minutes_required: number;
          period?: string;
          roblox_role_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          grace_minutes?: number;
          id?: string;
          minutes_required?: number;
          period?: string;
          roblox_role_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_quotas_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          place_id: string | null;
          roblox_user_id: string;
          roblox_username: string;
          server_id: string | null;
          source: string;
          started_at: string;
          user_id: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          place_id?: string | null;
          roblox_user_id: string;
          roblox_username: string;
          server_id?: string | null;
          source?: string;
          started_at: string;
          user_id?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          place_id?: string | null;
          roblox_user_id?: string;
          roblox_username?: string;
          server_id?: string | null;
          source?: string;
          started_at?: string;
          user_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_sessions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          revoked_at: string | null;
          scopes: string[];
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          revoked_at?: string | null;
          scopes?: string[];
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          revoked_at?: string | null;
          scopes?: string[];
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_keys_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      application_forms: {
        Row: {
          announcement_channel_id: string | null;
          announcement_message_id: string | null;
          closes_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          fields: Json[];
          id: string;
          name: string;
          opens_at: string | null;
          status: string;
          submissions_channel_id: string | null;
          target_role_id: string | null;
          target_role_name: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          announcement_channel_id?: string | null;
          announcement_message_id?: string | null;
          closes_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          fields?: Json;
          id?: string;
          name: string;
          opens_at?: string | null;
          status?: string;
          submissions_channel_id?: string | null;
          target_role_id?: string | null;
          target_role_name?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          announcement_channel_id?: string | null;
          announcement_message_id?: string | null;
          closes_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          fields?: Json;
          id?: string;
          name?: string;
          opens_at?: string | null;
          status?: string;
          submissions_channel_id?: string | null;
          target_role_id?: string | null;
          target_role_name?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_forms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_forms_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      application_submissions: {
        Row: {
          applicant_discord_avatar_url: string | null;
          applicant_discord_name: string | null;
          applicant_discord_user_id: string | null;
          applicant_id: string;
          applicant_roblox_user_id: string | null;
          form_id: string;
          id: string;
          responses: Json;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          score: number | null;
          status: string;
          submitted_at: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          applicant_discord_avatar_url?: string | null;
          applicant_discord_name?: string | null;
          applicant_discord_user_id?: string | null;
          applicant_id: string;
          applicant_roblox_user_id?: string | null;
          form_id: string;
          id?: string;
          responses?: Json;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          score?: number | null;
          status?: string;
          submitted_at?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          applicant_discord_avatar_url?: string | null;
          applicant_discord_name?: string | null;
          applicant_discord_user_id?: string | null;
          applicant_id?: string;
          applicant_roblox_user_id?: string | null;
          form_id?: string;
          id?: string;
          responses?: Json;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          score?: number | null;
          status?: string;
          submitted_at?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_submissions_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_submissions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "application_forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_submissions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          event_type: string;
          id: number;
          ip_hash: string | null;
          metadata: Json;
          request_key: string | null;
          summary: string;
          target_id: string | null;
          target_type: string | null;
          workspace_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: never;
          ip_hash?: string | null;
          metadata?: Json;
          request_key?: string | null;
          summary: string;
          target_id?: string | null;
          target_type?: string | null;
          workspace_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: never;
          ip_hash?: string | null;
          metadata?: Json;
          request_key?: string | null;
          summary?: string;
          target_id?: string | null;
          target_type?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_runs: {
        Row: {
          automation_id: string;
          completed_at: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          input: Json;
          output: Json | null;
          started_at: string | null;
          status: string;
          workspace_id: string;
        };
        Insert: {
          automation_id: string;
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input?: Json;
          output?: Json | null;
          started_at?: string | null;
          status?: string;
          workspace_id: string;
        };
        Update: {
          automation_id?: string;
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          input?: Json;
          output?: Json | null;
          started_at?: string | null;
          status?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey";
            columns: ["automation_id"];
            isOneToOne: false;
            referencedRelation: "automations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      automations: {
        Row: {
          created_at: string;
          created_by: string | null;
          definition: { [key: string]: Json | undefined };
          enabled: boolean;
          id: string;
          name: string;
          trigger_type: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          definition: Json;
          enabled?: boolean;
          id?: string;
          name: string;
          trigger_type: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          definition?: Json;
          enabled?: boolean;
          id?: string;
          name?: string;
          trigger_type?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      integrations: {
        Row: {
          connected_at: string | null;
          connected_by: string | null;
          created_at: string;
          external_id: string | null;
          id: string;
          provider: string;
          settings: Json;
          status: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          connected_at?: string | null;
          connected_by?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          provider: string;
          settings?: Json;
          status?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          connected_at?: string | null;
          connected_by?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          provider?: string;
          settings?: Json;
          status?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integrations_connected_by_fkey";
            columns: ["connected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integrations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      nexora_groups: {
        Row: {
          created_at: string;
          created_by: string;
          discord_invite_url: string | null;
          id: number;
          published: boolean;
          roblox_group_id: string;
          roblox_group_logo_url: string | null;
          roblox_group_name: string;
          roblox_member_count: number;
          roblox_owner_display_name: string | null;
          roblox_owner_user_id: string | null;
          roblox_owner_username: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          discord_invite_url?: string | null;
          id?: never;
          published?: boolean;
          roblox_group_id: string;
          roblox_group_logo_url?: string | null;
          roblox_group_name: string;
          roblox_member_count?: number;
          roblox_owner_display_name?: string | null;
          roblox_owner_user_id?: string | null;
          roblox_owner_username?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          discord_invite_url?: string | null;
          id?: never;
          published?: boolean;
          roblox_group_id?: string;
          roblox_group_logo_url?: string | null;
          roblox_group_name?: string;
          roblox_member_count?: number;
          roblox_owner_display_name?: string | null;
          roblox_owner_user_id?: string | null;
          roblox_owner_username?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nexora_groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partners: {
        Row: {
          created_at: string;
          created_by: string;
          discord_invite_url: string;
          id: string;
          published: boolean;
          roblox_group_id: string;
          roblox_group_logo_url: string | null;
          roblox_group_name: string;
          roblox_member_count: number;
          roblox_owner_display_name: string | null;
          roblox_owner_user_id: string | null;
          roblox_owner_username: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          discord_invite_url: string;
          id?: string;
          published?: boolean;
          roblox_group_id: string;
          roblox_group_logo_url?: string | null;
          roblox_group_name: string;
          roblox_member_count?: number;
          roblox_owner_display_name?: string | null;
          roblox_owner_user_id?: string | null;
          roblox_owner_username?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          discord_invite_url?: string;
          id?: string;
          published?: boolean;
          roblox_group_id?: string;
          roblox_group_logo_url?: string | null;
          roblox_group_name?: string;
          roblox_member_count?: number;
          roblox_owner_display_name?: string | null;
          roblox_owner_user_id?: string | null;
          roblox_owner_username?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partners_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          contact_email: string | null;
          created_at: string;
          display_name: string | null;
          first_name: string | null;
          free_roblox_group_checked_at: string | null;
          free_roblox_group_status: string;
          id: string;
          last_name: string | null;
          onboarding_completed_at: string | null;
          password_set_at: string | null;
          plan_key: string;
          plan_selected_at: string | null;
          roblox_link_deferred_at: string | null;
          selected_roblox_group_id: string | null;
          selected_roblox_group_name: string | null;
          selected_roblox_group_role: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          free_roblox_group_checked_at?: string | null;
          free_roblox_group_status?: string;
          id: string;
          last_name?: string | null;
          onboarding_completed_at?: string | null;
          password_set_at?: string | null;
          plan_key?: string;
          plan_selected_at?: string | null;
          roblox_link_deferred_at?: string | null;
          selected_roblox_group_id?: string | null;
          selected_roblox_group_name?: string | null;
          selected_roblox_group_role?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          free_roblox_group_checked_at?: string | null;
          free_roblox_group_status?: string;
          id?: string;
          last_name?: string | null;
          onboarding_completed_at?: string | null;
          password_set_at?: string | null;
          plan_key?: string;
          plan_selected_at?: string | null;
          roblox_link_deferred_at?: string | null;
          selected_roblox_group_id?: string | null;
          selected_roblox_group_name?: string | null;
          selected_roblox_group_role?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rank_actions: {
        Row: {
          completed_at: string | null;
          error_code: string | null;
          from_role_id: string | null;
          from_role_name: string | null;
          id: string;
          policy_snapshot: Json;
          reason: string;
          request_key: string;
          requested_at: string;
          requested_by: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          target_roblox_user_id: string;
          target_user_id: string | null;
          target_username: string;
          to_role_id: string;
          to_role_name: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          error_code?: string | null;
          from_role_id?: string | null;
          from_role_name?: string | null;
          id?: string;
          policy_snapshot?: Json;
          reason: string;
          request_key?: string;
          requested_at?: string;
          requested_by?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_roblox_user_id: string;
          target_user_id?: string | null;
          target_username: string;
          to_role_id: string;
          to_role_name: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          error_code?: string | null;
          from_role_id?: string | null;
          from_role_name?: string | null;
          id?: string;
          policy_snapshot?: Json;
          reason?: string;
          request_key?: string;
          requested_at?: string;
          requested_by?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_roblox_user_id?: string;
          target_user_id?: string | null;
          target_username?: string;
          to_role_id?: string;
          to_role_name?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rank_actions_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rank_actions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rank_actions_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rank_actions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      rank_bindings: {
        Row: {
          cooldown_minutes: number;
          created_at: string;
          discord_role_id: string | null;
          discord_role_name: string | null;
          id: string;
          minimum_activity_minutes: number;
          requires_approval: boolean;
          roblox_role_id: string;
          roblox_role_name: string;
          sort_order: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          cooldown_minutes?: number;
          created_at?: string;
          discord_role_id?: string | null;
          discord_role_name?: string | null;
          id?: string;
          minimum_activity_minutes?: number;
          requires_approval?: boolean;
          roblox_role_id: string;
          roblox_role_name: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          cooldown_minutes?: number;
          created_at?: string;
          discord_role_id?: string | null;
          discord_role_name?: string | null;
          id?: string;
          minimum_activity_minutes?: number;
          requires_approval?: boolean;
          roblox_role_id?: string;
          roblox_role_name?: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rank_bindings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      service_status_snapshots: {
        Row: {
          checked_at: string;
          checked_on: string;
          detail: string | null;
          service_key: string;
          state: string;
        };
        Insert: {
          checked_at?: string;
          checked_on?: string;
          detail?: string | null;
          service_key: string;
          state: string;
        };
        Update: {
          checked_at?: string;
          checked_on?: string;
          detail?: string | null;
          service_key?: string;
          state?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          ends_at: string | null;
          external_customer_id: string | null;
          external_subscription_id: string | null;
          id: string;
          plan_key: string;
          provider: string;
          renews_at: string | null;
          status: string;
          updated_at: string;
          variant_id: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          id?: string;
          plan_key?: string;
          provider?: string;
          renews_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          id?: string;
          plan_key?: string;
          provider?: string;
          renews_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string;
          error_message: string | null;
          event_type: string;
          external_event_id: string;
          id: string;
          payload_hash: string;
          processed_at: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          event_type: string;
          external_event_id: string;
          id?: string;
          payload_hash: string;
          processed_at?: string | null;
          provider: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          event_type?: string;
          external_event_id?: string;
          id?: string;
          payload_hash?: string;
          processed_at?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          joined_at: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          joined_at?: string;
          role?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          joined_at?: string;
          role?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_roblox_eligibility: {
        Row: {
          grace_expires_at: string | null;
          grace_started_at: string | null;
          last_checked_at: string | null;
          last_error_code: string | null;
          last_member_at: string | null;
          owner_user_id: string;
          required_group_id: string;
          status: string;
          suspended_at: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          grace_expires_at?: string | null;
          grace_started_at?: string | null;
          last_checked_at?: string | null;
          last_error_code?: string | null;
          last_member_at?: string | null;
          owner_user_id: string;
          required_group_id?: string;
          status?: string;
          suspended_at?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          grace_expires_at?: string | null;
          grace_started_at?: string | null;
          last_checked_at?: string | null;
          last_error_code?: string | null;
          last_member_at?: string | null;
          owner_user_id?: string;
          required_group_id?: string;
          status?: string;
          suspended_at?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_roblox_eligibility_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_roblox_eligibility_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_logs: {
        Row: {
          id: number;
          workspace_id: string;
          source: string;
          severity: string;
          event_type: string;
          summary: string;
          actor_user_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          workspace_id: string;
          source: string;
          severity?: string;
          event_type: string;
          summary: string;
          actor_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          workspace_id?: string;
          source?: string;
          severity?: string;
          event_type?: string;
          summary?: string;
          actor_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_roblox_groups: {
        Row: {
          id: string;
          workspace_id: string;
          group_id: string;
          group_name: string;
          purpose: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          group_id: string;
          group_name: string;
          purpose?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          group_id?: string;
          group_name?: string;
          purpose?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          discord_role_id: string | null;
          roblox_group_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          discord_role_id?: string | null;
          roblox_group_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          discord_role_id?: string | null;
          roblox_group_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_sessions: {
        Row: {
          id: string;
          workspace_id: string;
          department_id: string | null;
          session_type: string;
          title: string;
          status: string;
          starts_at: string;
          ends_at: string | null;
          host_user_id: string | null;
          discord_channel_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          department_id?: string | null;
          session_type: string;
          title: string;
          status?: string;
          starts_at: string;
          ends_at?: string | null;
          host_user_id?: string | null;
          discord_channel_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          department_id?: string | null;
          session_type?: string;
          title?: string;
          status?: string;
          starts_at?: string;
          ends_at?: string | null;
          host_user_id?: string | null;
          discord_channel_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          workspace_id: string;
          member_user_id: string | null;
          member_name: string;
          starts_on: string;
          ends_on: string;
          reason: string;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          member_user_id?: string | null;
          member_name: string;
          starts_on: string;
          ends_on: string;
          reason: string;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          member_user_id?: string | null;
          member_name?: string;
          starts_on?: string;
          ends_on?: string;
          reason?: string;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          department_id: string | null;
          title: string;
          description: string | null;
          assigned_to: string | null;
          status: string;
          priority: string;
          due_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          department_id?: string | null;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: string;
          priority?: string;
          due_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          department_id?: string | null;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: string;
          priority?: string;
          due_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_entries: {
        Row: {
          id: string;
          workspace_id: string;
          entry_type: string;
          title: string;
          content: string;
          visibility: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          entry_type?: string;
          title: string;
          content: string;
          visibility?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          entry_type?: string;
          title?: string;
          content?: string;
          visibility?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcement_templates: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          announcement_type: string;
          title_template: string;
          body_template: string;
          discord_channel_id: string | null;
          enabled: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          announcement_type: string;
          title_template: string;
          body_template: string;
          discord_channel_id?: string | null;
          enabled?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          announcement_type?: string;
          title_template?: string;
          body_template?: string;
          discord_channel_id?: string | null;
          enabled?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_snapshots: {
        Row: {
          id: number;
          workspace_id: string;
          roblox_group_id: string | null;
          member_count: number;
          online_count: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: never;
          workspace_id: string;
          roblox_group_id?: string | null;
          member_count: number;
          online_count?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: never;
          workspace_id?: string;
          roblox_group_id?: string | null;
          member_count?: number;
          online_count?: number | null;
          recorded_at?: string;
        };
        Relationships: [];
      };
      workspace_settings: {
        Row: {
          workspace_id: string;
          allowed_roblox_rank_min: number;
          allowed_roblox_role_ids: string[];
          theme_mode: string;
          theme_color_start: string;
          theme_color_end: string;
          welcome_enabled: boolean;
          welcome_channel_id: string | null;
          welcome_message: string;
          goodbye_enabled: boolean;
          goodbye_channel_id: string | null;
          goodbye_message: string;
          nickname_sync_enabled: boolean;
          verification_dm_enabled: boolean;
          role_sync_enabled: boolean;
          member_count_channel_id: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          allowed_roblox_rank_min?: number;
          allowed_roblox_role_ids?: string[];
          theme_mode?: string;
          theme_color_start?: string;
          theme_color_end?: string;
          welcome_enabled?: boolean;
          welcome_channel_id?: string | null;
          welcome_message?: string;
          goodbye_enabled?: boolean;
          goodbye_channel_id?: string | null;
          goodbye_message?: string;
          nickname_sync_enabled?: boolean;
          verification_dm_enabled?: boolean;
          role_sync_enabled?: boolean;
          member_count_channel_id?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          allowed_roblox_rank_min?: number;
          allowed_roblox_role_ids?: string[];
          theme_mode?: string;
          theme_color_start?: string;
          theme_color_end?: string;
          welcome_enabled?: boolean;
          welcome_channel_id?: string | null;
          welcome_message?: string;
          goodbye_enabled?: boolean;
          goodbye_channel_id?: string | null;
          goodbye_message?: string;
          nickname_sync_enabled?: boolean;
          verification_dm_enabled?: boolean;
          role_sync_enabled?: boolean;
          member_count_channel_id?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          created_by: string;
          discord_guild_id: string | null;
          discord_guild_name: string | null;
          id: string;
          appeal_allowed: boolean;
          appeal_note: string | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_reason: string | null;
          moderation_status: string;
          moderation_expires_at: string | null;
          name: string;
          operational_status: string;
          public_id: string;
          roblox_group_id: string | null;
          roblox_group_name: string | null;
          roblox_group_icon_url: string | null;
          slug: string;
          suspended_at: string | null;
          suspension_reason: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          discord_guild_id?: string | null;
          discord_guild_name?: string | null;
          id?: string;
          appeal_allowed?: boolean;
          appeal_note?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          moderation_status?: string;
          moderation_expires_at?: string | null;
          name: string;
          operational_status?: string;
          public_id?: string;
          roblox_group_id?: string | null;
          roblox_group_name?: string | null;
          roblox_group_icon_url?: string | null;
          slug: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          discord_guild_id?: string | null;
          discord_guild_name?: string | null;
          id?: string;
          appeal_allowed?: boolean;
          appeal_note?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          moderation_status?: string;
          moderation_expires_at?: string | null;
          name?: string;
          operational_status?: string;
          public_id?: string;
          roblox_group_id?: string | null;
          roblox_group_name?: string | null;
          roblox_group_icon_url?: string | null;
          slug?: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspaces_moderated_by_fkey";
            columns: ["moderated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      dashboard_access_state: { Args: never; Returns: Json };
      report_security_incident: {
        Args: {
          requested_scope: string;
          requested_target?: string;
          requested_details?: Json;
        };
        Returns: number;
      };
      staff_security_incidents: { Args: never; Returns: Json };
      staff_resolve_security_incident: {
        Args: { incident_id: number };
        Returns: boolean;
      };
      bot_claim_security_incidents: { Args: never; Returns: Json };
      staff_nexora_groups: { Args: never; Returns: Json };
      staff_add_nexora_group: {
        Args: {
          group_id: string;
          group_name: string;
          group_logo_url: string;
          member_count: number;
          owner_user_id: string;
          owner_username: string;
          owner_display_name: string;
          discord_url?: string;
        };
        Returns: number;
      };
      staff_remove_nexora_group: {
        Args: { group_record_id: number };
        Returns: boolean;
      };
      staff_archive_beta_application: {
        Args: { application_id: string };
        Returns: boolean;
      };
      staff_delete_beta_application: {
        Args: { application_id: string };
        Returns: boolean;
      };
      workspace_rank_candidates: {
        Args: { target_workspace_id: string };
        Returns: Json;
      };
      create_workspace_rank_request: {
        Args: {
          target_workspace_id: string;
          target_roblox_user_id: string;
          target_role_id: string;
          target_role_name: string;
          request_reason: string;
        };
        Returns: string;
      };
      get_public_platform_settings: { Args: never; Returns: Json };
      bot_set_beta_enabled: {
        Args: { requested_enabled: boolean; actor_discord_id: string };
        Returns: Json;
      };
      bot_set_workspace_creation_enabled: {
        Args: { actor_discord_id: string; requested_enabled: boolean };
        Returns: Json;
      };
      redeem_staff_access_code: { Args: { raw_code: string }; Returns: Json };
      revoke_current_staff_session: { Args: never; Returns: boolean };
      bot_create_staff_access_code: {
        Args: {
          raw_code: string;
          guild_id: string;
          creator_discord_id: string;
          requested_role?: string;
        };
        Returns: Json;
      };
      submit_beta_application: {
        Args: {
          applicant_name: string;
          applicant_email: string;
          applicant_age: number;
        };
        Returns: Json;
      };
      check_beta_application: {
        Args: { applicant_email: string; lookup_code: string };
        Returns: Json;
      };
      record_beta_notification: {
        Args: {
          application_id: string;
          lookup_code: string;
          delivered: boolean;
          message_id?: string;
        };
        Returns: boolean;
      };
      staff_beta_applications: { Args: never; Returns: Json };
      staff_update_beta_application: {
        Args: { application_id: string; requested_status: string };
        Returns: Json;
      };
      staff_access_state: { Args: never; Returns: Json };
      staff_console_state: {
        Args: { search_query?: string; status_filter?: string };
        Returns: Json;
      };
      staff_grant_role: {
        Args: { target_email: string; target_role: string };
        Returns: Json;
      };
      staff_moderate_workspace: {
        Args: {
          action_reason: string;
          appeal_message?: string;
          can_appeal?: boolean;
          moderation_action: string;
          suspension_days?: number;
          target_workspace_id: string;
        };
        Returns: Json;
      };
      staff_revoke_role: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      staff_find_workspaces: { Args: { group_query: string }; Returns: Json };
      staff_partners: { Args: never; Returns: Json };
      staff_add_partner: {
        Args: {
          group_id: string;
          group_name: string;
          group_logo_url: string;
          member_count: number;
          owner_user_id: string;
          owner_username: string;
          owner_display_name: string;
          discord_url: string;
        };
        Returns: string;
      };
      staff_remove_partner: {
        Args: { partner_id: string };
        Returns: boolean;
      };
      workspace_control_state: {
        Args: { target_public_id: string };
        Returns: Json;
      };
      update_workspace_profile: {
        Args: { target_workspace_id: string; requested_name: string };
        Returns: boolean;
      };
      invite_workspace_member: {
        Args: {
          target_workspace_id: string;
          target_email: string;
          requested_role: string;
        };
        Returns: Json;
      };
      manage_workspace_member: {
        Args: {
          target_workspace_id: string;
          target_user_id: string;
          requested_role: string;
          requested_action: string;
        };
        Returns: boolean;
      };
      transfer_workspace_ownership: {
        Args: { target_workspace_id: string; target_user_id: string };
        Returns: boolean;
      };
      set_workspace_lifecycle: {
        Args: {
          target_workspace_id: string;
          requested_action: string;
          confirmation_name: string;
        };
        Returns: Json;
      };
      disconnect_workspace_integration: {
        Args: { target_workspace_id: string; target_provider: string };
        Returns: boolean;
      };
      save_community_messaging: {
        Args: {
          target_workspace_id: string;
          requested_welcome_enabled: boolean;
          requested_welcome_channel_id: string;
          requested_welcome_message: string;
          requested_goodbye_enabled: boolean;
          requested_goodbye_channel_id: string;
          requested_goodbye_message: string;
          requested_nickname_sync_enabled: boolean;
          requested_verification_dm_enabled: boolean;
          requested_role_sync_enabled: boolean;
          requested_member_count_channel_id: string;
        };
        Returns: boolean;
      };
      save_workspace_settings: {
        Args: {
          target_workspace_id: string;
          rank_min: number;
          role_ids: string[];
        };
        Returns: boolean;
      };
      save_workspace_theme: {
        Args: {
          target_workspace_id: string;
          requested_theme_mode: string;
          requested_color_start: string;
          requested_color_end: string;
        };
        Returns: boolean;
      };
      set_workspace_roblox_group: {
        Args: {
          target_workspace_id: string;
          group_id: string;
          group_name: string;
          icon_url: string;
          oauth_verified: boolean;
        };
        Returns: boolean;
      };
      create_discord_link_code: {
        Args: { target_workspace_id: string };
        Returns: Json;
      };
      claim_discord_link_code: {
        Args: {
          raw_code: string;
          guild_id: string;
          guild_name: string;
          discord_user_id: string;
        };
        Returns: Json;
      };
      authenticate_workspace_api_key: {
        Args: { raw_key: string };
        Returns: Json;
      };
      release_expired_staff_suspensions: {
        Args: { candidate_secret: string };
        Returns: number;
      };
      claim_free_membership_checks: {
        Args: { batch_size?: number; candidate_secret: string };
        Returns: {
          owner_user_id: string;
          plan_key: string;
          plan_status: string;
          roblox_user_id: string;
          workspace_id: string;
        }[];
      };
      complete_onboarding: { Args: never; Returns: Json };
      confirm_password_set: { Args: never; Returns: string };
      create_workspace: {
        Args: { workspace_name: string; workspace_slug: string };
        Returns: string;
      };
      get_free_membership_policy: { Args: never; Returns: Json };
      issue_workspace_api_key: {
        Args: { p_name?: string; p_workspace_id: string };
        Returns: Json;
      };
      onboarding_state: { Args: never; Returns: Json };
      record_free_membership_check: {
        Args: {
          candidate_secret: string;
          check_result: string;
          error_code?: string;
          target_workspace_id: string;
        };
        Returns: string;
      };
      record_owner_membership_preflight: {
        Args: {
          candidate_secret: string;
          check_result: string;
          target_user_id: string;
        };
        Returns: undefined;
      };
      record_status_snapshots: {
        Args: { candidate_secret: string; snapshots: Json };
        Returns: number;
      };
      revoke_workspace_api_key: {
        Args: { p_key_id: string };
        Returns: undefined;
      };
      rotate_workspace_api_key: {
        Args: { p_workspace_id: string };
        Returns: Json;
      };
      save_onboarding_profile: {
        Args: {
          p_contact_email: string;
          p_first_name: string;
          p_last_name: string;
        };
        Returns: undefined;
      };
      select_onboarding_plan: {
        Args: { p_plan_key: string };
        Returns: undefined;
      };
      select_onboarding_roblox_group: {
        Args: {
          p_group_id: string;
          p_group_name: string;
          p_group_role: string;
        };
        Returns: undefined;
      };
      set_roblox_link_deferred: {
        Args: { p_deferred: boolean };
        Returns: undefined;
      };
      sync_auth_identities: { Args: never; Returns: string[] };
      sync_discord_identity: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
