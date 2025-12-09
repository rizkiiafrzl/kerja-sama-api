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
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run reset-admin-password.go <username> <new_password>")
		fmt.Println("Example: go run reset-admin-password.go admin admin123")
		os.Exit(1)
	}

	username := os.Args[1]
	newPassword := os.Args[2]

	// Generate password hash
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
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

	// Update admin password
	query := `UPDATE admins SET password_hash = $1 WHERE username = $2 RETURNING id, username, role`
	var id, dbUsername, role string
	err = db.QueryRow(query, string(hash), username).Scan(&id, &dbUsername, &role)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("❌ Admin with username '%s' not found!\n", username)
			fmt.Println("Available admins:")
			rows, _ := db.Query("SELECT username, role FROM admins")
			for rows.Next() {
				var u, r string
				rows.Scan(&u, &r)
				fmt.Printf("  - %s (%s)\n", u, r)
			}
			os.Exit(1)
		}
		fmt.Printf("Error updating password: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Password reset successfully!\n")
	fmt.Printf("   ID: %s\n", id)
	fmt.Printf("   Username: %s\n", dbUsername)
	fmt.Printf("   Role: %s\n", role)
	fmt.Printf("   New Password: %s\n", newPassword)
	fmt.Println()
	fmt.Println("You can now login with:")
	fmt.Printf("   Username: %s\n", dbUsername)
	fmt.Printf("   Password: %s\n", newPassword)
}

