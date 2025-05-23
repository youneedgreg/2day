// lib/supabaseClient.ts
// Only export types from here

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          updated_at?: string | null
        }
      }
      todos: {
        Row: {
          id: string
          title: string
          description: string | null
          completed: boolean
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          completed?: boolean
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          completed?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      todo_notes: {
        Row: {
          id: string
          todo_id: string
          content: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          todo_id: string
          content: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          todo_id?: string
          content?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      todo_timers: {
        Row: {
          id: string
          todo_id: string
          duration: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          todo_id: string
          duration: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          todo_id?: string
          duration?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      habits: {
        Row: {
          id: string
          title: string
          description: string | null
          frequency: string
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          frequency: string
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          frequency?: string
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          completed_at: string
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          completed_at?: string
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      reminders: {
        Row: {
          status: string
          id: string
          title: string
          description: string | null
          due_date: string
          completed: boolean
          user_id: string
          space_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date: string
          completed?: boolean
          user_id: string
          space_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string
          completed?: boolean
          user_id?: string
          space_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      reminder_spaces: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}