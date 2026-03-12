"use client";

/**
 * aport.id Homepage
 *
 * Hero + creation form above the fold.
 * PRD E7: Homepage
 */

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Hero */}
        <div className="space-y-4 pt-16">
          <h1 className="text-5xl font-bold tracking-tight">
            Give your agent an ID.
          </h1>
          <p className="text-xl text-zinc-400">
            Every agent deserves a name, an origin, and an identity it can carry
            anywhere.
          </p>
        </div>

        {/* Creation form placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-left space-y-6">
          <p className="text-sm text-zinc-500 uppercase tracking-wide font-medium">
            Create a passport
          </p>
          <p className="text-zinc-400">
            Creation form coming soon. See PRD E1 for spec.
          </p>
        </div>

        {/* Footer */}
        <footer className="pb-8 text-sm text-zinc-600 space-x-4">
          <a href="https://aport.io" className="hover:text-zinc-400">
            aport.io
          </a>
          <span>&middot;</span>
          <a
            href="https://github.com/aporthq"
            className="hover:text-zinc-400"
          >
            GitHub
          </a>
          <span>&middot;</span>
          <code className="text-zinc-500">npx aport-id</code>
        </footer>
      </div>
    </main>
  );
}
