import React, { useEffect, useState } from "react";
import { MdNotifications } from "react-icons/md";
import NotificationsPanel from "./NotificationsPanel";
import { unreadNotificationPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { unreadNotificationStore } from "@/app/dashboard/storeAPICall/useUserStore";

export default function DashboardTopHeader() {
  const [lang, setLang] = useState("English");
  const [openNotifications, setOpenNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const unreadStore = unreadNotificationStore();
  const fetchUnread = async () => {
    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null;
      const res = await unreadStore.postData(unreadNotificationPath, { userId: userId || "", role: "admin" });
      const data = res?.data ?? res ?? unreadStore.data;
      const count = typeof data === "number" ? data : (data?.unreadCount ?? data?.count ?? 0);
      setUnreadCount(Number(count || 0));
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  };

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-10 w-full h-16 flex items-center justify-end px-8 bg-white border-b border-gray-100 shadow-lg">
        <button
          type="button"
          onClick={() => setOpenNotifications(true)}
          className="relative text-gray-500 transition-all duration-200 
                     hover:text-green-600 
                     focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 
                     bg-gray-50 hover:bg-green-50 rounded-full p-2.5"
          aria-label="Notifications"
        >
          <MdNotifications size={24} className="text-xl" />

          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 
                         flex items-center justify-center h-5 w-5 rounded-full 
                         bg-red-600 text-white text-xs font-medium 
                         border-2 border-white shadow-md">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      <NotificationsPanel open={openNotifications} onClose={() => { setOpenNotifications(false); fetchUnread(); }} />
    </>
  );
}