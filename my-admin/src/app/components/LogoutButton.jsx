"use client";

import { removeAdminToken, getAdminUser } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const adminUser = getAdminUser();

  function handleLogout() {
    removeAdminToken();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {adminUser && (
        <span className="text-sm text-slate-600">
          {adminUser.username} ({adminUser.role})
        </span>
      )}
      <button
        onClick={handleLogout}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Logout
      </button>
    </div>
  );
}

