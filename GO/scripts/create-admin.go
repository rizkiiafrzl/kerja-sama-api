package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Get database URL from environment or use default
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/pks-db?sslmode=disable"
		fmt.Println("Using default DATABASE_URL. Set DATABASE_URL environment variable to use custom connection.")
	}

	// Get arguments
	if len(os.Args) < 4 {
		fmt.Println("Usage: go run create-admin.go <username> <password> <role>")
		fmt.Println("Example: go run create-admin.go superadmin admin123 superadmin")
		fmt.Println("Roles: superadmin, operator")
		os.Exit(1)
	}

	username := os.Args[1]
	password := os.Args[2]
	role := os.Args[3]

	// Validate role
	if role != "superadmin" && role != "operator" {
		fmt.Printf("Error: role must be 'superadmin' or 'operator', got '%s'\n", role)
		os.Exit(1)
	}

	// Generate password hash
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Error generating hash: %v\n", err)
		os.Exit(1)
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		fmt.Printf("Error pinging database: %v\n", err)
		fmt.Println("Make sure PostgreSQL is running and DATABASE_URL is correct.")
		os.Exit(1)
	}

	// Insert admin
	query := `INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id`
	var id string
	err = db.QueryRow(query, username, string(hash), role).Scan(&id)
	if err != nil {
		fmt.Printf("Error creating admin: %v\n", err)
		fmt.Println("Admin might already exist. Try different username.")
		os.Exit(1)
	}

	fmt.Printf("✅ Admin created successfully!\n")
	fmt.Printf("   ID: %s\n", id)
	fmt.Printf("   Username: %s\n", username)
	fmt.Printf("   Role: %s\n", role)
	fmt.Printf("   Password: %s\n", password)
}

