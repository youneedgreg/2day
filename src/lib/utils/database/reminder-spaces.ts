// lib/utils/database/reminder-spaces.ts
import { createClient } from '@/lib/utils/supabase/client'

export interface ReminderSpace {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateReminderSpaceInput {
  name: string
  icon: string
  color: string
  description?: string
}

// Get all reminder spaces for a user
export async function getReminderSpaces(userId: string): Promise<ReminderSpace[]> {
  const supabase = createClient()
  
  try {
    const { data: spaces, error } = await supabase
      .from('reminder_spaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return spaces || []
  } catch (error) {
    console.error('Error fetching reminder spaces:', error)
    throw error
  }
}

// Create a new reminder space
export async function createReminderSpace(userId: string, input: CreateReminderSpaceInput): Promise<ReminderSpace> {
  const supabase = createClient()
  
  try {
    const spaceData = {
      user_id: userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      description: input.description || null
    }

    const { data: space, error } = await supabase
      .from('reminder_spaces')
      .insert(spaceData)
      .select()
      .single()

    if (error) throw error
    return space
  } catch (error) {
    console.error('Error creating reminder space:', error)
    throw error
  }
}

// Update a reminder space
export async function updateReminderSpace(spaceId: string, updates: Partial<CreateReminderSpaceInput>): Promise<ReminderSpace> {
  const supabase = createClient()
  
  try {
    const { data: space, error } = await supabase
      .from('reminder_spaces')
      .update(updates)
      .eq('id', spaceId)
      .select()
      .single()

    if (error) throw error
    return space
  } catch (error) {
    console.error('Error updating reminder space:', error)
    throw error
  }
}

// Delete a reminder space
export async function deleteReminderSpace(spaceId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('reminder_spaces')
      .delete()
      .eq('id', spaceId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting reminder space:', error)
    throw error
  }
}

// Get default reminder space for user
export async function getDefaultReminderSpace(userId: string): Promise<ReminderSpace> {
  const supabase = createClient()
  
  try {
    let { data: spaces, error } = await supabase
      .from('reminder_spaces')
      .select('*')
      .eq('user_id', userId)
      .eq('name', 'General')
      .limit(1)

    if (error) throw error

    // If no default space exists, create one
    if (!spaces || spaces.length === 0) {
      const defaultSpace = await createReminderSpace(userId, {
        name: 'General',
        icon: 'Bell',
        color: 'bg-blue-500'
      })
      return defaultSpace
    }

    return spaces[0]
  } catch (error) {
    console.error('Error getting default reminder space:', error)
    throw error
  }
}