"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DatabaseInfoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/upload-qris");
  }, [router]);

  return null;
}
