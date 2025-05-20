"use client"

import { useState } from 'react'
import { login, signup } from './action'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    await login(formData)
  }
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    await signup(formData)
  }
  

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
        </TabsList>
        
        {/* Login Form */}
        <TabsContent value="login">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-card-foreground">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={handleEmailChange}
                    className="bg-background border-input text-foreground"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-card-foreground">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={password}
                    onChange={handlePasswordChange}
                    className="bg-background border-input text-foreground"
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Log in</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Signup Form */}
        <TabsContent value="signup">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Create an Account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your details to create a new account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-card-foreground">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={handleEmailChange}
                    className="bg-background border-input text-foreground"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-card-foreground">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="bg-background border-input text-foreground"
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign up</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}