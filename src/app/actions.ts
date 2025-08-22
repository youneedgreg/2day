'use server'

import { createServerSupabaseClient } from '@/lib/supabaseServerClient'
import { redirect } from 'next/navigation'

type LoginCredentials = {
  email: string
  password: string
}

export async function login({ email, password }: LoginCredentials) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup({ email, password }: LoginCredentials) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email to confirm your account' }
}

export async function logout() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}