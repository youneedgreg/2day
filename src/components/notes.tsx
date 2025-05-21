"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Trash2, Edit, Save, StickyNote, FileText, Clock, Sparkles, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Image, Palette, Type, Tag, Search, Filter,
  Pin, Archive, Copy, MoreVertical, Grid, LayoutList, X, Check,
  Hash, Calendar, Brush, CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { 
  getNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  searchNotes,
  getNotesByTag,
  getUserTags,
  duplicateNote,
  subscribeToNotesChanges 
} from '@/lib/utils/database/notes'
import { Database } from '@/lib/types/database'
import { format } from 'date-fns'
import { toast } from 'sonner'

type Note = Database['public']['Tables']['notes']['Row']
type NoteType = 'text' | 'rich_text' | 'drawing' | 'checklist'

// Color options for notes
const colorOptions = [
  { name: 'White', value: '#ffffff' },
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Pink', value: '#fce7f3' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Green', value: '#d1fae5' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Red', value: '#fecaca' },
  { name: 'Gray', value: '#f3f4f6' }
]

// Rich Text Editor Component
const RichTextEditor = ({ 
  initialValue, 
  onChange 
}: { 
  initialValue: string, 
  onChange: (value: string) => void 
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue || ''
      editorRef.current.contentEditable = 'true'
    }
  }, [initialValue])
  
  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value.toString())
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }
  
  return (
    <div className="rich-text-editor space-y-2">
      <div className="toolbar flex flex-wrap gap-1 p-2 border rounded-md bg-muted/20">
        {/* Text formatting */}
        <ToggleGroup type="multiple" className="flex gap-1">
          <ToggleGroupItem value="bold" size="sm" onClick={() => execCommand('bold')}>
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" size="sm" onClick={() => execCommand('italic')}>
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" size="sm" onClick={() => execCommand('underline')}>
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Lists */}
        <ToggleGroup type="single" className="flex gap-1">
          <ToggleGroupItem value="bullet" size="sm" onClick={() => execCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="ordered" size="sm" onClick={() => execCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div
        ref={editorRef}
        className="min-h-32 p-3 border rounded-md overflow-auto focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        onInput={handleInput}
        style={{ direction: 'ltr' }}
      />
    </div>
  )
}

// Drawing Canvas Component
const DrawingCanvas = ({ 
  initialValue, 
  onChange 
}: { 
  initialValue: string, 
  onChange: (value: string) => void 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 400
    canvas.height = 300
    
    if (initialValue) {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = initialValue
    }
  }, [initialValue])
  
  const saveCanvas = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL()
      onChange(dataUrl)
    }
  }
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
  }
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }
  
  const endDrawing = () => {
    setIsDrawing(false)
    saveCanvas()
  }
  
  return (
    <div className="drawing-canvas space-y-2">
      <div className="toolbar flex gap-2 p-2 border rounded-md bg-muted/20">
        <div className="flex gap-1">
          {['#000000', '#ff0000', '#0000ff', '#008000', '#ffff00'].map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-primary' : 'border'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <Select onValueChange={(value) => setBrushSize(parseInt(value))} defaultValue="5">
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Small</SelectItem>
            <SelectItem value="5">Medium</SelectItem>
            <SelectItem value="10">Large</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          saveCanvas()
        }}>
          Clear
        </Button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="border rounded-md cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
    </div>
  )
}

// Main Notes Component
export default function Notes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<NoteType | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userTags, setUserTags] = useState<string[]>([])
  
  // New note dialog state
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#ffffff',
    note_type: 'text' as NoteType,
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    if (!user) return

    initializeData()

    // Subscribe to real-time updates
    const subscription = subscribeToNotesChanges(user.id, (payload) => {
      console.log('Real-time note update:', payload)
      handleRealTimeUpdate(payload)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Filter notes when search or filters change
  useEffect(() => {
    filterNotes()
  }, [notes, searchQuery, selectedTag, selectedColor, selectedType])

  const initializeData = async () => {
    if (!user) return
    
    try {
      await Promise.all([
        fetchNotes(),
        fetchUserTags()
      ])
    } catch (error) {
      console.error('Error initializing data:', error)
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const handleRealTimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      fetchNotes()
      fetchUserTags()
    }
  }

  const fetchNotes = async () => {
    if (!user) return
    try {
      const data = await getNotes(user.id)
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error('Failed to load notes')
    }
  }

  const fetchUserTags = async () => {
    if (!user) return
    try {
      const tags = await getUserTags(user.id)
      setUserTags(tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const filterNotes = () => {
    let filtered = notes.filter(note => !note.is_archived)

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        (note.content && note.content.toLowerCase().includes(query))
      )
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(note =>
        note.tags && note.tags.includes(selectedTag)
      )
    }

    // Color filter
    if (selectedColor) {
      filtered = filtered.filter(note => note.color === selectedColor)
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(note => note.note_type === selectedType)
    }

    setFilteredNotes(filtered)
  }

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return

    try {
      const noteData = await createNote(user.id, {
        title: newNote.title.trim(),
        content: newNote.content.trim() || undefined,
        color: newNote.color,
        note_type: newNote.note_type,
        tags: newNote.tags.length > 0 ? newNote.tags : undefined
      })
      
      // Optimistic update
      setNotes(prev => [noteData, ...prev])
      
      // Reset form
      setNewNote({
        title: '',
        content: '',
        color: '#ffffff',
        note_type: 'text',
        tags: []
      })
      setNewNoteDialogOpen(false)
      
      toast.success('Note created successfully')
      
      // Refetch to ensure consistency
      setTimeout(() => {
        fetchNotes()
        fetchUserTags()
      }, 100)
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    }
  }

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      // Optimistic update
      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, ...updates } : n
      ))
      
      await updateNote(noteId, updates)
      toast.success('Note updated successfully')
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Failed to update note')
      fetchNotes() // Revert on error
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Optimistic update
      setNotes(prev => prev.filter(n => n.id !== noteId))
      
      await deleteNote(noteId)
      toast.success('Note deleted successfully')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
      fetchNotes() // Revert on error
    }
  }

  const handleDuplicateNote = async (noteId: string) => {
    if (!user) return
    
    try {
      const duplicatedNote = await duplicateNote(user.id, noteId)
      setNotes(prev => [duplicatedNote, ...prev])
      toast.success('Note duplicated successfully')
    } catch (error) {
      console.error('Error duplicating note:', error)
      toast.error('Failed to duplicate note')
    }
  }

  const addTagToNote = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const currentTags = note.tags || []
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag]
      handleUpdateNote(noteId, { tags: newTags })
    }
  }

  const removeTagFromNote = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const currentTags = note.tags || []
    const newTags = currentTags.filter(t => t !== tag)
    handleUpdateNote(noteId, { tags: newTags })
  }

  const addTagToNewNote = () => {
    if (newTag.trim() && !newNote.tags.includes(newTag.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTag(null)
    setSelectedColor(null)
    setSelectedType(null)
  }

  const renderNoteContent = (note: Note) => {
    switch (note.note_type) {
      case 'rich_text':
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: note.content || '' }}
          />
        )
      case 'drawing':
        return note.content ? (
          <img 
            src={note.content} 
            alt="Drawing" 
            className="max-w-full h-auto rounded"
          />
        ) : null
      case 'checklist':
        try {
          const items = JSON.parse(note.content || '[]')
          return (
            <div className="space-y-1">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={item.completed} disabled />
                  <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )
        } catch {
          return <p className="text-sm text-muted-foreground">Invalid checklist format</p>
        }
      default:
        return <p className="text-sm whitespace-pre-wrap">{note.content}</p>
    }
  }

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'rich_text': return FileText
      case 'drawing': return Brush
      case 'checklist': return CheckSquare
      default: return StickyNote
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <StickyNote className="h-5 w-5 text-yellow-500" />
          </motion.div>
        </div>
        
        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
            <ToggleGroupItem value="grid" size="sm">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" size="sm">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* New Note Button */}
          <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newNote.note_type}
                    onValueChange={(value: NoteType) => setNewNote({ ...newNote, note_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Note</SelectItem>
                      <SelectItem value="rich_text">Rich Text</SelectItem>
                      <SelectItem value="drawing">Drawing</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  {newNote.note_type === 'text' && (
                    <Textarea
                      placeholder="Write your note here..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      className="min-h-32"
                    />
                  )}
                  {newNote.note_type === 'rich_text' && (
                    <RichTextEditor
                      initialValue={newNote.content}
                      onChange={(content) => setNewNote({ ...newNote, content })}
                    />
                  )}
                  {newNote.note_type === 'drawing' && (
                    <DrawingCanvas
                      initialValue={newNote.content}
                      onChange={(content) => setNewNote({ ...newNote, content })}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        className={cn(
                          "w-8 h-8 rounded-full border-2",
                          newNote.color === color.value ? "border-foreground" : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewNote({ ...newNote, color: color.value })}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTagToNewNote()
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addTagToNewNote}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newNote.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => setNewNote(prev => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== index)
                          }))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewNoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNote}>
                  Create Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedTag || ""} onValueChange={(v) => setSelectedTag(v || null)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All tags</SelectItem>
                {userTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType || ""} onValueChange={(v) => setSelectedType((v as NoteType) || null)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="rich_text">Rich Text</SelectItem>
                <SelectItem value="drawing">Drawing</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedTag || selectedColor || selectedType) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by color:</span>
          <div className="flex gap-1">
            <button
              className={cn(
                "w-6 h-6 rounded-full border-2",
                !selectedColor ? "border-foreground" : "border-transparent",
                "bg-gray-200"
              )}
              onClick={() => setSelectedColor(null)}
              title="All colors"
            >
              <X className="h-3 w-3 m-auto" />
            </button>
            {colorOptions.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  selectedColor === color.value ? "border-foreground" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Notes Grid/List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <StickyNote className="h-12 w-12 text-muted-foreground/50 mb-4 mx-auto" />
            <p className="text-muted-foreground">
              {searchQuery || selectedTag || selectedColor || selectedType
                ? 'No notes match your filters'
                : 'No notes yet. Create your first note!'
              }
            </p>
            {!searchQuery && !selectedTag && !selectedColor && !selectedType && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setNewNoteDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => {
                const TypeIcon = getNoteTypeIcon(note.note_type || 'text')
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden transition-all duration-200 hover:shadow-md",
                        viewMode === 'list' && "flex flex-row"
                      )}
                      style={{ backgroundColor: note.color || '#ffffff' }}
                    >
                      <div className={cn("flex-1", viewMode === 'list' && "flex")}>
                        <CardHeader className={cn("pb-2", viewMode === 'list' && "flex-1")}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-sm font-medium line-clamp-1">
                                  {note.title}
                                </CardTitle>
                              </div>
                              
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {note.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{note.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingNote(note)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateNote(note.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        
                        <CardContent className={cn("pt-0", viewMode === 'list' && "flex-1")}>
                          <div className={cn(
                            "space-y-2",
                            viewMode === 'grid' ? "max-h-32 overflow-hidden" : "max-h-20 overflow-hidden"
                          )}>
                            {renderNoteContent(note)}
                          </div>
                        </CardContent>

                        <CardFooter className={cn("pt-2", viewMode === 'list' && "flex-shrink-0")}>
                          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                            <span>{format(new Date(note.updated_at), 'MMM d, yyyy')}</span>
                            {note.word_count && note.word_count > 0 && (
                              <span>{note.word_count} words</span>
                            )}
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Edit Note Dialog */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Input
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                placeholder="Note title..."
              />
              
              {editingNote.note_type === 'text' && (
                <Textarea
                  value={editingNote.content || ''}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="min-h-32"
                />
              )}
              
              {editingNote.note_type === 'rich_text' && (
                <RichTextEditor
                  initialValue={editingNote.content || ''}
                  onChange={(content) => setEditingNote({ ...editingNote, content })}
                />
              )}
              
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-8 h-8 rounded-full border-2",
                      editingNote.color === color.value ? "border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingNote(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (editingNote) {
                  handleUpdateNote(editingNote.id, {
                    title: editingNote.title,
                    content: editingNote.content,
                    color: editingNote.color
                  })
                  setEditingNote(null)
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}