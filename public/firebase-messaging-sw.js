"use client";
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyARk63eYnht9p5VD4cad-_S_4VeILqpcqM",
  authDomain: "pharmato-842d3.firebaseapp.com",
  projectId: "pharmato-842d3",
  storageBucket: "pharmato-842d3.firebasestorage.app",
  messagingSenderId: "1039306398763",
  appId: "1:1039306398763:web:f4c5cd8118da8cf8a95e6e",
  measurementId: "G-TH5CJGC2FZ",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  // Duplicate notification prevent
  if (payload.notification) {
    console.log("FCM auto notification already handled");
    return;
  }

  const BASE_URL = self.location.origin;

  const title = payload?.data?.title || "Notification";
  const body = payload?.data?.body || "";

  let dataPath = "/";

  if (payload && payload.data) {
    if (payload.data.url) {
      dataPath = payload.data.url;
    } 
    else if (payload.data.targetScreen === "orders/detail") {
      const id = payload.data.targetId || payload.data.orderId;
      dataPath = `/dashboard/orders/detail/${id}/partial-cancel`;
    } 
    else if (payload.data.targetScreen === "wallet") {
      dataPath = `/dashboard/admin/customers/${payload.data.targetId}`;
    } 
    else if (payload.data.targetScreen === "customer/detail") {
      dataPath = `/dashboard/admin/customers/${payload.data.targetId}`;
    } 
    else if (payload.data.orderId) {
      dataPath = `/dashboard/orders/detail/${payload.data.orderId}/`;
    }
  }

  const dataUrl = dataPath.startsWith("http")
    ? dataPath
    : BASE_URL + dataPath;

  self.registration.showNotification(title, {
    body: body,
    icon: "/firebase-logo.png",

    // same notification replace karega
    tag: "pharmato-notification",
    renotify: true,

    data: {
      url: dataUrl,
      payload: payload,
    },
  });
});


// Notification click handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const clickUrl =
    event.notification &&
    event.notification.data &&
    event.notification.data.url
      ? event.notification.data.url
      : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];

        // Agar same tab open hai to usko focus + navigate
        if (client.url === clickUrl && "focus" in client) {
          client.focus();
          return client.navigate(clickUrl);
        }
      }

      // Agar tab open nahi hai to new tab open karo
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
