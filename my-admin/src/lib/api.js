import { API_CONFIG, STORAGE_KEYS } from "./config";

/**
 * Get stored admin token
 */
export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.adminToken);
}

/**
 * Set admin token
 */
export function setAdminToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.adminToken, token);
}

/**
 * Remove admin token
 */
export function removeAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.adminToken);
  localStorage.removeItem(STORAGE_KEYS.adminUser);
}

/**
 * Get stored admin user
 */
export function getAdminUser() {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(STORAGE_KEYS.adminUser);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Set admin user
 */
export function setAdminUser(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.adminUser, JSON.stringify(user));
}

/**
 * Make API request to backend
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getAdminToken();
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error("Network error - Backend might not be running:", error);
      throw new Error("Cannot connect to backend. Make sure the backend server is running on " + API_CONFIG.baseURL);
    }
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Admin login
 */
export async function adminLogin(username, password) {
  const response = await apiRequest(API_CONFIG.endpoints.auth.adminLogin, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  console.log("Login response:", response); // Debug log

  if (response.success && response.data) {
    const token = response.data.token || response.data.Token;
    const admin = response.data.admin || response.data.Admin;
    
    if (!token) {
      console.error("Token not found in response:", response);
      throw new Error("Token not received from server");
    }
    
    setAdminToken(token);
    if (admin) {
      setAdminUser(admin);
    }
    return response.data;
  }

  throw new Error(response.message || "Login failed");
}

/**
 * Get all partners
 */
export async function getPartners() {
  const response = await apiRequest(API_CONFIG.endpoints.partners.list, {
    method: "GET",
  });

  if (response.success) {
    return response.data || [];
  }

  throw new Error(response.message || "Failed to fetch partners");
}

/**
 * Create partner
 */
export async function createPartner(partnerData) {
  const response = await apiRequest(API_CONFIG.endpoints.partners.create, {
    method: "POST",
    body: JSON.stringify(partnerData),
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(response.message || "Failed to create partner");
}

/**
 * Update partner
 */
export async function updatePartner(id, partnerData) {
  const response = await apiRequest(API_CONFIG.endpoints.partners.update(id), {
    method: "PUT",
    body: JSON.stringify(partnerData),
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(response.message || "Failed to update partner");
}

/**
 * Delete partner
 */
export async function deletePartner(id) {
  const response = await apiRequest(API_CONFIG.endpoints.partners.delete(id), {
    method: "DELETE",
  });

  if (response.success) {
    return true;
  }

  throw new Error(response.message || "Failed to delete partner");
}

/**
 * Rotate partner secret (returns plaintext once)
 */
export async function rotatePartnerSecret(id) {
  const response = await apiRequest(API_CONFIG.endpoints.partners.rotate(id), {
    method: "POST",
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(response.message || "Failed to rotate secret");
}

