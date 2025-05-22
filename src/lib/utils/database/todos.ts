// lib/utils/database/todos.ts
import { createClient } from '@/lib/utils/supabase/client'
import { Database } from '@/lib/types/database'

type Todo = Database['public']['Tables']['todos']['Row']
type TodoNote = Database['public']['Tables']['todo_notes']['Row']
type TodoTimer = Database['public']['Tables']['todo_timers']['Row']

export interface TodoWithRelations extends Todo {
  notes?: TodoNote[]
  timer?: TodoTimer | null
  children?: TodoWithRelations[]
}

export interface CreateTodoInput {
  title: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  parent_id?: string
  timer?: {
    duration_minutes: number
  }
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'completed' | 'archived'
  parent_id?: string
  is_expanded?: boolean
}

// Define types for real-time changes
type RealtimeChangePayload = {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown> | null
  old: Record<string, unknown> | null
  errors: string[]
}

// Get all todos for a user with their relations
export async function getTodos(userId: string): Promise<TodoWithRelations[]> {
  const supabase = createClient()
  
  try {
    // Get todos
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (todosError) throw todosError

    // Get notes for all todos
    const todoIds = todos?.map(t => t.id) || []
    const { data: notes, error: notesError } = await supabase
      .from('todo_notes')
      .select('*')
      .in('todo_id', todoIds)
      .order('created_at', { ascending: true })

    if (notesError) throw notesError

    // Get timers for all todos
    const { data: timers, error: timersError } = await supabase
      .from('todo_timers')
      .select('*')
      .in('todo_id', todoIds)

    if (timersError) throw timersError

    // Combine data
    const todosWithRelations: TodoWithRelations[] = (todos || []).map(todo => ({
      ...todo,
      notes: notes?.filter(note => note.todo_id === todo.id) || [],
      timer: timers?.find(timer => timer.todo_id === todo.id) || null,
      children: []
    }))

    // Build hierarchy
    const rootTodos: TodoWithRelations[] = []
    const todoMap = new Map<string, TodoWithRelations>()

    // First pass: create map
    todosWithRelations.forEach(todo => {
      todoMap.set(todo.id, todo)
    })

    // Second pass: build hierarchy
    todosWithRelations.forEach(todo => {
      if (todo.parent_id && todoMap.has(todo.parent_id)) {
        const parent = todoMap.get(todo.parent_id)!
        if (!parent.children) parent.children = []
        parent.children.push(todo)
      } else {
        rootTodos.push(todo)
      }
    })

    return rootTodos
  } catch (error) {
    console.error('Error fetching todos:', error)
    throw error
  }
}

// Create a new todo
export async function createTodo(userId: string, input: CreateTodoInput): Promise<TodoWithRelations> {
  const supabase = createClient()
  
  try {
    // Create the todo
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        priority: input.priority,
        parent_id: input.parent_id,
        status: 'pending'
      })
      .select()
      .single()

    if (todoError) throw todoError

    let timer = null
    
    // Create timer if requested
    if (input.timer) {
      const { data: timerData, error: timerError } = await supabase
        .from('todo_timers')
        .insert({
          todo_id: todo.id,
          duration_minutes: input.timer.duration_minutes,
          is_running: false,
          completed: false
        })
        .select()
        .single()

      if (timerError) throw timerError
      timer = timerData
    }

    return {
      ...todo,
      notes: [],
      timer,
      children: []
    }
  } catch (error) {
    console.error('Error creating todo:', error)
    throw error
  }
}

// Update a todo
export async function updateTodo(todoId: string, input: UpdateTodoInput): Promise<TodoWithRelations> {
  const supabase = createClient()
  
  try {
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .update(input)
      .eq('id', todoId)
      .select()
      .single()

    if (todoError) throw todoError

    // Get related data
    const [notesResult, timerResult] = await Promise.all([
      supabase.from('todo_notes').select('*').eq('todo_id', todoId),
      supabase.from('todo_timers').select('*').eq('todo_id', todoId).single()
    ])

    return {
      ...todo,
      notes: notesResult.data || [],
      timer: timerResult.data || null,
      children: []
    }
  } catch (error) {
    console.error('Error updating todo:', error)
    throw error
  }
}

// Add note to todo
export async function addNoteToTodo(todoId: string, content: string): Promise<TodoNote> {
  const supabase = createClient()
  
  try {
    const { data: note, error } = await supabase
      .from('todo_notes')
      .insert({
        todo_id: todoId,
        content
      })
      .select()
      .single()

    if (error) throw error
    return note
  } catch (error) {
    console.error('Error adding note:', error)
    throw error
  }
}

// Delete note
export async function deleteNote(noteId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('todo_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}

// Update timer
export async function updateTodoTimer(
  todoId: string, 
  updates: Partial<Omit<TodoTimer, 'id' | 'todo_id' | 'created_at' | 'updated_at'>>
): Promise<TodoTimer> {
  const supabase = createClient()
  
  try {
    const { data: timer, error } = await supabase
      .from('todo_timers')
      .update(updates)
      .eq('todo_id', todoId)
      .select()
      .single()

    if (error) throw error
    return timer
  } catch (error) {
    console.error('Error updating timer:', error)
    throw error
  }
}

// Add timer to existing todo
export async function addTimerToTodo(todoId: string, durationMinutes: number = 25): Promise<TodoTimer> {
  const supabase = createClient()
  
  try {
    const { data: timer, error } = await supabase
      .from('todo_timers')
      .insert({
        todo_id: todoId,
        duration_minutes: durationMinutes,
        is_running: false,
        completed: false
      })
      .select()
      .single()

    if (error) throw error
    return timer
  } catch (error) {
    console.error('Error adding timer:', error)
    throw error
  }
}

// Subscribe to real-time changes
export function subscribeToTodoChanges(userId: string, callback: (payload: RealtimeChangePayload) => void) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('todos_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todo_notes'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todo_timers'
      },
      callback
    )
    .subscribe()

  return subscription
}