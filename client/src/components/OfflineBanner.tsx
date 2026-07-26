import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let reconnectTimer: number | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        reconnectTimer = window.setTimeout(() => setShowReconnected(false), 3000);
      }
      setWasOffline(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div
        className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-green-600 py-2 text-sm font-medium text-white shadow-md animate-in fade-in slide-in-from-top-2"
        role="status"
        aria-live="polite"
      >
        <Wifi className="h-4 w-4" aria-hidden="true" />
        Connection restored
      </div>
    );
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-destructive py-2 text-sm font-medium text-destructive-foreground shadow-md"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      No internet connection — changes may not save until you're back online
    </div>
  );
}
