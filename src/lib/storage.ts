// Type definitions
export type HabitType = "builder" | "quitter"

export interface Habit {
  id: string
  name: string
  type: HabitType
  frequency: string[]
  streak: number
  history: { date: string; completed: boolean }[]
  createdAt: string
}

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export interface Reminder {
  id: string
  text: string
  date: string
  completed: boolean
  createdAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Storage keys
const HABITS_KEY = "habits"
const TODOS_KEY = "todos"
const REMINDERS_KEY = "2day-reminders"
const NOTES_KEY = "2day-notes"

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return

  localStorage.setItem(key, JSON.stringify(data))
}

// Habit functions
export function getHabits(): Habit[] {
  return getFromStorage<Habit>(HABITS_KEY)
}

export function saveHabits(habits: Habit[]): void {
  saveToStorage(HABITS_KEY, habits)
}

// Todo functions
export function getTodos(): Todo[] {
  return getFromStorage<Todo>(TODOS_KEY)
}

export function saveTodos(todos: Todo[]): void {
  saveToStorage(TODOS_KEY, todos)
}

// Reminder functions
export function getReminders(): Reminder[] {
  return getFromStorage<Reminder>(REMINDERS_KEY)
}

export function saveReminders(reminders: Reminder[]): void {
  saveToStorage(REMINDERS_KEY, reminders)
}

// Note functions
export function getNotes(): Note[] {
  return getFromStorage<Note>(NOTES_KEY)
}

export function saveNotes(notes: Note[]): void {
  saveToStorage(NOTES_KEY, notes)
}

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getTodayFormatted(): string {
  return formatDate(new Date())
}

