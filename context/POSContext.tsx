"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, CartItem, Transaction, CategoryType, PaymentMethod, DailyRecap, StoreInfo } from "@/types/pos";

const INITIAL_MENU: MenuItem[] = [];

const DEFAULT_STORE_INFO: StoreInfo = {
  name: "CAFE & RESTO BIRU",
  address: "Jl. Melati No. 12, Jakarta Selatan",
  phone: "0812-3456-7890",
  qrisNmid: "ID1020030040050",
  qrisMerchantName: "KASIR CAFE & RESTO BIRU",
};

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
  addToCart: (menuItem: MenuItem) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  removeFromCart: (menuId: string) => void;
  clearCart: () => void;
  addMenu: (item: Omit<MenuItem, "id">) => void;
  updateMenu: (item: MenuItem) => void;
  toggleMenuStatus: (menuId: string) => void;
  deleteMenu: (menuId: string) => void;
  completePayment: (method: PaymentMethod, cashReceived?: number) => Transaction;
  getDailyRecap: (dateStr?: string) => DailyRecap;
  resetQueueCounter: () => void;
  updateQrisImage: (dataUrl: string) => void;
  resetQrisImage: () => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
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
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedMenu = localStorage.getItem("pos_menu_list");
      if (savedMenu) setMenuList(JSON.parse(savedMenu));

      const savedQueue = localStorage.getItem("pos_queue_counter");
      if (savedQueue) setQueueCounter(parseInt(savedQueue, 10));

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
    } catch (e) {
      console.error("Failed to load POS data from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save changes to localStorage
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
    } catch (e) { }
  }, [queueCounter, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("pos_transactions", JSON.stringify(transactions));
    } catch (e) { }
  }, [transactions, isHydrated]);

  // Format queue number e.g. #01, #02
  const currentQueueNumber = `#${queueCounter.toString().padStart(2, "0")}`;

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
  };

  const addMenu = (item: Omit<MenuItem, "id">) => {
    const newItem: MenuItem = {
      ...item,
      id: `custom-${Date.now()}`,
    };
    setMenuList((prev) => [newItem, ...prev]);
  };

  const updateMenu = (updatedItem: MenuItem) => {
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
  };

  const toggleMenuStatus = (menuId: string) => {
    setMenuList((prev) =>
      prev.map((item) => {
        if (item.id === menuId) {
          const newStatus = item.status === "Tersedia" ? "Habis" : "Tersedia";
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const deleteMenu = (menuId: string) => {
    setMenuList((prev) => prev.filter((item) => item.id !== menuId));
    removeFromCart(menuId);
  };

  const completePayment = (method: PaymentMethod, cashReceived?: number): Transaction => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
    const tax = 0;
    const total = subtotal + tax;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

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
    setQueueCounter((prev) => prev + 1);
    clearCart();
    setIsMobileCartOpen(false);

    return newTx;
  };

  const getDailyRecap = (dateStr?: string): DailyRecap => {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
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
  };

  const updateQrisImage = (dataUrl: string) => {
    setQrisImage(dataUrl);
    setIsCustomQris(true);
    try {
      localStorage.setItem("pos_custom_qris_image", dataUrl);
    } catch (e) {
      console.error("Storage limit exceeded for image", e);
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
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addMenu,
        updateMenu,
        toggleMenuStatus,
        deleteMenu,
        completePayment,
        getDailyRecap,
        resetQueueCounter,
        updateQrisImage,
        resetQrisImage,
        updateStoreInfo,
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
