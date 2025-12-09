package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/username/go-gin-backend/internal/models"
)

// ScopeRepository handles database operations for partner scopes
type ScopeRepository struct {
	DB *sql.DB
}

// NewScopeRepository creates a new scope repository
func NewScopeRepository(db *sql.DB) *ScopeRepository {
	return &ScopeRepository{DB: db}
}

// GetByPartnerID retrieves all scopes for a partner
func (r *ScopeRepository) GetByPartnerID(ctx context.Context, partnerID string) ([]models.PartnerScope, error) {
	query := `SELECT id, partner_id, scope_name, enabled
	          FROM partner_access_scopes
	          WHERE partner_id = $1
	          ORDER BY scope_name`

	rows, err := r.DB.QueryContext(ctx, query, partnerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get scopes: %w", err)
	}
	defer rows.Close()

	var scopes []models.PartnerScope
	for rows.Next() {
		var s models.PartnerScope
		if err := rows.Scan(&s.ID, &s.PartnerID, &s.ScopeName, &s.Enabled); err != nil {
			return nil, fmt.Errorf("failed to scan scope: %w", err)
		}
		scopes = append(scopes, s)
	}

	return scopes, nil
}

// Create creates a new scope for a partner
func (r *ScopeRepository) Create(ctx context.Context, partnerID, scopeName string, enabled bool) error {
	query := `INSERT INTO partner_access_scopes (partner_id, scope_name, enabled) 
	          VALUES ($1, $2, $3)`

	_, err := r.DB.ExecContext(ctx, query, partnerID, scopeName, enabled)
	if err != nil {
		return fmt.Errorf("failed to create scope: %w", err)
	}

	return nil
}

// BulkCreate creates multiple scopes for a partner
func (r *ScopeRepository) BulkCreate(ctx context.Context, partnerID string, scopes []string) error {
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `INSERT INTO partner_access_scopes (partner_id, scope_name, enabled) VALUES ($1, $2, $3)`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, scopeName := range scopes {
		if _, err := stmt.ExecContext(ctx, partnerID, scopeName, true); err != nil {
			return fmt.Errorf("failed to insert scope %s: %w", scopeName, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Update updates a scope's enabled status
func (r *ScopeRepository) Update(ctx context.Context, partnerID, scopeName string, enabled bool) error {
	query := `UPDATE partner_access_scopes 
	          SET enabled = $1 
	          WHERE partner_id = $2 AND scope_name = $3`

	_, err := r.DB.ExecContext(ctx, query, enabled, partnerID, scopeName)
	if err != nil {
		return fmt.Errorf("failed to update scope: %w", err)
	}

	return nil
}

// BulkUpdate updates multiple scopes for a partner
func (r *ScopeRepository) BulkUpdate(ctx context.Context, partnerID string, scopes []models.ScopeItem) error {
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO partner_access_scopes (partner_id, scope_name, enabled) 
		VALUES ($1, $2, $3)
		ON CONFLICT (partner_id, scope_name) 
		DO UPDATE SET enabled = EXCLUDED.enabled
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, scope := range scopes {
		if _, err := stmt.ExecContext(ctx, partnerID, scope.ScopeName, scope.Enabled); err != nil {
			return fmt.Errorf("failed to upsert scope %s: %w", scope.ScopeName, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteByPartnerID deletes all scopes for a partner
func (r *ScopeRepository) DeleteByPartnerID(ctx context.Context, partnerID string) error {
	query := `DELETE FROM partner_access_scopes WHERE partner_id = $1`

	_, err := r.DB.ExecContext(ctx, query, partnerID)
	if err != nil {
		return fmt.Errorf("failed to delete scopes: %w", err)
	}

	return nil
}
