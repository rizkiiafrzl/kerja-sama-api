// Backend API configuration
// Backend runs on port 3000, Frontend runs on port 3001
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  endpoints: {
    auth: {
      adminLogin: "/api/v1/auth/admin/login",
    },
    partners: {
      list: "/admin/partners",
      create: "/admin/partners",
      get: (id) => `/admin/partners/${id}`,
      update: (id) => `/admin/partners/${id}`,
      delete: (id) => `/admin/partners/${id}`,
      scopes: (id) => `/admin/partners/${id}/scopes`,
      reveal: (id) => `/admin/partners/${id}/reveal-api-key`,
      reset: (id) => `/admin/partners/${id}/reset-api-key`,
    },
  },
};

// Storage keys
export const STORAGE_KEYS = {
  adminToken: "admin_token",
  adminUser: "admin_user",
};

