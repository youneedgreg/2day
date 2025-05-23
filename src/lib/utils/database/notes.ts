// lib/utils/database/notes.ts
import { createClient } from '@/lib/supabaseBrowserClient'
import type { Database } from '@/lib/supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Note = Database['public']['Tables']['notes']['Row']

// Define types for metadata
interface RichTextMetadata {
  format?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    // Add other rich text formatting options as needed
  }
}

interface DrawingMetadata {
  paths?: Array<{
    points: Array<{ x: number; y: number }>
    color: string
    width: number
  }>
}

interface ChecklistMetadata {
  items?: Array<{
    id: string
    text: string
    completed: boolean
  }>
}

type NoteMetadata = RichTextMetadata | DrawingMetadata | ChecklistMetadata | Record<string, unknown>

export interface CreateNoteInput {
  title: string
  content?: string
  color?: string
  tags?: string[]
  note_type?: 'text' | 'rich_text' | 'drawing' | 'checklist'
  metadata?: NoteMetadata
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  color?: string
  tags?: string[]
  note_type?: 'text' | 'rich_text' | 'drawing' | 'checklist'
  metadata?: NoteMetadata
}

// Get all notes for a user
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return notes || []
}

// ADDED: Subscribe to real-time notes changes (MISSING FUNCTION)
export function subscribeToNotesChanges(userId: string, callback: (notes: Note[]) => void) {
  const supabase = createClient()
  
  const channel = supabase
    .channel('notes-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Reload notes when changes occur
        try {
          const notes = await getNotes(userId)
          callback(notes)
        } catch (error) {
          console.error('Error reloading notes:', error)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

// Create a new note
export async function createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Update a note
export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const supabase = createClient()
  
  const { data: note, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return note
}

// Delete a note
export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Search notes
export async function searchNotes(query: string, userId: string): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return notes || []
}

// Get notes by tag
export async function getNotesByTag(tag: string, userId: string): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .contains('tags', [tag])
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return notes || []
}

// Get all unique tags for a user
export async function getUserTags(userId: string): Promise<string[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('tags')
    .eq('user_id', userId)
    .not('tags', 'is', null)

  if (error) throw error
  
  // Extract and flatten all tags
  const allTags = notes?.reduce((acc: string[], note) => {
    if (note.tags && Array.isArray(note.tags)) {
      acc.push(...note.tags)
    }
    return acc
  }, []) || []
  
  // Return unique tags
  return Array.from(new Set(allTags))
}

// Get notes by color
export async function getNotesByColor(userId: string, color: string): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('color', color)
    .order('created_at', { ascending: false })

  if (error) throw error
  return notes || []
}

// Get notes by type
export async function getNotesByType(userId: string, noteType: 'text' | 'rich_text' | 'drawing' | 'checklist'): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('note_type', noteType)
    .order('created_at', { ascending: false })

  if (error) throw error
  return notes || []
}

// Duplicate a note
export async function duplicateNote(id: string): Promise<Note> {
  const supabase = createClient()
  
  // Get the original note
  const { data: originalNote, error: fetchError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  
  // Create a new note with the same content but a new ID
  const { data: duplicatedNote, error: createError } = await supabase
    .from('notes')
    .insert({
      ...originalNote,
      id: undefined,
      title: `${originalNote.title} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()

  if (createError) throw createError
  return duplicatedNote
}

// Subscribe to real-time changes for notes
export function subscribeToNotes(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Note>) => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('notes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
  
  return subscription
}

export async function getRecentNotes(userId: string, limit: number = 5): Promise<Note[]> {
  const supabase = createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return notes || []
}