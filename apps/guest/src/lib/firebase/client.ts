import { FirebaseError, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let authInstance: Auth | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be initialized in the browser.");
  }

  if (authInstance) return authInstance;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error("Firebase client configuration is missing.");
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

  authInstance = getAuth(app);
  return authInstance;
}

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/operation-not-allowed" &&
      error.message.toLowerCase().includes("region")
    ) {
      return "SMS to this country is blocked by your Firebase SMS Region Policy. Go to Firebase Console > Authentication > Settings > SMS region policy and allow Saudi Arabia (+966).";
    }
    const messages: Record<string, string> = {
      "auth/invalid-phone-number":
        "Enter a valid phone number in international format, such as +966501234567.",
      "auth/too-many-requests": "Too many attempts. Wait a while, then try again.",
      "auth/quota-exceeded":
        "SMS sending is temporarily unavailable. Try again later.",
      "auth/captcha-check-failed":
        "reCAPTCHA verification failed. Please complete it again.",
      "auth/invalid-verification-code": "That verification code is incorrect.",
      "auth/code-expired": "That code has expired. Request a new one.",
      "auth/operation-not-allowed":
        "Phone sign-in or the target country region is not enabled in Firebase Console (Authentication > Settings > SMS region policy).",
      "auth/billing-not-enabled":
        "Firebase requires the Blaze plan for live SMS, or use your test number (+966 55 253 8488 / code 600700).",
      "auth/invalid-app-credential":
        "Firebase app verification failed. Ensure localhost is in Firebase Authorized Domains.",
    };
    return messages[error.code] ?? `Phone verification failed (${error.code}).`;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export interface StoredFirebaseProfile {
  first_name: string;
  last_name: string;
  full_name: string;
  contact_email: string;
  phone: string;
}

const PROFILE_STORAGE_PREFIX = "qafnest_fb_profile_";

export function getStoredFirebaseProfile(uid: string): StoredFirebaseProfile | null {
  if (typeof window === "undefined" || !uid) return null;
  try {
    const raw = window.localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredFirebaseProfile;
  } catch {
    return null;
  }
}

export function saveStoredFirebaseProfile(
  uid: string,
  profile: StoredFirebaseProfile,
): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.setItem(
      `${PROFILE_STORAGE_PREFIX}${uid}`,
      JSON.stringify(profile),
    );
  } catch {}
}
