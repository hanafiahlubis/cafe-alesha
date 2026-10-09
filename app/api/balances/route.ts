import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const latestCash = await (prisma as any).balanceAdjustment.findFirst({
      where: { type: "CASH" },
      orderBy: { updatedAt: "desc" },
    });

    const latestQris = await (prisma as any).balanceAdjustment.findFirst({
      where: { type: "QRIS" },
      orderBy: { updatedAt: "desc" },
    });

    const recentHistory = await (prisma as any).balanceAdjustment.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        cash: latestCash
          ? {
              id: latestCash.id,
              type: "CASH",
              actualAmount: Number(latestCash.actualAmount),
              note: latestCash.note || null,
              createdAt: latestCash.createdAt instanceof Date ? latestCash.createdAt.toISOString() : latestCash.createdAt,
              updatedAt: latestCash.updatedAt instanceof Date ? latestCash.updatedAt.toISOString() : latestCash.updatedAt,
            }
          : null,
        qris: latestQris
          ? {
              id: latestQris.id,
              type: "QRIS",
              actualAmount: Number(latestQris.actualAmount),
              note: latestQris.note || null,
              createdAt: latestQris.createdAt instanceof Date ? latestQris.createdAt.toISOString() : latestQris.createdAt,
              updatedAt: latestQris.updatedAt instanceof Date ? latestQris.updatedAt.toISOString() : latestQris.updatedAt,
            }
          : null,
        history: recentHistory.map((h: any) => ({
          id: h.id,
          type: h.type,
          actualAmount: Number(h.actualAmount),
          note: h.note || null,
          createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
          updatedAt: h.updatedAt instanceof Date ? h.updatedAt.toISOString() : h.updatedAt,
        })),
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
    const { type, actualAmount, note } = body;

    const normalizedType = String(type).toUpperCase() === "QRIS" ? "QRIS" : "CASH";
    const numericAmount = Number(actualAmount);

    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Nominal saldo riil harus berupa angka positif atau nol!" },
        { status: 400 }
      );
    }

    const created = await (prisma as any).balanceAdjustment.create({
      data: {
        type: normalizedType,
        actualAmount: numericAmount,
        note: note ? String(note).trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sisa saldo ${normalizedType === "CASH" ? "Tersisa di Toko (Cash)" : "Tersisa di Bank (QRIS)"} berhasil disimpan`,
      data: {
        id: created.id,
        type: created.type,
        actualAmount: Number(created.actualAmount),
        note: created.note || null,
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
