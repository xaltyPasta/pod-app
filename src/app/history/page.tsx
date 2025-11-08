// src/app/history/page.tsx
"use client";

import { useEffect, useState } from "react";

type Delivery = {
    id: string;
    awb: string;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    deliveredById: string;
};

export default function HistoryPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDeliveries() {
            const res = await fetch("/api/deliveries");
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
            setLoading(false);
        }
        fetchDeliveries();
    }, []);

    return (
        <div className="container py-4">
            <h3 className="mb-4">Delivery History</h3>
            {loading ? (
                <div>Loading...</div>
            ) : deliveries.length === 0 ? (
                <div className="alert alert-info">No deliveries found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>AWB</th>
                                <th>Date/Time</th>
                                {/* <th>Delivery Agent Id</th> */}
                                <th>Media Type</th>
                                <th>Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((d) => (
                                <tr key={d.id}>
                                    <td>{d.awb}</td>
                                    <td>{new Date(d.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                                    {/* <td>{d.deliveredById}</td> */}
                                    <td className="text-capitalize">{d.mediaType}</td>
                                    <td>
                                        <a href={d.mediaUrl} target="_blank" rel="noopener noreferrer">
                                            View Proof
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
