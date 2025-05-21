"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import HabitTracker from "@/components/habit-tracker"
import TodoList from "@/components/todo-list"
import Reminders from "@/components/reminders"
import Notes from "@/components/notes"
import Dashboard from "@/components/dashboard"
import ProductivityLoader, { PageLoader } from "@/components/ui/loader"
import Image from "next/image"
import ActivityStream from "@/components/activity"
import Calendar from "@/components/calender"
import { 
  Activity,
  CalendarCheck2, 
  CheckSquare, 
  Bell, 
  StickyNote, 
  BarChart3, 
  Sun, 
  Calendar as CalendarIcon,
  Moon, 
  ActivityIcon,
  CalendarCheck,
  Settings,
  LogOut,
  Edit,
  ChevronDown,
} from "lucide-react"
import { createClient } from '@/lib/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isMobile, setIsMobile] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Account dropdown state
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Enhanced authentication check
  useEffect(() => {
    setMounted(true)
    
    // Check system preference for initial theme
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
    
    // Check if mobile or desktop view
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add listener for window resize
    window.addEventListener('resize', checkIfMobile)
    
    // Enhanced authentication state management
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        setAuthError(null)
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError.message)
          setAuthError(sessionError.message)
          router.replace('/login')
          return
        }

        if (!session) {
          console.log('No active session found')
          router.replace('/login')
          return
        }

        // Check if session is still valid (not expired)
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('Session expired')
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        // Verify user data
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('User verification failed:', userError?.message)
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        // Set authenticated state
        setSession(session)
        setUser(user)
        setIsLoading(false)

        console.log('Authentication successful:', {
          userId: user.id,
          email: user.email,
          expiresAt: new Date(session.expires_at! * 1000).toISOString()
        })

      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthError('Authentication failed')
        router.replace('/login')
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            setSession(session)
            setUser(session.user)
            setIsLoading(false)
            setAuthError(null)
          }
          break
          
        case 'SIGNED_OUT':
          setSession(null)
          setUser(null)
          setIsLoading(false)
          router.replace('/login')
          break
          
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setSession(session)
            setUser(session.user)
            console.log('Token refreshed successfully')
          }
          break
          
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user)
          }
          break
          
        default:
          // For any other event, verify auth state
          if (!session || !session.user) {
            setSession(null)
            setUser(null)
            router.replace('/login')
          }
      }
    })

    // Initialize authentication
    initializeAuth()
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', checkIfMobile)
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Session refresh interval (refresh 5 minutes before expiry)
  useEffect(() => {
    if (!session) return

    const refreshToken = async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) {
          console.error('Token refresh failed:', error.message)
          router.replace('/login')
        } else if (data.session) {
          setSession(data.session)
          console.log('Session refreshed successfully')
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        router.replace('/login')
      }
    }

    // Calculate time until token expiry (refresh 5 minutes before)
    const expiresAt = session.expires_at!
    const now = Math.floor(Date.now() / 1000)
    const timeUntilRefresh = (expiresAt - now - 300) * 1000 // 5 minutes before expiry

    if (timeUntilRefresh > 0) {
      const refreshTimer = setTimeout(refreshToken, timeUntilRefresh)
      return () => clearTimeout(refreshTimer)
    } else {
      // Token is already expired or about to expire, refresh immediately
      refreshToken()
    }
  }, [session, supabase, router])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  // Handle tab changes with loading state
  const handleTabChange = (value: string) => {
    setContentLoading(true)
    setActiveTab(value)
    
    // Simulate content loading
    setTimeout(() => {
      setContentLoading(false)
    }, 800)
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error.message)
        toast.error('Failed to sign out')
      } else {
        toast.success('Signed out successfully')
        router.replace('/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
      setIsAccountOpen(false)
    }
  }

  // Handle account update navigation
  const handleEditAccount = () => {
    setIsAccountOpen(false)
    router.push('/account')
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <PageLoader 
          type="neutral" 
          text={authError ? "Authentication failed..." : "Verifying authentication..."} 
          showText={true} 
        />
      </div>
    )
  }

  // If no session after loading, don't render the page (user will be redirected)
  if (!session || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <PageLoader 
          type="neutral" 
          text="Redirecting to login..." 
          showText={true} 
        />
      </div>
    )
  }

  // Navigation items shared between mobile and desktop
  const navItems = [
    { value: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { value: "activity", label: "Activity", icon: <Activity className="h-5 w-5" /> },
    { value: "habits", label: "Habits", icon: <CalendarCheck2 className="h-5 w-5" /> },
    { value: "todos", label: "Todos", icon: <CheckSquare className="h-5 w-5" /> },
    { value: "reminders", label: "Reminders", icon: <Bell className="h-5 w-5" /> },
    { value: "notes", label: "Notes", icon: <StickyNote className="h-5 w-5" /> },
    { value: "calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5" /> },
  ]

  return (
    <div className="h-screen flex flex-col">
      {/* Enhanced Header with Account Dropdown */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Image
                src="/logo.png"
                alt="2day Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              2day
            </h1>
          </div>

          {/* Right Section with Theme Toggle and Account */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button>

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Account Dropdown Menu */}
              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user?.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={handleEditAccount}
                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">Edit Account</span>
                      </button>
                      
                      <div className="border-t mx-2 my-2"></div>
                      
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400"
                      >
                        {isSigningOut ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Settings className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {isSigningOut ? 'Signing out...' : 'Sign Out'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel for Desktop - Fixed position, not scrollable */}
        {!isMobile && (
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`w-64 flex-shrink-0 flex flex-col border-r h-full overflow-y-auto ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
          >
            <nav className="flex-1 overflow-y-auto p-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.value 
                      ? 'bg-primary text-primary-foreground' 
                      : `hover:bg-muted ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        )}
        
        {/* Scrollable main content area */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-y-auto"
        >
          {/* Mobile Tab Switcher - Sticky at top */}
          {isMobile && (
            <Tabs 
              value={activeTab} 
              className="w-full sticky top-0 z-10 bg-background"
              onValueChange={handleTabChange}
            >
              <motion.div 
                initial={{ y: 10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="w-full px-0"
              >
                <TabsList className="h-full w-full flex justify-between mb-4 bg-muted/50 rounded-none">
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <ActivityIcon className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habits" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <CalendarCheck2 className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="todos" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <CheckSquare className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reminders" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <Bell className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <StickyNote className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="calendar" 
                    className="flex-1 flex items-center justify-center py-3"
                  >
                    <CalendarCheck className="h-5 w-5" />
                  </TabsTrigger>
                </TabsList>
              </motion.div>
            </Tabs>
          )}

          {/* Content wrapper with padding */}
          <div className="p-0 md:p-8 max-w-7xl mx-auto w-full">
            {/* Content Section with Loading States */}
            {contentLoading ? (
              <div className="flex justify-center items-center py-20">
                {activeTab === "dashboard" && <ProductivityLoader type="neutral" size="large" showText text="Loading dashboard..." />}
                {activeTab === "activity" && <ProductivityLoader type="activity" size="large" showText text="Loading activities..." />}
                {activeTab === "habits" && <ProductivityLoader type="habit" habitType="build" size="large" showText text="Loading habits..." />}
                {activeTab === "todos" && <ProductivityLoader type="todo" size="large" showText text="Loading todos..." />}
                {activeTab === "reminders" && <ProductivityLoader type="reminder" size="large" showText text="Loading reminders..." />}
                {activeTab === "notes" && <ProductivityLoader type="notes" size="large" showText text="Loading notes..." />}
                {activeTab === "calendar" && <ProductivityLoader type="calender" size="large" showText text="Loading calender..."/>}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <div className="px-0">
                  {activeTab === "dashboard" && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Dashboard />
                    </motion.div>
                  )}
                  {activeTab === "calendar" && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Calendar />
                    </motion.div>
                  )}
                  
                  {activeTab === "habits" && (
                    <motion.div
                      key="habits"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HabitTracker />
                    </motion.div>
                  )}
                  {activeTab === "activity" && (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ActivityStream />
                    </motion.div>
                  )}
                  {activeTab === "todos" && (
                    <motion.div
                      key="todos"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TodoList />
                    </motion.div>
                  )}

                  {activeTab === "reminders" && (
                    <motion.div
                      key="reminders"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Reminders />
                    </motion.div>
                  )}

                  {activeTab === "notes" && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Notes />
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  )
}