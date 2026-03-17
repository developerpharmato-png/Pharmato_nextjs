"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import Switch from "@mui/material/Switch";

import {
  NotificationsListStore,
  unreadNotificationStore,
  markreadNotificationsStore,
  markReadAllNotificationsStore,
} from "@/app/dashboard/storeAPICall/useUserStore";
import {
  markreadNotificationsPath,
  markReadAllNotificationsPath,
  NotificationsListPath,
  unreadNotificationPath,
} from "@/app/dashboard/storeAPICall/API/BaseApi";

type NotificationItem = any;

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const notifStore = NotificationsListStore();
  const unreadStore = unreadNotificationStore();
  const markReadStore = markreadNotificationsStore();
  const markReadAllStore = markReadAllNotificationsStore();

  const fetchNotifications = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setOffset(1);
      setHasMore(true);
    } else {
      if (!hasMore || fetchingMore || loading) return;
      setFetchingMore(true);
    }

    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null;
      const currentOffset = isInitial ? 1 : offset + 1;
      const body = {
        userId: userId || "",
        role: "admin",
        limit: 10,
        offset: currentOffset,
      };

      const res = await notifStore.postData(NotificationsListPath, body);
      const rawData = res?.data ?? res ?? notifStore.data;
      const list = Array.isArray(rawData) ? rawData : (rawData?.notifications || rawData?.data || []);

      if (Array.isArray(list)) {
        setNotifications((prev) => (isInitial ? list : [...prev, ...list]));
        setHasMore(list.length === 10);
        setOffset(currentOffset);
      } else {
        if (isInitial) setNotifications([]);
        setHasMore(false);
      }
    } catch {
      if (isInitial) setNotifications([]);
    } finally {
      setLoading(false);
      setFetchingMore(false);
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
    } catch { }
  };

  useEffect(() => {
    if (!open) return;
    fetchNotifications(true);
    fetchUnreadCount();
  }, [open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      fetchNotifications();
    }
  };

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
    } catch { }
  };

  const markAllAsRead = async () => {
    try {
      const adminId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null;
      if (!adminId) return;

      const res = await markReadAllStore.postData(markReadAllNotificationsPath, { userId: adminId });
      if (res?.success ?? true) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // const onItemClick = async (item: NotificationItem) => {
  //   if (!item.isRead) await markAsRead(item._id);
  //   onClose();
  //   if (item.targetScreen === "orders/detail") {
  //     router.push(`/dashboard/orders/detail/${item.targetId}/partial-cancel`);
  //   }
  //   if (item.targetScreen === "customer/detail") {
  //     router.push(`/dashboard/admin/customers/${item.targetId}`);
  //   }
  //   else if (item.targetScreen === "wallet") {
  //     router.push(`/dashboard/admin/customers/${item.targetId}`);
  //   }
  // };


  const onItemClick = async (item: NotificationItem) => {
    if (!item.isRead) await markAsRead(item._id);
    onClose();

    let targetUrl: string | null = null;
    if (item.targetScreen === "orders/detail") {
      targetUrl = `/dashboard/orders/detail/${item.targetId}/partial-cancel`;
    } else if (item.targetScreen === "customer/detail" || item.targetScreen === "wallet") {
      targetUrl = `/dashboard/admin/customers/${item.targetId}`;
    }

    if (!targetUrl) return;
  router.push(`${targetUrl}?refresh=${Date.now()}`);

  };
  // Always add a refresh param to force navigation and re-render


  /* 🔹 Filtered notifications */
  const filteredNotifications = useMemo(() => {
    return showUnreadOnly
      ? notifications.filter((n) => !n.isRead)
      : notifications;
  }, [notifications, showUnreadOnly]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[45] transition-opacity z-100"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-[50] w-full sm:w-[420px]
        bg-[var(--background)] text-[var(--foreground)]
        shadow-2xl border-l border-gray-100
        transform transition-all duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <NotificationsNoneOutlinedIcon
                    className="text-[var(--secondary)]"
                    fontSize="medium"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3
                      rounded-full bg-red-500 border-2 border-white" />
                  )}
                </div>

                <h3 className="text-lg font-bold tracking-tight text-gray-800">
                  Notifications
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600
                    hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-sm font-semibold text-green-600
                  hover:bg-green-50 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Counters + Switch */}
            {/* <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                  Total {notifications.length}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                  Unread {unreadCount}
                </span>
              </div>

            
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <span>Unread only</span>
                <Switch
                  size="small"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  color="primary"
                />
              </div>
            </div> */}
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-gray-50/30"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-gray-500 font-medium">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <NotificationsNoneOutlinedIcon className="text-gray-400" fontSize="large" />
                </div>
                <p className="text-gray-800 font-bold mb-1">All Caught Up!</p>
                <p className="text-sm text-gray-500">
                  {showUnreadOnly ? "No unread notifications right now." : "You're all set! No notifications to show."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n: NotificationItem) => (
                <div
                  key={n._id}
                  onClick={() => onItemClick(n)}
                  className={`group relative p-4 rounded-xl border cursor-pointer
                  transition-all duration-300
                  ${n.isRead
                      ? "bg-white border-gray-100 shadow-sm"
                      : "bg-blue-50/40 border-blue-100 shadow-sm"
                    }
                  hover:shadow-md hover:border-green-200`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold mb-1 ${n.isRead ? "text-gray-700" : "text-blue-900"}`}>
                        {n.title}
                      </div>

                      <div className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                        {n.message}
                      </div>

                      <div className="mt-3 flex items-center text-[10px] font-medium text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></span>
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    </div>

                    {!n.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    )}
                  </div>
                </div>
              ))
            )}

            {fetchingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
