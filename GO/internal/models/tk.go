package models

import "time"

// TKData represents worker data (Tenaga Kerja)
type TKData struct {
	NIK               string    `db:"nik" json:"nik"`
	Nama              string    `db:"nama" json:"nama"`
	TanggalLahir      time.Time `db:"tanggal_lahir" json:"-"`           // Internal use only
	TanggalLahirStr   string    `db:"-" json:"tanggal_lahir,omitempty"` // For JSON response
	Alamat            *string   `db:"alamat" json:"alamat,omitempty"`
	StatusKepesertaan string    `db:"status_kepesertaan" json:"status_kepesertaan"` // aktif, nonaktif, unknown
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}

// CheckTKRequest represents request to check TK status
type CheckTKRequest struct {
	NIK          string `json:"nik" binding:"required"`
	TanggalLahir string `json:"tanggal_lahir" binding:"required"` // Format: YYYY-MM-DD
}

// CheckTKResponse represents response for TK check (dynamic based on scopes)
type CheckTKResponse map[string]interface{}

// CreateTKDataRequest represents request to create TK data
type CreateTKDataRequest struct {
	NIK               string `json:"nik" binding:"required"`
	Nama              string `json:"nama" binding:"required"`
	TanggalLahir      string `json:"tanggal_lahir" binding:"required"` // Format: YYYY-MM-DD
	Alamat            string `json:"alamat,omitempty"`
	StatusKepesertaan string `json:"status_kepesertaan" binding:"required,oneof=aktif nonaktif unknown"`
}

// UpdateTKDataRequest represents request to update TK data
type UpdateTKDataRequest struct {
	Nama              string `json:"nama,omitempty"`
	TanggalLahir      string `json:"tanggal_lahir,omitempty"` // Format: YYYY-MM-DD
	Alamat            string `json:"alamat,omitempty"`
	StatusKepesertaan string `json:"status_kepesertaan,omitempty" binding:"omitempty,oneof=aktif nonaktif unknown"`
}
