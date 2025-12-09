package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID    string   `json:"user_id"`
	PartnerID string   `json:"partner_id,omitempty"`
	CompanyID string   `json:"company_id,omitempty"`
	Scopes    []string `json:"scopes,omitempty"`
	Role      string   `json:"role"`
	Type      string   `json:"type"` // "user" or "admin"
	jwt.RegisteredClaims
}

// GenerateJWT generates a JWT token
func GenerateJWT(userID, partnerID, role, tokenType, secret string) (string, error) {
	claims := &JWTClaims{
		UserID:    userID,
		PartnerID: partnerID,
		CompanyID: "",
		Role:      role,
		Type:      tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT validates a JWT token and returns claims
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}
