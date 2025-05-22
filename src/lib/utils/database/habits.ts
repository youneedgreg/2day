// lib/utils/database/habits.ts
import { createClient } from '@/lib/utils/supabase/client'
import { Database } from '@/lib/types/database'

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
export async function getHabits(userId: string): Promise<HabitWithCompletions[]> {
  const supabase = createClient()
  
  try {
    // Get habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (habitsError) throw habitsError

    // Get completions for all habits
    const habitIds = habits?.map(h => h.id) || []
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)
      .order('completed_at', { ascending: false })

    if (completionsError) throw completionsError

    // Combine data
    const habitsWithCompletions: HabitWithCompletions[] = (habits || []).map(habit => ({
      ...habit,
      habit_completions: completions?.filter(completion => completion.habit_id === habit.id) || []
    }))

    return habitsWithCompletions
  } catch (error) {
    console.error('Error fetching habits:', error)
    throw error
  }
}

// Create a new habit
export async function createHabit(userId: string, input: CreateHabitInput): Promise<HabitWithCompletions> {
  const supabase = createClient()
  
  try {
    // Store frequency_days as a JSON field in description for now, or you can add a new column
    const habitData = {
      user_id: userId,
      title: input.title,
      description: input.description || JSON.stringify({ 
        type: input.habit_type || 'builder',
        frequency_days: input.frequency_days || []
      }),
      frequency: input.frequency,
      streak_count: 0
    }

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .insert(habitData)
      .select()
      .single()

    if (habitError) throw habitError

    return {
      ...habit,
      habit_completions: []
    }
  } catch (error) {
    console.error('Error creating habit:', error)
    throw error
  }
}

// Update a habit
export async function updateHabit(habitId: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<HabitWithCompletions> {
  const supabase = createClient()
  
  try {
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single()

    if (habitError) throw habitError

    // Get completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false })

    if (completionsError) throw completionsError

    return {
      ...habit,
      habit_completions: completions || []
    }
  } catch (error) {
    console.error('Error updating habit:', error)
    throw error
  }
}

// Complete a habit (mark as done for a specific date)
export async function completeHabit(input: CompleteHabitInput): Promise<HabitCompletion> {
  const supabase = createClient()
  
  try {
    const completedAt = input.completed_at || new Date().toISOString()
    
    const { data: completion, error: completionError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: input.habit_id,
        completed_at: completedAt
      })
      .select()
      .single()

    if (completionError) throw completionError

    // Update streak count
    await updateHabitStreak(input.habit_id)

    return completion
  } catch (error) {
    console.error('Error completing habit:', error)
    throw error
  }
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

    // Update streak count
    await updateHabitStreak(habitId)
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

// Update habit streak count based on completions
async function updateHabitStreak(habitId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    // Get all completions for this habit, ordered by date
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false })

    if (completionsError) throw completionsError

    // Calculate current streak
    let streak = 0
    const today = new Date()
    
    if (completions && completions.length > 0) {
      // Convert completions to dates and remove duplicates
      const completionDates = Array.from(new Set(
        completions.map(c => c.completed_at.split('T')[0])
      )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      // Check for consecutive days starting from today
      for (let i = 0; i < completionDates.length; i++) {
        const completionDate = new Date(completionDates[i])
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)
        
        const completionDateStr = completionDate.toISOString().split('T')[0]
        const expectedDateStr = expectedDate.toISOString().split('T')[0]
        
        if (completionDateStr === expectedDateStr) {
          streak++
        } else {
          break
        }
      }
    }

    // Update the habit with new streak count
    const { error: updateError } = await supabase
      .from('habits')
      .update({ streak_count: streak })
      .eq('id', habitId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('Error updating habit streak:', error)
    throw error
  }
}

// Delete a habit
export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting habit:', error)
    throw error
  }
}

// Define types for real-time change payloads
interface RealtimeChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown> | null
  old: Record<string, unknown> | null
  table: 'habits' | 'habit_completions'
}

// Subscribe to real-time changes for habits
export function subscribeToHabitChanges(userId: string, callback: (payload: RealtimeChangePayload) => void) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('habits_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Habits table change:', payload)
        callback({
          ...payload,
          table: 'habits',
          eventType: payload.eventType
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habit_completions'
      },
      (payload) => {
        console.log('Habit completions change:', payload)
        callback({
          ...payload,
          table: 'habit_completions',
          eventType: payload.eventType
        })
      }
    )
    .subscribe((status) => {
      console.log('Habits subscription status:', status)
    })

  return subscription
}