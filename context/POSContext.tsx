"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  MenuItem,
  CartItem,
  Transaction,
  CategoryType,
  PaymentMethod,
  DailyRecap,
  StoreInfo,
  SavedOrder,
} from "@/types/pos";

const INITIAL_MENU: MenuItem[] = [];

const DEFAULT_STORE_INFO: StoreInfo = {
  name: "CAFE & RESTO BIRU",
  address: "Jl. Melati No. 12, Jakarta Selatan",
  phone: "0812-3456-7890",
  qrisNmid: "ID1020030040050",
  qrisMerchantName: "KASIR CAFE & RESTO BIRU",
};

// Helper mendapatkan tanggal hari ini format YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface POSContextType {
  menuList: MenuItem[];
  cart: CartItem[];
  queueCounter: number;
  currentQueueNumber: string;
  transactions: Transaction[];
  qrisImage: string;
  isCustomQris: boolean;
  storeInfo: StoreInfo;
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
  savedOrders: SavedOrder[];
  activeSavedOrderId: string | null;
  activeSavedOrderName: string | null;
  setActiveSavedOrderId: (id: string | null) => void;
  setActiveSavedOrderName: (name: string | null) => void;
  isSaveOrderOpen: boolean;
  setIsSaveOrderOpen: (open: boolean) => void;
  isSavedOrdersOpen: boolean;
  setIsSavedOrdersOpen: (open: boolean) => void;
  addToCart: (menuItem: MenuItem) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  removeFromCart: (menuId: string) => void;
  clearCart: () => void;
  addMenu: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateMenu: (item: MenuItem) => Promise<void>;
  toggleMenuStatus: (menuId: string) => Promise<void>;
  deleteMenu: (menuId: string) => Promise<void>;
  completePayment: (method: PaymentMethod, cashReceived?: number) => Transaction;
  deleteTransaction: (txId: string) => Promise<boolean>;
  deleteBulkTransactions: (txIds: string[]) => Promise<boolean>;
  restoreTransaction: (txId: string) => Promise<boolean>;
  getDailyRecap: (dateStr?: string) => DailyRecap;
  resetQueueCounter: () => void;
  updateQrisImage: (dataUrl: string) => void;
  resetQrisImage: () => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  saveCurrentOrder: (
    orderName: string,
    asNew?: boolean
  ) => Promise<{ success: boolean; data?: SavedOrder; isUpdated?: boolean; message?: string }>;
  loadSavedOrder: (savedOrder: SavedOrder) => void;
  deleteSavedOrder: (orderId: string) => Promise<void>;
  fetchSavedOrders: () => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuList, setMenuList] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [queueCounter, setQueueCounter] = useState<number>(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [qrisImage, setQrisImage] = useState<string>("/images/qris/qris-bca.svg");
  const [isCustomQris, setIsCustomQris] = useState<boolean>(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [activeSavedOrderId, setActiveSavedOrderId] = useState<string | null>(null);
  const [activeSavedOrderName, setActiveSavedOrderName] = useState<string | null>(null);
  const [isSaveOrderOpen, setIsSaveOrderOpen] = useState<boolean>(false);
  const [isSavedOrdersOpen, setIsSavedOrdersOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // 1. Muat data dari localStorage (DENGAN PENGECEKAN RESET HARIAN)
  useEffect(() => {
    try {
      const today = getLocalDateString();
      const savedDate = localStorage.getItem("pos_queue_date");
      const savedQueue = localStorage.getItem("pos_queue_counter");

      // JIKA HARI SUDAH BERGANTI -> RESET ANTREAN KE 1
      if (savedDate !== today) {
        setQueueCounter(1);
        localStorage.setItem("pos_queue_counter", "1");
        localStorage.setItem("pos_queue_date", today);
      } else if (savedQueue) {
        setQueueCounter(parseInt(savedQueue, 10));
      }

      const savedMenu = localStorage.getItem("pos_menu_list");
      if (savedMenu) setMenuList(JSON.parse(savedMenu));

      const savedTx = localStorage.getItem("pos_transactions");
      if (savedTx) setTransactions(JSON.parse(savedTx));

      const savedQris = localStorage.getItem("pos_custom_qris_image");
      if (savedQris) {
        setQrisImage(savedQris);
        setIsCustomQris(true);
      }

      const savedInfo = localStorage.getItem("pos_store_info");
      if (savedInfo) {
        setStoreInfo(JSON.parse(savedInfo));
      }

      const cachedSavedOrders = localStorage.getItem("pos_saved_orders");
      if (cachedSavedOrders) {
        setSavedOrders(JSON.parse(cachedSavedOrders));
      }

      const cachedActiveId = localStorage.getItem("pos_active_saved_order_id");
      if (cachedActiveId) setActiveSavedOrderId(cachedActiveId);

      const cachedActiveName = localStorage.getItem("pos_active_saved_order_name");
      if (cachedActiveName) setActiveSavedOrderName(cachedActiveName);
    } catch (e) {
      console.error("Gagal membaca cache lokal:", e);
    }
    setIsHydrated(true);
  }, []);

  // Helper untuk fetch saved orders dari API
  const fetchSavedOrders = async () => {
    try {
      const res = await fetch("/api/saved-orders");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setSavedOrders(json.data);
          localStorage.setItem("pos_saved_orders", JSON.stringify(json.data));
        }
      }
    } catch (e) {
      console.warn("Gagal memuat saved orders dari API:", e);
    }
  };

  // 2. SINKRONKAN DENGAN API NEONDB (TERMASUK HIT KE /api/queue & /api/saved-orders)
  useEffect(() => {
    async function syncWithNeonDB() {
      try {
        const today = getLocalDateString();

        // 2a. AMBIL STATUS ANTREAN HARI INI DARI API /api/queue
        try {
          const queueRes = await fetch(`/api/queue?date=${today}`);
          if (queueRes.ok) {
            const qJson = await queueRes.json();
            if (qJson.success && qJson.data) {
              const nextNumber = qJson.data.nextQueueNumber || 1;
              setQueueCounter(nextNumber);
              localStorage.setItem("pos_queue_counter", nextNumber.toString());
              localStorage.setItem("pos_queue_date", today);
            }
          }
        } catch (qErr) {
          console.warn("Gagal sinkron /api/queue, menggunakan antrean lokal:", qErr);
        }

        // 2b. Ambil store settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const sJson = await settingsRes.json();
          if (sJson.data) {
            setStoreInfo({
              name: sJson.data.name,
              address: sJson.data.address,
              phone: sJson.data.phone,
              qrisNmid: sJson.data.qrisNmid,
              qrisMerchantName: sJson.data.qrisMerchantName,
            });
            if (sJson.data.qrisImage) {
              setQrisImage(sJson.data.qrisImage);
              setIsCustomQris(sJson.data.isCustomQris);
            }
          }
        }

        // 2c. Ambil menus
        const menusRes = await fetch("/api/menus");
        if (menusRes.ok) {
          const mJson = await menusRes.json();
          if (mJson.data && mJson.data.length > 0) {
            setMenuList(mJson.data);
          }
        }

        // 2d. Ambil orders
        const ordersRes = await fetch("/api/orders");
        if (ordersRes.ok) {
          const oJson = await ordersRes.json();
          if (oJson.data && oJson.data.length > 0) {
            setTransactions(oJson.data);
          }
        }

        // 2e. Ambil saved orders
        await fetchSavedOrders();
      } catch (err) {
        console.warn("NeonDB API belum dapat dijangkau, menggunakan data lokal:", err);
      }
    }

    syncWithNeonDB();
  }, []);

  // Simpan ke localStorage saat ada perubahan
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("pos_menu_list", JSON.stringify(menuList));
    } catch (e) { }
  }, [menuList, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("pos_queue_counter", queueCounter.toString());
      localStorage.setItem("pos_queue_date", getLocalDateString());
    } catch (e) { }
  }, [queueCounter, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("pos_transactions", JSON.stringify(transactions));
    } catch (e) { }
  }, [transactions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("pos_saved_orders", JSON.stringify(savedOrders));
    } catch (e) { }
  }, [savedOrders, isHydrated]);

  const currentQueueNumber = `#${queueCounter.toString().padStart(3, "0")}`;

  const addToCart = (menuItem: MenuItem) => {
    if (menuItem.status === "Habis") return;
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItem.id === menuId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuId));
  };

  const clearCart = () => {
    setCart([]);
    setActiveSavedOrderId(null);
    setActiveSavedOrderName(null);
    try {
      localStorage.removeItem("pos_active_saved_order_id");
      localStorage.removeItem("pos_active_saved_order_name");
    } catch (e) { }
  };

  const addMenu = async (item: Omit<MenuItem, "id">) => {
    const tempId = `custom-${Date.now()}`;
    const newItem: MenuItem = { ...item, id: tempId };
    setMenuList((prev) => [newItem, ...prev]);

    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMenuList((prev) => prev.map((m) => (m.id === tempId ? json.data : m)));
        }
      }
    } catch (e) {
      console.error("Gagal menyimpan menu ke database:", e);
    }
  };

  const updateMenu = async (updatedItem: MenuItem) => {
    setMenuList((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setCart((prev) =>
      prev.map((ci) =>
        ci.menuItem.id === updatedItem.id
          ? { ...ci, menuItem: updatedItem }
          : ci
      )
    );

    try {
      await fetch(`/api/menus/${updatedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
    } catch (e) {
      console.error("Gagal update menu ke database:", e);
    }
  };

  const toggleMenuStatus = async (menuId: string) => {
    let targetStatus: "Tersedia" | "Habis" = "Habis";
    setMenuList((prev) =>
      prev.map((item) => {
        if (item.id === menuId) {
          const newStatus = item.status === "Tersedia" ? "Habis" : "Tersedia";
          targetStatus = newStatus;
          return { ...item, status: newStatus };
        }
        return item;
      })
    );

    try {
      await fetch(`/api/menus/${menuId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch (e) {
      console.error("Gagal toggle status ke database:", e);
    }
  };

  const deleteMenu = async (menuId: string) => {
    setMenuList((prev) => prev.filter((item) => item.id !== menuId));
    removeFromCart(menuId);

    try {
      await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Gagal hapus menu dari database:", e);
    }
  };

  // FITUR 1: SIMPAN ATAU PERBARUI PESANAN SEMENTARA DENGAN NAMA PESANAN
  const saveCurrentOrder = async (orderName: string, asNew: boolean = false) => {
    if (cart.length === 0) {
      return { success: false, message: "Keranjang belanja kosong!" };
    }

    const cleanName =
      orderName.trim() || activeSavedOrderName || `Pesanan ${currentQueueNumber}`;
    const subtotal = cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    const isUpdating = !asNew && !!activeSavedOrderId;
    const targetId = isUpdating ? activeSavedOrderId! : `so-${Date.now()}`;

    const orderPayload: SavedOrder = {
      id: targetId,
      orderName: cleanName,
      items: [...cart],
      totalPrice: subtotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    if (isUpdating) {
      setSavedOrders((prev) =>
        prev.map((so) => (so.id === targetId ? orderPayload : so))
      );
    } else {
      setSavedOrders((prev) => [orderPayload, ...prev]);
    }

    clearCart();
    setIsMobileCartOpen(false);

    try {
      const res = await fetch("/api/saved-orders", {
        method: isUpdating ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isUpdating ? targetId : undefined,
          orderName: cleanName,
          items: orderPayload.items,
          totalPrice: subtotal,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.id) {
          setSavedOrders((prev) =>
            prev.map((so) => (so.id === targetId ? json.data : so))
          );
        }
      }
    } catch (err) {
      console.warn("Gagal sinkron pesanan ke database, tetap tersimpan secara lokal:", err);
    }

    return { success: true, data: orderPayload, isUpdated: isUpdating };
  };

  // FITUR 1: MUAT PESANAN TERSIMPAN KE KERANJANG (MENGINGAT NAMA & ID PESANAN)
  const loadSavedOrder = (savedOrder: SavedOrder) => {
    setCart([...savedOrder.items]);
    setActiveSavedOrderId(savedOrder.id);
    setActiveSavedOrderName(savedOrder.orderName);
    try {
      localStorage.setItem("pos_active_saved_order_id", savedOrder.id);
      localStorage.setItem("pos_active_saved_order_name", savedOrder.orderName);
    } catch (e) { }
  };

  // FITUR 1: HAPUS PESANAN TERSIMPAN
  const deleteSavedOrder = async (orderId: string) => {
    setSavedOrders((prev) => prev.filter((so) => so.id !== orderId));
    if (activeSavedOrderId === orderId) {
      setActiveSavedOrderId(null);
      setActiveSavedOrderName(null);
      try {
        localStorage.removeItem("pos_active_saved_order_id");
        localStorage.removeItem("pos_active_saved_order_name");
      } catch (e) { }
    }

    try {
      await fetch(`/api/saved-orders?id=${orderId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Gagal menghapus pesanan tersimpan dari server:", err);
    }
  };

  // SOFT DELETE 1 TRANSAKSI RIWAYAT PENJUALAN
  const deleteTransaction = async (txId: string): Promise<boolean> => {
    const targetTx = transactions.find((t) => t.id === txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    try {
      const url = targetTx
        ? `/api/orders?id=${encodeURIComponent(txId)}&amount=${targetTx.total}&queue=${encodeURIComponent(targetTx.queueNumber)}`
        : `/api/orders?id=${encodeURIComponent(txId)}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Gagal soft delete transaksi dari database:", err);
      return false;
    }
  };

  // SOFT DELETE BANYAK TRANSAKSI (BULK DELETE)
  const deleteBulkTransactions = async (txIds: string[]): Promise<boolean> => {
    setTransactions((prev) => prev.filter((t) => !txIds.includes(t.id)));
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: txIds }),
      });
      return res.ok;
    } catch (err) {
      console.error("Gagal soft delete transaksi dari database:", err);
      return false;
    }
  };

  // PULIHKAN (RESTORE) TRANSAKSI YANG DI-SOFT DELETE
  const restoreTransaction = async (txId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId }),
      });
      if (res.ok) {
        const ordersRes = await fetch("/api/orders");
        if (ordersRes.ok) {
          const oJson = await ordersRes.json();
          if (oJson.data) setTransactions(oJson.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Gagal memulihkan transaksi:", err);
      return false;
    }
  };

  // PROSES PEMBAYARAN & INCREMENT ANTREAN HARIAN
  const completePayment = (method: PaymentMethod, cashReceived?: number): Transaction => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
    const tax = 0;
    const total = subtotal + tax;
    const now = new Date();
    const dateStr = getLocalDateString();
    const changeAmount =
      method === "Cash" && cashReceived !== undefined
        ? Math.max(0, cashReceived - total)
        : 0;

    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      queueNumber: currentQueueNumber,
      items: [...cart],
      subtotal,
      tax,
      total,
      paymentMethod: method,
      cashReceived: method === "Cash" ? cashReceived : total,
      changeAmount,
      timestamp: now.toISOString(),
      date: dateStr,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Naikkan nomor antrean untuk pembeli berikutnya
    setQueueCounter((prev) => {
      const next = prev >= 999 ? 1 : prev + 1;
      localStorage.setItem("pos_queue_counter", next.toString());
      localStorage.setItem("pos_queue_date", dateStr);
      return next;
    });

    // Otomatis hapus pesanan dari daftar tersimpan jika pesanan ini sebelumnya ditahan
    if (activeSavedOrderId) {
      deleteSavedOrder(activeSavedOrderId);
    }

    clearCart();
    setIsMobileCartOpen(false);

    // Kirim pesanan ke NeonDB dan sinkronkan ID resmi dari server
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTx),
    })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.data?.id && json.data.id !== newTx.id) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === newTx.id ? { ...t, id: json.data.id } : t))
            );
          }
        }
      })
      .catch((e) => console.error("Gagal simpan transaksi ke database:", e));

    return newTx;
  };

  const getDailyRecap = (dateStr?: string): DailyRecap => {
    const targetDate = dateStr || getLocalDateString();
    const dayTxs = transactions.filter((tx) => tx.date === targetDate);
    const totalRevenue = dayTxs.reduce((sum, tx) => sum + tx.total, 0);
    const cashTxs = dayTxs.filter((tx) => tx.paymentMethod === "Cash");
    const qrisTxs = dayTxs.filter((tx) => tx.paymentMethod === "QRIS");
    const totalCash = cashTxs.reduce((sum, tx) => sum + tx.total, 0);
    const totalQris = qrisTxs.reduce((sum, tx) => sum + tx.total, 0);

    return {
      date: targetDate,
      totalRevenue,
      totalTransactions: dayTxs.length,
      totalCash,
      totalQris,
      countCash: cashTxs.length,
      countQris: qrisTxs.length,
    };
  };

  const resetQueueCounter = () => {
    setQueueCounter(1);
    localStorage.setItem("pos_queue_counter", "1");
    localStorage.setItem("pos_queue_date", getLocalDateString());
  };

  const updateQrisImage = (dataUrl: string) => {
    setQrisImage(dataUrl);
    setIsCustomQris(true);
    try {
      localStorage.setItem("pos_custom_qris_image", dataUrl);
    } catch (e) {
      console.error("Penyimpanan gambar lokal penuh:", e);
    }
  };

  const resetQrisImage = () => {
    setQrisImage("/images/qris/qris-bca.svg");
    setIsCustomQris(false);
    try {
      localStorage.removeItem("pos_custom_qris_image");
    } catch (e) { }
  };

  const updateStoreInfo = (newInfo: Partial<StoreInfo>) => {
    setStoreInfo((prev) => {
      const updated = { ...prev, ...newInfo };
      try {
        localStorage.setItem("pos_store_info", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  return (
    <POSContext.Provider
      value={{
        menuList,
        cart,
        queueCounter,
        currentQueueNumber,
        transactions,
        qrisImage,
        isCustomQris,
        storeInfo,
        isMobileCartOpen,
        setIsMobileCartOpen,
        savedOrders,
        activeSavedOrderId,
        activeSavedOrderName,
        setActiveSavedOrderId,
        setActiveSavedOrderName,
        isSaveOrderOpen,
        setIsSaveOrderOpen,
        isSavedOrdersOpen,
        setIsSavedOrdersOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addMenu,
        updateMenu,
        toggleMenuStatus,
        deleteMenu,
        completePayment,
        deleteTransaction,
        deleteBulkTransactions,
        restoreTransaction,
        getDailyRecap,
        resetQueueCounter,
        updateQrisImage,
        resetQrisImage,
        updateStoreInfo,
        saveCurrentOrder,
        loadSavedOrder,
        deleteSavedOrder,
        fetchSavedOrders,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
};