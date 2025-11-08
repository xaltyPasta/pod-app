// src/app/api/deliveries/[awb]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid caching for API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ awb: string }> }) {
    const { awb } = await params;             // <-- await the params
    const cleanAwb = awb?.trim();
    if (!cleanAwb) return NextResponse.json({ error: "AWB required" }, { status: 400 });

    // keep auth if you want this protected; otherwise remove this block
    const session = await auth();
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const rows = await db.delivery.findMany({
        where: { deliveredById: user.id, awb: cleanAwb },
        orderBy: [{ deliveryDate: "desc" }, { deliveryTime: "desc" }],
    });

    return NextResponse.json(rows);
}
