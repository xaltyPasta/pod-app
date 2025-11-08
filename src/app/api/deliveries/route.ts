// src/app/api/deliveries/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { appendPodRow, ensureHeaderRow } from "@/lib/sheets";

const CreateDelivery = z.object({
    awb: z.string().trim().min(3).max(64),
    mediaUrl: z.string().url(),
    mediaType: z.enum(["IMAGE", "VIDEO"]),
});

function istNow() {
    return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = CreateDelivery.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Validation failed",
                details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
            },
            { status: 400 }
        );
    }

    const { awb, mediaUrl, mediaType } = parsed.data;

    try {
        // ensure FK user
        const user = await db.user.upsert({
            where: { email: session.user.email },
            update: {},
            create: { email: session.user.email, name: session.user.name ?? null },
        });

        // save delivery in DB
        const rec = await db.delivery.create({
            data: {
                awb,
                mediaUrl,
                mediaType,
                deliveredById: user.id,
            },
        });

        // write to Google Sheet (service account / JWT)
        let sheetsStatus: "ok" | "error" = "ok";
        let sheetsError: string | undefined;

        try {
            await ensureHeaderRow(); // idempotent
            const name = user.name ?? "";
            const phone = (user as any).phone ?? "";
            await appendPodRow([awb, istNow(), name, phone, mediaUrl, mediaType]);
        } catch (e: any) {
            sheetsStatus = "error";
            sheetsError = e?.message || "Sheets append failed";
            console.error("Sheets append failed:", e);
        }

        return NextResponse.json(
            {
                delivery: rec,
                sheets: { status: sheetsStatus, error: sheetsError },
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("Delivery create failed:", err);
        return NextResponse.json({ error: "Failed to save delivery record" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const awb = url.searchParams.get("awb")?.trim() || undefined;

    const rows = await db.delivery.findMany({
        where: awb ? { awb } : {},
        orderBy: [{ deliveryDate: "desc" }, { deliveryTime: "desc" }],
    });

    return NextResponse.json(rows);
}


// export async function DELETE(req: Request) {
//     const url = new URL(req.url);
//     const id = url.searchParams.get("id")?.trim();

//     if (!id) {
//         return NextResponse.json({ error: "Missing id" }, { status: 400 });
//     }

//     try {
//         await db.delivery.delete({ where: { id } });
//         return new NextResponse(null, { status: 204 });
//     } catch (e: any) {
//         return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }
// }