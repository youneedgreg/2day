// lib/utils/database/reminders.ts
import { createClient } from '@/lib/utils/supabase/client'
import { Database } from '@/lib/types/database'

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
export async function getReminders(userId: string): Promise<Reminder[]> {
  const supabase = createClient()
  
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'dismissed')
      .order('reminder_time', { ascending: true })

    if (error) throw error
    return reminders || []
  } catch (error) {
    console.error('Error fetching reminders:', error)
    throw error
  }
}

// Create a new reminder
export async function createReminder(userId: string, input: CreateReminderInput): Promise<Reminder> {
  const supabase = createClient()
  
  try {
    const reminderData = {
      user_id: userId,
      title: input.title,
      description: input.description || null,
      reminder_time: input.reminder_time,
      repeat_frequency: input.repeat_frequency || 'none',
      status: 'pending' as const,
      priority: input.priority || 'medium',
      space_id: input.space_id || null
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert(reminderData)
      .select()
      .single()

    if (error) throw error
    return reminder
  } catch (error) {
    console.error('Error creating reminder:', error)
    throw error
  }
}

// Update a reminder
export async function updateReminder(reminderId: string, updates: UpdateReminderInput): Promise<Reminder> {
  const supabase = createClient()
  
  try {
    const { data: reminder, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single()

    if (error) throw error
    return reminder
  } catch (error) {
    console.error('Error updating reminder:', error)
    throw error
  }
}

// Mark reminder as completed
export async function completeReminder(reminderId: string): Promise<Reminder> {
  return updateReminder(reminderId, { status: 'completed' })
}

// Mark reminder as dismissed (delete)
export async function dismissReminder(reminderId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'dismissed' })
      .eq('id', reminderId)

    if (error) throw error
  } catch (error) {
    console.error('Error dismissing reminder:', error)
    throw error
  }
}

// Get upcoming reminders (next 7 days)
export async function getUpcomingReminders(userId: string): Promise<Reminder[]> {
  const supabase = createClient()
  
  try {
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(now.getDate() + 7)

    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('reminder_time', now.toISOString())
      .lte('reminder_time', nextWeek.toISOString())
      .order('reminder_time', { ascending: true })

    if (error) throw error
    return reminders || []
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error)
    throw error
  }
}

// Get overdue reminders
export async function getOverdueReminders(userId: string): Promise<Reminder[]> {
  const supabase = createClient()
  
  try {
    const now = new Date().toISOString()

    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('reminder_time', now)
      .order('reminder_time', { ascending: false })

    if (error) throw error
    return reminders || []
  } catch (error) {
    console.error('Error fetching overdue reminders:', error)
    throw error
  }
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
export function subscribeToReminderChanges(userId: string, callback: (payload: any) => void) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('reminders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Reminders table change:', payload)
        callback({
          ...payload,
          table: 'reminders',
          eventType: payload.eventType
        })
      }
    )
    .subscribe((status) => {
      console.log('Reminders subscription status:', status)
    })

  return subscription
}