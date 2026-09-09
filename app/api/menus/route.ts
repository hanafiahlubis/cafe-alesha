import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CategoryType, MenuStatus } from "@prisma/client";

function toPrismaCategory(cat: string): CategoryType {
  const c = (cat || "").toLowerCase();
  if (c.includes("berat")) return CategoryType.MAKANAN_BERAT;
  if (c.includes("ringan")) return CategoryType.MAKANAN_RINGAN;
  return CategoryType.MINUMAN;
}

function toFrontendCategory(cat: CategoryType): "Minuman" | "Makanan Ringan" | "Makanan Berat" {
  switch (cat) {
    case CategoryType.MAKANAN_BERAT:
      return "Makanan Berat";
    case CategoryType.MAKANAN_RINGAN:
      return "Makanan Ringan";
    default:
      return "Minuman";
  }
}

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = menus.map((m) => ({
      id: m.id,
      name: m.name,
      category: toFrontendCategory(m.category.type),
      price: Number(m.price),
      description: m.description || "",
      status: (m.status === MenuStatus.HABIS ? "Habis" : "Tersedia") as "Tersedia" | "Habis",
      image: m.image || undefined,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/menus error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data menu", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, price, description, status, image } = body;

    const prismaCatType = toPrismaCategory(category);
    const catSlug = prismaCatType.toLowerCase();

    const catRecord = await prisma.category.upsert({
      where: { slug: catSlug },
      update: {},
      create: {
        name: toFrontendCategory(prismaCatType),
        slug: catSlug,
        type: prismaCatType,
      },
    });

    const newMenu = await prisma.menu.create({
      data: {
        name,
        categoryId: catRecord.id,
        price: price,
        description: description || "",
        status: status === "Habis" ? MenuStatus.HABIS : MenuStatus.TERSEDIA,
        image: image || null,
      },
      include: { category: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newMenu.id,
        name: newMenu.name,
        category: toFrontendCategory(newMenu.category.type),
        price: Number(newMenu.price),
        description: newMenu.description || "",
        status: (newMenu.status === MenuStatus.HABIS ? "Habis" : "Tersedia") as "Tersedia" | "Habis",
        image: newMenu.image || undefined,
      },
    });
  } catch (error: any) {
    console.error("POST /api/menus error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambah menu", error: error.message },
      { status: 500 }
    );
  }
}
