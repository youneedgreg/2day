"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Edit, Save, StickyNote, FileText, Clock, Sparkles, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Palette, Type } from "lucide-react"
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

// Define types
type Note = {
  id: string
  title: string
  content: string
  contentType: "richtext" | "drawing" | "plain"
  createdAt: string
  updatedAt: string
  styleConfig?: {
    fontFamily?: string
    fontSize?: string
    backgroundColor?: string
  }
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
        style={{ fontFamily, fontSize, backgroundColor }}
        onInput={handleInput}
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
  const [newNoteType, setNewNoteType] = useState<"richtext" | "drawing" | "plain">("richtext")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [styleConfig, setStyleConfig] = useState<{ fontFamily?: string, fontSize?: string, backgroundColor?: string }>({})

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
      contentType: newNoteType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      styleConfig
    }

    setNotes([...notes, note])
    setNewNoteTitle("")
    setNewNoteContent("")
    setNewNoteType("richtext")
    setStyleConfig({})
    setDialogOpen(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateNote = (id: string, content: string, contentType?: "richtext" | "drawing" | "plain", newStyleConfig?: any) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              content,
              ...(contentType && { contentType }),
              ...(newStyleConfig && { styleConfig: { ...note.styleConfig, ...newStyleConfig } }),
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

  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Enhanced Notes</h2>
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
  <DialogContent className="sm:max-w-lg">
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

      <Tabs 
        defaultValue="richtext" 
        onValueChange={(value) => setNewNoteType(value as never)}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="richtext">Rich Text</TabsTrigger>
          <TabsTrigger value="drawing">Drawing</TabsTrigger>
          <TabsTrigger value="plain">Plain Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="richtext" className="space-y-4">
          <RichTextEditor 
            initialValue={newNoteContent} 
            onChange={setNewNoteContent}
            styleConfig={styleConfig}
          />
        </TabsContent>
        
        <TabsContent value="drawing" className="space-y-4">
          <DrawingCanvas
            initialValue={newNoteContent}
            onChange={setNewNoteContent}
          />
        </TabsContent>
        
        <TabsContent value="plain" className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            rows={6}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="focus-visible:ring-primary resize-none"
          />
        </TabsContent>
      </Tabs>
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
                  <div className="space-y-4">
                    <Tabs defaultValue={note.contentType || "richtext"}>
                      <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="richtext">Rich Text</TabsTrigger>
                        <TabsTrigger value="drawing">Drawing</TabsTrigger>
                        <TabsTrigger value="plain">Plain Text</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="richtext">
                        <RichTextEditor 
                          initialValue={note.content} 
                          onChange={(value) => updateNote(note.id, value, "richtext")}
                          styleConfig={note.styleConfig}
                        />
                      </TabsContent>
                      
                      <TabsContent value="drawing">
                        <DrawingCanvas
                          initialValue={note.contentType === "drawing" ? note.content : ""}
                          onChange={(value) => updateNote(note.id, value, "drawing")}
                        />
                      </TabsContent>
                      
                      <TabsContent value="plain">
                        <Textarea
                          defaultValue={note.contentType === "plain" ? note.content : ""}
                          rows={5}
                          id={`edit-note-${note.id}`}
                          className="focus-visible:ring-primary resize-none"
                          onChange={(e) => updateNote(note.id, e.target.value, "plain")}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div>
                    {note.contentType === "richtext" && (
                      <div 
                        className="rich-text-content"
                        style={{
                          fontFamily: note.styleConfig?.fontFamily,
                          fontSize: note.styleConfig?.fontSize,
                          backgroundColor: note.styleConfig?.backgroundColor
                        }}
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    )}
                    
                    {note.contentType === "drawing" && note.content && (
                      <div className="drawing-content">
                        <img 
                          src={note.content} 
                          alt="Drawing" 
                          className="max-w-full rounded-md border"
                        />
                      </div>
                    )}
                    
                    {note.contentType === "plain" && (
                      <div className="whitespace-pre-wrap break-words">
                        {note.content || <span className="text-muted-foreground italic">No content</span>}
                      </div>
                    )}
                    
                    {!note.content && !note.contentType && (
                      <span className="text-muted-foreground italic">No content</span>
                    )}
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
                      onClick={() => setEditingNote(null)}
                      className="rounded-full"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Done
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
    </div>
  );
}