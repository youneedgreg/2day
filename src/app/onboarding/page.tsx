"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  goals: z.array(z.string()).min(1, {
    message: "Please select at least one goal.",
  }),
  habitToTrack: z.string().min(2, {
    message: "Please enter a habit you want to track.",
  }),
  habitDescription: z.string().optional(),
  habitType: z.enum(["build", "quit"], {
    required_error: "Please select a habit type.",
  }),
})

const goals = [
  { id: "productivity", label: "Improve productivity" },
  { id: "habits", label: "Build better habits" },
  { id: "organization", label: "Get more organized" },
  { id: "focus", label: "Improve focus" },
  { id: "health", label: "Improve health" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: [],
      habitToTrack: "",
      habitDescription: "",
      habitType: "build",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Mark user as onboarded
      const userResponse = await fetch("/api/user/onboarding", {
        method: "POST",
      })

      if (!userResponse.ok) {
        throw new Error("Failed to update user onboarding status")
      }

      // Create first habit
      const habitResponse = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.habitToTrack,
          description: values.habitDescription,
          type: values.habitType,
        }),
      })

      if (!habitResponse.ok) {
        throw new Error("Failed to create habit")
      }

      // Update session
      await update({ isOnboarded: true })

      toast({
        title: "Onboarding complete!",
        description: "Your account is now set up and ready to use.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && form.getValues().goals.length === 0) {
      form.setError("goals", {
        type: "manual",
        message: "Please select at least one goal.",
      })
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to 2day</CardTitle>
          <CardDescription>Let's set up your account to help you achieve your goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <FormField
                  control={form.control}
                  name="goals"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">What are your goals?</FormLabel>
                        <FormDescription>
                          Select all that apply. This helps us personalize your experience.
                        </FormDescription>
                      </div>
                      {goals.map((goal) => (
                        <FormField
                          key={goal.id}
                          control={form.control}
                          name="goals"
                          render={({ field }) => {
                            return (
                              <FormItem key={goal.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, goal.id])
                                        : field.onChange(field.value?.filter((value) => value !== goal.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{goal.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="habitToTrack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What habit would you like to track?</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Daily exercise, Reading, Meditation" {...field} />
                        </FormControl>
                        <FormDescription>Enter a habit you want to build or quit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="habitDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add details about your habit" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="habitType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Habit Type</FormLabel>
                        <div className="flex space-x-4">
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                className="peer sr-only"
                                id="build"
                                checked={field.value === "build"}
                                onChange={() => field.onChange("build")}
                              />
                            </FormControl>
                            <label
                              htmlFor="build"
                              className={`flex cursor-pointer items-center justify-center rounded-md border border-muted bg-popover px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                                field.value === "build" ? "border-primary" : ""
                              }`}
                            >
                              Build a habit
                            </label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                className="peer sr-only"
                                id="quit"
                                checked={field.value === "quit"}
                                onChange={() => field.onChange("quit")}
                              />
                            </FormControl>
                            <label
                              htmlFor="quit"
                              className={`flex cursor-pointer items-center justify-center rounded-md border border-muted bg-popover px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                                field.value === "quit" ? "border-primary" : ""
                              }`}
                            >
                              Quit a habit
                            </label>
                          </FormItem>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep} disabled={isLoading}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={nextStep} className={step === 1 ? "ml-auto" : ""}>
              Next
            </Button>
          ) : (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

