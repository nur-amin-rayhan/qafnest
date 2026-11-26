// Firebase Cloud Messaging Background Service Worker for QafNest
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Dynamically initialized via runtime query parameters from navigator.serviceWorker.register
const params = new URLSearchParams(self.location.search);
const apiKey = params.get("apiKey");
const projectId = params.get("projectId") || "qafnest";
const authDomain = params.get("authDomain") || `${projectId}.firebaseapp.com`;
const messagingSenderId = params.get("messagingSenderId") || "18594889394";
const appId = params.get("appId");

if (apiKey && !firebase.apps.length) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[QafNest firebase-messaging-sw.js] Received background push message:", payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || "QafNest · قاف نست";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || "New update regarding your reservation.",
      icon: payload.notification?.icon || "/favicon.ico",
      badge: "/favicon.ico",
      data: payload.data || {},
      tag: payload.data?.tag || "qafnest-booking-alert",
      dir: "auto",
      vibrate: [200, 100, 200],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = String(event.notification.data?.url || "/my-bookings").trim();
  let urlToOpen = "/my-bookings";
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    if (parsed.origin === self.location.origin) {
      urlToOpen = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    urlToOpen = "/my-bookings";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
