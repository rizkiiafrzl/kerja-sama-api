package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Logger middleware for logging HTTP requests
func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		path := c.Path()
		method := c.Method()

		// Process request
		err := c.Next()

		// Log after processing
		latency := time.Since(start)
		statusCode := c.Response().StatusCode()
		clientIP := c.IP()

		fmt.Printf("[FIBER] %s | %3d | %13v | %15s | %-7s %s\n",
			start.Format("2006/01/02 - 15:04:05"),
			statusCode,
			latency,
			clientIP,
			method,
			path,
		)

		return err
	}
}
