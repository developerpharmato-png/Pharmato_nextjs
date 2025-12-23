"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import Switch from "@mui/material/Switch";

import {
  markreadNotificationsPath,
  NotificationsListPath,
  unreadNotificationPath,
} from "@/app/dashboard/storeAPICall/API/BaseApi";
import {
  NotificationsListStore,
  unreadNotificationStore,
  markreadNotificationsStore,
} from "@/app/dashboard/storeAPICall/useUserStore";

type NotificationItem = any;

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const notifStore = NotificationsListStore();
  const unreadStore = unreadNotificationStore();
  const markReadStore = markreadNotificationsStore();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId =
        typeof window !== "undefined" ? localStorage.getItem("adminId") : null;
      const body = { userId: userId || "", role: "admin" };
      const res = await notifStore.postData(NotificationsListPath, body);
      const list = res?.data || res || notifStore.data || [];
      setNotifications(list || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const userId =
        typeof window !== "undefined" ? localStorage.getItem("adminId") : null;
      const body = { userId: userId || "", role: "admin" };
      const res = await unreadStore.postData(unreadNotificationPath, body);
      const data = res?.data ?? res ?? unreadStore.data;
      const count =
        typeof data === "number" ? data : data?.unreadCount ?? data?.count ?? 0;
      setUnreadCount(Number(count || 0));
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
    fetchUnreadCount();
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      const res = await markReadStore.postData(markreadNotificationsPath, { id });
      if (res?.success ?? true) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {}
  };

  const onItemClick = async (item: NotificationItem) => {
    if (!item.isRead) await markAsRead(item._id);
    onClose();
    if (item.targetScreen) {
      router.push(`/dashboard/orders/detail/${item.targetId}`);
    }
  };

  /* 🔹 Filtered notifications */
  const filteredNotifications = useMemo(() => {
    return showUnreadOnly
      ? notifications.filter((n) => !n.isRead)
      : notifications;
  }, [notifications, showUnreadOnly]);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-[420px]
      bg-[var(--background)] text-[var(--foreground)]
      shadow-2xl border-l border-[var(--status-default-bg)]
      transform transition-all duration-300 ease-in-out
      ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--status-default-bg)]
          bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <NotificationsNoneOutlinedIcon
                  className="text-[var(--secondary)]"
                  fontSize="medium"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5
                    rounded-full bg-[var(--primary)]" />
                )}
              </div>

              <h3 className="text-lg font-semibold tracking-tight">
                Notifications
              </h3>
            </div>

            <button
              onClick={onClose}
              className="text-sm text-[var(--secondary)]
              hover:text-[var(--foreground)] transition"
            >
              Close
            </button>
          </div>

          {/* Counters + Switch */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-0.5 rounded-full
                bg-[var(--status-default-bg)]
                text-[var(--status-default-text)]">
                Total {notifications.length}
              </span>

              <span className="px-2 py-0.5 rounded-full
                bg-[var(--status-info-bg)]
                text-[var(--status-info-text)]">
                Unread {unreadCount}
              </span>
            </div>

            {/* 🔹 Unread Toggle */}
            <div className="flex items-center gap-2 text-xs text-[var(--secondary)]">
              <span>Unread only</span>
              <Switch
                size="small"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-[var(--secondary)]">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--secondary)]">
              No unread notifications 🎉
            </div>
          ) : (
            filteredNotifications.map((n: NotificationItem) => (
              <div
                key={n._id}
                onClick={() => onItemClick(n)}
                className={`relative p-4 rounded-xl border cursor-pointer
                transition-all duration-200
                ${
                  n.isRead
                    ? "bg-white border-[var(--status-default-bg)]"
                    : "bg-[var(--status-info-bg)]/60 border-[var(--status-info-bg)]"
                }
                hover:shadow-md hover:border-[var(--secondary)]`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 right-4 h-2 w-2
                    rounded-full bg-[var(--primary)]" />
                )}

                <div className="text-sm font-medium">
                  {n.title}
                </div>

                <div className="mt-1 text-xs text-[var(--status-default-text)] line-clamp-2">
                  {n.message}
                </div>

                <div className="mt-2 text-[11px] text-[var(--secondary)]">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
