// lib/utils/database/notes.ts
import { createClient } from '@/lib/utils/supabase/client'
import { Database } from '@/lib/types/database'

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
  
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return notes || []
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw error
  }
}

// Create a new note
export async function createNote(userId: string, input: CreateNoteInput): Promise<Note> {
  const supabase = createClient()
  
  try {
    const noteData = {
      user_id: userId,
      title: input.title,
      content: input.content || null,
      color: input.color || null,
      tags: input.tags || null,
      note_type: input.note_type || 'text',
      metadata: input.metadata || null
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert(noteData)
      .select()
      .single()

    if (error) throw error
    return note
  } catch (error) {
    console.error('Error creating note:', error)
    throw error
  }
}

// Update a note
export async function updateNote(noteId: string, updates: UpdateNoteInput): Promise<Note> {
  const supabase = createClient()
  
  try {
    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return note
  } catch (error) {
    console.error('Error updating note:', error)
    throw error
  }
}

// Delete a note
export async function deleteNote(noteId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}

// Search notes
export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  const supabase = createClient()
  
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return notes || []
  } catch (error) {
    console.error('Error searching notes:', error)
    throw error
  }
}

// Get notes by tag
export async function getNotesByTag(userId: string, tag: string): Promise<Note[]> {
  const supabase = createClient()
  
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('updated_at', { ascending: false })

    if (error) throw error
    return notes || []
  } catch (error) {
    console.error('Error fetching notes by tag:', error)
    throw error
  }
}

// Get all unique tags for a user
export async function getUserTags(userId: string): Promise<string[]> {
  const supabase = createClient()
  
  try {
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
  } catch (error) {
    console.error('Error fetching user tags:', error)
    throw error
  }
}

// Get notes by color
export async function getNotesByColor(userId: string, color: string): Promise<Note[]> {
  const supabase = createClient()
  
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('color', color)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return notes || []
  } catch (error) {
    console.error('Error fetching notes by color:', error)
    throw error
  }
}

// Get notes by type
export async function getNotesByType(userId: string, noteType: 'text' | 'rich_text' | 'drawing' | 'checklist'): Promise<Note[]> {
  const supabase = createClient()
  
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('note_type', noteType)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return notes || []
  } catch (error) {
    console.error('Error fetching notes by type:', error)
    throw error
  }
}

// Duplicate a note
export async function duplicateNote(userId: string, noteId: string): Promise<Note> {
  const supabase = createClient()
  
  try {
    // First get the original note
    const { data: originalNote, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    // Create a copy
    const { data: duplicatedNote, error: createError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: `${originalNote.title} (Copy)`,
        content: originalNote.content,
        color: originalNote.color,
        tags: originalNote.tags,
        note_type: originalNote.note_type,
        metadata: originalNote.metadata
      })
      .select()
      .single()

    if (createError) throw createError
    return duplicatedNote
  } catch (error) {
    console.error('Error duplicating note:', error)
    throw error
  }
}

// Subscribe to real-time changes for notes
export function subscribeToNotesChanges(
  userId: string,
  callback: (payload: {
    table: string
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Note | null
    old: Note | null
  }) => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('notes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Notes table change:', payload)
        callback({
          table: 'notes',
          eventType: payload.eventType,
          new: payload.new as Note | null,
          old: payload.old as Note | null
        })
      }
    )
    .subscribe((status) => {
      console.log('Notes subscription status:', status)
    })

  return subscription
}