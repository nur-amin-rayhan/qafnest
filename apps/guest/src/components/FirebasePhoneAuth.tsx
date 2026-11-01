"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

type Props = {
  onSignedIn?: (user: User) => void;
};

type Step = "phone" | "code";

function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-phone-number":
        "Enter a valid phone number in international format, such as +14155552671.",
      "auth/too-many-requests": "Too many attempts. Wait a while, then try again.",
      "auth/quota-exceeded":
        "SMS sending is temporarily unavailable. Try again later.",
      "auth/captcha-check-failed":
        "reCAPTCHA verification failed. Please complete it again.",
      "auth/invalid-verification-code": "That verification code is incorrect.",
      "auth/code-expired": "That code has expired. Request a new one.",
      "auth/operation-not-allowed":
        "Phone sign-in is not enabled for this Firebase project.",
    };
    return messages[error.code] ?? "Phone verification failed. Please try again.";
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function resetRecaptcha(widgetId: number | null) {
  if (widgetId === null || typeof window === "undefined") return;
  const grecaptcha = (
    window as unknown as { grecaptcha?: { reset: (id?: number) => void } }
  ).grecaptcha;
  grecaptcha?.reset(widgetId);
}

export default function FirebasePhoneAuth({ onSignedIn }: Props) {
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);
  const authRef = useRef<Auth | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let verifier: RecaptchaVerifier | null = null;

    try {
      const auth = getFirebaseAuth();
      authRef.current = auth;

      if (!recaptchaContainerRef.current) {
        throw new Error("The reCAPTCHA container is unavailable.");
      }

      verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: "normal",
        callback: () => {
          if (!mounted) return;
          setCaptchaReady(true);
          setError(null);
        },
        "expired-callback": () => {
          if (!mounted) return;
          setCaptchaReady(false);
          setError("reCAPTCHA expired. Please complete it again.");
        },
      });

      recaptchaVerifierRef.current = verifier;

      void verifier
        .render()
        .then((widgetId) => {
          if (mounted) {
            recaptchaWidgetIdRef.current = widgetId;
            setCaptchaReady(true);
          }
        })
        .catch((reason: unknown) => {
          if (mounted) setError(getErrorMessage(reason));
        });
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    }

    return () => {
      mounted = false;
      verifier?.clear();
      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;
      authRef.current = null;
    };
  }, []);

  async function sendVerificationCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const phone = phoneNumber.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError(
        "Enter a valid phone number in international format, such as +14155552671.",
      );
      return;
    }

    const auth = authRef.current;
    const verifier = recaptchaVerifierRef.current;
    if (!auth || !verifier) {
      setError("Firebase Auth or reCAPTCHA is not ready. Refresh and try again.");
      return;
    }

    setSending(true);
    try {
      confirmationResultRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        verifier,
      );
      setVerificationCode("");
      setStep("code");
      setMessage(`A verification code was sent to ${phone}.`);
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
      resetRecaptcha(recaptchaWidgetIdRef.current);
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const confirmationResult = confirmationResultRef.current;
    const code = verificationCode.trim();

    if (!confirmationResult) {
      setError("Request a verification code first.");
      setStep("phone");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setVerifying(true);
    try {
      const credential = await confirmationResult.confirm(code);
      setMessage("Phone verified successfully.");
      onSignedIn?.(credential.user);
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    } finally {
      setVerifying(false);
    }
  }

  function changePhoneNumber() {
    confirmationResultRef.current = null;
    setVerificationCode("");
    setError(null);
    setMessage(null);
    setStep("phone");
    resetRecaptcha(recaptchaWidgetIdRef.current);
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border p-6">
      <h2 className="text-xl font-semibold">Phone sign-in</h2>
      <form
        className="mt-5 space-y-4"
        onSubmit={step === "phone" ? sendVerificationCode : verifyCode}
      >
        {step === "phone" ? (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Phone number</span>
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+14155552671"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <div ref={recaptchaContainerRef} />
            <button
              type="submit"
              disabled={sending || !captchaReady}
              className="w-full rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {sending ? "Sending code…" : "Send verification code"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm">
              Enter the code sent to <strong>{phoneNumber}</strong>.
            </p>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(event) =>
                  setVerificationCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="123456"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={verifying || verificationCode.length !== 6}
              className="w-full rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>
            <button
              type="button"
              onClick={changePhoneNumber}
              className="w-full rounded-lg border px-4 py-2"
            >
              Use a different number
            </button>
          </>
        )}
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}
    </section>
  );
}

