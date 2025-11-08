// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// keep this list TINY and constant
const PUBLIC_PATHS = [
    "/",
    "/signin",
    "/api/auth",          // next-auth callbacks
    "/api/deliveries",    // your public API if you want it public
    "/icons",
    "/favicon.ico",
    "/manifest.json",
    "/_next",             // all next internals
];

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Let public routes through (static & allowed APIs)
    if (isPublic(pathname)) return NextResponse.next();

    // Lightweight auth check: decode session JWT only (no DB)
    const token = await getToken({ req, secureCookie: true });
    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = "/signin";
        url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
    }

    // (Optional) very light role check if you put 'role' into the JWT during signIn
    // if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    //   return NextResponse.redirect(new URL("/", req.url));
    // }

    return NextResponse.next();
}

// Narrow matcher to avoid bundling on everything
export const config = {
    matcher: [
        // protect "everything" EXCEPT our explicit public buckets above
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/auth|api/deliveries).*)",
    ],
};
