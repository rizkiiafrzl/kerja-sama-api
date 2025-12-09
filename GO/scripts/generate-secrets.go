package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
)

func main() {
	fmt.Println("🔐 Generating secure secrets for .env file...")
	fmt.Println()

	// Generate JWT_SECRET (64 bytes = 512 bits, base64 encoded)
	jwtSecret := generateRandomString(64)
	fmt.Printf("JWT_SECRET=%s\n", jwtSecret)
	fmt.Println()

	// Generate PLATFORM_API_KEY (32 bytes = 256 bits, hex encoded)
	platformAPIKey := generateRandomHex(32)
	fmt.Printf("PLATFORM_API_KEY=%s\n", platformAPIKey)
	fmt.Println()

	fmt.Println("✅ Copy the values above to your .env file")
	fmt.Println("⚠️  Keep these secrets secure and never commit them to git!")
}

// generateRandomString generates a random base64 string
func generateRandomString(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return base64.URLEncoding.EncodeToString(bytes)
}

// generateRandomHex generates a random hex string
func generateRandomHex(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return hex.EncodeToString(bytes)
}
