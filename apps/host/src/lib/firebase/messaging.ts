import { getApps, initializeApp, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from "firebase/messaging";

let messagingInstance: Messaging | undefined;

function getClientMessaging(): Messaging | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (messagingInstance) return messagingInstance;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey,
        authDomain,
        projectId,
        appId,
        messagingSenderId,
      });

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.warn("[FCM Host] Failed to initialize Firebase Messaging:", err);
    return null;
  }
}

export async function requestPushNotificationToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("[FCM Host] Push notifications not supported in this environment.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM Host] Notification permission dismissed or denied:", permission);
      return null;
    }

    const messaging = getClientMessaging();
    if (!messaging) return null;

    // Register service worker if not already registered (passes config in query params to avoid hardcoding secrets)
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
      const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
      const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
      const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";

      const query = new URLSearchParams({
        apiKey,
        projectId,
        authDomain,
        messagingSenderId,
        appId,
      }).toString();

      registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
      await navigator.serviceWorker.ready;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[FCM Host] Host Device Push Token retrieved successfully.");
      return token;
    }
    return null;
  } catch (err) {
    console.warn("[FCM Host] Error acquiring notification token:", err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  const messaging = getClientMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM Host] Foreground push message received:", payload);
      callback(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("[FCM Host] Failed to register foreground message listener:", err);
    return null;
  }
}
