"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ArrowLeft, 
  Bug, 
  WifiOff, 
  Server, 
  Shield, 
  HelpCircle,
  Mail,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react"
import { toast } from 'sonner'

function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('message')
  const [isRetrying, setIsRetrying] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getErrorDetails = () => {
    const message = errorMessage
    if (message?.includes('Network')) {
      return {
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        icon: WifiOff,
        color: "yellow"
      }
    }
    return {
      title: "Something Went Wrong",
      description: message || "An unexpected error occurred. Please try again or contact support if the problem persists.",
      icon: AlertTriangle,
      color: "orange"
    }
  }

  const errorDetails = getErrorDetails()
  const IconComponent = errorDetails.icon

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      window.location.reload()
    } catch (err) {
      toast.error('Failed to retry. Please try again.')
    }
    
    setTimeout(() => setIsRetrying(false), 1000)
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const copyErrorDetails = async () => {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      statusCode: 500,
      message: errorDetails.description,
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
      setCopied(true)
      toast.success('Error details copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy error details')
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

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.2
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-lg"
      >
        <motion.div variants={cardVariants}>
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4 pb-2">
              {/* Error Icon */}
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate={["visible", "pulse"]}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/50 dark:to-orange-950/50 flex items-center justify-center"
              >
                <IconComponent className={`h-10 w-10 ${
                  errorDetails.color === 'red' ? 'text-red-500' :
                  errorDetails.color === 'yellow' ? 'text-yellow-500' :
                  errorDetails.color === 'blue' ? 'text-blue-500' :
                  'text-orange-500'
                }`} />
              </motion.div>

              {/* Status Code Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge 
                  variant="outline" 
                  className={`${
                    errorDetails.color === 'red' ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400' :
                    errorDetails.color === 'yellow' ? 'border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400' :
                    errorDetails.color === 'blue' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400' :
                    'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400'
                  }`}
                >
                  Error 500
                </Badge>
              </motion.div>

              {/* Title and Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {errorDetails.title}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                  {errorDetails.description}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Primary Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isRetrying ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>

                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </motion.div>

              {/* Secondary Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col space-y-2"
              >
                <Button
                  onClick={handleGoBack}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>

                {/* Error Details Section */}
                {(errorMessage) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="border-t pt-4 mt-4"
                  >
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <span className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Technical Details
                        </span>
                        <motion.div
                          animate={{ rotate: 0 }}
                          className="group-open:rotate-180 transition-transform"
                        >
                          ▼
                        </motion.div>
                      </summary>
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-3 space-y-2"
                      >
                        {errorMessage && (
                          <div className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono break-all">
                            {errorMessage}
                          </div>
                        )}
                        
                        <Button
                          onClick={copyErrorDetails}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-3 w-3" />
                              Copy Error Details
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </details>
                  </motion.div>
                )}
              </motion.div>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Still having issues? We&apos;re here to help!
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open('mailto:support@2day.com', '_blank')}
                    >
                      <Mail className="mr-1 h-3 w-3" />
                      Contact Support
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open('/help', '_blank')}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Help Center
                    </Button>
                  </div>
                </div>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Additional Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Don&apos;t worry, these things happen! Our team is continuously working to improve your experience.
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
