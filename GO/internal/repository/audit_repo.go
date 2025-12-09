package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/username/go-gin-backend/internal/models"
)

// AuditRepository handles database operations for audit logs
type AuditRepository struct {
	DB *sql.DB
}

// NewAuditRepository creates a new audit repository
func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{DB: db}
}

// Create creates a new audit log entry
func (r *AuditRepository) Create(ctx context.Context, partnerID string, userID *string, nik string, scopesUsed, request, response interface{}) error {
	query := `INSERT INTO audit_logs (partner_id, user_id, nik, scopes_used, request_payload, response_payload) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	scopesJSON, err := json.Marshal(scopesUsed)
	if err != nil {
		return fmt.Errorf("failed to marshal scopes: %w", err)
	}

	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return fmt.Errorf("failed to marshal response: %w", err)
	}

	_, err = r.DB.ExecContext(ctx, query, partnerID, userID, nik, scopesJSON, requestJSON, responseJSON)
	if err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// GetByPartnerID retrieves audit logs for a partner
func (r *AuditRepository) GetByPartnerID(ctx context.Context, partnerID string, limit, offset int) ([]*models.AuditLog, error) {
	query := `SELECT id, partner_id, user_id, nik, scopes_used, request_payload, response_payload, created_at
	          FROM audit_logs
	          WHERE partner_id = $1
	          ORDER BY created_at DESC
	          LIMIT $2 OFFSET $3`

	rows, err := r.DB.QueryContext(ctx, query, partnerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(
			&log.ID, &log.PartnerID, &log.UserID, &log.NIK,
			&log.ScopesUsed, &log.RequestPayload, &log.ResponsePayload, &log.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		logs = append(logs, &log)
	}

	return logs, nil
}

// GetByNIK retrieves audit logs for a specific NIK
func (r *AuditRepository) GetByNIK(ctx context.Context, nik string, limit, offset int) ([]*models.AuditLog, error) {
	query := `SELECT id, partner_id, user_id, nik, scopes_used, request_payload, response_payload, created_at
	          FROM audit_logs
	          WHERE nik = $1
	          ORDER BY created_at DESC
	          LIMIT $2 OFFSET $3`

	rows, err := r.DB.QueryContext(ctx, query, nik, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(
			&log.ID, &log.PartnerID, &log.UserID, &log.NIK,
			&log.ScopesUsed, &log.RequestPayload, &log.ResponsePayload, &log.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		logs = append(logs, &log)
	}

	return logs, nil
}
