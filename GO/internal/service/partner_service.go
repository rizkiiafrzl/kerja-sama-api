package service

import (
	"context"
	"fmt"
	"time"

	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/repository"
	"github.com/username/go-gin-backend/pkg/utils"
)

// PartnerService handles partner business logic
type PartnerService struct {
	PartnerRepo *repository.PartnerRepository
	ScopeRepo   *repository.ScopeRepository
}

// NewPartnerService creates a new partner service
func NewPartnerService(partnerRepo *repository.PartnerRepository, scopeRepo *repository.ScopeRepository) *PartnerService {
	return &PartnerService{
		PartnerRepo: partnerRepo,
		ScopeRepo:   scopeRepo,
	}
}

// CreatePartner creates a new partner with auto-generated API key, contract dates, and scopes
func (s *PartnerService) CreatePartner(ctx context.Context, req *models.CreatePartnerRequest) (*models.PartnerResponse, error) {
	// Use provided company_id or generate one
	companyID := req.CompanyID
	if companyID == "" {
		companyID = utils.GenerateCompanyCode(req.CompanyName)
	}
	
	// Check if company_id already exists (if manually provided)
	if req.CompanyID != "" {
		existing, _ := s.PartnerRepo.GetByCompanyID(ctx, req.CompanyID)
		if existing != nil {
			return nil, fmt.Errorf("company_id already exists")
		}
	}
	
	nomorPKS := utils.GeneratePKSNumber()

	// Generate API key (plaintext, stored as-is in database)
	apiKey := utils.GenerateAPIKey()

	// Set contract dates (default to today and 1 year from today if not provided)
	contractStart := time.Now()
	if req.ContractStart != nil && !req.ContractStart.Time.IsZero() {
		contractStart = req.ContractStart.Time
	}
	
	contractEnd := contractStart.AddDate(1, 0, 0) // 1 year from start
	if req.ContractEnd != nil && !req.ContractEnd.Time.IsZero() {
		contractEnd = req.ContractEnd.Time
	}

	// Prepare notes
	var notes *string
	if req.Notes != "" {
		notes = &req.Notes
	}

	// Normalize phone number (remove spaces, dashes, etc) before saving
	normalizedPhone := utils.NormalizePhone(req.PICPhone)

	// Create partner with API key and contract dates
	partner := &models.Partner{
		CompanyName:   req.CompanyName,
		CompanyID:     companyID,
		APIKey:        &apiKey,
		CompanySecret: "", // Deprecated, kept empty
		NomorPKS:      nomorPKS,
		PICName:       req.PICName,
		PICEmail:      req.PICEmail,
		PICPhone:      normalizedPhone,
		Status:        models.PartnerStatusActive, // Set to "Y"
		ContractStart: &contractStart,
		ContractEnd:   &contractEnd,
		Notes:         notes,
	}

	if err := s.PartnerRepo.Create(ctx, partner); err != nil {
		return nil, fmt.Errorf("failed to create partner: %w", err)
	}

	// Create scopes (default jika tidak ada yang diberikan)
	scopes := req.Scopes
	if len(scopes) == 0 {
		scopes = models.DefaultScopes()
	}

	if err := s.ScopeRepo.BulkCreate(ctx, partner.ID, scopes); err != nil {
		return nil, fmt.Errorf("failed to create scopes: %w", err)
	}

	response := &models.PartnerResponse{
		Partner:       partner,
		CompanyIDInfo: fmt.Sprintf("Use API key '%s' in X-API-KEY header for API requests", apiKey),
		APIKeyPlain:   apiKey, // Return plaintext API key (only once on creation)
	}

	return response, nil
}

// GetPartner retrieves a partner by ID
func (s *PartnerService) GetPartner(ctx context.Context, id string) (*models.Partner, error) {
	return s.PartnerRepo.GetByID(ctx, id)
}

// GetAllPartners retrieves all partners
func (s *PartnerService) GetAllPartners(ctx context.Context) ([]*models.Partner, error) {
	return s.PartnerRepo.GetAll(ctx)
}

// UpdatePartner updates a partner
func (s *PartnerService) UpdatePartner(ctx context.Context, id string, req *models.UpdatePartnerRequest) error {
	// Auto-adjust status based on contract end date when provided
	if req.ContractEnd != nil && !req.ContractEnd.Time.IsZero() {
		now := time.Now().Truncate(24 * time.Hour)
		end := req.ContractEnd.Time.Truncate(24 * time.Hour)
		if !end.Before(now) { // end >= today
			req.Status = models.PartnerStatusActive // Y
		} else {
			req.Status = models.PartnerStatusInactive // N
		}
	}

	// Check if company_id is being updated and if it already exists
	if req.CompanyID != "" {
		existing, _ := s.PartnerRepo.GetByCompanyID(ctx, req.CompanyID)
		if existing != nil && existing.ID != id {
			return fmt.Errorf("company_id already exists")
		}
	}
	
	return s.PartnerRepo.Update(ctx, id, req)
}

// DeletePartner soft deletes a partner
func (s *PartnerService) DeletePartner(ctx context.Context, id string) error {
	return s.PartnerRepo.Delete(ctx, id)
}

// GetPartnerScopes retrieves scopes for a partner
func (s *PartnerService) GetPartnerScopes(ctx context.Context, partnerID string) ([]models.PartnerScope, error) {
	return s.ScopeRepo.GetByPartnerID(ctx, partnerID)
}

// UpdatePartnerScopes updates scopes for a partner
func (s *PartnerService) UpdatePartnerScopes(ctx context.Context, partnerID string, req *models.UpdateScopesRequest) error {
	return s.ScopeRepo.BulkUpdate(ctx, partnerID, req.Scopes)
}

// IssuePartnerToken is DEPRECATED - No longer used, replaced by API Key authentication
// This method is kept for backward compatibility but should not be used
// func (s *PartnerService) IssuePartnerToken(...) - REMOVED

// ResetAPIKey generates a new API key and returns plaintext once (for security when token is leaked)
func (s *PartnerService) ResetAPIKey(ctx context.Context, partnerID string) (*models.PartnerResponse, error) {
	partner, err := s.PartnerRepo.GetByID(ctx, partnerID)
	if err != nil {
		return nil, err
	}
	if partner == nil {
		return nil, fmt.Errorf("partner not found")
	}

	// Generate new API key
	newAPIKey := utils.GenerateAPIKey()

	// Update API key in database (old key becomes invalid immediately)
	if err := s.PartnerRepo.UpdateAPIKey(ctx, partnerID, newAPIKey); err != nil {
		return nil, fmt.Errorf("failed to reset API key: %w", err)
	}

	// Update partner object with new API key
	partner.APIKey = &newAPIKey

	resp := &models.PartnerResponse{
		Partner:       partner,
		CompanyIDInfo: fmt.Sprintf("Use API key '%s' in X-API-KEY header for API requests", newAPIKey),
		APIKeyPlain:   newAPIKey, // Return plaintext API key (only once on reset)
	}
	return resp, nil
}
