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
      generations: {
        Row: {
          ai_tool: string
          category: string
          created_at: string
          generated_prompts: Json
          id: string
          input_description: string
          settings: Json | null
          user_id: string
        }
        Insert: {
          ai_tool: string
          category: string
          created_at?: string
          generated_prompts?: Json
          id?: string
          input_description: string
          settings?: Json | null
          user_id: string
        }
        Update: {
          ai_tool?: string
          category?: string
          created_at?: string
          generated_prompts?: Json
          id?: string
          input_description?: string
          settings?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_remaining: number
          credits_reset_at: string | null
          email: string
          id: string
          name: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number
          credits_reset_at?: string | null
          email: string
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number
          credits_reset_at?: string | null
          email?: string
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          ai_tool: string
          author_id: string | null
          category: string
          copies: number
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          premium: boolean
          prompt_text: string
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number
          views: number
        }
        Insert: {
          ai_tool: string
          author_id?: string | null
          category: string
          copies?: number
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          premium?: boolean
          prompt_text: string
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number
          views?: number
        }
        Update: {
          ai_tool?: string
          author_id?: string | null
          category?: string
          copies?: number
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          premium?: boolean
          prompt_text?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number
          views?: number
        }
        Relationships: []
      }
      prompt_votes: {
        Row: {
          id: string
          user_id: string
          prompt_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_votes_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          helpful_count: number
          id: string
          rating: number
          title: string | null
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          rating: number
          title?: string | null
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          rating?: number
          title?: string | null
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_prompts: {
        Row: {
          created_at: string
          folder: string | null
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string | null
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string | null
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          affiliate_link: string | null
          category: string[] | null
          cons: string[] | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          logo_url: string | null
          name: string
          pricing_max: number | null
          pricing_min: number | null
          pricing_model: string | null
          pros: string[] | null
          rating: number | null
          review_count: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliate_link?: string | null
          category?: string[] | null
          cons?: string[] | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          pricing_max?: number | null
          pricing_min?: number | null
          pricing_model?: string | null
          pros?: string[] | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliate_link?: string | null
          category?: string[] | null
          cons?: string[] | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          pricing_max?: number | null
          pricing_min?: number | null
          pricing_model?: string | null
          pros?: string[] | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_profiles_intent: {
        Row: {
          id: string
          user_id: string
          answer_time: string
          answer_capital: string
          answer_target_speed: string
          answer_comfort: string
          answer_risk: string
          answer_skill: string
          answer_skill_secondary: string
          answer_interest_market: string
          answer_audience_access: string
          answer_daily_routine: string
          answer_preferred_platform: string
          score_time: number
          score_capital: number
          score_target_speed: number
          score_comfort: number
          score_risk: number
          score_skill: number
          score_skill_secondary: number
          score_interest_market: number
          score_audience_access: number
          score_daily_routine: number
          score_preferred_platform: number
          answer_tags: Json
          segment_tag: string
          primary_path: string
          alternate_path: string | null
          eliminated_paths: string[]
          path_scores: Json
          ai_why_text: string | null
          ai_custom_tasks: Json | null
          ai_niche_suggestion: string | null
          is_active: boolean
          current_week: number
          started_at: string
          last_checkpoint_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          answer_time: string
          answer_capital: string
          answer_target_speed: string
          answer_comfort: string
          answer_risk: string
          answer_skill: string
          answer_skill_secondary?: string
          answer_interest_market?: string
          answer_audience_access?: string
          answer_daily_routine?: string
          answer_preferred_platform?: string
          score_time?: number
          score_capital?: number
          score_target_speed?: number
          score_comfort?: number
          score_risk?: number
          score_skill?: number
          score_skill_secondary?: number
          score_interest_market?: number
          score_audience_access?: number
          score_daily_routine?: number
          score_preferred_platform?: number
          answer_tags?: Json
          segment_tag: string
          primary_path: string
          alternate_path?: string | null
          eliminated_paths?: string[]
          path_scores?: Json
          ai_why_text?: string | null
          ai_custom_tasks?: Json | null
          ai_niche_suggestion?: string | null
          is_active?: boolean
          current_week?: number
          started_at?: string
          last_checkpoint_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          answer_time?: string
          answer_capital?: string
          answer_target_speed?: string
          answer_comfort?: string
          answer_risk?: string
          answer_skill?: string
          answer_skill_secondary?: string
          answer_interest_market?: string
          answer_audience_access?: string
          answer_daily_routine?: string
          answer_preferred_platform?: string
          score_time?: number
          score_capital?: number
          score_target_speed?: number
          score_comfort?: number
          score_risk?: number
          score_skill?: number
          score_skill_secondary?: number
          score_interest_market?: number
          score_audience_access?: number
          score_daily_routine?: number
          score_preferred_platform?: number
          answer_tags?: Json
          segment_tag?: string
          primary_path?: string
          alternate_path?: string | null
          eliminated_paths?: string[]
          path_scores?: Json
          ai_why_text?: string | null
          ai_custom_tasks?: Json | null
          ai_niche_suggestion?: string | null
          is_active?: boolean
          current_week?: number
          started_at?: string
          last_checkpoint_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_path_progress: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          path_id: string
          week_number: number
          task_index: number
          task_text: string
          is_completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          path_id: string
          week_number: number
          task_index: number
          task_text: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          path_id?: string
          week_number?: number
          task_index?: number
          task_text?: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_path_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkpoints: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          week_number: number
          completion_rate: number
          self_report_status: string | null
          stuck_area: string | null
          market_response: boolean | null
          system_adjustment: string | null
          ai_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          week_number: number
          completion_rate?: number
          self_report_status?: string | null
          stuck_area?: string | null
          market_response?: boolean | null
          system_adjustment?: string | null
          ai_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          week_number?: number
          completion_rate?: number
          self_report_status?: string | null
          stuck_area?: string | null
          market_response?: boolean | null
          system_adjustment?: string | null
          ai_feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkpoints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_personalization_log: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          request_type: string
          ai_input: Json
          ai_output: string
          model_used: string
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          request_type: string
          ai_input: Json
          ai_output: string
          model_used?: string
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          request_type?: string
          ai_input?: Json
          ai_output?: string
          model_used?: string
          processing_time_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_personalization_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      market_signals: {
        Row: {
          id: string
          path_id: string
          category: string
          keyword: string
          trend_score: number
          trend_direction: string
          source: string
          confidence: number
          is_hot: boolean
          suggestion: string | null
          metadata: Json
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          path_id: string
          category: string
          keyword: string
          trend_score?: number
          trend_direction?: string
          source?: string
          confidence?: number
          is_hot?: boolean
          suggestion?: string | null
          metadata?: Json
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          path_id?: string
          category?: string
          keyword?: string
          trend_score?: number
          trend_direction?: string
          source?: string
          confidence?: number
          is_hot?: boolean
          suggestion?: string | null
          metadata?: Json
          last_updated?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_vote: {
        Args: { p_prompt_id: string }
        Returns: boolean
      }
      has_premium_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_copy: {
        Args: { p_prompt_id: string }
        Returns: undefined
      }
      increment_view: {
        Args: { p_prompt_id: string }
        Returns: undefined
      }
      toggle_upvote: {
        Args: { p_prompt_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      difficulty_level: "beginner" | "intermediate" | "advanced"
      subscription_plan: "free" | "pro" | "agency"
      subscription_status: "active" | "cancelled" | "expired"
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
      difficulty_level: ["beginner", "intermediate", "advanced"],
      subscription_plan: ["free", "pro", "agency"],
      subscription_status: ["active", "cancelled", "expired"],
    },
  },
} as const
