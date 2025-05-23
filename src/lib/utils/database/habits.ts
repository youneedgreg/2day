// lib/utils/database/habits.ts
import { createClient } from '@/lib/supabaseBrowserClient'
import type { Database } from '@/lib/supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Habit = Database['public']['Tables']['habits']['Row']
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']

export interface HabitWithCompletions extends Habit {
  habit_completions: HabitCompletion[]
}

export interface CreateHabitInput {
  title: string
  description?: string
  frequency: string
  habit_type?: 'builder' | 'quitter'
  frequency_days?: string[] // For storing days like ["Mon", "Tue", "Wed"]
}

export interface CompleteHabitInput {
  habit_id: string
  completed_at?: string // ISO date string, defaults to now
}

// Get all habits for a user with their completions
export async function getHabits(userId: string) {
  const supabase = createClient()
  
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (habitsError) throw habitsError
  
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .in('habit_id', habits.map(habit => habit.id))
    .gte('completed_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
  
  if (completionsError) throw completionsError
  
  return habits.map(habit => ({
    ...habit,
    completions: completions.filter(completion => completion.habit_id === habit.id)
  }))
}

// Create a new habit
export async function createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error: habitError } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single()
  
  if (habitError) throw habitError
  
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', data.id)
    .gte('completed_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
  
  if (completionsError) throw completionsError
  
  return {
    ...data,
    completions
  }
}

// Update a habit
export async function updateHabit(id: string, updates: Partial<Habit>) {
  const supabase = createClient()
  
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (habitError) throw habitError
  
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', id)
    .gte('completed_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
  
  if (completionsError) throw completionsError
  
  return {
    ...habit,
    completions
  }
}

// Complete a habit (mark as done for a specific date)
export async function completeHabit(habitId: string) {
  const supabase = createClient()
  
  const { data: completion, error: completionError } = await supabase
    .from('habit_completions')
    .insert({
      habit_id: habitId,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (completionError) throw completionError
  return completion
}

// Remove a habit completion
export async function uncompleteHabit(habitId: string, date: string): Promise<void> {
  const supabase = createClient()
  
  try {
    // Find and delete the completion for this date
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay)

    if (error) throw error
  } catch (error) {
    console.error('Error uncompleting habit:', error)
    throw error
  }
}

// Check if habit is completed on a specific date
export async function isHabitCompletedOnDate(habitId: string, date: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay)
      .limit(1)

    if (error) throw error
    
    return (data && data.length > 0)
  } catch (error) {
    console.error('Error checking habit completion:', error)
    return false
  }
}

// Delete a habit
export async function deleteHabit(id: string) {
  const supabase = createClient()
  
  // Delete related completions first
  const { error: completionsError } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', id)
  
  if (completionsError) throw completionsError
  
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Subscribe to real-time changes for habits
export function subscribeToHabits(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Habit>) => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('habits')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
  
  return subscription
}

export async function getHabitStats(habitId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('habit_completions')
    .select('completed_at')
    .eq('habit_id', habitId)
    .order('completed_at', { ascending: false })
  
  if (error) throw error
  
  return {
    totalCompletions: data.length,
    lastCompletion: data[0]?.completed_at || null,
    streak: calculateStreak(data.map(c => new Date(c.completed_at)))
  }
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  
  let streak = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime())
  const lastDate = new Date(sortedDates[0])
  lastDate.setHours(0, 0, 0, 0)
  
  // If the last completion was not today or yesterday, streak is broken
  const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  if (dayDiff > 1) return 0
  
  // Calculate streak
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i])
    currentDate.setHours(0, 0, 0, 0)
    
    const prevDate = new Date(sortedDates[i - 1])
    prevDate.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}