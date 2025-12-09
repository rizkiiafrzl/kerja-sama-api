package utils

import (
	"github.com/gofiber/fiber/v2"
)

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// JSONSuccess sends a success response
func JSONSuccess(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(SuccessResponse{
		Success: true,
		Data:    data,
	})
}

// JSONSuccessWithMessage sends a success response with a message
func JSONSuccessWithMessage(c *fiber.Ctx, message string, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// JSONError sends an error response
func JSONError(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(ErrorResponse{
		Success: false,
		Message: message,
	})
}

// JSONErrorWithDetail sends an error response with detail
func JSONErrorWithDetail(c *fiber.Ctx, status int, message, detail string) error {
	return c.Status(status).JSON(ErrorResponse{
		Success: false,
		Message: message,
		Error:   detail,
	})
}
