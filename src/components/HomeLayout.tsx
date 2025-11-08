"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";

type HomeLayoutProps = {
    user: {
        name?: string | null;
        agentId?: string | null;
        image?: string | null;
    };
    children: React.ReactNode;
};

export default function HomeLayout({ user, children }: HomeLayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const profileRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const t = e.target as Node;
            if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
            if (profileOpen && profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
        }
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setMenuOpen(false);
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [menuOpen, profileOpen]);

    const displayName =
        user?.name?.trim() ||
        (user?.agentId ? `Agent ${user.agentId.slice(0, 6)}` : "Agent");

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ background: "#f8f9fa" }}>
            {/* Header (clicking title returns to home) */}
            <header className="d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom">
                {/* Left: Hamburger */}
                <div className="position-relative" ref={menuRef}>
                    <button
                        type="button"
                        className="btn btn-link text-dark p-2"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen(v => !v)}
                    >
                        <span style={{ display: "inline-block", lineHeight: 0 }}>
                            <span style={{ display: "block", width: 22, height: 2, background: "#212529", margin: "4px 0" }} />
                            <span style={{ display: "block", width: 22, height: 2, background: "#212529", margin: "4px 0" }} />
                            <span style={{ display: "block", width: 22, height: 2, background: "#212529", margin: "4px 0" }} />
                        </span>
                    </button>

                    {menuOpen && (
                        <div
                            className="position-absolute bg-white border rounded shadow-sm"
                            style={{ top: "46px", left: 0, minWidth: 180, zIndex: 1050 }}
                        >
                            <nav className="list-group list-group-flush">
                                <Link href="/scan" className="list-group-item list-group-item-action" onClick={() => setMenuOpen(false)}>
                                    Scan
                                </Link>
                                <Link href="/history" className="list-group-item list-group-item-action" onClick={() => setMenuOpen(false)}>
                                    History
                                </Link>
                                <Link href="/search-pod" className="list-group-item list-group-item-action" onClick={() => setMenuOpen(false)}>
                                    Search
                                </Link>
                            </nav>
                        </div>
                    )}
                </div>

                {/* Center: Clickable app title */}
                <Link href="/" className="text-decoration-none">
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 20 }}>📦</span>
                        <span className="fw-semibold text-dark">Proof of Delivery App</span>
                    </div>
                </Link>

                {/* Right: Avatar + Name */}
                <div className="position-relative d-flex align-items-center gap-2" ref={profileRef}>
                    <button
                        className="btn p-0 border-0 bg-transparent"
                        onClick={() => setProfileOpen(v => !v)}
                        aria-label="Open profile"
                    >
                        <div className="rounded-circle overflow-hidden border" style={{ width: 36, height: 36, background: "#e9ecef" }}>
                            {user?.image ? (
                                <Image src={user.image} alt={displayName} width={36} height={36} style={{ objectFit: "cover" }} />
                            ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-uppercase" style={{ fontSize: 12, color: "#6c757d" }}>
                                    {(displayName || "A").slice(0, 2)}
                                </div>
                            )}
                        </div>
                    </button>
                    <div
                        className="small text-truncate"
                        style={{ maxWidth: 160, cursor: "pointer" }}
                        onClick={() => setProfileOpen(v => !v)}
                        title={displayName}
                    >
                        {profileOpen ? displayName : " "}
                    </div>

                    {profileOpen && (
                        <div
                            className="position-absolute bg-white border rounded shadow-sm"
                            style={{ top: "46px", right: 0, minWidth: 180, zIndex: 1050 }}
                        >
                            <div className="list-group list-group-flush">
                                <button
                                    className="list-group-item list-group-item-action text-danger"
                                    onClick={() => {
                                        setProfileOpen(false);
                                        signOut({ callbackUrl: "/" });
                                    }}
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </header>

            {/* Page body */}
            <main className="flex-grow-1">{children}</main>
        </div>
    );
}
