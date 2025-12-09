package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run generate-password-hash.go <password>")
		fmt.Println("Example: go run generate-password-hash.go admin123")
		os.Exit(1)
	}

	password := os.Args[1]

	// Generate bcrypt hash
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Error generating hash: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Bcrypt Hash: %s\n", string(hash))
	fmt.Println()
	fmt.Println("SQL to create admin:")
	fmt.Printf("INSERT INTO admins (username, password_hash, role) VALUES ('superadmin', '%s', 'superadmin');\n", string(hash))
}

