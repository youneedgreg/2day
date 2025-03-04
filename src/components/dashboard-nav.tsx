"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, CheckCircle, Home, ListTodo, NotebookPen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Habits",
    href: "/dashboard/habits",
    icon: CheckCircle,
  },
  {
    title: "To-Do List",
    href: "/dashboard/todos",
    icon: ListTodo,
  },
  {
    title: "Notes",
    href: "/dashboard/notes",
    icon: NotebookPen,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 py-4">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn("w-full justify-start", pathname === item.href ? "bg-secondary font-medium" : "font-normal")}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}

