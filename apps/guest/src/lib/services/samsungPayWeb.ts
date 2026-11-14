"use client";

const SAMSUNG_PAY_WEB_SDK_URL = "https://img.mpay.samsung.com/gsmpi/sdk/samsungpay_web_sdk.js";

interface SamsungPayPaymentClient {
  loadPaymentSheet: (
    paymentMethods: {
      version: string;
      serviceId: string;
      protocol: string;
      allowedBrands: string[];
    },
    transactionDetail: {
      currencyCode: string;
      totalPrice: string;
      countryCode: string;
    }
  ) => Promise<unknown>;
}

interface SamsungPayGlobal {
  PaymentClient: new (config: {
    environment: "STAGE" | "STAGE_WITHOUT_APK" | "PRODUCTION";
  }) => SamsungPayPaymentClient;
}

declare global {
  interface Window {
    SamsungPay?: SamsungPayGlobal;
  }
}

let sdkLoadPromise: Promise<SamsungPayGlobal> | null = null;

function loadSamsungPayWebSdk(): Promise<SamsungPayGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Samsung Pay Web SDK can only run in a browser."));
  }
  if (window.SamsungPay?.PaymentClient) {
    return Promise.resolve(window.SamsungPay);
  }
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<SamsungPayGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SAMSUNG_PAY_WEB_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.SamsungPay?.PaymentClient) resolve(window.SamsungPay);
        else reject(new Error("Samsung Pay SDK loaded without PaymentClient."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Samsung Pay Web SDK."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SAMSUNG_PAY_WEB_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.SamsungPay?.PaymentClient) {
        resolve(window.SamsungPay);
      } else {
        sdkLoadPromise = null;
        reject(new Error("Samsung Pay SDK did not initialize PaymentClient."));
      }
    };
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("Could not load Samsung Pay Web Checkout script."));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Opens Samsung Pay Web Checkout (QR / Samsung Account prompt on desktop,
 * biometric sheet on supported Samsung Galaxy browsers) and returns the credential token.
 */
export async function requestSamsungPayWebToken(params: {
  serviceId: string;
  environment: "STAGE" | "STAGE_WITHOUT_APK" | "PRODUCTION";
  amountSar: number;
}): Promise<string> {
  const SamsungPaySdk = await loadSamsungPayWebSdk();
  const client = new SamsungPaySdk.PaymentClient({
    environment: params.environment,
  });

  const credential = await client.loadPaymentSheet(
    {
      version: "2",
      serviceId: params.serviceId,
      protocol: "PROTOCOL_3DS",
      allowedBrands: ["visa", "mastercard", "mada"],
    },
    {
      currencyCode: "SAR",
      totalPrice: Number(params.amountSar).toFixed(2),
      countryCode: "SA",
    }
  );

  if (typeof credential === "string") {
    return credential;
  }
  return JSON.stringify(credential);
}
