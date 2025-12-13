package database

import (
	"log"
	"os"

	"github.com/yousaling0624/database-course-project/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	// Defaults
	dsn := "root:root@tcp(127.0.0.1:3306)/pharma_db?charset=utf8mb4&parseTime=True&loc=Local"

	// Override with env if needed
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
	// Dynamic hash generation to ensure correctness
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)

	var user model.User
	result := DB.Where("username = ?", "admin").First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Create admin
		admin := model.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     "admin",
		}
		DB.Create(&admin)
		log.Println("Seeded admin user")
	} else {
		// Update existing admin password
		user.Password = string(hashedPassword)
		DB.Save(&user)
		log.Println("Updated admin password")
	}

	// Reset all other users' passwords to "password" for demo purposes
	var users []model.User
	DB.Where("username != ?", "admin").Find(&users)
	for _, u := range users {
		u.Password = string(hashedPassword)
		DB.Save(&u)
	}
	if len(users) > 0 {
		log.Printf("Reset passwords for %d users", len(users))
	}
}
