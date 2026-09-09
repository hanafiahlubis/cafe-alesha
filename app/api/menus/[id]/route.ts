import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CategoryType, MenuStatus } from "@prisma/client";

function toPrismaCategory(cat: string): CategoryType {
  const c = (cat || "").toLowerCase();
  if (c.includes("berat")) return CategoryType.MAKANAN_BERAT;
  if (c.includes("ringan")) return CategoryType.MAKANAN_RINGAN;
  return CategoryType.MINUMAN;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, category, price, description, status, image } = body;

    let categoryId = undefined;
    if (category) {
      const catType = toPrismaCategory(category);
      const cat = await prisma.category.upsert({
        where: { slug: catType.toLowerCase() },
        update: {},
        create: {
          name: category,
          slug: catType.toLowerCase(),
          type: catType,
        },
      });
      categoryId = cat.id;
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
        ...(status && {
          status: status === "Habis" ? MenuStatus.HABIS : MenuStatus.TERSEDIA,
        }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/menus/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal update menu", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Menu berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE /api/menus/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus menu", error: error.message },
      { status: 500 }
    );
  }
}
