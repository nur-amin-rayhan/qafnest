"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Shield } from "lucide-react";
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
  const [editing, setEditing] = useState<CmsUserRecord | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, search]);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none ${
    darkMode
      ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500"
      : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB]"
  }`;

  const handleSave = async () => {
    if (!editing || !editing.email.trim()) {
      onNotify("Email is required");
      return;
    }
    const updated: CmsUserRecord = { ...editing, updatedAt: new Date().toISOString() };
    const next = isNew
      ? [updated, ...users]
      : users.map((u) => (u.id === updated.id ? updated : u));
    await onUsersChange(next);
    setEditing(null);
    onNotify(isNew ? "User created" : "User updated");
  };

  if (editing) {
    return (
      <div className="space-y-5 max-w-3xl">
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
              <h1 className="text-xl font-bold">{editing.email || "[New User]"}</h1>
              <p className="text-xs text-gray-500">{isNew ? "Creating new User" : "Editing User"}</p>
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Email *</label>
            <input
              type="email"
              value={editing.email}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              placeholder="editor@qafnest.com"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">First Name</label>
              <input
                value={editing.firstName}
                onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Last Name</label>
              <input
                value={editing.lastName}
                onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Role</label>
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
          </div>
        </div>
      </div>
    );
  }

  const columns: TableColumn<CmsUserRecord>[] = [
    {
      key: "email",
      label: "Email",
      render: (u) => (
        <button
          type="button"
          onClick={() => {
            setEditing({ ...u });
            setIsNew(false);
          }}
          className="font-semibold text-[#2563EB] hover:underline"
        >
          {u.email}
        </button>
      ),
    },
    { key: "firstName", label: "First Name", render: (u) => <span>{u.firstName}</span> },
    { key: "lastName", label: "Last Name", render: (u) => <span>{u.lastName}</span> },
    {
      key: "role",
      label: "Role",
      render: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-[#2563EB]">
          {u.role}
        </span>
      ),
    },
  ];

  return (
    <CollectionTableShell
      title={isAr ? "المستخدمون (Users)" : "Users"}
      searchPlaceholder="Search by Email"
      searchValue={search}
      onSearchChange={setSearch}
      onCreateNew={() => {
        setEditing({
          id: `usr-${Date.now()}`,
          email: "",
          firstName: "",
          lastName: "",
          role: roles[0]?.name || "Super Admin",
          updatedAt: new Date().toISOString(),
        });
        setIsNew(true);
      }}
      filterOptions={[
        { label: "All Roles", value: "all" },
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
        if (!window.confirm(`Remove user ${u.email}?`)) return;
        await onUsersChange(users.filter((x) => x.id !== u.id));
        onNotify("User deleted");
      }}
      darkMode={darkMode}
    />
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
