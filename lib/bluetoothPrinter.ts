// lib/bluetoothPrinter.ts

export class BluetoothPrinterService {
    private device: any = null;
    private characteristic: any = null;
    private isConnected: boolean = false;

    // UUID umum untuk Bluetooth Serial Port (SPP) pada Thermal Printer
    private readonly SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
    private readonly CHARACTERISTIC_UUID = "00002af1-0000-1000-8000-00805f9b34fb";

    // Cek apakah printer sedang terhubung
    getIsConnected(): boolean {
        return this.isConnected && !!this.characteristic;
    }

    // Menghubungkan browser ke printer Bluetooth RPP02N
    async connect(): Promise<boolean> {
        if (typeof window === "undefined") return false;

        if (!("bluetooth" in navigator)) {
            alert("Browser Anda belum mendukung Web Bluetooth. Gunakan Google Chrome atau Edge di Laptop/Android.");
            return false;
        }

        try {
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [
                    { name: "RPP02N" },
                    { namePrefix: "RPP" },
                    { namePrefix: "MP-58" },
                    { namePrefix: "VSC" },
                ],
                optionalServices: [
                    this.SERVICE_UUID,
                    "0000e781-0000-1000-8000-00805f9b34fb",
                    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
                ],
            });

            const server = await this.device.gatt.connect();
            const services = await server.getPrimaryServices();

            // Cari characteristic yang mendukung fungsi tulis (write)
            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    for (const char of characteristics) {
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            this.characteristic = char;
                            this.isConnected = true;
                            break;
                        }
                    }
                } catch (e) { }
                if (this.characteristic) break;
            }

            if (this.characteristic) {
                this.device.addEventListener("gattserverdisconnected", () => {
                    this.isConnected = false;
                    this.characteristic = null;
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error("Gagal menghubungkan Bluetooth:", error);
            return false;
        }
    }

    // Format baris rata kiri - kanan untuk lebar 58mm (32 karakter)
    private formatRow(left: string, right: string, maxLen = 32): string {
        const spaceCount = Math.max(1, maxLen - left.length - right.length);
        return left + " ".repeat(spaceCount) + right + "\n";
    }

    // Mengirim perintah cetak struk ESC/POS
    async printReceipt(tx: any, storeInfo: any): Promise<boolean> {
        if (!this.characteristic) {
            // Jika belum terhubung, coba minta koneksi sekali
            const ok = await this.connect();
            if (!ok) return false;
        }

        try {
            const encoder = new TextEncoder();
            const ESC = "\x1B";
            const GS = "\x1D";

            let text = "";

            // 1. Inisialisasi printer
            text += ESC + "@";

            // 2. Header Toko (Rata Tengah)
            text += ESC + "a" + "\x01"; // Center align
            text += ESC + "!\x18" + (storeInfo.name || "CAFE ALESHA") + "\n"; // Font tebal double size
            text += ESC + "!\x00"; // Normal font
            if (storeInfo.address) text += storeInfo.address + "\n";
            if (storeInfo.phone) text += "Telp: " + storeInfo.phone + "\n";
            text += "--------------------------------\n";

            // 3. Nomor Antrean
            text += "NOMOR ANTREAN\n";
            text += ESC + "!\x38" + tx.queueNumber + "\n"; // Font extra besar
            text += ESC + "!\x00";
            text += "(Silakan Menunggu Pesanan)\n";
            text += "--------------------------------\n";

            // 4. Info Transaksi (Rata Kiri)
            text += ESC + "a" + "\x00"; // Left align
            text += this.formatRow("No: " + tx.id, tx.date);
            text += this.formatRow("Kasir: Utama", "Metode: " + tx.paymentMethod);
            text += "--------------------------------\n";

            // 5. Daftar Item Belanja
            for (const item of tx.items) {
                text += item.menuItem.name + "\n";
                const qtyPrice = `  ${item.quantity} x ${item.menuItem.price.toLocaleString("id-ID")}`;
                const subtotal = (item.quantity * item.menuItem.price).toLocaleString("id-ID");
                text += this.formatRow(qtyPrice, subtotal);
            }

            text += "--------------------------------\n";
            text += this.formatRow("TOTAL:", "Rp " + tx.total.toLocaleString("id-ID"));

            if (tx.paymentMethod === "Cash") {
                text += this.formatRow("Tunai:", "Rp " + (tx.cashReceived || tx.total).toLocaleString("id-ID"));
                text += this.formatRow("Kembali:", "Rp " + (tx.changeAmount || 0).toLocaleString("id-ID"));
            } else {
                text += this.formatRow("Status:", "LUNAS (QRIS)");
            }
            text += "--------------------------------\n";

            // 6. Footer Struk
            text += ESC + "a" + "\x01"; // Center align
            text += "TERIMA KASIH ATAS KUNJUNGAN ANDA\n";
            text += `Pesanan #${tx.queueNumber.replace("#", "")}\n`;
            text += "\n\n\n\n"; // Feed kertas

            // Kirim per blok 100 byte agar buffer bluetooth printer tidak overflow
            const bytes = encoder.encode(text);
            const chunkSize = 100;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);
            }

            return true;
        } catch (e) {
            console.error("Gagal mencetak struk:", e);
            return false;
        }
    }
}

export const bluetoothPrinter = new BluetoothPrinterService();