package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/username/go-gin-backend/internal/config"
	"github.com/username/go-gin-backend/internal/db"
	"github.com/username/go-gin-backend/internal/routes"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	database, err := db.ConnectDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	fmt.Println("✅ Database connected successfully")

	// Setup routes with Fiber
	app := routes.SetupRoutes(database, cfg)

	// Graceful shutdown
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		fmt.Println("\n🛑 Shutting down server...")

		// Close database connection
		if err := database.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}

		// Shutdown Fiber app gracefully
		if err := app.Shutdown(); err != nil {
			log.Printf("Error shutting down server: %v", err)
		}

		os.Exit(0)
	}()

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	fmt.Printf("🚀 Server starting on http://localhost%s\n", addr)
	fmt.Printf("📝 Environment: %s\n", cfg.Environment)
	fmt.Printf("🗄️  Database: Connected\n")
	fmt.Printf("🔑 Platform API Key: %s\n", maskAPIKey(cfg.PlatformAPIKey))
	fmt.Println("✨ Press Ctrl+C to stop")
	fmt.Println()
	fmt.Println("📍 Available Endpoints:")
	fmt.Println("   - POST /api/checking (X-API-KEY header required)")
	fmt.Println("   - POST /api/v1/auth/admin/login")
	fmt.Println("   - GET  /api/health")
	fmt.Println("   - POST /admin/partners (JWT)")
	fmt.Println("   - GET  /admin/partners (JWT)")
	fmt.Println("   - GET  /admin/partners/:id (JWT)")
	fmt.Println("   - PUT  /admin/partners/:id (JWT)")
	fmt.Println("   - DELETE /admin/partners/:id (JWT)")
	fmt.Println("   - GET  /admin/partners/:id/scopes (JWT)")
	fmt.Println("   - PUT  /admin/partners/:id/scopes (JWT)")
	fmt.Println("   - POST /admin/partners/:id/reset-api-key (JWT)")
	fmt.Println()

	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// maskAPIKey masks the API key for security in logs
func maskAPIKey(key string) string {
	if key == "" {
		return "[NOT SET]"
	}
	if len(key) <= 8 {
		return "****"
	}
	return key[:4] + "****" + key[len(key)-4:]
}
