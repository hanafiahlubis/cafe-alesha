import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    console.error("DELETE /api/saved-orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pesanan tersimpan", error: error.message },
      { status: 500 }
    );
  }
}
