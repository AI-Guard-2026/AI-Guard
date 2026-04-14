import { UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">AIGuard</h1>
        <UserButton />
      </header>
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-semibold">Welcome to AIGuard</h2>
        <p className="mt-2 text-muted-foreground">
          Your EU AI Act compliance platform
        </p>
      </main>
    </div>
  )
}