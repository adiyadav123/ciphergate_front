"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SecurityHardeningGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;

    const onContextMenu = (event) => {
      event.preventDefault();
    };

    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (key === "f12") {
        event.preventDefault();
        return;
      }

      if (ctrlOrMeta && event.shiftKey && ["i", "j", "c"].includes(key)) {
        event.preventDefault();
        return;
      }

      if (ctrlOrMeta && key === "u") {
        event.preventDefault();
        return;
      }

      if (key === "printscreen") {
        event.preventDefault();
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pathname]);

  return null;
}
