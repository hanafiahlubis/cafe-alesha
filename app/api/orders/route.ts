import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentMethod, OrderStatus, CategoryType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD

    const whereClause: any = {};
    if (dateQuery) {
      const startOfDay = new Date(`${dateQuery}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateQuery}T23:59:59.999Z`);
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, total, paymentMethod, cashReceived, changeAmount, queueNumber } = body;

    let assignedQueue = queueNumber;
    if (!assignedQueue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const countToday = await prisma.order.count({
        where: { createdAt: { gte: today } },
      });
      assignedQueue = `#${(countToday + 1).toString().padStart(2, "0")}`;
    }

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

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil disimpan ke NeonDB",
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
