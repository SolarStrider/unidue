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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          default_provider: string
          module_config: Json
          providers: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          default_provider?: string
          module_config?: Json
          providers?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          default_provider?: string
          module_config?: Json
          providers?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          google_event_id: string | null
          id: string
          notes: string
          priority: string
          status: string
          subject: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          google_event_id?: string | null
          id?: string
          notes?: string
          priority?: string
          status?: string
          subject: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          google_event_id?: string | null
          id?: string
          notes?: string
          priority?: string
          status?: string
          subject?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          label: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          label?: string
          subject?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          label?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          created_at: string
          date: string
          done: boolean
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          done?: boolean
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          done?: boolean
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          created_at: string
          id: string
          name: string
          source_note_id: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source_note_id?: string | null
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source_note_id?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          ease: number
          front: string
          id: string
          interval_days: number
          next_review: string
          times_known: number
          times_review: number
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          times_known?: number
          times_review?: number
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          times_known?: number
          times_review?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          calendar_id: string
          connection_api_key: string
          created_at: string
          sync_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id?: string
          connection_api_key: string
          created_at?: string
          sync_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          connection_api_key?: string
          created_at?: string
          sync_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          assignment: string
          created_at: string
          grade_value: string
          grading_system: string
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          assignment: string
          created_at?: string
          grade_value: string
          grading_system: string
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          assignment?: string
          created_at?: string
          grade_value?: string
          grading_system?: string
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          ai_summary: string
          assignment_id: string | null
          content: string
          created_at: string
          id: string
          pinned: boolean
          subject: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string
          assignment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          subject?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string
          assignment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          subject?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_format: string
          grading_system: string
          id: string
          name: string
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_format?: string
          grading_system?: string
          id: string
          name?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_format?: string
          grading_system?: string
          id?: string
          name?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number
          taken_at: string
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number
          taken_at?: string
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number
          taken_at?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          name: string
          questions: Json
          source_id: string | null
          source_label: string
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          name: string
          questions?: Json
          source_id?: string | null
          source_label?: string
          source_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          name?: string
          questions?: Json
          source_id?: string | null
          source_label?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          count: number
          last_completion_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          last_completion_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          last_completion_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
