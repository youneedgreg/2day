import { createClient } from '@/lib/supabaseBrowserClient'
import type { Database } from '@/lib/supabaseClient'

// Create a client-side Supabase client
export const supabase = createClient()

// Profile operations
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateProfile = async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Habits operations
export const getHabits = async (userId: string) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_completions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createHabit = async (habit: Database['public']['Tables']['habits']['Insert']) => {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const completeHabit = async (habitId: string) => {
  const { data, error } = await supabase
    .from('habit_completions')
    .insert({ habit_id: habitId })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Todos operations
export const getTodos = async () => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createTodo = async (todo: Database['public']['Tables']['todos']['Insert']) => {
  const { data, error } = await supabase
    .from('todos')
    .insert(todo)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateTodo = async (todoId: string, updates: Database['public']['Tables']['todos']['Update']) => {
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', todoId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Reminders operations
export const getReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('reminder_time', { ascending: true })
  
  if (error) throw error
  return data
}

export const createReminder = async (reminder: Database['public']['Tables']['reminders']['Insert']) => {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminder)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Notes operations
export const getNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createNote = async (note: Database['public']['Tables']['notes']['Insert']) => {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateNote = async (noteId: string, updates: Database['public']['Tables']['notes']['Update']) => {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Activity operations
export const getActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

export const createActivity = async (activity: Database['public']['Tables']['activities']['Insert']) => {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Real-time subscriptions
export const subscribeToChanges = <T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: {
    event: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Database['public']['Tables'][T]['Row'] | null
    old: Database['public']['Tables'][T]['Row'] | null
  }) => void
) => {
  return supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      callback
    )
    .subscribe()
} 