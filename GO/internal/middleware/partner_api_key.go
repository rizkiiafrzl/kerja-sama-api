package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/username/go-gin-backend/internal/repository"
)

// PartnerAPIKeyAuth validates API key from header, checks status and contract period
func PartnerAPIKeyAuth(partnerRepo *repository.PartnerRepository, scopeRepo *repository.ScopeRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Get API key from header
		apiKey := c.Get("X-API-KEY")
		if apiKey == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "missing X-API-KEY header",
			})
		}

		// 2. Query database to find partner by API key
		partner, err := partnerRepo.GetByAPIKey(c.Context(), apiKey)
		if err != nil || partner == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "invalid API key",
			})
		}

		// 3. Check status == "Y" (active)
		if partner.Status != "Y" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "partner is inactive",
			})
		}

		// 4. Check today is within [contract_start, contract_end]
		today := time.Now()
		if partner.ContractStart != nil && today.Before(*partner.ContractStart) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "contract has not started yet",
			})
		}
		if partner.ContractEnd != nil && today.After(*partner.ContractEnd) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "contract has expired",
			})
		}

		// 5. Load scopes from database (source of truth)
		scopes, err := scopeRepo.GetByPartnerID(c.Context(), partner.ID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "failed to load scopes",
			})
		}

		// 6. Store partner info in context for downstream handlers
		c.Locals("partnerID", partner.ID)
		c.Locals("partnerScopes", scopes)
		c.Locals("partner", partner)

		return c.Next()
	}
}

