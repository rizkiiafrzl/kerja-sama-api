package models

// PartnerScope represents access scope permissions for a partner
type PartnerScope struct {
	ID        string `db:"id" json:"id"`
	PartnerID string `db:"partner_id" json:"partner_id"`
	ScopeName string `db:"scope_name" json:"scope_name"` // e.g., "name", "tanggal_lahir", "status_bpjs", "alamat"
	Enabled   bool   `db:"enabled" json:"enabled"`
}

// UpdateScopesRequest represents request to update partner scopes
type UpdateScopesRequest struct {
	Scopes []ScopeItem `json:"scopes" binding:"required"`
}

// ScopeItem represents a single scope configuration
type ScopeItem struct {
	ScopeName string `json:"scope_name" binding:"required"`
	Enabled   bool   `json:"enabled"`
}

// Available scope names
const (
	ScopeName         = "name"
	ScopeTanggalLahir = "tanggal_lahir"
	ScopeStatusBPJS   = "status_bpjs"
	ScopeAlamat       = "alamat"
)

// DefaultScopes returns the default scopes for a new partner
func DefaultScopes() []string {
	return []string{
		ScopeName,
		ScopeTanggalLahir,
		ScopeStatusBPJS,
	}
}
