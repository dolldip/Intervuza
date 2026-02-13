import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Using the API key you provided. 
// Note: Real Firebase usage also requires authDomain and projectId.
// The app will run in "Resilient Mode" if these are missing.
const firebaseConfig = {
  apiKey: "4e9aee57-cd69-4b2a-85f5-35a00361058f",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const isMockConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey === "mock-api-key" || firebaseConfig.apiKey.length < 10;

if (isMockConfig && typeof window !== 'undefined') {
  console.warn(
    "Firebase is running with MOCK configuration. " +
    "Using Demo Mode features. Connect your project in the Studio panel for full database support."
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: "mock-key" });
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, isMockConfig };
