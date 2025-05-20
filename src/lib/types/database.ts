// lib/types/database.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | null
          status: 'pending' | 'completed' | 'archived'
          parent_id: string | null
          is_expanded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          status?: 'pending' | 'completed' | 'archived'
          parent_id?: string | null
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          status?: 'pending' | 'completed' | 'archived'
          parent_id?: string | null
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      todo_notes: {
        Row: {
          id: string
          todo_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          content?: string
          created_at?: string
        }
      }
      todo_timers: {
        Row: {
          id: string
          todo_id: string
          duration_minutes: number
          start_time: string | null
          paused_time_remaining: number | null
          is_running: boolean
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          duration_minutes?: number
          start_time?: string | null
          paused_time_remaining?: number | null
          is_running?: boolean
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          duration_minutes?: number
          start_time?: string | null
          paused_time_remaining?: number | null
          is_running?: boolean
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency: string
          streak_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency: string
          streak_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency?: string
          streak_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          reminder_time: string
          repeat_frequency: string | null
          status: 'pending' | 'completed' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          reminder_time: string
          repeat_frequency?: string | null
          status?: 'pending' | 'completed' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          reminder_time?: string
          repeat_frequency?: string | null
          status?: 'pending' | 'completed' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          color: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          color?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          color?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          all_day: boolean
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          all_day?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          all_day?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          type: string
          entity_id: string
          entity_type: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          entity_id: string
          entity_type: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          entity_id?: string
          entity_type?: string
          description?: string | null
          created_at?: string
        }
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