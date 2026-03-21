"use client";

// Force the newly updated service worker to become the active service worker immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Take control of all open tabs immediately when the service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 🔥 CRITICAL HACK: Service Workers CANNOT control a browser tab (and cannot `navigate` it) 
// unless they have a `fetch` event listener. This empty listener forces the browser 
// to let this service worker formally "control" your Next.js tabs.
self.addEventListener('fetch', (event) => {
  // Pass through all network requests normally
});

// Handle notification click BEFORE Firebase messaging imports!
// This is critical because Firebase Web SDK automatically registers its own notificationclick listener
// which will aggressively open a new tab to your homepage if we don't intercept it first.
self.addEventListener('notificationclick', function (event) {
  // 🔥 CRITICAL: Prevent Firebase's default handler from firing!
  event.stopImmediatePropagation();
  event.notification.close();

  const BASE_URL = self.location.origin;
  let clickUrl = '/';

  // Extract the original data payload from either our manual showNotification data or Firebase's automatic FCM_MSG
  let payloadData = null;
  if (event.notification.data) {
    if (event.notification.data.url) {
      // Manually set in showNotification
      clickUrl = event.notification.data.url;
    } else if (event.notification.data.payload && event.notification.data.payload.data) {
      payloadData = event.notification.data.payload.data;
    } else if (event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data) {
      payloadData = event.notification.data.FCM_MSG.data;
    }
  }

  // If a data payload is found but `url` wasn't explicitly set in event.notification.data.url, apply custom routing map
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
      // Look for any uniquely 'controlled' client matching our origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];

        // If the client is from our domain
        if (client.url && client.url.startsWith(BASE_URL) && 'focus' in client) {

          return client.focus().then(function (focusedClient) {
            // Because we only queried for strictly controlled clients, navigate WILL always work
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

      // If no open controlled client found for our app, strictly rely on a new window
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

// Optional: background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message",
    payload
  );
  // We don't manually call showNotification here to avoid generating duplicates!
});
