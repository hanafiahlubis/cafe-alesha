"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrisSettings } from "@/components/QrisSettings";

export default function DatabaseInfoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/upload-qris");
  }, [router]);

  return <QrisSettings />;
}
