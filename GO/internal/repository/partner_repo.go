package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/username/go-gin-backend/internal/models"
)

// PartnerRepository handles database operations for partners
type PartnerRepository struct {
	DB *sql.DB
}

// NewPartnerRepository creates a new partner repository
func NewPartnerRepository(db *sql.DB) *PartnerRepository {
	return &PartnerRepository{DB: db}
}

// GetByAPIKey retrieves a partner by API key (for authentication)
func (r *PartnerRepository) GetByAPIKey(ctx context.Context, apiKey string) (*models.Partner, error) {
	query := `SELECT id, company_name, company_id, api_key, COALESCE(company_secret, '') as company_secret, 
	                 nomor_pks, pic_name, pic_email, pic_phone, status, contract_start, contract_end, 
	                 notes, created_at, updated_at 
	          FROM partners WHERE api_key = $1`

	var partner models.Partner
	var contractStart, contractEnd sql.NullTime
	err := r.DB.QueryRowContext(ctx, query, apiKey).Scan(
		&partner.ID,
		&partner.CompanyName,
		&partner.CompanyID,
		&partner.APIKey,
		&partner.CompanySecret,
		&partner.NomorPKS,
		&partner.PICName,
		&partner.PICEmail,
		&partner.PICPhone,
		&partner.Status,
		&contractStart,
		&contractEnd,
		&partner.Notes,
		&partner.CreatedAt,
		&partner.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get partner: %w", err)
	}

	if contractStart.Valid {
		partner.ContractStart = &contractStart.Time
	}
	if contractEnd.Valid {
		partner.ContractEnd = &contractEnd.Time
	}

	return r.markExpiredIfNeeded(ctx, &partner)
}

// GetByCompanyID retrieves a partner by company id
func (r *PartnerRepository) GetByCompanyID(ctx context.Context, companyID string) (*models.Partner, error) {
	query := `SELECT id, company_name, company_id, api_key, COALESCE(company_secret, '') as company_secret, 
	                 nomor_pks, pic_name, pic_email, pic_phone, status, contract_start, contract_end, 
	                 notes, created_at, updated_at 
	          FROM partners WHERE company_id = $1`

	var partner models.Partner
	var contractStart, contractEnd sql.NullTime
	err := r.DB.QueryRowContext(ctx, query, companyID).Scan(
		&partner.ID,
		&partner.CompanyName,
		&partner.CompanyID,
		&partner.APIKey,
		&partner.CompanySecret,
		&partner.NomorPKS,
		&partner.PICName,
		&partner.PICEmail,
		&partner.PICPhone,
		&partner.Status,
		&contractStart,
		&contractEnd,
		&partner.Notes,
		&partner.CreatedAt,
		&partner.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get partner: %w", err)
	}

	if contractStart.Valid {
		partner.ContractStart = &contractStart.Time
	}
	if contractEnd.Valid {
		partner.ContractEnd = &contractEnd.Time
	}

	return r.markExpiredIfNeeded(ctx, &partner)
}

// GetByID retrieves a partner by ID
func (r *PartnerRepository) GetByID(ctx context.Context, id string) (*models.Partner, error) {
	query := `SELECT id, company_name, company_id, api_key, COALESCE(company_secret, '') as company_secret, 
	                 nomor_pks, pic_name, pic_email, pic_phone, status, contract_start, contract_end, 
	                 notes, created_at, updated_at 
	          FROM partners WHERE id = $1`

	var partner models.Partner
	var contractStart, contractEnd sql.NullTime
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&partner.ID,
		&partner.CompanyName,
		&partner.CompanyID,
		&partner.APIKey,
		&partner.CompanySecret,
		&partner.NomorPKS,
		&partner.PICName,
		&partner.PICEmail,
		&partner.PICPhone,
		&partner.Status,
		&contractStart,
		&contractEnd,
		&partner.Notes,
		&partner.CreatedAt,
		&partner.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("partner not found")
		}
		return nil, fmt.Errorf("failed to get partner: %w", err)
	}

	if contractStart.Valid {
		partner.ContractStart = &contractStart.Time
	}
	if contractEnd.Valid {
		partner.ContractEnd = &contractEnd.Time
	}

	return &partner, nil
}

// GetAll retrieves all partners
func (r *PartnerRepository) GetAll(ctx context.Context) ([]*models.Partner, error) {
	// Check which columns exist
	checkQuery := `SELECT column_name FROM information_schema.columns 
	               WHERE table_name = 'partners' 
	               AND column_name IN ('company_id', 'company_code', 'api_key', 'contract_start', 'contract_end', 'company_secret')`
	rows, err := r.DB.QueryContext(ctx, checkQuery)
	if err != nil {
		log.Printf("GetAll column check error: %v", err)
		return nil, fmt.Errorf("failed to check columns: %w", err)
	}
	defer rows.Close()

	hasCompanyID := false
	hasCompanyCode := false
	hasAPIKey := false
	hasCompanySecret := false
	hasContractStart := false
	hasContractEnd := false

	for rows.Next() {
		var colName string
		if err := rows.Scan(&colName); err != nil {
			continue
		}
		switch colName {
		case "company_id":
			hasCompanyID = true
		case "company_code":
			hasCompanyCode = true
		case "api_key":
			hasAPIKey = true
		case "company_secret":
			hasCompanySecret = true
		case "contract_start":
			hasContractStart = true
		case "contract_end":
			hasContractEnd = true
		}
	}

	// Build query based on available columns
	var companyCol string
	if hasCompanyID {
		companyCol = "company_id"
	} else if hasCompanyCode {
		companyCol = "company_code as company_id"
	} else {
		return nil, fmt.Errorf("neither company_id nor company_code column exists")
	}

	// Build API key column
	var apiKeyCol string
	if hasAPIKey {
		apiKeyCol = "api_key,"
	} else {
		apiKeyCol = "NULL::VARCHAR as api_key,"
	}

	// Build company secret column
	var companySecretCol string
	if hasCompanySecret {
		companySecretCol = "COALESCE(company_secret, '') as company_secret,"
	} else {
		companySecretCol = "'' as company_secret,"
	}

	// Build contract columns part
	var contractCols string
	if hasContractStart && hasContractEnd {
		contractCols = "contract_start, contract_end,"
	} else {
		contractCols = "NULL::DATE as contract_start, NULL::DATE as contract_end,"
	}

	query := fmt.Sprintf(`SELECT id, company_name, %s, %s 
	                            %s 
	                            nomor_pks, pic_name, pic_email, pic_phone, 
	                            CASE 
	                                WHEN status::text = 'active' THEN 'Y'
	                                WHEN status::text = 'inactive' THEN 'N'
	                                ELSE COALESCE(status::text, 'Y')
	                            END as status,
	                            %s
	                            notes, created_at, updated_at 
	                     FROM partners ORDER BY created_at DESC`, 
	                     companyCol, apiKeyCol, companySecretCol, contractCols)

	rows, err = r.DB.QueryContext(ctx, query)
	if err != nil {
		log.Printf("GetAll partners query error: %v\nQuery: %s", err, query)
		return nil, fmt.Errorf("failed to get partners: %w", err)
	}
	defer rows.Close()

	var partners []*models.Partner
	for rows.Next() {
		var p models.Partner
		var contractStart, contractEnd sql.NullTime
		if err := rows.Scan(
			&p.ID, &p.CompanyName, &p.CompanyID, &p.APIKey, &p.CompanySecret, &p.NomorPKS,
			&p.PICName, &p.PICEmail, &p.PICPhone,
			&p.Status, &contractStart, &contractEnd,
			&p.Notes, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			log.Printf("GetAll partners scan error: %v", err)
			return nil, fmt.Errorf("failed to scan partner: %w", err)
		}
		if contractStart.Valid {
			p.ContractStart = &contractStart.Time
		}
		if contractEnd.Valid {
			p.ContractEnd = &contractEnd.Time
		}
		updated, err := r.markExpiredIfNeeded(ctx, &p)
		if err != nil {
			log.Printf("GetAll partners markExpiredIfNeeded error: %v", err)
			partners = append(partners, &p)
		} else {
			partners = append(partners, updated)
		}
	}

	return partners, nil
}

// Create creates a new partner with API key and contract dates
func (r *PartnerRepository) Create(ctx context.Context, p *models.Partner) error {
	query := `INSERT INTO partners (company_name, company_id, api_key, company_secret, nomor_pks, pic_name, pic_email, 
	                                pic_phone, status, contract_start, contract_end, notes) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
	          RETURNING id, created_at, updated_at`

	var apiKey interface{}
	if p.APIKey != nil {
		apiKey = *p.APIKey
	}

	// Contract dates should always be set (service layer ensures this)
	// PostgreSQL will automatically convert time.Time to DATE (truncates time part)
	var contractStart, contractEnd interface{}
	if p.ContractStart != nil {
		contractStart = *p.ContractStart
	} else {
		// Fallback: use current date if nil (should not happen, but safety check)
		contractStart = time.Now()
	}
	if p.ContractEnd != nil {
		contractEnd = *p.ContractEnd
	} else {
		// Fallback: use 1 year from now if nil (should not happen, but safety check)
		if p.ContractStart != nil {
			contractEnd = p.ContractStart.AddDate(1, 0, 0)
		} else {
			contractEnd = time.Now().AddDate(1, 0, 0)
		}
	}

	// Log the values being inserted for debugging
	log.Printf("PartnerRepository.Create - Inserting partner: company_name=%s, company_id=%s, nomor_pks=%s, status=%s", 
		p.CompanyName, p.CompanyID, p.NomorPKS, p.Status)

	err := r.DB.QueryRowContext(ctx, query,
		p.CompanyName, p.CompanyID, apiKey, p.CompanySecret, p.NomorPKS, p.PICName,
		p.PICEmail, p.PICPhone, p.Status, contractStart, contractEnd, p.Notes,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	
	if err != nil {
		// Check for common constraint violations and provide clearer error messages
		errStr := err.Error()
		if strings.Contains(errStr, "does not exist") {
			if strings.Contains(errStr, "api_key") {
				return fmt.Errorf("database migration required: api_key column does not exist. Please run fix_add_api_key_column.sql")
			}
			if strings.Contains(errStr, "contract_start") || strings.Contains(errStr, "contract_end") {
				return fmt.Errorf("database migration required: contract date columns do not exist. Please run fix_add_api_key_column.sql")
			}
			return fmt.Errorf("database schema error: %w. Please check if all migrations have been run", err)
		}
		if strings.Contains(errStr, "unique") || strings.Contains(errStr, "duplicate") {
			if strings.Contains(errStr, "company_id") {
				return fmt.Errorf("company_id '%s' already exists", p.CompanyID)
			}
			if strings.Contains(errStr, "nomor_pks") {
				return fmt.Errorf("nomor_pks '%s' already exists", p.NomorPKS)
			}
			if strings.Contains(errStr, "api_key") {
				return fmt.Errorf("api_key already exists (this should not happen, please retry)")
			}
			return fmt.Errorf("duplicate entry: %w", err)
		}
		if strings.Contains(errStr, "check constraint") {
			return fmt.Errorf("validation failed: %w", err)
		}
		log.Printf("PartnerRepository.Create - Database error: %v", err)
		return fmt.Errorf("failed to create partner: %w", err)
	}

	return nil
}

// Update updates a partner
func (r *PartnerRepository) Update(ctx context.Context, id string, req *models.UpdatePartnerRequest) error {
	// Build dynamic query based on what fields are provided
	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.CompanyName != "" {
		updates = append(updates, fmt.Sprintf("company_name = $%d", argIndex))
		args = append(args, req.CompanyName)
		argIndex++
	}

	// Only update company_id if it's explicitly provided (not empty)
	if req.CompanyID != "" {
		updates = append(updates, fmt.Sprintf("company_id = $%d", argIndex))
		args = append(args, req.CompanyID)
		argIndex++
	}

	if req.PICName != "" {
		updates = append(updates, fmt.Sprintf("pic_name = $%d", argIndex))
		args = append(args, req.PICName)
		argIndex++
	}

	if req.PICEmail != "" {
		updates = append(updates, fmt.Sprintf("pic_email = $%d", argIndex))
		args = append(args, req.PICEmail)
		argIndex++
	}

	if req.PICPhone != "" {
		updates = append(updates, fmt.Sprintf("pic_phone = $%d", argIndex))
		args = append(args, req.PICPhone)
		argIndex++
	}

	if req.Status != "" {
		// Convert old format to new format if needed
		status := req.Status
		if status == "active" {
			status = "Y"
		} else if status == "inactive" {
			status = "N"
		}
		updates = append(updates, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}

	if req.ContractStart != nil && !req.ContractStart.Time.IsZero() {
		updates = append(updates, fmt.Sprintf("contract_start = $%d", argIndex))
		args = append(args, req.ContractStart.Time)
		argIndex++
	}

	if req.ContractEnd != nil && !req.ContractEnd.Time.IsZero() {
		updates = append(updates, fmt.Sprintf("contract_end = $%d", argIndex))
		args = append(args, req.ContractEnd.Time)
		argIndex++
	}

	// Handle notes (can be nil, empty, or have value)
	if req.Notes != nil {
		updates = append(updates, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	// Always update updated_at
	updates = append(updates, "updated_at = NOW()")

	if len(updates) == 1 { // Only updated_at
		return fmt.Errorf("no fields to update")
	}

	// Add WHERE clause
	args = append(args, id)
	query := fmt.Sprintf(`UPDATE partners SET %s WHERE id = $%d`,
		strings.Join(updates, ", "), argIndex)

	log.Printf("PartnerRepository.Update - Query: %s, Args: %+v, ID: %s", query, args, id)

	_, err := r.DB.ExecContext(ctx, query, args...)
	if err != nil {
		log.Printf("PartnerRepository.Update error: %v (id=%s, payload=%+v)", err, id, req)
		return fmt.Errorf("failed to update partner: %w", err)
	}

	log.Printf("PartnerRepository.Update - Successfully updated partner ID: %s", id)
	return nil
}

// Delete soft deletes a partner by setting status to inactive
func (r *PartnerRepository) Delete(ctx context.Context, id string) error {
	query := `UPDATE partners SET status = 'N', updated_at = NOW() WHERE id = $1`

	_, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete partner: %w", err)
	}

	return nil
}

// UpdateAPIKey resets the API key for a partner (for security)
func (r *PartnerRepository) UpdateAPIKey(ctx context.Context, id, apiKey string) error {
	query := `UPDATE partners SET api_key = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.DB.ExecContext(ctx, query, apiKey, id)
	if err != nil {
		return fmt.Errorf("failed to update partner API key: %w", err)
	}
	return nil
}

// UpdateSecret rotates the company secret (hashed) - DEPRECATED, kept for backward compatibility
func (r *PartnerRepository) UpdateSecret(ctx context.Context, id, hashedSecret string) error {
	query := `UPDATE partners SET company_secret = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.DB.ExecContext(ctx, query, hashedSecret, id)
	if err != nil {
		return fmt.Errorf("failed to update partner secret: %w", err)
	}
	return nil
}

// markExpiredIfNeeded auto-expire status based on contract period:
// - Jika contract_end < now -> set inactive
// Tidak akan mengaktifkan kembali otomatis; aktivasi harus manual oleh admin.
func (r *PartnerRepository) markExpiredIfNeeded(ctx context.Context, p *models.Partner) (*models.Partner, error) {
	if p == nil {
		return p, nil
	}
	now := time.Now()

	// Expire if contract end passed
	if p.ContractEnd != nil && now.After(*p.ContractEnd) && p.Status != models.PartnerStatusInactive {
		if _, err := r.DB.ExecContext(ctx, `UPDATE partners SET status = $1, updated_at = NOW() WHERE id = $2`, models.PartnerStatusInactive, p.ID); err != nil {
			return p, fmt.Errorf("failed to mark partner expired: %w", err)
		}
		p.Status = models.PartnerStatusInactive
	}

	return p, nil
}
