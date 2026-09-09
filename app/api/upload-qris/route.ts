import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let qrisDataUrl = "";
    let storeData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      storeData.name = formData.get("name")?.toString();
      storeData.address = formData.get("address")?.toString();
      storeData.phone = formData.get("phone")?.toString();
      storeData.qrisNmid = formData.get("qrisNmid")?.toString();
      storeData.qrisMerchantName = formData.get("qrisMerchantName")?.toString();

      if (!file) {
        return NextResponse.json(
          { success: false, message: "File gambar QRIS wajib diunggah" },
          { status: 400 }
        );
      }

      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: "Ukuran file melebihi batas maksimal 3MB" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || "image/png";
      qrisDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    } else {
      const body = await req.json();
      qrisDataUrl = body.qrisImage;
      storeData = body;
    }

    if (!qrisDataUrl) {
      return NextResponse.json(
        { success: false, message: "Data gambar QRIS tidak ditemukan" },
        { status: 400 }
      );
    }

    let setting = await prisma.storeSetting.findFirst();

    if (setting) {
      setting = await prisma.storeSetting.update({
        where: { id: setting.id },
        data: {
          qrisImageUrl: qrisDataUrl,
          ...(storeData.name && { storeName: storeData.name }),
          ...(storeData.address && { storeAddress: storeData.address }),
          ...(storeData.phone && { storePhone: storeData.phone }),
          ...(storeData.qrisNmid && { qrisNmid: storeData.qrisNmid }),
          ...(storeData.qrisMerchantName && { qrisMerchantName: storeData.qrisMerchantName }),
        },
      });
    } else {
      setting = await prisma.storeSetting.create({
        data: {
          storeName: storeData.name || "CAFE & RESTO BIRU",
          storeAddress: storeData.address || "Jl. Melati No. 12, Jakarta",
          storePhone: storeData.phone || "0812-3456-7890",
          qrisNmid: storeData.qrisNmid || "ID1020030040050",
          qrisMerchantName: storeData.qrisMerchantName || "KASIR CAFE & RESTO BIRU",
          qrisImageUrl: qrisDataUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Gambar QRIS berhasil diunggah & disimpan ke database",
      qrisImageUrl: qrisDataUrl,
      setting,
    });
  } catch (error: any) {
    console.error("POST /api/upload-qris error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah QRIS", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const defaultQris = "/images/qris/qris-bca.svg";
    let setting = await prisma.storeSetting.findFirst();

    if (setting) {
      await prisma.storeSetting.update({
        where: { id: setting.id },
        data: { qrisImageUrl: defaultQris },
      });
    }

    return NextResponse.json({
      success: true,
      message: "QRIS berhasil dikembalikan ke standar BCA bawaan",
      qrisImageUrl: defaultQris,
    });
  } catch (error: any) {
    console.error("DELETE /api/upload-qris error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mereset QRIS", error: error.message },
      { status: 500 }
    );
  }
}
