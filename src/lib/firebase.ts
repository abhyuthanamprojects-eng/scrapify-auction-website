import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

type FirebaseWebConfig = typeof envFirebaseConfig;

let firebasePromise: Promise<{ auth: ReturnType<typeof getAuth>; googleProvider: GoogleAuthProvider }> | null = null;

export function getFirebaseAuth() {
  firebasePromise ??= (async () => {
    let remoteConfig: Partial<FirebaseWebConfig> = {};
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://api.scrapifyauctions.com/api/v1").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/platform-config`);
      if (response.ok) {
        const payload = await response.json();
        remoteConfig = payload.firebase ?? payload.data?.firebase ?? {};
      }
    } catch {
      // The website can still use the build-time configuration when the API
      // is temporarily unavailable.
    }

    const firebaseConfig = {
      apiKey: remoteConfig.apiKey || envFirebaseConfig.apiKey,
      authDomain: remoteConfig.authDomain || envFirebaseConfig.authDomain,
      projectId: remoteConfig.projectId || envFirebaseConfig.projectId,
      storageBucket: remoteConfig.storageBucket || envFirebaseConfig.storageBucket,
      messagingSenderId: remoteConfig.messagingSenderId || envFirebaseConfig.messagingSenderId,
      appId: remoteConfig.appId || envFirebaseConfig.appId,
    };
    const missing = Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length > 0) throw new Error("Missing Firebase web configuration: " + missing.join(", "));

    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    return { auth: getAuth(app), googleProvider: new GoogleAuthProvider() };
  })();

  return firebasePromise;
}
