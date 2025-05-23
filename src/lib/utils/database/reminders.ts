// lib/utils/database/reminders.ts
import { createClient } from '@/lib/supabaseBrowserClient'
import type { Database } from '@/lib/supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Reminder = Database['public']['Tables']['reminders']['Row']

export interface CreateReminderInput {
  title: string
  description?: string
  reminder_time: string
  repeat_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
  priority?: 'low' | 'medium' | 'high'
  space_id?: string
}

export interface UpdateReminderInput {
  title?: string
  description?: string
  reminder_time?: string
  repeat_frequency?: 'none' | 'daily' | 'weekly' | 'monthly'
  status?: 'pending' | 'completed' | 'dismissed'
  priority?: 'low' | 'medium' | 'high'
  space_id?: string
}

// Get all reminders for a user
export async function getReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders
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
  return reminders
}

// Get upcoming reminders (next 7 days)
export async function getUpcomingReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders
}

// Get overdue reminders
export async function getOverdueReminders(userId: string) {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
  
  if (error) throw error
  return reminders
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
      .order('reminder_time', { ascending: true })

    if (error) throw error
    return reminders || []
  } catch (error) {
    console.error('Error searching reminders:', error)
    throw error
  }
}

// Subscribe to real-time changes for reminders
export function subscribeToReminders(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Reminder>) => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('reminders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
  
  return subscription
}