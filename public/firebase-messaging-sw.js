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

// Optional: background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message",
    payload
  );

  // Determine a URL to open when the notification is clicked.
  // Prefer explicit data.url, then fallback to an orderId -> partial-cancel route, else root.
  const dataUrl = (payload && payload.data && payload.data.url) ||
    (payload && payload.data && payload.data.orderId
      ? `/dashboard/orders/detail/${payload.data.orderId}/partial-cancel`
      : "/");

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/firebase-logo.png",
    data: {
      url: dataUrl,
      // keep original payload for debugging if needed
      payload: payload,
    },
  });
});

// Handle notification click: focus existing tab or open a new one to the provided URL
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const clickUrl = event.notification && event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If a window is already open to the target URL, focus it
        if (client.url === clickUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window/tab to the URL
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
