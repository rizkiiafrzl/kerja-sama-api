package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/username/go-gin-backend/internal/models"
)

// TKRepository handles database operations for TK data
type TKRepository struct {
	DB *sql.DB
}

// NewTKRepository creates a new TK repository
func NewTKRepository(db *sql.DB) *TKRepository {
	return &TKRepository{DB: db}
}

// GetByNIK retrieves TK data by NIK
func (r *TKRepository) GetByNIK(ctx context.Context, nik string) (*models.TKData, error) {
	query := `SELECT nik, nama, tanggal_lahir, alamat, status_kepesertaan, updated_at
	          FROM tk_data WHERE nik = $1`

	var tk models.TKData
	err := r.DB.QueryRowContext(ctx, query, nik).Scan(
		&tk.NIK, &tk.Nama, &tk.TanggalLahir,
		&tk.Alamat, &tk.StatusKepesertaan, &tk.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get TK data: %w", err)
	}

	// Format date for JSON
	tk.TanggalLahirStr = tk.TanggalLahir.Format("2006-01-02")

	return &tk, nil
}

// CheckByNIKAndDOB checks TK data by NIK and date of birth
func (r *TKRepository) CheckByNIKAndDOB(ctx context.Context, nik string, dob time.Time) (*models.TKData, error) {
	query := `SELECT nik, nama, tanggal_lahir, alamat, status_kepesertaan, updated_at
	          FROM tk_data 
	          WHERE nik = $1 AND tanggal_lahir = $2`

	var tk models.TKData
	err := r.DB.QueryRowContext(ctx, query, nik, dob).Scan(
		&tk.NIK, &tk.Nama, &tk.TanggalLahir,
		&tk.Alamat, &tk.StatusKepesertaan, &tk.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("TK data not found or date of birth mismatch")
		}
		return nil, fmt.Errorf("failed to check TK data: %w", err)
	}

	// Format date for JSON
	tk.TanggalLahirStr = tk.TanggalLahir.Format("2006-01-02")

	return &tk, nil
}

// GetAll retrieves all TK data with pagination
func (r *TKRepository) GetAll(ctx context.Context, limit, offset int) ([]*models.TKData, error) {
	query := `SELECT nik, nama, tanggal_lahir, alamat, status_kepesertaan, updated_at
	          FROM tk_data
	          ORDER BY updated_at DESC
	          LIMIT $1 OFFSET $2`

	rows, err := r.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get TK data: %w", err)
	}
	defer rows.Close()

	var tkList []*models.TKData
	for rows.Next() {
		var tk models.TKData
		if err := rows.Scan(
			&tk.NIK, &tk.Nama, &tk.TanggalLahir,
			&tk.Alamat, &tk.StatusKepesertaan, &tk.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan TK data: %w", err)
		}
		tk.TanggalLahirStr = tk.TanggalLahir.Format("2006-01-02")
		tkList = append(tkList, &tk)
	}

	return tkList, nil
}

// Create creates new TK data
func (r *TKRepository) Create(ctx context.Context, req *models.CreateTKDataRequest) error {
	query := `INSERT INTO tk_data (nik, nama, tanggal_lahir, alamat, status_kepesertaan) 
	          VALUES ($1, $2, $3, $4, $5)`

	dob, err := time.Parse("2006-01-02", req.TanggalLahir)
	if err != nil {
		return fmt.Errorf("invalid date format: %w", err)
	}

	_, err = r.DB.ExecContext(ctx, query, req.NIK, req.Nama, dob, req.Alamat, req.StatusKepesertaan)
	if err != nil {
		return fmt.Errorf("failed to create TK data: %w", err)
	}

	return nil
}

// Update updates TK data
func (r *TKRepository) Update(ctx context.Context, nik string, req *models.UpdateTKDataRequest) error {
	query := `UPDATE tk_data 
	          SET nama = COALESCE(NULLIF($1, ''), nama),
	              tanggal_lahir = COALESCE($2, tanggal_lahir),
	              alamat = COALESCE(NULLIF($3, ''), alamat),
	              status_kepesertaan = COALESCE(NULLIF($4, ''), status_kepesertaan),
	              updated_at = NOW()
	          WHERE nik = $5`

	var dob *time.Time
	if req.TanggalLahir != "" {
		parsedDOB, err := time.Parse("2006-01-02", req.TanggalLahir)
		if err != nil {
			return fmt.Errorf("invalid date format: %w", err)
		}
		dob = &parsedDOB
	}

	_, err := r.DB.ExecContext(ctx, query, req.Nama, dob, req.Alamat, req.StatusKepesertaan, nik)
	if err != nil {
		return fmt.Errorf("failed to update TK data: %w", err)
	}

	return nil
}

// Delete deletes TK data
func (r *TKRepository) Delete(ctx context.Context, nik string) error {
	query := `DELETE FROM tk_data WHERE nik = $1`

	_, err := r.DB.ExecContext(ctx, query, nik)
	if err != nil {
		return fmt.Errorf("failed to delete TK data: %w", err)
	}

	return nil
}
