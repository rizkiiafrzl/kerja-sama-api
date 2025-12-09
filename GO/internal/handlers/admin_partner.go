package handlers

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/service"
	"github.com/username/go-gin-backend/pkg/utils"
)

// mapPartnerForResponse maps partner status Y/N to active/inactive for UI
func mapPartnerForResponse(partner *models.Partner) *models.Partner {
	if partner != nil {
		partner.StatusDisplay = models.MapStatusToDisplay(partner.Status)
	}
	return partner
}

// mapPartnersForResponse maps multiple partners for response
func mapPartnersForResponse(partners []*models.Partner) []*models.Partner {
	for _, p := range partners {
		mapPartnerForResponse(p)
	}
	return partners
}

// AdminPartnerHandler handles admin partner management
type AdminPartnerHandler struct {
	PartnerService *service.PartnerService
}

// NewAdminPartnerHandler creates a new admin partner handler
func NewAdminPartnerHandler(partnerService *service.PartnerService) *AdminPartnerHandler {
	return &AdminPartnerHandler{
		PartnerService: partnerService,
	}
}

// Create creates a new partner
func (h *AdminPartnerHandler) Create(c *fiber.Ctx) error {
	var req models.CreatePartnerRequest

	// Log raw request body for debugging
	rawBody := c.Body()
	fmt.Printf("CreatePartner - Raw request body: %s\n", string(rawBody))

	// Use JSON.Unmarshal directly to ensure custom UnmarshalJSON is called
	if err := json.Unmarshal(rawBody, &req); err != nil {
		fmt.Printf("CreatePartner - JSON Unmarshal error: %v\n", err)
		fmt.Printf("CreatePartner - Request body: %s\n", string(rawBody))
		return utils.JSONErrorWithDetail(c, fiber.StatusBadRequest, "invalid request body", fmt.Sprintf("failed to parse request: %v", err))
	}

	// Log parsed request for debugging
	fmt.Printf("CreatePartner - Parsed request: %+v\n", req)

	// Validate required fields
	if strings.TrimSpace(req.CompanyName) == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "company_name is required")
	}
	if strings.TrimSpace(req.PICName) == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "pic_name is required")
	}
	if strings.TrimSpace(req.PICEmail) == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "pic_email is required")
	}

	// Basic email validation
	email := strings.TrimSpace(req.PICEmail)
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return utils.JSONError(c, fiber.StatusBadRequest, "pic_email must be a valid email address")
	}

	// Validate phone number (max 13 digits, only numbers)
	if req.PICPhone != "" {
		if err := utils.ValidatePhone(req.PICPhone); err != nil {
			fmt.Printf("CreatePartner - Phone validation error: %v\n", err)
			return utils.JSONErrorWithDetail(c, fiber.StatusBadRequest, "validation failed", err.Error())
		}
		// Normalize phone (remove spaces, dashes, etc)
		req.PICPhone = utils.NormalizePhone(req.PICPhone)
	}

	// Trim whitespace from string fields
	req.CompanyName = strings.TrimSpace(req.CompanyName)
	req.PICName = strings.TrimSpace(req.PICName)
	req.PICEmail = strings.TrimSpace(req.PICEmail)

	fmt.Printf("CreatePartner - Calling service with: %+v\n", req)
	partner, err := h.PartnerService.CreatePartner(c.Context(), &req)
	if err != nil {
		fmt.Printf("CreatePartner - Service error: %v\n", err)
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to create partner", err.Error())
	}

	// Map status for UI display
	mappedPartner := mapPartnerForResponse(partner.Partner)

	// Return partner with API key (plaintext only on creation)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Partner created successfully",
		"data": fiber.Map{
			"partner":        mappedPartner,
			"company_id":     partner.Partner.CompanyID,
			"api_key":        partner.APIKeyPlain, // plaintext only on creation
			"contract_start": partner.Partner.ContractStart,
			"contract_end":   partner.Partner.ContractEnd,
			"info":           partner.CompanyIDInfo,
			"note":           "Save this API key to .env file. Use X-API-KEY header in API requests. This key will not be shown again.",
		},
	})
}

// List retrieves all partners
func (h *AdminPartnerHandler) List(c *fiber.Ctx) error {
	partners, err := h.PartnerService.GetAllPartners(c.Context())
	if err != nil {
		fmt.Printf("Error retrieving partners: %v\n", err)
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to retrieve partners", err.Error())
	}

	// Map status for UI display
	mappedPartners := mapPartnersForResponse(partners)

	return utils.JSONSuccess(c, mappedPartners)
}

// Get retrieves a single partner by ID
func (h *AdminPartnerHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	partner, err := h.PartnerService.GetPartner(c.Context(), id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "partner not found")
	}

	// Map status for UI display
	mappedPartner := mapPartnerForResponse(partner)

	return utils.JSONSuccess(c, mappedPartner)
}

// Update updates a partner
func (h *AdminPartnerHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	var req models.UpdatePartnerRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "invalid request body")
	}

	// Validate phone number if provided (max 13 digits, only numbers)
	if req.PICPhone != "" {
		if err := utils.ValidatePhone(req.PICPhone); err != nil {
			return utils.JSONErrorWithDetail(c, fiber.StatusBadRequest, "validation failed", err.Error())
		}
		// Normalize phone (remove spaces, dashes, etc)
		req.PICPhone = utils.NormalizePhone(req.PICPhone)
	}

	// Convert status display (active/inactive) to DB format (Y/N) if provided
	if req.Status != "" {
		// Support both formats: "active"/"inactive" and "Y"/"N"
		if req.Status == "active" || req.Status == "inactive" {
			req.Status = models.MapStatusToDB(req.Status)
		}
	}

	// Log the request for debugging
	fmt.Printf("UpdatePartner - ID: %s, Request: %+v\n", id, req)

	if err := h.PartnerService.UpdatePartner(c.Context(), id, &req); err != nil {
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to update partner", err.Error())
	}

	return utils.JSONSuccessWithMessage(c, "Partner updated successfully", nil)
}

// Delete soft deletes a partner
func (h *AdminPartnerHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	if err := h.PartnerService.DeletePartner(c.Context(), id); err != nil {
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to delete partner", err.Error())
	}

	return utils.JSONSuccessWithMessage(c, "Partner deleted successfully", nil)
}

// GetScopes retrieves scopes for a partner
func (h *AdminPartnerHandler) GetScopes(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	scopes, err := h.PartnerService.GetPartnerScopes(c.Context(), id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "failed to retrieve scopes")
	}

	return utils.JSONSuccess(c, scopes)
}

// UpdateScopes updates scopes for a partner
func (h *AdminPartnerHandler) UpdateScopes(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	var req models.UpdateScopesRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "invalid request body")
	}

	if err := h.PartnerService.UpdatePartnerScopes(c.Context(), id, &req); err != nil {
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to update scopes", err.Error())
	}

	return utils.JSONSuccessWithMessage(c, "Scopes updated successfully", nil)
}

// RevealAPIKey reveals the current API key (returns plaintext once without resetting)
func (h *AdminPartnerHandler) RevealAPIKey(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	partner, err := h.PartnerService.GetPartner(c.Context(), id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "partner not found")
	}

	if partner.APIKey == nil || *partner.APIKey == "" {
		return utils.JSONError(c, fiber.StatusNotFound, "API key not found for this partner")
	}

	// Map status for UI display
	mappedPartner := mapPartnerForResponse(partner)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "API key revealed successfully",
		"data": fiber.Map{
			"partner":    mappedPartner,
			"company_id": partner.CompanyID,
			"api_key":    *partner.APIKey, // Return current API key
			"info":       fmt.Sprintf("Use API key '%s' in X-API-KEY header for API requests", *partner.APIKey),
			"note":       "Copy this API key now; it will not be shown again. This is your current active API key.",
		},
	})
}

// ResetAPIKey resets partner API key and returns plaintext once (for security when token is leaked)
func (h *AdminPartnerHandler) ResetAPIKey(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "partner ID is required")
	}

	resp, err := h.PartnerService.ResetAPIKey(c.Context(), id)
	if err != nil {
		return utils.JSONErrorWithDetail(c, fiber.StatusInternalServerError, "failed to reset API key", err.Error())
	}

	// Map status for UI display
	mappedPartner := mapPartnerForResponse(resp.Partner)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "API key reset successfully. Old key is now invalid.",
		"data": fiber.Map{
			"partner":    mappedPartner,
			"company_id": resp.Partner.CompanyID,
			"api_key":    resp.APIKeyPlain, // plaintext only on reset
			"info":       resp.CompanyIDInfo,
			"note":       "Copy the new API key now; it will not be shown again. Old key is immediately invalid.",
		},
	})
}
