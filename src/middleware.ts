// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

function isLoggedIn(req: NextRequest) {
    // Covers NextAuth v4/v5 cookie names (http/https)
    const names = [
        "__Secure-next-auth.session-token",
        "next-auth.session-token",
        "__Secure-authjs.session-token",
        "authjs.session-token",
    ];
    return names.some((n) => !!req.cookies.get(n)?.value);
}

export default function middleware(req: NextRequest) {
    const loggedIn = isLoggedIn(req);
    const { pathname, search } = req.nextUrl;

    // Allow auth routes and static/assets
    if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icons") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.json" ||
        pathname.startsWith("/api/deliveries") ||
        pathname === "/signin"
    ) {
        return NextResponse.next();
    }

    if (!loggedIn) {
        const signInUrl = new URL("/signin", req.nextUrl);
        signInUrl.searchParams.set("callbackUrl", pathname + search);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match everything EXCEPT:
        //  - Next.js internals
        //  - Auth routes
        //  - API routes for deliveries (GET, POST, DELETE)
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/auth|api/deliveries).*)",
    ],
};
