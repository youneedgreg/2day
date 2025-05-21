"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { login, signup } from './action'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Shield,
  Users,
  Zap,
  Github,
  Chrome
} from "lucide-react"
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      await login(formData)
      toast.success('Welcome back!')
    } catch (error: unknown) {
      console.error('Login error:', error)
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      await signup(formData)
      toast.success('Account created successfully!')
    } catch (error: unknown) {
      console.error('Signup error:', error)
      toast.error('Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  const features = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and protected"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance"
    },
    {
      icon: Users,
      title: "Collaborative",
      description: "Share and collaborate with your team"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Branding and features */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative"
        >
          <div className="max-w-md">
            {/* Logo/Brand */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">2day</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your personal productivity suite</p>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 mb-8"
            >
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
                Organize your life, <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  achieve your goals
                </span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Track habits, manage tasks, and boost your productivity with our comprehensive suite of tools.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex gap-6"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">10K+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">95%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">24/7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Support</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-md"
          >
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <motion.div
                variants={cardVariants}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-1">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </motion.div>
              
              <AnimatePresence mode="wait">
                {/* Login Form */}
                <TabsContent value="login" className="mt-0">
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                      <CardHeader className="text-center space-y-2 pb-6">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                          Welcome Back
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          Sign in to continue to your account
                        </CardDescription>
                      </CardHeader>
                      <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                          {/* Social Login Buttons */}
                          <div className="space-y-3">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-11 bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50"
                              disabled
                            >
                              <Chrome className="w-4 h-4 mr-2" />
                              Continue with Google
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-11 bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50"
                              disabled
                            >
                              <Github className="w-4 h-4 mr-2" />
                              Continue with GitHub
                            </Button>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                                Or continue with email
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="login-email" className="text-slate-700 dark:text-slate-300 font-medium">
                                Email address
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input 
                                  id="login-email" 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  value={email}
                                  onChange={handleEmailChange}
                                  className="pl-10 h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300 font-medium">
                                Password
                              </Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input 
                                  id="login-password" 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  value={password}
                                  onChange={handlePasswordChange}
                                  className="pl-10 pr-10 h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                                  required 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="remember" 
                                className="rounded border-slate-300 dark:border-slate-600"
                              />
                              <label htmlFor="remember" className="text-slate-600 dark:text-slate-400">
                                Remember me
                              </label>
                            </div>
                            <button 
                              type="button" 
                              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              Forgot password?
                            </button>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? 'Signing in...' : 'Sign in'}
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>
                  </motion.div>
                </TabsContent>
                
                {/* Signup Form */}
                <TabsContent value="signup" className="mt-0">
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                      <CardHeader className="text-center space-y-2 pb-6">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                          Create Account
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          Join thousands of productive users today
                        </CardDescription>
                      </CardHeader>
                      <form onSubmit={handleSignup}>
                        <CardContent className="space-y-4">
                          {/* Social Signup Buttons */}
                          <div className="space-y-3">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-11 bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50"
                              disabled
                            >
                              <Chrome className="w-4 h-4 mr-2" />
                              Sign up with Google
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-11 bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 border border-slate-200/50 dark:border-slate-600/50"
                              disabled
                            >
                              <Github className="w-4 h-4 mr-2" />
                              Sign up with GitHub
                            </Button>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                                Or create with email
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-slate-700 dark:text-slate-300 font-medium">
                                Email address
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input 
                                  id="signup-email" 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  value={email}
                                  onChange={handleEmailChange}
                                  className="pl-10 h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                                  required 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-300 font-medium">
                                Password
                              </Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input 
                                  id="signup-password" 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a strong password"
                                  value={password}
                                  onChange={handlePasswordChange}
                                  className="pl-10 pr-10 h-11 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                                  required 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              {password && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <CheckCircle className={`h-3 w-3 ${password.length >= 8 ? 'text-green-500' : 'text-slate-400'}`} />
                                    <span className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                                      At least 8 characters
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <input 
                              type="checkbox" 
                              id="terms" 
                              className="rounded border-slate-300 dark:border-slate-600"
                              required
                            />
                            <label htmlFor="terms" className="text-slate-600 dark:text-slate-400">
                              I agree to the{' '}
                              <button type="button" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                Terms of Service
                              </button>{' '}
                              and{' '}
                              <button type="button" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                Privacy Policy
                              </button>
                            </label>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? 'Creating account...' : 'Create account'}
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* Mobile branding */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:hidden mt-8 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">ProductivityApp</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Join thousands of users boosting their productivity
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}