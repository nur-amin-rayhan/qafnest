"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { PropertyItem } from "../types";

interface PropertiesInsightsStripProps {
  properties?: PropertyItem[];
  triggerToast: (msg: string) => void;
}

export function PropertiesInsightsStrip({
  properties = [],
  triggerToast,
}: PropertiesInsightsStripProps) {
  const { dir, t } = useAdminAuth();
  const total = properties.length;

  const normalizeCity = (p: PropertyItem) =>
    `${p.city || ""} ${p.city_name || ""}`.toLowerCase();

  const riyadhCount = properties.filter((p) => {
    const c = normalizeCity(p);
    return c.includes("riyadh") || c.includes("الرياض") || c.includes("diriyah");
  }).length;
  const jeddahCount = properties.filter((p) => {
    const c = normalizeCity(p);
    return c.includes("jeddah") || c.includes("جدة") || c.includes("makkah") || c.includes("taif");
  }).length;
  const asirCount = properties.filter((p) => {
    const c = normalizeCity(p);
    return c.includes("abha") || c.includes("أبها") || c.includes("asir") || c.includes("عسير");
  }).length;
  const easternCount = properties.filter((p) => {
    const c = normalizeCity(p);
    return c.includes("khobar") || c.includes("الخبر") || c.includes("dammam") || c.includes("الدمام") || c.includes("ahsa");
  }).length;

  const pct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  const licensedCount = properties.filter((p) => Boolean(p.tourism_license_number)).length;
  const compliancePct = pct(licensedCount);

  const regions = [
    { label: t("Riyadh & Ammariyah", "الرياض والعمارية"), count: riyadhCount, color: "bg-primary" },
    { label: t("Jeddah & Red Sea Coast", "جدة وساحل البحر الأحمر"), count: jeddahCount, color: "bg-status-sand" },
    { label: t("Asir & Southern Highlands", "عسير والمرتفعات الجنوبية"), count: asirCount, color: "bg-status-emerald" },
    { label: t("Eastern Province (Khobar/Ahsa)", "المنطقة الشرقية (الخبر/الأحساء)"), count: easternCount, color: "bg-secondary" },
  ];

  return (
    <div dir={dir} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-space-lg">
      {/* Regional Breakdown */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-space-sm">
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              {t("Regional Breakdown", "التوزيع الجغرافي للمناطق")}
            </h3>
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold shrink-0">
              {t("Kingdom Map", "خريطة المملكة")}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            {t("Live inventory distribution across top vacation corridors.", "توزيع المخزون العقاري الحي عبر أبرز الوجهات السياحية.")}
          </p>
          <div className="space-y-3">
            {regions.map((region) => {
              const regionPct = pct(region.count);
              return (
                <div key={region.label}>
                  <div className="flex justify-between text-body-sm font-body-sm mb-1">
                    <span className="text-on-surface font-semibold">{region.label}</span>
                    <span className="text-outline">
                      {region.count} {t("units", "وحدة")} ({regionPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`${region.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${regionPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance & Verification */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-space-sm">
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              {t("Compliance & Verification", "الامتثال والتوثيق النظامي")}
            </h3>
            <span className="font-label-sm text-label-sm text-status-emerald uppercase font-bold shrink-0">
              {compliancePct}% {t("Compliant", "متوافق")}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            {t("Ministry of Tourism licensing & host national ID checks.", "التحقق من تراخيص وزارة السياحة والهوية الوطنية للمضيفين.")}
          </p>
          <div className="p-space-md rounded-lg bg-surface-container-low mb-space-sm flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-status-emerald text-[22px] flex-shrink-0 mt-0.5">
              verified_user
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                {t("QafNest Shield Protection", "حماية درع قاف نست")}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t(
                  `${licensedCount} ${licensedCount === 1 ? "listing" : "listings"} linked with MOT/Balady permit records.`,
                  `${licensedCount} وحدة مرتبطة بسجلات تصاريح وزارة السياحة وبلدي.`
                )}
              </span>
            </div>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container-low flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-status-sand text-[22px] flex-shrink-0 mt-0.5">
              shield_with_heart
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                {t("Permit Coverage Policy", "سياسة تغطية التصاريح")}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t(
                  "Listings require verified Ministry of Tourism permits prior to publication.",
                  "تتطلب العقارات وجود تصريح موثق من وزارة السياحة قبل نشرها للضيوف."
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Concierge Banner */}
      <div className="md:col-span-2 xl:col-span-1 bg-gradient-to-br from-primary via-primary to-primary-container p-space-lg rounded-xl shadow-md text-on-primary flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -end-12 -top-12 w-48 h-48 bg-on-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed font-bold">
              {t("Partner Support", "دعم الشركاء والمضيفين")}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-status-emerald text-on-primary font-bold text-[10px]">
              {t("Operations Desk", "مكتب العمليات")}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-primary mb-2">
            {t("Need Help Onboarding a Luxury Estate?", "هل تحتاج مساعدة في ضم عقار فاخر؟")}
          </h3>
          <p className="font-body-sm text-body-sm text-on-primary/80 mb-space-md">
            {t(
              "Coordinate property onboarding reviews and photography inspections for qualified chalets.",
              "تنسيق مراجعات التسجيل والتصوير الفوتوغرافي الميداني للشاليهات والفلل المؤهلة."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => triggerToast(t("Onboarding inspection request routed to Concierge Desk.", "تم توجيه طلب الفحص والتسجيل إلى مكتب دعم الشركاء."))}
          className="w-full py-2.5 px-4 rounded-lg bg-on-primary text-primary font-title-sm text-title-sm font-bold shadow-md hover:bg-surface-container-lowest transition-all text-center cursor-pointer"
        >
          {t("Request Concierge Inspection", "طلب فحص وتصوير ميداني")}
        </button>
      </div>
    </div>
  );
}
