"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  BarChart, PieChart, TrendingUp, Award, Target, Zap, CheckSquare, Bell, 
  Plus, Edit, Trash2, Move, Settings, Save 
} from "lucide-react"
import { getHabits, getTodos, getReminders, Habit, Todo, Reminder } from "@/lib/storage"

// Card configuration types
export type CardType = 'habits' | 'tasks' | 'streak' | 'reminders' | 'habitChart' | 'taskChart'
export type CardConfig = {
  id: string;
  type: CardType;
  title: string;
  icon: string;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

const defaultCards: CardConfig[] = [
  { id: 'habits', type: 'habits', title: 'Habits', icon: 'Target', enabled: true, position: 0, size: 'small' },
  { id: 'tasks', type: 'tasks', title: 'Tasks', icon: 'CheckSquare', enabled: true, position: 1, size: 'small' },
  { id: 'streak', type: 'streak', title: 'Streak', icon: 'Zap', enabled: true, position: 2, size: 'small' },
  { id: 'reminders', type: 'reminders', title: 'Reminders', icon: 'Bell', enabled: true, position: 3, size: 'small' },
  { id: 'habitChart', type: 'habitChart', title: 'Habit Completion', icon: 'BarChart', enabled: true, position: 4, size: 'medium' },
  { id: 'taskChart', type: 'taskChart', title: 'Task Distribution', icon: 'PieChart', enabled: true, position: 5, size: 'medium' },
]

// Map icon strings to components
const iconMap = {
  Target: Target,
  CheckSquare: CheckSquare,
  Zap: Zap,
  Bell: Bell,
  BarChart: BarChart,
  PieChart: PieChart,
  TrendingUp: TrendingUp,
  Award: Award,
}

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [mounted, setMounted] = useState(false)
  const [cards, setCards] = useState<CardConfig[]>([])
  const [editingCard, setEditingCard] = useState<CardConfig | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [timeframe, setTimeframe] = useState('daily')
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHabits(getHabits())
    setTodos(getTodos())
    setReminders(getReminders())
    
    // Load saved card configuration or use defaults
    const savedCards = localStorage.getItem('dashboardCards')
    if (savedCards) {
      setCards(JSON.parse(savedCards))
    } else {
      setCards(defaultCards)
    }
  }, [])

  // Save card configuration when it changes
  useEffect(() => {
    if (cards.length > 0 && mounted) {
      localStorage.setItem('dashboardCards', JSON.stringify(cards))
    }
  }, [cards, mounted])

  if (!mounted) return null

  const completedTodos = todos.filter((todo) => todo.completed).length
  const totalTodos = todos.length
  const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  const completedHabits = habits.filter((habit) =>
    habit.history.some((entry) => entry.date === new Date().toISOString().split("T")[0] && entry.completed),
  ).length
  const totalHabits = habits.length
  const habitCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  }

  // Save current card configuration
  const saveCardConfig = () => {
    localStorage.setItem('dashboardCards', JSON.stringify(cards))
    setIsEditMode(false)
  }

  // Reset to default configuration
  const resetToDefaults = () => {
    setCards(defaultCards)
    localStorage.setItem('dashboardCards', JSON.stringify(defaultCards))
  }

  // Add a new card
  const addCard = () => {
    const newId = `card-${Date.now()}`
    const newCard: CardConfig = {
      id: newId,
      type: 'habits',
      title: 'New Card',
      icon: 'Target',
      enabled: true,
      position: cards.length,
      size: 'small',
    }
    setCards([...cards, newCard])
    setEditingCard(newCard)
    setIsConfigOpen(true)
  }

  // Update a card's configuration
  const updateCard = (updatedCard: CardConfig) => {
    setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card))
    setEditingCard(null)
    setIsConfigOpen(false)
  }

  // Delete a card
  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id).map((card, index) => ({
      ...card,
      position: index
    })))
  }

  // Move card up in order
  const moveCardUp = (index: number) => {
    if (index <= 0) return
    const newCards = [...cards]
    const temp = newCards[index - 1].position
    newCards[index - 1].position = newCards[index].position
    newCards[index].position = temp
    // Sort by position
    setCards(newCards.sort((a, b) => a.position - b.position))
  }

  // Move card down in order
  const moveCardDown = (index: number) => {
    if (index >= cards.length - 1) return
    const newCards = [...cards]
    const temp = newCards[index + 1].position
    newCards[index + 1].position = newCards[index].position
    newCards[index].position = temp
    // Sort by position
    setCards(newCards.sort((a, b) => a.position - b.position))
  }

  // Render the card based on its type
  const renderCardContent = (card: CardConfig) => {
    const IconComponent = iconMap[card.icon as keyof typeof iconMap] || Target

    switch (card.type) {
      case 'habits':
        return (
          <Card className="overflow-hidden border-t-4 border-t-blue-500">
            <CardHeader className="pb-1 px-3 py-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1">
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <div className="flex flex-col items-center justify-center h-10 sm:h-14 md:h-24">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{habitCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {completedHabits}/{totalHabits} done
                </p>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'tasks':
        return (
          <Card className="overflow-hidden border-t-4 border-t-green-500">
            <CardHeader className="pb-1 px-3 py-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1">
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <div className="flex flex-col items-center justify-center h-10 sm:h-14 md:h-24">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{todoCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {completedTodos}/{totalTodos} done
                </p>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'streak':
        return (
          <Card className="overflow-hidden border-t-4 border-t-purple-500">
            <CardHeader className="pb-1 px-3 py-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1">
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <div className="flex flex-col items-center justify-center h-10 sm:h-14 md:h-24">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {habits.length > 0 ? Math.max(...habits.map((habit) => habit.streak)) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">days</p>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'reminders':
        return (
          <Card className="overflow-hidden border-t-4 border-t-amber-500">
            <CardHeader className="pb-1 px-3 py-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1">
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <div className="flex flex-col items-center justify-center h-10 sm:h-14 md:h-24">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold">{reminders.filter((r) => !r.completed).length}</div>
                <p className="text-xs text-muted-foreground mt-1 text-center">pending</p>
              </div>
            </CardContent>
          </Card>
        )
        
        case 'habitChart':
  // Date range based on selected timeframe
  const startDate = new Date();
  switch (timeframe) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 7); // Last week
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 30); // Last month
      break;
    case 'monthly':
      startDate.setDate(startDate.getDate() - 90); // Last 3 months
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }
  
  const startDateStr = startDate.toISOString().split('T')[0];
  
  // Initialize data structure for day of week analysis
  const habitsByDay: { [key: string]: { total: number; completed: number } } = {
    "Mon": { total: 0, completed: 0 },
    "Tue": { total: 0, completed: 0 },
    "Wed": { total: 0, completed: 0 },
    "Thu": { total: 0, completed: 0 },
    "Fri": { total: 0, completed: 0 },
    "Sat": { total: 0, completed: 0 },
    "Sun": { total: 0, completed: 0 },
  };
  
  // Fill in the data
  habits.forEach(habit => {
    const filteredHistory = habit.history.filter(entry => entry.date >= startDateStr);
    
    filteredHistory.forEach(entry => {
      // Get day of week for this entry
      const date = new Date(entry.date);
      const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
      
      // Only count if this habit is scheduled for this day
      if (habit.frequency.includes(dayOfWeek)) {
        habitsByDay[dayOfWeek].total += 1;
        if (entry.completed) {
          habitsByDay[dayOfWeek].completed += 1;
        }
      }
    });
  });
  
  // Convert to percentage completion rates
  const completionData = Object.entries(habitsByDay).map(([day, data]) => ({
    day,
    rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    completed: data.completed,
    total: data.total
  }));
  
  // Sort by days of week in correct order
  const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  completionData.sort((a, b) => orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day));

  // Title suffix based on timeframe
  let titleSuffix = "";
  switch (timeframe) {
    case 'daily':
      titleSuffix = "Last 7 days";
      break;
    case 'weekly':
      titleSuffix = "Last 30 days";
      break;
    case 'monthly':
      titleSuffix = "Last 3 months";
      break;
  }

  return (
    <Card >
      {/* Similar card structure as before, but with titleSuffix added to the description */}
      <CardHeader className="pb-2 px-4 py-3">
        <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        {habits.length === 0 ? (
          <div className="aspect-square sm:aspect-[4/3] bg-muted/30 rounded-md flex flex-col items-center justify-center p-4 sm:p-6">
            <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              Add some habits to see your completion data
            </p>
          </div>
        ) : (
          <div className="h-64">
            <div className="flex items-end h-48 gap-1 mt-4">
              {completionData.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500/20 dark:bg-blue-500/10 rounded-t-sm relative group"
                    style={{ 
                      height: `${Math.max(4, item.rate)}%`,
                      minHeight: item.total > 0 ? '4px' : '0'
                    }}
                  >
                    {item.total > 0 && (
                      <div className="absolute inset-0 bg-blue-500 rounded-t-sm opacity-80" 
                        style={{ height: `${item.rate}%` }} 
                      />
                    )}
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.completed}/{item.total} completed ({item.rate}%)
                    </div>
                  </div>
                  <div className="text-xs font-medium mt-2">{item.day}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Habit completion by day of week • {titleSuffix}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
          case 'taskChart':
            // Calculate task statistics
            const completedTasks = todos.filter(todo => todo.completed).length;
            const pendingTasks = todos.filter(todo => !todo.completed).length;
            const totalTasks = todos.length;
            
            // Calculate percentages for visualization
            const completedPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const pendingPercentage = totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0;
            
            return (
              <Card className="overflow-hidden border-t-5 border-b-10  border-t-green-500">
                <CardHeader className="pb-2 px-4 py-3">
                  <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-3">
                  {todos.length === 0 ? (
                    <div className="aspect-square sm:aspect-[4/3] bg-muted/30 rounded-md flex flex-col items-center justify-center p-4 sm:p-6">
                      <Award className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground text-center">
                        Add some tasks to see your task distribution
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col justify-center">
                      {/* Simple donut chart implementation */}
                      <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40">
                        {/* Base circle */}
                        <div className="absolute inset-0 rounded-full bg-muted"></div>
                        
                        {/* Only render segments if there are tasks */}
                        {totalTasks > 0 && (
                          <>
                            {/* Completed segment */}
                            {completedTasks > 0 && (
                              <div className="absolute inset-0">
                                <div 
                                  className="w-full h-full rounded-full bg-green-500"
                                  style={{
                                    clipPath: `polygon(50% 50%, 50% 0, ${completedPercentage >= 50 
                                      ? '100% 0, 100% 100%, 0 100%, 0 0, 50% 0'
                                      : `${50 + completedPercentage}% 0`
                                    })`
                                  }}
                                ></div>
                              </div>
                            )}
                            
                            {/* Pending segment */}
                            {pendingTasks > 0 && (
                              <div className="absolute inset-0">
                                <div 
                                  className="w-full h-full rounded-full bg-amber-500"
                                  style={{
                                    clipPath: `polygon(50% 50%, ${completedPercentage <= 50 
                                      ? `${50 + completedPercentage}% 0` 
                                      : '50% 0'
                                    }, ${pendingPercentage >= 50 
                                      ? '100% 0, 100% 100%, 0 100%, 0 0'
                                      : `100% 0, 100% ${pendingPercentage * 3.6}%`
                                    })`
                                  }}
                                ></div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Inner circle for donut effect */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-background flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{todoCompletionRate}%</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center mt-6 gap-6">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">{completedTasks} Completed</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">{pendingTasks} Pending</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
        
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unknown Card Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This card type is not supported</p>
            </CardContent>
          </Card>
        )
    }
  }

  // Get column span class based on card size
  const getColumnSpanClass = (card: CardConfig) => {
    switch (card.size) {
      case 'small':
        return 'col-span-2 sm:col-span-1 md:col-span-1'
      case 'medium':
        return 'col-span-4 sm:col-span-2 md:col-span-2'
      case 'large':
        return 'col-span-4 sm:col-span-4 md:col-span-4'
      default:
        return 'col-span-2 sm:col-span-1 md:col-span-1'
    }
  }

  // Sort and filter cards for display
  const displayCards = cards
    .filter(card => card.enabled)
    .sort((a, b) => a.position - b.position)

  // Separate small and large cards for layout
  const smallCards = displayCards.filter(card => card.size === 'small')
  const mediumLargeCards = displayCards.filter(card => card.size !== 'small')

  return (
    <div className="space-y-6 px-2 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
      >
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Tabs 
            value={timeframe} 
            onValueChange={setTimeframe}
            className="mr-2"
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1" />
            {isEditMode ? "Exit Edit Mode" : "Customize"}
          </Button>
        </div>
      </motion.div>

      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 justify-between items-center bg-muted/30 p-3 rounded-md"
        >
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={addCard} className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add Card
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetToDefaults}
              className="h-8"
            >
              Reset Layout
            </Button>
          </div>
          <Button
            size="sm"
            onClick={saveCardConfig}
            className="h-8"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Layout
          </Button>
        </motion.div>
      )}

      {/* Small cards section */}
      <div className="grid grid-cols-4 gap-3">
        {smallCards.map((card, index) => (
          <motion.div
            key={card.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={getColumnSpanClass(card)}
          >
            {isEditMode ? (
              <div className="relative">
                {renderCardContent(card)}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-md flex items-center justify-center">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCard(card)
                        setIsConfigOpen(true)
                      }}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveCardUp(index)}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Move className="h-3 w-3 rotate-180" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveCardDown(index)}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Move className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCard(card.id)}
                      className="h-7 w-7 p-0 bg-white/90 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              renderCardContent(card)
            )}
          </motion.div>
        ))}
      </div>

      {/* Medium and Large cards section */}
      <div className="grid grid-cols-4 gap-3 mt-3">
        {mediumLargeCards.map((card, index) => (
          <motion.div
            key={card.id}
            custom={smallCards.length + index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={getColumnSpanClass(card)}
          >
            {isEditMode ? (
              <div className="relative">
                {renderCardContent(card)}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-md flex items-center justify-center">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCard(card)
                        setIsConfigOpen(true)
                      }}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveCardUp(index + smallCards.length)}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Move className="h-3 w-3 rotate-180" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveCardDown(index + smallCards.length)}
                      className="h-7 w-7 p-0 bg-white/90"
                    >
                      <Move className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCard(card.id)}
                      className="h-7 w-7 p-0 bg-white/90 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              renderCardContent(card)
            )}
          </motion.div>
        ))}
      </div>

      {/* Card configuration dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Card</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardTitle" className="text-right">
                  Title
                </Label>
                <Input
                  id="cardTitle"
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({...editingCard, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardType" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingCard.type}
                  onValueChange={(value) => setEditingCard({...editingCard, type: value as CardType})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habits">Habits</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="reminders">Reminders</SelectItem>
                    <SelectItem value="habitChart">Habit Chart</SelectItem>
                    <SelectItem value="taskChart">Task Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardIcon" className="text-right">
                  Icon
                </Label>
                <Select
                  value={editingCard.icon}
                  onValueChange={(value) => setEditingCard({...editingCard, icon: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Target">Target</SelectItem>
                    <SelectItem value="CheckSquare">CheckSquare</SelectItem>
                    <SelectItem value="Zap">Zap</SelectItem>
                    <SelectItem value="Bell">Bell</SelectItem>
                    <SelectItem value="BarChart">BarChart</SelectItem>
                    <SelectItem value="PieChart">PieChart</SelectItem>
                    <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                    <SelectItem value="Award">Award</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardSize" className="text-right">
                  Size
                </Label>
                <Select
                  value={editingCard.size}
                  onValueChange={(value) => setEditingCard({...editingCard, size: value as 'small' | 'medium' | 'large'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardEnabled" className="text-right">
                  Enabled
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="cardEnabled"
                    checked={editingCard.enabled}
                    onCheckedChange={(checked) =>
                      setEditingCard({...editingCard, enabled: checked})
                    }
                  />
                  <Label htmlFor="cardEnabled" className="text-sm font-normal">
                    {editingCard.enabled ? "Visible" : "Hidden"}
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCard(null)
                    setIsConfigOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => updateCard(editingCard)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}