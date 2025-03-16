"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  CircleX, 
  CheckCheck, 
  Calendar, 
  Clock 
} from "lucide-react"

type LoaderSize = "small" | "default" | "large"
type LoaderType = "habit" | "todo" | "reminder" | "neutral"
type HabitType = "build" | "quit"

interface ProductivityLoaderProps {
  size?: LoaderSize
  type?: LoaderType
  habitType?: HabitType
  text?: string
  showText?: boolean
}

const ProductivityLoader: React.FC<ProductivityLoaderProps> = ({
  size = "default",
  type = "neutral",
  habitType = "build",
  text,
  showText = false
}) => {
  // Size variants
  const sizeVariants = {
    small: {
      container: "h-8 w-8",
      icon: "h-5 w-5",
      text: "text-xs",
    },
    default: {
      container: "h-12 w-12",
      icon: "h-8 w-8",
      text: "text-sm",
    },
    large: {
      container: "h-16 w-16",
      icon: "h-12 w-12",
      text: "text-base",
    },
  }

  // Color variants based on loader type
  const colorVariants = {
    habit: habitType === "build" ? "text-green-500" : "text-red-500",
    todo: "text-blue-500",
    reminder: "text-amber-500",
    neutral: "text-primary"
  }
  
  // Background color variants
  const bgColorVariants = {
    habit: habitType === "build" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20",
    todo: "bg-blue-100 dark:bg-blue-900/20",
    reminder: "bg-amber-100 dark:bg-amber-900/20",
    neutral: "bg-primary/10"
  }

  // Select icon based on type
  const getIcon = () => {
    switch (type) {
      case "habit":
        return habitType === "build" ? <CheckCircle className="w-full h-full" /> : <CircleX className="w-full h-full" />
      case "todo":
        return <CheckCheck className="w-full h-full" />
      case "reminder":
        return <Clock className="w-full h-full" />
      default:
        return <Calendar className="w-full h-full" />
    }
  }

  // Animation variants
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1.5
  }

  const pulseTransition = {
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
    duration: 1.2,
  }

  // Default text if none provided
  const defaultText = {
    habit: habitType === "build" ? "Building habits..." : "Breaking habits...",
    todo: "Loading tasks...",
    reminder: "Loading reminders...",
    neutral: "Loading..."
  }

  const displayText = text || defaultText[type]

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.div
        className={`relative flex items-center justify-center ${sizeVariants[size].container}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background circle */}
        <motion.div
          className={`absolute inset-0 rounded-full ${bgColorVariants[type]}`}
          animate={{ 
            scale: [0.85, 1.1, 0.85], 
            opacity: [0.7, 0.9, 0.7] 
          }}
          transition={pulseTransition}
        />
        
        {/* Spinning icon */}
        <motion.div
          animate={{ rotate: type === "habit" ? [-10, 10, -10] : 360 }}
          transition={spinTransition}
          className={`${colorVariants[type]} ${sizeVariants[size].icon}`}
        >
          {getIcon()}
        </motion.div>
      </motion.div>
      
      {/* Optional text */}
      {showText && (
        <motion.p 
          className={`${sizeVariants[size].text} ${colorVariants[type]} font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {displayText}
        </motion.p>
      )}
    </div>
  )
}

// Full page loader with overlay
export const PageLoader: React.FC<ProductivityLoaderProps> = (props) => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ProductivityLoader 
        size="large" 
        showText={true} 
        {...props} 
      />
    </motion.div>
  )
}

// Inline loader for buttons or content areas
export const InlineLoader: React.FC<ProductivityLoaderProps> = (props) => {
  return (
    <ProductivityLoader 
      size="small" 
      {...props} 
    />
  )
}

export default ProductivityLoader