// src/app/page.tsx (App Router) or src/pages/index.tsx (Pages Router)
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold">Hello Tailwind CSS v4!</h1>
        <p className="text-muted-foreground mt-2">
          Using Tailwind without a separate config file.
        </p>
        <button className="bg-primary text-primary-foreground mt-4 px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          Click me
        </button>
      </div>
    </main>
  );
}