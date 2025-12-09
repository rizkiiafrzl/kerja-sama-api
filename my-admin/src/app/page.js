"use client";

import { useState } from "react";
import AddCompanyForm from "./components/AddCompanyForm";
import CompanyList from "./components/CompanyList";
import LogoutButton from "./components/LogoutButton";
import AuthGuard from "./components/AuthGuard";

function HomeContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleCompanyAdded() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin Dashboard
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            Companies
          </h2>
          <AddCompanyForm onSuccess={handleCompanyAdded} />
        </section>

        <section>
          <CompanyList key={refreshKey} onRefresh={refreshKey} />
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
