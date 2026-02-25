import { Navbar } from "@/components/navbar";

export function AppShell({ title, children, activePage }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar activePage={activePage} />
      <div className="h-16" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          {title}
        </h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
