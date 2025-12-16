package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// Try typical docker-compose credentials
	dsn := "root:password@tcp(localhost:3306)/pharmacy_db?charset=utf8mb4&parseTime=True&loc=Local"

	// Fallback or override if needed
	if os.Getenv("DB_DSN") != "" {
		dsn = os.Getenv("DB_DSN")
	}

	fmt.Printf("Connecting to %s...\n", dsn)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		// Try root:root
		dsn = "root:root@tcp(localhost:3306)/pharmacy_db?charset=utf8mb4&parseTime=True&loc=Local"
		fmt.Printf("Retrying with %s...\n", dsn)
		db, _ = sql.Open("mysql", dsn)
		if err := db.Ping(); err != nil {
			log.Fatalf("Error pinging db: %v", err)
		}
	}

	fmt.Println("Connected! Reading seed.sql...")
	content, err := os.ReadFile("../../database/seed.sql")
	if err != nil {
		log.Fatalf("Error reading seed.sql: %v", err)
	}

	queries := strings.Split(string(content), ";")
	for _, query := range queries {
		query = strings.TrimSpace(query)
		if query == "" {
			continue
		}
		if _, err := db.Exec(query); err != nil {
			log.Printf("Error executing query: %s\nError: %v", query, err)
		}
	}
	fmt.Println("Seed data applied successfully!")
}
