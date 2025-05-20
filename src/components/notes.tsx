"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Edit, Save, StickyNote, FileText, Clock, Sparkles, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Palette, Type, Tag } from "lucide-react"
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
import { useAuth } from '@/hooks/useAuth'
import { getNotes, createNote, updateNote, subscribeToChanges } from '@/lib/utils/database'
import { Database } from '@/lib/types/database'

type Note = Database['public']['Tables']['notes']['Row']

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

// RichTextEditor component
const RichTextEditor = ({ 
  initialValue, 
  onChange, 
  styleConfig = {} 
}: { 
  initialValue: string, 
  onChange: (value: string) => void,
  styleConfig?: { fontFamily?: string, fontSize?: string, backgroundColor?: string }
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  
  // Default styles
  const fontFamily = styleConfig.fontFamily || 'system-ui, sans-serif'
  const fontSize = styleConfig.fontSize || '16px'
  const backgroundColor = styleConfig.backgroundColor || 'transparent'
  
  useEffect(() => {
    if (editorRef.current) {
      // Initialize with content
      editorRef.current.innerHTML = initialValue || ''
      // Make it editable
      editorRef.current.contentEditable = 'true'
      // Ensure left-to-right text direction
      editorRef.current.dir = 'ltr'
      editorRef.current.style.direction = 'ltr'
    }
  }, [initialValue])
  
  // Execute command on the document
  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value.toString())
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }
  
  // Font options
  const fontOptions = [
    { label: 'System UI', value: 'system-ui, sans-serif' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'monospace' },
    { label: 'Cursive', value: 'cursive' },
    { label: 'Fantasy', value: 'fantasy' },
  ]
  
  // Font size options
  const fontSizeOptions = [
    { label: 'Small', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Medium', value: '18px' },
    { label: 'Large', value: '20px' },
    { label: 'X-Large', value: '24px' },
  ]
  
  // Color options
  const colorOptions = [
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#ff0000' },
    { label: 'Blue', value: '#0000ff' },
    { label: 'Green', value: '#008000' },
    { label: 'Purple', value: '#800080' },
  ]
  
  // Background color options
  const bgColorOptions = [
    { label: 'White', value: '#ffffff' },
    { label: 'Light Yellow', value: '#ffffcc' },
    { label: 'Light Blue', value: '#e6f2ff' },
    { label: 'Light Pink', value: '#ffe6e6' },
    { label: 'Light Green', value: '#e6ffe6' },
  ]

  return (
    <div className="rich-text-editor space-y-2">
      <div className="toolbar flex flex-wrap gap-1 p-1 border rounded-md bg-muted/20">
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
        
        {/* Text alignment */}
        <ToggleGroup type="single" className="flex gap-1">
          <ToggleGroupItem value="left" size="sm" onClick={() => execCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" size="sm" onClick={() => execCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" size="sm" onClick={() => execCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
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
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Font selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              <span className="text-xs">Font</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select 
                onValueChange={(value) => {
                  if (editorRef.current) {
                    editorRef.current.style.fontFamily = value
                    handleInput()
                  }
                }}
                defaultValue={fontFamily}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Label>Font Size</Label>
              <Select 
                onValueChange={(value) => {
                  if (editorRef.current) {
                    editorRef.current.style.fontSize = value
                    handleInput()
                  }
                }}
                defaultValue={fontSize}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Color selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="text-xs">Color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color.value }}
                    onClick={() => execCommand('foreColor', color.value)}
                    title={color.label}
                  />
                ))}
              </div>
              
              <Label>Background Color</Label>
              <div className="flex flex-wrap gap-2">
                {bgColorOptions.map(color => (
                  <button
                    key={color.value}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color.value }}
                    onClick={() => execCommand('hiliteColor', color.value)}
                    title={color.label}
                  />
                ))}
              </div>
              
              <Label>Note Background</Label>
              <div className="flex flex-wrap gap-2">
                {bgColorOptions.map(color => (
                  <button
                    key={color.value}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      if (editorRef.current) {
                        editorRef.current.style.backgroundColor = color.value
                        handleInput()
                      }
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Image insertion */}
        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => {
          const imageUrl = prompt('Enter image URL:')
          if (imageUrl) {
            execCommand('insertImage', imageUrl)
          }
        }}>
          <Image className="h-4 w-4" />
          <span className="text-xs">Image</span>
        </Button>
      </div>
      
      <div
  ref={editorRef}
  className="min-h-40 p-3 border rounded-md overflow-auto focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
  style={{ fontFamily, fontSize, backgroundColor, direction: 'ltr' }}
  onInput={handleInput}
  dir="ltr"
/>
    </div>
  )
}

// DrawingCanvas component
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
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    
    // Load existing drawing if available
    if (initialValue) {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = initialValue
    }
    
    // Handle window resize
    const handleResize = () => {
      // Save current drawing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
      }
      
      // Resize canvas
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      
      // Restore drawing
      ctx.drawImage(tempCanvas, 0, 0)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initialValue])
  
  // Save canvas content
  const saveCanvas = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL()
      onChange(dataUrl)
    }
  }
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
  }
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
      e.preventDefault() // Prevent scrolling when drawing on touch
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }
  
  const endDrawing = () => {
    setIsDrawing(false)
    saveCanvas()
  }
  
  // Color options
  const colorOptions = [
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#ff0000' },
    { label: 'Blue', value: '#0000ff' },
    { label: 'Green', value: '#008000' },
    { label: 'Yellow', value: '#ffff00' },
  ]
  
  // Brush size options
  const brushSizeOptions = [
    { label: 'Small', value: 2 },
    { label: 'Medium', value: 5 },
    { label: 'Large', value: 10 },
    { label: 'X-Large', value: 20 },
  ]
  
  return (
    <div className="drawing-canvas space-y-2">
      <div className="toolbar flex flex-wrap gap-1 p-1 border rounded-md bg-muted/20">
        {/* Color selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">Color:</Label>
          <div className="flex gap-1">
            {colorOptions.map(option => (
              <button
                key={option.value}
                className={`w-6 h-6 rounded-full ${color === option.value ? 'ring-2 ring-primary' : 'border'}`}
                style={{ backgroundColor: option.value }}
                onClick={() => setColor(option.value)}
                title={option.label}
              />
            ))}
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Brush size selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">Size:</Label>
          <Select onValueChange={(value) => setBrushSize(parseInt(value))} defaultValue="5">
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {brushSizeOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        {/* Clear canvas */}
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
      
      <div className="border rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '300px', touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
    </div>
  )
}

// Main component
export default function Notes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#ffffff' })
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    if (!user) return

    // Fetch initial notes
    fetchNotes()

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('notes', (payload) => {
      if (payload.event === 'INSERT') {
        setNotes((prev) => [payload.new as Note, ...prev])
      } else if (payload.event === 'UPDATE') {
        setNotes((prev) =>
          prev.map((note) => (note.id === payload.new?.id ? (payload.new as Note) : note))
        )
      } else if (payload.event === 'DELETE') {
        setNotes((prev) => prev.filter((note) => note.id !== payload.old?.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchNotes = async () => {
    if (!user) return
    try {
      const data = await getNotes(user.id)
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return

    try {
      await createNote({
        user_id: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        color: newNote.color,
        tags: [],
      })
      setNewNote({ title: '', content: '', color: '#ffffff' })
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdateNote = async (note: Note) => {
    try {
      await updateNote(note.id, {
        title: note.title,
        content: note.content,
        color: note.color,
      })
      setEditingNote(null)
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await updateNote(noteId, { title: '', content: '' }) // Soft delete
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return <div>Loading notes...</div>
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <Input
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            placeholder="Note title..."
          />
          <Textarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Write your note here..."
            className="min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <input
              type="color"
              value={newNote.color}
              onChange={(e) => setNewNote({ ...newNote, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes
          .filter((note) => note.title || note.content)
          .map((note) => (
            <Card
              key={note.id}
              className="p-4"
              style={{ backgroundColor: note.color || '#ffffff' }}
            >
              {editingNote?.id === note.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                  />
                  <Textarea
                    value={editingNote.content || ''}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, content: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingNote(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateNote(editingNote)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{note.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingNote(note)}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              )}
            </Card>
          ))}
      </div>
    </div>
  )
}