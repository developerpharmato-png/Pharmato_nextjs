import React, { useState } from "react";
import { MdNotifications } from "react-icons/md";

export default function DashboardTopHeader() {
  const [lang, setLang] = useState("English");
  const notificationCount = 99;

  return (
    <header className="sticky top-0 z-10 w-full h-16 flex items-center justify-end px-8 bg-white border-b border-gray-100 shadow-lg">
      
      <button
        type="button"
        className="relative text-gray-500 transition-all duration-200 
                   hover:text-green-600 
                   focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 
                   bg-gray-50 hover:bg-green-50 rounded-full p-2.5"
        aria-label="Notifications"
      >
        <MdNotifications size={24} className="text-xl" /> 
        
        <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 
                         flex items-center justify-center h-5 w-5 rounded-full 
                         bg-red-600 text-white text-xs font-medium 
                         border-2 border-white shadow-md">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      </button>

    </header>
  );
}