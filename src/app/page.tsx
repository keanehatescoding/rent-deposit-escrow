export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Rent Deposit Escrow</h1>
      <p className="text-stone-700">
        A scaffold for holding tenant security deposits in escrow, tracking deduction claims, and
        releasing funds fairly at the end of a tenancy.
      </p>
      <p className="text-sm text-stone-500">
        UI, authentication, and payment integrations are not yet wired up. See{" "}
        <code className="rounded bg-stone-200 px-1 py-0.5">README.md</code> for the current state.
      </p>
    </main>
  );
}
