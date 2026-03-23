"use client";

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
self.addEventListener('fetch', (event) => {
});

self.addEventListener('notificationclick', function (event) {
  event.stopImmediatePropagation();
  event.notification.close();

  const BASE_URL = self.location.origin;
  let clickUrl = '/';

  let payloadData = null;
  if (event.notification.data) {
    if (event.notification.data.url) {
      clickUrl = event.notification.data.url;
    } else if (event.notification.data.payload && event.notification.data.payload.data) {
      payloadData = event.notification.data.payload.data;
    } else if (event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data) {
      payloadData = event.notification.data.FCM_MSG.data;
    }
  }

  if (payloadData && clickUrl === '/') {
    let dataPath = '/';
    if (payloadData.url) {
      dataPath = payloadData.url;
    } else if (payloadData.targetScreen === "orders/detail") {
      const id = payloadData.targetId || payloadData.orderId;
      dataPath = `/dashboard/orders/detail/${id}/partial-cancel`;
    } else if (payloadData.targetScreen === "wallet") {
      dataPath = `/dashboard/admin/customers/${payloadData.targetId}`;
    }
    else if (payloadData.targetScreen === "customer/detail") {
      dataPath = `/dashboard/admin/customers/${payloadData.targetId}`;
    }
    else if (payloadData.orderId) {
      dataPath = `/dashboard/orders/detail/${payloadData.orderId}/`;
    }
    clickUrl = dataPath.startsWith("http") ? dataPath : BASE_URL + (dataPath.startsWith("/") ? "" : "/") + dataPath;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];

        if (client.url && client.url.startsWith(BASE_URL) && 'focus' in client) {

          return client.focus().then(function (focusedClient) {
            if (focusedClient && focusedClient.url === clickUrl) {
              return focusedClient;
            }

            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(clickUrl);
            }

            return focusedClient;
          });
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

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
  console.log(
    "[firebase-messaging-sw.js] Received background message",
    payload
  );
});
