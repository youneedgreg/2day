"use client"

import { useCustomToast } from "@/components/ui/custom-toast"

type ToastVariant = "success" | "error" | "info" | "warning"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export function useToast() {
  const { addToast, removeToast, toasts } = useCustomToast()

  const toast = ({ title, description, variant = "info", duration = 5000 }: ToastProps) => {
    addToast({
      title,
      description,
      variant,
      duration,
    })
  }

  // Add convenience methods for common toast types
  const success = (props: Omit<ToastProps, "variant">) => {
    toast({ ...props, variant: "success" })
  }

  const error = (props: Omit<ToastProps, "variant">) => {
    toast({ ...props, variant: "error" })
  }

  const info = (props: Omit<ToastProps, "variant">) => {
    toast({ ...props, variant: "info" })
  }

  const warning = (props: Omit<ToastProps, "variant">) => {
    toast({ ...props, variant: "warning" })
  }

  return {
    toast,
    success,
    error,
    info,
    warning,
    dismiss: removeToast,
    toasts,
  }
}