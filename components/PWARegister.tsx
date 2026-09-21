"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Skip in local dev — a service worker interferes with hot reload.
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
