// lib/types/database.ts

// Define types for metadata
type ReminderMetadata = {
  last_triggered?: string;
  next_trigger?: string;
  custom_data?: Record<string, unknown>;
}

type NoteMetadata = {
  last_edited_by?: string;
  version?: number;
  custom_data?: Record<string, unknown>;
  is_favorite?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
  font_family?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          habit_type: 'builder' | 'quitter' | null
          frequency_days: string[] | null
          is_active: boolean
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
          habit_type?: 'builder' | 'quitter' | null
          frequency_days?: string[] | null
          is_active?: boolean
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
          habit_type?: 'builder' | 'quitter' | null
          frequency_days?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          completed_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string
          status: string
          completed: boolean
          space_id: string | null
          created_at: string
          updated_at: string | null
          priority: string
          repeat_frequency: string
          location: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date: string
          status?: string
          completed?: boolean
          space_id?: string | null
          created_at?: string
          updated_at?: string | null
          priority?: string
          repeat_frequency?: string
          location?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string
          status?: string
          completed?: boolean
          space_id?: string | null
          created_at?: string
          updated_at?: string | null
          priority?: string
          repeat_frequency?: string
          location?: string | null
          tags?: string[] | null
        }
      }
      reminder_spaces: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon: string
          color: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          description?: string | null
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
          note_type: 'text' | 'rich_text' | 'drawing' | 'checklist' | null
          metadata: NoteMetadata | null
          is_pinned: boolean
          is_archived: boolean
          word_count: number
          character_count: number
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
          note_type?: 'text' | 'rich_text' | 'drawing' | 'checklist' | null
          metadata?: NoteMetadata | null
          is_pinned?: boolean
          is_archived?: boolean
          word_count?: number
          character_count?: number
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
          note_type?: 'text' | 'rich_text' | 'drawing' | 'checklist' | null
          metadata?: NoteMetadata | null
          is_pinned?: boolean
          is_archived?: boolean
          word_count?: number
          character_count?: number
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