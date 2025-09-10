'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import HabitTracker from '@/components/habit-tracker'
import TodoList from '@/components/todo-list'
import Reminders from '@/components/reminders'
import Notes from '@/components/notes'
import Dashboard from '@/components/dashboard'
import ProductivityLoader, { PageLoader } from '@/components/ui/loader'
import Image from 'next/image'
import ActivityStream from '@/components/activity'
import Calendar from '@/components/calender'
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
  LogIn
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState('light')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  
  const { user, session, loading, signOut } = useAuthContext()
  const isAuthenticated = !!session

  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark')
  }

  const handleTabChange = (value: string) => {
    setContentLoading(true)
    setActiveTab(value)
    
    setTimeout(() => {
      setContentLoading(false)
    }, 800)
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) { 
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
      setIsAccountOpen(false)
    }
  }

  const handleEditAccount = () => {
    setIsAccountOpen(false)
    router.push('/account')
  }

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

  if (!mounted) {
    return null
  }
  
  if (loading) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <PageLoader 
          type='neutral' 
          text='Loading...' 
          showText={true} 
        />
      </div>
    )
  }

  const navItems = [
    { value: 'dashboard', label: 'Dashboard', icon: <BarChart3 className='h-5 w-5' /> },
    { value: 'activity', label: 'Activity', icon: <Activity className='h-5 w-5' /> },
    { value: 'habits', label: 'Habits', icon: <CalendarCheck2 className='h-5 w-5' /> },
    { value: 'todos', label: 'Todos', icon: <CheckSquare className='h-5 w-5' /> },
    { value: 'reminders', label: 'Reminders', icon: <Bell className='h-5 w-5' /> },
    { value: 'notes', label: 'Notes', icon: <StickyNote className='h-5 w-5' /> },
    { value: 'calendar', label: 'Calendar', icon: <CalendarIcon className='h-5 w-5' /> },
  ]

  return (
    <div className='h-screen flex flex-col'>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className='flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'
      >
        <div className='flex items-center justify-between px-4 md:px-6 py-3'>
          <div className='flex items-center gap-2'>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Image
                src='/logo.png'
                alt='2day Logo'
                width={32}
                height={32}
                className='h-8 w-8'
              />
            </motion.div>
            <h1 className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent'>
              2day
            </h1>
          </div>

          <div className='flex items-center gap-2'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className='p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors'
            >
              {theme === 'light' ? <Moon className='h-5 w-5' /> : <Sun className='h-5 w-5' />}
            </motion.button>

            {isAuthenticated ? (
              <div className='relative' ref={accountRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className='flex items-center gap-2 p-2 rounded-full hover:bg-muted transition-colors'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium'>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isAccountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className='absolute right-0 top-full mt-2 w-64 bg-background border rounded-lg shadow-lg overflow-hidden z-50'
                    >
                      <div className='p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium text-sm truncate'>
                              {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className='text-xs text-muted-foreground truncate'>
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='py-2'>
                        <button
                          onClick={handleEditAccount}
                          className='w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3'
                        >
                          <Edit className='h-4 w-4' />
                          <span className='text-sm'>Edit Account</span>
                        </button>
                        
                        <div className='border-t mx-2 my-2'></div>
                        
                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className='w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400'
                        >
                          {isSigningOut ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Settings className='h-4 w-4' />
                            </motion.div>
                          ) : (
                            <LogOut className='h-4 w-4' />
                          )}
                          <span className='text-sm'>
                            {isSigningOut ? 'Signing out...' : 'Sign Out'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button onClick={() => router.push('/login')}>
                <LogIn className='mr-2 h-4 w-4' />
                Login
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <div className='flex flex-1 overflow-hidden'>
        {!isMobile && (
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`w-64 flex-shrink-0 flex flex-col border-r h-full overflow-y-auto ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
          >
            <nav className='flex-1 overflow-y-auto p-6 space-y-1'>
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
        
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='flex-1 overflow-y-auto'
        >
          {isMobile && (
            <Tabs 
              value={activeTab} 
              className='w-full sticky top-0 z-10 bg-background'
              onValueChange={handleTabChange}
            >
              <motion.div 
                initial={{ y: 10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className='w-full px-0'
              >
                <TabsList className='h-full w-full flex justify-between mb-4 bg-muted/50 rounded-none'>
                  {navItems.map(item => (
                    <TabsTrigger 
                      key={item.value}
                      value={item.value} 
                      className='flex-1 flex items-center justify-center py-3'
                    >
                      {item.icon}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>
            </Tabs>
          )}

          <div className='p-0 md:p-8 max-w-7xl mx-auto w-full'>
            {contentLoading ? (
              <div className='flex justify-center items-center py-20'>
                <ProductivityLoader type='neutral' size='large' showText text={`Loading ${activeTab}...`} />
              </div>
            ) : (
              <AnimatePresence mode='wait'>
                <div className='px-0'>
                  {activeTab === 'dashboard' && <motion.div key='dashboard' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><Dashboard isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'calendar' && <motion.div key='calendar' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><Calendar isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'habits' && <motion.div key='habits' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><HabitTracker isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'activity' && <motion.div key='activity' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><ActivityStream isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'todos' && <motion.div key='todos' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><TodoList isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'reminders' && <motion.div key='reminders' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><Reminders isAuthenticated={isAuthenticated} /></motion.div>}
                  {activeTab === 'notes' && <motion.div key='notes' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><Notes isAuthenticated={isAuthenticated} /></motion.div>}
                </div>
              </AnimatePresence>
            )}
          </div>
        </motion.main>
      </div>

      {!isAuthenticated && (
        <div className='fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            You are not logged in. Your data is being saved locally. 
            <Button variant='link' className='p-0 h-auto ml-1' onClick={() => router.push('/login')}>Sign in</Button> to sync your data across devices.
          </p>
        </div>
      )}
    </div>
  )
}


