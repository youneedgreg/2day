"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Edit, Save, StickyNote, FileText, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Define types
type Note = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Local storage functions
const getNotesFromLocalStorage = (): Note[] => {
  if (typeof window === 'undefined') return []
  
  const storedNotes = localStorage.getItem('notes')
  console.log('Getting notes from localStorage:', storedNotes)
  
  if (!storedNotes) return []
  
  try {
    const parsedNotes = JSON.parse(storedNotes)
    console.log('Successfully parsed notes:', parsedNotes)
    return Array.isArray(parsedNotes) ? parsedNotes : []
  } catch (error) {
    console.error('Error parsing notes from localStorage:', error)
    return []
  }
}

const saveNotesToLocalStorage = (notes: Note[]): void => {
  if (typeof window === 'undefined') return
  console.log('Saving notes to localStorage:', notes)
  localStorage.setItem('notes', JSON.stringify(notes))
}

// Debug function for localStorage
const debugLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const storedNotes = localStorage.getItem('notes')
    console.log('Raw notes from localStorage:', storedNotes)
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes)
        console.log('Parsed notes:', parsed)
        return parsed
      } catch (error) {
        console.error('Error parsing notes from localStorage:', error)
      }
    } else {
      console.log('No notes found in localStorage')
    }
  }
  return []
}

export default function Notes() {
  // Use lazy initialization for notes state
  const [notes, setNotes] = useState<Note[]>(() => {
    // This function only runs once during initial render
    if (typeof window !== 'undefined') {
      const storedNotes = localStorage.getItem('notes')
      if (storedNotes) {
        try {
          const parsed = JSON.parse(storedNotes)
          console.log('Initially loaded notes:', parsed)
          return Array.isArray(parsed) ? parsed : []
        } catch (error) {
          console.error('Error parsing initial notes:', error)
        }
      }
    }
    return []
  })
  
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  // Backup loading from localStorage on component mount
  useEffect(() => {
    console.log('Component mounted, loading notes from localStorage')
    const loadedNotes = getNotesFromLocalStorage()
    console.log('Loaded notes:', loadedNotes)
    
    // Only set notes if we actually found some
    if (loadedNotes.length > 0) {
      setNotes(loadedNotes)
    }
    
    // Manually check localStorage content
    debugLocalStorage()
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    console.log('Saving notes to localStorage:', notes)
    saveNotesToLocalStorage(notes)
  }, [notes])

  const addNote = () => {
    if (!newNoteTitle.trim()) return

    const note: Note = {
      id: generateId(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setNotes([...notes, note])
    setNewNoteTitle("")
    setNewNoteContent("")
    setDialogOpen(false)
  }

  const updateNote = (id: string, content: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              content,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    )
    setEditingNote(null)
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Sort notes by updated date (newest first)
  const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Debug function to log current state
  const debugNotes = () => {
    console.log('All notes:', notes)
    console.log('Sorted notes:', sortedNotes)
    console.log('Are there notes to show?', notes.length > 0)
    console.log('Currently editing note:', editingNote)
  }

  // Call debug function
  debugNotes()

  // Debug component for development
  const DebugPanel = () => {
    const [localStorageContent, setLocalStorageContent] = useState<string>('Loading...')
    
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const content = localStorage.getItem('notes') || 'No notes found'
        setLocalStorageContent(content)
      }
    }, [notes]) // Update when notes change
    
    if (process.env.NODE_ENV !== 'development') {
      return null // Only show in development
    }
    
    return (
      <div className="mt-6 p-4 border border-red-300 rounded bg-red-50 text-sm">
        <h3 className="font-bold text-red-800 mb-2">Debug Information</h3>
        <div className="mb-2">
          <strong>Notes in state:</strong> {notes.length}
        </div>
        <div className="mb-2">
          <strong>Sorted notes:</strong> {sortedNotes.length}
        </div>
        <div className="mb-2">
          <strong>Editing note ID:</strong> {editingNote || 'None'}
        </div>
        <div>
          <strong>LocalStorage content:</strong>
          <pre className="mt-1 p-2 bg-white border rounded overflow-auto max-h-40 text-xs">
            {localStorageContent}
          </pre>
        </div>
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => console.log('Current notes state:', notes)}
          >
            Log State
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const testNote = {
                id: generateId(),
                title: "Debug Test Note",
                content: "This is a test note created for debugging purposes.",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setNotes(prev => [...prev, testNote]);
            }}
          >
            Add Test Note
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => {
              localStorage.removeItem('notes');
              setNotes([]);
              window.location.reload();
            }}
          >
            Clear & Reload
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Notes</h2>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <StickyNote className="h-5 w-5 text-purple-500" />
          </motion.div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="flex items-center gap-2 rounded-full shadow-md">
                <Plus className="h-4 w-4" />
                <span>New Note</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Create a New Note
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  placeholder="Give your note a title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  placeholder="What's on your mind?"
                  rows={6}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="focus-visible:ring-primary resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={addNote}>Save Note</Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {notes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 border rounded-lg bg-muted/20"
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
            >
              <StickyNote className="h-12 w-12 text-muted-foreground/50 mb-2" />
            </motion.div>
            <p className="text-muted-foreground">No notes yet. Capture your thoughts and ideas!</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedNotes.map((note) => (
            <Card 
              key={note.id}
              className="overflow-hidden transition-all duration-200 hover:shadow-md h-full flex flex-col"
            >
              <CardHeader className="pb-2 relative">
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <CardTitle className="pr-4">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {editingNote === note.id ? (
                  <Textarea
                    defaultValue={note.content}
                    rows={5}
                    id={`edit-note-${note.id}`}
                    className="focus-visible:ring-primary resize-none"
                  />
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {note.content || <span className="text-muted-foreground italic">No content</span>}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(note.updatedAt)}
                </span>
                <div className="flex gap-2">
                  {editingNote === note.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textarea = document.getElementById(`edit-note-${note.id}`) as HTMLTextAreaElement
                        updateNote(note.id, textarea.value)
                      }}
                      className="rounded-full"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(note.id)}
                      className="rounded-full"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="rounded-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Debug panel - only shows in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  )
}