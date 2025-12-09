"use client";

import React, { useEffect, useState } from "react";
import { getAdminToken } from "@/lib/api";
import {
  SCOPE_MAPPING,
  convertScopesFromBackend,
  convertScopesToUpdatePayload,
} from "@/lib/scopes";

function buildDefaultScopesState() {
  return Object.keys(SCOPE_MAPPING).reduce(
    (acc, key) => ({
      ...acc,
      [key]: false,
    }),
    {}
  );
}

export default function EditCompanyModal({ companyId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  // Local copy for display; incoming prop companyId is the identifier used in requests
  const [companyIdState, setCompanyIdState] = useState("");
  const [nomorPks, setNomorPks] = useState("");
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [accessScopes, setAccessScopes] = useState(buildDefaultScopesState);

  useEffect(() => {
    loadCompanyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function loadCompanyData() {
    if (!companyId) {
      setError("Company ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const token = getAdminToken();
    if (!token) {
      setError("Not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const detailRes = await fetch(`/api/companies/${encodeURIComponent(companyId)}`, {
        method: "GET",
        headers,
      });

      const detailData = await detailRes.json().catch(() => ({}));
      if (!detailRes.ok) {
        throw new Error(detailData.message || "Failed to fetch company details");
      }

      const payload = detailData.data || detailData;
      if (!payload || (!payload.id && !payload.ID)) {
        throw new Error("Company data not found");
      }

      setCompanyName(payload.company_name || "");
      setCompanyIdState(payload.company_id || "");
      setNomorPks(payload.nomor_pks || "");
      setPicName(payload.pic_name || "");
      setPicEmail(payload.pic_email || "");
      setPicPhone(payload.pic_phone || "");
      // Handle status: support both "Y"/"N" and "active"/"inactive"
      const statusValue = payload.status_display || payload.status || "active";
      setStatus(statusValue === "Y" ? "active" : statusValue === "N" ? "inactive" : statusValue);
      setContractStart(payload.contract_start ? payload.contract_start.split('T')[0] : "");
      setContractEnd(payload.contract_end ? payload.contract_end.split('T')[0] : "");
      setNotes(payload.notes || "");

      try {
        const scopesRes = await fetch(
          `/api/companies/${encodeURIComponent(companyId)}/scopes`,
          {
            method: "GET",
            headers,
          }
        );
        const scopesData = await scopesRes.json().catch(() => ({}));
        if (scopesRes.ok) {
          const normalized = convertScopesFromBackend(scopesData.data || scopesData || []);
          setAccessScopes({
            ...buildDefaultScopesState(),
            ...normalized,
          });
        } else {
          console.warn("Failed to fetch scopes:", scopesData);
          setAccessScopes(buildDefaultScopesState());
        }
      } catch (scopeErr) {
        console.warn("Error loading scopes:", scopeErr);
        setAccessScopes(buildDefaultScopesState());
      }
    } catch (err) {
      console.error("loadCompanyData error:", err);
      setError(err.message || "Failed to load company data");
    } finally {
      setLoading(false);
    }
  }

  function toggleScope(key) {
    setAccessScopes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handlePhoneChange(e) {
    const value = e.target.value;
    // Only allow digits
    const cleaned = value.replace(/[^0-9]/g, '');
    // Max 13 digits
    if (cleaned.length <= 13) {
      setPicPhone(cleaned);
    }
  }

  function validatePhone(phone) {
    if (!phone || !phone.trim()) return ""; // Phone is optional
    
    // Remove spaces, dashes, etc
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Check max 13 digits
    if (cleaned.length > 13) {
      return "Phone number must be maximum 13 digits";
    }
    
    // Check only digits
    if (cleaned.length > 0 && !/^[0-9]+$/.test(cleaned)) {
      return "Phone number must contain only digits";
    }
    
    return "";
  }

  function validateContractDates(start, end) {
    if (start && end && new Date(start) > new Date(end)) {
      return "Contract end date must be after start date";
    }
    return "";
  }

  function validate() {
    if (!companyName.trim()) return "Company Name is required.";
    if (!picName.trim()) return "PIC Name is required.";
    if (!picEmail.trim()) return "PIC Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(picEmail.trim())) return "PIC Email is invalid.";
    if (!status) return "Status is required.";
    
    // Validate phone
    const phoneError = validatePhone(picPhone);
    if (phoneError) return phoneError;
    
    // Validate contract dates
    const contractError = validateContractDates(contractStart, contractEnd);
    if (contractError) return contractError;
    
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setError("Not authenticated. Please login again.");
      return;
    }

    setSaving(true);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const updatePayload = {
        company_name: companyName.trim(),
        company_id: companyIdState.trim(), // Always include company_id (even if empty, backend will handle it)
        pic_name: picName.trim(),
        pic_email: picEmail.trim(),
        pic_phone: picPhone.trim(),
        status, // Send "active" or "inactive", backend will convert to "Y" or "N"
        contract_start: contractStart || undefined,
        contract_end: contractEnd || undefined,
        notes,
      };

      console.log("Update payload:", updatePayload);
      console.log("Company ID state:", companyIdState);
      console.log("Company ID (param):", companyId);

      const updateRes = await fetch(`/api/companies/${encodeURIComponent(companyId)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatePayload),
      });
      
      const updateData = await updateRes.json().catch(() => ({}));
      console.log("Update response:", { status: updateRes.status, data: updateData });
      
      if (!updateRes.ok || updateData.success === false) {
        throw new Error(updateData.message || "Failed to update company");
      }

      const scopesPayload = {
        scopes: convertScopesToUpdatePayload(accessScopes),
      };

      const scopesRes = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/scopes`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(scopesPayload),
        }
      );
      const scopesData = await scopesRes.json().catch(() => ({}));
      if (!scopesRes.ok || scopesData.success === false) {
        throw new Error(scopesData.message || "Failed to update access scopes");
      }

      console.log("Update successful! Closing modal and refreshing data...");
      
      // Close modal first
      if (typeof onClose === "function") {
        onClose();
      }
      
      // Then refresh data (with small delay to ensure modal is closed)
      if (typeof onSuccess === "function") {
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      setError(err.message || "Failed to update company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ac-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="ac-modal w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Edit Company</h3>
            <p className="text-sm text-slate-500">
              Perbarui detail perusahaan dan hak akses.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-500">Loading company data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h4 className="text-base font-semibold text-slate-800 mb-4">
                Company Details
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Company Name *</span>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Company ID</span>
                    <input
                      value={companyIdState}
                      onChange={(e) => setCompanyIdState(e.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">PKS Number</span>
                    <input
                      value={nomorPks}
                      readOnly
                      className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Status *</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Contract Start Date</span>
                    <input
                      type="date"
                      value={contractStart}
                      onChange={(e) => setContractStart(e.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Contract End Date</span>
                    <input
                      type="date"
                      value={contractEnd}
                      onChange={(e) => setContractEnd(e.target.value)}
                      min={contractStart || undefined}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h4 className="text-base font-semibold text-slate-800">
                Penanggung Jawab (PIC)
              </h4>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Nama PIC *</span>
                  <input
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Email PIC *</span>
                  <input
                    type="email"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-medium">No Telepon PIC</span>
                  <input
                    type="tel"
                    value={picPhone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    pattern="[0-9]*"
                    placeholder="081234567890"
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <span className="text-xs text-slate-500 mt-1">
                    Maksimal 13 digit, hanya angka
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h4 className="text-base font-semibold text-slate-800 mb-4">
                Access Permissions
              </h4>
              <div className="space-y-4">
                {/* Basic Access */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Access
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ScopeToggle
                      label="Lihat Nama"
                      checked={accessScopes.lihat_nama}
                      onChange={() => toggleScope("lihat_nama")}
                    />
                    <ScopeToggle
                      label="Lihat Tanggal Lahir"
                      checked={accessScopes.lihat_tanggal_lahir}
                      onChange={() => toggleScope("lihat_tanggal_lahir")}
                    />
                    <ScopeToggle
                      label="Lihat Status Kepesertaan"
                      checked={accessScopes.lihat_status_kepesertaan}
                      onChange={() => toggleScope("lihat_status_kepesertaan")}
                    />
                  </div>
                </div>

                {/* Extended Access */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Extended Access
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ScopeToggle
                      label="Lihat Alamat"
                      checked={accessScopes.lihat_alamat}
                      onChange={() => toggleScope("lihat_alamat")}
                    />
                    <ScopeToggle
                      label="Lihat Faskes"
                      checked={accessScopes.lihat_faskes}
                      onChange={() => toggleScope("lihat_faskes")}
                    />
                    <ScopeToggle
                      label="Lihat Riwayat Iuran"
                      checked={accessScopes.lihat_riwayat_iuran}
                      onChange={() => toggleScope("lihat_riwayat_iuran")}
                    />
                    <ScopeToggle
                      label="Lihat Domisili"
                      checked={accessScopes.lihat_domisili}
                      onChange={() => toggleScope("lihat_domisili")}
                    />
                  </div>
                </div>

                {/* Restricted Access */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Restricted Access
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ScopeToggle
                      label="Terdaftar / Tidak"
                      checked={accessScopes.terdaftar_tidak}
                      onChange={() => toggleScope("terdaftar_tidak")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <label className="flex flex-col">
                <span className="text-sm font-medium">Notes / Remarks</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ScopeToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-white transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
      />
      <span className="text-sm text-slate-600 group-hover:text-slate-800">
        {label}
      </span>
    </label>
  );
}


