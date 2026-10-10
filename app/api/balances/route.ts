import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper untuk mengekstrak initialAmount jika tersimpan di catatan legacy
function parseInitialFromNote(note?: string | null): { initialAmount: number; cleanNote: string | null } {
  if (!note) return { initialAmount: 0, cleanNote: null };
  const match = note.match(/\[INITIAL:([0-9.]+)\]/);
  if (match) {
    const amt = parseFloat(match[1]) || 0;
    const clean = note.replace(/\[INITIAL:[0-9.]+\]\s*/, "").trim();
    return { initialAmount: amt, cleanNote: clean || null };
  }
  return { initialAmount: 0, cleanNote: note };
}

export async function GET() {
  try {
    let latestCash: any = null;
    let latestQris: any = null;
    let recentHistory: any[] = [];

    try {
      latestCash = await (prisma as any).balanceAdjustment.findFirst({
        where: { type: "CASH" },
        orderBy: { updatedAt: "desc" },
      });

      latestQris = await (prisma as any).balanceAdjustment.findFirst({
        where: { type: "QRIS" },
        orderBy: { updatedAt: "desc" },
      });

      recentHistory = await (prisma as any).balanceAdjustment.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
      });
    } catch (dbErr: any) {
      console.warn("balanceAdjustment query warning:", dbErr.message);
    }

    const formatBalance = (item: any, type: "CASH" | "QRIS") => {
      if (!item) return null;
      const parsed = parseInitialFromNote(item.note);
      const initial = item.initialAmount != null ? Number(item.initialAmount) : parsed.initialAmount;
      return {
        id: item.id,
        type,
        actualAmount: Number(item.actualAmount ?? 0),
        initialAmount: initial,
        note: parsed.cleanNote,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
      };
    };

    return NextResponse.json({
      success: true,
      data: {
        cash: formatBalance(latestCash, "CASH"),
        qris: formatBalance(latestQris, "QRIS"),
        history: recentHistory.map((h: any) => {
          const parsed = parseInitialFromNote(h.note);
          const initial = h.initialAmount != null ? Number(h.initialAmount) : parsed.initialAmount;
          return {
            id: h.id,
            type: h.type,
            actualAmount: Number(h.actualAmount ?? 0),
            initialAmount: initial,
            note: parsed.cleanNote,
            createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
            updatedAt: h.updatedAt instanceof Date ? h.updatedAt.toISOString() : h.updatedAt,
          };
        }),
      },
    });
  } catch (error: any) {
    console.error("GET /api/balances error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat saldo riil", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, actualAmount, initialAmount, note } = body;

    const normalizedType = String(type).toUpperCase() === "QRIS" ? "QRIS" : "CASH";
    const numericActual = Number(actualAmount ?? 0);
    const numericInitial = Number(initialAmount ?? 0);

    if (isNaN(numericActual) || numericActual < 0) {
      return NextResponse.json(
        { success: false, message: "Nominal saldo harus berupa angka positif atau nol!" },
        { status: 400 }
      );
    }

    let created: any;
    try {
      created = await (prisma as any).balanceAdjustment.create({
        data: {
          type: normalizedType,
          actualAmount: numericActual,
          initialAmount: numericInitial,
          note: note ? String(note).trim() : null,
        },
      });
    } catch (saveErr: any) {
      console.warn("Fallback balanceAdjustment create without initial_amount column:", saveErr.message);
      const augmentedNote = `[INITIAL:${numericInitial}] ${note ? String(note).trim() : ""}`.trim();
      created = await (prisma as any).balanceAdjustment.create({
        data: {
          type: normalizedType,
          actualAmount: numericActual,
          note: augmentedNote,
        },
      });
      created.initialAmount = numericInitial;
    }

    return NextResponse.json({
      success: true,
      message: `Saldo ${normalizedType === "CASH" ? "Tersisa di Toko (Cash)" : "Tersisa di Bank (QRIS)"} berhasil disimpan`,
      data: {
        id: created.id,
        type: created.type,
        actualAmount: Number(created.actualAmount ?? numericActual),
        initialAmount: Number(created.initialAmount ?? numericInitial),
        note: note ? String(note).trim() : null,
        createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : created.createdAt,
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : created.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/balances error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan saldo riil", error: error.message },
      { status: 500 }
    );
  }
}
