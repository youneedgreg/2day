/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const { success, error } = useToast()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error: fetchError, status } = await supabase
        .from('profiles')
        .select(`full_name, username, website, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (fetchError && status !== 406) {
        console.log(fetchError)
        throw fetchError
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (err) {
      error({
        title: "Failed to load profile",
        description: "We couldn't load your profile data. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase, error])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string | null
    fullname: string | null
    website: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      
      if (updateError) throw updateError
      
      success({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        duration: 3000,
      })
    } catch (err) {
      error({
        title: "Update failed",
        description: "We couldn't update your profile. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      setAvatarUrl(data.publicUrl)
      
      // Update the profile with the new avatar URL
      await updateProfile({ username, fullname, website, avatar_url: data.publicUrl })
      
      success({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      })
    } catch (err) {
      error({
        title: "Upload failed",
        description: "We couldn't upload your avatar. Please try again."
      })
    } finally {
      setUploading(false)
    }
  }

  // Function to get initials from name or email
  const getInitials = () => {
    if (fullname) {
      return fullname.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
        <CardDescription className="text-violet-100">
          View and edit your account details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-md">
            <AvatarImage src={avatar_url || undefined} alt={fullname || "Profile"} />
            <AvatarFallback className="text-lg bg-violet-100 text-violet-800">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div>
            <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition shadow-sm">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Change Avatar"
              )}
            </Label>
            <Input 
              id="avatar" 
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>
        
        <Separator className="bg-gray-200" />
        
        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullname || ''}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Enter your full name"
              className="border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700">Username</Label>
            <Input
              id="username"
              type="text"
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website" className="text-gray-700">Website</Label>
            <Input
              id="website"
              type="url"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 bg-gray-50 rounded-b-lg border-t border-gray-200 px-6 py-4">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => updateProfile({ fullname, username, website, avatar_url })}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        
        <form action="/auth/signout" method="post" className="w-full">
          <Button 
            variant="outline" 
            type="submit" 
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}