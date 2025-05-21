'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from '@/lib/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Globe, 
  Camera, 
  Save, 
  Loader2, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Trash2,
  Download,
  Upload,
  Settings,
  LogOut,
  Check,
  X,
  AlertTriangle
} from "lucide-react"
import { toast } from 'sonner'

interface AccountFormProps {
  user: User | null
}

export default function AccountForm({ user }: AccountFormProps) {
  const supabase = createClient()
  const router = useRouter()
  
  // Profile state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullname, setFullname] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [website, setWebsite] = useState<string>('')
  const [avatar_url, setAvatarUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [privateProfile, setPrivateProfile] = useState(false)
  
  // UI state
  const [activeSection, setActiveSection] = useState('profile')
  const [dragActive, setDragActive] = useState(false)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error: fetchError, status } = await supabase
        .from('profiles')
        .select(`full_name, username, website, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (fetchError && status !== 406) {
        console.error('Profile fetch error:', fetchError)
        throw fetchError
      }

      if (data) {
        setFullname(data.full_name || '')
        setUsername(data.username || '')
        setWebsite(data.website || '')
        setAvatarUrl(data.avatar_url || '')
      }
      
      setInitialDataLoaded(true)
    } catch (err) {
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user && !initialDataLoaded) {
      getProfile()
    }
  }, [user, getProfile, initialDataLoaded])

  const updateProfile = async () => {
    try {
      setSaving(true)

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      
      if (updateError) throw updateError
      
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      setAvatarUrl(data.publicUrl)
      toast.success('Avatar uploaded successfully!')
    } catch (err) {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadAvatar(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadAvatar(file)
    } else {
      toast.error('Please upload an image file')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (err) {
      toast.error('Failed to sign out')
    }
  }

  const deleteAccount = async () => {
    // This would typically require additional confirmation
    toast.error('Account deletion requires additional verification')
  }

  const getInitials = () => {
    if (fullname) {
      return fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading account...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        {/* Header */}
        <motion.div 
          variants={cardVariants}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your account information and preferences
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div variants={cardVariants} className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={cardVariants} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal information and profile picture
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={avatar_url || undefined} />
                            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        <div
                          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                            dragActive 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="text-center">
                            <Camera className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Drag and drop or click to upload
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Profile Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="pl-10 bg-muted"
                            />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullname">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              id="fullname"
                              type="text"
                              value={fullname}
                              onChange={(e) => setFullname(e.target.value)}
                              placeholder="Enter your full name"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <div className="relative">
                            <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Choose a username"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              id="website"
                              type="url"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://your-website.com"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={updateProfile}
                          disabled={saving}
                          className="min-w-[120px]"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your account security and privacy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Change Password</h3>
                            <p className="text-sm text-muted-foreground">
                              Update your password to keep your account secure
                            </p>
                          </div>
                          <Button variant="outline">Change</Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Two-Factor Authentication</h3>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Button variant="outline">Enable</Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Active Sessions</h3>
                            <p className="text-sm text-muted-foreground">
                              Manage devices that are signed in to your account
                            </p>
                          </div>
                          <Button variant="outline">View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                      <CardDescription>
                        Choose what notifications you want to receive
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Email Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications about your account activity
                            </p>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Marketing Emails</h3>
                            <p className="text-sm text-muted-foreground">
                              Receive emails about new features and updates
                            </p>
                          </div>
                          <Switch
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Private Profile</h3>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible only to you
                            </p>
                          </div>
                          <Switch
                            checked={privateProfile}
                            onCheckedChange={setPrivateProfile}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Danger Zone */}
              {activeSection === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible actions that affect your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                          <div>
                            <h3 className="font-medium text-red-900 dark:text-red-100">Sign Out</h3>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Sign out of your account on this device
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={handleSignOut}
                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                          <div>
                            <h3 className="font-medium text-red-900 dark:text-red-100">Delete Account</h3>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={deleteAccount}
                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}