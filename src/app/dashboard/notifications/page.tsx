"use client";
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import SendNotificationForm from "./SendNotificationForm";
import NotificationList from "./NotificationList";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Customer Notifications"
        subtitle="Send and manage customer notifications."
        showBack={true}
        showSearch={false}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="notification tabs"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 500,
            },
            "& .Mui-selected": {
              color: "#16a34a",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#16a34a",
            },
          }}
        >
          <Tab label="Send Notification" />
          <Tab label="Notification History" />
        </Tabs>
      </Box>

      {activeTab === 0 && <SendNotificationForm />}
      {activeTab === 1 && <NotificationList />}
    </div>
  );
}
