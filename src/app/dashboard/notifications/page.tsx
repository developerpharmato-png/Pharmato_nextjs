"use client";
import React, { useState } from "react";
import { Box, Modal } from "@mui/material";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { ModalHeader } from "@/app/dashboard/components/miniComponents";
import { modalStyle } from "@/utils/style";
import SendNotificationForm from "./SendNotificationForm";
import NotificationList from "./NotificationList";

export default function NotificationsPage() {
  const [open, setOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const handleSuccess = () => {
    handleClose();
    setRefreshTrigger(prev => prev + 1); // Trigger list refresh
  };

  return (
    <div className="containerStyleTable scrollbar-hide">
      <HeaderWithAction
        title="Customer Notifications"
        subtitle="Send and manage customer notifications."
        showBack={false}
        showSearch={false}
        addShow={true}
        addLabel="Send Notification"
        handleAdd={handleAdd}
      />

      {/* Notification list always visible */}
      <NotificationList refreshTrigger={refreshTrigger} />

      {/* Modal for sending notification */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ ...modalStyle, width: "50vw" }} className="scrollbar-hide">
          <ModalHeader title="Send Notification" onClose={handleClose} />
          <div className="mt-4 p-10">
            <SendNotificationForm 
            handleClose={handleSuccess}
            />
          </div>
        </Box>
      </Modal>
    </div>
  );
}
  