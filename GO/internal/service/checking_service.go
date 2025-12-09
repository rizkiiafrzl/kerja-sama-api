package service

import (
	"context"
	"fmt"
	"time"

	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/repository"
)

// CheckingService handles TK checking business logic
type CheckingService struct {
	TKRepo    *repository.TKRepository
	AuditRepo *repository.AuditRepository
}

// NewCheckingService creates a new checking service
func NewCheckingService(tkRepo *repository.TKRepository, auditRepo *repository.AuditRepository) *CheckingService {
	return &CheckingService{
		TKRepo:    tkRepo,
		AuditRepo: auditRepo,
	}
}

// CheckTK performs TK verification with scope-based filtering and audit logging
func (s *CheckingService) CheckTK(
	ctx context.Context,
	req models.CheckTKRequest,
	partnerID string,
	scopes []models.PartnerScope,
	userID *string,
) (models.CheckTKResponse, error) {
	// Parse tanggal lahir
	dob, err := time.Parse("2006-01-02", req.TanggalLahir)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, use YYYY-MM-DD")
	}

	// Check TK data by NIK and DOB
	tkData, err := s.TKRepo.CheckByNIKAndDOB(ctx, req.NIK, dob)

	// Prepare response
	var response models.CheckTKResponse

	if err != nil || tkData == nil {
		// TK not found or DOB mismatch
		response = models.CheckTKResponse{
			"found": false,
		}
	} else {
		// TK found and verified - filter by scopes
		response = filterByScopes(tkData, scopes)
		response["found"] = true
	}

	// Log the check to audit table (async, don't fail the request if audit fails)
	go func() {
		auditErr := s.AuditRepo.Create(
			context.Background(),
			partnerID,
			userID,
			req.NIK,
			scopes,
			req,
			response,
		)
		if auditErr != nil {
			fmt.Printf("Failed to create audit log: %v\n", auditErr)
		}
	}()

	return response, nil
}

// filterByScopes filters TK data based on enabled scopes
func filterByScopes(tk *models.TKData, scopes []models.PartnerScope) models.CheckTKResponse {
	allowed := make(map[string]bool)
	for _, s := range scopes {
		if s.Enabled {
			allowed[s.ScopeName] = true
		}
	}

	resp := make(models.CheckTKResponse)

	// Always include NIK
	resp["nik"] = tk.NIK

	// Filter based on scopes
	if allowed[models.ScopeName] {
		resp["nama"] = tk.Nama
	}
	if allowed[models.ScopeTanggalLahir] {
		resp["tanggal_lahir"] = tk.TanggalLahirStr
	}
	if allowed[models.ScopeStatusBPJS] {
		resp["status_kepesertaan"] = tk.StatusKepesertaan
	}
	if allowed[models.ScopeAlamat] && tk.Alamat != nil {
		resp["alamat"] = *tk.Alamat
	}

	// Always include last update timestamp
	resp["last_update"] = tk.UpdatedAt

	return resp
}
