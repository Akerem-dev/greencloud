import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2lxzr36Z1uOs_UVJlUgvkYhFNgLdkgeU",
  authDomain: "greencloud-15de7.firebaseapp.com",
  databaseURL:
    "https://greencloud-15de7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "greencloud-15de7",
  storageBucket: "greencloud-15de7.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const realtimeDatabase = getDatabase(firebaseApp);

export const GREENCLOUD_ROOT = "greencloud";
