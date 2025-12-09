package routes

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/config"
	"github.com/username/go-gin-backend/internal/handlers"
	"github.com/username/go-gin-backend/internal/middleware"
	"github.com/username/go-gin-backend/internal/repository"
	"github.com/username/go-gin-backend/internal/service"
)

// SetupRoutes configures all application routes
func SetupRoutes(db *sql.DB, cfg *config.Config) *fiber.App {
	app := fiber.New()

	// Add custom middleware
	app.Use(middleware.Logger())
	app.Use(middleware.CORS())

	// Initialize repositories
	partnerRepo := repository.NewPartnerRepository(db)
	scopeRepo := repository.NewScopeRepository(db)
	adminRepo := repository.NewAdminRepository(db)
	tkRepo := repository.NewTKRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	// Initialize services
	authService := service.NewAuthService(adminRepo, cfg.JWTSecret)
	checkingService := service.NewCheckingService(tkRepo, auditRepo)
	partnerService := service.NewPartnerService(partnerRepo, scopeRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	checkingHandler := handlers.NewCheckingHandler(checkingService)
	adminPartnerHandler := handlers.NewAdminPartnerHandler(partnerService)

	// Root endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Welcome to PKS-DB API - Fiber Backend",
			"version": "2.0.0",
			"endpoints": fiber.Map{
				"health":      "/api/health",
				"admin_login": "/api/v1/auth/admin/login",
				"check_tk":   "/api/checking (Requires X-API-KEY header)",
				"admin_panel": "/admin/* (Requires JWT)",
			},
		})
	})

	// API routes
	api := app.Group("/api")
	{
		// Health check
		api.Get("/health", handlers.HealthCheck)

		// API v1 routes
		v1 := api.Group("/v1")
		{
			// Auth routes (public)
			auth := v1.Group("/auth")
			{
				auth.Post("/admin/login", authHandler.LoginAdmin)
			}
		}

		// Partner checking endpoint (API Key authentication)
		api.Post("/checking",
			middleware.PartnerAPIKeyAuth(partnerRepo, scopeRepo),
			checkingHandler.CheckTK,
		)
	}

	// Admin routes (requires JWT admin authentication)
	admin := app.Group("/admin")
	admin.Use(middleware.AdminAuth(authService))
	{
		// Partner management
		partners := admin.Group("/partners")
		{
			partners.Post("", adminPartnerHandler.Create)       // Create partner
			partners.Get("", adminPartnerHandler.List)           // List all partners
			
			// IMPORTANT: More specific routes must be defined BEFORE generic :id routes
			// Scope management
			partners.Get("/:id/scopes", adminPartnerHandler.GetScopes)    // Get partner scopes
			partners.Put("/:id/scopes", adminPartnerHandler.UpdateScopes) // Update partner scopes

			// API key management (must be before :id route)
			partners.Get("/:id/reveal-api-key", adminPartnerHandler.RevealAPIKey)  // Reveal current API key (no reset)
			partners.Post("/:id/reset-api-key", adminPartnerHandler.ResetAPIKey)    // Reset API key and return plaintext once

			// Generic partner routes (must be last)
			partners.Get("/:id", adminPartnerHandler.Get)        // Get partner details
			partners.Put("/:id", adminPartnerHandler.Update)     // Update partner
			partners.Delete("/:id", adminPartnerHandler.Delete)  // Delete partner
		}
	}

	return app
}
