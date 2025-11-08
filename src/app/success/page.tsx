// src/app/success/page.tsx
"use client";

import Link from "next/link";

export default function SuccessPage() {
    return (
        <div className="container py-5 text-center">
            <div className="card shadow p-5">
                <h3 className="mb-3 text-success">✅ Proof of Delivery Uploaded Successfully!</h3>
                <p>Your Proof of Delivery has been saved and logged in the system.</p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Link href="/scan" className="btn btn-primary">
                        Scan Next AWB
                    </Link>
                    <Link href="/history" className="btn btn-outline-secondary">
                        View History
                    </Link>
                </div>
            </div>
        </div>
    );
}
