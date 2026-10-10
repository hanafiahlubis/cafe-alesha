import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper untuk parse metadata pembayaran jika tersimpan di notes (legacy fallback)
function parseExpensePaymentInfo(item: any): {
  paymentMethod: "CASH" | "QRIS" | "SPLIT";
  cashAmount: number;
  qrisAmount: number;
  cleanNotes: string | null;
} {
  const totalAmt = Number(item.amount ?? 0);
  let method: "CASH" | "QRIS" | "SPLIT" = "CASH";
  let cashAmt = 0;
  let qrisAmt = 0;
  let notesStr = item.notes ? String(item.notes) : null;

  // Jika kolom database sudah ada
  if (item.paymentMethod) {
    const pm = String(item.paymentMethod).toUpperCase();
    if (pm === "QRIS") method = "QRIS";
    else if (pm === "SPLIT") method = "SPLIT";
    else method = "CASH";

    if (method === "CASH") {
      cashAmt = item.cashAmount != null && Number(item.cashAmount) > 0 ? Number(item.cashAmount) : totalAmt;
      qrisAmt = 0;
    } else if (method === "QRIS") {
      cashAmt = 0;
      qrisAmt = item.qrisAmount != null && Number(item.qrisAmount) > 0 ? Number(item.qrisAmount) : totalAmt;
    } else {
      cashAmt = Number(item.cashAmount ?? 0);
      qrisAmt = Number(item.qrisAmount ?? 0);
    }
    return { paymentMethod: method, cashAmount: cashAmt, qrisAmount: qrisAmt, cleanNotes: notesStr };
  }

  // Cek apakah ada metadata tag di notes: [METODE:SPLIT|CASH:1000|QRIS:2000] atau [METODE:QRIS]
  if (notesStr && notesStr.includes("[METODE:")) {
    const splitMatch = notesStr.match(/\[METODE:SPLIT\|CASH:([0-9.]+)\|QRIS:([0-9.]+)\]/);
    if (splitMatch) {
      method = "SPLIT";
      cashAmt = parseFloat(splitMatch[1]) || 0;
      qrisAmt = parseFloat(splitMatch[2]) || 0;
      notesStr = notesStr.replace(/\[METODE:SPLIT\|CASH:[0-9.]+\|QRIS:[0-9.]+\]\s*/, "").trim();
      return { paymentMethod: method, cashAmount: cashAmt, qrisAmount: qrisAmt, cleanNotes: notesStr || null };
    }

    const qrisMatch = notesStr.match(/\[METODE:QRIS\]/);
    if (qrisMatch) {
      method = "QRIS";
      qrisAmt = totalAmt;
      notesStr = notesStr.replace(/\[METODE:QRIS\]\s*/, "").trim();
      return { paymentMethod: method, cashAmount: 0, qrisAmount: qrisAmt, cleanNotes: notesStr || null };
    }

    const cashMatch = notesStr.match(/\[METODE:CASH\]/);
    if (cashMatch) {
      method = "CASH";
      cashAmt = totalAmt;
      notesStr = notesStr.replace(/\[METODE:CASH\]\s*/, "").trim();
      return { paymentMethod: method, cashAmount: cashAmt, qrisAmount: 0, cleanNotes: notesStr || null };
    }
  }

  // Default fallback: CASH
  return {
    paymentMethod: "CASH",
    cashAmount: totalAmt,
    qrisAmount: 0,
    cleanNotes: notesStr,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const where = Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {};

    // 1. Ambil Pengeluaran
    let rawExpenses: any[] = [];
    try {
      rawExpenses = await (prisma as any).expense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
      });
    } catch (expErr: any) {
      console.warn("Fallback finding expenses without optional columns:", expErr.message);
      rawExpenses = await (prisma as any).expense.findMany({
        where,
        select: {
          id: true,
          title: true,
          amount: true,
          category: true,
          notes: true,
          expenseDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { expenseDate: "desc" },
      });
    }

    let totalCashExpense = 0;
    let totalQrisExpense = 0;

    const formattedExpenses = rawExpenses.map((e) => {
      const parsed = parseExpensePaymentInfo(e);
      totalCashExpense += parsed.cashAmount;
      totalQrisExpense += parsed.qrisAmount;

      return {
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        category: e.category || "Operasional",
        paymentMethod: parsed.paymentMethod,
        cashAmount: parsed.cashAmount,
        qrisAmount: parsed.qrisAmount,
        notes: parsed.cleanNotes,
        expenseDate: e.expenseDate instanceof Date ? e.expenseDate.toISOString() : e.expenseDate,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
      };
    });

    const totalExpense = totalCashExpense + totalQrisExpense;

    // 2. Ambil Omzet Penjualan pada rentang tanggal yang sama (hanya transaksi aktif / COMPLETED)
    const orderWhere: any = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    orderWhere.status = "COMPLETED";
    const orders = await (prisma as any).order.findMany({
      where: orderWhere,
      select: { totalAmount: true, paymentMethod: true, status: true },
    });

    let totalCash = 0;
    let totalQris = 0;
    orders.forEach((o: any) => {
      const amt = Number(o.totalAmount);
      if (String(o.paymentMethod).toUpperCase() === "CASH") totalCash += amt;
      else totalQris += amt;
    });

    const totalRevenue = totalCash + totalQris;
    const netProfit = totalRevenue - totalExpense; // Rumus: (Cash + QRIS) - Total Pengeluaran

    // 3. Ambil data penyesuaian saldo riil kasir & bank
    let balances: any = { cash: null, qris: null };
    try {
      const latestCash = await (prisma as any).balanceAdjustment.findFirst({
        where: { type: "CASH" },
        orderBy: { updatedAt: "desc" },
      });
      const latestQris = await (prisma as any).balanceAdjustment.findFirst({
        where: { type: "QRIS" },
        orderBy: { updatedAt: "desc" },
      });

      const parseInitial = (item: any) => {
        if (!item) return 0;
        if (item.initialAmount != null) return Number(item.initialAmount);
        const match = (item.note || "").match(/\[INITIAL:([0-9.]+)\]/);
        return match ? parseFloat(match[1]) || 0 : 0;
      };

      const initialCash = latestCash ? parseInitial(latestCash) : 0;
      const initialQris = latestQris ? parseInitial(latestQris) : 0;

      // Kalkulasi Saldo Akhir berdasarkan rumus permintaan user:
      // Saldo Akhir Cash = Saldo Awal Cash + Total Penjualan CASH - Total Pengeluaran dari CASH
      // Saldo Akhir QRIS = Saldo Awal QRIS + Total Penjualan QRIS - Total Pengeluaran dari QRIS
      const calculatedEndingCash = initialCash + totalCash - totalCashExpense;
      const calculatedEndingQris = initialQris + totalQris - totalQrisExpense;

      balances = {
        cash: latestCash
          ? {
              id: latestCash.id,
              type: "CASH",
              actualAmount: Number(latestCash.actualAmount ?? 0),
              initialAmount: initialCash,
              calculatedEndingBalance: calculatedEndingCash,
              note: latestCash.note ? latestCash.note.replace(/\[INITIAL:[0-9.]+\]\s*/, "").trim() || null : null,
              updatedAt: latestCash.updatedAt instanceof Date ? latestCash.updatedAt.toISOString() : latestCash.updatedAt,
            }
          : null,
        qris: latestQris
          ? {
              id: latestQris.id,
              type: "QRIS",
              actualAmount: Number(latestQris.actualAmount ?? 0),
              initialAmount: initialQris,
              calculatedEndingBalance: calculatedEndingQris,
              note: latestQris.note ? latestQris.note.replace(/\[INITIAL:[0-9.]+\]\s*/, "").trim() || null : null,
              updatedAt: latestQris.updatedAt instanceof Date ? latestQris.updatedAt.toISOString() : latestQris.updatedAt,
            }
          : null,
      };
    } catch (bErr: any) {
      console.warn("balances fetch warning in expenses:", bErr.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        expenses: formattedExpenses,
        summary: {
          totalRevenue,
          totalCash,
          totalQris,
          totalExpense,
          totalCashExpense,
          totalQrisExpense,
          netProfit,
        },
        balances,
      },
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, category, paymentMethod, cashAmount, qrisAmount, notes, expenseDate } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ success: false, message: "Nama biaya wajib diisi" }, { status: 400 });
    }

    const normMethod = (paymentMethod || "CASH").toUpperCase();
    let finalAmount = Number(amount ?? 0);
    let finalCashAmt = Number(cashAmount ?? 0);
    let finalQrisAmt = Number(qrisAmount ?? 0);

    if (normMethod === "CASH") {
      if (finalAmount <= 0) {
        return NextResponse.json({ success: false, message: "Nominal pengeluaran tunai (Cash) wajib diisi" }, { status: 400 });
      }
      finalCashAmt = finalAmount;
      finalQrisAmt = 0;
    } else if (normMethod === "QRIS") {
      if (finalAmount <= 0) {
        return NextResponse.json({ success: false, message: "Nominal pengeluaran QRIS / Bank wajib diisi" }, { status: 400 });
      }
      finalCashAmt = 0;
      finalQrisAmt = finalAmount;
    } else if (normMethod === "SPLIT") {
      if (finalCashAmt <= 0 && finalQrisAmt <= 0) {
        return NextResponse.json({ success: false, message: "Nominal Cash dan QRIS wajib diisi untuk metode Split" }, { status: 400 });
      }
      finalAmount = finalCashAmt + finalQrisAmt;
    }

    const targetDate = expenseDate ? new Date(expenseDate) : new Date();
    const cleanNotes = notes ? String(notes).trim() : null;

    let created: any;
    try {
      // Coba simpan dengan kolom paymentMethod, cashAmount, qrisAmount
      created = await (prisma as any).expense.create({
        data: {
          title: String(title).trim(),
          amount: finalAmount,
          category: category || "Operasional",
          paymentMethod: normMethod,
          cashAmount: finalCashAmt,
          qrisAmount: finalQrisAmt,
          notes: cleanNotes,
          expenseDate: targetDate,
        },
      });
    } catch (saveErr: any) {
      console.warn("Fallback saving expense without paymentMethod column:", saveErr.message);
      // Simpan metadata ke notes: [METODE:SPLIT|CASH:xx|QRIS:yy] atau [METODE:QRIS]
      let tag = `[METODE:${normMethod}]`;
      if (normMethod === "SPLIT") {
        tag = `[METODE:SPLIT|CASH:${finalCashAmt}|QRIS:${finalQrisAmt}]`;
      }
      const combinedNotes = `${tag} ${cleanNotes || ""}`.trim();

      created = await (prisma as any).expense.create({
        data: {
          title: String(title).trim(),
          amount: finalAmount,
          category: category || "Operasional",
          notes: combinedNotes,
          expenseDate: targetDate,
        },
      });
      created.paymentMethod = normMethod;
      created.cashAmount = finalCashAmt;
      created.qrisAmount = finalQrisAmt;
    }

    return NextResponse.json({
      success: true,
      message: "Pengeluaran berhasil dicatat!",
      data: {
        id: created.id,
        title: created.title,
        amount: Number(created.amount),
        category: created.category,
        paymentMethod: normMethod,
        cashAmount: finalCashAmt,
        qrisAmount: finalQrisAmt,
        notes: cleanNotes,
        expenseDate: created.expenseDate instanceof Date ? created.expenseDate.toISOString() : created.expenseDate,
      },
    });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Pengeluaran (Satuan atau Hapus Semua) & Simpan ke Audit Log Riwayat Dihapus
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isAll = searchParams.get("all") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let targets: any[] = [];

    if (id) {
      const exp = await (prisma as any).expense.findUnique({
        where: { id },
      });
      if (exp) targets = [exp];
    } else if (isAll) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
      const where = Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {};
      targets = await (prisma as any).expense.findMany({ where });
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada catatan pengeluaran yang ditemukan untuk dihapus" },
        { status: 404 }
      );
    }

    // 1. Simpan ke tabel history_pengeluaran_dihapus (Audit Log)
    for (const item of targets) {
      try {
        const parsed = parseExpensePaymentInfo(item);
        await (prisma as any).deletedExpense.create({
          data: {
            expenseId: item.id,
            title: item.title,
            amount: Number(item.amount),
            category: item.category || "Operasional",
            paymentMethod: parsed.paymentMethod,
            cashAmount: parsed.cashAmount,
            qrisAmount: parsed.qrisAmount,
            notes: parsed.cleanNotes || item.notes || null,
            expenseDate: item.expenseDate,
            deletedAt: new Date(),
          },
        });
      } catch (logErr: any) {
        console.warn("Gagal menyimpan ke history_pengeluaran_dihapus:", logErr.message);
      }
    }

    // 2. Hapus data dari tabel Expense
    const targetIds = targets.map((t) => t.id);
    await (prisma as any).expense.deleteMany({
      where: { id: { in: targetIds } },
    });

    return NextResponse.json({
      success: true,
      message: `${targets.length} catatan pengeluaran berhasil dihapus dan diarsipkan ke riwayat audit! Saldo terkait otomatis dikembalikan (revert).`,
      count: targets.length,
    });
  } catch (error: any) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}