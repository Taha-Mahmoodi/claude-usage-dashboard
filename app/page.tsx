import { Dashboard } from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Claude Usage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live token usage across your devices, against the Max20x rate-limit windows.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
