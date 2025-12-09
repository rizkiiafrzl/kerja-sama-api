package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/service"
)

// JWTAuth middleware validates JWT token
func JWTAuth(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "missing authorization header",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "invalid authorization header format",
			})
		}

		token := parts[1]

		// Validate token
		claims, err := authService.ValidateJWT(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "invalid or expired token",
			})
		}

		// Store claims in context
		c.Locals("userID", claims.UserID)
		c.Locals("partnerID", claims.PartnerID)
		c.Locals("role", claims.Role)
		c.Locals("tokenType", claims.Type)

		return c.Next()
	}
}

// AdminAuth middleware validates JWT token for admin users
func AdminAuth(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "missing authorization header",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "invalid authorization header format",
			})
		}

		token := parts[1]

		// Validate token
		claims, err := authService.ValidateJWT(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "invalid or expired token",
			})
		}

		// Check if token is for admin
		if claims.Type != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "admin access required",
			})
		}

		// Store claims in context
		c.Locals("adminID", claims.UserID)
		c.Locals("adminRole", claims.Role)

		return c.Next()
	}
}
