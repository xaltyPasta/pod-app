// src/components/SignOutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
    return (
        <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
        >
            Sign Out
        </button>
    );
}
