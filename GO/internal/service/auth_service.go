package service

import (
	"context"
	"fmt"

	"github.com/username/go-gin-backend/internal/models"
	"github.com/username/go-gin-backend/internal/repository"
	"github.com/username/go-gin-backend/pkg/utils"
)

// AuthService handles authentication business logic
type AuthService struct {
	AdminRepo *repository.AdminRepository
	JWTSecret string
}

// NewAuthService creates a new auth service
func NewAuthService(adminRepo *repository.AdminRepository, jwtSecret string) *AuthService {
	return &AuthService{
		AdminRepo: adminRepo,
		JWTSecret: jwtSecret,
	}
}

// LoginAdmin authenticates an admin and returns JWT token
func (s *AuthService) LoginAdmin(ctx context.Context, req models.AdminLoginRequest) (*models.AdminLoginResponse, error) {
	admin, err := s.AdminRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if admin.Status != "active" {
		return nil, fmt.Errorf("admin account is inactive")
	}

	if err := utils.ComparePassword(admin.PasswordHash, req.Password); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(admin.ID, "", admin.Role, "admin", s.JWTSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token")
	}

	return &models.AdminLoginResponse{
		Token: token,
		Admin: admin,
	}, nil
}

// ValidateJWT validates a JWT token and returns claims
func (s *AuthService) ValidateJWT(tokenString string) (*utils.JWTClaims, error) {
	return utils.ValidateJWT(tokenString, s.JWTSecret)
}
