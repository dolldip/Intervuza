import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Robust Firebase Configuration
 * If real keys are missing or invalid, the app switches to "Resilient Mode".
 * This allows the UI to continue functioning with local storage (Demo Mode).
 */
const firebaseConfig = {
  apiKey: "4e9aee57-cd69-4b2a-85f5-35a00361058f", // Provided by user
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:mockid",
};

// Check if we have a valid-looking configuration
const isMockConfig = !firebaseConfig.apiKey || 
                     firebaseConfig.apiKey === "mock-api-key" || 
                     firebaseConfig.apiKey.length < 10 ||
                     firebaseConfig.projectId === "mock-project-id";

let app;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Attempt initialization. If it fails due to invalid keys, we catch it.
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.warn("Firebase initialization failed. Defaulting to safe mock app.");
  app = initializeApp({ ...firebaseConfig, apiKey: "mock-key" });
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, isMockConfig };
