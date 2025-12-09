package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Port           string
	Environment    string
	DatabaseURL    string
	JWTSecret      string
	PlatformAPIKey string // API key for server-to-server authentication
	PartnerTokenTTL int64  // TTL in seconds for partner JWT
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load .env file if exists (ignore error if not found)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default values")
	}

	config := &Config{
		Port:           getEnv("PORT", "3000"),
		Environment:    getEnv("ENV", "development"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", "default-secret-change-in-production"),
		PlatformAPIKey: getEnv("PLATFORM_API_KEY", ""),
		PartnerTokenTTL: getEnvInt("PARTNER_TOKEN_TTL", 24*3600), // default 72 hours
	}

	if config.PlatformAPIKey == "" && config.Environment == "production" {
		log.Println("WARNING: PLATFORM_API_KEY is empty in production mode")
	}

	return config
}

// getEnv gets environment variable with fallback to default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvInt gets environment variable as int64 with fallback
func getEnvInt(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	var result int64
	_, err := fmt.Sscanf(value, "%d", &result)
	if err != nil {
		return defaultValue
	}
	return result
}
