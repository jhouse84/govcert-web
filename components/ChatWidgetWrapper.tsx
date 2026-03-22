"use client";

import { usePathname } from "next/navigation";
import ChatWidget from "./ChatWidget";

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  // Only show on authenticated pages (not landing, login, register, verify, invite, etc.)
  const publicPages = ["/", "/login", "/register", "/forgot-password", "/nda"];
  const isPublic =
    publicPages.includes(pathname) ||
    pathname.startsWith("/verify-") ||
    pathname.startsWith("/reset-") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/OAuth");
  if (isPublic) return null;
  return <ChatWidget />;
}
