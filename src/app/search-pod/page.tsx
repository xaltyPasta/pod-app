// src/app/search-pod/page.tsx
"use client";

import { useEffect, useState } from "react";

type Delivery = {
    id: string;
    awb: string;
    deliveredById: string;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
};

export default function SearchPodPage() {
    const [awb, setAwb] = useState("");
    const [searchedAwb, setSearchedAwb] = useState<string | null>(null);
    const [results, setResults] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    async function fetchDeliveries(query?: string) {
        setLoading(true);
        setError(null);
        try {
            const url = query ? `/api/deliveries?awb=${encodeURIComponent(query)}` : `/api/deliveries`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = (await res.json()) as Delivery[];
            setResults(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setResults([]);
            setError(err?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // auto-load all on first render
        setHasSearched(true);
        setSearchedAwb(null);
        fetchDeliveries();
    }, []);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const query = awb.trim();
        setHasSearched(true);
        setSearchedAwb(query || null);
        fetchDeliveries(query || undefined);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setResults(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            alert(err?.message || "Failed to delete entry");
        }
    }

    return (
        <div className="container py-4">
            <h3 className="mb-4">Search Proof of Delivery</h3>

            <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter AWB number (leave blank to list all)"
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                />
                <button className="btn btn-primary" disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {error && (
                <div className="d-flex justify-content-center">
                    <div className="alert alert-danger py-2 w-75 text-center">{error}</div>
                </div>
            )}

            {hasSearched && !loading && results.length === 0 && (
                <div className="d-flex justify-content-center">
                    <div className="alert alert-warning py-2 w-75 text-center">
                        {searchedAwb ? `No results found for AWB "${searchedAwb}".` : "No deliveries found."}
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="table-responsive mt-4">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>AWB</th>
                                <th>Date/Time</th>
                                {/* <th>Delivery Agent Id</th> */}
                                <th>Media Type</th>
                                <th>Proof</th>
                                {/* <th style={{ width: 120 }}>Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r) => {
                                const isDeleting = deletingIds.has(r.id);
                                return (
                                    <tr key={r.id}>
                                        <td>{r.awb}</td>
                                        <td>
                                            {new Date(r.createdAt).toLocaleString("en-IN", {
                                                timeZone: "Asia/Kolkata",
                                            })}
                                        </td>
                                        {/* <td>{r.deliveredById}</td> */}
                                        <td className="text-capitalize">{r.mediaType}</td>
                                        <td>
                                            <a href={r.mediaUrl} target="_blank" rel="noopener noreferrer">
                                                View Proof
                                            </a>
                                        </td>
                                        {/* <td>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(r.id)}
                                                disabled={isDeleting}
                                                title="Delete this entry"
                                            >
                                                {isDeleting ? "Deleting…" : "Delete"}
                                            </button>
                                        </td> */}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
