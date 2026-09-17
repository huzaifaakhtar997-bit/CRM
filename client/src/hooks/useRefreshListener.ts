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

    window.addEventListener("crm:refresh", handleRefresh);
    return () => {
      window.removeEventListener("crm:refresh", handleRefresh);
    };
  }, [onRefresh]);
}

export function triggerGlobalRefresh() {
  window.dispatchEvent(new CustomEvent("crm:refresh"));
}
