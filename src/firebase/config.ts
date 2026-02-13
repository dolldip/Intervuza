import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// You can manually paste your keys here if you have them from the Firebase Console.
// Otherwise, clicking "Connect to Firebase" in the Studio UI will fill these automatically.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const isMockConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey === "mock-api-key";

if (isMockConfig && typeof window !== 'undefined') {
  console.warn(
    "Firebase is running with MOCK configuration. " +
    "Database features are disabled. Please connect your project in the Studio panel."
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: "mock-key" });
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, isMockConfig };
