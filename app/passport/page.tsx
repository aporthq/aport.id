"use client";

/**
 * Passport view page
 * Route: /passport/[agent_id] (rewritten via next.config.mjs)
 *
 * Fetches passport data from APort API and displays the passport card.
 * PRD E2: Passport View Page
 */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PassportView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isNew = searchParams.get("new") === "true";

  if (!id) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Passport not found</h1>
          <p className="text-zinc-400">
            This passport doesn&apos;t exist yet.
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition"
          >
            Create a passport
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      {isNew && (
        <div className="mb-6 px-4 py-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300 text-sm">
          Passport has been issued. Check your email to claim it.
        </div>
      )}

      <div className="max-w-lg w-full">
        {/* Passport card placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4">
          <p className="text-sm text-zinc-500 uppercase tracking-wide font-medium">
            APort Passport
          </p>
          <p className="text-zinc-400 font-mono text-sm break-all">{id}</p>
          <p className="text-zinc-500 text-sm">
            Full passport card coming soon. See PRD E2 for spec.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-center">
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition">
            Share on X
          </button>
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition">
            Download card
          </button>
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition">
            View JSON
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center min-h-screen">
          <p className="text-zinc-500">Loading passport...</p>
        </main>
      }
    >
      <PassportView />
    </Suspense>
  );
}
