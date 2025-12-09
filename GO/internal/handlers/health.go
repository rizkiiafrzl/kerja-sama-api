package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// HealthCheck handles health check requests
func HealthCheck(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "API is healthy",
		"data": fiber.Map{
			"status": "ok",
		},
	})
}
