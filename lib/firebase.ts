import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain);
}

// Only called in the browser, after the page has loaded.
export function getFirebaseAuth(): Auth | null {
  if (!firebaseConfigured()) return null;
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
  return getAuth(app);
}

export function getGoogleProvider(): GoogleAuthProvider {
  return new GoogleAuthProvider();
}
