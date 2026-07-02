import { Card } from "@/components/ui/card";

// Phase 1: static shell only. Each placeholder becomes a real component in Phase 3.
const PANELS: { title: string; span: string; hint: string }[] = [
  { title: "Quota & burn-rate", span: "md:col-span-2 lg:col-span-2", hint: "5h / 7d windows · time-to-cap" },
  { title: "Recommendations", span: "md:col-span-2 lg:col-span-2", hint: "rule-based tips" },
  { title: "Per-device breakdown", span: "lg:col-span-2", hint: "tokens per device" },
  { title: "Model mix", span: "", hint: "Opus / Sonnet / Haiku" },
  { title: "Cache hit rate", span: "", hint: "reuse vs resend" },
  { title: "Trend", span: "md:col-span-2 lg:col-span-3", hint: "tokens/hour · 30d" },
  { title: "Top tasks", span: "lg:col-span-1", hint: "5 priciest · 7d" },
];

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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PANELS.map((p) => (
          <Card
            key={p.title}
            className={`glass glass-hover min-h-40 justify-between gap-2 p-5 ${p.span}`}
          >
            <div className="text-sm font-medium text-foreground/90">{p.title}</div>
            <div className="text-xs text-muted-foreground">{p.hint}</div>
          </Card>
        ))}
      </div>
    </main>
  );
}
