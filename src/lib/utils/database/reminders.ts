// lib/utils/database/reminders.ts
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Reminder = Database['public']['Tables']['reminders']['Row']

export interface CreateReminderInput {
  title: string
  description?: string
  due_date: string
  repeat_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
  priority?: 'low' | 'medium' | 'high'
  space_id?: string
}

export interface UpdateReminderInput {
  title?: string
  description?: string
  due_date?: string
  repeat_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
  status?: 'pending' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  space_id?: string
}

// Get all reminders for a user
export async function getReminders(userId: string): Promise<Reminder[]> {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders || []
}

// ADDED: Subscribe to real-time reminder changes (MISSING FUNCTION)
export function subscribeToReminderChanges(userId: string, callback: (reminders: Reminder[]) => void) {
  const supabase = createClient()
  
  const channel = supabase
    .channel('reminders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Reload reminders when changes occur
        try {
          const reminders = await getReminders(userId)
          callback(reminders)
        } catch (error) {
          console.error('Error reloading reminders:', error)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

// ADDED: Complete a reminder (MISSING FUNCTION)
export async function completeReminder(reminderId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reminders')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', reminderId)
    .select()
    .single()

  if (error) {
    console.error('Error completing reminder:', error)
    throw error
  }

  return data
}

// Update dismissReminder function to use 'completed' status instead of 'dismissed'
export async function dismissReminder(reminderId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reminders')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', reminderId)
    .select()
    .single()

  if (error) {
    console.error('Error dismissing reminder:', error)
    throw error
  }

  return data
}

// Create a new reminder
export async function createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminder)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Update a reminder
export async function updateReminder(id: string, updates: Partial<Reminder>) {
  const supabase = createClient()
  
  const { data: reminder, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return reminder
}

// Delete a reminder
export async function deleteReminder(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Get reminders by space
export async function getRemindersBySpace(spaceId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('space_id', spaceId)
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders || []
}

// FIXED: Get upcoming reminders (next 7 days) - using due_date and status
export async function getUpcomingReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending') // Use status instead of completed
    .gte('due_date', new Date().toISOString()) // Use due_date instead of reminder_time
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders || []
}

// FIXED: Get overdue reminders - using due_date and status
export async function getOverdueReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending') // Use status instead of completed
    .lt('due_date', new Date().toISOString()) // Use due_date instead of reminder_time
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders || []
}

// Search reminders
export async function searchReminders(userId: string, query: string): Promise<Reminder[]> {
  const supabase = createClient()
  
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'dismissed')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('due_date', { ascending: true })

    if (error) throw error
    return reminders || []
  } catch (error) {
    console.error('Error searching reminders:', error)
    throw error
  }
}

// Subscribe to real-time changes for reminders
export const subscribeToReminders = (
  callback: (payload: RealtimePostgresChangesPayload<Reminder>) => void
) => {
  const supabase = createClient()
  return supabase
    .channel('reminders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders'
      },
      callback
    )
    .subscribe()
}

// Get completed reminders
export async function getCompletedReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
  
  if (error) throw error
  return reminders || []
}