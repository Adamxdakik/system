import { useEffect } from "react";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

function canSendHeartbeat(): boolean {
  return navigator.onLine && document.visibilityState !== "hidden";
}

export function useHeartbeat(
  currentPath: string,
  intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
): void {
  useEffect(() => {
    const send = () => {
      if (!canSendHeartbeat()) return;
      void fetch("/api/users/heartbeat", {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage: currentPath }),
      }).catch(() => undefined);
    };

    const sendWhenAvailable = () => {
      if (canSendHeartbeat()) send();
    };

    send();
    const timer = window.setInterval(send, intervalMs);
    window.addEventListener("online", sendWhenAvailable);
    document.addEventListener("visibilitychange", sendWhenAvailable);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", sendWhenAvailable);
      document.removeEventListener("visibilitychange", sendWhenAvailable);
    };
  }, [currentPath, intervalMs]);
}
