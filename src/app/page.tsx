"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import HomeLayout from "@/components/HomeLayout";

export default function HomePage() {
  const { data: session } = useSession();
  const user = {
    name: session?.user?.name ?? null,
    agentId: (session?.user as any)?.agentId ?? null, // include in session if you expose it
    image: session?.user?.image ?? null,
  };

  return (
    <div className="container py-5 text-center">
      <div className="mb-4">
        {/* The header is now provided by HomeLayout; this is the hero area */}
        <p className="text-muted">Digitize your delivery confirmations with ease.</p>
      </div>

      {session ? (
        <div className="d-flex justify-content-center flex-wrap gap-3">
          <Link href="/scan" className="btn btn-primary">
            Start Scanning
          </Link>
          <Link href="/history" className="btn btn-outline-secondary">
            View History
          </Link>
          <Link href="/search-pod" className="btn btn-outline-dark">
            Search POD
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-muted mb-3">Sign in to start capturing deliveries.</p>
          <Link href="/signin" className="btn btn-primary">
            Sign in with Google
          </Link>
        </div>
      )}
    </div>
  );
}
