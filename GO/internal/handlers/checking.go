package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/service"
	"github.com/username/go-gin-backend/pkg/utils"
)

// CheckingHandler handles TK checking requests
type CheckingHandler struct {
	CheckingService *service.CheckingService
}

// NewCheckingHandler creates a new checking handler
func NewCheckingHandler(checkingService *service.CheckingService) *CheckingHandler {
	return &CheckingHandler{
		CheckingService: checkingService,
	}
}

// CheckTK handles TK checking request
func (h *CheckingHandler) CheckTK(c *fiber.Ctx) error {
	var req models.CheckTKRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "invalid request body")
	}

	// Get partner info and scopes from context (set by middleware)
	partnerID := c.Locals("partnerID").(string)
	rawScopes := c.Locals("partnerScopes")
	scopes := rawScopes.([]models.PartnerScope)

	// Perform TK check
	response, err := h.CheckingService.CheckTK(
		c.Context(),
		req,
		partnerID,
		scopes,
		nil, // userID not used (only admin login)
	)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error())
	}

	// Check if TK was found
	if found, ok := response["found"].(bool); ok && !found {
		return utils.JSONSuccessWithMessage(c, "TK data not found or date of birth mismatch", response)
	}

	return utils.JSONSuccessWithMessage(c, "TK data found and verified", response)
}
