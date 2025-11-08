// middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Allow auth routes and static assets
    if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icons") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.json" ||
        pathname.startsWith("/api/deliveries") ||
        pathname === "/signin" // public sign-in page
    ) {
        return NextResponse.next();
    }

    if (!isLoggedIn) {
        const signInUrl = new URL("/signin", req.nextUrl);
        // send them back after sign-in
        signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match everything EXCEPT:
        //  - Next.js internals
        //  - Auth routes
        //  - API routes for deliveries (GET, POST, DELETE)
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/auth|api/deliveries).*)",
    ],
};
