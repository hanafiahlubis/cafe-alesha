import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate"); // YYYY-MM-DD
        const endDate = searchParams.get("endDate"); // YYYY-MM-DD

        const dateFilter: any = {};
        if (startDate) {
            dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const where = Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {};

        // 1. Ambil Pengeluaran
        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { expenseDate: "desc" },
        });

        const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

        // 2. Ambil Omzet Penjualan pada rentang tanggal yang sama
        const orderWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
        const orders = await prisma.order.findMany({
            where: orderWhere,
            select: { totalAmount: true, paymentMethod: true },
        });

        let totalCash = 0;
        let totalQris = 0;
        orders.forEach((o) => {
            const amt = Number(o.totalAmount);
            if (o.paymentMethod === "CASH") totalCash += amt;
            else totalQris += amt;
        });

        const totalRevenue = totalCash + totalQris;
        const netProfit = totalRevenue - totalExpense; // Rumus: (Cash + QRIS) - Pengeluaran

        return NextResponse.json({
            success: true,
            data: {
                expenses: expenses.map((e) => ({
                    ...e,
                    amount: Number(e.amount),
                    expenseDate: e.expenseDate.toISOString(),
                })),
                summary: {
                    totalRevenue,
                    totalCash,
                    totalQris,
                    totalExpense,
                    netProfit,
                },
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, amount, category, notes, expenseDate } = body;

        if (!title || !amount) {
            return NextResponse.json({ success: false, message: "Judul dan nominal wajib diisi" }, { status: 400 });
        }

        const newExpense = await prisma.expense.create({
            data: {
                title,
                amount: Number(amount),
                category: category || "Operasional",
                notes: notes || null,
                expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
            },
        });

        return NextResponse.json({ success: true, data: newExpense });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}