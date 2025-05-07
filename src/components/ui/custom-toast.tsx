"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, AlertCircle, X, Info } from "lucide-react"

type ToastVariant = "success" | "error" | "info" | "warning"

type ToastProps = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextType = {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function CustomToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }])

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const value = {
    toasts,
    addToast,
    removeToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useCustomToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useCustomToast must be used within a CustomToastProvider")
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useCustomToast()

  // Use a ref to store whether document is defined (for SSR compatibility)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  if (!isMounted) {
    return null
  }

  return createPortal(
    <div className="fixed top-0 right-0 p-4 w-full md:max-w-sm z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

function Toast({
  id,
  title,
  description,
  variant = "info",
  onClose,
}: ToastProps & { onClose: () => void }) {
  const getIcon = () => {
    switch (variant) {
      case "success":
        return <Check className="h-5 w-5 text-white" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-white" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-white" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-white" />
    }
  }

  const getBackgroundColor = () => {
    switch (variant) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-amber-500"
      case "info":
      default:
        return "bg-blue-500"
    }
  }

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-3 rounded-lg border border-gray-200 shadow-lg p-4 ${
        variant === "info" ? "bg-white" : "text-white " + getBackgroundColor()
      }`}
    >
      <div className={`p-1 rounded-full ${variant === "info" ? "bg-blue-500" : "bg-white/20"}`}>
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className={`rounded-full p-1 hover:bg-black/10 transition-colors ${
          variant === "info" ? "text-gray-400" : "text-white/80"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

// Component for rendering toasts at the app level
export function CustomToaster() {
  return null // The actual rendering happens in the provider
}