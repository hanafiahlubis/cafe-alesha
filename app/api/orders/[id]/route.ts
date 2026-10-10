import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID transaksi wajib disertakan" },
        { status: 400 }
      );
    }

    // SOFT DELETE: Update status transaksi menjadi CANCELLED
    // Baris pesanan dan detail item tetap aman dan utuh di database
    await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil di-soft delete (status diubah menjadi CANCELLED)",
    });
  } catch (error: any) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal melakukan soft delete transaksi", error: error.message },
      { status: 500 }
    );
  }
}
