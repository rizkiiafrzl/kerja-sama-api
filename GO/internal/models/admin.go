package models

import "time"

// Admin represents a system admin
type Admin struct {
	ID           string    `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"` // Don't expose in JSON
	Role         string    `db:"role" json:"role"`       // superadmin, operator
	Status       string    `db:"status" json:"status"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// CreateAdminRequest represents request to create an admin
type CreateAdminRequest struct {
	Username string `json:"username" validate:"required,min=3,max=100"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=superadmin operator"`
}

// UpdateAdminRequest represents request to update an admin
type UpdateAdminRequest struct {
	Username string `json:"username,omitempty" validate:"omitempty,min=3,max=100"`
	Password string `json:"password,omitempty" validate:"omitempty,min=8"`
	Role     string `json:"role,omitempty" validate:"omitempty,oneof=superadmin operator"`
	Status   string `json:"status,omitempty" validate:"omitempty,oneof=active inactive"`
}

// AdminLoginRequest represents admin login credentials
type AdminLoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// AdminLoginResponse represents admin login response with JWT token
type AdminLoginResponse struct {
	Token string `json:"token"`
	Admin *Admin `json:"admin"`
}
