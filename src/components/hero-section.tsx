import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Build Better Habits, Boost Your Productivity
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                2day helps you build positive habits, quit negative ones, and stay organized with powerful productivity
                tools.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-1">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-[350px] sm:h-[450px] sm:w-[450px] lg:h-[500px] lg:w-[500px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl" />
              <div className="absolute inset-10 bg-background rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <div className="text-7xl font-bold">2day</div>
                  <p className="text-xl text-muted-foreground">Start now, change forever</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

