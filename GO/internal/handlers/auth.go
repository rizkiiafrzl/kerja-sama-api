package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/service"
	"github.com/username/go-gin-backend/pkg/utils"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	AuthService *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		AuthService: authService,
	}
}

// LoginAdmin handles admin login
func (h *AuthHandler) LoginAdmin(c *fiber.Ctx) error {
	var req models.AdminLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "invalid request body")
	}

	response, err := h.AuthService.LoginAdmin(c.Context(), req)
	if err != nil {
		return utils.JSONError(c, fiber.StatusUnauthorized, err.Error())
	}

	return utils.JSONSuccessWithMessage(c, "Admin login successful", response)
}
