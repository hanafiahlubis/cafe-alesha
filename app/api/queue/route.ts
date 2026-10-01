import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper mendapatkan tanggal hari ini dalam format YYYY-MM-DD (Zona Lokal Waktu Indonesia)
function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// GET: Ambil status antrean hari ini
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date") || getTodayDateString();

        const queues = await prisma.queue.findMany({
            where: { date },
            orderBy: { queueNumber: "desc" },
        });

        const lastQueueNumber = queues.length > 0 ? queues[0].queueNumber : 0;
        const nextQueueNumber = lastQueueNumber + 1;
        const nextFormatted = `#${nextQueueNumber.toString().padStart(3, "0")}`;

        return NextResponse.json({
            success: true,
            data: {
                date,
                totalQueueToday: queues.length,
                lastQueueNumber,
                nextQueueNumber,
                nextFormatted,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST: Buat antrean baru (Atomic increment per hari)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const today = body.date || getTodayDateString();

        const lastQueue = await prisma.queue.findFirst({
            where: { date: today },
            orderBy: { queueNumber: "desc" },
        });

        const newNumber = (lastQueue?.queueNumber || 0) + 1;
        const formatted = `#${newNumber.toString().padStart(3, "0")}`;

        const queueRecord = await prisma.queue.create({
            data: {
                queueNumber: newNumber,
                formatted,
                date: today,
                orderId: body.orderId || null,
            },
        });

        return NextResponse.json({ success: true, data: queueRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}