// src/app/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
    const [loading, setLoading] = useState(false);

    async function handleGoogleSignIn() {
        setLoading(true);
        await signIn("google", { callbackUrl: "/" });
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-6 col-lg-5">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="mb-3 text-center">Sign in</h3>
                            <p className="text-muted text-center mb-4">
                                Continue with your Google account
                            </p>
                            <div className="d-grid">
                                <button
                                    className="btn btn-outline-dark"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    {loading ? "Redirecting..." : "Continue with Google"}
                                </button>
                            </div>
                            <p className="text-center mt-3 small text-muted">
                                You’ll be redirected to Google to grant access.
                            </p>
                        </div>
                    </div>
                    <p className="text-center mt-3">
                        <a href="/">Back to Home</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
