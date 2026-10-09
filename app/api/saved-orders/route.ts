import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Mengambil semua daftar pesanan yang disimpan sementara
export async function GET() {
  try {
    const savedOrders = await (prisma as any).savedOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mapped = savedOrders.map((o: any) => ({
      id: o.id,
      orderName: o.orderName,
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      totalPrice: Number(o.totalPrice),
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/saved-orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pesanan tersimpan", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Menyimpan pesanan keranjang baru dengan nama pesanan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, orderName, items, totalPrice } = body;

    if (!orderName || !String(orderName).trim()) {
      return NextResponse.json(
        { success: false, message: "Nama pesanan/pelanggan wajib diisi!" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang belanja tidak boleh kosong!" },
        { status: 400 }
      );
    }

    const calculatedTotal =
      totalPrice !== undefined
        ? Number(totalPrice)
        : items.reduce((sum: number, it: any) => sum + (Number(it.menuItem?.price || 0) * (it.quantity || 1)), 0);

    // Jika id diberikan dan sudah ada, update saja
    if (id) {
      try {
        const existing = await (prisma as any).savedOrder.findUnique({ where: { id } });
        if (existing) {
          const updated = await (prisma as any).savedOrder.update({
            where: { id },
            data: {
              orderName: String(orderName).trim(),
              items: items,
              totalPrice: calculatedTotal,
            },
          });
          return NextResponse.json({
            success: true,
            message: `Pesanan "${updated.orderName}" berhasil diperbarui`,
            data: {
              id: updated.id,
              orderName: updated.orderName,
              items: typeof updated.items === "string" ? JSON.parse(updated.items) : updated.items,
              totalPrice: Number(updated.totalPrice),
              createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
              updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
            },
          });
        }
      } catch (e) {
        // Lanjutkan membuat baru jika gagal cek ID
      }
    }

    const newSaved = await (prisma as any).savedOrder.create({
      data: {
        orderName: String(orderName).trim(),
        items: items,
        totalPrice: calculatedTotal,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pesanan "${newSaved.orderName}" berhasil disimpan`,
      data: {
        id: newSaved.id,
        orderName: newSaved.orderName,
        items: typeof newSaved.items === "string" ? JSON.parse(newSaved.items) : newSaved.items,
        totalPrice: Number(newSaved.totalPrice),
        createdAt: newSaved.createdAt instanceof Date ? newSaved.createdAt.toISOString() : newSaved.createdAt,
        updatedAt: newSaved.updatedAt instanceof Date ? newSaved.updatedAt.toISOString() : newSaved.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/saved-orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan pesanan", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Memperbarui pesanan tersimpan yang sudah ada (tambah menu / ganti kuantitas)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, orderName, items, totalPrice } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID pesanan tersimpan wajib disertakan untuk pembaruan" },
        { status: 400 }
      );
    }

    if (!orderName || !String(orderName).trim()) {
      return NextResponse.json(
        { success: false, message: "Nama pesanan/pelanggan wajib diisi!" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang belanja tidak boleh kosong!" },
        { status: 400 }
      );
    }

    const calculatedTotal =
      totalPrice !== undefined
        ? Number(totalPrice)
        : items.reduce((sum: number, it: any) => sum + (Number(it.menuItem?.price || 0) * (it.quantity || 1)), 0);

    const updated = await (prisma as any).savedOrder.update({
      where: { id },
      data: {
        orderName: String(orderName).trim(),
        items: items,
        totalPrice: calculatedTotal,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pesanan "${updated.orderName}" berhasil diperbarui`,
      data: {
        id: updated.id,
        orderName: updated.orderName,
        items: typeof updated.items === "string" ? JSON.parse(updated.items) : updated.items,
        totalPrice: Number(updated.totalPrice),
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/saved-orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pesanan tersimpan", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus pesanan tersimpan berdasarkan query param ?id=... atau json body { id }
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID pesanan tersimpan wajib disertakan" },
        { status: 400 }
      );
    }

    await (prisma as any).savedOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Pesanan tersimpan berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/saved-orders error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pesanan tersimpan", error: error.message },
      { status: 500 }
    );
  }
}
