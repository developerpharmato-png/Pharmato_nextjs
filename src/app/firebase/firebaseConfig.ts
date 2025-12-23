"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

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

export const requestPermissionAndGetToken = async () => {
  if (typeof window === "undefined") return;

  try {
    const permission = await Notification.requestPermission();
    console.log(permission, "permission");

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting FCM token", error);
  }
};
 