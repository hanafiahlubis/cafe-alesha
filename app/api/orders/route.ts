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

// GET: Ambil daftar transaksi (mendukung filter tanggal tunggal / rentang tanggal)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    const whereClause: any = {};

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
    const { items, total, paymentMethod, cashReceived, changeAmount } = body;

    const todayDateStr = getLocalDateString();

    // 1. Cari antrean terakhir yang terdaftar pada HARI INI di tabel Queue
    const lastQueueToday = await prisma.queue.findFirst({
      where: { date: todayDateStr },
      orderBy: { queueNumber: "desc" },
    });

    // Otomatis kembali ke 1 jika hari baru, atau +1 jika sudah ada antrean hari ini
    const nextQueueNumber = (lastQueueToday?.queueNumber || 0) + 1;
    const assignedQueue = `#${nextQueueNumber.toString().padStart(3, "0")}`;

    // 2. Simpan order transaksi kasir
    const newOrder = await prisma.order.create({
      data: {
        queueNumber: assignedQueue,
        totalAmount: total,
        paymentMethod: paymentMethod === "QRIS" ? PaymentMethod.QRIS : PaymentMethod.CASH,
        cashReceived: cashReceived ?? null,
        changeAmount: changeAmount ?? null,
        status: OrderStatus.COMPLETED,
        items: {
          create: await Promise.all(
            items.map(async (ci: any) => {
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