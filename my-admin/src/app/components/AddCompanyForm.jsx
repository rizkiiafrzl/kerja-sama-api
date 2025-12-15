"use client";

import React, { useEffect, useState } from "react";
import { getAdminToken } from "@/lib/api";

export default function AddCompanyForm({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [nomorPks, setNomorPks] = useState("");
  const [pksGenerated, setPksGenerated] = useState(false);

  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");

  // Status always active for new companies

  // Access scopes default values
  const [accessScopes, setAccessScopes] = useState({
    lihat_nama: true,
    lihat_tanggal_lahir: true,
    lihat_status_kepesertaan: true,
    lihat_alamat: false,
  });

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Set default contract dates on mount
  useEffect(() => {
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const endDateStr = oneYearLater.toISOString().split('T')[0];
    
    setContractStart(todayStr);
    setContractEnd(endDateStr);
  }, []);

  useEffect(() => {
    // Auto-generate company code when companyName changes.
    // Only auto-generate if company_id is empty (user hasn't manually entered one)
    if (!companyName.trim()) {
      if (!companyId) {
      setCompanyId("");
      }
      return;
    }

    // Don't auto-generate if user has manually entered a company_id
    if (companyId && companyId.trim() !== "") {
      return;
    }

    const controller = new AbortController();
    const name = companyName;

    // Debounce a bit
    const timeoutId = setTimeout(() => {
      fetch(`/api/companies/generate?name=${encodeURIComponent(name)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          // Only set if company_id is still empty (user hasn't typed in the meantime)
          if (data?.company_id && !companyId) {
            setCompanyId(data.company_id);
          }
        })
        .catch(() => {
          // fallback generation client-side
          if (!companyId) {
          const code = generateLocalCompanyCode(name);
          setCompanyId(code);
          }
        });
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [companyName, companyId]);

  function generateLocalCompanyCode(name) {
    const onlyLetters = (name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const letters = onlyLetters.slice(0, 3).padEnd(3, "X");
    // Local demo sequence: timestamp % 1000 (not suitable for production)
    const seq = (Date.now() % 1000).toString().padStart(3, "0");
    return `PT-${letters}-${seq}`;
  }

  async function handleGeneratePks() {
    if (!companyName.trim()) {
      setError("Please enter Company Name first to generate PKS.");
      return;
    }
    setError("");
    try {
      const resp = await fetch(
        `/api/companies/generate?name=${encodeURIComponent(companyName)}&pks=1`
      );
      const data = await resp.json();
      if (data?.nomor_pks) {
        setNomorPks(data.nomor_pks);
        setPksGenerated(true);
      } else {
        // fallback
        const fallback = `PKS-${new Date().getFullYear()}-${(Date.now() % 1000)
          .toString()
          .padStart(3, "0")}`;
        setNomorPks(fallback);
        setPksGenerated(true);
      }
    } catch (err) {
      setError("Failed to generate PKS.");
    }
  }

  function toggleScope(key) {
    setAccessScopes((s) => ({ ...s, [key]: !s[key] }));
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
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(picEmail)) return "PIC Email is invalid.";
    
    // Validate phone
    const phoneError = validatePhone(picPhone);
    if (phoneError) return phoneError;
    
    // Validate contract dates
    const contractError = validateContractDates(contractStart, contractEnd);
    if (contractError) return contractError;
    
    return "";
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const v = validate();
    if (v) return setError(v);

    // Build payload, only include fields with values
    const payload = {
      name: companyName.trim(),
      pic_name: picName.trim(),
      pic_email: picEmail.trim(),
      pic_phone: picPhone.trim() || "",
      access_scopes: accessScopes,
      notes: notes || "",
    };

    // Add optional fields only if they have values
    if (companyId && companyId.trim()) {
      payload.company_id = companyId.trim();
    }
    if (contractStart && contractStart.trim()) {
      payload.contract_start = contractStart.trim();
    }
    if (contractEnd && contractEnd.trim()) {
      payload.contract_end = contractEnd.trim();
    }

    setSubmitting(true);
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated. Please login again.");
      }

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `Server error (${res.status})`;
        try {
          const data = await res.json();
          console.error("API Error:", { status: res.status, data });
          errorMessage = data.message || data.error || data.detail || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
          const text = await res.text().catch(() => "");
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      // Backend returns: { success: true, data: { partner: {...}, company_code: "...", ... } }
      const partnerId = data?.data?.partner?.id || data?.data?.id || data?.id || "-";
      const companyCode = data?.data?.company_id || data?.data?.partner?.company_id || "";
      const companySecret = data?.data?.company_secret;
      setSuccessMsg(
        `Company added successfully!${partnerId !== "-" ? ` ID: ${partnerId}` : ""}${
          companyCode ? ` Company ID: ${companyCode}` : ""
        }${companySecret ? ` Secret: ${companySecret}` : ""}`
      );
      
      // Call onSuccess callback to refresh company list
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form and close modal
      setOpen(false);
      setCompanyName("");
      setCompanyId("");
      setNomorPks("");
      setPicName("");
      setPicEmail("");
      setPicPhone("");
      setNotes("");
      setPksGenerated(false);
      // Reset contract dates to defaults
      const today = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      setContractStart(today.toISOString().split('T')[0]);
      setContractEnd(oneYearLater.toISOString().split('T')[0]);
      setAccessScopes({
        lihat_nama: true,
        lihat_tanggal_lahir: true,
        lihat_status_kepesertaan: true,
        lihat_alamat: false,
        lihat_faskes: false,
        lihat_riwayat_iuran: false,
        lihat_domisili: false,
        terdaftar_tidak: false,
      });
      // Status always active
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const errorMsg = err?.message || err?.toString() || "Failed to create company";
      setError(errorMsg);
      console.error("Set error message:", errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-3 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        onClick={() => setOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Add New Company
      </button>

      {open && (
        <div className="ac-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="ac-modal w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Add New Company
                </h3>
                <p className="text-sm text-slate-500">
                  Lengkapi detail perusahaan sebelum menyimpan.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full border border-slate-200 px-3 py-1 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

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
                      <span className="text-sm font-medium">
                        Company ID (optional)
                      </span>
                      <div className="mt-1 flex gap-2">
                        <input
                          value={companyId}
                          onChange={(e) => setCompanyId(e.target.value)}
                          placeholder="Leave empty to auto-generate"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (companyName.trim()) {
                              const code = generateLocalCompanyCode(companyName);
                              setCompanyId(code);
                            }
                          }}
                          disabled={!companyName.trim()}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Generate
                        </button>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex flex-col">
                      <span className="text-sm font-medium">
                        PKS Number
                      </span>
                      <div className="mt-1 flex gap-2">
                        <input
                          value={nomorPks}
                          onChange={(e) => setNomorPks(e.target.value)}
                          placeholder="Leave empty to auto-generate"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        
                      </div>
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
                      <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={accessScopes.lihat_nama}
                          onChange={() => toggleScope("lihat_nama")}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">
                          Lihat Nama
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={accessScopes.lihat_tanggal_lahir}
                          onChange={() => toggleScope("lihat_tanggal_lahir")}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">
                          Lihat Tanggal Lahir
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={accessScopes.lihat_status_kepesertaan}
                          onChange={() => toggleScope("lihat_status_kepesertaan")}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">
                          Lihat Status Kepesertaan
                        </span>
                      </label>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={accessScopes.lihat_alamat}
                          onChange={() => toggleScope("lihat_alamat")}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">
                          Lihat Alamat
                        </span>
                      </label>
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Adding..." : "Add Company"}
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-emerald-600">
                  {successMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
