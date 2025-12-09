// Mapping between frontend scope keys and backend scope names
export const SCOPE_MAPPING = {
  lihat_nama: "name",
  lihat_tanggal_lahir: "tanggal_lahir",
  lihat_status_kepesertaan: "status_bpjs",
  lihat_alamat: "alamat",
};

// Reverse mapping (backend -> frontend)
export const REVERSE_SCOPE_MAPPING = Object.fromEntries(
  Object.entries(SCOPE_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Convert frontend scope object to backend scope array
 * @param {Object} frontendScopes - Object with keys like "lihat_nama", "lihat_tanggal_lahir", etc.
 * @returns {Array<string>} Array of enabled scope names for backend
 */
export function convertScopesToBackend(frontendScopes) {
  const scopes = [];
  for (const [frontendKey, enabled] of Object.entries(frontendScopes)) {
    if (enabled && SCOPE_MAPPING[frontendKey]) {
      scopes.push(SCOPE_MAPPING[frontendKey]);
    }
  }
  return scopes;
}

/**
 * Convert backend scope array to frontend scope object
 * @param {Array<{scope_name: string, enabled: boolean}>} backendScopes
 * @returns {Object} Object with frontend keys
 */
export function convertScopesFromBackend(backendScopes) {
  const frontendScopes = {};
  
  // Initialize all scopes as false
  for (const frontendKey of Object.keys(SCOPE_MAPPING)) {
    frontendScopes[frontendKey] = false;
  }
  
  // Set enabled scopes
  for (const scope of backendScopes || []) {
    const frontendKey = REVERSE_SCOPE_MAPPING[scope.scope_name];
    if (frontendKey) {
      frontendScopes[frontendKey] = scope.enabled;
    }
  }
  
  return frontendScopes;
}

/**
 * Convert frontend scope object to backend update payload (with enabled flag).
 * @param {Object} frontendScopes
 * @returns {Array<{scope_name: string, enabled: boolean}>}
 */
export function convertScopesToUpdatePayload(frontendScopes) {
  const payload = [];
  for (const [frontendKey, enabled] of Object.entries(frontendScopes || {})) {
    const scopeName = SCOPE_MAPPING[frontendKey];
    if (!scopeName) continue;
    payload.push({
      scope_name: scopeName,
      enabled: Boolean(enabled),
    });
  }
  return payload;
}


