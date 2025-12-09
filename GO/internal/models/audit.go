package models

import (
	"encoding/json"
	"time"
)

// AuditLog represents an audit log entry for TK checking
type AuditLog struct {
	ID              string          `db:"id" json:"id"`
	PartnerID       string          `db:"partner_id" json:"partner_id"`
	UserID          *string         `db:"user_id" json:"user_id,omitempty"`
	NIK             string          `db:"nik" json:"nik"`
	ScopesUsed      json.RawMessage `db:"scopes_used" json:"scopes_used"`           // JSONB - scopes used in this check
	RequestPayload  json.RawMessage `db:"request_payload" json:"request_payload"`   // JSONB
	ResponsePayload json.RawMessage `db:"response_payload" json:"response_payload"` // JSONB
	CreatedAt       time.Time       `db:"created_at" json:"created_at"`
}

// CreateAuditLogRequest represents data needed to create an audit log
type CreateAuditLogRequest struct {
	PartnerID       string      `json:"partner_id"`
	UserID          *string     `json:"user_id,omitempty"`
	NIK             string      `json:"nik"`
	ScopesUsed      interface{} `json:"scopes_used"`
	RequestPayload  interface{} `json:"request_payload"`
	ResponsePayload interface{} `json:"response_payload"`
}
