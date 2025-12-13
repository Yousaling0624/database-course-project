package database

import (
	"log"
	"os"

	"github.com/yousaling0624/database-course-project/backend/internal/model"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	// Defaults
	dsn := "user:password@tcp(127.0.0.1:3306)/pharmacy_db?charset=utf8mb4&parseTime=True&loc=Local"

	// Override with env if needed (or just hardcode for this simple project as requested)
	// For Docker, we might need to change host to "mysql" but for local run "127.0.0.1" is fine if port mapped.
	// We'll try to read from env or fallback.
	if tempDSN := os.Getenv("DSN"); tempDSN != "" {
		dsn = tempDSN
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto Migrate
	err = DB.AutoMigrate(
		&model.User{},
		&model.Medicine{},
		&model.Customer{},
		&model.Supplier{},
		&model.Inbound{},
		&model.Sales{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	seedAdmin()
}

func seedAdmin() {
	var count int64
	DB.Model(&model.User{}).Count(&count)
	if count == 0 {
		// Create admin: password is 'password'
		// Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
		admin := model.User{
			Username: "admin",
			Password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
			Role:     "admin",
		}
		DB.Create(&admin)
		log.Println("Seeded admin user")
	}
}
