"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function HostModal() {
  const router = useRouter();
  const { hostModalOpen, closeHostModal, language } = useApp();
  if (!hostModalOpen) return null;

  const openWizard = () => {
    closeHostModal();
    router.push("/host/new");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={closeHostModal}>
      <section role="dialog" aria-modal="true" aria-labelledby="host-modal-title" className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#12101a]" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={closeHostModal} className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><KeyRound className="h-6 w-6" /></span>
        <h2 id="host-modal-title" className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{language === "ar" ? "أضف عقارك" : "List your property"}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{language === "ar" ? "أكمل خطوات الموقع والصور والأسعار والترخيص. ستراجع قاف نست إعلانك قبل نشره." : "Add your location, rooms, photos, rates and tourism license in the host setup."}</p>
        <button type="button" onClick={openWizard} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-violet-800">{language === "ar" ? "ابدأ إضافة عقارك" : "Start host setup"}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button>
      </section>
    </div>
  );
}
