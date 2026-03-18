"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { onMessage, getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyARk63eYnht9p5VD4cad-_S_4VeILqpcqM",
  authDomain: "pharmato-842d3.firebaseapp.com",
  projectId: "pharmato-842d3",
  storageBucket: "pharmato-842d3.firebasestorage.app",
  messagingSenderId: "1039306398763",
  appId: "1:1039306398763:web:f4c5cd8118da8cf8a95e6e",
  measurementId: "G-TH5CJGC2FZ",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only run messaging code in the browser
declare const window: any;

let requestPermissionAndGetToken: (() => Promise<string | undefined>) | undefined = undefined;

if (typeof window !== "undefined") {
  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    if (
      Notification.permission === "granted" &&
      payload.notification &&
      typeof payload.notification.title === "string" &&
      typeof payload.notification.body === "string"
    ) {
      new Notification(
        payload.notification.title || "Notification",
        {
          body: payload.notification.body || "",
          icon: "/firebase-logo.png",
        }
      );
    }
  });

  requestPermissionAndGetToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }
      const token = await getToken(messaging, {
        vapidKey: "BO4XRFHc6eWZPZt4UvMwwhEX0VE3lvL1MuwUEViEVwshlUKam9LZo-W4tdKu6QDcOlbSaa5sSXvbt0mTBz9skGY",
      });
      console.log("FCM Token:", token);
      return token;
    } catch (error) {
      console.error("Error getting FCM token", error);
    }
  };
}

export { requestPermissionAndGetToken };
