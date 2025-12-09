package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/username/go-gin-backend/internal/models"
)

// AdminRepository handles database operations for admins
type AdminRepository struct {
	DB *sql.DB
}

// NewAdminRepository creates a new admin repository
func NewAdminRepository(db *sql.DB) *AdminRepository {
	return &AdminRepository{DB: db}
}

// GetByUsername retrieves an admin by username for authentication
func (r *AdminRepository) GetByUsername(ctx context.Context, username string) (*models.Admin, error) {
	query := `SELECT id, username, password_hash, role, status, created_at 
			  FROM admins WHERE username = $1 AND status = 'active'`

	var admin models.Admin
	err := r.DB.QueryRowContext(ctx, query, username).Scan(
		&admin.ID,
		&admin.Username,
		&admin.PasswordHash,
		&admin.Role,
		&admin.Status,
		&admin.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("admin not found")
		}
		return nil, fmt.Errorf("failed to get admin: %w", err)
	}

	return &admin, nil
}

// GetByID retrieves an admin by ID
func (r *AdminRepository) GetByID(ctx context.Context, id string) (*models.Admin, error) {
	query := `SELECT id, username, password_hash, role, status, created_at 
			  FROM admins WHERE id = $1`

	var admin models.Admin
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&admin.ID,
		&admin.Username,
		&admin.PasswordHash,
		&admin.Role,
		&admin.Status,
		&admin.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("admin not found")
		}
		return nil, fmt.Errorf("failed to get admin: %w", err)
	}

	return &admin, nil
}

// GetAll retrieves all admins
func (r *AdminRepository) GetAll(ctx context.Context) ([]*models.Admin, error) {
	query := `SELECT id, username, password_hash, role, status, created_at 
			  FROM admins ORDER BY created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get admins: %w", err)
	}
	defer rows.Close()

	var admins []*models.Admin
	for rows.Next() {
		var a models.Admin
		if err := rows.Scan(&a.ID, &a.Username, &a.PasswordHash, &a.Role, &a.Status, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan admin: %w", err)
		}
		admins = append(admins, &a)
	}

	return admins, nil
}

// Create creates a new admin
func (r *AdminRepository) Create(ctx context.Context, username, passwordHash, role string) (*models.Admin, error) {
	query := `INSERT INTO admins (username, password_hash, role) 
			  VALUES ($1, $2, $3) 
			  RETURNING id, username, password_hash, role, status, created_at`

	var admin models.Admin
	err := r.DB.QueryRowContext(ctx, query, username, passwordHash, role).Scan(
		&admin.ID,
		&admin.Username,
		&admin.PasswordHash,
		&admin.Role,
		&admin.Status,
		&admin.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create admin: %w", err)
	}

	return &admin, nil
}

// Update updates an admin
func (r *AdminRepository) Update(ctx context.Context, id, username, passwordHash, role, status string) error {
	query := `UPDATE admins SET username = $1, password_hash = $2, role = $3, status = $4 
			  WHERE id = $5`

	_, err := r.DB.ExecContext(ctx, query, username, passwordHash, role, status, id)
	if err != nil {
		return fmt.Errorf("failed to update admin: %w", err)
	}

	return nil
}

// Delete deletes an admin
func (r *AdminRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM admins WHERE id = $1`

	_, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete admin: %w", err)
	}

	return nil
}

