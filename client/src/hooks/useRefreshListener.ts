import { useEffect } from "react";

export function useRefreshListener(onRefresh: () => void | Promise<void>) {
  useEffect(() => {
    const handleRefresh = () => {
      try {
        const result = onRefresh();
        if (result && typeof (result as any).catch === "function") {
          (result as any).catch((err: any) => console.error("Refresh listener error:", err));
        }
      } catch (err) {
        console.error("Refresh listener error:", err);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "crm:global_refresh") {
        handleRefresh();
      }
    };

    window.addEventListener("crm:refresh", handleRefresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("crm:refresh", handleRefresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [onRefresh]);
}

export function triggerGlobalRefresh() {
  window.dispatchEvent(new CustomEvent("crm:refresh"));
  try {
    localStorage.setItem("crm:global_refresh", Date.now().toString());
  } catch (err) {
    // Ignore storage quota or disabled storage
  }
}
