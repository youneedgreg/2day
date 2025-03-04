import { CalendarDays, CheckCircle, ListTodo, NotebookPen, Bell } from "lucide-react"

export function FeatureSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">All-in-One Productivity Solution</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Everything you need to build better habits and boost your productivity in one place.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <CheckCircle className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Habit Tracking</h3>
            <p className="text-center text-muted-foreground">
              Build positive habits or quit negative ones with our powerful tracking system.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <ListTodo className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">To-Do Lists</h3>
            <p className="text-center text-muted-foreground">
              Organize your tasks and boost your productivity with smart to-do lists.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <NotebookPen className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Note Taking</h3>
            <p className="text-center text-muted-foreground">
              Capture your thoughts and ideas with our intuitive note-taking feature.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Bell className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Reminders</h3>
            <p className="text-center text-muted-foreground">
              Never miss important tasks with our customizable reminder system.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <CalendarDays className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Calendar View</h3>
            <p className="text-center text-muted-foreground">
              Visualize your progress and track streaks with our calendar view.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">+</span>
            </div>
            <h3 className="text-xl font-bold">And More</h3>
            <p className="text-center text-muted-foreground">
              Personalized dashboard, progress tracking, and many more features to help you succeed.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

