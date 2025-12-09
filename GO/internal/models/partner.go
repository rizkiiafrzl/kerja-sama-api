package models

import (
	"encoding/json"
	"strings"
	"time"
)

// Date is a custom date type that can parse "YYYY-MM-DD" format
type Date struct {
	time.Time
}

// UnmarshalJSON implements json.Unmarshaler for Date
// It accepts both "YYYY-MM-DD" and RFC3339 formats
func (d *Date) UnmarshalJSON(data []byte) error {
	str := strings.Trim(string(data), `"`)
	if str == "" || str == "null" {
		d.Time = time.Time{}
		return nil
	}

	// Try parsing as "YYYY-MM-DD" first
	t, err := time.Parse("2006-01-02", str)
	if err == nil {
		d.Time = t
		return nil
	}

	// Fallback to RFC3339 format
	t, err = time.Parse(time.RFC3339, str)
	if err != nil {
		return err
	}
	d.Time = t
	return nil
}

// MarshalJSON implements json.Marshaler for Date
func (d Date) MarshalJSON() ([]byte, error) {
	if d.Time.IsZero() {
		return []byte("null"), nil
	}
	return json.Marshal(d.Time.Format("2006-01-02"))
}

type Partner struct {
	ID            string     `db:"id" json:"id"`
	CompanyName   string     `db:"company_name" json:"company_name"`
	CompanyID     string     `db:"company_id" json:"company_id"`
	APIKey        *string    `db:"api_key" json:"-"`        // API key untuk authentication
	CompanySecret string     `db:"company_secret" json:"-"` // Deprecated, kept for backward compatibility
	NomorPKS      string     `db:"nomor_pks" json:"nomor_pks"`
	PICName       string     `db:"pic_name" json:"pic_name"`
	PICEmail      string     `db:"pic_email" json:"pic_email"`
	PICPhone      string     `db:"pic_phone" json:"pic_phone"`
	Status        string     `db:"status" json:"status"`    // "Y" = active, "N" = inactive (stored in DB)
	StatusDisplay string     `db:"-" json:"status_display"` // "active" / "inactive" (for UI display)
	ContractStart *time.Time `db:"contract_start" json:"contract_start,omitempty"`
	ContractEnd   *time.Time `db:"contract_end" json:"contract_end,omitempty"`
	Notes         *string    `db:"notes" json:"notes,omitempty"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
}

// CreatePartnerRequest represents request to create a partner
type CreatePartnerRequest struct {
	CompanyName   string   `json:"company_name" binding:"required"`
	CompanyID     string   `json:"company_id,omitempty"` // Optional: if empty, will be auto-generated
	PICName       string   `json:"pic_name" binding:"required"`
	PICEmail      string   `json:"pic_email" binding:"required,email"`
	PICPhone      string   `json:"pic_phone"`
	Notes         string   `json:"notes"`
	Scopes        []string `json:"scopes"`                   // e.g., ["name","tanggal_lahir","status_bpjs","alamat"]
	ContractStart *Date    `json:"contract_start,omitempty"` // Optional: if empty, will be set to today (accepts "YYYY-MM-DD" format)
	ContractEnd   *Date    `json:"contract_end,omitempty"`   // Optional: if empty, will be set to 1 year from today (accepts "YYYY-MM-DD" format)
}

// UpdatePartnerRequest represents request to update a partner
type UpdatePartnerRequest struct {
	CompanyName   string  `json:"company_name,omitempty"`
	CompanyID     string  `json:"company_id,omitempty"` // Allow admin to update company_id
	PICName       string  `json:"pic_name,omitempty"`
	PICEmail      string  `json:"pic_email,omitempty"`
	PICPhone      string  `json:"pic_phone,omitempty"`
	Status        string  `json:"status,omitempty" binding:"omitempty,oneof=Y N active inactive"` // Support both old and new format
	ContractStart *Date   `json:"contract_start,omitempty"`                                       // Accepts "YYYY-MM-DD" format
	ContractEnd   *Date   `json:"contract_end,omitempty"`                                         // Accepts "YYYY-MM-DD" format
	Notes         *string `json:"notes,omitempty"`
}

// PartnerResponse represents partner data in responses
type PartnerResponse struct {
	*Partner
	CompanyIDInfo string `json:"company_id_info,omitempty"` // Informational message about company id
	APIKeyPlain   string `json:"api_key,omitempty"`         // Returned only on creation/reset (plaintext)
}

// MapStatusToDisplay converts DB status (Y/N) to display status (active/inactive)
func MapStatusToDisplay(status string) string {
	if status == "Y" {
		return "active"
	}
	return "inactive"
}

// MapStatusToDB converts display status (active/inactive) to DB status (Y/N)
func MapStatusToDB(statusDisplay string) string {
	if statusDisplay == "active" {
		return "Y"
	}
	return "N"
}

// Constants for partner status (database format: Y/N)
const (
	PartnerStatusActive   = "Y"
	PartnerStatusInactive = "N"
)
