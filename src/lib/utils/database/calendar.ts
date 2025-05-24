import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

// Calendar events operations
export const getCalendarEvents = async (userId: string, startDate: string, endDate: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .order('start_time', { ascending: true })
  
  if (error) throw error
  return data
}

export const createCalendarEvent = async (event: Database['public']['Tables']['calendar_events']['Insert']) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateCalendarEvent = async (eventId: string, updates: Database['public']['Tables']['calendar_events']['Update']) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteCalendarEvent = async (eventId: string) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
  
  if (error) throw error
} 