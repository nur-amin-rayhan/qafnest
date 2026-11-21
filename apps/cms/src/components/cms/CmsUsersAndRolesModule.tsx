"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Shield,
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Lock,
  Mail,
  Phone,
  Users,
  Loader2,
  FileText,
} from "lucide-react";
import { CollectionTableShell, type TableColumn } from "./CollectionTableShell";
import type {
  CmsLocale,
  CmsRoleRecord,
  CmsUserRecord,
  RolePermissionGroup,
  RolePermissionModuleKey,
} from "@/types/cms";

const PERMISSION_MODULES: Array<{ key: RolePermissionModuleKey; label: string }> = [
  { key: "blogs", label: "Blogs" },
  { key: "categories", label: "Categories" },
  { key: "users", label: "Users" },
  { key: "media", label: "Media" },
  { key: "roles", label: "Roles" },
  { key: "businessPages", label: "Business Pages" },
  { key: "legalPages", label: "Legal Pages" },
];

function emptyPermissions(): Record<RolePermissionModuleKey, RolePermissionGroup> {
  return {
    blogs: { read: true, create: false, update: false, delete: false },
    categories: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    media: { read: true, create: false, update: false, delete: false },
    roles: { read: false, create: false, update: false, delete: false },
    businessPages: { read: true, create: false, update: false, delete: false },
    legalPages: { read: true, create: false, update: false, delete: false },
  };
}

interface CmsUsersModuleProps {
  users: CmsUserRecord[];
  roles: CmsRoleRecord[];
  onUsersChange: (next: CmsUserRecord[]) => Promise<void>;
  locale: CmsLocale;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

export function CmsUsersModule({
  users,
  roles,
  onUsersChange,
  locale,
  darkMode,
  onNotify,
}: CmsUsersModuleProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "pending">("all");
  const [editing, setEditing] = useState<CmsUserRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Automatically deduplicate users by normalized email
  const deduplicatedUsers = useMemo(() => {
    const seen = new Set<string>();
    const list: CmsUserRecord[] = [];
    for (const u of users) {
      if (!u || !u.email) continue;
      const key = u.email.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        ...u,
        email: key,
        status: u.status || "active",
        createdAt: u.createdAt || u.updatedAt || new Date().toISOString(),
      });
    }
    return list;
  }, [users]);

  // Statistics
  const totalCount = deduplicatedUsers.length;
  const activeCount = deduplicatedUsers.filter((u) => (u.status || "active") === "active").length;
  const suspendedCount = deduplicatedUsers.filter((u) => u.status === "suspended").length;
  const pendingCount = deduplicatedUsers.filter((u) => u.status === "pending").length;

  const filtered = useMemo(() => {
    return deduplicatedUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      const uStatus = u.status || "active";
      if (statusFilter !== "all" && uStatus !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [deduplicatedUsers, roleFilter, statusFilter, search]);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${
    darkMode
      ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500 placeholder-gray-500"
      : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB] placeholder-gray-400"
  }`;

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "Qaf#";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editing) {
      setEditing({ ...editing, password: pwd });
    }
    onNotify(isAr ? "تم توليد كلمة مرور قوية" : "Secure random password generated");
  };

  const copyCredentials = () => {
    if (!editing) return;
    const text = `QafNest CMS Login Credentials\nEmail: ${editing.email}\nPassword: ${editing.password || "(Not set)"}\nRole: ${editing.role}\nStatus: ${editing.status || "active"}\nPortal: https://qafnest.com/admin`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
    onNotify(isAr ? "تم نسخ بيانات الدخول إلى الحافظة" : "Credentials copied to clipboard");
  };

  const handleSave = async () => {
    if (saving) return;
    if (!editing || !editing.email.trim()) {
      onNotify(isAr ? "البريد الإلكتروني مطلوب" : "Email is required");
      return;
    }
    const cleanEmail = editing.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      onNotify(isAr ? "يرجى إدخال بريد إلكتروني صالح" : "Please enter a valid email address");
      return;
    }

    // Uniqueness validation
    const duplicate = deduplicatedUsers.find(
      (u) => u.id !== editing.id && u.email.trim().toLowerCase() === cleanEmail
    );
    if (duplicate) {
      onNotify(isAr ? "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" : "A user with this email already exists");
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const updated: CmsUserRecord = {
        ...editing,
        email: cleanEmail,
        status: editing.status || "active",
        createdAt: editing.createdAt || nowIso,
        updatedAt: nowIso,
      };
      const next = isNew
        ? [updated, ...deduplicatedUsers]
        : deduplicatedUsers.map((u) => (u.id === updated.id ? updated : u));

      await onUsersChange(next);
      setEditing(null);
      onNotify(isAr ? (isNew ? "تم إنشاء المستخدم بنجاح" : "تم تحديث المستخدم بنجاح") : (isNew ? "User created successfully" : "User updated successfully"));
    } catch {
      onNotify(isAr ? "فشل حفظ المستخدم" : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user: CmsUserRecord) => {
    const nextStatus: "active" | "suspended" = (user.status || "active") === "active" ? "suspended" : "active";
    const updated: CmsUserRecord[] = deduplicatedUsers.map((u) =>
      u.id === user.id ? { ...u, status: nextStatus, updatedAt: new Date().toISOString() } : u
    );
    await onUsersChange(updated);
    onNotify(
      nextStatus === "active"
        ? (isAr ? `تم تفعيل حساب ${user.email}` : `Account ${user.email} activated`)
        : (isAr ? `تم تعليق حساب ${user.email}` : `Account ${user.email} suspended`)
    );
  };

  // Selected role permissions info
  const selectedRoleRecord = roles.find((r) => r.name === editing?.role);
  const grantedPermsCount = selectedRoleRecord
    ? Object.values(selectedRoleRecord.permissions || {}).reduce(
        (acc, g) => acc + (g.read ? 1 : 0) + (g.create ? 1 : 0) + (g.update ? 1 : 0) + (g.delete ? 1 : 0),
        0
      )
    : 28;

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode ? "border-[#2A2F3E] hover:bg-white/5" : "border-gray-200 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{editing.email || (isAr ? "مستخدم جديد" : "New User")}</h1>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    (editing.status || "active") === "active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : editing.status === "suspended"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {(editing.status || "active").toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {isNew
                  ? (isAr ? "إنشاء حساب مستخدم جديد وضبط الصلاحيات" : "Create a new user account with role permissions")
                  : (isAr ? `تعديل الحساب والبيانات وتاريخ الإنشاء ${editing.createdAt?.slice(0, 10)}` : `Editing account · Created ${editing.createdAt?.slice(0, 10) || "—"}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={copyCredentials}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  darkMode ? "border-[#2A2F3E] hover:bg-white/5 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCredentials ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ البيانات" : "Copy Credentials")}</span>
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ المستخدم" : "Save User")}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div
          className={`rounded-2xl border p-6 space-y-6 ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB] shadow-sm"
          }`}
        >
          {/* Identity & Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {isAr ? "المعلومات الشخصية وجهات الاتصال" : "Personal & Contact Information"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{isAr ? "البريد الإلكتروني *" : "Email Address *"}</span>
                </label>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  placeholder="admin@qafnest.com"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{isAr ? "رقم الجوال" : "Phone Number"}</span>
                </label>
                <input
                  type="tel"
                  value={editing.phone || ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  placeholder="+966 50 123 4567"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">{isAr ? "الاسم الأول" : "First Name"}</label>
                <input
                  value={editing.firstName}
                  onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                  placeholder="e.g. Faisal"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">{isAr ? "اسم العائلة" : "Last Name"}</label>
                <input
                  value={editing.lastName}
                  onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                  placeholder="e.g. Al-Otaibi"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <hr className={darkMode ? "border-[#222634]" : "border-gray-100"} />

          {/* Role & Account Status */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {isAr ? "الدور الوظيفي وحالة الحساب" : "Role & Account Access Status"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{isAr ? "الدور والصلاحيات" : "Assigned Role"}</span>
                </label>
                <select
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className={inputCls}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                  {roles.length === 0 && <option value="Super Admin">Super Admin</option>}
                </select>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-[#2563EB] font-medium">
                    {grantedPermsCount} / 28 {isAr ? "صلاحية ممنوحة" : "permissions granted"}
                  </span>
                  {selectedRoleRecord?.description && (
                    <span className="truncate">{selectedRoleRecord.description}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{isAr ? "حالة الحساب" : "Account Status"}</span>
                </label>
                <select
                  value={editing.status || "active"}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as "active" | "suspended" | "pending" })
                  }
                  className={inputCls}
                >
                  <option value="active">{isAr ? "نشط (Active) - وصول كامل" : "Active - Normal Access"}</option>
                  <option value="suspended">{isAr ? "معلق (Suspended) - تم حظر الوصول" : "Suspended - Access Revoked"}</option>
                  <option value="pending">{isAr ? "قيد الانتظار (Pending) - بانتظار التفعيل" : "Pending - Invitation Sent"}</option>
                </select>
              </div>
            </div>
          </div>

          <hr className={darkMode ? "border-[#222634]" : "border-gray-100"} />

          {/* Password & Credential Management (Super Admin Access) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{isAr ? "بيانات الدخول وكلمة المرور (Super Admin Control)" : "Credentials & Password (Super Admin Control)"}</span>
              </h3>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isAr ? "توليد كلمة مرور عشوائية" : "Generate Secure Password"}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={editing.password || ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  placeholder={isAr ? "أدخل كلمة المرور أو اتركها لتعيين كلمة تلقائية" : "Set password or generate random temporary key"}
                  className={`${inputCls} pr-10 font-mono text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.forcePasswordChange)}
                    onChange={(e) => setEditing({ ...editing, forcePasswordChange: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#2563EB]"
                  />
                  <span>{isAr ? "إلزام المستخدم بتغيير كلمة المرور عند أول تسجيل دخول" : "Force user to change password on first login"}</span>
                </label>

                {editing.password && (
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="inline-flex items-center gap-1 text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? "نسخ بيانات الدخول" : "Copy Credentials"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <hr className={darkMode ? "border-[#222634]" : "border-gray-100"} />

          {/* Notes / Internal Auditing */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{isAr ? "ملاحظات الإدارة والمسؤوليات (Internal Notes)" : "Internal Notes & Responsibilities"}</span>
            </label>
            <textarea
              rows={2}
              value={editing.notes || ""}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              placeholder={isAr ? "مثال: المشرف المالي لمنطقة جدة والساحل الغربي" : "e.g. Lead Editor for Jeddah Properties & Seasonal Guides"}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    );
  }

  const columns: TableColumn<CmsUserRecord>[] = [
    {
      key: "email",
      label: isAr ? "المستخدم والبريد الإلكتروني" : "User & Email",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
            {u.firstName ? u.firstName.charAt(0) : u.email.charAt(0)}
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setEditing({ ...u });
                setIsNew(false);
              }}
              className="font-semibold text-xs text-[#2563EB] hover:underline block text-left"
            >
              {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.email}
            </button>
            <span className="text-[11px] text-gray-500 block">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: isAr ? "الدور والصلاحيات" : "Role",
      render: (u) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-[#2563EB]">
          {u.role}
        </span>
      ),
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (u) => {
        const s = u.status || "active";
        return (
          <button
            type="button"
            onClick={() => toggleUserStatus(u)}
            title={isAr ? "انقر لتغيير الحالة" : "Click to toggle status"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-transform hover:scale-105 ${
              s === "active"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : s === "suspended"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {s === "active" ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
            <span>{s.toUpperCase()}</span>
          </button>
        );
      },
    },
    {
      key: "phone",
      label: isAr ? "الجوال" : "Phone",
      render: (u) => <span className="text-gray-500 text-xs">{u.phone || "—"}</span>,
    },
    {
      key: "password",
      label: isAr ? "كلمة المرور" : "Credentials",
      render: (u) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
          <Lock className="w-3 h-3 text-gray-400" />
          <span>{u.password ? "••••••••" : (isAr ? "افتراضي" : "System")}</span>
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: isAr ? "تاريخ التحديث" : "Updated At",
      render: (u) => (
        <span className="text-gray-500 text-xs" suppressHydrationWarning>
          {u.updatedAt ? String(u.updatedAt).slice(0, 10) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">{isAr ? "إجمالي المستخدمين" : "Total Users"}</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalCount}</p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">{isAr ? "المستخدمون النشطون" : "Active Users"}</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">{isAr ? "المستخدمون المعلقون" : "Suspended"}</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400">{suspendedCount}</p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">{isAr ? "الأدوار المتاحة" : "Available Roles"}</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{roles.length}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "all", label: isAr ? "جميع الحالات" : "All Status", count: totalCount },
          { key: "active", label: isAr ? "نشط" : "Active", count: activeCount },
          { key: "suspended", label: isAr ? "معلق" : "Suspended", count: suspendedCount },
          { key: "pending", label: isAr ? "قيد الانتظار" : "Pending", count: pendingCount },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : darkMode
                  ? "bg-[#151822] text-gray-400 hover:text-white border border-[#222634]"
                  : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : darkMode
                    ? "bg-white/10 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Collection Table */}
      <CollectionTableShell
        title={isAr ? "إدارة المستخدمين والصلاحيات (Users Control)" : "User Management & Control"}
        searchPlaceholder={isAr ? "بحث بالبريد، الاسم، الدور..." : "Search by email, name, role, phone..."}
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => {
          setEditing({
            id: `usr-${Date.now()}`,
            email: "",
            firstName: "",
            lastName: "",
            role: roles[0]?.name || "Super Admin",
            status: "active",
            phone: "",
            password: "",
            forcePasswordChange: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setIsNew(true);
        }}
        filterOptions={[
          { label: isAr ? "جميع الأدوار" : "All Roles", value: "all" },
          ...roles.map((r) => ({ label: r.name, value: r.name })),
        ]}
        activeFilter={roleFilter}
        onFilterChange={setRoleFilter}
        columns={columns}
        rows={filtered}
        onEdit={(u) => {
          setEditing({ ...u });
          setIsNew(false);
        }}
        onDelete={async (u) => {
          if (!window.confirm(isAr ? `هل تريد بالتأكيد حذف حساب "${u.email}"؟` : `Remove user account "${u.email}"?`)) return;
          const next = deduplicatedUsers.filter((x) => x.id !== u.id);
          await onUsersChange(next);
          onNotify(isAr ? "تم حذف المستخدم بنجاح" : "User account deleted");
        }}
        darkMode={darkMode}
      />
    </div>
  );
}

interface CmsRolesModuleProps {
  roles: CmsRoleRecord[];
  onRolesChange: (next: CmsRoleRecord[]) => Promise<void>;
  locale: CmsLocale;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

export function CmsRolesModule({
  roles,
  onRolesChange,
  locale,
  darkMode,
  onNotify,
}: CmsRolesModuleProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CmsRoleRecord | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filtered = roles.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  const togglePerm = (
    mod: RolePermissionModuleKey,
    action: keyof RolePermissionGroup
  ) => {
    if (!editing) return;
    setEditing({
      ...editing,
      permissions: {
        ...editing.permissions,
        [mod]: {
          ...editing.permissions[mod],
          [action]: !editing.permissions[mod][action],
        },
      },
    });
  };

  const toggleRowAll = (mod: RolePermissionModuleKey) => {
    if (!editing) return;
    const g = editing.permissions[mod];
    const allTrue = g.read && g.create && g.update && g.delete;
    setEditing({
      ...editing,
      permissions: {
        ...editing.permissions,
        [mod]: {
          read: !allTrue,
          create: !allTrue,
          update: !allTrue,
          delete: !allTrue,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) {
      onNotify("Role name is required");
      return;
    }
    const updated: CmsRoleRecord = { ...editing, updatedAt: new Date().toISOString() };
    const next = isNew
      ? [updated, ...roles]
      : roles.map((r) => (r.id === updated.id ? updated : r));
    await onRolesChange(next);
    setEditing(null);
    onNotify(isNew ? "Role created" : "Role updated");
  };

  if (editing) {
    const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none ${
      darkMode
        ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500"
        : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB]"
    }`;

    return (
      <div className="space-y-5 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2A2F3E]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{editing.name || "[Untitled Role]"}</h1>
              <p className="text-xs text-gray-500">{isNew ? "Creating new Role" : "Editing Role & Permissions"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>

        <div
          className={`rounded-xl border p-5 space-y-4 ${
            darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Role Name *</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Content Editor"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Access scope summary"
                className={inputCls}
              />
            </div>
          </div>

          {/* Permission Matrix (Matching Screenshot 8) */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold">Permissions Matrix</h3>
            </div>

            <div className={`rounded-lg border overflow-hidden ${darkMode ? "border-[#2A2F3E]" : "border-[#E5E7EB]"}`}>
              <table className="w-full text-xs text-left">
                <thead className={darkMode ? "bg-[#181B24] text-slate-400" : "bg-[#F9FAFB] text-gray-600"}>
                  <tr>
                    <th className="px-4 py-2.5">Module / Collection</th>
                    <th className="px-4 py-2.5 text-center">Read</th>
                    <th className="px-4 py-2.5 text-center">Create</th>
                    <th className="px-4 py-2.5 text-center">Update</th>
                    <th className="px-4 py-2.5 text-center">Delete</th>
                    <th className="px-4 py-2.5 text-right">All</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-[#222634]" : "divide-gray-200"}`}>
                  {PERMISSION_MODULES.map((mod) => {
                    const g = editing.permissions[mod.key] || {
                      read: false,
                      create: false,
                      update: false,
                      delete: false,
                    };
                    const allChecked = g.read && g.create && g.update && g.delete;
                    return (
                      <tr key={mod.key}>
                        <td className="px-4 py-3 font-medium">{mod.label}</td>
                        {(["read", "create", "update", "delete"] as const).map((action) => (
                          <td key={action} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(g[action])}
                              onChange={() => togglePerm(mod.key, action)}
                              className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleRowAll(mod.key)}
                            className="text-[11px] font-medium text-[#2563EB] hover:underline"
                          >
                            {allChecked ? "Clear" : "Select All"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const columns: TableColumn<CmsRoleRecord>[] = [
    {
      key: "name",
      label: "Role Name",
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setEditing({ ...r });
            setIsNew(false);
          }}
          className="font-semibold text-[#2563EB] hover:underline"
        >
          {r.name}
        </button>
      ),
    },
    { key: "description", label: "Description", render: (r) => <span>{r.description}</span> },
    {
      key: "scope",
      label: "Permissions",
      render: (r) => {
        const enabled = Object.values(r.permissions || {}).reduce(
          (acc, g) => acc + (g.read ? 1 : 0) + (g.create ? 1 : 0) + (g.update ? 1 : 0) + (g.delete ? 1 : 0),
          0
        );
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {enabled} / 28 granted
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: "Updated At",
      render: (r) => <span className="text-gray-500" suppressHydrationWarning>{r.updatedAt ? String(r.updatedAt).slice(0, 10) : "—"}</span>,
    },
  ];

  return (
    <CollectionTableShell
      title={isAr ? "الأدوار والصلاحيات (Roles)" : "Roles"}
      searchPlaceholder="Search by Role Name"
      searchValue={search}
      onSearchChange={setSearch}
      onCreateNew={() => {
        setEditing({
          id: `role-${Date.now()}`,
          name: "",
          description: "",
          permissions: emptyPermissions(),
          updatedAt: new Date().toISOString(),
        });
        setIsNew(true);
      }}
      columns={columns}
      rows={filtered}
      onEdit={(r) => {
        setEditing({ ...r });
        setIsNew(false);
      }}
      onDelete={async (r) => {
        if (!window.confirm(`Delete role "${r.name}"?`)) return;
        await onRolesChange(roles.filter((x) => x.id !== r.id));
        onNotify("Role deleted");
      }}
      darkMode={darkMode}
    />
  );
}
