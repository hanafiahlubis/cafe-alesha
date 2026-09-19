"use client";

import React, { useEffect, useState } from "react";
import { usePOS } from "@/context/POSContext";
import { Transaction } from "@/types/pos";
import { bluetoothPrinter } from "@/lib/bluetoothPrinter";

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
}) => {
  const { storeInfo } = usePOS();
  const [isPrintingBt, setIsPrintingBt] = useState<boolean>(false);
  const [btStatus, setBtStatus] = useState<string>("");

  // Format Rupiah
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Format Tanggal & Waktu
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // FUNGSI CETAK TERISOLASI (PASTI 1 HALAMAN & ANTI KOSONG)
  const handlePrintClean = () => {
    const printContent = document.getElementById("receipt-print-area");
    if (!printContent) return;

    // Buat iframe tersembunyi agar tidak terpengaruh CSS halaman kasir
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk - ${transaction?.queueNumber || "Pesanan"}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 6px;
              width: 48mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .extra-bold { font-weight: 900; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .queue-box {
              border: 1px dashed #000;
              padding: 6px 2px;
              margin: 5px 0;
              text-align: center;
            }
            .queue-num {
              font-size: 24px;
              font-weight: 900;
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="bold" style="font-size: 13px; text-transform: uppercase;">${storeInfo.name}</div>
            <div>${storeInfo.address || ""}</div>
            <div>Telp: ${storeInfo.phone || ""}</div>
            <div class="line"></div>

            <div class="queue-box">
              <div class="bold">NOMOR ANTREAN</div>
              <div class="queue-num">${transaction?.queueNumber}</div>
              <div style="font-size: 9px;">(Silakan Menunggu Pesanan)</div>
            </div>

            <div class="line"></div>
            <div class="row">
              <span>No: ${transaction?.id}</span>
              <span>${transaction ? formatDate(transaction.timestamp) : ""}</span>
            </div>
            <div class="row">
              <span>Kasir: Utama</span>
              <span>Metode: ${transaction?.paymentMethod}</span>
            </div>
            <div class="line"></div>
          </div>

          <div style="margin: 4px 0;">
            ${(transaction?.items || [])
        .map(
          (item) => `
                <div style="margin-bottom: 3px;">
                  <div class="bold">${item.menuItem.name}</div>
                  <div class="row" style="font-size: 10px;">
                    <span>${item.quantity} x${formatIDR(item.menuItem.price)}</span>
                    <span class="bold">${formatIDR(item.menuItem.price * item.quantity)}</span>
                  </div>
                </div>
              `
        )
        .join("")}
          </div>

          <div class="line"></div>
          <div class="row">
            <span>Subtotal:</span>
            <span>${transaction ? formatIDR(transaction.subtotal) : 0}</span>
          </div>
          <div class="row bold" style="font-size: 12px; margin-top: 2px;">
            <span>TOTAL:</span>
            <span>${transaction ? formatIDR(transaction.total) : 0}</span>
          </div>

          ${transaction?.paymentMethod === "Cash"
        ? `
              <div class="row" style="font-size: 10px; margin-top: 2px;">
                <span>Tunai:</span>
                <span>${formatIDR(transaction.cashReceived || transaction.total)}</span>
              </div>
              <div class="row bold" style="font-size: 11px;">
                <span>Kembalian:</span>
                <span>${formatIDR(transaction.changeAmount || 0)}</span>
              </div>
            `
        : `
              <div class="row bold" style="font-size: 11px; margin-top: 2px;">
                <span>Pembayaran:</span>
                <span>LUNAS (QRIS)</span>
              </div>
            `
      }

          <div class="line"></div>
          <div class="text-center" style="font-size: 9px; margin-top: 6px;">
            <div class="bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
            <div>Ambil pesanan #${transaction?.queueNumber.replace("#", "")}</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Jalankan cetak setelah iframe siap
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Bersihkan elemen iframe setelah dialog cetak selesai
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 250);
  };

  // Cetak ke Bluetooth RPP02N
  const handlePrintBluetooth = async () => {
    setIsPrintingBt(true);
    setBtStatus("Menghubungkan ke Bluetooth RPP02N...");
    try {
      const success = await bluetoothPrinter.printReceipt(transaction, storeInfo);
      if (success) {
        setBtStatus("Struk berhasil dicetak ke RPP02N!");
      } else {
        setBtStatus("Bluetooth belum terkoneksi. Mengalihkan ke cetak dokumen...");
        handlePrintClean();
      }
    } catch (e) {
      console.error(e);
      handlePrintClean();
    } finally {
      setIsPrintingBt(false);
    }
  };

  // Auto-print otomatis via Bluetooth jika sudah tersambung
  useEffect(() => {
    if (transaction) {
      if (bluetoothPrinter.getIsConnected()) {
        setIsPrintingBt(true);
        bluetoothPrinter
          .printReceipt(transaction, storeInfo)
          .then((ok) => {
            if (ok) setBtStatus("Struk otomatis tercetak ke RPP02N!");
          })
          .finally(() => setIsPrintingBt(false));
      }
    }
  }, [transaction, storeInfo]);

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-3.5 sm:p-5 shadow-2xl border border-slate-200 text-slate-800 my-auto">

        {/* Header Dialog */}
        <div className="text-center mb-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold shadow-sm mb-1.5">
            ✓
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Pembayaran Berhasil!
          </h3>
          <p className="text-xs text-slate-500">
            Antrean <strong className="text-blue-600">{transaction.queueNumber}</strong> tersimpan di database
          </p>
          {btStatus && (
            <p className="mt-1 text-[11px] font-semibold text-blue-600">
              {btStatus}
            </p>
          )}
        </div>

        {/* Tampilan Visual Struk di Layar */}
        <div
          id="receipt-print-area"
          className="font-mono text-xs text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-dashed border-slate-300"
        >
          <div className="text-center space-y-0.5">
            <h2 className="text-sm font-black tracking-wider uppercase text-slate-900 truncate">
              {storeInfo.name}
            </h2>
            <p className="text-[10px] text-slate-600 line-clamp-1">
              {storeInfo.address}
            </p>
            <p className="text-[10px] text-slate-600">Telp: {storeInfo.phone}</p>
            <div className="border-b border-dashed border-slate-400 my-1.5"></div>

            <div className="py-2 bg-blue-50 rounded-xl border border-blue-200 my-1">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">
                NOMOR ANTREAN
              </span>
              <div className="text-2xl font-black text-blue-900 tracking-wider my-0.5">
                {transaction.queueNumber}
              </div>
              <span className="text-[9px] text-blue-700 font-semibold block">
                (Silakan Menunggu Pesanan)
              </span>
            </div>

            <div className="border-b border-dashed border-slate-400 my-1.5"></div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>No: {transaction.id}</span>
              <span>{formatDate(transaction.timestamp)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Kasir: Utama</span>
              <span>Metode: {transaction.paymentMethod}</span>
            </div>
            <div className="border-b border-dashed border-slate-400 my-1.5"></div>
          </div>

          <div className="my-2 space-y-1">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs gap-1">
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight text-slate-900 truncate">{item.menuItem.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.quantity} x {formatIDR(item.menuItem.price)}
                  </p>
                </div>
                <span className="font-semibold text-right shrink-0">
                  {formatIDR(item.menuItem.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-0.5">
            <div className="flex justify-between text-xs font-medium">
              <span>Subtotal:</span>
              <span>{formatIDR(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold border-t border-slate-800 pt-1 mt-1 text-slate-900">
              <span>TOTAL:</span>
              <span>{formatIDR(transaction.total)}</span>
            </div>
            {transaction.paymentMethod === "Cash" ? (
              <>
                <div className="flex justify-between text-xs font-medium pt-0.5">
                  <span>Tunai Diterima:</span>
                  <span>{formatIDR(transaction.cashReceived || transaction.total)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>Kembalian:</span>
                  <span>{formatIDR(transaction.changeAmount || 0)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs font-bold text-blue-700 pt-0.5">
                <span>Pembayaran QRIS:</span>
                <span>LUNAS</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-2"></div>
          <div className="text-center space-y-0.5 text-[10px] text-slate-600">
            <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
            <p className="font-bold text-blue-700">
              Ambil pesanan #{transaction.queueNumber.replace('#', '')}
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="mt-3.5 space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25 active:scale-98 cursor-pointer"
          >
            Selesai &amp; Transaksi Baru
          </button>

          {/* Tombol Cetak Langsung Bluetooth MP-58C */}
          <button
            type="button"
            disabled={isPrintingBt}
            onClick={handlePrintBluetooth}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
          >
            <span>🖨️</span>
            {isPrintingBt ? (
              <span>Mengirim ke Printer RPP02N...</span>
            ) : (
              <span>Cetak ke Bluetooth (RPP02N)</span>
            )}
          </button>

          {/* Tombol Cetak Browser (Menggunakan fungsi handlePrintClean: PASTI 1 HALAMAN) */}
          <button
            type="button"
            onClick={handlePrintClean}
            className="w-full rounded-xl border border-slate-300 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cetak Struk (PDF / Printer Biasa)
          </button>
        </div>
      </div>
    </div>
  );
};