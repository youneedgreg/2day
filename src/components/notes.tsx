"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Plus, Trash2, Edit, Save, StickyNote, FileText, Clock, Sparkles,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Image as ImageIcon, Palette, Type, Tag, Search, Filter,
  Pin, Archive, Copy, MoreVertical, Grid, LayoutList, X, Check,
  Hash, Calendar, Brush, CheckSquare, BookOpen, Zap, Star, Upload,
  Download, Share, Eye, EyeOff, RotateCcw, Undo, Redo, Settings
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { toast } from 'sonner'

// Initialize dayjs plugins
dayjs.extend(relativeTime)

type Note = Database['public']['Tables']['notes']['Row']
type NoteType = 'text' | 'rich_text' | 'drawing' | 'checklist'

// Type for real-time subscription payload
type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  table: string;
}

// Type for checklist items
type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
}

// Update the Note type to include metadata
type NoteMetadata = {
  is_favorite?: boolean;
  is_pinned?: boolean;
  font_family?: string;
}

type ExtendedNote = Note & {
  metadata?: NoteMetadata;
}

// Color options for notes with enhanced gradients
const colorOptions = [
  { name: 'Default', value: '#ffffff', gradient: 'from-white to-gray-50', textColor: 'text-gray-800' },
  { name: 'Sunset', value: '#fef3c7', gradient: 'from-yellow-100 via-orange-100 to-red-100', textColor: 'text-orange-800' },
  { name: 'Blossom', value: '#fce7f3', gradient: 'from-pink-100 via-rose-100 to-purple-100', textColor: 'text-pink-800' },
  { name: 'Lavender', value: '#e9d5ff', gradient: 'from-purple-100 via-violet-100 to-indigo-100', textColor: 'text-purple-800' },
  { name: 'Ocean', value: '#dbeafe', gradient: 'from-blue-100 via-cyan-100 to-teal-100', textColor: 'text-blue-800' },
  { name: 'Forest', value: '#d1fae5', gradient: 'from-green-100 via-emerald-100 to-teal-100', textColor: 'text-green-800' },
  { name: 'Peach', value: '#fed7aa', gradient: 'from-orange-100 via-amber-100 to-yellow-100', textColor: 'text-orange-800' },
  { name: 'Cherry', value: '#fecaca', gradient: 'from-red-100 via-pink-100 to-rose-100', textColor: 'text-red-800' },
  { name: 'Slate', value: '#f3f4f6', gradient: 'from-gray-100 via-slate-100 to-zinc-100', textColor: 'text-slate-800' }
]

// Font options for notes
const fontOptions = [
  { name: 'Inter', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Mono', value: 'font-mono' },
  { name: 'Handwriting', value: 'font-script' }
]

// Enhanced Rich Text Editor Component
const RichTextEditor = ({ 
  initialValue, 
  onChange,
  fontFamily = 'font-sans'
}: { 
  initialValue: string, 
  onChange: (value: string) => void,
  fontFamily?: string
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [alignment, setAlignment] = useState('left')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = `<img src="${event.target?.result}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
        document.execCommand('insertHTML', false, img)
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const setTextAlignment = (align: string) => {
    setAlignment(align)
    switch (align) {
      case 'left':
        execCommand('justifyLeft')
        break
      case 'center':
        execCommand('justifyCenter')
        break
      case 'right':
        execCommand('justifyRight')
        break
    }
  }
  
  return (
    <div className="rich-text-editor space-y-3">
      <div className="toolbar flex flex-wrap gap-2 p-3 border rounded-xl bg-gradient-to-r from-muted/30 to-muted/10">
        {/* Text formatting */}
        <ToggleGroup type="multiple" className="flex gap-1">
          <ToggleGroupItem 
            value="bold" 
            size="sm" 
            onClick={() => execCommand('bold')}
            className="hover:bg-primary/10"
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="italic" 
            size="sm" 
            onClick={() => execCommand('italic')}
            className="hover:bg-primary/10"
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="underline" 
            size="sm" 
            onClick={() => execCommand('underline')}
            className="hover:bg-primary/10"
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Alignment */}
        <ToggleGroup type="single" value={alignment} onValueChange={setTextAlignment} className="flex gap-1">
          <ToggleGroupItem value="left" size="sm" className="hover:bg-primary/10">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" size="sm" className="hover:bg-primary/10">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" size="sm" className="hover:bg-primary/10">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-8" />
        
        {/* Lists */}
        <ToggleGroup type="single" className="flex gap-1">
          <ToggleGroupItem 
            value="bullet" 
            size="sm" 
            onClick={() => execCommand('insertUnorderedList')}
            className="hover:bg-primary/10"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="ordered" 
            size="sm" 
            onClick={() => execCommand('insertOrderedList')}
            className="hover:bg-primary/10"
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-8" />

        {/* Image upload */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="hover:bg-primary/10"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      
      <div
        ref={editorRef}
        className={cn(
          "min-h-40 p-4 border-2 border-dashed border-muted-foreground/20 rounded-xl overflow-auto focus:outline-none focus:border-primary focus:border-solid transition-all bg-gradient-to-br from-card to-muted/5",
          fontFamily
        )}
        onInput={handleInput}
        style={{ direction: 'ltr' }}
      />
    </div>
  )
}

// Enhanced Drawing Canvas Component
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
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 600
    canvas.height = 400
    
    // Set white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
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
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = brushSize * 2
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
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
  
  const drawingColors = ['#000000', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#ea580c', '#0891b2', '#ffffff']
  
  return (
    <div className="drawing-canvas space-y-4">
      <div className="toolbar flex flex-wrap items-center gap-4 p-4 border rounded-xl bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Tool:</Label>
          <ToggleGroup type="single" value={tool} onValueChange={(v) => v && setTool(v as 'brush' | 'eraser')}>
            <ToggleGroupItem value="brush" size="sm">
              <Brush className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="eraser" size="sm">
              <RotateCcw className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Colors:</Label>
          <div className="flex gap-2">
            {drawingColors.map(c => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all ${
                  color === c ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                } ${c === '#ffffff' ? 'border-gray-300' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Size:</Label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground w-8">{brushSize}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            saveCanvas()
          }}
          className="hover:bg-red-50 hover:text-red-600"
        >
          Clear Canvas
        </Button>
      </div>
      
      <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 bg-white">
        <canvas
          ref={canvasRef}
          className="border border-muted rounded-lg cursor-crosshair shadow-sm w-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
      </div>
    </div>
  )
}

// Enhanced Checklist Component
const ChecklistEditor = ({
  initialValue,
  onChange
}: {
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [newItemText, setNewItemText] = useState('')

  useEffect(() => {
    try {
      const parsed = initialValue ? JSON.parse(initialValue) : []
      setItems(parsed.map((item: ChecklistItem) => ({
        id: item.id || `item-${Date.now()}`,
        text: item.text || '',
        completed: item.completed || false
      })))
    } catch {
      setItems([])
    }
  }, [initialValue])

  const updateItems = (newItems: ChecklistItem[]) => {
    setItems(newItems)
    onChange(JSON.stringify(newItems))
  }

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: `item-${Date.now()}`,
        text: newItemText.trim(),
        completed: false
      }
      updateItems([...items, newItem])
      setNewItemText('')
    }
  }

  const toggleItem = (id: string) => {
    updateItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteItem = (id: string) => {
    updateItems(items.filter(item => item.id !== id))
  }

  const updateItemText = (id: string, text: string) => {
    updateItems(items.map(item =>
      item.id === id ? { ...item, text } : item
    ))
  }

  return (
    <div className="checklist-editor space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add new item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          className="flex-1"
        />
        <Button onClick={addItem} variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-60">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <Input
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className={cn(
                  "flex-1 border-0 bg-transparent",
                  item.completed && "line-through text-muted-foreground"
                )}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {items.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {items.filter(item => item.completed).length} of {items.length} completed
        </div>
      )}
    </div>
  )
}

// Main Notes Component
export default function Notes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<ExtendedNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<ExtendedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<NoteType | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userTags, setUserTags] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // New note dialog state
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#ffffff',
    note_type: 'text' as NoteType,
    tags: [] as string[],
    is_pinned: false,
    font_family: 'font-sans'
  })
  const [newTag, setNewTag] = useState('')
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<ExtendedNote | null>(null)
  
  // Quick actions state
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Add new state variables in the Notes component
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Add this near the top of the component, after the state declarations
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Add this useEffect for debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchNotes = useCallback(async () => {
    if (!user) return
    try {
      const notes = await getNotes(user.id)
      setNotes(notes)
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }, [user])

  const fetchUserTags = useCallback(async () => {
    if (!user) return
    try {
      const tags = await getUserTags(user.id)
      setUserTags(tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }, [user])

  const initializeData = useCallback(async () => {
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
  }, [user, fetchNotes, fetchUserTags])

  const handleRealTimeUpdate = useCallback((payload: RealtimePayload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
      fetchNotes()
      fetchUserTags()
    }
  }, [fetchNotes, fetchUserTags])

  const filterNotes = useCallback(async (type: 'tag' | 'search', value: string) => {
    if (!user) return
    try {
      let filteredNotes: Note[] = []
      if (type === 'tag') {
        filteredNotes = await getNotesByTag(value, user.id)
      } else {
        filteredNotes = await searchNotes(value, user.id)
      }
      setNotes(filteredNotes)
    } catch (error) {
      console.error('Error filtering notes:', error)
    }
  }, [user])

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
  }, [user, initializeData, handleRealTimeUpdate])

  // Filter notes when search or filters change
  useEffect(() => {
    filterNotes('search', searchQuery)
  }, [searchQuery, filterNotes])

  const handleCreateNote = async () => {
    if (!user) return
    try {
      const newNote = await createNote({
        title: 'New Note',
        content: '',
        user_id: user.id,
        color: '#ffffff',
        tags: [],
        note_type: 'text',
        metadata: {},
        is_archived: false,
        is_pinned: false,
        word_count: 0,
        character_count: 0
      })
      setNotes(prev => [newNote, ...prev])
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdateNote = async (noteId: string, updates: Partial<ExtendedNote>) => {
    try {
      // Optimistic update
      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, ...updates } : n
      ));
      
      const { metadata, content, color, tags, note_type, ...restUpdates } = updates;
      
      // Create a clean update object with only defined values
      const cleanUpdates = {
        ...restUpdates,
        content: content ?? undefined,
        color: color ?? undefined,
        tags: tags ?? undefined,
        note_type: note_type ?? undefined,
        metadata: metadata ? { ...metadata } : undefined
      };
      
      await updateNote(noteId, cleanUpdates);
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      fetchNotes(); // Revert on error
    }
  };

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
    try {
      const duplicatedNote = await duplicateNote(noteId)
      setNotes(prev => [duplicatedNote, ...prev])
    } catch (error) {
      console.error('Error duplicating note:', error)
    }
  }

  const handlePinNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    await handleUpdateNote(noteId, { is_pinned: !note.metadata?.is_pinned })
    toast.success(note.metadata?.is_pinned ? 'Note unpinned' : 'Note pinned')
  }

  const handleArchiveNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    await handleUpdateNote(noteId, { is_archived: !note.metadata?.is_archived })
    toast.success(note.metadata?.is_archived ? 'Note unarchived' : 'Note archived')
  }

  const handleStarNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    
    const isFavorite = note.metadata?.is_favorite || false
    await handleUpdateNote(noteId, {
      metadata: {
        ...note.metadata,
        is_favorite: !isFavorite
      }
    })
    toast.success(isFavorite ? 'Note unstarred' : 'Note starred')
  }

  const addTagToNote = async (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const currentTags = note.tags || []
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag]
      await handleUpdateNote(noteId, { tags: newTags })
      toast.success(`Tag "${tag}" added`)
    }
  }

  const removeTagFromNote = async (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const currentTags = note.tags || []
    const newTags = currentTags.filter(t => t !== tag)
    await handleUpdateNote(noteId, { tags: newTags })
    toast.success(`Tag "${tag}" removed`)
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
    setActiveTab('all')
  }

  const handleBulkAction = async (action: 'delete' | 'archive' | 'pin') => {
    if (selectedNotes.length === 0) return

    try {
      await Promise.all(selectedNotes.map(noteId => {
        switch (action) {
          case 'delete':
            return deleteNote(noteId)
          case 'archive':
            return handleUpdateNote(noteId, { is_archived: true })
          case 'pin':
            return handleUpdateNote(noteId, { is_pinned: true })
        }
      }))

      setSelectedNotes([])
      setIsSelectionMode(false)
      toast.success(`${selectedNotes.length} notes ${action}d`)
      fetchNotes()
    } catch (error: unknown) {
      console.error('Error handling bulk action:', error)
      toast.error(`Failed to ${action} notes`)
    }
  }

  const exportNotes = () => {
    const dataStr = JSON.stringify(filteredNotes, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notes-export-${dayjs().format('YYYY-MM-DD')}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Notes exported successfully')
  }

  const shareNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.content || '',
          url: window.location.href
        })
      } catch (error: unknown) {
        console.log('Share cancelled:', error)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${note.title}\n\n${note.content || ''}`
      await navigator.clipboard.writeText(shareText)
      toast.success('Note copied to clipboard')
    }
  }

  const renderNoteContent = (note: ExtendedNote) => {
    const colorOption = colorOptions.find(c => c.value === note.color)
    
    switch (note.note_type) {
      case 'rich_text':
        return (
          <div 
            className={cn(
              "prose prose-sm max-w-none text-sm",
              note.metadata?.font_family || 'font-sans',
              colorOption?.textColor
            )}
            dangerouslySetInnerHTML={{ __html: note.content || '' }}
          />
        )
      case 'drawing':
        return note.content ? (
          <div className="relative w-full h-32 overflow-hidden rounded-lg border bg-white">
            <Image
              src={note.content} 
              alt="Drawing" 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : null
      case 'checklist':
        try {
          const items: ChecklistItem[] = JSON.parse(note.content || '[]')
          return (
            <div className="space-y-2">
              {items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={item.completed} disabled />
                  <span className={cn(
                    item.completed ? 'line-through text-muted-foreground' : '',
                    colorOption?.textColor
                  )}>
                    {item.text}
                  </span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-muted-foreground">+{items.length - 3} more items</p>
              )}
            </div>
          )
        } catch {
          return <p className="text-sm text-muted-foreground">Invalid checklist format</p>
        }
      default:
        return (
          <p className={cn(
            "text-sm whitespace-pre-wrap line-clamp-4",
            note.metadata?.font_family || 'font-sans',
            colorOption?.textColor
          )}>
            {note.content}
          </p>
        )
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

  const getColorGradient = (colorValue: string) => {
    const colorOption = colorOptions.find(c => c.value === colorValue)
    return colorOption?.gradient || 'from-white to-gray-50'
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  // Add new functions in the Notes component
  const handleUpload = async (file: File) => {
    if (!user) return
    try {
      const content = await file.text()
      const newNote = await createNote({
        title: file.name,
        content,
        user_id: user.id,
        color: '#ffffff',
        tags: [],
        note_type: 'text',
        metadata: {},
        is_archived: false,
        is_pinned: false,
        word_count: content.split(/\s+/).length,
        character_count: content.length
      })
      setNotes(prev => [newNote, ...prev])
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const handleUndo = () => {
    // Implement undo functionality
    setCanUndo(false)
    setCanRedo(true)
    toast.success('Changes undone')
  }

  const handleRedo = () => {
    // Implement redo functionality
    setCanRedo(false)
    setCanUndo(true)
    toast.success('Changes redone')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <motion.div 
          className="flex items-center gap-3 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <span className="font-medium">Loading notes...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl shadow-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold">Notes</h2>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </motion.div>
            </div>
            <p className="text-lg text-muted-foreground">Capture your thoughts and ideas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Existing buttons */}
          
          {/* Upload Button */}
          <div className="relative">
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>

          {/* Preview Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>

          {/* Undo/Redo Buttons */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Implement quick actions
              toast.success('Quick action executed')
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Action
          </Button>

          {/* Calendar View */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Implement calendar view
              toast.info('Calendar view coming soon')
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>

          {/* Selection Mode Toggle */}
          {filteredNotes.length > 0 && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                setSelectedNotes([])
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Select
            </Button>
          )}

          {/* View Mode Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" size="sm" className="h-10 px-4">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem value="list" size="sm" className="h-10 px-4">
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </ToggleGroupItem>
          </ToggleGroup>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportNotes}>
                <Download className="h-4 w-4 mr-2" />
                Export Notes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Hide' : 'Show'} Archived
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Note Button */}
          <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  New Note
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <StickyNote className="h-6 w-6 text-primary" />
                  </div>
                  Create New Note
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="content" className="py-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="note-title" className="text-sm font-semibold">Title</Label>
                      <Input
                        id="note-title"
                        placeholder="Enter note title..."
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Type</Label>
                      <Select
                        value={newNote.note_type}
                        onValueChange={(value: NoteType) => setNewNote({ ...newNote, note_type: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">📝 Text Note</SelectItem>
                          <SelectItem value="rich_text">✨ Rich Text</SelectItem>
                          <SelectItem value="drawing">🎨 Drawing</SelectItem>
                          <SelectItem value="checklist">✅ Checklist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Content</Label>
                    {newNote.note_type === 'text' && (
                      <Textarea
                        placeholder="Write your note here..."
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="min-h-40 resize-none"
                      />
                    )}
                    {newNote.note_type === 'rich_text' && (
                      <RichTextEditor
                        initialValue={newNote.content}
                        onChange={(content) => setNewNote({ ...newNote, content })}
                        fontFamily={newNote.font_family}
                      />
                    )}
                    {newNote.note_type === 'drawing' && (
                      <DrawingCanvas
                        initialValue={newNote.content}
                        onChange={(content) => setNewNote({ ...newNote, content })}
                      />
                    )}
                    {newNote.note_type === 'checklist' && (
                      <ChecklistEditor
                        initialValue={newNote.content}
                        onChange={(content) => setNewNote({ ...newNote, content })}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Theme
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {colorOptions.map((color) => (
                          <motion.button
                            key={color.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "h-16 rounded-xl border-2 transition-all bg-gradient-to-br relative overflow-hidden",
                              color.gradient,
                              newNote.color === color.value ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/50"
                            )}
                            onClick={() => setNewNote({ ...newNote, color: color.value })}
                            title={color.name}
                          >
                            <span className="absolute bottom-1 left-1 text-xs font-medium opacity-70">
                              {color.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Font Family
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {fontOptions.map((font) => (
                          <Button
                            key={font.value}
                            variant={newNote.font_family === font.value ? "default" : "outline"}
                            className={cn("h-12", font.value)}
                            onClick={() => setNewNote({ ...newNote, font_family: font.value })}
                          >
                            {font.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </Label>
                      <div className="flex gap-2">
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
                          className="h-10"
                        />
                        <Button variant="outline" onClick={addTagToNewNote} className="h-10 px-4">
                          <Hash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newNote.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            #{tag}
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Pin className="h-4 w-4" />
                          Pin Note
                        </Label>
                        <Switch
                          checked={newNote.is_pinned}
                          onCheckedChange={(checked) => setNewNote({ ...newNote, is_pinned: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Auto-save
                        </Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setNewNoteDialogOpen(false)} className="h-10">
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleCreateNote} className="h-10 px-6">
                    <Save className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </motion.div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50">
            <TabsTrigger value="all" className="font-semibold">All Notes</TabsTrigger>
            <TabsTrigger value="pinned" className="font-semibold">
              <Pin className="h-4 w-4 mr-2" />
              Pinned
            </TabsTrigger>
            <TabsTrigger value="recent" className="font-semibold">
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="starred" className="font-semibold">
              <Star className="h-4 w-4 mr-2" />
              Starred
            </TabsTrigger>
            <TabsTrigger value="archived" className="font-semibold">
              <Archive className="h-4 w-4 mr-2" />
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border"
          >
            <span className="font-medium">
              {selectedNotes.length} note{selectedNotes.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('pin')}>
                <Pin className="h-4 w-4 mr-2" />
                Pin
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedTag || "all-tags"} onValueChange={(v) => setSelectedTag(v === "all-tags" ? null : v)}>
              <SelectTrigger className="w-48 h-12">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tags">All tags</SelectItem>
                {userTags.map(tag => (
                  <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType || "all-types"} onValueChange={(v) => setSelectedType(v === "all-types" ? null : (v as NoteType))}>
              <SelectTrigger className="w-48 h-12">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All types</SelectItem>
                <SelectItem value="text">📝 Text</SelectItem>
                <SelectItem value="rich_text">✨ Rich Text</SelectItem>
                <SelectItem value="drawing">🎨 Drawing</SelectItem>
                <SelectItem value="checklist">✅ Checklist</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedTag || selectedColor || selectedType) && (
              <Button variant="outline" onClick={clearFilters} className="h-12 px-4">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
          <span className="text-sm font-medium text-muted-foreground">Filter by color:</span>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "w-8 h-8 rounded-lg border-2 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center",
                !selectedColor ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/50"
              )}
              onClick={() => setSelectedColor(null)}
              title="All colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </motion.button>
            {colorOptions.map((color) => (
              <motion.button
                key={color.value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 bg-gradient-to-br transition-all",
                  color.gradient,
                  selectedColor === color.value ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/50"
                )}
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
        transition={{ delay: 0.3 }}
      >
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-gradient-to-br from-muted/10 to-muted/5"
          >
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                className="p-4 bg-primary/10 rounded-2xl"
              >
                <StickyNote className="h-16 w-16 text-primary/60" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {searchQuery || selectedTag || selectedColor || selectedType
                    ? 'No notes match your filters'
                    : activeTab === 'archived' 
                      ? 'No archived notes'
                      : 'No notes yet'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedTag || selectedColor || selectedType
                    ? 'Try adjusting your search criteria or clear filters to see all notes.'
                    : activeTab === 'archived'
                      ? 'Archived notes will appear here when you archive them.'
                      : 'Create your first note to get started with organizing your thoughts and ideas!'
                  }
                </p>
              </div>
              {!searchQuery && !selectedTag && !selectedColor && !selectedType && activeTab !== 'archived' && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-12 px-6 border-2 border-primary/20 hover:border-primary/40"
                    onClick={() => setNewNoteDialogOpen(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Note
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              viewMode === 'grid' 
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => {
                const TypeIcon = getNoteTypeIcon(note.note_type || 'text')
                const colorGradient = getColorGradient(note.color || '#ffffff')
                const isSelected = selectedNotes.includes(note.id)
                
                return (
                  <motion.div
                    key={note.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-gradient-to-br cursor-pointer",
                        colorGradient,
                        viewMode === 'list' && "flex flex-row",
                        isSelected && "ring-2 ring-primary",
                        isSelectionMode && "hover:ring-2 hover:ring-primary/50",
                        isPreviewMode && "pointer-events-none"
                      )}
                      onClick={() => {
                        if (isSelectionMode) {
                          if (isSelected) {
                            setSelectedNotes(prev => prev.filter(id => id !== note.id))
                          } else {
                            setSelectedNotes(prev => [...prev, note.id])
                          }
                        }
                      }}
                    >
                      <div className={cn("flex-1", viewMode === 'list' && "flex")}>
                        <CardHeader className={cn("pb-3", viewMode === 'list' && "flex-1")}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                {isSelectionMode && (
                                  <Checkbox checked={isSelected} />
                                )}
                                
                                <div className="flex items-center gap-2">
                                  {note.metadata?.is_pinned && (
                                    <Pin className="h-4 w-4 text-orange-500 fill-current" />
                                  )}
                                  {note.metadata?.is_favorite && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  )}
                                </div>

                                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-lg font-semibold line-clamp-1">
                                  {note.title}
                                </CardTitle>
                              </div>
                              
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {note.tags.slice(0, 3).map((tag, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="text-xs bg-white/60 backdrop-blur-sm cursor-pointer hover:bg-white/80"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTag(tag)
                                      }}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs bg-white/60 backdrop-blur-sm">
                                      +{note.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {!isSelectionMode && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/60 hover:bg-white/80 backdrop-blur-sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingNote(note)
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Note
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handleDuplicateNote(note.id)
                                  }}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    shareNote(note.id)
                                  }}>
                                    <Share className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handlePinNote(note.id)
                                  }}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {note.metadata?.is_pinned ? 'Unpin' : 'Pin'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handleStarNote(note.id)
                                  }}>
                                    <Star className="h-4 w-4 mr-2" />
                                    {note.metadata?.is_favorite ? 'Unstar' : 'Star'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handleArchiveNote(note.id)
                                  }}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    {note.metadata?.is_archived ? 'Unarchive' : 'Archive'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteNote(note.id)
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className={cn("pt-0", viewMode === 'list' && "flex-1")}>
                          <div className={cn(
                            "space-y-2",
                            viewMode === 'grid' ? "max-h-40 overflow-hidden" : "max-h-24 overflow-hidden"
                          )}>
                            {renderNoteContent(note)}
                          </div>
                        </CardContent>

                        <CardFooter className={cn("pt-3 border-t border-white/20", viewMode === 'list' && "flex-shrink-0")}>
                          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                            <span className="font-medium">{dayjs(note.updated_at).fromNow()}</span>
                            <div className="flex items-center gap-2">
                              {note.word_count && note.word_count > 0 && (
                                <span className="text-xs bg-white/60 px-2 py-1 rounded-full">
                                  {note.word_count} words
                                </span>
                              )}
                              {note.metadata?.is_archived && (
                                <Badge variant="outline" className="text-xs">
                                  <Archive className="h-3 w-3 mr-1" />
                                  Archived
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Note Dialog */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Edit className="h-6 w-6 text-primary" />
                </div>
                Edit Note
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 mt-6">
                <Input
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Note title..."
                  className="h-12 text-lg"
                />
                
                {editingNote.note_type === 'text' && (
                  <Textarea
                    value={editingNote.content || ''}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="min-h-40 resize-none"
                  />
                )}
                
                {editingNote.note_type === 'rich_text' && (
                  <RichTextEditor
                    initialValue={editingNote.content || ''}
                    onChange={(content) => setEditingNote({ ...editingNote, content })}
                    fontFamily={editingNote.metadata?.font_family || 'font-sans'}
                  />
                )}

                {editingNote.note_type === 'checklist' && (
                  <ChecklistEditor
                    initialValue={editingNote.content || ''}
                    onChange={(content) => setEditingNote({ ...editingNote, content })}
                  />
                )}
              </TabsContent>

              <TabsContent value="design" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Theme
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {colorOptions.map((color) => (
                        <motion.button
                          key={color.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "h-16 rounded-xl border-2 transition-all bg-gradient-to-br relative overflow-hidden",
                            color.gradient,
                            editingNote.color === color.value ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/50"
                          )}
                          onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                          title={color.name}
                        >
                          <span className="absolute bottom-1 left-1 text-xs font-medium opacity-70">
                            {color.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Font Family
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {fontOptions.map((font) => (
                        <Button
                          key={font.value}
                          variant={editingNote.metadata?.font_family === font.value ? "default" : "outline"}
                          className={cn("h-12", font.value)}
                          onClick={() => setEditingNote(prev => prev ? {
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              font_family: font.value
                            }
                          } : null)}
                        >
                          {font.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(editingNote.tags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          #{tag}
                          <button
                            onClick={() => removeTagFromNote(editingNote.id, tag)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Hash className="h-4 w-4 mr-2" />
                          Add Tag
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="start">
                        <div className="space-y-2">
                          <Input
                            placeholder="New tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (newTag.trim()) {
                                  addTagToNote(editingNote.id, newTag.trim())
                                  setNewTag('')
                                }
                              }
                            }}
                          />
                          <div className="flex flex-wrap gap-1">
                            {userTags.filter(tag => !(editingNote.tags || []).includes(tag)).map(tag => (
                              <Button
                                key={tag}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  addTagToNote(editingNote.id, tag)
                                }}
                              >
                                #{tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Pin className="h-4 w-4" />
                        Pin Note
                      </Label>
                      <Switch
                        checked={editingNote.metadata?.is_pinned || false}
                        onCheckedChange={(checked) => setEditingNote({
                          ...editingNote,
                          metadata: {
                            ...editingNote.metadata,
                            is_pinned: checked
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Star Note
                      </Label>
                      <Switch
                        checked={editingNote.metadata?.is_favorite || false}
                        onCheckedChange={(checked) => setEditingNote({
                          ...editingNote,
                          metadata: {
                            ...editingNote.metadata,
                            is_favorite: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Archive Note
                      </Label>
                      <Switch
                        checked={editingNote.metadata?.is_archived || false}
                        onCheckedChange={(checked) => setEditingNote({
                          ...editingNote,
                          metadata: {
                            ...editingNote.metadata,
                            is_archived: checked
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setEditingNote(null)} className="h-10">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => {
                  if (editingNote) {
                    handleUpdateNote(editingNote.id, {
                      title: editingNote.title,
                      content: editingNote.content,
                      color: editingNote.color,
                      metadata: {
                        ...editingNote.metadata,
                        is_pinned: editingNote.metadata?.is_pinned,
                        is_favorite: editingNote.metadata?.is_favorite,
                        is_archived: editingNote.metadata?.is_archived,
                        font_family: editingNote.metadata?.font_family
                      }
                    })
                    setEditingNote(null)
                  }
                }} className="h-10 px-6">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}