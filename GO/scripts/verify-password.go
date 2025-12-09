package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run verify-password.go <password> <hash>")
		fmt.Println("Example: go run verify-password.go admin123 '$2a$10$...'")
		os.Exit(1)
	}

	password := os.Args[1]
	hash := os.Args[2]

	// Compare password with hash
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Printf("❌ Password does NOT match!\n")
		fmt.Printf("   Password: %s\n", password)
		fmt.Printf("   Hash: %s\n", hash)
		os.Exit(1)
	}

	fmt.Printf("✅ Password matches!\n")
	fmt.Printf("   Password: %s\n", password)
	fmt.Printf("   Hash: %s\n", hash)
}

