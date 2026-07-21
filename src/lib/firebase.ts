const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let cachedAuth: any;
let cachedProvider: any;
let cachedApp: any;
let cachedAuthModule: any;

async function getFirebaseAuth() {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser.");
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error(
      "Missing Firebase auth configuration. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your environment.",
    );
  }

  if (cachedAuth && cachedProvider && cachedAuthModule) {
    return { auth: cachedAuth, provider: cachedProvider, authModule: cachedAuthModule };
  }

  const { initializeApp } = await import("firebase/app");
  const authModule = await import("firebase/auth");

  if (!cachedApp) {
    cachedApp = initializeApp(firebaseConfig);
  }

  cachedAuth = authModule.getAuth(cachedApp);
  cachedProvider = new authModule.GoogleAuthProvider();
  cachedAuthModule = authModule;

  return { auth: cachedAuth, provider: cachedProvider, authModule };
}

export async function signInWithGoogle() {
  const { auth, provider, authModule } = await getFirebaseAuth();
  return authModule.signInWithPopup(auth, provider);
}

export async function sendFirebasePasswordReset(email: string) {
  const { auth, authModule } = await getFirebaseAuth();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:8081";
  const actionCodeSettings = {
    url: `${origin}/reset-password`,
    handleCodeInApp: true,
  };
  return authModule.sendPasswordResetEmail(auth, email, actionCodeSettings);
}

export async function confirmFirebasePasswordReset(oobCode: string, newPassword: string) {
  const { auth, authModule } = await getFirebaseAuth();
  return authModule.confirmPasswordReset(auth, oobCode, newPassword);
}

export async function verifyFirebaseResetCode(oobCode: string) {
  const { auth, authModule } = await getFirebaseAuth();
  return authModule.verifyPasswordResetCode(auth, oobCode);
}
