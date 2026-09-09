import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    let setting = await prisma.storeSetting.findFirst();

    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: {
          storeName: process.env.NEXT_PUBLIC_STORE_NAME || "CAFE & RESTO BIRU",
          storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Jl. Melati No. 12, Jakarta Selatan",
          storePhone: process.env.NEXT_PUBLIC_STORE_PHONE || "0812-3456-7890",
          qrisNmid: process.env.NEXT_PUBLIC_QRIS_NMID || "ID1020030040050",
          qrisMerchantName: process.env.NEXT_PUBLIC_QRIS_MERCHANT_NAME || "KASIR CAFE & RESTO BIRU",
          qrisImageUrl: "/images/qris/qris-bca.svg",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: setting.id,
        name: setting.storeName,
        address: setting.storeAddress || "",
        phone: setting.storePhone || "",
        qrisNmid: setting.qrisNmid || "",
        qrisMerchantName: setting.qrisMerchantName || "",
        qrisImage: setting.qrisImageUrl || "/images/qris/qris-bca.svg",
        isCustomQris: setting.qrisImageUrl !== "/images/qris/qris-bca.svg" && !!setting.qrisImageUrl,
      },
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pengaturan toko", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, phone, qrisNmid, qrisMerchantName, qrisImage } = body;

    let setting = await prisma.storeSetting.findFirst();

    if (setting) {
      setting = await prisma.storeSetting.update({
        where: { id: setting.id },
        data: {
          storeName: name ?? setting.storeName,
          storeAddress: address ?? setting.storeAddress,
          storePhone: phone ?? setting.storePhone,
          qrisNmid: qrisNmid ?? setting.qrisNmid,
          qrisMerchantName: qrisMerchantName ?? setting.qrisMerchantName,
          qrisImageUrl: qrisImage ?? setting.qrisImageUrl,
        },
      });
    } else {
      setting = await prisma.storeSetting.create({
        data: {
          storeName: name || "CAFE & RESTO BIRU",
          storeAddress: address || "",
          storePhone: phone || "",
          qrisNmid: qrisNmid || "ID1020030040050",
          qrisMerchantName: qrisMerchantName || "KASIR CAFE & RESTO BIRU",
          qrisImageUrl: qrisImage || "/images/qris/qris-bca.svg",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan toko berhasil diperbarui di NeonDB",
      data: setting,
    });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengaturan", error: error.message },
      { status: 500 }
    );
  }
}
