import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Loader2, Check, CheckCheck, Trash2, X } from "lucide-react";
import { notificationsApi, Notification } from "../../api/notifications.api";
import { useSocket } from "../../context/SocketContext";
import { useNavigate } from "react-router-dom";

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail – non-critical
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotifications({ page: 1, limit: 20 });
      setNotifications(data.notifications);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Socket.IO — real-time notification:receive ───────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (notification: Notification) => {
      // Bump unread count immediately
      setUnreadCount((c) => c + 1);

      // Prepend to list (deduped by id)
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.on("notification:receive", handleReceive);
    return () => {
      socket.off("notification:receive", handleReceive);
    };
  }, [socket]);

  // ── Polling fallback (30s reconciliation) ────────────────────────────────────

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Close dropdown on outside click ─────────────────────────────────────────

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Interaction handlers ──────────────────────────────────────────────────────

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* noop */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* noop */ }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* noop */ }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) {
      notificationsApi.markAsRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  // ── Formatters ───────────────────────────────────────────────────────────────

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "deal": return "bg-blue-100 text-blue-700";
      case "lead": return "bg-amber-100 text-amber-700";
      case "task": return "bg-purple-100 text-purple-700";
      case "inbox": return "bg-emerald-100 text-emerald-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg border hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-xl border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-accent/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive">{error}</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/30 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      {!n.read && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      <div className="flex-1 min-w-0 pl-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!n.read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                            {n.title}
                          </p>
                          <span className={`shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getTypeColor(n.type)}`}>
                            {n.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
