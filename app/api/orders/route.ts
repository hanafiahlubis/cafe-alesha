import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentMethod, OrderStatus, CategoryType } from "@prisma/client";

// Helper untuk format tanggal lokal YYYY-MM-DD
function getLocalDateString(dateInput?: Date): string {
  const d = dateInput || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET: Ambil daftar transaksi (mendukung filter tanggal dan status soft-delete)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const statusQuery = searchParams.get("status"); // "COMPLETED", "CANCELLED", or "ALL"

    const whereClause: any = {};

    // 1. Filter Tanggal
    if (dateQuery) {
      const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // 2. Filter Soft Delete: Default hanya ambil transaksi aktif (COMPLETED)
    if (statusQuery === "ALL") {
      // Tampilkan semua status
    } else if (statusQuery === "CANCELLED") {
      whereClause.status = OrderStatus.CANCELLED;
    } else {
      whereClause.status = OrderStatus.COMPLETED;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      queueNumber: o.queueNumber,
      items: o.items.map((it) => ({
        menuItem: {
          id: it.menuId,
          name: it.menuName,
          category: "Minuman" as const,
          price: Number(it.price),
          description: "",
          status: "Tersedia" as const,
        },
        quantity: it.quantity,
      })),
      subtotal: Number(o.totalAmount),
      tax: 0,
      total: Number(o.totalAmount),
      paymentMethod: (o.paymentMethod === PaymentMethod.QRIS ? "QRIS" : "Cash") as "Cash" | "QRIS",
      cashReceived: o.cashReceived ? Number(o.cashReceived) : undefined,
      changeAmount: o.changeAmount ? Number(o.changeAmount) : undefined,
      status: o.status === OrderStatus.CANCELLED ? ("CANCELLED" as const) : ("COMPLETED" as const),
      timestamp: o.createdAt.toISOString(),
      date: o.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data transaksi", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Simpan transaksi baru & Reset Antrean Harian ke angka 1 setiap hari baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, items, total, paymentMethod, cashReceived, changeAmount } = body;

    const todayDateStr = getLocalDateString();

    // 1. Cari antrean terakhir yang terdaftar pada HARI INI di tabel Queue
    const lastQueueToday = await prisma.queue.findFirst({
      where: { date: todayDateStr },
      orderBy: { queueNumber: "desc" },
    });

    // Otomatis kembali ke 1 jika hari baru, atau +1 jika sudah ada antrean hari ini
    const nextQueueNumber = (lastQueueToday?.queueNumber || 0) + 1;
    const assignedQueue = `#${nextQueueNumber.toString().padStart(3, "0")}`;

    // 2. Simpan order transaksi kasir (status default: COMPLETED)
    // SINKRONISASI ID: Jika frontend mengirim ID (misal TX-XXXXXX), gunakan ID tersebut agar cocok saat dihapus
    const newOrder = await prisma.order.create({
      data: {
        ...(id && String(id).trim() ? { id: String(id).trim() } : {}),
        queueNumber: assignedQueue,
        totalAmount: total,
        paymentMethod: paymentMethod === "QRIS" ? PaymentMethod.QRIS : PaymentMethod.CASH,
        cashReceived: cashReceived ?? null,
        changeAmount: changeAmount ?? null,
        status: OrderStatus.COMPLETED,
        items: {
          create: await Promise.all(
            (items || []).map(async (ci: any) => {
              let menuId = ci.menuItem.id;
              let exists = await prisma.menu.findUnique({ where: { id: menuId } });
              if (!exists) {
                const defaultCat = await prisma.category.upsert({
                  where: { slug: "minuman" },
                  update: {},
                  create: { name: "Minuman", slug: "minuman", type: CategoryType.MINUMAN },
                });
                const createdMenu = await prisma.menu.create({
                  data: {
                    name: ci.menuItem.name,
                    categoryId: defaultCat.id,
                    price: ci.menuItem.price,
                  },
                });
                menuId = createdMenu.id;
              }
              return {
                menuId: menuId,
                menuName: ci.menuItem.name,
                price: ci.menuItem.price,
                quantity: ci.quantity,
                subtotal: ci.menuItem.price * ci.quantity,
              };
            })
          ),
        },
      },
      include: { items: true },
    });

    // 3. Simpan entri antrean ke tabel Queue untuk pelacakan historis antrean per hari
    await prisma.queue.create({
      data: {
        queueNumber: nextQueueNumber,
        formatted: assignedQueue,
        date: todayDateStr,
        orderId: newOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi dan nomor antrean berhasil disimpan ke NeonDB",
      data: newOrder,
    });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mencatat transaksi", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: SOFT DELETE transaksi penjualan (Status diubah ke CANCELLED, data tabel TIDAK DIHAPUS)
// Mendukung pencocokan ID langsung, suffix TX-XXXXXX, amount, dan queueNumber agar tidak pernah meleset
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    const amountParam = searchParams.get("amount");
    const queueParam = searchParams.get("queue");
    const isAll = searchParams.get("all") === "true";
    let ids: string[] = [];

    try {
      const body = await req.json();
      if (body.id) id = body.id;
      if (Array.isArray(body.ids)) ids = body.ids;
    } catch (e) {
      // Body opsional
    }

    if (id && !ids.includes(id)) {
      ids.push(id);
    }

    // 1. KASUS HAPUS SEMUA (ALL ACTIVE)
    if (isAll) {
      const res = await prisma.order.updateMany({
        where: { status: OrderStatus.COMPLETED },
        data: { status: OrderStatus.CANCELLED },
      });
      return NextResponse.json({
        success: true,
        message: `${res.count} transaksi berhasil di-soft delete`,
        deletedCount: res.count,
      });
    }

    // 2. KASUS SPESIFIK BERDASARKAN ID
    let targetOrders = await prisma.order.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    let foundIds = targetOrders.map((o) => o.id);

    // 3. FUZZY MATCHING JIKA ID BELUM COCOK (Misal client mengirim 'TX-123456' sementara DB menyimpan cuid)
    const missingIds = ids.filter((reqId) => !foundIds.includes(reqId));
    if (missingIds.length > 0) {
      for (const missingId of missingIds) {
        const cleanSuffix = missingId.replace(/^TX-/i, "").trim();
        if (cleanSuffix.length >= 4) {
          const suffixMatches = await prisma.order.findMany({
            where: {
              OR: [
                { id: { endsWith: cleanSuffix } },
                { id: { endsWith: cleanSuffix.toLowerCase() } },
                { id: { endsWith: cleanSuffix.toUpperCase() } },
              ],
            },
            select: { id: true },
          });
          suffixMatches.forEach((sm) => {
            if (!foundIds.includes(sm.id)) foundIds.push(sm.id);
          });
        }
      }
    }

    // 4. FALLBACK JIKA MASIH BELUM COCOK: Cari berdasarkan antrean atau nominal pada status COMPLETED
    if (foundIds.length === 0 && (queueParam || amountParam)) {
      const fallbackWhere: any = { status: OrderStatus.COMPLETED };
      if (queueParam) fallbackWhere.queueNumber = queueParam;
      if (amountParam && !isNaN(Number(amountParam))) {
        fallbackWhere.totalAmount = Number(amountParam);
      }

      const fallbackMatches = await prisma.order.findMany({
        where: fallbackWhere,
        select: { id: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      });
      fallbackMatches.forEach((fm) => {
        if (!foundIds.includes(fm.id)) foundIds.push(fm.id);
      });
    }

    if (foundIds.length === 0) {
      // Cek apakah ada order dengan amount yang diberikan (misal uji coba 2000)
      if (amountParam && !isNaN(Number(amountParam))) {
        const amtMatches = await prisma.order.findMany({
          where: { totalAmount: Number(amountParam), status: OrderStatus.COMPLETED },
          select: { id: true },
        });
        foundIds = amtMatches.map((m) => m.id);
      }
    }

    if (foundIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "ID transaksi tidak ditemukan di database" },
        { status: 404 }
      );
    }

    // SOFT DELETE: Update status menjadi CANCELLED
    // Baris pesanan (Order) dan item pesanan (OrderItem) TETAP UTUH di database
    const result = await prisma.order.updateMany({
      where: { id: { in: foundIds } },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} transaksi berhasil di-soft delete (status diubah menjadi CANCELLED)`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("DELETE /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal melakukan soft delete transaksi", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Pulihkan (Restore) transaksi yang di-soft delete kembali ke status COMPLETED
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    const targetIds: string[] = [];
    if (id) targetIds.push(id);
    if (Array.isArray(ids)) {
      ids.forEach((i: string) => {
        if (!targetIds.includes(i)) targetIds.push(i);
      });
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "ID transaksi yang ingin dipulihkan wajib disertakan" },
        { status: 400 }
      );
    }

    const result = await prisma.order.updateMany({
      where: { id: { in: targetIds } },
      data: {
        status: OrderStatus.COMPLETED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} transaksi berhasil dipulihkan ke status COMPLETED`,
      restoredCount: result.count,
    });
  } catch (error: any) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memulihkan transaksi", error: error.message },
      { status: 500 }
    );
  }
}