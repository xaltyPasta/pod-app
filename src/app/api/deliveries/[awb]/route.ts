// src/app/api/deliveries/[awb]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: { awb: string } }) {
    const session = await auth();
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const awb = ctx.params.awb?.trim();
    if (!awb) return new NextResponse("AWB required", { status: 400 });

    const rows = await db.delivery.findMany({
        where: { deliveredById: user.id, awb },
        orderBy: [{ deliveryDate: "desc" }, { deliveryTime: "desc" }],
    });

    return NextResponse.json(rows);
}
