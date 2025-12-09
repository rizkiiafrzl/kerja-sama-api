"use client";

import React, { useEffect, useState, useRef } from "react";
import { getAdminToken, removeAdminToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import CompanyActions from "./CompanyActions";
import EditCompanyModal from "./EditCompanyModal";

export default function CompanyList({ onRefresh }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh]);

  async function fetchCompanies() {
    setLoading(true);
    setError("");
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/companies", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          removeAdminToken();
          router.push("/");
          return;
        }
        const data = await res.json().catch(() => ({ message: "Server error" }));
        throw new Error(data.message || "Failed to fetch companies");
      }

      const data = await res.json();
      const companiesList = data.data || [];
      
      // Debug: log response to check structure
      console.log("Companies response:", { data, companiesList });
      if (companiesList.length > 0) {
        console.log("First company structure:", companiesList[0]);
        console.log("First company ID:", companiesList[0].id, companiesList[0].ID);
      }
      
      // Ensure all companies have id field (normalize from backend response)
      const companiesWithId = companiesList
        .map((c, index) => {
          // Backend should return 'id' field, but handle different formats
          const companyId = c.id || c.ID || c.partner_id || c.partnerId;
          if (!companyId) {
            console.error(`Company at index ${index} missing ID:`, c);
            return null;
          }
          // Ensure ID is a valid string
          const normalizedId = String(companyId).trim();
          if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
            console.error(`Company at index ${index} has invalid ID:`, normalizedId);
            return null;
          }
          return {
            ...c,
            id: normalizedId, // Normalize to lowercase 'id' and ensure it's a string
          };
        })
        .filter((c) => c !== null && c.id && c.id !== "undefined" && c.id !== "null"); // Filter out companies without valid ID
      
      console.log("Companies with ID:", companiesWithId);
      console.log("Setting companies state, count:", companiesWithId.length);
      setCompanies(companiesWithId);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  // Debug: log current state
  console.log("CompanyList render - loading:", loading, "error:", error, "companies count:", companies.length);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        <p>Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-12 text-center text-red-600 shadow-sm">
        <p>{error}</p>
        <button
          onClick={fetchCompanies}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
        <p>No companies yet. Add your first company to get started.</p>
      </div>
    );
  }

  function handleDetail(company) {
    console.log("handleDetail called with:", company);
    const companyId = company?.id || company?.ID;
    if (!companyId || companyId === "undefined" || companyId === "null") {
      console.error("Company ID is missing or invalid:", { company, id: companyId });
      alert(`Error: Company ID is missing or invalid. ID: ${companyId}`);
      return;
    }
    console.log("Setting selected company with ID:", companyId);
    setSelectedCompany({ ...company, id: String(companyId).trim() });
    setShowDetail(true);
  }

  function handleEdit(company) {
    const companyId = company?.id || company?.ID;
    if (!companyId) {
      console.error("Company ID is missing:", company);
      alert("Error: Company ID is missing");
      return;
    }
    setSelectedCompany({ ...company, id: String(companyId).trim() });
    setShowEdit(true);
  }

  async function handleDelete(company) {
    if (!confirm(`Are you sure you want to delete "${company.company_name}"?`)) {
      return;
    }

    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`/api/companies/${company.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Server error" }));
        throw new Error(data.message || "Failed to delete company");
      }

      // Refresh list
      fetchCompanies();
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      alert(err.message || "Failed to delete company");
    }
  }

  // Log before render to confirm we reach this point
  console.log("CompanyList: Rendering table with", companies.length, "companies");
  
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Company Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                PKS Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                PIC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {companies.map((company) => (
              <tr
                key={company.id || `company-${company.company_id}`}
                className="hover:bg-slate-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {company.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                    {company.company_id}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {company.nomor_pks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <div>
                    <div className="font-medium">{company.pic_name}</div>
                    <div className="text-xs text-slate-500">{company.pic_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (company.status_display || company.status) === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {company.status_display || company.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(company.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {company.id ? (
                    <CompanyActions
                      company={company}
                      onDetail={handleDetail}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ) : (
                    <span className="text-xs text-red-500">No ID</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detail Modal (rendered outside table container) */}
      {showDetail && selectedCompany && selectedCompany.id && (
        <DetailModal
          company={selectedCompany}
          onClose={() => {
            setShowDetail(false);
            setSelectedCompany(null);
          }}
        />
      )}

      {/* Edit Modal (rendered outside table container) */}
      {showEdit && selectedCompany && selectedCompany.id && (
        <EditCompanyModal
          companyId={selectedCompany.id}
          onClose={() => {
                setShowEdit(false);
                setSelectedCompany(null);
              }}
          onSuccess={() => {
            fetchCompanies();
            if (typeof onRefresh === "function") {
              onRefresh();
            }
          }}
        />
      )}
    </>
  );
}

// Detail Modal Component
function DetailModal({ company, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyData, setCompanyData] = useState(company);
  const [scopes, setScopes] = useState([]);
  const [validCompanyId, setValidCompanyId] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newSecret, setNewSecret] = useState("");
  const [secretMode, setSecretMode] = useState("reset"); // "reset" or "reveal"
  const ALLOWED_SCOPE_NAMES = ["name", "tanggal_lahir", "status_bpjs", "alamat"];

  useEffect(() => {
    // Validate company and ID before fetching
    if (!company) {
      console.error("DetailModal: Company is missing");
      setError("Company data is missing");
      setLoading(false);
      return;
    }
    
    // Try to get ID from various possible fields
    const rawId = company.id || company.ID || company.partner_id || company.partnerId;
    console.log("DetailModal: Raw company data:", company);
    console.log("DetailModal: Raw ID:", rawId, "Type:", typeof rawId);
    
    // Normalize ID to string
    if (!rawId) {
      console.error("DetailModal: No ID found in company object", company);
      setError("Invalid company ID. Please refresh the page.");
      setLoading(false);
      return;
    }
    
    // Convert to string and trim
    const normalizedId = String(rawId).trim();
    if (!normalizedId || normalizedId === "undefined" || normalizedId === "null" || normalizedId === "") {
      console.error("DetailModal: Invalid normalized ID:", normalizedId);
      setError("Invalid company ID. Please refresh the page.");
      setLoading(false);
      return;
    }
    
    console.log("DetailModal: Valid company ID:", normalizedId);
    setValidCompanyId(normalizedId);
    setLoading(true);
    setError("");
  }, [company]);

  useEffect(() => {
    if (validCompanyId) {
      fetchCompanyDetail(validCompanyId);
    }
  }, [validCompanyId]);

  async function fetchCompanyDetail(companyId) {
    if (!companyId) {
      console.error("fetchCompanyDetail: No company ID provided");
      setError("Company ID is missing");
      setLoading(false);
      return;
    }
    
    console.log("fetchCompanyDetail: Fetching company with ID:", companyId);
    setLoading(true);
    setError("");
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Fetch company details
      const url = `/api/companies/${encodeURIComponent(companyId)}`;
      console.log("Fetching from URL:", url, "Company ID:", companyId);
      
      let res;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (fetchError) {
        console.error("Network error fetching company details:", fetchError);
        throw new Error(`Network error: ${fetchError.message || "Failed to connect to server"}`);
      }

      if (!res.ok) {
        let errorMessage = `Failed to fetch company details (${res.status})`;
        let errorData = null;
        
        try {
          // Try to get response as text first
          const responseText = await res.text();
          console.error("Error response text:", responseText, "Status:", res.status);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (jsonError) {
              // If not JSON, use text as error message
              errorMessage = responseText || errorMessage;
            }
          }
          
          console.error("Failed to fetch company details:", { 
            status: res.status, 
            statusText: res.statusText,
            errorData, 
            responseText,
            companyId,
            url 
          });
        } catch (parseError) {
          console.error("Failed to parse error response:", { 
            status: res.status, 
            statusText: res.statusText,
            parseError, 
            companyId,
            url 
          });
          errorMessage = `Server returned ${res.status} ${res.statusText || "Unknown error"}`;
        }
        
        // Provide more specific error messages based on status code
        if (res.status === 400) {
          errorMessage = errorMessage || "Invalid company ID or request format";
        } else if (res.status === 401) {
          errorMessage = "Unauthorized. Please login again.";
        } else if (res.status === 404) {
          errorMessage = "Company not found";
        } else if (res.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await res.json();
        console.log("Company detail response:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response format from server");
      }
      
      if (data.success && data.data) {
        setCompanyData(data.data);
      } else if (data.data) {
        setCompanyData(data.data);
      } else if (data.id) {
        // Direct partner object
        setCompanyData(data);
      } else {
        // Fallback to original company data if response format is unexpected
        console.warn("Unexpected response format, using original company data:", { response: data, company });
        if (company) {
          setCompanyData(company);
        } else {
          setError("Unable to load company details: unexpected response format");
        }
      }

      // Fetch scopes (use the same companyId from parameter)
      if (companyId && companyId !== "undefined" && companyId !== "null") {
        try {
          const scopesUrl = `/api/companies/${encodeURIComponent(companyId)}/scopes`;
          console.log("Fetching scopes from URL:", scopesUrl);
          const scopesRes = await fetch(scopesUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (scopesRes.ok) {
            const scopesData = await scopesRes.json();
            setScopes(scopesData.data || []);
          }
        } catch (scopeErr) {
          // Ignore scope fetch errors, just log
          console.warn("Failed to fetch scopes:", scopeErr);
        }
      }
    } catch (err) {
      console.error("Error in fetchCompanyDetail:", err);
      let errorMessage = "Failed to load company details";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object") {
        errorMessage = err.message || err.toString() || JSON.stringify(err);
      }
      console.error("Setting error message:", errorMessage);
      setError(errorMessage);
      // Fallback to original company data
      setCompanyData(company);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealAPIKey() {
    if (!validCompanyId) return;
    setRevealing(true);
    setError("");
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const res = await fetch(
        `/api/companies/${encodeURIComponent(validCompanyId)}/reveal-api-key`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to reveal API key");
      }

      const apiKey = data?.data?.api_key;
      if (apiKey) {
        setNewSecret(apiKey);
        setSecretMode("reveal");
        setShowSecretModal(true);
      }
    } catch (err) {
      console.error("Reveal API key error:", err);
      setError(err.message || "Failed to reveal API key");
    } finally {
      setRevealing(false);
    }
  }

  async function handleResetAPIKey() {
    if (!validCompanyId) return;
    setResetting(true);
    setError("");
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const res = await fetch(
        `/api/companies/${encodeURIComponent(validCompanyId)}/reset-api-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to reset API key");
      }

      const apiKey = data?.data?.api_key;
      if (apiKey) {
        setNewSecret(apiKey);
        setSecretMode("reset");
        setShowSecretModal(true);
        // Refresh company data after reset
        if (validCompanyId) {
          fetchCompanyDetail(validCompanyId);
        }
      }
    } catch (err) {
      console.error("Reset API key error:", err);
      setError(err.message || "Failed to reset API key");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Company Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="text-slate-600">Loading company details...</div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-500">Company Name</label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {companyData.company_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Company ID</label>
                <p className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded">
                  {companyData.company_id}
                </p>
              </div>
              <div className="col-span-2">
                <div className="flex-1 mb-2">
                  <label className="text-sm font-medium text-slate-500">API Key</label>
                  <p className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded">
                    ************ (hidden)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    API Key hanya tampil sekali saat dibuat, reveal, atau reset. Gunakan di header X-API-KEY untuk autentikasi.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRevealAPIKey}
                    className="h-10 rounded-md bg-slate-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-500"
                    disabled={revealing || resetting}
                  >
                    {revealing ? "Revealing..." : "Reveal API Key"}
                  </button>
                  <button
                    onClick={handleResetAPIKey}
                    className="h-10 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    disabled={revealing || resetting}
                  >
                    {resetting ? "Resetting..." : "Reset API Key"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">PKS Number</label>
                <p className="mt-1 text-sm text-slate-900">{companyData.nomor_pks}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Status</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (companyData.status_display || companyData.status) === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {companyData.status_display || companyData.status}
                  </span>
                </p>
              </div>
              {companyData.contract_start && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Contract Start</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(companyData.contract_start).toLocaleDateString()}
                  </p>
                </div>
              )}
              {companyData.contract_end && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Contract End</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(companyData.contract_end).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-500">PIC Name</label>
                <p className="mt-1 text-sm text-slate-900">{companyData.pic_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">PIC Email</label>
                <p className="mt-1 text-sm text-slate-900">{companyData.pic_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">PIC Phone</label>
                <p className="mt-1 text-sm text-slate-900">{companyData.pic_phone || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Created At</label>
                <p className="mt-1 text-sm text-slate-900">
                  {new Date(companyData.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {companyData.notes && (
              <div>
                <label className="text-sm font-medium text-slate-500">Notes</label>
                <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
                  {companyData.notes}
                </p>
              </div>
            )}

            {/* Access Scopes */}
            {scopes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-500 mb-3 block">
                  Access Permissions
                </label>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    {scopes
                      .filter((scope) => ALLOWED_SCOPE_NAMES.includes(scope.scope_name))
                      .map((scope) => (
                      <div
                        key={scope.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {scope.enabled ? (
                          <svg
                            className="h-4 w-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span
                          className={scope.enabled ? "text-slate-900" : "text-slate-500"}
                        >
                          {scope.scope_name.replace(/_/g, " ").replace(/\b\w/g, (l) =>
                            l.toUpperCase()
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Close
          </button>
        </div>
      </div>

      {/* Secret Modal */}
      {showSecretModal && (
        <SecretModal
          secret={newSecret}
          mode={secretMode}
          onClose={() => {
            setShowSecretModal(false);
            setNewSecret("");
          }}
        />
      )}
    </div>
  );
}

// API Key Modal Component
function SecretModal({ secret, mode = "reset", onClose }) {
  const [copied, setCopied] = useState(false);
  const textRef = React.useRef(null);

  // Focus modal when it opens
  React.useEffect(() => {
    // Small delay to ensure modal is rendered
    const timer = setTimeout(() => {
      if (textRef.current) {
        textRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Method 1: Use execCommand (more reliable, works even when document not focused)
    const textArea = document.createElement("textarea");
    textArea.value = secret;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback to clipboard API
        fallbackClipboardAPI();
      }
    } catch (err) {
      console.error("execCommand failed:", err);
      // Fallback to clipboard API
      fallbackClipboardAPI();
    } finally {
      document.body.removeChild(textArea);
    }
  }

  async function fallbackClipboardAPI() {
    try {
      // Try modern clipboard API as fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Last resort: Select text for manual copy
        if (textRef.current) {
          textRef.current.select();
          textRef.current.setSelectionRange(0, secret.length);
          alert("Please manually copy the text (Ctrl+C or Cmd+C)");
        }
      }
    } catch (err) {
      console.error("Clipboard API failed:", err);
      // Last resort: Select text for manual copy
      if (textRef.current) {
        textRef.current.select();
        textRef.current.setSelectionRange(0, secret.length);
        alert("Please manually copy the text (Ctrl+C or Cmd+C)");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === "reveal" ? "API Key Aktif" : "API Key Baru"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "reveal"
              ? "Ini adalah API key aktif saat ini. Copy sekarang, tidak akan ditampilkan lagi."
              : "API key baru sudah dibuat. Copy sekarang, key lama otomatis tidak berlaku."}
            {" "}Gunakan di header X-API-KEY untuk autentikasi.
          </p>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={textRef}
                type="text"
                readOnly
                value={secret}
                className="flex-1 font-mono text-sm text-slate-900 bg-transparent border-none outline-none cursor-text"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                onMouseDown={(e) => e.preventDefault()}
                type="button"
                className="flex-shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

