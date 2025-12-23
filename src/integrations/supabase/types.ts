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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      global_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_flag: string | null
          away_score: number | null
          away_team: string
          created_at: string
          external_id: number | null
          home_flag: string | null
          home_score: number | null
          home_team: string
          id: string
          kickoff_time: string
          phase: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          away_flag?: string | null
          away_score?: number | null
          away_team: string
          created_at?: string
          external_id?: number | null
          home_flag?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          kickoff_time: string
          phase?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          away_flag?: string | null
          away_score?: number | null
          away_team?: string
          created_at?: string
          external_id?: number | null
          home_flag?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_time?: string
          phase?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          poule_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          poule_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          poule_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_poule_id_fkey"
            columns: ["poule_id"]
            isOneToOne: false
            referencedRelation: "poules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club: string | null
          country: string
          country_flag: string | null
          created_at: string
          date_of_birth: string | null
          goals: number
          id: string
          image_url: string | null
          jersey_number: number | null
          name: string
          position: string
          updated_at: string
        }
        Insert: {
          club?: string | null
          country: string
          country_flag?: string | null
          created_at?: string
          date_of_birth?: string | null
          goals?: number
          id?: string
          image_url?: string | null
          jersey_number?: number | null
          name: string
          position: string
          updated_at?: string
        }
        Update: {
          club?: string | null
          country?: string
          country_flag?: string | null
          created_at?: string
          date_of_birth?: string | null
          goals?: number
          id?: string
          image_url?: string | null
          jersey_number?: number | null
          name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      poule_members: {
        Row: {
          id: string
          joined_at: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          points: number
          poule_id: string
          rank: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          points?: number
          poule_id: string
          rank?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          points?: number
          poule_id?: string
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poule_members_poule_id_fkey"
            columns: ["poule_id"]
            isOneToOne: false
            referencedRelation: "poules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poule_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poules: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          creator_id: string
          deadline: string | null
          description: string | null
          entry_fee: number
          id: string
          invite_code: string | null
          max_members: number | null
          name: string
          prize_distribution: Json | null
          scoring_rules: Json | null
          status: Database["public"]["Enums"]["poule_status"]
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          creator_id: string
          deadline?: string | null
          description?: string | null
          entry_fee?: number
          id?: string
          invite_code?: string | null
          max_members?: number | null
          name: string
          prize_distribution?: Json | null
          scoring_rules?: Json | null
          status?: Database["public"]["Enums"]["poule_status"]
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string | null
          entry_fee?: number
          id?: string
          invite_code?: string | null
          max_members?: number | null
          name?: string
          prize_distribution?: Json | null
          scoring_rules?: Json | null
          status?: Database["public"]["Enums"]["poule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poules_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          id: string
          is_ai_generated: boolean
          match_id: string
          points_earned: number | null
          poule_id: string
          predicted_away_score: number
          predicted_home_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          match_id: string
          points_earned?: number | null
          poule_id: string
          predicted_away_score: number
          predicted_home_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          match_id?: string
          points_earned?: number | null
          poule_id?: string
          predicted_away_score?: number
          predicted_home_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_poule_id_fkey"
            columns: ["poule_id"]
            isOneToOne: false
            referencedRelation: "poules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topscorer_predictions: {
        Row: {
          created_at: string
          id: string
          player_id: string
          points_earned: number
          poule_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          points_earned?: number
          poule_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          points_earned?: number
          poule_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topscorer_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "wk_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topscorer_predictions_poule_id_fkey"
            columns: ["poule_id"]
            isOneToOne: false
            referencedRelation: "poules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      winner_predictions: {
        Row: {
          country: string
          country_flag: string | null
          created_at: string
          id: string
          points_earned: number
          poule_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country: string
          country_flag?: string | null
          created_at?: string
          id?: string
          points_earned?: number
          poule_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          country_flag?: string | null
          created_at?: string
          id?: string
          points_earned?: number
          poule_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winner_predictions_poule_id_fkey"
            columns: ["poule_id"]
            isOneToOne: false
            referencedRelation: "poules"
            referencedColumns: ["id"]
          },
        ]
      }
      wk_players: {
        Row: {
          age: number
          country: string
          country_flag: string | null
          created_at: string
          goals: number
          id: string
          international_caps: number
          name: string
          position: string
          updated_at: string
        }
        Insert: {
          age: number
          country: string
          country_flag?: string | null
          created_at?: string
          goals?: number
          id?: string
          international_caps?: number
          name: string
          position: string
          updated_at?: string
        }
        Update: {
          age?: number
          country?: string
          country_flag?: string | null
          created_at?: string
          goals?: number
          id?: string
          international_caps?: number
          name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_poule_creator: {
        Args: { _poule_id: string; _user_id: string }
        Returns: boolean
      }
      is_poule_member: {
        Args: { _poule_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      approval_status: "pending" | "approved" | "rejected"
      match_status: "pending" | "live" | "finished"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      poule_status: "open" | "closed" | "finished"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      approval_status: ["pending", "approved", "rejected"],
      match_status: ["pending", "live", "finished"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      poule_status: ["open", "closed", "finished"],
    },
  },
} as const
