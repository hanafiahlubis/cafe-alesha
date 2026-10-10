import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Ambil riwayat catatan pengeluaran yang dihapus (Audit Log)
export async function GET() {
  try {
    let deletedList: any[] = [];
    try {
      deletedList = await (prisma as any).deletedExpense.findMany({
        orderBy: { deletedAt: "desc" },
        take: 100,
      });
    } catch (dbErr: any) {
      console.warn("history_pengeluaran_dihapus query error:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      data: deletedList.map((item: any) => ({
        id: item.id,
        expenseId: item.expenseId || null,
        title: item.title,
        amount: Number(item.amount),
        category: item.category,
        paymentMethod: item.paymentMethod || "CASH",
        cashAmount: Number(item.cashAmount ?? 0),
        qrisAmount: Number(item.qrisAmount ?? 0),
        notes: item.notes || null,
        expenseDate: item.expenseDate instanceof Date ? item.expenseDate.toISOString() : item.expenseDate,
        deletedAt: item.deletedAt instanceof Date ? item.deletedAt.toISOString() : item.deletedAt,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/expenses/deleted error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST: Pulihkan (Restore) pengeluaran yang dihapus kembali ke tabel Expense aktif
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID catatan yang dihapus wajib disertakan" },
        { status: 400 }
      );
    }

    const deletedItem = await (prisma as any).deletedExpense.findUnique({
      where: { id },
    });

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, message: "Catatan riwayat hapus tidak ditemukan" },
        { status: 404 }
      );
    }

    // 1. Re-insert ke Expense aktif
    let restored: any;
    try {
      restored = await (prisma as any).expense.create({
        data: {
          title: deletedItem.title,
          amount: Number(deletedItem.amount),
          category: deletedItem.category,
          paymentMethod: deletedItem.paymentMethod,
          cashAmount: Number(deletedItem.cashAmount ?? 0),
          qrisAmount: Number(deletedItem.qrisAmount ?? 0),
          notes: deletedItem.notes,
          expenseDate: deletedItem.expenseDate,
        },
      });
    } catch (reErr: any) {
      console.warn("Fallback restoring expense without paymentMethod column:", reErr.message);
      let tag = `[METODE:${deletedItem.paymentMethod}]`;
      if (deletedItem.paymentMethod === "SPLIT") {
        tag = `[METODE:SPLIT|CASH:${deletedItem.cashAmount}|QRIS:${deletedItem.qrisAmount}]`;
      }
      const combinedNotes = `${tag} ${deletedItem.notes || ""}`.trim();

      restored = await (prisma as any).expense.create({
        data: {
          title: deletedItem.title,
          amount: Number(deletedItem.amount),
          category: deletedItem.category,
          notes: combinedNotes,
          expenseDate: deletedItem.expenseDate,
        },
      });
    }

    // 2. Hapus dari DeletedExpense
    try {
      await (prisma as any).deletedExpense.delete({
        where: { id },
      });
    } catch (delErr: any) {
      console.warn("Failed to remove restored item from DeletedExpense:", delErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Catatan "${deletedItem.title}" berhasil dipulihkan ke pengeluaran aktif! Saldo otomatis terhitung kembali.`,
      data: restored,
    });
  } catch (error: any) {
    console.error("POST /api/expenses/deleted (restore) error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Bersihkan riwayat audit pengeluaran yang dihapus
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isAll = searchParams.get("all") === "true";

    if (id) {
      await (prisma as any).deletedExpense.delete({
        where: { id },
      });
    } else if (isAll) {
      await (prisma as any).deletedExpense.deleteMany({});
    }

    return NextResponse.json({
      success: true,
      message: "Riwayat pengeluaran yang dihapus berhasil dibersihkan",
    });
  } catch (error: any) {
    console.error("DELETE /api/expenses/deleted error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
